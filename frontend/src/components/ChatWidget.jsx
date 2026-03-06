import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles, Loader2, ChevronRight } from "lucide-react";

// *** UPDATED: Pointing to the correct Widget Route ***
const API_URL = "http://localhost:5000/api/widget/query";

// *** UPDATED: Renamed 'Pricing' to 'Employer Plans' for clarity ***
const QUICK_TOPICS = [
  "Find Jobs",
  "Post a Job", 
  "Employer Plans", 
  "Contact Support"
];

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! 👋 Welcome to IVGJobs. I'm your AI assistant. Select a topic below or ask me a question.", 
      sender: "bot" 
    }
  ]);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  const processMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMsg = { id: Date.now(), text: messageText, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true); 

    try {
      // *** INTEGRATION UPDATE: Sending 'message' to backend ***
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      // *** INTEGRATION UPDATE: Using 'data.response' (from widget.controller.js) ***
      setMessages((prev) => [
        ...prev, 
        { id: Date.now() + 1, text: data.response, sender: "bot" }
      ]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev, 
        { id: Date.now() + 1, text: "⚠️ Server unavailable. Please try again later.", sender: "bot" }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if(input.trim()) {
        processMessage(input);
        setInput("");
    }
  };

  const handleQuickReply = (topic) => {
    processMessage(topic);
  };

  return (
    <>
      <div className="chat-widget-wrapper">
        <button 
          className={`chat-toggle-btn ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Chat"
        >
          <div className="btn-content">
            {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
          </div>
          {!isOpen && <span className="pulse-ring"></span>}
        </button>
      </div>

      <div className={`chat-window ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="chat-brand">
            <div className="bot-icon-box">
              <Bot size={22} className="bot-icon" />
            </div>
            <div className="header-info">
              <h4>Support AI</h4>
              <span className="status"><span className="dot"></span> Online</span>
            </div>
          </div>
          <button className="header-close" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="chat-body">
          <div className="date-divider"><span>Today</span></div>
          
          {messages.map((msg) => (
            <div key={msg.id} className={`msg-row ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="msg-avatar bot"><Sparkles size={14} /></div>
              )}
              <div className="msg-bubble">{msg.text}</div>
              {msg.sender === 'user' && (
                <div className="msg-avatar user"><User size={14} /></div>
              )}
            </div>
          ))}

          {isTyping && (
             <div className="msg-row bot">
               <div className="msg-avatar bot"><Sparkles size={14}/></div>
               <div className="msg-bubble typing">
                 <span className="dot-anim"></span><span className="dot-anim"></span><span className="dot-anim"></span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="quick-topics">
            <p>Suggested:</p>
            <div className="chips-container">
                {QUICK_TOPICS.map((topic) => (
                    <button 
                        key={topic} 
                        className="chip" 
                        onClick={() => handleQuickReply(topic)}
                        disabled={isTyping}
                    >
                        {topic} <ChevronRight size={12} />
                    </button>
                ))}
            </div>
        </div>

        <form className="chat-footer" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder="Type your question..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="send-btn" disabled={!input.trim() || isTyping}>
            {isTyping ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>

      <style>{`
        .chat-widget-wrapper {
          position: fixed; bottom: 90px; right: 30px; z-index: 9999;
        }

        .chat-toggle-btn {
          width: 60px; height: 60px; border-radius: 50%;
          background: linear-gradient(135deg, #ebb11a 0%, #3b28db 100%);
          color: #fff; border: none; box-shadow: 0 10px 30px rgba(37, 99, 235, 0.4);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          position: relative; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .chat-toggle-btn:not(.active) { animation: float 3s ease-in-out infinite; }
        .chat-toggle-btn:hover { transform: scale(1.1) translateY(-2px); }
        .chat-toggle-btn.active { transform: rotate(90deg) scale(0.9); background: #ef4444; }
        
        .pulse-ring {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 50%;
          border: 2px solid #2563eb; animation: pulse-ring 2s infinite;
        }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }

        /* --- FIXED HEIGHT: 500px for proper look --- */
        .chat-window {
          position: fixed; 
          bottom: 160px; 
          right: 30px; 
          width: 380px; 
          height: 500px; /* Reduced from 600px */
          max-height: 70vh; 
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 24px; box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex; flex-direction: column; overflow: hidden; z-index: 9998;
          transform-origin: bottom right; transform: scale(0.8) translateY(20px);
          opacity: 0; visibility: hidden; transition: all 0.35s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .chat-window.open { transform: scale(1) translateY(0); opacity: 1; visibility: visible; }

        .chat-header {
          padding: 18px 20px; background: linear-gradient(to right, #ffffff, #f8fafc);
          border-bottom: 1px solid rgba(0,0,0,0.06); display: flex; justify-content: space-between; align-items: center;
        }
        .chat-brand { display: flex; align-items: center; gap: 14px; }
        .bot-icon-box {
          width: 40px; height: 40px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          color: #2563eb; border-radius: 12px; display: flex; align-items: center; justify-content: center;
        }
        .header-info h4 { margin: 0; font-size: 16px; font-weight: 700; color: #1e293b; }
        .status { font-size: 12px; color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 5px; }
        .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block; }
        .header-close { background: #f1f5f9; border: none; color: #64748b; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .header-close:hover { background: #e2e8f0; color: #ef4444; }

        .chat-body { flex: 1; padding: 20px; overflow-y: auto; background: #fcfcfc; display: flex; flex-direction: column; gap: 16px; }
        .date-divider { text-align: center; margin: 10px 0; opacity: 0.8; }
        .date-divider span { background: #f1f5f9; padding: 4px 12px; border-radius: 20px; font-size: 11px; color: #94a3b8; font-weight: 600; }
        
        .msg-row { display: flex; gap: 12px; align-items: flex-end; max-width: 85%; }
        .msg-row.bot { align-self: flex-start; }
        .msg-row.user { align-self: flex-end; flex-direction: row-reverse; }
        .msg-avatar { width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
        .msg-avatar.bot { background: #fff; color: #2563eb; border: 1px solid #e2e8f0; }
        .msg-avatar.user { background: #2563eb; color: #fff; }
        .msg-bubble { padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
        .msg-row.bot .msg-bubble { background: #fff; border: 1px solid #f1f5f9; color: #334155; border-bottom-left-radius: 4px; }
        .msg-row.user .msg-bubble { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
        .msg-bubble.typing { padding: 14px 18px; display: flex; gap: 5px; align-items: center; min-height: 44px; }
        .dot-anim { width: 6px; height: 6px; background: #94a3b8; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
        .dot-anim:nth-child(1) { animation-delay: -0.32s; } .dot-anim:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        .quick-topics { padding: 10px 16px; background: #fff; border-top: 1px solid #f1f5f9; }
        .quick-topics p { margin: 0 0 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
        .chips-container { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip {
          background: #eff6ff; border: 1px solid #dbeafe; color: #2563eb;
          padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 4px;
        }
        .chip:hover { background: #2563eb; color: #fff; border-color: #2563eb; transform: translateY(-1px); }
        .chip:disabled { opacity: 0.5; cursor: default; }

        .chat-footer { padding: 12px 16px; background: #fff; display: flex; gap: 10px; align-items: center; }
        .chat-footer input { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 18px; border-radius: 24px; color: #0f172a; font-size: 14px; outline: none; transition: 0.2s; }
        .chat-footer input:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        .send-btn { width: 44px; height: 44px; border-radius: 50%; background: #1e293b; color: #fff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
        .send-btn:hover:not(:disabled) { transform: scale(1.05); background: #2563eb; }
        .send-btn:disabled { opacity: 0.6; cursor: not-allowed; background: #94a3b8; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        @media (max-width: 480px) {
          .chat-window { right: 0; bottom: 0; width: 100%; height: 100%; border-radius: 0; max-height: 100vh; }
          .chat-toggle-btn { bottom: 20px; right: 20px; }
        }
      `}</style>
    </>
  );
};

export default ChatWidget;