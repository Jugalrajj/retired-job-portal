import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true, 
      trim: true 
    },
    discountType: { 
      type: String, 
      enum: ["PERCENTAGE", "FLAT"], 
      required: true 
    },
    value: { type: Number, required: true }, // e.g., 10 (percent) or 500 (rupees)
    minOrderValue: { type: Number, default: 0 }, 
    maxDiscount: { type: Number }, // Cap for percentage discounts
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    usageLimit: { type: Number, default: 1000 }, // Total allowed uses
    usedCount: { type: Number, default: 0 },
    // --- NEW: Track users who used this coupon ---
    usedBy: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);