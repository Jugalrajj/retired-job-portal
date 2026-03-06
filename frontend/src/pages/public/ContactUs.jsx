import { useState } from "react";
import api from "../../services/api"; 
import { MapPin, Phone, Mail, Send, Linkedin, Twitter, Facebook, CheckCircle, X } from "lucide-react";

const ContactUs = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [showModal, setShowModal] = useState(false); // 🔥 Modal State

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      const res = await api.post("/contact", form);
      if (res.data.success) {
        // Show Modal instead of just text
        setShowModal(true);
        setForm({ name: "", email: "", message: "" });
      }
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.message || "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark-contact-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

        /* --- PAGE WRAPPER --- */
        .dark-contact-wrapper {
          min-height: 100vh;
          background-color: var(--bg-root);
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px 20px;
          color: var(--text-main);
          transition: background-color 0.3s ease;
        }

        .bg-blob { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.15; z-index: 0; pointer-events: none; }
        .b1 { top: -10%; left: -10%; width: 600px; height: 600px; background: #4f46e5; }
        .b2 { bottom: -10%; right: -10%; width: 500px; height: 500px; background: var(--primary); }

        .designer-container {
          width: 100%; max-width: 1100px;
          background: var(--bg-card);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
          position: relative; z-index: 5;
          display: flex; overflow: hidden;
        }

        .designer-container::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #4f46e5 0%, var(--primary) 100%); z-index: 10;
        }

        /* LEFT SIDE */
        .info-side {
          flex: 0.4; background: var(--bg-input); padding: 60px 40px;
          display: flex; flex-direction: column; justify-content: center;
          border-right: 1px solid var(--border); position: relative;
        }
        
        .info-heading {
          font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; margin-bottom: 20px;
          background: linear-gradient(135deg, var(--text-main) 0%, var(--text-sub) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .info-text { color: var(--text-sub); line-height: 1.6; margin-bottom: 40px; font-size: 15px; }
        .contact-list { display: flex; flex-direction: column; gap: 20px; }
        .contact-item { display: flex; align-items: center; gap: 16px; font-size: 15px; color: var(--text-main); }
        .icon-circle {
          width: 40px; height: 40px; border-radius: 12px; background: var(--primary-dim); color: var(--primary);
          display: flex; align-items: center; justify-content: center; border: 1px solid var(--primary); transition: 0.3s;
        }
        .contact-item:hover .icon-circle { background: var(--primary); color: #000; box-shadow: 0 0 15px var(--primary-dim); }
        
        .social-box { display: flex; gap: 15px; margin-top: 40px; }
        .social-btn {
          width: 44px; height: 44px; border-radius: 50%; background: var(--bg-card); color: var(--text-sub);
          display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; border: 1px solid var(--border);
        }
        .social-btn:hover { background: var(--primary); color: #000; border-color: var(--primary); transform: translateY(-3px); }

        /* RIGHT SIDE */
        .form-side { flex: 0.6; padding: 60px 50px; background: transparent; }
        .form-heading { font-size: 28px; color: var(--text-main); margin-bottom: 30px; font-weight: 700; }
        .form-group { margin-bottom: 24px; }
        .label { display: block; margin-bottom: 8px; font-weight: 600; color: var(--primary); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .input, .textarea {
          width: 100%; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--border);
          background: var(--bg-input); color: var(--text-main); font-size: 15px; transition: 0.3s; outline: none; box-sizing: border-box;
        }
        .input:focus, .textarea:focus { border-color: var(--primary); background: var(--bg-card); box-shadow: 0 0 0 4px var(--primary-dim); }
        .textarea { min-height: 140px; resize: vertical; }

        .btn-submit {
          width: 100%; padding: 16px; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: #fff; border: none; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 16px;
          transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 4px 15px var(--primary-dim);
        }
        .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 25px var(--primary-dim); }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        .status-msg.error { margin-top: 20px; padding: 12px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 14px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }

        /* --- MODAL STYLES --- */
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
          animation: fadeIn 0.3s ease;
        }
        .success-modal {
          background: var(--bg-card); border: 1px solid var(--border);
          width: 90%; max-width: 400px; padding: 40px; border-radius: 24px;
          text-align: center; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: slideUp 0.4s ease;
        }
        .close-btn {
          position: absolute; top: 15px; right: 15px; background: transparent; border: none;
          color: var(--text-sub); cursor: pointer; padding: 5px; transition: 0.2s;
        }
        .close-btn:hover { color: var(--text-main); transform: rotate(90deg); }
        
        .success-icon {
          width: 80px; height: 80px; background: rgba(16, 185, 129, 0.1);
          color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px; animation: bounce 0.6s ease;
        }
        .modal-title { font-size: 24px; font-weight: 700; color: var(--text-main); margin-bottom: 10px; }
        .modal-desc { color: var(--text-sub); font-size: 15px; line-height: 1.5; margin-bottom: 30px; }
        .modal-btn {
          background: var(--text-main); color: var(--bg-root); padding: 12px 30px;
          border-radius: 12px; font-weight: 600; border: none; cursor: pointer; transition: 0.2s;
        }
        .modal-btn:hover { transform: scale(1.05); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }

        @media (max-width: 900px) {
          .designer-container { flex-direction: column; height: auto; border-radius: 0; border: none; }
          .dark-contact-wrapper { padding: 0; }
          .info-side { padding: 40px 20px; border-right: none; border-bottom: 1px solid var(--border); flex: auto; }
          .form-side { padding: 40px 20px; flex: auto; }
        }
      `}</style>

      {/* BACKGROUND ELEMENTS */}
      <div className="bg-blob b1"></div>
      <div className="bg-blob b2"></div>

      <div className="designer-container">
        
        {/* Left Side: Contact Info */}
        <div className="info-side">
          <h2 className="info-heading">Get in Touch</h2>
          <p className="info-text">
            Have questions about certifications or job postings? Our support team is here to help retirees and employers alike.
          </p>
          
          <div className="contact-list">
            <div className="contact-item">
              <div className="icon-circle"><MapPin size={20}/></div>
              <span>U-5, Krishna Apartment,<br/>  C-4,Hathi Babu Marg, Bani Park, Jaipur – 302016</span>
            </div>
            <div className="contact-item">
              <div className="icon-circle"><Phone size={20}/></div>
              <span>+91-9027307508</span>
            </div>
            <div className="contact-item">
              <div className="icon-circle"><Mail size={20}/></div>
              <span>support@jobportal.com</span>
            </div>
          </div>
          
          <div className="social-box">
            <a href="#" className="social-btn"><Linkedin size={20}/></a>
            <a href="#" className="social-btn"><Twitter size={20}/></a>
            <a href="#" className="social-btn"><Facebook size={20}/></a>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="form-side">
          <h2 className="form-heading">Send a Message</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Full Name</label>
              <input
                className="input"
                placeholder="Your Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="label">Email Address</label>
              <input
                className="input"
                placeholder="email@example.com"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="label">Message</label>
              <textarea
                className="textarea"
                placeholder="How can we help you?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>
            
            <button className="btn-submit" type="submit" disabled={loading}>
              {loading ? "Sending..." : <>Send Message <Send size={18}/></>}
            </button>
            
            {status.type === 'error' && (
              <div className="status-msg error">
                {status.msg}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* 🔥 SUCCESS MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowModal(false)}>
              <X size={24} />
            </button>
            <div className="success-icon">
              <CheckCircle size={40} strokeWidth={3} />
            </div>
            <h3 className="modal-title">Message Sent!</h3>
            <p className="modal-desc">
              Thank you for reaching out. Our team has received your message and will get back to you shortly.
            </p>
            <button className="modal-btn" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactUs;