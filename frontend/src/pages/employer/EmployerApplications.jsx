import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { 
  Search, MapPin, Briefcase, Clock, ChevronRight, 
  CheckCircle, XCircle, FileText, MessageSquare, 
  Filter, User, Building2, Phone, Calendar, Menu, ArrowLeft, Eye, MoreHorizontal, Lock, Sparkles,
  Download, CheckSquare, Square, MousePointer, ChevronLeft
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../context/useAuthStore"; 

const EmployerApplications = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // --- 1. User Data & Refresh Action ---
  const { user, refreshUser } = useAuthStore(); 
  
  // Safe Access to plan (Default 'starter')
  const currentPlan = user?.user?.plan || "starter"; 

  // --- STATE ---
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // --- SELECTION STATE ---
  const [selectedIds, setSelectedIds] = useState([]);

  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // --- INITIAL LOAD ---
  useEffect(() => {
    // CRITICAL: Fetch latest plan status immediately
    if (refreshUser) {
        refreshUser().catch(err => console.error("Sync failed", err));
    }

    fetchPostedJobs();
    
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setShowSidebar(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Run once on mount

  const fetchPostedJobs = async () => {
    try {
      const { data } = await api.get("/jobs/employer/posted");
      setJobs(data);

      const returnJobId = location.state?.selectedJobId;
      if (returnJobId) {
        const found = data.find(j => j._id === returnJobId);
        if (found) handleJobSelect(found);
      } else if (data.length > 0 && !selectedJob && window.innerWidth >= 1024) {
        handleJobSelect(data[0]);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  const handleJobSelect = async (job) => {
    setSelectedJob(job);
    setLoadingApps(true);
    setSelectedIds([]); // Reset selection on job change
    setCurrentPage(1); // Reset pagination
    if (isMobile) setShowSidebar(false);

    try {
      const { data } = await api.get(`/jobs/${job._id}/applicants`);
      setApplicants(data);
    } catch (err) {
      console.error("Error fetching applicants:", err);
      toast.error("Failed to load applicants");
    } finally {
      setLoadingApps(false);
    }
  };

  // --- 3. MESSAGE FUNCTION (Plan Protected) ---
  const startChat = async (userId) => {
    // STRICT CHECK: Matches the 'pro' set by backend
    if (currentPlan !== "pro") {
      toast.error(
        <span>
          Messaging is locked. <br/> 
          <b>Please Upgrade to Pro Plan.</b>
        </span>,
        { duration: 4000, icon: '🔒' }
      );
      setTimeout(() => navigate("/billing"), 1500);
      return;
    }

    try {
      const { data } = await api.post("/chats/init", { recipientId: userId });
      navigate("/messages", { state: { conversation: data } });
    } catch (err) {
      toast.error("Chat init failed");
    }
  };

  const viewDetails = (app) => {
    navigate(`/applications/${app._id}`, { 
      state: { 
        applicant: app, 
        jobId: selectedJob._id,
        jobTitle: selectedJob.title 
      } 
    });
  };

  const getAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `http://localhost:5000/${url.replace(/\\/g, "/")}`;
  };

  // --- FILTER LOGIC ---
  const filteredApplicants = applicants.filter(app => {
    if (statusFilter === "All") return true;
    return app.status === statusFilter;
  });

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentApplicants = filteredApplicants.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Optional: Scroll to top of grid
    document.getElementById("apps-grid-top")?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  // --- 4. SELECTION LOGIC ---
  const handleSelectAll = () => {
    if (selectedIds.length === filteredApplicants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredApplicants.map(app => app._id));
    }
  };

  const handleSelectOne = (e, id) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  // --- 5. COMPREHENSIVE EXCEL DOWNLOAD LOGIC ---
  const downloadExcel = () => {
    if (selectedIds.length === 0) return toast.error("No applicants selected");

    // Filter selected applicants
    const selectedData = applicants.filter(app => selectedIds.includes(app._id));

    // Prepare data for CSV
    const csvRows = [];
    
    // Headers (Comprehensive)
    const headers = [
      "Candidate Name", 
      "Headline", 
      "Email", 
      "Phone", 
      "Location",
      "Status",
      "Applied Date",
      "Total Experience (Yrs)", 
      "Last Company", 
      "Tech Level",
      "Skills", 
      "Work History Summary",
      "Education Summary",
      "Languages",
      "Preferred Work Mode",
      "Preferred Role",
      "Availability",
      "Expected Salary",
      "Portfolio Link",
      "Resume Link"
    ];
    csvRows.push(headers.join(","));

    // Rows
    selectedData.forEach(app => {
      // Helper to escape commas and quotes for CSV
      const safe = (str) => `"${(str || "").toString().replace(/"/g, '""').replace(/\n/g, " ")}"`;

      // Format Work History
      const workHistory = (app.workExperience || []).map(exp => 
        `${exp.title} at ${exp.company} (${new Date(exp.startDate).getFullYear()})`
      ).join("; ");

      // Format Education
      const education = (app.education || []).map(edu => 
        `${edu.degree} from ${edu.institution} (${edu.year})`
      ).join("; ");

      // Format Languages
      const languages = (app.languages || []).map(l => `${l.name} (${l.proficiency})`).join("; ");

      const row = [
        safe(app.user.name),
        safe(app.headline),
        safe(app.user.email),
        safe(app.user.phone || app.phone),
        safe(app.location),
        safe(app.status || 'Pending'),
        safe(new Date(app.appliedAt || app.createdAt).toLocaleDateString()),
        safe(app.experience || '0'),
        safe(app.lastCompany),
        safe(app.techLevel),
        safe((app.skills || []).join(', ')),
        safe(workHistory),
        safe(education),
        safe(languages),
        safe(app.workMode),
        safe(app.workType),
        safe(app.availability),
        safe(app.expectedCompensation),
        safe(app.portfolio),
        safe(app.resumeUrl ? `http://localhost:5000/${app.resumeUrl}` : "")
      ];
      csvRows.push(row.join(","));
    });

    // Create Blob and Download
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Detailed_Applicants_${selectedJob.title.replace(/\s+/g,'_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloaded details for ${selectedData.length} applicants!`);
  };

  return (
    <div className="dark-apps-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        /* --- PAGE WRAPPER --- */
        .dark-apps-wrapper { 
          display: flex; height: calc(100vh - 70px); 
          background-color: var(--bg-root); /* 🔥 Theme Var */
          font-family: 'Plus Jakarta Sans', sans-serif; 
          position: relative; color: var(--text-main); /* 🔥 Theme Var */
          overflow: hidden; 
          transition: background-color 0.3s ease;
        }

        .bg-blob { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.15; z-index: 0; pointer-events: none; }
        .b1 { top: -10%; left: -10%; width: 600px; height: 600px; background: #4f46e5; }
        .b2 { bottom: -10%; right: -10%; width: 500px; height: 500px; background: var(--primary); }
        
        .designer-container { 
          width: 100%; height: 100%; display: flex; 
          background: var(--bg-card); /* 🔥 Theme Var */
          backdrop-filter: blur(10px); position: relative; z-index: 5; 
        }
        
        /* SIDEBAR (SCROLLABLE) */
        .sidebar { 
          width: 380px; background: var(--bg-input); /* 🔥 Theme Var */
          border-right: 1px solid var(--border); 
          display: flex; flex-direction: column; flex-shrink: 0; 
          transition: transform 0.3s ease; z-index: 20; 
          height: 100%; /* Ensure full height */
        }
        .sidebar-header { padding: 24px; border-bottom: 1px solid var(--border); background: var(--bg-card); flex-shrink: 0; }
        .sidebar-header h2 { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--text-main); margin: 0; display: flex; justify-content: space-between; align-items: center; }
        .badge-count { background: var(--primary-dim); color: var(--primary); padding: 4px 10px; border-radius: 20px; font-size: 12px; border: 1px solid var(--primary); }
        
        .job-list { 
            flex: 1; overflow-y: auto; padding: 16px; 
            /* Custom Scrollbar for Sidebar */
            scrollbar-width: thin;
            scrollbar-color: var(--primary) var(--bg-input);
        }
        .job-list::-webkit-scrollbar { width: 6px; }
        .job-list::-webkit-scrollbar-thumb { background-color: var(--primary); border-radius: 4px; }

        .job-card { 
          padding: 18px; border-radius: 12px; border: 1px solid transparent; 
          margin-bottom: 12px; cursor: pointer; transition: all 0.2s; 
          background: var(--bg-card); 
        }
        .job-card:hover { background: var(--bg-root); }
        .job-card.active { background: var(--primary-dim); border-color: var(--primary); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        
        .job-card-title { font-weight: 700; font-size: 15px; color: var(--text-main); margin-bottom: 6px; line-height: 1.4; }
        .job-card.active .job-card-title { color: var(--primary); }
        .job-card-meta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--text-sub); }
        .app-count-tag { display: inline-flex; align-items: center; gap: 4px; background: var(--bg-input); border: 1px solid var(--border); padding: 4px 8px; border-radius: 6px; font-weight: 600; color: var(--text-main); }

        /* MAIN PANEL */
        .main-panel { 
          flex: 1; display: flex; flex-direction: column; 
          background: var(--bg-root); /* 🔥 Theme Var */
          position: relative; width: 100%; overflow: hidden; /* Prevent double scroll */
        }
        .panel-header { 
          background: var(--bg-card); padding: 24px 32px; 
          border-bottom: 1px solid var(--border); 
          display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; 
          flex-shrink: 0;
        }
        .header-left h1 { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: var(--text-main); margin: 0 0 6px 0; }
        .header-sub { display: flex; gap: 16px; color: var(--text-sub); font-size: 13px; font-weight: 500; }
        .header-sub span { display: flex; align-items: center; gap: 6px; }
        
        .filter-tabs { display: flex; background: var(--bg-input); padding: 4px; border-radius: 10px; border: 1px solid var(--border); gap: 4px; }
        .tab-btn { padding: 8px 16px; font-size: 13px; font-weight: 600; color: var(--text-sub); border: none; background: transparent; cursor: pointer; border-radius: 8px; transition: all 0.2s; }
        .tab-btn.active { background: var(--bg-card); color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        
        .applicants-container { 
            flex: 1; padding: 32px; overflow-y: auto; 
            display: flex; flex-direction: column;
        }
        
        /* Controls Row (Pagination & Selection) */
        .controls-row {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
        }
        .results-text { font-size: 13px; color: var(--text-sub); }
        .per-page-select {
            background: var(--bg-input); color: var(--text-sub); border: 1px solid var(--border);
            padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
            cursor: pointer; outline: none; margin-left: 10px;
        }
        .per-page-select:hover { border-color: var(--primary); color: var(--text-main); }

        .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; padding-bottom: 20px; }
        
        /* --- APPLICANT CARD STYLES --- */
        .app-card { 
          background: var(--bg-card); 
          border: 1px solid var(--border); border-radius: 16px; 
          padding: 24px; transition: all 0.3s ease; position: relative; 
          display: flex; flex-direction: column; cursor: pointer; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          height: 100%; min-height: 280px; /* Uniform Height */
        }
        .app-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); border-color: var(--primary); }
        .app-card.selected { border-color: var(--primary); background: var(--primary-dim); }
        
        /* Header Layout: Avatar + Info */
        .app-header { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 16px; padding-right: 30px; }
        
        .avatar-box { 
          width: 50px; height: 50px; border-radius: 50%; /* Perfect Circle */
          background: #fff; border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; 
          color: #000; overflow: hidden; flex-shrink: 0;
        }
        .avatar-box img { width: 100%; height: 100%; object-fit: cover; }
        
        .header-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        
        /* Name Row: Name + Status */
        .name-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
        .name-row h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-main); line-height: 1.2; }
        
        /* Headline: Truncated to 2 lines */
        .headline-text { 
           margin: 0; font-size: 13px; color: var(--primary); 
           line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        
        /* Status Tag (Pill) */
        .status-tag { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; flex-shrink: 0; }
        .s-Pending { background: rgba(251, 191, 36, 0.1); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }
        .s-Viewed { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
        .s-Shortlisted { background: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .s-Rejected { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        
        /* Metrics Row */
        .metrics-row { 
            display: flex; align-items: center; gap: 16px; 
            padding-bottom: 16px; border-bottom: 1px dashed var(--border); margin-bottom: 16px; 
        }
        .metric { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--text-main); }
        .metric svg { color: var(--text-sub); }
        
        /* Skills */
        .skills-wrap { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; flex: 1; align-content: flex-start; }
        .skill-bdg { background: var(--bg-input); border: 1px solid var(--border); color: var(--text-sub); font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
        
        /* Actions at Bottom */
        .card-actions { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin-top: auto; }
        
        .btn-view { 
            width: 100%; background: var(--text-main); color: var(--bg-root); 
            border: none; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 700; 
            cursor: pointer; transition: 0.2s; display: flex; justify-content: center; align-items: center;
        }
        .btn-view:hover { background: var(--primary); color: #000; }
        
        .btn-icon { 
            width: 42px; height: 100%; display: flex; align-items: center; justify-content: center; 
            border: 1px solid var(--border); background: var(--bg-input); border-radius: 8px; 
            cursor: pointer; color: var(--text-main); transition: 0.2s; 
        }
        .btn-icon:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-dim); }
        
        /* --- SELECTION BUTTONS (Preserved Style) --- */
        .actions-bar { display: flex; align-items: center; gap: 12px; }
        
        /* Deselect/Select All - Dark Button */
        .btn-select-all { 
          display: flex; align-items: center; gap: 8px; 
          background: #111; /* Dark BG */
          border: 1px solid #333; /* Dark Border */
          color: #fff; /* White Text */
          padding: 8px 16px; border-radius: 8px; 
          font-size: 13px; cursor: pointer; font-weight: 600; 
        }
        .btn-select-all:hover { border-color: var(--primary); }
        /* Orange/Gold Check Icon styling is handled by SVG prop within the button */

        /* Download - Green Button */
        .btn-download { 
          display: flex; align-items: center; gap: 8px; 
          background: #10b981; /* Green BG */
          color: white; 
          border: none; padding: 8px 16px; border-radius: 8px; 
          font-size: 13px; font-weight: 700; cursor: pointer; 
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); 
        }
        .btn-download:hover { background: #059669; }

        /* Selection Checkbox (Absolute Top-Right) */
        .checkbox-overlay { position: absolute; top: 16px; right: 16px; z-index: 10; cursor: pointer; }
        .checkbox-box { width: 22px; height: 22px; border-radius: 6px; border: 2px solid var(--border); background: var(--bg-card); display: flex; align-items: center; justify-content: center; color: transparent; transition: 0.2s; }
        .app-card.selected .checkbox-box { background: var(--primary); border-color: var(--primary); color: white; }
        .app-card:hover .checkbox-box { border-color: var(--primary); }

        .empty-view { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-sub); text-align: center; }
        .empty-icon { width: 80px; height: 80px; background: var(--bg-input); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: var(--text-sub); border: 1px solid var(--border); }
        
        .mobile-back-btn { display: none; align-items: center; gap: 8px; background: none; border: none; font-weight: 600; color: var(--primary); margin-bottom: 12px; cursor: pointer; }
        
        /* Pagination Controls Styles */
        .pagination-container {
          display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 40px; padding-bottom: 20px;
        }
        .page-btn {
          width: 40px; height: 40px; border-radius: 10px;
          border: 1px solid var(--border); background: var(--bg-card);
          color: var(--text-main); font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.3s;
        }
        .page-btn:hover:not(:disabled) {
          border-color: var(--primary); color: var(--primary); transform: translateY(-2px);
        }
        .page-btn.active {
          background: var(--primary); color: #000; border-color: var(--primary);
        }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .page-info { font-size: 14px; color: var(--text-sub); font-weight: 600; }

        @media (max-width: 1024px) {
          .designer-container { border-radius: 0; border: none; }
          .dark-apps-wrapper { padding: 0; }
          .sidebar { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; transform: translateX(0); background: var(--bg-root); }
          .sidebar.hidden { transform: translateX(-100%); }
          .main-panel { width: 100%; }
          .mobile-back-btn { display: flex; }
          .grid-layout { grid-template-columns: 1fr; }
          .panel-header { flex-direction: column; align-items: flex-start; }
          .actions-bar { margin-left: 0; width: 100%; justify-content: space-between; margin-top: 10px; }
          .filter-tabs { width: 100%; overflow-x: auto; }
          .tab-btn { white-space: nowrap; flex: 1; text-align: center; }
          .controls-row { flex-direction: column; align-items: flex-start; gap: 10px; }
        }
      `}</style>

      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="designer-container">
        
        {/* --- SIDEBAR --- */}
        <div className={`sidebar ${(!showSidebar && isMobile) ? 'hidden' : ''}`}>
          <div className="sidebar-header">
            <h2>
              Job Postings
              <span className="badge-count">{jobs.length}</span>
            </h2>
          </div>
          <div className="job-list">
            {jobs.map(job => (
              <div 
                key={job._id} 
                className={`job-card ${selectedJob?._id === job._id ? 'active' : ''}`}
                onClick={() => handleJobSelect(job)}
              >
                <div className="job-card-title">{job.title}</div>
                <div className="job-card-meta">
                  <span className="app-count-tag">
                    <User size={12}/> {job.detailedApplicants?.length || 0}
                  </span>
                  <span>•</span>
                  <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="main-panel">
          {selectedJob ? (
            <>
              <div className="panel-header">
                <div style={{width: '100%'}}>
                  <div className="header-left" style={{marginBottom: 16}}>
                    {isMobile && (
                      <button className="mobile-back-btn" onClick={() => setShowSidebar(true)}>
                        <ArrowLeft size={18}/> Back to Jobs
                      </button>
                    )}
                    <h1>{selectedJob.title}</h1>
                    <div className="header-sub">
                      <span><Briefcase size={14}/> {selectedJob.department}</span>
                      <span><MapPin size={14}/> {selectedJob.location || "Remote"}</span>
                      <span><Clock size={14}/> {selectedJob.workType || "Full-Time"}</span>
                    </div>
                  </div>
                  
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16}}>
                    <div className="filter-tabs">
                      {['All', 'Pending', 'Viewed', 'Shortlisted', 'Rejected'].map(status => (
                        <button 
                          key={status}
                          className={`tab-btn ${statusFilter === status ? 'active' : ''}`}
                          onClick={() => handleStatusFilterChange(status)}
                        >
                          {status}
                        </button>
                      ))}
                    </div>

                    {/* SELECTION ACTIONS */}
                    <div className="actions-bar">
                      <button className="btn-select-all" onClick={handleSelectAll}>
                        {/* Orange Checkbox Icon for Select All button */}
                        {selectedIds.length === filteredApplicants.length && filteredApplicants.length > 0 ? (
                           <CheckSquare size={16} color="#fbbf24"/> 
                        ) : (
                           <Square size={16} color="#fbbf24"/>
                        )}
                        {selectedIds.length === filteredApplicants.length ? 'Deselect All' : 'Select All'}
                      </button>
                      
                      {selectedIds.length > 0 && (
                        <button className="btn-download" onClick={downloadExcel}>
                          <Download size={16}/> Download Report ({selectedIds.length})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="applicants-container" id="apps-grid-top">
                {/* --- PAGINATION & COUNT INFO ROW --- */}
                {!loadingApps && filteredApplicants.length > 0 && (
                  <div className="controls-row">
                     <span className="results-text">
                        Showing <b>{currentApplicants.length}</b> of <b>{filteredApplicants.length}</b> Applicants
                     </span>
                     <select 
                        value={itemsPerPage} 
                        onChange={handleItemsPerPageChange}
                        className="per-page-select"
                     >
                        <option value={6}>6 per page</option>
                        <option value={12}>12 per page</option>
                        <option value={24}>24 per page</option>
                        <option value={48}>48 per page</option>
                     </select>
                  </div>
                )}

                {loadingApps ? (
                  <div className="empty-view">
                     <div className="spinner" style={{border:'3px solid var(--border)', borderTopColor:'var(--primary)', borderRadius:'50%', width:40, height:40, animation:'spin 1s linear infinite'}}></div>
                     <p style={{marginTop:20}}>Loading Applicants...</p>
                     <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : filteredApplicants.length > 0 ? (
                  <>
                    <div className="grid-layout">
                        {currentApplicants.map(app => {
                        const isSelected = selectedIds.includes(app._id);
                        return (
                            <div 
                              key={app._id} 
                              className={`app-card ${isSelected ? 'selected' : ''}`} 
                              onClick={() => viewDetails(app)}
                            >
                            
                            {/* SELECTION CHECKBOX (Absolute Top-Right) */}
                            <div className="checkbox-overlay" onClick={(e) => handleSelectOne(e, app._id)}>
                                <div className="checkbox-box">
                                {isSelected && <CheckSquare size={16} />}
                                </div>
                            </div>

                            {/* --- HEADER (Avatar + Name + Status) --- */}
                            <div className="app-header">
                                <div className="avatar-box">
                                    {app.user.photoUrl ? (
                                      <img src={getAvatarUrl(app.user.photoUrl)} alt="" onError={(e) => e.target.style.display='none'}/>
                                    ) : (
                                      app.user.name?.[0]?.toUpperCase()
                                    )}
                                </div>
                                
                                <div className="header-info">
                                   <div className="name-row">
                                      <h3>{app.user.name}</h3>
                                      <div className={`status-tag s-${app.status}`}>
                                        {app.status === 'Shortlisted' && <CheckCircle size={10}/>}
                                        {app.status === 'Rejected' && <XCircle size={10}/>}
                                        {app.status === 'Pending' && <Clock size={10}/>}
                                        {app.status === 'Viewed' && <Eye size={10}/>}
                                        {app.status}
                                      </div>
                                   </div>
                                   <p className="headline-text">{app.headline || "Seeking Opportunities"}</p>
                                </div>
                            </div>

                            {/* --- METRICS --- */}
                            <div className="metrics-row">
                                <div className="metric">
                                  <Briefcase size={14}/> {app.experience || 0} Yrs Exp
                                </div>
                                <div className="metric">
                                  <Building2 size={14}/> {app.lastCompany || "N/A"}
                                </div>
                            </div>

                            {/* --- SKILLS --- */}
                            <div className="skills-wrap">
                                {app.skills && app.skills.length > 0 ? (
                                <>
                                    {app.skills.slice(0, 3).map((s, i) => (
                                    <span key={i} className="skill-bdg">{s}</span>
                                    ))}
                                    {app.skills.length > 3 && <span className="skill-bdg">+{app.skills.length - 3}</span>}
                                </>
                                ) : (
                                <span className="skill-bdg" style={{background:'transparent', border:'none', fontStyle:'italic'}}>No skills listed</span>
                                )}
                            </div>

                            {/* --- ACTIONS --- */}
                            <div className="card-actions">
                                <button className="btn-view">View Profile</button>
                                
                                {/* Message Button */}
                                <button 
                                    className="btn-icon" 
                                    onClick={(e) => { e.stopPropagation(); startChat(app.user._id); }} 
                                    title={currentPlan === 'pro' ? "Message Candidate" : "Upgrade to Unlock"}
                                >
                                {currentPlan === 'pro' ? <MessageSquare size={18}/> : <Lock size={16} />}
                                </button>
                            </div>
                          </div>
                        );
                        })}
                    </div>

                    {/* PAGINATION CONTROLS */}
                    {totalPages > 1 && (
                        <div className="pagination-container">
                        <button className="page-btn" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                            <ChevronLeft size={20}/>
                        </button>
                        {[...Array(totalPages)].map((_, idx) => (
                            <button 
                            key={idx} 
                            className={`page-btn ${currentPage === idx + 1 ? 'active' : ''}`} 
                            onClick={() => paginate(idx + 1)}
                            >
                            {idx + 1}
                            </button>
                        ))}
                        <button className="page-btn" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                            <ChevronRight size={20}/>
                        </button>
                        <span className="page-info">Page {currentPage} of {totalPages}</span>
                        </div>
                    )}
                  </>
                ) : (
                  <div className="empty-view">
                    <div className="empty-icon"><Filter size={32}/></div>
                    <h3>No applicants found</h3>
                    <p>Try changing the filter status</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-view">
               <div className="empty-icon"><Briefcase size={32}/></div>
               <h3>Select a Job Post</h3>
               <p>Choose a job from the sidebar to manage applications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerApplications;