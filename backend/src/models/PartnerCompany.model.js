import mongoose from "mongoose";

const partnerCompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, required: true }, // URL or Path to logo
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("PartnerCompany", partnerCompanySchema);