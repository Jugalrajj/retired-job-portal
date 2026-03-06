import express from "express";
import { 
  register, 
  login, 
  verifyOtp, // 🔥 Imported
  getMe, 
  getTeamMembers, 
  inviteMember, 
  updateMemberPermissions, 
  removeMember, 
  forgotPassword,
  resetPassword
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js"; 
import { authorizeRoles, checkPermission } from "../middleware/role.middleware.js"; 

const router = express.Router();

// Public Routes
router.post("/register", register);
router.post("/verify-otp", verifyOtp); // 🔥 New Route
router.post("/login", login);

// Private Routes
router.get("/me", protect, getMe);

// Team Management (Company Admin / Authorized Staff)
router.get("/team", protect, authorizeRoles("employer"), getTeamMembers);
router.post("/team/invite", protect, authorizeRoles("employer"), checkPermission("manage_team"), inviteMember);

router.patch(
  "/team/permissions/:id", 
  protect, 
  authorizeRoles("employer"), 
  checkPermission("manage_team"), 
  updateMemberPermissions
);

router.post("/forgot-password", forgotPassword); // 🔥 New Route
router.post("/reset-password", resetPassword);

router.delete("/team/:id", protect, authorizeRoles("employer"), checkPermission("manage_team"), removeMember);

export default router;