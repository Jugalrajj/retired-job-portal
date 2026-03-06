import SeekerProfile from '../models/SeekerProfile.js';
import User from '../models/User.model.js'; 

// --- HELPER: Calculate Experience Years from Array ---
const calculateTotalExperience = (workExperience) => {
  if (!Array.isArray(workExperience) || workExperience.length === 0) return 0;
  
  let totalMonths = 0;
  workExperience.forEach(exp => {
    if (exp.startDate) {
      const start = new Date(exp.startDate);
      const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    }
  });
  
  return Math.floor(totalMonths / 12);
};

// 1. GET CURRENT USER PROFILE
export const getSeekerProfile = async (req, res) => {
  try {
    const profile = await SeekerProfile.findOne({ user: req.user._id });
    res.status(200).json(profile || null);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 2. UPDATE / CREATE SEEKER PROFILE
export const updateSeekerProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    let profileFields = { ...req.body, user: userId };

    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        profileFields.photoUrl = req.files.photo[0].path.replace(/\\/g, "/");
      }
      if (req.files.resume && req.files.resume[0]) {
        profileFields.resumeUrl = req.files.resume[0].path.replace(/\\/g, "/");
      }
    }

    const parseJSON = (field) => {
        if (typeof profileFields[field] === 'string') {
            try { return JSON.parse(profileFields[field]); } catch (e) { return []; }
        }
        return profileFields[field]; 
    };

    profileFields.workExperience = parseJSON('workExperience');
    profileFields.education = parseJSON('education');
    
    // Auto-Calculate Experience if not provided
    if (!profileFields.totalExperienceYears && profileFields.workExperience.length > 0) {
        profileFields.totalExperienceYears = calculateTotalExperience(profileFields.workExperience);
    }

    const rawLanguages = parseJSON('languages');
    if (Array.isArray(rawLanguages)) {
        profileFields.languages = rawLanguages.filter(l => l && typeof l === 'object' && l.name);
    } else {
        profileFields.languages = [];
    }
    
    if (typeof profileFields.skills === 'string') {
      profileFields.skills = profileFields.skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    // 🔥 SAVE RESUME TEXT (This is critical for ATS Search)
    if (req.body.resumeText) {
        profileFields.resumeText = req.body.resumeText;
    }

    const profile = await SeekerProfile.findOneAndUpdate(
      { user: userId },
      { $set: profileFields },
      { new: true, upsert: true, runValidators: true }
    );

    if (profileFields.photoUrl) {
      await User.findByIdAndUpdate(userId, { photoUrl: profileFields.photoUrl });
    }

    res.status(200).json({ success: true, profile });

  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: "Server Error: Unable to save profile." });
  }
};

// 3. GET JOB PREFERENCES
export const getPreferences = async (req, res) => {
  try {
    const profile = await SeekerProfile.findOne({ user: req.user._id });
    res.json(profile?.preferences || {
      jobTitles: [], jobTypes: [], locationTypes: [], locations: [],
      minSalary: 0, currency: "INR", availability: "Immediate", emailAlerts: true
    });
  } catch (error) {
    console.error("Get Prefs Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 4. UPDATE JOB PREFERENCES
export const updatePreferences = async (req, res) => {
  try {
    const { 
      jobTitles, jobTypes, locationTypes, locations, 
      minSalary, currency, availability, emailAlerts 
    } = req.body;

    let profile = await SeekerProfile.findOne({ user: req.user._id });

    if (!profile) {
      const user = await User.findById(req.user._id);
      profile = new SeekerProfile({
        user: req.user._id,
        fullName: user.name,
        contactEmail: user.email,
        phone: user.phone || "Not Provided",
        location: "Unknown",
        headline: "New Member",
        languages: [] 
      });
    }

    profile.preferences = {
      jobTitles: Array.isArray(jobTitles) ? jobTitles : [],
      jobTypes: Array.isArray(jobTypes) ? jobTypes : [],
      locationTypes: Array.isArray(locationTypes) ? locationTypes : [],
      locations: Array.isArray(locations) ? locations : [],
      minSalary: Number(minSalary) || 0,
      currency: currency || "INR",
      availability: availability || "Immediate",
      emailAlerts: emailAlerts === undefined ? true : emailAlerts
    };

    await profile.save();
    res.json({ success: true, message: "Preferences updated", preferences: profile.preferences });

  } catch (error) {
    console.error("Update Prefs Error:", error);
    res.status(500).json({ message: "Server Error saving preferences" });
  }
};

// 5. GET ALL SEEKERS (Talent Pool)
export const getSeekers = async (req, res) => {
  try {
    const currentUser = req.user;
    const accountHolder = currentUser.parentUser ? currentUser.parentUser : currentUser;

    const masterAccount = await User.findById(accountHolder._id);
    const unlockedIds = masterAccount?.unlockedSeekers?.map(id => id.toString()) || [];

    const seekers = await SeekerProfile.find().sort({ createdAt: -1 });

    const sanitizedSeekers = seekers.map(seeker => {
      const profile = seeker.toObject(); 
      const seekerIdStr = profile._id.toString();
      const isUnlocked = unlockedIds.includes(seekerIdStr);

      if (!isUnlocked) {
        return {
          ...profile, 
          _id: profile._id,
          fullName: profile.firstName ? `${profile.firstName} ${profile.lastName}` : (profile.fullName || "Locked Candidate"),
          // Mask sensitive info
          contactEmail: null,           
          phone: null,                  
          photoUrl: null,             
          resumeUrl: null,
          
          // 🔥 IMPORTANT: We MUST return resumeText so the frontend can filter by it
          resumeText: profile.resumeText || "",
          skills: profile.skills,
          workExperience: profile.workExperience,
          
          isMasked: true                
        };
      }
      
      return { 
        ...profile, 
        isMasked: false,
        contactEmail: profile.contactEmail || profile.email,
        phone: profile.phone
      };
    });

    res.status(200).json(sanitizedSeekers);
  } catch (err) {
    console.error("Error fetching talent pool:", err);
    res.status(500).json({ message: "Failed to load talent pool" });
  }
};

// 6. UNLOCK SEEKER PROFILE
export const unlockSeeker = async (req, res) => {
  try {
    const seekerProfileId = req.params.id;
    const currentUser = req.user;
    const accountHolderId = currentUser.parentUser ? currentUser.parentUser._id : currentUser._id;
    
    const accountHolder = await User.findById(accountHolderId);

    if (!accountHolder) {
        return res.status(404).json({ message: "Account holder not found" });
    }

    if (accountHolder.unlockedSeekers.some(id => id.toString() === seekerProfileId)) {
      const fullProfile = await SeekerProfile.findById(seekerProfileId);
      return res.status(200).json({ 
        success: true, 
        message: "Already unlocked",
        credits: accountHolder.credits,
        unmaskedData: fullProfile 
      });
    }

    if ((accountHolder.credits || 0) < 1) {
      return res.status(403).json({ 
        success: false, 
        message: "Insufficient credits." 
      });
    }

    accountHolder.credits -= 1;
    accountHolder.unlockedSeekers.push(seekerProfileId);
    await accountHolder.save();

    const fullProfile = await SeekerProfile.findById(seekerProfileId);
    const expYears = fullProfile.totalExperienceYears || calculateTotalExperience(fullProfile.workExperience);

    res.status(200).json({ 
      success: true, 
      credits: accountHolder.credits, 
      unmaskedData: {
        ...fullProfile.toObject(),
        fullName: fullProfile.fullName,
        contactEmail: fullProfile.contactEmail || fullProfile.email,
        phone: fullProfile.phone,
        resumeUrl: fullProfile.resumeUrl,
        photoUrl: fullProfile.photoUrl,
        totalExperienceYears: expYears,
        isMasked: false
      }
    });

  } catch (error) {
    console.error("Unlock Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 7. GET SINGLE SEEKER BY ID
export const getSeekerById = async (req, res) => {
  try {
    const profile = await SeekerProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json(profile);
  } catch (error) {
    console.error("Fetch Single Seeker Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};