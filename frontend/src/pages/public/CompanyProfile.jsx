import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  MapPin,
  Briefcase,
  Search,
  RotateCcw,
  Award,
  Zap,
  Users,
  Clock,
  Heart,
  Building2,
  ArrowLeft,
  Monitor,
  Activity,
  Filter,
  ChevronRight,
  Globe,
  Mail,
  Calendar,
  Linkedin,
  Twitter,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const getImageUrl = (path) => {
  if (!path) return null;
  const cleanPath = path.replace(/\\/g, "/");
  if (cleanPath.startsWith("http")) return cleanPath;
  return `http://localhost:5000/${cleanPath}`;
};

const CompanyProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- MOBILE FILTER STATE ---
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // --- CONFIG STATE (For Dynamic Filters) ---
  const [config, setConfig] = useState({
    workModes: ["Work from office", "Remote", "Hybrid"],
    workTypes: ["Full time", "Part time", "Contract", "Project-Based"],

    // 🔥 NEW: Store nested categories from API
    categories: [],
    educationCategories: [],

    // --- NEW DYNAMIC FALLBACKS ---
    roleCategories: ["IT", "Finance", "Healthcare", "Engineering", "Sales"],
    seniorityLevels: [
      "Entry Level",
      "Mid Level",
      "Senior",
      "Director",
      "Executive",
    ],
    educationLevels: ["High School", "Bachelor's", "Master's", "PhD"],
  });

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- FILTERS ---
  const initialFilters = {
    searchQuery: "",
    workMode: "All",
    workType: "All",
    timeCommitment: "All",

    // 🔥 NEW PARENT FILTERS
    department: "All",
    educationType: "All",

    // --- NEW INITIAL FILTERS ---
    roleCategory: "All",
    seniorityLevel: "All",
    educationLevel: "All",
    sortBy: "Recent",
  };
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Profile and Config in parallel
        const [profileRes, configRes] = await Promise.all([
          api.get(`/companies/${id}`),
          api.get("/config"),
        ]);

        setProfile(profileRes.data);

        // Update config state with backend data
        if (configRes.data) {
          // 🔥 Extract all nested roles/qualifications to use as global fallbacks
          // when "All Departments" or "All Categories" is selected
          const allRoles = configRes.data.categories
            ? Array.from(
                new Set(
                  configRes.data.categories.flatMap(
                    (cat) => cat.roleCategories || [],
                  ),
                ),
              )
            : [];
          const allEdu = configRes.data.educationCategories
            ? Array.from(
                new Set(
                  configRes.data.educationCategories.flatMap(
                    (edu) => edu.qualifications || [],
                  ),
                ),
              )
            : [];

          setConfig((prev) => ({
            ...prev,
            workModes: configRes.data.workModes || prev.workModes,
            workTypes: configRes.data.workTypes || prev.workTypes,
            categories: configRes.data.categories || [],
            educationCategories: configRes.data.educationCategories || [],

            // --- SETTING NEW CONFIGURATIONS FROM API ---
            roleCategories: allRoles.length
              ? allRoles
              : configRes.data.roleCategories || prev.roleCategories,
            seniorityLevels:
              configRes.data.seniorityLevels || prev.seniorityLevels,
            educationLevels: allEdu.length
              ? allEdu
              : configRes.data.educationLevels || prev.educationLevels,
          }));
        }
      } catch (err) {
        console.error("Error loading profile or config:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // --- DERIVED FILTER OPTIONS (Dependent Dropdowns) ---
  const derivedRoleCategories =
    filters.department === "All"
      ? config.roleCategories
      : config.categories?.find((cat) => cat.title === filters.department)
          ?.roleCategories || [];

  const derivedEducationLevels =
    filters.educationType === "All"
      ? config.educationLevels
      : config.educationCategories?.find(
          (cat) => cat.title === filters.educationType,
        )?.qualifications || [];

  const filteredJobs = useMemo(() => {
    if (!profile) return [];
    let jobs = [...profile.jobs];

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.department?.toLowerCase().includes(q),
      );
    }

    if (filters.workMode !== "All")
      jobs = jobs.filter((j) => j.workMode === filters.workMode);
    if (filters.workType !== "All")
      jobs = jobs.filter((j) => j.workType === filters.workType);

    // 🔥 NEW ADVANCED FILTERS
    if (filters.department !== "All")
      jobs = jobs.filter((j) => j.department === filters.department);
    if (filters.roleCategory !== "All")
      jobs = jobs.filter((j) => j.roleCategory === filters.roleCategory);
    if (filters.seniorityLevel !== "All")
      jobs = jobs.filter((j) => j.seniorityLevel === filters.seniorityLevel);
    if (filters.educationType !== "All")
      jobs = jobs.filter((j) => j.educationType === filters.educationType);
    if (filters.educationLevel !== "All")
      jobs = jobs.filter((j) => j.education === filters.educationLevel);

    if (filters.sortBy === "Salary")
      jobs.sort((a, b) => (b.salary || 0) - (a.salary || 0));
    else jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return jobs;
  }, [profile, filters]);

  // --- PAGINATION LOGIC ---
  const indexOfLastJob = currentPage * itemsPerPage;
  const indexOfFirstJob = indexOfLastJob - itemsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    document
      .getElementById("jobs-feed")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFilterChange = (key, value) => {
    if (key === "reset") {
      setFilters(initialFilters);
      setCurrentPage(1);
      return;
    }
    setFilters((prev) => {
      const updatedData = { ...prev, [key]: value };

      // 🔥 Automatically clear dependent fields if parent changes
      if (key === "department") updatedData.roleCategory = "All";
      if (key === "educationType") updatedData.educationLevel = "All";

      return updatedData;
    });
    setCurrentPage(1);
  };

  const goToJobDetails = (e, jobId) => {
    e.stopPropagation();
    navigate(`/job/${jobId}`);
  };

  if (loading)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "var(--bg-root)",
          color: "var(--text-sub)",
        }}
      >
        Loading Company Profile...
      </div>
    );

  if (!profile)
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          background: "var(--bg-root)",
          color: "var(--text-sub)",
          height: "100vh",
        }}
      >
        Company not found.
      </div>
    );

  const { company } = profile;

  return (
    <div className="dark-profile-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        html, body { margin: 0; padding: 0; background-color: var(--bg-root); height: 100%; width: 100%; }

        .dark-profile-wrapper { 
          background-color: var(--bg-root); min-height: 100vh; width: 100%;
          display: flex; justify-content: center; padding: 40px 20px; 
          font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text-main); 
          box-sizing: border-box; position: relative; transition: background-color 0.3s ease;
        }

        .bg-blob { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.15; z-index: 0; pointer-events: none; }
        .b1 { top: -10%; left: -10%; width: 600px; height: 600px; background: #4f46e5; }
        .b2 { bottom: -10%; right: -10%; width: 500px; height: 500px; background: var(--primary); }

        .designer-container { 
          width: 100%; max-width: 1280px; height: fit-content;
          background: var(--bg-card); backdrop-filter: blur(12px);
          border: 1px solid var(--border); border-radius: 24px; 
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); position: relative; 
          z-index: 5; display: flex; flex-direction: column; overflow: hidden; 
        }

        .designer-container::after { 
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; 
          background: linear-gradient(90deg, #4f46e5 0%, var(--primary) 100%); z-index: 20; 
        }

        .company-header { background: var(--bg-card); border-bottom: 1px solid var(--border); padding: 40px; }
        .header-content { display: flex; align-items: flex-start; gap: 30px; flex-wrap: wrap; }
        .company-logo-box { width: 120px; height: 120px; background: #fff; border: 1px solid var(--border); border-radius: 20px; padding: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px -3px rgba(0,0,0,0.1); overflow: hidden; flex-shrink: 0; }
        .company-logo-box img { width: 100%; height: 100%; object-fit: contain; }
        
        .company-info { flex: 1; }
        .company-info h1 { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; margin: 0 0 10px 0; color: var(--text-main); }
        .meta-badges { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; }
        .meta-badge { display: flex; align-items: center; gap: 6px; background: var(--bg-input); padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--text-sub); border: 1px solid var(--border); }
        
        .back-btn { display: flex; align-items: center; gap: 6px; color: var(--text-sub); font-weight: 600; font-size: 14px; background: none; border: none; cursor: pointer; margin-bottom: 20px; transition: 0.2s; }
        .back-btn:hover { color: var(--primary); }
        
        .social-links { display: flex; gap: 10px; margin-top: 20px; }
        .social-btn { display: inline-flex; align-items: center; gap: 6px; background: var(--bg-input); border: 1px solid var(--border); color: var(--text-main); padding: 8px 16px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 13px; transition: 0.2s; }
        .social-btn:hover { border-color: var(--primary); color: var(--primary); }

        .main-grid { display: grid; grid-template-columns: 280px 1fr 300px; gap: 30px; padding: 40px; align-items: start; }
        
        .filter-card { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border); padding: 25px; position: sticky; top: 20px; }
        .filter-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
        .filter-header h3 { font-size: 16px; font-weight: 700; margin: 0; display: flex; gap: 8px; align-items: center; color: var(--text-main); }
        .reset-btn { color: var(--primary); font-size: 12px; font-weight: 600; cursor: pointer; background: none; border: none; }
        
        .filter-group { margin-bottom: 25px; }
        .filter-title { font-size: 12px; text-transform: uppercase; color: var(--text-sub); font-weight: 700; margin-bottom: 10px; display: block; }
        .radio-label { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 14px; color: var(--text-main); cursor: pointer; }
        .radio-label input { accent-color: var(--primary); width: 16px; height: 16px; }
        
        /* 🔥 NEW SELECT BOX STYLING */
        .select-box { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); color: var(--text-main); background: var(--bg-input); font-size: 14px; outline: none; margin-bottom: 8px; box-sizing: border-box; }
        .select-box:focus { border-color: var(--primary); }

        .search-input { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; margin-bottom: 15px; outline: none; box-sizing: border-box; background: var(--bg-input); color: var(--text-main); }
        .search-input:focus { border-color: var(--primary); background: var(--bg-card); }

        .feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .feed-title { font-size: 20px; font-weight: 700; color: var(--text-main); margin: 0; }
        
        .job-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 25px; margin-bottom: 20px; transition: all 0.2s ease; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .job-card:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15); }
        
        .job-main h4 { font-size: 18px; font-weight: 700; margin: 0 0 8px 0; color: var(--text-main); }
        .job-main p { margin: 0; color: var(--text-sub); font-size: 14px; display: flex; align-items: center; gap: 6px; }
        
        .job-tags { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
        .tag { background: var(--bg-input); border: 1px solid var(--border); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: var(--text-sub); display: flex; align-items: center; gap: 4px; }
        .tag.green { background: rgba(16, 185, 129, 0.15); color: #34d399; border-color: rgba(16, 185, 129, 0.3); }
        
        .job-action { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
        .salary { display: block; font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 5px; }
        .posted { font-size: 12px; color: var(--text-sub); margin-bottom: 10px; }
        
        .apply-btn { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%); color: white; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 4px 15px var(--primary-dim); }

        .info-card { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border); padding: 25px; margin-bottom: 20px; }
        .info-header { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 700; margin-bottom: 15px; color: var(--text-main); border-bottom: 1px solid var(--border); padding-bottom: 10px; }
        
        .benefit-item { display: flex; gap: 12px; margin-bottom: 15px; }
        .benefit-icon { width: 32px; height: 32px; background: var(--primary-dim); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--primary); flex-shrink: 0; border: 1px solid var(--primary); }
        .benefit-text h5 { margin: 0 0 2px 0; font-size: 14px; font-weight: 700; color: var(--text-main); }
        .benefit-text p { margin: 0; font-size: 12px; color: var(--text-sub); line-height: 1.4; }
        .about-text { font-size: 14px; color: var(--text-sub); line-height: 1.6; }
        
        .data-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; border-bottom: 1px dashed var(--border); padding-bottom: 8px; }
        .data-label { color: var(--text-sub); display: flex; align-items: center; gap: 6px; }
        .data-val { font-weight: 600; color: var(--text-main); }

        /* --- PAGINATION STYLING --- */
        .pagination-container { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 30px; }
        .page-btn { width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-main); font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
        .page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); transform: translateY(-2px); }
        .page-btn.active { background: var(--primary); color: #000; border-color: var(--primary); }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .page-info { font-size: 14px; color: var(--text-sub); font-weight: 600; }

        /* --- MOBILE TOGGLE BTN --- */
        .mobile-filter-toggle {
          display: none;
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 15px;
          font-size: 15px;
          font-weight: 700;
          color: var(--text-main);
          cursor: pointer;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 15px;
          transition: 0.3s;
        }
        .mobile-filter-toggle:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        @media (max-width: 1200px) { .main-grid { grid-template-columns: 260px 1fr; } .right-sidebar { display: none; } }
        @media (max-width: 900px) { 
          .main-grid { grid-template-columns: 1fr; padding: 20px; } 
          
          /* FIX: Toggle button and filter card on mobile */
          .mobile-filter-toggle { display: flex; }
          .filter-card { display: none; position: static; margin-bottom: 20px; }
          .filter-card.show { display: block; animation: slideDown 0.3s ease; }
          
          .designer-container { width: 100%; border-radius: 0; border: none; } 
          .dark-profile-wrapper { padding: 0; } 
          .header-content { flex-direction: column; text-align: center; align-items: center; } 
          .company-info h1 { font-size: 28px; } 
          .meta-badges { justify-content: center; } 
          .social-links { justify-content: center; } 
          .job-card { flex-direction: column; align-items: flex-start; gap: 16px; } 
          .job-action { width: 100%; flex-direction: row; justify-content: space-between; align-items: center; margin-top: 10px; border-top: 1px dashed var(--border); padding-top: 12px; } 
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="designer-container">
        <div className="company-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={18} /> Back to Directory
          </button>
          <div className="header-content">
            <div className="company-logo-box">
              {company.logo ? (
                <img src={getImageUrl(company.logo)} alt="logo" />
              ) : (
                <Building2 size={40} color="var(--text-sub)" />
              )}
            </div>
            <div className="company-info">
              <h1>{company.name}</h1>
              <div className="meta-badges">
                <span className="meta-badge">
                  <MapPin size={14} /> {company.location || "Global"}
                </span>
                <span className="meta-badge">
                  <Users size={14} /> {company.size || "Size N/A"}
                </span>
                <span className="meta-badge">
                  <Briefcase size={14} /> {company.industry || "General"}
                </span>
                {company.companyType && (
                  <span className="meta-badge">
                    <Award size={14} /> {company.companyType}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: "15px",
                  color: "var(--text-sub)",
                  lineHeight: "1.6",
                }}
              >
                {company.description || "No description provided."}
              </p>

              <div className="social-links">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="social-btn"
                  >
                    <Globe size={14} /> Website
                  </a>
                )}
                {company.linkedin && (
                  <a
                    href={company.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="social-btn"
                  >
                    <Linkedin size={14} /> LinkedIn
                  </a>
                )}
                {company.twitter && (
                  <a
                    href={company.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="social-btn"
                  >
                    <Twitter size={14} /> Twitter
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="main-grid">
          <aside className="left-sidebar">
            {/* 🔥 NEW MOBILE TOGGLE BUTTON */}
            <button
              className="mobile-filter-toggle"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <Filter size={18} />
              {showMobileFilters ? "Hide Filters" : "Show Filters"}
              {showMobileFilters ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            <div className={`filter-card ${showMobileFilters ? "show" : ""}`}>
              <div className="filter-header">
                <h3>
                  <Filter size={16} /> Filters
                </h3>
                <button
                  className="reset-btn"
                  onClick={() => handleFilterChange("reset", null)}
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>

              <div className="filter-group">
                <div className="filter-title">Search</div>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Job title..."
                  value={filters.searchQuery}
                  onChange={(e) =>
                    handleFilterChange("searchQuery", e.target.value)
                  }
                />
              </div>

              {/* 🔥 NEW PARENT FILTER: Department */}
              <div className="filter-group">
                <label className="filter-title">Department</label>
                <select
                  className="select-box"
                  value={filters.department}
                  onChange={(e) =>
                    handleFilterChange("department", e.target.value)
                  }
                >
                  <option value="All">All Departments</option>
                  {config.categories?.map((cat) => (
                    <option key={cat._id || cat.title} value={cat.title}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔥 DEPENDENT FILTER: Role Category */}
              <div className="filter-group">
                <label className="filter-title">Role Category</label>
                <select
                  className="select-box"
                  value={filters.roleCategory}
                  onChange={(e) =>
                    handleFilterChange("roleCategory", e.target.value)
                  }
                  disabled={
                    filters.department !== "All" &&
                    derivedRoleCategories.length === 0
                  }
                >
                  <option value="All">
                    {filters.department !== "All" &&
                    derivedRoleCategories.length === 0
                      ? "No specific roles"
                      : "All Categories"}
                  </option>
                  {derivedRoleCategories.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* NEW FILTER: Seniority Level */}
              <div className="filter-group">
                <label className="filter-title">Seniority Level</label>
                <select
                  className="select-box"
                  value={filters.seniorityLevel}
                  onChange={(e) =>
                    handleFilterChange("seniorityLevel", e.target.value)
                  }
                >
                  <option value="All">All Levels</option>
                  {(config.seniorityLevels || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔥 NEW PARENT FILTER: Education Category */}
              <div className="filter-group">
                <label className="filter-title">Education Category</label>
                <select
                  className="select-box"
                  value={filters.educationType}
                  onChange={(e) =>
                    handleFilterChange("educationType", e.target.value)
                  }
                >
                  <option value="All">All Categories</option>
                  {config.educationCategories?.map((cat) => (
                    <option key={cat._id || cat.title} value={cat.title}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔥 DEPENDENT FILTER: Specific Qualification */}
              <div className="filter-group">
                <label className="filter-title">Specific Qualification</label>
                <select
                  className="select-box"
                  value={filters.educationLevel}
                  onChange={(e) =>
                    handleFilterChange("educationLevel", e.target.value)
                  }
                  disabled={
                    filters.educationType !== "All" &&
                    derivedEducationLevels.length === 0
                  }
                >
                  <option value="All">
                    {filters.educationType !== "All" &&
                    derivedEducationLevels.length === 0
                      ? "No specific qualifications"
                      : "All Levels"}
                  </option>
                  {derivedEducationLevels.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* DYNAMIC WORK MODE FILTER */}
              <div className="filter-group">
                <div className="filter-title">Work Mode</div>
                {["All", ...config.workModes].map((opt) => (
                  <label key={opt} className="radio-label">
                    <input
                      type="radio"
                      name="mode"
                      checked={filters.workMode === opt}
                      onChange={() => handleFilterChange("workMode", opt)}
                    />{" "}
                    {opt}
                  </label>
                ))}
              </div>

              {/* DYNAMIC ENGAGEMENT FILTER */}
              <div className="filter-group">
                <div className="filter-title">Engagement</div>
                {["All", ...config.workTypes].map((opt) => (
                  <label key={opt} className="radio-label">
                    <input
                      type="radio"
                      name="engagement"
                      checked={filters.workType === opt}
                      onChange={() => handleFilterChange("workType", opt)}
                    />{" "}
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <main className="feed-section" id="jobs-feed">
            <div className="feed-header">
              <h2 className="feed-title">
                Open Opportunities ({filteredJobs.length})
              </h2>
              <select
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  fontSize: "13px",
                  background: "var(--bg-input)",
                  color: "var(--text-main)",
                  outline: "none",
                }}
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              >
                <option value="Recent">Newest First</option>
                <option value="Salary">Highest Pay</option>
              </select>
            </div>

            {currentJobs.length > 0 ? (
              <>
                {currentJobs.map((job) => (
                  <div
                    key={job._id}
                    className="job-card"
                    onClick={(e) => goToJobDetails(e, job._id)}
                  >
                    <div className="job-main">
                      <h4>{job.title}</h4>
                      <p>
                        <Building2 size={14} /> {job.department || "General"} •{" "}
                        {job.workType}
                      </p>
                      <div className="job-tags">
                        <span className="tag">
                          <MapPin size={12} />  {job.locations && job.locations.length > 0
                          ? job.locations.join(", ")
                          : "Remote"}
                        </span>
                        {/* {job.physicalDemands && (
                          <span className="tag">
                            <Activity size={12} />{" "}
                            {job.physicalDemands.split(" ")[0]}
                          </span>
                        )} */}
                        {job.hoursPerWeek && (
                          <span className="tag green">
                            <Clock size={12} /> {job.hoursPerWeek}h/wk
                          </span>
                        )}
                        {job.workMode === "Remote" ? (
                          <span className="tag green">Remote</span>
                        ) : (
                          <span className="tag">{job.workMode}</span>
                        )}
                      </div>
                    </div>
                    <div className="job-action">
                      <span className="salary">
                        {job.salary > 0
                          ? `₹${job.salary.toLocaleString("en-IN")}`
                          : "Vol."}
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--text-sub)",
                            fontWeight: 500,
                          }}
                        >
                          /month
                        </span>
                      </span>
                      <span className="posted">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        className="apply-btn"
                        onClick={(e) => goToJobDetails(e, job._id)}
                      >
                        View Details <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* --- PAGINATION BAR --- */}
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
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: "var(--text-sub)",
                }}
              >
                <Search
                  size={40}
                  style={{ marginBottom: "15px", opacity: 0.5 }}
                />
                <p>No jobs found matching your filters.</p>
                <button
                  className="reset-btn"
                  style={{ margin: "10px auto" }}
                  onClick={() => handleFilterChange("reset", null)}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </main>

          <aside className="right-sidebar">
            <div className="info-card">
              <div className="info-header">
                <Building2 size={18} /> Company Overview
              </div>
              <div className="data-row">
                <span className="data-label">
                  <Calendar size={14} /> Founded
                </span>
                <span className="data-val">{company.foundedYear || "N/A"}</span>
              </div>
              <div className="data-row">
                <span className="data-label">
                  <Users size={14} /> Size
                </span>
                <span className="data-val">{company.size || "N/A"}</span>
              </div>
              <div className="data-row">
                <span className="data-label">
                  <Briefcase size={14} /> Type
                </span>
                <span className="data-val">
                  {company.companyType || "Private"}
                </span>
              </div>
              <div className="data-row" style={{ border: "none" }}>
                <span className="data-label">
                  <Mail size={14} /> Contact
                </span>
                <span className="data-val">{company.email || "Private"}</span>
              </div>
            </div>

            {company.benefits && company.benefits.length > 0 ? (
              <div className="info-card">
                <div className="info-header">
                  <Zap size={18} /> Perks & Benefits
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {company.benefits.map((b, i) => (
                    <span
                      key={i}
                      className="tag green"
                      style={{
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#34d399",
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="info-card">
                <div className="info-header">
                  <Zap size={18} /> Why Work Here?
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <Heart size={16} />
                  </div>
                  <div className="benefit-text">
                    <h5>Senior Friendly</h5>
                    <p>Respectful culture valuing experience.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <Clock size={16} />
                  </div>
                  <div className="benefit-text">
                    <h5>Flexible Hours</h5>
                    <p>Choose your own schedules.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="info-card">
              <div className="info-header">
                <Award size={18} /> Mission
              </div>
              {/* Changed from company.description to company.mission */}
              <p className="about-text">
                {company.mission ||
                  "Committed to innovation and excellence in our field."}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
