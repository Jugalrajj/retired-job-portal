import express from "express";
import { protect } from "../middleware/auth.middleware.js"; // Ensure this path matches your auth middleware
import { getNotifications, getUnreadCount, markAsRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.get("/unread", protect, getUnreadCount);
router.patch("/read", protect, markAsRead);

export default router;