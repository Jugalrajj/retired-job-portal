import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { MapPin, ArrowRight,Briefcase } from "lucide-react";

// --- HELPER: LOGO URL ---
const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/4091/4091968.png";

const getLogoUrl = (url) => {
  if (!url || url.trim() === "") return DEFAULT_LOGO;
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
  if (url.startsWith("http")) return url;
  let cleanPath = url.replace(/\\/g, "/");
  if (cleanPath.startsWith("/")) cleanPath = cleanPath.substring(1);
  return `http://localhost:5000/${cleanPath}`;
};

// --- HELPER: Random Cover Image for aesthetic ---
const getCoverImage = (index) => {
  const images = [
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"
  ];
  return images[index % images.length];
};

// --- HELPER: Format Location properly ---
const formatLocation = (locations) => {
  if (!locations) return "Remote";
  if (Array.isArray(locations)) {
    return locations.join(", ");
  }
  return locations;
};

const FeaturedJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/jobs");
        if (data.length > 0) {
          // Duplicate list 3 times for infinite scroll effect
          setJobs([...data, ...data, ...data]); 
        }
      } catch (err) {
        console.error("Error fetching featured jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (loading) return null; 

  return (
    <section className="featured-section">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

          .featured-section {
            background-color: var(--bg-root); /* 🔥 Theme Var */
            padding: 45px 0; 
            font-family: 'Plus Jakarta Sans', sans-serif;
            overflow: hidden;
            width: 100%;
            position: relative;
            transition: background-color 0.3s ease;
          }

          /* --- PREMIUM TOP SECTION BORDER --- */
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

          /* --- BACKGROUND BLOBS --- */
          .bg-blob {
            position: absolute; border-radius: 50%; filter: blur(120px);
            opacity: 0.1; z-index: 0; pointer-events: none;
          }
          .blob-1 {
             width: 800px; height: 800px; background: #4f46e5;
             top: -200px; left: 50%; transform: translateX(-50%);
          }

          .header-center {
            text-align: center; margin-bottom: 50px; position: relative; z-index: 10;
          }
          .title-main {
            font-family: 'Playfair Display', serif;
            color: var(--text-main); /* 🔥 Theme Var */
            font-size: clamp(2rem, 4vw, 3rem);
            font-weight: 700; margin: 0;
            letter-spacing: -0.5px; line-height: 1.2;
          }
          .title-main span {
             background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
             -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          }
          .subtitle-main {
            color: var(--text-sub); /* 🔥 Theme Var */
            margin-top: 10px;
            font-size: 1.1rem; font-weight: 500;
          }

          /* --- CONTAINER (Strictly 1280px) --- */
          .carousel-container {
            max-width: 1280px; 
            margin: 0 auto;
            position: relative;
            z-index: 5;
            padding: 0 30px; /* Space inside the borders */
          }

          /* --- LEFT & RIGHT DESIGNER BORDERS --- */
          /* Left Line */
          .carousel-container::before {
            content: ""; position: absolute;
            top: 10%; bottom: 10%; left: 0; width: 1px;
            background: linear-gradient(to bottom, transparent, var(--primary), transparent);
            opacity: 0.4;
            box-shadow: 0 0 10px var(--primary-dim);
          }
          /* Right Line */
          .carousel-container::after {
            content: ""; position: absolute;
            top: 10%; bottom: 10%; right: 0; width: 1px;
            background: linear-gradient(to bottom, transparent, var(--primary), transparent);
            opacity: 0.4;
            box-shadow: 0 0 10px var(--primary-dim);
          }

          /* CAROUSEL */
          .carousel-viewport {
            width: 100%; overflow: hidden; padding: 20px 0 40px 0;
            /* Fade edges */
            mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          }

          .carousel-track {
            display: flex; width: max-content; gap: 24px;
            animation: scroll-infinite 60s linear infinite;
          }
          .carousel-track:hover { animation-play-state: paused; }

          @keyframes scroll-infinite {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-33.33% - 12px)); }
          }

          /* --- COMPACT CARD DESIGN --- */
          .f-card {
            width: 290px; /* Slightly narrower */
            background: var(--bg-card); /* 🔥 Theme Var */
            border: 1px solid var(--border); /* 🔥 Theme Var */
            /* Inner top highlight + Shadow */
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.2);
            border-radius: 16px;
            display: flex; flex-direction: column;
            position: relative; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            overflow: hidden; flex-shrink: 0; cursor: pointer;
          }

          .f-card:hover {
            transform: translateY(-6px);
            border-color: var(--primary); 
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--primary-dim);
          }

          /* COMPACT HEADER */
          .f-card-header {
            position: relative; height: 90px; /* Reduced Height */
            flex-shrink: 0;
          }
          .f-card-cover {
            width: 100%; height: 100%; position: absolute; top: 0; left: 0;
            background-size: cover; background-position: center;
          }
          .f-card-cover::after {
             content: ''; position: absolute; inset: 0;
             background: linear-gradient(to bottom, transparent 0%, var(--bg-card) 100%); /* 🔥 Seamless Fade */
          }

          /* SMALLER AVATAR */
          .f-card-avatar {
            width: 48px; height: 48px; /* Smaller Logo */
            border-radius: 12px; object-fit: contain;
            position: absolute; bottom: -24px; left: 20px;
            border: 1px solid var(--border);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
            z-index: 2; background: #ffffff; padding: 4px;
          }

          /* COMPACT BODY */
          .f-card-main {
            padding: 30px 20px 16px 20px; /* Reduced Padding */
            flex: 1; display: flex; flex-direction: column;
          }

          .f-card-fullname {
            font-size: 16px; /* Smaller Title */
            font-weight: 700; color: var(--text-main); /* 🔥 Theme Var */
            margin-bottom: 2px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }

          .company-name {
            font-weight: 600; font-size: 12px;
            color: var(--primary); /* 🔥 Theme Var */
            text-transform: uppercase; letter-spacing: 0.5px;
            margin-bottom: 8px;
          }

          .f-card-desc {
            font-family: "DM Sans", sans-serif;
            font-size: 13px; color: var(--text-sub); /* 🔥 Theme Var */
            line-height: 1.5;
            display: -webkit-box; -webkit-line-clamp: 2;
            -webkit-box-orient: vertical; overflow: hidden;
            margin-bottom: 12px;
          }

          .f-tags {
            display: flex; gap: 6px; margin-top: auto; flex-wrap: wrap;
          }
          .f-tag {
            display: flex; align-items: center; gap: 4px;
            font-size: 10px;
            background: var(--bg-input); /* 🔥 Theme Var */
            padding: 4px 8px; border-radius: 6px;
            color: var(--text-sub); font-weight: 500;
            border: 1px solid var(--border);
          }

          /* COMPACT FOOTER */
          .f-card-buttons {
            display: flex; gap: 10px;
            border-top: 1px solid var(--border);
            background: var(--bg-input); /* 🔥 Theme Var */
            padding: 12px 20px; /* Reduced Padding */
          }

          .f-btn {
            border-radius: 8px;
            font-family: "Plus Jakarta Sans", sans-serif;
            font-weight: 600; font-size: 12px;
            cursor: pointer; transition: all 0.2s;
            display: flex; align-items: center; justify-content: center;
            height: 36px; /* Smaller Buttons */
          }

          .f-btn.secondary {
             flex: 1; background: transparent;
             border: 1px solid var(--border); color: var(--text-sub);
          }
          .f-btn.secondary:hover {
             border-color: var(--text-main); color: var(--text-main); background: var(--bg-root);
          }

          .f-btn.primary {
            flex: 1.5;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
            color: #ffffff; border: none; gap: 5px;
            box-shadow: 0 4px 10px var(--primary-dim);
          }
          .f-btn.primary:hover {
            filter: brightness(1.1); transform: translateY(-1px);
            box-shadow: 0 6px 15px var(--primary-dim);
          }

          /* RESPONSIVE */
          @media (max-width: 1300px) {
             /* Hide decorative side borders if screen is smaller than container */
             .carousel-container::before, .carousel-container::after { display: none; }
             .carousel-container { padding: 0 20px; }
          }
          @media (max-width: 768px) {
            .featured-section { padding: 50px 0; }
            .carousel-track { gap: 16px; }
            .f-card { width: 260px; }
            .title-main { font-size: 2rem; }
          }
        `}
      </style>

      {/* Top Border Element */}
      <div className="premium-top-border"></div>

      <div className="bg-blob blob-1"></div>

      <div className="header-center">
        <h2 className="title-main">Top <span>Featured Roles</span></h2>
        <p className="subtitle-main">Explore hand-picked opportunities from leading companies.</p>
      </div>

      <div className="carousel-container">
        <div className="carousel-viewport">
          <div className="carousel-track">
            {jobs.map((job, index) => {
              const companyName = job.companyId?.name || job.employer?.name || "Hiring Company";
              const rawLogo = job.companyId?.logo || job.employer?.logoUrl;
              const logoUrl = getLogoUrl(rawLogo);
              const salary = job.salary ? `₹${parseInt(job.salary).toLocaleString()}` : "N/A";
              const coverImg = getCoverImage(index);
              const locationDisplay = formatLocation(job.locations);
              
              return (
                <div 
                  key={`${job._id}-${index}`} 
                  className="f-card"
                  onClick={() => navigate(`/find-jobs?id=${job._id}`)}
                >
                  
                  {/* HEADER */}
                  <div className="f-card-header">
                    <div className="f-card-cover" style={{ backgroundImage: `url('${coverImg}')` }}></div>
                    <img className="f-card-avatar" src={logoUrl} alt="logo" />
                  </div>

                  {/* BODY */}
                  <div className="f-card-main">
                    <div className="f-card-fullname">{job.title}</div>
                    <div className="company-name">{companyName}</div>
                    
                    <p className="f-card-desc">
                      {job.description || "View details for more info on this role."}
                    </p>

                    <div className="f-tags">
                        <div className="f-tag" title={locationDisplay}>
                            <MapPin size={10}/> {locationDisplay}
                        </div>
                        <div className="f-tag">  {salary}</div>
                        <div className="f-tag"><Briefcase size={10}/> {job.workType || "Full Time"}</div>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="f-card-buttons">
                    <button className="f-btn secondary">View</button>
                    <button className="f-btn primary">
                      Apply <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedJobs;