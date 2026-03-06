import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// --- 1. SETUP PATHS FOR LOCAL FILES ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, "../assets/IVGReceiptLogo.png");

export const generateInvoice = async (paymentDetails, user) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      let pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    doc.on("error", (err) => {
      reject(err);
    });

    // --- 2. COLORS & VARIABLES ---
    const primaryColor = "#4f46e5";
    const secondaryColor = "#444444";
    const lineColor = "#e5e7eb";

    const dateStr = new Date(paymentDetails.date)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");
    const uniqueSuffix = paymentDetails.paymentId.slice(-4).toUpperCase();
    const invoiceNo = `IVG-${dateStr}-${uniqueSuffix}`;

    // --- 3. MATH LOGIC ---
    // User pays 'amount' (e.g., 469). This is the Total Paid.
    const totalPaid = Number(paymentDetails.amount);
    
    // Original Pack Price (e.g., 499) passed from controller
    const originalSubtotal = Number(paymentDetails.subtotal || totalPaid); 
    
    // Discount (e.g., 30)
    const discount = Number(paymentDetails.discount || 0);
    
    // Net Paid = Total Paid (469). This implies Net = Taxable + GST.
    // Taxable = Net / 1.18
    const taxableValue = totalPaid / 1.18;
    const gstAmount = totalPaid - taxableValue;

    const fmt = (num) => num.toFixed(2);

    // --- 4. HEADER & LOGO ---
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 50 });
    } else {
      doc
        .fillColor(primaryColor)
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("IVGJobs", 50, 50);
    }

    doc
      .fillColor(primaryColor)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("IT Voice Media Private Limited", 50, 100)
      .font("Helvetica")
      .fillColor(secondaryColor)
      .text("Jaipur, Rajasthan, India", 50, 115)
      .text("Support: support@ivgjobs.com", 50, 130)
      .text("GSTIN: 08AACCI4079A1ZT", 50, 145);

    // --- 5. INVOICE DETAILS (TOP RIGHT) ---
    // Adjusted X to 550 to prevent overlap
    doc
      .fontSize(20)
      .fillColor(secondaryColor)
      .font("Helvetica-Bold")
      .text("INVOICE", 50, 50, { align: "right" })
      .fontSize(10)
      .text(`Invoice No: ${invoiceNo}`, 50, 80, { align: "right" })
      .text(
        `Date: ${new Date(paymentDetails.date).toLocaleDateString("en-IN")}`,
        50,
        95,
        { align: "right" }
      )
      .text(`Status: Paid`, 50, 110, { align: "right" });

    doc.moveDown(2);
    doc
      .moveTo(50, 170)
      .lineTo(550, 170)
      .strokeColor(lineColor)
      .lineWidth(1)
      .stroke();

    // --- 6. BILL TO & VALIDITY ---
    const billToTop = 190;

    doc
      .fontSize(10)
      .fillColor(secondaryColor)
      .font("Helvetica-Bold")
      .text("Bill To:", 50, billToTop)
      .font("Helvetica")
      .text(`Employer: ${user.name}`, 50, billToTop + 15)
      .text(`Company: ${paymentDetails.companyName || "N/A"}`, 50, billToTop + 30)
      .text(`Email: ${user.email}`, 50, billToTop + 45)
      .text(`Method: ${paymentDetails.method || "Razorpay"}`, 50, billToTop + 60)
      .text(`Txn ID: ${paymentDetails.paymentId}`, 50, billToTop + 75);

    doc.rect(350, billToTop - 5, 200, 85).fillAndStroke("#f9fafb", lineColor);

    doc
      .fillColor(secondaryColor)
      .font("Helvetica-Bold")
      .text("Plan Validity", 365, billToTop + 10)
      .font("Helvetica")
      .text(
        `Start: ${new Date(paymentDetails.startDate).toLocaleDateString("en-IN")}`,
        365,
        billToTop + 30
      )
      .text(
        `End:   ${new Date(paymentDetails.endDate).toLocaleDateString("en-IN")}`,
        365,
        billToTop + 45
      )
      .fillColor(primaryColor)
      .fontSize(9)
      .text("(Inclusive of all taxes)", 365, billToTop + 65);

    // --- 7. TABLE ---
    const tableTop = 320;

    doc.rect(50, tableTop, 500, 25).fill(primaryColor);
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Description", 60, tableTop + 7)
      .text("Plan Type", 300, tableTop + 7)
      .text("Amount (INR)", 450, tableTop + 7, { align: "right" });

    const rowTop = tableTop + 35;
    
    let descText = `${paymentDetails.planName} Plan`;
    if(paymentDetails.couponCode) descText += ` (Coupon: ${paymentDetails.couponCode})`;

    doc
      .fillColor(secondaryColor)
      .font("Helvetica")
      .text(descText, 60, rowTop)
      .text("Subscription", 300, rowTop)
      .text(fmt(originalSubtotal), 450, rowTop, { align: "right" }); // 🔥 Shows Original Pack Price

    doc
      .moveTo(50, rowTop + 20)
      .lineTo(550, rowTop + 20)
      .strokeColor(lineColor)
      .stroke();

    // --- 8. SUMMARY SECTION ---
    const summaryTop = rowTop + 40;
    const labelX = 350;
    const valueX = 450;
    let currentY = summaryTop;

    doc.font("Helvetica-Bold");

    // 1. Subtotal (Original Pack Amount)
    doc
      .fillColor(secondaryColor)
      .text("Subtotal:", labelX, currentY)
      .text(fmt(originalSubtotal), valueX, currentY, { align: "right" });
    currentY += 15;

    // 2. Discount (Deducted)
    if (discount > 0) {
      doc
        .fillColor("#10b981") 
        .text("Discount:", labelX, currentY)
        .text(`- ${fmt(discount)}`, valueX, currentY, { align: "right" });
      currentY += 15;
    }

    // 3. Taxable Value (Net after discount, before Tax)
    doc
      .fillColor(secondaryColor)
      .text("Taxable Value:", labelX, currentY)
      .text(fmt(taxableValue), valueX, currentY, { align: "right" });
    currentY += 15;

    // 4. GST
    doc
      .text("GST (18%):", labelX, currentY)
      .text(fmt(gstAmount), valueX, currentY, { align: "right" });
    currentY += 20;

    // 5. Total Paid
    doc
      .rect(340, currentY, 210, 30)
      .fillAndStroke(primaryColor, primaryColor);

    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Total Paid:", 355, currentY + 7)
      .text(`Rs. ${fmt(totalPaid)}`, valueX, currentY + 7, { align: "right" });

    // --- 9. FOOTER ---
    const footerTop = 700;
    doc
      .fillColor(secondaryColor)
      .fontSize(10)
      .font("Helvetica")
      .text("Thank you for choosing IVGJobs!", 50, footerTop, { align: "center", width: 500 })
      .fontSize(8)
      .text(
        "This is a system-generated receipt. For questions, contact support@ivgjobs.com",
        50,
        footerTop + 15,
        { align: "center", width: 500 }
      );

    doc.end();
  });
};