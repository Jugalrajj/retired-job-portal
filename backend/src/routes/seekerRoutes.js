import express from 'express';
import { 
  getSeekers, 
  getSeekerProfile, 
  updateSeekerProfile,
  getPreferences,  
  updatePreferences,  
  unlockSeeker,
  getSeekerById
} from '../controllers/seekerController.js';
import { protect } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js'; 

const router = express.Router();

// 1. GET All Seekers
router.get('/', protect, getSeekers);

// 2. GET Current User Profile
router.get('/profile', protect, getSeekerProfile);
router.post("/unlock/:id", protect, unlockSeeker);

// 3. POST/UPDATE Profile
router.post(
  '/profile', 
  protect, 
  upload.fields([
    { name: 'photo', maxCount: 1 }, 
    { name: 'resume', maxCount: 1 }
  ]), 
  updateSeekerProfile
);

// 4. PREFERENCES (For Job Alerts)
router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);

router.get('/:id', protect, getSeekerById);

export default router;