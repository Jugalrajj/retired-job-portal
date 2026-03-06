import Contact from "../models/Contact.model.js";
import sendEmail from "../utils/sendEmail.js"; // 🔥 Imported sendEmail

export const submitInquiry = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    
    // 1. Save to Database
    const newInquiry = await Contact.create({ name, email, message });

    // 2. --- 🔥 SEND EMAIL TO ADMIN ---
    try {
      await sendEmail({
        email: process.env.EMAIL_USER, // Send email TO the Admin
        replyTo: email, // 🔥 Allow Admin to reply directly to the user
        subject: `New Inquiry from ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <h2 style="color: #4f46e5;">New Contact Us Message</h2>
            <p>You have received a new inquiry from the website.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <p><strong>Message:</strong></p>
            <blockquote style="border-left: 4px solid #4f46e5; margin: 0; padding-left: 15px; color: #374151; font-style: italic;">
              ${message}
            </blockquote>

            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
              You can reply to this email to contact the user directly.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send admin contact email:", emailError);
      // We don't block the response if email fails
    }
    // -----------------------------

    res.status(201).json({ success: true, message: "Inquiry received!", data: newInquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};