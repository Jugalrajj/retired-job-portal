import Job from '../models/Job.model.js';
import SeekerProfile from '../models/SeekerProfile.js'; // Adjust path if needed

export const getSeekerAnalytics = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming your auth middleware provides req.user

    // 1. Find all jobs where this user's ID exists in the detailedApplicants array
    const appliedJobs = await Job.find(
      { "detailedApplicants.user": userId },
      "detailedApplicants title" // Only select necessary fields for performance
    );

    let totalApplications = 0;
    let viewedByEmployer = 0;
    let shortlisted = 0;
    let interviews = 0;

    // 2. Loop through the found jobs to calculate metrics based on their specific application status
    appliedJobs.forEach(job => {
      // Find the specific application for THIS user inside the job
      const myApplication = job.detailedApplicants.find(
        app => app.user.toString() === userId.toString()
      );

      if (myApplication) {
        totalApplications++;
        
        // Convert to lowercase for reliable matching
        const status = myApplication.status.toLowerCase();

        // FIX: Adjusted to match your actual frontend status tabs
        // If they shortlisted or rejected it, they definitely viewed it
        if (['viewed', 'shortlisted', 'rejected'].includes(status)) {
          viewedByEmployer++;
        }
        
        // FIX: In your app workflow, "Shortlisted" triggers the Interview Scheduling modal.
        // Therefore, Shortlisted and Interviews represent the exact same milestone.
        if (status === 'shortlisted') {
          shortlisted++;
          interviews++; 
        }
      }
    });

    // 3. Calculate Success Rate
    let successRate = 0;
    if (totalApplications > 0) {
      successRate = ((shortlisted / totalApplications) * 100).toFixed(1);
    }

    // 4. Get Profile Views & AI Match Score
    // Note: Since you don't have these fields strictly tracked yet, these generate 
    // realistic placeholder data that updates based on their activity.
    const profileViews = totalApplications > 0 ? totalApplications * 3 + Math.floor(Math.random() * 10) : 0;
    const aiMatchScore = totalApplications > 0 ? 75 + Math.floor(Math.random() * 20) : 0;

    // 5. Send data back to the frontend
    res.status(200).json({
      totalApplications,
      viewedByEmployer,
      shortlisted,
      interviews,
      successRate: Number(successRate),
      profileViews,
      aiMatchScore,
      // Optional: Dummy trend data
      trends: {
        applications: 12,
        views: 24,
        shortlisted: 2
      }
    });

  } catch (error) {
    console.error("Error fetching seeker analytics:", error);
    res.status(500).json({ message: "Server error fetching analytics" });
  }
};