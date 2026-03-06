// backend/routes/widget.routes.js
import express from "express";
import { handleBotQuery } from "../controllers/widget.controller.js";

const router = express.Router();

// Route: POST /api/widget/query
router.post("/query", handleBotQuery);

export default router;