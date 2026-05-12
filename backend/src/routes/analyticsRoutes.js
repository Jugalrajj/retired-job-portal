import express from 'express';
import { getSeekerAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.middleware.js'; // Ensure you import your auth middleware

const router = express.Router();

// Route: GET /api/analytics/seeker
// Requires user to be logged in (protect middleware)
router.get('/seeker', protect, getSeekerAnalytics);

export default router;