import React from "react";
import { Link } from "react-router-dom";
import { Linkedin, Twitter, Facebook, Instagram, Mail, Phone } from "lucide-react";
import useAuthStore from "../context/useAuthStore";

const Footer = () => {
  const { user } = useAuthStore();
  const role = user?.user?.role;

  const showSeekerLinks = !role || role === "seeker";
  const showEmployerLinks = !role || role === "employer";

  return (
    <footer className="footer-wrapper">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

          /* --- MAIN WRAPPER --- */
          .footer-wrapper {
            background-color: var(--bg-root); /* 🔥 Theme Var */
            font-family: 'Plus Jakarta Sans', sans-serif;
            position: relative;
            padding: 0;
            overflow: hidden;
            border-top: 1px solid var(--border); /* 🔥 Theme Var */
            transition: background-color 0.3s ease;
          }

          /* --- PREMIUM TOP BORDER --- */
          .premium-top-border {
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, var(--primary-dim) 30%, var(--primary) 50%, var(--primary-dim) 70%, transparent 100%);
            z-index: 20;
            box-shadow: 0 0 15px var(--primary-dim);
          }

          /* --- BACKGROUND FX --- */
          .footer-blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(90px);
            opacity: 0.1;
            z-index: 0;
            pointer-events: none;
          }
          .fb-1 { bottom: -50px; left: -50px; width: 300px; height: 300px; background: var(--primary); }
          .fb-2 { top: -50px; right: -50px; width: 400px; height: 400px; background: #4f46e5; }

          /* --- CONTAINER --- */
          .footer-container {
            max-width: 1280px;
            margin: 0 auto;
            position: relative;
            z-index: 5;
            padding: 80px 40px 40px 40px;
          }

          /* --- GRID LAYOUT --- */
          .footer-top {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 60px;
            margin-bottom: 60px;
          }

          /* BRAND COLUMN */
          .footer-brand h2 {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 700;
            color: var(--text-main);
            margin: 0 0 20px 0;
            letter-spacing: -0.5px;
          }
          .footer-brand span {
            color: var(--primary);
          }

          .brand-desc {
            color: var(--text-sub);
            font-size: 15px;
            line-height: 1.7;
            max-width: 340px;
            margin-bottom: 25px;
          }

          /* SOCIAL ICONS */
          .social-links { display: flex; gap: 12px; }
          .social-icon {
            width: 40px; height: 40px;
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            color: var(--text-sub);
            transition: all 0.3s ease;
            text-decoration: none;
          }
          .social-icon:hover {
            background: var(--primary);
            color: #000;
            border-color: var(--primary);
            transform: translateY(-3px);
          }

          /* LINKS COLUMNS */
          .footer-heading {
            font-family: 'Playfair Display', serif;
            font-size: 18px;
            font-weight: 700;
            color: var(--text-main);
            margin-bottom: 24px;
          }

          .footer-list { list-style: none; padding: 0; margin: 0; }
          .footer-list li { margin-bottom: 12px; }

          .footer-link {
            color: var(--text-sub);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .footer-link:hover {
            color: var(--primary);
            transform: translateX(5px);
          }

          /* --- BOTTOM BAR --- */
          .footer-bottom {
            padding-top: 30px;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
          }

          .copyright { color: var(--text-sub); font-size: 13px; }
          
          .legal-links { display: flex; gap: 20px; }
          .legal-link { color: var(--text-sub); font-size: 13px; text-decoration: none; transition: 0.2s; }
          .legal-link:hover { color: var(--text-main); text-decoration: underline; }

          /* --- RESPONSIVE --- */
          @media (max-width: 1024px) {
            .footer-top { grid-template-columns: 1fr 1fr; gap: 40px; }
            .footer-brand { grid-column: span 2; text-align: center; }
            .brand-desc { margin: 0 auto 25px auto; }
            .social-links { justify-content: center; }
            .footer-column { text-align: center; }
            .footer-link { justify-content: center; }
          }

          @media (max-width: 600px) {
            .footer-top { grid-template-columns: 1fr; text-align: center; }
            .footer-brand { grid-column: auto; }
            .footer-bottom { flex-direction: column-reverse; text-align: center; }
          }
        `}
      </style>

      {/* Decorative Top Border */}
      <div className="premium-top-border"></div>

      {/* Ambient Background */}
      <div className="footer-blob fb-1"></div>
      <div className="footer-blob fb-2"></div>

      <div className="footer-container">
        <div className="footer-top">
          
          {/* 1. Brand Section */}
          <div className="footer-brand">
            <h2>IVG<span>Jobs</span></h2>
            <p className="brand-desc">
              Empowering retirees to find meaningful second careers. We connect decades of experience with companies that value professional wisdom.
            </p>
            <div className="social-links">
              <a href="#" className="social-icon" aria-label="LinkedIn"><Linkedin size={18} /></a>
              <a href="#" className="social-icon" aria-label="Twitter"><Twitter size={18} /></a>
              <a href="#" className="social-icon" aria-label="Facebook"><Facebook size={18} /></a>
              <a href="#" className="social-icon" aria-label="Instagram"><Instagram size={18} /></a>
            </div>
          </div>

          {/* 2. For Seekers (Visible to Guests & Seekers) */}
          {showSeekerLinks && (
            <div className="footer-column">
              <h4 className="footer-heading">For Professionals</h4>
              <ul className="footer-list">
                <li><Link to="/find-jobs" className="footer-link">Browse Jobs</Link></li>
                <li><Link to="/categories" className="footer-link">Browse by Expertise</Link></li>
                {role === 'seeker' ? (
                  <>
                    <li><Link to="/applications" className="footer-link">My Applications</Link></li>
                    <li><Link to="/saved-jobs" className="footer-link">Saved Opportunities</Link></li>
                  </>
                ) : (
                  <li><Link to="/auth/seeker" className="footer-link">Register as Seeker</Link></li>
                )}
              </ul>
            </div>
          )}

          {/* 3. For Employers (Visible to Guests & Employers) */}
          {showEmployerLinks && (
            <div className="footer-column">
              <h4 className="footer-heading">For Employers</h4>
              <ul className="footer-list">
                <li><Link to="/talent-pool" className="footer-link">Browse Talent</Link></li>
                <li><Link to="/billing" className="footer-link">Pricing Plans</Link></li>
                {role === 'employer' ? (
                  <>
                    <li><Link to="/post-job" className="footer-link">Post a New Role</Link></li>
                    <li><Link to="/employer-applications" className="footer-link">Manage Applications</Link></li>
                  </>
                ) : (
                  <li><Link to="/auth/employer" className="footer-link">Hiring Partner Login</Link></li>
                )}
              </ul>
            </div>
          )}

          {/* 4. Company (Always Visible) */}
          <div className="footer-column">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-list">
              <li><Link to="/about-us" className="footer-link">About Us</Link></li>
              <li><Link to="/support" className="footer-link">Help & Support</Link></li>
              <li><Link to="/contact" className="footer-link">
                  Contact Us
                </Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="copyright">
            © {new Date().getFullYear()} IVGJobs. All rights reserved.
          </div>
          <div className="legal-links">
            <Link to="/privacy" className="legal-link">Privacy Policy</Link>
            <Link to="/terms" className="legal-link">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;