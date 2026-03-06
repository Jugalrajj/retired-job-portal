import Coupon from "../models/Coupon.model.js";

// --- VALIDATE COUPON ---
export const validateCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body;
    const planAmount = Number(amount);
    
    // Get the logged-in user's ID (Verified by 'protect' middleware)
    const userId = req.user._id; 

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(), 
      isActive: true 
    });

    // 1. Basic Validation
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid Coupon Code" });
    }
    
    const now = new Date();
    if (now > new Date(coupon.validUntil) || now < new Date(coupon.validFrom)) {
      return res.status(400).json({ success: false, message: "Coupon Expired" });
    }
    
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: "Coupon Usage Limit Reached" });
    }

    // --- NEW: Check if this specific user has already used the coupon ---
    if (coupon.usedBy && coupon.usedBy.includes(userId)) {
      return res.status(400).json({ success: false, message: "You have already used this coupon" });
    }
    // ------------------------------------------------------------------
    
    if (planAmount < coupon.minOrderValue) {
      return res.status(400).json({ success: false, message: `Minimum order of ₹${coupon.minOrderValue} required` });
    }

    // 2. Calculate Discount
    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (planAmount * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.value; // Flat Amount
    }

    // Ensure discount doesn't exceed total
    discount = Math.min(discount, planAmount);
    const finalAmount = planAmount - discount;

    res.status(200).json({
      success: true,
      message: "Coupon Applied",
      discount: Math.round(discount),
      finalAmount: Math.round(finalAmount),
      code: coupon.code
    });

  } catch (error) {
    console.error("Coupon Validation Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- CREATE COUPON (Admin Utility) ---
export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- GET ALL COUPONS (Admin) ---
export const getAllCoupons = async (req, res) => {
  try {
    // Fetch all coupons, sorted by newest first
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.status(200).json(coupons); // Return array directly for frontend
  } catch (error) {
    console.error("Fetch Coupons Error:", error);
    res.status(500).json({ message: "Failed to fetch coupons" });
  }
};

// --- DELETE COUPON (Admin) ---
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.status(200).json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Delete Coupon Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};