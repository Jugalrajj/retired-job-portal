import cron from "node-cron";
import Job from "../models/Job.model.js";
import sendEmail from "./sendEmail.js";

// Run every day at Midnight (00:00)
const initScheduledJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("⏳ Running Job Expiry & Reminder Checks...");

    try {
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);

      // ====================================================
      // 1. APPLICATION DEADLINE REMINDER (3 Days Before)
      // ====================================================
      // Find jobs expiring between Now and 3 Days from now, where reminder hasn't been sent
      const jobsDueForReminder = await Job.find({
        isActive: true,
        validUntil: { $lte: threeDaysFromNow, $gt: now }, 
        deadlineReminderSent: false 
      }).populate("employer", "email name");

      for (const job of jobsDueForReminder) {
        if (job.employer && job.employer.email) {
          const extendLink = `${process.env.CLIENT_URL}/dashboard/manage-jobs?action=extend&jobId=${job._id}`;
          
          await sendEmail({
            email: job.employer.email,
            subject: `⚠️ Action Required: '${job.title}' Expires in 3 Days`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px;">
                <h2 style="color: #f59e0b;">⏳ Time is Running Out</h2>
                <p>Hi ${job.employer.name},</p>
                <p>This is a friendly reminder that your job listing for <strong>${job.title}</strong> is set to expire on <strong>${new Date(job.validUntil).toDateString()}</strong>.</p>
                
                <div style="background-color: #fffbeb; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #fcd34d;">
                  <strong>Why extend?</strong>
                  <ul style="margin-top: 5px; padding-left: 20px; color: #4b5563;">
                    <li>Keep receiving fresh applications</li>
                    <li>Maintain your ranking in search results</li>
                    <li>Avoid having to repost from scratch</li>
                  </ul>
                </div>

                <div style="text-align: center; margin-top: 25px;">
                  <a href="${extendLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Extend Job Listing</a>
                </div>
                <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">If you do nothing, the job will automatically close on the expiry date.</p>
              </div>
            `
          });
          
          // Update Flag
          job.deadlineReminderSent = true;
          await job.save();
        }
      }

      // ====================================================
      // 2. JOB EXPIRED NOTIFICATION (Immediately After Expiry)
      // ====================================================
      // Find active jobs where validity has passed
      const expiredJobs = await Job.find({
        isActive: true,
        validUntil: { $lt: now }, 
        expiryNotificationSent: false
      }).populate("employer", "email name");

      for (const job of expiredJobs) {
        if (job.employer && job.employer.email) {
          const renewLink = `${process.env.CLIENT_URL}/dashboard/manage-jobs?action=renew&jobId=${job._id}`;

          await sendEmail({
            email: job.employer.email,
            subject: `🚫 Job Closed: '${job.title}' Has Expired`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px;">
                <h2 style="color: #ef4444;">Job Listing Expired</h2>
                <p>Hi ${job.employer.name},</p>
                <p>Your job listing for <strong>${job.title}</strong> has expired and is no longer visible to candidates.</p>
                
                <p>Did you fill the position? If not, you can renew the listing instantly to get it back in front of candidates.</p>

                <div style="text-align: center; margin-top: 25px;">
                  <a href="${renewLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Renew / Repost Job</a>
                </div>
                
                <p style="margin-top: 20px; text-align: center;">
                  <a href="${process.env.CLIENT_URL}/dashboard" style="color: #6b7280; text-decoration: underline;">Go to Dashboard</a>
                </p>
              </div>
            `
          });

          // Mark as sent and DEACTIVATE the job
          job.expiryNotificationSent = true;
          job.isActive = false; 
          await job.save();
        }
      }

      console.log(`✅ Cron Check Complete: Reminded ${jobsDueForReminder.length}, Expired ${expiredJobs.length}`);

    } catch (error) {
      console.error("❌ Cron Job Error:", error);
    }
  });
};

export default initScheduledJobs;