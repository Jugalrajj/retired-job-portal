import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { 
  ArrowLeft, MapPin, Briefcase, Clock, 
  Edit3, Save, X, Activity, Plane, Layers, 
  GraduationCap, Award, FileText, Users, Eye, CheckCircle
} from "lucide-react";
import toast from "react-hot-toast";

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data State
  const [job, setJob] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data);
      // Initialize form data 
      setFormData({
        ...res.data,
        skills: res.data.skills || [],
        locations: res.data.locations || []
      });
    } catch (err) {
      console.error("Failed to load job", err);
      toast.error("Job not found");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleArrayChange = (e, field) => {
    const values = e.target.value.split(",").map(item => item.trim());
    setFormData({ ...formData, [field]: values });
  };

  const toggleEdit = () => {
    if (isEditing) {
      setFormData({ ...job }); // Cancel changes
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        skills: formData.skills.filter(s => s !== ""),
        locations: formData.locations.filter(l => l !== ""),
      };

      const res = await api.patch(`/jobs/${id}`, payload);
      
      setJob(res.data);
      setFormData(res.data);
      setIsEditing(false);
      toast.success("Job Updated Successfully");

    } catch (err) {
      console.error("Failed to update job", err);
      const errMsg = err.response?.data?.message || err.message;
      toast.error(`Failed to save: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const getSalaryDisplay = () => {
    if (job.isVolunteer) return "Volunteer / Unpaid";
    if (job.minSalary && job.maxSalary) {
      return `${job.currency || 'INR'} ${job.minSalary.toLocaleString()} - ${job.maxSalary.toLocaleString()}`;
    }
    return "Salary Not Specified";
  };

  if (loading) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-root)', color:'var(--text-sub)'}}>
      Loading Job Details...
    </div>
  );
  
  if (!job) return null;

  return (
    <div className="dark-details-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        /* --- PAGE WRAPPER --- */
        .dark-details-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          padding: 48px 24px;
          display: flex; 
          justify-content: center;
          color: var(--text-main);
          position: relative;
          transition: background-color 0.3s ease;
        }

        /* --- BACKGROUND FX (Subtle & Professional) --- */
        .bg-blob {
          position: absolute; 
          border-radius: 50%; 
          filter: blur(150px);
          opacity: 0.08; 
          z-index: 0; 
          pointer-events: none;
        }
        .b1 { top: -5%; left: -5%; width: 50vw; height: 50vw; background: var(--info); }
        .b2 { bottom: -5%; right: -5%; width: 40vw; height: 40vw; background: var(--primary); }

        .main-container {
          width: 100%; 
          max-width: 1140px;
          display: flex; 
          flex-direction: column; 
          gap: 28px;
          position: relative; 
          z-index: 2;
        }

        /* --- NAV --- */
        .nav-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 8px; 
        }
        
        .btn-back {
          background: transparent; 
          border: 1px solid transparent;
          padding: 8px 16px 8px 0; 
          cursor: pointer;
          display: flex; 
          align-items: center; 
          gap: 8px;
          font-weight: 600; 
          color: var(--text-sub); 
          transition: 0.2s ease; 
          font-size: 14px;
        }
        .btn-back:hover { 
          color: var(--text-main); 
          transform: translateX(-4px);
        }

        .action-group { display: flex; gap: 12px; }
        
        .btn-action { 
          padding: 10px 18px; 
          border-radius: 8px; 
          font-weight: 600; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          font-size: 13px; 
          transition: all 0.2s ease;
          letter-spacing: 0.3px;
        }
        
        .btn-edit { 
          background: var(--bg-card); 
          border: 1px solid var(--border); 
          color: var(--text-main); 
          box-shadow: var(--shadow);
        }
        .btn-edit:hover { 
          border-color: var(--primary); 
          color: var(--primary); 
        }
        
        .btn-save { 
          background: var(--primary); 
          border: 1px solid var(--primary); 
          color: #fff; 
        }
        .btn-save:hover { 
          background: var(--primary-hover); 
          box-shadow: 0 4px 12px var(--primary-dim); 
        }
        
        .btn-cancel { 
          background: var(--bg-card); 
          border: 1px solid var(--border); 
          color: var(--text-sub); 
        }
        .btn-cancel:hover { 
          color: var(--danger); 
          border-color: var(--danger); 
          background: rgba(239, 68, 68, 0.05); 
        }

        /* --- HERO CARD --- */
        .hero-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px; 
          padding: 40px;
          position: relative; 
          overflow: hidden;
          box-shadow: var(--shadow);
        }
        /* Elegant Accent Line */
        .hero-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--primary), var(--info));
        }

        .hero-top-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 24px; 
        }
        
        .status-badge { 
          padding: 6px 12px; 
          border-radius: 6px; 
          font-size: 11px; 
          font-weight: 700; 
          text-transform: uppercase; 
          letter-spacing: 0.8px; 
          border: 1px solid transparent;
        }
        .st-active { 
          background: rgba(16, 185, 129, 0.1); 
          color: var(--success); 
          border-color: rgba(16, 185, 129, 0.2); 
        }
        .st-closed { 
          background: var(--bg-hover); 
          color: var(--text-sub); 
          border-color: var(--border); 
        }
        
        .hero-title { 
          font-size: 32px; 
          font-weight: 800; 
          color: var(--text-main); 
          margin: 0 0 12px; 
          line-height: 1.2; 
          letter-spacing: -0.5px;
        }
        .hero-dept { 
          font-size: 15px; 
          color: var(--text-sub); 
          font-weight: 500; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
        }
        
        .hero-stats { 
          display: flex; 
          gap: 24px; 
          margin-top: 32px; 
          border-top: 1px solid var(--border); 
          padding-top: 24px; 
          flex-wrap: wrap; 
        }
        .stat-box { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          color: var(--text-sub); 
          font-weight: 500; 
          font-size: 14px; 
        }
        .stat-box.highlight { 
          color: var(--text-main); 
          font-weight: 700;
        }
        .icon-gold { color: var(--primary); }

        /* --- GRID --- */
        .content-grid { 
          display: grid; 
          grid-template-columns: 2fr 1fr; 
          gap: 28px; 
        }
        
        .card {
          background: var(--bg-card);
          border-radius: 12px;
          border: 1px solid var(--border); 
          padding: 32px;
          box-shadow: var(--shadow);
        }
        
        .card-header { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          margin-bottom: 24px; 
        }
        .card-title { 
          font-size: 18px; 
          font-weight: 700; 
          color: var(--text-main); 
          margin: 0; 
          letter-spacing: -0.3px;
        }
        .text-body { 
          line-height: 1.7; 
          color: var(--text-sub); 
          white-space: pre-wrap; 
          font-size: 15px; 
          margin: 0; 
        }
        
        /* --- FIELDS & INPUTS --- */
        .field-block { margin-bottom: 24px; }
        .field-label { 
          display: block; 
          font-size: 11px; 
          font-weight: 700; 
          text-transform: uppercase; 
          color: var(--text-sub); 
          margin-bottom: 12px; 
          letter-spacing: 0.8px; 
        }
        
        .input-dark, .textarea-dark, .select-dark {
          width: 100%; 
          background: var(--bg-input);
          border: 1px solid var(--border);
          color: var(--text-main); 
          padding: 12px 16px; 
          border-radius: 8px; 
          font-size: 14px; 
          outline: none; 
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .input-dark:focus, .textarea-dark:focus, .select-dark:focus { 
          border-color: var(--primary); 
          background: var(--bg-card); 
          box-shadow: 0 0 0 3px var(--primary-dim);
        }

        /* --- TAGS & REQUIREMENTS --- */
        .tags-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill-tag { 
          background: var(--bg-hover); 
          color: var(--text-main); 
          border: 1px solid var(--border);
          padding: 6px 12px; 
          border-radius: 6px; 
          font-size: 13px; 
          font-weight: 500; 
        }

        .req-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
          gap: 16px; 
          margin-top: 16px; 
        }
        .req-item { 
          background: var(--bg-root); 
          border: 1px solid var(--border); 
          padding: 20px; 
          border-radius: 10px; 
          color: var(--text-sub);
          display: flex; 
          flex-direction: column; 
          gap: 6px; 
        }
        .req-item strong { 
          color: var(--text-main); 
          font-size: 14px; 
          font-weight: 600;
        }
        .req-item span { font-size: 13px; }
        
        /* --- SIDEBAR --- */
        .sidebar-section { margin-bottom: 24px; }
        .sidebar-row { 
          display: flex; 
          align-items: flex-start; 
          gap: 16px; 
          margin-bottom: 20px; 
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .sidebar-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        
        .sb-icon { 
          width: 36px; 
          height: 36px; 
          background: var(--bg-input); 
          color: var(--text-main); 
          border: 1px solid var(--border);
          border-radius: 8px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          flex-shrink: 0; 
        }
        .sb-info label { 
          display: block; 
          font-size: 11px; 
          color: var(--text-sub); 
          font-weight: 600; 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
          margin-bottom: 6px; 
        }
        .sb-info p { 
          margin: 0; 
          font-size: 14px; 
          color: var(--text-main); 
          font-weight: 500; 
          line-height: 1.5;
        }
        
        /* --- COMPENSATION CARD --- */
        .comp-card { 
          background: var(--bg-card); 
          border-color: var(--border); 
        }
        .salary-display { 
          font-size: 28px; 
          font-weight: 800; 
          color: var(--text-main); 
          margin-bottom: 4px; 
          letter-spacing: -0.5px;
        }
        .salary-sub { 
          color: var(--text-sub); 
          font-size: 14px; 
        }
        
        .perk-tag { 
          font-size: 13px; 
          background: var(--bg-root); 
          color: var(--text-main); 
          padding: 6px 12px; 
          border-radius: 6px; 
          border: 1px solid var(--border); 
          margin-right: 8px; 
          margin-bottom: 8px; 
          display: inline-block; 
        }

        @media (max-width: 1024px) {
          .content-grid { grid-template-columns: 1fr; }
          .hero-stats { gap: 16px; }
        }
      `}</style>
      
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="main-container">
        
        {/* --- NAVIGATION --- */}
        <div className="nav-header">
          <button onClick={() => navigate("/my-jobs")} className="btn-back">
            <ArrowLeft size={16} /> Back to My Jobs
          </button>
          
          <div className="action-group">
            {isEditing ? (
              <>
                <button onClick={toggleEdit} className="btn-action btn-cancel" disabled={saving}>
                  <X size={16}/> Cancel
                </button>
                <button onClick={handleSave} className="btn-action btn-save" disabled={saving}>
                  <Save size={16}/> {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button onClick={toggleEdit} className="btn-action btn-edit">
                <Edit3 size={16}/> Edit Job Details
              </button>
            )}
          </div>
        </div>

        {/* --- HERO HEADER --- */}
        <div className="hero-card">
          <div className="hero-top-row">
            <div style={{display:'flex', gap:10}}>
                <span className={`status-badge ${formData.isActive ? 'st-active' : 'st-closed'}`}>
                    {formData.isActive ? 'Active' : 'Closed / Paused'}
                </span>
                {isEditing && (
                   <label style={{display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer'}}>
                      <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange}/> 
                      Toggle Status
                   </label>
                )}
            </div>
            {/* View Count Badge */}
            <div style={{display:'flex', alignItems:'center', gap:6, color:'var(--text-sub)', fontSize:13, fontWeight: 500}}>
                <Eye size={16}/> {job.views || 0} Views
            </div>
          </div>

          <div>
            {isEditing ? (
              <div style={{display:'flex', flexDirection:'column', gap:12, marginBottom:20}}>
                <input name="title" value={formData.title || ''} onChange={handleChange} className="input-dark" style={{fontSize:24, fontWeight:700}} placeholder="Job Title" />
                <div style={{display:'flex', gap:12}}>
                  <input name="department" value={formData.department || ''} onChange={handleChange} className="input-dark" placeholder="Department" />
                  <input name="roleCategory" value={formData.roleCategory || ''} onChange={handleChange} className="input-dark" placeholder="Role Category" />
                </div>
              </div>
            ) : (
              <>
                <h1 className="hero-title">{job.title}</h1>
                <div className="hero-dept"><Layers size={16} className="icon-gold"/> {job.department} &bull; {job.roleCategory || 'General'}</div>
              </>
            )}
          </div>

          <div className="hero-stats">
            <div className="stat-box">
               <Users size={16} className="icon-gold"/> 
               {isEditing ? <input type="number" name="openings" value={formData.openings || ''} onChange={handleChange} className="input-dark" style={{width:80, padding:6}} placeholder="Count"/> : `${job.openings} Openings`} 
            </div>
            <div className="stat-box">
               <Briefcase size={16} className="icon-gold"/> 
               {isEditing ? <input name="workType" value={formData.workType || ''} onChange={handleChange} className="input-dark" style={{width:130, padding:6}} placeholder="Work Type"/> : (formData.workType || job.workType)}
            </div>
            <div className="stat-box highlight">
              {getSalaryDisplay()}
            </div>
          </div>
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="content-grid">
          
          {/* LEFT: Description & Requirements */}
          <div style={{display:'flex', flexDirection:'column', gap:28}}>
            
            {/* Description */}
            <div className="card">
              <div className="card-header">
                <FileText size={20} className="icon-gold"/>
                <h2 className="card-title">About the Role</h2>
              </div>
              {isEditing ? (
                <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={8} className="textarea-dark" placeholder="Role description..."/>
              ) : (
                <p className="text-body">{job.description}</p>
              )}
            </div>

            {/* Responsibilities */}
            <div className="card">
              <div className="card-header">
                <CheckCircle size={20} className="icon-gold"/>
                <h2 className="card-title">Responsibilities</h2>
              </div>
              {isEditing ? (
                <textarea name="responsibilities" value={formData.responsibilities || ''} onChange={handleChange} rows={6} className="textarea-dark" placeholder="Role responsibilities..."/>
              ) : (
                <p className="text-body">{job.responsibilities || 'No specific responsibilities listed.'}</p>
              )}
            </div>

            {/* Qualifications */}
            <div className="card">
              <div className="card-header">
                <Award size={20} className="icon-gold"/>
                <h2 className="card-title">Qualifications & Skills</h2>
              </div>

              <div className="field-block">
                 <label className="field-label">Required Skills</label>
                 {isEditing ? (
                   <input value={formData.skills?.join(", ")} onChange={(e) => handleArrayChange(e, "skills")} className="input-dark" placeholder="Skills (comma separated)"/>
                 ) : (
                   <div className="tags-row">
                     {job.skills?.length > 0 ? job.skills.map((s, i) => <span key={i} className="skill-tag">{s}</span>) : <span style={{fontStyle:'italic', color:'var(--text-sub)'}}>No skills listed</span>}
                   </div>
                 )}
              </div>

              <div className="req-grid">
                 <div className="req-item">
                    <GraduationCap size={20} style={{color:'var(--info)', marginBottom: '4px'}}/>
                    <strong>Education</strong>
                    {isEditing ? (
                        <div style={{display:'flex', flexDirection:'column', gap:6, width:'100%'}}>
                             <input name="educationType" value={formData.educationType || ''} onChange={handleChange} className="input-dark" style={{padding:6}} placeholder="Category"/>
                             <input name="education" value={formData.education || ''} onChange={handleChange} className="input-dark" style={{padding:6}} placeholder="Specific Degree"/>
                        </div>
                    ) : (
                        <span>{job.educationType ? `${job.educationType} - ` : ''}{job.education || 'Not specified'}</span>
                    )}
                 </div>
                 <div className="req-item">
                    <Briefcase size={20} style={{color:'var(--success)', marginBottom: '4px'}}/>
                    <strong>Experience</strong>
                    {isEditing ? (
                        <div style={{display:'flex', gap:4}}>
                            <input name="minExperience" value={formData.minExperience || ''} onChange={handleChange} className="input-dark" style={{padding:6}} placeholder="Min"/>
                            <input name="maxExperience" value={formData.maxExperience || ''} onChange={handleChange} className="input-dark" style={{padding:6}} placeholder="Max"/>
                        </div>
                    ) : (
                        <span>{job.minExperience} - {job.maxExperience} Years</span>
                    )}
                 </div>
                 <div className="req-item">
                    <Award size={20} style={{color:'var(--primary)', marginBottom: '4px'}}/>
                    <strong>Seniority</strong>
                    {isEditing ? (
                        <input name="seniorityLevel" value={formData.seniorityLevel || ''} onChange={handleChange} className="input-dark" style={{padding:6}} placeholder="Level"/>
                    ) : (
                        <span>{job.seniorityLevel || "Not Specified"}</span>
                    )}
                 </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Sidebar (Logistics, Pay, Admin) */}
          <div style={{display:'flex', flexDirection:'column', gap:28}}>
             
             {/* Logistics Card */}
             <div className="card">
                <h3 className="field-label" style={{marginBottom:24}}>Logistics & Environment</h3>
                
                <div className="sidebar-row">
                    <div className="sb-icon"><Clock size={16}/></div>
                    <div className="sb-info" style={{width:'100%'}}>
                        <label>Commitment</label>
                        {isEditing ? (
                            <div style={{display:'flex', flexDirection:'column', gap:6}}>
                                <input name="hoursPerWeek" value={formData.hoursPerWeek || ''} onChange={handleChange} className="input-dark" placeholder="Hours per week"/>
                                <div style={{display:'flex', gap:4}}>
                                    <input name="durationValue" value={formData.durationValue || ''} onChange={handleChange} className="input-dark" placeholder="Duration"/>
                                    <select name="durationUnit" value={formData.durationUnit || 'Months'} onChange={handleChange} className="select-dark"><option>Months</option><option>Weeks</option><option>Years</option><option>Indefinite</option></select>
                                </div>
                            </div>
                        ) : (
                            <p>{job.hoursPerWeek} Hrs/Week <br/><span style={{fontSize:13, color:'var(--text-sub)'}}>{job.durationValue} {job.durationUnit} Project</span></p>
                        )}
                    </div>
                </div>

                <div className="sidebar-row">
                    <div className="sb-icon"><MapPin size={16}/></div>
                    <div className="sb-info" style={{width:'100%'}}>
                        <label>Location Mode</label>
                        {isEditing ? (
                           <>
                             <input name="workMode" value={formData.workMode || ''} onChange={handleChange} className="input-dark" style={{marginBottom:6}} placeholder="e.g. Remote, Hybrid"/>
                             <input name="locations" value={formData.locations?.join(", ")} onChange={(e) => handleArrayChange(e, 'locations')} className="input-dark" placeholder="City locations"/>
                           </>
                        ) : (
                           <p>{job.workMode} <br/><span style={{fontSize:13, color:'var(--text-sub)'}}>{job.locations?.join(", ") || "No specific city"}</span></p>
                        )}
                    </div>
                </div>

                <div className="sidebar-row">
                    <div className="sb-icon"><Activity size={16}/></div>
                    <div className="sb-info" style={{width:'100%'}}>
                        <label>Physical Demands</label>
                        {isEditing ? (
                             <input name="physicalDemands" value={formData.physicalDemands || ''} onChange={handleChange} className="input-dark" placeholder="e.g. Sedentary"/>
                        ) : (
                             <p>{job.physicalDemands || "None Specified"}</p>
                        )}
                    </div>
                </div>

                <div className="sidebar-row">
                    <div className="sb-icon"><Plane size={16}/></div>
                    <div className="sb-info" style={{width:'100%'}}>
                        <label>Travel</label>
                        {isEditing ? (
                             <input name="travelRequirement" value={formData.travelRequirement || ''} onChange={handleChange} className="input-dark" placeholder="e.g. No Travel"/>
                        ) : (
                             <p>{job.travelRequirement || "None Specified"}</p>
                        )}
                    </div>
                </div>
             </div>

             {/* Compensation Card */}
             <div className="card comp-card">
                 <h3 className="field-label" style={{marginBottom:20}}>Compensation & Perks</h3>
                 
                 {isEditing ? (
                     <div style={{marginBottom:20}}>
                         <label style={{display:'block', color:'var(--text-sub)', fontSize:12, marginBottom:8, fontWeight: 600}}>Is Volunteer?</label>
                         <input type="checkbox" name="isVolunteer" checked={formData.isVolunteer || false} onChange={handleChange}/> 
                         {!formData.isVolunteer && (
                            <div style={{display:'flex', gap:8, marginTop:12, flexWrap:'wrap'}}>
                                <input name="currency" value={formData.currency || ''} onChange={handleChange} className="input-dark" style={{width:'30%'}} placeholder="Curr"/>
                                <input name="frequency" value={formData.frequency || ''} onChange={handleChange} className="input-dark" style={{width:'65%'}} placeholder="Freq"/>
                                <input name="minSalary" value={formData.minSalary || ''} onChange={handleChange} className="input-dark" style={{width:'48%'}} placeholder="Min Salary"/>
                                <input name="maxSalary" value={formData.maxSalary || ''} onChange={handleChange} className="input-dark" style={{width:'48%'}} placeholder="Max Salary"/>
                            </div>
                         )}
                     </div>
                 ) : (
                     <div style={{marginBottom:24}}>
                         <div className="salary-display">
                            {job.isVolunteer ? "Unpaid" : `${job.currency || 'INR'} ${job.minSalary?.toLocaleString()} - ${job.maxSalary?.toLocaleString()}`}
                         </div>
                         <div className="salary-sub">{job.isVolunteer ? "Volunteer Opportunity" : `Per ${job.frequency || 'Month'}`}</div>
                     </div>
                 )}

                 <div>
                    <label style={{fontSize:11, color:'var(--text-sub)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', display:'block', marginBottom:10}}>Perks</label>
                    {isEditing ? (
                        <textarea name="customPerks" value={formData.customPerks || ''} onChange={handleChange} className="textarea-dark" rows={3} placeholder="Add perks..."/>
                    ) : (
                        <div>
                            {job.customPerks ? <span className="perk-tag">{job.customPerks}</span> : <span style={{fontSize:13, color:'var(--text-sub)'}}>None listed</span>}
                        </div>
                    )}
                 </div>
             </div>

             {/* Admin / Meta */}
             <div className="card">
                 <h3 className="field-label" style={{marginBottom:20}}>Internal Admin</h3>
                 <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, fontSize:14, fontWeight: 500}}>
                    <span style={{color:'var(--text-sub)'}}>Urgency</span>
                    {isEditing ? (
                        <input name="urgency" value={formData.urgency || ''} onChange={handleChange} className="input-dark" style={{width: 120, padding: '8px 12px'}} placeholder="Urgency"/>
                    ) : (
                        <span style={{color: job.urgency === 'Urgent' ? 'var(--danger)' : 'var(--text-main)'}}>{job.urgency || "Standard"}</span>
                    )}
                 </div>
                 <div style={{display:'flex', justifyContent:'space-between', fontSize:14, fontWeight: 500}}>
                    <span style={{color:'var(--text-sub)'}}>Date Posted</span>
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                 </div>
             </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default JobDetails;