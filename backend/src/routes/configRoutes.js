import express from "express";
import JobConfig from "../models/JobConfig.js";
import Job from "../models/Job.model.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// ==================================================================
// 1. GET FULL CONFIG
// ==================================================================
router.get("/", async (req, res) => {
  try {
    let config = await JobConfig.findOne();
    if (!config) {
      config = await JobConfig.create({});
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================================================================
// 2. GET ONLY CATEGORIES LIST
// ==================================================================
router.get("/categories", async (req, res) => {
  try {
    let config = await JobConfig.findOne();
    if (!config) config = await JobConfig.create({});
    res.json(config.categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================================================================
// 3. GET CATEGORIES WITH JOB COUNTS
// ==================================================================
router.get("/categories-public", async (req, res) => {
  try {
    let config = await JobConfig.findOne();
    if (!config) config = await JobConfig.create({});

    const categoriesWithCounts = await Promise.all(
      config.categories.map(async (cat) => {
        const count = await Job.countDocuments({
          department: cat.title,
          isActive: true,
        });
        return { ...cat.toObject(), jobCount: count };
      }),
    );

    res.json(categoriesWithCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================================================================
// 4. CREDIT SYSTEM ROUTES
// ==================================================================

router.get("/credits", async (req, res) => {
  try {
    let config = await JobConfig.findOne();
    if (!config) {
      config = await JobConfig.create({});
    }
    res.json(config.creditSystem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/credits", protect, admin, async (req, res) => {
  try {
    const { subscriptions, packs } = req.body;

    const config = await JobConfig.findOneAndUpdate(
      {},
      {
        $set: {
          "creditSystem.subscriptions": subscriptions,
          "creditSystem.packs": packs,
        },
      },
      { new: true, upsert: true },
    );
    res.json(config.creditSystem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================================================================
// 5. ADD ITEM (Generic Handler - Prevents Duplicates)
// ==================================================================
router.post("/add", protect, admin, async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || !value)
      return res.status(400).json({ message: "Invalid Data" });

    // A. Handle "Categories" (Object Array)
    if (key === "categories") {
      // Manual check for duplicates by Title (Case Insensitive)
      const exists = await JobConfig.findOne({
        "categories.title": { $regex: new RegExp(`^${value.title}$`, "i") },
      });

      if (exists) {
        return res.status(400).json({ message: "Category already exists" });
      }

      const config = await JobConfig.findOneAndUpdate(
        {},
        { $push: { categories: value } },
        { new: true, upsert: true },
      );
      return res.json(config);
    }

    // B. Handle Simple Dropdowns (String Arrays)
    // $addToSet automatically PREVENTS duplicates in the database array
    const config = await JobConfig.findOneAndUpdate(
      {},
      { $addToSet: { [key]: value } },
      { new: true, upsert: true },
    );
    res.json(config);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ==================================================================
// 6. REMOVE ITEM
// ==================================================================
router.post("/remove", protect, admin, async (req, res) => {
  try {
    const { key, value } = req.body;

    // A. Handle "Categories" (Remove by ID)
    if (key === "categories" || key === "educationCategories") {
      // 🔥 FIXED: Added educationCategories
      const config = await JobConfig.findOneAndUpdate(
        {},
        { $pull: { [key]: { _id: value } } }, // 🔥 FIXED: Dynamic key removal
        { new: true },
      );
      return res.json(config);
    }

    // B. Handle Simple Dropdowns (Remove by String Value)
    const config = await JobConfig.findOneAndUpdate(
      {},
      { $pull: { [key]: value } },
      { new: true },
    );
    res.json(config);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ==================================================================
// 7. UPDATE ITEM (Category Update)
// ==================================================================
router.put("/categories/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const config = await JobConfig.findOne();

    if (!config) {
      return res
        .status(404)
        .json({ success: false, message: "Configuration not found" });
    }

    // Find the exact category inside the array
    const categoryIndex = config.categories.findIndex(
      (cat) => cat._id.toString() === id,
    );

    if (categoryIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Update the category's fields while preserving the existing _id
    config.categories[categoryIndex] = {
      ...config.categories[categoryIndex].toObject(),
      ...updateData,
    };

    // Save the updated document
    await config.save();

    // Return the updated config document to the frontend
    res.status(200).json(config);
  } catch (error) {
    console.error("Error updating category:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update category" });
  }
});

router.get("/razorpay-key", (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

export default router;
