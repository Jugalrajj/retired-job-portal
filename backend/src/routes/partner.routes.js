import express from "express";
import multer from "multer";
import PartnerCompany from "../models/PartnerCompany.model.js";
import { protect, admin as adminOnly } from "../middleware/auth.middleware.js"; // Your existing auth middleware

const router = express.Router();

// --- MULTER CONFIG FOR LOGO UPLOAD ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"), // Ensure 'uploads/' folder exists
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// --- GET ALL PARTNERS (Public or Admin) ---
router.get("/", async (req, res) => {
  try {
    const partners = await PartnerCompany.find({}).sort({ createdAt: -1 });
    res.json(partners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- ADD NEW PARTNER (Admin Only) ---
router.post("/", protect, adminOnly, upload.single("logo"), async (req, res) => {
  try {
    const { name } = req.body;
    if (!req.file) return res.status(400).json({ message: "Logo is required" });

    const newPartner = await PartnerCompany.create({
      name,
      logo: req.file.path, // Save file path
    });

    res.status(201).json(newPartner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- DELETE PARTNER (Admin Only) ---
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await PartnerCompany.findByIdAndDelete(req.params.id);
    res.json({ message: "Partner deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;