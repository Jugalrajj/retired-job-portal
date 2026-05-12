import React, { useState, useRef } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import useThemeStore from "../../context/useThemeStore"; 
import useAuthStore from "../../context/useAuthStore"; 
import { useNavigate } from "react-router-dom";
import { 
  Loader2, Download, Sparkles,FileText, ChevronDown, ChevronUp, 
  Plus, Edit2, Type, Image as ImageIcon, X,Crown
} from "lucide-react";

const AiResumeMaker = () => {
  const navigate = useNavigate();
  
  // --- THEME & AUTH STATE ---
  const { theme } = useThemeStore();
  const { user } = useAuthStore();

  // --- NEW: SUBSCRIPTION STATUS CHECK ---
  const currentUser = user?.user || user;
  const userPlan = currentUser?.planName || currentUser?.planType || currentUser?.subscription?.planName || currentUser?.plan || "";
  const isPro = 
    userPlan.toLowerCase().includes("pro") || 
    currentUser?.isPremium === true ||
    currentUser?.subscription?.status === "active";

  // --- TABS ---
  const [activeTab, setActiveTab] = useState("editor"); // 'editor', 'formatting'

  // --- FORMATTING STATE ---
  const [fontFormat, setFontFormat] = useState("'Inter', sans-serif");
  const [colorFormat, setColorFormat] = useState("#2563eb");
  const [spacingFormat, setSpacingFormat] = useState("normal");

  // Preserved original state + New UI states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    jobTitle: "",
    skills: "",
    experience: "",
    projects: "",
    education: "",
    city: "",
    country: "",
    experienceLevel: "Fresher",
    profileSummary: "",
    companyName: "",
    designation: "",
    projectName: "",
    isCurrentJob: true,
    startDateMonth: "",
    startDateYear: "",
    endDateMonth: "",
    endDateYear: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false); 
  
  // Accordion State
  const [openSections, setOpenSections] = useState({
    personal: true,
    summary: true,
    education: false,
    experience: false,
    skills: false,
    projects: false
  });

  // Dynamic Additions State
  const [photoPreview, setPhotoPreview] = useState(null);
  const [extraEducations, setExtraEducations] = useState([]);
  const [extraExperiences, setExtraExperiences] = useState([]);
  const [customSectionsData, setCustomSectionsData] = useState([]);

  // Refs
  const fileInputRef = useRef(null);
  const summaryRef = useRef(null);
  const experienceRef = useRef(null);
  const projectsRef = useRef(null);
  const printRef = useRef(null);
  const previewSectionRef = useRef(null);

  const [aiLoadingField, setAiLoadingField] = useState(null);

  // Date constants
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 40}, (_, i) => currentYear - i);

  // --- STYLES GENERATOR ---
  const getTemplateStyles = () => {
    const baseFont = fontFormat || "'Inter', sans-serif";
    const accentColor = colorFormat || "#2563eb";
    const padding = spacingFormat === 'compact' ? '20px' : spacingFormat === 'spacious' ? '50px' : '40px';
    const lineHt = spacingFormat === 'compact' ? '1.4' : spacingFormat === 'spacious' ? '1.8' : '1.6';
    const marginBtm = spacingFormat === 'compact' ? '12px' : spacingFormat === 'spacious' ? '24px' : '16px';

    let css = `
      .resume-master-container {
        --primary-color: ${accentColor};
        --font-main: ${baseFont};
        --line-ht: ${lineHt};
        --spacing: ${padding};
        --margin-btm: ${marginBtm};
        font-family: var(--font-main);
        line-height: var(--line-ht);
        color: #334155;
        width: 100%;
        max-width: 850px;
        margin: 0 auto;
        background: #ffffff;
        box-sizing: border-box;
        padding: 50px; 
        min-height: 1100px;
      }
      .resume-master-container * { box-sizing: border-box; }
      .header-wrapper { display: flex; align-items: center; gap: 30px; background: #f8fafc; padding: 40px; border-radius: 16px; margin-bottom: 40px; border-left: 8px solid var(--primary-color); box-shadow: 0 4px 10px rgba(0,0,0,0.03);}
      .header-info { flex: 1; }
      .resume-header-name { font-size: 2.6rem; color: #0f172a; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px;}
      .resume-header-title { font-size: 1.2rem; color: var(--primary-color); font-weight: 600; margin-bottom: 12px;}
      .resume-contact { color: #475569; font-size: 0.95rem; line-height: 1.5; }
      .photo-container img { width: 140px; height: 140px; border-radius: 50%; object-fit: cover; border: 4px solid #ffffff; box-shadow: 0 10px 20px rgba(0,0,0,0.1);}
      .resume-section-title { font-size: 1.3rem; color: #0f172a; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; margin-top: 35px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;}
      .resume-section-title::before { content: ''; display: inline-block; width: 14px; height: 14px; background: var(--primary-color); border-radius: 4px; }
      .item-container { margin-bottom: 24px; padding-left: 26px; border-left: 2px solid #e2e8f0; position: relative;}
      .item-container::before { content: ''; position: absolute; left: -7px; top: 6px; width: 12px; height: 12px; background: #fff; border: 2px solid var(--primary-color); border-radius: 50%; }
      .item-header { font-size: 1.15rem; color: #0f172a; font-weight: 700; margin-bottom: 4px; }
      .item-meta { color: #64748b; font-size: 0.95rem; font-weight: 500; margin-bottom: 10px; }
      p { color: #334155; line-height: 1.6; font-size: 1rem; }
      ul { color: #334155; line-height: 1.6; padding-left: 20px; }
    `;
    return `<style>${css}</style>`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRadioChange = (level) => {
    setFormData({ ...formData, experienceLevel: level });
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyFormatting = (tag, field, textareaRef) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = formData[field] || "";
    
    if (start === end) {
      toast.error("Please select some text to format first.");
      return;
    }

    const selectedText = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    let wrapped = "";
    if (tag === 'B') wrapped = `<b>${selectedText}</b>`;
    if (tag === 'I') wrapped = `<i>${selectedText}</i>`;
    if (tag === 'U') wrapped = `<u>${selectedText}</u>`;

    const newText = before + wrapped + after;
    setFormData(prev => ({ ...prev, [field]: newText }));
    
    setTimeout(() => {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start + 3, start + 3 + selectedText.length);
    }, 0);
  };

  const addEducation = () => setExtraEducations([...extraEducations, { id: Date.now(), text: '' }]);
  const updateExtraEducation = (id, val) => setExtraEducations(prev => prev.map(e => e.id === id ? { ...e, text: val } : e));
  const removeExtraEducation = (id) => setExtraEducations(prev => prev.filter(e => e.id !== id));

  const addExperience = () => setExtraExperiences([...extraExperiences, { 
    id: Date.now(), 
    companyName: '', 
    designation: '', 
    experience: '',
    isCurrentJob: true,
    startDateMonth: '',
    startDateYear: '',
    endDateMonth: '',
    endDateYear: ''
  }]);
  const updateExtraExperience = (id, field, val) => setExtraExperiences(prev => prev.map(e => e.id === id ? { ...e, [field]: val } : e));
  const removeExtraExperience = (id) => setExtraExperiences(prev => prev.filter(e => e.id !== id));

  const addCustomSection = (title) => {
    if (customSectionsData.some(s => s.title === title)) {
      toast.error(`${title} section already added!`);
      return;
    }
    setCustomSectionsData([...customSectionsData, { id: Date.now(), title, content: '' }]);
    setOpenSections(prev => ({ ...prev, [title]: true }));
    toast.success(`${title} section added! Scroll down to fill it.`);
  };
  const updateCustomSection = (id, val) => setCustomSectionsData(prev => prev.map(s => s.id === id ? { ...s, content: val } : s));
  const removeCustomSection = (id) => setCustomSectionsData(prev => prev.filter(s => s.id !== id));

  const handleWriteWithAI = async (e, field) => {
    e.preventDefault();
    if (!user?.user?._id) {
      toast.error("Please log in to use AI features.");
      return;
    }

    // --- PRO CHECK ENFORCEMENT ---
    if (!isPro) {
      toast.error("AI Writing features are exclusive to Pro Seekers.");
      setShowUpgradeModal(true);
      return;
    }

    let aiContext = { ...formData };

    if (field === 'experience') {
      if (!formData.designation) {
        toast.error("Please fill in the Designation first!");
        return;
      }
      aiContext.jobTitle = formData.designation; 
    } else if (field === 'projects') {
      if (!formData.projectName) {
        toast.error("Please fill in the Project Name first!");
        return;
      }
      aiContext.projectName = formData.projectName;
    } else {
      if (!formData.jobTitle && !formData.designation && !formData.fullName) {
        toast.error("Please fill in your Name and Job Title/Designation first so the AI knows who you are!");
        return;
      }
    }
    
    setAiLoadingField(field);
    try {
      const response = await api.post("/resume/generate-section", { 
        field, 
        context: aiContext,
        userId: user.user._id
      });
      
      setFormData(prev => ({ ...prev, [field]: response.data.generatedText }));
      toast.success(`${field.replace(/([A-Z])/g, ' $1').trim()} generated with AI!`);
      
    } catch (error) {
      console.error("AI section generation error:", error);
      const errorMessage = error.response?.data?.message || error.message || String(error);
      if (errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("GoogleGenerativeAI")) {
        toast.error("The AI model is currently experiencing high demand. Please wait a moment and try again.");
      } else {
        toast.error(error.response?.data?.message || "Failed to generate AI content. Make sure your backend endpoint is running.");
      }
    } finally {
      setAiLoadingField(null);
    }
  };

  const handleWriteWithAIExtraExp = async (e, expId) => {
    e.preventDefault();
    if (!user?.user?._id) {
      toast.error("Please log in to use AI features.");
      return;
    }

    // --- PRO CHECK ENFORCEMENT ---
    if (!isPro) {
      toast.error("AI Writing features are exclusive to Pro Seekers.");
      setShowUpgradeModal(true);
      return;
    }

    const expData = extraExperiences.find(ex => ex.id === expId);
    
    if (!expData.designation) {
      toast.error("Please fill in the Designation for this role first!");
      return;
    }

    setAiLoadingField(`experience_${expId}`);
    try {
      const response = await api.post("/resume/generate-section", {
        field: 'experience',
        context: {
          fullName: formData.fullName,
          jobTitle: expData.designation,
          companyName: expData.companyName,
          skills: formData.skills,
          experienceLevel: formData.experienceLevel
        },
        userId: user.user._id
      });

      updateExtraExperience(expId, 'experience', response.data.generatedText);
      toast.success("Experience generated with AI!");
    } catch (error) {
      console.error("AI section generation error:", error);
      const errorMessage = error.response?.data?.message || error.message || String(error);
      if (errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("GoogleGenerativeAI")) {
        toast.error("The AI model is currently experiencing high demand. Please wait a moment and try again.");
      } else {
        toast.error(error.response?.data?.message || "Failed to generate AI content.");
      }
    } finally {
      setAiLoadingField(null);
    }
  };

  const formatExpString = (expData) => {
    if (!expData.companyName && !expData.designation) return "";
    let dateStr = "";
    if (expData.startDateMonth && expData.startDateYear) {
      dateStr = `${expData.startDateMonth}/${expData.startDateYear} - ${expData.isCurrentJob ? 'Present' : (expData.endDateMonth ? expData.endDateMonth + '/' + expData.endDateYear : expData.endDateYear)}`;
    }
    return `Company: ${expData.companyName} | Role: ${expData.designation} ${dateStr ? '| Dates: ' + dateStr : ''}\n${expData.experience}`;
  };

  const handleGenerate = async (e) => {
    if(e) e.preventDefault();

    if (!user?.user?._id) {
      toast.error("Please log in to generate and save your AI Resume.");
      return;
    }

    setLoading(true);
    setGeneratedResume(null);

    const combinedEducation = [
      formData.education, 
      ...extraEducations.map(e => e.text)
    ].filter(Boolean).join('\n\n---\n');

    const combinedExperience = [
      formatExpString(formData),
      ...extraExperiences.map(e => formatExpString(e))
    ].filter(Boolean).join('\n\n---\n');

    const combinedProjects = formData.projectName 
      ? `Project: ${formData.projectName}\n${formData.projects}` 
      : formData.projects;

    const finalPayload = {
      ...formData,
      userId: user.user._id,
      education: combinedEducation,
      experience: combinedExperience,
      projects: combinedProjects, 
      customSections: customSectionsData, 
      photo: photoPreview,
      fontFormat,      
      colorFormat,     
      spacingFormat    
    };

    try {
      const response = await api.post("/resume/generate", finalPayload);
      setGeneratedResume(response.data.resumeHtml);
      toast.success("Resume generated successfully!");
      
      setTimeout(() => {
        previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);

    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || error.message || String(error);
      if (error.response?.data?.code === "LIMIT_REACHED") {
        setShowUpgradeModal(true);
      } else if (errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("GoogleGenerativeAI")) {
        toast.error("The AI model is currently experiencing high demand. Please wait a moment and try again.");
      } else {
        toast.error(error.response?.data?.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(`
      <html>
        <head>
          <title>Resume</title>
          ${getTemplateStyles()}
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; }
              @page { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    iframe.contentWindow.document.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
       iframe.contentWindow.print();
       setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 250);
  };

  return (
    <div className="vertical-resume-layout">
      
      {/* UPGRADE MODAL  */}
      {showUpgradeModal && (
        <div className="vr-modal-overlay">
          <div className="vr-modal-content fade-in">
            <div className="vr-modal-icon">
              <Crown size={48} color="#f59e0b" />
            </div>
            <h2 className="vr-modal-title">Premium Feature</h2>
            <p className="vr-modal-desc">
              You've discovered a Pro feature! Upgrade to a Pro plan to unlock unlimited AI Writing and advanced tools.
            </p>
            <div className="vr-modal-actions">
              <button className="vr-modal-btn cancel" onClick={() => setShowUpgradeModal(false)}>Cancel</button>
              <button className="vr-modal-btn upgrade" onClick={() => navigate('/seeker-billing')}>View Pro Plans <Sparkles size={16}/></button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER TABS */}
      <div className="vr-top-tabs">
        <button className={`vr-tab ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>
          <Edit2 size={16} className="text-purple-500" /> AI editor
        </button>
        <button className={`vr-tab ${activeTab === 'formatting' ? 'active' : ''}`} onClick={() => setActiveTab('formatting')}>
          <Type size={16} className="text-orange-500" /> Formatting
        </button>
      </div>

      <div className="vr-hero">
        <h1 className="vr-title">Craft Your Perfect Resume</h1>
        <p className="vr-subtitle">
          {activeTab === 'editor' ? "Fill in your details below. Use the AI capabilities to auto-write sections." :
           "Adjust your global formatting preferences."}
        </p>
      </div>

      <div className="vr-container">
        
        {/* =====================
            TAB 1: FORMATTING VIEW 
            ===================== */}
        {activeTab === 'formatting' && (
          <div className="vr-formatting-view">
            <div className="vr-accordion-card">
              <div className="vr-accordion-body" style={{ paddingTop: '24px' }}>
                
                {/* Font Style */}
                <div className="vr-input-group">
                  <label>Font Style</label>
                  <select 
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--vr-border)', outline: 'none', background: 'var(--vr-input)', color: 'var(--vr-text-main)' }}
                    value={fontFormat} 
                    onChange={(e) => setFontFormat(e.target.value)}
                  >
                    <option value="'Inter', sans-serif">Modern & Clean (Inter)</option>
                    <option value="'Playfair Display', serif">Classic & Elegant (Playfair)</option>
                    <option value="'Roboto Mono', monospace">Technical & Monospaced (Roboto)</option>
                  </select>
                </div>

                {/* Color Palette */}
                <div className="vr-input-group mt-4">
                  <label>Primary Accent Color</label>
                  <div className="flex gap-4 mt-2">
                    {['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#0f172a'].map(color => (
                      <div 
                        key={color} 
                        onClick={() => setColorFormat(color)}
                        style={{
                          backgroundColor: color, 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          cursor: 'pointer',
                          border: colorFormat === color ? '3px solid var(--vr-text-main)' : '3px solid transparent',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Document Spacing */}
                <div className="vr-input-group mt-4">
                  <label>Document Spacing</label>
                  <select 
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--vr-border)', outline: 'none', background: 'var(--vr-input)', color: 'var(--vr-text-main)' }}
                    value={spacingFormat} 
                    onChange={(e) => setSpacingFormat(e.target.value)}
                  >
                    <option value="compact">Compact (Fit more content on one page)</option>
                    <option value="normal">Normal (Standard professional spacing)</option>
                    <option value="spacious">Spacious (Easier to read, high breathability)</option>
                  </select>
                </div>

                <div className="vr-form-action mt-8">
                  <button type="button" className="vr-submit-btn-large" onClick={() => setActiveTab('editor')}>
                    Save Formatting & Go to Editor
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* =====================
            TAB 2: EDITOR VIEW
            ===================== */}
        {activeTab === 'editor' && (
          <form onSubmit={handleGenerate} className="vr-form-wrapper">
            
            {/* --- SECTION 1: Personal Details --- */}
            <div className="vr-accordion-card">
              <div className="vr-accordion-header" onClick={() => toggleSection('personal')}>
                <h3>Personal details</h3>
                {openSections.personal ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              
              {openSections.personal && (
                <div className="vr-accordion-body">
                  <div className="vr-photo-upload-row">
                    <input type="file" hidden ref={fileInputRef} onChange={handlePhotoChange} accept="image/png, image/jpeg, image/jpg" />
                    
                    <div className="vr-photo-circle" onClick={() => fileInputRef.current.click()} style={{cursor: 'pointer', overflow: 'hidden'}}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      ) : (
                        <ImageIcon size={32} color="var(--vr-text-sub)" />
                      )}
                    </div>
                    <div className="vr-photo-text">
                      <span className="upload-link" onClick={() => fileInputRef.current.click()}>Upload photo</span>
                      <span className="upload-hint">File formats: PNG, JPG, JPEG<br/>Maximum file size: Up to 2 MB</span>
                    </div>
                  </div>

                  <div className="vr-grid-2">
                    <div className="vr-input-group">
                      <label>Full name</label>
                      <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your name" />
                    </div>
                    <div className="vr-input-group">
                      <label>Target Job Title</label>
                      <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} placeholder="e.g. Software Engineer" />
                    </div>
                    <div className="vr-input-group">
                      <label>Email address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" />
                    </div>
                    <div className="vr-input-group">
                      <label>Mobile number</label>
                      <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 234 567 8900" />
                    </div>
                    <div className="vr-input-group">
                      <label>Current city</label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Enter your current location" />
                    </div>
                    <div className="vr-input-group">
                      <label>Country</label>
                      <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Enter your country" />
                    </div>
                  </div>

                  <div className="vr-experience-level">
                    <label>Experience level</label>
                    <div className="vr-radio-group">
                      <label className="vr-radio-label" onClick={() => handleRadioChange('Fresher')}>
                        <div className={`vr-radio ${formData.experienceLevel === 'Fresher' ? 'active' : ''}`}>
                          <div className="vr-radio-inner"></div>
                        </div>
                        Fresher
                      </label>
                      <label className="vr-radio-label" onClick={() => handleRadioChange('Experienced')}>
                        <div className={`vr-radio ${formData.experienceLevel === 'Experienced' ? 'active' : ''}`}>
                          <div className="vr-radio-inner"></div>
                        </div>
                        Experienced
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* --- SECTION 2: Profile Summary --- */}
            <div className="vr-accordion-card">
              <div className="vr-accordion-header" onClick={() => toggleSection('summary')}>
                <h3 className="flex items-center gap-2">
                  Profile summary 
                  <span className="vr-ai-badge"><Sparkles size={12}/> AI-powered</span>
                </h3>
                {openSections.summary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              
              {openSections.summary && (
                <div className="vr-accordion-body">
                  <div className="vr-rich-textarea">
                    <textarea 
                      ref={summaryRef}
                      name="profileSummary" 
                      value={formData.profileSummary} 
                      onChange={handleChange} 
                      placeholder="Write a short paragraph about yourself. Include your role and what you've worked on. Talk about your biggest wins, what motivates you, and the key skills you bring to the table."
                    />
                    <div className="vr-textarea-toolbar">
                      <div className="toolbar-icons">
                        <button type="button" onClick={() => applyFormatting('B', 'profileSummary', summaryRef)} className="format-btn"><b>B</b></button>
                        <button type="button" onClick={() => applyFormatting('I', 'profileSummary', summaryRef)} className="format-btn"><i>I</i></button>
                        <button type="button" onClick={() => applyFormatting('U', 'profileSummary', summaryRef)} className="format-btn"><u style={{textDecoration: 'underline'}}>U</u></button>
                      </div>
                      <div className="toolbar-actions">
                        <span className="toolbar-hint">Register/log in to write with AI</span>
                        <button 
                          type="button" 
                          onClick={(e) => handleWriteWithAI(e, 'profileSummary')}
                          disabled={aiLoadingField === 'profileSummary'}
                          className="vr-write-ai-btn"
                        >
                          {aiLoadingField === 'profileSummary' ? <Loader2 size={14} className="vr-spin"/> : <Sparkles size={14}/>} 
                          Write with AI
                        </button>
                      </div>
                    </div>
                    <div className="char-count">{formData.profileSummary.length}/1000</div>
                  </div>
                  <button type="button" className="vr-done-btn" onClick={() => toggleSection('summary')}>Done</button>
                </div>
              )}
            </div>

            {/* --- SECTION 3: Education --- */}
            <div className="vr-accordion-card">
              <div className="vr-accordion-header" onClick={() => toggleSection('education')}>
                <h3>Education</h3>
                {openSections.education ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {openSections.education && (
                <div className="vr-accordion-body">
                  <div className="vr-input-group">
                    <input type="text" name="education" value={formData.education} onChange={handleChange} placeholder="e.g. B.S. in Computer Science, State University, 2022" />
                  </div>
                  {extraEducations.map((edu) => (
                    <div key={edu.id} className="vr-dynamic-block">
                      <div className="vr-input-group" style={{ flex: 1, marginBottom: 0 }}>
                        <input type="text" value={edu.text} onChange={(e) => updateExtraEducation(edu.id, e.target.value)} placeholder="Add another degree or certification" />
                      </div>
                      <button type="button" className="vr-remove-btn" onClick={() => removeExtraEducation(edu.id)}><X size={18}/></button>
                    </div>
                  ))}
                  <button type="button" className="vr-add-link-btn mt-3" onClick={addEducation}><Plus size={16}/> Add education</button>
                </div>
              )}
            </div>

            {/* --- SECTION 4: Work Experience --- */}
            <div className="vr-accordion-card">
              <div className="vr-accordion-header" onClick={() => toggleSection('experience')}>
                <h3 className="flex items-center gap-2">
                  Work experience
                  <span className="vr-ai-badge"><Sparkles size={12}/> AI-powered</span>
                </h3>
                {openSections.experience ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {openSections.experience && (
                <div className="vr-accordion-body">
                  <div className="vr-work-block">
                    <div className="vr-grid-2">
                      <div className="vr-input-group">
                        <label>Company name</label>
                        <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Enter company name" />
                      </div>
                      <div className="vr-input-group">
                        <label>Designation</label>
                        <input type="text" name="designation" value={formData.designation} onChange={handleChange} placeholder="Enter designation" />
                      </div>
                    </div>

                    <div className="vr-input-group mt-2">
                      <label>Are you currently working here?</label>
                      <div className="vr-radio-group mt-2">
                        <label className="vr-radio-label" onClick={() => setFormData({...formData, isCurrentJob: true})}>
                          <div className={`vr-radio ${formData.isCurrentJob ? 'active' : ''}`}><div className="vr-radio-inner"></div></div> Yes
                        </label>
                        <label className="vr-radio-label" onClick={() => setFormData({...formData, isCurrentJob: false})}>
                          <div className={`vr-radio ${!formData.isCurrentJob ? 'active' : ''}`}><div className="vr-radio-inner"></div></div> No
                        </label>
                      </div>
                    </div>

                    <div className="vr-input-group mt-4">
                      <label>Working since</label>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <select name="startDateMonth" value={formData.startDateMonth} onChange={handleChange} className="vr-date-select">
                          <option value="">MM</option>
                          {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select name="startDateYear" value={formData.startDateYear} onChange={handleChange} className="vr-date-select">
                          <option value="">YYYY</option>
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <span style={{fontWeight: 500, margin: '0 4px'}}>To</span>
                        {formData.isCurrentJob ? (
                          <div className="vr-present-box">Present</div>
                        ) : (
                          <>
                            <select name="endDateMonth" value={formData.endDateMonth} onChange={handleChange} className="vr-date-select">
                              <option value="">MM</option>
                              {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select name="endDateYear" value={formData.endDateYear} onChange={handleChange} className="vr-date-select">
                              <option value="">YYYY</option>
                              {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="vr-input-group mt-4">
                      <label>Describe your job profile</label>
                      <div className="vr-rich-textarea">
                        <textarea 
                          ref={experienceRef}
                          name="experience" 
                          value={formData.experience} 
                          onChange={handleChange} 
                          placeholder="Describe your work experience. Use bullet points to highlight your key achievements. Wherever possible, include numbers or facts to show impact (e.g., achieved X, measured by Y, by doing Z)"
                        />
                        <div className="vr-textarea-toolbar">
                          <div className="toolbar-icons">
                            <button type="button" onClick={() => applyFormatting('B', 'experience', experienceRef)} className="format-btn"><b>B</b></button>
                            <button type="button" onClick={() => applyFormatting('I', 'experience', experienceRef)} className="format-btn"><i>I</i></button>
                            <button type="button" onClick={() => applyFormatting('U', 'experience', experienceRef)} className="format-btn"><u style={{textDecoration: 'underline'}}>U</u></button>
                          </div>
                          <div className="toolbar-actions ml-auto">
                            <button 
                              type="button" 
                              onClick={(e) => handleWriteWithAI(e, 'experience')}
                              disabled={aiLoadingField === 'experience'}
                              className="vr-write-ai-btn"
                            >
                              {aiLoadingField === 'experience' ? <Loader2 size={14} className="vr-spin"/> : <Sparkles size={14}/>} 
                              Write with AI
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {extraExperiences.map((exp) => (
                    <div key={exp.id} className="vr-work-block" style={{ marginTop: '30px', paddingTop: '20px', borderTop: `1px dashed var(--vr-border)`, position: 'relative' }}>
                      <button type="button" className="vr-remove-block-btn" onClick={() => removeExtraExperience(exp.id)}><X size={16}/> Remove</button>
                      <div className="vr-grid-2">
                        <div className="vr-input-group">
                          <label>Company name</label>
                          <input type="text" value={exp.companyName} onChange={(e) => updateExtraExperience(exp.id, 'companyName', e.target.value)} placeholder="Enter company name" />
                        </div>
                        <div className="vr-input-group">
                          <label>Designation</label>
                          <input type="text" value={exp.designation} onChange={(e) => updateExtraExperience(exp.id, 'designation', e.target.value)} placeholder="Enter designation" />
                        </div>
                      </div>

                      <div className="vr-input-group mt-2">
                        <label>Are you currently working here?</label>
                        <div className="vr-radio-group mt-2">
                          <label className="vr-radio-label" onClick={() => updateExtraExperience(exp.id, 'isCurrentJob', true)}>
                            <div className={`vr-radio ${exp.isCurrentJob ? 'active' : ''}`}><div className="vr-radio-inner"></div></div> Yes
                          </label>
                          <label className="vr-radio-label" onClick={() => updateExtraExperience(exp.id, 'isCurrentJob', false)}>
                            <div className={`vr-radio ${!exp.isCurrentJob ? 'active' : ''}`}><div className="vr-radio-inner"></div></div> No
                          </label>
                        </div>
                      </div>

                      <div className="vr-input-group mt-4">
                        <label>Working since</label>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <select value={exp.startDateMonth} onChange={(e) => updateExtraExperience(exp.id, 'startDateMonth', e.target.value)} className="vr-date-select">
                            <option value="">MM</option>
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <select value={exp.startDateYear} onChange={(e) => updateExtraExperience(exp.id, 'startDateYear', e.target.value)} className="vr-date-select">
                            <option value="">YYYY</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <span style={{fontWeight: 500, margin: '0 4px'}}>To</span>
                          {exp.isCurrentJob ? (
                            <div className="vr-present-box">Present</div>
                          ) : (
                            <>
                              <select value={exp.endDateMonth} onChange={(e) => updateExtraExperience(exp.id, 'endDateMonth', e.target.value)} className="vr-date-select">
                                <option value="">MM</option>
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                              <select value={exp.endDateYear} onChange={(e) => updateExtraExperience(exp.id, 'endDateYear', e.target.value)} className="vr-date-select">
                                <option value="">YYYY</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="vr-input-group mt-4">
                        <label>Describe your job profile</label>
                        <div className="vr-rich-textarea">
                          <textarea 
                            value={exp.experience} 
                            onChange={(e) => updateExtraExperience(exp.id, 'experience', e.target.value)} 
                            placeholder="Describe your responsibilities..."
                          />
                          <div className="vr-textarea-toolbar">
                            <div className="toolbar-icons"></div> 
                            <div className="toolbar-actions ml-auto">
                              <button 
                                type="button" 
                                onClick={(e) => handleWriteWithAIExtraExp(e, exp.id)}
                                disabled={aiLoadingField === `experience_${exp.id}`}
                                className="vr-write-ai-btn"
                              >
                                {aiLoadingField === `experience_${exp.id}` ? <Loader2 size={14} className="vr-spin"/> : <Sparkles size={14}/>} 
                                Write with AI
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  ))}

                  <button type="button" className="vr-add-link-btn mt-4" onClick={addExperience}><Plus size={16}/> Add work experience</button>
                </div>
              )}
            </div>

            {/* --- SECTION 5: Key Skills --- */}
            <div className="vr-accordion-card">
              <div className="vr-accordion-header" onClick={() => toggleSection('skills')}>
                <h3>Key skills</h3>
                {openSections.skills ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {openSections.skills && (
                <div className="vr-accordion-body">
                  <div className="vr-input-group">
                    <input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g. JavaScript, React, Node.js, Agile Methodologies (Comma separated)" />
                  </div>
                </div>
              )}
            </div>

            {/* --- SECTION 6: Projects --- */}
            <div className="vr-accordion-card">
              <div className="vr-accordion-header" onClick={() => toggleSection('projects')}>
                <h3 className="flex items-center gap-2">
                  Projects
                  <span className="vr-ai-badge"><Sparkles size={12}/> AI-powered</span>
                </h3>
                {openSections.projects ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {openSections.projects && (
                <div className="vr-accordion-body">
                  
                  <div className="vr-input-group mb-4">
                    <label>Project name</label>
                    <input 
                      type="text" 
                      name="projectName" 
                      value={formData.projectName} 
                      onChange={handleChange} 
                      placeholder="Enter project name" 
                    />
                  </div>

                  <div className="vr-input-group">
                    <label>About project</label>
                    <div className="vr-rich-textarea">
                      <textarea 
                        ref={projectsRef}
                        name="projects" 
                        value={formData.projects} 
                        onChange={handleChange} 
                        placeholder="List any major projects, technologies used, and the final outcomes..."
                      />
                      <div className="vr-textarea-toolbar">
                        <div className="toolbar-icons">
                          <button type="button" onClick={() => applyFormatting('B', 'projects', projectsRef)} className="format-btn"><b>B</b></button>
                          <button type="button" onClick={() => applyFormatting('I', 'projects', projectsRef)} className="format-btn"><i>I</i></button>
                          <button type="button" onClick={() => applyFormatting('U', 'projects', projectsRef)} className="format-btn"><u style={{textDecoration: 'underline'}}>U</u></button>
                        </div>
                        <div className="toolbar-actions ml-auto">
                          <button 
                            type="button" 
                            onClick={(e) => handleWriteWithAI(e, 'projects')}
                            disabled={aiLoadingField === 'projects'}
                            className="vr-write-ai-btn"
                          >
                            {aiLoadingField === 'projects' ? <Loader2 size={14} className="vr-spin"/> : <Sparkles size={14}/>} 
                            Write with AI
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* --- DYNAMICALLY RENDERED CUSTOM SECTIONS --- */}
            {customSectionsData.map((section) => (
              <div key={section.id} className="vr-accordion-card">
                  <div className="vr-accordion-header" onClick={() => toggleSection(section.title)}>
                    <h3 className="flex items-center gap-2">{section.title}</h3>
                    <div className="flex items-center gap-4">
                      <button type="button" className="vr-remove-block-btn" style={{position: 'static'}} onClick={(e) => { e.stopPropagation(); removeCustomSection(section.id); }}><X size={16}/></button>
                      {openSections[section.title] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                  {openSections[section.title] && (
                    <div className="vr-accordion-body">
                      <div className="vr-rich-textarea">
                        <textarea 
                          value={section.content} 
                          onChange={(e) => updateCustomSection(section.id, e.target.value)} 
                          placeholder={`Enter details for ${section.title}...`}
                        />
                      </div>
                    </div>
                  )}
              </div>
            ))}

            {/* --- ADD SECTIONS PILLS --- */}
            <div className="vr-add-sections-area">
              <h3>Add sections</h3>
              <div className="vr-pills-container">
                <button type="button" className="vr-pill-btn" onClick={() => addCustomSection('Custom Section')}>Custom section <Plus size={14}/></button>
                <button type="button" className="vr-pill-btn" onClick={() => addCustomSection('Certifications')}>Certifications <Plus size={14}/></button>
                <button type="button" className="vr-pill-btn" onClick={() => addCustomSection('Website or social media')}>Website or social media <Plus size={14}/></button>
                <button type="button" className="vr-pill-btn" onClick={() => addCustomSection('Internships')}>Internships <Plus size={14}/></button>
                <button type="button" className="vr-pill-btn" onClick={() => addCustomSection('Languages')}>Languages <Plus size={14}/></button>
                <button type="button" className="vr-pill-btn" onClick={() => addCustomSection('Hobbies')}>Hobbies <Plus size={14}/></button>
                <button type="button" className="vr-pill-btn" onClick={() => addCustomSection('Extra-curricular activities')}>Extra-curricular activities <Plus size={14}/></button>
              </div>
              
              <div style={{display: 'none'}}>
                <input type="text" name="linkedin" value={formData.linkedin} onChange={handleChange} />
                <input type="text" name="github" value={formData.github} onChange={handleChange} />
              </div>
            </div>

            {/* Submit Action */}
            <div className="vr-form-action mt-8">
              <button type="submit" disabled={loading} className="vr-submit-btn-large">
                {loading ? (
                  <><Loader2 className="vr-spin" size={20} /> Generating your resume...</>
                ) : (
                  <><FileText size={20} /> Generate Final PDF Resume</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* PREVIEW SECTION */}
      <div ref={previewSectionRef} className="vr-preview-section">
        {generatedResume ? (
          <div className="vr-preview-container">
            <div className="vr-preview-header">
              <div>
                <h3 className="vr-preview-title">Your AI Resume is Ready</h3>
                <p className="vr-preview-subtitle">Review the document below. You can download it directly as a PDF.</p>
              </div>
              <button onClick={handleDownloadPdf} className="vr-download-btn">
                <Download size={18} /> Download PDF
              </button>
            </div>

            <div className="vr-paper-wrapper">
              <div className="vr-paper">
                <div ref={printRef} dangerouslySetInnerHTML={{ __html: getTemplateStyles() + generatedResume }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="vr-empty-preview">
            <FileText size={48} className="vr-empty-icon" />
            <h3>Awaiting Generation</h3>
            <p>Fill out the form above and click generate. Your formatted resume will appear right here.</p>
          </div>
        )}
      </div>

      <style>{`
        /* --- DYNAMIC THEME VARIABLES --- */
        .vertical-resume-layout {
          --vr-bg: var(--bg-root);
          --vr-card: var(--bg-card);
          --vr-border: var(--border);
          --vr-text-main: var(--text-main);
          --vr-text-sub: var(--text-sub);
          --vr-primary: var(--primary);
          --vr-primary-dim: var(--primary-dim);
          --vr-ai-badge-bg: var(--bg-input);
          --vr-ai-badge-text: var(--primary);
          --vr-input: var(--bg-input);
          --vr-hover: var(--bg-hover);
          
          background-color: var(--vr-bg);
          min-height: 100vh;
          padding: 40px 20px 80px;
          font-family: 'Inter', sans-serif;
          color: var(--vr-text-main);
          transition: all 0.3s ease;
        }

        /* --- UPGRADE MODAL --- */
        .vr-modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.7); z-index: 10000;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(8px);
        }
        .vr-modal-content {
          background: var(--vr-card); padding: 40px; border-radius: 24px;
          text-align: center; max-width: 450px; width: 90%;
          border: 1px solid var(--vr-border);
          box-shadow: 0 20px 50px rgba(0,0,0,0.4);
        }
        .vr-modal-icon {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--vr-primary-dim); width: 80px; height: 80px;
          border-radius: 50%; margin-bottom: 20px;
        }
        .vr-modal-title {
          font-size: 24px; font-weight: 800; color: var(--vr-text-main); margin: 0 0 12px 0;
        }
        .vr-modal-desc {
          font-size: 15px; color: var(--vr-text-sub); line-height: 1.6; margin: 0 0 30px 0;
        }
        .vr-modal-actions {
          display: flex; gap: 16px; justify-content: center;
        }
        .vr-modal-btn {
          padding: 12px 24px; border-radius: 12px; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: 0.2s; border: none; display: flex; align-items: center; gap: 8px;
        }
        .vr-modal-btn.cancel {
          background: var(--vr-input); color: var(--vr-text-main);
        }
        .vr-modal-btn.cancel:hover { background: var(--vr-border); }
        .vr-modal-btn.upgrade {
          background: linear-gradient(135deg, var(--primary) 0%, #f43f5e 100%);
          color: white; box-shadow: 0 10px 20px var(--primary-dim);
        }
        .vr-modal-btn.upgrade:hover { transform: translateY(-2px); }

        /* Top Tabs */
        .vr-top-tabs {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 40px;
        }
        .vr-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--vr-card);
          border: 1px solid var(--vr-border);
          padding: 10px 20px;
          border-radius: 50px;
          font-size: 15px;
          font-weight: 500;
          color: var(--vr-text-sub);
          cursor: pointer;
          transition: 0.2s;
        }
        .vr-tab.active {
          border-color: var(--vr-primary);
          box-shadow: 0 4px 10px var(--vr-primary-dim);
          color: var(--vr-primary);
          font-weight: 600;
          background: var(--vr-primary-dim);
        }

        .flex { display: flex; }
        .flex-wrap { flex-wrap: wrap; }
        .items-center { align-items: center; }
        .gap-2 { gap: 8px; }
        .gap-3 { gap: 12px; }
        .gap-4 { gap: 16px; }
        .mt-2 { margin-top: 8px; }
        .mt-4 { margin-top: 16px; }
        .mt-3 { margin-top: 12px; }
        .mt-8 { margin-top: 32px; }
        .mb-4 { margin-bottom: 16px; }
        .ml-auto { margin-left: auto; }
        .text-center { text-align: center; }

        /* --- HERO HEADER --- */
        .vr-hero {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 30px;
        }
        .vr-title {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: var(--vr-text-main);
        }
        .vr-subtitle {
          font-size: 15px;
          color: var(--vr-text-sub);
          line-height: 1.5;
          margin: 0;
        }

        /* --- FORM CONTAINER --- */
        .vr-container {
          max-width: 750px;
          margin: 0 auto;
        }
        .vr-form-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* --- ACCORDION CARDS --- */
        .vr-accordion-card {
          background: var(--vr-card);
          border: 1px solid var(--vr-border);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .vr-accordion-header {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          user-select: none;
          background: var(--vr-card);
        }
        .vr-accordion-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--vr-text-main);
        }
        .vr-accordion-body {
          padding: 0 24px 24px 24px;
          background: var(--vr-card);
          border-top: 1px solid transparent;
        }

        /* AI Badge */
        .vr-ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: var(--vr-ai-badge-bg);
          color: var(--vr-ai-badge-text);
          padding: 4px 10px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 600;
        }

        /* Inputs & Grid */
        .vr-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .vr-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }
        .vr-input-group label {
          font-size: 14px;
          font-weight: 600;
          color: var(--vr-text-main);
        }
        .vr-input-group input {
          width: 100%;
          padding: 12px 14px;
          background: var(--vr-input);
          border: 1px solid var(--vr-border);
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: 0.2s;
          color: var(--vr-text-main);
        }
        .vr-input-group input:focus {
          border-color: var(--vr-primary);
          box-shadow: 0 0 0 2px var(--vr-primary-dim);
        }
        
        .vr-date-select {
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--vr-border);
          outline: none;
          background: var(--vr-input);
          color: var(--vr-text-main);
          font-size: 14px;
          cursor: pointer;
        }
        .vr-present-box {
          padding: 10px 16px;
          border-radius: 8px;
          background: var(--vr-input);
          border: 1px solid var(--vr-border);
          color: var(--vr-text-main);
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Dynamic Inputs */
        .vr-dynamic-block {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
        }
        .vr-remove-btn {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          border: none;
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }
        .vr-remove-btn:hover { background: rgba(239, 68, 68, 0.2); }
        .vr-remove-block-btn {
           position: absolute; top: 10px; right: 0;
           background: transparent; color: #ef4444; border: none;
           font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 4px; cursor: pointer;
        }
        .vr-remove-block-btn:hover { text-decoration: underline; }

        /* Photo Upload UI */
        .vr-photo-upload-row {
          display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
        }
        .vr-photo-circle {
          width: 70px; height: 70px; border-radius: 50%; background: var(--vr-input);
          display: flex; align-items: center; justify-content: center; border: 1px solid var(--vr-border);
        }
        .vr-photo-text {
          display: flex; flex-direction: column; gap: 4px;
        }
        .vr-photo-text .upload-link {
          color: var(--vr-primary); font-weight: 600; font-size: 14px; cursor: pointer;
        }
        .vr-photo-text .upload-hint {
          font-size: 12px; color: var(--vr-text-sub); line-height: 1.4;
        }

        /* Radio Buttons */
        .vr-experience-level { margin-top: 8px; }
        .vr-experience-level > label {
          display: block; font-size: 14px; font-weight: 600; margin-bottom: 10px; color: var(--vr-text-main);
        }
        .vr-radio-group { display: flex; gap: 24px; }
        .vr-radio-label { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; color: var(--vr-text-main); }
        .vr-radio {
          width: 20px; height: 20px; border: 2px solid var(--vr-border); border-radius: 50%;
          display: flex; align-items: center; justify-content: center; transition: 0.2s;
        }
        .vr-radio.active { border-color: var(--vr-primary); }
        .vr-radio-inner {
          width: 10px; height: 10px; background: var(--vr-primary); border-radius: 50%;
          opacity: 0; transform: scale(0); transition: 0.2s;
        }
        .vr-radio.active .vr-radio-inner { opacity: 1; transform: scale(1); }

        /* Rich Textarea */
        .vr-rich-textarea {
          border: 1px solid var(--vr-border); border-radius: 8px; overflow: hidden;
          background: var(--vr-input); position: relative;
        }
        .vr-rich-textarea textarea {
          width: 100%; min-height: 120px; padding: 16px; border: none; resize: vertical;
          outline: none; font-size: 14px; font-family: inherit; color: var(--vr-text-main); background: transparent;
        }
        .vr-textarea-toolbar {
          border-top: 1px solid var(--vr-border); background: var(--vr-card); padding: 10px 16px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .toolbar-icons { display: flex; gap: 4px; }
        .format-btn {
          background: transparent; border: 1px solid transparent; padding: 4px 8px;
          border-radius: 4px; cursor: pointer; color: var(--vr-text-sub); font-size: 15px;
        }
        .format-btn:hover { background: var(--vr-hover); color: var(--vr-text-main); }
        .toolbar-actions { display: flex; align-items: center; gap: 12px; }
        .toolbar-hint { font-size: 13px; color: var(--vr-text-sub); }
        .vr-write-ai-btn {
          display: flex; align-items: center; gap: 6px; color: var(--vr-primary);
          background: transparent; border: none; font-weight: 600; font-size: 14px; cursor: pointer;
        }
        .vr-write-ai-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .char-count {
          position: absolute; bottom: 56px; right: 16px; font-size: 12px; color: var(--vr-text-sub);
        }

        .vr-done-btn {
          background: var(--vr-primary); color: white; border: none; padding: 10px 24px;
          border-radius: 50px; font-weight: 600; font-size: 14px; margin-top: 16px; cursor: pointer;
        }
        .vr-add-link-btn {
          color: var(--vr-primary); background: transparent; border: none; font-weight: 600;
          font-size: 14px; display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 0;
        }

        /* Add Sections Pills */
        .vr-add-sections-area { margin-top: 16px; padding: 0 10px; }
        .vr-add-sections-area h3 { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--vr-text-main); }
        .vr-pills-container { display: flex; flex-wrap: wrap; gap: 12px; }
        .vr-pill-btn {
          background: transparent; border: 1px solid var(--vr-primary); color: var(--vr-primary);
          padding: 8px 16px; border-radius: 50px; font-size: 14px; font-weight: 500;
          display: flex; align-items: center; gap: 6px; cursor: pointer; transition: 0.2s;
        }
        .vr-pill-btn:hover { background: var(--vr-primary-dim); }

        /* Submit Bottom */
        .vr-submit-btn-large {
          background: var(--vr-primary); color: white; width: 100%; padding: 16px;
          border-radius: 12px; border: none; font-size: 16px; font-weight: 600;
          display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: 0.2s;
        }
        .vr-submit-btn-large:hover:not(:disabled) { background: white;color:black }
        .vr-submit-btn-large:disabled { opacity: 0.7; cursor: not-allowed; }

        /* --- PREVIEW SECTION --- */
        .vr-preview-section {
          max-width: 950px; margin: 80px auto 0; scroll-margin-top: 100px;
        }
        .vr-preview-header {
          display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; padding: 0 10px;
        }
        .vr-preview-title { font-size: 24px; font-weight: 800; margin: 0 0 8px 0; color: var(--vr-text-main); }
        .vr-preview-subtitle { color: var(--vr-text-sub); font-size: 15px; margin: 0; }
        
        .vr-download-btn {
          background: #10b981; color: #ffffff; border: none; padding: 12px 24px;
          border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; gap: 10px;
        }

        .vr-paper-wrapper {
          background: var(--vr-input); padding: 40px; border-radius: 12px; display: flex;
          justify-content: center; overflow-x: auto; border: 1px solid var(--vr-border);
        }
        .vr-paper {
          background: #ffffff; width: 100%; max-width: 850px; min-height: 1100px; padding: 0; 
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        .vr-empty-preview {
          text-align: center; padding: 60px 20px; color: var(--vr-text-sub);
          background: var(--vr-card); border: 2px dashed var(--vr-border); border-radius: 12px;
        }
        .vr-empty-icon { color: var(--vr-text-sub); margin-bottom: 20px; }
        .vr-empty-preview h3 { font-size: 20px; margin: 0 0 10px 0; color: var(--vr-text-main);}

        .vr-spin { animation: spin 1s linear infinite; }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 768px) {
          .vr-grid-2 { grid-template-columns: 1fr; }
          .vr-preview-header { flex-direction: column; align-items: flex-start; gap: 20px; }
          .toolbar-hint { display: none; }
        }
      `}</style>
    </div>
  );
};

export default AiResumeMaker;