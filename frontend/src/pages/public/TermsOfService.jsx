import React from "react";
import {
  Gavel,
  AlertTriangle,
  CheckCircle,
  FileText,
  UserCheck,
  ShieldAlert,
  Mail,
  Info,
  Briefcase,
  CreditCard,
  Coins,
  Banknote,
  RefreshCw,
  Globe,
  Copyright,
  UserX,
  Lock,
  Edit3,
  MapPin,
  Building,
  Calendar,
} from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="terms-page-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

        .terms-page-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root);
          color: var(--text-main);
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 80px;
        }

        /* --- BACKGROUND FX --- */
        .bg-blob {
          position: absolute; border-radius: 50%; filter: blur(120px);
          opacity: 0.15; z-index: 0; pointer-events: none;
        }
        .b1 { top: -5%; right: -10%; width: 600px; height: 600px; background: #4f46e5; }
        .b2 { bottom: 10%; left: -5%; width: 500px; height: 500px; background: var(--primary); }
        .b3 { top: 40%; left: 20%; width: 400px; height: 400px; background: #8b5cf6; opacity: 0.1; }

        /* --- CONTAINER --- */
        .terms-container {
          max-width: 1000px;
          margin: 0 auto;
          position: relative;
          z-index: 5;
          padding: 40px 20px;
        }

        /* --- HEADER (OUTSIDE DOCUMENT) --- */
        .terms-header {
          text-align: center;
          margin-bottom: 40px;
          animation: fadeUp 0.6s ease-out;
        }
        .terms-title {
          font-family: 'Playfair Display', serif;
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 16px;
          background: linear-gradient(135deg, var(--text-main) 0%, var(--primary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* --- SINGLE DOCUMENT PAPER --- */
        .legal-document {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 60px 80px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.04);
          animation: fadeUp 0.8s ease-out forwards;
        }

        /* --- META INFO GRID --- */
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          padding: 24px;
          background: var(--bg-input);
          border-radius: 16px;
          margin-bottom: 50px;
          border: 1px solid var(--border);
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.95rem;
          color: var(--text-sub);
        }
        .meta-item strong { 
          color: var(--text-main); 
          display: block; 
          font-size: 0.85rem; 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .meta-item span { display: block; font-weight: 600; }

        /* --- SECTION FORMATTING --- */
        .section-block {
          margin-bottom: 48px;
        }
        .section-block:last-child {
          margin-bottom: 0;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-main);
          font-family: 'Playfair Display', serif;
          margin: 0 0 20px 0;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--bg-input);
        }
        .section-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--primary-dim);
          color: var(--primary);
        }

        .section-content {
          font-size: 1.05rem;
          color: var(--text-sub);
          line-height: 1.8;
        }
        .section-content p { margin-bottom: 16px; }
        .section-content p:last-child { margin-bottom: 0; }
        
        .section-content h4 {
          font-size: 1.15rem;
          color: var(--text-main);
          margin: 24px 0 12px 0;
          font-weight: 700;
        }

        /* --- CUSTOM BULLET POINTS --- */
        .section-content ul { 
          padding-left: 0; 
          margin-bottom: 24px; 
        }
        .section-content li { 
          margin-bottom: 12px; 
          list-style-type: none; 
          position: relative; 
          padding-left: 36px; 
        }
        .section-content li::before {
          content: "✓";
          color: var(--primary);
          font-weight: 800;
          position: absolute; 
          left: 0;
          background: var(--primary-dim);
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 0.75rem;
          top: 4px;
        }

        /* --- CONTACT SECTION (INTEGRATED) --- */
        .contact-block {
          margin-top: 60px;
          padding-top: 40px;
          border-top: 2px dashed var(--border);
          text-align: center;
        }
        .contact-email { 
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--bg-root); 
          font-weight: 700; 
          font-size: 1.2rem; 
          text-decoration: none; 
          margin-top: 20px;
          padding: 14px 28px;
          background: var(--primary);
          border-radius: 50px;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
          transition: 0.3s;
        }
        .contact-email:hover { 
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4); 
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .terms-title { font-size: 2.5rem; }
          .legal-document { padding: 40px 24px; }
          .section-title { font-size: 1.4rem; }
        }
      `}</style>

      {/* Background Ambience */}
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>
      <div className="bg-blob b3"></div>

      <div className="terms-container">
        {/* Header */}
        <div className="terms-header">
          <h1 className="terms-title">Terms & Conditions</h1>
          <p style={{ color: "var(--text-sub)", fontSize: "1.1rem" }}>
            Please read these terms carefully before utilizing our platform and
            services.
          </p>
        </div>

        <div className="legal-document">
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <Info size={20} />
              </div>
              1. Introduction & Overview
            </h2>
            <div className="section-content">
              <p>
                Welcome to the <strong>IVGJobs</strong> (referred to herein as
                the “Platform”, “We”, “Us”, or “Our”). We operate as a
                specialized online career ecosystem in India specifically
                designed to bridge the gap between retired or senior
                professionals (referred to as “Seekers”) and forward-thinking
                organizations, recruiters, or businesses (referred to as
                “Employers”) seeking experienced talent.
              </p>
              <p>
                By accessing our website, creating an account, browsing job
                listings, or utilizing any of our integrated services, you
                explicitly agree to be legally bound by these comprehensive
                Terms & Conditions. This document constitutes a legally binding
                agreement between you and the IVGJobs. If you do not agree with
                any provision outlined in this document, you must immediately
                cease the use of our Platform. We reserve the right to deny
                service to anyone who violates these terms.
              </p>
            </div>
          </div>

          {/* 2. Eligibility */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <UserCheck size={20} />
              </div>
              2. User Eligibility Requirements
            </h2>
            <div className="section-content">
              <p>
                To ensure a high-quality and legally compliant environment,
                access to our Platform is strictly limited to individuals and
                entities who meet the following criteria:
              </p>
              <ul>
                <li>
                  <strong>Age Requirement:</strong> All users must be at least
                  18 years of age. By registering, you warrant that you possess
                  the legal capacity to enter into binding contracts under the
                  Indian Contract Act, 1872.
                </li>
                <li>
                  <strong>Seeker Eligibility:</strong> Job Seekers must be
                  legitimately retired professionals, individuals approaching
                  retirement, or senior experts eligible for post-retirement
                  employment, advisory roles, or consulting engagements in
                  India.
                </li>
                <li>
                  <strong>Employer Authorization:</strong> Employers must be
                  legally registered commercial entities, non-profits, or
                  authorized independent recruiters acting with the explicit
                  consent of the hiring company. Valid GSTIN or CIN may be
                  required for verification.
                </li>
                <li>
                  <strong>Information Accuracy:</strong> You agree to provide
                  current, accurate, and complete information during the
                  registration process and to continually update this
                  information. Providing false identity documents or credentials
                  will result in immediate termination.
                </li>
              </ul>
            </div>
          </div>

          {/* 3. User Accounts */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <Lock size={20} />
              </div>
              3. Account Security & Maintenance
            </h2>
            <div className="section-content">
              <p>
                Your account is personal to you or your registered organization,
                and its security is paramount to the safety of our ecosystem.
              </p>
              <ul>
                <li>
                  <strong>Confidentiality:</strong> Users are entirely
                  responsible for maintaining the strict confidentiality of
                  their login credentials, including passwords and OTPs. We will
                  never ask for your password via email or phone.
                </li>
                <li>
                  <strong>Accountability:</strong> Any and all activities,
                  communications, or transactions performed under your
                  registered account will be deemed your sole responsibility,
                  regardless of whether you authorized them.
                </li>
                <li>
                  <strong>Unauthorized Access:</strong> You must notify our
                  support team immediately if you suspect any unauthorized
                  access, breach of security, or misuse of your account.
                </li>
                <li>
                  <strong>Non-Transferability:</strong> Accounts, subscriptions,
                  and purchased credits are strictly non-transferable. You may
                  not sell, trade, or share your account access with third
                  parties.
                </li>
              </ul>
            </div>
          </div>

          {/* 4. Seeker Terms */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <FileText size={20} />
              </div>
              4. Terms for Job Seekers (Retired Professionals)
            </h2>
            <div className="section-content">
              <p>
                As a senior professional utilizing our platform to find
                opportunities, you agree to adhere to the highest standards of
                professional conduct:
              </p>
              <h4>Seeker Commitments:</h4>
              <ul>
                <li>
                  <strong>Truthfulness:</strong> All data provided in your
                  profile, resumes, cover letters, and communications must be
                  100% truthful. Exaggerating qualifications, forging
                  certificates, or lying about past employment is strictly
                  prohibited.
                </li>
                <li>
                  <strong>Intellectual Property:</strong> Uploaded documents,
                  portfolios, and avatars must not violate the intellectual
                  property, privacy, or copyright of any third party or former
                  employer.
                </li>
                <li>
                  <strong>Professional Etiquette:</strong> All interactions with
                  prospective Employers must remain respectful, timely, and
                  strictly professional. Harassment or inappropriate
                  communication will lead to an immediate ban.
                </li>
                <li>
                  <strong>No Employment Guarantees:</strong> You acknowledge
                  that the Platform acts solely as a discovery board. We do not
                  guarantee job selection, interview scheduling, or final
                  employment.
                </li>
              </ul>
            </div>
          </div>

          {/* 5. Employer Terms */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <Briefcase size={20} />
              </div>
              5. Terms for Employers & Recruiters
            </h2>
            <div className="section-content">
              <p>
                Employers utilize our platform to connect with a highly
                specialized demographic of retired and experienced individuals.
                By posting opportunities, you agree to the following operational
                standards:
              </p>
              <h4>Employer Commitments:</h4>
              <ul>
                <li>
                  <strong>Lawful Opportunities:</strong> Every job posted must
                  represent a genuine, legally compliant, and currently
                  available vacancy within India (or compliant remote roles).
                  Multi-level marketing (MLM), pyramid schemes, and unpaid
                  "trial" work disguised as jobs are forbidden.
                </li>
                <li>
                  <strong>Zero Tolerance for Candidate Fees:</strong> Employers
                  are strictly prohibited from charging Seekers any form of fee
                  for applying, interviewing, training, or onboarding. Violating
                  this rule will result in legal action and a permanent ban.
                </li>
                <li>
                  <strong>Non-Discrimination:</strong> Job postings must adhere
                  to all applicable equal opportunity laws and should not
                  contain discriminatory language regarding religion, gender,
                  race, or caste.
                </li>
                <li>
                  <strong>Independent Vetting:</strong> Employers are solely
                  responsible for conducting background checks, verifying
                  qualifications, and making the final recruitment decisions. We
                  do not pre-vet candidates.
                </li>
              </ul>
            </div>
          </div>

          {/* 6. Subscription Plans */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <CreditCard size={20} />
              </div>
              6. Employer Subscription Plans
            </h2>
            <div className="section-content">
              <p>
                To access premium features, Employers may opt into structured
                subscription plans. These plans dictate the volume and
                visibility of your recruitment efforts.
              </p>
              <h4>A) Free / Basic Plan</h4>
              <ul>
                <li>
                  Provides limited access to post a restricted number of jobs
                  per month.
                </li>
                <li>
                  May include restrictions on viewing advanced Seeker analytics
                  or contact details.
                </li>
                <li>
                  Subject to modification or removal at the Platform's
                  discretion.
                </li>
              </ul>
              <h4>B) Pro / Premium Plans</h4>
              <ul>
                <li>
                  Unlocks expanded job posting limits, enhanced visibility, and
                  priority customer support.
                </li>
                <li>
                  The subscription validity period commences immediately upon
                  successful payment confirmation.
                </li>
                <li>
                  Unless explicitly stated as an auto-renewing subscription,
                  employers must manually renew their plans upon expiration to
                  maintain premium benefits.
                </li>
              </ul>
            </div>
          </div>

          {/* 7. Credit System */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <Coins size={20} />
              </div>
              7. Usage of Platform Credits
            </h2>
            <div className="section-content">
              <p>
                In addition to subscriptions, the Platform operates a digital
                Credit System allowing Employers to perform specific actions on
                a pay-as-you-go basis.
              </p>
              <ul>
                <li>
                  <strong>Consumption:</strong> Credits may be consumed for
                  actions such as unlocking specific candidate contact details,
                  boosting job posts, or sending direct interview invites.
                </li>
                <li>
                  <strong>Strictly Digital Asset:</strong> Credits hold no
                  real-world monetary value outside of the Platform. They are
                  non-transferable between accounts and cannot under any
                  circumstances be encashed or withdrawn to a bank account.
                </li>
                <li>
                  <strong>Expiration:</strong> Depending on the promotional
                  terms at the time of purchase, credits may carry an expiration
                  date. Unused credits post-expiration will be forfeited.
                </li>
                <li>
                  <strong>Refundability:</strong> Once a credit is consumed to
                  unlock data, it cannot be reversed. Purchased credits are
                  strictly non-refundable unless a verifiable technical failure
                  prevented the delivery of the credits to your account.
                </li>
              </ul>
            </div>
          </div>

          {/* 8. Payments */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <Banknote size={20} />
              </div>
              8. Payment Processing & Billing
            </h2>
            <div className="section-content">
              <p>
                We ensure a seamless and secure financial environment for
                purchasing subscriptions and credits in INR.
              </p>
              <ul>
                <li>
                  <strong>Secure Gateways:</strong> All financial transactions
                  are processed through encrypted, RBI-compliant third-party
                  payment gateways (e.g., Razorpay). We do not capture, store,
                  or process your sensitive credit card or net-banking data on
                  our servers.
                </li>
                <li>
                  <strong>Taxes:</strong> All listed prices are exclusive of
                  applicable taxes (such as GST) unless explicitly stated
                  otherwise. Taxes will be calculated and added at checkout.
                </li>
                <li>
                  <strong>Transaction Failures:</strong> In the event that a
                  payment fails but funds are deducted from your bank account,
                  the gateway will typically auto-refund within 5-7 business
                  days. Users must contact our support team within 7 days if the
                  issue persists.
                </li>
                <li>
                  <strong>Pricing Adjustments:</strong> We reserve the right to
                  modify subscription fees, introduce new pricing tiers, or
                  alter credit pricing at any time. Active subscriptions will
                  not be affected by price hikes until their current billing
                  cycle expires.
                </li>
              </ul>
            </div>
          </div>

          {/* 9. Refund Policy */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <RefreshCw size={20} />
              </div>
              9. Strict Refund Policy
            </h2>
            <div className="section-content">
              <p>
                Due to the digital nature of our services, our refund guidelines
                are strict and universally applied to all users:
              </p>
              <ul>
                <li>
                  <strong>No Buyer's Remorse:</strong> Subscription fees and
                  credit purchases are strictly non-refundable once activated
                  and deployed to your account.
                </li>
                <li>
                  <strong>No Partial Refunds:</strong> We do not issue prorated
                  refunds for partially used plans, or if an Employer fulfills
                  their hiring requirements before their subscription period
                  ends.
                </li>
                <li>
                  <strong>Eligible Exceptions:</strong> Refunds will solely be
                  processed in the event of duplicate billing errors, fraudulent
                  unauthorized transactions, or documented technical failures
                  resulting in non-delivery of digital goods. Such disputes must
                  be raised within 48 hours of the transaction.
                </li>
              </ul>
            </div>
          </div>

          {/* 10. Content Policy */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <AlertTriangle size={20} />
              </div>
              10. Acceptable Use & Content Policy
            </h2>
            <div className="section-content">
              <p>
                To ensure a safe ecosystem, all users must strictly abstain from
                the following prohibited behaviors:
              </p>
              <ul>
                <li>
                  <strong>Misinformation:</strong> Posting false, misleading, or
                  'bait-and-switch' job advertisements.
                </li>
                <li>
                  <strong>Malicious Actions:</strong> Uploading resumes or files
                  containing software viruses, malware, trojans, or any code
                  designed to disrupt platform functionality.
                </li>
                <li>
                  <strong>Data Scraping:</strong> Utilizing automated bots,
                  spiders, or scraping tools to harvest Seeker resumes or
                  Employer data from the Platform for external use.
                </li>
                <li>
                  <strong>Spam & Solicitation:</strong> Using the messaging
                  system to send unsolicited promotional material, marketing
                  campaigns, or services unrelated to the specific job hiring
                  process.
                </li>
              </ul>
              <p>
                <strong>Consequence of Violation:</strong> Breach of this
                content policy will result in the immediate and permanent
                termination of your account, forfeiture of all active
                subscriptions/credits, and potential legal prosecution under the
                Information Technology Act, 2000.
              </p>
            </div>
          </div>

          {/* 11. Platform Role & Disclaimer */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <ShieldAlert size={20} />
              </div>
              11. Platform Role & Operational Disclaimer
            </h2>
            <div className="section-content">
              <p>
                It is crucial to understand the legal boundaries of our service
                provision:
              </p>
              <ul>
                <li>
                  <strong>Intermediary Status:</strong> The{" "}
                  <strong>IVGJobs</strong> operates solely as a digital
                  intermediary/bulletin board. We are not an employment agency,
                  headhunter, or employer of the Seekers.
                </li>
                <li>
                  <strong>No Endorsements:</strong> We do not explicitly
                  endorse, guarantee, or vouch for the credibility, financial
                  stability, or safety of any Employer, nor do we guarantee the
                  skill level, background, or medical fitness of any Seeker.
                </li>
                <li>
                  <strong>No Dispute Resolution:</strong> We are legally
                  absolved from any involvement in disputes arising between
                  Employers and Seekers regarding unpaid salaries, hostile work
                  environments, breach of employment contracts, or workplace
                  injuries. All users interact, interview, and contract entirely
                  at their own inherent risk.
                </li>
              </ul>
            </div>
          </div>

          {/* 12. Intellectual Property */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <Copyright size={20} />
              </div>
              12. Intellectual Property Rights
            </h2>
            <div className="section-content">
              <p>
                The entirety of the Platform, including but not limited to its
                custom code, UI/UX design, graphics, logos, algorithms, and
                database architecture, is the exclusive intellectual property of
                the <strong>IVGJobs</strong>, protected by national and
                international copyright laws.
              </p>
              <p>
                Users are granted a limited, non-exclusive, revocable license to
                access the platform for its intended recruitment purposes.
                Unauthorized copying, reverse engineering, reproduction, or
                creation of derivative works from our platform will result in
                aggressive civil litigation.
              </p>
            </div>
          </div>

          {/* 13. Account Suspension & Termination */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <UserX size={20} />
              </div>
              13. Account Suspension & Termination
            </h2>
            <div className="section-content">
              <p>
                We maintain the authority to protect our community through
                decisive administrative action:
              </p>
              <ul>
                <li>
                  <strong>Termination by Us:</strong> We reserve the right to
                  suspend or permanently terminate any account, at any time,
                  with or without prior notice, if we determine that the user
                  has violated these Terms, engaged in fraudulent activity, or
                  created legal liability for the Platform.
                </li>
                <li>
                  <strong>Forfeiture:</strong> Upon termination for a violation
                  of these terms, the user immediately loses all access to the
                  platform, and no refunds will be issued for any remaining
                  subscription time or unused credits.
                </li>
                <li>
                  <strong>Data Retention:</strong> Following account
                  termination, we may retain certain account data as required by
                  law, to prevent fraud, or to resolve ongoing legal disputes,
                  in accordance with our Privacy Policy.
                </li>
              </ul>
            </div>
          </div>

          {/* 14. Limitation of Liability */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <ShieldAlert size={20} />
              </div>
              14. Limitation of Legal Liability
            </h2>
            <div className="section-content">
              <p>
                To the maximum extent permitted by applicable law, the Platform
                is provided on an "As Is" and "As Available" basis. We make no
                warranties, express or implied, regarding platform uptime or
                error-free operation.
              </p>
              <ul>
                <li>
                  <strong>Exclusion of Damages:</strong> Under no circumstances
                  shall the <strong>IVGJobs</strong>, its directors, employees,
                  or affiliates be liable for any indirect, incidental, special,
                  consequential, or punitive damages.
                </li>
                <li>
                  <strong>Scope of Loss:</strong> This includes, but is not
                  limited to, loss of profits, loss of employment opportunity,
                  loss of data, or reputational damage resulting from the use or
                  inability to use the platform.
                </li>
                <li>
                  <strong>Liability Cap:</strong> In any event, our total
                  aggregate liability for any claims arising under these terms
                  shall not exceed the total amount paid by the specific user to
                  the Platform in the three (3) months preceding the incident
                  causing the claim.
                </li>
              </ul>
            </div>
          </div>

          {/* 15. Data & Privacy */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <Lock size={20} />
              </div>
              15. Data Protection & Privacy
            </h2>
            <div className="section-content">
              <p>
                We treat your personal and corporate data with the utmost
                respect. The collection, storage, and processing of your
                personal information are strictly governed by our standalone{" "}
                <strong>Privacy Policy</strong>.
              </p>
              <p>
                By utilizing this platform, you explicitly consent to the
                collection of necessary data (including cookies for session
                management) and acknowledge that Seeker profile data will be
                shared with authorized Employers for the sole purpose of
                recruitment facilitation.
              </p>
            </div>
          </div>

          {/* 16. Changes to Terms */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <Edit3 size={20} />
              </div>
              16. Modifications to Terms
            </h2>
            <div className="section-content">
              <p>
                The digital landscape and legal requirements evolve rapidly.
                Consequently, we reserve the right to update, modify, or
                completely replace these Terms & Conditions at any time.
              </p>
              <p>
                Significant changes will be communicated via platform banners or
                email notifications. However, it remains your responsibility to
                periodically review this page. Your continued use of the
                platform following the posting of any changes constitutes your
                formal acceptance of the newly revised Terms.
              </p>
            </div>
          </div>

          {/* 17. Governing Law & Jurisdiction */}
          <div className="section-block">
            <h2 className="section-title">
              <div className="section-icon-wrapper">
                <Gavel size={20} />
              </div>
              17. Governing Law & Jurisdiction
            </h2>
            <div className="section-content">
              <p>
                This agreement, and any disputes arising directly or indirectly
                from your use of the Platform, shall be governed by and
                construed strictly in accordance with the laws of India.
              </p>
              <p>
                Any legal actions, lawsuits, or arbitrations must be filed
                exclusively in the state or federal courts located in{" "}
                <strong>Jaipur, Rajasthan, India</strong>. By using this
                platform, you consent to the exclusive personal jurisdiction of
                these specific courts and waive any objections regarding venue
                convenience.
              </p>
            </div>
          </div>

          {/* --- CONTACT FOOTER --- */}
          <div className="contact-block">
            <h2
              className="section-title"
              style={{ justifyContent: "center", borderBottom: "none" }}
            >
              18. Official Contact Information
            </h2>
            <p
              style={{
                color: "var(--text-sub)",
                fontSize: "1.05rem",
                maxWidth: "700px",
                margin: "0 auto 10px",
              }}
            >
              If you have any legal questions, concerns regarding these terms,
              or wish to report a violation, please reach out to our dedicated
              compliance and support team. We aim to respond to all legal
              inquiries within 48 business hours.
            </p>

            <a href="mailto:support@retiredportal.in" className="contact-email">
              <Mail size={22} /> support@retiredportal.in
            </a>

            <p
              style={{
                color: "var(--text-sub)",
                fontSize: "0.95rem",
                marginTop: "20px",
                lineHeight: "1.6",
              }}
            >
              <strong>Phone:</strong> +91-9027307508 <br />
              <strong>Registered Office Address:</strong>
              <br />
              IVGJobs
              <br />
              U-5, KRISHNA APARTMENT, C4, Hathibabu Marg, Bani Park, Jaipur,
              Rajasthan 302016
              <br />
              Jaipur, Rajasthan, India
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
