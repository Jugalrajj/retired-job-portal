import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    // --- BASIC AUTH ---
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { type: String, required: true, select: false },

    // --- PARENT USER LINK ---
    parentUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // --- CREDIT SYSTEM ---
    credits: { 
      type: Number, 
      default: 0 
    },
    unlockedSeekers: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'SeekerProfile' 
    }],

    // --- PROFILE PHOTO ---
    photoUrl: { 
      type: String, 
      default: "" 
    },

    // --- ROLE & PERMISSIONS ---
    role: {
      type: String,
      // STRICTLY ENFORCED ROLES
      enum: ["employer", "admin", "recruiter", "seeker"], 
      default: "seeker",
      required: true,
    },

    // --- PREFERENCES ---
    preferences: {
      emailAlerts: { type: Boolean, default: true },
      smsAlerts: { type: Boolean, default: false }
    },

    // --- SUBSCRIPTION ---
    plan: {
     type: String,
      enum: ["free", "starter", "pro", "enterprise"], 
      default: "free"
    },
    paymentId: { type: String },
    subscriptionExpiry: { type: Date, default: null },
    
    // 🔥 NEW: Tracks when the user's credits expire (90 days limit)
    creditsExpireAt: { type: Date, default: null },

    // --- SEEKER SPECIFIC ---
    savedJobs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job"
    }],
    appliedJobs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job"
    }],

    // --- COMPANY & TEAM MANAGEMENT ---
    companyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Company",
      default: null
    },
    
    isCompanyAdmin: { 
      type: Boolean, 
      default: false 
    },

    permissions: {
      type: [String],
      enum: [
        "manage_team",       
        "post_jobs",         
        "view_applications", 
        "update_status",     
        "edit_company",   
        "view_talent_pool"   
      ],
      default: [],
    },

    // --- SECURITY & 2FA ---
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    
    // OTP System
    otp: { type: String },
    otpExpires: { type: Date },

    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// --- METHODS ---
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// --- MIDDLEWARE FIX ---
userSchema.pre("save", async function (next) { // Added 'next' parameter back
  
  // *** CRITICAL FIX: AUTO-CORRECT INVALID ROLES ***
  // If the database has 'jobseeker', automatically switch it to valid 'seeker'
  if (this.role === 'jobseeker') {
      this.role = 'seeker';
  }

  // If password is not modified, continue
  if (!this.isModified("password")) return; // 'next' is not strictly needed here if purely async, but standard practice in some versions
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.model("User", userSchema);