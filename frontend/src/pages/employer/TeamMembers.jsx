import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { 
  Users, Plus, Mail, Trash2, Shield, Check, X, 
  Briefcase, FileText, CheckCircle, Lock, Key, Pencil, 
  AlertCircle, CheckCircle2, Layout, Search, ChevronLeft, ChevronRight
} from "lucide-react";

// Permission Definitions
const PERMISSIONS_LIST = [
  { id: "post_jobs", label: "Post Jobs", icon: <Briefcase size={14}/>, desc: "Create/Edit jobs." },
  { id: "view_applications", label: "View Apps", icon: <FileText size={14}/>, desc: "See candidate profiles." },
  { id: "view_talent_pool", label: "Talent Pool", icon: <Search size={14}/>, desc: "Search candidates." }, 
  { id: "update_status", label: "Update Status", icon: <CheckCircle size={14}/>, desc: "Shortlist/Reject." },
  { id: "manage_team", label: "Manage Team", icon: <Users size={14}/>, desc: "Invite members." },
];

const TeamMembers = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [inviteData, setInviteData] = useState({ 
    name: "", email: "", password: "", role: "recruiter", permissions: [] 
  });
  
  // State for the member currently being edited
  const [editingMember, setEditingMember] = useState(null);
  const [editPermissions, setEditPermissions] = useState([]);

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // --- SEARCH & PAGINATION STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  useEffect(() => {
    fetchTeam();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const fetchTeam = async () => {
    try {
      const res = await api.get("/jobs/team");
      setTeam(res.data || []);
    } catch (err) {
      console.error("Fetch team error", err);
      showToast("Failed to load team members", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- FILTER & PAGINATION LOGIC ---
  const filteredTeam = team.filter((member) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return (
      member.name.toLowerCase().includes(lowerTerm) ||
      member.email.toLowerCase().includes(lowerTerm)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = filteredTeam.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTeam.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); 
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // --- PERMISSION HANDLERS ---
  
  const toggleInvitePermission = (permId) => {
    setInviteData(prev => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists 
          ? prev.permissions.filter(p => p !== permId) 
          : [...prev.permissions, permId]
      };
    });
  };

  const toggleEditPermission = (permId) => {
    setEditPermissions(prev => {
      if (prev.includes(permId)) return prev.filter(p => p !== permId);
      return [...prev, permId];
    });
  };

  // --- ACTION HANDLERS ---

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...inviteData,
        permissions: inviteData.role === 'admin' ? [] : inviteData.permissions
      };
      await api.post("/jobs/team/invite", payload);
      
      showToast("Invitation sent successfully!", "success");
      
      setShowInviteModal(false);
      setInviteData({ name: "", email: "", password: "", role: "recruiter", permissions: [] });
      fetchTeam(); 
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to invite member", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (member) => {
    setEditingMember(member);
    setEditPermissions(member.permissions || []);
    setShowEditModal(true);
  };

  const handleUpdatePermissions = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/jobs/team/${editingMember._id}/permissions`, {
        permissions: editPermissions
      });
      
      showToast("Permissions updated successfully!", "success");
      
      setShowEditModal(false);
      setEditingMember(null);
      fetchTeam();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update permissions", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (memberId) => {
    if(!window.confirm("Are you sure you want to remove this member? Access will be revoked immediately.")) return;
    try {
      await api.delete(`/jobs/team/${memberId}`);
      setTeam(team.filter(m => m._id !== memberId));
      showToast("Member removed successfully", "success");
    } catch (err) {
      showToast("Failed to remove member", "error");
    }
  };

  return (
    <div className="dark-team-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        /* --- PAGE WRAPPER --- */
        .dark-team-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root); /* 櫨 Theme Var */
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          padding: 40px 20px;
          display: flex; justify-content: center;
          color: var(--text-main); /* 櫨 Theme Var */
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
          background: var(--bg-card); /* 櫨 Theme Var */
          backdrop-filter: blur(12px);
          border: 1px solid var(--border); /* 櫨 Theme Var */
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          min-height: 80vh;
          z-index: 5;
        }

        /* Top Accent Strip */
        .designer-strip {
          height: 4px; width: 100%;
          background: linear-gradient(90deg, #4f46e5 0%, var(--primary) 100%);
        }

        .content-area {
          padding: 40px;
          flex: 1; display: flex; flex-direction: column;
        }

        /* --- HEADER --- */
        .page-header { 
          display: flex; justify-content: space-between; align-items: center; 
          margin-bottom: 24px; flex-wrap: wrap; gap: 20px; 
          border-bottom: 1px solid var(--border);
          padding-bottom: 24px;
          background: var(--bg-input); /* 櫨 Theme Var */
        }
        .header-content { display: flex; align-items: center; gap: 16px; }
        .header-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: var(--primary-dim); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border);
        }
        .page-title { 
          font-family: 'Playfair Display', serif;
          font-size: 26px; font-weight: 800; color: var(--text-main); margin: 0; 
        }
        .page-subtitle { color: var(--text-sub); font-size: 15px; margin: 4px 0 0; }
        
        .btn-primary { 
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: white; padding: 12px 24px; border-radius: 10px; border:none; 
          display: flex; align-items: center; gap: 8px; font-weight: 700; 
          cursor: pointer; transition: 0.2s; white-space: nowrap; font-size: 14px; 
          box-shadow: 0 4px 15px var(--primary-dim);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px var(--primary-dim); }

        /* --- CONTROLS ROW --- */
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
        }
        .search-box input {
          background: transparent; border: none; outline: none;
          color: var(--text-main); font-size: 14px; width: 100%;
          margin-left: 8px;
        }
        .right-controls { display: flex; align-items: center; gap: 16px; }
        .per-page-select {
          background: var(--bg-input); color: var(--text-sub);
          border: 1px solid var(--border); padding: 6px 12px;
          border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; outline: none;
        }
        .results-text { font-size: 13px; color: var(--text-sub); }

        /* --- CONTENT --- */
        .loading-state, .empty-state { text-align: center; padding: 60px; color: var(--text-sub); display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }
        .spinner { width: 30px; height: 30px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .empty-state { background: var(--bg-card); border-radius: 16px; border: 1px dashed var(--border); padding: 60px; }
        .empty-icon { width: 70px; height: 70px; background: var(--bg-input); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-sub); margin-bottom: 20px; border: 1px solid var(--border); }
        .empty-state h3 { margin: 0 0 8px; color: var(--text-main); font-size: 18px; font-weight: 700; }
        .empty-state p { margin: 0 0 20px; font-size: 14px; }
        .btn-outline { background: transparent; border: 1px solid var(--border); padding: 10px 20px; border-radius: 10px; font-weight: 700; color: var(--text-main); cursor: pointer; transition: 0.2s; }
        .btn-outline:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-dim); }

        /* --- MEMBER GRID --- */
        .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; padding-bottom: 20px; }
        
        .member-card { 
          background: var(--bg-card); /* 櫨 Theme Var */
          border: 1px solid var(--border); border-radius: 16px; 
          padding: 24px; transition: 0.2s; display: flex; flex-direction: column; 
          position: relative; box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .member-card:hover { border-color: var(--primary); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); transform: translateY(-2px); }
        
        .card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 16px; }
        .member-avatar { 
          width: 44px; height: 44px; background: var(--bg-input); color: var(--primary); 
          border-radius: 12px; display: flex; align-items: center; justify-content: center; 
          font-weight: 800; font-size: 18px; border: 1px solid var(--border); flex-shrink: 0; 
        }
        .member-avatar.small { width: 36px; height: 36px; font-size: 14px; border-radius: 8px; }
        
        .member-info { overflow: hidden; flex: 1; }
        .member-info h4 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .member-info p { margin: 4px 0 0; font-size: 13px; color: var(--text-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .card-actions { margin-left: auto; display: flex; gap: 8px; }
        .btn-icon { background: var(--bg-input); border: 1px solid var(--border); cursor: pointer; padding: 8px; border-radius: 8px; color: var(--text-sub); transition: 0.2s; display: flex; }
        .btn-icon:hover { border-color: var(--primary); color: var(--primary); }
        .btn-icon.delete:hover { border-color: var(--danger); color: var(--danger); background: rgba(239, 68, 68, 0.1); }

        .card-body { display: flex; flex-direction: column; gap: 16px; flex: 1; }

        .role-badge-row { display: flex; justify-content: space-between; align-items: center; }
        .role-pill { 
          display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; 
          border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; 
        }
        .role-pill.admin { background: var(--primary-dim); color: var(--primary); border: 1px solid var(--primary); }
        .role-pill.recruiter { background: var(--bg-input); color: var(--text-sub); border: 1px solid var(--border); }
        
        .status-dot { font-size: 12px; font-weight: 600; color: var(--success); display: flex; align-items: center; gap: 6px; }
        .status-dot::before { content: ""; width: 6px; height: 6px; background: var(--success); border-radius: 50%; display: block; box-shadow: 0 0 8px var(--success); }

        .permissions-list { margin-top: auto; background: var(--bg-input); padding: 12px; border-radius: 12px; border: 1px solid var(--border); }
        .perm-label { font-size: 11px; color: var(--text-sub); margin: 0 0 8px; font-weight: 700; text-transform: uppercase; }
        .tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .perm-tag { 
          background: var(--bg-card); border: 1px solid var(--border); padding: 4px 8px; 
          border-radius: 6px; font-size: 11px; color: var(--text-main); font-weight: 600; 
        }
        .text-muted { font-size: 11px; color: var(--text-sub); font-style: italic; }

        /* --- PAGINATION --- */
        .pagination-container { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 20px; padding-bottom: 20px; }
        .page-btn {
          width: 40px; height: 40px; border-radius: 10px;
          border: 1px solid var(--border); background: var(--bg-card);
          color: var(--text-main); font-weight: 700; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.3s;
        }
        .page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); transform: translateY(-2px); }
        .page-btn.active { background: var(--primary); color: #000; border-color: var(--primary); }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .page-info { font-size: 14px; color: var(--text-sub); font-weight: 600; }

        /* --- TOAST --- */
        .toast-popup {
          position: fixed; top: 20px; right: 20px; padding: 16px 24px; border-radius: 12px; 
          background: var(--bg-card); padding: 12px 24px; border-radius: 50px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 16px;
          z-index: 9999; animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          min-width: 320px; border: 1px solid var(--border);
        }
        .toast-popup.success { border-left: 5px solid var(--success); }
        .toast-popup.error { border-left: 5px solid var(--danger); }
        .toast-content { display: flex; align-items: center; gap: 10px; flex: 1; font-weight: 600; font-size: 14px; color: var(--text-main); }
        .toast-popup.success svg { color: var(--success); } .toast-popup.error svg { color: var(--danger); }
        .toast-close { background: none; border: none; cursor: pointer; color: var(--text-sub); padding: 4px; border-radius: 50%; }
        @keyframes slideDown { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

        /* --- COMPACT MODAL STYLES --- */
        .modal-backdrop { 
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); 
          backdrop-filter: blur(8px); z-index: 100; display: flex; 
          justify-content: center; align-items: center; padding: 20px; 
        }
        
        .modal-content { 
          background: var(--bg-card); width: 100%; max-width: 440px; border-radius: 20px; 
          box-shadow: 0 20px 50px -10px rgba(0,0,0,0.3); overflow: hidden; 
          display: flex; flex-direction: column; border: 1px solid var(--border);
          height: auto; max-height: 85vh; 
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .modal-top { 
          padding: 16px 24px; border-bottom: 1px solid var(--border); 
          display: flex; justify-content: space-between; align-items: center; 
          background: var(--bg-input); flex-shrink: 0; 
        }
        .modal-top h3 { margin: 0; font-size: 16px; font-weight: 800; color: var(--text-main); }
        .btn-close { background: var(--bg-card); border: 1px solid var(--border); cursor: pointer; color: var(--text-sub); padding: 5px; border-radius: 6px; display: flex; transition: 0.2s; }
        .btn-close:hover { border-color: var(--danger); color: var(--danger); }

        /* Compact Form Padding */
        .modal-form { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; }
        
        .form-grid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-group label { display: block; font-size: 12px; font-weight: 700; color: var(--text-main); margin-bottom: 6px; }
        
        .input-wrap { position: relative; }
        .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-sub); width: 16px; }
        .input-wrap input { 
          width: 100%; padding: 10px 10px 10px 36px; border: 1px solid var(--border); 
          border-radius: 8px; font-size: 13px; outline: none; transition: 0.2s; 
          box-sizing: border-box; font-weight: 500; color: var(--text-main);
          background: var(--bg-input);
        }
        .input-wrap input:focus { border-color: var(--primary); background: var(--bg-card); }

        /* Role Selector */
        .role-selector { display: flex; gap: 10px; }
        .role-option { 
          flex: 1; display: flex; align-items: center; gap: 8px; padding: 8px; 
          border: 1px solid var(--border); border-radius: 8px; background: var(--bg-input); 
          cursor: pointer; transition: 0.2s; 
        }
        .role-option:hover { border-color: var(--text-main); }
        .role-option.selected { border-color: var(--primary); background: var(--primary-dim); }
        
        .radio-circle { width: 14px; height: 14px; border: 2px solid var(--text-sub); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .role-option.selected .radio-circle { border-color: var(--primary); }
        .role-option.selected .dot { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; }
        .role-text { font-size: 13px; font-weight: 600; color: var(--text-main); }

        /* Permission Grid - Compact */
        .permissions-section { animation: fadeIn 0.2s ease; margin-top: 4px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .perm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        
        .perm-card { 
          border: 1px solid var(--border); border-radius: 8px; padding: 8px; 
          cursor: pointer; transition: 0.2s; position: relative; display: flex; 
          align-items: center; justify-content: center; height: 38px; background: var(--bg-input);
        }
        .perm-card:hover { border-color: var(--text-sub); }
        .perm-card.active { border-color: var(--primary); background: var(--primary-dim); }
        
        .perm-header { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 12px; color: var(--text-main); }
        .perm-header svg { color: var(--text-sub); }
        .perm-card.active .perm-header svg { color: var(--primary); }
        
        .check-corner { position: absolute; top: -5px; right: -5px; background: var(--primary); color: #fff; width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--bg-card); }

        /* Modal Footer */
        .modal-footer { padding-top: 10px; border-top: 1px solid var(--border); flex-shrink: 0; margin-top: 4px; }
        .btn-primary-full { width: 100%; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%); color: white; border: none; border-radius: 10px; padding: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 14px; box-shadow: 0 4px 15px var(--primary-dim); }
        .btn-primary-full:hover { transform: translateY(-1px); }
        .btn-primary-full:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Edit Modal Preview */
        .user-preview { display: flex; gap: 10px; align-items: center; background: var(--bg-input); padding: 10px; border-radius: 10px; margin-bottom: 14px; border: 1px solid var(--border); }
        .font-bold { font-weight: 700; font-size: 13px; color: var(--text-main); }
        .text-sm { font-size: 12px; color: var(--text-sub); }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .dark-team-wrapper { padding: 0; }
          .designer-container { border-width: 0; border-radius: 0; height: auto; }
          .content-area { padding: 20px; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .header-content { width: 100%; }
          .btn-primary { width: 100%; justify-content: center; }
          .form-grid-row { grid-template-columns: 1fr; }
          .perm-grid { grid-template-columns: 1fr; }
          .controls-row { flex-direction: column; align-items: flex-start; gap: 12px; }
          .search-box { width: 100%; }
          .right-controls { width: 100%; justify-content: space-between; }
        }
      `}</style>

      {/* BACKGROUND ELEMENTS */}
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="designer-container">
        {/* Decorative Strip */}
        <div className="designer-strip"></div>
        
        {/* Toast */}
        {toast.show && (
          <div className={`toast-popup ${toast.type}`}>
            <div className="toast-content">
              {toast.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span>{toast.message}</span>
            </div>
            <button onClick={() => setToast({ ...toast, show: false })} className="toast-close">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="content-area">
          {/* HEADER */}
          <div className="page-header">
            <div className="header-content">
              <div className="header-icon">
                <Layout size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="page-title">Team Management</h1>
                <p className="page-subtitle">Collaborate and manage permissions.</p>
              </div>
            </div>
            <button onClick={() => setShowInviteModal(true)} className="btn-primary">
              <Plus size={18} /> Invite Member
            </button>
          </div>

          {/* CONTROLS ROW */}
          {!loading && team.length > 0 && (
            <div className="controls-row">
               <div className="search-box">
                  <Search size={16} color="var(--text-sub)"/>
                  <input 
                    type="text" 
                    placeholder="Search by name or email..." 
                    value={searchTerm}
                    onChange={handleSearch}
                  />
               </div>

               <div className="right-controls">
                  <span className="results-text">
                    Showing <b>{currentMembers.length}</b> of <b>{filteredTeam.length}</b>
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

          {/* CONTENT */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your team...</p>
            </div>
          ) : filteredTeam.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Search size={32}/></div>
              <h3>No members found</h3>
              <p>Try adjusting your search criteria.</p>
            </div>
          ) : (
            <>
              <div className="team-grid">
                {currentMembers.map((member) => (
                  <div key={member._id} className="member-card">
                    <div className="card-header">
                      <div className="member-avatar">
                        {member.name[0]}
                      </div>
                      <div className="member-info">
                        <h4>{member.name}</h4>
                        <p>{member.email}</p>
                      </div>
                      <div className="card-actions">
                        {/* EDIT BUTTON */}
                        {member.role !== 'admin' && (
                          <button onClick={() => handleEditClick(member)} className="btn-icon edit" title="Edit Permissions">
                            <Pencil size={16} />
                          </button>
                        )}
                        {/* DELETE BUTTON */}
                        <button onClick={() => handleRemove(member._id)} className="btn-icon delete" title="Remove User">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <div className="role-badge-row">
                        <span className={`role-pill ${member.role === 'admin' ? 'admin' : 'recruiter'}`}>
                          {member.role === 'admin' ? <Lock size={10}/> : <Shield size={10}/>} 
                          {member.role === 'admin' ? 'Administrator' : 'Recruiter'}
                        </span>
                        <span className="status-dot">Active</span>
                      </div>

                      {member.role !== 'admin' && (
                        <div className="permissions-list">
                          <p className="perm-label">Access Rights:</p>
                          <div className="tags">
                            {member.permissions?.length > 0 ? (
                              member.permissions.map(p => (
                                <span key={p} className="perm-tag">
                                  {p.replace(/_/g, ' ')}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted">Read Only</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION CONTROLS */}
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
      </div>

      {/* --- 1. INVITE MODAL --- */}
      {showInviteModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-top">
              <h3>Invite Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="btn-close"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleInvite} className="modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrap">
                  <Users size={16} className="input-icon"/>
                  <input 
                    type="text" 
                    required 
                    placeholder="John Doe"
                    value={inviteData.name}
                    onChange={e => setInviteData({...inviteData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-grid-row">
                <div className="form-group">
                  <label>Email</label>
                  <div className="input-wrap">
                    <Mail size={16} className="input-icon"/>
                    <input 
                      type="email" 
                      required 
                      placeholder="user@work.com"
                      value={inviteData.email}
                      onChange={e => setInviteData({...inviteData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Temp Password</label>
                  <div className="input-wrap">
                    <Key size={16} className="input-icon"/>
                    <input 
                      type="text" 
                      required 
                      placeholder="Pass123"
                      value={inviteData.password}
                      onChange={e => setInviteData({...inviteData, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                 <label>Role</label>
                 <div className="role-selector">
                    <button 
                      type="button"
                      className={`role-option ${inviteData.role === 'recruiter' ? 'selected' : ''}`}
                      onClick={() => setInviteData({...inviteData, role: 'recruiter'})}
                    >
                      <div className="radio-circle"><div className="dot"></div></div>
                      <span className="role-text">Recruiter</span>
                    </button>

                    <button 
                      type="button"
                      className={`role-option ${inviteData.role === 'admin' ? 'selected' : ''}`}
                      onClick={() => setInviteData({...inviteData, role: 'admin'})}
                    >
                      <div className="radio-circle"><div className="dot"></div></div>
                      <span className="role-text">Admin</span>
                    </button>
                 </div>
              </div>

              {inviteData.role === 'recruiter' && (
                <div className="permissions-section">
                   <label>Permissions</label>
                   <div className="perm-grid">
                      {PERMISSIONS_LIST.map(perm => (
                        <div 
                          key={perm.id} 
                          className={`perm-card ${inviteData.permissions.includes(perm.id) ? 'active' : ''}`}
                          onClick={() => toggleInvitePermission(perm.id)}
                        >
                           <div className="perm-header">
                              {perm.icon}
                              <span>{perm.label}</span>
                           </div>
                           {inviteData.permissions.includes(perm.id) && <div className="check-corner"><Check size={10}/></div>}
                        </div>
                      ))}
                   </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="submit" className="btn-primary-full" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 2. EDIT MODAL --- */}
      {showEditModal && editingMember && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-top">
              <h3>Edit Permissions</h3>
              <button onClick={() => setShowEditModal(false)} className="btn-close"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleUpdatePermissions} className="modal-form">
              
              <div className="user-preview">
                <div className="member-avatar small">{editingMember.name[0]}</div>
                <div>
                  <div className="font-bold">{editingMember.name}</div>
                  <div className="text-sm">{editingMember.email}</div>
                </div>
              </div>

              <div className="permissions-section">
                 <label>Modify Access</label>
                 <div className="perm-grid">
                    {PERMISSIONS_LIST.map(perm => (
                      <div 
                        key={perm.id} 
                        className={`perm-card ${editPermissions.includes(perm.id) ? 'active' : ''}`}
                        onClick={() => toggleEditPermission(perm.id)}
                      >
                         <div className="perm-header">
                            {perm.icon}
                            <span>{perm.label}</span>
                         </div>
                         {editPermissions.includes(perm.id) && <div className="check-corner"><Check size={10}/></div>}
                      </div>
                    ))}
                 </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-primary-full" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembers;