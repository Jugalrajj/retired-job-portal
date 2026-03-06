import Company from "../models/Company.model.js";
import Job from "../models/Job.model.js";

export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.aggregate([
      {
        $lookup: {
          from: "jobs",                // MUST be lowercase
          localField: "_id",
          foreignField: "companyId",
          as: "jobs"
        }
      },
      {
        $addFields: {
          jobCount: {
            $size: {
              $filter: {
                input: "$jobs",
                as: "job",
                cond: { $eq: ["$$job.isActive", true] }
              }
            }
          }
        }
      },
      {
        $project: {
          jobs: 0   // remove heavy array from response
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json(companies);
  } catch (error) {
    console.error("Company Filter Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
