import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url"; 
import http from "http"; // 1. IMPORT HTTP MODULE
import { Server } from "socket.io"; // 2. IMPORT SOCKET.IO SERVER
import connectDB from "./src/config/db.js";

// Route Imports
import authRoutes from "./src/routes/auth.routes.js";
import jobRoutes from "./src/routes/job.routes.js";
import companyRoutes from "./src/routes/company.routes.js";
import contactRoutes from "./src/routes/contact.routes.js";
import employerRoutes from "./src/routes/employerRoutes.js";
import seekerRoutes from "./src/routes/seekerRoutes.js";
import userRoutes from "./src/routes/userRoutes.js"; 
import notificationRoutes from "./src/routes/notificationRoutes.js"; 
import chatRoutes from "./src/routes/chat.routes.js"; 
import adminRoutes from "./src/routes/admin.routes.js";
import configRoutes from "./src/routes/configRoutes.js";
import uploadRoutes from "./src/routes/upload.routes.js"; 
import partnerRoutes from "./src/routes/partner.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import widgetRoutes from "./src/routes/widget.routes.js"; 
import couponRoutes from "./src/routes/coupon.routes.js"; 

// --- NEW: CRON JOB IMPORT ---
import initScheduledJobs from "./src/utils/cronJobs.js"; 

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// 4. CREATE HTTP SERVER (Wraps Express App)
const server = http.createServer(app);

// 5. INITIALIZE SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- SOCKET.IO LOGIC ---
const userSocketMap = {}; // Maps userId -> socketId

io.on("connection", (socket) => {

  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }

  // Handle sending messages
  socket.on("sendMessage", (messageData) => {
    const receiverSocketId = userSocketMap[messageData.recipientId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", messageData);
    }
  });

  socket.on("disconnect", () => {
    if (userId) delete userSocketMap[userId];
  });
});

// Make 'io' accessible in routes
app.set("io", io);

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);       
app.use("/api/users", userRoutes);     
app.use("/api/companies", companyRoutes);
app.use("/api/contact", contactRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/seekers', seekerRoutes);
app.use("/api/notifications", notificationRoutes);
// FIX: Changed "/api/chat" to "/api/chats" to match Frontend
app.use("/api/chats", chatRoutes); // 6. MOUNT CHAT ROUTES
app.use("/api/widget", widgetRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/config", configRoutes);
app.use("/api/upload", uploadRoutes); // <--- MOUNTED UPLOAD ROUTE HERE
app.use("/api/partners", partnerRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/coupons", couponRoutes); // <--- FIXED: Use couponRoutes instead of paymentRoutes


app.get("/", (req, res) => {
  res.send("Job Portal API running");
});

// --- INITIALIZE CRON JOBS ---
initScheduledJobs();

const startServer = async () => {
  try {
    await connectDB();
    // 7. IMPORTANT: LISTEN ON SERVER, NOT APP
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();