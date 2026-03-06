import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import api from "../../services/api";

// --- Sub-Component: Theme-Aware Card ---
const CompanyCard = ({ co, navigate, getLogoUrl }) => {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // --- Magnetic Effect (Desktop Only) ---
    const handleMouseMove = (e) => {
      if (window.innerWidth < 768) return;

      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;

      gsap.to(card, {
        x: x * 0.05,
        y: y * 0.05,
        rotateX: -y * 0.02,
        rotateY: x * 0.02,
        duration: 0.5,
        ease: "power3.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        x: 0, y: 0, rotateX: 0, rotateY: 0,
        duration: 0.8, ease: "power4.out",
      });
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    // --- Entry Animation ---
    gsap.fromTo(card, 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power4.out" }
    );

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div 
      className="card" 
      ref={cardRef} 
      onClick={() => navigate(`/company/${co._id}`)}
    >
      <div className="card-gradient-overlay"></div>
      
      {/* Top: Large Logo */}
      <div className="logo-section">
         <div className="logo-box">
             <img 
               src={getLogoUrl(co.logo)} 
               alt="logo" 
               className="logo-img"
               onError={(e) => {
                 e.target.onerror = null; 
                 e.target.src = "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3e%3crect width='60' height='60' fill='%23f1f5f9'/%3e%3c/svg%3e";
               }}
             />
         </div>
      </div>

      {/* Middle: Content */}
      <div className="content-section">
        <h3 className="companyName">{co.name}</h3>
        <p className="company-role">{co.location || "Global Location"}</p>
        <h5 className="company-desc"> {co.description || "Industry Leader"}</h5>
        
        <div className="divider">
          <div className="accent-dot"></div>
        </div>

        {/* Bottom: Stats & Action */}
        <div className="info-row">
           <div className="info-item">
             <span className="info-val">{co.jobCount || 0}</span>
             <span className="info-lbl">Openings</span>
           </div>
           <div className="arrow-circle">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
           </div>
        </div>
      </div>
    </div>
  );
};

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- CREATIVE BUTTON LOGIC ---
  const buttonRef = useRef(null);

  const handleButtonMouseMove = (e) => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    button.style.setProperty('--x', `${x}px`);
    button.style.setProperty('--y', `${y}px`);
  };

  const getLogoUrl = (logoPath) => {
    const fallbackImage = "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3e%3crect width='60' height='60' fill='%23f1f5f9'/%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%2364748b'%3eLogo%3c/text%3e%3c/svg%3e";
    if (!logoPath) return fallbackImage;
    const cleanPath = logoPath.replace(/\\/g, "/");
    if (cleanPath.startsWith("http")) return cleanPath;
    return `http://localhost:5000/${cleanPath}`;
  };

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get("/companies");
        setCompanies(res.data.slice(0, 4));
      } catch (err) {
        console.error("Error fetching companies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  if (loading) return <div style={{background:'var(--bg-root)', height:'500px'}}></div>;

  return (
    <div className="main-wrapper">
      <div className="container-1280">
        
        {/* --- PREMIUM DESIGNER BORDER --- */}
        <div className="premium-separator">
            <div className="separator-line"></div>
            <div className="separator-jewel"></div>
        </div>

        {/* Header */}
        <div className="section-header">
          <h2 className="main-title">Top <span>Companies</span></h2>
          <p className="sub-text">Join the advisory boards of global leaders.</p>
        </div>

        {/* Grid */}
        <div className="card-grid">
          {companies.map((co) => (
            <CompanyCard 
              key={co._id} 
              co={co} 
              navigate={navigate} 
              getLogoUrl={getLogoUrl} 
            />
          ))}
        </div>

        {/* Footer Action */}
        <div className="footer-action">
           <button 
             className="button-creative"
             ref={buttonRef}
             onMouseMove={handleButtonMouseMove}
             onClick={() => navigate("/all-companies")}
           >
              View All Companies
           </button>
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

        /* 1. Main Wrapper (Dynamic Background) */
        .main-wrapper {
          width: 100%;
          background: var(--bg-root);
          display: flex;
          justify-content: center;
          padding: 40px 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          box-sizing: border-box;
          transition: background 0.3s ease;
        }

        /* 2. Fixed Width Container */
        .container-1280 {
          width: 100%;
          max-width: 1280px;
          position: relative;
        }

        /* --- PREMIUM BORDER DESIGN (Gold & Border Color) --- */
        .premium-separator {
            position: relative;
            width: 100%;
            height: 40px; 
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 40px;
        }

        .separator-line {
            width: 100%;
            height: 1px;
            background: linear-gradient(90deg, 
                transparent 0%, 
                var(--border) 30%, 
                var(--primary) 50%, 
                var(--border) 70%, 
                transparent 100%
            );
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            opacity: 0.6;
        }

        .separator-jewel {
            width: 12px;
            height: 12px;
            background: var(--primary); 
            transform: rotate(45deg);
            position: relative;
            z-index: 2;
            box-shadow: 0 0 15px 2px var(--primary-dim);
            border: 2px solid var(--bg-root);
            animation: pulse-jewel 3s infinite ease-in-out;
        }

        @keyframes pulse-jewel {
            0%, 100% { box-shadow: 0 0 15px 2px var(--primary-dim); transform: rotate(45deg) scale(1); }
            50% { box-shadow: 0 0 25px 5px var(--primary-dim); transform: rotate(45deg) scale(1.1); }
        }

        /* 3. Header */
        .section-header {
            text-align: center;
            margin-bottom: 50px;
        }
        .main-title {
            font-family: 'Playfair Display', serif;
            font-size: clamp(2.5rem, 4vw, 3.5rem);
            margin: 0;
            font-weight: 700;
            letter-spacing: -1px;
            line-height: 1.2;
            color: var(--text-main);
        }
        .main-title span {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .sub-text {
            color: var(--text-sub);
            margin-top: 12px;
            font-size: 1.1rem;
        }

        /* 4. Grid System */
        .card-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr); 
            gap: 30px;
            perspective: 1000px;
            width: 100%;
        }

        /* 5. CARD DESIGN (Adaptive) */
        .card {
            position: relative;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 30px 24px;
            overflow: hidden;
            cursor: pointer;
            transform-style: preserve-3d;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1); 
        }

        .card-gradient-overlay {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at top right, var(--primary-dim), transparent 60%);
            z-index: 0;
            pointer-events: none;
        }

        .card:hover {
            transform: translateY(-10px);
            border-color: var(--primary); 
            box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.15); 
        }

        .logo-box {
            width: 80px; 
            height: 80px;
            background: #ffffff;
            border-radius: 18px;
            padding: 12px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            border: 1px solid var(--border);
        }
        .logo-img { width: 100%; height: 100%; object-fit: contain; }

        .companyName {
            font-size: 20px;
            font-weight: 700;
            color: #f59e0b;
            margin: 0 0 6px 0;
            letter-spacing: -0.5px;
            line-height: 1.3;
        }
        
        .company-role {
            font-size: 12px;
            color: var(--text-sub); 
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }

       .company-desc {
            color: var(--text-sub);
            font-weight: 500;
            margin-top: 4px;
            font-size: 13px;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.5;
        }

        .divider {
            width: 100%;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--border), transparent);
            margin: 20px 0;
            position: relative;
        }
        .accent-dot {
            width: 6px; height: 6px; background: var(--primary);
            border-radius: 50%;
            position: absolute; left: 50%; top: -3px; transform: translateX(-50%);
            box-shadow: 0 0 8px var(--primary-dim);
        }

        .info-row { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
        .info-val { display: block; font-size: 20px; font-weight: 700; color: var(--primary); }
        .info-lbl { font-size: 12px; color: var(--text-sub); font-weight: 500; }

        .arrow-circle {
            width: 40px; height: 40px;
            border-radius: 50%;
            border: 1px solid var(--border);
            display: flex; align-items: center; justify-content: center;
            color: var(--text-main);
            transition: 0.3s;
            background: var(--bg-input);
        }
        
        .card:hover .arrow-circle {
            background: var(--primary); 
            color: #000; 
            border-color: var(--primary);
            transform: rotate(-45deg); 
        }

        /* --- CREATIVE BUTTON DESIGN --- */
        .footer-action { margin-top: 60px; text-align: center; }
        
        .button-creative {
          position: relative;
          display: inline-block;
          padding: 1em 2.5em;
          background: #111;
          color: white;
          border: 1px solid var(--border);
          cursor: pointer;
          overflow: hidden;
          transition: color 0.3s, transform 0.3s;
          font-size: 14px;
          font-weight: 700;
          border-radius: 50px;
          z-index: 1;
        }

        .button-creative::before {
          content: '';
          position: absolute;
          left: var(--x, 50%);
          top: var(--y, 50%);
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, var(--primary) 10%, transparent 70%);
          transform: translate(-50%, -50%) scale(0);
          transition: transform 0.4s ease;
          border-radius: 50%;
          opacity: 0.5;
          pointer-events: none;
          z-index: 0;
        }

        .button-creative:hover::before {
          transform: translate(-50%, -50%) scale(1.5);
        }

        .button-creative:hover {
          color: var(--primary);
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }

        /* --- RESPONSIVE --- */
        @media (max-width: 1200px) {
            .card-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }
            .container-1280 { padding: 0 20px; }
        }
        @media (max-width: 900px) {
            .card-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .main-title { font-size: 36px; }
            .main-wrapper { padding: 60px 20px; }
        }
        @media (max-width: 600px) {
            .main-wrapper { padding: 40px 16px; }
            .main-title { font-size: 28px; }
            .card-grid { grid-template-columns: 1fr; gap: 24px; }
            .button-creative { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Companies;