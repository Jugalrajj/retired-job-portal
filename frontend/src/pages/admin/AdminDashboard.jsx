"use client";

import React, { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import useAuthStore from "../../context/useAuthStore";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  LogOut,
  Search,
  Trash2,
  Eye,
  CheckCircle,
  X,
  Shield,
  Edit2,
  Save,
  MapPin,
  Mail,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Settings,
  Camera,
  Plus,
  Sliders,
  TrendingUp,
  Globe,
  Image as ImageIcon,
  Building2,
  Coins,
  CreditCard,
  PieChart as PieIcon,
  BarChart2,
  UserCheck,
  Award,
  Ticket,
  GraduationCap,
} from "lucide-react";
import toast from "react-hot-toast";

// --- GRAPHING LIBRARY IMPORTS ---
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

// --- HELPER: Resolve Image URL ---
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) {
    // Force HTTPS for Cloudinary images
    return path.replace(/^http:\/\//i, 'https://');
  }
  if (path.startsWith("blob:")) return path;
  return `http://localhost:5000/${path.replace(/\\/g, "/")}`;
};

const AdminDashboard = () => {
  const { user, logout } = useAuthStore();

  // --- STATE ---
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Configuration State
  const [categories, setCategories] = useState([]);
  const [config, setConfig] = useState(null);

  // Partners State
  const [partners, setPartners] = useState([]);

  // Credit System State
  const [creditSystem, setCreditSystem] = useState({
    subscriptions: {
      free: { jobLimit: 3, activeDays: 15, validity: 30 },
      pro: {
        price: 499,
        monthlyCredits: 30,
        jobLimit: 9999,
        activeDays: 30,
        validity: 90,
      },
    },
    packs: [
      { id: "starter", name: "Starter Pack", price: 499, credits: 10 },
      { id: "growth", name: "Growth Pack", price: 999, credits: 25 },
    ],
  });
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discountType: "FLAT",
    value: "",
    validUntil: "",
    usageLimit: 10,
  });

  const [applicants, setApplicants] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Forms
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [newCategory, setNewCategory] = useState({
    title: "",
    icon: "Briefcase",
    color: "#6366f1",
    imageFile: null,
    imagePreview: "",
    originalImage: "",
    roleCategories: [], // 🔥 NEW
    currentRoleInput: "", // 🔥 NEW
  });
  // 🔥 NEW: Education Configuration State
  const [editingEduId, setEditingEduId] = useState(null);
  const [newEdu, setNewEdu] = useState({
    title: "",
    qualifications: [],
    currentQualInput: "",
  });
  const [newItem, setNewItem] = useState({ category: "", value: "" });
  const [newPartner, setNewPartner] = useState({
    name: "",
    logoFile: null,
    logoPreview: "",
  });
  const [newPack, setNewPack] = useState({ name: "", price: "", credits: "" });

  const [adminProfile, setAdminProfile] = useState({
    name: user?.user?.name || "",
    phone: user?.user?.phone || "",
    photo: null,
    previewUrl: user?.user?.photoUrl || "",
  });

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const fetchData = async () => {
    try {
      if (activeTab === "overview") {
        const statsRes = await api.get("/admin/stats");
        setStats(statsRes.data);
        const usersRes = await api.get("/admin/users");
        setUsers(usersRes.data);
        const jobsRes = await api.get("/admin/jobs");
        setJobs(jobsRes.data);
      } else if (activeTab === "users") {
        const { data } = await api.get("/admin/users");
        setUsers(data);
      } else if (activeTab === "jobs") {
        const { data } = await api.get("/admin/jobs");
        setJobs(data);
      } else if (activeTab === "partners") {
        const { data } = await api.get("/partners");
        setPartners(data);
      } else if (activeTab === "plans") {
        const { data } = await api.get("/config/credits");
        if (data) setCreditSystem(data);
      } else if (activeTab === "configuration") {
        const catRes = await api.get("/config/categories");
        setCategories(catRes.data);
        const configRes = await api.get("/config");
        setConfig(configRes.data);
      } else if (activeTab === "coupons") {
        const { data } = await api.get("/coupons");
        setCoupons(data);
      }
    } catch (err) {
      console.error("Admin API Error:", err);
    }
  };

  // ==================================================================
  // 🔥 NEW: CALCULATE ACTUAL TOTAL APPLICATIONS
  // ==================================================================
  const totalApplications = useMemo(() => {
    return jobs.reduce(
      (acc, job) => acc + (job.detailedApplicants?.length || 0),
      0,
    );
  }, [jobs]);

  // ==================================================================
  // GRAPH DATA PROCESSING (MEMOIZED)
  // ==================================================================

  const userRoleData = useMemo(() => {
    const seekers = users.filter((u) => u.role === "seeker").length;
    const employers = users.filter((u) => u.role === "employer").length;
    return [
      { name: "Job Seekers", value: seekers, color: "#6366f1" },
      { name: "Employers", value: employers, color: "#10b981" },
    ];
  }, [users]);

  const jobStatusData = useMemo(() => {
    const active = jobs.filter((j) => j.isActive).length;
    const closed = jobs.filter((j) => !j.isActive).length;
    return [
      { name: "Active Jobs", value: active, color: "#f59e0b" },
      { name: "Closed Jobs", value: closed, color: "#ef4444" },
    ];
  }, [jobs]);

  const topJobsData = useMemo(() => {
    return [...jobs]
      .sort(
        (a, b) =>
          (b.detailedApplicants?.length || 0) -
          (a.detailedApplicants?.length || 0),
      )
      .slice(0, 5)
      .map((j) => ({
        name: j.title.length > 15 ? j.title.substring(0, 15) + "..." : j.title,
        applicants: j.detailedApplicants?.length || 0,
      }));
  }, [jobs]);

  const userTrendData = useMemo(() => {
    const months = {};
    users.forEach((u) => {
      const date = new Date(u.createdAt);
      const key = date.toLocaleString("default", { month: "short" });
      months[key] = (months[key] || 0) + 1;
    });
    return Object.keys(months).map((m) => ({ name: m, users: months[m] }));
  }, [users]);

  // ==================================================================
  // HANDLERS
  // ==================================================================

  const handleSubscriptionChange = (plan, field, value) => {
    setCreditSystem((prev) => ({
      ...prev,
      subscriptions: {
        ...prev.subscriptions,
        [plan]: { ...prev.subscriptions[plan], [field]: Number(value) },
      },
    }));
  };

  const handleAddPack = () => {
    if (!newPack.name || !newPack.price || !newPack.credits)
      return toast.error("Fill all fields");
    const pack = {
      ...newPack,
      id: Date.now().toString(),
      price: Number(newPack.price),
      credits: Number(newPack.credits),
    };
    setCreditSystem((prev) => ({ ...prev, packs: [...prev.packs, pack] }));
    setNewPack({ name: "", price: "", credits: "" });
  };

  const handleDeletePack = (id) => {
    setCreditSystem((prev) => ({
      ...prev,
      packs: prev.packs.filter((p) => p.id !== id),
    }));
  };

  const handleSaveCreditSystem = async () => {
    try {
      await api.post("/config/credits", creditSystem);
      toast.success("Credit System Updated");
    } catch (err) {
      toast.error("Failed to save");
    }
  };

  const handleAddCoupon = async () => {
    if (!newCoupon.code || !newCoupon.value || !newCoupon.validUntil) {
      return toast.error("Code, Value, and Expiry are required");
    }
    try {
      const { data } = await api.post("/coupons/create", newCoupon);
      setCoupons([data.coupon, ...coupons]);
      setNewCoupon({
        code: "",
        discountType: "FLAT",
        value: "",
        validUntil: "",
        usageLimit: 50,
      });
      toast.success("Coupon Created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create coupon");
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(coupons.filter((c) => c._id !== id));
      toast.success("Coupon Deleted");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const handlePartnerLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPartner({
        ...newPartner,
        logoFile: file,
        logoPreview: URL.createObjectURL(file),
      });
    }
  };

  const handleAddPartner = async () => {
    if (!newPartner.name || !newPartner.logoFile)
      return toast.error("Required fields missing");
    try {
      const formData = new FormData();
      formData.append("name", newPartner.name);
      formData.append("logo", newPartner.logoFile);
      const { data } = await api.post("/partners", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPartners([data, ...partners]);
      setNewPartner({ name: "", logoFile: null, logoPreview: "" });
      toast.success("Partner Added");
    } catch (err) {
      toast.error("Failed to add partner");
    }
  };

  const handleDeletePartner = async (id) => {
    if (!window.confirm("Delete this partner?")) return;
    try {
      await api.delete(`/partners/${id}`);
      setPartners(partners.filter((p) => p._id !== id));
      toast.success("Deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleCatImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewCategory({
        ...newCategory,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

 const handleAddOrUpdateCategory = async () => {
    if (!newCategory.title) return toast.error("Title required");
    try {
      let finalImageUrl = editingCategoryId ? newCategory.originalImage : "";
      if (newCategory.imageFile) {
        const formData = new FormData();
        // FIX 1: Change "image" to "file" to match upload.routes.js
        formData.append("file", newCategory.imageFile); 
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          
        });
        // FIX 2: Prioritize 'url' returned from Cloudinary
        finalImageUrl = uploadRes.data.url || uploadRes.data.filePath; 
      }
      const categoryPayload = {
        title: newCategory.title,
        icon: newCategory.icon,
        color: newCategory.color,
        image: finalImageUrl,
        roleCategories: newCategory.roleCategories,
      };

      if (editingCategoryId) {
        const { data } = await api.put(
          `/config/categories/${editingCategoryId}`,
          categoryPayload,
        );
        if (data.categories) setCategories(data.categories);
        setConfig(data);
        toast.success("Category Updated");
        setEditingCategoryId(null);
      } else {
        const { data } = await api.post("/config/add", {
          key: "categories",
          value: categoryPayload,
        });
        if (data.categories) setCategories(data.categories);
        setConfig(data);
        toast.success("Category Added");
      }

      setNewCategory({
        title: "",
        icon: "Briefcase",
        color: "#6366f1",
        imageFile: null,
        imagePreview: "",
        originalImage: "",
        roleCategories: [], // 🔥 NEW
        currentRoleInput: "", // 🔥 NEW
      });
    } catch (err) {
      toast.error(
        editingCategoryId
          ? "Failed to update category"
          : "Failed to add category",
      );
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete category?")) return;
    try {
      const { data } = await api.post("/config/remove", {
        key: "categories",
        value: id,
      });
      if (data.categories) setCategories(data.categories);
      setConfig(data);
      toast.success("Category Deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  // 🔥 NEW: Handlers for Dynamic Education Categories
  const handleAddOrUpdateEdu = async () => {
    if (!newEdu.title) return toast.error("Title required");
    try {
      const payload = {
        title: newEdu.title,
        qualifications: newEdu.qualifications,
      };

      // If editing, remove old entry first (workaround since there's no specific PUT route)
      if (editingEduId) {
        await api.post("/config/remove", {
          key: "educationCategories",
          value: editingEduId,
        });
      }

      const { data } = await api.post("/config/add", {
        key: "educationCategories",
        value: payload,
      });
      setConfig(data);
      toast.success(
        editingEduId
          ? "Education Category Updated"
          : "Education Category Added",
      );

      setEditingEduId(null);
      setNewEdu({ title: "", qualifications: [], currentQualInput: "" });
    } catch (err) {
      toast.error("Failed to save education category");
    }
  };

  const handleDeleteEdu = async (id) => {
    if (!window.confirm("Delete this education category?")) return;
    try {
      const { data } = await api.post("/config/remove", {
        key: "educationCategories",
        value: id,
      });
      setConfig(data);
      toast.success("Deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleAddOption = async (key) => {
    if (!newItem.value || newItem.category !== key) return;
    try {
      const { data } = await api.post("/config/add", {
        key,
        value: newItem.value,
      });
      setConfig(data);
      setNewItem({ category: "", value: "" });
      toast.success("Option Added");
    } catch (err) {
      toast.error("Failed");
    }
  };

  const handleRemoveOption = async (key, value) => {
    if (!window.confirm(`Remove "${value}"?`)) return;
    try {
      const { data } = await api.post("/config/remove", { key, value });
      setConfig(data);
      toast.success("Option Removed");
    } catch (err) {
      toast.error("Failed");
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAdminProfile({
        ...adminProfile,
        photo: file,
        previewUrl: URL.createObjectURL(file),
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("name", adminProfile.name);
      formData.append("phone", adminProfile.phone);
      if (adminProfile.photo) formData.append("photo", adminProfile.photo);
      const { data } = await api.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const storedAuth = JSON.parse(sessionStorage.getItem("rjp-auth"));
      if (storedAuth && storedAuth.state) {
        storedAuth.state.user.user = data.user;
        sessionStorage.setItem("rjp-auth", JSON.stringify(storedAuth));
      }
      toast.success("Profile Updated!");
      window.location.reload();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const openModal = async (item, type) => {
    setSelectedItem(item);
    setModalType(type);
    setEditFormData(item);
    setIsEditing(false);
    setActiveModalTab("details");
    if (type === "job") {
      try {
        const { data } = await api.get(`/admin/jobs/${item._id}/applicants`);
        setApplicants(data);
      } catch (e) {
        setApplicants([]);
      }
    }
  };

  const closeModal = () => {
    setSelectedItem(null);
    setApplicants([]);
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Delete ${type}?`)) return;
    try {
      await api.delete(`/admin/${type}s/${id}`);
      fetchData();
      toast.success(`${type} deleted`);
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleUpdateJob = async () => {
    try {
      await api.put(`/admin/jobs/${selectedItem._id}`, editFormData);
      toast.success("Job updated!");
      setIsEditing(false);
      fetchData();
      closeModal();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    if (activeTab === "users")
      return users.filter(
        (u) =>
          u.name?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term),
      );
    if (activeTab === "jobs")
      return jobs.filter(
        (j) =>
          j.title?.toLowerCase().includes(term) ||
          j.employer?.name?.toLowerCase().includes(term),
      );
    return [];
  };

  const filteredData = getFilteredData();

  // --- PAGINATION COMPONENT ---
  const PaginationControls = ({
    totalItems,
    itemsPerPage,
    currentPage,
    setCurrentPage,
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const handlePrevious = () => {
      if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    return (
      <div style={styles.paginationWrapper}>
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          style={{
            ...styles.pageBtn,
            opacity: currentPage === 1 ? 0.5 : 1,
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            style={currentPage === page ? styles.activePageBtn : styles.pageBtn}
          >
            {page}
          </button>
        ))}

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          style={{
            ...styles.pageBtn,
            opacity: currentPage === totalPages ? 0.5 : 1,
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFilteredData = filteredData.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const currentPartners = partners.slice(indexOfFirstItem, indexOfLastItem);
  const currentCoupons = coupons.slice(indexOfFirstItem, indexOfLastItem);

  const renderConfigSection = (title, key) => (
    <div style={styles.configCard}>
      <h4 style={styles.configTitle}>{title}</h4>
      <div style={styles.chipGrid}>
        {config?.[key]?.map((val, i) => (
          <div key={i} style={styles.chip}>
            {val}
            <X
              size={12}
              style={{ cursor: "pointer", marginLeft: "4px", color: "#94a3b8" }}
              onClick={() => handleRemoveOption(key, val)}
            />
          </div>
        ))}
      </div>
      <div style={styles.addOptionRow}>
        <input
          style={styles.miniInput}
          placeholder="Add new..."
          value={newItem.category === key ? newItem.value : ""}
          onChange={(e) => setNewItem({ category: key, value: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && handleAddOption(key)}
        />
        <button style={styles.miniBtn} onClick={() => handleAddOption(key)}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div style={styles.layout}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .hover-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.logoIcon}>
            <Shield size={24} color="white" />
          </div>
          <span style={styles.brandText}>
            Admin<span style={{ color: "#6366f1" }}>Hub</span>
          </span>
        </div>
        <nav style={styles.nav}>
          <p style={styles.navLabel}>ANALYTICS</p>
          <NavButton
            icon={<LayoutDashboard size={20} />}
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <p style={styles.navLabel}>MANAGEMENT</p>
          <NavButton
            icon={<Users size={20} />}
            label="Users"
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          />
          <NavButton
            icon={<Briefcase size={20} />}
            label="Jobs"
            active={activeTab === "jobs"}
            onClick={() => setActiveTab("jobs")}
          />
          <NavButton
            icon={<Building2 size={20} />}
            label="Partners"
            active={activeTab === "partners"}
            onClick={() => setActiveTab("partners")}
          />
          <NavButton
            icon={<CreditCard size={20} />}
            label="Plans"
            active={activeTab === "plans"}
            onClick={() => setActiveTab("plans")}
          />
          <NavButton
            icon={<Ticket size={20} />}
            label="Coupons"
            active={activeTab === "coupons"}
            onClick={() => setActiveTab("coupons")}
          />
          <NavButton
            icon={<Sliders size={20} />}
            label="Config"
            active={activeTab === "configuration"}
            onClick={() => setActiveTab("configuration")}
          />
          <NavButton
            icon={<Settings size={20} />}
            label="Settings"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />
        </nav>
        <div style={styles.sidebarFooter}>
          <button onClick={logout} style={styles.logoutBtn}>
            <LogOut size={18} /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        <div
          style={{ ...styles.container, opacity: loaded ? 1 : 0 }}
          className="fade-in"
        >
          <header style={styles.header}>
            <div>
              <h1 style={styles.pageTitle}>
                {activeTab === "overview"
                  ? "Dashboard & Analytics"
                  : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <p style={styles.subTitle}>
                Platform statistics and management center
              </p>
            </div>
            <div style={styles.adminBadge}>
              <Avatar
                url={user?.user?.photoUrl}
                name={user?.user?.name}
                size={32}
              />
              <span>{user?.user?.name || "Admin"}</span>
            </div>
          </header>

          {/* === OVERVIEW TAB (REPLACED WITH GRAPHS) === */}
          {activeTab === "overview" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              {/* TOP STATS ROW */}
              <div style={styles.statsGrid}>
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon={<Users size={24} />}
                  color="#6366f1"
                />
                <StatCard
                  title="Total Jobs"
                  value={stats.totalJobs}
                  icon={<Briefcase size={24} />}
                  color="#10b981"
                />
                <StatCard
                  title="Active Jobs"
                  value={stats.activeJobs}
                  icon={<CheckCircle size={24} />}
                  color="#f59e0b"
                />
                {/* 🔥 UPDATED: Dynamic Application Count */}
                <StatCard
                  title="Applications"
                  value={totalApplications}
                  icon={<TrendingUp size={24} />}
                  color="#8b5cf6"
                />
              </div>

              {/* GRAPHS ROW 1 */}
              <div style={styles.graphGrid}>
                <div style={styles.graphCard}>
                  <div style={styles.cardHeader}>
                    <h3>
                      <PieIcon
                        size={18}
                        style={{ marginRight: "8px", color: "#6366f1" }}
                      />{" "}
                      User Demographics
                    </h3>
                  </div>
                  <div style={{ height: "300px", width: "100%" }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={userRoleData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {userRoleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={styles.graphCard}>
                  <div style={styles.cardHeader}>
                    <h3>
                      <PieIcon
                        size={18}
                        style={{ marginRight: "8px", color: "#f59e0b" }}
                      />{" "}
                      Job Market Status
                    </h3>
                  </div>
                  <div style={{ height: "300px", width: "100%" }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={jobStatusData}
                          cx="50%"
                          cy="50%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {jobStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* GRAPHS ROW 2 */}
              <div style={styles.graphGridLarge}>
                <div style={styles.graphCard}>
                  <div style={styles.cardHeader}>
                    <h3>
                      <BarChart2
                        size={18}
                        style={{ marginRight: "8px", color: "#10b981" }}
                      />{" "}
                      Top Jobs by Applications
                    </h3>
                  </div>
                  <div style={{ height: "300px", width: "100%" }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={topJobsData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip cursor={{ fill: "transparent" }} />
                        <Bar
                          dataKey="applicants"
                          fill="#10b981"
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={styles.graphCard}>
                  <div style={styles.cardHeader}>
                    <h3>
                      <TrendingUp
                        size={18}
                        style={{ marginRight: "8px", color: "#8b5cf6" }}
                      />{" "}
                      User Registration Trend
                    </h3>
                  </div>
                  <div style={{ height: "300px", width: "100%" }}>
                    <ResponsiveContainer>
                      <AreaChart
                        data={userTrendData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorUsers"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#8b5cf6"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#8b5cf6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="users"
                          stroke="#8b5cf6"
                          fillOpacity={1}
                          fill="url(#colorUsers)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* RECENT LISTS */}
              <div style={styles.recentGrid}>
                {/* Recent Users List */}
                <div style={styles.contentCard}>
                  <div style={styles.cardHeader}>
                    <h3>Recent Users</h3>
                    <button
                      style={styles.linkBtn}
                      onClick={() => setActiveTab("users")}
                    >
                      View All
                    </button>
                  </div>
                  <div style={styles.miniList}>
                    {users.slice(0, 3).map((u, idx) => (
                      <div key={u._id} style={styles.miniItem}>
                        <Avatar url={u.photoUrl} name={u.name} size={36} />
                        <div style={{ flex: 1 }}>
                          <div style={styles.miniTitle}>{u.name}</div>
                          <div style={styles.miniSub}>{u.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Jobs List */}
                <div style={styles.contentCard}>
                  <div style={styles.cardHeader}>
                    <h3>Recent Jobs</h3>
                    <button
                      style={styles.linkBtn}
                      onClick={() => setActiveTab("jobs")}
                    >
                      View All
                    </button>
                  </div>
                  <div style={styles.miniList}>
                    {jobs.slice(0, 3).map((j, idx) => (
                      <div key={j._id} style={styles.miniItem}>
                        <div style={styles.jobIcon}>
                          <Briefcase size={16} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={styles.miniTitle}>{j.title}</div>
                          <div style={styles.miniSub}>{j.employer?.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === OTHER TABS (PRESERVED EXACTLY) === */}
          {activeTab === "partners" && (
            <div className="fade-in">
              <div
                style={{
                  ...styles.contentCard,
                  padding: "24px",
                  marginBottom: "30px",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  border: "2px dashed #cbd5e1",
                }}
              >
                <h3
                  style={{
                    marginBottom: "16px",
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  Add Featured Company
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    alignItems: "end",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 2, minWidth: "200px" }}>
                    <label style={styles.label}>Company Name</label>
                    <input
                      style={styles.input}
                      value={newPartner.name}
                      onChange={(e) =>
                        setNewPartner({ ...newPartner, name: e.target.value })
                      }
                      placeholder="e.g. Google, Tata, Infosys"
                    />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minWidth: "200px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <label style={styles.label}>Logo Image</label>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <label
                        style={{
                          ...styles.input,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          cursor: "pointer",
                          background: "white",
                        }}
                      >
                        <ImageIcon size={18} />{" "}
                        {newPartner.logoFile ? "Selected" : "Upload Logo"}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handlePartnerLogoChange}
                        />
                      </label>
                      {newPartner.logoPreview && (
                        <div
                          style={{
                            width: "46px",
                            height: "46px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            background: "white",
                            padding: "4px",
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={newPartner.logoPreview}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                            alt="Prev"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={handleAddPartner} style={styles.primaryBtn}>
                    <Plus size={18} /> Add Partner
                  </button>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "20px",
                }}
              >
                {currentPartners.map((p, idx) => (
                  <div
                    key={p._id}
                    style={{
                      ...styles.contentCard,
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                      textAlign: "center",
                      position: "relative",
                      border: "1px solid #e2e8f0",
                    }}
                    className="hover-card fade-in"
                  >
                    <button
                      onClick={() => handleDeletePartner(p._id)}
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "4px",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "12px",
                        border: "1px solid #f1f5f9",
                        background: "#ffffff",
                        padding: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                      }}
                    >
                      <img
                        src={getImageUrl(p.logo)}
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                    <div style={{ marginTop: "4px" }}>
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#1e293b",
                          margin: 0,
                        }}
                      >
                        {p.name}
                      </h4>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#10b981",
                          background: "#ecfdf5",
                          padding: "4px 8px",
                          borderRadius: "10px",
                          fontWeight: "600",
                          display: "inline-block",
                          marginTop: "6px",
                        }}
                      >
                        Featured
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <PaginationControls
                totalItems={partners.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}

          {activeTab === "plans" && (
            <div className="fade-in">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "30px",
                }}
              >
                <h2 style={styles.sectionTitle}>
                  <CreditCard size={24} style={{ marginRight: 10 }} />{" "}
                  Subscription Plans
                </h2>
                <button
                  onClick={handleSaveCreditSystem}
                  style={styles.primaryBtn}
                >
                  <Save size={18} /> Save All Changes
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "24px",
                  marginBottom: "40px",
                }}
              >
                {/* FREE PLAN EDIT CARD */}
                <div style={styles.contentCard} className="hover-card">
                  <div
                    style={{
                      padding: "24px",
                      background:
                        "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "800",
                        color: "#475569",
                      }}
                    >
                      Free Plan
                    </h3>
                    <p style={{ fontSize: "13px", color: "#64748b" }}>
                      Default for all new employers
                    </p>
                  </div>
                  <div
                    style={{
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {/* INTEGRATED: Validity & Active Days Inputs */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <label style={styles.label}>Job Active (Days)</label>
                        <input
                          type="number"
                          style={styles.input}
                          value={creditSystem.subscriptions.free.activeDays}
                          onChange={(e) =>
                            handleSubscriptionChange(
                              "free",
                              "activeDays",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label style={styles.label}>Validity (Days)</label>
                        <input
                          type="number"
                          style={styles.input}
                          value={creditSystem.subscriptions.free.validity}
                          onChange={(e) =>
                            handleSubscriptionChange(
                              "free",
                              "validity",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label style={styles.label}>
                        Job Posting Limit (Active)
                      </label>
                      <input
                        type="number"
                        style={styles.input}
                        value={creditSystem.subscriptions.free.jobLimit}
                        onChange={(e) =>
                          handleSubscriptionChange(
                            "free",
                            "jobLimit",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* PRO PLAN EDIT CARD */}
                <div style={styles.contentCard} className="hover-card">
                  <div
                    style={{
                      padding: "24px",
                      background:
                        "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                      borderBottom: "1px solid #c7d2fe",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "800",
                        color: "#4338ca",
                      }}
                    >
                      Pro Membership
                    </h3>
                    <p style={{ fontSize: "13px", color: "#6366f1" }}>
                      Paid monthly subscription
                    </p>
                  </div>
                  <div
                    style={{
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <label style={styles.label}>Price (₹)</label>
                        <input
                          type="number"
                          style={styles.input}
                          value={creditSystem.subscriptions.pro.price}
                          onChange={(e) =>
                            handleSubscriptionChange(
                              "pro",
                              "price",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label style={styles.label}>Monthly Credits</label>
                        <input
                          type="number"
                          style={styles.input}
                          value={creditSystem.subscriptions.pro.monthlyCredits}
                          onChange={(e) =>
                            handleSubscriptionChange(
                              "pro",
                              "monthlyCredits",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* INTEGRATED: Validity & Active Days Inputs */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <label style={styles.label}>Job Active (Days)</label>
                        <input
                          type="number"
                          style={styles.input}
                          value={creditSystem.subscriptions.pro.activeDays}
                          onChange={(e) =>
                            handleSubscriptionChange(
                              "pro",
                              "activeDays",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label style={styles.label}>
                          Credit Validity (Days)
                        </label>
                        <input
                          type="number"
                          style={styles.input}
                          value={creditSystem.subscriptions.pro.validity}
                          onChange={(e) =>
                            handleSubscriptionChange(
                              "pro",
                              "validity",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label style={styles.label}>Job Posting Limit</label>
                      <input
                        type="number"
                        style={styles.input}
                        value={creditSystem.subscriptions.pro.jobLimit}
                        onChange={(e) =>
                          handleSubscriptionChange(
                            "pro",
                            "jobLimit",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <h2 style={styles.sectionTitle}>
                <Coins size={24} style={{ marginRight: 10 }} /> Credit Top-up
                Packs
              </h2>
              <div
                style={{
                  ...styles.contentCard,
                  padding: "24px",
                  marginBottom: "30px",
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                }}
              >
                <div
                  style={{ display: "flex", gap: "16px", alignItems: "end" }}
                >
                  <div style={{ flex: 2 }}>
                    <label style={styles.label}>Pack Name</label>
                    <input
                      style={styles.input}
                      placeholder="e.g. Mega Pack"
                      value={newPack.name}
                      onChange={(e) =>
                        setNewPack({ ...newPack, name: e.target.value })
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Price (₹)</label>
                    <input
                      type="number"
                      style={styles.input}
                      placeholder="999"
                      value={newPack.price}
                      onChange={(e) =>
                        setNewPack({ ...newPack, price: e.target.value })
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Credits</label>
                    <input
                      type="number"
                      style={styles.input}
                      placeholder="50"
                      value={newPack.credits}
                      onChange={(e) =>
                        setNewPack({ ...newPack, credits: e.target.value })
                      }
                    />
                  </div>
                  <button style={styles.primaryBtn} onClick={handleAddPack}>
                    <Plus size={18} /> Add
                  </button>
                </div>
              </div>
              <div style={styles.gridList}>
                {creditSystem.packs.map((pack) => (
                  <div
                    key={pack.id}
                    style={{
                      ...styles.contentCard,
                      padding: "20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderLeft: "5px solid #fbbf24",
                    }}
                    className="hover-card"
                  >
                    <div>
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#1e293b",
                          marginBottom: "4px",
                        }}
                      >
                        {pack.name}
                      </h4>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>
                        ₹{pack.price} for{" "}
                        <strong style={{ color: "#f59e0b" }}>
                          {pack.credits} Credits
                        </strong>
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeletePack(pack.id)}
                      style={{
                        ...styles.iconBtn,
                        color: "#ef4444",
                        background: "#fee2e2",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === COUPONS TAB === */}
          {activeTab === "coupons" && (
            <div className="fade-in">
              <div
                style={{
                  marginBottom: "30px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 style={styles.sectionTitle}>
                  <Ticket size={24} style={{ marginRight: 10 }} /> Coupon
                  Management
                </h2>
              </div>

              {/* Create Coupon Form */}
              <div
                style={{
                  ...styles.contentCard,
                  padding: "24px",
                  marginBottom: "30px",
                  background:
                    "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                  border: "2px dashed #fcd34d",
                }}
              >
                <h3
                  style={{
                    marginBottom: "16px",
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "#92400e",
                  }}
                >
                  Create New Coupon
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                    alignItems: "end",
                  }}
                >
                  <div style={{ flex: 2, minWidth: "150px" }}>
                    <label style={styles.label}>Code</label>
                    <input
                      style={styles.input}
                      value={newCoupon.code}
                      onChange={(e) =>
                        setNewCoupon({
                          ...newCoupon,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g. SAVE20"
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: "120px" }}>
                    <label style={styles.label}>Type</label>
                    <select
                      style={styles.input}
                      value={newCoupon.discountType}
                      onChange={(e) =>
                        setNewCoupon({
                          ...newCoupon,
                          discountType: e.target.value,
                        })
                      }
                    >
                      <option value="FLAT">Flat Amount (₹)</option>
                      <option value="PERCENTAGE">Percentage (%)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: "100px" }}>
                    <label style={styles.label}>Value</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={newCoupon.value}
                      onChange={(e) =>
                        setNewCoupon({ ...newCoupon, value: e.target.value })
                      }
                      placeholder="500"
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: "140px" }}>
                    <label style={styles.label}>Expiry Date</label>
                    <input
                      type="date"
                      style={styles.input}
                      value={newCoupon.validUntil}
                      onChange={(e) =>
                        setNewCoupon({
                          ...newCoupon,
                          validUntil: e.target.value,
                        })
                      }
                    />
                  </div>
                  <button
                    style={{ ...styles.primaryBtn, background: "#d97706" }}
                    onClick={handleAddCoupon}
                  >
                    <Plus size={18} /> Create
                  </button>
                </div>
              </div>

              {/* Coupons List */}
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={{ background: "#fff7ed" }}>
                      <th style={styles.th}>Code</th>
                      <th style={styles.th}>Discount</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Expiry</th>
                      <th style={styles.th}>Usage</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCoupons.map((c, idx) => (
                      <tr
                        key={c._id}
                        className="hover-row fade-in"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <td
                          style={{
                            ...styles.td,
                            fontWeight: "700",
                            color: "#d97706",
                          }}
                        >
                          {c.code}
                        </td>
                        <td style={styles.td}>
                          {c.discountType === "FLAT"
                            ? `₹${c.value}`
                            : `${c.value}% OFF`}
                        </td>
                        <td style={styles.td}>
                          {new Date() > new Date(c.validUntil) ? (
                            <Badge text="Expired" type="admin" />
                          ) : (
                            <Badge text="Active" type="seeker" />
                          )}
                        </td>
                        <td style={styles.td}>
                          {new Date(c.validUntil).toLocaleDateString()}
                        </td>
                        <td style={styles.td}>
                          {c.usedCount} / {c.usageLimit}
                        </td>
                        <td style={styles.td}>
                          <button
                            onClick={() => handleDeleteCoupon(c._id)}
                            style={{
                              ...styles.iconBtn,
                              color: "#ef4444",
                              background: "#fee2e2",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            padding: "40px",
                            textAlign: "center",
                            color: "#94a3b8",
                          }}
                        >
                          No active coupons found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                totalItems={coupons.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}

          {activeTab === "configuration" && (
            <div className="fade-in">
              {/* 1. Departments Section */}
              <div style={{ marginBottom: "40px" }}>
                <h2 style={styles.sectionTitle}>
                  <Briefcase
                    size={18}
                    style={{ display: "inline", marginRight: "8px" }}
                  />{" "}
                  Job Departments
                </h2>
                <div
                  style={{
                    ...styles.contentCard,
                    padding: "24px",
                    marginBottom: "24px",
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    border: "2px dashed #cbd5e1",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "16px",
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#475569",
                    }}
                  >
                    {editingCategoryId
                      ? "Edit Department"
                      : "Add New Department"}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "end",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 2, minWidth: "200px" }}>
                      <label style={styles.label}>Department Title</label>
                      <input
                        style={styles.input}
                        value={newCategory.title}
                        onChange={(e) =>
                          setNewCategory({
                            ...newCategory,
                            title: e.target.value,
                          })
                        }
                        placeholder="e.g. Finance, Legal"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: "150px" }}>
                      <label style={styles.label}>Icon</label>
                      <select
                        style={styles.input}
                        value={newCategory.icon}
                        onChange={(e) =>
                          setNewCategory({
                            ...newCategory,
                            icon: e.target.value,
                          })
                        }
                      >
                        <option value="Briefcase">Briefcase</option>
                        <option value="Code">Tech</option>
                        <option value="TrendingUp">Finance</option>
                        <option value="Gavel">Legal</option>
                        <option value="Stethoscope">Medical</option>
                        <option value="GraduationCap">Education</option>
                        <option value="FolderOpen">Admin</option>
                        <option value="Globe">Remote</option>
                        <option value="Cpu">Engineering</option>
                        <option value="Database">Data</option>
                        <option value="Shield">Security</option>
                        <option value="Factory">Factory</option>
                        <option value="MessageSquare">Customer Support</option>
                        <option value="HeartHandshake">
                          NGO & Social Work
                        </option>
                        <option value="Construction">Construction</option>
                        <option value="Landmark">Government</option>
                      </select>
                    </div>
                    <div style={{ width: "80px" }}>
                      <label style={styles.label}>Color</label>
                      <input
                        type="color"
                        style={{
                          ...styles.input,
                          height: "42px",
                          padding: "2px",
                          cursor: "pointer",
                        }}
                        value={newCategory.color}
                        onChange={(e) =>
                          setNewCategory({
                            ...newCategory,
                            color: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div
                      style={{
                        minWidth: "120px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <label style={styles.label}>Cover Image</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <label
                          style={{
                            ...styles.input,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            cursor: "pointer",
                            background: "white",
                          }}
                        >
                          <ImageIcon size={16} />{" "}
                          {newCategory.imageFile || newCategory.imagePreview
                            ? "Selected"
                            : "Upload"}
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleCatImageChange}
                          />
                        </label>
                      </div>
                    </div>
                    {/* 🔥 NEW: ROLE CATEGORIES INPUT */}
                    <div style={{ flex: "1 1 100%", marginTop: "10px" }}>
                      <label style={styles.label}>
                        Associated Role Categories (Press Enter to add)
                      </label>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginBottom: "12px",
                          marginTop: "4px",
                        }}
                      >
                        <input
                          style={styles.input}
                          value={newCategory.currentRoleInput || ""}
                          onChange={(e) =>
                            setNewCategory({
                              ...newCategory,
                              currentRoleInput: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (newCategory.currentRoleInput.trim()) {
                                setNewCategory({
                                  ...newCategory,
                                  roleCategories: [
                                    ...(newCategory.roleCategories || []),
                                    newCategory.currentRoleInput.trim(),
                                  ],
                                  currentRoleInput: "",
                                });
                              }
                            }
                          }}
                          placeholder="e.g. Frontend Developer, Senior Consultant"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (newCategory.currentRoleInput.trim()) {
                              setNewCategory({
                                ...newCategory,
                                roleCategories: [
                                  ...(newCategory.roleCategories || []),
                                  newCategory.currentRoleInput.trim(),
                                ],
                                currentRoleInput: "",
                              });
                            }
                          }}
                          style={{ ...styles.primaryBtn, padding: "8px 16px" }}
                        >
                          Add Role
                        </button>
                      </div>

                      {/* Chips to display added roles */}
                      <div style={styles.chipGrid}>
                        {(newCategory.roleCategories || []).map((role, idx) => (
                          <div key={idx} style={styles.chip}>
                            {role}
                            <X
                              size={12}
                              style={{
                                cursor: "pointer",
                                marginLeft: "4px",
                                color: "#94a3b8",
                              }}
                              onClick={() =>
                                setNewCategory({
                                  ...newCategory,
                                  roleCategories:
                                    newCategory.roleCategories.filter(
                                      (_, i) => i !== idx,
                                    ),
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={handleAddOrUpdateCategory}
                      style={styles.primaryBtn}
                    >
                      {editingCategoryId ? (
                        <>
                          <Save size={18} /> Update
                        </>
                      ) : (
                        <>
                          <Plus size={18} /> Add
                        </>
                      )}
                    </button>
                    {editingCategoryId && (
                      <button
                        onClick={() => {
                          setEditingCategoryId(null);
                          setNewCategory({
                            title: "",
                            icon: "Briefcase",
                            color: "#6366f1",
                            imageFile: null,
                            imagePreview: "",
                            originalImage: "",
                          });
                        }}
                        style={{ ...styles.primaryBtn, background: "#ef4444" }}
                      >
                        <X size={18} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div style={styles.gridList}>
                  {categories?.map((cat, idx) => (
                    <div
                      key={cat._id}
                      style={{
                        ...styles.contentCard,
                        padding: "0",
                        display: "flex",
                        flexDirection: "column",
                        borderLeft: `5px solid ${cat.color}`,
                        animationDelay: `${idx * 0.08}s`,
                        overflow: "hidden",
                      }}
                      className="fade-in hover-card"
                    >
                      <div
                        style={{
                          padding: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              background: `${cat.color}20`,
                              color: cat.color,
                              padding: "12px",
                              borderRadius: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Briefcase size={20} />
                          </div>
                          <div>
                            <h4
                              style={{
                                margin: 0,
                                fontSize: "16px",
                                fontWeight: "700",
                                color: "#1e293b",
                              }}
                            >
                              {cat.title}
                            </h4>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                color: "#64748b",
                              }}
                            >
                              Active Department
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => {
                              setEditingCategoryId(cat._id);
                              setNewCategory({
                                title: cat.title,
                                icon: cat.icon,
                                color: cat.color,
                                imageFile: null,
                                imagePreview: getImageUrl(cat.image) || "",
                                originalImage: cat.image || "",
                                roleCategories: cat.roleCategories || [], // 🔥 NEW
                                currentRoleInput: "", // 🔥 NEW
                              });
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            style={{
                              ...styles.iconBtn,
                              color: "#6366f1",
                              background: "#e0e7ff",
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat._id)}
                            style={{
                              ...styles.iconBtn,
                              color: "#ef4444",
                              background: "#fee2e2",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 🔥 NEW: Dynamic Education Categories Section */}
              <div style={{ marginBottom: "40px" }}>
                <h2 style={styles.sectionTitle}>
                  <GraduationCap
                    size={18}
                    style={{ display: "inline", marginRight: "8px" }}
                  />
                  Education & Qualifications
                </h2>

                <div
                  style={{
                    ...styles.contentCard,
                    padding: "24px",
                    marginBottom: "24px",
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "16px",
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#475569",
                    }}
                  >
                    {editingEduId
                      ? "Edit Education Level"
                      : "Add Education Level"}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "end",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <label style={styles.label}>
                        Category Title (e.g. Undergraduate Degree)
                      </label>
                      <input
                        style={styles.input}
                        value={newEdu.title}
                        onChange={(e) =>
                          setNewEdu({ ...newEdu, title: e.target.value })
                        }
                        placeholder="Enter category title"
                      />
                    </div>

                    <div style={{ flex: "2", minWidth: "300px" }}>
                      <label style={styles.label}>
                        Specific Degrees (Press Enter to add)
                      </label>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginBottom: "12px",
                          marginTop: "4px",
                        }}
                      >
                        <input
                          style={styles.input}
                          value={newEdu.currentQualInput || ""}
                          onChange={(e) =>
                            setNewEdu({
                              ...newEdu,
                              currentQualInput: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (newEdu.currentQualInput.trim()) {
                                setNewEdu({
                                  ...newEdu,
                                  qualifications: [
                                    ...(newEdu.qualifications || []),
                                    newEdu.currentQualInput.trim(),
                                  ],
                                  currentQualInput: "",
                                });
                              }
                            }
                          }}
                          placeholder="e.g. B.Tech, B.Sc"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (newEdu.currentQualInput.trim()) {
                              setNewEdu({
                                ...newEdu,
                                qualifications: [
                                  ...(newEdu.qualifications || []),
                                  newEdu.currentQualInput.trim(),
                                ],
                                currentQualInput: "",
                              });
                            }
                          }}
                          style={{ ...styles.primaryBtn, padding: "8px 16px" }}
                        >
                          Add
                        </button>
                      </div>

                      {/* Chips */}
                      <div style={styles.chipGrid}>
                        {(newEdu.qualifications || []).map((qual, idx) => (
                          <div key={idx} style={styles.chip}>
                            {qual}
                            <X
                              size={12}
                              style={{ cursor: "pointer", marginLeft: "4px" }}
                              onClick={() =>
                                setNewEdu({
                                  ...newEdu,
                                  qualifications: newEdu.qualifications.filter(
                                    (_, i) => i !== idx,
                                  ),
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                      <button
                        onClick={handleAddOrUpdateEdu}
                        style={styles.primaryBtn}
                      >
                        {editingEduId ? (
                          <>
                            <Save size={18} /> Update
                          </>
                        ) : (
                          <>
                            <Plus size={18} /> Save Category
                          </>
                        )}
                      </button>
                      {editingEduId && (
                        <button
                          onClick={() => {
                            setEditingEduId(null);
                            setNewEdu({
                              title: "",
                              qualifications: [],
                              currentQualInput: "",
                            });
                          }}
                          style={{
                            ...styles.primaryBtn,
                            background: "#ef4444",
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div style={styles.gridList}>
                  {config?.educationCategories?.map((edu) => (
                    <div
                      key={edu._id}
                      style={{ ...styles.contentCard, padding: "20px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "10px",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: "700",
                          }}
                        >
                          {edu.title}
                        </h4>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => {
                              setEditingEduId(edu._id);
                              setNewEdu({
                                title: edu.title,
                                qualifications: edu.qualifications,
                                currentQualInput: "",
                              });
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            style={{ ...styles.iconBtn, color: "#6366f1" }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteEdu(edu._id)}
                            style={{ ...styles.iconBtn, color: "#ef4444" }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div style={styles.chipGrid}>
                        {edu.qualifications.map((q, i) => (
                          <div key={i} style={styles.chip}>
                            {q}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {config && (
                <>
                  {/* 2. SHARED / COMMON SECTION */}

                  <div style={{ marginBottom: "40px" }}>
                    <h2 style={styles.sectionTitle}>
                      <Globe
                        size={18}
                        style={{ display: "inline", marginRight: "8px" }}
                      />
                      Shared / Common Configuration
                    </h2>
                    <div style={styles.masonryGrid}>
                      {renderConfigSection("Locations (Shared)", "locations")}
                      {renderConfigSection(
                        "Work Modes (Remote/Hybrid)",
                        "workModes",
                      )}
                      {renderConfigSection(
                        "Work Engagement Types",
                        "workTypes",
                      )}
                      {renderConfigSection("Industries (Shared)", "industries")}
                      {renderConfigSection(
                        "Company Types (Shared)",
                        "companyTypes",
                      )}
                    </div>
                  </div>

                  {/* 3. JOB POST SPECIFICS SECTION */}
                <div style={{ marginBottom: "40px" }}>
                    <h2 style={styles.sectionTitle}>
                      <Briefcase
                        size={18}
                        style={{ display: "inline", marginRight: "8px" }}
                      />
                      Job Posting Specifics
                    </h2>
                    <div style={styles.masonryGrid}>
                      {renderConfigSection(
                        "Seniority Levels",
                        "seniorityLevels",
                      )}
                      {renderConfigSection(
                        "Physical Demands",
                        "physicalDemands",
                      )}
                      {renderConfigSection(
                        "Travel Requirements",
                        "travelRequirements",
                      )}
                      {renderConfigSection("Currencies", "currencies")}
                      {renderConfigSection(
                        "Payment Frequencies",
                        "frequencies",
                      )}
                      {renderConfigSection("Urgencies", "urgencies")}
                    </div>
                  </div>

                  {/* 4. SEEKER PROFILE SPECIFICS SECTION */}
                  <div style={{ marginBottom: "40px" }}>
                    <h2 style={styles.sectionTitle}>
                      <UserCheck
                        size={18}
                        style={{ display: "inline", marginRight: "8px" }}
                      />
                      Seeker Profile Specifics
                    </h2>
                    <div style={styles.masonryGrid}>
                      {renderConfigSection("Tech Proficiencies", "techLevels")}
                      {renderConfigSection("Language Levels", "proficiencies")}
                    </div>
                  </div>

                  {/* 5. EMPLOYER PROFILE SPECIFICS SECTION (NEW) */}
                  <div style={{ marginBottom: "40px" }}>
                    <h2 style={styles.sectionTitle}>
                      <Award
                        size={18}
                        style={{ display: "inline", marginRight: "8px" }}
                      />
                      Employer Profile Specifics
                    </h2>
                    <div style={styles.masonryGrid}>
                      {renderConfigSection("Company Sizes", "companySizes")}
                      {renderConfigSection(
                        "Company Benefits & Culture",
                        "benefits",
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div
              style={{ maxWidth: "600px", margin: "0 auto" }}
              className="fade-in"
            >
              <div style={styles.contentCard}>
                <div
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    borderBottom: "1px solid #f1f5f9",
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100px",
                      height: "100px",
                      margin: "0 auto 20px",
                    }}
                  >
                    <Avatar
                      url={adminProfile.previewUrl}
                      name={adminProfile.name}
                      size={100}
                    />
                    <label style={styles.cameraBtn}>
                      <Camera size={16} color="white" />
                      <input
                        type="file"
                        hidden
                        onChange={handlePhotoChange}
                        accept="image/*"
                      />
                    </label>
                  </div>
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Profile Settings
                  </h2>
                  <p style={{ color: "#64748b" }}>
                    Update your admin profile details
                  </p>
                </div>
                <div
                  style={{
                    padding: "32px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name</label>
                    <input
                      style={styles.input}
                      value={adminProfile.name}
                      onChange={(e) =>
                        setAdminProfile({
                          ...adminProfile,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone Number</label>
                    <input
                      style={styles.input}
                      value={adminProfile.phone}
                      onChange={(e) =>
                        setAdminProfile({
                          ...adminProfile,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <button onClick={handleSaveProfile} style={styles.primaryBtn}>
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {(activeTab === "users" || activeTab === "jobs") && (
            <div
              style={{ ...styles.contentCard, animationDelay: "0.1s" }}
              className="fade-in"
            >
              <div style={styles.toolbar}>
                <div style={styles.searchWrapper}>
                  <Search
                    size={18}
                    color="#6366f1"
                    style={{ position: "absolute", left: "12px" }}
                  />
                  <input
                    style={styles.searchInput}
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div style={styles.resultPill}>
                  {filteredData.length} Records
                </div>
              </div>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr
                      style={{
                        background:
                          "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)",
                      }}
                    >
                      {activeTab === "users" ? (
                        <>
                          <th style={styles.th}>User Profile</th>
                          <th style={styles.th}>Role</th>
                          <th style={styles.th}>Join Date</th>
                          <th style={styles.th}>Actions</th>
                        </>
                      ) : (
                        <>
                          <th style={styles.th}>Job Details</th>
                          <th style={styles.th}>Posted By</th>
                          <th style={styles.th}>Stats</th>
                          <th style={styles.th}>Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {currentFilteredData.map((item, index) => (
                      <tr
                        key={item._id}
                        style={{
                          animationDelay: `${index * 0.05}s`,
                          borderBottom: "1px solid #f1f5f9",
                        }}
                        className="hover-row fade-in smooth-transition"
                      >
                        {activeTab === "users" ? (
                          <>
                            <td style={styles.td}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                              >
                                <Avatar
                                  url={item.photoUrl}
                                  name={item.name}
                                  size={40}
                                />
                                <div>
                                  <div style={styles.tdTitle}>{item.name}</div>
                                  <div style={styles.tdSub}>{item.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={styles.td}>
                              <Badge text={item.role} type={item.role} />
                            </td>
                            <td style={styles.td}>
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={styles.td}>
                              <div style={styles.tdTitle}>{item.title}</div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  marginTop: "4px",
                                }}
                              >
                                <span
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: item.isActive
                                      ? "#10b981"
                                      : "#ef4444",
                                  }}
                                ></span>
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: item.isActive
                                      ? "#10b981"
                                      : "#ef4444",
                                    fontWeight: "600",
                                  }}
                                >
                                  {item.isActive ? "Active" : "Closed"}
                                </span>
                              </div>
                            </td>
                            <td style={styles.td}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                }}
                              >
                                <Avatar
                                  url={item.employer?.photoUrl}
                                  name={item.employer?.name}
                                  size={32}
                                />
                                <div>
                                  <div
                                    style={{
                                      fontWeight: "500",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {item.employer?.name || "Unknown"}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#94a3b8",
                                    }}
                                  >
                                    {item.employer?.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={styles.td}>
                              <div style={styles.miniStat}>
                                <Users size={14} />{" "}
                                {item.detailedApplicants?.length || 0}{" "}
                                Applicants
                              </div>
                            </td>
                          </>
                        )}
                        <td style={styles.td}>
                          <div style={styles.actions}>
                            <button
                              onClick={() =>
                                openModal(
                                  item,
                                  activeTab === "users" ? "user" : "job",
                                )
                              }
                              style={styles.iconBtn}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(
                                  item._id,
                                  activeTab === "users" ? "user" : "job",
                                )
                              }
                              style={{
                                ...styles.iconBtn,
                                color: "#ef4444",
                                background: "#fee2e2",
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL (Preserved) --- */}
      {selectedItem && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
            className="scale-in"
          >
            <div style={styles.modalHeader}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <Avatar
                  url={
                    modalType === "job"
                      ? selectedItem.employer?.photoUrl
                      : selectedItem.photoUrl
                  }
                  name={
                    modalType === "job" ? selectedItem.title : selectedItem.name
                  }
                  size={56}
                />
                <div>
                  <h2 style={styles.modalTitle}>
                    {modalType === "job"
                      ? selectedItem.title
                      : selectedItem.name}
                  </h2>
                  <p style={styles.modalSub}>
                    {modalType === "job" ? "Job Listing" : "User Profile"}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} style={styles.closeBtn}>
                <X size={24} />
              </button>
            </div>
            {modalType === "job" && (
              <div style={styles.tabHeader}>
                <button
                  style={
                    activeModalTab === "details" ? styles.activeTab : styles.tab
                  }
                  onClick={() => setActiveModalTab("details")}
                >
                  Details
                </button>
                <button
                  style={
                    activeModalTab === "applicants"
                      ? styles.activeTab
                      : styles.tab
                  }
                  onClick={() => setActiveModalTab("applicants")}
                >
                  Applicants{" "}
                  <span style={styles.countBadge}>{applicants.length}</span>
                </button>
              </div>
            )}
            <div style={styles.modalBody}>
              {modalType === "user" && (
                <div style={styles.gridList}>
                  <DetailCard
                    icon={<Users />}
                    label="Full Name"
                    value={selectedItem.name}
                  />
                  <DetailCard
                    icon={<Mail />}
                    label="Email"
                    value={selectedItem.email}
                  />
                  <DetailCard
                    icon={<Shield />}
                    label="Role"
                    value={
                      <Badge
                        text={selectedItem.role}
                        type={selectedItem.role}
                      />
                    }
                  />
                  <DetailCard
                    icon={<Calendar />}
                    label="Joined On"
                    value={new Date(selectedItem.createdAt).toDateString()}
                  />
                  <DetailCard
                    icon={<CheckCircle />}
                    label="Verified"
                    value={selectedItem.isVerified ? "Yes" : "No"}
                  />
                </div>
              )}
              {modalType === "job" && activeModalTab === "details" && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1e293b",
                      }}
                    >
                      Job Information
                    </h3>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      style={styles.editBtn}
                    >
                      {isEditing ? (
                        "Cancel"
                      ) : (
                        <>
                          <Edit2 size={14} /> Edit Job
                        </>
                      )}
                    </button>
                  </div>
                  {isEditing ? (
                    <div style={styles.form}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Job Title</label>
                        <input
                          style={styles.input}
                          value={editFormData.title}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Description</label>
                        <textarea
                          style={styles.textarea}
                          value={editFormData.description}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      <button
                        onClick={handleUpdateJob}
                        style={styles.primaryBtn}
                      >
                        <Save size={16} /> Save Changes
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div style={styles.infoRow}>
                        <DetailCard
                          icon={<Users />}
                          label="Posted By"
                          value={`${selectedItem.employer?.name || "Unknown"}`}
                        />
                        <DetailCard
                          icon={<Mail />}
                          label="Contact Email"
                          value={selectedItem.employer?.email || "N/A"}
                        />
                      </div>
                      <div style={styles.infoRow}>
                        <DetailCard
                          icon={<MapPin />}
                          label="Location"
                          value={
                            selectedItem.location ||
                            selectedItem.locations?.join(", ") ||
                            "Remote"
                          }
                        />
                        <DetailCard
                          icon={<CheckCircle />}
                          label="Status"
                          value={
                            selectedItem.isActive ? (
                              <span style={{ color: "#10b981" }}>Active</span>
                            ) : (
                              <span style={{ color: "#ef4444" }}>Closed</span>
                            )
                          }
                        />
                      </div>
                      <div style={styles.descBox}>
                        <strong
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            color: "#475569",
                          }}
                        >
                          Description
                        </strong>
                        <p style={{ lineHeight: "1.6" }}>
                          {selectedItem.description}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
              {modalType === "job" && activeModalTab === "applicants" && (
                <div style={styles.applicantList}>
                  {applicants.length === 0 ? (
                    <div style={styles.emptyState}>
                      <Users size={40} color="#cbd5e1" />
                      <p>No applicants.</p>
                    </div>
                  ) : (
                    applicants.map((app, i) => (
                      <div key={i} style={styles.applicantCard}>
                        <Avatar
                          url={app.user?.photoUrl}
                          name={app.user?.name}
                          size={48}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "600" }}>
                            {app.user?.name || "Unknown"}
                          </div>
                          <div style={{ fontSize: "13px", color: "#64748b" }}>
                            {app.user?.email}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---
const Avatar = ({ url, name, size = 32 }) => {
  const imageUrl = getImageUrl(url);
  const initial = name ? name.charAt(0).toUpperCase() : "U";
  return (
    <div
      style={{
        ...styles.avatarBox,
        width: size,
        height: size,
        minWidth: size,
        fontSize: size / 2.5,
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={name}
          style={styles.avatarImg}
          onError={(e) => (e.target.style.display = "none")}
        />
      ) : (
        initial
      )}
    </div>
  );
};
const NavButton = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      ...styles.navBtn,
      background: active ? "rgba(99, 102, 241, 0.15)" : "transparent",
      color: active ? "#fff" : "#94a3b8",
      borderLeft: active ? "4px solid #6366f1" : "4px solid transparent",
    }}
    className="smooth-transition"
  >
    {icon} <span>{label}</span>
    {active && <ChevronRight size={16} style={{ marginLeft: "auto" }} />}
  </button>
);
const StatCard = ({ title, value, icon, color }) => (
  <div
    style={{
      ...styles.statCard,
      borderTop: `4px solid ${color}`,
      background: `linear-gradient(135deg, #ffffff 0%, ${color}05 100%)`,
    }}
    className="hover-card fade-in"
  >
    <div>
      <h3
        style={{
          fontSize: "13px",
          color: "#64748b",
          fontWeight: "600",
          textTransform: "uppercase",
        }}
      >
        {title}
      </h3>
      <div
        style={{
          fontSize: "36px",
          fontWeight: "800",
          marginTop: "8px",
          color: color,
        }}
      >
        {value || 0}
      </div>
    </div>
    <div
      style={{
        padding: "18px",
        borderRadius: "14px",
        background: `${color}15`,
        color: color,
      }}
    >
      {icon}
    </div>
  </div>
);
const DetailCard = ({ icon, label, value }) => (
  <div
    style={{
      background: "#f8fafc",
      padding: "14px 16px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      border: "1px solid #e2e8f0",
    }}
  >
    <div style={{ color: "#6366f1" }}>{icon}</div>
    <div>
      <div
        style={{
          fontSize: "11px",
          color: "#64748b",
          textTransform: "uppercase",
          fontWeight: "700",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "14px",
          fontWeight: "500",
          color: "#1e293b",
          marginTop: "3px",
        }}
      >
        {value || "N/A"}
      </div>
    </div>
  </div>
);
const Badge = ({ text, type }) => {
  const colors = { admin: "#ef4444", employer: "#6366f1", seeker: "#10b981" };
  const bgColors = { admin: "#fef2f2", employer: "#eef2ff", seeker: "#f0fdf4" };
  return (
    <span
      style={{
        fontSize: "12px",
        fontWeight: "700",
        padding: "6px 12px",
        borderRadius: "99px",
        background: bgColors[type] || "#f1f5f9",
        color: colors[type] || "#64748b",
        textTransform: "uppercase",
        border: `1px solid ${colors[type]}20`,
      }}
    >
      {text}
    </span>
  );
};

// --- STYLES ---
const styles = {
  layout: {
    display: "flex",
    minHeight: "calc(100vh - 78px)",
    background: "#f8fafc",
    fontFamily: "'Inter', sans-serif",
  },
  sidebar: {
    width: "280px",
    background: "#1e293b",
    color: "white",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    zIndex: 10,
  },
  brand: {
    padding: "32px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  logoIcon: {
    width: "40px",
    height: "40px",
    background: "#6366f1",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { fontSize: "22px", fontWeight: "800", color: "white" },
  nav: {
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  navLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "700",
    padding: "0 16px 8px 16px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginTop: "10px",
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    width: "100%",
    textAlign: "left",
  },
  sidebarFooter: {
    padding: "24px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  logoutBtn: {
    width: "100%",
    padding: "14px",
    background: "rgba(239, 68, 68, 0.15)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontWeight: "600",
  },
  main: { flex: 1, padding: "40px", minWidth: 0 },
  container: {
    maxWidth: "1280px",
    margin: "0 auto",
    transition: "opacity 0.5s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
  },
  pageTitle: { fontSize: "32px", fontWeight: "800", color: "#1e293b" },
  subTitle: {
    color: "#64748b",
    marginTop: "6px",
    fontSize: "15px",
    fontWeight: "500",
  },
  adminBadge: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "white",
    padding: "10px 20px",
    borderRadius: "50px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },

  // Graph Grid
  graphGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
    marginBottom: "24px",
  },
  graphGridLarge: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
    marginBottom: "24px",
  },
  graphCard: {
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
  },

  // Stats
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "24px",
    marginBottom: "30px",
  },
  statCard: {
    background: "white",
    padding: "24px",
    borderRadius: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #e2e8f0",
  },
  recentGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "15px",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#6366f1",
    fontWeight: "600",
    cursor: "pointer",
  },
  miniList: { display: "flex", flexDirection: "column", gap: "16px" },
  miniItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "12px",
  },
  miniTitle: { fontWeight: "600", fontSize: "14px", color: "#1e293b" },
  miniSub: { fontSize: "12px", color: "#94a3b8" },
  jobIcon: {
    width: "40px",
    height: "40px",
    background: "#e0e7ff",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6366f1",
  },

  // Settings
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    background: "#6366f1",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "3px solid white",
    cursor: "pointer",
  },
  label: { fontSize: "14px", fontWeight: "600", color: "#475569" },
  contentCard: {
    background: "white",
    borderRadius: "24px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  toolbar: {
    padding: "24px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "white",
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "350px",
  },
  searchInput: {
    width: "100%",
    padding: "12px 12px 12px 40px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#f8fafc",
  },
  resultPill: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#6366f1",
    background: "#eef2ff",
    padding: "8px 14px",
    borderRadius: "20px",
  },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: {
    padding: "16px 24px",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: "700",
    fontSize: "12px",
    textTransform: "uppercase",
  },
  td: {
    padding: "20px 24px",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
    verticalAlign: "middle",
  },
  tdTitle: { fontWeight: "600", color: "#0f172a", fontSize: "14px" },
  tdSub: { fontSize: "12px", color: "#94a3b8", marginTop: "2px" },
  miniStat: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#6366f1",
    background: "#eef2ff",
    padding: "6px 12px",
    borderRadius: "10px",
    width: "fit-content",
  },
  actions: { display: "flex", gap: "8px" },
  iconBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "1px solid transparent",
    background: "#f1f5f9",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "white",
    width: "600px",
    maxHeight: "90vh",
    borderRadius: "28px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  modalHeader: {
    padding: "28px 32px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f8fafc",
  },
  modalTitle: { fontSize: "20px", fontWeight: "700", color: "#1e293b" },
  modalSub: { fontSize: "13px", color: "#94a3b8", marginTop: "2px" },
  closeBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  modalBody: { padding: "32px", overflowY: "auto" },
  tabHeader: {
    display: "flex",
    padding: "0 32px",
    borderBottom: "1px solid #f1f5f9",
    background: "#f8fafc",
  },
  tab: {
    padding: "16px 0",
    marginRight: "32px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    borderBottom: "3px solid transparent",
    fontSize: "14px",
    fontWeight: "500",
  },
  activeTab: {
    padding: "16px 0",
    marginRight: "32px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6366f1",
    borderBottom: "3px solid #6366f1",
    fontWeight: "700",
  },
  countBadge: {
    background: "#eef2ff",
    color: "#6366f1",
    fontSize: "10px",
    fontWeight: "700",
    padding: "3px 8px",
    borderRadius: "12px",
    marginLeft: "8px",
  },
  applicantList: { display: "flex", flexDirection: "column", gap: "16px" },
  applicantCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    background: "white",
  },
  emptyState: {
    textAlign: "center",
    padding: "48px",
    color: "#cbd5e1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  avatarBox: {
    borderRadius: "50%",
    background: "#e0e7ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#6366f1",
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    width: "100%",
  },
  textarea: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    minHeight: "120px",
    fontSize: "14px",
    resize: "vertical",
  },
  primaryBtn: {
    padding: "14px 24px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  editBtn: {
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    color: "#6366f1",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    borderRadius: "10px",
  },
  masonryGrid: { columnCount: 3, columnGap: "20px" },
  configCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
    breakInside: "avoid",
    border: "1px solid #e2e8f0",
  },
  configTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#6366f1",
    marginBottom: "15px",
    textTransform: "uppercase",
  },
  chipGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "15px",
  },
  chip: {
    background: "#f8fafc",
    padding: "6px 12px",
    borderRadius: "50px",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#334155",
    border: "1px solid #e2e8f0",
  },
  addOptionRow: { display: "flex", gap: "8px" },
  miniInput: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "12px",
  },
  miniBtn: {
    padding: "8px 12px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  gridList: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  infoRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  descBox: {
    background: "#f8fafc",
    padding: "20px",
    borderRadius: "14px",
    marginTop: "8px",
    fontSize: "14px",
    color: "#334155",
    border: "1px solid #e2e8f0",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
  },
  // --- PAGINATION STYLES ---
  paginationWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "20px 0",
    borderTop: "1px solid #f1f5f9",
  },
  pageBtn: {
    minWidth: "36px",
    height: "36px",
    padding: "0 8px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  activePageBtn: {
    minWidth: "36px",
    height: "36px",
    padding: "0 8px",
    borderRadius: "8px",
    border: "1px solid #6366f1",
    background: "#6366f1",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 4px rgba(99, 102, 241, 0.2)",
  },
};

export default AdminDashboard;
