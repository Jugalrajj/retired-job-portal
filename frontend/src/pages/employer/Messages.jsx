import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import useAuthStore from "../../context/useAuthStore";
import EmojiPicker from "emoji-picker-react";
import {
  Send,
  MessageSquare,
  User,
  Check,
  CheckCheck,
  Smile,
  Paperclip,
  FileText,
  Download,
  X,
  ArrowLeft,
  Lock,
  Crown,
  ChevronRight,
} from "lucide-react";

// --- DEFAULT LOGO ---
const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/4091/4091968.png";

const Messages = () => {
  const { socket } = useSocket();
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // --- ACCESS USER DATA SAFELY ---
  const currentUser = user?.user || user;

  // --- STATE ---
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  // --- MODAL STATE ---
  const [showSubModal, setShowSubModal] = useState(false);

  // File Preview State
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const scrollRef = useRef();
  const emojiRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- HELPER: Resolve Image URL ---
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("blob:") || path.startsWith("data:")) return path;
    if (path.startsWith("http")) {
      // Force HTTPS for Cloudinary URLs
      return path.replace(/^http:\/\//i, "https://");
    }
    const cleanPath = path.replace(/\\/g, "/");
    return `http://localhost:5000/${cleanPath}`;
  };
  // --- HELPER: Get Profile Image ---
  const getProfileImage = (userData) => {
    if (!userData) return null;
    if (userData.companyId?.logo) return getImageUrl(userData.companyId.logo);
    if (userData.photoUrl) return getImageUrl(userData.photoUrl);
    return null;
  };

  // --- 🔍 FIX: UPDATED SUBSCRIPTION CHECK ---
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role === "employer") {
      // 1. Check if Plan is 'pro' OR 'enterprise'
      const isPaidPlan = ["pro", "enterprise"].includes(currentUser.plan);

      // 2. Optional: Check Expiry (Double safety)
      const expiryDate = currentUser.subscriptionExpiry
        ? new Date(currentUser.subscriptionExpiry)
        : null;
      const isNotExpired = expiryDate ? expiryDate > new Date() : false;

      // Logic: If they have a paid plan, they are UNLOCKED.
      // (We assume backend handles downgrading plan to 'free' if expired)
      if (isPaidPlan) {
        setShowSubModal(false); // Unlocked
      } else {
        setShowSubModal(true); // Locked (Free/Starter)
      }
    } else {
      setShowSubModal(false); // Seekers are always unlocked
    }
  }, [currentUser]);

  // --- FETCH CONVERSATIONS ---
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await api.get("/chats/conversations");
        setConversations(data);
        if (location.state?.conversation) {
          const incomingConv = location.state.conversation;
          const exists = data.find((c) => c._id === incomingConv._id);
          if (!exists) setConversations((prev) => [incomingConv, ...prev]);
          setSelectedConv(incomingConv);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingChats(false);
      }
    };
    fetchConversations();
  }, [location.state]);

  // --- FETCH MESSAGES ---
  useEffect(() => {
    if (!selectedConv) return;
    const fetchMessages = async () => {
      try {
        const { data } = await api.get(`/chats/${selectedConv._id}`);
        setMessages(data);
        setConversations((prev) =>
          prev.map((c) =>
            c._id === selectedConv._id ? { ...c, unreadCount: 0 } : c,
          ),
        );
        setPreviewFile(null);
        setPreviewUrl(null);
        setNewMessage("");
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();
  }, [selectedConv]);

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (newMsg) => {
      if (selectedConv && newMsg.conversationId === selectedConv._id) {
        setMessages((prev) => [...prev, { ...newMsg, isRead: true }]);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c._id === newMsg.conversationId
              ? {
                  ...c,
                  lastMessage: {
                    text:
                      newMsg.text || (newMsg.attachment ? `Sent a file` : ""),
                    sender: newMsg.sender,
                  },
                  unreadCount: (c.unreadCount || 0) + 1,
                }
              : c,
          ),
        );
      }
    };
    const handleMessagesRead = ({ conversationId }) => {
      if (selectedConv?._id === conversationId) {
        setMessages((prev) => prev.map((msg) => ({ ...msg, isRead: true })));
      }
    };
    socket.on("newMessage", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket, selectedConv]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, previewFile]);

  // Click Outside Emoji
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target))
        setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onEmojiClick = (emojiObject) =>
    setNewMessage((prev) => prev + emojiObject.emoji);

  // --- FILE HANDLING ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewFile(file);
      if (file.type.startsWith("image/"))
        setPreviewUrl(URL.createObjectURL(file));
      else setPreviewUrl(null);
    }
    e.target.value = null;
  };

  const clearPreview = () => {
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  // --- SEND MESSAGE ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (showSubModal) return; // Prevent sending if locked
    if ((!newMessage.trim() && !previewFile) || !selectedConv) return;
    setShowEmojiPicker(false);

    const tempId = Date.now().toString();
    const tempMsg = {
      _id: tempId,
      sender: currentUser._id,
      text: newMessage,
      createdAt: new Date().toISOString(),
      conversationId: selectedConv._id,
      isRead: false,
      attachment: previewFile
        ? {
            url: previewUrl,
            fileType: previewFile.type.startsWith("image") ? "image" : "file",
            fileName: previewFile.name,
          }
        : null,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");
    clearPreview();

    const sidebarText = newMessage || (previewFile ? `Sent a file` : "");
    setConversations((prev) =>
      prev.map((c) =>
        c._id === selectedConv._id
          ? {
              ...c,
              lastMessage: { text: sidebarText, sender: currentUser._id },
            }
          : c,
      ),
    );

    try {
      if (previewFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("attachment", previewFile);
        formData.append("text", newMessage);
        formData.append("recipientId", selectedConv.otherUser._id);
        formData.append("conversationId", selectedConv._id);

        const { data } = await api.post("/chats/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMessages((prev) => prev.map((m) => (m._id === tempId ? data : m)));
        socket.emit("sendMessage", {
          ...data,
          recipientId: selectedConv.otherUser._id,
        });
      } else {
        const { data } = await api.post("/chats", {
          recipientId: selectedConv.otherUser._id,
          text: tempMsg.text,
        });
        setMessages((prev) => prev.map((m) => (m._id === tempId ? data : m)));
        socket.emit("sendMessage", {
          ...data,
          recipientId: selectedConv.otherUser._id,
        });
      }
    } catch (err) {
      console.error("Failed to send", err);
    } finally {
      setIsUploading(false);
    }
  };

  const renderMessageContent = (msg) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {msg.attachment &&
        (msg.attachment.fileType === "image" ? (
          <div className="media-wrapper">
            <img
              src={getImageUrl(msg.attachment.url)}
              alt="attachment"
              className="msg-image"
              onClick={() =>
                window.open(getImageUrl(msg.attachment.url), "_blank")
              }
            />
          </div>
        ) : (
          <div
            className="file-attachment"
            onClick={() =>
              window.open(getImageUrl(msg.attachment.url), "_blank")
            }
          >
            <div className="file-icon-box">
              <FileText size={20} color="var(--primary)" />
            </div>
            <div className="file-info">
              <span className="file-name">{msg.attachment.fileName}</span>
              <span className="file-type">{msg.attachment.fileType}</span>
            </div>
            <Download size={16} color="var(--text-sub)" />
          </div>
        ))}
      {msg.text && <span className="msg-text">{msg.text}</span>}
    </div>
  );

  const showSeekerWaitModal =
    currentUser?.role === "seeker" &&
    !isLoadingChats &&
    conversations.length === 0;

  return (
    <div className="dark-chat-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        :root {
          /* --- THEME CONFIG (Handled by GlobalThemeManager, mapped here for clarity) --- */
          /* --bg-root: Background 
             --bg-card: Container/Sidebar Background 
             --bg-input: Inputs / Chat Area Background
             --text-main: Main Text
             --text-sub: Secondary Text
             --border: Borders
             --primary: Accent Color
          */
          
          /* Message Bubbles */
          --msg-own-bg: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          --msg-own-text: #ffffff; /* Always white on gold */
        }

        /* --- GLOBAL WRAPPER --- */
        .dark-chat-wrapper {
          background-color: var(--bg-root); /* 🔥 Theme Var */
          min-height: calc(100vh - 80px);
          display: flex;
          justify-content: center;
          padding: 40px 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
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

        /* --- MAIN CONTAINER --- */
        .designer-container {
          width: 100%;
          max-width: 1280px;
          height: 85vh;
          background: var(--bg-card); /* 🔥 Theme Var */
          border: 1px solid var(--border); /* 🔥 Theme Var */
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
          display: flex;
          overflow: hidden;
          position: relative;
          z-index: 10;
        }

        /* Top Gradient Strip */
        .designer-container::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 6px;
          background: linear-gradient(90deg, #4f46e5 0%, var(--primary) 100%);
          z-index: 20;
        }

        /* --- SUBSCRIPTION BLUR OVERLAY --- */
        .subscription-overlay {
          position: absolute;
          inset: 0;
          background: var(--glass); /* 🔥 Theme Var */
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sub-modal {
          background: var(--bg-card); /* 🔥 Theme Var */
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
          text-align: center;
          max-width: 400px;
          border: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }
        
        .sub-modal::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, transparent, var(--primary), transparent);
        }

        .icon-circle {
          width: 70px; height: 70px;
          background: var(--primary-dim);
          color: var(--primary);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          border: 1px solid var(--primary);
        }

        .sub-btn {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%;
          margin-top: 20px;
          transition: transform 0.2s;
          box-shadow: 0 4px 15px var(--primary-dim);
        }
        .sub-btn:hover { transform: scale(1.02); }

        /* --- SIDEBAR --- */
        .sidebar {
          width: 320px;
          background: var(--bg-card); /* 🔥 Theme Var */
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          z-index: 10;
        }

        .sidebar-header {
          padding: 24px;
          border-bottom: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
        }
        .sidebar-header h2 { margin: 0; font-size: 20px; font-weight: 700; color: var(--text-main); }

        .conv-list { flex: 1; overflow-y: auto; }
        
        .conv-item {
          display: flex; gap: 12px; padding: 16px 24px;
          cursor: pointer; transition: 0.2s;
          border-bottom: 1px solid transparent;
        }
        .conv-item:hover { background: var(--bg-input); }
        .conv-item.active { background: var(--primary-dim); border-left: 4px solid var(--primary); }

        .avatar {
          width: 48px; height: 48px; border-radius: 50%;
          background: var(--bg-input); overflow: hidden; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border);
        }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }

        .conv-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
        .conv-name { font-weight: 600; font-size: 15px; color: var(--text-main); margin-bottom: 4px; }
        .conv-preview { 
          font-size: 13px; color: var(--text-sub); 
          display: flex; justify-content: space-between; align-items: center;
        }
        .badge {
          background: var(--primary); color: #000; font-size: 10px; 
          font-weight: 700; padding: 2px 6px; border-radius: 10px; margin-left: 8px;
        }

        /* --- CHAT AREA --- */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--bg-input); /* 🔥 Distinct Chat BG */
          position: relative;
        }

        .chat-header {
          background: var(--bg-card);
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 15px;
        }
        .mobile-back { display: none; border: none; background: none; color: var(--text-sub); cursor: pointer; }
        
        .chat-user-info h3 { font-size: 16px; font-weight: 700; margin: 0; color: var(--text-main); }
        .chat-user-info span { font-size: 12px; color: var(--primary); font-weight: 600; }

        .messages-list {
          flex: 1;
          padding: 25px;
          overflow-y: auto;
          display: flex; flex-direction: column; gap: 12px;
        }

        .msg-row { display: flex; gap: 10px; max-width: 70%; }
        .msg-row.own { align-self: flex-end; flex-direction: row-reverse; }
        .msg-row.their { align-self: flex-start; }

        .msg-avatar { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; flex-shrink: 0; margin-top: auto; border: 1px solid var(--border); }
        .msg-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .message-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          position: relative;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          font-size: 14px;
          line-height: 1.5;
          display: flex; flex-direction: column;
        }
        .message-bubble.own { background: var(--msg-own-bg); color: var(--msg-own-text); border-bottom-right-radius: 4px; }
        
        .message-bubble.their { 
          background: var(--bg-card); /* 🔥 Theme Var */
          color: var(--text-main); /* 🔥 Theme Var */
          border-bottom-left-radius: 4px; 
          border: 1px solid var(--border); 
        }

        .msg-image { max-width: 250px; border-radius: 10px; margin-bottom: 5px; cursor: pointer; border: 1px solid var(--border); }
        
        .file-attachment {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.2); 
          padding: 8px 12px; border-radius: 10px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .message-bubble.their .file-attachment { background: var(--bg-input); border-color: var(--border); }
        
        .file-icon-box { background: var(--bg-card); padding: 6px; border-radius: 8px; display: flex; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .file-info { display: flex; flexDirection: column; overflow: hidden; flex: 1; }
        .file-name { font-weight: 600; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
        .file-type { font-size: 10px; opacity: 0.8; text-transform: uppercase; }

        .msg-footer {
          display: flex; align-items: center; justify-content: flex-end; gap: 4px;
          margin-top: 4px; font-size: 10px; opacity: 0.7;
        }

        /* --- INPUT AREA --- */
        .input-wrapper { 
          padding: 20px; 
          background: var(--bg-card); /* 🔥 Theme Var */
          border-top: 1px solid var(--border); 
          position: relative; 
        }

        .preview-area {
          position: absolute; bottom: 80px; left: 20px; right: 20px;
          background: var(--bg-card); padding: 12px; border-radius: 12px;
          box-shadow: 0 -5px 20px rgba(0,0,0,0.1); border: 1px solid var(--border);
          display: flex; align-items: center; gap: 15px; color: var(--text-main);
        }

        .input-container {
          display: flex; align-items: center; gap: 12px;
          background: var(--bg-input); /* 🔥 Theme Var */
          padding: 8px 15px;
          border-radius: 50px; border: 1px solid transparent;
          transition: border 0.2s, background 0.2s;
        }
        .input-container:focus-within { border-color: var(--primary); background: var(--bg-card); }

        .msg-input { flex: 1; background: transparent; border: none; outline: none; font-size: 15px; padding: 8px 0; color: var(--text-main); }

        .action-btn { background: none; border: none; cursor: pointer; color: var(--text-sub); padding: 6px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .action-btn:hover { background: var(--bg-input); color: var(--text-main); }
        
        .send-btn { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 10px var(--primary-dim); }
        .send-btn:hover { transform: scale(1.05); }
        
        .emoji-popover { position: absolute; bottom: 85px; left: 20px; z-index: 50; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border-radius: 12px; }

        .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-sub); }

        @media (max-width: 900px) {
          .dark-chat-wrapper { padding: 0; min-height: calc(100vh - 70px); }
          .designer-container { height: calc(100vh - 70px); border-radius: 0; border: none; }
          .sidebar.hidden-on-mobile { display: none; }
          .sidebar { width: 100%; display: flex; }
          .chat-main.hidden-mobile { display: none; }
          .chat-main.active-mobile { display: flex; width: 100%; }
          .mobile-back { display: block; margin-right: 10px; }
          .msg-row { max-width: 85%; }
        }
      `}</style>

      {/* BACKGROUND ELEMENTS */}
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      {/* --- DESIGNER CONTAINER (Inner) --- */}
      <div className="designer-container">
        {/* 🛑 SUBSCRIPTION MODAL (BLOCKING) 🛑 */}
        {showSubModal && (
          <div className="subscription-overlay">
            <div className="sub-modal">
              <div className="icon-circle">
                <Crown size={32} strokeWidth={2} />
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--text-main)",
                  marginBottom: 10,
                }}
              >
                Premium Feature
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--text-sub)",
                  lineHeight: 1.6,
                }}
              >
                Direct messaging with candidates is exclusively available for
                premium employers. Upgrade your plan to unlock this feature.
              </p>
              <button className="sub-btn" onClick={() => navigate("/billing")}>
                Unlock Messaging <ChevronRight size={18} />
              </button>
              <div
                style={{
                  marginTop: 15,
                  fontSize: 13,
                  color: "var(--text-sub)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                <Lock size={12} /> Secure Payment
              </div>
            </div>
          </div>
        )}

        {/* 🛑 SEEKER WAIT MODAL (BLOCKING) 🛑 */}
        {showSeekerWaitModal && (
          <div className="subscription-overlay">
            <div className="sub-modal">
              <div className="icon-circle">
                <MessageSquare size={32} strokeWidth={2} />
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--text-main)",
                  marginBottom: 10,
                }}
              >
                Your Inbox is Empty
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--text-sub)",
                  lineHeight: 1.6,
                }}
              >
                Employers will reach out to you directly when they are
                interested in your profile. Once an employer initiates a
                conversation, you will be able to view and reply to their
                messages here.
              </p>
              <button
                className="sub-btn"
                onClick={() => navigate("/find-jobs")}
              >
                Browse Jobs <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* --- SIDEBAR --- */}
        <div className={`sidebar ${selectedConv ? "hidden-on-mobile" : ""}`}>
          <div className="sidebar-header">
            <h2>Messages</h2>
          </div>
          <div className="conv-list">
            {conversations.map((c) => {
              const sidebarPic = getProfileImage(c.otherUser);
              return (
                <div
                  key={c._id}
                  className={`conv-item ${selectedConv?._id === c._id ? "active" : ""}`}
                  onClick={() => !showSubModal && setSelectedConv(c)}
                >
                  <div className="avatar">
                    {sidebarPic ? (
                      <img src={sidebarPic} alt="" />
                    ) : (
                      <User size={24} color="var(--text-sub)" />
                    )}
                  </div>
                  <div className="conv-info">
                    <div className="conv-name">
                      {c.otherUser?.name || "Unknown User"}
                    </div>
                    <div className="conv-preview">
                      <span>{c.lastMessage?.text || "Start conversation"}</span>
                      {c.unreadCount > 0 && (
                        <span className="badge">{c.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- CHAT MAIN --- */}
        <div
          className={`chat-main ${selectedConv ? "active-mobile" : "hidden-mobile"}`}
        >
          {selectedConv ? (
            <>
              <div className="chat-header">
                <button
                  className="mobile-back"
                  onClick={() => setSelectedConv(null)}
                >
                  <ArrowLeft size={24} />
                </button>
                <div
                  className="avatar"
                  style={{ width: 42, height: 42, borderRadius: "50%" }}
                >
                  {getProfileImage(selectedConv.otherUser) ? (
                    <img src={getProfileImage(selectedConv.otherUser)} alt="" />
                  ) : (
                    <User size={20} color="var(--text-sub)" />
                  )}
                </div>
                <div className="chat-user-info">
                  <h3>{selectedConv.otherUser?.name}</h3>
                  <span>{selectedConv.otherUser?.role}</span>
                </div>
              </div>

              <div className="messages-list">
                {messages.map((msg, idx) => {
                  const senderId =
                    typeof msg.sender === "object"
                      ? msg.sender._id
                      : msg.sender;
                  const isOwn = senderId === currentUser._id;

                  const profilePic = isOwn
                    ? getProfileImage(currentUser)
                    : getProfileImage(selectedConv.otherUser);

                  return (
                    <div
                      key={idx}
                      ref={idx === messages.length - 1 ? scrollRef : null}
                      className={`msg-row ${isOwn ? "own" : "their"}`}
                    >
                      <div className="msg-avatar">
                        {profilePic ? (
                          <img src={profilePic} alt="" />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background: "var(--bg-input)",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <User size={16} color="var(--text-sub)" />
                          </div>
                        )}
                      </div>

                      <div
                        className={`message-bubble ${isOwn ? "own" : "their"}`}
                      >
                        {renderMessageContent(msg)}
                        <div className="msg-footer">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isOwn &&
                            (msg.isRead ? (
                              <CheckCheck size={14} />
                            ) : (
                              <Check size={14} />
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isUploading && (
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: 12,
                      color: "var(--text-sub)",
                    }}
                  >
                    Sending file...
                  </div>
                )}
              </div>

              <div className="input-wrapper">
                {previewFile && (
                  <div className="preview-area">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 8,
                          objectFit: "cover",
                        }}
                        alt=""
                      />
                    ) : (
                      <FileText size={32} color="var(--primary)" />
                    )}
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--text-main)",
                        }}
                      >
                        {previewFile.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-sub)" }}>
                        Ready to send
                      </div>
                    </div>
                    <button onClick={clearPreview} className="action-btn">
                      <X size={20} />
                    </button>
                  </div>
                )}

                {showEmojiPicker && (
                  <div className="emoji-popover" ref={emojiRef}>
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      width={300}
                      height={400}
                    />
                  </div>
                )}

                <div className="input-container">
                  <button
                    className="action-btn"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile size={22} />
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                  />
                  <button
                    className="action-btn"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <Paperclip size={22} />
                  </button>

                  <input
                    type="text"
                    className="msg-input"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage(e)}
                    disabled={showSubModal}
                  />

                  <button
                    className="send-btn"
                    onClick={handleSendMessage}
                    disabled={showSubModal}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div
                style={{
                  background: "var(--primary-dim)",
                  padding: 25,
                  borderRadius: "50%",
                  marginBottom: 20,
                }}
              >
                <MessageSquare size={50} color="var(--primary)" />
              </div>
              <h2 style={{ color: "var(--text-main)" }}>Your Messages</h2>
              <p>Select a conversation to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
