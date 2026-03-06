import express from "express";
import { validateCoupon, createCoupon,getAllCoupons,deleteCoupon} from "../controllers/coupon.controller.js";
import { protect } from "../middleware/auth.middleware.js"; 

const router = express.Router();

router.post("/validate", protect, validateCoupon);
router.post("/create", protect, createCoupon); // Ideally restrict to Admin
router.get("/", getAllCoupons);
router.delete("/:id", deleteCoupon);

export default router;