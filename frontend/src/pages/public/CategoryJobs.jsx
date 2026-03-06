import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import useAuthStore from "../../context/useAuthStore"; // 1. Import Auth Store
import { 
  ArrowLeft, MapPin, Clock, Briefcase, 
  Building2, ChevronRight, Search, 
  ChevronLeft, 
} from "lucide-react";

const CategoryJobs = () => {
  const { categoryName } = useParams(); // Get category from URL
  const navigate = useNavigate();
  
  // 2. Access User State from Store
  const { user } = useAuthStore();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const decodedCategory = decodeURIComponent(categoryName);

  // --- FILTER & SEARCH STATE ---
  const [searchTerm, setSearchTerm] = useState("");

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  useEffect(() => {
    const fetchJobsByCategory = async () => {
      try {
        setLoading(true);
        // Using the existing getJobs controller which accepts 'department' query
        const { data } = await api.get(`/jobs?department=${decodedCategory}`);
        setJobs(data);
      } catch (err) {
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (categoryName) fetchJobsByCategory();
  }, [categoryName, decodedCategory]);

  const getLogoUrl = (path) => {
    if (!path) return null;
    const cleanPath = path.replace(/\\/g, "/");
    if (cleanPath.startsWith("http")) return cleanPath;
    return `http://localhost:5000/${cleanPath}`;
  };

  // 3. New Handler for Job Clicks
  const handleJobClick = (jobId) => {
    const currentUser = user?.user; // Access the user object inside the store data
    const isSeeker = currentUser?.role === "seeker"; // Check role

    if (isSeeker) {
      navigate(`/job/${jobId}`);
    } else {
      // Redirect to auth if not logged in or not a seeker
      navigate("/auth/seeker");
    }
  };

  // --- FILTER LOGIC ---
  const filteredJobs = jobs.filter((job) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    const title = job.title?.toLowerCase() || "";
    const company = job.companyId?.name?.toLowerCase() || "";
    return title.includes(lowerTerm) || company.includes(lowerTerm);
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

  return (
    <div className="dark-category-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

        /* --- PAGE WRAPPER --- */
        .dark-category-wrapper {
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
          width: 100%; max-width: 1000px;
          background: var(--bg-card); /* 🔥 Theme Var */
          backdrop-filter: blur(12px);
          border: 1px solid var(--border); /* 🔥 Theme Var */
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          z-index: 5;
          min-height: 80vh;
        }

        /* Top Accent Strip */
        .designer-container::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #4f46e5 0%, var(--primary) 100%);
        }

        .content-area {
          padding: 40px;
          flex: 1;
        }

        /* Header */
        .page-header {
          margin-bottom: 30px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
        }
        
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-sub);
          font-weight: 600;
          font-size: 14px;
          background: none;
          border: 1px solid var(--border);
          padding: 8px 16px; border-radius: 50px;
          cursor: pointer;
          margin-bottom: 20px;
          transition: 0.2s;
        }
        .back-btn:hover { 
          color: var(--text-main); 
          background: var(--bg-input); 
          border-color: var(--text-main); 
        }

        .header-content h1 {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 700;
          color: var(--text-main); /* 🔥 Theme Var */
          margin: 0 0 8px 0;
        }
        .header-content p {
          color: var(--text-sub);
          font-size: 16px;
        }

        /* CONTROLS ROW */
        .controls-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
        }

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

        .results-text { font-size: 13px; color: var(--text-sub); }

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

        /* Job List */
        .job-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .job-card {
          background: var(--bg-card); /* 🔥 Theme Var */
          border: 1px solid var(--border); /* 🔥 Theme Var */
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }

        .job-card:hover {
          border-color: var(--primary);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.15);
          transform: translateY(-2px);
        }

        .job-left {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          flex: 1;
        }

        .logo-box {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          border: 1px solid var(--border);
          padding: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff; /* Keep logo bg white */
          flex-shrink: 0;
        }
        .logo-box img { width: 100%; height: 100%; object-fit: contain; }

        .job-info { flex: 1; }
        .job-info h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-main); /* 🔥 Theme Var */
          margin: 0 0 8px 0;
        }

        .meta-row {
          display: flex;
          gap: 12px;
          color: var(--text-sub);
          font-size: 13px;
          font-weight: 500;
          flex-wrap: wrap;
        }
        .meta-item { 
          display: flex; align-items: center; gap: 6px; 
          background: var(--bg-input); /* 🔥 Theme Var */
          padding: 4px 10px; border-radius: 6px; 
          border: 1px solid var(--border); 
        }

        .job-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          margin-left: 20px;
        }

        .salary-tag {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          border: 1px solid rgba(16, 185, 129, 0.2);
          white-space: nowrap;
        }

        .view-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--bg-input); /* 🔥 Theme Var */
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-sub);
          transition: 0.2s;
        }
        .job-card:hover .view-btn {
          background: var(--primary);
          color: #000;
          border-color: var(--primary);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 80px 0;
          color: var(--text-sub);
          background: var(--bg-card);
          border-radius: 16px;
          border: 1px dashed var(--border);
        }
        .empty-icon {
          width: 80px; height: 80px; 
          background: var(--bg-input); 
          border: 1px solid var(--border);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px; color: var(--primary);
        }

        .loading-spinner {
          width: 40px; height: 40px; border: 3px solid var(--border); 
          border-top-color: var(--primary); border-radius: 50%; 
          animation: spin 1s linear infinite; margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* PAGINATION STYLES */
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

        @media (max-width: 768px) {
          .designer-container { border-radius: 0; border: none; }
          .dark-category-wrapper { padding: 0; }
          .job-card { flex-direction: column; align-items: flex-start; gap: 20px; }
          .job-left { width: 100%; }
          .job-right { width: 100%; flex-direction: row; justify-content: space-between; align-items: center; margin-left: 0; padding-top: 15px; border-top: 1px dashed var(--border); }
          .controls-row { flex-direction: column; align-items: flex-start; }
          .search-box { width: 100%; }
          .right-controls { width: 100%; justify-content: space-between; margin-top: 10px; }
        }
      `}</style>

      {/* Background Elements */}
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="designer-container">
        
        <div className="content-area">
          <div className="page-header">
            <button className="back-btn" onClick={() => navigate("/categories")}>
              <ArrowLeft size={16}/> Back to Categories
            </button>
            <div className="header-content">
              <h1>{decodedCategory} Jobs</h1>
              <p>Browse open opportunities in {decodedCategory}.</p>
            </div>
          </div>

          {/* CONTROLS ROW */}
          {!loading && jobs.length > 0 && (
            <div className="controls-row">
               <div className="search-box">
                  <Search size={16} color="var(--text-sub)"/>
                  <input 
                    type="text" 
                    placeholder="Search by title or company..." 
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

          {loading ? (
            <div style={{textAlign:'center', padding: 60, color: 'var(--text-sub)'}}>
              <div className="loading-spinner"></div>
              <p style={{marginTop: 20}}>Loading opportunities...</p>
            </div>
          ) : filteredJobs.length > 0 ? (
            <>
              <div className="job-list">
                {currentJobs.map(job => (
                  <div 
                    key={job._id} 
                    className="job-card" 
                    onClick={() => handleJobClick(job._id)} /* 4. Updated Click Event */
                  >
                    
                    <div className="job-left">
                      <div className="logo-box">
                        {job.companyId?.logo ? (
                          <img src={getLogoUrl(job.companyId.logo)} alt="logo" />
                        ) : (
                          <Building2 size={28} color="var(--text-sub)"/>
                        )}
                      </div>
                      <div className="job-info">
                        <h3>{job.title}</h3>
                        <div className="meta-row">
                          <span className="meta-item"><Building2 size={12}/> {job.companyId?.name || "Confidential"}</span>
                          <span className="meta-item"><MapPin size={12}/> {job.location || "Remote"}</span>
                          <span className="meta-item"><Briefcase size={12}/> {job.workType}</span>
                          <span className="meta-item"><Clock size={12}/> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="job-right">
                      <span className="salary-tag">
                        {job.salary > 0 ? `₹${(job.salary/1000).toFixed(0)}k/mo` : "Voluntary"}
                      </span>
                      <div className="view-btn">
                        <ChevronRight size={20}/>
                      </div>
                    </div>

                  </div>
                ))}
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
            <div className="empty-state">
              <div className="empty-icon"><Search size={32}/></div>
              <h3>No jobs found</h3>
              <p>Try adjusting your search or explore other categories.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CategoryJobs;