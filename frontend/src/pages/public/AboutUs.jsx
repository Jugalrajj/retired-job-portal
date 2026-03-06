import React from "react";
import { Link } from "react-router-dom";
import { 
  Briefcase, ShieldCheck, Target, ArrowRight, 
  CheckCircle2, Building2, UserPlus, Star, 
  HeartHandshake, Compass,
  Award
} from "lucide-react";
import bgImage from "../../assets/bgImage2.png"; // Local image for hero section
import mentorshipImage from "../../assets/ImageBg2.png"; // Local image for mentorship
import teamworkImage from "../../assets/BgImage4.png"; // Local image for teamwork

const AboutUsPage = () => {
  return (
    <div className="shape-about-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        /* --- CORE WRAPPER --- */
        .shape-about-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root, #f8fafc);
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          overflow: hidden;
          color: var(--text-main, #0f172a);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* --- ORGANIC BACKGROUND BLOBS --- */
        .bg-shape {
          position: absolute; filter: blur(90px); z-index: 0; pointer-events: none;
          opacity: 0.4;
        }
        .shape-1 { top: -10%; left: -5%; width: 50vw; height: 50vw; background: rgba(245, 158, 11, 0.15); border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; animation: morph 15s ease-in-out infinite alternate; }
        .shape-2 { top: 40%; right: -10%; width: 40vw; height: 40vw; background: rgba(79, 70, 229, 0.1); border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; animation: morph 20s ease-in-out infinite alternate-reverse; }
        .shape-3 { bottom: -20%; left: 10%; width: 60vw; height: 40vw; background: rgba(16, 185, 129, 0.1); border-radius: 50%; animation: morph 25s ease-in-out infinite alternate; }

        @keyframes morph {
          0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; transform: rotate(0deg) scale(1); }
          100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(10deg) scale(1.05); }
        }

        /* --- ANIMATIONS --- */
        .fade-in-up {
          opacity: 0; transform: translateY(40px);
          animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }
        .delay-3 { animation-delay: 0.6s; }
        .delay-4 { animation-delay: 0.8s; }

        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }

        /* --- CONTAINER --- */
        .container {
          width: 100%; max-width: 1280px; margin: 0 auto;
          position: relative; z-index: 5;
        }

        /* --- 1. HERO PILL SECTION --- */
        .hero-section {
          padding: 60px 20px;
        }
        .hero-pill {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 100px; /* Massive pill shape */
          padding: 20px;
          display: flex; align-items: center; justify-content: space-between;
          box-shadow: 0 30px 60px -15px rgba(0,0,0,0.08);
          position: relative;
        }
        .hero-content {
          flex: 1; padding: 60px 80px; text-align: left;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--primary-dim, rgba(245, 158, 11, 0.1));
          color: var(--primary, #f59e0b); padding: 8px 20px;
          border-radius: 50px; font-weight: 700; font-size: 13px;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px;
        }
        .hero-title {
          font-family: 'Playfair Display', serif; font-size: clamp(2.5rem, 4vw, 4rem);
          font-weight: 800; line-height: 1.1; margin-bottom: 20px;
          color: var(--text-main);
        }
        .hero-title span { color: var(--primary, #f59e0b); }
        .hero-desc {
          font-size: 1.15rem; color: var(--text-sub); line-height: 1.7;
          margin-bottom: 40px; max-width: 500px;
        }
        .hero-image-box {
          width: 45%; height: 600px;
          border-radius: 80px; /* Matching inner curve */
          overflow: hidden; position: relative;
        }
        .hero-image-box img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.7s ease;
        }
        .hero-pill:hover .hero-image-box img { transform: scale(1.05); }

        /* --- 2. MISSION ASYMMETRY --- */
        .mission-section {
          padding: 120px 40px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 80px;
          align-items: center;
        }
        .mission-visuals {
          position: relative; height: 500px;
        }
        /* Arch Shape */
        .arch-img {
          position: absolute; left: 0; bottom: 0;
          width: 65%; height: 85%;
          border-radius: 200px 200px 20px 20px;
          overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          border: 10px solid var(--bg-root); z-index: 2;
        }
        /* Circle Shape */
        .circle-img {
          position: absolute; right: 0; top: 0;
          width: 55%; aspect-ratio: 1;
          border-radius: 50%;
          overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          z-index: 1;
        }
        .mission-visuals img { width: 100%; height: 100%; object-fit: cover; }
        
        .mission-text h2 {
          font-family: 'Playfair Display', serif; font-size: 3rem;
          font-weight: 700; margin-bottom: 24px; color: var(--text-main);
        }
        .mission-text p {
          font-size: 1.1rem; color: var(--text-sub); line-height: 1.8; margin-bottom: 24px;
        }

        /* --- 3. DUAL ROLE (INTERLOCKING CARDS) --- */
        .roles-section { padding: 100px 40px; }
        .roles-header { text-align: center; margin-bottom: 80px; }
        .roles-header h2 { font-family: 'Playfair Display', serif; font-size: 3rem; color: var(--text-main); margin-bottom: 16px;}
        .roles-header p { color: var(--text-sub); font-size: 1.2rem; }

        .roles-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 40px;
        }
        .role-card {
          background: var(--bg-card); padding: 60px 50px;
          box-shadow: 0 20px 50px -10px rgba(0,0,0,0.08);
          border: 1px solid var(--border); transition: 0.4s ease;
          position: relative;
        }
        /* Unique Shapes for Cards */
        .role-card.seeker { border-radius: 100px 40px 40px 40px; }
        .role-card.employer { border-radius: 40px 40px 100px 40px; margin-top: 40px; } /* Staggered effect */
        
        .role-card:hover { transform: translateY(-10px); border-color: var(--primary); }
        
        .role-icon-wrapper {
          width: 80px; height: 80px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 30px;
        }
        .seeker .role-icon-wrapper { background: var(--primary-dim); color: var(--primary); }
        .employer .role-icon-wrapper { background: rgba(79, 70, 229, 0.1); color: #4f46e5; }

        .role-card h3 { font-size: 2rem; font-weight: 700; margin-bottom: 20px; color: var(--text-main); }
        .role-card p { color: var(--text-sub); line-height: 1.7; margin-bottom: 30px; font-size: 1.1rem; }
        
        .role-list { list-style: none; padding: 0; margin-bottom: 40px; }
        .role-list li { 
          display: flex; align-items: center; gap: 15px; margin-bottom: 15px; 
          font-weight: 600; color: var(--text-main); font-size: 1rem;
        }
        .seeker .role-list li svg { color: var(--primary); }
        .employer .role-list li svg { color: #4f46e5; }

        /* --- 4. CORE VALUES (CAPSULES) --- */
        .values-section { padding: 100px 40px; background: var(--bg-input); border-radius: 80px; margin: 0 20px;}
        .values-header { text-align: center; margin-bottom: 60px; }
        .values-header h2 { font-family: 'Playfair Display', serif; font-size: 2.5rem; color: var(--text-main); }
        
        .values-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px;
        }
        .capsule {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 100px; /* Capsule shape */
          padding: 50px 30px; text-align: center;
          transition: 0.4s ease; box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          display: flex; flex-direction: column; align-items: center;
        }
        .capsule:hover {
          transform: translateY(-15px); border-color: var(--primary);
          box-shadow: 0 20px 40px rgba(245, 158, 11, 0.1);
        }
        .cap-icon {
          width: 70px; height: 70px; border-radius: 50%;
          background: var(--primary-dim); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 24px;
        }
        .capsule h4 { font-size: 1.2rem; font-weight: 700; color: var(--text-main); margin-bottom: 16px; }
        .capsule p { font-size: 0.95rem; color: var(--text-sub); line-height: 1.6; margin: 0; }

        /* --- 5. CTA WAVE --- */
        .cta-section {
          margin: 100px 20px 40px; padding: 80px 40px;
          background: var(--text-main); color: var(--bg-root);
          border-radius: 40px 120px 40px 120px; /* Dynamic leaf shape */
          text-align: center; position: relative; overflow: hidden;
        }
        .cta-section h2 { font-family: 'Playfair Display', serif; font-size: 3rem; font-weight: 700; margin-bottom: 20px; color: var(--bg-root); }
        .cta-section p { font-size: 1.2rem; opacity: 0.9; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; color: var(--bg-root);}
        
        /* Buttons */
        .btn {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 18px 40px; border-radius: 50px;
          font-weight: 700; font-size: 16px; transition: 0.3s;
          text-decoration: none; border: none; cursor: pointer;
        }
        .btn-primary { background: var(--primary); color: #000; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4); }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(245, 158, 11, 0.6); }
        
        .btn-white { background: var(--bg-card); color: var(--text-main); }
        .btn-white:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(255,255,255,0.2); }

        .cta-actions { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;}

        /* --- RESPONSIVE ADJUSTMENTS --- */
        @media (max-width: 1024px) {
          .hero-pill { flex-direction: column; border-radius: 60px; padding: 20px; }
          .hero-content { padding: 40px 20px; text-align: center; align-items: center; display: flex; flex-direction: column;}
          .hero-image-box { width: 100%; height: 400px; border-radius: 40px; }
          .mission-section { grid-template-columns: 1fr; gap: 60px; text-align: center; }
          .mission-visuals { width: 100%; max-width: 500px; margin: 0 auto; height: 400px; }
          .roles-grid { grid-template-columns: 1fr; }
          .role-card.employer { margin-top: 0; }
          .values-grid { grid-template-columns: repeat(2, 1fr); }
          .cta-section { border-radius: 40px; }
        }

        @media (max-width: 768px) {
          .hero-section { padding: 20px 10px; }
          .hero-pill { border-radius: 40px; }
          .hero-title { font-size: 2.5rem; }
          .mission-section { padding: 60px 20px; }
          .arch-img { width: 80%; height: 70%; border-radius: 100px 100px 20px 20px; }
          .circle-img { width: 60%; }
          .roles-section { padding: 60px 20px; }
          .role-card.seeker { border-radius: 40px; }
          .role-card.employer { border-radius: 40px; }
          .values-section { padding: 60px 20px; border-radius: 40px; margin: 0 10px; }
          .values-grid { grid-template-columns: 1fr; }
          .capsule { border-radius: 40px; padding: 40px 30px; }
          .cta-section { padding: 60px 20px; margin: 40px 10px; }
          .cta-actions { flex-direction: column; }
          .btn { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* BACKGROUND BLOBS */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <div className="container">
        
        {/* --- HERO PILL --- */}
        <section className="hero-section fade-in-up">
          <div className="hero-pill">
            <div className="hero-content">
              <div className="hero-badge"><Star size={14} fill="currentColor"/> India's Premier Platform</div>
              <h1 className="hero-title">Experience Doesn't Retire. <br/> It <span>Evolves.</span></h1>
              <p className="hero-desc">
                Connecting seasoned, retired professionals with forward-thinking organizations that recognize the unmatched value of wisdom, expertise, and dedication.
              </p>
              <Link to="/auth/seeker" className="btn btn-primary">
                Join as Professional <ArrowRight size={20}/>
              </Link>
            </div>
            <div className="hero-image-box">
               <img 
                 src={bgImage}
                 alt="Experienced Professional" 
               />
            </div>
          </div>
        </section>

        {/* --- MISSION ASYMMETRY --- */}
        <section className="mission-section">
          <div className="mission-visuals fade-in-up delay-1">
            <div className="arch-img">
               <img src={mentorshipImage} alt="Mentorship" />
            </div>
            <div className="circle-img">
               <img src={teamworkImage} alt="Teamwork" />
            </div>
          </div>
          <div className="mission-text fade-in-up delay-2">
            <h2>The Experience Gap</h2>
            <p>
              Every year, millions of highly skilled professionals in India step down from their full-time careers. They take with them decades of problem-solving ability, leadership, and invaluable industry knowledge.
            </p>
            <p>
              We realized this massive pool of talent was being overlooked. Our objective is simple: to create a dignified, efficient bridge between retired individuals who want to remain active and companies that desperately need reliable, experienced hands.
            </p>
            <p>
              Whether it's mentoring a startup, consulting for an SME, or managing a critical project, your second innings can be just as impactful as your first.
            </p>
          </div>
        </section>

        {/* --- DUAL ROLE INTERLOCKING CARDS --- */}
        <section className="roles-section">
          <div className="roles-header fade-in-up">
            <h2>How It Works</h2>
            <p>A unified ecosystem designed for both sides of the professional world.</p>
          </div>
          
          <div className="roles-grid">
            <div className="role-card seeker fade-in-up delay-1">
              <div className="role-icon-wrapper"><UserPlus size={36}/></div>
              <h3>For Retired Professionals</h3>
              <p>Register as a job seeker and unlock a world of opportunities tailored to your life stage. Find roles that respect your time and value your insights.</p>
              <ul className="role-list">
                <li><CheckCircle2 size={24} /> Browse flexible or part-time roles</li>
                <li><CheckCircle2 size={24} /> Match with companies based on your skills</li>
                <li><CheckCircle2 size={24} /> Apply securely directly through the platform</li>
              </ul>
              <Link to="/auth/seeker" className="btn btn-primary" style={{marginTop: '20px'}}>
                Create Profile
              </Link>
            </div>

            <div className="role-card employer fade-in-up delay-2">
              <div className="role-icon-wrapper"><Building2 size={36}/></div>
              <h3>For Organizations</h3>
              <p>Tap into a vetted network of industry veterans. Bring stability, mentorship, and deep-rooted expertise into your teams without the typical hiring friction.</p>
              <ul className="role-list">
                <li><CheckCircle2 size={24} /> Post detailed job openings instantly</li>
                <li><CheckCircle2 size={24} /> Hire veterans for advisory or active roles</li>
                <li><CheckCircle2 size={24} /> Gain reliable talent with zero hand-holding</li>
              </ul>
              <Link to="/auth/employer" className="btn btn-primary" style={{marginTop: '20px', background: '#4f46e5', color: '#fff', boxShadow: '0 10px 25px rgba(79,70,229,0.3)'}}>
                Start Hiring
              </Link>
            </div>
          </div>
        </section>

        {/* --- CORE VALUES (CAPSULES) --- */}
        <section className="values-section">
          <div className="values-header fade-in-up">
            <h2>Our Core Values</h2>
          </div>
          <div className="values-grid">
            <div className="capsule fade-in-up delay-1">
              <div className="cap-icon"><Award size={32}/></div>
              <h4>Wisdom</h4>
              <p>True expertise is built over decades and is an irreplaceable asset.</p>
            </div>
            <div className="capsule fade-in-up delay-2">
              <div className="cap-icon"><ShieldCheck size={32}/></div>
              <h4>Reliability</h4>
              <p>Veterans bring unmatched dedication and stability to the workplace.</p>
            </div>
            <div className="capsule fade-in-up delay-3">
              <div className="cap-icon"><HeartHandshake size={32}/></div>
              <h4>Meaning</h4>
              <p>Connecting individuals with roles that provide purpose and respect.</p>
            </div>
            <div className="capsule fade-in-up delay-4">
              <div className="cap-icon"><Compass size={32}/></div>
              <h4>Growth</h4>
              <p>Companies gain mentors, while professionals share their life's work.</p>
            </div>
          </div>
        </section>

        {/* --- CTA LEAF --- */}
        <section className="cta-section fade-in-up">
          <h2>Ready for Your Next Chapter?</h2>
          <p>Join the fastest-growing community of experienced professionals and smart employers in India.</p>
          <div className="cta-actions">
            <Link to="/auth/seeker" className="btn btn-primary">Register as Seeker</Link>
            <Link to="/auth/employer" className="btn btn-white">Post an Opening</Link>
          </div>
        </section>

      </div>
    </div>
  );
};

export default AboutUsPage;