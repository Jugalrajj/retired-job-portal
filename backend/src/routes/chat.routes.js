import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js"; // Reusing your Cloudinary logic!
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  initiateChat, 
  sendFileMessage, 
  getUnreadChatCount 
} from "../controllers/chat.controller.js";

const router = express.Router();

// --- PROTECTED ROUTES ---
router.get("/conversations", protect, getConversations);
router.post("/init", protect, initiateChat);
router.get("/unread", protect, getUnreadChatCount);

// Use the Cloudinary upload middleware here
router.post("/upload", protect, upload.single("attachment"), sendFileMessage);

router.get("/:conversationId", protect, getMessages);
router.post("/", protect, sendMessage); 

export default router;