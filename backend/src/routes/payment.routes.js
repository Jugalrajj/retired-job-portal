import express from "express";
import { createOrder, downloadInvoice, getPaymentHistory, verifyPayment } from "../controllers/payment.controller.js";
import { protect } from "../middleware/auth.middleware.js"; // Ensure user is logged in

const router = express.Router();

// --- ROUTE 1: Create Order ---
// Endpoint: POST /api/payment/create-order
router.post("/create-order", protect, createOrder);

// --- ROUTE 2: Verify Payment & Update Plan/Credits ---
// Endpoint: POST /api/payment/verify-payment
router.post("/verify-payment", protect, verifyPayment);

// --- 🔥 NEW ROUTES FOR HISTORY & INVOICE ---
router.get("/history", protect, getPaymentHistory);
router.get("/invoice/:paymentId", protect, downloadInvoice);

export default router;