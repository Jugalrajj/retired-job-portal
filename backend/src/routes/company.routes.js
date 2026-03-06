import express from "express";
import Company from "../models/Company.model.js";
import Job from "../models/Job.model.js";

const router = express.Router();

// 🔥 ADD THIS: Route to get ALL companies
router.get("/", async (req, res) => {
  try {
    const { search = "", location = "", sector = "", industry = "", type = "" } = req.query;

    let query = {};

    // Search by name OR location (case-insensitive)
    if (search.trim()) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    // Specific location filter
    if (location.trim()) {
      query.location = { $regex: location, $options: "i" };
    }

    if (sector.trim()) query.sector = sector;
    if (industry.trim()) query.industry = industry;
    if (type.trim()) query.companyType = type;

    const companies = await Company.find(query).sort({ createdAt: -1 });

    const enrichedCompanies = await Promise.all(
      companies.map(async (co) => ({
        ...co.toObject(),
        jobCount: await Job.countDocuments({ employer: co.admin })
      }))
    );

    res.json(enrichedCompanies);
  } catch (err) {
    console.error("Company Filter Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Existing route for single company profile
router.get("/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const jobs = await Job.find({ employer: company.admin });
    res.json({ company, jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;