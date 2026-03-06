import express from 'express';
import EmployerProfile from '../models/EmployerProfile.js';
import { protect } from '../middleware/auth.middleware.js'; // Use your actual auth middleware
import { createEmployerProfile, getEmployerProfile } from '../controllers/employerController.js';
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// Configure Multer to save to Cloudinary instead of 'uploads/'
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ivgjobs_uploads/employer_logos",
    resource_type: "auto",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "avif"]
  }
});

const upload = multer({ storage: storage });

// Handle Multipart Form Data (Fields + Logo File)
// 'logo' must match the key used in FormData in frontend
router.post("/profile", protect, upload.single('logo'), createEmployerProfile);

// GET: Fetch Existing (NEW)
router.get("/profile", protect, getEmployerProfile);

// The path here is /profile because in server.js you used /api/employers
router.post('/profile', protect, async (req, res) => {
  try {
    // req.user._id comes from your protect/auth middleware
    const userId = req.user._id; 

    // Cloudinary logo URL if uploaded
    const logoUrl = req.file ? req.file.path : null;

    // Find existing profile or create new one (Upsert)
    const profile = await EmployerProfile.findOneAndUpdate(
      { user: userId },
      { ...req.body, user: userId, logo: logoUrl },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ 
      success: true, 
      message: "Profile updated successfully", 
      profile 
    });

  } catch (err) {
    console.error("Employer Profile Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: err.message 
    });
  }
});

// Added GET route so you can fetch details back to the form
router.get('/my-profile', protect, async (req, res) => {
  try {
    const profile = await EmployerProfile.findOne({ user: req.user._id });
    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});

export default router;