import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Bell,
  Save,
  Check,
  Clock,
  Loader2,
  Layout
} from "lucide-react";

const JobPreferences = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    jobTitles: "", 
    jobTypes: [],
    locationTypes: [],
    locations: "",
    minSalary: "",
    currency: "INR",
    industries: [],
    availability: "Immediate",
    emailAlerts: true,
  });

  // --- OPTIONS ---
  const JOB_TYPES = ["Full-Time", "Part-Time", "Contract", "Project-Based", "Volunteer"];
  const LOCATION_TYPES = ["Remote", "Hybrid", "On-Site", "Work from office"];
  const AVAILABILITY_OPTIONS = ["Immediate", "15 Days", "1 Month", "Flexible"];

  // --- 1. FETCH PREFERENCES ---
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const { data } = await api.get("/seekers/preferences");
        
        if (data) {
          setFormData({
            jobTitles: data.jobTitles ? data.jobTitles.join(", ") : "",
            jobTypes: data.jobTypes || [],
            locationTypes: data.locationTypes || [],
            locations: data.locations ? data.locations.join(", ") : "",
            minSalary: data.minSalary || "",
            currency: data.currency || "INR",
            industries: data.industries || [],
            availability: data.availability || "Immediate",
            emailAlerts: data.emailAlerts ?? true,
          });
        }
      } catch (err) {
        console.error("Error fetching preferences", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrefs();
  }, []);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleSelection = (field, value) => {
    setFormData((prev) => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((item) => item !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        jobTitles: formData.jobTitles.split(",").map((s) => s.trim()).filter(Boolean),
        locations: formData.locations.split(",").map((s) => s.trim()).filter(Boolean),
        minSalary: Number(formData.minSalary) || 0
      };

      await api.put("/seekers/preferences", payload);
      toast.success("Preferences saved! You'll be notified of new jobs.");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dark-pref-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        :root {
          /* --- PREMIUM DARK THEME --- */
          --bg-dark: #020617;
          --glass-panel: rgba(30, 41, 59, 0.4); 
          --glass-border: rgba(255, 255, 255, 0.08);
          --card-gradient: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          
          --accent-gold: #fbbf24;
          --accent-blue: #4f46e5;
          
          --text-white: #f8fafc;
          --text-muted: #94a3b8;
          --input-bg: rgba(255, 255, 255, 0.05);
        }

        /* --- PAGE WRAPPER --- */
        .dark-pref-wrapper {
          min-height: 100vh;
          background-color: var(--bg-dark);
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          padding: 40px 20px;
          display: flex; justify-content: center;
          color: var(--text-white);
        }

        /* --- BACKGROUND FX --- */
        .bg-blob {
          position: absolute; border-radius: 50%; filter: blur(120px);
          opacity: 0.15; z-index: 0; pointer-events: none;
        }
        .b1 { top: -10%; left: -10%; width: 600px; height: 600px; background: var(--accent-blue); }
        .b2 { bottom: -10%; right: -10%; width: 500px; height: 500px; background: var(--accent-gold); }

        /* --- DESIGNER CONTAINER --- */
        .designer-container {
          width: 100%; max-width: 1000px;
          background: var(--glass-panel);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          z-index: 5;
        }

        /* Top Accent Strip */
        .designer-container::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #4f46e5 0%, #fbbf24 100%);
        }

        .content-area {
          padding: 40px;
          flex: 1; display: flex; flex-direction: column;
        }

        /* HEADER */
        .page-header { 
          display: flex; align-items: center; gap: 20px; 
          margin-bottom: 40px; border-bottom: 1px solid var(--glass-border);
          padding-bottom: 24px;
        }
        .header-icon {
          width: 50px; height: 50px; border-radius: 12px;
          background: rgba(251, 191, 36, 0.1); color: var(--accent-gold);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; border: 1px solid var(--glass-border);
        }
        .header-text h1 { 
          font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 700; color: var(--text-white); margin: 0; line-height: 1.2; 
        }
        .header-text p { color: var(--text-muted); font-size: 14px; margin: 4px 0 0; }

        .form-layout { display: flex; flex-direction: column; gap: 24px; }

        /* DARK CARDS */
        .pref-card {
          background: var(--card-gradient);
          border: 1px solid var(--glass-border); border-radius: 16px;
          overflow: hidden; transition: all 0.2s;
        }
        .pref-card:hover { border-color: var(--accent-gold); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.3); }

        .card-header {
          padding: 16px 24px; border-bottom: 1px solid var(--glass-border);
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.02);
        }
        .card-header .icon { color: var(--accent-gold); }
        .card-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-white); }

        .card-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .two-col { flex-direction: row; gap: 24px; }

        /* INPUTS */
        .input-group { display: flex; flex-direction: column; gap: 8px; width: 100%; }
        .input-group label { font-size: 13px; font-weight: 600; color: var(--text-white); }
        .sub-label { font-weight: 400; color: var(--text-muted); font-size: 12px; margin-left: 4px; }

        .text-input {
          padding: 12px 16px; border: 1px solid var(--glass-border);
          border-radius: 10px; font-size: 14px; color: var(--text-white);
          transition: all 0.2s; outline: none; width: 100%; box-sizing: border-box;
          background: var(--input-bg);
        }
        .text-input:focus { border-color: var(--accent-gold); background: rgba(255,255,255,0.08); }

        /* PILLS */
        .pills-container { display: flex; flex-wrap: wrap; gap: 10px; }
        .pill {
          padding: 8px 16px; border-radius: 20px;
          border: 1px solid var(--glass-border); background: var(--input-bg);
          color: var(--text-muted); font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; display: flex;
          align-items: center; gap: 6px;
        }
        .pill:hover { border-color: var(--accent-gold); color: var(--text-white); background: rgba(255,255,255,0.1); }
        .pill.active {
          background: rgba(251, 191, 36, 0.15); border-color: var(--accent-gold);
          color: var(--accent-gold);
        }

        /* CURRENCY */
        .currency-input {
          display: flex; border: 1px solid var(--glass-border);
          border-radius: 10px; overflow: hidden; transition: 0.2s;
          background: var(--input-bg);
        }
        .currency-input:focus-within { border-color: var(--accent-gold); background: rgba(255,255,255,0.08); }
        .currency-select {
          background: rgba(0,0,0,0.2); border: none; padding: 0 16px;
          font-weight: 600; color: var(--text-white); font-size: 14px;
          border-right: 1px solid var(--glass-border); cursor: pointer; outline: none;
        }
        .currency-input input {
          border: none; padding: 12px 16px; width: 100%;
          outline: none; font-size: 14px; background: transparent; color: var(--text-white);
        }
        option { background: #0f172a; }

        /* SELECT */
        .select-wrapper { position: relative; }
        .full-select {
          width: 100%; padding: 12px 16px; border: 1px solid var(--glass-border);
          border-radius: 10px; font-size: 14px; appearance: none;
          background: var(--input-bg); color: var(--text-white); outline: none;
        }
        .full-select:focus { border-color: var(--accent-gold); background: rgba(255,255,255,0.08); }
        .select-icon {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%); color: var(--text-muted); pointer-events: none;
        }

        /* ALERT BOX */
        .alert-box {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8));
          border: 1px solid var(--glass-border);
          border-radius: 16px; padding: 24px; display: flex;
          align-items: center; justify-content: space-between;
          color: white; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
        }
        .alert-text { display: flex; gap: 16px; align-items: center; }
        .alert-text svg { color: var(--accent-gold); }
        .alert-text h4 { margin: 0 0 4px; font-size: 16px; font-weight: 700; color: var(--text-white); }
        .alert-text p { margin: 0; font-size: 13px; color: var(--text-muted); }

        /* SWITCH */
        .switch { position: relative; display: inline-block; width: 48px; height: 26px; flex-shrink: 0; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.1); transition: .4s; border-radius: 34px; border: 1px solid var(--glass-border); }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--accent-gold); border-color: var(--accent-gold); }
        input:checked + .slider:before { transform: translateX(22px); background-color: #0f172a; }

        /* ACTIONS */
        .form-actions {
          display: flex; justify-content: flex-end; gap: 16px; 
          margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--glass-border);
        }
        .btn-save {
          background: linear-gradient(135deg, #fbbf24 0%, #b45309 100%);
          color: white; border: none;
          padding: 12px 32px; border-radius: 10px; font-weight: 700; font-size: 14px;
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          transition: 0.2s; box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
        }
        .btn-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(251, 191, 36, 0.4); }
        .btn-save:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .btn-cancel {
          background: transparent; border: 1px solid var(--glass-border);
          color: var(--text-muted); padding: 12px 24px; border-radius: 10px;
          font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 14px;
        }
        .btn-cancel:hover { border-color: var(--text-white); color: var(--text-white); }

        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .designer-container { height: auto; min-height: 100vh; border-radius: 0; border: none; }
          .dark-pref-wrapper { padding: 0; }
          .content-area { padding: 20px; }
          .two-col { flex-direction: column; gap: 20px; }
          .alert-box { flex-direction: column; align-items: flex-start; gap: 20px; }
          .alert-box .switch { align-self: flex-end; }
          .form-actions { flex-direction: column-reverse; }
          .btn-save, .btn-cancel { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* BACKGROUND ELEMENTS */}
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="designer-container">
        
        <div className="content-area">
          <div className="page-header">
            <div className="header-icon"><Layout size={28} strokeWidth={2.5}/></div>
            <div className="header-text">
              <h1>Job Preferences</h1>
              <p>Customize your job feed and alerts.</p>
            </div>
          </div>

          {loading ? (
            <div style={{height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'}}>
              <Loader2 className="spinner" size={32} style={{marginBottom: 10, color: '#fbbf24'}}/>
              <p>Loading your preferences...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="form-layout">
              
              {/* CARD 1: ROLE & INDUSTRY */}
              <div className="pref-card">
                <div className="card-header"><Briefcase className="icon" size={20}/><h3>Role & Expertise</h3></div>
                <div className="card-body">
                  <div className="input-group">
                    <label>Target Job Titles <span className="sub-label">(Comma separated)</span></label>
                    <input type="text" name="jobTitles" value={formData.jobTitles} onChange={handleChange} placeholder="e.g. Senior Advisor, Consultant" className="text-input" />
                  </div>
                  <div className="input-group">
                    <label>Preferred Job Types</label>
                    <div className="pills-container">
                      {JOB_TYPES.map((type) => (
                        <button key={type} type="button" className={`pill ${formData.jobTypes.includes(type) ? "active" : ""}`} onClick={() => toggleSelection("jobTypes", type)}>{type} {formData.jobTypes.includes(type) && <Check size={14} />}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: LOCATION & WORK MODE */}
              <div className="pref-card">
                <div className="card-header"><MapPin className="icon" size={20}/><h3>Location</h3></div>
                <div className="card-body">
                  <div className="input-group">
                    <label>Work Mode</label>
                    <div className="pills-container">
                      {LOCATION_TYPES.map((mode) => (
                        <button key={mode} type="button" className={`pill ${formData.locationTypes.includes(mode) ? "active" : ""}`} onClick={() => toggleSelection("locationTypes", mode)}>{mode} {formData.locationTypes.includes(mode) && <Check size={14} />}</button>
                      ))}
                    </div>
                  </div>
                  {(!formData.locationTypes.every(t => t === 'Remote') || formData.locationTypes.length === 0) && (
                    <div className="input-group">
                      <label>Preferred Cities</label>
                      <input type="text" name="locations" value={formData.locations} onChange={handleChange} placeholder="e.g. Mumbai, Delhi" className="text-input" />
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 3: COMPENSATION & TIMELINE */}
              <div className="pref-card">
                <div className="card-header"><DollarSign className="icon" size={20}/><h3>Compensation</h3></div>
                <div className="card-body two-col">
                  <div className="input-group">
                    <label>Min. Expected Salary</label>
                    <div className="currency-input">
                      <select name="currency" value={formData.currency} onChange={handleChange} className="currency-select"><option value="INR">₹ INR</option><option value="USD">$ USD</option></select>
                      <input type="number" name="minSalary" value={formData.minSalary} onChange={handleChange} placeholder="e.g. 500000" />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Availability</label>
                    <div className="select-wrapper">
                      <select name="availability" value={formData.availability} onChange={handleChange} className="full-select">
                        {AVAILABILITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <Clock size={16} className="select-icon"/>
                    </div>
                  </div>
                </div>
              </div>

              {/* ALERT SETTINGS */}
              <div className="alert-box">
                <div className="alert-text">
                    <Bell size={24}/>
                    <div><h4>Email Alerts</h4><p>Get notified when relevant jobs are posted.</p></div>
                </div>
                <label className="switch">
                  <input type="checkbox" name="emailAlerts" checked={formData.emailAlerts} onChange={handleChange} />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => navigate("/")}>Cancel</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobPreferences;