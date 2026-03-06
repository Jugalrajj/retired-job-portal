import mongoose from "mongoose";

const SeekerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // --- 1. CORE IDENTITY ---
    fullName: { type: String, required: true },
    dob: { type: Date },
    location: { type: String, required: true },
    contactEmail: { type: String },
    phone: { type: String, required: true },
    headline: { type: String, required: true },
    bio: { type: String },
    portfolio: { type: String },
    
    // --- 2. PROFESSIONAL ARRAYS ---
    workExperience: [{
        title: { type: String, required: true },
        company: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        current: { type: Boolean, default: false },
        description: { type: String }
    }],

    education: [{
        degree: { type: String, required: true },
        institution: { type: String, required: true },
        year: { type: String, required: true },
        grade: { type: String }
    }],
    
    languages: [{
        name: { type: String, required: true },
        proficiency: { 
            type: String, 
            enum: ["Native", "Fluent", "Professional", "Conversational"],
            default: "Professional"
        }
    }],

    // --- 3. EXPERTISE & FILES ---
    skills: [String],
    techLevel: { type: String, default: "Intermediate" },
    photoUrl: { type: String },
    resumeUrl: { type: String },

    // 🔥 ATS FEATURE: Raw Resume Text ---
    // Stores the keywords extracted from the resume
    resumeText: { type: String, default: "" }, 

    // --- 4. JOB PREFERENCES ---
    preferences: {
      jobTitles: [String], 
      jobTypes: [String], 
      locationTypes: [String], 
      locations: [String], 
      minSalary: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
      availability: { type: String },
      emailAlerts: { type: Boolean, default: true } 
    },

    // Legacy fields
    workType: { type: String, default: "Consulting" },
    workMode: { type: String, default: "Remote" },
    availability: { type: String },
    expectedCompensation: { type: String },
    healthConsiderations: { type: String },
  },
  { timestamps: true }
);

// Index for text search efficiency
SeekerProfileSchema.index({ 
    fullName: 'text', 
    headline: 'text', 
    skills: 'text', 
    resumeText: 'text',
    'workExperience.description': 'text' 
});

export default mongoose.model("SeekerProfile", SeekerProfileSchema);