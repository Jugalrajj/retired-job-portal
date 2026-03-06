import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    // --- Core Role Details ---
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true },

    // UPDATED: Removed the hardcoded enum so it can accept dynamic roles
    // based on the selected Department from your Config/Categories.
    roleCategory: {
      type: String,
      required: true, // Optional: Make it required to ensure data consistency
    },

    // NEW: Seniority Mapping
    seniorityLevel: { type: String, default: "Senior Professional" },

    description: { type: String, required: true },
    responsibilities: { type: String },
    openings: { type: Number, default: 1 },

    // --- Experience & Education ---
    skills: [String],
    education: { type: String, required: true, default: "Any" },
    minExperience: { type: Number, required: true, default: 0 },
    maxExperience: { type: Number },

    // --- Senior-Specific Constraints ---
    physicalDemands: { type: String, default: "Sedentary (Desk Job)" },
    travelRequirement: { type: String, default: "No Travel" },

    // --- Work Logistics ---
    workMode: { type: String, default: "On-Site" },
    workType: { type: String, default: "Part-Time" },

    hoursPerWeek: { type: Number },

    durationValue: { type: Number },
    durationUnit: { type: String },

    locationType: { type: String, default: "On-Site" },
    locations: [String],

    // --- Compensation ---
    isVolunteer: { type: Boolean, default: false },
    currency: { type: String, default: "INR" },
    minSalary: { type: Number, default: 0 },
    maxSalary: { type: Number, default: 0 },
    salary: { type: Number, default: 0 }, // For sorting
    frequency: { type: String, default: "Monthly" },

    benefits: [String],
    customPerks: { type: String },

    // --- Screening ---
    customQuestions: [
      {
        question: { type: String },
        type: { type: String, default: "Text" },
      },
    ],
    urgency: { type: String, default: "Standard" },

    // --- Meta Data ---
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: { type: Boolean, default: true },

    // --- FIELDS FOR EXPIRY LOGIC ---
    validUntil: { type: Date },
    deadlineReminderSent: { type: Boolean, default: false },
    expiryNotificationSent: { type: Boolean, default: false },

    views: { type: Number, default: 0 },
    viewedBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", select: false },
    ],

    // --- Applicants ---
    detailedApplicants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        fullName: String,
        email: String,
        phone: String,
        totalExperienceYears: Number,
        highestQualification: String,
        coverLetter: String,
        resumeUrl: String,
        status: { type: String, default: "Pending" },
        appliedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Job", jobSchema);
