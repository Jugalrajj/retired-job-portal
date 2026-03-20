import React, { useState, useEffect } from "react";
import { 
  User, Lock, Bell, Save, Loader2, AlertCircle, CheckCircle, 
  ChevronRight, Mail, Phone, Shield, Briefcase, FileText, Building2 
} from "lucide-react";
import { useNavigate } from "react-router-dom"; 
import useAuthStore from "../../context/useAuthStore";
import api from "../../services/api";

const Settings = () => {
  const navigate = useNavigate(); 
  const { user, updateUser } = useAuthStore(); 
  const currentUser = user?.user || {};
  
  // --- ROLE DETECTION ---
  const isSeeker = currentUser?.role === 'seeker' || currentUser?.role === 'jobseeker';
  const isEmployer = currentUser?.role === 'employer' || currentUser?.role === 'recruiter';

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // --- STATE MANAGEMENT ---
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "", 
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Default Email Alerts to TRUE
  const [notifs, setNotifs] = useState({
    emailAlerts: true,
    smsAlerts: false,
  });

  // --- INITIALIZE DATA ---
  useEffect(() => {
    if (currentUser) {
      setProfile({
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        bio: currentUser.bio || "",
      });
      // Load existing preferences
      if (currentUser.preferences) {
        setNotifs(currentUser.preferences);
      }
    }
  }, [currentUser]);

  // --- HANDLERS ---
  const handleMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await api.put("/users/profile", { 
        name: profile.name, 
        phone: profile.phone,
        bio: profile.bio 
      });
      
      handleMessage("success", "Profile updated successfully!");
      const updatedData = res.data?.user || { name: profile.name, phone: profile.phone, bio: profile.bio };
      updateUser(updatedData);
      
    } catch (err) {
      handleMessage("error", err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      handleMessage("error", "New passwords do not match.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      handleMessage("error", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      handleMessage("success", "Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      handleMessage("error", err.response?.data?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotif = async (key) => {
    // 1. Calculate new state
    const updatedNotifs = { ...notifs, [key]: !notifs[key] };
    
    // 2. Optimistic Update (Immediate UI Change)
    setNotifs(updatedNotifs);
    
    try {
      // 3. Send API Request
      await api.put("/users/preferences", { preferences: updatedNotifs });
      
      // 4. Update Context Store
      updateUser({ preferences: updatedNotifs });
      
      // handleMessage("success", "Preference saved.");
    } catch (err) {
      console.error("Failed to save preference", err);
      // Revert if failed
      setNotifs({ ...notifs, [key]: notifs[key] });
      handleMessage("error", "Failed to save preference.");
    }
  };

  return (
    <div className="dark-settings-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        
        /* --- PAGE WRAPPER --- */
        .dark-settings-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root); /* 🔥 Theme Var */
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          padding: 40px 20px;
          display: flex; justify-content: center;
          color: var(--text-main); /* 🔥 Theme Var */
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
          background: var(--bg-card); /* 🔥 Theme Var */
          backdrop-filter: blur(12px);
          border: 1px solid var(--border); /* 🔥 Theme Var */
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
          display: flex; flex-direction: column;
          min-height: 80vh;
          position: relative;
          overflow: hidden;
          z-index: 10;
        }

        /* Top Accent Strip */
        .designer-container::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #4f46e5 0%, var(--primary) 100%);
        }

        /* --- LAYOUT --- */
        .layout-body {
          display: flex; flex: 1;
        }

        /* --- SIDEBAR --- */
        .settings-sidebar {
          width: 280px; background: var(--bg-card); /* 🔥 Theme Var */
          border-right: 1px solid var(--border);
          padding: 30px 20px; display: flex; flex-direction: column; gap: 8px;
        }

        .tab-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px; border-radius: 12px;
          border: 1px solid transparent; background: transparent;
          color: var(--text-sub); /* 🔥 Theme Var */
          font-weight: 600; font-size: 14px;
          cursor: pointer; transition: all 0.2s; text-align: left;
        }
        .tab-btn:hover { background: var(--bg-input); color: var(--text-main); }
        
        .tab-btn.active {
          background: var(--primary-dim); color: var(--primary);
          border: 1px solid var(--primary);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .tab-btn.active .icon-box { background: var(--primary); color: #000; }
        
        .icon-box {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--bg-input); color: var(--text-sub); transition: 0.2s;
        }
        
        .arrow-indicator { margin-left: auto; opacity: 0.8; }

        /* --- CONTENT AREA --- */
        .settings-content {
          flex: 1; padding: 40px; overflow-y: auto; 
          background: var(--bg-input); /* 🔥 Theme Var */
        }

        .content-header { margin-bottom: 30px; border-bottom: 1px solid var(--border); padding-bottom: 20px; }
        .content-header h2 { font-size: 24px; font-weight: 700; color: var(--text-main); margin: 0 0 8px; }
        .content-header p { color: var(--text-sub); font-size: 14px; margin: 0; }

        /* --- FORMS --- */
        .settings-form { max-width: 600px; }
        .form-grid { display: grid; gap: 24px; margin-bottom: 30px; }
        
        .input-group { display: flex; flex-direction: column; gap: 8px; position: relative; }
        .input-group label { font-size: 13px; font-weight: 600; color: var(--text-main); }
        
        .input-wrapper { position: relative; }
        .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-sub); width: 18px; }
        
        .input-group input {
          width: 100%; padding: 12px 16px 12px 42px;
          border: 1px solid var(--border); border-radius: 10px;
          font-size: 14px; color: var(--text-main); font-weight: 500;
          transition: 0.2s; box-sizing: border-box; background: var(--bg-card);
        }
        .input-group input:focus { border-color: var(--primary); outline: none; background: var(--bg-input); }
        .input-group input.disabled-input { background: var(--bg-input); color: var(--text-sub); cursor: not-allowed; }
        
        .helper-text { font-size: 12px; color: var(--text-sub); margin-top: 4px; }

        /* --- BUTTONS --- */
        .btn-save {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%); 
          color: white; border: none;
          padding: 12px 30px; border-radius: 10px; font-weight: 700; font-size: 14px;
          cursor: pointer; display: flex; align-items: center; gap: 10px;
          transition: 0.2s; box-shadow: 0 4px 15px var(--primary-dim);
        }
        .btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 20px var(--primary-dim); }
        .btn-save:disabled { opacity: 0.7; cursor: not-allowed; }

        .btn-nav-card {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          padding: 16px; border: 1px solid var(--border); border-radius: 12px;
          background: var(--bg-card); cursor: pointer; transition: 0.2s; margin-bottom: 24px;
        }
        .btn-nav-card:hover { border-color: var(--primary); background: var(--bg-input); }
        .nav-card-info h4 { margin: 0 0 4px; font-size: 15px; color: var(--text-main); font-weight: 700; }
        .nav-card-info p { margin: 0; font-size: 13px; color: var(--text-sub); }

        /* --- ALERTS --- */
        .alert-box {
          padding: 14px 20px; border-radius: 12px; margin-bottom: 24px;
          display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 14px;
          animation: slideDown 0.3s ease; border: 1px solid transparent;
        }
        .alert-box.success { background: rgba(16, 185, 129, 0.15); color: var(--success); border-color: rgba(16, 185, 129, 0.3); }
        .alert-box.error { background: rgba(239, 68, 68, 0.15); color: var(--danger); border-color: rgba(239, 68, 68, 0.3); }
        
        /* --- TOGGLES --- */
        .toggles-list { display: flex; flex-direction: column; gap: 16px; max-width: 600px; }
        .toggle-card {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px; border: 1px solid var(--border); border-radius: 12px;
          background: var(--bg-card); cursor: pointer; transition: 0.2s;
        }
        .toggle-card:hover { border-color: var(--primary); background: var(--bg-input); }
        
        .toggle-title { font-weight: 700; color: var(--text-main); margin-bottom: 4px; }
        .toggle-desc { font-size: 13px; color: var(--text-sub); }

        /* Switch */
        .switch-wrapper { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch-wrapper input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
          background-color: var(--border); transition: .4s; border-radius: 34px;
        }
        .slider:before {
          position: absolute; content: ""; height: 18px; width: 18px;
          left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%;
        }
        input:checked + .slider { background-color: var(--primary); }
        input:checked + .slider:before { transform: translateX(20px); background-color: #0f172a; }

        /* --- ANIMATIONS --- */
        .fade-in-up { animation: fadeInUp 0.4s ease; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* --- RESPONSIVE --- */
        @media (max-width: 900px) {
          .designer-container { height: auto; border-radius: 0; border-width: 0; }
          .dark-settings-wrapper { padding: 0; }
          .layout-body { flex-direction: column; }
          .settings-sidebar { 
            width: 100%; flex-direction: row; padding: 16px; overflow-x: auto; 
            border-right: none; border-bottom: 1px solid var(--border); 
            gap: 10px; box-sizing: border-box;
          }
          .tab-btn { padding: 10px 14px; white-space: nowrap; flex: 0 0 auto; }
          .settings-content { padding: 24px; }
        }
      `}</style>

      {/* BACKGROUND FX */}
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="designer-container">
        {/* --- LAYOUT BODY --- */}
        <div className="layout-body">
          
          {/* SIDEBAR TABS */}
          <aside className="settings-sidebar">
            <div style={{padding:'0 10px 10px', fontSize:12, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase'}}>
              Account Settings
            </div>
            
            <button 
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} 
              onClick={() => { setActiveTab('profile'); setMessage({type:"", text:""}); }}
            >
              <div className="icon-box"><User size={18} /></div>
              <span>Profile Info</span>
              {activeTab === 'profile' && <ChevronRight size={16} className="arrow-indicator"/>}
            </button>

            <button 
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} 
              onClick={() => { setActiveTab('security'); setMessage({type:"", text:""}); }}
            >
              <div className="icon-box"><Lock size={18} /></div>
              <span>Security</span>
              {activeTab === 'security' && <ChevronRight size={16} className="arrow-indicator"/>}
            </button>

            <button 
              className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} 
              onClick={() => { setActiveTab('notifications'); setMessage({type:"", text:""}); }}
            >
              <div className="icon-box"><Bell size={18} /></div>
              <span>Notifications</span>
              {activeTab === 'notifications' && <ChevronRight size={16} className="arrow-indicator"/>}
            </button>
          </aside>

          {/* MAIN CONTENT */}
          <main className="settings-content">
            
            {/* GLOBAL ALERT */}
            {message.text && (
              <div className={`alert-box ${message.type}`}>
                {message.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
                <span>{message.text}</span>
              </div>
            )}

            {/* --- 1. PROFILE TAB --- */}
            {activeTab === 'profile' && (
              <div className="fade-in-up">
                <div className="content-header">
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                        <div style={{background:'var(--primary-dim)', padding:8, borderRadius:8, color:'var(--primary)'}}><User size={24}/></div>
                        <div>
                            {/* DYNAMIC TITLE */}
                            <h2>{isSeeker ? "Seeker Profile" : isEmployer ? "Account Details" : "Public Profile"}</h2>
                            <p>Update your personal information and contact details.</p>
                        </div>
                    </div>
                </div>

                {/* A. FOR SEEKERS */}
                {isSeeker && (
                  <div className="btn-nav-card" onClick={() => navigate('/seeker-details')}>
                    <div className="nav-card-info" style={{display:'flex', alignItems:'center', gap:12}}>
                       <div style={{background:'rgba(59, 130, 246, 0.1)', color:'#3b82f6', padding:8, borderRadius:8}}><FileText size={20}/></div>
                       <div>
                          <h4>Professional Profile</h4>
                          <p>Manage resume, skills, experience, and education.</p>
                       </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-sub)"/>
                  </div>
                )}

                {/* B. FOR EMPLOYERS */}
                {isEmployer && (
                  <div className="btn-nav-card" onClick={() => navigate('/employer-details')}>
                    <div className="nav-card-info" style={{display:'flex', alignItems:'center', gap:12}}>
                       <div style={{background:'rgba(16, 185, 129, 0.1)', color:'#10b981', padding:8, borderRadius:8}}><Building2 size={20}/></div>
                       <div>
                          <h4>Company Profile</h4>
                          <p>Manage company branding, website, and details.</p>
                       </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-sub)"/>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="settings-form">
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Full Name</label>
                      <div className="input-wrapper">
                        <User className="input-icon"/>
                        <input 
                          type="text" 
                          value={profile.name} 
                          onChange={e => setProfile({...profile, name: e.target.value})} 
                          required
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Email Address</label>
                      <div className="input-wrapper">
                        <Mail className="input-icon"/>
                        <input 
                          type="email" 
                          value={profile.email} 
                          disabled 
                          className="disabled-input" 
                        />
                      </div>
                      <span className="helper-text">Contact admin to change email.</span>
                    </div>
                    <div className="input-group">
                      <label>Phone Number</label>
                      <div className="input-wrapper">
                        <Phone className="input-icon"/>
                        <input 
                          type="text" 
                          value={profile.phone} 
                          onChange={e => setProfile({...profile, phone: e.target.value})} 
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="action-row">
                    <button type="submit" className="btn-save" disabled={loading}>
                      {loading ? <Loader2 size={18} className="spin"/> : <Save size={18}/>}
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* --- 2. SECURITY TAB --- */}
            {activeTab === 'security' && (
              <div className="fade-in-up">
                <div className="content-header">
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                        <div style={{background:'var(--primary-dim)', padding:8, borderRadius:8, color:'var(--primary)'}}><Shield size={24}/></div>
                        <div>
                            <h2>Security</h2>
                            <p>Manage your password and account safety.</p>
                        </div>
                    </div>
                </div>
                <form onSubmit={handleUpdatePassword} className="settings-form">
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Current Password</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon"/>
                        <input 
                          type="password" 
                          placeholder="••••••••" 
                          value={passwordData.currentPassword}
                          onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>New Password</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon"/>
                        <input 
                          type="password" 
                          placeholder="••••••••" 
                          value={passwordData.newPassword}
                          onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Confirm New Password</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon"/>
                        <input 
                          type="password" 
                          placeholder="••••••••" 
                          value={passwordData.confirmPassword}
                          onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="action-row">
                    <button type="submit" className="btn-save" disabled={loading}>
                      {loading ? <Loader2 size={18} className="spin"/> : <Save size={18}/>}
                      {loading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* --- 3. NOTIFICATIONS TAB --- */}
            {activeTab === 'notifications' && (
              <div className="fade-in-up">
                <div className="content-header">
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                        <div style={{background:'var(--primary-dim)', padding:8, borderRadius:8, color:'var(--primary)'}}><Bell size={24}/></div>
                        <div>
                            <h2>Preferences</h2>
                            <p>Control your communication settings.</p>
                        </div>
                    </div>
                </div>
                <div className="toggles-list">
                   <label className="toggle-card">
                      <div className="toggle-info">
                         <div className="toggle-title">Email Alerts</div>
                         <div className="toggle-desc">Receive updates about new applications and messages.</div>
                      </div>
                      <div className="switch-wrapper">
                        <input 
                          type="checkbox" 
                          checked={notifs.emailAlerts} 
                          onChange={() => handleToggleNotif('emailAlerts')} 
                        />
                        <span className="slider round"></span>
                      </div>
                   </label>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;