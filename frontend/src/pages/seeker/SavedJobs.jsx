import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api"; 
import { 
  Bookmark, MapPin, Building2, 
  ArrowRight, Trash2,
  Briefcase, Sparkles, Search,
  ChevronLeft, ChevronRight
} from "lucide-react";

// --- DEFAULT LOGO ---
const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/4091/4091968.png";

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- FILTER & SEARCH STATE ---
  const [searchTerm, setSearchTerm] = useState("");

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/jobs/saved");
      setSavedJobs(data);
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  // --- FILTER LOGIC ---
  const filteredJobs = savedJobs.filter((job) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    const title = job.title?.toLowerCase() || "";
    // Check employer/company name safely
    const companyName = (job.employer?.name || job.companyId?.name || "").toLowerCase();
    return title.includes(lowerTerm) || companyName.includes(lowerTerm);
  });

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleRemove = async (jobId, e) => {
    e.stopPropagation();
    const previousJobs = [...savedJobs];
    setSavedJobs(prev => prev.filter(job => job._id !== jobId));
    
    try {
      await api.post(`/jobs/save/${jobId}`); 
    } catch (error) {
      alert("Failed to remove job.");
      setSavedJobs(previousJobs); 
    }
  };

  const formatSalary = (salary) => {
    if (!salary) return "Not Disclosed";
    return `₹${salary.toLocaleString()}`;
  };

  // --- HELPER: URL PARSER ---
  const getLogoUrl = (url) => {
    if (!url || url.trim() === "") return DEFAULT_LOGO;
    if (url.startsWith("blob:") || url.startsWith("data:")) return url;
    if (url.startsWith("http")) return url;

    // Clean Relative Paths
    let cleanPath = url.replace(/\\/g, "/");
    if (cleanPath.startsWith("/")) cleanPath = cleanPath.substring(1);
    return `http://localhost:5000/${cleanPath}`;
  };

  return (
    <div className="dark-saved-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        /* --- PAGE WRAPPER --- */
        .dark-saved-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root); /* 🔥 Theme Var */
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          padding: 40px 20px;
          color: var(--text-main); /* 🔥 Theme Var */
          display: flex; justify-content: center;
          transition: background-color 0.3s ease;
        }

        /* --- BACKGROUND FX --- */
        .bg-blob {
          position: absolute; border-radius: 50%; filter: blur(120px);
          opacity: 0.15; z-index: 0; pointer-events: none;
        }
        .b1 { top: -10%; left: -10%; width: 600px; height: 600px; background: #4f46e5; }
        .b2 { bottom: -10%; right: -10%; width: 500px; height: 500px; background: var(--primary); }

        /* --- CONTAINER --- */
        .content-container {
          width: 100%; max-width: 1280px;
          position: relative; z-index: 5;
          display: flex; flex-direction: column;
        }

        /* --- HEADER --- */
        .header-section {
          margin-bottom: 20px;
          display: flex; justify-content: space-between; align-items: flex-end;
          flex-wrap: wrap; gap: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border); /* 🔥 Theme Var */
        }
        
        .header-titles h1 {
          font-family: 'Playfair Display', serif; font-size: 2.5rem;
          font-weight: 700; color: var(--text-main); /* 🔥 Theme Var */
          margin: 0 0 5px 0;
          display: flex; align-items: center; gap: 12px;
        }
        .header-titles p { color: var(--text-sub); font-size: 1rem; }

        .count-badge {
          background: var(--bg-input); /* 🔥 Theme Var */
          border: 1px solid var(--border);
          padding: 8px 16px; border-radius: 30px;
          font-size: 13px; font-weight: 600; color: var(--primary);
          display: flex; align-items: center; gap: 8px;
        }

        /* --- CONTROLS ROW (Search + Pagination) --- */
        .controls-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
        }

        /* Search Box Style */
        .search-box {
          display: flex; align-items: center;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 8px 16px;
          width: 300px;
          transition: all 0.2s;
        }
        .search-box:focus-within {
          border-color: var(--primary);
          background: var(--bg-card);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .search-box input {
          background: transparent; border: none; outline: none;
          color: var(--text-main); font-size: 14px; width: 100%;
          margin-left: 8px;
        }
        .search-box input::placeholder { color: var(--text-sub); }

        .right-controls {
          display: flex; align-items: center; gap: 16px;
        }

        .per-page-select {
          background: var(--bg-input);
          color: var(--text-sub);
          border: 1px solid var(--border);
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }
        .per-page-select:hover {
          border-color: var(--primary);
          color: var(--text-main);
        }
        .results-text {
          font-size: 13px;
          color: var(--text-sub);
        }

        /* --- GRID LAYOUT --- */
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
          gap: 20px; padding-bottom: 40px;
        }

        /* --- CARD DESIGN --- */
        .job-card {
          background: var(--bg-card); /* 🔥 Theme Var */
          border: 1px solid var(--border); /* 🔥 Theme Var */
          border-radius: 16px; padding: 24px;
          position: relative; transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          display: flex; flex-direction: column; gap: 20px;
          overflow: hidden;
        }

        .job-card:hover {
          transform: translateY(-5px);
          border-color: var(--primary);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        /* Header: Logo & Info */
        .card-top {
          display: flex; align-items: flex-start; gap: 16px;
        }

        .logo-box {
          width: 54px; height: 54px; border-radius: 12px;
          background: #fff; /* Logo bg remains white */
          display: flex; align-items: center; justify-content: center;
          color: var(--bg-root); font-size: 20px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          overflow: hidden; flex-shrink: 0; padding: 4px;
          border: 1px solid var(--border);
        }
        .logo-box img { width: 100%; height: 100%; object-fit: contain; }

        .job-info { flex: 1; min-width: 0; }
        .job-info h3 {
          font-size: 1.1rem; font-weight: 700; color: var(--text-main); /* 🔥 Theme Var */
          margin: 0 0 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        
        .company-row {
          font-size: 0.85rem; color: var(--primary); 
          font-weight: 600; display: flex; align-items: center; gap: 6px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .company-row span { color: var(--text-sub); }

        /* Meta Tags */
        .tags-container {
          display: flex; flex-wrap: wrap; gap: 10px;
        }

        .pill {
          padding: 6px 12px; border-radius: 8px; font-size: 0.75rem;
          font-weight: 600; display: flex; align-items: center; gap: 6px;
          background: var(--bg-input); /* 🔥 Theme Var */
          border: 1px solid var(--border);
          color: var(--text-sub);
        }

        .pill.salary { color: #4ade80; background: rgba(74, 222, 128, 0.1); border-color: rgba(74, 222, 128, 0.2); }
        /* Keep generic styles for others, or add specific colors if needed */
        .pill.type { color: #6366f1; } 
        .pill.loc { color: var(--text-main); }

        /* Actions */
        .action-row {
          display: flex; gap: 12px; padding-top: 20px;
          border-top: 1px solid var(--border);
          margin-top: auto;
        }

        .btn-view {
          flex: 1;
          background: var(--text-main); /* Inverted text color for contrast */
          color: var(--bg-root);
          border: none; padding: 12px; border-radius: 12px;
          font-weight: 700; font-size: 0.9rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s;
        }
        .btn-view:hover { background: var(--primary); color: #000; }

        .btn-delete {
          width: 48px; border: 1px solid var(--border);
          background: var(--bg-input); /* 🔥 Theme Var */
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-sub); cursor: pointer; transition: all 0.2s;
        }
        .btn-delete:hover {
          border-color: var(--danger); color: var(--danger);
          background: rgba(239, 68, 68, 0.1);
        }

        /* --- EMPTY STATE --- */
        .empty-state {
          text-align: center; padding: 80px 20px;
          background: var(--bg-card); /* 🔥 Theme Var */
          border-radius: 24px;
          border: 1px dashed var(--border);
          grid-column: 1 / -1;
        }
        .empty-icon-wrap {
          background: var(--bg-input); width: 80px; height: 80px; 
          border-radius: 50%; display: flex; align-items: center; justify-content: center; 
          margin: 0 auto 24px; border: 1px solid var(--border);
        }
        .empty-state h2 { font-size: 1.5rem; color: var(--text-main); margin-bottom: 8px; }
        .empty-state p { color: var(--text-sub); margin-bottom: 24px; max-width: 400px; margin-left: auto; margin-right: auto; }
        
        .btn-browse {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: #fff; border: none; padding: 14px 32px;
          border-radius: 50px; font-weight: 700; cursor: pointer;
          transition: transform 0.2s; display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-browse:hover { transform: scale(1.05); }

        /* --- SPINNER --- */
        .loading-container {
          display: flex; justify-content: center; padding-top: 100px;
        }
        .spinner { 
          width: 40px; height: 40px; border: 3px solid var(--border); 
          border-top: 3px solid var(--primary); border-radius: 50%; 
          animation: spin 1s linear infinite; margin: 0 auto; 
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* --- PAGINATION STYLES --- */
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
        .page-btn:disabled {
          opacity: 0.4; cursor: not-allowed;
        }
        .page-info { font-size: 14px; color: var(--text-sub); font-weight: 600; }

        /* --- RESPONSIVE --- */
        @media (max-width: 640px) {
          .dark-saved-wrapper { padding: 20px; }
          .jobs-grid { grid-template-columns: 1fr; }
          .header-section { flex-direction: column; align-items: flex-start; gap: 15px; }
          .header-titles h1 { font-size: 2rem; }
          .controls-row { flex-direction: column; align-items: flex-start; }
          .search-box { width: 100%; }
          .right-controls { width: 100%; justify-content: space-between; }
        }
      `}</style>

      {/* Background Ambience */}
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="content-container">
        
        {/* Header */}
        <div className="header-section">
          <div className="header-titles">
            <h1><Bookmark fill="var(--primary)" color="var(--primary)" /> Saved Jobs</h1>
            <p>Keep track of opportunities you love. Apply when you're ready.</p>
          </div>
          {!loading && savedJobs.length > 0 && (
             <div className="count-badge">
                <Sparkles size={16} />
                {savedJobs.length} Items Saved
             </div>
          )}
        </div>

        {/* CONTROLS ROW */}
        {!loading && savedJobs.length > 0 && (
          <div className="controls-row">
             {/* SEARCH BAR */}
             <div className="search-box">
                <Search size={16} color="var(--text-sub)"/>
                <input 
                  type="text" 
                  placeholder="Search role or company..." 
                  value={searchTerm}
                  onChange={handleSearch}
                />
             </div>

             <div className="right-controls">
                <span className="results-text">
                  Showing <b>{currentJobs.length}</b> of <b>{filteredJobs.length}</b>
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
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : filteredJobs.length > 0 ? (
          <>
            <div className="jobs-grid">
              {currentJobs.map((job) => {
                const companyData = job.companyId || {};
                const employerData = job.employer || {};
                const rawLogo = companyData.logo || employerData.logoUrl || job.employer?.logoUrl;
                const logoUrl = getLogoUrl(rawLogo);

                return (
                  <div key={job._id} className="job-card">
                    
                    {/* 1. Header Row */}
                    <div className="card-top">
                      <div className="logo-box">
                        <img src={logoUrl} alt="logo" />
                      </div>
                      <div className="job-info">
                        <h3 title={job.title}>
                          {job.title.length > 25 ? job.title.substring(0, 25) + "..." : job.title}
                        </h3>
                        <div className="company-row">
                          {job.employer?.name || "Confidential"} 
                          <span>•</span>
                            {job.locations && job.locations.length > 0
                          ? job.locations.join(", ")
                          : "Remote"}
                        </div>
                      </div>
                    </div>

                    {/* 2. Metadata Pills */}
                    <div className="tags-container">
                      <div className="pill salary">
                       {formatSalary(job.salary)}
                      </div>
                      <div className="pill type">
                        <Briefcase size={12} /> {job.workType}
                      </div>
                      <div className="pill loc">
                        <MapPin size={12} /> {job.workMode}
                      </div>
                    </div>

                    {/* 3. Action Buttons */}
                    <div className="action-row">
                      <button 
                        className="btn-view"
                        onClick={() => navigate(`/find-jobs?title=${job.title}`)}
                      >
                        View & Apply <ArrowRight size={16} />
                      </button>
                      
                      <button 
                        className="btn-delete"
                        onClick={(e) => handleRemove(job._id, e)}
                        title="Remove from Saved"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <button 
                  className="page-btn" 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1}
                >
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
                
                <button 
                  className="page-btn" 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={20}/>
                </button>
                
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <Search size={32} color="var(--primary)" />
            </div>
            <h2>No jobs found</h2>
            <p>
              Try adjusting your search criteria or browse more jobs.
            </p>
            <button className="btn-browse" onClick={() => navigate("/find-jobs")}>
              Explore Jobs <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;