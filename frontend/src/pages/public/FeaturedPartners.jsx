import React, { useState, useEffect } from "react";
import api from "../../services/api";

// Helper to construct image URL
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `http://localhost:5000/${path.replace(/\\/g, "/")}`;
};

const FeaturedPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data } = await api.get("/partners");
        setPartners(data);
      } catch (err) {
        console.error("Failed to load partners", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  if (loading || partners.length === 0) return null;

  return (
    <section className="partners-section">
      <style>{`
        .partners-section {
          background-color: #020617; /* Dark Navy Background */
          padding: 50px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
        }

        .partners-container {
          max-width: 1280px;
          margin: 0 auto;
          text-align: center;
          padding: 0 20px;
        }

        .section-label {
          color: white;
          font-size: 25px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 40px;
          display: block;
          opacity: 0.8;
        }

        /* --- MARQUEE ANIMATION --- */
        .marquee-wrapper {
          display: flex;
          overflow: hidden;
          position: relative;
          /* Fade edges for seamless look */
          mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
        }

        .marquee-track {
          display: flex;
          align-items: center;
          gap: 80px; /* Consistent spacing */
          animation: scroll 40s linear infinite;
          width: max-content;
          padding: 10px 0;
        }

        .marquee-wrapper:hover .marquee-track {
          animation-play-state: paused;
        }

        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* --- LOGO CONTAINER (Strict Sizing) --- */
        .partner-logo-item {
          /* Fixed Box Size for Uniformity */
          width: 150px; 
          height: 80px; 
          
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
        }

        .partner-logo-item:hover {
          transform: scale(1.1); 
        }

        /* --- LOGO IMAGE STYLING --- */
        .partner-img {
          /* Force image to fit inside the fixed box */
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain; /* Prevents stretching */
          
          /* Default State: Grayscale & Dimmed */
          filter: grayscale(100%) opacity(0.5) brightness(1.2); 
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Hover State: Full Color & Glow */
        .partner-logo-item:hover .partner-img {
          filter: grayscale(0%) opacity(1) brightness(1);
          drop-shadow: 0 0 15px rgba(255, 255, 255, 0.15);
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .marquee-track { gap: 50px; }
          .partner-logo-item { width: 110px; height: 60px; }
        }
      `}</style>

      <div className="partners-container">
        <span className="section-label">Trusted By Leading Organizations</span>
        
        <div className="marquee-wrapper">
          <div className="marquee-track">
            {/* Duplicate list for infinite loop */}
            {[...partners, ...partners].map((p, index) => (
              <div key={`${p._id}-${index}`} className="partner-logo-item" title={p.name}>
                <img 
                  src={getImageUrl(p.logo)} 
                  alt={p.name} 
                  className="partner-img"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPartners;