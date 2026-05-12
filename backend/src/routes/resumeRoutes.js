import express from "express";
import { generateAiResume, generateSectionAi } from "../controllers/resumeController.js";
// Import your auth middleware if you want to restrict this to logged-in users only
// import { protect } from "../middleware/authMiddleware.js"; 

const router = express.Router();

// Route: POST /api/resume/generate
router.post("/generate", generateAiResume); 
router.post('/generate-section', generateSectionAi);


export default router;