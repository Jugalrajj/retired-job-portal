import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Search,
  MapPin,
  Briefcase,
  Lock,
  Download,
  Mail,
  Phone,
  ChevronRight,
  ChevronLeft,
  Building2,
  Coins,
  Loader2,
  Filter,
  X,
  Layout,
  AlertTriangle,
  CheckCircle,
  Info,
  GraduationCap,
  User,
  Globe,
  Calendar,
  Layers,
  ExternalLink, 
} from "lucide-react";

// --- HELPER: Handle Image/File URLs safely ---
const getFileUrl = (path) => {
  if (!path || path === "undefined" || path === "null") return null;
  if (path.startsWith("http")) return path;
  return `http://localhost:5000/${path.replace(/\\/g, "/")}`;
};

const TalentPool = () => {
  const navigate = useNavigate();

  // Data States
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [credits, setCredits] = useState(0);

  // UI States
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);

  // Sidebar State
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  // --- SEARCH & FILTER STATES ---
  const [searchTerm, setSearchTerm] = useState(""); // Deep keyword search
  const [filterRole, setFilterRole] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [filterExp, setFilterExp] = useState(""); // Minimum years

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9); // Changed to state

  // --- MODAL STATE ---
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "confirm", // 'confirm', 'insufficient', 'error'
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Confirm",
  });

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [seekerRes, userRes] = await Promise.all([
          api.get("/seekers"),
          api.get("/auth/me"),
        ]);

        let data = [];
        if (Array.isArray(seekerRes.data)) {
          data = seekerRes.data;
        } else if (
          seekerRes.data.profiles &&
          Array.isArray(seekerRes.data.profiles)
        ) {
          data = seekerRes.data.profiles;
        }

        setCandidates(data);
        setFilteredCandidates(data);

        if (userRes.data && userRes.data.user) {
          setCredits(userRes.data.user.credits || 0);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // --- 2. DATA EXTRACTORS ---
  const getCandidatePhoto = (c) => {
    if (!c) return null;
    return getFileUrl(c.photoUrl || c.user?.photoUrl || c.photo);
  };

  const getCandidateEmail = (c) => {
    if (!c) return "Hidden";
    return c.contactEmail || c.email || c.user?.email || "Hidden";
  };

  const getCandidateExperience = (c) => {
    return c.workExperience || c.profile?.workExperience || [];
  };

  const getCandidateEducation = (c) => {
    return c.education || c.profile?.education || [];
  };

  // Helper to get numeric years for filtering
  const getExperienceYears = (c) => {
    if (c.totalExperienceYears) return Number(c.totalExperienceYears);

    const expList = getCandidateExperience(c);
    if (!expList || expList.length === 0) return 0;

    let totalMonths = 0;
    expList.forEach((exp) => {
      if (exp.startDate) {
        const start = new Date(exp.startDate);
        const end = exp.current
          ? new Date()
          : exp.endDate
            ? new Date(exp.endDate)
            : new Date();
        const months =
          (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth());
        totalMonths += Math.max(0, months);
      }
    });

    return Math.floor(totalMonths / 12);
  };

  const deriveExperienceString = (c) => {
    const years = getExperienceYears(c);
    if (years === 0) {
      // Check if there's at least some month experience
      const expList = getCandidateExperience(c);
      if (expList.length > 0) return "Fresh / <1 Year";
      return "Fresher";
    }
    return `${years}+ Years`;
  };

  // --- 3. ATS FILTERING ENGINE (UPDATED) ---
  useEffect(() => {
    let result = candidates;

    // 🔥 HELPER: Build "Digital Resume Corpus"
    const getATSCorpus = (c) => {
      const parts = [
        c.fullName || "",
        c.headline || "",
        c.bio || "",
        c.location || "",
        // Skills Array
        ...(c.skills || []),
        // Languages
        ...(c.languages?.map(l => typeof l === 'string' ? l : l.name) || []),
        // Work History (Title, Company, AND Description)
        ...(getCandidateExperience(c).map(exp => `${exp.title} ${exp.company} ${exp.description || ''} ${exp.location || ''}`)),
        // Education (Degree, School)
        ...(getCandidateEducation(c).map(edu => `${edu.degree} ${edu.institution} ${edu.fieldOfStudy || ''}`)),
        // Raw Resume Text (This is the key for ATS search)
        c.resumeText || "" 
      ];
      return parts.join(" ").toLowerCase();
    };

    // 1. Keyword Search (Deep Search mimicking Resume Search)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      // Searches inside the ENTIRE corpus
      result = result.filter(c => getATSCorpus(c).includes(lowerTerm));
    }

    // 2. Specific Filters (Enhanced with Deep Search)
    
    // Role Filter: Checks Headline OR Past Job Titles
    if (filterRole) {
      const lowerRole = filterRole.toLowerCase();
      result = result.filter((c) => {
        const headlineMatch = (c.headline || "").toLowerCase().includes(lowerRole);
        const expMatch = getCandidateExperience(c).some(exp => 
            (exp.title || "").toLowerCase().includes(lowerRole)
        );
        return headlineMatch || expMatch;
      });
    }

    // Location Filter: Checks Location Field OR Bio (e.g. "Relocating to...")
    if (filterLocation) {
      const lowerLoc = filterLocation.toLowerCase();
      result = result.filter(c => getATSCorpus(c).includes(lowerLoc));
    }

    // Skill Filter: Deep Search
    if (filterSkill) {
      const lowerSkill = filterSkill.toLowerCase();
      result = result.filter(c => getATSCorpus(c).includes(lowerSkill));
    }

    // Experience Years (Numeric Check)
    if (filterExp) {
      const minYears = parseInt(filterExp);
      result = result.filter((c) => getExperienceYears(c) >= minYears);
    }

    setFilteredCandidates(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [
    searchTerm,
    filterRole,
    filterLocation,
    filterSkill,
    filterExp,
    candidates,
  ]);

  // --- PAGINATION LOGIC ---
  const indexOfLastCandidate = currentPage * itemsPerPage;
  const indexOfFirstCandidate = indexOfLastCandidate - itemsPerPage;
  const currentCandidates = filteredCandidates.slice(indexOfFirstCandidate, indexOfLastCandidate);
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // --- 4. MODAL HANDLERS ---
  const closePopup = () => setModalConfig({ ...modalConfig, isOpen: false });

  const triggerUnlockFlow = () => {
    if (!selectedCandidate) return;

    if (credits <= 0) {
      setModalConfig({
        isOpen: true,
        type: "insufficient",
        title: "Insufficient Credits",
        message:
          "You have 0 credits remaining. Please purchase a credit pack to unlock this candidate.",
        confirmText: "Get Credits",
        onConfirm: () => navigate("/billing"),
      });
      return;
    }

   setModalConfig({
      isOpen: true,
      type: "confirm",
      title: "Unlock Profile?",
      message: `This will deduct 1 Credit from your balance. You will reveal contact details for ${selectedCandidate.isMasked ? "this candidate" : (selectedCandidate.fullName || "this candidate")}.`,
      confirmText: "Yes, Unlock",
      onConfirm: executeUnlock,
    });
  };

  // --- 5. EXECUTE API CALL ---
  const executeUnlock = async () => {
    closePopup();
    setUnlocking(true);

    try {
      const { data } = await api.post(
        `/seekers/unlock/${selectedCandidate._id}`,
      );

      if (data.success) {
        setCredits(data.credits);
        const freshData = data.unmaskedData || {};
        const updatedCand = {
          ...selectedCandidate,
          ...freshData,
          isMasked: false,
          contactEmail:
            freshData.email ||
            freshData.contactEmail ||
            getCandidateEmail(selectedCandidate),
          phone: freshData.phone || selectedCandidate.phone,
          resumeUrl:
            freshData.resume ||
            freshData.resumeUrl ||
            selectedCandidate.resumeUrl,
          photoUrl:
            freshData.photo ||
            freshData.photoUrl ||
            getCandidatePhoto(selectedCandidate),
          totalExperienceYears:
            freshData.totalExperienceYears ||
            selectedCandidate.totalExperienceYears,
          resumeText: freshData.resumeText || selectedCandidate.resumeText // Ensure resumeText persists
        };

        setCandidates((prev) =>
          prev.map((c) => (c._id === updatedCand._id ? updatedCand : c)),
        );
        setFilteredCandidates((prev) =>
          prev.map((c) => (c._id === updatedCand._id ? updatedCand : c)),
        );
        setSelectedCandidate(updatedCand);
      }
    } catch (error) {
      console.error("Unlock failed", error);
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Unlock Failed",
        message:
          error.response?.data?.message ||
          "Something went wrong. Please try again.",
        confirmText: "Close",
        onConfirm: closePopup,
      });
    } finally {
      setUnlocking(false);
    }
  };

  const openSidebar = (c) => {
    setSelectedCandidate(c);
    setShowSidebar(true);
  };
  const closeSidebar = () => {
    setShowSidebar(false);
    setTimeout(() => setSelectedCandidate(null), 300);
  };
  const getInitials = (n) =>
    n
      ? n
          .split(" ")
          .map((i) => i[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : "NA";
  const formatDate = (d) =>
    !d
      ? "Present"
      : new Date(d).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });

  return (
    <div className="dark-talent-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        :root {
          --sidebar-width: 550px;
          --header-height: 70px;
        }

        .dark-talent-wrapper {
          min-height: 100vh; background-color: var(--bg-root);
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative; padding: 30px 20px; color: var(--text-main);
        }

        /* --- BACKGROUND FX --- */
        .bg-blob { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.15; z-index: 0; pointer-events: none; }
        .b1 { top: -10%; left: -10%; width: 600px; height: 600px; background: #4f46e5; }
        .b2 { bottom: -10%; right: -10%; width: 500px; height: 500px; background: var(--primary); }

        .container { max-width: 1280px; margin: 0 auto; position: relative; z-index: 2; }
        
        .header-section { 
            display: flex; justify-content: space-between; align-items: flex-end; 
            margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid var(--border); 
        }
        .page-title { font-size: 28px; font-weight: 800; color: var(--text-main); margin: 0 0 6px 0; letter-spacing: -0.5px; }
        .page-desc { color: var(--text-sub); font-size: 15px; margin: 0; }
        
        .credit-badge { 
            background: var(--primary-dim); color: var(--primary); 
            padding: 8px 18px; border-radius: 50px; font-weight: 700; font-size: 13px; 
            border: 1px solid var(--primary); display: flex; align-items: center; 
            gap: 8px; cursor: pointer; transition: 0.2s; 
        }
        .credit-badge:hover { background: rgba(var(--primary-rgb), 0.2); transform: translateY(-2px); }

        /* --- ADVANCED SEARCH & FILTER --- */
        .filter-wrapper {
            background: var(--bg-card); padding: 16px; border-radius: 20px; 
            border: 1px solid var(--border); margin-bottom: 30px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 12px;
        }

        /* Top Row: Deep Search */
        .search-main-row {
            display: flex; gap: 12px;
        }
        .search-input-group { 
            flex: 1; display: flex; align-items: center; background: var(--bg-input); 
            padding: 12px 16px; border-radius: 12px; border: 1px solid transparent; transition: 0.2s; 
        }
        .search-input-group:focus-within { border-color: var(--primary); background: var(--bg-card); }
        .search-input-group input { border: none; background: transparent; outline: none; width: 100%; margin-left: 10px; font-size: 14px; color: var(--text-main); }
        
        /* Bottom Row: Specific Filters */
        .filter-row {
            display: grid; grid-template-columns: 1.5fr 1fr 1fr 0.8fr; gap: 12px;
        }
        .filter-item {
            display: flex; align-items: center; background: var(--bg-input);
            padding: 10px 14px; border-radius: 10px; border: 1px solid transparent;
            font-size: 13px; color: var(--text-main); transition: 0.2s;
        }
        .filter-item:focus-within { border-color: var(--primary); }
        .filter-item input, .filter-item select {
            border: none; background: transparent; outline: none; width: 100%; margin-left: 8px;
            color: var(--text-main); font-size: 13px;
        }
        .filter-item select option { background: var(--bg-card); color: var(--text-main); }
        .filter-item svg { color: var(--text-sub); flex-shrink: 0; }

        /* --- CONTROLS ROW --- */
        .controls-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 20px;
        }
        .per-page-select {
          background: var(--bg-input); color: var(--text-sub);
          border: 1px solid var(--border); padding: 6px 12px;
          border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; outline: none;
        }
        .results-text { font-size: 13px; color: var(--text-sub); }

        /* --- GRID --- */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; padding-bottom: 20px; }
        .card { 
            background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border); 
            overflow: hidden; transition: all 0.3s ease; cursor: pointer; 
            display: flex; flex-direction: column; position: relative;
        }
        .card:hover { transform: translateY(-5px); border-color: var(--primary); box-shadow: 0 15px 40px rgba(0,0,0,0.12); }

        .card-header { padding: 20px; display: flex; gap: 14px; align-items: center; border-bottom: 1px solid var(--border); background: linear-gradient(to bottom, var(--bg-input), var(--bg-card)); }
        .avatar { width: 56px; height: 56px; border-radius: 14px; background: var(--bg-input); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--text-main); font-size: 20px; object-fit: cover; border: 1px solid var(--border); overflow: hidden; }
        .info { flex: 1; overflow: hidden; }
        .name { font-size: 17px; font-weight: 700; margin: 0 0 4px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .blur-text { filter: blur(5px); opacity: 0.6; user-select: none; }
        .role { font-size: 13px; color: var(--primary); font-weight: 600; display: block; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .loc { font-size: 12px; color: var(--text-sub); display: flex; align-items: center; gap: 4px; }
        
        .card-body { padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 12px; }
        .spec-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 8px 0; border-bottom: 1px dashed var(--border); }
        .spec-row:last-child { border-bottom: none; }
        .spec-label { color: var(--text-sub); display: flex; align-items: center; gap: 6px; }
        .spec-val { font-weight: 600; color: var(--text-main); text-align: right; word-break: break-word; }
        
        /* --- SKILL CHIPS (In Card) --- */
        .tag-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
        .tag { 
            font-size: 11px; font-weight: 600; color: var(--text-sub); 
            background: var(--bg-input); padding: 4px 10px; border-radius: 6px; 
            border: 1px solid var(--border); 
        }

        .card-footer { padding: 14px 20px; background: var(--bg-input); border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .action-link { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
        .locked-link { color: var(--text-sub); }
        .unlocked-link { color: var(--primary); }

        /* --- NEW PROFESSIONAL SIDEBAR --- */
        .sidebar-overlay { 
            position: fixed; inset: 0; background: rgba(0,0,0,0.6); 
            backdrop-filter: blur(5px); z-index: 99998; /* Increased to bypass site header */
            opacity: 0; visibility: hidden; transition: 0.3s; 
        }
        .sidebar-overlay.active { opacity: 1; visibility: visible; }
        
        .right-sidebar { 
          position: fixed; top: 0; right: 0; bottom: 0;
          width: var(--sidebar-width); max-width: 90vw; height: 100vh; 
          background: var(--bg-card); z-index: 99999; /* Increased to bypass site header */
          box-shadow: -20px 0 50px rgba(0,0,0,0.4);
          transform: translateX(100%); 
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; flex-direction: column; 
          border-left: 1px solid var(--border);
        }
        .right-sidebar.active { transform: translateX(0); }

        /* Header (No longer sticky to prevent flex issues) */
        .sb-header { 
            padding: 16px 24px; border-bottom: 1px solid var(--border); 
            background: var(--bg-card); display: flex; justify-content: space-between; align-items: center; 
            flex-shrink: 0; /* Ensures header doesn't get squished */
        }
        .sb-title-bar { font-size: 14px; font-weight: 600; color: var(--text-sub); text-transform: uppercase; letter-spacing: 1px; }
        .sb-close { 
            display: flex; align-items: center; justify-content: center;
            width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); 
            background: var(--bg-input); color: var(--text-sub); display: flex; alignItems: center; justify-content: center; 
            cursor: pointer; transition: 0.2s; 
        }
        .sb-close:hover { background: var(--primary); color: #000; border-color: var(--primary); }

        /* Content Scroll Area */
        .sb-content { 
            flex: 1; overflow-y: auto; padding: 0; 
            background: var(--bg-root);
        }

        /* Hero Banner */
        .sb-hero {
            padding: 30px 30px 0;
            background: linear-gradient(to bottom, var(--bg-card), var(--bg-input));
            border-bottom: 1px solid var(--border);
            display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .sb-hero-avatar {
            width: 100px; height: 100px; border-radius: 24px; 
            background: var(--bg-card); border: 4px solid var(--bg-card);
            box-shadow: 0 12px 24px rgba(0,0,0,0.15);
            overflow: hidden; margin-bottom: 16px;
        }
        .sb-hero-name { font-size: 26px; font-weight: 800; color: var(--text-main); margin: 0 0 6px 0; word-break: break-word; overflow-wrap: break-word; }
        .sb-hero-role { font-size: 15px; font-weight: 600; color: var(--primary); margin-bottom: 24px; word-break: break-word; overflow-wrap: break-word; }
        
        /* Stats Strip */
        .sb-stats-strip {
            display: flex; width: 100%; justify-content: space-around;
            padding: 16px 0; border-top: 1px solid var(--border);
        }
        .sb-stat-item { text-align: center; }
        .sb-stat-num { font-size: 16px; font-weight: 800; color: var(--text-main); display: block; word-break: break-word; }
        .sb-stat-txt { font-size: 11px; font-weight: 700; color: var(--text-sub); text-transform: uppercase; margin-top: 4px; display: block; }

        /* Main Body Sections */
        .sb-body { padding: 30px; display: flex; flex-direction: column; gap: 32px; }

        .sb-section-title {
            font-size: 13px; font-weight: 800; text-transform: uppercase; 
            color: var(--text-sub); margin-bottom: 16px; letter-spacing: 0.5px;
            display: flex; align-items: center; gap: 8px;
        }
        .sb-section-icon { color: var(--primary); }

        .sb-text-block { font-size: 15px; line-height: 1.7; color: var(--text-main); opacity: 0.9; word-break: break-word; overflow-wrap: break-word; }

        /* Unified Timeline */
        .timeline-box {
            background: var(--bg-card); border: 1px solid var(--border);
            border-radius: 16px; padding: 24px;
        }
        .timeline { padding-left: 10px; border-left: 2px solid var(--border); margin-left: 8px; }
        .tl-item { 
            padding-left: 24px; padding-bottom: 24px; position: relative; 
        }
        .tl-item:last-child { padding-bottom: 0; }
        .tl-dot {
            width: 10px; height: 10px; background: var(--primary); border-radius: 50%;
            position: absolute; left: -15px; top: 5px; box-shadow: 0 0 0 4px var(--bg-card);
        }
        .tl-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
        .tl-title { font-size: 15px; font-weight: 700; color: var(--text-main); word-break: break-word; overflow-wrap: break-word; }
        .tl-date { font-size: 12px; color: var(--text-sub); font-weight: 600; background: var(--bg-input); padding: 2px 8px; border-radius: 6px; white-space: nowrap; }
        .tl-sub { font-size: 13px; color: var(--primary); font-weight: 600; display: block; margin-bottom: 8px; word-break: break-word; overflow-wrap: break-word; }
        .tl-desc { font-size: 13px; color: var(--text-sub); line-height: 1.5; word-break: break-word; overflow-wrap: break-word; }

        /* Skills Chips (In Sidebar) */
        .skill-container { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill-chip { 
            font-size: 12px; font-weight: 600; color: var(--text-main); 
            background: var(--bg-card); padding: 8px 14px; border-radius: 8px; 
            border: 1px solid var(--border); 
            word-break: break-word; overflow-wrap: break-word;
        }

        /* Contact Section (Bottom Pinned) */
        .sb-contact-card {
            background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-input) 100%);
            border: 1px solid var(--border); border-radius: 20px; 
            padding: 24px; position: relative; overflow: hidden; margin-top: auto;
        }
        .c-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 14px; color: var(--text-main); font-weight: 500; word-break: break-all; }
        
        .mask-overlay {
          position: absolute; inset: 0; 
          background: rgba(15, 23, 42, 0.9); /* Dark overlay */
          backdrop-filter: blur(10px);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 20px; z-index: 10;
        }
        
        .btn-unlock { 
            background: #fff; color: #000; border: none; padding: 12px 28px; border-radius: 50px; 
            font-weight: 800; cursor: pointer; margin-top: 15px; font-size: 13px; 
            box-shadow: 0 10px 25px rgba(255, 255, 255, 0.2); transition: 0.3s; 
            display: flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .btn-unlock:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 15px 35px rgba(255, 255, 255, 0.3); }
        .btn-unlock:disabled { opacity: 0.7; cursor: wait; }

        /* MODAL */
        .custom-popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); animation: fadeIn 0.2s ease-out; }
        .custom-popup { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; width: 90%; max-width: 400px; padding: 30px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); animation: scaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .popup-icon-box { width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
        .popup-icon-box.confirm { background: var(--primary-dim); color: var(--primary); }
        .popup-icon-box.insufficient { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .popup-icon-box.error { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
        .popup-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 10px; color: var(--text-main); }
        .popup-desc { font-size: 0.95rem; color: var(--text-sub); line-height: 1.5; margin-bottom: 30px; }
        .popup-actions { display: flex; gap: 12px; justify-content: center; }
        .btn-popup { padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; border: none; flex: 1; transition: 0.2s; }
        .btn-cancel { background: var(--bg-input); color: var(--text-sub); }
        .btn-cancel:hover { background: var(--border); color: var(--text-main); }
        .btn-primary { background: var(--primary); color: #000; font-weight: 700; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 15px var(--primary-dim); }

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

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        /* --- RESPONSIVE ADJUSTMENTS --- */
        @media (max-width: 1024px) {
          .grid { grid-template-columns: 1fr; }
          .filter-row { grid-template-columns: 1fr 1fr; }
          .right-sidebar { width: 100%; max-width: 100%; }
        }
        
        @media (max-width: 768px) {
          .header-section { flex-direction: column; align-items: flex-start; gap: 16px; }
          .controls-row { flex-direction: column; align-items: flex-start; gap: 12px; }
          .sb-body { padding: 20px 15px; }
          .sb-hero { padding: 20px 15px 0; }
          .timeline-box { padding: 15px; }
          .sb-stats-strip { flex-wrap: wrap; gap: 10px; }
          .tl-head { flex-direction: column; align-items: flex-start; gap: 6px; }
          .tl-date { align-self: flex-start; }
          .page-title { font-size: 24px; }
        }

        @media (max-width: 600px) {
          .filter-row { grid-template-columns: 1fr; }
          .pagination-container { flex-wrap: wrap; }
          .sb-contact-card { padding: 15px; }
        }
        
        @media (max-width: 480px) {
          .search-main-row { flex-direction: column; }
          .custom-popup { width: 95%; padding: 20px; }
          .popup-actions { flex-direction: column; }
          .btn-popup { width: 100%; }
        }
      `}</style>

      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="container">
        <div className="header-section">
          <div>
            <h1 className="page-title">Talent Pool</h1>
            <p className="page-desc">Discover experienced professionals.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div className="credit-badge" onClick={() => navigate("/billing")}>
              <Coins size={16} /> {credits} Credits
            </div>
            <div className="credit-badge" style={{ cursor: "default", background: "var(--bg-card)", color: "var(--text-main)", borderColor: "var(--border)" }}>
              <Layout size={16} color="var(--primary)" /> {filteredCandidates.length} Candidates
            </div>
          </div>
        </div>

        {/* --- ATS-ENABLED FILTER BAR --- */}
        <div className="filter-wrapper">
          {/* Row 1: Deep Search */}
          <div className="search-main-row">
            <div className="search-input-group">
              <Search size={18} color="var(--text-sub)" />
              <input
                type="text"
                placeholder="Search: Name, Skills, Bio, or keywords inside projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Specific Filters */}
          <div className="filter-row">
            <div className="filter-item">
              <Briefcase size={14} />
              <input
                type="text"
                placeholder="Role / Title"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              />
            </div>

            <div className="filter-item">
              <MapPin size={14} />
              <input
                type="text"
                placeholder="Location"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
              />
            </div>

            <div className="filter-item">
              <Layers size={14} />
              <input
                type="text"
                placeholder="Deep Skill Search (e.g. Tailwind)"
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
              />
            </div>

            <div className="filter-item">
              <Calendar size={14} />
              <select
                value={filterExp}
                onChange={(e) => setFilterExp(e.target.value)}
              >
                <option value="">Experience: Any</option>
                <option value="5">5+ Years</option>
                <option value="10">10+ Years</option>
                <option value="25">25+ Years</option>
                <option value="40">40+ Years</option>
                <option value="50">50+ Years</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- CONTROLS ROW --- */}
        {!loading && filteredCandidates.length > 0 && (
          <div className="controls-row">
             <span className="results-text">
                Showing <b>{currentCandidates.length}</b> of <b>{filteredCandidates.length}</b> Candidates
             </span>
             <select 
                value={itemsPerPage} 
                onChange={handleItemsPerPageChange}
                className="per-page-select"
             >
                <option value={9}>9 per page</option>
                <option value={18}>18 per page</option>
                <option value={27}>27 per page</option>
                <option value={45}>45 per page</option>
             </select>
          </div>
        )}

        {loading ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--text-sub)",
              padding: 40,
            }}
          >
            Loading candidates...
          </p>
        ) : filteredCandidates.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              background: "var(--bg-card)",
              borderRadius: 16,
              border: "1px solid var(--border)",
              color: "var(--text-sub)",
            }}
          >
            No candidates found matching your ATS criteria.
          </div>
        ) : (
          <>
            <div className="grid">
              {currentCandidates.map((cand) => {
                const isLocked = cand.isMasked;
                const photoUrl = getCandidatePhoto(cand);
                const displayExp = deriveExperienceString(cand);
                const latestExp =
                  getCandidateExperience(cand).length > 0
                    ? getCandidateExperience(cand)[0].company
                    : "N/A";

                return (
                  <div
                    key={cand._id}
                    className="card"
                    onClick={() => openSidebar(cand)}
                  >
                    <div className="card-header">
                      <div className="avatar">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: 16,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          getInitials(cand.fullName)
                        )}
                      </div>
                      <div className="info">
                        <h3 className={isLocked ? "blur-text name" : "name"}>
                          {cand.fullName || "Candidate Name"}
                        </h3>
                        <span className="role">
                          {cand.headline || cand.lastDesignation}
                        </span>
                        <div className="loc">
                          <MapPin size={12} /> {cand.location || "Remote"}
                        </div>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="spec-row">
                        <div className="spec-label">
                          <Briefcase size={14} /> Experience
                        </div>
                        <div className="spec-val">{displayExp}</div>
                      </div>
                      <div className="spec-row">
                        <div className="spec-label">
                          <Building2 size={14} /> Recent
                        </div>
                        <div className="spec-val">{latestExp}</div>
                      </div>
                      <div
                        className="spec-row"
                        style={{ borderBottom: "none", paddingTop: 10 }}
                      >
                        <div className="tag-wrap">
                          {cand.skills?.slice(0, 3).map((s, i) => (
                            <span key={i} className="tag">
                              {s}
                            </span>
                          ))}
                          {cand.skills?.length > 3 && (
                            <span className="tag">+{cand.skills.length - 3}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="card-footer">
                      <span
                        className={`action-link ${isLocked ? "locked-link" : "unlocked-link"}`}
                      >
                        {isLocked ? (
                          <>
                            <Lock size={14} /> Unlock Profile
                          </>
                        ) : (
                          <>
                            <Mail size={14} /> View Contact
                          </>
                        )}
                      </span>
                      <ChevronRight size={16} color="var(--text-sub)" />
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
        )}
      </div>

      {/* --- SIDEBAR & MODALS --- */}
      <div
        className={`sidebar-overlay ${showSidebar ? "active" : ""}`}
        onClick={closeSidebar}
      ></div>
      <div className={`right-sidebar ${showSidebar ? "active" : ""}`}>
        {selectedCandidate && (
          <>
            <div className="sb-header">
              <span className="sb-title-bar">Candidate Profile</span>
              <button className="sb-close" onClick={closeSidebar}>
                <X size={20} />
              </button>
            </div>

            <div className="sb-content">
              <div className="sb-hero">
                <div className="sb-hero-avatar">
                  {getCandidatePhoto(selectedCandidate) ? (
                    <img
                      src={getCandidatePhoto(selectedCandidate)}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    getInitials(selectedCandidate.fullName)
                  )}
                </div>
                <h2
                  className={
                    selectedCandidate.isMasked
                      ? "blur-text sb-hero-name"
                      : "sb-hero-name"
                  }
                >
                  {selectedCandidate.fullName || "Candidate Name"}
                </h2>
                <span className="sb-hero-role">
                  {selectedCandidate.headline || "Professional"}
                </span>

                <div className="sb-stats-strip">
                  <div className="sb-stat-item">
                    <span className="sb-stat-num">
                      {deriveExperienceString(selectedCandidate)}
                    </span>
                    <span className="sb-stat-txt">Experience</span>
                  </div>
                  <div className="sb-stat-item">
                    <span className="sb-stat-num">
                      {selectedCandidate.highestQualification ||
                        getCandidateEducation(selectedCandidate)[0]?.degree ||
                        "N/A"}
                    </span>
                    <span className="sb-stat-txt">Education</span>
                  </div>
                  <div className="sb-stat-item">
                    <span className="sb-stat-num">
                      {selectedCandidate.workMode || "Remote"}
                    </span>
                    <span className="sb-stat-txt">Mode</span>
                  </div>
                </div>
              </div>

              <div className="sb-body">
                <div>
                  <div className="sb-section-title">
                    <User size={16} className="sb-section-icon" /> About
                  </div>
                  <p className="sb-text-block">
                    {selectedCandidate.bio ||
                      selectedCandidate.headline ||
                      "No summary provided."}
                  </p>
                </div>

                <div>
                  <div className="sb-section-title">
                    <Briefcase size={16} className="sb-section-icon" /> Work
                    History
                  </div>
                  <div className="timeline-box">
                    {(() => {
                      const experience =
                        getCandidateExperience(selectedCandidate);
                      if (experience && experience.length > 0) {
                        return (
                          <div className="timeline">
                            {experience.map((exp, i) => (
                              <div key={i} className="tl-item">
                                <div className="tl-dot"></div>
                                <div className="tl-head">
                                  <div className="tl-title">{exp.title}</div>
                                  <div className="tl-date">
                                    {formatDate(exp.startDate)} -{" "}
                                    {exp.current
                                      ? "Present"
                                      : formatDate(exp.endDate)}
                                  </div>
                                </div>
                                <span className="tl-sub">{exp.company}</span>
                                {exp.description && (
                                  <p className="tl-desc">{exp.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      } else {
                        return (
                          <p
                            className="sb-text-block"
                            style={{ fontStyle: "italic", opacity: 0.6 }}
                          >
                            No work history listed.
                          </p>
                        );
                      }
                    })()}
                  </div>
                </div>

                <div>
                  <div className="sb-section-title">
                    <GraduationCap size={16} className="sb-section-icon" />{" "}
                    Education
                  </div>
                  <div className="timeline-box">
                    {(() => {
                      const education =
                        getCandidateEducation(selectedCandidate);
                      if (education && education.length > 0) {
                        return (
                          <div className="timeline">
                            {education.map((edu, i) => (
                              <div key={i} className="tl-item">
                                <div className="tl-dot"></div>
                                <div className="tl-head">
                                  <div className="tl-title">{edu.degree}</div>
                                  <div className="tl-date">{edu.year}</div>
                                </div>
                                <span className="tl-sub">
                                  {edu.institution}
                                </span>
                                {edu.grade && (
                                  <p className="tl-desc">Grade: {edu.grade}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      } else {
                        return (
                          <p
                            className="sb-text-block"
                            style={{ fontStyle: "italic", opacity: 0.6 }}
                          >
                            No education listed.
                          </p>
                        );
                      }
                    })()}
                  </div>
                </div>

                <div>
                  <div className="sb-section-title">
                    <Layout size={16} className="sb-section-icon" /> Skills
                  </div>
                  <div className="skill-container">
                    {selectedCandidate.skills?.map((s, i) => (
                      <span key={i} className="skill-chip">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="sb-contact-card">
                  <div
                    className="sb-section-title"
                    style={{ marginBottom: 20 }}
                  >
                    <Mail size={16} className="sb-section-icon" /> Contact
                    Details
                  </div>
                  <div style={{ position: "relative" }}>
                    <div
                      className={selectedCandidate.isMasked ? "blur-text" : ""}
                    >
                      <div className="c-item">
                        <Mail size={16} />{" "}
                        {getCandidateEmail(selectedCandidate)}
                      </div>
                      <div className="c-item">
                        <Phone size={16} />{" "}
                        {selectedCandidate.phone || "Not Provided"}
                      </div>
                      <div className="c-item">
                        <MapPin size={16} />{" "}
                        {selectedCandidate.location || "Location Unknown"}
                      </div>

                      {selectedCandidate.resumeUrl && (
                        <a
                          href={getFileUrl(selectedCandidate.resumeUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="c-item"
                          style={{
                            color: "var(--primary)",
                            textDecoration: "none",
                            cursor: "pointer",
                          }}
                          download
                        >
                          <Download size={16} /> Download Resume
                        </a>
                      )}
                    </div>

                    {selectedCandidate.isMasked && (
                      <div className="mask-overlay">
                        <Lock
                          size={32}
                          style={{ color: "#fff", marginBottom: 10 }}
                        />
                        <h4
                          style={{
                            margin: 0,
                            fontSize: 15,
                            color: "#fff",
                            fontWeight: 800,
                          }}
                        >
                          Private Information
                        </h4>
                        <p
                          style={{
                            fontSize: 13,
                            color: "rgba(255,255,255,0.7)",
                            margin: "5px 0 0",
                          }}
                        >
                          Use a credit to reveal contact details.
                        </p>

                        <button
                          className="btn-unlock"
                          onClick={triggerUnlockFlow}
                          disabled={unlocking}
                        >
                          {unlocking ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            "Unlock Profile (1 Credit)"
                          )}
                        </button>

                        {credits === 0 && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "#f87171",
                              marginTop: 10,
                              fontWeight: 700,
                            }}
                          >
                            Insufficient Balance
                          </span>
                        )}
                      </div>
                    )}
                    {!selectedCandidate.isMasked && (
                      <div
                        style={{
                          marginTop: 15,
                          borderRadius: 8,
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            padding: 10,
                            background: "rgba(16, 185, 129, 0.1)",
                            borderRadius: 8,
                            color: "#10b981",
                            fontSize: 12,
                            fontWeight: 700,
                            display: "flex",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          <CheckCircle size={14} /> Profile Unlocked
                        </div>

                        <button
                          className="btn-unlock"
                          style={{
                            marginTop: 10,
                            background: "var(--primary)",
                            color: "#fff",
                            width: "100%",
                            justifyContent: "center",
                          }}
                          onClick={() =>
                            navigate(`/candidate/${selectedCandidate._id}`)
                          }
                        >
                          View Full Profile <ExternalLink size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {modalConfig.isOpen && (
        <div className="custom-popup-overlay">
          <div className="custom-popup">
            <div className={`popup-icon-box ${modalConfig.type}`}>
              {modalConfig.type === "confirm" && <AlertTriangle size={32} />}
              {modalConfig.type === "insufficient" && <Coins size={32} />}
              {modalConfig.type === "error" && <Info size={32} />}
            </div>
            <h3 className="popup-title">{modalConfig.title}</h3>
            <p className="popup-desc">{modalConfig.message}</p>
            <div className="popup-actions">
              <button className="btn-popup btn-cancel" onClick={closePopup}>
                Cancel
              </button>
              {modalConfig.onConfirm && (
                <button
                  className="btn-popup btn-primary"
                  onClick={modalConfig.onConfirm}
                >
                  {modalConfig.confirmText}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalentPool;