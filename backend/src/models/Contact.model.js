import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String },
  message: { type: String, required: true },
  status: { type: String, enum: ["New", "In Progress", "Resolved"], default: "New" }
}, { timestamps: true });

export default mongoose.model("Contact", contactSchema);