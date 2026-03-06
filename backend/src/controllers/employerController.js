import EmployerProfile from "../models/EmployerProfile.js";
import Company from "../models/Company.model.js";
import User from "../models/User.model.js";

// --- GET PROFILE ---
export const getEmployerProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const profile = await EmployerProfile.findOne({ user: req.user._id }).populate("companyId");

    if (!profile) {
      return res.status(200).json(null);
    }

    res.json({
      firstName: profile.firstName,
      lastName: profile.lastName,
      designation: profile.designation,
      mobile: profile.mobile,
      workEmail: profile.workEmail,
      companyLogo: profile.companyLogo, // 🔥 Ensure this is sent back
      company: profile.companyId || {}
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// --- CREATE / UPDATE PROFILE ---
export const createEmployerProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: "Session invalid. Please login again." });
    }

    let user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ message: "User account not found." });
    }

    const {
      firstName, lastName, designation, mobile, workEmail,
      companyName, website, industry, companyType,
      companySize, foundedYear, location, description, mission,
      benefits, linkedin, twitter
    } = req.body;

    // 2. Handle Logo Upload
    let logoUrl = "";
    if (req.file) {
      logoUrl = req.file.path.replace(/\\/g, "/"); 
      
      // Update User Photo (Optional, keeps user avatar in sync)
      user.photoUrl = logoUrl;
      await user.save();
    }

    // 3. Parse Benefits Array
    let parsedBenefits = [];
    if (benefits) {
        try {
            parsedBenefits = typeof benefits === 'string' ? JSON.parse(benefits) : benefits;
        } catch (e) {
            console.error("Error parsing benefits", e);
        }
    }

    // 4. FIND OR CREATE COMPANY
    let company;
    const existingProfile = await EmployerProfile.findOne({ user: req.user._id });

    // Step A: Check if profile links to a VALID company
    if (existingProfile && existingProfile.companyId) {
      company = await Company.findById(existingProfile.companyId);
    }

    // Step B: If company exists, UPDATE it
    if (company) {
        if (companyName) company.name = companyName; 
        if (website) company.website = website;
        if (industry) company.industry = industry;
        if (companyType) company.companyType = companyType;
        if (location) company.location = location;
        if (description) company.description = description;
        if (mission) company.mission = mission;
        
        // Update Company Logo if a new one was uploaded
        if (logoUrl) company.logo = logoUrl;
        
        // New Fields
        if (companySize) company.size = companySize;
        if (foundedYear) company.foundedYear = foundedYear;
        if (parsedBenefits) company.benefits = parsedBenefits;
        if (linkedin) company.linkedin = linkedin;
        if (twitter) company.twitter = twitter;
        
        await company.save();
    } 
    // Step C: If NO company found (Profile is new OR Company was deleted), CREATE/JOIN
    else {
      if (!companyName) {
        return res.status(400).json({ message: "Company Name is required." });
      }

      // Check if company exists by name
      const existingCompanyByName = await Company.findOne({ 
        name: { $regex: new RegExp(`^${companyName.trim()}$`, "i") } 
      });

      if (existingCompanyByName) {
        // JOIN EXISTING
        company = existingCompanyByName;
        if (logoUrl) {
            company.logo = logoUrl;
            await company.save();
        }
        // Don't override admin if joining, unless logic requires it
        user.isCompanyAdmin = false; 
      } else {
        // CREATE NEW
        company = new Company({
          name: companyName,
          website, industry, companyType, location, description,
          logo: logoUrl,
          mission,
          size: companySize,
          foundedYear,
          benefits: parsedBenefits,
          linkedin,
          twitter,
          createdBy: req.user._id,
          // 🔥 FIX: Explicitly set admin here to satisfy required: true
          admin: req.user._id, 
          isVerified: false 
        });
        await company.save();
        user.isCompanyAdmin = true; 
      }

      // Link User to Company
      user.companyId = company._id;
      user.permissions = ['manage_team', 'post_jobs', 'view_applications', 'edit_company'];
      await user.save();
    }

    // --- CRITICAL CHECK ---
    if (!company || !company._id) {
        throw new Error("Company creation failed unexpectedly.");
    }

    // 5. UPDATE OR CREATE EMPLOYER PROFILE
    if (existingProfile) {
      existingProfile.firstName = firstName;
      existingProfile.lastName = lastName;
      existingProfile.designation = designation;
      existingProfile.mobile = mobile;
      existingProfile.workEmail = workEmail;
      existingProfile.companyId = company._id; 
      
      // 🔥 FIX: Save logo to EmployerProfile
      if (logoUrl) {
        existingProfile.companyLogo = logoUrl;
      }
      
      await existingProfile.save();
      
      return res.json({ 
        message: "Profile updated successfully", 
        profile: existingProfile,
        company: company 
      });

    } else {
      const newProfile = new EmployerProfile({
        user: req.user._id,
        companyId: company._id,
        firstName,
        lastName,
        designation,
        mobile,
        workEmail,
        isCompanyAdmin: user.isCompanyAdmin,
        
        companyLogo: logoUrl,

        permissions: ['manage_team', 'post_jobs', 'view_applications', 'edit_company']
      });

      await newProfile.save();

      return res.status(201).json({ 
        message: "Profile created successfully", 
        profile: newProfile,
        company: company
      });
    }

  } catch (error) {
    console.error("Create Employer Profile Error:", error);
    
    if (error.code === 11000) {
        return res.status(400).json({ message: "Company name already exists." });
    }
    if (error.name === 'ValidationError') {
       const messages = Object.values(error.errors).map(val => val.message);
       return res.status(400).json({ message: messages[0] });
    }
    
    res.status(500).json({ message: "Server Error" });
  }
};