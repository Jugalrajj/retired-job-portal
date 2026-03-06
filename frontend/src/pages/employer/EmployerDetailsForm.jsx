import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import useAuthStore from "../../context/useAuthStore";
import {
  Building2,
  User,
  MapPin,
  Globe,
  Briefcase,
  Camera,
  Save,
  Phone,
  Mail,
  ShieldCheck,
  Linkedin,
  Twitter,
  Check,
  Layout,
  Info,
  Heart,
  Users,
  Calendar,
  Edit2,
  Loader,
  UploadCloud,
  Link as LinkIcon,
} from "lucide-react";
import toast from "react-hot-toast";

const EmployerDetailsForm = () => {
  const navigate = useNavigate();
  const updateUser = useAuthStore((state) => state.updateUser);
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);

  // --- IMAGE PREVIEWS ---
  const [logoPreview, setLogoPreview] = useState(null);

  const [isEditing, setIsEditing] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  // --- DYNAMIC OPTIONS STATE ---
  const [config, setConfig] = useState({
    industries: [],
    companyTypes: [],
    companySizes: [],
    benefits: [],
  });

  // --- 櫨 NEW: CUSTOM FIELD TRACKING STATE ---
  const [customFields, setCustomFields] = useState({});

  const initialFormState = {
    // Recruiter
    firstName: "",
    lastName: "",
    designation: "",
    mobile: "",
    workEmail: user?.user?.email || "",

    // Company Basics
    companyName: "",
    website: "",
    linkedin: "",
    twitter: "",
    industry: "",
    companyType: "",
    companySize: "",
    foundedYear: "",
    location: "",

    // Deep Info
    description: "",
    mission: "", // Added Mission field
    benefits: [],

    file: null,
  };

  const [formData, setFormData] = useState(initialFormState);

  // --- HELPER: CONSTRUCT URL ---
  const getImageUrl = (path) => {
    if (!path) return null;

    // If already a Cloudinary URL
    if (path.startsWith("http")) return path;

    // Local preview
    if (path.startsWith("blob:")) return path;

    return `http://localhost:5000/${path.replace(/\\/g, "/")}`;
  };

  // --- FETCH DATA (PROFILE + CONFIG) ---
  useEffect(() => {
    const initData = async () => {
      try {
        // 1. Fetch Config
        const configRes = await api.get("/config");
        const cfg = configRes.data || {};

        const fallbackIndustries = [
          "Defense & Military",
          "Healthcare & Medical",
          "Education & Training",
          "Banking & Finance",
          "Government / PSU",
          "Manufacturing",
          "Consulting & Advisory",
          "NGO / Social Work",
          "Technology & IT",
          "Construction & Real Estate",
          "Legal & Compliance",
          "Other",
        ];
        const fallbackTypes = [
          "MNC",
          "Startup",
          "SME",
          "Public Sector",
          "NGO",
          "Consultancy",
        ];
        const fallbackSizes = [
          "1-10 Employees",
          "11-50 Employees",
          "51-200 Employees",
          "201-500 Employees",
          "500+ Employees",
        ];

        const activeIndustries = cfg.industries || fallbackIndustries;
        const activeTypes = cfg.companyTypes || fallbackTypes;
        const activeSizes = cfg.companySizes || fallbackSizes;

        setConfig({
          industries: activeIndustries,
          companyTypes: activeTypes,
          companySizes: activeSizes,
          benefits: cfg.benefits || [
            "Flexible Working Hours",
            "Remote / Work from Home",
            "Health Insurance",
            "Part-time Options",
            "Mentorship Programs",
            "Wheelchair Accessible",
            "Age-Diverse Team",
            "Consultancy Roles",
          ],
        });

        // 2. Fetch Profile
        const { data } = await api.get("/employers/profile");
        if (data) {
          setHasProfile(true);
          setIsEditing(false);

          // 櫨 Check if the fetched values are custom (not in the standard config arrays)
          setCustomFields({
            industry:
              data.company?.industry &&
              !activeIndustries.includes(data.company.industry),
            companyType:
              data.company?.companyType &&
              !activeTypes.includes(data.company.companyType),
            companySize:
              data.company?.size && !activeSizes.includes(data.company.size),
          });

          setFormData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            designation: data.designation || "",
            mobile: data.mobile || "",
            workEmail: data.workEmail || user?.user?.email || "",

            companyName: data.company?.name || "",
            website: data.company?.website || "",
            industry: data.company?.industry || "",
            companyType: data.company?.companyType || "",
            location: data.company?.location || "",
            description: data.company?.description || "",
            mission: data.company?.mission || "", // Fetch Mission
            companySize: data.company?.size || "",
            foundedYear: data.company?.foundedYear || "",
            linkedin: data.company?.linkedin || "",
            twitter: data.company?.twitter || "",
            benefits: data.company?.benefits || [],
            file: null,
          });

          if (data.company?.logo) {
            setLogoPreview(getImageUrl(data.company.logo));
          }
        }
      } catch (err) {
        // If profile fetch fails, prepopulate name from Auth user
        if (user?.user?.name) {
          const parts = user.user.name.split(" ");
          setFormData((prev) => ({
            ...prev,
            firstName: parts[0],
            lastName: parts.slice(1).join(" "),
          }));
        }
      }
    };
    initData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- 櫨 NEW: SMART DROPDOWN HANDLER ---
  const handleSelectWithCustom = (e) => {
    const { name, value } = e.target;
    if (value === "OTHER_CUSTOM") {
      setCustomFields((prev) => ({ ...prev, [name]: true }));
      // Manually trigger handleChange with empty string
      handleChange({ target: { name, value: "" } });
    } else {
      setCustomFields((prev) => ({ ...prev, [name]: false }));
      handleChange(e);
    }
  };

  const handleBenefitToggle = (benefit) => {
    if (!isEditing) return;
    setFormData((prev) => {
      const exists = prev.benefits.includes(benefit);
      if (exists) {
        return {
          ...prev,
          benefits: prev.benefits.filter((b) => b !== benefit),
        };
      } else {
        return { ...prev, benefits: [...prev.benefits, benefit] };
      }
    });
  };

  // --- FILE HANDLERS (WITH SIZE VALIDATION) ---
  const MAX_FILE_SIZE_MB = 2; // Fixed size limit (2MB)
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`Logo image must be smaller than ${MAX_FILE_SIZE_MB}MB`);
        e.target.value = null; // Reset input
        return;
      }
      setFormData((prev) => ({ ...prev, file: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "file") {
        if (formData.file) data.append("logo", formData.file);
      } else if (key === "benefits") {
        data.append("benefits", JSON.stringify(formData.benefits));
      } else {
        data.append(key, formData[key] || "");
      }
    });

    try {
      const res = await api.post("/employers/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.company?.logo) {
        setFormData((prev) => ({
          ...prev,
          companyLogo: res.data.company.logo,
        }));

        setLogoPreview(res.data.company.logo);

        updateUser({ photoUrl: res.data.company.logo });
      }

      toast.success("Profile Updated Successfully!");
      setIsEditing(false);
      setHasProfile(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error saving profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark-profile-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

        /* --- GLOBAL RESET --- */
        html, body {
            background-color: var(--bg-root);
            margin: 0; padding: 0;
            width: 100%; height: 100%;
            overflow-x: hidden;
        }

        /* --- PAGE WRAPPER --- */
        .dark-profile-wrapper {
            background-color: var(--bg-root);
            min-height: 100vh;
            width: 100%;
            padding: 40px 20px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            display: flex; justify-content: center;
            color: var(--text-main);
            overflow-x: hidden;
            box-sizing: border-box;
            transition: background-color 0.3s ease;
        }

        /* --- BACKGROUND FX --- */
        .bg-blob {
            position: absolute; border-radius: 50%; filter: blur(120px);
            opacity: 0.12; z-index: 0; pointer-events: none;
        }
        .b1 { top: -10%; left: -10%; width: 600px; height: 600px; background: #4f46e5; }
        .b2 { bottom: -10%; right: -10%; width: 500px; height: 500px; background: var(--primary); }

        /* --- CONTAINER --- */
        .designer-container {
            width: 100%; max-width: 1280px;
            background: var(--bg-card);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border);
            border-radius: 24px;
            position: relative; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2);
            display: flex; flex-direction: column;
            z-index: 5;
        }

        .designer-strip {
            height: 4px; width: 100%;
            background: linear-gradient(90deg, #4f46e5 0%, var(--primary) 100%);
        }

        .content-area { padding: 40px; flex: 1; }

        /* HEADER */
        .page-header {
            display: flex; justify-content: space-between; align-items: flex-end;
            margin-bottom: 30px; flex-wrap: wrap; gap: 15px;
            padding-bottom: 20px; border-bottom: 1px solid var(--border);
        }
        .page-title { 
            font-family: 'Playfair Display', serif;
            font-size: 28px; font-weight: 700; color: var(--text-main); 
            margin: 0; letter-spacing: -0.5px; 
        }
        .page-subtitle { color: var(--text-sub); font-size: 15px; margin-top: 6px; }

        /* BUTTONS */
        .btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 20px; border-radius: 10px;
            font-weight: 600; font-size: 14px; cursor: pointer;
            transition: all 0.2s; border: none;
        }
        .btn-primary { 
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%); 
            color: #ffffff; box-shadow: 0 4px 15px var(--primary-dim);
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px var(--primary-dim); }
        .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-main); }
        .btn-outline:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-dim); }
        .btn:disabled { opacity: 0.7; cursor: not-allowed; }

        /* LAYOUT */
        .grid-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
        
        /* CARD STYLES */
        .card {
            background: var(--bg-card); border-radius: 16px;
            border: 1px solid var(--border); overflow: hidden;
            margin-bottom: 24px; position: relative;
            box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        .card-header {
            padding: 18px 24px; border-bottom: 1px solid var(--border);
            display: flex; align-items: center; gap: 10px;
            background: rgba(255,255,255,0.02);
        }
        .card-header h3 { font-size: 16px; font-weight: 700; margin: 0; color: var(--text-main); }
        .card-icon { color: var(--primary); }
        .card-body { padding: 24px; }

        /* --- IDENTITY CARD (NEW DESIGN) --- */
        .identity-layout {
            display: flex; gap: 30px; align-items: flex-start;
        }
        .logo-upload-box {
            width: 140px; height: 140px; border-radius: 20px;
            background: var(--bg-input); border: 2px dashed var(--border);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            cursor: pointer; transition: 0.2s; overflow: hidden; position: relative;
            flex-shrink: 0;
        }
        .logo-upload-box:hover { border-color: var(--primary); background: var(--bg-card); }
        .logo-image { width: 100%; height: 100%; object-fit: cover; }
        .upload-hint { font-size: 11px; color: var(--text-sub); margin-top: 8px; text-align: center; }
        
        .identity-inputs { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .full-width { grid-column: 1 / -1; }

        /* FORMS */
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .form-group { margin-bottom: 20px; }
        .form-label {
            display: block; font-size: 12px; font-weight: 700; color: var(--text-sub);
            margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .form-control {
            width: 100%; padding: 12px 16px;
            border-radius: 10px; border: 1px solid var(--border);
            font-size: 14px; color: var(--text-main); font-weight: 500;
            transition: 0.2s; background: var(--bg-input);
            box-sizing: border-box; outline: none;
        }
        .form-control:focus { border-color: var(--primary); background-color: var(--bg-card); }
        .form-control:disabled { background: rgba(255,255,255,0.02); color: var(--text-sub); cursor: not-allowed; border-color: transparent; }
        textarea.form-control { resize: vertical; min-height: 100px; }
        option { background: var(--bg-card); color: var(--text-main); }

        select.form-control {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 16px center; 
            background-size: 16px;
            padding-right: 40px; 
        }

        /* ICONS ABSOLUTE */
        .input-icon-wrap { position: relative; }
        .input-icon { position: absolute; top: 14px; left: 14px; color: var(--text-sub); width: 18px; }
        .pad-left { padding-left: 42px; }

        /* BENEFITS TAGS */
        .benefits-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .benefit-tag {
            display: flex; align-items: center; gap: 8px;
            padding: 8px 16px; border-radius: 20px;
            border: 1px solid var(--border); background: var(--bg-input);
            font-size: 13px; font-weight: 600; color: var(--text-sub);
            cursor: pointer; transition: 0.2s; user-select: none;
        }
        .benefit-tag.active {
            background: var(--primary-dim); border-color: var(--primary);
            color: var(--primary);
        }
        .benefit-tag:hover { border-color: var(--primary); color: var(--text-main); }

        /* RECRUITER CARD */
        .recruiter-header { text-align: center; margin-bottom: 20px; }
        .r-avatar {
            width: 72px; height: 72px; background: var(--bg-input); color: var(--text-main);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            margin: 0 auto 12px; font-weight: 700; font-size: 28px;
            border: 1px solid var(--border);
        }
        .verified-badge {
            background: rgba(16, 185, 129, 0.15); color: #10b981;
            padding: 4px 12px; border-radius: 20px;
            font-size: 12px; font-weight: 700;
            display: inline-flex; align-items: center; gap: 4px; border: 1px solid rgba(16, 185, 129, 0.3);
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
            .dark-profile-wrapper { padding: 0; }
            .designer-container { border-width: 0; border-radius: 0; height: auto; box-shadow: none; }
            .content-area { padding: 20px; }
            .grid-layout { grid-template-columns: 1fr; gap: 20px; }
            .identity-layout { flex-direction: column; align-items: center; text-align: center; }
            .logo-upload-box { margin-bottom: 20px; }
            .identity-inputs { width: 100%; grid-template-columns: 1fr; }
            .form-row { grid-template-columns: 1fr; gap: 0; }
        }
      `}</style>

      {/* BACKGROUND ELEMENTS */}
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      {/* --- 1280PX DESIGNER CONTAINER --- */}
      <div className="designer-container">
        <div className="designer-strip"></div>

        <div className="content-area">
          {/* --- HEADER --- */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Company Profile</h1>
              <p className="page-subtitle">
                Build trust with senior professionals by completing your
                profile.
              </p>
            </div>
            <div className="actions">
              {!isEditing ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 size={18} /> Edit Profile
                </button>
              ) : (
                <button
                  className="btn btn-outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel Changes
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid-layout">
              {/* --- LEFT COLUMN (MAIN) --- */}
              <div className="left-col">
                {/* CARD 1: IDENTITY (NEW DESIGN) */}
                <div className="card">
                  <div className="card-header">
                    <Building2 size={20} className="card-icon" />
                    <h3>Company Identity</h3>
                  </div>
                  <div className="card-body">
                    <div className="identity-layout">
                      {/* LOGO UPLOAD */}
                      <label className="logo-upload-box">
                        {logoPreview || formData.companyLogo ? (
                          <img
                            src={logoPreview || formData.companyLogo}
                            alt="Logo"
                            className="logo-image"
                          />
                        ) : (
                          <>
                            <UploadCloud size={32} color="var(--primary)" />
                            <span className="upload-hint">
                              Upload Logo
                              <br />
                              (Max 2MB)
                            </span>
                          </>
                        )}
                        {isEditing && (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            style={{ display: "none" }}
                          />
                        )}
                      </label>

                      {/* CORE DETAILS */}
                      <div className="identity-inputs">
                        <div className="form-group full-width">
                          <label className="form-label">Company Name *</label>
                          <input
                            className="form-control"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="e.g. Acme Corp"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Website</label>
                          <div className="input-icon-wrap">
                            <Globe className="input-icon" />
                            <input
                              type="url"
                              className="form-control pad-left"
                              name="website"
                              value={formData.website}
                              onChange={handleChange}
                              disabled={!isEditing}
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Founded Year</label>
                          <div className="input-icon-wrap">
                            <Calendar className="input-icon" />
                            <input
                              type="number"
                              className="form-control pad-left"
                              name="foundedYear"
                              value={formData.foundedYear}
                              onChange={handleChange}
                              disabled={!isEditing}
                              placeholder="e.g. 1998"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 2: INDUSTRY & DEMOGRAPHICS */}
                <div className="card">
                  <div className="card-header">
                    <Layout size={20} className="card-icon" />
                    <h3>Industry & Location</h3>
                  </div>
                  <div className="card-body">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Industry Sector *</label>
                        <select
                          className="form-control"
                          name="industry"
                          value={
                            customFields.industry
                              ? "OTHER_CUSTOM"
                              : formData.industry
                          }
                          onChange={handleSelectWithCustom}
                          disabled={!isEditing}
                          required={!customFields.industry}
                        >
                          <option value="">Select Industry</option>
                          {config.industries.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                          <option value="OTHER_CUSTOM">
                            Other (Type manually)
                          </option>
                        </select>
                        {customFields.industry && (
                          <input
                            className="form-control"
                            style={{ marginTop: "8px" }}
                            name="industry"
                            value={formData.industry}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="Type custom industry..."
                            required
                          />
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Company Type</label>
                        <select
                          className="form-control"
                          name="companyType"
                          value={
                            customFields.companyType
                              ? "OTHER_CUSTOM"
                              : formData.companyType
                          }
                          onChange={handleSelectWithCustom}
                          disabled={!isEditing}
                        >
                          <option value="">Select Type</option>
                          {config.companyTypes.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                          <option value="OTHER_CUSTOM">
                            Other (Type manually)
                          </option>
                        </select>
                        {customFields.companyType && (
                          <input
                            className="form-control"
                            style={{ marginTop: "8px" }}
                            name="companyType"
                            value={formData.companyType}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="Type custom company type..."
                          />
                        )}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Company Size</label>
                        <select
                          className="form-control"
                          name="companySize"
                          value={
                            customFields.companySize
                              ? "OTHER_CUSTOM"
                              : formData.companySize
                          }
                          onChange={handleSelectWithCustom}
                          disabled={!isEditing}
                        >
                          <option value="">Select Size</option>
                          {config.companySizes.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                          <option value="OTHER_CUSTOM">
                            Other (Type manually)
                          </option>
                        </select>
                        {customFields.companySize && (
                          <input
                            className="form-control"
                            style={{ marginTop: "8px" }}
                            name="companySize"
                            value={formData.companySize}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="Type custom company size..."
                          />
                        )}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Headquarters *</label>
                        <div className="input-icon-wrap">
                          <MapPin className="input-icon" />
                          <input
                            className="form-control pad-left"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="City, Country"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 3: CULTURE & SOCIAL */}
                <div className="card">
                  <div className="card-header">
                    <Heart size={20} className="card-icon" />
                    <h3>Culture & Social Presence</h3>
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{ marginBottom: "12px" }}
                      >
                        Age-Friendly Benefits (Highly Recommended)
                      </label>
                      <div className="benefits-grid">
                        {config.benefits.map((benefit) => (
                          <div
                            key={benefit}
                            className={`benefit-tag ${formData.benefits.includes(benefit) ? "active" : ""}`}
                            onClick={() => handleBenefitToggle(benefit)}
                          >
                            {formData.benefits.includes(benefit) && (
                              <Check size={14} />
                            )}
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">About the Company</label>
                      <textarea
                        className="form-control"
                        name="description"
                        rows="4"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Tell us about your company history and what you do..."
                      />
                    </div>

                    {/* NEW MISSION FIELD */}
                    <div className="form-group">
                      <label className="form-label">Company Mission</label>
                      <textarea
                        className="form-control"
                        name="mission"
                        rows="3"
                        value={formData.mission}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="State your company's mission and core values..."
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">LinkedIn</label>
                        <div className="input-icon-wrap">
                          <Linkedin className="input-icon" />
                          <input
                            type="url"
                            className="form-control pad-left"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="linkedin.com/..."
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Twitter / X</label>
                        <div className="input-icon-wrap">
                          <Twitter className="input-icon" />
                          <input
                            type="url"
                            className="form-control pad-left"
                            name="twitter"
                            value={formData.twitter}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="twitter.com/..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- RIGHT COLUMN (SIDEBAR) --- */}
              <div className="right-col">
                <div className="card">
                  <div className="card-body">
                    <div className="recruiter-header">
                      <div className="r-avatar">
                        {formData.firstName ? formData.firstName[0] : <User />}
                      </div>
                      <h3
                        style={{
                          margin: "0 0 4px",
                          fontSize: "18px",
                          color: "var(--text-main)",
                        }}
                      >
                        {formData.firstName} {formData.lastName}
                      </h3>
                      <p
                        style={{
                          margin: "0 0 12px",
                          fontSize: "14px",
                          color: "var(--text-sub)",
                        }}
                      >
                        {formData.designation || "Hiring Manager"}
                      </p>
                      <div className="verified-badge">
                        <ShieldCheck size={14} />{" "}
                        {hasProfile ? "Verified Recruiter" : "Pending Setup"}
                      </div>
                    </div>

                    <hr
                      style={{ margin: "20px 0", borderColor: "var(--border)" }}
                    />

                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input
                        className="form-control"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input
                        className="form-control"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Designation</label>
                      <input
                        className="form-control"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Work Email</label>
                      <div className="input-icon-wrap">
                        <Mail className="input-icon" />
                        <input
                          className="form-control pad-left"
                          value={formData.workEmail}
                          disabled
                          style={{
                            background: "var(--bg-input)",
                            color: "var(--text-sub)",
                          }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mobile</label>
                      <div className="input-icon-wrap">
                        <Phone className="input-icon" />
                        <input
                          className="form-control pad-left"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="+1 234..."
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                          width: "100%",
                          justifyContent: "center",
                          marginTop: "10px",
                        }}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader className="spin" size={18} />
                        ) : (
                          <>
                            <Save size={18} /> Save Profile
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* INFO BOX */}
                {/* INFO BOX */}
                <div
                  className="card"
                  style={{
                    background: "var(--primary-dim)",
                    borderColor: "var(--primary)",
                    borderWidth: "1px",
                  }}
                >
                  <div className="card-body">
                    <h4
                      style={{
                        margin: "0 0 12px",
                        color: "var(--primary)",
                        fontSize: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Info size={18} /> Why a Complete Profile Matters
                    </h4>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--text-main)",
                        lineHeight: "1.6",
                        margin: "0 0 12px",
                      }}
                    >
                      Senior professionals and industry experts value
                      transparency. A detailed company profile directly impacts
                      your hiring success on this platform:
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {/* Point 1: Trust */}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "flex-start",
                        }}
                      >
                        <ShieldCheck
                          size={16}
                          color="var(--primary)"
                          style={{ marginTop: "2px", flexShrink: 0 }}
                        />
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12.5px",
                            color: "var(--text-sub)",
                            lineHeight: "1.5",
                          }}
                        >
                          <strong style={{ color: "var(--text-main)" }}>
                            Builds Instant Trust:
                          </strong>{" "}
                          Companies with clear missions, logos, and verified
                          recruiter details see a much higher response rate from
                          top-tier executive talent.
                        </p>
                      </div>

                      {/* Point 2: Benefits/Culture */}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "flex-start",
                        }}
                      >
                        <Heart
                          size={16}
                          color="var(--primary)"
                          style={{ marginTop: "2px", flexShrink: 0 }}
                        />
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12.5px",
                            color: "var(--text-sub)",
                            lineHeight: "1.5",
                          }}
                        >
                          <strong style={{ color: "var(--text-main)" }}>
                            Showcases Culture:
                          </strong>{" "}
                          Highlighting <em>Age-Friendly Benefits</em> (like
                          flexible hours or mentorship) is the #1 driver for
                          retired experts seeking advisory or part-time roles.
                        </p>
                      </div>

                      {/* Point 3: Matching */}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "flex-start",
                        }}
                      >
                        <Users
                          size={16}
                          color="var(--primary)"
                          style={{ marginTop: "2px", flexShrink: 0 }}
                        />
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12.5px",
                            color: "var(--text-sub)",
                            lineHeight: "1.5",
                          }}
                        >
                          <strong style={{ color: "var(--text-main)" }}>
                            Improves Matching:
                          </strong>{" "}
                          Accurate industry, size, and location data helps our
                          algorithm recommend your openings to the most relevant
                          senior candidates.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployerDetailsForm;
