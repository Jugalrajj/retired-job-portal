import React, { useEffect, useState, useRef } from "react"; 
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import useAuthStore from "../../context/useAuthStore";
import { toast } from "react-hot-toast"; 
import { 
  Briefcase, MapPin, Clock, Calendar, 
  ArrowLeft, CheckCircle, Upload, X, LogIn, ChevronRight,
  Share2, Building2, Check, 
  Activity, Globe, Award, AlertCircle // Added AlertCircle
} from "lucide-react";

const SeekerJobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const hasFetched = useRef(false); 

  // Modal States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // --- FORM DATA ---
  const [formData, setFormData] = useState({ 
    fullName: "", 
    email: "",
    phone: "",
    totalExperienceYears: "", 
    highestQualification: "",
    coverLetter: "" 
  });
  
  const [resume, setResume] = useState(null);
  // 🔥 NEW STATE: Track resume error specifically
  const [resumeError, setResumeError] = useState("");

  // 1. Fetch Job Details
  useEffect(() => {
    if (hasFetched.current) return; 
    hasFetched.current = true; 

    const fetchJob = async () => {
      try {
        const { data } = await api.get(`/jobs/${id}`);
        setJob(data);

        // Check if already applied
        if (isAuthenticated && user?.user?._id && data.detailedApplicants) {
           const alreadyApplied = data.detailedApplicants.some(app => {
              const appId = typeof app.user === 'object' ? app.user._id : app.user;
              return appId === user.user._id;
           });
           setHasApplied(alreadyApplied);
        }
      } catch (err) {
        console.error("Error fetching job:", err);
        toast.error("Failed to load job details"); 
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id, isAuthenticated, user]);

  // 2. Hydrate Form Data from User Profile
  useEffect(() => {
    if (showApplyModal && user) {
      setFormData({
        fullName: user.user?.name || "",
        email: user.user?.email || "",
        phone: user.user?.phone || "",
        totalExperienceYears: "", 
        highestQualification: "",
        coverLetter: ""
      });
      // Reset errors when modal opens
      setResumeError("");
      setResume(null);
    }
  }, [showApplyModal, user]);

  const handleShare = async () => {
    const shareData = {
      title: job?.title,
      text: `Check out this role at ${job?.companyId?.name}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true); 
        toast.success("Link copied to clipboard!"); 
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) { console.error(err); }
  };

  const handleApplyClick = () => {
    if (hasApplied) return;
    if (!isAuthenticated) setShowLoginModal(true);
    else setShowApplyModal(true);
  };

  // --- HANDLE RESUME UPLOAD (Max 5MB) ---
  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        // 🔥 Set inline error instead of toast
        setResumeError("File size exceeds 5MB limit. Please upload a smaller file.");
        e.target.value = ""; // Clear input
        setResume(null);
        return;
      }
      // Clear error if valid
      setResumeError("");
      setResume(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) {
        // Fallback if they try to submit without file
        setResumeError("Please upload your resume.");
        return;
    }
    
    setIsSubmitting(true);
    const data = new FormData();
    
    data.append("fullName", formData.fullName);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("totalExperienceYears", formData.totalExperienceYears);
    data.append("highestQualification", formData.highestQualification);
    data.append("coverLetter", formData.coverLetter);
    data.append("resume", resume);

    try {
      await api.post(`/jobs/apply/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setHasApplied(true);
      toast.success("Application submitted successfully!"); 
      setShowApplyModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply."); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `http://localhost:5000/${url.replace(/\\/g, "/")}`;
  };

  const formatSalary = () => {
    if (job?.isVolunteer) return "Volunteer / Unpaid";
    if (!job?.minSalary && !job?.maxSalary) return "Not Disclosed";
    return `${job.currency} ${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()} / ${job.frequency}`;
  };

  if (loading) return (
    <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-root)', color: 'var(--text-sub)'}}>
      Loading Opportunity...
    </div>
  );
  
  if (!job) return (
    <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-root)', color: 'var(--text-sub)'}}>
      Job not found.
    </div>
  );

  return (
    <div className="dark-details-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        /* --- PAGE WRAPPER --- */
        .dark-details-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root); /* 🔥 Theme Var */
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          padding: 40px 20px;
          display: flex; justify-content: center;
          color: var(--text-main); /* 🔥 Theme Var */
          transition: background-color 0.3s ease;
        }

        /* --- BACKGROUND FX --- */
        .bg-blob {
          position: absolute; border-radius: 50%; filter: blur(120px);
          opacity: 0.15; z-index: 0; pointer-events: none;
        }
        .b1 { top: -10%; left: -10%; width: 600px; height: 600px; background: #4f46e5; }
        .b2 { bottom: -10%; right: -10%; width: 500px; height: 500px; background: var(--primary); }

        /* --- DESIGNER CONTAINER --- */
        .designer-container {
          width: 100%; max-width: 1280px;
          background: var(--bg-card); /* 🔥 Theme Var */
          backdrop-filter: blur(12px);
          border: 1px solid var(--border); /* 🔥 Theme Var */
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          z-index: 5;
        }

        /* Top Accent Strip */
        .designer-container::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #4f46e5 0%, var(--primary) 100%);
          z-index: 20;
        }

        /* HEADER */
        .job-header { 
          padding: 40px; border-bottom: 1px solid var(--border); 
          background: var(--bg-card); /* 🔥 Theme Var */
          position: relative; z-index: 2; 
        }
        .back-link { 
          display: inline-flex; align-items: center; gap: 6px; 
          color: var(--text-sub); font-weight: 600; cursor: pointer; 
          margin-bottom: 20px; transition: 0.2s; 
        }
        .back-link:hover { color: var(--primary); }

        .header-main { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px; }
        .title-block { flex: 1; min-width: 280px; }
        .title-block h1 { 
          font-family: 'Playfair Display', serif;
          font-size: 32px; font-weight: 700; color: var(--text-main); /* 🔥 Theme Var */
          margin: 0 0 10px 0; letter-spacing: -0.5px; line-height: 1.2; 
        }
        .company-meta { display: flex; align-items: center; gap: 12px; font-size: 15px; color: var(--text-sub); font-weight: 500; flex-wrap: wrap; }
        .company-logo-small { width: 32px; height: 32px; border-radius: 6px; object-fit: contain; background: white; padding: 2px; }

        .action-block { display: flex; gap: 12px; flex-shrink: 0; }
        
        .btn-apply-big {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: white; padding: 12px 32px; border-radius: 12px;
          font-weight: 700; font-size: 15px; border: none; cursor: pointer;
          box-shadow: 0 4px 15px var(--primary-dim); transition: all 0.2s;
          display: flex; align-items: center; gap: 8px; white-space: nowrap;
        }
        .btn-apply-big:hover { transform: translateY(-2px); box-shadow: 0 6px 20px var(--primary-dim); }
        .btn-apply-big.applied { background: var(--success); box-shadow: none; cursor: default; transform: none; }
        
        .btn-share { 
          background: var(--bg-input); border: 1px solid var(--border); 
          padding: 12px; border-radius: 12px; cursor: pointer; color: var(--text-main); 
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; position: relative;
        }
        .btn-share:hover { border-color: var(--primary); color: var(--primary); }
        .btn-share.copied { background: rgba(16, 185, 129, 0.2); color: var(--success); border-color: var(--success); }

        /* HIGHLIGHTS BAR */
        .highlights-bar {
          display: flex; flex-wrap: wrap; gap: 15px; padding: 20px 40px; 
          background: var(--bg-input); /* 🔥 Theme Var */
          border-bottom: 1px solid var(--border); 
          position: relative; z-index: 2;
        }
        .hl-item { 
          display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; 
          color: var(--text-main); background: var(--bg-card); 
          padding: 8px 16px; border-radius: 50px; border: 1px solid var(--border); 
          white-space: nowrap; 
        }
        .hl-icon { color: var(--primary); }

        /* GRID LAYOUT */
        .job-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 40px; padding: 40px; position: relative; z-index: 2; }

        /* LEFT CONTENT */
        .section-title { 
          font-size: 18px; font-weight: 700; color: var(--text-main); /* 🔥 Theme Var */
          margin-bottom: 16px; display: flex; align-items: center; gap: 8px; 
          border-left: 4px solid var(--primary); padding-left: 12px; 
        }
        .description-text { font-size: 15px; line-height: 1.8; color: var(--text-sub); margin-bottom: 30px; white-space: pre-line; }
        
        .info-grid-box { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .info-item h4 { margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; color: var(--text-sub); font-weight: 700; letter-spacing: 0.5px; }
        .info-item p { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-main); }

        .tags-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 30px; }
        .skill-tag { 
          background: var(--primary-dim); padding: 6px 14px; border-radius: 8px; 
          font-size: 13px; font-weight: 600; color: var(--primary); 
          border: 1px solid var(--primary); 
        }

        /* SENIOR SPECIFIC BOX */
        .senior-card { 
          background: var(--bg-input); border: 1px solid var(--border); 
          border-radius: 16px; padding: 24px; margin-bottom: 30px; 
        }
        .senior-title { color: var(--primary); font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .senior-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .senior-item h5 { margin: 0 0 4px; font-size: 13px; color: var(--text-sub); text-transform: uppercase; }
        .senior-item p { margin: 0; font-weight: 600; color: var(--text-main); font-size: 15px; }

        /* RIGHT SIDEBAR */
        .sidebar-card { 
          background: var(--bg-card); border: 1px solid var(--border); 
          border-radius: 16px; padding: 24px; margin-bottom: 24px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.05); 
        }
        .sidebar-title { font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .detail-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; font-size: 14px; color: var(--text-sub); }
        .detail-icon { 
          width: 36px; height: 36px; background: var(--bg-input); 
          color: var(--primary); border-radius: 8px; display: flex; 
          align-items: center; justify-content: center; flex-shrink: 0; 
          border: 1px solid var(--border);
        }
        .detail-content { flex: 1; }
        .detail-content span { display: block; font-size: 11px; color: var(--text-sub); text-transform: uppercase; }
        .detail-content strong { display: block; color: var(--text-main); font-size: 14px; margin-top: 2px; }

        .company-mini-profile { text-align: center; margin-top: 10px; }
        .company-logo-large { 
          width: 80px; height: 80px; object-fit: contain; margin: 0 auto 15px; 
          border: 1px solid var(--border); border-radius: 12px; padding: 5px; background: white;
        }
        .company-name { font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 5px; }
        .company-link { 
          color: var(--primary); font-size: 13px; font-weight: 600; 
          text-decoration: none; display: inline-flex; align-items: center; gap: 4px; 
        }

        /* MODAL STYLES */
        .pro-modal-overlay { 
          position: fixed; inset: 0; background: var(--glass); 
          backdrop-filter: blur(8px); display: flex; align-items: center; 
          justify-content: center; z-index: 10000; padding: 20px; 
        }
        .pro-modal { 
          background: var(--bg-card); width: 100%; max-width: 500px; border-radius: 20px; 
          box-shadow: 0 25px 50px rgba(0,0,0,0.3); overflow: hidden; 
          display: flex; flex-direction: column; max-height: 90vh; 
          border: 1px solid var(--border);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        
        .pro-modal-header { 
          padding: 24px 30px; border-bottom: 1px solid var(--border); 
          background: var(--bg-input); display: flex; 
          justify-content: space-between; align-items: center; 
        }
        .pro-modal-header h2 { font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0; }
        .pro-modal-header p { color: var(--text-sub); font-size: 14px; margin: 4px 0 0; }
        
        .close-icon-btn { 
          background: var(--bg-card); border: 1px solid var(--border); 
          border-radius: 8px; width: 32px; height: 32px; display: flex; 
          align-items: center; justify-content: center; cursor: pointer; 
          color: var(--text-sub); transition: 0.2s; 
        }
        .close-icon-btn:hover { color: var(--text-main); background: var(--bg-input); }
        
        .pro-modal-body { padding: 30px; overflow-y: auto; flex: 1; }
        
        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 8px; }
        .input-group input, .input-group textarea { 
          width: 100%; padding: 12px 16px; border: 1px solid var(--border); 
          border-radius: 10px; font-size: 14px; color: var(--text-main); 
          transition: 0.2s; background: var(--bg-input); box-sizing: border-box; 
        }
        .input-group input:focus, .input-group textarea:focus { border-color: var(--primary); outline: none; background: var(--bg-card); }
        
        .file-drop-area { 
          border: 2px dashed var(--border); border-radius: 12px; padding: 25px; 
          text-align: center; background: var(--bg-input); cursor: pointer; 
          transition: 0.2s; margin-top: 10px; display: block;
        }
        .file-drop-area:hover { border-color: var(--primary); background: var(--primary-dim); }
        .file-drop-area.error-border { border-color: var(--danger); background: rgba(239, 68, 68, 0.05); }
        
        .file-name-display { color: var(--success); margin-top: 10px; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px; }

        .pro-modal-footer { 
          padding: 20px 30px; border-top: 1px solid var(--border); 
          background: var(--bg-input); display: flex; justify-content: flex-end; gap: 12px; 
        }
        .btn-cancel { 
          padding: 12px 24px; border: 1px solid var(--border); 
          background: transparent; color: var(--text-sub); font-weight: 600; 
          border-radius: 10px; cursor: pointer; transition: 0.2s; 
        }
        .btn-cancel:hover { color: var(--text-main); border-color: var(--text-main); }
        
        .btn-submit-app { 
          padding: 12px 30px; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%); 
          color: white; font-weight: 700; border-radius: 10px; border: none; 
          cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px var(--primary-dim); 
        }
        .btn-submit-app:hover { transform: translateY(-1px); }

        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* --- RESPONSIVE MEDIA QUERIES --- */
        @media (max-width: 1024px) {
           .job-grid { grid-template-columns: 2fr 1.5fr; gap: 30px; padding: 30px; }
        }

        @media (max-width: 900px) {
           .dark-details-wrapper { padding: 0; }
           .designer-container { border-radius: 0; border: none; }
           .job-grid { grid-template-columns: 1fr; gap: 30px; padding: 25px; }
           .header-main { flex-direction: column; }
           .action-block { width: 100%; margin-top: 10px; }
           .btn-apply-big { flex: 1; justify-content: center; }
           .highlights-bar { padding: 20px 25px; }
        }

        @media (max-width: 600px) {
           .job-header { padding: 24px 20px; }
           .title-block h1 { font-size: 26px; }
           .company-meta { gap: 8px; font-size: 13px; }
           
           .highlights-bar { gap: 10px; padding: 15px 20px; }
           .hl-item { font-size: 12px; padding: 6px 12px; }
           
           .job-grid { padding: 20px; }
           .senior-grid { grid-template-columns: 1fr; gap: 15px; }
           .info-grid-box { grid-template-columns: 1fr 1fr; gap: 15px; }
           
           .pro-modal { border-radius: 0; height: 100%; max-height: 100%; width: 100%; max-width: 100%; }
           .pro-modal-body { padding: 20px; }
           .pro-modal-header { padding: 20px; }
           .pro-modal-footer { padding: 15px 20px; }
        }

        @media (max-width: 400px) {
           .info-grid-box { grid-template-columns: 1fr; }
           .action-block { flex-direction: column; }
           .btn-share { width: 100%; }
        }
      `}</style>

      {/* BACKGROUND ELEMENTS */}
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="designer-container">
        
        {/* HEADER */}
        <div className="job-header">
          <div className="back-link" onClick={() => navigate(-1)}>
            <ArrowLeft size={18}/> Back to Jobs
          </div>
          
          <div className="header-main">
            <div className="title-block">
              <h1>{job.title}</h1>
              <div className="company-meta">
                {job.companyId?.logo && <img src={getLogoUrl(job.companyId.logo)} className="company-logo-small" alt="" />}
                <span>{job.companyId?.name || "Confidential Company"}</span>
                <span>•</span>
                <span>{job.location || job.locations?.[0] || "Remote"}</span>
                <span>•</span>
                <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="action-block">
              <button className={`btn-share ${isCopied ? "copied" : ""}`} onClick={handleShare}>
                {isCopied ? <Check size={20} /> : <Share2 size={20} />}
              </button>
              
              <button 
                className={`btn-apply-big ${hasApplied ? 'applied' : ''}`} 
                onClick={handleApplyClick}
                disabled={hasApplied}
              >
                {hasApplied ? <><CheckCircle size={18}/> Applied</> : "Apply Now"}
              </button>
            </div>
          </div>
        </div>

        {/* HIGHLIGHTS BAR */}
        <div className="highlights-bar">
          <div className="hl-item"><Briefcase size={16} className="hl-icon"/> {job.workType}</div>
          <div className="hl-item"><Activity size={16} className="hl-icon"/> {job.workMode}</div>
          <div className="hl-item">{formatSalary()}</div>
          <div className="hl-item"><Award size={16} className="hl-icon"/> {job.seniorityLevel}</div>
          {job.urgency === "Urgent" || job.urgency === "Immediate" ? (
              <div className="hl-item" style={{color:'#ef4444', borderColor:'#ef4444', background:'rgba(239, 68, 68, 0.1)'}}>
                  <Activity size={16} className="hl-icon" style={{color:'#ef4444'}}/> {job.urgency} Hiring
              </div>
          ) : null}
        </div>

        {/* MAIN GRID */}
        <div className="job-grid">
          
          {/* LEFT CONTENT */}
          <div className="job-content">
            
            {/* Description */}
            <div className="section-title">Job Description</div>
            <p className="description-text">{job.description}</p>

            {/* Roles & Responsibilities */}
            {job.responsibilities && (
              <>
                <div className="section-title">Roles & Responsibilities</div>
                <p className="description-text">{job.responsibilities}</p>
              </>
            )}

            {/* Role Profile */}
            <div className="section-title">Role Profile</div>
            <div className="info-grid-box">
              <div className="info-item"><h4>Category</h4><p>{job.roleCategory}</p></div>
              <div className="info-item"><h4>Department</h4><p>{job.department}</p></div>
              <div className="info-item"><h4>Seniority</h4><p>{job.seniorityLevel}</p></div>
              <div className="info-item"><h4>Openings</h4><p>{job.openings}</p></div>
            </div>

            {/* Senior Specific Details */}
            <div className="senior-card">
              <div className="senior-title"><Activity size={20}/> Work Environment & Demands</div>
              <div className="senior-grid">
                 <div className="senior-item">
                    <h5>Physical Intensity</h5>
                    <p>{job.physicalDemands}</p>
                 </div>
                 <div className="senior-item">
                    <h5>Travel Requirement</h5>
                    <p>{job.travelRequirement}</p>
                 </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="section-title">Requirements</div>
            <div className="info-grid-box">
              <div className="info-item"><h4>Education</h4><p>{job.education}</p></div>
              <div className="info-item"><h4>Experience</h4><p>{job.minExperience} - {job.maxExperience} Years</p></div>
            </div>
            
            <div className="section-title">Skills Required</div>
            <div className="tags-row">
              {job.skills?.map((skill, i) => <span key={i} className="skill-tag">{skill}</span>)}
            </div>

            {/* Perks */}
            {job.customPerks && (
              <>
                <div className="section-title">Perks & Benefits</div>
                <p className="description-text">{job.customPerks}</p>
              </>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="job-sidebar">
            <div className="sidebar-card">
              <div className="sidebar-title">Logistics</div>
              
              <div className="detail-row">
                <div className="detail-icon"><Clock size={20}/></div>
                <div className="detail-content"><span>Time Commitment</span><strong>{job.hoursPerWeek} Hours / Week</strong></div>
              </div>

              <div className="detail-row">
                <div className="detail-icon"><Calendar size={20}/></div>
                <div className="detail-content"><span>Duration</span><strong>{job.durationValue} {job.durationUnit}</strong></div>
              </div>

              <div className="detail-row">
                <div className="detail-icon"><Globe size={20}/></div>
                <div className="detail-content"><span>Location Type</span><strong>{job.locationType}</strong></div>
              </div>

              <div className="detail-row">
                <div className="detail-icon"><MapPin size={20}/></div>
                <div className="detail-content">
                  <span>Office Location</span>
                  <strong>{job.locations?.join(", ") || "Remote"}</strong>
                </div>
              </div>
            </div>

            <div className="sidebar-card">
              <div className="sidebar-title">About Company</div>
              <div className="company-mini-profile">
                {job.companyId?.logo ? 
                  <img src={getLogoUrl(job.companyId.logo)} className="company-logo-large" alt=""/> : 
                  <Building2 size={60} color="var(--text-sub)" style={{margin:'0 auto 15px'}}/>
                }
                <div className="company-name">{job.companyId?.name}</div>
                <p style={{fontSize:13, color:'var(--text-sub)', marginBottom:15}}>
                  {job.companyId?.industry || "Technology"} • {job.companyId?.location || "Global"}
                </p>
                <a href="#" className="company-link" onClick={(e) => { e.preventDefault(); navigate(`/company/${job.companyId?._id}`); }}>
                  Visit Profile <ChevronRight size={14}/>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* --- APPLY MODAL --- */}
      {showApplyModal && (
        <div className="pro-modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="pro-modal" onClick={e => e.stopPropagation()}>
            <div className="pro-modal-header">
              <div>
                <h2>Easy Apply</h2>
                <p>Applying to <strong>{job.companyId?.name}</strong></p>
              </div>
              <button className="close-icon-btn" onClick={() => setShowApplyModal(false)}><X size={18}/></button>
            </div>

            <div className="pro-modal-body">
              <form id="applyForm" onSubmit={handleSubmit}>
                <div className="input-group">
                  <label>Full Name</label>
                  <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="e.g. John Doe"/>
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="e.g. john@example.com"/>
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="e.g. +91 9876543210"/>
                </div>
                <div className="input-group">
                  <label>Total Experience (Years)</label>
                  <input type="number" required value={formData.totalExperienceYears} onChange={(e) => setFormData({...formData, totalExperienceYears: e.target.value})} placeholder="e.g. 15"/>
                </div>
                <div className="input-group">
                  <label>Highest Qualification</label>
                  <input type="text" required value={formData.highestQualification} onChange={(e) => setFormData({...formData, highestQualification: e.target.value})} placeholder="e.g. MBA / PhD"/>
                </div>
                <div className="input-group">
                  <label>Cover Letter (Optional)</label>
                  <textarea rows="4" value={formData.coverLetter} onChange={(e) => setFormData({...formData, coverLetter: e.target.value})} placeholder="Why are you the right fit?"></textarea>
                </div>
                <div className="input-group">
                  <label>Resume / CV</label>
                  {/* 🔥 UPDATED: Added error class conditionally */}
                  <label className={`file-drop-area ${resumeError ? 'error-border' : ''}`}>
                    <Upload size={32} color={resumeError ? "var(--danger)" : "var(--text-sub)"} style={{marginBottom:10}}/>
                    <div style={{color:'var(--text-main)', fontWeight:600}}>Upload Resume</div>
                    <div style={{color:'var(--text-sub)', fontSize:12, marginBottom:5}}>Supported Format: PDF (Max 5MB)</div>
                    {resume && <div className="file-name-display"><CheckCircle size={14}/> {resume.name}</div>}
                    <input 
                      type="file" 
                      accept=".pdf" 
                      style={{display:'none'}} 
                      onChange={handleResumeChange} 
                    />
                  </label>
                  {/* 🔥 NEW: Inline error message */}
                  {resumeError && (
                    <div style={{display:'flex', alignItems:'center', gap:'6px', color:'var(--danger)', fontSize:'13px', marginTop:'8px', fontWeight:500}}>
                      <AlertCircle size={14}/> {resumeError}
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="pro-modal-footer">
              <button className="btn-cancel" onClick={() => setShowApplyModal(false)}>Cancel</button>
              <button type="submit" form="applyForm" className="btn-submit-app" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="pro-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="pro-modal" style={{maxWidth:380, height:'auto', borderRadius:16}} onClick={e => e.stopPropagation()}>
            <div style={{padding:40, textAlign:'center'}}>
              <div style={{background:'var(--primary-dim)', width:60, height:60, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:'var(--primary)'}}>
                <LogIn size={28}/>
              </div>
              <h2 style={{fontSize:22, color:'var(--text-main)', marginBottom:12, fontWeight:700}}>Sign In Required</h2>
              <p style={{color:'var(--text-sub)', marginBottom:30, fontSize:15, lineHeight:1.5}}>Please log in to your account to apply for this position.</p>
              <button className="btn-submit-app" style={{width:'100%'}} onClick={() => navigate('/login')}>Go to Login</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeekerJobDetails;