import crypto from "crypto";
import User from "../models/User.model.js";
import Payment from "../models/Payment.model.js"; 
import Company from "../models/Company.model.js"; 
import Coupon from "../models/Coupon.model.js"; 
import Razorpay from "razorpay";
import dotenv from "dotenv";
import sendEmail from "../utils/sendEmail.js"; 
import { generateInvoice } from "../utils/generateInvoice.js"; 

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- 1. Create Order (With Coupon Support) ---
export const createOrder = async (req, res) => {
  try {
    const { amount, planType, couponCode } = req.body; 
    let finalAmount = Number(amount);
    let discountApplied = 0;

    // --- COUPON SERVER-SIDE VALIDATION ---
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      
      if (coupon && new Date() <= new Date(coupon.validUntil) && coupon.usedCount < coupon.usageLimit) {
        if (finalAmount >= coupon.minOrderValue) {
           if (coupon.discountType === "PERCENTAGE") {
             let discount = (finalAmount * coupon.value) / 100;
             if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
             discountApplied = discount;
           } else {
             discountApplied = coupon.value;
           }
           finalAmount = finalAmount - discountApplied;
           if(finalAmount < 0) finalAmount = 0;
        }
      }
    }

    const options = {
      amount: Math.round(finalAmount * 100), // Razorpay accepts paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { 
        planType, 
        couponCode: couponCode || "NONE",
        originalAmount: amount 
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({ 
      success: true, 
      order,
      finalAmount: Math.round(finalAmount), 
      discount: discountApplied
    });

  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

// --- 2. Verify Payment (With Invoice & Email) ---
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      planName,
      amount,
      type, 
      validity,
      couponCode 
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (type === 'credit') {
        const isPro = currentUser.plan === "pro";
        const isSubscriptionValid = currentUser.subscriptionExpiry && new Date(currentUser.subscriptionExpiry) > new Date();

        if (!isPro || !isSubscriptionValid) {
          return res.status(403).json({ 
            success: false, 
            message: "Active Pro Membership required for Credit Packs." 
          });
        }
      }

     // --- FETCH COUPON DETAILS ---
      let couponDetails = null;
      if (couponCode) {
        couponDetails = await Coupon.findOneAndUpdate(
          { code: couponCode.toUpperCase() },
          { 
            $inc: { usedCount: 1 },
            $push: { usedBy: userId } // <-- This permanently links the user to the used coupon
          },
          { new: true }
        );
      }

      let updateQuery = {};
      let startDate = new Date();
      let endDate = new Date();

      if (type === 'credit') {
          let creditsToAdd = 10; 
          if (planName.includes("Starter")) creditsToAdd = 10;
          else if (planName.includes("Growth")) creditsToAdd = 25;
          else if (planName.includes("Enterprise")) creditsToAdd = 60;
          
          endDate.setDate(endDate.getDate() + 90); // 🔥 Credits valid for 90 days

          updateQuery = { 
            $inc: { credits: creditsToAdd },
            $set: { creditsExpireAt: endDate } // 🔥 Update credit expiry
          };

      } else {
          let newExpiry = new Date();
          if (currentUser.subscriptionExpiry && new Date(currentUser.subscriptionExpiry) > new Date()) {
            startDate = new Date(currentUser.subscriptionExpiry);
            newExpiry = new Date(currentUser.subscriptionExpiry);
          }
          
          // 🔥 Subscription runs for 30 days (1 month)
          newExpiry.setDate(newExpiry.getDate() + 30);
          endDate = newExpiry;
          
          // 🔥 But credits from the Pro plan are valid for 90 days
          let creditsExpiry = new Date();
          creditsExpiry.setDate(creditsExpiry.getDate() + 90);

          updateQuery = {
            $set: { 
              plan: "pro", 
              subscriptionExpiry: newExpiry,
              creditsExpireAt: creditsExpiry // 🔥 Apply 90-day credit validity
            },
            $inc: { credits: 30 }
          };
      }

      const updatedUser = await User.findByIdAndUpdate(userId, updateQuery, { new: true });

      let companyName = "Individual / Not Set";
      if (updatedUser.companyId) {
        const company = await Company.findById(updatedUser.companyId);
        if (company) companyName = company.name;
      }

      await Payment.create({
        userId,
        razorpay_order_id,
        razorpay_payment_id,
        amount,
        planName,
        status: "success",
        date: new Date(),
        couponCode: couponCode || null,
      });

      // --- 🔥 CALCULATE BILLING VALUES ---
      // 'amount' is the Final Paid Amount (Inclusive of Tax)
      const totalPaid = Number(amount);
      
      let discountAmount = 0;
      let originalListPrice = totalPaid; // Default (if no coupon)

      if (couponDetails) {
        if (couponDetails.discountType === "FLAT") {
            discountAmount = couponDetails.value;
            originalListPrice = totalPaid + discountAmount;
        } else if (couponDetails.discountType === "PERCENTAGE") {
            const rate = couponDetails.value / 100;
            // Formula: Paid = Original * (1 - rate)  => Original = Paid / (1 - rate)
            if (rate < 1) {
                 originalListPrice = totalPaid / (1 - rate);
                 discountAmount = originalListPrice - totalPaid;
            }
        }
      }

      // --- GENERATE & EMAIL RECEIPT ---
      try {
        const paymentData = {
          paymentId: razorpay_payment_id,
          date: new Date(),
          planName: planName || (type === 'credit' ? 'Credit Pack' : 'Pro Subscription'),
          amount: totalPaid,         
          subtotal: originalListPrice, // Original Pack Price (e.g., 499)
          discount: discountAmount,    // Discount (e.g., 30)
          companyName: companyName,
          startDate: startDate,
          endDate: endDate,
          method: "Razorpay",
          couponCode: couponCode
        };

        const pdfBuffer = await generateInvoice(paymentData, updatedUser);

        // --- RESTORED HTML EMAIL TEMPLATE ---
        await sendEmail({
          email: updatedUser.email,
          subject: `Payment Receipt: ${paymentData.planName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #4f46e5;">Payment Successful!</h2>
              <p>Hi ${updatedUser.name},</p>
              <p>Thank you for choosing IVGJobs. Your payment of <strong>₹${totalPaid}</strong> for the <strong>${paymentData.planName}</strong> has been successfully processed.</p>
              
              <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${paymentData.paymentId}</p>
                <p style="margin: 5px 0;"><strong>Company:</strong> ${companyName}</p>
                ${couponCode ? `<p style="margin: 5px 0;"><strong>Coupon Used:</strong> ${couponCode}</p>` : ''}
                <p style="margin: 5px 0;"><strong>Plan Valid Until:</strong> ${endDate.toLocaleDateString()}</p>
              </div>

              <p>Please find your detailed tax invoice attached to this email.</p>
              <br/>
              <p>Best regards,<br/><strong>The IVGJobs Team</strong></p>
            </div>
          `,
          attachments: [
            {
              filename: `IVG_Invoice_${razorpay_payment_id}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
        console.log(`Receipt sent to ${updatedUser.email}`);
      } catch (receiptError) {
        console.error("Failed to generate/send receipt:", receiptError);
      }

      return res.status(200).json({ 
        success: true, 
        message: "Payment verified successfully",
        updatedUser: {
            credits: updatedUser.credits,
            plan: updatedUser.plan,
            subscriptionExpiry: updatedUser.subscriptionExpiry
        }
      });

    } else {
      return res.status(400).json({ success: false, message: "Invalid Signature" });
    }
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// --- 3. GET PAYMENT HISTORY (Existing) ---
export const getPaymentHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userId = req.user._id;

    const payments = await Payment.find({ userId })
      .sort({ date: -1 }) 
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments({ userId });

    res.status(200).json({
      success: true,
      payments,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
    });
  } catch (error) {
    console.error("Get History Error:", error);
    res.status(500).json({ message: "Failed to fetch payment history" });
  }
};

// --- 4. DOWNLOAD INVOICE ---
export const downloadInvoice = async (req, res) => {
  try {
    const { paymentId } = req.params; 
    const userId = req.user._id;

    const payment = await Payment.findOne({ razorpay_payment_id: paymentId, userId });
    
    if (!payment) {
      return res.status(404).json({ message: "Invoice not found or unauthorized" });
    }

    const user = await User.findById(userId);
    
    let companyName = "N/A";
    if (user.companyId) {
      const company = await Company.findById(user.companyId);
      if (company) companyName = company.name;
    }

    // Recalculate Logic for Download
    const totalPaid = Number(payment.amount);
    let discountAmount = 0;
    let originalListPrice = totalPaid;

    if (payment.couponCode) {
        const coupon = await Coupon.findOne({ code: payment.couponCode.toUpperCase() });
        if (coupon) {
            if (coupon.discountType === "FLAT") {
                discountAmount = coupon.value;
                originalListPrice = totalPaid + discountAmount;
            } else if (coupon.discountType === "PERCENTAGE") {
                const rate = coupon.value / 100;
                if (rate < 1) {
                    originalListPrice = totalPaid / (1 - rate);
                    discountAmount = originalListPrice - totalPaid;
                }
            }
        }
    }

    const paymentData = {
      paymentId: payment.razorpay_payment_id,
      date: payment.date,
      planName: payment.planName,
      amount: totalPaid,
      subtotal: originalListPrice, 
      discount: discountAmount,    
      companyName: companyName,
      method: "Razorpay",
      couponCode: payment.couponCode, 
      startDate: new Date(payment.date),
      endDate: new Date(new Date(payment.date).getTime() + 30 * 24 * 60 * 60 * 1000)
    };

    const pdfBuffer = await generateInvoice(paymentData, user);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=IVG_Invoice_${paymentId}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error("Download Invoice Error:", error);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
};