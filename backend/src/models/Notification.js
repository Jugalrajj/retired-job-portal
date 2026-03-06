import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true // User receiving the alert
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User" // Optional: System notifications might not have a sender
  },
  type: {
    type: String,
    enum: ["JOB_APPLIED", "APPLICATION_RECEIVED", "APPLICATION_STATUS","STATUS_UPDATE", "MESSAGE", "SYSTEM", "ALERT"], 
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  // Optional linking
  relatedJob: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Notification", NotificationSchema);