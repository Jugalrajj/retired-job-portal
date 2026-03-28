import User from "../models/User.model.js";
import sendEmail from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import axios from "axios";

// --- HELPERS ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Generate 6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 1. Find User (Explicitly select password because it's hidden in model)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (!user.isActive) return res.status(403).json({ message: "Account deactivated." });

    // 2. ROLE VERIFICATION LOGIC
    if (role) {
      const requestedRole = role.toLowerCase();
      const userRole = user.role; // Database Role

      // === SCENARIO A: LOGGING IN AS "SEEKER" ===
      if (requestedRole === 'seeker') {
         // Allow if DB role is 'jobseeker' (legacy) OR 'seeker'
         if (userRole !== 'jobseeker' && userRole !== 'seeker') {
             return res.status(403).json({ message: "Account mismatch. Please login as an Employer." });
         }
      }

      // === SCENARIO B: LOGGING IN AS "EMPLOYER" ===
      // Allow if DB role is 'employer', 'admin', OR 'recruiter'
      else if (requestedRole === 'employer') {
         if (!['employer', 'admin', 'recruiter'].includes(userRole)) {
            return res.status(403).json({ message: "Account mismatch. Please login as a Job Seeker." });
         }
      }
    }

    // 3. Check Password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // 4. Verify Check
    if (!user.isVerified) {
       return res.status(401).json({ message: "Please verify your email via OTP first." });
    }

    // 5. Send User Data (Exclude password from response)
    const fullUser = await User.findById(user._id).select("-password");

    res.json({
      token: generateToken(user._id),
      user: fullUser 
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token, role } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required." });
    }

    // 1. Fetch user info from Google using the access token
    const googleResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 2. Extract user info
    const { email, name, picture, email_verified } = googleResponse.data;

    if (!email_verified) {
      return res.status(401).json({ message: "Google email is not verified." });
    }

    // 3. Check if user already exists in your database
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // 4. Auto-register if they don't exist
      const roleToSave = role ? role.toLowerCase() : 'seeker';
      
      user = await User.create({
        name,
        email: email.toLowerCase(),
        role: roleToSave,
        isVerified: true, // Google emails are inherently verified
        avatar: picture,
        // Generate a random secure password since they are using Google
        password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
        isActive: true
      });
    } else {
      // 5. If user exists, check if account is active and matches requested role
      if (!user.isActive) return res.status(403).json({ message: "Account deactivated." });

      if (role) {
        const requestedRole = role.toLowerCase();
        const userRole = user.role; 

        if (requestedRole === 'seeker') {
           if (userRole !== 'jobseeker' && userRole !== 'seeker') {
               return res.status(403).json({ message: "Account mismatch. Please login as an Employer." });
           }
        } else if (requestedRole === 'employer') {
           if (!['employer', 'admin', 'recruiter'].includes(userRole)) {
              return res.status(403).json({ message: "Account mismatch. Please login as a Job Seeker." });
           }
        }
      }
    }

    // 6. Send User Data (Exclude password from response)
    const fullUser = await User.findById(user._id).select("-password");

    res.json({
      token: generateToken(user._id),
      user: fullUser 
    });

  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ message: "Failed to authenticate with Google." });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // --- NORMALIZE ROLE (FIXED) ---
    // We just ensure it's lowercase. We do NOT force 'jobseeker'.
    const roleToSave = role.toLowerCase(); 

    // Create User
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password, 
      role: roleToSave, // This will now save as 'seeker' correctly
      isVerified: false,
      otp,
      otpExpires
    });

    // --- SEND OTP EMAIL ---
    try {
      await sendEmail({
        email: user.email,
        subject: "IVGJobs - Verify Your Account",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4f46e5;">Verify Your Email</h2>
            <p>Hi ${user.name},</p>
            <p>Thank you for registering with IVGJobs. Please use the code below to verify your account:</p>
            <div style="background: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111;">${otp}</span>
            </div>
            <p>This code expires in 10 minutes.</p>
          </div>
        `
      });
      
      return res.status(200).json({ 
        message: "OTP sent to email", 
        email: user.email,
        requiresOtp: true 
      });

    } catch (emailError) {
      console.error("OTP Email Failed:", emailError);
      return res.status(200).json({ 
        message: "Account created but email failed. Contact support.", 
        email: user.email,
        requiresOtp: true 
      });
    }

  } catch (error) {
    console.error("Register Error:", error); 
    res.status(500).json({ message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) return res.status(400).json({ message: "User not found" });
        
        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (user.otpExpires < Date.now()) {
             return res.status(400).json({ message: "OTP Expired" });
        }

        // 1. Update User Status
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // 2. --- SEND WELCOME EMAIL ---
        try {
          await sendEmail({
            email: user.email,
            subject: "Welcome to IVGJobs!",
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #10b981;">Account Verified Successfully!</h2>
                <p>Hi ${user.name},</p>
                <p>Your account has been verified. You can now log in and start using IVGJobs.</p>
                ${user.role === 'employer' 
                  ? '<p>Post jobs, manage candidates, and build your dream team.</p>' 
                  : '<p>Find your dream job and connect with top employers.</p>'
                }
                <div style="margin-top: 20px;">
                  <a href="${process.env.CLIENT_URL}/login" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Login</a>
                </div>
              </div>
            `
          });
        } catch (mailError) {
          console.error("Welcome Email Failed:", mailError);
        }

        res.json({
            success: true,
            message: "Email verified successfully",
            token: generateToken(user._id),
            user: { 
                _id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role
            }
        });

    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Code",
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>Use the code below to reset your password:</p>
            <h1 style="background: #f4f4f5; display: inline-block; padding: 10px 20px; letter-spacing: 5px;">${otp}</h1>
            <p>This code expires in 10 minutes.</p>
          </div>
        `,
      });
      res.status(200).json({ success: true, message: "OTP sent to email" });
    } catch (error) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: "Email failed to send." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, password } = req.body; 
  try {
    const user = await User.findOne({
      email: email.toLowerCase(),
      otp: otp,
      otpExpires: { $gt: Date.now() }, 
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    user.password = password; 
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- GET ME ---
export const getMe = async (req, res) => {
  try {
    // 1. Fetch User and Populate 'parentUser'
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("parentUser");
    
    // 2. Clone User Object
    let responseUser = user.toObject();

    // 3. If User has a Parent (is a Team Member), inherit the Parent's Credits/Plan
    if (user.parentUser) {
        responseUser.credits = user.parentUser.credits;
        responseUser.plan = user.parentUser.plan;
        responseUser.subscriptionExpiry = user.parentUser.subscriptionExpiry;
        
        // Merge unlocked seekers to ensure team member knows what is unlocked
        const parentUnlocked = user.parentUser.unlockedSeekers || [];
        const myUnlocked = user.unlockedSeekers || [];
        // Unique merge
        const merged = [...new Set([...parentUnlocked, ...myUnlocked].map(id => id.toString()))];
        responseUser.unlockedSeekers = merged;
    }

    res.json({ user: responseUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- TEAM FUNCTIONS ---
export const getTeamMembers = async (req, res) => {
  try {
    let masterId = null;
    if (req.user.isCompanyAdmin) masterId = req.user._id;
    else if (req.user.companyId) masterId = req.user.companyId;
    else if (req.user.role === 'employer') masterId = req.user._id; 
    
    // If I am a Team Member, masterId is my parent
    if (!masterId && req.user.parentUser) masterId = req.user.parentUser._id;

    if (!masterId) return res.status(400).json({ message: "Could not determine company." });

    const members = await User.find({ 
      parentUser: masterId 
    }).select("-password");

    res.json(members);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { name, email, password, permissions, role } = req.body;

    // Use current user as the parent/company ID
    let companyId = req.user._id;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    // Format permissions for the email (Readable string)
    const workDescription = permissions && permissions.length > 0 
      ? permissions.map(p => p.replace(/_/g, ' ')).join(', ') 
      : "General Team Access";

    const member = await User.create({
      name,
      email,
      password: password, 
      role: role || "employer", // Default to employer/recruiter if not sent
      parentUser: companyId, // Link to Employer
      isCompanyAdmin: role === 'admin', // Set admin flag based on role
      permissions: permissions || [],
      isVerified: true, 
      isActive: true
    });

    // --- SEND INVITE EMAIL WITH CREDENTIALS ---
    try {
      await sendEmail({
        email: member.email,
        subject: "You've been added to the Team - IVGJobs",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            
            <h2 style="color: #4f46e5; margin-top: 0;">Welcome to the Team, ${member.name}! 🎉</h2>
            
            <p style="font-size: 16px; line-height: 1.6;">
              You have been added to the recruitment team at <strong>IVGJobs</strong>. 
              Below are your access details and assigned responsibilities.
            </p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">🔑 Your Credentials</h3>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${member.email}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${password}</p>
              <p style="margin: 5px 0; font-size: 13px; color: #6b7280;">(Please change this after your first login)</p>
            </div>

            <div style="margin-bottom: 25px;">
              <h3 style="color: #1f2937; margin-bottom: 10px;">📋 Your Assigned Work & Permissions</h3>
              <p style="margin: 0; background: #ecfdf5; color: #065f46; padding: 12px; border-radius: 6px; border: 1px solid #a7f3d0;">
                <strong>Role:</strong> ${role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Recruiter'}<br/>
                <strong>Access Rights:</strong> ${workDescription}
              </p>
            </div>

            <p style="margin-bottom: 25px;">Click the button below to log in and start working:</p>
            
            <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">Login to Dashboard</a>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error("Invite Email Failed:", emailError);
      // We don't fail the request if email fails, but we log it.
    }

    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Member removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMemberPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Team member not found" });

    user.permissions = permissions;
    await user.save();

    res.json({ success: true, permissions: user.permissions });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// --- ADMIN FUNCTIONS ---
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: "Status updated", isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};