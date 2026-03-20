import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import useAuthStore from "../../context/useAuthStore";
import {
  User,
  Briefcase,
  Award,
  Zap,
  FileText,
  CheckCircle,
  Upload,
  Camera,
  ChevronRight,
  ChevronLeft,
  Save,
  Trash2,
  Plus,
  AlertCircle,
  X,
  Loader,
  MapPin,
  Mail,
  Phone,
  Edit3,
  Globe,
  Calendar,
} from "lucide-react";

// =========================================================
// 1. MAIN CONTAINER (Handles View/Edit Toggle & Config Fetch)
// =========================================================
const SeekerDetailsForm = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // New State for Dynamic Dropdown Options
  const [config, setConfig] = useState({});

  const { user, updateUser } = useAuthStore();
  const currentUser = user?.user || user || {};

  // Initial Fetch for View Mode & Config
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Profile and Config in parallel
      const [profileRes, configRes] = await Promise.allSettled([
        api.get("/seekers/profile"),
        api.get("/config"),
      ]);

      // 2. Handle Config Result
      if (configRes.status === "fulfilled") {
        setConfig(configRes.value.data);
      }

      // 3. Handle Profile Result
      if (profileRes.status === "fulfilled") {
        const { data } = profileRes.value;
        if (data && Object.keys(data).length > 0) {
          setProfileData(data);
        } else {
          console.log("Profile data is empty, switching to edit mode");
          setIsEditing(true);
        }
      } else {
        // If profile fetch fails (404), default to edit mode
        console.log("No profile found, defaulting to edit mode");
        setIsEditing(true);
      }
    } catch (err) {
      console.error("Error initializing page:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSuccess = (updatedProfile) => {
    setProfileData(updatedProfile);
    setIsEditing(false); // Switch back to View Mode

    // Sync the global user store with the newly saved form data
    updateUser({
      name: updatedProfile.fullName,
      email: updatedProfile.contactEmail,
      phone: updatedProfile.phone,
      ...(updatedProfile.photoUrl && { photoUrl: updatedProfile.photoUrl }),
    });
  };

  if (loading)
    return (
      <div className="page-container center-content">
        <div className="loader-box">
          <Loader className="spin" size={40} color="var(--primary)" />
          <p>Loading Profile...</p>
        </div>
        <Styles />
      </div>
    );

  return (
    <div className="page-container">
      {/* --- DESIGNER BACKGROUND --- */}
      <div className="bg-decoration b1"></div>
      <div className="bg-decoration b2"></div>
      <div className="bg-grid-pattern"></div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="main-layout fade-in-up">
        {isEditing ? (
          <ProfileEditor
            initialData={profileData}
            config={config} // Pass dynamic config here
            currentUser={currentUser}
            onCancel={() => {
              // If cancelling but no profile data exists, stay in edit mode
              if (!profileData) {
                return;
              }
              setIsEditing(false);
            }}
            onSuccess={handleSaveSuccess}
          />
        ) : (
          <ProfileView
            profile={profileData}
            user={currentUser}
            onEdit={() => setIsEditing(true)}
          />
        )}
      </div>

      {/* GLOBAL STYLES */}
      <Styles />
    </div>
  );
};

// =========================================================
// 2. VIEW COMPONENT (The "Resume" Look)
// =========================================================
const ProfileView = ({ profile, user, onEdit }) => {
  if (!profile) {
    return (
      <div
        className="detail-card center-content"
        style={{ textAlign: "center", padding: "50px" }}
      >
        <User
          size={48}
          className="text-muted"
          style={{ marginBottom: "20px" }}
        />
        <h3>Welcome to your profile</h3>
        <p className="text-muted" style={{ marginBottom: "20px" }}>
          It looks like you haven't set up your details yet.
        </p>
        <button className="btn-save" onClick={onEdit}>
          Create Profile Now
        </button>
      </div>
    );
  }

  const photoSrc = profile.photoUrl || null;

  return (
    <div className="profile-view-wrapper">
      {/* --- HEADER SECTION --- */}
      <div className="profile-header">
        <div className="cover-banner"></div>
        <div className="header-body">
          <div className="avatar-wrapper">
            <div className="avatar-frame">
              {photoSrc ? (
                <img src={photoSrc} alt="Profile" />
              ) : (
                <User size={64} color="var(--text-sub)" />
              )}
            </div>
          </div>

          <div className="header-details">
            <div className="header-title-row">
              <div>
                <h1>{user?.name || profile.fullName}</h1>
                <p className="headline">{profile.headline}</p>
              </div>
              <button className="btn-edit" onClick={onEdit}>
                <Edit3 size={16} /> <span>Edit Profile</span>
              </button>
            </div>

            <div className="header-meta-grid">
              <div className="meta-item">
                <MapPin size={14} /> {profile.location}
              </div>
              {profile.totalExperienceYears && (
                <div className="meta-item">
                  <Briefcase size={14} /> {profile.totalExperienceYears} Years
                  Exp.
                </div>
              )}
              <div className="meta-item">
                <Mail size={14} /> {user?.email || profile.contactEmail}
              </div>
              <div className="meta-item">
                <Phone size={14} /> {user?.phone || profile.phone}
              </div>
              {profile.portfolio && (
                <div className="meta-item">
                  <Globe size={14} />
                  <a
                    href={
                      profile.portfolio.startsWith("http")
                        ? profile.portfolio
                        : `https://${profile.portfolio}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "var(--primary)",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    View Portfolio
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content-grid">
        {/* --- LEFT COLUMN (Main Info) --- */}
        <div className="left-col">
          {/* 👈 ADD THIS ABOUT SECTION */}
          {profile.bio && (
            <section className="detail-card">
              <div className="card-header">
                <div className="icon-badge gold">
                  <User size={20} />
                </div>
                <h3>About Candidate</h3>
              </div>
              <p
                style={{
                  lineHeight: "1.7",
                  color: "var(--text-sub)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {profile.bio}
              </p>
            </section>
          )}

          {/* Work Experience */}
          <section className="detail-card">
            <div className="card-header">
              <div className="icon-badge gold">
                <Briefcase size={20} />
              </div>
              <h3>Work Experience</h3>
            </div>
            <div className="timeline-wrapper">
              {profile.workExperience?.length > 0 ? (
                profile.workExperience.map((exp, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="job-header">
                        <h4>{exp.title}</h4>
                        <span className="job-date">
                          {new Date(exp.startDate).getFullYear()} -{" "}
                          {exp.current
                            ? "Present"
                            : new Date(exp.endDate).getFullYear()}
                        </span>
                      </div>
                      <span className="company-name">{exp.company}</span>
                      {exp.description && (
                        <p className="job-desc">{exp.description}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-msg">No experience details added.</div>
              )}
            </div>
          </section>

          {/* Education */}
          <section className="detail-card">
            <div className="card-header">
              <div className="icon-badge blue">
                <Award size={20} />
              </div>
              <h3>Education</h3>
            </div>
            <div className="education-list">
              {profile.education?.length > 0 ? (
                profile.education.map((edu, i) => (
                  <div key={i} className="edu-item">
                    <div className="edu-icon">
                      <Award size={20} />
                    </div>
                    <div className="edu-details">
                      <h4>{edu.degree}</h4>
                      <p>{edu.institution}</p>
                      <span className="edu-year">Class of {edu.year}</span>
                    </div>
                    {edu.grade && (
                      <span className="grade-badge">Grade: {edu.grade}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-msg">No education details added.</div>
              )}
            </div>
          </section>
        </div>

        {/* --- RIGHT COLUMN (Sidebar Info) --- */}
        <div className="right-col">
          {/* Skills */}
          <section className="detail-card compact">
            <h4 className="sidebar-title">
              <Zap size={16} /> Skills & Expertise
            </h4>
            <div className="skills-cloud">
              {profile.skills?.length > 0 ? (
                profile.skills.map((skill, i) => (
                  <span key={i} className="skill-pill">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-muted">No skills added</span>
              )}
            </div>
            <div className="proficiency-box">
              <span>Tech Proficiency:</span>
              <strong>{profile.techLevel}</strong>
            </div>
          </section>

          {/* Languages */}
          <section className="detail-card compact">
            <h4 className="sidebar-title">
              <Globe size={16} /> Languages
            </h4>
            <div className="lang-list">
              {profile.languages?.map((lang, i) => (
                <div key={i} className="lang-item">
                  <span className="lang-name">{lang.name}</span>
                  <span className="lang-level">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Preferences */}
          <section className="detail-card compact">
            <h4 className="sidebar-title">
              <CheckCircle size={16} /> Preferences
            </h4>
            <ul className="pref-list">
              <li>
                <span className="pref-label">Work Mode</span>
                <span className="pref-val">{profile.workMode}</span>
              </li>
              <li>
                <span className="pref-label">Engagement</span>
                <span className="pref-val">{profile.workType}</span>
              </li>
              <li>
                <span className="pref-label">Availability</span>
                <span className="pref-val">
                  {profile.availability || "Not Specified"}
                </span>
              </li>
            </ul>
          </section>

          {/* Resume Download */}
          {profile.resumeUrl && (
            <div className="resume-box">
              <FileText size={32} className="pdf-icon" />
              <div>
                <h5>Curriculum Vitae</h5>
                <a
                  href={
                    profile.resumeUrl.startsWith("http")
                      ? profile.resumeUrl.replace(/^http:\/\//i, "https://")
                      : `http://localhost:5000/${profile.resumeUrl.replace(/\\/g, "/")}`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Download PDF
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =========================================================
// 3. EDITOR COMPONENT (Wizard Form)
// =========================================================
const ProfileEditor = ({
  initialData,
  onCancel,
  onSuccess,
  config,
  currentUser,
}) => {
  const navigate = useNavigate();

  // --- EXTRACT DYNAMIC OPTIONS OR USE FALLBACKS ---
  const dynamicOptions = {
    workModes: config?.workModes || ["Remote", "Hybrid", "On-site"],
    workTypes: config?.workTypes || [
      "Consulting",
      "Full-time",
      "Part-time",
      "Advisory Board",
    ],
    techLevels: config?.techLevels || ["Basic", "Intermediate", "Advanced"],
    proficiencies: config?.proficiencies || [
      "Native",
      "Fluent",
      "Professional",
      "Conversational",
    ],
  };

  // --- STATE MANAGEMENT ---
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previewImg, setPreviewImg] = useState(initialData?.photoUrl || null);
  const [toast, setToast] = useState(null);

  // Validation Errors State
  const [errors, setErrors] = useState({});

  // Initialize with initialData if available
  const [formData, setFormData] = useState({
    // Step 1: Identity
    fullName: currentUser?.name || initialData?.fullName || "",
    dob: initialData?.dob ? initialData.dob.split("T")[0] : "",
    location: initialData?.location || "",
    contactEmail: currentUser?.email || initialData?.contactEmail || "",
    phone: currentUser?.phone || initialData?.phone || "",
    headline: initialData?.headline || "",
    bio: initialData?.bio || "",
    portfolio: initialData?.portfolio || "",
    // Step 2: Experience
    workExperience:
      initialData?.workExperience?.map((exp) => ({
        ...exp,
        startDate: exp.startDate ? exp.startDate.split("T")[0] : "",
        endDate: exp.endDate ? exp.endDate.split("T")[0] : "",
      })) || [],
    // Step 3: Education
    education: initialData?.education || [],
    languages: initialData?.languages || [
      { name: "English", proficiency: dynamicOptions.proficiencies[2] },
    ],
    // Step 4: Skills
    skills: Array.isArray(initialData?.skills)
      ? initialData.skills.join(", ")
      : initialData?.skills || "",
    techLevel: initialData?.techLevel || dynamicOptions.techLevels[1],
    // Step 5: Preferences
    workType: initialData?.workType || dynamicOptions.workTypes[0],
    workMode: initialData?.workMode || dynamicOptions.workModes[0],
    availability: initialData?.availability || "",
    expectedCompensation: initialData?.expectedCompensation || "",
    healthConsiderations: initialData?.healthConsiderations || "",
    // Step 6: Files
    photo: null,
    resume: null,
  });

  // --- TOAST HELPER ---
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- VALIDATION LOGIC ---
  const validateStep = (step) => {
    let newErrors = {};
    let isValid = true;

    if (step === 1) {
      if (!formData.fullName) newErrors.fullName = "Full Name is required.";
      if (!formData.location) newErrors.location = "Location is required.";
      if (!formData.headline)
        newErrors.headline = "Professional Headline is required.";
      if (!formData.phone || formData.phone.length < 10)
        newErrors.phone = "Valid Phone Number is required.";
    }

    if (step === 2) {
      formData.workExperience.forEach((exp, index) => {
        if (!exp.title)
          newErrors[`exp_title_${index}`] = "Job Title is required.";
        if (!exp.company)
          newErrors[`exp_company_${index}`] = "Company Name is required.";
        if (!exp.startDate)
          newErrors[`exp_start_${index}`] = "Start Date is required.";
      });
    }

    if (step === 3) {
      formData.education.forEach((edu, index) => {
        if (!edu.degree)
          newErrors[`edu_degree_${index}`] = "Degree is required.";
        if (!edu.institution)
          newErrors[`edu_inst_${index}`] = "Institution is required.";
        if (!edu.year) newErrors[`edu_year_${index}`] = "Year is required.";
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast("Please fill all required fields", "error");
      isValid = false;
    } else {
      setErrors({});
    }

    return isValid;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  // --- INPUT HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleArrayChange = (field, index, subField, value) => {
    const updated = [...formData[field]];
    updated[index][subField] = value;
    setFormData({ ...formData, [field]: updated });
    const errKey = `${field === "workExperience" ? "exp" : "edu"}_${subField}_${index}`;
    if (errors[errKey]) setErrors((prev) => ({ ...prev, [errKey]: null }));
  };

  const addRow = (field, template) => {
    setFormData({ ...formData, [field]: [template, ...formData[field]] });
  };

  const removeRow = (field, index) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  // --- UPDATED FILE HANDLER WITH SIZE CHECK ---
  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const handleFile = (e) => {
    const { name, files } = e.target;
    if (files[0]) {
      // Validate File Size
      if (files[0].size > MAX_FILE_SIZE_BYTES) {
        showToast(
          `${name === "photo" ? "Profile Photo" : "Resume"} must be smaller than ${MAX_FILE_SIZE_MB}MB`,
          "error",
        );
        e.target.value = null; // Clear input
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      if (name === "photo") setPreviewImg(URL.createObjectURL(files[0]));
    }
  };

  // --- SUBMIT ---
  const handleSubmit = async () => {
    setLoading(true);
    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      if (["workExperience", "education", "languages"].includes(key)) {
        data.append(key, JSON.stringify(formData[key]));
      } else if (key === "photo" || key === "resume") {
        if (formData[key] instanceof File) data.append(key, formData[key]);
      } else if (formData[key]) {
        data.append(key, formData[key]);
      }
    });

    try {
      const res = await api.post("/seekers/profile", data);
      showToast("Profile Saved Successfully!");
      if (onSuccess) {
        setTimeout(() => onSuccess(res.data.profile), 1000);
      } else {
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save profile",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // --- STEP CONFIG ---
  const steps = [
    { id: 1, label: "Identity", icon: User, sub: "Personal Info" },
    { id: 2, label: "Experience", icon: Briefcase, sub: "Work History" },
    { id: 3, label: "Education", icon: Award, sub: "Academics" },
    { id: 4, label: "Skills", icon: Zap, sub: "Expertise" },
    { id: 5, label: "Preferences", icon: CheckCircle, sub: "Job Role" },
    { id: 6, label: "Documents", icon: FileText, sub: "CV & Photo" },
  ];

  return (
    <div className="editor-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === "error" ? (
            <AlertCircle size={20} />
          ) : (
            <CheckCircle size={20} />
          )}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* --- SIDEBAR STEPS --- */}
      <div className="editor-sidebar">
        <div className="sidebar-brand">
          <h3>Profile Setup</h3>
          <p>Step {activeStep} of 6</p>
        </div>

        <div className="steps-nav">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`nav-step ${activeStep === step.id ? "active" : ""} ${activeStep > step.id ? "completed" : ""}`}
              onClick={() => {
                if (activeStep > step.id) setActiveStep(step.id);
              }}
            >
              <div className="step-indicator">
                {activeStep > step.id ? (
                  <CheckCircle size={16} />
                ) : (
                  <step.icon size={16} />
                )}
              </div>
              <div className="step-text">
                <span className="label">{step.label}</span>
                <span className="sub">{step.sub}</span>
              </div>
            </div>
          ))}
        </div>

        <button className="btn-cancel" onClick={onCancel}>
          <X size={16} /> Cancel & Exit
        </button>
      </div>

      {/* --- MAIN FORM AREA --- */}
      <div className="editor-main">
        <div className="form-header">
          <div>
            <h2>{steps[activeStep - 1].label}</h2>
            <p>Please provide accurate details to stand out.</p>
          </div>
          <div className="step-count-badge">Step {activeStep} / 6</div>
        </div>

        <div className="form-body">
          {/* STEP 1: IDENTITY */}
          {activeStep === 1 && (
            <div className="form-section fade-in">
              <div className="form-grid">
                <div className="form-group span-2">
                  <label>
                    Full Name <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Col. Rajesh Singh"
                      className={errors.fullName ? "error" : ""}
                    />
                  </div>
                  {errors.fullName && (
                    <span className="err-text">{errors.fullName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <div className="input-wrapper">
                    <Calendar size={18} className="input-icon" />
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    Phone Number <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <Phone size={18} className="input-icon" />
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className={errors.phone ? "error" : ""}
                    />
                  </div>
                  {errors.phone && (
                    <span className="err-text">{errors.phone}</span>
                  )}
                </div>

                <div className="form-group span-2">
                  <label>Contact Email</label>
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="form-group span-2">
                  <label>
                    Current Location <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <MapPin size={18} className="input-icon" />
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City, State"
                      className={errors.location ? "error" : ""}
                    />
                  </div>
                  {errors.location && (
                    <span className="err-text">{errors.location}</span>
                  )}
                </div>

                <div className="form-group span-2">
                  <label>Portfolio</label>
                  <div className="input-wrapper">
                    <Globe size={18} className="input-icon" />
                    <input
                      name="portfolio"
                      value={formData.portfolio}
                      onChange={handleChange}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>

                <div className="form-group span-2">
                  <label>
                    Professional Headline <span className="required">*</span>
                  </label>
                  <input
                    name="headline"
                    value={formData.headline}
                    onChange={handleChange}
                    placeholder="e.g. Senior Operations Manager with 20+ Years Experience"
                    className={errors.headline ? "error" : ""}
                  />
                  <span className="hint-text">
                    This appears under your name on your profile card.
                  </span>
                  {errors.headline && (
                    <span className="err-text">{errors.headline}</span>
                  )}
                </div>

                <div className="form-group span-2">
                  <label>About Me (Professional Summary)</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Briefly describe your background, key achievements, and what you are looking for..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EXPERIENCE */}
          {activeStep === 2 && (
            <div className="form-section fade-in">
              <div className="section-toolbar">
                <h4>Work History</h4>
                <button
                  className="btn-mini-add"
                  onClick={() =>
                    addRow("workExperience", {
                      title: "",
                      company: "",
                      startDate: "",
                      endDate: "",
                      current: false,
                      description: "",
                    })
                  }
                >
                  <Plus size={14} /> Add Role
                </button>
              </div>

              {formData.workExperience.length === 0 ? (
                <div className="empty-placeholder">
                  <Briefcase size={40} />
                  <p>No work experience added yet.</p>
                  <button
                    onClick={() =>
                      addRow("workExperience", {
                        title: "",
                        company: "",
                        startDate: "",
                        endDate: "",
                        current: false,
                        description: "",
                      })
                    }
                  >
                    Add First Role
                  </button>
                </div>
              ) : (
                <div className="repeater-list">
                  {formData.workExperience.map((exp, i) => (
                    <div key={i} className="repeater-item">
                      <div className="repeater-header">
                        <span className="item-badge">Role #{i + 1}</span>
                        <button
                          className="btn-trash"
                          onClick={() => removeRow("workExperience", i)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>
                            Job Title <span className="required">*</span>
                          </label>
                          <input
                            value={exp.title}
                            onChange={(e) =>
                              handleArrayChange(
                                "workExperience",
                                i,
                                "title",
                                e.target.value,
                              )
                            }
                            className={errors[`exp_title_${i}`] ? "error" : ""}
                          />
                        </div>
                        <div className="form-group">
                          <label>
                            Company / Organization{" "}
                            <span className="required">*</span>
                          </label>
                          <input
                            value={exp.company}
                            onChange={(e) =>
                              handleArrayChange(
                                "workExperience",
                                i,
                                "company",
                                e.target.value,
                              )
                            }
                            className={
                              errors[`exp_company_${i}`] ? "error" : ""
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>
                            Start Date <span className="required">*</span>
                          </label>
                          <input
                            type="date"
                            value={exp.startDate}
                            onChange={(e) =>
                              handleArrayChange(
                                "workExperience",
                                i,
                                "startDate",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>End Date</label>
                          <input
                            type="date"
                            value={exp.endDate}
                            disabled={exp.current}
                            onChange={(e) =>
                              handleArrayChange(
                                "workExperience",
                                i,
                                "endDate",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="form-group span-2 checkbox-group">
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) =>
                                handleArrayChange(
                                  "workExperience",
                                  i,
                                  "current",
                                  e.target.checked,
                                )
                              }
                            />
                            <span className="checkmark"></span>I currently work
                            here
                          </label>
                        </div>
                        <div className="form-group span-2">
                          <label>Description & Achievements</label>
                          <textarea
                            rows="3"
                            value={exp.description}
                            onChange={(e) =>
                              handleArrayChange(
                                "workExperience",
                                i,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Briefly describe your responsibilities..."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: EDUCATION & LANGUAGES */}
          {activeStep === 3 && (
            <div className="form-section fade-in">
              <div className="section-toolbar">
                <h4>Education</h4>
                <button
                  className="btn-mini-add"
                  onClick={() =>
                    addRow("education", {
                      degree: "",
                      institution: "",
                      year: "",
                      grade: "",
                    })
                  }
                >
                  <Plus size={14} /> Add Degree
                </button>
              </div>

              {formData.education.map((edu, i) => (
                <div key={i} className="repeater-item">
                  <div className="repeater-header">
                    <span className="item-badge">Degree #{i + 1}</span>
                    <button
                      className="btn-trash"
                      onClick={() => removeRow("education", i)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="form-grid">
                    <div className="form-group span-2">
                      <label>
                        Degree / Qualification{" "}
                        <span className="required">*</span>
                      </label>
                      <input
                        value={edu.degree}
                        onChange={(e) =>
                          handleArrayChange(
                            "education",
                            i,
                            "degree",
                            e.target.value,
                          )
                        }
                        className={errors[`edu_degree_${i}`] ? "error" : ""}
                      />
                    </div>
                    <div className="form-group span-2">
                      <label>
                        Institution / University{" "}
                        <span className="required">*</span>
                      </label>
                      <input
                        value={edu.institution}
                        onChange={(e) =>
                          handleArrayChange(
                            "education",
                            i,
                            "institution",
                            e.target.value,
                          )
                        }
                        className={errors[`edu_inst_${i}`] ? "error" : ""}
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Year of Passing <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        value={edu.year}
                        onChange={(e) =>
                          handleArrayChange(
                            "education",
                            i,
                            "year",
                            e.target.value,
                          )
                        }
                        className={errors[`edu_year_${i}`] ? "error" : ""}
                      />
                    </div>
                    <div className="form-group">
                      <label>Grade / Percentage</label>
                      <input
                        value={edu.grade}
                        onChange={(e) =>
                          handleArrayChange(
                            "education",
                            i,
                            "grade",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="divider-line"></div>

              <div className="section-toolbar">
                <h4>Languages</h4>
                <button
                  className="btn-mini-add"
                  onClick={() =>
                    addRow("languages", {
                      name: "",
                      proficiency: dynamicOptions.proficiencies[2],
                    })
                  }
                >
                  <Plus size={14} /> Add Language
                </button>
              </div>
              <div className="language-grid">
                {formData.languages.map((lang, i) => (
                  <div key={i} className="lang-input-row">
                    <input
                      placeholder="Language"
                      value={lang.name}
                      onChange={(e) =>
                        handleArrayChange(
                          "languages",
                          i,
                          "name",
                          e.target.value,
                        )
                      }
                    />
                    <select
                      value={lang.proficiency}
                      onChange={(e) =>
                        handleArrayChange(
                          "languages",
                          i,
                          "proficiency",
                          e.target.value,
                        )
                      }
                    >
                      {/* DYNAMIC LANGUAGE OPTIONS */}
                      {dynamicOptions.proficiencies.map((opt, idx) => (
                        <option key={idx} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {formData.languages.length > 1 && (
                      <button
                        className="btn-trash-mini"
                        onClick={() => removeRow("languages", i)}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: SKILLS & TECH LEVEL */}
          {activeStep === 4 && (
            <div className="form-section fade-in">
              <div className="form-group">
                <label>Core Competencies & Skills</label>
                <p className="hint-text mb-2">
                  Separate skills with commas (e.g. Leadership, Strategic
                  Planning, Logistics)
                </p>
                <textarea
                  className="skills-textarea"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="Start typing skills..."
                />
              </div>

              <div className="form-group mt-4">
                <label>Technology Proficiency Level</label>
                <div className="tech-level-selector">
                  {/* DYNAMIC TECH LEVELS */}
                  {dynamicOptions.techLevels.map((level) => (
                    <div
                      key={level}
                      className={`tech-card ${formData.techLevel === level ? "selected" : ""}`}
                      onClick={() =>
                        setFormData({ ...formData, techLevel: level })
                      }
                    >
                      <div className="check-ring"></div>
                      <span>{level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PREFERENCES (WORK MODE & TYPE) */}
          {activeStep === 5 && (
            <div className="form-section fade-in">
              <div className="form-grid">
                <div className="form-group">
                  <label>Preferred Work Mode</label>
                  <select
                    name="workMode"
                    value={formData.workMode}
                    onChange={handleChange}
                  >
                    {/* DYNAMIC WORK MODES */}
                    {dynamicOptions.workModes.map((mode, idx) => (
                      <option key={idx} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Engagement Type</label>
                  <select
                    name="workType"
                    value={formData.workType}
                    onChange={handleChange}
                  >
                    {/* DYNAMIC WORK TYPES */}
                    {dynamicOptions.workTypes.map((type, idx) => (
                      <option key={idx} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Weekly Availability</label>
                  <input
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    placeholder="e.g. 20 Hours / Week"
                  />
                </div>
                <div className="form-group">
                  <label>Expected Pay (Optional)</label>
                  <input
                    name="expectedCompensation"
                    value={formData.expectedCompensation}
                    onChange={handleChange}
                    placeholder="e.g. 50k - 80k INR"
                  />
                </div>
                <div className="form-group span-2">
                  <label>Health / Mobility Considerations</label>
                  <input
                    name="healthConsiderations"
                    value={formData.healthConsiderations}
                    onChange={handleChange}
                    placeholder="Any specific requirements..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: DOCUMENTS */}
          {activeStep === 6 && (
            <div className="form-section fade-in">
              <div className="upload-container">
                {/* Photo Upload */}
                <div className="upload-box">
                  <div className="preview-circle">
                    {previewImg || formData.photoUrl ? (
                      <img
                        src={previewImg || formData.photoUrl}
                        alt="Preview"
                      />
                    ) : (
                      <User size={48} />
                    )}
                  </div>
                  <h4>Profile Photo</h4>
                  <p>Professional headshot (JPG/PNG)</p>
                  <label className="custom-file-btn">
                    <Camera size={16} /> Upload Photo
                    <input
                      type="file"
                      name="photo"
                      accept="image/*"
                      onChange={handleFile}
                      hidden
                    />
                  </label>
                </div>

                {/* Resume Upload */}
                <div className="upload-box">
                  <div className="preview-icon">
                    <FileText size={48} />
                  </div>
                  <h4>Resume / CV</h4>
                  <p>
                    {formData.resume
                      ? formData.resume.name
                      : "PDF Format (Max 5MB)"}
                  </p>
                  <label
                    className={`custom-file-btn ${formData.resume ? "success" : ""}`}
                  >
                    {formData.resume ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Upload size={16} />
                    )}
                    {formData.resume ? "Change Resume" : "Upload Resume"}
                    <input
                      type="file"
                      name="resume"
                      accept=".pdf"
                      onChange={handleFile}
                      hidden
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- FOOTER ACTIONS --- */}
        <div className="form-footer">
          <div className="footer-left">
            {activeStep > 1 && (
              <button
                className="btn-back"
                onClick={() => setActiveStep((prev) => prev - 1)}
              >
                <ChevronLeft size={16} /> Previous
              </button>
            )}
          </div>
          <div className="footer-right">
            {activeStep < 6 ? (
              <button className="btn-next" onClick={handleNext}>
                Next Step <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="btn-save"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Loader className="spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                {loading ? "Saving..." : "Save & Finish"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// 4. STYLES (Refined Professional CSS)
// =========================================================
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

    /* GLOBAL RESET */
    * { box-sizing: border-box; }
    
    .page-container {
      min-height: 100vh;
      background-color: var(--bg-root); /* 櫨 Theme Var */
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: var(--text-main); /* 櫨 Theme Var */
      padding: 40px 20px;
      position: relative;
      overflow-x: hidden;
      transition: background-color 0.3s ease;
    }

    /* BACKGROUND DECORATIONS */
    .bg-decoration {
      position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; z-index: 0; pointer-events: none;
    }
    .b1 { width: 500px; height: 500px; top: -100px; left: -100px; background: #4f46e5; }
    .b2 { width: 600px; height: 600px; bottom: 0; right: -100px; background: var(--primary); }
    .bg-grid-pattern {
      position: absolute; inset: 0; 
      background-image: radial-gradient(var(--border) 1px, transparent 1px); /* 櫨 Theme Var */
      background-size: 30px 30px; opacity: 0.3; z-index: 0; pointer-events: none;
    }

    .main-layout { position: relative; z-index: 5; max-width: 1200px; margin: 0 auto; }

    /* LOADING STATE */
    .center-content { display: flex; align-items: center; justify-content: center; }
    .loader-box { text-align: center; color: var(--primary); }
    .loader-box p { color: var(--text-sub); margin-top: 10px; font-size: 14px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in-up { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .fade-in { animation: fadeUp 0.3s ease-out forwards; }

    /* ===============================
       PROFILE VIEW STYLES
       =============================== */
    .profile-view-wrapper { display: flex; flex-direction: column; gap: 24px; }

    /* Header */
    .profile-header {
      background: var(--bg-card); /* 櫨 Theme Var */
      backdrop-filter: blur(10px);
      border: 1px solid var(--border); 
      border-radius: 20px;
      overflow: hidden; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.2);
    }
    .cover-banner { height: 140px; background: linear-gradient(120deg, #1e293b, var(--primary-dim)); border-bottom: 1px solid var(--border); }
    .header-body { padding: 0 40px 40px 40px; display: flex; gap: 30px; margin-top: -60px; }
    
    .avatar-frame {
      width: 150px; height: 150px; border-radius: 24px; background: var(--bg-card);
      border: 4px solid var(--bg-card); overflow: hidden; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2); position: relative;
    }
    .avatar-frame img { width: 100%; height: 100%; object-fit: cover; }

    .header-details { flex: 1; padding-top: 70px; }
    .header-title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
    .header-title-row h1 { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; margin: 0; color: var(--text-main); }
    .headline { font-size: 16px; color: var(--primary); margin-top: 4px; font-weight: 500; }
    
    .btn-edit {
      background: var(--bg-input); border: 1px solid var(--border); color: var(--text-main);
      padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s;
    }
    .btn-edit:hover { background: var(--primary); color: #000; border-color: var(--primary); }

    .header-meta-grid { display: flex; flex-wrap: wrap; gap: 20px; font-size: 14px; color: var(--text-sub); }
    .meta-item { display: flex; align-items: center; gap: 8px; }

    /* Content Grid */
    .profile-content-grid { display: grid; grid-template-columns: 2.2fr 1fr; gap: 24px; }
    
    .detail-card {
      background: var(--bg-card); /* 櫨 Theme Var */
      border: 1px solid var(--border);
      border-radius: 16px; padding: 24px; margin-bottom: 24px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    .detail-card.compact { padding: 20px; margin-bottom: 20px; }

    .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .card-header h3 { margin: 0; font-size: 18px; font-weight: 700; font-family: 'Playfair Display', serif; color: var(--text-main); }
    .icon-badge { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .icon-badge.gold { background: var(--primary-dim); color: var(--primary); }
    .icon-badge.blue { background: rgba(99, 102, 241, 0.1); color: #6366f1; }

    /* Timeline */
    .timeline-wrapper { position: relative; padding-left: 10px; }
    .timeline-wrapper::before { content: ''; position: absolute; left: 15px; top: 5px; bottom: 0; width: 2px; background: var(--border); }
    .timeline-item { position: relative; padding-left: 40px; margin-bottom: 30px; }
    .timeline-item:last-child { margin-bottom: 0; }
    .timeline-marker { position: absolute; left: 0px; top: 5px; width: 12px; height: 12px; background: var(--primary); border-radius: 50%; border: 2px solid var(--bg-root); box-shadow: 0 0 0 3px var(--primary-dim); z-index: 1; }
    
    .job-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
    .job-header h4 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-main); }
    .job-date { font-size: 12px; color: var(--text-sub); font-weight: 600; }
    .company-name { display: block; font-size: 14px; color: var(--primary); margin-bottom: 8px; font-weight: 600; }
    .job-desc { font-size: 14px; color: var(--text-sub); line-height: 1.6; }

    /* Education List */
    .edu-item { display: flex; gap: 16px; margin-bottom: 20px; align-items: flex-start; }
    .edu-icon { width: 40px; height: 40px; border-radius: 8px; background: var(--bg-input); color: var(--text-sub); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .edu-details h4 { margin: 0 0 4px; font-size: 16px; color: var(--text-main); }
    .edu-details p { margin: 0 0 4px; color: var(--text-sub); font-size: 14px; }
    .edu-year { font-size: 12px; color: var(--text-sub); }
    .grade-badge { margin-left: auto; font-size: 12px; font-weight: 700; background: var(--bg-input); padding: 4px 8px; border-radius: 6px; color: var(--text-main); }

    /* Sidebar Items */
    .sidebar-title { font-size: 13px; font-weight: 700; color: var(--text-sub); text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; }
    
    .skills-cloud { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .skill-pill { font-size: 12px; background: var(--bg-input); border: 1px solid var(--border); padding: 5px 12px; border-radius: 20px; color: var(--text-main); }
    .proficiency-box { background: var(--primary-dim); border: 1px solid var(--primary); padding: 12px; border-radius: 8px; text-align: center; color: var(--primary); font-size: 13px; }
    
    .lang-item { display: flex; justify-content: space-between; font-size: 14px; padding: 8px 0; border-bottom: 1px solid var(--border); color: var(--text-main); }
    .lang-item:last-child { border: none; }
    .lang-level { color: var(--text-sub); font-size: 12px; }

    .pref-list li { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
    .pref-label { color: var(--text-sub); }
    .pref-val { font-weight: 600; color: var(--text-main); }

    .resume-box { background: var(--bg-input); border: 1px dashed var(--border); padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 12px; }
    .pdf-icon { color: var(--danger); }
    .resume-box h5 { margin: 0; font-size: 14px; color: var(--text-main); }
    .resume-box a { font-size: 12px; color: var(--primary); text-decoration: none; font-weight: 600; }
    .resume-box a:hover { text-decoration: underline; }

    /* ===============================
       EDITOR STYLES (WIZARD)
       =============================== */
    .editor-container {
      display: flex; height: 750px; 
      background: var(--bg-card); /* 櫨 Theme Var */
      border-radius: 24px; border: 1px solid var(--border);
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.2); overflow: hidden;
    }

    /* Editor Sidebar */
    .editor-sidebar { width: 280px; background: var(--bg-input); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 30px 20px; }
    .sidebar-brand { margin-bottom: 30px; padding-left: 10px; }
    .sidebar-brand h3 { margin: 0; font-family: 'Playfair Display', serif; font-size: 20px; color: var(--text-main); }
    .sidebar-brand p { font-size: 12px; color: var(--text-sub); margin-top: 4px; }

    .steps-nav { flex: 1; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }
    .nav-step { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; cursor: pointer; transition: 0.2s; border: 1px solid transparent; }
    .nav-step:hover { background: rgba(128, 128, 128, 0.1); }
    .nav-step.active { background: var(--primary-dim); border-color: var(--primary); }
    .nav-step.completed .step-indicator { background: var(--success); color: #fff; border-color: var(--success); }
    
    .step-indicator { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 14px; color: var(--text-sub); transition: 0.2s; flex-shrink: 0; }
    .nav-step.active .step-indicator { border-color: var(--primary); color: var(--primary); }
    
    .step-text { display: flex; flex-direction: column; }
    .step-text .label { font-size: 14px; font-weight: 600; color: var(--text-main); }
    .nav-step.active .step-text .label { color: var(--primary); }
    .step-text .sub { font-size: 11px; color: var(--text-sub); }

    .btn-cancel { margin-top: 20px; background: transparent; border: 1px solid var(--border); color: var(--text-sub); padding: 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 500; font-size: 13px; transition: 0.2s; }
    .btn-cancel:hover { border-color: var(--danger); color: var(--danger); }

    /* Editor Main Area */
    .editor-main { flex: 1; display: flex; flex-direction: column; background: var(--bg-card); position: relative; }
    
    .form-header { padding: 30px 40px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; }
    .form-header h2 { font-family: 'Playfair Display', serif; font-size: 24px; margin: 0 0 6px; color: var(--text-main); }
    .form-header p { font-size: 14px; color: var(--text-sub); margin: 0; }
    .step-count-badge { font-size: 12px; font-weight: 700; background: var(--bg-input); padding: 4px 10px; border-radius: 20px; color: var(--text-sub); border: 1px solid var(--border); }

    .form-body { flex: 1; padding: 40px; overflow-y: auto; }
    
    /* Inputs & Grids */
    .form-section { max-width: 800px; margin: 0 auto; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .span-2 { grid-column: span 2; }
    
    label { font-size: 13px; font-weight: 600; color: var(--text-sub); display: flex; align-items: center; }
    .required { color: var(--primary); margin-left: 3px; }
    
    .input-wrapper { position: relative; }
    .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-sub); }
    
    input, select, textarea {
      width: 100%; background: var(--bg-input); border: 1px solid var(--border);
      border-radius: 10px; padding: 12px 16px; color: var(--text-main); font-size: 14px; outline: none; transition: 0.2s;
    }

    select {
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 16px center;
        background-size: 16px;
        padding-right: 40px;
    }
    option { background: var(--bg-card); color: var(--text-main); }

    .input-wrapper input { padding-left: 42px; }
    input:focus, select:focus, textarea:focus { border-color: var(--primary); background-color: var(--bg-card); }
    input.error { border-color: var(--danger); background: rgba(239, 68, 68, 0.05); }
    .err-text { font-size: 11px; color: var(--danger); font-weight: 600; }
    .hint-text { font-size: 11px; color: var(--text-sub); }

    /* Repeater Items */
    .section-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .section-toolbar h4 { font-size: 16px; font-weight: 700; color: var(--text-main); margin: 0; }
    .btn-mini-add { background: var(--primary-dim); color: var(--primary); border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
    .btn-mini-add:hover { background: var(--primary); color: #000; }
    
    .empty-placeholder { text-align: center; border: 2px dashed var(--border); border-radius: 12px; padding: 40px; color: var(--text-sub); }
    .empty-placeholder svg { opacity: 0.5; margin-bottom: 10px; }
    .empty-placeholder button { margin-top: 15px; background: transparent; border: 1px solid var(--text-sub); color: var(--text-main); padding: 8px 16px; border-radius: 6px; cursor: pointer; }

    .repeater-item { background: var(--bg-input); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .repeater-header { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
    .item-badge { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-sub); background: var(--bg-card); padding: 4px 8px; border-radius: 4px; }
    .btn-trash { background: none; border: none; color: var(--danger); opacity: 0.7; cursor: pointer; transition: 0.2s; }
    .btn-trash:hover { opacity: 1; transform: scale(1.1); }

    /* Checkbox */
    .checkbox-group { margin-top: 5px; }
    .checkbox-container { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; user-select: none; color: var(--text-main); }
    .checkbox-container input { display: none; }
    .checkmark { height: 18px; width: 18px; background-color: var(--bg-input); border: 1px solid var(--border); border-radius: 4px; position: relative; }
    .checkbox-container input:checked ~ .checkmark { background-color: var(--primary); border-color: var(--primary); }
    .checkmark::after { content: ""; position: absolute; display: none; left: 5px; top: 1px; width: 4px; height: 9px; border: solid black; border-width: 0 2px 2px 0; transform: rotate(45deg); }
    .checkbox-container input:checked ~ .checkmark::after { display: block; }

    /* Tech Level Selector */
    .tech-level-selector { display: flex; gap: 15px; }
    .tech-card { flex: 1; background: var(--bg-input); border: 1px solid var(--border); padding: 15px; border-radius: 10px; text-align: center; cursor: pointer; transition: 0.2s; position: relative; color: var(--text-main); }
    .tech-card:hover { border-color: var(--primary); }
    .tech-card.selected { border-color: var(--primary); background: var(--primary-dim); color: var(--primary); font-weight: 600; }
    .check-ring { width: 14px; height: 14px; border: 2px solid var(--text-sub); border-radius: 50%; margin: 0 auto 8px; }
    .tech-card.selected .check-ring { border-color: var(--primary); background: var(--primary); }
    
    .divider-line { height: 1px; background: var(--border); margin: 30px 0; }
    
    .lang-input-row { display: grid; grid-template-columns: 2fr 1.5fr auto; gap: 15px; margin-bottom: 10px; }
    .btn-trash-mini { background: rgba(239, 68, 68, 0.2); border: none; color: var(--danger); width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

    /* File Upload */
    .upload-container { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .upload-box { border: 2px dashed var(--border); border-radius: 16px; padding: 40px; display: flex; flex-direction: column; align-items: center; text-align: center; background: var(--bg-input); transition: 0.2s; }
    .upload-box:hover { border-color: var(--primary); background: var(--primary-dim); }
    .preview-circle { width: 100px; height: 100px; border-radius: 50%; overflow: hidden; background: var(--bg-card); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); margin-bottom: 15px; }
    .preview-circle img { width: 100%; height: 100%; object-fit: cover; }
    .preview-icon { color: var(--text-sub); margin-bottom: 15px; }
    
    .custom-file-btn { margin-top: 15px; display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 13px; color: var(--text-main); }
    .custom-file-btn:hover { border-color: var(--primary); color: var(--primary); }
    .custom-file-btn.success { color: var(--success); border-color: var(--success); background: rgba(16, 185, 129, 0.1); }

    /* Footer Buttons */
    .form-footer { padding: 20px 40px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; background: var(--bg-card); backdrop-filter: blur(5px); }
    .btn-back { background: transparent; border: 1px solid var(--border); color: var(--text-sub); padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
    .btn-back:hover { color: var(--text-main); border-color: var(--text-main); }
    
    .btn-next, .btn-save { background: var(--primary); color: #020617; border: none; padding: 12px 30px; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 15px var(--primary-dim); }
    .btn-next:hover, .btn-save:hover { transform: translateY(-2px); box-shadow: 0 6px 20px var(--primary-dim); }
    .btn-save { background: var(--success); color: #fff; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); }
    .btn-save:hover { background: #059669; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); }

    /* Toast */
    .toast-notification { position: fixed; top: 20px; right: 20px; padding: 16px 24px; border-radius: 12px; background: var(--bg-card); color: var(--text-main); display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 1000; animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); border-left: 4px solid; }
    .toast-notification.success { border-color: var(--success); } .toast-notification.success svg { color: var(--success); }
    .toast-notification.error { border-color: var(--danger); } .toast-notification.error svg { color: var(--danger); }
    .toast-notification button { background: none; border: none; color: var(--text-sub); cursor: pointer; margin-left: 10px; }
    
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    /* RESPONSIVE */
    @media (max-width: 1024px) {
      .profile-content-grid { grid-template-columns: 1fr; }
      .editor-container { flex-direction: column; height: auto; overflow: visible; }
      .editor-sidebar { width: 100%; flex-direction: row; align-items: center; justify-content: space-between; overflow-x: auto; padding: 15px; border-right: none; border-bottom: 1px solid var(--border); }
      .steps-nav { flex-direction: row; gap: 10px; flex: none; }
      .nav-step { padding: 8px; }
      .step-text { display: none; }
      .sidebar-brand, .btn-cancel { display: none; }
      .editor-main { height: auto; }
      .form-body { overflow: visible; }
      .form-grid { grid-template-columns: 1fr; }
      .span-2 { grid-column: auto; }
      .header-body { flex-direction: column; align-items: center; text-align: center; margin-top: -80px; }
      .header-details { padding-top: 10px; width: 100%; }
      .header-title-row { flex-direction: column; gap: 15px; align-items: center; }
      .header-meta-grid { justify-content: center; }
    }

    @media (max-width: 768px) {
      .page-container { padding: 10px; }
      .upload-container { grid-template-columns: 1fr; }
      .lang-input-row { grid-template-columns: 1fr; gap: 10px; border-bottom: 1px solid var(--border); padding-bottom: 15px; margin-bottom: 15px; }
      .form-header { padding: 20px; flex-direction: column; gap: 10px; }
      .step-count-badge { align-self: flex-start; }
      .form-body { padding: 20px; }
      .form-footer { padding: 15px 20px; }
    }
  `}</style>
);

export default SeekerDetailsForm;
