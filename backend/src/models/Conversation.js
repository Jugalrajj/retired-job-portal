import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: {
      text: String,
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      seen: { type: Boolean, default: false },
      createdAt: { type: Date } // Useful for sorting
    },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);