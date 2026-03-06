import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    razorpay_order_id: {
      type: String,
      required: true,
    },
    razorpay_payment_id: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    planName: {
      type: String, // e.g., "Pro Membership", "Credit Pack - 10"
    },
    // --- NEW FIELDS FOR INTEGRITY ---
    validityInDays: {
      type: Number, // How long this plan lasts (e.g., 30 days)
      default: 30
    },
    jobActiveDays: {
      type: Number, // How long jobs posted under this plan stay active
      default: 7
    },
    // --------------------------------
    status: {
      type: String,
      enum: ["created", "success", "failed"],
      default: "created",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", PaymentSchema);