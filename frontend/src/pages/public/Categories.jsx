import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { 
  Briefcase, GraduationCap, FolderOpen, HeartHandshake, 
  TrendingUp, PenTool, LayoutGrid, Code, Gavel, Stethoscope, 
  Globe, Cpu, Database, ChevronRight, Layers,
  Shield,
  Factory,
  MessageSquare,
  Construction,
  Landmark
} from "lucide-react";

// --- HELPER: Resolve Image URL ---
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("data:")) return path; 
  // IMPORTANT: Ensure this matches your backend URL (usually localhost:5000)
  return `http://localhost:5000/${path.replace(/\\/g, "/")}`;
};

// --- ICON MAPPER ---
const IconMap = {
  Briefcase: <Briefcase size={24} />,
  GraduationCap: <GraduationCap size={24} />,
  FolderOpen: <FolderOpen size={24} />,
  HeartHandshake: <HeartHandshake size={24} />,
  TrendingUp: <TrendingUp size={24} />,
  PenTool: <PenTool size={24} />,
  Code: <Code size={24} />,
  Gavel: <Gavel size={24} />,
  Stethoscope: <Stethoscope size={24} />,
  Globe: <Globe size={24} />,
  Cpu: <Cpu size={24} />,
  Database: <Database size={24} />,
  LayoutGrid: <LayoutGrid size={24} />,
  Shield: <Shield size={24} />,
  Factory: <Factory size={24} />,
  MessageSquare: <MessageSquare size={24} />,
  Construction: <Construction size={24} />,
  Landmark: <Landmark size={24} />
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/config/categories-public");
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) return (
    <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'var(--bg-root)'}}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
    </div>
  );

  return (
    <section className="dark-cat-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

        .dark-cat-wrapper {
          background-color: var(--bg-root); /* 🔥 Theme Var */
          min-height: calc(100vh - 80px); /* Adjust based on navbar height */
          padding: 60px 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          overflow: hidden;
          transition: background-color 0.3s ease;
        }

        /* --- BACKGROUND BLOBS --- */
        .bg-blob {
          position: absolute; border-radius: 50%; filter: blur(120px);
          opacity: 0.15; z-index: 0; pointer-events: none;
        }
        .b1 { top: -10%; left: -10%; width: 600px; height: 600px; background: #4f46e5; }
        .b2 { bottom: -10%; right: -10%; width: 500px; height: 500px; background: var(--primary); }

        /* --- CONTENT CONTAINER (1280px) --- */
        .content-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 5;
        }

        /* --- HEADER --- */
        .header-box {
          text-align: center;
          margin-bottom: 60px;
        }
        .header-box h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.5rem, 4vw, 3.5rem);
          font-weight: 700;
          color: var(--text-main); /* 🔥 Theme Var */
          margin: 0 0 16px 0;
          line-height: 1.2;
        }
        .header-box span {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .header-box p {
          font-size: 1.1rem;
          color: var(--text-sub); /* 🔥 Theme Var */
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* --- GRID --- */
        .cat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          padding-bottom: 40px;
        }

        /* --- CARD DESIGN --- */
        .cat-card {
          background: var(--bg-card); /* 🔥 Theme Var */
          border: 1px solid var(--border); /* 🔥 Theme Var */
          border-radius: 20px;
          height: 280px; 
          padding: 30px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }

        .cat-card:hover {
          transform: translateY(-8px);
          border-color: var(--primary);
          box-shadow: 0 20px 50px -10px rgba(0,0,0,0.15);
        }

        /* Background Image Layer */
        .card-bg-image {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-size: cover;
          background-position: center;
          transition: transform 0.6s ease;
          z-index: 0;
          opacity: 0.6; /* Dim image slightly */
        }
        
        .cat-card:hover .card-bg-image {
          transform: scale(1.1);
          opacity: 0.8;
        }

        /* Dark Overlay Gradient (Always Dark for text readability) */
        .card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(2,6,23,0.3) 0%, rgba(2,6,23,0.9) 100%);
          z-index: 1;
        }

        /* Content Wrapper */
        .card-content {
          position: relative;
          z-index: 2;
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
        }

        /* Icon Styling */
        .icon-box {
          width: 60px; height: 60px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: auto; 
          transition: 0.3s;
          background: var(--bg-input); /* 🔥 Theme Var */
          border: 1px solid var(--border);
          color: var(--primary);
        }

        /* Text Styling */
        .cat-info { margin-top: 20px; }

        .cat-info h3 {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-main); /* 🔥 Theme Var */
          margin: 0 0 8px 0;
          line-height: 1.3;
        }

        .cat-info p {
          font-size: 14px;
          color: var(--text-sub); /* 🔥 Theme Var */
          font-weight: 500;
          display: flex; align-items: center; gap: 6px;
        }

        /* Status Dot */
        .status-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #10b981; /* Green */
          box-shadow: 0 0 5px rgba(16, 185, 129, 0.5);
        }

        /* Arrow Action */
        .arrow-action {
          position: absolute; bottom: 0; right: 0;
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--primary);
          display: flex; align-items: center; justify-content: center;
          color: #000;
          opacity: 0; transform: translate(10px, 10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .cat-card:hover .arrow-action {
          opacity: 1; transform: translate(0, 0);
        }

        /* --- CARD WITH IMAGE OVERRIDES --- */
        .cat-card.has-image { border: none; }
        
        /* Force white text on image cards regardless of theme */
        .cat-card.has-image .icon-box {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          color: #fff;
          border-color: rgba(255,255,255,0.3);
        }

        .cat-card.has-image .cat-info h3 { 
          color: #ffffff; /* Explicit White */
          text-shadow: 0 2px 4px rgba(0,0,0,0.5); 
        }
        .cat-card.has-image .cat-info p { color: rgba(255, 255, 255, 0.9); }

        /* --- RESPONSIVE --- */
        @media (max-width: 768px) {
          .cat-grid { grid-template-columns: 1fr; }
          .header-box h2 { font-size: 2.5rem; }
          .dark-cat-wrapper { padding: 40px 20px; }
        }
      `}</style>

      {/* Background Ambience */}
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="content-container">
        
        <header className="header-box">
          <h2>Explore <span>Expertise Hubs</span></h2>
          <p>Discover specialized sectors where your experience creates the most impact.</p>
        </header>

        <div className="cat-grid">
          {categories.map((cat, index) => {
            // Check for image
            const bgImage = getImageUrl(cat.image);
            const hasImage = !!bgImage;

            return (
              <div 
                key={index} 
                className={`cat-card ${hasImage ? 'has-image' : ''}`}
                onClick={() => navigate(`/category/${encodeURIComponent(cat.title)}`)}
              >
                {/* 1. Background Image Layer (Conditional) */}
                {hasImage && (
                  <>
                    <div 
                      className="card-bg-image" 
                      style={{ backgroundImage: `url('${bgImage}')` }} 
                    />
                    <div className="card-overlay"></div>
                  </>
                )}

                {/* 2. Content Wrapper */}
                <div className="card-content">
                  <div className="icon-box">
                    {IconMap[cat.icon] || <Layers size={28}/>}
                  </div>
                  
                  <div className="cat-info">
                    <h3>{cat.title}</h3>
                    <p>
                      {cat.jobCount > 0 ? (
                        <>
                          <span className="status-dot"></span> 
                          {cat.jobCount} Active Roles
                        </>
                      ) : (
                        "No openings currently"
                      )}
                    </p>
                  </div>

                  <div className="arrow-action">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Categories;