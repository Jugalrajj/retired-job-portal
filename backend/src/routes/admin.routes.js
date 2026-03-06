import express from "express";
import User from "../models/User.model.js";
import Job from "../models/Job.model.js";

// Import Middleware
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// PROTECT ALL ADMIN ROUTES
router.use(protect, authorizeRoles("admin"));

// --- DASHBOARD STATS ---
router.get("/stats", async (req, res) => {
  try {
    const users = await User.countDocuments();
    const jobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ isActive: true });
    
    res.json({ totalUsers: users, totalJobs: jobs, activeJobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- MANAGE USERS ---
router.get("/users", async (req, res) => {
  try {
    // Fetches all users with their photos
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Job.deleteMany({ employer: req.params.id }); 
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- MANAGE JOBS (FIXED EMPLOYER FETCH) ---
router.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find()
      // 🔥 FIX: Changed 'postedBy' to 'employer' AND added 'photoUrl'
      .populate("employer", "name email mobile photoUrl") 
      .populate("companyId", "name logo")
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- GET APPLICANTS FOR A JOB ---
router.get("/jobs/:id/applicants", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate({
      path: "detailedApplicants.user",
      select: "name email photoUrl mobile" // Ensure photoUrl is fetched for applicants too
    });
    
    if (!job) return res.status(404).json({ message: "Job not found" });

    res.json(job.detailedApplicants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- DELETE JOB ---
router.delete("/jobs/:id", async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- EDIT JOB ---
router.put("/jobs/:id", async (req, res) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;