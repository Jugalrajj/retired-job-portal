import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  Search, MapPin, Briefcase, Building2, Filter, 
  Globe, ChevronRight, X, Users, Star, ArrowRight, Layout,
  ChevronLeft, ListOrdered
} from "lucide-react";

// Helper for image URLs
const getImageUrl = (path) => {
  if (!path) return null;
  const cleanPath = path.replace(/\\/g, "/");
  if (cleanPath.startsWith("http")) return cleanPath;
  return `http://localhost:5000/${cleanPath}`;
};

const AllCompanies = () => {
  const navigate = useNavigate();
  
  // Base State
  const [allCompanies, setAllCompanies] = useState([]); // Stores raw fetched data
  const [filteredCompanies, setFilteredCompanies] = useState([]); // Stores active filtered data
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter State (EXTENDED with Size and SortBy)
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    industry: "",
    type: "",
    size: "",
    sortBy: "Relevant"
  });

  // Dynamic Filter Options State (EXTENDED)
  const [filterOptions, setFilterOptions] = useState({
    locations: [],
    industries: [],
    companyTypes: [],
    companySizes: [
      "1-10 employees", 
      "11-50 employees", 
      "51-200 employees", 
      "201-500 employees", 
      "501-1000 employees", 
      "1000+ employees"
    ] 
  });

  // 1. Fetch Configuration (Filter Options)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get("/config"); 
        if (res.data) {
          setFilterOptions({
            locations: res.data.locations || [],
            industries: res.data.industries || [],
            companyTypes: res.data.companyTypes || [],
            companySizes: res.data.companySizes || [
              "1-10 employees", "11-50 employees", "51-200 employees", 
              "201-500 employees", "501-1000 employees", "1000+ employees"
            ]
          });
        }
      } catch (err) {
        console.error("Error fetching filter config:", err);
      }
    };
    fetchConfig();
  }, []);

  // 2. Fetch Companies (ONCE on mount)
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        // Fetch all companies from the backend
        const res = await api.get(`/companies`);
        setAllCompanies(res.data);
        setFilteredCompanies(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // 3. Client-Side Filtering & Sorting Logic
  useEffect(() => {
    let result = [...allCompanies];

    // Search Filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(co => 
        co.name?.toLowerCase().includes(q) || 
        co.industry?.toLowerCase().includes(q) ||
        co.description?.toLowerCase().includes(q)
      );
    }

    // Dropdown Filters
    if (filters.location) {
      result = result.filter(co => co.location === filters.location);
    }
    if (filters.industry) {
      result = result.filter(co => co.industry === filters.industry);
    }
    if (filters.type) {
      result = result.filter(co => co.companyType === filters.type);
    }
    if (filters.size) {
      result = result.filter(co => co.companySize === filters.size);
    }

    // Sorting Logic
    if (filters.sortBy === "A-Z") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (filters.sortBy === "Most Jobs") {
      result.sort((a, b) => (b.jobCount || 0) - (a.jobCount || 0));
    }

    setFilteredCompanies(result);
    setCurrentPage(1); // Reset pagination on filter change
  }, [filters, allCompanies]);


  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ search: "", location: "", industry: "", type: "", size: "", sortBy: "Relevant" });
  };

  // Pagination Logic (Now using filteredCompanies)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCompanies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="dark-companies-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        .dark-companies-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root);
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          padding: 40px 20px;
          display: flex; justify-content: center;
          color: var(--text-main);
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .bg-blob {
          position: absolute; border-radius: 50%; filter: blur(120px);
          opacity: 0.15; z-index: 0; pointer-events: none;
        }
        .b1 { top: -10%; left: -10%; width: 600px; height: 600px; background: #4f46e5; }
        .b2 { bottom: -10%; right: -10%; width: 500px; height: 500px; background: var(--primary); }

        .designer-container {
          width: 100%; max-width: 1280px;
          background: var(--bg-card);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          z-index: 5;
          min-height: 85vh;
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        .designer-container::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #4f46e5 0%, var(--primary) 100%);
          z-index: 20;
        }

        .hero-section {
          background: var(--bg-input);
          padding: 60px 20px 100px;
          text-align: center; border-bottom: 1px solid var(--border);
          position: relative;
        }
        
        .hero-content h1 { 
          font-family: 'Playfair Display', serif;
          font-size: 36px; font-weight: 700; margin-bottom: 12px; 
          color: var(--text-main);
        }
        .highlight-text { 
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .hero-content p { font-size: 16px; color: var(--text-sub); max-width: 600px; margin: 0 auto 30px; }

        .search-container {
          max-width: 700px; margin: 0 auto;
          display: flex; gap: 10px; position: relative; z-index: 10;
        }
        .search-input-wrapper {
          flex: 1; background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 12px; padding: 12px 20px; display: flex; align-items: center; gap: 12px;
          backdrop-filter: blur(10px); transition: 0.2s;
        }
        .search-input-wrapper:focus-within { border-color: var(--primary); }
        .search-icon { color: var(--primary); }
        .search-input-wrapper input {
          border: none; outline: none; width: 100%; font-size: 15px; 
          font-weight: 500; color: var(--text-main); background: transparent;
        }
        .search-input-wrapper input::placeholder { color: var(--text-sub); opacity: 0.6; }
        
        .filter-toggle-btn {
          display: none; align-items: center; gap: 8px; background: var(--bg-input);
          color: var(--text-main); border: 1px solid var(--border);
          padding: 0 16px; border-radius: 12px; font-weight: 600; cursor: pointer;
        }

        .content-area {
          padding: 0 40px 60px; margin-top: -40px; position: relative; z-index: 20;
        }

        /* UPDATED FILTER BAR TO WRAP */
        .filter-bar {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 16px; padding: 16px 24px;
          display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
          box-shadow: 0 10px 30px -5px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        
        .filter-item { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 130px; }
        .filter-item label { 
          font-size: 11px; font-weight: 700; color: var(--primary); 
          text-transform: uppercase; display: flex; align-items: center; gap: 5px; 
        }
        .filter-item select {
          border: none; background: transparent; font-size: 14px; font-weight: 600;
          color: var(--text-main); cursor: pointer; outline: none; padding: 0;
          width: 100%;
        }
        .filter-item select option { background: var(--bg-card); color: var(--text-main); }

        .clear-filters-btn {
          margin-left: auto; background: rgba(239, 68, 68, 0.1); color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2); padding: 8px 16px; border-radius: 8px;
          font-weight: 600; font-size: 13px; cursor: pointer;
          display: flex; align-items: center; gap: 6px; transition: 0.2s;
        }

        .results-count {
          margin-bottom: 20px; font-size: 14px; color: var(--text-sub);
          display: flex; align-items: center; gap: 6px; padding-left: 5px;
        }
        .results-count strong { color: var(--text-main); font-size: 16px; }

        .companies-list { display: flex; flex-direction: column; gap: 20px; }

        .company-card {
          background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border);
          padding: 24px; display: flex; align-items: center; gap: 24px;
          transition: all 0.3s ease; cursor: pointer; position: relative; overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        
        .company-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px -5px rgba(0,0,0,0.1);
          border-color: var(--primary);
        }
        
        .card-left { display: flex; align-items: center; gap: 16px; width: 35%; }
        .logo-wrapper {
          width: 64px; height: 64px; border-radius: 12px;
          background: #fff; border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          overflow: hidden; padding: 4px;
        }
        .logo-wrapper img { width: 100%; height: 100%; object-fit: contain; }
        .logo-placeholder { font-size: 24px; font-weight: 800; color: #020617; }
        
        .company-name { 
          font-size: 18px; font-weight: 700; color: var(--text-main); 
          margin: 0 0 6px 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .type-tag { 
          font-size: 10px; background: rgba(251, 191, 36, 0.1); color: var(--primary); 
          padding: 3px 8px; border-radius: 4px; text-transform: uppercase; font-weight: 700; 
          border: 1px solid rgba(251, 191, 36, 0.2);
        }
        .meta-row { font-size: 13px; color: var(--text-sub); display: flex; align-items: center; gap: 8px; font-weight: 500; }

        .card-center { flex: 1; padding: 0 24px; border-left: 1px solid var(--border); }
        .industry-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; color: #34d399;
          background: rgba(16, 185, 129, 0.1); padding: 4px 10px; border-radius: 20px; margin-bottom: 8px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .company-desc { 
          font-size: 13px; color: var(--text-sub); line-height: 1.5; margin: 0; 
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }

        .card-right { 
          display: flex; flex-direction: column; align-items: flex-end; gap: 12px;
          min-width: 130px;
        }
        .job-stat { text-align: right; }
        .job-stat strong { display: block; font-size: 20px; font-weight: 800; color: var(--text-main); line-height: 1; }
        .job-stat span { font-size: 11px; font-weight: 600; color: var(--primary); text-transform: uppercase; }
        
        .visit-btn {
          background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border);
          padding: 10px 18px; border-radius: 10px; font-weight: 600; font-size: 13px;
          display: flex; align-items: center; gap: 6px; cursor: pointer;
          transition: 0.2s;
        }
        .visit-btn:hover { background: var(--primary); color: #000; border-color: var(--primary); }

        /* --- PAGINATION STYLING --- */
        .pagination-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-top: 50px;
        }

        .page-btn {
          width: 45px; height: 45px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-main);
          font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .page-btn:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
          transform: translateY(-2px);
        }

        .page-btn.active {
          background: var(--primary);
          color: #000;
          border-color: var(--primary);
          box-shadow: 0 8px 15px rgba(0,0,0,0.1);
        }

        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 14px; color: var(--text-sub); font-weight: 600;
        }

        .loading-container { text-align: center; padding: 50px; }
        .loader { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .designer-container { border-width: 0; border-radius: 0; height: auto; }
          .dark-companies-wrapper { padding: 0; }
          .hero-section { padding-bottom: 80px; }
          .content-area { padding: 0 20px 40px; }
          .search-container { flex-direction: column; width: 100%; }
          .filter-bar { display: none; }
          .company-card { flex-direction: column; align-items: flex-start; gap: 16px; padding: 20px; }
          .card-left { width: 100%; }
          .card-center { width: 100%; border-left: none; padding: 16px 0; border-top: 1px dashed var(--border); }
          .card-right { width: 100%; flex-direction: row; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid var(--border); }
        }
      `}</style>

      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="designer-container">
        <div className="hero-section">
          <div className="hero-content">
            <h1>Find Your Next <span className="highlight-text">Great Partner</span></h1>
            <p>Connect with top-tier organizations actively seeking experienced professionals.</p>
          </div>
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                name="search"
                placeholder="Search companies by name or keywords..." 
                value={filters.search} 
                onChange={handleFilterChange}
              />
            </div>
            <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={18}/> <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="content-area">
          <div className={`filter-bar ${showFilters ? 'active' : ''}`}>
            <div className="filter-item">
              <label><MapPin size={12}/> Location</label>
              <select name="location" value={filters.location} onChange={handleFilterChange}>
                <option value="">Anywhere</option>
                {filterOptions.locations.map((loc, idx) => (
                  <option key={idx} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <label><Briefcase size={12}/> Industry</label>
              <select name="industry" value={filters.industry} onChange={handleFilterChange}>
                <option value="">All Industries</option>
                {filterOptions.industries.map((ind, idx) => (
                  <option key={idx} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <label><Building2 size={12}/> Type</label>
              <select name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">All Types</option>
                {filterOptions.companyTypes.map((type, idx) => (
                  <option key={idx} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {/* NEW FILTER: Company Size */}
            <div className="filter-item">
              <label><Users size={12}/> Size</label>
              <select name="size" value={filters.size} onChange={handleFilterChange}>
                <option value="">All Sizes</option>
                {filterOptions.companySizes.map((size, idx) => (
                  <option key={idx} value={size}>{size}</option>
                ))}
              </select>
            </div>
            {/* NEW FILTER: Sort By */}
            <div className="filter-item">
              <label><ListOrdered size={12}/> Sort By</label>
              <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                <option value="Relevant">Most Relevant</option>
                <option value="A-Z">A - Z</option>
                <option value="Most Jobs">Most Open Jobs</option>
              </select>
            </div>
            
            {/* EXTENDED Clear Filters Condition */}
            {(filters.search || filters.location || filters.industry || filters.type || filters.size || filters.sortBy !== "Relevant") && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                <X size={14}/> Clear
              </button>
            )}
          </div>

          <div className="results-count">
            <Star size={16} fill="var(--primary)" color="var(--primary)" /> 
            <strong>{filteredCompanies.length}</strong> Companies Found
          </div>

          {loading ? (
            <div className="loading-container"><div className="loader"></div></div>
          ) : currentItems.length > 0 ? (
            <>
              <div className="companies-list">
                {currentItems.map((co) => (
                  <div key={co._id} className="company-card" onClick={() => navigate(`/company/${co._id}`)}>
                    <div className="card-left">
                      <div className="logo-wrapper">
                        {co.logo ? <img src={getImageUrl(co.logo)} alt={co.name} /> : <div className="logo-placeholder">{co.name.charAt(0)}</div>}
                      </div>
                      <div className="company-basic">
                        <h3 className="company-name">{co.name} {co.companyType && <span className="type-tag">{co.companyType}</span>}</h3>
                        <div className="meta-row"><span><MapPin size={12}/> {co.location || "Multiple Locations"}</span><span className="dot">•</span><span><Users size={12}/> {co.companySize || "Mid-Sized"}</span></div>
                      </div>
                    </div>
                    <div className="card-center">
                      <div className="industry-badge"><Briefcase size={12}/> {co.industry || "General"}</div>
                      <p className="company-desc">{co.description ? (co.description.length > 90 ? co.description.substring(0, 90) + "..." : co.description) : "Committed to inclusive workplace."}</p>
                    </div>
                    <div className="card-right">
                      <div className="job-stat"><strong>{co.jobCount || 0}</strong><span>Open Roles</span></div>
                      <button className="visit-btn">Profile <ArrowRight size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION BAR */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <button className="page-btn" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft size={20}/></button>
                  {[...Array(totalPages)].map((_, idx) => (
                    <button key={idx} className={`page-btn ${currentPage === idx + 1 ? 'active' : ''}`} onClick={() => paginate(idx + 1)}>{idx + 1}</button>
                  ))}
                  <button className="page-btn" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight size={20}/></button>
                  <span className="page-info">Page {currentPage} of {totalPages}</span>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Search size={40} className="empty-icon" style={{margin:'0 auto 15px', opacity:0.5}}/>
              <h3>No matches found</h3>
              <p>Try adjusting your search or filters.</p>
              <button className="clear-filters-btn" style={{margin: '20px auto 0', width: 'fit-content'}} onClick={clearFilters}>Reset Filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllCompanies;