import React, { useState, useEffect } from "react";
import { 
  Briefcase, Users, ArrowLeft, TrendingUp, 
  Clock, ShieldCheck, Award, ChevronRight, Layout, PlusCircle, Search,
  CreditCard, FileText, Lightbulb, Star, Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom"; // Added for navigation
import useAuthStore from "../../context/useAuthStore.js";
import api from "../../services/api.js"; 

const EmployerDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate(); // Initialize navigation
  const [loading, setLoading] = useState(true);
  
  // --- DYNAMIC STATS STATE ---
  const [stats, setStats] = useState({
    activeJobs: 0,
    teamMembers: 0, 
    totalJobs: 0
  });
  
  const displayName = user?.user?.name || user?.user?.fullName || "Hiring Partner";

  // --- FETCH STATS FROM BACKEND ---
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Parallel fetch: Get Job Stats AND Team Members count
        const [statsRes, teamRes] = await Promise.all([
          api.get("/jobs/stats/employer"),
          api.get("/jobs/team")
        ]);

        setStats({
          activeJobs: statsRes.data.activeJobs || 0,
          teamMembers: teamRes.data ? teamRes.data.length : 0, 
          totalJobs: statsRes.data.totalJobs || 0
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="command-center-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

        /* --- GLOBAL PAGE STYLES --- */
        .command-center-wrapper {
          min-height: calc(100vh - 80px);
          background-color: var(--bg-root);
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--text-main);
          padding: 40px 20px 80px;
          display: flex;
          justify-content: center;
          position: relative;
        }

        /* --- SUBTLE BACKGROUND --- */
        .bg-pattern {
          position: absolute; inset: 0;
          background-image: radial-gradient(var(--border) 1px, transparent 1px);
          background-size: 40px 40px; opacity: 0.4; z-index: 0;
          pointer-events: none;
        }

        /* --- MAIN CONTAINER --- */
        .dashboard-container {
          width: 100%; max-width: 1200px;
          position: relative; z-index: 10;
          animation: fadeUp 0.6s ease-out forwards;
        }

        /* --- 1. HEADER / GREETING --- */
        .dash-header {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-bottom: 40px; flex-wrap: wrap; gap: 20px;
          padding-bottom: 20px; border-bottom: 1px solid var(--border);
        }
        
        .greeting h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 3.5vw, 2.8rem);
          font-weight: 800; color: var(--text-main); margin: 0 0 8px;
        }
        .greeting h1 span { color: var(--primary); }
        .greeting p {
          font-size: 1.1rem; color: var(--text-sub); margin: 0;
          display: flex; align-items: center; gap: 8px;
        }
        
        .header-actions { display: flex; gap: 16px; }
        .btn-primary {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: #000; padding: 12px 28px; border-radius: 12px;
          font-weight: 700; font-size: 15px; border: none; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          box-shadow: 0 8px 20px -5px var(--primary-dim); transition: 0.3s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 25px -5px rgba(245, 158, 11, 0.4); }

        /* --- 2. MODULAR GRID LAYOUT --- */
        .workspace-grid {
          display: grid; grid-template-columns: 2fr 1fr; gap: 30px;
        }

        /* --- LEFT COLUMN: STATS & ACTIONS --- */
        .left-col { display: flex; flex-direction: column; gap: 30px; }

        /* Stats Row */
        .stats-row {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
        }
        .stat-module {
          background: var(--bg-card); border: 1px solid var(--border);
          padding: 24px; border-radius: 20px;
          display: flex; flex-direction: column; justify-content: space-between;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.02);
          transition: 0.3s; position: relative; overflow: hidden;
        }
        .stat-module:hover { border-color: var(--primary); transform: translateY(-3px); box-shadow: 0 15px 35px -10px rgba(0,0,0,0.08); }
        
        /* Subtle glow line at top of stat cards */
        .stat-module::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: var(--border); transition: 0.3s;
        }
        .stat-module:hover::before { background: var(--primary); }

        .sm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .sm-title { font-size: 13px; font-weight: 700; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.5px; }
        .sm-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--bg-input); }
        
        .stat-module:nth-child(1) .sm-icon { color: #8b5cf6; background: rgba(139, 92, 246, 0.1); }
        .stat-module:nth-child(2) .sm-icon { color: #0ea5e9; background: rgba(14, 165, 233, 0.1); }
        .stat-module:nth-child(3) .sm-icon { color: var(--primary); background: var(--primary-dim); }

        .sm-value { font-size: 2.2rem; font-weight: 800; color: var(--text-main); font-family: 'Playfair Display', serif; }
        .sm-loading { opacity: 0.5; animation: pulse 1.5s infinite; }

        /* Extended Actions List */
        .actions-panel {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 24px; padding: 30px;
        }
        .panel-title { font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin: 0 0 20px; display: flex; align-items: center; gap: 10px; }
        
        .action-list { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        
        .action-item {
          display: flex; align-items: flex-start; gap: 16px;
          padding: 20px; border-radius: 16px; border: 1px solid var(--border);
          background: var(--bg-input); cursor: pointer; transition: 0.3s;
        }
        .action-item:hover { background: var(--bg-card); border-color: var(--primary); transform: translateX(5px); box-shadow: 0 10px 20px -10px rgba(0,0,0,0.05); }
        
        .ai-icon {
          width: 48px; height: 48px; border-radius: 12px; background: var(--bg-card);
          border: 1px solid var(--border); display: flex; align-items: center; justify-content: center;
          color: var(--text-main); flex-shrink: 0; transition: 0.3s;
        }
        .action-item:hover .ai-icon { background: var(--primary); color: #000; border-color: var(--primary); }
        
        .ai-text h4 { font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin: 0 0 4px; }
        .ai-text p { font-size: 0.85rem; color: var(--text-sub); margin: 0; line-height: 1.5; }

        /* --- RIGHT COLUMN: INSIGHTS & RESOURCES --- */
        .right-col { display: flex; flex-direction: column; gap: 30px; }

        .insights-card {
          background: linear-gradient(180deg, var(--bg-card) 0%, var(--bg-input) 100%);
          border: 1px solid var(--border); border-radius: 24px; padding: 30px;
          box-shadow: 0 15px 35px -15px rgba(0,0,0,0.05);
        }
        .insights-card h3 { font-size: 1.2rem; font-weight: 800; color: var(--text-main); margin: 0 0 20px; display: flex; align-items: center; gap: 10px;}
        .insights-card h3 svg { color: var(--primary); }

        .insight-point {
          display: flex; gap: 12px; margin-bottom: 20px;
          padding-bottom: 20px; border-bottom: 1px dashed var(--border);
        }
        .insight-point:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        
        .ip-icon { color: var(--success); margin-top: 2px; }
        .ip-text h5 { font-size: 1rem; font-weight: 700; color: var(--text-main); margin: 0 0 6px; }
        .ip-text p { font-size: 0.9rem; color: var(--text-sub); margin: 0; line-height: 1.6; }

        .premium-upgrade-box {
          background: var(--text-main); color: var(--bg-root);
          border-radius: 24px; padding: 30px; text-align: center;
          position: relative; overflow: hidden;
        }
        .premium-upgrade-box::after {
           content: ''; position: absolute; top: -50px; right: -50px; width: 150px; height: 150px;
           background: var(--primary); filter: blur(50px); opacity: 0.3; border-radius: 50%;
        }
        .premium-upgrade-box h4 { font-size: 1.4rem; font-family: 'Playfair Display', serif; font-weight: 700; color: var(--bg-root); margin: 0 0 10px; }
        .premium-upgrade-box p { font-size: 0.95rem; opacity: 0.8; margin: 0 0 20px; color: var(--bg-root); line-height: 1.5; }
        .btn-upgrade {
          background: var(--primary); color: #000; border: none; padding: 12px 24px;
          border-radius: 50px; font-weight: 700; font-size: 14px; cursor: pointer;
          width: 100%; transition: 0.3s;
        }
        .btn-upgrade:hover { transform: scale(1.02); box-shadow: 0 10px 20px rgba(245, 158, 11, 0.3); }

        /* --- ANIMATIONS --- */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }

        /* --- RESPONSIVE --- */
        @media (max-width: 1024px) {
           .workspace-grid { grid-template-columns: 1fr; }
           .action-list { grid-template-columns: 1fr; }
           .stats-row { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
           .dash-header { flex-direction: column; align-items: flex-start; }
           .stats-row { grid-template-columns: 1fr; }
           .btn-primary { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* Decorative Background */}
      <div className="bg-pattern"></div>

      <div className="dashboard-container">
        
        {/* --- 1. HEADER --- */}
        <div className="dash-header">
          <div className="greeting">
            <h1>Hello, <span>{displayName}</span></h1>
            <p><ShieldCheck size={18} color="var(--success)"/> Enterprise Employer Workspace</p>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => navigate("/post-job")}>
              <PlusCircle size={18} /> Post Job
            </button>
          </div>
        </div>

        {/* --- 2. MODULAR GRID --- */}
        <div className="workspace-grid">
          
          {/* LEFT COLUMN */}
          <div className="left-col">
            
            {/* Stats Row */}
            <div className="stats-row">
              <div className="stat-module">
                <div className="sm-header">
                  <span className="sm-title">Active Listings</span>
                  <div className="sm-icon"><Briefcase size={20}/></div>
                </div>
                <div className={`sm-value ${loading ? 'sm-loading' : ''}`}>
                  {loading ? "-" : stats.activeJobs}
                </div>
              </div>

              <div className="stat-module">
                <div className="sm-header">
                  <span className="sm-title">Team Members</span>
                  <div className="sm-icon"><Users size={20}/></div>
                </div>
                <div className={`sm-value ${loading ? 'sm-loading' : ''}`}>
                  {loading ? "-" : stats.teamMembers}
                </div>
              </div>

              <div className="stat-module">
                <div className="sm-header">
                  <span className="sm-title">Total Processed</span>
                  <div className="sm-icon"><Award size={20}/></div>
                </div>
                <div className={`sm-value ${loading ? 'sm-loading' : ''}`}>
                  {loading ? "-" : stats.totalJobs}
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="actions-panel">
              <h3 className="panel-title"><Layout size={20}/> Command Center</h3>
              <div className="action-list">
                
                <div className="action-item" onClick={() => navigate("/post-job")}>
                  <div className="ai-icon"><PlusCircle size={22}/></div>
                  <div className="ai-text">
                    <h4>Create Opportunity</h4>
                    <p>Draft and publish a new role for senior professionals or advisors.</p>
                  </div>
                </div>

                <div className="action-item" onClick={() => navigate("/talent-pool")}>
                  <div className="ai-icon"><Search size={22}/></div>
                  <div className="ai-text">
                    <h4>Scout Talent Pool</h4>
                    <p>Proactively search our verified database of industry veterans.</p>
                  </div>
                </div>

                <div className="action-item" onClick={() => navigate("/team")}>
                  <div className="ai-icon"><Users size={22}/></div>
                  <div className="ai-text">
                    <h4>Manage Team</h4>
                    <p>Invite colleagues and assign specific hiring permissions.</p>
                  </div>
                </div>

                <div className="action-item" onClick={() => navigate("/billing")}>
                  <div className="ai-icon"><CreditCard size={22}/></div>
                  <div className="ai-text">
                    <h4>Billing & Plans</h4>
                    <p>Manage subscriptions, view invoices, and buy credit packs.</p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="right-col">
            
            {/* Insights & Resources */}
            <div className="insights-card">
              <h3><Lightbulb size={24}/> Hiring Insights</h3>
              
              <div className="insight-point">
                <ShieldCheck size={20} className="ip-icon" />
                <div className="ip-text">
                  <h5>High Retention Rates</h5>
                  <p>Organizations hiring retired professionals report a 40% increase in stability and long-term retention compared to average hires.</p>
                </div>
              </div>

              <div className="insight-point">
                <TrendingUp size={20} className="ip-icon" />
                <div className="ip-text">
                  <h5>Mentorship Value</h5>
                  <p>Pairing a senior advisor with junior teams accelerates project delivery and significantly reduces operational errors.</p>
                </div>
              </div>

              <div className="insight-point">
                <FileText size={20} className="ip-icon" />
                <div className="ip-text">
                  <h5>Pro Tip: Be Specific</h5>
                  <p>When posting a job, clearly define whether you need an operational executor or a strategic advisor to attract the right tier of talent.</p>
                </div>
              </div>
            </div>

            {/* Premium Upgrade Box */}
            <div className="premium-upgrade-box">
              <h4>Unlock Unlimited Access</h4>
              <p>Upgrade to the Pro Membership to direct message candidates, bypass job limits, and receive verified badges.</p>
              <button className="btn-upgrade" onClick={() => navigate("/billing")}>
                View Pro Plans
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;