import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Briefcase,
  CheckCircle,
  DollarSign,
  ChevronRight,
  Plus,
  X,
  Layout,
  Lock,
  Activity,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

const PostJob = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // --- DYNAMIC DATA STATE ---
  const [categories, setCategories] = useState([]);
  const [options, setOptions] = useState({
    roleCategories: [],
    seniorityLevels: [],
    educationLevels: [],
    educationCategories: [],
    workTypes: [],
    workModes: [],
    physicalDemands: [],
    travelRequirements: [],
    currencies: [],
    frequencies: [],
    urgencies: [],
  });

  // --- INITIAL LOAD & LIMIT CHECK ---
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Check Job Posting Limit (Dynamic from Admin Config)
        const limitRes = await api.get("/jobs/check-limit");

        // If canPost is false, show upgrade modal immediately
        if (limitRes.data && limitRes.data.canPost === false) {
          setShowUpgradeModal(true);
        }

        // 2. Fetch Categories
        const catRes = await api.get("/config/categories");
        setCategories(catRes.data);

        // 3. Fetch Global Options (SAFELY MERGE SO WE DONT LOSE ARRAYS)
        const configRes = await api.get("/config");
        setOptions((prev) => ({
          ...prev,
          ...(configRes.data || {}),
        }));
      } catch (err) {
        console.error("Init failed", err);
      }
    };
    init();
  }, []);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    // Tab 0: Role Details
    title: "",
    department: "",
    roleCategory: "",
    seniorityLevel: "",
    description: "",
    responsibilities: "", // 🔥 NEW FIELD ADDED
    openings: 1,
    urgency: "Standard",

    // Tab 1: Requirements
    skills: [],
    currentSkill: "",
    educationType: "",
    education: "",
    minExperience: "",
    maxExperience: "",

    // Tab 2: Logistics & Health
    workType: "",
    workMode: "",
    hoursPerWeek: "",
    physicalDemands: "",
    travelRequirement: "",
    durationValue: "",
    durationUnit: "Months",
    locations: "",

    // Tab 3: Compensation
    isVolunteer: false,
    currency: "INR",
    minSalary: "",
    maxSalary: "",
    frequency: "Monthly",
    customPerks: "",
  });

  // --- 🔥 NEW: CUSTOM FIELD TRACKING STATE ---
  // Tracks which dropdowns are currently set to "Other" so the input renders
  const [customFields, setCustomFields] = useState({});

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Clear the roleCategory if the department is changed
      if (name === "department") {
        updatedData.roleCategory = "";
        setCustomFields((c) => ({ ...c, roleCategory: false }));
      }

      // Clear the specific education if the category is changed
      if (name === "educationType") {
        updatedData.education = "";
        setCustomFields((c) => ({ ...c, education: false }));
      }

      return updatedData;
    });
  };

  // --- 🔥 NEW: SMART DROPDOWN HANDLER ---
  const handleSelectWithCustom = (e) => {
    const { name, value } = e.target;
    if (value === "OTHER_CUSTOM") {
      setCustomFields((prev) => ({ ...prev, [name]: true }));
      // Manually trigger handleChange with empty string so dependent logic clears properly
      handleChange({ target: { name, value: "", type: "text" } });
    } else {
      setCustomFields((prev) => ({ ...prev, [name]: false }));
      handleChange(e);
    }
  };

  const handleSkillAdd = (e) => {
    if (e.key === "Enter" && formData.currentSkill) {
      e.preventDefault();
      if (!formData.skills.includes(formData.currentSkill)) {
        setFormData({
          ...formData,
          skills: [...formData.skills, formData.currentSkill],
          currentSkill: "",
        });
      }
    }
  };

  const removeSkill = (i) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, idx) => idx !== i),
    });
  };

  // --- VALIDATION ---
  const validateStep = (step) => {
    switch (step) {
      case 0: // Role
        if (
          !formData.title ||
          !formData.department ||
          !formData.description ||
          !formData.responsibilities
        ) {
          toast.error(
            "Please fill in all required fields (including Responsibilities).",
          );
          return false;
        }
        return true;
      case 1: // Requirements
        if (!formData.educationType) {
          toast.error("Please select an Education Category.");
          return false;
        }
        if (!formData.education) {
          toast.error("Please select a Specific Qualification.");
          return false;
        }
        if (formData.minExperience === "" || formData.maxExperience === "") {
          toast.error("Please specify both Minimum and Maximum Experience.");
          return false;
        }
        return true;
      case 2: // Logistics
        if (!formData.hoursPerWeek) {
          toast.error("Hours per week is required.");
          return false;
        }
        return true;
      case 3: // Compensation
        if (
          !formData.isVolunteer &&
          (!formData.minSalary || !formData.maxSalary)
        ) {
          toast.error("Please specify a salary range.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeTab)) setActiveTab((prev) => prev + 1);
  };

  // --- NEW: HANDLE TAB CLICK (PREVENT SKIPPING) ---
  const handleTabClick = (tabId) => {
    // Allow going back freely
    if (tabId < activeTab) {
      setActiveTab(tabId);
      return;
    }

    // Prevent jumping ahead more than 1 step at a time (Sequential flow)
    if (tabId > activeTab + 1) {
      toast.error("Please complete the steps in order.");
      return;
    }

    // Validate current step before moving forward
    if (validateStep(activeTab)) {
      setActiveTab(tabId);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(activeTab)) return;
    setLoading(true);
    try {
      const locationsArray = formData.locations
        ? formData.locations.split(",").map((l) => l.trim())
        : [];
      const payload = { ...formData, locations: locationsArray };

      await api.post("/jobs", payload);
      toast.success("Job Posted Successfully!");
      setTimeout(() => navigate("/my-jobs"), 2000);
    } catch (err) {
      if (err.response?.data?.code === "LIMIT_REACHED") {
        setShowUpgradeModal(true);
      } else {
        toast.error(err.response?.data?.message || "Failed to post job");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- TABS CONFIG ---
  const tabs = [
    {
      id: 0,
      label: "Role Details",
      icon: <Briefcase size={16} />,
      desc: "Title, Dept & Description",
    },
    {
      id: 1,
      label: "Requirements",
      icon: <CheckCircle size={16} />,
      desc: "Skills & Education",
    },
    {
      id: 2,
      label: "Logistics",
      icon: <Activity size={16} />,
      desc: "Mode, Hours & Location",
    },
    {
      id: 3,
      label: "Compensation",
      icon: <DollarSign size={16} />,
      desc: "Salary & Perks",
    },
  ];

  // --- RENDER CONTENT PER TAB ---
  const renderContent = () => {
    // Top level variable derivation for smart dependent inputs
    const selectedDepartmentObj = categories.find(
      (cat) => cat.title === formData.department,
    );
    const dynamicRoleCategories = selectedDepartmentObj?.roleCategories || [];

    const selectedEduCatObj = (options.educationCategories || []).find(
      (cat) => cat.title === formData.educationType,
    );
    const dynamicEducation = selectedEduCatObj?.qualifications || [];

    switch (activeTab) {
      case 0:
        return (
          <div className="form-step slide-up">
            <div className="step-header">
              <h2>Role Information</h2>
              <p>Define the core identity and scope of the position.</p>
            </div>

            <div className="input-field">
              <label>
                Job Title <span className="req">*</span>
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Senior Financial Advisor"
              />
            </div>

            <div className="grid-2">
              <div className="input-field">
                <label>
                  Department <span className="req">*</span>
                </label>
                <select
                  name="department"
                  value={customFields.department ? "OTHER_CUSTOM" : formData.department}
                  onChange={handleSelectWithCustom}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.title}>
                      {cat.title}
                    </option>
                  ))}
                  <option value="OTHER_CUSTOM">Other (Type manually)</option>
                </select>
                {customFields.department && (
                  <input
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Type custom department..."
                    style={{ marginTop: "8px" }}
                    autoFocus
                  />
                )}
              </div>

              <div className="input-field">
                <label>Role Category</label>
                <select
                  name="roleCategory"
                  value={customFields.roleCategory ? "OTHER_CUSTOM" : formData.roleCategory}
                  onChange={handleSelectWithCustom}
                  disabled={!formData.department} // Disable if no department is selected
                >
                  <option value="">
                    {formData.department
                      ? "Select Role Type"
                      : "Select Department First"}
                  </option>
                  {dynamicRoleCategories.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                  {formData.department && (
                    <option value="OTHER_CUSTOM">Other (Type manually)</option>
                  )}
                </select>
                {customFields.roleCategory && (
                  <input
                    name="roleCategory"
                    value={formData.roleCategory}
                    onChange={handleChange}
                    placeholder="Type custom role category..."
                    style={{ marginTop: "8px" }}
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="grid-3">
              <div className="input-field">
                <label>Seniority Level</label>
                <select
                  name="seniorityLevel"
                  value={customFields.seniorityLevel ? "OTHER_CUSTOM" : formData.seniorityLevel}
                  onChange={handleSelectWithCustom}
                >
                  <option value="">Select Level</option>
                  {(options.seniorityLevels || []).map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="OTHER_CUSTOM">Other (Type manually)</option>
                </select>
                {customFields.seniorityLevel && (
                  <input
                    name="seniorityLevel"
                    value={formData.seniorityLevel}
                    onChange={handleChange}
                    placeholder="Type seniority level..."
                    style={{ marginTop: "8px" }}
                    autoFocus
                  />
                )}
              </div>
              <div className="input-field">
                <label>Openings</label>
                <input
                  type="number"
                  name="openings"
                  value={formData.openings}
                  onChange={handleChange}
                  min="1"
                />
              </div>
              <div className="input-field">
                <label>Urgency</label>
                <select
                  name="urgency"
                  value={customFields.urgency ? "OTHER_CUSTOM" : formData.urgency}
                  onChange={handleSelectWithCustom}
                >
                  {(options.urgencies || []).map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="OTHER_CUSTOM">Other (Type manually)</option>
                </select>
                {customFields.urgency && (
                  <input
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    placeholder="Type urgency..."
                    style={{ marginTop: "8px" }}
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="input-field">
              <label>
                Job Description / Summary <span className="req">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Brief summary of the role, impact, and expectations..."
              />
            </div>

            <div className="input-field">
              <label>
                Role & Responsibilities <span className="req">*</span>
              </label>
              <textarea
                name="responsibilities"
                value={formData.responsibilities}
                onChange={handleChange}
                rows="5"
                placeholder="• Lead the project team...&#10;• Coordinate with stakeholders...&#10;• Ensure quality standards..."
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="form-step slide-up">
            <div className="step-header">
              <h2>Experience & Skills</h2>
              <p>Specify the qualifications required for this role.</p>
            </div>

            <div className="grid-2">
              <div className="input-field">
                <label>
                  Education Category <span className="req">*</span>
                </label>
                <select
                  name="educationType"
                  value={customFields.educationType ? "OTHER_CUSTOM" : formData.educationType}
                  onChange={handleSelectWithCustom}
                >
                  <option value="">Select Category</option>
                  {(options.educationCategories || []).map((eduCat) => (
                    <option key={eduCat._id || eduCat.title} value={eduCat.title}>
                      {eduCat.title}
                    </option>
                  ))}
                  <option value="OTHER_CUSTOM">Other (Type manually)</option>
                </select>
                {customFields.educationType && (
                  <input
                    name="educationType"
                    value={formData.educationType}
                    onChange={handleChange}
                    placeholder="Type education category..."
                    style={{ marginTop: "8px" }}
                    autoFocus
                  />
                )}
              </div>

              <div className="input-field">
                <label>
                  Specific Qualification <span className="req">*</span>
                </label>
                <select
                  name="education"
                  value={customFields.education ? "OTHER_CUSTOM" : formData.education}
                  onChange={handleSelectWithCustom}
                  disabled={!formData.educationType}
                >
                  <option value="">
                    {formData.educationType
                      ? "Select Degree/Cert"
                      : "Select Category First"}
                  </option>
                  {dynamicEducation.map((deg, i) => (
                    <option key={i} value={deg}>
                      {deg}
                    </option>
                  ))}
                  {formData.educationType && (
                    <option value="OTHER_CUSTOM">Other (Type manually)</option>
                  )}
                </select>
                {customFields.education && (
                  <input
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="Type specific qualification..."
                    style={{ marginTop: "8px" }}
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="grid-2">
              <div className="input-field">
                <label>
                  Experience (Years) <span className="req">*</span>
                </label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="minExperience"
                    placeholder="Min"
                    value={formData.minExperience}
                    onChange={handleChange}
                    min="0"
                  />
                  <span className="divider">-</span>
                  <input
                    type="number"
                    name="maxExperience"
                    placeholder="Max"
                    value={formData.maxExperience}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>

              <div></div>
            </div>

            <div className="input-field">
              <label>
                Skills <span className="sub-hint">(Type and Press Enter)</span>
              </label>
              <input
                name="currentSkill"
                value={formData.currentSkill}
                onChange={handleChange}
                onKeyDown={handleSkillAdd}
                placeholder="e.g. Strategic Planning, Mentoring, Auditing"
              />
              <div className="modern-tags">
                {formData.skills.map((s, i) => (
                  <span key={i} className="modern-tag">
                    {s}{" "}
                    <button type="button" onClick={() => removeSkill(i)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-step slide-up">
            <div className="step-header">
              <h2>Logistics & Environment</h2>
              <p>
                Define the working conditions, location, and health
                considerations.
              </p>
            </div>

            <div className="grid-2">
              <div className="input-field">
                <label>Work Type</label>
                <select
                  name="workType"
                  value={customFields.workType ? "OTHER_CUSTOM" : formData.workType}
                  onChange={handleSelectWithCustom}
                >
                  <option value="">Select Type</option>
                  {(options.workTypes || []).map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="OTHER_CUSTOM">Other (Type manually)</option>
                </select>
                {customFields.workType && (
                  <input
                    name="workType"
                    value={formData.workType}
                    onChange={handleChange}
                    placeholder="Type work type..."
                    style={{ marginTop: "8px" }}
                    autoFocus
                  />
                )}
              </div>
              <div className="input-field">
                <label>Work Mode</label>
                <select
                  name="workMode"
                  value={customFields.workMode ? "OTHER_CUSTOM" : formData.workMode}
                  onChange={handleSelectWithCustom}
                >
                  <option value="">Select Mode</option>
                  {(options.workModes || []).map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="OTHER_CUSTOM">Other (Type manually)</option>
                </select>
                {customFields.workMode && (
                  <input
                    name="workMode"
                    value={formData.workMode}
                    onChange={handleChange}
                    placeholder="Type work mode..."
                    style={{ marginTop: "8px" }}
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="grid-2">
              <div className="input-field">
                <label>
                  Hours per Week <span className="req">*</span>
                </label>
                <input
                  type="number"
                  name="hoursPerWeek"
                  value={formData.hoursPerWeek}
                  onChange={handleChange}
                  placeholder="e.g. 15"
                />
              </div>
              <div className="input-field">
                <label>Project Duration</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    name="durationValue"
                    value={formData.durationValue}
                    onChange={handleChange}
                    placeholder="e.g. 6"
                  />
                  <select
                    name="durationUnit"
                    value={formData.durationUnit}
                    onChange={handleChange}
                  >
                    <option>Months</option>
                    <option>Weeks</option>
                    <option>Indefinite</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="highlight-box">
              <div className="input-field m-0">
                <label>Physical Demands</label>
                <select
                  name="physicalDemands"
                  value={customFields.physicalDemands ? "OTHER_CUSTOM" : formData.physicalDemands}
                  onChange={handleSelectWithCustom}
                >
                  <option value="">Select Requirement</option>
                  {(options.physicalDemands || []).map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="OTHER_CUSTOM">Other (Type manually)</option>
                </select>
                {customFields.physicalDemands && (
                  <input
                    name="physicalDemands"
                    value={formData.physicalDemands}
                    onChange={handleChange}
                    placeholder="Type physical demands..."
                    style={{ marginTop: "8px" }}
                    autoFocus
                  />
                )}
              </div>
              <div className="input-field m-0">
                <label>Travel Requirements</label>
                <select
                  name="travelRequirement"
                  value={customFields.travelRequirement ? "OTHER_CUSTOM" : formData.travelRequirement}
                  onChange={handleSelectWithCustom}
                >
                  <option value="">Select Requirement</option>
                  {(options.travelRequirements || []).map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="OTHER_CUSTOM">Other (Type manually)</option>
                </select>
                {customFields.travelRequirement && (
                  <input
                    name="travelRequirement"
                    value={formData.travelRequirement}
                    onChange={handleChange}
                    placeholder="Type travel requirements..."
                    style={{ marginTop: "8px" }}
                    autoFocus
                  />
                )}
              </div>
            </div>

            {formData.workMode !== "Remote" && (
              <div className="input-field mt-4">
                <label>Office Location (City)</label>
                <input
                  name="locations"
                  value={formData.locations}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai, Delhi"
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="form-step slide-up">
            <div className="step-header">
              <h2>Compensation & Perks</h2>
              <p>Set clear expectations for remuneration and benefits.</p>
            </div>

            <div className="input-field">
              <label>Compensation Type</label>
              <div className="segmented-control">
                <label className={!formData.isVolunteer ? "active" : ""}>
                  <input
                    type="radio"
                    name="isVolunteer"
                    value={false}
                    checked={!formData.isVolunteer}
                    onChange={() =>
                      setFormData({ ...formData, isVolunteer: false })
                    }
                  />
                  Paid Opportunity
                </label>
                <label className={formData.isVolunteer ? "active" : ""}>
                  <input
                    type="radio"
                    name="isVolunteer"
                    value={true}
                    checked={formData.isVolunteer}
                    onChange={() =>
                      setFormData({ ...formData, isVolunteer: true })
                    }
                  />
                  Volunteer / Unpaid
                </label>
              </div>
            </div>

            {!formData.isVolunteer && (
              <div className="grid-3">
                <div className="input-field">
                  <label>Currency</label>
                  <select
                    name="currency"
                    value={customFields.currency ? "OTHER_CUSTOM" : formData.currency}
                    onChange={handleSelectWithCustom}
                  >
                    {(options.currencies || []).map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value="OTHER_CUSTOM">Other (Type manually)</option>
                  </select>
                  {customFields.currency && (
                    <input
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      placeholder="Type currency..."
                      style={{ marginTop: "8px" }}
                      autoFocus
                    />
                  )}
                </div>
                <div className="input-field">
                  <label>
                    Salary Range <span className="req">*</span>
                  </label>
                  <div className="range-inputs">
                    <input
                      type="number"
                      name="minSalary"
                      placeholder="Min"
                      value={formData.minSalary}
                      onChange={handleChange}
                    />
                    <span className="divider">-</span>
                    <input
                      type="number"
                      name="maxSalary"
                      placeholder="Max"
                      value={formData.maxSalary}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="input-field">
                  <label>Frequency</label>
                  <select
                    name="frequency"
                    value={customFields.frequency ? "OTHER_CUSTOM" : formData.frequency}
                    onChange={handleSelectWithCustom}
                  >
                    {(options.frequencies || []).map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value="OTHER_CUSTOM">Other (Type manually)</option>
                  </select>
                  {customFields.frequency && (
                    <input
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      placeholder="Type frequency..."
                      style={{ marginTop: "8px" }}
                      autoFocus
                    />
                  )}
                </div>
              </div>
            )}
            <div className="input-field">
              <label>Perks & Benefits</label>
              <textarea
                name="customPerks"
                value={formData.customPerks}
                onChange={handleChange}
                rows="4"
                placeholder="List benefits relevant to seniors (e.g. Flexible timings, Health Insurance)..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modern-post-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        /* --- PAGE WRAPPER --- */
        .modern-post-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root);
          background-size: 30px 30px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          padding: 60px 20px;
          display: flex; flex-direction: column; align-items: center;
          color: var(--text-main);
          transition: background-color 0.3s ease;
        }

        /* --- TOP NAVIGATION BAR --- */
        .top-nav {
            width: 100%;
            max-width: 800px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .back-btn {
            display: flex; align-items: center; gap: 8px;
            background: var(--bg-card); border: 1px solid var(--border);
            color: var(--text-main); padding: 10px 16px; border-radius: 50px;
            font-size: 14px; font-weight: 600; cursor: pointer;
            transition: 0.2s ease; box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }
        .back-btn:hover { background: var(--bg-input); transform: translateX(-2px); }
        .nav-title {
            font-family: 'Playfair Display', serif; font-size: 24px;
            font-weight: 700; margin: 0;
        }

        /* --- MAIN FORM CONTAINER --- */
        .form-container {
          width: 100%; max-width: 800px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 24px;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          z-index: 5;
        }

        /* --- HORIZONTAL STEPPER --- */
        .stepper-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 30px 40px;
            border-bottom: 1px solid var(--border);
            background: var(--bg-input);
            position: relative;
        }
        
        .step {
            display: flex; flex-direction: column; align-items: center; gap: 8px;
            position: relative; z-index: 2; cursor: pointer; flex: 1;
        }
        .step-circle {
            width: 36px; height: 36px; border-radius: 50%;
            background: var(--bg-card); border: 2px solid var(--border);
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 14px; color: var(--text-sub);
            transition: 0.3s ease;
        }
        .step-label {
            font-size: 12px; font-weight: 600; color: var(--text-sub);
            text-align: center; transition: 0.3s ease;
        }

        .step::after {
            content: ''; position: absolute; top: 18px; left: 50%;
            width: 100%; height: 2px; background: var(--border);
            z-index: -1;
        }
        .step:last-child::after { display: none; }

        .step.active .step-circle {
            border-color: var(--primary); background: var(--primary); color: #000;
            box-shadow: 0 0 0 4px var(--primary-dim);
        }
        .step.active .step-label { color: var(--text-main); }
        
        .step.completed .step-circle {
            background: var(--primary); border-color: var(--primary); color: #000;
        }
        .step.completed .step-label { color: var(--text-main); }
        .step.completed::after { background: var(--primary); }

        /* --- FORM CONTENT --- */
        .form-content-area {
            padding: 40px 50px;
            min-height: 400px;
        }
        
        .step-header { margin-bottom: 30px; }
        .step-header h2 { font-size: 22px; font-weight: 700; margin: 0 0 6px 0; color: var(--text-main); }
        .step-header p { margin: 0; color: var(--text-sub); font-size: 14px; }

        /* --- INPUTS --- */
        .input-field { margin-bottom: 24px; }
        .input-field label { 
            display: block; font-size: 13px; font-weight: 600; 
            color: var(--text-main); margin-bottom: 8px; 
        }
        .req { color: var(--primary); margin-left: 2px; }
        .sub-hint { font-size: 11px; color: var(--text-muted); font-weight: 400; margin-left: 5px; }
        
        input, select, textarea { 
            width: 100%; padding: 14px 18px; 
            border: 1px solid var(--border); border-radius: 12px; 
            background: var(--bg-root); color: var(--text-main); 
            font-size: 14px; font-weight: 500; outline: none; transition: 0.2s ease;
            box-sizing: border-box;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        select {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 18px center;
            background-size: 16px;
            padding-right: 40px;
        }

        input:focus, select:focus, textarea:focus { 
            border-color: var(--primary); background-color: var(--bg-card);
            box-shadow: 0 0 0 3px var(--primary-dim);
        }
        textarea { resize: vertical; min-height: 100px; }
        option { background: var(--bg-card); color: var(--text-main); }

        /* Grids */
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        
        .range-inputs { display: flex; align-items: center; gap: 10px; }
        .divider { color: var(--text-sub); font-weight: bold; }

        /* Highlight Box (Logistics) */
        .highlight-box {
            background: var(--bg-input); border: 1px solid var(--border);
            padding: 24px; border-radius: 16px; display: grid; 
            grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 10px;
        }
        .m-0 { margin: 0; }
        .mt-4 { margin-top: 24px; }

        /* Segmented Control (Radio Pills) */
        .segmented-control { 
            display: flex; background: var(--bg-root); padding: 6px; 
            border-radius: 14px; border: 1px solid var(--border);
        }
        .segmented-control label { 
            flex: 1; text-align: center; padding: 12px 0; margin: 0;
            border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600;
            color: var(--text-sub); transition: 0.3s ease;
        }
        .segmented-control label input { display: none; }
        .segmented-control label.active { 
            background: var(--bg-card); color: var(--text-main);
            box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid var(--border);
        }

        /* Modern Tags */
        .modern-tags { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
        .modern-tag {
            background: var(--bg-card); border: 1px solid var(--border);
            color: var(--text-main); font-size: 13px; font-weight: 500;
            padding: 6px 12px 6px 16px; border-radius: 20px;
            display: flex; align-items: center; gap: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.02);
        }
        .modern-tag button {
            background: var(--bg-input); border: none; border-radius: 50%;
            width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
            color: var(--text-sub); cursor: pointer; transition: 0.2s; padding: 0;
        }
        .modern-tag button:hover { background: var(--danger); color: white; }

        /* --- FOOTER ACTION BAR --- */
        .form-actions {
            padding: 24px 50px; background: var(--bg-input);
            border-top: 1px solid var(--border);
            display: flex; justify-content: space-between; align-items: center;
        }
        .btn {
            padding: 14px 28px; border-radius: 12px; font-size: 15px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center; gap: 8px;
            transition: 0.2s ease; border: none;
        }
        .btn-outline {
            background: var(--bg-card); border: 1px solid var(--border); color: var(--text-main);
        }
        .btn-outline:hover:not(:disabled) { border-color: var(--text-sub); }
        .btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }
        
        .btn-solid {
            background: var(--text-main); color: var(--bg-card);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .btn-solid:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
        
        .btn-publish {
            background: linear-gradient(135deg, #f59e0b 0%, #f59e0b 100%); color: white;
           
        }
        .btn-publish:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 0px 20px rgba(198, 213, 95, 0.93); }
        .btn-publish:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Animations */
        .slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUp { 
            0% { opacity: 0; transform: translateY(20px); } 
            100% { opacity: 1; transform: translateY(0); } 
        }

        /* --- UPGRADE MODAL --- */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(8px); }
        .modal-wrapper { background: var(--bg-card); padding: 40px; border-radius: 24px; width: 450px; text-align: center; border: 1px solid var(--border); box-shadow: 0 25px 50px rgba(0,0,0,0.3); position: relative; overflow: hidden; }
        .modal-wrapper::before { content: ''; position: absolute; top:0; left:0; right:0; height: 4px; background: linear-gradient(90deg, var(--primary), #b45309); }
        .btn-upgrade { background: var(--primary); color: #000; padding: 14px; width: 100%; border-radius: 12px; margin-top: 20px; cursor: pointer; font-weight: 700; border: none; font-size: 15px; transition: 0.2s; }
        .btn-upgrade:hover { transform: scale(1.02); }
        
        /* --- RESPONSIVE --- */
        @media (max-width: 768px) {
            .modern-post-wrapper { padding: 20px 10px; }
            .top-nav { flex-direction: column; gap: 15px; align-items: flex-start; }
            .stepper-container { padding: 20px; overflow-x: auto; justify-content: flex-start; gap: 40px; }
            .step::after { width: 40px; left: 100%; top: 18px; margin-left: -20px; }
            .form-content-area { padding: 30px 20px; }
            .grid-2, .grid-3, .highlight-box { grid-template-columns: 1fr; }
            .form-actions { padding: 20px; flex-direction: column-reverse; gap: 15px; }
            .form-actions .btn { width: 100%; justify-content: center; }
            .range-inputs { flex-direction: column; }
            .divider { display: none; }
        }
      `}</style>

      {/* TOP NAVIGATION */}
      <div className="top-nav">
        <button className="back-btn" onClick={() => navigate("/my-jobs")}>
          <ArrowLeft size={18} /> Back to Jobs
        </button>
        <h1 className="nav-title">Post a New Opportunity</h1>
        <div style={{ width: "120px" }}></div> {/* Spacer for centering */}
      </div>

      <div className="form-container">
        {/* HORIZONTAL STEPPER */}
        <div className="stepper-container">
          {tabs.map((tab, i) => (
            <div
              key={tab.id}
              className={`step ${activeTab === i ? "active" : ""} ${activeTab > i ? "completed" : ""}`}
              onClick={() => handleTabClick(i)}
            >
              <div className="step-circle">
                {activeTab > i ? <Check size={16} strokeWidth={3} /> : i + 1}
              </div>
              <span className="step-label">{tab.label}</span>
            </div>
          ))}
        </div>

        {/* FORM CONTENT */}
        <div className="form-content-area">
          <form onSubmit={(e) => e.preventDefault()}>{renderContent()}</form>
        </div>

        {/* ACTION BAR */}
        <div className="form-actions">
          <button
            className="btn btn-outline"
            onClick={() => setActiveTab((prev) => Math.max(0, prev - 1))}
            disabled={activeTab === 0}
          >
            Back
          </button>

          {activeTab < tabs.length - 1 ? (
            <button className="btn btn-solid" onClick={handleNext}>
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button
              className="btn btn-publish"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                "Publishing..."
              ) : (
                <>
                  Publish Job <Sparkles size={18} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="modal-overlay">
          <div className="modal-wrapper">
            <div
              style={{
                background: "var(--primary-dim)",
                width: 80,
                height: 80,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                border: "1px solid var(--primary)",
              }}
            >
              <Lock size={40} color="var(--primary)" />
            </div>
            <h2
              style={{
                color: "var(--text-main)",
                fontSize: "24px",
                marginBottom: "10px",
              }}
            >
              Post Limit Reached
            </h2>
            <p
              style={{
                color: "var(--text-sub)",
                fontSize: "15px",
                lineHeight: 1.6,
              }}
            >
              You have reached your free job posting limit. <br />
              Upgrade to our <b>Premium Plan</b> to post unlimited opportunities
              and access top talent.
            </p>
            <button
              className="btn-upgrade"
              onClick={() => navigate("/billing")}
            >
              View Premium Plans
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                marginTop: 15,
                cursor: "pointer",
                color: "var(--text-sub)",
                fontSize: "14px",
              }}
              onClick={() => navigate("/my-jobs")}
            >
              Not Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostJob;