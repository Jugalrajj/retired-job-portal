import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import useAuthStore from "../../context/useAuthStore";
import {
  Search,
  MapPin,
  Filter,
  Bookmark,
  Briefcase,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// --- DEFAULT LOGO ---
const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/4091/4091968.png";

const SeeJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  // --- CONFIG STATE (Dynamic Options) ---
  const [config, setConfig] = useState({
    workTypes: ["Full-Time", "Part-Time", "Contract", "Internship"], // Fallbacks
    workModes: ["Remote", "On-Site", "Hybrid"], // Fallbacks
    datePosted: ["All", "Last 24 hours", "Last 3 days", "Last 7 days"], // Logic-based (Static)

    // 🔥 NEW: Store nested categories from API
    categories: [],
    educationCategories: [],

    // --- NEW DYNAMIC FILTERS ---
    roleCategories: ["IT", "Finance", "Healthcare", "Engineering", "Sales"], // Fallbacks
    seniorityLevels: [
      "Entry Level",
      "Mid Level",
      "Senior",
      "Director",
      "Executive",
    ], // Fallbacks
    educationLevels: ["High School", "Bachelor's", "Master's", "PhD"], // Fallbacks
    industries: [
      "Technology",
      "Healthcare",
      "Finance",
      "Education",
      "Manufacturing",
    ], // Fallbacks
  });

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6); // Changed to State

  // --- NAVIGATION & URL ---
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const titleQuery = queryParams.get("title") || "";
  const idQuery = queryParams.get("id");

  // --- FILTERS ---
  const initialFilters = {
    datePosted: "All",
    minSalary: 0,
    workMode: "All",
    workType: "All",

    // 🔥 NEW PARENT FILTERS
    department: "All",
    educationType: "All",

    // --- NEW INITIAL FILTERS ---
    roleCategory: "All",
    seniorityLevel: "All",
    educationLevel: "All",
    industry: "All",
    sortBy: "Relevant",
  };

  const [filters, setFilters] = useState(initialFilters);
  const [searchTerm, setSearchTerm] = useState(titleQuery);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(titleQuery);

  const { user } = useAuthStore();
  const currentUser = user?.user;
  const isSeeker = currentUser?.role === "seeker";

  // --- HELPERS ---
  const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "New";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) return "New";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getLogoUrl = (url) => {
    if (!url || url.trim() === "") return DEFAULT_LOGO;
    if (url.startsWith("blob:") || url.startsWith("data:")) return url;
    if (url.startsWith("http")) return url;
    let cleanPath = url.replace(/\\/g, "/");
    if (cleanPath.startsWith("/")) cleanPath = cleanPath.substring(1);
    return `http://localhost:5000/${cleanPath}`;
  };

  // --- EFFECTS ---

  // 1. Fetch Configuration (Filter Options)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get("/config");
        if (data) {
          // 🔥 Extract all nested roles/qualifications to use as global fallbacks
          // when "All Departments" or "All Categories" is selected
          const allRoles = data.categories
            ? Array.from(
                new Set(
                  data.categories.flatMap((cat) => cat.roleCategories || []),
                ),
              )
            : [];
          const allEdu = data.educationCategories
            ? Array.from(
                new Set(
                  data.educationCategories.flatMap(
                    (edu) => edu.qualifications || [],
                  ),
                ),
              )
            : [];

          setConfig((prev) => ({
            ...prev,
            workTypes: data.workTypes || prev.workTypes,
            workModes: data.workModes || prev.workModes,
            categories: data.categories || [], // Store Departments
            educationCategories: data.educationCategories || [], // Store Edu Types

            // --- SETTING NEW CONFIGURATIONS FROM API ---
            roleCategories: allRoles.length
              ? allRoles
              : data.roleCategories || prev.roleCategories,
            seniorityLevels: data.seniorityLevels || prev.seniorityLevels,
            educationLevels: allEdu.length
              ? allEdu
              : data.educationLevels || prev.educationLevels,
            industries: data.industries || prev.industries,
          }));
        }
      } catch (err) {
        console.error("Error fetching config:", err);
      }
    };
    fetchConfig();
  }, []);

  // 2. Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 3. Fetch Jobs
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      if (idQuery) {
        try {
          const res = await api.get(`/jobs/${idQuery}`);
          const data = Array.isArray(res.data) ? res.data : [res.data];
          setJobs(data);
        } catch (e) {
          console.error("Failed to fetch specific job, falling back to all", e);
          setJobs([]);
        }
      } else {
        // 1. Fetch jobs using only the dropdown filters
        const res = await api.get("/jobs", {
          params: { ...filters },
        });

        let fetchedJobs = Array.isArray(res.data) ? res.data : [];

        // 2. Perform a multi-field search locally
        if (debouncedSearchTerm) {
          const searchLower = debouncedSearchTerm.toLowerCase();

          fetchedJobs = fetchedJobs.filter((job) => {
            // Check Job Title
            const matchTitle = job.title?.toLowerCase().includes(searchLower);

            // Check Company Name (checking both companyId and employer just in case)
            const matchCompany =
              job.companyId?.name?.toLowerCase().includes(searchLower) ||
              job.employer?.name?.toLowerCase().includes(searchLower);

            // Check Skills
            const matchSkill = job.skills?.some((skill) =>
              skill.toLowerCase().includes(searchLower),
            );

            return matchTitle || matchCompany || matchSkill;
          });
        }

        setJobs(fetchedJobs);
      }

      // Reset to page 1 when data changes
      setCurrentPage(1);

      if (isSeeker) {
        try {
          const savedRes = await api.get("/jobs/saved");
          const savedIds = savedRes.data.map(
            (item) => item.job?._id || item._id || item,
          );
          setSavedJobIds(savedIds);
        } catch (innerErr) {
          console.error("Error fetching user-specific job data", innerErr);
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filters, isSeeker, idQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentJobs = jobs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(jobs.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- HANDLERS ---
  const handleFilterUpdate = (key, value) => {
    setFilters((prev) => {
      const updatedData = { ...prev, [key]: value };

      // 🔥 Automatically clear dependent fields if parent changes
      if (key === "department") updatedData.roleCategory = "All";
      if (key === "educationType") updatedData.educationLevel = "All";

      return updatedData;
    });
  };

  // New Handler for Items Per Page
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  const clearAllFilters = () => {
    setFilters(initialFilters);
    setSearchTerm("");
    navigate("/find-jobs");
    setShowMobileFilters(false);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (idQuery) {
      navigate(`/find-jobs?title=${searchTerm}`);
    } else {
      fetchData();
    }
  };

  const handleToggleSave = async (e, jobId) => {
    e.stopPropagation();
    if (!currentUser) return alert("Please login to save jobs.");

    const isSaved = savedJobIds.includes(jobId);
    setSavedJobIds((prev) =>
      isSaved ? prev.filter((id) => id !== jobId) : [...prev, jobId],
    );

    try {
      await api.post(`/jobs/save/${jobId}`);
    } catch (err) {
      setSavedJobIds((prev) =>
        isSaved ? [...prev, jobId] : prev.filter((id) => id !== jobId),
      );
      alert("Failed to save job. Please try again.");
    }
  };

  const handleJobClick = (jobId) => {
    if (isSeeker) {
      navigate(`/job/${jobId}`);
    } else {
      navigate("/auth/seeker");
    }
  };

  // --- MODIFIED SALARY FUNCTION ---
  const getJobSalary = (job) => {
    if (job.isVolunteer) return "Unpaid";
    // Modified to show full amount with commas (e.g. ₹50,000)
    if (job.salary && job.salary > 0)
      return `₹${Number(job.salary).toLocaleString()}`;
    return "N/A";
  };

  return (
    <div className="dark-page-wrapper">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

          body { background-color: var(--bg-root); overflow-x: hidden; transition: background-color 0.3s ease; }
          * { box-sizing: border-box; }

          .dark-page-wrapper {
            min-height: 100vh;
            background-color: var(--bg-root);
            font-family: 'Plus Jakarta Sans', sans-serif;
            position: relative;
            padding: 40px 20px;
            color: var(--text-main);
            transition: background-color 0.3s ease, color 0.3s ease;
          }

          .bg-blob {
            position: absolute; border-radius: 50%; filter: blur(120px);
            opacity: 0.15; z-index: 0; pointer-events: none;
          }
          .b1 { top: -10%; left: -10%; width: 600px; height: 600px; background: #4f46e5; }
          .b2 { top: 20%; right: -5%; width: 500px; height: 500px; background: var(--primary); }

          .layout-grid {
            display: grid;
            grid-template-columns: 280px 1fr;
            gap: 30px;
            max-width: 1400px;
            margin: 0 auto;
            position: relative;
            z-index: 5;
            align-items: start;
          }

          .filter-sidebar {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 24px;
            position: sticky;
            top: 100px; 
            height: calc(100vh - 80px);
            overflow-y: auto;
            scrollbar-width: none; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          }
          .filter-sidebar::-webkit-scrollbar { display: none; }

          .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 15px; border-bottom: 1px solid var(--border); }
          .panel-title { font-size: 16px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px; }
          .reset-btn { background: none; border: none; color: var(--primary); font-size: 12px; font-weight: 600; cursor: pointer; }
          .reset-btn:hover { text-decoration: underline; }

          .filter-group { margin-bottom: 24px; }
          .filter-label { font-size: 12px; font-weight: 700; color: var(--text-sub); margin-bottom: 12px; display: block; text-transform: uppercase; letter-spacing: 1px; }
          
          .radio-label { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; cursor: pointer; color: var(--text-main); font-size: 14px; font-weight: 500; transition: 0.2s; }
          .radio-label:hover { color: var(--primary); }
          .radio-label input { accent-color: var(--primary); width: 16px; height: 16px; }

          .range-slider { width: 100%; accent-color: var(--primary); cursor: pointer; }
          .range-val { font-size: 12px; color: var(--primary); display: block; text-align: right; margin-top: 4px; }

          .select-box { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border); color: var(--text-main); background: var(--bg-input); font-size: 14px; outline: none; }

          .content-header { margin-bottom: 30px; }

          .search-capsule {
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 8px 8px 8px 24px;
            display: flex; align-items: center;
            box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05);
          }

          .search-input { flex: 1; border: none; outline: none; font-size: 16px; color: var(--text-main); font-weight: 500; background: transparent; min-width: 0; }
          .search-btn { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%); color: #ffffff; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }

          .results-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
          
          /* FIXED: MOBILE FILTER TOGGLE STYLE */
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
          .mobile-filter-toggle:hover { border-color: var(--primary); color: var(--primary); }

          .results-count { font-size: 14px; color: var(--text-sub); }
          .view-toggles { display: flex; gap: 10px; }
          .view-btn { background: var(--bg-input); border: 1px solid var(--border); width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-sub); cursor: pointer; transition: 0.2s; }
          .view-btn.active { background: var(--primary); color: #000; border-color: var(--primary); }

          .per-page-select {
            background: var(--bg-input);
            color: var(--text-sub);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            outline: none;
            margin-left: 10px;
          }
          .per-page-select:hover, .per-page-select:focus { border-color: var(--primary); color: var(--text-main); }

          .jobs-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 20px; width: 100%; 
            padding-bottom: 20px;
          }
          .jobs-grid.list-view { grid-template-columns: 1fr; }

          .job-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 24px;
            display: flex; flex-direction: column; gap: 16px;
            position: relative; transition: all 0.3s ease;
            cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          }
          .job-card:hover { transform: translateY(-5px); border-color: var(--primary); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15); }

          .card-top { display: flex; gap: 16px; align-items: flex-start; }
          .card-logo { width: 64px; height: 64px; border-radius: 12px; background: #ffffff; display: flex; align-items: center; justify-content: center; padding: 4px; border: 1px solid var(--border); }
          .card-logo img { width: 100%; height: 100%; object-fit: contain; }

          .card-title { font-size: 18px; font-weight: 700; color: var(--text-main); margin: 0 0 4px; }
          .card-company { font-size: 13px; color: var(--primary); font-weight: 600; text-transform: uppercase; }

          .card-tags { display: flex; flex-wrap: wrap; gap: 8px; }
          .pill { display: flex; align-items: center; gap: 6px; font-size: 11px; background: var(--bg-input); color: var(--text-sub); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border); }
          .pill.salary { color: #4ade80; background: rgba(74, 222, 128, 0.1); border-color: rgba(74, 222, 128, 0.2); }

          .card-desc { font-size: 13px; color: var(--text-sub); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

          .card-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
          .posted-date { font-size: 12px; color: var(--text-sub); display: flex; align-items: center; gap: 4px; }

          .btn-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--bg-input); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-sub); cursor: pointer; transition: 0.2s; }
          .btn-icon.saved { color: var(--primary); border-color: var(--primary); background: var(--primary-dim); }

          .btn-apply { background: var(--text-main); color: var(--bg-root); padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 6px; }
          .btn-apply:hover { background: var(--primary); color: #000; }

          .pagination-container { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 40px; padding-bottom: 20px; }
          .page-btn { width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-main); font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
          .page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); transform: translateY(-2px); }
          .page-btn.active { background: var(--primary); color: #000; border-color: var(--primary); }
          .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .page-info { font-size: 14px; color: var(--text-sub); font-weight: 600; }

          .loading-spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 80px auto; }
          @keyframes spin { to { transform: rotate(360deg); } }

          .empty-state { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; text-align: center; width: 100%; color: var(--text-sub); }

          /* RESPONSIVE FILTER FIXES */
          @media (max-width: 1024px) {
            .layout-grid { grid-template-columns: 1fr; }
            .mobile-filter-toggle { display: flex; }
            
            /* Hidden by default on mobile unless toggled */
            .filter-sidebar { 
              display: none;
              position: static; 
              width: 100%; 
              height: auto; 
              margin-bottom: 20px;
              overflow-y: visible;
              animation: slideIn 0.3s ease-out;
            }
            .filter-sidebar.active { display: block; }
          }

          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="layout-grid">
        <aside className="left-column">
          {/* MOBILE TOGGLE BUTTON */}
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

          <div
            className={`filter-sidebar ${showMobileFilters ? "active" : ""}`}
          >
            <div className="panel-header">
              <div className="panel-title">
                <SlidersHorizontal size={18} /> Filters
              </div>
              <button className="reset-btn" onClick={clearAllFilters}>
                Reset All
              </button>
            </div>

            <div className="filter-group">
              <label className="filter-label">Sort Order</label>
              <select
                className="select-box"
                value={filters.sortBy}
                onChange={(e) => handleFilterUpdate("sortBy", e.target.value)}
              >
                <option value="Relevant">Most Relevant</option>
                <option value="Salary - High to low">Highest Salary</option>
                <option value="Date posted - New to Old">Newest First</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Min Salary (Monthly)</label>
              <input
                type="range"
                min="0"
                max="150000"
                step="5000"
                className="range-slider"
                value={filters.minSalary}
                onChange={(e) =>
                  handleFilterUpdate("minSalary", e.target.value)
                }
              />
              <span className="range-val">
                ₹{parseInt(filters.minSalary).toLocaleString()}+
              </span>
            </div>

            <div className="filter-group">
              <label className="filter-label">Department</label>
              <select
                className="select-box"
                value={filters.department}
                onChange={(e) =>
                  handleFilterUpdate("department", e.target.value)
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

            <div className="filter-group">
              <label className="filter-label">Role Category</label>
              <select
                className="select-box"
                value={filters.roleCategory}
                onChange={(e) =>
                  handleFilterUpdate("roleCategory", e.target.value)
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

            <div className="filter-group">
              <label className="filter-label">Seniority Level</label>
              <select
                className="select-box"
                value={filters.seniorityLevel}
                onChange={(e) =>
                  handleFilterUpdate("seniorityLevel", e.target.value)
                }
              >
                <option value="All">All Levels</option>
                {config.seniorityLevels.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Industry</label>
              <select
                className="select-box"
                value={filters.industry}
                onChange={(e) => handleFilterUpdate("industry", e.target.value)}
              >
                <option value="All">All Industries</option>
                {config.industries.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Education Category</label>
              <select
                className="select-box"
                value={filters.educationType}
                onChange={(e) =>
                  handleFilterUpdate("educationType", e.target.value)
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

            <div className="filter-group">
              <label className="filter-label">Specific Qualification</label>
              <select
                className="select-box"
                value={filters.educationLevel}
                onChange={(e) =>
                  handleFilterUpdate("educationLevel", e.target.value)
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

            <div className="filter-group">
              <label className="filter-label">Date Posted</label>
              {config.datePosted.map((opt) => (
                <label key={opt} className="radio-label">
                  <input
                    type="radio"
                    name="date"
                    checked={filters.datePosted === opt}
                    onChange={() => handleFilterUpdate("datePosted", opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <label className="filter-label">Job Type</label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="type"
                  checked={filters.workType === "All"}
                  onChange={() => handleFilterUpdate("workType", "All")}
                />
                All
              </label>
              {config.workTypes.map((opt) => (
                <label key={opt} className="radio-label">
                  <input
                    type="radio"
                    name="type"
                    checked={filters.workType === opt}
                    onChange={() => handleFilterUpdate("workType", opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <label className="filter-label">Work Mode</label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="mode"
                  checked={filters.workMode === "All"}
                  onChange={() => handleFilterUpdate("workMode", "All")}
                />
                All
              </label>
              {config.workModes.map((opt) => (
                <label key={opt} className="radio-label">
                  <input
                    type="radio"
                    name="mode"
                    checked={filters.workMode === opt}
                    onChange={() => handleFilterUpdate("workMode", opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </aside>

        <main className="content-area">
          <div className="content-header">
            <form className="search-capsule" onSubmit={handleSearchSubmit}>
              <Search
                size={20}
                className="input-icon"
                style={{ color: "var(--text-sub)" }}
              />
              <input
                className="search-input"
                type="text"
                placeholder="Search by title, skill, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="search-btn">
                <ArrowRight size={20} />
              </button>
            </form>

            <div className="results-bar">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <span className="results-count">
                  Showing <b>{jobs.length}</b> opportunities
                </span>

                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="per-page-select"
                  aria-label="Items per page"
                >
                  <option value={6}>6 per page</option>
                  <option value={12}>12 per page</option>
                  <option value={24}>24 per page</option>
                  <option value={48}>48 per page</option>
                </select>
              </div>

              <div
                className="view-toggles"
                style={{ display: window.innerWidth > 600 ? "flex" : "none" }}
              >
                <button
                  className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          <div
            className={`jobs-grid ${viewMode === "list" ? "list-view" : ""}`}
          >
            {loading ? (
              <div className="loading-spinner"></div>
            ) : currentJobs.length > 0 ? (
              currentJobs.map((job) => {
                const companyName =
                  job.companyId?.name || job.employer?.name || "Hiring Company";
                const logoUrl = getLogoUrl(
                  job.companyId?.logo || job.employer?.logoUrl,
                );
                return (
                  <div
                    key={job._id}
                    className="job-card"
                    onClick={() => handleJobClick(job._id)}
                  >
                    <div className="card-top">
                      <div className="card-logo">
                        <img src={logoUrl} alt="Logo" />
                      </div>
                      <div className="card-info">
                        <h3 className="card-title">{job.title}</h3>
                        <div className="card-company">{companyName}</div>
                      </div>
                    </div>
                    <div className="card-tags">
                      <div className="pill">
                        <MapPin size={10} />
                        {job.locations && job.locations.length > 0
                          ? job.locations.join(", ")
                          : "Remote"}
                      </div>
                      <div className="pill">
                        <Briefcase size={10} /> {job.workType}
                      </div>
                      <div className="pill salary">{getJobSalary(job)}</div>
                    </div>
                    <p className="card-desc">
                      {truncate(job.description, 120)}
                    </p>
                    <div className="card-footer">
                      <div className="posted-date">
                        <Clock size={12} /> {formatDate(job.createdAt)}
                      </div>
                      <div
                        className="card-actions"
                        style={{ display: "flex", gap: "1rem" }}
                      >
                        {isSeeker && (
                          <button
                            className={`btn-icon ${savedJobIds.includes(job._id) ? "saved" : ""}`}
                            onClick={(e) => handleToggleSave(e, job._id)}
                          >
                            <Bookmark
                              size={18}
                              fill={
                                savedJobIds.includes(job._id)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>
                        )}
                        <button className="btn-apply">Details</button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <Briefcase
                  size={48}
                  style={{ margin: "0 auto 15px", opacity: 0.5 }}
                />
                <h3>No jobs found</h3>
                <button
                  className="btn-apply"
                  style={{ width: "auto", margin: "20px auto 0" }}
                  onClick={clearAllFilters}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

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
        </main>
      </div>
    </div>
  );
};

export default SeeJobs;
