import express from "express";
import multer from "multer";
import path from "path";

import {
  createJob,
  getJobs,
  getJobById,
  getJobByTitle,
  getEmployerJobs,
  updateApplicationStatus,
  applyJob,
  getAppliedJobs,
  deleteJob,
  getJobStatsEmployer,
  getJobStatsSeeker,
  toggleSaveJob,
  getSavedJobs,
  updateJobStatus,
  updateJob,
  checkJobLimit,
  getJobApplicants,
  extendJob
} from "../controllers/job.controller.js";

import {
  getTeamMembers,
  inviteMember,
  updateMemberPermissions,
  removeMember,
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import {
  authorizeRoles,
  checkPermission,
} from "../middleware/role.middleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/resumes/"),
  filename: (req, file, cb) =>
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    ),
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed!"), false);
  },
});

// --- 1. SPECIFIC ROUTES (Must be defined before /:id) ---

router.get("/", getJobs);
router.get("/view/:title", getJobByTitle);

router.get(
  "/stats/employer",
  protect,
  authorizeRoles("employer"),
  getJobStatsEmployer
);

// 🔥 FIX: Allow 'jobseeker' AND 'seeker'
router.get(
  "/stats/seeker",
  protect,
  authorizeRoles("jobseeker", "seeker"), 
  getJobStatsSeeker
);

router.post(
  "/",
  protect,
  authorizeRoles("employer"),
  checkPermission("post_jobs"),
  createJob
);

router.get(
  "/employer/posted",
  protect,
  authorizeRoles("employer"),
  getEmployerJobs
);

// Specific Status Update Route
router.patch(
  "/application-status",
  protect,
  authorizeRoles("employer"),
  checkPermission("update_status"),
  updateApplicationStatus
);

// Other employer routes
router.patch("/status", protect, updateApplicationStatus);
router.get("/:jobId/applicants", protect, getJobApplicants);

// --- EXTEND ROUTE ---
router.post("/extend", protect, authorizeRoles("employer"), extendJob);

// Team Management
router.get("/team", protect, authorizeRoles("employer"), getTeamMembers);
router.post(
  "/team/invite",
  protect,
  authorizeRoles("employer"),
  checkPermission("manage_team"),
  inviteMember
);
router.put("/team/:id/permissions", protect, updateMemberPermissions);
router.delete(
  "/team/:id",
  protect,
  authorizeRoles("employer"),
  checkPermission("manage_team"),
  removeMember
);

// 🔥 FIX: Allow 'jobseeker' AND 'seeker' for fetching applied jobs
router.get("/applied", protect, authorizeRoles("jobseeker", "seeker"), getAppliedJobs);

router.get("/saved", protect, getSavedJobs);
router.get("/check-limit", protect, checkJobLimit);

// --- 2. GENERIC ROUTES (Using /:id) ---

router.patch('/:id/status', updateJobStatus);
router.patch('/:id', updateJob);

// 🔥 FIX: Allow 'jobseeker' AND 'seeker' to apply
router.post(
  "/apply/:id",
  protect,
  authorizeRoles("jobseeker", "seeker"),
  upload.single("resume"),
  applyJob
);

router.post("/save/:id", protect, toggleSaveJob);

// Admin Delete
router.delete('/:id', protect, authorizeRoles('employer', 'admin'), deleteJob);

// Get by ID (Last to avoid conflicts)
router.get("/:id", getJobById);

export default router;