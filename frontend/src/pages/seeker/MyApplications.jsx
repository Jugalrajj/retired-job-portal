import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Building2,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- FILTER & SEARCH STATE ---
  const [searchTerm, setSearchTerm] = useState("");

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/jobs/applied");
        setApplications(data);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  // --- FILTER LOGIC ---
  const filteredApplications = applications.filter((app) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    const title = app.title?.toLowerCase() || "";
    const company = app.companyName?.toLowerCase() || "";
    return title.includes(lowerTerm) || company.includes(lowerTerm);
  });

  // --- PAGINATION LOGIC (Based on Filtered Data) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentApplications = filteredApplications.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // --- HELPER: Status Styles (Theme Adapted) ---
  const getStatusStyle = (statusStr) => {
    const status = statusStr?.toLowerCase() || "pending";

    switch (status) {
      case "accepted":
      case "shortlisted":
        return {
          bg: "rgba(16, 185, 129, 0.15)", // Green Tint
          text: "#34d399",
          border: "rgba(16, 185, 129, 0.3)",
          icon: <CheckCircle size={14} />,
          label: statusStr,
        };

      case "rejected":
        return {
          bg: "rgba(239, 68, 68, 0.15)", // Red Tint
          text: "#f87171",
          border: "rgba(239, 68, 68, 0.3)",
          icon: <XCircle size={14} />,
          label: statusStr,
        };

      case "viewed":
        return {
          bg: "rgba(59, 130, 246, 0.15)", // Blue Tint
          text: "#60a5fa",
          border: "rgba(59, 130, 246, 0.3)",
          icon: <Eye size={14} />,
          label: "Viewed",
        };

      case "reviewed":
      case "interviewing":
        return {
          bg: "var(--primary-dim)", // Theme Primary Tint
          text: "var(--primary)",
          border: "var(--primary)",
          icon: <Clock size={14} />,
          label: statusStr,
        };

      default:
        return {
          bg: "var(--bg-input)", // Adaptive Gray
          text: "var(--text-sub)",
          border: "var(--border)",
          icon: <Clock size={14} />,
          label: "Pending",
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recent";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `http://localhost:5000/${url.replace(/\\/g, "/")}`;
  };

  return (
    <div className="dark-app-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        /* --- PAGE WRAPPER --- */
        .dark-app-wrapper {
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
        }
        .header-titles p { color: var(--text-sub); font-size: 1rem; }

        .stat-card {
          background: var(--bg-input); /* 🔥 Theme Var */
          border: 1px solid var(--border);
          padding: 10px 20px; border-radius: 12px;
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
        .apps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
          gap: 20px; padding-bottom: 40px;
        }

        /* --- CARD DESIGN --- */
        .app-card {
          background: var(--bg-card); /* 🔥 Theme Var */
          border: 1px solid var(--border); /* 🔥 Theme Var */
          border-radius: 16px; padding: 24px;
          position: relative; transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          display: flex; flex-direction: column; gap: 16px;
          overflow: hidden;
        }

        .app-card:hover {
          transform: translateY(-5px);
          border-color: var(--primary);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15);
        }

        /* Header: Logo & Badge */
        .card-header {
          display: flex; justify-content: space-between; align-items: flex-start;
        }

        .logo-box {
          width: 48px; height: 48px; border-radius: 12px;
          background: #fff; /* Logo bg always white */
          display: flex; align-items: center; justify-content: center;
          color: var(--bg-root); font-size: 20px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          overflow: hidden; flex-shrink: 0;
          border: 1px solid var(--border);
        }
        .logo-box img { width: 100%; height: 100%; object-fit: contain; }

        .status-badge {
          font-size: 11px; font-weight: 700; padding: 4px 10px;
          border-radius: 20px; display: flex; align-items: center; gap: 5px;
          text-transform: uppercase; letter-spacing: 0.5px;
          border: 1px solid;
        }

        /* Body Info */
        .card-body h3 {
          font-size: 1.1rem; font-weight: 700; color: var(--text-main); /* 🔥 Theme Var */
          margin: 0 0 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        
        .company-name {
          font-size: 0.85rem; color: var(--primary); 
          font-weight: 600; margin-bottom: 12px; 
          display: flex; align-items: center; gap: 6px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }

        .info-row {
          display: flex; justify-content: space-between;
          font-size: 0.8rem; color: var(--text-sub);
          background: var(--bg-input); /* 🔥 Theme Var */
          padding: 8px 12px;
          border-radius: 8px; border: 1px solid var(--border);
        }
        .info-item { display: flex; align-items: center; gap: 4px; }

        /* Footer Action */
        .card-footer {
          margin-top: auto; display: flex; justify-content: flex-end;
        }

        .action-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--bg-input); /* 🔥 Theme Var */
          color: var(--text-sub);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .action-btn:hover {
          background: var(--primary); color: #000; border-color: var(--primary);
          transform: rotate(-45deg);
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
          margin: 0 auto 20px; border: 1px solid var(--border);
        }
        .empty-state h2 { font-size: 1.5rem; color: var(--text-main); margin-bottom: 8px; }
        .empty-state p { color: var(--text-sub); margin-bottom: 20px; }
        
        .empty-btn {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: #fff; border: none; padding: 12px 28px;
          border-radius: 30px; font-weight: 700; cursor: pointer;
          transition: transform 0.2s;
        }
        .empty-btn:hover { transform: scale(1.05); }

        .spinner { 
          width: 40px; height: 40px; border: 3px solid var(--border); 
          border-top: 3px solid var(--primary); border-radius: 50%; 
          animation: spin 1s linear infinite; margin: 50px auto; 
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* --- PAGINATION STYLING --- */
        .pagination-container {
          display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 20px; padding-bottom: 20px;
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
          .dark-app-wrapper { padding: 20px; }
          .apps-grid { grid-template-columns: 1fr; }
          .header-section { flex-direction: column; align-items: flex-start; gap: 15px; }
          .stat-card { width: 100%; justify-content: center; }
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
            <h1>My Applications</h1>
            <p>You have applied to {applications.length} jobs recently.</p>
          </div>
          {applications.length > 0 && (
            <div className="stat-card">
              <Briefcase size={16} /> Total Applications: {applications.length}
            </div>
          )}
        </div>

        {/* CONTROLS ROW */}
        {!loading && applications.length > 0 && (
          <div className="controls-row">
            {/* SEARCH BAR */}
            <div className="search-box">
              <Search size={16} color="var(--text-sub)" />
              <input
                type="text"
                placeholder="Search role or company..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            <div className="right-controls">
              <span className="results-text">
                Showing <b>{currentApplications.length}</b> of{" "}
                <b>{filteredApplications.length}</b>
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

        {/* Content */}
        {loading ? (
          <div className="spinner"></div>
        ) : filteredApplications.length > 0 ? (
          <>
            <div className="apps-grid">
              {currentApplications.map((app) => {
                const title = app.title || "Unknown Role";
                const company = app.companyName || "Hiring Company";
                const location = app.location || "Remote";
                const rawStatus = app.applicationStatus || app.status;
                const date = app.appliedAt || app.createdAt;
                const logo = app.companyLogo;
                const style = getStatusStyle(rawStatus);

                return (
                  <div key={app._id} className="app-card">
                    {/* Header: Logo & Status */}
                    <div className="card-header">
                      <div className="logo-box">
                        {logo ? (
                          <img src={getLogoUrl(logo)} alt="logo" />
                        ) : (
                          <Building2 size={24} color="#0f172a" />
                        )}
                      </div>

                      <div
                        className="status-badge"
                        style={{
                          background: style.bg,
                          color: style.text,
                          borderColor: style.border,
                        }}
                      >
                        {style.icon}
                        {style.label}
                      </div>
                    </div>

                    {/* Body: Info */}
                    <div className="card-body">
                      <h3>{title}</h3>
                      <div className="company-name">{company}</div>

                      <div className="info-row">
                        <div className="info-item">
                          <MapPin size={12} color="var(--text-sub)" />{" "}
                          {location}
                        </div>
                        <div className="info-item">
                          <Calendar size={12} color="var(--text-sub)" />{" "}
                          {formatDate(date)}
                        </div>
                      </div>
                    </div>

                    {/* Footer: Action */}
                    <div className="card-footer">
                      <button
                        onClick={() => navigate(`/find-jobs?title=${title}`)}
                        className="action-btn"
                        title="View Details"
                      >
                        <ArrowRight size={18} />
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
                  <ChevronLeft size={20} />
                </button>

                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    className={`page-btn ${currentPage === idx + 1 ? "active" : ""}`}
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
                  <ChevronRight size={20} />
                </button>

                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <Search size={32} color="var(--primary)" />
            </div>
            <h2>No applications found</h2>
            <p>Try adjusting your search criteria or browse for more jobs.</p>
            <button
              className="empty-btn"
              onClick={() => navigate("/find-jobs")}
            >
              Browse Jobs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
