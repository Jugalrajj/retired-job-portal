import mongoose from "mongoose";

const EmployerProfileSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      unique: true 
    },

    // --- LINK TO COMPANY ENTITY ---
    companyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Company" // Links to the Company Model
    },

    companyLogo: { 
      type: String, 
      default: "" 
    },

    mission:{
      type: String,
      default: ""
    },

    // --- PERSONAL DETAILS ---
    firstName: { type: String, required: true },
    lastName: { type: String },
    designation: { type: String, required: true }, // e.g., "HR Manager"
    mobile: { type: String, required: true },
    workEmail: { type: String }, // Official email
    
    // --- TEAM PERMISSIONS ---
    isCompanyAdmin: { type: Boolean, default: false },
    permissions: {
      type: [String],
      enum: [
        "manage_team",
        "post_jobs",
        "view_applications",
        "edit_company",
      ],
      default: [],
    },

    // --- PREFERENCES ---
    notificationsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("EmployerProfile", EmployerProfileSchema);