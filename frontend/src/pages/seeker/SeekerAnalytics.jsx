import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; // Added axios for API calls
import useAuthStore from '../../context/useAuthStore';
import { 
  Lock, TrendingUp, Eye, FileText, CheckCircle, 
  Target, Activity, BarChart2, Award 
} from 'lucide-react';

const SeekerAnalytics = () => {
  const { user } = useAuthStore();
  
  // FIX: Added fallback to `user` in case the store structure flattens after refresh
  const currentUser = user?.user || user;
  
  // FIX: Broadened condition to catch the Pro status regardless of slight backend naming differences
  const userPlan = currentUser?.planName || currentUser?.planType || currentUser?.subscription?.planName || currentUser?.plan || "";
  const isPro = 
    userPlan.toLowerCase().includes("pro") || 
    currentUser?.isPremium === true ||
    currentUser?.subscription?.status === "active";

  const [loading, setLoading] = useState(true);
  
  // --- ADDED: Dynamic State for BE Data ---
  const [stats, setStats] = useState({
    totalApplications: 0,
    profileViews: 0,
    shortlisted: 0,
    viewedByEmployer: 0,
    interviews: 0,
    successRate: 0,
    aiMatchScore: 0,
    trends: { applications: 0, views: 0, shortlisted: 0 }
  });

  // --- ADDED: Real Data Fetching ---
  useEffect(() => {
    const fetchAnalytics = async () => {
      // If not pro, stop loading immediately and show lock screen
      if (!isPro || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        const token = user?.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // Fetch data from your backend
        const { data } = await axios.get("http://localhost:5000/api/analytics/seeker", config);
        
        // Update state with backend data
        setStats({
          totalApplications: data.totalApplications || 0,
          profileViews: data.profileViews || 0,
          shortlisted: data.shortlisted || 0,
          viewedByEmployer: data.viewedByEmployer || 0,
          interviews: data.interviews || 0,
          successRate: data.successRate || 0,
          aiMatchScore: data.aiMatchScore || 0,
          trends: data.trends || { applications: 0, views: 0, shortlisted: 0 }
        });
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isPro, currentUser, user?.token]);

  // --- LOCKED STATE UI ---
  if (!isPro) {
    return (
      <div className="analytics-wrapper locked-bg">
        <div className="locked-container glass-card fade-in">
          <div className="lock-icon-wrapper">
            <Lock size={48} className="lock-icon" />
          </div>
          <h2>Advanced Analytics Locked</h2>
          <p>
            Upgrade to the <strong>Pro Seeker</strong> plan to unlock deep insights into your job search, including profile views, application success rates, and resume performance metrics.
          </p>
          <Link to="/seeker-billing" className="upgrade-btn">
            Upgrade to Pro
          </Link>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="analytics-wrapper centered">
        <div className="loader"></div>
        <style>{styles}</style>
      </div>
    );
  }

  // --- HELPER: Calculate dynamic widths for the funnel ---
  const calcWidth = (val, total) => {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((val / total) * 100));
  };

  // --- PREMIUM ANALYTICS UI ---
  return (
    <div className="analytics-wrapper">
      <div className="analytics-container">
        
        <div className="analytics-header slide-down">
          <div className="title-area">
            <h1>Application Analytics</h1>
            <p>Track your performance and profile visibility</p>
          </div>
          <div className="pro-badge">
            <Award size={16} /> Pro Access
          </div>
        </div>

        {/* STATS GRID */}
        <div className="stats-grid slide-up">
          <div className="stat-card glass-card">
            <div className="stat-header">
              <span className="stat-title">Total Applications</span>
              <div className="icon-box blue"><FileText size={18} /></div>
            </div>
            <div className="stat-value">{stats.totalApplications}</div>
            <div className="stat-trend positive">
              <TrendingUp size={14} /> +{stats.trends.applications}% this month
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-header">
              <span className="stat-title">Profile Views</span>
              <div className="icon-box purple"><Eye size={18} /></div>
            </div>
            <div className="stat-value">{stats.profileViews}</div>
            <div className="stat-trend positive">
              <TrendingUp size={14} /> +{stats.trends.views}% this week
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-header">
              <span className="stat-title">Shortlisted</span>
              <div className="icon-box green"><CheckCircle size={18} /></div>
            </div>
            <div className="stat-value">{stats.shortlisted}</div>
            <div className="stat-trend positive">
              <TrendingUp size={14} /> +{stats.trends.shortlisted} new
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-header">
              <span className="stat-title">Success Rate</span>
              <div className="icon-box gold"><Target size={18} /></div>
            </div>
            <div className="stat-value">{stats.successRate}%</div>
            <div className="stat-trend neutral">
              <Activity size={14} /> Steady
            </div>
          </div>
        </div>

        {/* CHARTS / DETAILS AREA */}
        <div className="details-grid slide-up-delayed">
          
          {/* Application Funnel (CSS Progress Bars) */}
          <div className="detail-card glass-card">
            <h3><BarChart2 size={20} /> Application Funnel</h3>
            <div className="funnel-container">
              <div className="funnel-item">
                <div className="funnel-info">
                  <span>Applied</span>
                  <span>{stats.totalApplications}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: '100%', background: '#3b82f6' }}></div>
                </div>
              </div>
              
              <div className="funnel-item">
                <div className="funnel-info">
                  <span>Viewed by Employer</span>
                  <span>{stats.viewedByEmployer}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${calcWidth(stats.viewedByEmployer, stats.totalApplications)}%`, background: '#8b5cf6' }}></div>
                </div>
              </div>

              <div className="funnel-item">
                <div className="funnel-info">
                  <span>Shortlisted</span>
                  <span>{stats.shortlisted}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${calcWidth(stats.shortlisted, stats.totalApplications)}%`, background: '#10b981' }}></div>
                </div>
              </div>

              <div className="funnel-item">
                <div className="funnel-info">
                  <span>Interviews</span>
                  <span>{stats.interviews}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${calcWidth(stats.interviews, stats.totalApplications)}%`, background: '#f59e0b' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Resume Match Score */}
          <div className="detail-card glass-card ai-score-card">
            <h3>AI Resume Match Analysis</h3>
            <div className="score-circle-container">
              <div className="score-circle">
                <div className="score-text">
                  <span className="score-number">{stats.aiMatchScore}</span>
                  <span className="score-label">Avg. Score</span>
                </div>
                {/* CSS Circle Graphic dynamically filled */}
                <svg viewBox="0 0 36 36" className="circular-chart gold">
                  <path className="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle" strokeDasharray={`${stats.aiMatchScore}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
              </div>
            </div>
            <p className="score-description">
              Your AI-generated resumes have an average <strong>{stats.aiMatchScore}% keyword match</strong> against the jobs you apply for. Your profile ranks in the top 15% of applicants.
            </p>
          </div>

        </div>
      </div>
      <style>{styles}</style>
    </div>
  );
};

// --- VANILLA CSS ---
const styles = `
  /* WRAPPERS */
  .analytics-wrapper {
    min-height: 100vh;
    background: var(--bg-root);
    padding: 100px 24px 60px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--text-main);
  }

  .analytics-wrapper.centered {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .analytics-container {
    max-width: 1100px;
    margin: 0 auto;
  }

  /* GLASSMORPHISM CARD UTILITY */
  .glass-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15);
  }

  /* LOCKED STATE STYLING */
  .analytics-wrapper.locked-bg {
    display: flex;
    justify-content: center;
    align-items: center;
    background: radial-gradient(circle at center, var(--bg-root) 0%, #000 100%);
  }

  .locked-container {
    max-width: 450px;
    padding: 50px 40px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  .locked-container::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%; width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 60%);
    z-index: -1;
  }

  .lock-icon-wrapper {
    background: rgba(251, 191, 36, 0.15);
    padding: 20px;
    border-radius: 50%;
    margin-bottom: 24px;
    border: 1px solid rgba(251, 191, 36, 0.3);
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
  }

  .lock-icon {
    color: var(--primary, #fbbf24);
  }

  .locked-container h2 {
    font-size: 26px;
    margin: 0 0 16px;
    color: var(--text-main);
  }

  .locked-container p {
    color: var(--text-sub);
    line-height: 1.6;
    margin: 0 0 32px;
    font-size: 15px;
  }

  .upgrade-btn {
    background: var(--primary, #fbbf24);
    color: #000;
    padding: 14px 32px;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 700;
    font-size: 15px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
  }

  .upgrade-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(251, 191, 36, 0.6);
  }

  /* HEADER */
  .analytics-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .title-area h1 {
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 8px 0;
  }

  .title-area p {
    margin: 0;
    color: var(--text-sub);
    font-size: 15px;
  }

  .pro-badge {
    background: rgba(251, 191, 36, 0.1);
    color: var(--primary, #fbbf24);
    border: 1px solid rgba(251, 191, 36, 0.3);
    padding: 6px 14px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 0 10px rgba(251, 191, 36, 0.1);
  }

  /* STATS GRID */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 24px;
    margin-bottom: 30px;
  }

  .stat-card {
    padding: 24px;
    transition: transform 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-5px);
  }

  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .stat-title {
    color: var(--text-sub);
    font-size: 14px;
    font-weight: 600;
  }

  .icon-box {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .icon-box.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
  .icon-box.purple { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
  .icon-box.green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
  .icon-box.gold { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }

  .stat-value {
    font-size: 32px;
    font-weight: 800;
    color: var(--text-main);
    margin-bottom: 12px;
  }

  .stat-trend {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
  }
  .stat-trend.positive { color: #10b981; }
  .stat-trend.neutral { color: var(--text-muted); }

  /* DETAILS GRID */
  .details-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
  }

  @media (max-width: 860px) {
    .details-grid { grid-template-columns: 1fr; }
    .analytics-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  }

  .detail-card {
    padding: 28px;
  }

  .detail-card h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    margin: 0 0 24px 0;
    color: var(--text-main);
  }

  /* FUNNEL CSS BARS */
  .funnel-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .funnel-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .funnel-info {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-sub);
  }

  .progress-track {
    width: 100%;
    height: 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 50px;
    animation: fillBar 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    transform-origin: left;
  }

  /* SCORE CIRCLE */
  .ai-score-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .score-circle-container {
    width: 160px;
    margin: 10px auto 20px;
  }

  .score-circle {
    position: relative;
    width: 100%;
  }

  .circular-chart {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    max-height: 250px;
  }

  .circle-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.05);
    stroke-width: 2.5;
  }

  .circle {
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    animation: fillCircle 2s ease-out forwards;
  }
  .circular-chart.gold .circle { stroke: var(--primary, #fbbf24); }

  .score-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .score-number {
    font-size: 42px;
    font-weight: 800;
    color: var(--text-main);
    line-height: 1;
  }

  .score-label {
    font-size: 12px;
    color: var(--text-sub);
    margin-top: 4px;
  }

  .score-description {
    font-size: 14px;
    color: var(--text    -sub);
    line-height: 1.6;
    margin: 0;
  }

  .score-description strong {
    color: var(--text-main);
  }

  /* ANIMATIONS */
  .fade-in { animation: fadeIn 0.6s ease-out forwards; }
  .slide-down { animation: slideDown 0.5s ease-out forwards; }
  .slide-up { animation: slideUp 0.6s ease-out forwards; }
  .slide-up-delayed { opacity: 0; animation: slideUp 0.6s ease-out 0.2s forwards; }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fillBar {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  @keyframes fillCircle {
    from { stroke-dasharray: 0, 100; }
  }

  /* LOADER */
  .loader {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(251, 191, 36, 0.2);
    border-bottom-color: var(--primary, #fbbf24);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default SeekerAnalytics;