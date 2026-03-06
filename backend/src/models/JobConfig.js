import mongoose from "mongoose";

// Sub-schema for Categories
const CategoryItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: { type: String, default: "Briefcase" },
  color: { type: String, default: "#4f46e5" },
  image: { type: String, default: "" },
  // 🔥 NEW: This links specific role categories directly to this department
  roleCategories: { type: [String], default: [] },
});

// Sub-schema for Education
const EducationCategorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  qualifications: { type: [String], default: [] },
});

// --- CREDIT SYSTEM SCHEMAS ---
const SubscriptionPlanSchema = new mongoose.Schema(
  {
    price: { type: Number, default: 0 },
    monthlyCredits: { type: Number, default: 0 },
    jobLimit: { type: Number, default: 3 },
    validity: { type: Number, default: 30 }, // How long credits last (days)
    activeDays: { type: Number, default: 15 }, // How long a job stays active (days)
  },
  { _id: false },
);

const CreditPackSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    credits: { type: Number, required: true },
  },
  { _id: false },
);

const JobConfigSchema = new mongoose.Schema({
  categories: { type: [CategoryItemSchema], default: [] },
  educationCategories: { type: [EducationCategorySchema], default: [] },

  // --- CREDIT SYSTEM CONFIGURATION ---
  creditSystem: {
    subscriptions: {
      free: {
        type: SubscriptionPlanSchema,
        default: {
          price: 0,
          monthlyCredits: 0,
          jobLimit: 3,
          validity: 30,
          activeDays: 15,
        },
      },
      pro: {
        type: SubscriptionPlanSchema,
        default: {
          price: 499,
          monthlyCredits: 30,
          jobLimit: 9999,
          validity: 90,
          activeDays: 30,
        },
      },
    },
    packs: {
      type: [CreditPackSchema],
      default: [
        { id: "starter", name: "Starter Pack", price: 499, credits: 10 },
        { id: "growth", name: "Growth Pack", price: 999, credits: 25 },
      ],
    },
  },

  // --- GLOBAL SHARED FILTER LISTS ---
  // Used by: Job Post & Employer Profile
  locations: {
    type: [String],
    default: [
      "Remote",
      "Mumbai",
      "Bangalore",
      "Delhi",
      "Pune",
      "Hyderabad",
      "Chennai",
      "Kolkata",
    ],
  },

  industries: {
    type: [String],
    default: [
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
      "Other",
    ],
  },

  companyTypes: {
    type: [String],
    default: [
      "MNC",
      "Startup",
      "SME",
      "Public Sector",
      "NGO",
      "Consultancy",
      "Conglomerate",
      "Government",
    ],
  },

  // --- JOB SPECIFIC LISTS ---
  seniorityLevels: {
    type: [String],
    default: [
      "Mid-Level",
      "Senior Professional",
      "Director",
      "Executive",
      "Expert",
    ],
  },
  workTypes: {
    type: [String],
    default: [
      "Consulting",
      "Full-Time",
      "Part-Time",
      "Contract",
      "Advisory Board",
      "Project-Based",
      "Volunteer",
    ],
  },

  workModes: { type: [String], default: ["Remote", "On-Site", "Hybrid"] },
  physicalDemands: {
    type: [String],
    default: [
      "Sedentary (Desk Job)",
      "Light (Some walking)",
      "Moderate (Standing/Walking)",
      "Heavy (Lifting required)",
    ],
  },
  travelRequirements: {
    type: [String],
    default: ["No Travel", "Occasional", "Frequent"],
  },
  currencies: { type: [String], default: ["INR", "USD", "EUR", "GBP"] },
  frequencies: {
    type: [String],
    default: ["Monthly", "Hourly", "Project-Fixed", "Yearly"],
  },
  urgencies: { type: [String], default: ["Standard", "Urgent", "Immediate"] },

  // --- SEEKER PROFILE LISTS ---
  techLevels: {
    type: [String],
    default: ["Basic", "Intermediate", "Advanced"],
  },
  proficiencies: {
    type: [String],
    default: ["Native", "Fluent", "Professional", "Conversational"],
  },

  // --- EMPLOYER PROFILE LISTS ---
  companySizes: {
    type: [String],
    default: [
      "1-10 Employees",
      "11-50 Employees",
      "51-200 Employees",
      "201-500 Employees",
      "500+ Employees",
    ],
  },

  benefits: {
    type: [String],
    default: [
      "Flexible Working Hours",
      "Remote / Work from Home",
      "Health Insurance",
      "Part-time Options",
      "Mentorship Programs",
      "Wheelchair Accessible",
      "Age-Diverse Team",
      "Consultancy Roles",
    ],
  },
});

export default mongoose.model("JobConfig", JobConfigSchema);
