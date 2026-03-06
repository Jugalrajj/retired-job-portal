import Notification from "../models/Notification.js";

// GET: Fetch all notifications for the logged-in user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }) // Uses _id from auth middleware
      .sort({ createdAt: -1 }) // Newest first
      .limit(50);
    
    res.status(200).json(notifications);
  } catch (err) {
    console.error("Fetch Notif Error:", err);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// GET: Count unread messages (for the red dot)
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: "Error counting notifications" });
  }
};

// PATCH: Mark a notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) return res.status(400).json({ message: "ID required" });

    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error updating notification" });
  }
};