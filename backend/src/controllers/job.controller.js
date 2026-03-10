import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Job from "../models/Job.model.js";
import User from "../models/User.model.js";
import Company from "../models/Company.model.js";
import Notification from "../models/Notification.js";
import sendEmail from "../utils/sendEmail.js";
import SeekerProfile from "../models/SeekerProfile.js";
import JobConfig from "../models/JobConfig.js";

// --- HELPER: Get Full Plan Config ---
const getPlanConfig = async (user) => {
  try {
    // 1. Fetch Global Config from Admin Settings
    const configDoc = await JobConfig.findOne();
    const userPlan = user.plan || "free";

    // 2. If Config exists in DB for this plan, use it
    if (
      configDoc &&
      configDoc.creditSystem &&
      configDoc.creditSystem.subscriptions &&
      configDoc.creditSystem.subscriptions[userPlan]
    ) {
      return configDoc.creditSystem.subscriptions[userPlan];
    }

    if (userPlan === "pro") {
      return { jobLimit: 9999, activeDays: 30, validity: 90 };
    }

    return { jobLimit: 0, activeDays: 15, validity: 30 };
  } catch (error) {
    console.error("Error determining plan config:", error);
    return { jobLimit: 0, activeDays: 15, validity: 30 };
  }
};

export const createJob = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ message: "User not found." });

    // 1. FETCH CONFIG & CHECK LIMITS
    const planConfig = await getPlanConfig(user);
    const { jobLimit, activeDays } = planConfig;

    // If user is on a paid plan, check if their subscription is still valid.
    if (user.plan !== "free" && user.plan !== "starter") {
      if (
        user.subscriptionExpiry &&
        new Date() > new Date(user.subscriptionExpiry)
      ) {
        return res.status(403).json({
          code: "PLAN_EXPIRED",
          message: `Your ${user.plan} subscription has expired. Please renew.`,
        });
      }
    }

    const currentActiveJobs = await Job.countDocuments({
      employer: user._id,
      isActive: true,
    });

    // --- CHECK LIMIT ---
    if (currentActiveJobs >= jobLimit) {
      return res.status(403).json({
        code: "LIMIT_REACHED",
        // Logic: If limit is 0, show specific "Upgrade" message. Else show "Limit Reached".
        message:
          jobLimit === 0
            ? "Your current plan has 0 job credits. Please purchase a subscription or credit pack to post a job."
            : `You have reached your limit of ${jobLimit} active jobs. Please upgrade.`,
      });
    }

    // 2. Resolve Company
    let companyId = user.companyId;
    if (!companyId) {
      const company = await Company.findOne({ admin: user._id });
      if (company) companyId = company._id;
    }

    // 3. Extract Fields
    const {
      title,
      description,
      responsibilities, 
      department,
      openings,
      roleCategory,
      seniorityLevel,
      skills,
      education,
      minExperience,
      maxExperience,
      physicalDemands,
      travelRequirement,
      workMode,
      workType,
      hoursPerWeek,
      durationValue,
      durationUnit,
      locations,
      minSalary,
      maxSalary,
      isVolunteer,
      currency,
      frequency,
      customPerks,
      customQuestions,
      urgency,
    } = req.body;

    // 4. Validation
    if (!title || !description || !department) {
      return res
        .status(400)
        .json({ message: "Title, Description, and Department are required." });
    }

    if (!isVolunteer && (!minSalary || !maxSalary)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid salary range." });
    }

    // --- 🔥 INTEGRATION: STRICTLY CALCULATE JOB EXPIRY BASED ON PLAN (15/30 RULE) ---
    // If user is Pro or Enterprise -> 30 Days. If Free/Starter -> 15 Days
    const jobActiveDays = (user.plan === "pro" || user.plan === "enterprise") ? 30 : 15;
    
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + jobActiveDays);

    // 5. Create Job
    const job = await Job.create({
      title,
      description,
      responsibilities, // 🔥 ADDED: Save responsibilities
      department,
      roleCategory,
      seniorityLevel,
      openings: Number(openings) || 1,

      skills,
      education: education || "Any",
      minExperience: Number(minExperience) || 0,
      maxExperience: Number(maxExperience) || 0,

      physicalDemands,
      travelRequirement,

      workMode,
      workType,
      hoursPerWeek: Number(hoursPerWeek) || 0,
      durationValue: Number(durationValue) || 0,
      durationUnit,
      locations,
      locationType: workMode,

      isVolunteer,
      currency,
      frequency,
      minSalary: Number(minSalary) || 0,
      maxSalary: Number(maxSalary) || 0,
      salary: Number(maxSalary) || 0,

      customPerks,
      customQuestions,
      urgency,
      companyId: companyId || undefined,
      employer: user._id,
      isActive: true,
      postedAt: new Date(),

      // --- NEW FIELD ---
      validUntil: validUntilDate, // Stores when this job will automatically expire
    });

    const jobLink = `${process.env.CLIENT_URL}/jobs/${job._id}`;

    // 6. Send Confirmation Email (PROFESSIONAL TEMPLATE)
    try {
      await sendEmail({
        email: user.email,
        subject: `Success: Your job posting for "${job.title}" is live!`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="background-color: #4f46e5; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Job Successfully Posted</h1>
            </div>
            
            <div style="padding: 30px 20px;">
              <p style="font-size: 16px; color: #374151; margin-top: 0;">Hi ${user.name},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.5;">Your opportunity has been successfully published to our network of senior professionals. Candidates can now view and apply to your listing.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h2 style="font-size: 18px; color: #1e293b; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Posting Details</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 120px;"><strong>Role:</strong></td>
                    <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">${job.title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;"><strong>Department:</strong></td>
                    <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">${job.department}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;"><strong>Location:</strong></td>
                    <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">${job.workMode}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;"><strong>Status:</strong></td>
                    <td style="padding: 8px 0; font-size: 14px; font-weight: 600;"><span style="color: #10b981;">Active</span> (${jobActiveDays} Days)</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;"><strong>Expires On:</strong></td>
                    <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500;">${validUntilDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 35px 0 10px;">
                <a href="${jobLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);">View Live Listing</a>
              </div>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #6b7280; margin: 0;">You can manage your job postings and applications from your <a href="${process.env.CLIENT_URL}/my-jobs" style="color: #4f46e5; text-decoration: none;">Employer Dashboard</a>.</p>
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.error("Employer Email failed", e.message);
    }

    // 7. 📧 JOB ALERT ENGINE 📧
    (async () => {
      try {
        const seekers = await SeekerProfile.find({
          "preferences.emailAlerts": true,
        })
          .populate("user", "email name")
          .select("preferences user fullName");

        const matches = seekers.filter((seeker) => {
          const p = seeker.preferences;
          if (!p) return false;

          const titleMatch =
            p.jobTitles.length === 0 ||
            p.jobTitles.some((t) =>
              job.title.toLowerCase().includes(t.toLowerCase()),
            );
          const typeMatch =
            p.jobTypes.length === 0 || p.jobTypes.includes(job.workType);
          const modeMatch =
            p.locationTypes.length === 0 ||
            p.locationTypes.includes(job.workMode);
          const salaryMatch =
            job.isVolunteer || job.maxSalary >= (p.minSalary || 0);

          return titleMatch && typeMatch && modeMatch && salaryMatch;
        });

        // Resolve company name outside the loop to avoid multiple queries if possible, 
        // though we already have it from earlier
        const companyNameDisplay = companyId ? (await Company.findById(companyId).select('name'))?.name : "A top employer";

        matches.forEach((match) => {
          if (match.user && match.user.email) {
            sendEmail({
              email: match.user.email,
              subject: `New Job Alert: ${job.title} at ${companyNameDisplay || 'a great company'}`,
              html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  <div style="background-color: #10b981; padding: 25px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">New Opportunity Matched</h1>
                  </div>
                  
                  <div style="padding: 30px 20px;">
                    <p style="font-size: 16px; color: #374151; margin-top: 0;">Hi ${match.fullName},</p>
                    <p style="font-size: 16px; color: #374151; line-height: 1.5;">A new role matching your preferences has just been posted. We thought you'd want to see this right away.</p>
                    
                    <div style="border-left: 4px solid #10b981; background-color: #ecfdf5; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
                      <h2 style="font-size: 20px; color: #065f46; margin-top: 0; margin-bottom: 8px;">${job.title}</h2>
                      <p style="font-size: 15px; color: #047857; margin: 0 0 15px 0; font-weight: 500;">${companyNameDisplay || 'Confidential Employer'}</p>
                      
                      <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
                        <span style="background-color: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">${job.workType}</span>
                        <span style="background-color: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">${job.workMode}</span>
                      </div>
                    </div>

                    <div style="text-align: center; margin: 35px 0 10px;">
                      <a href="${jobLink}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">Review & Apply</a>
                    </div>
                  </div>
                  
                  <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 12px; color: #6b7280; margin: 0;">You are receiving this because you enabled Job Alerts in your profile preferences.</p>
                  </div>
                </div>
              `,
            }).catch((e) => console.error(`Alert failed`, e.message));
          }
        });
      } catch (alertError) {
        console.error("Job Alert Engine Error:", alertError);
      }
    })();

    res.status(201).json({ success: true, message: "Job Posted!", job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobs = async (req, res) => {
  try {
    const {
      title,
      datePosted,
      minSalary,
      workMode,
      workType,
      workShift,
      department,
      sortBy,
      // --- NEW FILTERS ADDED HERE ---
      roleCategory,
      seniorityLevel,
      industry,
    } = req.query;

    // --- INTEGRATION: Only show jobs that haven't expired ---
    let query = {
      isActive: true,
      $or: [
        { validUntil: { $exists: false } }, // Legacy jobs (keep them shown)
        { validUntil: { $gte: new Date() } }, // New jobs must not be expired
      ],
    };

    if (title) query.title = { $regex: title, $options: "i" };

    if (datePosted && datePosted !== "All") {
      const days =
        datePosted === "Last 24 hours"
          ? 1
          : datePosted === "Last 3 days"
            ? 3
            : 7;
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);
      query.createdAt = { $gte: dateLimit };
    }

    if (minSalary) query.salary = { $gte: parseInt(minSalary) };
    if (workMode && workMode !== "All") query.workMode = workMode;
    if (workType && workType !== "All") query.workType = workType;
    if (workShift && workShift !== "All") query.workShift = workShift;
    if (department && department !== "All")
      query.department = { $regex: department, $options: "i" };

    // --- NEW FILTER LOGIC INTEGRATED HERE ---
    if (roleCategory && roleCategory !== "All") query.roleCategory = roleCategory;
    if (seniorityLevel && seniorityLevel !== "All") query.seniorityLevel = seniorityLevel;
    if (industry && industry !== "All") query.industry = industry;

    let sortOption = { createdAt: -1 };
    if (sortBy === "Salary - High to low") sortOption = { salary: -1 };
    if (sortBy === "Relevant") sortOption = { title: 1 };

    const jobs = await Job.find(query)
      .sort(sortOption)
      .populate("employer", "name location logoUrl")
      .populate("companyId", "name logo location industry");
      
    res.status(200).json(jobs);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching jobs", error: err.message });
  }
};

// --- GET JOB BY TITLE ---
export const getJobByTitle = async (req, res) => {
  try {
    const titleSlug = req.params.title;
    const searchName = titleSlug.split("-").join(" ");

    const job = await Job.findOne({
      title: { $regex: new RegExp(`^${searchName}$`, "i") },
    })
      .populate("employer", "name location logoUrl")
      .populate("companyId", "name logo location industry");

    if (!job) return res.status(404).json({ message: "Job not found." });

    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --- GET JOB BY ID (THE FIX FOR VIEW COUNTING) ---
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Job ID format" });
    }

    // 1. Fetch Job Data (Without incrementing views yet)
    const job = await Job.findById(id)
      .populate("employer", "name location description logoUrl")
      .populate("companyId", "name logo location industry");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // 2. SMART VIEW COUNTING LOGIC 🧠
    // We need to identify the user even if the route is public
    let userId = req.user ? req.user._id.toString() : null;

    // If req.user is missing (public route), try decoding token manually
    if (
      !userId &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (error) {
        userId = null;
      }
    }

    // 3. APPLY LOGIC: Only increment if User Exists AND isn't Owner AND hasn't viewed before
    if (userId) {
      const employerId = job.employer._id.toString();

      // Condition A: Viewer is NOT the employer who posted it
      if (userId !== employerId) {
        // Condition B: Check if this user has ALREADY viewed this job
        const hasViewed = await Job.findOne({
          _id: id,
          viewedBy: userId,
        });

        if (!hasViewed) {
          // Condition C: Unique Viewer -> Increment & Add to History
          await Job.updateOne(
            { _id: id },
            {
              $inc: { views: 1 },
              $push: { viewedBy: userId },
            },
          );

          // Update local variable so UI shows it immediately
          job.views = (job.views || 0) + 1;
        }
      }
    }

    res.status(200).json(job);
  } catch (error) {
    console.error("Error fetching single job:", error);
    res
      .status(500)
      .json({ message: "Server error fetching job", error: error.message });
  }
};

// --- APPLY FOR JOB ---
export const applyJob = async (req, res) => {
  try {
    const {
      fullName,
      totalExperienceYears,
      highestQualification,
      coverLetter,
    } = req.body;
    
    // 🔥 CRITICAL FIX: Force HTTPS for the Cloudinary URL
    const resumeUrl = req.file ? req.file.path.replace(/^http:\/\//i, 'https://') : null;
    
    const jobId = req.params.id;
    const seekerId = req.user.id;

    // POPULATE COMPANY ID to get company name for the email
    const job = await Job.findById(jobId).populate("companyId", "name");
    if (!job) return res.status(404).json({ message: "Job not found" });

    const alreadyApplied = job.detailedApplicants.some(
      (app) => app.user.toString() === seekerId,
    );
    if (alreadyApplied)
      return res.status(400).json({ message: "Already applied" });

    // Save Application Details
    job.detailedApplicants.push({
      user: seekerId,
      fullName,
      totalExperienceYears,
      highestQualification,
      coverLetter,
      resumeUrl,
      status: "Pending",
      appliedAt: new Date(),
    });

    await job.save();

    const user = await User.findById(seekerId);
    if (!user.appliedJobs) user.appliedJobs = [];
    user.appliedJobs.push(jobId);
    await user.save();

    await Notification.create({
      recipient: job.employer,
      sender: seekerId,
      type: "APPLICATION_RECEIVED",
      title: "New Application",
      message: `You have a new applicant for ${job.title}`,
      relatedJobId: job._id,
    });

    // 1. --- SEND EMAIL TO EMPLOYER (CONDITIONAL) ---
    try {
      const employer = await User.findById(job.employer);

      // 🔥 FIX: Check if employer has notifications enabled
      if (employer && employer.preferences?.emailAlerts !== false) {
        let ageText = "Not Specified";
        const seekerProfile = await SeekerProfile.findOne({ user: seekerId });
        if (seekerProfile && seekerProfile.dob) {
          const diff = Date.now() - new Date(seekerProfile.dob).getTime();
          const age = new Date(diff).getUTCFullYear() - 1970;
          ageText = `${age} Years`;
        }

        const dashboardLink = `${process.env.CLIENT_URL}/employer-applications`;
        const fullResumeLink = resumeUrl
          ? resumeUrl.startsWith("http")
            ? resumeUrl
            : `${process.env.API_URL || "http://localhost:5000"}/${resumeUrl.replace(/\\/g, "/")}`
          : null;

        await sendEmail({
          email: employer.email,
          subject: `🔥 New Application: ${fullName} applied for ${job.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
              <h2 style="color: #4f46e5; text-align: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 15px;">New Application Received</h2>
              
              <p style="font-size: 16px; color: #374151;">Hi <strong>${employer.name}</strong>,</p>
              <p style="font-size: 16px; color: #374151;">Good news! A candidate has just applied for <strong>${job.title}</strong>.</p>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="margin-top: 0; color: #111827;">Candidate Snapshot</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>Name:</strong></td><td style="padding: 8px 0; color: #111827;">${fullName}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280;"><strong>Experience:</strong></td><td style="padding: 8px 0; color: #111827;">${totalExperienceYears} Years</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280;"><strong>Qualification:</strong></td><td style="padding: 8px 0; color: #111827;">${highestQualification}</td></tr>
                </table>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                ${fullResumeLink ? `<a href="${fullResumeLink}" style="display: inline-block; margin-right: 10px; padding: 12px 24px; background-color: #f3f4f6; color: #374151; text-decoration: none; border-radius: 6px; font-weight: bold; border: 1px solid #d1d5db;">📄 Download Resume</a>` : ""}
                <a href="${dashboardLink}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Dashboard</a>
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
              <p style="font-size: 12px; color: #888; text-align: center;">You are receiving this because "Email Alerts" are enabled in your settings.</p>
            </div>
          `,
        });
      }
    } catch (empEmailErr) {
      console.error(
        "Failed to send employer notification email:",
        empEmailErr.message,
      );
    }

    // 2. --- SEND CONFIRMATION EMAIL TO SEEKER (Always sent as a receipt) ---
    try {
      const companyName = job.companyId?.name || "the company";
      await sendEmail({
        email: user.email,
        subject: `Job Application Confirmation: ${job.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Application Received</h2>
            <p>Hi ${user.name},</p>
            <p>This email is to confirm that we have successfully received your application.</p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <p style="margin: 8px 0;"><strong>Job Title:</strong> ${job.title}</p>
              <p style="margin: 8px 0;"><strong>Company:</strong> ${companyName}</p>
            </div>
            <p>The hiring team will review your application and contact you if matched.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error(
        "Failed to send application confirmation email:",
        emailError.message,
      );
    }

    res
      .status(200)
      .json({ success: true, message: "Application submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- GET MY JOBS (Robust Fix) ---
export const getMyJobs = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Smart Query: Matches Employer ID OR Company ID
    const criteria = [{ employer: userId }];
    if (user.companyId) criteria.push({ companyId: user.companyId });

    const jobs = await Job.find({ $or: criteria })
      .populate("detailedApplicants.user", "name email photoUrl")
      .populate("companyId", "name logo")
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Legacy alias
export const getEmployerJobs = getMyJobs;

// --- GET APPLIED JOBS ---
export const getAppliedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ "detailedApplicants.user": req.user.id })
      .select(
        "title companyName location locations detailedApplicants createdAt employer companyId",
      )
      .populate("companyId", "name logo")
      .populate("employer", "name logoUrl");

    const formattedJobs = jobs.map((job) => {
      const myApp = job.detailedApplicants.find(
        (app) => app.user.toString() === req.user.id,
      );
      return {
        _id: job._id,
        title: job.title,
        companyName: job.companyId?.name || "Hiring Company",
        companyLogo: job.companyId?.logo,
        location: job.locations?.[0] || "Remote",
        applicationStatus: myApp ? myApp.status : "Pending",
        appliedAt: myApp ? myApp.appliedAt : new Date(),
      };
    });

    res.json(formattedJobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- DELETE JOB ---
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (
      req.user.role !== "admin" &&
      job.employer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    // Extracted fields including NEW Interview fields from frontend
    const {
      jobId,
      applicantId,
      status,
      // Interview Details (sent when status is Shortlisted)
      interviewDate,
      interviewTime,
      interviewMode,
      interviewLink,
    } = req.body;

    // Populate company to get name for email
    const job = await Job.findById(jobId).populate("companyId", "name");
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Find the specific application sub-document
    const applicant = job.detailedApplicants.id(applicantId);
    if (!applicant) {
      return res
        .status(404)
        .json({ message: "Applicant not found in this job" });
    }

    // 1. Update Status
    applicant.status = status;

    // 2. Persist Interview Details if provided
    if (interviewDate) applicant.interviewDate = interviewDate;
    if (interviewTime) applicant.interviewTime = interviewTime;
    if (interviewMode) applicant.interviewMode = interviewMode;
    if (interviewLink) applicant.interviewLink = interviewLink;

    await job.save();

    try {
      let notifTitle = "Application Update";
      let notifMessage = `Your application status for ${job.title} has been updated to: ${status}.`;

      if (status === "Shortlisted") {
        notifMessage = `You have been shortlisted for ${job.title}. Check your email for interview details.`;
      } else if (status === "Rejected") {
        notifMessage = `Your application for ${job.title} was reviewed, but the employer decided to move forward with other candidates.`;
      }

      await Notification.create({
        recipient: applicant.user, 
        sender: job.employer,      
        type: "APPLICATION_STATUS",
        title: notifTitle,
        message: notifMessage,
        relatedJob: job._id
      });
    } catch (notifErr) {
      console.error("Failed to create in-app notification:", notifErr);
    }

    // --- EMAIL NOTIFICATION LOGIC ---
    try {
      const seeker = await User.findById(applicant.user);
      if (seeker) {
        const companyName = job.companyId?.name || "the company";

        // SCENARIO 1: SHORTLISTED (With Interview Details)
        if (status === "Shortlisted") {
          let interviewHtml = "";

          // If schedule details exist, add the box
          if (interviewDate && interviewTime) {
            interviewHtml = `
                        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bfdbfe;">
                            <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 15px;">Interview Invitation</h3>
                            <p style="margin: 8px 0; font-size: 15px;"><strong>📅 Date:</strong> ${interviewDate}</p>
                            <p style="margin: 8px 0; font-size: 15px;"><strong>⏰ Time:</strong> ${interviewTime}</p>
                            <p style="margin: 8px 0; font-size: 15px;"><strong>📍 Mode:</strong> ${interviewMode || "Online"}</p>
                            <p style="margin: 8px 0; font-size: 15px;"><strong>🔗 Link/Location:</strong> <a href="${interviewLink}" style="color: #2563eb;">${interviewLink || "Link to be shared"}</a></p>
                        </div>
                        <p>Please make sure to be available 5 minutes prior to the scheduled time.</p>
                    `;
          }

          await sendEmail({
            email: seeker.email,
            subject: `Update: You are Shortlisted for ${job.title}`,
            html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                        <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Great News!</h2>
                        <p>Hi ${seeker.name},</p>
                        <p>We are pleased to inform you that you have been <strong>shortlisted</strong> for the position of <strong>${job.title}</strong> at <strong>${companyName}</strong>.</p>
                        
                        ${interviewHtml}

                        <p>The hiring team will be in touch shortly with any further details.</p>
                        <p style="margin-top: 30px;">Best regards,<br/><strong>The IVGJobs Team</strong></p>
                      </div>
                    `,
          });

          // SCENARIO 2: REJECTED
        } else if (status === "Rejected") {
          await sendEmail({
            email: seeker.email,
            subject: `Update on your application: ${job.title}`,
            html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                        <h2 style="color: #6b7280; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Application Update</h2>
                        <p>Hi ${seeker.name},</p>
                        <p>Thank you for giving us the opportunity to consider your application for the position of <strong>${job.title}</strong> at <strong>${companyName}</strong>.</p>
                        
                        <p>We have reviewed your application and qualifications. While your background is impressive, we have decided to move forward with other candidates who more closely match our current requirements for this specific role.</p>

                        <p>We will keep your resume in our talent pool and may contact you regarding future opportunities that align with your skills and experience.</p>
                        
                        <p>We wish you the very best in your job search.</p>
                        <p style="margin-top: 30px;">Best regards,<br/><strong>The IVGJobs Team</strong></p>
                      </div>
                    `,
          });
        }
      }
    } catch (emailErr) {
      console.error("Failed to send status update email:", emailErr);
    }

    res.json({ success: true, message: `Candidate marked as ${status}` });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getJobStatsEmployer = async (req, res) => {
  try {
    const query = req.user.companyId
      ? { companyId: req.user.companyId }
      : { employer: req.user._id };
    const jobs = await Job.find(query);
    const totalApplicants = jobs.reduce(
      (acc, job) => acc + (job.detailedApplicants?.length || 0),
      0,
    );
    const activeJobsCount = jobs.filter(
      (j) =>
        j.isActive && (!j.validUntil || new Date(j.validUntil) > new Date()),
    ).length;
    res.json({
      activeJobs: activeJobsCount,
      totalApplicants,
      totalJobs: jobs.length,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

export const getJobStatsSeeker = async (req, res) => {
  try {
    const appliedCount = await Job.countDocuments({
      "detailedApplicants.user": req.user.id,
    });
    res.json({ totalApplied: appliedCount, interviews: 0 });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// --- TOGGLE SAVE JOB (Robust) ---
export const toggleSaveJob = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const jobId = req.params.id;

    // Ensure savedJobs array exists
    if (!user.savedJobs) user.savedJobs = [];

    // Check using String comparison to be safe with ObjectIds
    const index = user.savedJobs.findIndex((id) => id.toString() === jobId);

    let isSaved = false;
    if (index !== -1) {
      // Job is currently saved, so REMOVE it
      user.savedJobs.splice(index, 1);
      isSaved = false;
    } else {
      // Job is not saved, so ADD it
      user.savedJobs.push(jobId);
      isSaved = true;
    }

    await user.save();
    res.status(200).json({ isSaved });
  } catch (error) {
    console.error("Error in toggleSaveJob:", error);
    res.status(500).json({ message: "Server error toggling save job" });
  }
};

// --- GET SAVED JOBS (Robust) ---
export const getSavedJobs = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Populate savedJobs.
    // IMPORTANT: If a job is deleted from the Jobs collection, populate returns NULL for that entry.
    const user = await User.findById(req.user._id).populate({
      path: "savedJobs",
      select:
        "title description salary amount currency workMode workType location locations companyId employer createdAt isActive",
      populate: [
        { path: "employer", select: "name logoUrl location" },
        { path: "companyId", select: "name logo location industry" },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out NULL entries (Deleted Jobs) to prevent frontend crashes
    const validSavedJobs = (user.savedJobs || []).filter((job) => job !== null);

    // Optional: Cleanup the user document to remove nulls permanently
    if (validSavedJobs.length !== (user.savedJobs || []).length) {
      user.savedJobs = validSavedJobs.map((j) => j._id);
      await user.save();
    }

    res.status(200).json(validSavedJobs);
  } catch (error) {
    console.error("Error in getSavedJobs:", error);
    res.status(500).json({
      message: "Server error fetching saved jobs",
      error: error.message,
    });
  }
};

export const updateJob = async (req, res) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedJob) return res.status(404).json({ message: "Job not found" });
    res.status(200).json(updatedJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateJobStatus = async (req, res) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true },
    );
    if (!updatedJob) return res.status(404).json({ message: "Job not found" });
    res.status(200).json(updatedJob);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const checkJobLimit = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let isExpired = false;
    if (
      user.subscriptionExpiry &&
      new Date() > new Date(user.subscriptionExpiry)
    ) {
      isExpired = true;
    }

    // Use the Helper to get Full Config
    const planConfig = await getPlanConfig(user);

    const count = await Job.countDocuments({
      employer: user._id,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      userId: user._id,
      canPost: count < planConfig.jobLimit && !isExpired,
      limit: planConfig.jobLimit,
      active: count,
      plan: user.plan || "free",
      subscriptionExpiry: user.subscriptionExpiry,
      activeDays: planConfig.activeDays,
      validity: planConfig.validity,
      isExpired: isExpired,
    });
  } catch (error) {
    console.error("Check Limit Error:", error);
    res.status(500).json({ message: "Error checking limits" });
  }
};

// --- RENEW / EXTEND JOB ---

export const getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;

    // 1. Find the Job and populate basic user info from application
    const job = await Job.findById(jobId).populate(
      "detailedApplicants.user",
      "name email photoUrl",
    );
    if (!job) return res.status(404).json({ message: "Job not found" });

    // --- 🔥 CRITICAL FIX: Filter out null users (Deleted Accounts) ---
    const validApplications = job.detailedApplicants.filter(app => app.user);

    // 2. Extract Applicant User IDs (Only from valid applications)
    const applicantUserIds = validApplications.map((app) => app.user._id);

    // 3. Fetch Full Profiles for these Users
    // This is crucial to get Work History, Bio, Education array, etc.
    const profiles = await SeekerProfile.find({
      user: { $in: applicantUserIds },
    });

    // 4. Merge Data (Application Data + Profile Data)
    const enrichedApplicants = validApplications.map((app) => {
      // Find matching profile for this user
      // Note: app.user is guaranteed to exist here due to the filter above
      const profile = profiles.find(
        (p) => p.user.toString() === app.user._id.toString(),
      );

      return {
        _id: app._id,
        user: app.user, // { name, email, photoUrl }
        status: app.status,
        appliedAt: app.appliedAt,

        // --- 1. Resume & Contact ---
        resumeUrl: app.resumeUrl || profile?.resumeUrl,
        phone: app.phone || profile?.phone || app.user.email,
        portfolio: profile?.portfolio || "",

        // --- 2. Key Metrics ---
        // Prefer application data if specific to job, else profile
        experience:
          app.totalExperienceYears || profile?.totalExperienceYears || 0,
        headline: profile?.headline || "Applicant",
        skills: profile?.skills || [],
        location: profile?.location || "Unknown",
        techLevel: profile?.techLevel || "Intermediate",

        // --- 3. Detailed Arrays (THE MISSING DATA) ---
        // Ensure these are arrays so .map() works in frontend
        workExperience: profile?.workExperience || [],
        education: profile?.education || [],
        languages: profile?.languages || [],

        // --- 4. Other Metadata ---
        bio: profile?.bio || app.coverLetter || "", // Use cover letter as bio fallback
        coverLetter: app.coverLetter,
        workType: profile?.workType || "Any",
        availability: profile?.availability || "Immediate",
        expectedCompensation: profile?.expectedCompensation || "Negotiable",
        workMode: profile?.workMode || "Flexible",
        healthConsiderations: profile?.healthConsiderations || "",
        dob: profile?.dob,

        // --- 5. Computed Fields for Quick View ---
        lastCompany: profile?.workExperience?.[0]?.company || "N/A",
        highestQualification:
          app.highestQualification || profile?.education?.[0]?.degree || "N/A",
      };
    });

    res.json(enrichedApplicants);
  } catch (error) {
    console.error("Fetch Applicants Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const extendJob = async (req, res) => {
  try {
    const { jobId, days } = req.body;
    const user = await User.findById(req.user._id);

    // 1. Permission Check
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (
      job.employer.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 2. CREDIT CHECK: Make sure they have at least 1 credit
    if (!user.credits || user.credits < 1) {
      return res.status(403).json({
        code: "NO_CREDITS",
        message:
          "Insufficient credits. Please purchase a pack to extend this job.",
      });
    }

    // 3. DEDUCT CREDIT
    user.credits = user.credits - 1;
    await user.save();

    // 4. EXTEND VALIDITY
    // If expired, start from NOW. If active, add to existing date.
    const baseDate =
      job.isActive && new Date(job.validUntil) > new Date()
        ? new Date(job.validUntil)
        : new Date();

    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + (Number(days) || 30));

    job.validUntil = newExpiry;
    job.isActive = true;
    job.deadlineReminderSent = false;
    job.expiryNotificationSent = false;

    await job.save();

    res.status(200).json({
      success: true,
      message: "Job extended! 1 Credit deducted.",
      validUntil: job.validUntil,
      remainingCredits: user.credits,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
