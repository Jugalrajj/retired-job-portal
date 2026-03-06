import React from "react";
import { Shield, Lock, Eye, FileText, Database, Bell, Mail, ChevronRight, Users, Briefcase } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="policy-page-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

        .policy-page-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root);
          color: var(--text-main);
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 60px;
        }

        /* --- BACKGROUND FX --- */
        .bg-blob {
          position: absolute; border-radius: 50%; filter: blur(120px);
          opacity: 0.15; z-index: 0; pointer-events: none;
        }
        .b1 { top: -10%; left: -10%; width: 600px; height: 600px; background: #4f46e5; }
        .b2 { top: 40%; right: -5%; width: 500px; height: 500px; background: var(--primary); }

        /* --- CONTAINER --- */
        .policy-container {
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 5;
          padding: 60px 20px;
        }

        /* --- HEADER --- */
        .policy-header {
          text-align: center;
          margin-bottom: 60px;
          animation: fadeUp 0.6s ease-out;
        }
        .policy-title {
          font-family: 'Playfair Display', serif;
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 16px;
          background: linear-gradient(135deg, var(--text-main) 0%, var(--text-sub) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .policy-subtitle {
          font-size: 1.1rem;
          color: var(--text-sub);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .last-updated {
          display: inline-block;
          margin-top: 20px;
          padding: 6px 16px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: 50px;
          font-size: 0.85rem;
          color: var(--primary);
          font-weight: 600;
        }

        /* --- SECTIONS --- */
        .policy-section {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 32px 40px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          transition: transform 0.2s ease, border-color 0.2s ease;
          animation: fadeUp 0.8s ease-out forwards;
          opacity: 0;
        }
        .policy-section:hover {
          transform: translateY(-2px);
          border-color: var(--primary-dim);
        }

        .section-head {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px dashed var(--border);
        }
        .section-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: var(--primary-dim);
          color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border);
        }
        .section-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-main);
          font-family: 'Playfair Display', serif;
        }

        .section-content {
          font-size: 1rem;
          color: var(--text-sub);
          line-height: 1.8;
        }
        .section-content p { margin-bottom: 16px; }
        .section-content ul { padding-left: 20px; margin-bottom: 16px; }
        .section-content li { margin-bottom: 12px; list-style-type: none; position: relative; padding-left: 24px; }
        .section-content li::before {
          content: "•";
          color: var(--primary);
          font-weight: bold;
          position: absolute; left: 0;
        }

        /* --- CONTACT BOX --- */
        .contact-box {
          background: linear-gradient(135deg, var(--bg-input) 0%, var(--bg-card) 100%);
          border: 1px solid var(--primary);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          margin-top: 40px;
          animation: fadeUp 1s ease-out forwards;
          opacity: 0;
        }
        .contact-title { font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 10px; }
        .contact-email { 
          color: var(--primary); font-weight: 700; font-size: 1.2rem; 
          text-decoration: none; border-bottom: 2px solid transparent; transition: 0.2s;
        }
        .contact-email:hover { border-color: var(--primary); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .policy-title { font-size: 2.2rem; }
          .policy-section { padding: 24px; }
        }
      `}</style>

      {/* Background Ambience */}
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="policy-container">
        
        {/* Header */}
        <div className="policy-header">
          <h1 className="policy-title">Privacy Policy</h1>
          <p className="policy-subtitle">
            We are committed to connecting retired professionals with organizations across India while strictly protecting your privacy, data, and dignity.
          </p>
          {/* <span className="last-updated">Last Updated: February 2026</span> */}
        </div>

        {/* Section 1: Information Collection */}
        <div className="policy-section" style={{animationDelay: '0.1s'}}>
          <div className="section-head">
            <div className="section-icon"><Database size={24} /></div>
            <h2 className="section-title">Information We Collect</h2>
          </div>
          <div className="section-content">
            <p>To facilitate meaningful second-career connections, we collect specific information depending on your role on our platform:</p>
            <ul>
              <li><strong>For Retired Professionals (Job Seekers):</strong> Personal identity details (Name, Age/DOB, Contact Information, Location), professional background (Resume, past work history, skills, educational qualifications), and job preferences (expected roles, preferred working hours).</li>
              <li><strong>For Organizations (Employers):</strong> Company details (Name, Industry, Location, GST/CIN for verification), recruiter contact information, and detailed job descriptions for the roles being posted.</li>
              <li><strong>Usage Data:</strong> Information on how you interact with our platform, search queries, and application history to improve your user experience.</li>
            </ul>
          </div>
        </div>

        {/* Section 2: How We Use Data */}
        <div className="policy-section" style={{animationDelay: '0.2s'}}>
          <div className="section-head">
            <div className="section-icon"><Briefcase size={24} /></div>
            <h2 className="section-title">How We Use Your Data</h2>
          </div>
          <div className="section-content">
            <p>Your data is used strictly to fulfill our core objective: bridging the gap between experienced talent and hiring organizations.</p>
            <ul>
              <li><strong>Job Matching & Discovery:</strong> To recommend suitable job listings to retired professionals based on their skills and experience, and to suggest relevant candidates to employers.</li>
              <li><strong>Application Processing:</strong> To securely transmit a job seeker's resume and profile to an employer when an application is submitted.</li>
              <li><strong>Communication:</strong> To send important platform updates, job alerts, interview schedules, and application statuses.</li>
              <li><strong>Platform Integrity:</strong> To verify the authenticity of both employers and job seekers, ensuring a safe, scam-free environment for our senior community.</li>
            </ul>
          </div>
        </div>

        {/* Section 3: Information Sharing */}
        <div className="policy-section" style={{animationDelay: '0.3s'}}>
          <div className="section-head">
            <div className="section-icon"><Users size={24} /></div>
            <h2 className="section-title">Information Sharing</h2>
          </div>
          <div className="section-content">
            <p>We believe in absolute transparency. We <strong>do not sell</strong> your personal data to third-party marketers or advertisers.</p>
            <ul>
              <li><strong>Between Seekers and Employers:</strong> When a retired professional applies for a job, their profile and resume are shared with that specific employer. Employers may also view public seeker profiles if the seeker has opted into our talent database.</li>
              <li><strong>Service Providers:</strong> We may share data with trusted third-party vendors in India (like cloud hosting or SMS/email providers) who assist us in operating the platform, under strict confidentiality agreements.</li>
              <li><strong>Legal Compliance:</strong> We may disclose information if required by Indian law (such as the Information Technology Act) or to comply with valid legal processes and government requests.</li>
            </ul>
          </div>
        </div>

        {/* Section 4: Data Security */}
        <div className="policy-section" style={{animationDelay: '0.4s'}}>
          <div className="section-head">
            <div className="section-icon"><Lock size={24} /></div>
            <h2 className="section-title">Data Security</h2>
          </div>
          <div className="section-content">
            <p>
              We understand the importance of digital safety, especially for our senior users. We implement robust, industry-standard security measures including SSL encryption, secure database hosting, and strict access controls to protect your personal and professional information from unauthorized access, alteration, or data breaches.
            </p>
          </div>
        </div>

        {/* Section 5: Your Rights */}
        <div className="policy-section" style={{animationDelay: '0.5s'}}>
          <div className="section-head">
            <div className="section-icon"><Shield size={24} /></div>
            <h2 className="section-title">Your Rights & Choices</h2>
          </div>
          <div className="section-content">
            <p>In accordance with Indian data protection principles, you maintain full control over your data:</p>
            <ul>
              <li><strong>Access & Modification:</strong> Both employers and job seekers can view, update, or correct their profile information at any time via their respective dashboards.</li>
              <li><strong>Profile Visibility:</strong> Job seekers can toggle their profile visibility, choosing to remain hidden from general employer searches while still being able to apply for jobs directly.</li>
              <li><strong>Right to be Forgotten:</strong> You may request the complete deletion of your account and all associated personal data from our active databases by contacting our support team.</li>
            </ul>
          </div>
        </div>

        {/* Contact Footer */}
        <div className="contact-box" style={{animationDelay: '0.6s'}}>
          <Mail size={32} style={{color: 'var(--primary)', marginBottom: '16px'}} />
          <h3 className="contact-title">Have questions about your privacy?</h3>
          <p style={{color: 'var(--text-sub)', margin: '0 auto 20px', maxWidth: '600px'}}>
            Our dedicated support team in India is here to help you understand how your data is protected. Reach out to our Grievance Officer directly.
          </p>
          <a href="mailto:privacy@retiredportal.in" className="contact-email">
            privacy@retiredportal.in
          </a>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;