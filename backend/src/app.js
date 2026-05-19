import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(express.json());

// List all the URLs that are allowed to access your backend
const allowedOrigins = [
  "http://localhost:5173",      // For your local development
  "https://ivjobs.vercel.app",  // For your live Vercel frontend
  process.env.FRONTEND_URL      // Optional: Best practice for environment variables
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl) or if it's in our list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Crucial if you are using cookies/sessions
  })
);

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Job Portal API running");
});

export default app;