import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Briefcase, AlertCircle, CheckCircle } from "lucide-react";
import heroPageBanner from '../assets/HeroPageBanner.jpg';

const Hero = () => {
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState({
    title: "",
    location: ""
  });

  const [titleError, setTitleError] = useState(false);

  const handleSearch = (e) => {
    if (e) e.preventDefault();

    if (!searchQuery.title.trim()) {
      setTitleError(true);
      return; 
    }

    setTitleError(false);
    navigate(`/find-jobs?title=${searchQuery.title}&location=${searchQuery.location}`);
  };

  const handleTitleChange = (e) => {
    setSearchQuery({ ...searchQuery, title: e.target.value });
    if (titleError && e.target.value.trim()) {
      setTitleError(false);
    }
  };

  return (
    <div className="hero-page-wrapper">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

          /* --- 1. PAGE WRAPPER --- */
          .hero-page-wrapper {
            background-color: var(--bg-root); 
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            transition: background-color 0.3s ease;
          }

          /* --- 2. 1280PX HERO CARD --- */
          .hero-container {
            width: 100%;
            max-width: 1280px;
            height: 700px;
            border-radius: 32px;
            position: relative;
            overflow: hidden;
            border: 1px solid var(--border); 
            display: flex;
            align-items: center;
          }

          /* --- 3. BACKGROUND IMAGE & MASK --- */
          .hero-bg {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: url(${heroPageBanner});
            background-size: cover;
            background-position: center center;
            z-index: 0;
          }

          .hero-gradient {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(
              90deg, 
              var(--bg-root) 0%, 
              var(--bg-root) 20%, 
              rgba(255, 255, 255, 0) 100%
            );
            z-index: 1;
            transition: background 0.3s ease;
          }

          /* --- 4. CONTENT LAYOUT --- */
          .hero-content {
            position: relative;
            z-index: 2;
            width: 100%;
            max-width: 650px;
            padding-left: 80px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          /* --- TYPOGRAPHY --- */
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: var(--primary-dim); 
            border: 1px solid var(--primary); 
            color: var(--primary);
            padding: 8px 16px;
            border-radius: 50px;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 24px;
          }

          .hero-title {
            font-family: 'Playfair Display', serif;
            font-size: clamp(3rem, 5vw, 4.5rem);
            line-height: 1.1;
            font-weight: 800;
            color: var(--text-main); 
            margin: 0 0 20px 0;
            letter-spacing: -1px;
          }

          .hero-title span {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 0 20px var(--primary-dim));
          }
          
          .hero-subtitle {
            font-size: 1.1rem;
            line-height: 1.6;
            color: var(--text-sub); 
            margin-bottom: 40px;
            max-width: 500px;
            font-weight: 400;
          }

          /* --- SEARCH FORM --- */
          .search-form {
            background: var(--bg-card); 
            border: 1px solid var(--border);
            border-radius: 16px; 
            padding: 8px;
            display: flex;
            align-items: center;
            width: 100%;
            max-width: 650px; /* Slightly wider to fit new button */
            box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            position: relative;
          }

          .search-form:focus-within {
            border-color: var(--primary);
            box-shadow: 0 15px 30px -10px var(--primary-dim);
            transform: translateY(-2px);
          }

          .form-group {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 20px;
            height: 56px;
            position: relative;
          }

          .form-group:first-child {
            border-right: 1px solid var(--border);
          }

          .form-group input {
            background: transparent;
            border: none;
            outline: none;
            width: 100%;
            font-size: 15px;
            color: var(--text-main); 
            font-weight: 500;
          }
          .form-group input::placeholder { color: var(--text-sub); }

          .input-icon { color: var(--text-sub); min-width: 20px; }
          .form-group:focus-within .input-icon { color: var(--primary); }
          
          .error-message {
            position: absolute;
            bottom: -30px;
            left: 20px;
            color: var(--danger);
            font-size: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          /* --- NEW BUTTON CSS INTEGRATION --- */
          .cssbuttons-io-button {
            background: #d97706;
            color: white;
            font-family: inherit;
            padding: 0.35em;
            padding-left: 1.2em;
            font-size: 17px;
            font-weight: 500;
            border-radius: 0.9em;
            border: none;
            letter-spacing: 0.05em;
            display: flex;
            align-items: center;
            box-shadow: inset 0 0 1.6em -0.6em #d97706;
            overflow: hidden;
            position: relative;
            height: 2.8em;
            padding-right: 3.3em;
            cursor: pointer;
            margin-left: 10px; /* Spacing from inputs */
            white-space: nowrap;
          }

          .cssbuttons-io-button .icon {
            background: white;
            margin-left: 1em;
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 2.2em;
            width: 2.2em;
            border-radius: 0.7em;
            box-shadow: 0.1em 0.1em 0.6em 0.2em #d97706;
            right: 0.3em;
            transition: all 0.3s;
          }

          .cssbuttons-io-button:hover .icon {
            width: calc(100% - 0.6em);
          }

          .cssbuttons-io-button .icon svg {
            width: 1.1em;
            transition: transform 0.3s;
            color: #d97706;
          }

          .cssbuttons-io-button:hover .icon svg {
            transform: translateX(0.1em);
          }

          .cssbuttons-io-button:active .icon {
            transform: scale(0.95);
          }
          /* --- END BUTTON CSS --- */

          /* --- STATS ROW --- */
          .stats-row {
            display: flex;
            gap: 40px;
            margin-top: 50px;
            border-top: 1px solid var(--border); 
            padding-top: 30px;
            width: 100%;
          }

          .stat-item h3 { font-size: 24px; font-weight: 800; color: var(--text-main); margin: 0; }
          .stat-item p { font-size: 13px; color: var(--text-sub); margin: 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px; }

          /* --- RESPONSIVE --- */
          @media (max-width: 1024px) {
            .hero-container { height: auto; padding: 60px 0; }
            .hero-content { align-items: center; text-align: center; padding: 0 40px; margin: 0 auto; max-width: 800px; }
            
            .hero-gradient {
              background: var(--bg-root);
              opacity: 0.85;
            }
            
            .stats-row { justify-content: center; }
          }

          @media (max-width: 768px) {
            .hero-title { font-size: 2.5rem; }
            
            .search-form { flex-direction: column; height: auto; padding: 10px; border-radius: 20px; gap: 10px; }
            
            .form-group { width: 100%; border-right: none !important; border-bottom: 1px solid var(--border); padding: 0 10px; height: 50px; }
            .form-group:last-of-type { border-bottom: none; }
            
            /* Adjust new button for mobile */
            .cssbuttons-io-button { width: 100%; justify-content: center; margin-left: 0; padding-right: 0.35em; padding-left: 0.35em; }
            .cssbuttons-io-button .icon { position: relative; right: auto; margin-left: 10px; }
            .cssbuttons-io-button:hover .icon { width: 2.2em; } /* Disable expand effect on mobile for better UX or keep as is */
            
            .stats-row { flex-wrap: wrap; gap: 20px; justify-content: space-between; }
            .stat-item { flex: 1; min-width: 100px; text-align: center; }
          }
        `}
      </style>

      <div className="hero-container">
        
        {/* 1. Background Image */}
        <div className="hero-bg"></div>
        
        {/* 2. Gradient Overlay */}
        <div className="hero-gradient"></div>

        {/* 3. Content */}
        <div className="hero-content">
          
          <div className="badge">
            <CheckCircle size={14} /> Second Innings
          </div>

          <h1 className="hero-title">
            India Needs Your <br/>
            <span>Experience.</span>
          </h1>

          <p className="hero-subtitle">
            Turn your decades of leadership into India's growth story. We connect retired professionals with organizations that value wisdom for advisory and strategic roles.
          </p>

          <form className="search-form" onSubmit={handleSearch}>
            <div className="form-group">
              <Briefcase size={20} className="input-icon" />
              <input 
                type="text" 
                placeholder="Job Title (e.g. Advisor)..." 
                value={searchQuery.title}
                onChange={handleTitleChange}
              />
              {titleError && <div className="error-message"><AlertCircle size={12}/> Required</div>}
            </div>

            <div className="form-group">
              <MapPin size={20} className="input-icon" />
              <input 
                type="text" 
                placeholder="City / Remote" 
                value={searchQuery.location}
                onChange={(e) => setSearchQuery({ ...searchQuery, location: e.target.value })}
              />
            </div>

            {/* NEW BUTTON IMPLEMENTATION */}
            <button className="cssbuttons-io-button" type="submit">
              Find Roles
              <div className="icon">
                <svg 
                  height="24" 
                  width="24" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M10 2a8 8 0 016.32 12.906l5.387 5.387a1 1 0 01-1.414 1.414l-5.387-5.387A8 8 0 1110 2zm0 2a6 6 0 100 12 6 6 0 000-12z" 
                    fill="currentColor"
                  ></path>
                </svg>
              </div>
            </button>
            {/* END NEW BUTTON */}

          </form>
{/* 
          <div className="stats-row">
            <div className="stat-item">
               <h3>2,500+</h3>
               <p>Open Roles</p>
            </div>
            <div className="stat-item">
               <h3>450+</h3>
               <p>Enterprises</p>
            </div>
            <div className="stat-item">
               <h3>12k+</h3>
               <p>Placements</p>
            </div>
          </div> */}

        </div>
      </div>
    </div>
  );
};

export default Hero;