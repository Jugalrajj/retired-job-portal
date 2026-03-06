import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, AlertTriangle, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

        .not-found-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root);
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        /* --- BACKGROUND FX --- */
        .bg-blob {
          position: absolute; border-radius: 50%; filter: blur(120px);
          opacity: 0.15; z-index: 0; pointer-events: none;
        }
        .b1 { top: -10%; left: -10%; width: 500px; height: 500px; background: #ef4444; }
        .b2 { bottom: -10%; right: -10%; width: 500px; height: 500px; background: var(--primary); }

        .not-found-content {
          text-align: center;
          background: var(--bg-card);
          padding: 60px 40px;
          border-radius: 24px;
          border: 1px solid var(--border);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          position: relative;
          z-index: 2;
          max-width: 500px;
          width: 100%;
          animation: slideUp 0.5s ease-out;
        }

        .icon-circle {
          width: 80px; height: 80px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .error-code {
          font-family: 'Playfair Display', serif;
          font-size: 80px;
          font-weight: 800;
          line-height: 1;
          margin: 0 0 10px 0;
          background: linear-gradient(135deg, var(--text-main) 0%, var(--text-sub) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .error-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 12px;
        }

        .error-desc {
          font-size: 15px;
          color: var(--text-sub);
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .btn-group {
          display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: white; padding: 12px 24px; border-radius: 12px;
          font-weight: 700; font-size: 14px; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 8px; transition: 0.2s;
          box-shadow: 0 4px 15px var(--primary-dim);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px var(--primary-dim); }

        .btn-secondary {
          background: var(--bg-input); border: 1px solid var(--border);
          color: var(--text-main); padding: 12px 24px; border-radius: 12px;
          font-weight: 600; font-size: 14px; cursor: pointer;
          display: flex; align-items: center; gap: 8px; transition: 0.2s;
        }
        .btn-secondary:hover { border-color: var(--text-sub); background: var(--bg-card); }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="not-found-content">
        <div className="icon-circle">
          <AlertTriangle size={40} />
        </div>
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Page Not Found</h2>
        <p className="error-desc">
          We looked everywhere, but the page you are trying to reach has either moved, been deleted, or doesn't exist.
        </p>
        
        <div className="btn-group">
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Go Back
          </button>
          <button className="btn-primary" onClick={() => navigate("/")}>
            <Home size={18} /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;