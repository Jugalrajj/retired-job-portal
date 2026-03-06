// utils/sendEmail.js
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  const mailOptions = {
    from: `"IVGJobs Portal" <${process.env.EMAIL_USER}>`, 
    to: options.email, 
    subject: options.subject, 
    text: options.message, 
    html: options.html, 
    // 🔥 ADD THIS: This allows the PDF to be sent as an attachment
    attachments: options.attachments || [], 
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;