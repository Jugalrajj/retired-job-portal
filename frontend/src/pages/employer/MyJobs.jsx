import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import useAuthStore from "../../context/useAuthStore";
import toast from "react-hot-toast"; // Added for notifications
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  MoreVertical,
  Users,
  Eye,
  Power,
  Trash2,
  RefreshCw,
  Layout,
  Calendar,
  X,
  CheckCircle,
  Coins,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from "lucide-react";

// --- EXISTING EXTEND MODAL (Preserved) ---
const ExtendModal = ({
  isOpen,
  onClose,
  onConfirm,
  jobTitle,
  currentCredits,
}) => {
  if (!isOpen) return null;

  const hasCredits = currentCredits > 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content scale-in">
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className={`icon-box ${hasCredits ? "blue" : "orange"}`}>
            {hasCredits ? <Calendar size={32} /> : <Coins size={32} />}
          </div>
          <h3>{hasCredits ? "Extend Job Listing" : "Insufficient Credits"}</h3>
        </div>

        <div className="modal-body">
          {hasCredits ? (
            <>
              <p>
                Extend <strong>"{jobTitle}"</strong> for 30 days?
              </p>
              <div className="info-box">
                <div className="credit-row">
                  <span>Current Balance:</span>
                  <strong>{currentCredits} Credits</strong>
                </div>
                <div className="credit-row cost">
                  <span>Cost:</span>
                  <strong>-1 Credit</strong>
                </div>
                <div className="divider"></div>
                <ul>
                  <li>
                    <CheckCircle size={14} /> Extends validity by 30 days
                  </li>
                  <li>
                    <CheckCircle size={14} /> Boosts to top of search results
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <p>
                You need <strong>1 Job Credit</strong> to extend this listing.
              </p>
              <div className="info-box warning">
                <div className="credit-row">
                  <span>Current Balance:</span>
                  <strong>{currentCredits} Credits</strong>
                </div>
                <p style={{ marginTop: 10, fontSize: 13 }}>
                  Please purchase a credit pack to continue managing your active
                  jobs.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          {hasCredits ? (
            <button className="btn-confirm" onClick={onConfirm}>
              Confirm (-1 Credit)
            </button>
          ) : (
            <Link to="/billing" className="btn-confirm buy">
              Buy Credits
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// --- NEW: CONFIRMATION MODAL (For Delete / Critical Actions) ---
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = "danger" }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content scale-in">
        <button className="close-btn" onClick={onClose}><X size={20}/></button>
        
        <div className="modal-header">
          <div className={`icon-box ${type === 'danger' ? 'red' : 'blue'}`}>
            {type === 'danger' ? <AlertTriangle size={32} /> : <CheckCircle size={32} />}
          </div>
          <h3>{title}</h3>
        </div>

        <div className="modal-body">
          <p>{message}</p>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button 
            className={`btn-confirm ${type === 'danger' ? 'danger' : ''}`} 
            onClick={onConfirm}
          >
            {type === 'danger' ? 'Yes, Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MyJobs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get User for Credit Balance
  const { user, refreshUser } = useAuthStore();
  const currentCredits = user?.user?.credits || 0;

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [activeMenuJobId, setActiveMenuJobId] = useState(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // --- MODAL STATES ---
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [targetJobId, setTargetJobId] = useState(null);
  const [targetJobTitle, setTargetJobTitle] = useState("");

  // New Action Modal State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    fetchJobs();
    if (refreshUser) refreshUser();
  }, []);

  // Handle URL Params from Email (Deep Linking)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get("action");
    const jobId = params.get("jobId");

    if (action === "extend" && jobId && !loading && jobs.length > 0) {
      const targetJob = jobs.find((j) => j._id === jobId);
      if (targetJob) {
        openExtendModal(jobId, targetJob.title);
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.search, loading, jobs]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuJobId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Search & Filter Logic
  useEffect(() => {
    let result = jobs;
    if (searchTerm) {
      result = jobs.filter((job) => {
        const search = searchTerm.toLowerCase();
        const titleMatch = job.title
          ? job.title.toLowerCase().includes(search)
          : false;

        let locationString = "Remote";
        if (Array.isArray(job.locations) && job.locations.length > 0) {
          locationString = job.locations.join(" ");
        } else if (job.location) {
          locationString = job.location;
        }

        const locationMatch = locationString.toLowerCase().includes(search);
        return titleMatch || locationMatch;
      });
    }
    setFilteredJobs(result);
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, jobs]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/jobs/employer/posted");
      const sortedJobs = res.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setJobs(sortedJobs);
      setFilteredJobs(sortedJobs);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
      toast.error("Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  };

  // --- PAGINATION LOGIC ---
  const indexOfLastJob = currentPage * itemsPerPage;
  const indexOfFirstJob = indexOfLastJob - itemsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleMenu = (e, jobId) => {
    e.stopPropagation();
    setActiveMenuJobId((prevId) => (prevId === jobId ? null : jobId));
  };

  // --- HANDLERS ---

  const openExtendModal = (jobId, jobTitle) => {
    setTargetJobId(jobId);
    setTargetJobTitle(jobTitle);
    setShowExtendModal(true);
    setActiveMenuJobId(null);
  };

  const handleConfirmExtension = async () => {
    if (!targetJobId) return;

    try {
      await api.post("/jobs/extend", { jobId: targetJobId, days: 30 });
      if (refreshUser) await refreshUser();
      
      setJobs((prev) =>
        prev.map((j) => (j._id === targetJobId ? { ...j, isActive: true } : j)),
      );
      setShowExtendModal(false);
      fetchJobs();
      toast.success("Job extended successfully!");
    } catch (err) {
      console.error("Failed to extend job", err);
      toast.error(err.response?.data?.message || "Failed to extend job.");
      setShowExtendModal(false);
    }
  };

  const handleStatusToggle = async (e, job) => {
    e.stopPropagation();
    const newStatus = !job.isActive;
    const previousJobs = [...jobs];
    
    // Optimistic UI Update
    const updateLocalState = (list) =>
      list.map((j) => (j._id === job._id ? { ...j, isActive: newStatus } : j));
    setJobs((prev) => updateLocalState(prev));
    setFilteredJobs((prev) => updateLocalState(prev));
    setActiveMenuJobId(null);

    try {
      await api.patch(`/jobs/${job._id}/status`, { isActive: newStatus });
      toast.success(`Job marked as ${newStatus ? 'Active' : 'Closed'}`);
    } catch (err) {
      console.error("Failed to update status", err);
      setJobs(previousJobs); // Revert
      setFilteredJobs(previousJobs);
      toast.error("Failed to update job status.");
    }
  };

  const handleDeleteClick = (e, jobId) => {
    e.stopPropagation();
    setActiveMenuJobId(null);
    
    setActionModal({
        isOpen: true,
        type: 'danger',
        title: 'Delete Job Listing?',
        message: 'Are you sure you want to delete this job? This action cannot be undone and all applicant data associated with this job will be lost.',
        onConfirm: () => executeDelete(jobId)
    });
  };

  const executeDelete = async (jobId) => {
    // Close Modal
    setActionModal(prev => ({ ...prev, isOpen: false }));

    try {
      await api.delete(`/jobs/${jobId}`);
      
      const remainingJobs = jobs.filter((j) => j._id !== jobId);
      setJobs(remainingJobs);
      setFilteredJobs(remainingJobs); // Also filter the filtered list
      
      toast.success("Job deleted successfully.");
    } catch (err) {
      console.error("Failed to delete job", err);
      toast.error("Failed to delete job.");
    }
  };

  return (
    <div className="dark-jobs-wrapper">
      
      {/* Extension Modal */}
      <ExtendModal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        onConfirm={handleConfirmExtension}
        jobTitle={targetJobTitle}
        currentCredits={currentCredits}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ ...actionModal, isOpen: false })}
        onConfirm={actionModal.onConfirm}
        title={actionModal.title}
        message={actionModal.message}
        type={actionModal.type}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        .dark-jobs-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root);
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          padding: 40px 20px;
          display: flex; justify-content: center;
          color: var(--text-main);
          transition: background-color 0.3s ease;
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
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          min-height: 80vh;
          z-index: 5;
        }

        .designer-strip {
          height: 4px; width: 100%;
          background: linear-gradient(90deg, #4f46e5 0%, var(--primary) 100%);
        }

        .page-header { 
          padding: 32px 40px; 
          border-bottom: 1px solid var(--border);
          background: var(--bg-input);
          display: flex; justify-content: space-between; align-items: center; 
          flex-wrap: wrap; gap: 20px;
        }

        .header-content { display: flex; align-items: center; gap: 16px; }
        .header-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: var(--primary-dim); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border);
        }
        .header-titles h1 { 
          font-family: 'Playfair Display', serif; font-size: 28px; 
          font-weight: 700; color: var(--text-main); margin: 0; 
        }
        .header-titles p { font-size: 14px; color: var(--text-sub); margin: 4px 0 0; }

        .btn-primary { 
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: white; padding: 12px 24px; border: none;
          border-radius: 12px; text-decoration: none; font-weight: 700; 
          display: flex; align-items: center; gap: 8px; transition: 0.2s; 
          box-shadow: 0 4px 15px var(--primary-dim); font-size: 14px;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px var(--primary-dim); }

        .toolbar { 
          padding: 24px 40px 0; 
          display: flex; justify-content: space-between; align-items: center; 
          flex-wrap: wrap; gap: 16px; 
        }

        .search-container { position: relative; width: 320px; max-width: 100%; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-sub); }
        .search-input { 
          width: 100%; padding: 12px 12px 12px 42px; 
          border: 1px solid var(--border); border-radius: 12px; 
          outline: none; font-size: 14px; font-weight: 500; color: var(--text-main);
          transition: 0.2s; background: var(--bg-input);
        }
        .search-input:focus { border-color: var(--primary); background: var(--bg-card); }

        .toolbar-actions { display: flex; gap: 12px; align-items: center; }
       
        .icon-btn { background: none; border: 1px solid var(--border); padding: 8px; border-radius: 8px; color: var(--text-sub); cursor: pointer; transition: 0.2s; }
        .icon-btn:hover { background: var(--bg-input); color: var(--text-main); }

        .per-page-select {
          background: var(--bg-input); color: var(--text-sub); border: 1px solid var(--border);
          padding: 8px 12px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; outline: none;
        }

        .stats-pill { 
          background: var(--primary-dim); padding: 8px 16px; border-radius: 20px; 
          font-size: 13px; color: var(--primary); font-weight: 700; border: 1px solid var(--primary);
        }

        .content-area { padding: 30px 40px; flex: 1; }
        .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; padding-bottom: 40px; }
        
        .job-card { 
          background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; 
          padding: 24px; transition: all 0.3s ease; display: flex; flex-direction: column; gap: 20px; 
          position: relative; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .job-card:hover { 
          transform: translateY(-4px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15); 
          border-color: var(--primary);
        }
        
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .job-title { margin: 0 0 8px; font-size: 18px; color: var(--text-main); font-weight: 700; line-height: 1.3; }
        .job-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; color: var(--text-sub); align-items: center; font-weight: 500; }
        .meta-item { display: flex; align-items: center; gap: 5px; }
        
        .menu-container { position: relative; }
        .menu-btn { 
          background: transparent; border: none; cursor: pointer; color: var(--text-sub); 
          padding: 8px; border-radius: 8px; transition: 0.2s; display: flex; 
        }
        .menu-btn:hover, .menu-btn.active { background: var(--bg-input); color: var(--text-main); }
        
        .dropdown-menu {
          position: absolute; right: 0; top: 40px; 
          background: var(--bg-card); border: 1px solid var(--border); 
          border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
          width: 180px; z-index: 50; padding: 6px; animation: fadeIn 0.1s ease-out;
        }
        .dropdown-item {
          width: 100%; text-align: left; padding: 10px 12px;
          background: none; border: none; cursor: pointer;
          font-size: 13px; color: var(--text-main); font-weight: 600;
          display: flex; align-items: center; gap: 10px;
          transition: 0.1s; border-radius: 8px;
        }
        .dropdown-item:hover { background: var(--bg-input); }
        .dropdown-item.text-red { color: var(--danger); }
        .dropdown-item.text-red:hover { background: rgba(239, 68, 68, 0.1); }
        .dropdown-item.text-blue { color: #2563eb; }
        .dropdown-item.text-blue:hover { background: #eff6ff; }

        .card-stats { 
          display: flex; background: var(--bg-input); border-radius: 12px; 
          padding: 16px 0; justify-content: space-evenly; border: 1px solid var(--border); 
        }
        .stat-box { display: flex; flex-direction: column; align-items: center; }
        .stat-val { font-weight: 800; font-size: 18px; color: var(--text-main); }
        .stat-label { font-size: 11px; text-transform: uppercase; color: var(--text-sub); font-weight: 700; margin-top: 4px; letter-spacing: 0.5px; }
        
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .status-badge.active { background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); }
        .status-badge.closed { background: var(--bg-card); color: var(--text-sub); border: 1px solid var(--border); }

        .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: auto; }
        
        .btn-outline { 
          background: transparent; border: 1px solid var(--border); color: var(--text-main); 
          padding: 10px; border-radius: 10px; font-weight: 700; cursor: pointer; 
          display: flex; align-items: center; justify-content: center; gap: 8px; 
          transition: 0.2s; font-size: 13px; text-decoration: none; 
        }
        .btn-outline:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-dim); }
        
        .btn-ghost { 
          background: transparent; border: 1px solid transparent; color: var(--text-sub); 
          font-weight: 600; cursor: pointer; display: flex; align-items: center; 
          justify-content: center; gap: 8px; font-size: 13px; text-decoration: none; 
          transition: 0.2s; 
        }
        .btn-ghost:hover { color: var(--text-main); background: var(--bg-input); border-radius: 10px; border-color: var(--border); }

        /* --- PAGINATION STYLING --- */
        .pagination-container {
          display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 20px; padding-bottom: 20px;
        }
        .page-btn {
          width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-card);
          color: var(--text-main); font-weight: 700; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.3s;
        }
        .page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); transform: translateY(-2px); }
        .page-btn.active { background: var(--primary); color: #000; border-color: var(--primary); }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .loading-state, .empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 80px 20px; text-align: center; color: var(--text-sub); gap: 16px;
        }
        .empty-state { background: var(--bg-card); border-radius: 16px; border: 1px dashed var(--border); }
        .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

        /* --- MODAL STYLES (SHARED) --- */
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; animation: fadeIn 0.2s ease-out;
        }
        .modal-content {
          background: var(--bg-card); border: 1px solid var(--border);
          width: 90%; max-width: 400px; border-radius: 20px;
          padding: 24px; position: relative;
          box-shadow: 0 20px 50px -10px rgba(0,0,0,0.3);
          color: var(--text-main);
        }
        .close-btn {
          position: absolute; top: 16px; right: 16px;
          background: transparent; border: none; color: var(--text-sub);
          cursor: pointer; padding: 4px; border-radius: 50%;
          transition: 0.2s;
        }
        .close-btn:hover { background: var(--bg-input); color: var(--text-main); }
        
        .modal-header { text-align: center; margin-bottom: 20px; }
        .icon-box {
          width: 60px; height: 60px; border-radius: 50%; 
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px; 
        }
        .icon-box.blue { background: #eff6ff; color: #2563eb; border: 4px solid #dbeafe; }
        .icon-box.orange { background: #fff7ed; color: #f97316; border: 4px solid #ffedd5; }
        .icon-box.red { background: #fef2f2; color: #ef4444; border: 4px solid #fee2e2; }

        .modal-header h3 { margin: 0; font-size: 20px; font-weight: 700; }
        
        .modal-body { text-align: center; margin-bottom: 24px; }
        .modal-body p { color: var(--text-sub); font-size: 15px; margin-bottom: 16px; line-height: 1.5; }
        
        .info-box {
          background: var(--bg-input); padding: 16px; border-radius: 12px;
          text-align: left; font-size: 13px; color: var(--text-sub);
          border: 1px solid var(--border);
        }
        .info-box.warning { background: #fff1f2; border-color: #fecdd3; color: #9f1239; }
        
        .credit-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .credit-row.cost { color: #ef4444; }
        .divider { height: 1px; background: var(--border); margin: 10px 0; }

        .info-box ul { list-style: none; padding: 0; margin: 0; }
        .info-box li { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .info-box li:last-child { margin-bottom: 0; }
        .info-box li svg { color: #10b981; flex-shrink: 0; }

        .modal-footer { display: flex; gap: 12px; }
        .btn-cancel {
          flex: 1; padding: 12px; border: 1px solid var(--border);
          background: transparent; border-radius: 10px;
          font-weight: 600; color: var(--text-sub); cursor: pointer;
          transition: 0.2s;
        }
        .btn-cancel:hover { background: var(--bg-input); color: var(--text-main); }
        
        .btn-confirm {
          flex: 1; padding: 12px; border: none;
          background: #2563eb; color: white; border-radius: 10px;
          font-weight: 600; cursor: pointer; transition: 0.2s;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        .btn-confirm:hover { background: #1d4ed8; transform: translateY(-1px); }
        
        .btn-confirm.danger { background: #ef4444; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
        .btn-confirm.danger:hover { background: #dc2626; }

        .btn-confirm.buy {
            background: #f59e0b; color: #fff; text-decoration: none; display: flex; 
            align-items: center; justify-content: center;
        }
        .btn-confirm.buy:hover { background: #d97706; }

        .scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        @media (max-width: 768px) {
          .designer-container { border-width: 0; border-radius: 0; height: auto; box-shadow: none; }
          .dark-jobs-wrapper { padding: 0; }
          .page-header { padding: 20px; flex-direction: column; align-items: stretch; }
          .toolbar { padding: 0 20px; flex-direction: column; align-items: flex-start; }
          .search-container { width: 100%; }
          .toolbar-actions { width: 100%; justify-content: space-between; margin-top: 10px; }
          .content-area { padding: 20px; }
          .jobs-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="designer-container">
        <div className="designer-strip"></div>

        <div className="page-header">
          <div className="header-content">
            <div className="header-icon">
              <Layout size={24} />
            </div>
            <div className="header-titles">
              <h1>My Job Listings</h1>
              <p>Manage your posted jobs and track their status.</p>
            </div>
          </div>
          <Link to="/post-job" className="btn-primary">
            <Plus size={18} /> Post New Job
          </Link>
        </div>

        <div className="toolbar">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="toolbar-actions">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="per-page-select"
            >
              <option value={6}>Show 6</option>
              <option value={12}>Show 12</option>
              <option value={24}>Show 24</option>
              <option value={48}>Show 48</option>
            </select>

            <button
              className="icon-btn"
              onClick={fetchJobs}
              title="Refresh List"
            >
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
            <div className="stats-pill">{filteredJobs.length} Jobs</div>
          </div>
        </div>

        <div className="content-area">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Loading your jobs...</span>
            </div>
          ) : filteredJobs.length > 0 ? (
            <>
              <div className="jobs-grid">
                {currentJobs.map((job) => (
                  <div key={job._id} className="job-card">
                    <div className="card-header">
                      <div>
                        <h3 className="job-title">{job.title}</h3>
                        <div className="job-meta">
                          <span className="meta-item">
                            <MapPin size={14} />
                            {Array.isArray(job.locations) &&
                            job.locations.length > 0
                              ? job.locations.join(", ")
                              : job.location || "Remote"}
                          </span>
                          <span className="meta-item">
                            <Briefcase size={14} /> {job.workType}
                          </span>
                        </div>
                      </div>

                      <div className="menu-container">
                        <button
                          className={`menu-btn ${activeMenuJobId === job._id ? "active" : ""}`}
                          onClick={(e) => toggleMenu(e, job._id)}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeMenuJobId === job._id && (
                          <div className="dropdown-menu">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openExtendModal(job._id, job.title);
                              }}
                              className="dropdown-item text-blue"
                            >
                              <Calendar size={14} /> Extend/Renew
                            </button>
                            <button
                              onClick={(e) => handleStatusToggle(e, job)}
                              className="dropdown-item"
                            >
                              <Power
                                size={14}
                                className={
                                  job.isActive ? "text-orange" : "text-green"
                                }
                              />
                              {job.isActive ? "Deactivate Job" : "Activate Job"}
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, job._id)}
                              className="dropdown-item text-red"
                            >
                              <Trash2 size={14} /> Delete Job
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card-stats">
                      <div className="stat-box">
                        <span className="stat-val">
                          {job.detailedApplicants?.length || 0}
                        </span>
                        <span className="stat-label">Applicants</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-val text-green">
                          {job.views || 0}
                        </span>
                        <span className="stat-label">Views</span>
                      </div>
                      <div className="stat-box">
                        <span
                          className={`status-badge ${job.isActive ? "active" : "closed"}`}
                        >
                          {job.isActive ? "Active" : "Closed"}
                        </span>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        onClick={() =>
                          navigate("/employer-applications", {
                            state: { selectedJobId: job._id },
                          })
                        }
                        className="btn-outline"
                      >
                        <Users size={16} /> View Applicants
                      </button>
                      <Link to={`/jobs/${job._id}`} className="btn-ghost">
                        <Eye size={16} /> View Job
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* --- PAGINATION CONTROLS --- */}
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
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div
                style={{
                  background: "var(--primary-dim)",
                  padding: 20,
                  borderRadius: "50%",
                  marginBottom: 15,
                  border: "1px solid var(--primary)",
                }}
              >
                <Briefcase size={32} color="var(--primary)" />
              </div>
              <h3 style={{ margin: "0 0 5px", color: "var(--text-main)" }}>
                No jobs found
              </h3>
              <p style={{ margin: 0, fontSize: 14 }}>
                You haven't posted any jobs matching your search.
              </p>
              <Link
                to="/post-job"
                className="btn-primary"
                style={{ marginTop: 15 }}
              >
                Post your first job
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyJobs;