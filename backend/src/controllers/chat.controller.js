import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.model.js"; // Import User model
import sendEmail from "../utils/sendEmail.js"; // Import Email Utility

// --- 1. Get All Conversations ---
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ participants: userId })
      .populate({
        path: "participants",
        select: "name photoUrl role companyId",
        populate: { path: "companyId", select: "name logo" }
      })
      .sort({ updatedAt: -1 });

    const formatted = await Promise.all(conversations.map(async (conv) => {
      const otherUser = conv.participants.find(p => p._id.toString() !== userId.toString());
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id, sender: { $ne: userId }, isRead: false
      });
      return { ...conv._doc, otherUser, unreadCount };
    }));
    res.status(200).json(formatted);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- 2. Get Messages ---
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    const unreadMessages = messages.filter(msg => msg.sender.toString() !== userId.toString() && !msg.isRead);

    if (unreadMessages.length > 0) {
      await Message.updateMany({ _id: { $in: unreadMessages.map(m => m._id) } }, { $set: { isRead: true } });
      const io = req.app.get("io"); 
      if (io) io.emit("messagesRead", { conversationId }); 
    }
    res.status(200).json(messages);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- 3. Send Message (UPDATED WITH NOTIFICATION LOGIC) ---
export const sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    const senderId = req.user._id;
    
    // Find or create conversation
    let conversation = await Conversation.findOne({ participants: { $all: [senderId, recipientId] } });

    if (!conversation) {
      conversation = new Conversation({ participants: [senderId, recipientId] });
      await conversation.save();
    }

    const newMessage = new Message({ conversationId: conversation._id, sender: senderId, text });
    
    await Promise.all([
      newMessage.save(),
      conversation.updateOne({ lastMessage: { text, sender: senderId } }),
    ]);
    
    const populatedMessage = await newMessage.populate("sender", "name photoUrl");

    // --- 🔔 NOTIFICATION LOGIC START ---
    // Rule: Only send email if Sender is Employer/Recruiter AND Recipient is Seeker
    const senderRole = req.user.role;
    const isSenderEmployer = senderRole === 'employer' || senderRole === 'recruiter' || senderRole === 'admin';

    if (isSenderEmployer) {
        try {
            const recipient = await User.findById(recipientId);
            
            // Check if recipient is Seeker AND has Email Alerts enabled (default to true if undefined)
            const isSeeker = recipient.role === 'jobseeker' || recipient.role === 'seeker';
            
            // 🔥 STRICT CHECK: Only send if emailAlerts is NOT strictly false
            const alertsEnabled = recipient.preferences?.emailAlerts !== false; 

            if (recipient && isSeeker && alertsEnabled) {
                await sendEmail({
                    email: recipient.email,
                    subject: `New Message from ${req.user.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #e5e7eb; border-radius: 8px;">
                            <h2 style="color: #4f46e5; margin-top: 0;">You have a new message</h2>
                            <p>Hi ${recipient.name},</p>
                            <p><strong>${req.user.name}</strong> from ${req.user.companyId?.name || "a company"} has sent you a message.</p>
                            
                            <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #4f46e5; margin: 15px 0; font-style: italic; color: #555;">
                                "${text.length > 100 ? text.substring(0, 100) + '...' : text}"
                            </div>

                            <p style="margin-bottom: 25px;">Log in to your dashboard to reply.</p>
                            
                            <a href="${process.env.CLIENT_URL}/messages" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Messages</a>
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
                            <p style="font-size: 12px; color: #888;">To stop receiving these emails, disable "Email Alerts" in your Settings.</p>
                        </div>
                    `
                });
            }
        } catch (emailErr) {
            console.error("Failed to send chat notification email:", emailErr.message);
            // Don't block the response, just log the error
        }
    }
    // --- 🔔 NOTIFICATION LOGIC END ---

    res.status(201).json(populatedMessage);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- 4. Initiate Chat ---
export const initiateChat = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user._id;
    let conversation = await Conversation.findOne({ participants: { $all: [senderId, recipientId] } })
      .populate({ path: "participants", select: "name photoUrl role companyId", populate: { path: "companyId", select: "name logo" } });

    if (!conversation) {
      conversation = new Conversation({ participants: [senderId, recipientId] });
      await conversation.save();
      await conversation.populate({ path: "participants", select: "name photoUrl role companyId", populate: { path: "companyId", select: "name logo" } });
    }
    const otherUser = conversation.participants.find(p => p._id.toString() !== senderId.toString());
    res.status(200).json({ ...conversation._doc, otherUser });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- 5. Unread Count ---
export const getUnreadChatCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ participants: userId }).select('_id');
    const conversationIds = conversations.map(c => c._id);
    const count = await Message.countDocuments({ conversationId: { $in: conversationIds }, sender: { $ne: userId }, isRead: false });
    res.status(200).json({ count });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// --- 6. Send File ---
// --- 6. Send File ---
export const sendFileMessage = async (req, res) => {
  try {
    const { recipientId, conversationId, text } = req.body; 
    const senderId = req.user._id;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    let fileType = "file";
    if (file.mimetype.startsWith("image/")) fileType = "image";
    else if (file.mimetype === "application/pdf") fileType = "pdf";

    // Cloudinary file URL (Forced to HTTPS)
    const fileUrl = file.path.replace(/^http:\/\//i, 'https://');

    const attachmentData = { url: fileUrl, fileType, fileName: file.originalname };

    let conversation;
    if (conversationId) conversation = await Conversation.findById(conversationId);
    if (!conversation) conversation = await Conversation.findOne({ participants: { $all: [senderId, recipientId] } });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    const newMessage = new Message({ conversationId: conversation._id, sender: senderId, text: text || "", attachment: attachmentData });
    const previewText = text ? text : `Sent a ${fileType}`;
    
    await Promise.all([
      newMessage.save(),
      conversation.updateOne({ lastMessage: { text: previewText, sender: senderId } }),
    ]);
    
    const populatedMessage = await newMessage.populate("sender", "name photoUrl");
    res.status(201).json(populatedMessage);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};