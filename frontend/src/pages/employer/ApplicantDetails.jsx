import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { 
  ArrowLeft, Mail, Phone, MapPin, Briefcase, Clock, 
  Download, CheckCircle, XCircle, User, Calendar, Globe, 
  FileText, Building2, ExternalLink, GraduationCap, ChevronLeft,
  HeartPulse, Wallet, Laptop, Languages, Award, AlertTriangle, Link as LinkIcon 
} from "lucide-react";
import toast from "react-hot-toast";

const ApplicantDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobTitle, setJobTitle] = useState("Loading...");
  
  // Data from previous page
  const { applicant, jobId } = state || {};
  const [status, setStatus] = useState(applicant?.status || "Pending");

  // --- MODAL STATE ---
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    newStatus: "", // 'Shortlisted' or 'Rejected'
  });

  // --- INTERVIEW FORM STATE ---
  const [interviewData, setInterviewData] = useState({
    date: "",
    time: "",
    mode: "Online (Video Call)", // Default
    link: "" // Meeting Link or Physical Address
  });

  // --- 1. FETCH JOB TITLE ---
  useEffect(() => {
    const fetchJobInfo = async () => {
      if (jobId) {
        try {
          if (state?.jobTitle) {
            setJobTitle(state.jobTitle);
          } else {
            const { data } = await api.get(`/jobs/${jobId}`);
            setJobTitle(data.title);
          }
        } catch (err) {
          console.error("Failed to load job title", err);
          setJobTitle("Unknown Role");
        }
      }
    };
    fetchJobInfo();
  }, [jobId, state]);

  // --- 2. AUTO-MARK AS VIEWED ---
  useEffect(() => {
    const markAsViewed = async () => {
      if (status === 'Pending' && jobId && applicant?._id) {
        try {
          await api.patch("/jobs/application-status", {
            jobId: jobId,
            applicantId: applicant._id,
            status: 'Viewed'
          });
          setStatus('Viewed');
        } catch (err) {
          console.error("Failed to mark as viewed", err);
        }
      }
    };
    markAsViewed();
  }, [status, jobId, applicant]);

  // --- 3. TRIGGER CONFIRMATION MODAL ---
  const promptDecision = (newStatus) => {
    // Reset interview data when opening modal
    setInterviewData({
      date: "",
      time: "",
      mode: "Online (Video Call)",
      link: ""
    });
    
    setModalConfig({
      isOpen: true,
      newStatus: newStatus
    });
  };

  // --- 4. EXECUTE DECISION (API CALL) ---
  const executeDecision = async () => {
    const { newStatus } = modalConfig;
    
    // VALIDATION FOR SHORTLIST REQUIRED FIELDS
    if (newStatus === 'Shortlisted') {
      if (!interviewData.date || !interviewData.time || !interviewData.mode || !interviewData.link.trim()) {
        toast.error("Please fill in all interview details to shortlist this candidate.");
        return; // Stop execution here if fields are empty
      }
    }
    
    setModalConfig({ isOpen: false, newStatus: "" }); // Close Modal
    setLoading(true);

    try {
      // Construct Payload
      const payload = {
        jobId: jobId,
        applicantId: applicant._id,
        status: newStatus,
        // Only send interview details if status is Shortlisted
        ...(newStatus === 'Shortlisted' ? {
            interviewDate: interviewData.date,
            interviewTime: interviewData.time,
            interviewMode: interviewData.mode,
            interviewLink: interviewData.link
        } : {})
      };

      await api.patch("/jobs/application-status", payload);
      
      setStatus(newStatus);
      
      if (newStatus === 'Shortlisted') {
          toast.success("Applicant Shortlisted & Interview Email Sent!");
      } else {
          toast.success("Applicant Rejected");
      }

    } catch (err) {
      toast.error("Action Failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- 5. DOWNLOAD PROFILE AS CSV ---
  const downloadProfile = () => {
    if (!applicant) return;

    const csvRows = [];
    // Define Headers for Key-Value format
    csvRows.push(["Parameter", "Details"]);

    // Helper to safely add rows
    const addRow = (key, val) => csvRows.push([`"${key}"`, `"${val || 'N/A'}"`]);

    addRow("Full Name", applicant.user.name);
    addRow("Headline", applicant.headline);
    addRow("Email", applicant.user.email);
    addRow("Phone", applicant.phone);
    addRow("Location", applicant.location);
    addRow("Current Status", status);
    addRow("Applied For", jobTitle);
    addRow("Application Date", new Date(applicant.appliedAt || Date.now()).toLocaleDateString());
    
    addRow("Total Experience", `${applicant.experience || 0} Years`);
    addRow("Last Company", applicant.lastCompany);
    addRow("Tech Proficiency", applicant.techLevel);
    
    // Bio
    const bioClean = (applicant.bio || "").replace(/"/g, '""').replace(/\n/g, " ");
    addRow("Bio / Cover Letter", bioClean);

    // Skills
    const skillsStr = (applicant.skills || []).join(", ");
    addRow("Skills", skillsStr);

    // Work History Summary
    const workHistory = (applicant.workExperience || []).map(exp => 
        `${exp.title} at ${exp.company} (${new Date(exp.startDate).getFullYear()} - ${exp.current ? 'Present' : new Date(exp.endDate).getFullYear()})`
    ).join("; ");
    addRow("Work History", workHistory);

    // Education Summary
    const education = (applicant.education || []).map(edu => 
        `${edu.degree} from ${edu.institution} (${edu.year})`
    ).join("; ");
    addRow("Education", education);

    // Preferences
    addRow("Preferred Work Mode", applicant.workMode);
    addRow("Preferred Role Type", applicant.workType);
    addRow("Availability", applicant.availability);
    addRow("Expected Salary", applicant.expectedCompensation);

    // Generate CSV Content
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${applicant.user.name.replace(/\s+/g, '_')}_Profile_Details.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Profile Details Downloaded!");
  };

  if (!applicant) return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', 
      background:'var(--bg-root)', color:'var(--text-sub)'
    }}>
      No applicant selected.
    </div>
  );

 // --- HELPER: Safe File URL ---
  const getFileUrl = (path) => {
    if (!path || path === "undefined" || path === "null") return null;
    
    if (path.startsWith("http")) {
      // Force HTTPS for Cloudinary links to prevent browser security blocks
      return path.replace(/^http:\/\//i, 'https://'); 
    }
    
    return `http://localhost:5000/${path.replace(/\\/g, "/")}`;
  };

  // --- HELPERS ---
  const formatDate = (dateString) => {
    if (!dateString) return "Present";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getAge = (dob) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    const age = new Date(diff).getUTCFullYear() - 1970;
    return `• ${age} Years Old`;
  };

  return (
    <div className="dark-details-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        /* --- WRAPPER & BACKGROUND --- */
        .dark-details-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root);
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          color: var(--text-main);
          overflow-x: hidden;
          padding-bottom: 60px;
        }

        .bg-blob {
          position: absolute; border-radius: 50%; filter: blur(120px);
          opacity: 0.15; z-index: 0; pointer-events: none;
          animation: float 10s ease-in-out infinite;
        }
        .b1 { top: -10%; left: -10%; width: 700px; height: 700px; background: #4f46e5; }
        .b2 { top: 40%; right: -20%; width: 600px; height: 600px; background: var(--primary); animation-delay: 2s; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        /* --- CONTAINER --- */
        .main-container {
          max-width: 900px; /* Reduced width for "One Section" focus */
          margin: 0 auto; position: relative; z-index: 2;
          padding: 0 20px;
        }

        /* --- TOP NAVIGATION --- */
        .nav-header { 
          padding: 30px 0; display: flex; align-items: center; justify-content: space-between;
        }
        .btn-back {
          background: rgba(255,255,255,0.03); border: 1px solid var(--border);
          padding: 10px 20px; border-radius: 50px; color: var(--text-sub);
          font-size: 14px; font-weight: 600; cursor: pointer; display: flex;
          align-items: center; gap: 8px; transition: 0.3s;
          backdrop-filter: blur(10px);
        }
        .btn-back:hover { 
          background: var(--primary-dim); color: var(--primary); border-color: var(--primary);
          transform: translateX(-4px);
        }

        /* --- UNIFIED PROFILE CARD --- */
        .profile-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 24px;
          box-shadow: 0 20px 50px -10px rgba(0,0,0,0.2);
          overflow: hidden;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* --- HEADER SECTION --- */
        .profile-header {
          padding: 40px; border-bottom: 1px solid var(--border);
          background: linear-gradient(135deg, var(--bg-input) 0%, var(--bg-card) 100%);
          display: flex; flex-direction: column; gap: 24px;
        }

        .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
        
        .candidate-identity { display: flex; gap: 20px; align-items: center; }
        
        .avatar-box {
          width: 80px; height: 80px; border-radius: 20px;
          border: 2px solid var(--border); background: var(--bg-input);
          overflow: hidden; display: flex; align-items: center; justify-content: center;
          font-size: 28px; font-weight: 700; color: var(--text-sub);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .avatar-box img { width: 100%; height: 100%; object-fit: cover; }

        .name-block h1 { font-family: 'Playfair Display', serif; font-size: 28px; margin: 0 0 6px 0; color: var(--text-main); }
        .name-block p { font-size: 15px; color: var(--primary); font-weight: 500; display: flex; align-items: center; gap: 8px; margin: 0; }
        
        /* Status Badge */
        .status-badge {
          padding: 6px 14px; border-radius: 30px; font-size: 12px;
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
          display: flex; align-items: center; gap: 6px; border: 1px solid transparent;
        }
        .st-Pending { background: rgba(251, 191, 36, 0.1); color: #fbbf24; border-color: rgba(251, 191, 36, 0.3); }
        .st-Viewed { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border-color: rgba(59, 130, 246, 0.3); }
        .st-Shortlisted { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
        .st-Rejected { background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }

        /* Actions Toolbar (Inside Header) */
        .header-actions {
          display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px;
        }
        .action-btn {
          padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; gap: 8px; border: none; transition: 0.2s;
        }
        .btn-shortlist { background: var(--success); color: #000; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
        .btn-shortlist:hover:not(:disabled) { background: #059669; transform: translateY(-2px); }
        
        .btn-reject { background: transparent; border: 1px solid var(--danger); color: var(--danger); }
        .btn-reject:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); }
        
        .btn-download { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-main); }
        .btn-download:hover { border-color: var(--primary); color: var(--primary); }

        /* --- INFO GRID (Contact + Key Stats) --- */
        .info-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1px; background: var(--border); /* Grid lines effect */
          border-bottom: 1px solid var(--border);
        }
        .info-cell {
          background: var(--bg-card); padding: 20px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .info-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-sub); display: flex; align-items: center; gap: 6px; }
        .info-val { font-size: 14px; font-weight: 600; color: var(--text-main); word-break: break-word; }
        .info-val a { color: var(--primary); text-decoration: none; }

        /* --- BODY SECTIONS --- */
        .profile-body { padding: 40px; }
        .section-block { margin-bottom: 40px; }
        .section-block:last-child { margin-bottom: 0; }

        .section-title {
          font-size: 16px; font-weight: 700; text-transform: uppercase; color: var(--text-sub);
          margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--border);
          display: flex; align-items: center; gap: 10px; letter-spacing: 1px;
        }
        .sec-icon { color: var(--primary); }

        .text-content { font-size: 15px; line-height: 1.7; color: var(--text-main); }

        /* Skills Chips */
        .skills-wrapper { display: flex; flex-wrap: wrap; gap: 10px; }
        .skill-pill {
          background: var(--bg-input); border: 1px solid var(--border);
          padding: 6px 16px; border-radius: 30px; font-size: 13px; font-weight: 600;
          color: var(--text-main);
        }

        /* Timeline */
        .timeline { padding-left: 20px; border-left: 2px solid var(--border); margin-left: 10px; }
        .tl-item { position: relative; padding-left: 30px; margin-bottom: 30px; }
        .tl-item:last-child { margin-bottom: 0; }
        .tl-dot {
          position: absolute; left: -27px; top: 4px;
          width: 12px; height: 12px; background: var(--primary); border-radius: 50%;
          border: 2px solid var(--bg-card); box-shadow: 0 0 0 2px var(--primary-dim);
        }
        .tl-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; flex-wrap: wrap; gap: 10px; }
        .tl-role { font-size: 16px; font-weight: 700; color: var(--text-main); }
        .tl-company { font-size: 14px; font-weight: 600; color: var(--primary); margin-bottom: 6px; display: block; }
        .tl-date { font-size: 12px; background: var(--bg-input); padding: 4px 10px; border-radius: 6px; color: var(--text-sub); font-weight: 500; }
        .tl-desc { font-size: 14px; color: var(--text-sub); line-height: 1.6; margin-top: 8px; }

        /* Education */
        .edu-grid { display: grid; gap: 20px; }
        .edu-item { display: flex; gap: 16px; align-items: flex-start; }
        .edu-icon {
          width: 40px; height: 40px; background: var(--bg-input); border-radius: 10px;
          display: flex; align-items: center; justify-content: center; color: var(--primary);
          border: 1px solid var(--border); flex-shrink: 0;
        }
        .edu-info h4 { margin: 0; font-size: 15px; font-weight: 700; color: var(--text-main); }
        .edu-info p { margin: 4px 0 0; font-size: 13px; color: var(--text-sub); }
        
        /* Health Box */
        .health-alert {
          background: rgba(239, 68, 68, 0.05); border: 1px dashed rgba(239, 68, 68, 0.3);
          border-radius: 12px; padding: 16px; display: flex; gap: 12px; margin-top: 20px;
        }
        .ha-content h5 { margin: 0 0 4px; font-size: 13px; color: #ef4444; font-weight: 700; }
        .ha-content p { margin: 0; font-size: 13px; color: #fca5a5; }

        /* --- MODAL (Kept same logic, refined style) --- */
        .confirm-modal-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 2000;
            display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(8px); animation: fadeIn 0.2s ease-out;
            padding: 20px;
        }
        .confirm-modal {
            background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px;
            width: 100%; max-width: 450px; padding: 30px; 
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
            animation: scaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .c-modal-header { text-align: center; margin-bottom: 24px; }
        .c-modal-icon {
            width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 16px;
            display: flex; align-items: center; justify-content: center;
        }
        .c-modal-icon.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .c-modal-icon.danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .c-modal-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: var(--text-main); }
        .c-modal-desc { font-size: 14px; color: var(--text-sub); line-height: 1.5; }
        
        .interview-form { background: var(--bg-input); padding: 16px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 20px; text-align: left; }
        .int-field { margin-bottom: 12px; }
        .int-label { font-size: 11px; font-weight: 700; color: var(--text-sub); text-transform: uppercase; margin-bottom: 6px; display: block; }
        .int-input { width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-main); font-size: 13px; outline: none; }
        .int-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .c-modal-actions { display: flex; gap: 12px; }
        .btn-c-modal { flex: 1; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; }
        .btn-c-cancel { background: transparent; border: 1px solid var(--border); color: var(--text-sub); }
        .btn-c-cancel:hover { border-color: var(--text-main); color: var(--text-main); }
        .btn-c-confirm-success { background: var(--success); color: #000; }
        .btn-c-confirm-danger { background: var(--danger); color: #fff; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        /* Responsive */
        @media (max-width: 768px) {
          .profile-header { align-items: flex-start; }
          .header-top { flex-direction: column; gap: 20px; }
          .header-actions { width: 100%; }
          .action-btn { flex: 1; justify-content: center; }
          .info-grid { grid-template-columns: 1fr 1fr; }
          .int-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* --- BACKGROUND ELEMENTS --- */}
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="main-container">
        
        {/* --- TOP NAVIGATION --- */}
        <div className="nav-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18}/> Back to List
          </button>
          <div style={{fontSize:13, color:'var(--text-sub)'}}>
            Reviewing application for <span style={{color:'var(--primary)', fontWeight:600}}>{jobTitle}</span>
          </div>
        </div>

        {/* --- UNIFIED PROFILE CARD --- */}
        <div className="profile-card">
          
          {/* 1. HEADER SECTION */}
          <div className="profile-header">
            <div className="header-top">
              <div className="candidate-identity">
                <div className="avatar-box">
                  {applicant.user.photoUrl ? (
                    <img src={getFileUrl(applicant.user.photoUrl)} alt="Profile" />
                  ) : (
                    applicant.user.name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="name-block">
                  <h1>{applicant.user.name}</h1>
                  <p>
                    {applicant.headline || "Applicant"} 
                    {applicant.dob && <span> • {getAge(applicant.dob)}</span>}
                  </p>
                </div>
              </div>

              <div className={`status-badge st-${status}`}>
                {status === 'Shortlisted' && <CheckCircle size={14}/>}
                {status === 'Rejected' && <XCircle size={14}/>}
                {status === 'Pending' && <Clock size={14}/>}
                {status}
              </div>
            </div>

            {/* ACTION TOOLBAR */}
            <div className="header-actions">
              <button 
                className="action-btn btn-shortlist"
                onClick={() => promptDecision('Shortlisted')}
                disabled={loading || status === 'Shortlisted'}
              >
                <CheckCircle size={16}/> {status === 'Shortlisted' ? 'Shortlisted' : 'Shortlist'}
              </button>
              
              <button 
                className="action-btn btn-reject"
                onClick={() => promptDecision('Rejected')}
                disabled={loading || status === 'Rejected'}
              >
                <XCircle size={16}/> {status === 'Rejected' ? 'Rejected' : 'Reject'}
              </button>

              <button className="action-btn btn-download" onClick={downloadProfile}>
                <FileText size={16}/> Export CSV
              </button>

             {(applicant.resumeUrl || applicant.resume) && (
                <a 
                  href={getFileUrl(applicant.resumeUrl || applicant.resume)} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="action-btn btn-download" 
                  style={{textDecoration:'none'}}
                >
                  <Download size={16}/> View Resume
                </a>
              )}
            </div>
          </div>

          {/* 2. INFO GRID (Consolidated Data) */}
          <div className="info-grid">
            <div className="info-cell">
              <div className="info-label"><Mail size={14}/> Email</div>
              <div className="info-val">{applicant.user.email}</div>
            </div>
            <div className="info-cell">
              <div className="info-label"><Phone size={14}/> Phone</div>
              <div className="info-val">{applicant.phone || "N/A"}</div>
            </div>
            <div className="info-cell">
              <div className="info-label"><MapPin size={14}/> Location</div>
              <div className="info-val">{applicant.location || "Remote"}</div>
            </div>
            <div className="info-cell">
              <div className="info-label"><Briefcase size={14}/> Experience</div>
              <div className="info-val">{applicant.experience || 0} Years</div>
            </div>
            <div className="info-cell">
              <div className="info-label"><Wallet size={14}/> Expected Salary</div>
              <div className="info-val" style={{color:'var(--success)'}}>{applicant.expectedCompensation || "Negotiable"}</div>
            </div>
            <div className="info-cell">
              <div className="info-label"><Globe size={14}/> Portfolio</div>
              <div className="info-val">
                {applicant.portfolio ? <a href={applicant.portfolio} target="_blank" rel="noreferrer">View Link</a> : "N/A"}
              </div>
            </div>
          </div>

          {/* 3. PROFILE BODY */}
          <div className="profile-body">
            
            {/* SKILLS */}
            <div className="section-block">
              <div className="section-title"><Award size={18} className="sec-icon"/> Skills & Expertise</div>
              <div className="skills-wrapper">
                {Array.isArray(applicant.skills) && applicant.skills.length > 0 ? (
                  applicant.skills.map((s, i) => <span key={i} className="skill-pill">{s}</span>)
                ) : <span style={{color:'var(--text-sub)', fontStyle:'italic'}}>No skills listed.</span>}
              </div>
            </div>

            {/* ABOUT */}
            <div className="section-block">
              <div className="section-title"><FileText size={18} className="sec-icon"/> Executive Summary</div>
              <p className="text-content">
                {applicant.bio || applicant.coverLetter || "No summary provided by the candidate."}
              </p>
            </div>

            {/* EXPERIENCE */}
            <div className="section-block">
              <div className="section-title"><Briefcase size={18} className="sec-icon"/> Work History</div>
              {Array.isArray(applicant.workExperience) && applicant.workExperience.length > 0 ? (
                <div className="timeline">
                  {applicant.workExperience.map((exp, i) => (
                    <div key={i} className="tl-item">
                      <div className="tl-dot"></div>
                      <div className="tl-head">
                        <div className="tl-role">{exp.title}</div>
                        <div className="tl-date">
                          {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate)}
                        </div>
                      </div>
                      <span className="tl-company">{exp.company}</span>
                      {exp.description && <p className="tl-desc">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              ) : <div style={{color:'var(--text-sub)', fontStyle:'italic'}}>No work history available.</div>}
            </div>

            {/* EDUCATION */}
            <div className="section-block">
              <div className="section-title"><GraduationCap size={18} className="sec-icon"/> Education</div>
              <div className="edu-grid">
                {Array.isArray(applicant.education) && applicant.education.length > 0 ? (
                  applicant.education.map((edu, i) => (
                    <div key={i} className="edu-item">
                      <div className="edu-icon"><GraduationCap size={20}/></div>
                      <div className="edu-info">
                        <h4>{edu.degree || "Degree Not Specified"}</h4>
                        <p>{edu.institution} • {edu.year}</p>
                      </div>
                    </div>
                  ))
                ) : <div style={{color:'var(--text-sub)', fontStyle:'italic'}}>No education available.</div>}
              </div>
            </div>

            {/* PREFERENCES & HEALTH */}
            <div className="section-block">
              <div className="section-title"><HeartPulse size={18} className="sec-icon"/> Preferences & Health</div>
              <div className="info-grid" style={{border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', marginBottom:16}}>
                 <div className="info-cell"><div className="info-label">Availability</div><div className="info-val">{applicant.availability || "Immediate"}</div></div>
                 <div className="info-cell"><div className="info-label">Role Type</div><div className="info-val">{applicant.workType || "Any"}</div></div>
                 <div className="info-cell"><div className="info-label">Mode</div><div className="info-val">{applicant.workMode || "Remote"}</div></div>
              </div>

              {applicant.healthConsiderations && (
                <div className="health-alert">
                  <HeartPulse size={20} color="#ef4444"/>
                  <div className="ha-content">
                    <h5>Health Consideration</h5>
                    <p>{applicant.healthConsiderations}</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {modalConfig.isOpen && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="c-modal-header">
              <div className={`c-modal-icon ${modalConfig.newStatus === 'Shortlisted' ? 'success' : 'danger'}`}>
                {modalConfig.newStatus === 'Shortlisted' ? <CheckCircle size={32}/> : <AlertTriangle size={32}/>}
              </div>
              <h3 className="c-modal-title">
                  {modalConfig.newStatus === 'Shortlisted' ? 'Shortlist Candidate?' : 'Reject Candidate?'}
              </h3>
              <p className="c-modal-desc">
                Mark <strong>{applicant.user.name}</strong> as {modalConfig.newStatus}?
                {modalConfig.newStatus === 'Shortlisted' ? " You can add interview details below." : " This action can be undone."}
              </p>
            </div>

            {modalConfig.newStatus === 'Shortlisted' && (
              <div className="interview-form">
                <div className="int-row">
                  <div className="int-field">
                    <label className="int-label">Date <span style={{ color: "var(--danger)" }}>*</span></label>
                    <input type="date" className="int-input" value={interviewData.date} onChange={(e) => setInterviewData({...interviewData, date:e.target.value})} />
                  </div>
                  <div className="int-field">
                    <label className="int-label">Time <span style={{ color: "var(--danger)" }}>*</span></label>
                    <input type="time" className="int-input" value={interviewData.time} onChange={(e) => setInterviewData({...interviewData, time:e.target.value})} />
                  </div>
                </div>
                <div className="int-field">
                  <label className="int-label">Interview Mode <span style={{ color: "var(--danger)" }}>*</span></label>
                  <select className="int-input" value={interviewData.mode} onChange={(e) => setInterviewData({...interviewData, mode:e.target.value})}>
                    <option>Online (Video Call)</option>
                    <option>In-Person</option>
                    <option>Telephonic</option>
                  </select>
                </div>
                <div className="int-field">
                  <label className="int-label">Meeting Link / Address <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input type="text" className="int-input" placeholder="Google Meet Link or Office Address" value={interviewData.link} onChange={(e) => setInterviewData({...interviewData, link:e.target.value})} />
                </div>
              </div>
            )}
            
            <div className="c-modal-actions">
              <button className="btn-c-modal btn-c-cancel" onClick={() => setModalConfig({ isOpen: false, newStatus: "" })}>
                Cancel
              </button>
              <button className={`btn-c-modal ${modalConfig.newStatus === 'Shortlisted' ? 'btn-c-confirm-success' : 'btn-c-confirm-danger'}`} onClick={executeDecision}>
                {modalConfig.newStatus === 'Shortlisted' ? 'Confirm & Send Email' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ApplicantDetails;