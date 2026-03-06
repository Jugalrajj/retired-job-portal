import React from "react";
import { UserPlus, Handshake, Trophy } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    { 
      id: "01", 
      title: "Create Profile", 
      // Updated Description
      desc: "Showcase your career milestones. Highlight decades of experience and the specific expertise you want to offer in your second innings.",
      icon: <UserPlus size={32} />,
      color: "#4f46e5" // Indigo
    },
    { 
      id: "02", 
      title: "Match & Connect", 
      // Updated Description
      desc: "Connect with companies valuing wisdom. Find flexible, advisory, or mentorship roles tailored specifically for senior professionals.",
      icon: <Handshake size={32} />,
      color: "#10b981" // Emerald
    },
    { 
      id: "03", 
      title: "Build Success", 
      // Updated Description
      desc: "Start your new chapter with dignity. Secure high-impact roles that allow you to stay active, earn, and mentor the next generation.",
      icon: <Trophy size={32} />,
      color: "#fbbf24" // Gold
    }
  ];

  return (
    <section className="how-section">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

          /* --- SECTION WRAPPER --- */
          .how-section {
            background-color: var(--bg-root); /* 🔥 Theme Var */
            /* Removed top padding to fix spacing issue */
            padding: 0 0 30px 0; 
            margin-top: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            position: relative;
            overflow: hidden;
            transition: background-color 0.3s ease;
          }

          /* --- PREMIUM TOP BORDER --- */
          .premium-top-border {
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 1px;
            /* Gold Gradient Line */
            background: linear-gradient(90deg, transparent 0%, var(--primary-dim) 30%, var(--primary) 50%, var(--primary-dim) 70%, transparent 100%);
            z-index: 20;
            box-shadow: 0 0 15px var(--primary-dim);
          }
          
          /* The Center Jewel/Shine */
          .premium-top-border::after {
             content: '';
             position: absolute;
             top: -2px;
             left: 50%;
             transform: translateX(-50%) rotate(45deg);
             width: 6px;
             height: 6px;
             background: var(--primary);
             box-shadow: 0 0 10px 2px var(--primary-dim);
          }

          /* --- BACKGROUND BLOBS --- */
          .how-blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(100px);
            opacity: 0.1;
            z-index: 0;
            pointer-events: none;
          }
          .blob-left {
            width: 600px; height: 600px; background: #4f46e5;
            top: 10%; left: -10%;
          }
          .blob-right {
            width: 500px; height: 500px; background: var(--primary);
            bottom: 10%; right: -5%;
          }

          /* --- CONTAINER 1280px --- */
          .how-container {
            max-width: 1280px;
            margin: 0 auto;
            position: relative;
            z-index: 5;
            padding: 0 40px 0 40px; /* Top padding moved inside container for visual balance */
          }

          /* --- DESIGNER SIDE BORDERS (Gold/Blue) --- */
          .how-container::before {
            content: ""; position: absolute;
            top: 0; bottom: 0; left: 0; width: 1px;
            background: linear-gradient(to bottom, transparent, var(--primary), transparent);
            opacity: 0.3;
            box-shadow: 0 0 15px var(--primary-dim);
          }
          .how-container::after {
            content: ""; position: absolute;
            top: 0; bottom: 0; right: 0; width: 1px;
            background: linear-gradient(to bottom, transparent, var(--primary), transparent);
            opacity: 0.3;
            box-shadow: 0 0 15px var(--primary-dim);
          }

          /* --- HEADER --- */
          .how-header {
            text-align: center;
            margin-bottom: 80px;
            position: relative;
            z-index: 2;
          }
          .how-title {
            font-family: 'Playfair Display', serif;
            font-size: clamp(2.5rem, 4vw, 3rem);
            color: var(--text-main); /* 🔥 Theme Var */
            margin-bottom: 16px;
            letter-spacing: -0.5px;
          }
          .how-title span {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .how-desc {
            color: var(--text-sub); /* 🔥 Theme Var */
            font-size: 1.1rem;
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
          }

          /* --- STEPS GRID --- */
          .steps-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 40px;
            position: relative;
          }

          /* Connector Line (Desktop Only) */
          .steps-grid::before {
            content: '';
            position: absolute;
            top: 85px; /* Aligns with icon center */
            left: 15%;
            right: 15%;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--border) 50%, transparent);
            border-top: 1px dashed var(--border);
            z-index: 0;
          }

          /* --- CARD DESIGN --- */
          .step-card {
            background: var(--bg-card); /* 🔥 Theme Var */
            border: 1px solid var(--border); /* 🔥 Theme Var */
            border-radius: 24px;
            padding: 40px 30px;
            position: relative;
            transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            /* Inner Glow */
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 10px 30px -10px rgba(0,0,0,0.2);
          }

          .step-card:hover {
            transform: translateY(-12px);
            border-color: var(--primary);
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3), 0 0 0 1px var(--primary-dim);
          }

          /* Number Watermark */
          .step-number-bg {
            position: absolute;
            top: 20px;
            right: 30px;
            font-size: 60px;
            font-weight: 800;
            color: var(--border); /* 🔥 Theme Var (Subtle) */
            opacity: 0.3;
            line-height: 1;
            font-family: 'Plus Jakarta Sans', sans-serif;
            transition: 0.3s;
          }
          .step-card:hover .step-number-bg {
            color: var(--primary-dim);
            opacity: 1;
            transform: scale(1.1);
          }

          /* Icon Box */
          .icon-box {
            width: 90px;
            height: 90px;
            border-radius: 24px;
            background: var(--bg-root); /* 🔥 Theme Var */
            border: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            transition: 0.3s;
          }
          
          .step-card:hover .icon-box {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
            border-color: var(--primary);
            color: #fff !important; /* Force white icon on hover */
            transform: rotateY(180deg);
          }
          
          /* Un-rotate icon so it stays upright */
          .step-card:hover .icon-box svg {
             transform: rotateY(-180deg);
          }

          .step-h3 {
            font-size: 1.5rem;
            color: var(--text-main); /* 🔥 Theme Var */
            font-weight: 700;
            margin-bottom: 16px;
            font-family: 'Playfair Display', serif;
          }

          .step-p {
            color: var(--text-sub); /* 🔥 Theme Var */
            font-size: 0.95rem;
            line-height: 1.7;
          }

          /* --- RESPONSIVE --- */
          @media (max-width: 1200px) {
            .how-container::before, .how-container::after { display: none; }
            .how-container { padding: 40px 20px 0 20px; }
          }

          @media (max-width: 900px) {
            .steps-grid { grid-template-columns: 1fr; gap: 30px; }
            .steps-grid::before { display: none; } /* Hide connector on mobile */
            .step-card { flex-direction: row; text-align: left; align-items: flex-start; gap: 20px; padding: 30px; }
            .icon-box { width: 70px; height: 70px; flex-shrink: 0; margin-bottom: 0; }
            .step-number-bg { top: auto; bottom: 20px; right: 20px; }
          }
          
          @media (max-width: 600px) {
             .step-card { flex-direction: column; text-align: center; align-items: center; }
             .icon-box { margin-bottom: 20px; }
             .step-number-bg { top: 20px; bottom: auto; }
          }
        `}
      </style>

      {/* --- TOP BORDER ELEMENT --- */}
      <div className="premium-top-border"></div>

      {/* Background Ambience */}
      <div className="how-blob blob-left"></div>
      <div className="how-blob blob-right"></div>

      <div className="how-container">
        
        {/* Header */}
        <header className="how-header">
          <h2 className="how-title">How It <span>Works</span></h2>
          <p className="how-desc">
            A streamlined process designed specifically for elite professional transitions. 
            We connect wisdom with opportunity.
          </p>
        </header>

        {/* Steps Grid */}
        <div className="steps-grid">
          {steps.map((s, i) => (
            <div key={i} className="step-card">
              <div className="step-number-bg">{s.id}</div>
              
              <div className="icon-box" style={{ color: s.color, boxShadow: `0 10px 30px -10px ${s.color}40` }}>
                {s.icon}
              </div>

              <div style={{position:'relative', zIndex: 2}}>
                <h3 className="step-h3">{s.title}</h3>
                <p className="step-p">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;