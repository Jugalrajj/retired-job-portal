import React, { useState, useRef, useEffect, useCallback } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../context/useAuthStore";
import useThemeStore from "../context/useThemeStore"; // Import Theme Store
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import toast from "react-hot-toast";

// Image 1: For Light Theme (Dark Text)
import IVGLogoLight from "../assets/IVGJobslogo2.png"; 
// Image 2: For Dark Theme (White Text)
import IVGLogoDark from "../assets/IVGLogo.png"; 

import {
  LogOut,
  Menu,
  X,
  User,
  Settings,
  ChevronDown,
  HelpCircle,
  Bell,
  Users,
  CreditCard,
  CheckCircle,
  MessageSquare,
  Shield,
  Sun, // Added Sun Icon
  Moon, // Added Moon Icon
} from "lucide-react";

// --- HELPER: Construct Image URL ---
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("blob:")) return path;
  if (path.startsWith("http")) return path;
  let cleanPath = path.replace(/\\/g, "/");
  if (cleanPath.startsWith("/")) cleanPath = cleanPath.substring(1);
  return `http://localhost:5000/${cleanPath}`;
};

// --- HELPER: Format Time for Notifications ---
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore(); // Access Theme Store
  const { socket } = useSocket();
  const currentUser = user?.user;
  const role = currentUser?.role;
  const navigate = useNavigate();
  const location = useLocation();

  // --- DYNAMIC LOGO SELECTION ---
  const currentLogo = theme === 'dark' ? IVGLogoDark : IVGLogoLight;

  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Refs for tracking outside clicks on both mobile and desktop menus
  const notifRef = useRef(null);
  const mobileNotifRef = useRef(null);

  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [currentUser?.photoUrl]);

  // --- FIX: Close menus AND Scroll to Top on route change ---
  useEffect(() => {
    setIsOpen(false);
    setShowDropdown(false);
    setShowNotifDropdown(false);
    window.scrollTo(0, 0); // 🔥 SCROLL TO TOP FIX
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // --- PERMISSION CHECK ---
  const hasPermission = (perm) => {
    if (!currentUser) return false;
    
    // 1. Company Admins (Owner) get everything
    if (currentUser.isCompanyAdmin) return true;
    
    // 2. Regular Employers (legacy) get everything if admin flag isn't set
    if (
      role === "employer" &&
      (currentUser.isCompanyAdmin === undefined ||
        currentUser.isCompanyAdmin === null)
    ) {
      return true;
    }

    // 3. Recruiters/Team Members check specific permissions
    // The backend sends permissions array for recruiters
    return currentUser.permissions?.includes(perm);
  };

  // --- FETCH DATA ---
  const fetchChatUnreadCount = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data } = await api.get("/chats/unread");
      setUnreadMsgCount(data.count);
    } catch (err) {
      // FIX: Gracefully handle 404 (No profile found) by setting count to 0
      if (err.response && err.response.status === 404) {
        setUnreadMsgCount(0);
      } else {
        console.error("Chat count error", err);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    fetchChatUnreadCount();
  }, [fetchChatUnreadCount]);

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (newMessage) => {
      if (location.pathname !== "/messages") {
        setUnreadMsgCount((prev) => prev + 1);
        const senderName = newMessage.sender?.name || "Someone";
        toast.custom(
          (t) => (
            <div
              onClick={() => {
                toast.dismiss(t.id);
                navigate("/messages");
              }}
              style={{
                cursor: "pointer",
                background: "#fff",
                color: "#333",
                padding: "12px 20px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                borderLeft: "5px solid #fbbf24",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                animation: t.visible ? "fadeIn 0.3s" : "fadeOut 0.3s",
                zIndex: 99999,
              }}
            >
              <div
                style={{
                  background: "#fffbeb",
                  padding: "8px",
                  borderRadius: "50%",
                  color: "#fbbf24",
                }}
              >
                <MessageSquare size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>
                  New Message
                </h4>
                <p
                  style={{ margin: "4px 0 0", fontSize: "13px", color: "#666" }}
                >
                  {senderName}: {newMessage.text.substring(0, 25)}...
                </p>
              </div>
            </div>
          ),
          { duration: 5000 },
        );
      } else {
        fetchChatUnreadCount();
      }
    };
    const handleMessagesRead = () => fetchChatUnreadCount();
    socket.on("newMessage", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket, location, navigate, fetchChatUnreadCount]);

  // --- NOTIFICATION LOGIC ---
  const fetchUnreadCount = async () => {
    if (!currentUser) return;
    try {
      const { data } = await api.get("/notifications/unread");
      setUnreadCount(data.count);
    } catch (err) {
      console.error("Failed count", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data);
    } catch (err) {
      console.error("Failed fetching notifications", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.patch("/notifications/read", { notificationId: notif._id });
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Error marking read", err);
      }
    }
    setShowNotifDropdown(false);
    if (notif.type === "APPLICATION_RECEIVED")
      navigate("/employer-applications", {
        state: { selectedJobId: notif.relatedJobId },
      });
    else if (notif.type === "STATUS_UPDATE") navigate("/applications");
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [currentUser, location.pathname]);

  useEffect(() => {
    if (showNotifDropdown) fetchNotifications();
  }, [showNotifDropdown]);

  // --- Click Outside Listener ---
  useEffect(() => {
    const f = (e) => {
      // Handle Profile Dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      
      // Handle Notification Dropdown (checking both mobile and desktop refs)
      const clickedDesktopNotif = notifRef.current && notifRef.current.contains(e.target);
      const clickedMobileNotif = mobileNotifRef.current && mobileNotifRef.current.contains(e.target);
      
      if (!clickedDesktopNotif && !clickedMobileNotif) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);

  // --- SHARED NOTIFICATION DROPDOWN UI ---
  const notificationDropdownContent = (
    <div className="notif-dropdown">
      <div className="notif-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <span className="badge">{unreadCount} New</span>
        )}
      </div>
      <div className="notif-list">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className={`notif-item ${!notif.isRead ? "unread" : ""}`}
              onClick={() => handleNotificationClick(notif)}
            >
              <div
                className={`notif-icon ${notif.type === "STATUS_UPDATE" ? "green" : "gold"}`}
              >
                {notif.type === "STATUS_UPDATE" ? (
                  <CheckCircle size={16} />
                ) : (
                  <MessageSquare size={16} />
                )}
              </div>
              <div className="notif-content">
                <p className="notif-title">{notif.title}</p>
                <p className="notif-msg">{notif.message}</p>
                <span className="notif-time">
                  {formatTimeAgo(notif.createdAt)}
                </span>
              </div>
              {!notif.isRead && (
                <div className="unread-dot"></div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-notif">
            <Bell size={24} className="empty-icon" />
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );

  // --- NAV CONFIG ---
  const navConfig = {
    guest: [
      { name: "Home", path: "/" },
      { name: "Find Jobs", path: "/find-jobs" },
      { name: "Categories", path: "/categories" },
      { name: "About Us", path: "/about-us" },
      { name: "Help & Support", path: "/support" },
    ],
    seeker: [
      { name: "Home", path: "/" },
      { name: "Find Jobs", path: "/find-jobs" },
      { name: "Categories", path: "/categories" },
      { name: "My Applications", path: "/applications" },
      { name: "Saved Jobs", path: "/saved-jobs" },
      { name: "Messages", path: "/messages", badge: unreadMsgCount },
    ],
    employer: [
      { name: "Home", path: "/", alwaysShow: true },
      { name: "Post a Job", path: "/post-job", requiredPerm: "post_jobs" },
      { name: "My Jobs", path: "/my-jobs", requiredPerm: "post_jobs" },
      {
        name: "Applications",
        path: "/employer-applications",
        requiredPerm: "view_applications",
      },
      {
        name: "Talent Pool",
        path: "/talent-pool",
        requiredPerm: "view_talent_pool",
      },
      {
        name: "Messages",
        path: "/messages",
        alwaysShow: true,
        badge: unreadMsgCount,
      },
    ],
    // --- ADMIN CONFIG ---
    admin: [
      { name: "Dashboard", path: "/" }
    ],
  };

  // --- LOGIC FIX: Handle 'recruiter' same as 'employer' ---
  let currentNavLinks = [];
  
  if (!currentUser) {
    currentNavLinks = navConfig.guest;
  } 
  else if (role === "seeker") {
    currentNavLinks = navConfig.seeker;
  }
  else if (role === "employer" || role === "recruiter") { 
    // 🔥 FIX: Include 'recruiter' here so they get the Employer Nav Links
    currentNavLinks = navConfig.employer.filter(
      (link) =>
        link.alwaysShow ||
        !link.requiredPerm ||
        hasPermission(link.requiredPerm),
    );
  }
  else if (role === "admin") {
    currentNavLinks = navConfig.admin;
  }

  const menuConfig = {
    seeker: [
      { name: "My Profile", path: "/seeker-details", icon: <User size={18} /> },
      { name: "Settings", path: "/settings", icon: <Settings size={18} /> },
      {
        name: "Help & Support",
        path: "/support",
        icon: <HelpCircle size={18} />,
      },
    ],
    employer: [
      {
        name: "Company Profile",
        path: "/employer-details",
        icon: <Users size={18} />,
        requiredPerm: "edit_company",
      },
      {
        name: "Team Members",
        path: "/team",
        icon: <User size={18} />,
        requiredPerm: "manage_team",
      },
      {
        name: "Settings",
        path: "/settings",
        icon: <Settings size={18} />,
        alwaysShow: true,
      },
      {
        name: "Billing / Plans",
        path: "/billing",
        icon: <CreditCard size={18} />,
        requiredPerm: "manage_team",
      },
      {
        name: "Billing History",
        path: "/billing-history",
        icon: <CreditCard size={18} />,
        requiredPerm: "manage_team",
      },
      {
        name: "Help & Support",
        path: "/support",
        icon: <HelpCircle size={18} />,
      },
    ],
    // --- ADMIN MENU CONFIG ---
    admin: [
      {
        name: "Admin Dashboard",
        path: "/", 
        icon: <Shield size={18} />,
      },
      { name: "Settings", path: "/settings", icon: <Settings size={18} /> },
    ],
  };

  let currentMenuLinks = [];
  if (currentUser) {
    // 🔥 FIX: Map 'recruiter' role to 'employer' menu config
    const configRole = role === 'recruiter' ? 'employer' : role;
    const rawLinks = menuConfig[configRole] || [];
    
    currentMenuLinks = rawLinks.filter(
      (item) =>
        role === "seeker" ||
        role === "admin" ||
        item.alwaysShow ||
        !item.requiredPerm ||
        hasPermission(item.requiredPerm),
    );
  }

  return (
    <>
      <nav className="darkbar">
        {/* PREMIUM BOTTOM BORDER */}
        <div className="premium-bottom-border"></div>

        <div className="darkbar-inner">
          {/* Logo Area */}
          <Link to="/" className="logo-link">
             <img src={currentLogo} alt="IVG Logo" className="logo-img" />
          </Link>

          {/* MOBILE ACTIONS */}
          <div className="mobile-actions">
            {/* --- ADDED THEME TOGGLE FOR MOBILE --- */}
            <button className="icon-btn theme-toggle-mobile" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {currentUser && (
              <div className="dropdown-container mobile-notif" ref={mobileNotifRef}>
                <button 
                  className="icon-btn" 
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="dot"></span>}
                </button>
                {/* Mobile Notification Dropdown Content */}
                {showNotifDropdown && notificationDropdownContent}
              </div>
            )}

            <button className="hamburger" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* NAV LINKS & USER AREA */}
          <div className={`nav-area ${isOpen ? "open" : ""}`}>
            <div className="links">
              {currentNavLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  end={link.path === "/"} 
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  {link.name}
                  {link.badge > 0 && (
                    <span className="msg-badge">
                      {link.badge > 99 ? "99+" : link.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>

            <div className="right-section">
              {/* --- DESKTOP THEME TOGGLE --- */}
              <button 
                className="icon-btn desktop-theme-toggle" 
                onClick={toggleTheme}
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* AUTH BUTTONS OR USER PROFILE */}
              {!currentUser ? (
                <div className="auth-buttons">
                  <Link to="/auth/seeker" className="login-btn">
                    Log In
                  </Link>
                  <Link to="/auth/employer" className="signup-btn">
                    For Employers
                  </Link>
                </div>
              ) : (
                <div className="user-area">
                  {/* NOTIFICATIONS (DESKTOP) */}
                  <div
                    className="dropdown-container desktop-notif"
                    ref={notifRef}
                  >
                    <button
                      className="icon-btn"
                      onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    >
                      <Bell size={20} />
                      {unreadCount > 0 && <span className="dot"></span>}
                    </button>
                    {/* Desktop Notification Dropdown Content */}
                    {showNotifDropdown && notificationDropdownContent}
                  </div>

                  {/* PROFILE DROPDOWN */}
                  <div className="dropdown-container" ref={dropdownRef}>
                    <button
                      className="nav-profile-btn"
                      onClick={() => setShowDropdown(!showDropdown)}
                    >
                      <div className="nav-avatar">
                        {currentUser?.photoUrl && !imgError ? (
                          <img
                            src={getImageUrl(currentUser.photoUrl)}
                            alt="Profile"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              setImgError(true);
                            }}
                          />
                        ) : (
                          currentUser?.name?.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <span className="user-name">
                        Hi, {currentUser?.name?.split(" ")[0]}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`chevron ${showDropdown ? "flip" : ""}`}
                      />
                    </button>

                    {/* DROPDOWN MENU */}
                    <div className={`dropdown ${showDropdown ? "show" : ""}`}>
                      {currentMenuLinks.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => {
                            setShowDropdown(false);
                            setIsOpen(false);
                          }}
                        >
                          {item.icon} {item.name}
                        </Link>
                      ))}
                      <div className="divider"></div>
                      <button onClick={handleLogout} className="logout-item">
                        <LogOut size={18} /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* SPACER DIV TO PREVENT CONTENT OVERLAP */}
      <div className="nav-spacer"></div>

      {/* MOBILE OVERLAY */}
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}

      <style>{`
      /* IMPORTS */
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

      :root {
         /* These will now be overridden by GlobalThemeManager */
         --bg-dark: #020617;
         --text-white: #ffffff;
         --text-muted: #94a3b8;
         --accent-gold: #fbbf24;
         --gold-glow: rgba(251, 191, 36, 0.4);
         --border-light: rgba(255, 255, 255, 0.1);
      }

      /* GLOBAL FIX: Force Vertical Scrollbar to Prevent Shift */
      html {
        overflow-y: scroll;
        scrollbar-gutter: stable;
      }

      html, body {
        margin: 0; 
        padding: 0;
        overflow-x: hidden; 
        width: 100%;
        position: relative;
      }
      
      * { box-sizing: border-box; }

      /* --- NAVBAR CONTAINER (FIXED) --- */
      .darkbar {
        position: fixed; /* 🔥 Changed to Fixed */
        top: 0; 
        left: 0;
        width: 100%;
        z-index: 5000; 
        height: 78px;
        background: var(--glass); 
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border); 
        font-family: 'Plus Jakarta Sans', sans-serif;
        transition: background 0.3s ease, border-color 0.3s ease;
      }
      
      /* --- SPACER FOR FIXED NAVBAR --- */
      .nav-spacer {
        height: 78px;
        width: 100%;
      }

      /* Premium Bottom Glowing Border */
      .premium-bottom-border {
        position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg, transparent 0%, var(--primary-dim) 30%, var(--primary) 50%, var(--primary-dim) 70%, transparent 100%);
        box-shadow: 0 1px 10px var(--primary-dim);
      }

      .darkbar-inner { 
        max-width: 1280px; margin: auto; height: 100%; 
        display: flex; align-items: center; justify-content: space-between; 
        padding: 0 30px; 
      }

      /* --- LOGO FIXES (CRITICAL) --- */
      .logo-link {
        display: flex;
        align-items: center;
        text-decoration: none;
        border: none !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
        height: auto !important;
        width: auto !important;
        box-shadow: none !important;
        flex-shrink: 0; /* Prevent shrinking */
      }

      .logo-img {
        height: 44px !important; 
        width: auto !important;
        object-fit: contain;
        display: block;
        cursor: pointer;
        max-width: none !important;
      }

      /* --- NAV LINKS FIXES --- */
      .nav-area { display: flex; gap: 40px; align-items: center; }
      .links { display: flex; gap: 8px; align-items: center; }

      .links a {
        text-decoration: none; color: var(--text-sub); /* 🔥 UPDATED */
        font-weight: 600; 
        font-size: 14px;
        padding: 8px 16px; border-radius: 50px; 
        transition: all 0.2s ease; position: relative;
        display: flex; align-items: center;
        border: 1px solid transparent; 
        white-space: nowrap; 
        height: 38px;
      }
      
      .links a:hover { 
        color: var(--text-main); /* 🔥 UPDATED */
        background: var(--bg-input); /* 🔥 UPDATED */
      }
      
      .links a.active {
        color: var(--primary); /* 🔥 UPDATED */
        background: var(--primary-dim); /* 🔥 UPDATED */
        border-color: var(--primary-dim); 
        box-shadow: 0 0 15px var(--primary-dim);
      }

      /* Badges */
      .msg-badge {
        position: absolute; top: -5px; right: -5px; 
        background: var(--danger); color: white;
        font-size: 9px; font-weight: 700; 
        height: 16px; min-width: 16px; padding: 0 4px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 10px; border: 2px solid var(--bg-root);
      }

      /* --- RIGHT SECTION (Theme + Auth) --- */
      .right-section { flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;
            padding: 40px; }

      /* --- BUTTONS --- */
      .auth-buttons { display: flex; gap: 12px; align-items: center; }

      .login-btn {
        background: transparent; color: var(--text-main); border: 1px solid var(--border);
        padding: 9px 20px; border-radius: 50px; text-decoration: none; 
        font-weight: 600; font-size: 14px; transition: 0.3s;
        white-space: nowrap;
      }
      .login-btn:hover { border-color: var(--text-main); background: var(--bg-input); }

      .signup-btn {
        background: var(--primary); /* 🔥 UPDATED */
        color: #fff; padding: 10px 24px; border-radius: 50px; 
        text-decoration: none; font-weight: 600; font-size: 14px; 
        transition: 0.3s; box-shadow: 0 4px 15px var(--primary-dim);
        white-space: nowrap;
      }
      .signup-btn:hover { transform: translateY(-1px); background: var(--primary-hover); }

      /* --- USER AREA --- */
      .user-area { display: flex; align-items: center; gap: 16px; }

      .icon-btn { 
        color: var(--text-sub); background: transparent; border: none; 
        width: 38px; height: 38px; border-radius: 50%; 
        display: flex; align-items: center; justify-content: center; 
        position: relative; transition: 0.3s; cursor: pointer; 
      }
      .icon-btn:hover { background: var(--bg-input); color: var(--primary); }
      
      .dot { 
        position: absolute; top: 8px; right: 8px; 
        width: 8px; height: 8px; background: var(--danger); 
        border-radius: 50%; border: 2px solid var(--bg-root); 
      }

      .nav-profile-btn { 
        background: var(--bg-input); border: 1px solid var(--border); /* 🔥 UPDATED */
        border-radius: 50px; padding: 4px 12px 4px 4px; 
        display: flex; align-items: center; gap: 10px; cursor: pointer; 
        color: var(--text-main); transition: 0.2s; font-family: inherit; 
      }
      .nav-profile-btn:hover { border-color: var(--primary); background: var(--primary-dim); }

      .nav-avatar { 
        width: 32px; height: 32px; border-radius: 50%; 
        background: #4f46e5; color: white; font-weight: 700; 
        font-size: 12px; display: flex; justify-content: center; 
        align-items: center; overflow: hidden; flex-shrink: 0; 
      }
      
      .user-name { font-size: 14px; font-weight: 500; white-space: nowrap; }
      .chevron { color: var(--text-sub); transition: transform 0.2s; }
      .chevron.flip { transform: rotate(180deg); }

      /* --- DROPDOWNS --- */
      .dropdown-container { position: relative; }
      
      .dropdown, .notif-dropdown {
        position: absolute; top: 60px; right: 0;
        background: var(--bg-card); /* 🔥 UPDATED */
        border: 1px solid var(--border);
        backdrop-filter: blur(16px);
        border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); 
        z-index: 9999; display: none;
      }
      .dropdown.show { display: block; width: 220px; padding: 8px; animation: slideUp 0.2s ease-out; }
      
      .dropdown a, .logout-item { 
        display: flex; align-items: center; gap: 12px; 
        color: var(--text-sub); padding: 12px 16px; border-radius: 10px; 
        text-decoration: none; background: transparent; border: none; 
        font-size: 14px; cursor: pointer; transition: 0.2s; 
        width: 100%; text-align: left; font-family: inherit; font-weight: 500;
      }
      .dropdown a:hover { background: var(--bg-input); color: var(--text-main); }
      .dropdown a:hover svg { color: var(--primary); }
      
      .logout-item { color: #f87171; margin-top: 4px; }
      .logout-item:hover { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
      .divider { height: 1px; background: var(--border); margin: 6px 0; }

      /* --- NOTIFICATIONS --- */
      .notif-dropdown { display: block; width: 360px; right: -10px; animation: slideUp 0.2s ease-out; overflow: hidden; }
      .notif-header { padding: 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-input); }
      .notif-header h3 { margin: 0; font-size: 14px; color: var(--text-main); font-weight: 600; }
      
      .notif-list { max-height: 350px; overflow-y: auto; }
      .notif-item { padding: 16px; display: flex; gap: 14px; border-bottom: 1px solid var(--border); cursor: pointer; transition: 0.2s; position: relative; }
      .notif-item:hover { background: var(--bg-input); }
      .notif-item.unread { background: var(--primary-dim); }
      
      .notif-title { color: var(--text-main); font-size: 13px; font-weight: 600; margin: 0 0 4px; }
      .notif-msg { color: var(--text-sub); font-size: 12px; margin: 0; line-height: 1.4; }
      .notif-time { color: var(--text-sub); font-size: 11px; margin-top: 6px; display: block; }
      
      .notif-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--bg-input); }
      .notif-icon.gold { color: var(--primary); background: var(--primary-dim); }
      .notif-icon.green { color: #4ade80; background: rgba(74, 222, 128, 0.1); }
      
      .unread-dot { width: 6px; height: 6px; background: var(--primary); border-radius: 50%; position: absolute; right: 16px; top: 22px; box-shadow: 0 0 5px var(--primary); }
      .badge { background: var(--primary); color: #000; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; }
      
      .empty-notif { padding: 40px; text-align: center; color: var(--text-sub); }
      .empty-icon { margin-bottom: 10px; opacity: 0.5; }

      @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

      /* --- MOBILE ELEMENTS (Hidden by Default) --- */
      .mobile-actions, .hamburger, .mobile-notif { display: none; }
      .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 4000; backdrop-filter: blur(4px); }

      /* --- RESPONSIVE MEDIA QUERIES --- */
      
      @media (max-width: 1024px) {
         .darkbar-inner { padding: 0 20px; }
         .links { gap: 4px; }
         .links a { padding: 8px 12px; font-size: 13px; }
      }

      @media (max-width: 900px) {
        .logo-img { height: 32px !important; }

        /* Mobile Header Layout */
        .hamburger, .mobile-actions { display: flex; align-items: center; gap: 16px; }
        .mobile-notif { color: var(--text-main); position: relative; display: flex; }
        .hamburger { background: none; border: none; color: var(--text-main); cursor: pointer; }
        
        /* Hide Desktop Elements */
        .desktop-notif, .desktop-theme-toggle { display: none; } 
        
        .darkbar { height: 70px; }
        .nav-spacer { height: 70px; }
        
        /* MOBILE DRAWER (Slide In) */
        .nav-area {
          position: fixed; right: 0; top: 0;
          width: 280px; height: 100vh;
          background: var(--bg-root); /* 🔥 UPDATED */
          flex-direction: column; align-items: flex-start; 
          padding: 80px 24px 24px 24px;
          transform: translateX(100%);
          visibility: hidden; 
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0s linear 0.3s;
          box-shadow: -10px 0 40px rgba(0,0,0,0.6);
          border-left: 1px solid var(--border);
          overflow-y: auto;
        }
        .nav-area.open { 
          transform: translateX(0); 
          visibility: visible;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0s linear 0s;
        }
        
        /* Stack Links Vertically */
        .links { flex-direction: column; width: 100%; gap: 10px; align-items: flex-start; }
        .links a {
          width: 100%; font-size: 16px; padding: 12px 0;
          border-radius: 0; background: transparent; 
          border: none; border-bottom: 1px solid var(--border);
          justify-content: space-between; color: var(--text-sub);
          height: auto; 
        }
        .links a:hover { background: transparent; color: var(--primary); padding-left: 5px; }
        .links a.active { 
          background: transparent; color: var(--primary); 
          box-shadow: none; border-color: var(--primary);
        }
        .msg-badge { position: static; border: none; margin-left: auto; transform: none; }

        /* Auth Buttons Mobile */
        .auth-buttons { 
           width: 100%; flex-direction: column; margin-top: 20px; 
        }
        .login-btn, .signup-btn { width: 100%; text-align: center; justify-content: center; }

        /* User Area Mobile */
        .user-area {
          width: 100%; margin-top: 20px; padding-top: 20px;
          border-top: 1px solid var(--border);
          flex-direction: column; align-items: flex-start; gap: 0;
        }
        
        .dropdown-container { width: 100%; }
        
        .nav-profile-btn { 
          width: 100%; justify-content: space-between; 
          background: transparent; border: none; padding: 15px 0; 
        }
        
        /* Mobile Dropdown (Expand inline) */
        .dropdown {
          position: static; width: 100%; background: transparent;
          border: none; box-shadow: none; padding: 0; animation: none;
          display: none; border-radius: 0; backdrop-filter: none;
        }
        .dropdown.show { display: block; }
        .dropdown a { padding: 12px 0; font-size: 15px; color: var(--text-muted); }
        
        .notif-dropdown { position: fixed; top: 70px; left: 0; width: 100%; right: 0; border-radius: 0; max-height: 50vh; }
      }
      `}</style>
    </>
  );
};

export default Navbar;