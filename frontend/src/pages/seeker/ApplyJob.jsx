import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import useAuthStore from "../../context/useAuthStore";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  ShieldCheck,
  ArrowLeft,
  Building2,
  Award,
  Calendar,
  Monitor,
  Activity,
  Heart,
  X,
  LogIn,
  ChevronRight,
} from "lucide-react";

// Helper to fix image URLs
const getImageUrl = (path) => {
  if (!path) return null;
  const cleanPath = path.replace(/\\/g, "/");
  if (cleanPath.startsWith("http")) return cleanPath;
  return `http://localhost:5000/${cleanPath}`;
};

const ApplyJob = () => {
  const { title } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentUser = user?.user;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApplied, setIsApplied] = useState(false);

  // --- MODAL STATES ---
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false); // New State for Login Popup
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- RETIRED-FRIENDLY FORM STATE ---
  const [formData, setFormData] = useState({
    fullName: currentUser?.name || "",
    yearsOfExperience: "",
    keyExpertise: "",
    availability: "",
    healthConsiderations: "",
  });
  const [resume, setResume] = useState(null);

  const fetchJobDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/jobs/view/${title}`);
      setJob(res.data);

      if (currentUser?.role === "seeker") {
        const { data: appliedData } = await api.get("/jobs/applied");
        const hasApplied = appliedData.some((aj) => aj._id === res.data._id);
        setIsApplied(hasApplied);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [title, currentUser]);

  useEffect(() => {
    if (title) fetchJobDetails();
  }, [fetchJobDetails, title]);

  // --- HANDLE APPLY CLICK ---
  const handleApplyClick = () => {
    // 1. Check if user is logged in
    if (!currentUser) {
      setShowLoginModal(true); // Show the Login Popup
      return;
    }

    // 2. Check role
    if (currentUser.role !== "seeker") {
      alert("Please login as a Job Seeker to apply.");
      return;
    }

    // 3. Check if already applied
    if (isApplied) return;

    // 4. Open Application Form
    setShowApplyModal(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const data = new FormData();

    // Append updated fields
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    if (resume) data.append("resume", resume);

    try {
      await api.post(`/jobs/apply/${job._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setIsApplied(true);
      setShowApplyModal(false);
      alert("Application sent successfully! Good luck.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to apply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div style={{ padding: 50, textAlign: "center", color: "#64748b" }}>
        Loading Opportunity...
      </div>
    );
  if (!job)
    return (
      <div style={{ padding: 50, textAlign: "center" }}>Job not found.</div>
    );

  return (
    <div className="job-details-page">
      <div className="container">
        {/* --- HEADER --- */}
        <div className="job-header">
          <button onClick={() => navigate(-1)} className="back-link">
            <ArrowLeft size={18} /> Back to Search
          </button>

          <div className="header-content">
            <div className="company-logo">
              {job.employer?.logoUrl ? (
                <img src={getImageUrl(job.employer.logoUrl)} alt="logo" />
              ) : (
                <Building2 size={40} color="#64748b" />
              )}
            </div>
            <div className="header-text">
              <h1>{job.title}</h1>
              <div className="header-meta">
                <span>
                  <Building2 size={16} />{" "}
                  {job.employer?.name || "Confidential Employer"}
                </span>
                <span className="dot">•</span>
                <span>
                  <MapPin size={16} /> {job.location}
                </span>
                <span className="dot">•</span>
                <span>
                  <Clock size={16} /> Posted{" "}
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="header-action">
              <button
                className={`apply-btn ${isApplied ? "applied" : ""}`}
                onClick={handleApplyClick}
                disabled={isApplied}
              >
                {isApplied ? "Application Sent ✓" : "Apply Now"}
              </button>
            </div>
          </div>
        </div>

        <div className="content-grid">
          {/* --- LEFT: MAIN DETAILS --- */}
          <div className="main-col">
            {/* Quick Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="icon-box green">
                  <DollarSign size={20} />
                </div>
                <div>
                  <label>Compensation</label>
                  <strong>₹{job.salary?.toLocaleString()}</strong>
                </div>
              </div>
              <div className="stat-card">
                <div className="icon-box blue">
                  <Briefcase size={20} />
                </div>
                <div>
                  <label>Work Mode</label>
                  <strong>{job.workMode}</strong>
                </div>
              </div>
              <div className="stat-card">
                <div className="icon-box orange">
                  <Activity size={20} />
                </div>
                <div>
                  <label>Physicality</label>
                  <strong>{job.physicalDemands || "Sedentary"}</strong>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="detail-section">
              <h3>
                <ShieldCheck size={22} /> Role Overview
              </h3>
              <p className="desc-text">{job.description}</p>
            </div>

            {/* Requirements & Tech */}
            <div className="detail-section">
              <h3>
                <Award size={22} /> Requirements & Skills
              </h3>
              <ul className="req-list">
                <li>
                  <strong>Experience:</strong> Minimum {job.experienceRequired}{" "}
                  years in relevant field.
                </li>
                <li>
                  <strong>Tech Proficiency:</strong>{" "}
                  {job.techLevel || "Basic (Email/Calls)"} -{" "}
                  {job.techLevel === "Advanced"
                    ? "Must know modern tools."
                    : "Training provided."}
                </li>
                <li>
                  <strong>Preferred Background:</strong>{" "}
                  {job.preferredBackground ||
                    "Open to all retired professionals."}
                </li>
              </ul>

              <div className="skills-row">
                {job.skills?.split(",").map((skill, i) => (
                  <span key={i} className="skill-tag">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="detail-section highlight-bg">
              <h3>
                <Heart size={22} color="#e11d48" /> Benefits & Perks
              </h3>
              <p className="desc-text">
                {job.benefits ||
                  "Flexible timings, Respectful environment, Health coverage options."}
              </p>
            </div>
          </div>

          {/* --- RIGHT: SIDEBAR SUMMARY --- */}
          <aside className="sidebar-col">
            <div className="sidebar-card">
              <h4>At a Glance</h4>

              <div className="summary-item">
                <Clock className="sum-icon" />
                <div>
                  <label>Time Commitment</label>
                  <span>{job.timeCommitment || "Flexible Hours"}</span>
                </div>
              </div>

              <div className="summary-item">
                <Calendar className="sum-icon" />
                <div>
                  <label>Duration</label>
                  <span>{job.duration || "Permanent / Long-term"}</span>
                </div>
              </div>

              <div className="summary-item">
                <Monitor className="sum-icon" />
                <div>
                  <label>Tech Requirement</label>
                  <span>{job.techLevel || "Basic"}</span>
                </div>
              </div>

              <div className="summary-item">
                <Users className="sum-icon" />
                <div>
                  <label>Engagement Type</label>
                  <span>{job.workType}</span>
                </div>
              </div>

              <hr className="divider" />

              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    marginBottom: "15px",
                  }}
                >
                  Interested in this role?
                </p>
                <button
                  className={`apply-btn full ${isApplied ? "applied" : ""}`}
                  onClick={handleApplyClick}
                  disabled={isApplied}
                >
                  {isApplied ? "Applied Successfully" : "Apply Now"}
                </button>
              </div>
            </div>

            {/* Trust Badge */}
            <div className="trust-card">
              <ShieldCheck size={32} color="#059669" />
              <div>
                <h5>Verified Opportunity</h5>
                <p>Vetted for retired professionals.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* --- RETIREE APPLICATION FORM MODAL --- */}
      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-modal"
              onClick={() => setShowApplyModal(false)}
            >
              <X size={24} />
            </button>

            <div className="modal-header">
              <h2>Submit Application</h2>
              <p>
                Apply to <strong>{job.employer?.name}</strong>
              </p>
            </div>

            <form onSubmit={handleApplySubmit}>
              <div className="input-group">
                <label>Full Name</label>
                <input
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Years of Experience</label>
                  <input
                    required
                    value={formData.yearsOfExperience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearsOfExperience: e.target.value,
                      })
                    }
                    placeholder="e.g. 30 Years"
                  />
                </div>
                <div className="input-group">
                  <label>Weekly Availability</label>
                  <input
                    required
                    value={formData.availability}
                    onChange={(e) =>
                      setFormData({ ...formData, availability: e.target.value })
                    }
                    placeholder="e.g. 15-20 Hours"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Key Expertise Summary</label>
                <textarea
                  required
                  rows="3"
                  value={formData.keyExpertise}
                  onChange={(e) =>
                    setFormData({ ...formData, keyExpertise: e.target.value })
                  }
                  placeholder="Briefly list your core skills (e.g. Auditing, Mentorship)..."
                />
              </div>

              <div className="input-group">
                <label>Health Considerations (Optional)</label>
                <input
                  value={formData.healthConsiderations}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      healthConsiderations: e.target.value,
                    })
                  }
                  placeholder="Any physical limitations we should know?"
                />
              </div>

              <div className="input-group">
                <label>Resume / CV (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={(e) => setResume(e.target.files[0])}
                  className="file-input"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="submit-btn"
              >
                {isSubmitting ? "Sending..." : "Confirm Application"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- LOGIN REQUIRED MODAL --- */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div
            className="modal-card login-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setShowLoginModal(false)}
            >
              <X size={20} />
            </button>

            <div className="modal-icon-box">
              <LogIn size={28} />
            </div>

            <div style={{ textAlign: "center" }}>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: "8px",
                }}
              >
                Login Required
              </h3>

              <p
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  padding: "0 10px",
                  marginBottom: "25px",
                }}
              >
                You must be logged in to apply for this position. Join our
                community of retired experts to access all opportunities.
              </p>

              <button
                className="login-primary-btn"
                onClick={() => navigate("/auth/seeker")}
              >
                Login to Apply <ChevronRight size={16} />
              </button>

              <button
                onClick={() => setShowLoginModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

        .job-details-page {
          background-color: #f8fafc;
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1e293b;
          padding-bottom: 60px;
        }

        .container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }

        /* --- Header --- */
        .job-header {
          background: white;
          padding: 30px;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 30px;
        }

        .back-link {
          display: flex; align-items: center; gap: 8px;
          border: none; background: none; color: #64748b;
          font-weight: 600; cursor: pointer; margin-bottom: 20px;
          font-size: 14px;
        }
        .back-link:hover { color: #4f46e5; }

        .header-content { display: flex; align-items: center; gap: 25px; }
        
        .company-logo {
          width: 80px; height: 80px;
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 16px; padding: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .company-logo img { width: 100%; height: 100%; object-fit: contain; }

        .header-text { flex: 1; }
        .header-text h1 { font-size: 28px; font-weight: 800; margin: 0 0 8px 0; color: #0f172a; }
        .header-meta { display: flex; align-items: center; gap: 10px; color: #64748b; font-size: 14px; flex-wrap: wrap; }
        .header-meta .dot { color: #cbd5e1; }
        .header-meta span { display: flex; align-items: center; gap: 6px; }

        .apply-btn {
          background: #4f46e5; color: white;
          border: none; padding: 14px 28px;
          border-radius: 12px; font-weight: 700;
          cursor: pointer; transition: 0.2s;
          font-size: 15px;
        }
        .apply-btn:hover:not(:disabled) { background: #4338ca; transform: translateY(-2px); }
        .apply-btn.applied { background: #e2e8f0; color: #94a3b8; cursor: default; }
        .apply-btn.full { width: 100%; }

        /* --- Grid Layout --- */
        .content-grid { display: grid; grid-template-columns: 1fr 340px; gap: 30px; }

        /* --- Stats Grid --- */
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 15px; }
        .icon-box { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; }
        .icon-box.green { background: #10b981; }
        .icon-box.blue { background: #3b82f6; }
        .icon-box.orange { background: #f97316; }
        .stat-card label { display: block; font-size: 12px; color: #64748b; margin-bottom: 2px; }
        .stat-card strong { font-size: 15px; color: #0f172a; }

        /* --- Details Sections --- */
        .detail-section { background: white; padding: 30px; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 25px; }
        .detail-section h3 { display: flex; align-items: center; gap: 10px; font-size: 18px; margin: 0 0 20px 0; color: #334155; }
        .desc-text { line-height: 1.8; color: #475569; font-size: 15px; white-space: pre-line; }
        .highlight-bg { background: #fff1f2; border-color: #fecdd3; }

        .req-list { padding-left: 20px; margin-bottom: 20px; }
        .req-list li { margin-bottom: 10px; color: #475569; line-height: 1.6; }
        
        .skills-row { display: flex; flex-wrap: wrap; gap: 10px; }
        .skill-tag { background: #f1f5f9; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; color: #475569; }

        /* --- Sidebar --- */
        .sidebar-card { background: white; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 20px; position: sticky; top: 20px; }
        .sidebar-card h4 { font-size: 16px; margin: 0 0 20px 0; color: #0f172a; }
        .summary-item { display: flex; align-items: flex-start; gap: 15px; margin-bottom: 20px; }
        .sum-icon { color: #64748b; width: 20px; height: 20px; margin-top: 2px; }
        .summary-item label { display: block; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
        .summary-item span { font-size: 15px; font-weight: 600; color: #334155; }
        .divider { border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0; }

        .trust-card { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 16px; display: flex; align-items: center; gap: 15px; }
        .trust-card h5 { margin: 0; font-size: 15px; color: #065f46; }
        .trust-card p { margin: 4px 0 0 0; font-size: 13px; color: #047857; }

        /* --- Modal Styles --- */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.8); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 20px; }
        .modal-card { background: white; width: 100%; max-width: 500px; padding: 35px; border-radius: 24px; position: relative; animation: slideUp 0.3s ease-out; }
        
        .login-popup { max-width: 400px; padding: 40px 30px; }

        .close-modal { position: absolute; top: 20px; right: 20px; background: none; border: none; cursor: pointer; color: #64748b; }
        .modal-header { margin-bottom: 25px; text-align: center; }
        .modal-header h2 { font-size: 24px; margin: 0 0 5px 0; }
        .modal-header p { color: #64748b; font-size: 14px; }

        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #334155; }
        .input-group input, .input-group textarea { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; }
        .input-group input:focus, .input-group textarea:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        .file-input { padding: 10px; background: #f8fafc; }
        .submit-btn { width: 100%; background: #10b981; color: white; border: none; padding: 14px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 16px; }
        .submit-btn:disabled { opacity: 0.7; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }

        /* Login Modal Specifics */
        .modal-icon-box {
          width: 60px; height: 60px; background: #e0e7ff; color: #4f46e5;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px auto;
        }
        .login-primary-btn {
          background: #4f46e5; color: white; width: 100%; padding: 12px;
          border-radius: 10px; font-weight: 700; border: none; cursor: pointer;
          font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s;
        }
        .login-primary-btn:hover { background: #4338ca; }
        .cancel-btn {
          background: none; border: none; color: #64748b;
          font-size: 13px; font-weight: 600; margin-top: 15px;
          cursor: pointer;
        }

        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        @media (max-width: 900px) {
          .content-grid { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: 1fr; }
          .header-content { flex-direction: column; align-items: flex-start; }
          .header-action { width: 100%; margin-top: 15px; }
          .apply-btn { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default ApplyJob;
