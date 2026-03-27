import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../../context/useAuthStore";
import { 
  Eye, EyeOff, Briefcase, User, ArrowRight, Loader2, 
  CheckCircle2, Building2, Search, Mail, ArrowLeft, Lock, XCircle, ShieldCheck
} from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { login, register, verifyOtp, forgotPassword, resetPassword } = useAuthStore();

  // --- LOGIC & STATE (UNCHANGED) ---
  // Views: 'login', 'register', 'otp', 'forgot', 'reset-otp'
  const [view, setView] = useState("login");
  const initialRole = location.pathname.includes("employer") ? "employer" : "seeker";
  const [role, setRole] = useState(initialRole);
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [otp, setOtp] = useState("");

  // --- PASSWORD STRENGTH STATE ---
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });

  const [passwordTouched, setPasswordTouched] = useState(false);

  // --- REAL-TIME VALIDATION EFFECT ---
  useEffect(() => {
    const pwd = formData.password || "";
    setPasswordCriteria({
      length: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    });
  }, [formData.password]);

  // --- VALIDATION LOGIC ---
  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isPasswordStrong = Object.values(passwordCriteria).every(Boolean);

    if (view === 'login' || view === 'register' || view === 'forgot') {
      if (!formData.email.trim()) { setError("Email is required."); return false; }
      if (!emailRegex.test(formData.email)) { setError("Please enter a valid email address."); return false; }
    }

    if (view === 'register') {
      if (!formData.name.trim()) { setError("Full Name is required."); return false; }
      if (formData.name.trim().length < 2) { setError("Name must be at least 2 characters long."); return false; }
      if (!formData.password) { setError("Password is required."); return false; }
      if (!isPasswordStrong) { setError("Please meet all password requirements below."); return false; }
    }

    if (view === 'login') {
      if (!formData.password) { setError("Password is required."); return false; }
    }

    if (view === 'otp' || view === 'reset-otp') {
      if (!otp || otp.length !== 6 || isNaN(otp)) { setError("Please enter a valid 6-digit OTP."); return false; }
    }

    if (view === 'reset-otp') {
      if (!formData.password) { setError("New Password is required."); return false; }
      if (!isPasswordStrong) { setError("Please meet all password requirements below."); return false; }
      if (formData.password !== formData.confirmPassword) { setError("Passwords do not match."); return false; }
    }

    setError(""); 
    return true;
  };

  // --- HANDLERS ---
  const handleRoleSwitch = (newRole) => {
    if (role === newRole) return;
    setRole(newRole);
    setFormData({ name: "", email: "", password: "", confirmPassword: "" }); 
    setError("");
    setSuccessMsg("");
    setPasswordTouched(false);
  };

  useEffect(() => {
    if (view === "otp" || view === "reset-otp") return;
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
    setError("");
    setSuccessMsg("");
    setOtp("");
    setPasswordTouched(false);
  }, [view]);

  useEffect(() => {
    const urlRole = location.pathname.includes("employer") ? "employer" : "seeker";
    if (role !== urlRole) {
      setRole(urlRole);
    }
  }, [location.pathname]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setLoading(true); setError("");
    try {
      const res = await register({ ...formData, role });
      // Safety check for res in case register returns undefined
      if (res && res.requiresOtp) { 
        setView("otp"); 
      } else { 
        // Use replace: true to avoid history stack issues with extensions
        const target = role === "seeker" ? "/seeker-details" : "/employer-details";
        navigate(target, { replace: true });
      }
    } catch (err) { setError(err.response?.data?.message || "Registration failed."); } 
    finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setLoading(true); setError("");
    try {
      // We pass the currently selected role (e.g. 'employer')
      // The backend will check if user is employer OR recruiter OR admin
      await login({ email: formData.email, password: formData.password, role });
      navigate("/", { replace: true });
    } catch (err) { setError(err.response?.data?.message || "Authentication failed."); } 
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setLoading(true); setError("");
    try {
      await verifyOtp({ email: formData.email, otp });
      const target = role === "employer" ? "/employer-details" : "/seeker-details";
      navigate(target, { replace: true });
    } catch (err) { setError(err.response?.data?.message || "Invalid OTP."); } 
    finally { setLoading(false); }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setLoading(true); setError(""); setSuccessMsg("");
    try {
      await forgotPassword(formData.email);
      setSuccessMsg("OTP sent to your email.");
      setTimeout(() => { setView('reset-otp'); setSuccessMsg(""); setPasswordTouched(false); }, 1000);
    } catch (err) { setError(err.response?.data?.message || "Failed to send OTP."); } 
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return; 
    setLoading(true); setError(""); setSuccessMsg("");
    try {
      await resetPassword({ email: formData.email, otp: otp, password: formData.password });
      setSuccessMsg("Password Reset Successfully!");
      setTimeout(() => setView('login'), 2000);
    } catch (err) { setError(err.response?.data?.message || "Reset failed. Invalid OTP."); } 
    finally { setLoading(false); }
  };

// --- CUSTOM GOOGLE AUTH HANDLER ---
  const customGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        // Note: useGoogleLogin returns an access_token, not a credential ID token
        await useAuthStore.getState().googleLogin({ 
          credential: tokenResponse.access_token, 
          role 
        });
        navigate("/", { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || "Google Authentication failed.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google Sign-In was unsuccessful. Please try again.")
  });

  // --- RENDER HELPERS ---
  const renderPasswordCriteria = () => {
    if (view !== 'register' && view !== 'reset-otp') return null;
    const items = [
      { key: 'length', label: "8+ chars" },
      { key: 'upper', label: "Uppercase" },
      { key: 'lower', label: "Lowercase" },
      { key: 'number', label: "Number" },
      { key: 'special', label: "Symbol" },
    ];
    return (
      <div className="password-checklist">
        {items.map((item) => {
          const isMet = passwordCriteria[item.key];
          const statusClass = !passwordTouched ? "neutral" : (isMet ? "valid" : "invalid");
          return (
            <div key={item.key} className={`checklist-item ${statusClass}`}>
              {!passwordTouched ? <div className="dot" /> : isMet ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const isSeeker = role === "seeker";
  const headerContent = (() => {
    if (view === 'otp') return { title: "Verify Code", sub: `Sent to ${formData.email}` };
    if (view === 'forgot') return { title: "Reset Password", sub: "Enter email for OTP" };
    if (view === 'reset-otp') return { title: "New Password", sub: "Set your new credentials" };
    if (view === 'register') return { title: "Create Account", sub: "Join the elite network" };
    return { title: "Welcome Back", sub: "Sign in to your account" };
  })();

  return (
    <div className="auth-page-wrapper">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

          /* --- MAIN LAYOUT & THEME INTEGRATION --- */
          .auth-page-wrapper {
            background-color: var(--bg-root);
            min-height: 100vh;
            display: flex;
            position: relative;
            font-family: 'Plus Jakarta Sans', sans-serif;
            overflow: hidden;
            color: var(--text-main);
            transition: background-color 0.3s ease, color 0.3s ease;
          }

          /* --- BACKGROUND BLOBS (Powered by Theme Variables) --- */
          .bg-blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            z-index: 0;
            opacity: 0.25;
            animation: float 10s infinite ease-in-out alternate;
            will-change: transform;
          }
          .blob-1 { 
            top: -10%; left: -5%; width: 500px; height: 500px; 
            background: var(--primary); /* Gold/Amber */
          }
          .blob-2 { 
            bottom: -10%; right: -5%; width: 600px; height: 600px; 
            background: var(--info); /* Blue for contrast */
            animation-delay: -5s; 
          }

          @keyframes float {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(20px, 40px) scale(1.1); }
          }
          
          /* --- NEW ANIMATIONS (PREMIUM) --- */
          
          /* 1. Scale Up + Fade In (For the Card) */
          @keyframes zoomFadeIn {
            0% { opacity: 0; transform: scale(0.95) translateY(20px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }

          /* 2. Slide In From Left (For Text) */
          @keyframes slideRightFade {
            0% { opacity: 0; transform: translateX(-30px); }
            100% { opacity: 1; transform: translateX(0); }
          }

          /* Utility Classes for Animation */
          .anim-card {
            opacity: 0; /* Start hidden to prevent glitch */
            animation: zoomFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; /* "Out Expo" easing */
          }

          .anim-text {
            opacity: 0;
            animation: slideRightFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }

          /* --- LEFT PANEL --- */
          .left-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 80px;
            position: relative;
            z-index: 2;
          }

          .hero-badge {
            display: inline-flex; align-items: center; gap: 8px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            color: var(--primary);
            padding: 8px 16px; border-radius: 50px;
            font-size: 13px; font-weight: 600; margin-bottom: 30px; width: fit-content;
            box-shadow: var(--shadow);
            backdrop-filter: blur(4px);
          }

          .hero-title {
            font-family: 'Playfair Display', serif;
            font-size: clamp(3rem, 5vw, 4.5rem);
            color: var(--text-main);
            line-height: 1.1; margin-bottom: 24px;
            font-weight: 700;
          }
          .hero-title span {
            color: var(--primary);
            /* Optional: Gradient text if supported by theme colors */
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          }

          .hero-desc {
            color: var(--text-sub);
            font-size: 1.1rem; line-height: 1.6;
            max-width: 500px; margin-bottom: 40px;
          }

          .feature-list { display: flex; flex-direction: column; gap: 15px; }
          .feature-item { display: flex; align-items: center; gap: 12px; color: var(--text-main); font-weight: 500; }
          .check-icon { color: var(--success); filter: drop-shadow(0 0 5px var(--success)); }

          /* --- RIGHT PANEL --- */
          .right-section {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;
            padding: 40px;
          }

          /* --- GLASS CARD (THEME ADAPTIVE) --- */
          .glass-card {
            width: 100%; max-width: 460px;
            
            /* Theme Glass Variable + Blur */
            background: var(--glass);
            backdrop-filter: blur(24px); /* Increased blur */
            -webkit-backdrop-filter: blur(24px);
            
            border: 1px solid var(--border);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); /* Softer shadow */
            border-radius: 24px;
            padding: 40px;
            
            position: relative;
            overflow: hidden;
          }
          
          /* Shine effect */
          .glass-card::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, var(--border), transparent);
            opacity: 0.5;
          }

          .form-header { text-align: center; margin-bottom: 30px; }
          .form-header h2 { font-family: 'Playfair Display', serif; font-size: 32px; color: var(--text-main); margin-bottom: 8px; }
          .form-header p { color: var(--text-sub); font-size: 14px; }

          /* --- ROLE SWITCH --- */
          .role-switch {
            display: flex; 
            background: var(--bg-input); 
            padding: 4px; border-radius: 12px; margin-bottom: 25px;
            border: 1px solid var(--border);
          }
          .switch-btn {
            flex: 1; padding: 10px; border: none; background: transparent;
            color: var(--text-sub); font-weight: 600; cursor: pointer; border-radius: 8px;
            display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.3s;
          }
          .switch-btn:hover { color: var(--text-main); }
          .switch-btn.active {
            background: var(--bg-card); 
            color: var(--primary);
            box-shadow: var(--shadow);
            border: 1px solid var(--border);
          }

          /* --- INPUTS --- */
          .input-group { margin-bottom: 20px; position: relative; }
          .input-group label { display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 8px; font-weight: 600; letter-spacing: 0.5px; }
          
          .input-field-wrapper {
            position: relative; display: flex; align-items: center;
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: 12px;
            transition: 0.3s;
          }
          .input-field-wrapper:hover {
            border-color: var(--text-sub);
            background: var(--bg-hover);
          }
          .input-field-wrapper:focus-within {
            border-color: var(--primary);
            box-shadow: 0 0 0 2px var(--primary-dim);
          }
          
          .icon { color: var(--text-sub); margin-left: 14px; }
          .auth-input {
            width: 100%; background: transparent; border: none; outline: none;
            padding: 14px 14px 14px 12px; color: var(--text-main); font-size: 15px;
          }
          .auth-input::placeholder { color: var(--text-muted); }
          
          .eye-btn {
            background: transparent; border: none; color: var(--text-sub);
            padding: 0 14px; cursor: pointer; transition: 0.2s;
          }
          .eye-btn:hover { color: var(--text-main); }

          /* --- BUTTONS --- */
          .submit-btn {
            width: 100%; padding: 14px; border-radius: 12px; border: none;
            background: var(--primary);
            color: #fff; /* White text on primary is standard */
            font-size: 16px; font-weight: 700; cursor: pointer;
            transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px;
            margin-top: 10px; 
            box-shadow: 0 4px 15px var(--primary-dim);
            position: relative; overflow: hidden;
          }
          .submit-btn:hover { 
            background: var(--primary-hover);
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px var(--primary-dim);
          }
          .submit-btn:disabled { opacity: 0.7; cursor: wait; filter: grayscale(0.5); }

          .link-btn { background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; text-decoration: none; margin-left: 5px; transition: 0.2s; }
          .link-btn:hover { text-decoration: underline; color: var(--primary-hover); }
          
          .back-btn { width: 100%; margin-top: 20px; background: transparent; color: var(--text-sub); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: 0.2s; }
          .back-btn:hover { color: var(--text-main); }

        /* --- DIVIDER --- */
          .auth-divider {
            display: flex; align-items: center; text-align: center; margin: 30px 0 20px 0;
          }
          .auth-divider::before, .auth-divider::after {
            content: ''; flex: 1; border-bottom: 1px solid var(--border); opacity: 0.5;
          }
          .auth-divider span {
            padding: 0 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted);
          }
          
          /* --- CUSTOM GOOGLE BUTTON --- */
          .google-btn-wrapper {
            display: flex; justify-content: center; width: 100%; 
          }
          .custom-google-btn {
            width: 100%; display: flex; align-items: center; justify-content: center;
            background: transparent; border: 1px solid var(--border);
            border-radius: 12px; padding: 10px 16px; cursor: pointer; transition: all 0.3s ease;
            color: var(--text-main); font-weight: 600; font-size: 15px;
            gap: 12px;
          }
          .custom-google-btn:hover {
            background: var(--bg-hover); transform: translateY(-2px);
            border-color: var(--text-sub);
          }
          .g-logo-box {
            background: #f3f4f6; /* Premium Grey Background */
            padding: 6px; border-radius: 50%; /* Circle background for logo */
            display: flex; align-items: center; justify-content: center;
          }

          /* --- ALERTS --- */
          .alert-box { padding: 12px; border-radius: 10px; font-size: 13px; text-align: center; margin-bottom: 20px; border: 1px solid; backdrop-filter: blur(5px); }
          .alert-error { background: rgba(239, 68, 68, 0.1); border-color: var(--danger); color: var(--danger); }
          .alert-success { background: rgba(16, 185, 129, 0.1); border-color: var(--success); color: var(--success); }

          /* --- PASSWORD CHECKLIST --- */
          .password-checklist { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; background: var(--bg-input); padding: 10px; border-radius: 8px; border: 1px solid var(--border); }
          .checklist-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted); transition: 0.3s; }
          .checklist-item.valid { color: var(--success); }
          .checklist-item.invalid { color: var(--danger); }
          .checklist-item.neutral { color: var(--text-muted); }
          .dot { width: 4px; height: 4px; background: currentColor; border-radius: 50%; }

          .toggle-text { text-align: center; margin-top: 25px; color: var(--text-sub); font-size: 14px; }

          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }

          /* --- RESPONSIVE --- */
          @media (max-width: 900px) {
            .left-section { display: none; }
            .right-section { padding: 20px; }
            .glass-card { padding: 30px 24px; backdrop-filter: blur(20px); }
            .hero-title { font-size: 2.5rem; }
            .bg-blob { opacity: 0.4; }
          }
        `}
      </style>

      {/* BACKGROUND ELEMENTS */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      {/* --- LEFT PANEL: BRANDING (Hidden on Mobile) --- */}
      <div className="left-section">
        <div className="hero-badge anim-text">
          {isSeeker ? <User size={16} /> : <Building2 size={16} />}
          {isSeeker ? "For Professionals" : "For Enterprises"}
        </div>
        <h1 className="hero-title anim-text delay-100">
          {isSeeker ? "Experience is" : "Expertise is"} <br />
          <span>The Ultimate Asset.</span>
        </h1>
        <p className="hero-desc anim-text delay-200">
          {isSeeker 
            ? "Connect with forward-thinking companies. Turn your decades of leadership into high-impact advisory roles."
            : "Build your dream team with experienced veterans who require zero training and bring maximum impact."}
        </p>
        <div className="feature-list anim-text delay-300">
          <div className="feature-item"><CheckCircle2 size={18} className="check-icon" /> Verified Professionals</div>
          <div className="feature-item"><CheckCircle2 size={18} className="check-icon" /> Direct Mentorship</div>
          <div className="feature-item"><CheckCircle2 size={18} className="check-icon" /> Secure Platform</div>
        </div>
      </div>

      {/* --- RIGHT PANEL: FORM --- */ }
      <div className="right-section">
        <div className="glass-card anim-card">
          
          <div className="form-header">
            <h2>{headerContent.title}</h2>
            <p>{headerContent.sub}</p>
          </div>

          {/* ROLE SWITCHER */}
          {(view === 'login' || view === 'register') && (
            <div className="role-switch">
              <button 
                type="button"
                className={`switch-btn ${isSeeker ? 'active' : ''}`} 
                onClick={() => handleRoleSwitch('seeker')}
              >
                <User size={16} /> Job Seeker
              </button>
              <button 
                type="button"
                className={`switch-btn ${!isSeeker ? 'active' : ''}`} 
                onClick={() => handleRoleSwitch('employer')}
              >
                <Building2 size={16} /> Employer
              </button>
            </div>
          )}

          {/* ALERTS */}
          {error && <div className="alert-box alert-error">{error}</div>}
          {successMsg && <div className="alert-box alert-success">{successMsg}</div>}

          {/* --- FORMS --- */}
          
          {/* 1. OTP FORM */}
          {view === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              <div className="input-group">
                <div className="input-field-wrapper">
                  <Lock size={18} className="icon" />
                  <input type="text" className="auth-input" placeholder="6-digit Code" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} style={{letterSpacing: 4, fontWeight: 'bold'}} />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <Loader2 className="spin" /> : "Verify Account"}
              </button>
              <button type="button" className="back-btn" onClick={() => setView('register')}>Back to Register</button>
            </form>
          )}

          {/* 2. FORGOT PASSWORD */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword}>
              <div className="input-group">
                <label>Registered Email</label>
                <div className="input-field-wrapper">
                  <Mail size={18} className="icon" />
                  <input type="email" className="auth-input" placeholder="name@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <Loader2 className="spin" /> : "Send Reset Code"}
              </button>
              <button type="button" className="back-btn" onClick={() => setView('login')}><ArrowLeft size={16}/> Back to Login</button>
            </form>
          )}

          {/* 3. RESET PASSWORD */}
          {view === 'reset-otp' && (
            <form onSubmit={handleResetPassword}>
              <div className="input-group">
                <label>Enter OTP</label>
                <div className="input-field-wrapper">
                  <Lock size={18} className="icon" />
                  <input type="text" className="auth-input" placeholder="6-digit Code" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} style={{letterSpacing: 4, fontWeight: 'bold'}} required />
                </div>
              </div>
              <div className="input-group">
                <label>New Password</label>
                <div className="input-field-wrapper">
                  <Lock size={18} className="icon" />
                  <input type={showPassword ? "text" : "password"} className="auth-input" placeholder="New Password" value={formData.password} onChange={(e) => {setFormData({...formData, password: e.target.value}); setPasswordTouched(true);}} required />
                  <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                </div>
                {renderPasswordCriteria()}
              </div>
              <div className="input-group">
                <label>Confirm Password</label>
                <div className="input-field-wrapper">
                  <Lock size={18} className="icon" />
                  <input type={showPassword ? "text" : "password"} className="auth-input" placeholder="Confirm Password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <Loader2 className="spin" /> : "Update Password"}
              </button>
              <button type="button" className="back-btn" onClick={() => setView('login')}>Cancel</button>
            </form>
          )}

          {/* 4. LOGIN / REGISTER */}
        {/* 4. LOGIN / REGISTER */}
          {(view === 'login' || view === 'register') && (
            <>
              <form onSubmit={view === 'login' ? handleLogin : handleRegister}>
                {view === 'register' && (
                  <div className="input-group">
                    <label>Full Name</label>
                    <div className="input-field-wrapper">
                      <User size={18} className="icon" />
                      <input type="text" className="auth-input" placeholder={isSeeker ? "John Doe" : "Company Name"} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label>Email Address</label>
                  <div className="input-field-wrapper">
                    <Mail size={18} className="icon" />
                    <input type="email" className="auth-input" placeholder="name@company.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                  </div>
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <div className="input-field-wrapper">
                    <Lock size={18} className="icon" />
                    <input type={showPassword ? "text" : "password"} className="auth-input" placeholder="••••••••" value={formData.password} onChange={(e) => {setFormData({...formData, password: e.target.value}); if(view==='register') setPasswordTouched(true);}} required />
                    <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                  </div>
                  {view === 'register' && renderPasswordCriteria()}
                  {view === 'login' && (
                    <div style={{textAlign: 'right', marginTop: 8}}>
                      <button type="button" onClick={() => setView('forgot')} style={{background:'none', border:'none', color:'var(--text-sub)', fontSize:12, cursor:'pointer', textDecoration:'underline'}}>Forgot Password?</button>
                    </div>
                  )}
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? <Loader2 className="spin" /> : (view === 'login' ? "Sign In" : "Create Account")}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

           {/* --- CUSTOM GOOGLE LOGIN SECTION --- */}
              <div className="auth-divider">
                <span>Or</span>
              </div>
              
              <div className="google-btn-wrapper">
                <button type="button" className="custom-google-btn" onClick={() => customGoogleLogin()}>
                  <div className="g-logo-box">
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                  </div>
                  <span>Continue with Google</span>
                </button>
              </div>
            </>
          )}

          {(view === 'login' || view === 'register') && (
            <p className="toggle-text">
              {view === 'login' ? "New to the platform?" : "Already have an account?"}
              <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="link-btn">
                {view === 'login' ? "Register Now" : "Login"}
              </button>
            </p>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthPage;