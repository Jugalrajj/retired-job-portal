import React from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../context/useAuthStore";
import { ArrowRight, CheckCircle2, ShieldCheck, Star } from "lucide-react";

const FinalCTA = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleCTAAction = () => {
    if (user) {
      navigate("/find-jobs");
    } else {
      navigate("/auth/seeker");
    }
  };

  return (
    <section className="cta-section">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

          /* --- MAIN SECTION --- */
          .cta-section {
            position: relative;
            background-color: var(--bg-root); /* 🔥 Theme Var */
            font-family: 'Plus Jakarta Sans', sans-serif;
            overflow: hidden;
            display: flex;
            justify-content: center;
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
          .premium-top-border::after {
             content: ''; position: absolute; top: -2px; left: 50%;
             transform: translateX(-50%) rotate(45deg);
             width: 6px; height: 6px; background: var(--primary);
             box-shadow: 0 0 10px 2px var(--primary-dim);
          }

          /* --- BACKGROUND FX --- */
          .cta-blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(100px);
            opacity: 0.2;
            animation: float 10s infinite ease-in-out;
            z-index: 0;
            pointer-events: none;
          }
          .blob-1 { top: 10%; left: -10%; width: 600px; height: 600px; background: #4f46e5; animation-delay: 0s; }
          .blob-2 { bottom: -10%; right: -10%; width: 500px; height: 500px; background: var(--primary); animation-delay: 5s; }

          @keyframes float {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(30px, 50px); }
          }

          /* --- CONTAINER 1280px --- */
          .cta-container {
            width: 100%;
            max-width: 1280px;
            position: relative;
            z-index: 10;
            padding: 80px 40px; 
            box-sizing: border-box;
          }

          /* --- SIDE BORDERS (Gold/Blue) --- */
          .cta-container::before,
          .cta-container::after {
            content: ""; position: absolute;
            top: 0; bottom: 0; width: 1px;
            background: linear-gradient(to bottom, transparent, var(--primary), transparent);
            opacity: 0.3;
            box-shadow: 0 0 15px var(--primary-dim);
          }
          .cta-container::before { left: 0; }
          .cta-container::after { right: 0; }

          /* --- GLASS CARD --- */
          .cta-card {
            width: 100%;
            background: var(--bg-card); /* 🔥 Theme Var */
            border: 1px solid var(--border); /* 🔥 Theme Var */
            border-radius: 32px;
            backdrop-filter: blur(20px);
            padding: 60px;
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 60px;
            align-items: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
          }

          /* Top Border Glow inside Card */
          .cta-card::before {
            content: "";
            position: absolute;
            top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, var(--primary), transparent);
            opacity: 0.6;
          }

          /* --- LEFT SIDE: CONTENT --- */
          .cta-content {
             min-width: 0; /* Prevents flex/grid overflow issues */
          }

          .cta-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background: var(--primary-dim);
            border: 1px solid var(--primary);
            border-radius: 50px;
            color: var(--primary);
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 24px;
            white-space: nowrap;
          }

          .cta-headline {
            font-family: 'Playfair Display', serif;
            font-size: clamp(2rem, 4vw, 3.5rem); /* Responsive Font */
            color: var(--text-main); /* 🔥 Theme Var */
            line-height: 1.15;
            margin-bottom: 20px;
          }
          
          .cta-headline span {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .cta-subtext {
            color: var(--text-sub); /* 🔥 Theme Var */
            font-size: 1.1rem;
            line-height: 1.7;
            margin-bottom: 40px;
            max-width: 90%;
          }

          /* Trust Indicators */
          .trust-row {
            display: flex;
            gap: 24px;
            border-top: 1px solid var(--border); /* 🔥 Theme Var */
            padding-top: 30px;
            flex-wrap: wrap; /* Allows wrapping on small screens */
          }
          
          .trust-item {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .trust-icon { color: var(--primary); flex-shrink: 0; }
          .trust-text { color: var(--text-sub); font-size: 0.9rem; font-weight: 500; white-space: nowrap; }

          /* --- RIGHT SIDE: ACTION --- */
          .cta-action-box {
            background: var(--bg-input); /* 🔥 Theme Var (Use Input Bg for contrast) */
            border: 1px solid var(--border);
            padding: 40px;
            border-radius: 24px;
            text-align: center;
            position: relative;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
            width: 100%;
            box-sizing: border-box;
          }

          .cta-btn {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 700;
            padding: 18px 20px;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px -5px var(--primary-dim);
            position: relative;
            overflow: hidden;
            white-space: nowrap;
          }

          .cta-btn::after {
            content: "";
            position: absolute;
            top: 0; left: -100%; width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            transition: 0.5s;
          }

          .cta-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 20px 40px -5px var(--primary-dim);
          }
          
          .cta-btn:hover::after { left: 100%; }

          .cta-note {
            margin-top: 16px;
            font-size: 0.85rem;
            color: var(--text-sub);
          }

          /* --- RESPONSIVE MEDIA QUERIES --- */

          /* 1. Large Tablet / Laptop (Max 1200px) */
          @media (max-width: 1200px) {
             /* Hide Side Borders */
             .cta-container::before, .cta-container::after { display: none; }
             /* Reduce Side Padding */
             .cta-container { padding: 40px 20px; }
          }

          /* 2. Tablet & Portrait Modes (Max 1024px) */
          /* KEY CHANGE: Switch to Stacked Layout earlier for tablets */
          @media (max-width: 1024px) {
            .cta-card {
              display: flex;
              flex-direction: column; /* Stack Content vertically */
              padding: 50px 30px;
              gap: 40px;
              text-align: center;
            }

            .cta-badge { margin: 0 auto 24px; } /* Center badge */
            
            .cta-subtext { 
              margin: 0 auto 30px auto; 
              max-width: 80%; 
            }

            .trust-row { 
              justify-content: center; 
              border-top: 1px solid var(--border);
              padding-top: 30px;
            }

            /* Make Action Box full width but bounded */
            .cta-action-box {
              max-width: 500px;
              margin: 0 auto;
              padding: 30px;
            }
          }

          /* 3. Mobile (Max 600px) */
          @media (max-width: 600px) {
            .cta-section { padding-bottom: 60px; }
            .cta-container { padding: 40px 15px; } /* Tighter container */
            
            .cta-card {
              padding: 30px 20px; /* Tighter card padding */
              border-radius: 24px;
              gap: 30px;
            }

            .cta-headline { 
              font-size: 2rem; /* Smaller Font */
              margin-bottom: 15px;
            }
            
            .cta-subtext { 
              font-size: 1rem; 
              max-width: 100%;
            }

            /* Stack trust items or wrap tightly */
            .trust-row { 
              gap: 15px 20px; 
            }
            
            .cta-action-box {
              padding: 24px 20px;
              width: 100%;
            }
            
            .cta-btn { 
              padding: 14px; 
              font-size: 1rem;
            }
          }
        `}
      </style>

      {/* --- TOP BORDER ELEMENT --- */}
      <div className="premium-top-border"></div>

      {/* Floating Background Elements */}
      <div className="cta-blob blob-1"></div>
      <div className="cta-blob blob-2"></div>

      {/* --- CONTAINER --- */}
      <div className="cta-container">
        
        <div className="cta-card">
          
          {/* Left: Content */}
          <div className="cta-content">
            {/* <div className="cta-badge">
              <Star size={14} fill="currentColor" />
              Elite Network
            </div> */}
            
            <h2 className="cta-headline">
              Your Experience is <br />
              <span>Your Greatest Asset.</span>
            </h2>
            
            <p className="cta-subtext">
              Don't let retirement be the end. Join an exclusive network of senior professionals consulting for the world's most innovative companies. Your wisdom is in high demand.
            </p>

            <div className="trust-row">
              <div className="trust-item">
                <ShieldCheck className="trust-icon" size={20} />
                <span className="trust-text">Verified Companies</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 className="trust-icon" size={20} />
                <span className="trust-text">Secure Payments</span>
              </div>
              <div className="trust-item">
                <Star className="trust-icon" size={20} />
                <span className="trust-text">Premium Roles</span>
              </div>
            </div>
          </div>

          {/* Right: Action Box */}
          <div className="cta-action-box">
            <button className="cta-btn" onClick={handleCTAAction}>
              {user ? "Explore Opportunities" : "Start Your Second Act"}
              <ArrowRight size={20} />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FinalCTA;