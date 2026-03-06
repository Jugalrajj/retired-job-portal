import Razorpay from "razorpay";

// 🟢 EXPORT these constants so other files can use them

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpay;
