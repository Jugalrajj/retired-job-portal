import express from "express";
// 1. Import Settings Controllers
import { 
  updateUserProfile, 
  changePassword, 
  updateUserPreferences 
} from "../controllers/userController.js";

// 2. Import Admin/Team Controllers (from Auth Controller)
import { 
  getAllUsers, 
  toggleUserStatus 
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// --- 1. TALENT POOL & ADMIN ROUTES ---
router.get("/", protect, getAllUsers); 

router.patch("/status/:id", protect, authorizeRoles("admin"), toggleUserStatus);


// --- 2. ACCOUNT SETTINGS ROUTES ---

// Update Profile (Name, Phone, Bio)
// router.put("/profile", protect, updateUserProfile);
router.put("/profile", protect, upload.single("photo"), updateUserProfile);

// Change Password
router.post("/change-password", protect, changePassword);

// Update Preferences
router.put("/preferences", protect, updateUserPreferences);

export default router;