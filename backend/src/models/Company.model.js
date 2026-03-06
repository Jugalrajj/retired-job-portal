import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    // Slug field (Fixed unique constraint)
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },

    location: { type: String, required: true },
    logo: { type: String, default: "" },
    banner: { type: String, default: "" },
    description: { type: String },
    mission: { type: String },
    website: { type: String },

    linkedin: { type: String },
    twitter: { type: String },

    // 🔥 IMPORTANT FIX: keep "admin" but also track createdBy for safety
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // every company must have an admin
    },

    // Optional backward-compatible field (in case some docs used this earlier)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    industry: {
      type: String,
      enum: [
        "Defense & Military",
        "Healthcare & Medical",
        "Education & Training",
        "Banking & Finance",
        "Government / PSU",
        "Manufacturing",
        "Consulting & Advisory",
        "NGO / Social Work",
        "Technology & IT",
        "Construction & Real Estate",
        "Legal & Compliance",
        "Retail",
        "Media",
        "Other",
      ],
      default: "Other",
    },

    companyType: {
      type: String,
      enum: [
        "MNC",
        "Startup",
        "SME",
        "Public Sector",
        "NGO",
        "Consultancy",
        "Partner",
      ],
      default: "Partner",
    },

    size: { type: String },
    foundedYear: { type: Number },
    benefits: [String],

    jobCount: { type: Number, default: 0 },

    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// --------- SLUG GENERATION ----------
companySchema.pre("save", async function () {
  if (this.isModified("name") || this.isNew) {
    if (this.name) {
      let baseSlug = this.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      this.slug = baseSlug;
    }
  }

  // 🔥 BACKWARD COMPATIBILITY FIX:
  // If someone used "createdBy" earlier, sync it to admin
  if (this.createdBy && !this.admin) {
    this.admin = this.createdBy;
  }
});

export default mongoose.model("Company", companySchema);
