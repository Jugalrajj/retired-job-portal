import React, { useState } from 'react';
import { CheckCircle2, Sparkles, Zap, Shield, FileText, X, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../../context/useAuthStore'; // Ensure this path matches your project structure

// --- RAZORPAY LOADER ---
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// --- SIMPLE MODAL COMPONENT ---
const PaymentModal = ({ isOpen, onClose, type, title, message }) => {
  if (!isOpen) return null;

  const isSuccess = type === "success";

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className={`icon-box ${isSuccess ? "success" : "error"}`}>
            {isSuccess ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
          </div>
          <h3>{title}</h3>
          <p>{message}</p>
        </div>

        <div className="modal-footer">
          <button
            className={`action-btn ${isSuccess ? "success" : "error"}`}
            onClick={onClose}
          >
            {isSuccess ? "Continue" : "Close"}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(5px);
        }
        .modal-content {
          background: var(--bg-card, #ffffff); color: var(--text-main, #000000);
          width: 90%; max-width: 400px;
          border-radius: 16px; overflow: hidden;
          border: 1px solid var(--border, #e2e8f0);
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .modal-header {
          display: flex; justify-content: flex-end;
          padding: 10px;
        }
        .close-btn {
          background: none; border: none; color: var(--text-sub, #64748b); cursor: pointer;
        }
        .close-btn:hover { color: var(--text-main, #000000); }
        
        .modal-body {
          padding: 0 20px 20px; text-align: center;
        }
        .icon-box {
          display: inline-flex; margin-bottom: 15px; border: none; box-shadow: none; background: transparent; padding: 0;
        }
        .icon-box.success { color: var(--success, #10b981); }
        .icon-box.error { color: var(--danger, #ef4444); }
        
        .modal-body h3 { margin: 0 0 10px; font-size: 20px; font-weight: 700; }
        .modal-body p { margin: 0; color: var(--text-sub, #64748b); font-size: 14px; line-height: 1.5; }
        
        .modal-footer {
          padding: 15px 20px; border-top: 1px solid var(--border, #e2e8f0);
        }
        .action-btn {
          width: 100%; padding: 12px; border: none; border-radius: 8px;
          font-weight: 600; cursor: pointer; color: #fff;
        }
        .action-btn.success { background: var(--success, #10b981); }
        .action-btn.success:hover { background: #059669; }
        .action-btn.error { background: var(--danger, #ef4444); }
        .action-btn.error:hover { background: #dc2626; }
      `}</style>
    </div>
  );
};

const SeekerBilling = () => {
  const navigate = useNavigate();
  
  // --- AUTH & PAYMENT STATE ---
  const { user, refreshUser } = useAuthStore();
  const token = user?.token;
  const userId = user?.user?._id;
  
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false, type: "success", title: "", message: "",
  });

  const showModal = (type, title, message) => {
    setModalState({ isOpen: true, type, title, message });
  };

  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
    if (modalState.type === "success") {
      navigate('/seeker-details'); // Or refresh page: window.location.reload();
    }
  };

  // --- RAZORPAY HANDLER ---
  const handleUpgrade = async () => {
    if (!userId || !token) {
      showModal("error", "Login Required", "Please login to make a purchase.");
      return;
    }

    setLoadingConfig(true);
    const itemName = "Pro Seeker";
    const amountValue = 499;
    const type = "subscription";
    const validityDays = 30; 
    const activeJobDays = 30; 
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        showModal("error", "SDK Error", "Razorpay SDK failed to load.");
        setLoadingConfig(false); 
        return;
      }

      // Create Order on Backend
      const { data } = await axios.post(
        "http://localhost:5000/api/payment/create-order",
        { 
          amount: amountValue, 
          planType: itemName, 
          type: type,
          couponCode: null 
        }, 
        config,
      );

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        name: "IVGJobs",
        description: itemName,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            // Verify Payment on Backend
            const verifyRes = await axios.post(
              "http://localhost:5000/api/payment/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: userId,
                planName: itemName,
                amount: data.finalAmount || amountValue,
                type: type,
                validity: validityDays,
                jobActiveDays: activeJobDays,
                couponCode: null 
              },
              config,
            );

            if (verifyRes.data.success) {
              if (refreshUser) await refreshUser();
              showModal("success", "Payment Successful!", `Your upgrade to ${itemName} is confirmed.`);
            } else {
              showModal("error", "Verification Failed", "Payment verification failed.");
            }
          } catch (error) {
            showModal("error", "Server Error", "An error occurred during verification.");
          } finally {
            setLoadingConfig(false);
          }
        },
        theme: { color: "#f59e0b" }, // Amber/Gold matching your theme
        modal: { ondismiss: () => setLoadingConfig(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 403) {
        showModal("error", "Access Denied", error.response.data.message);
      } else {
        showModal("error", "Payment Failed", "Could not initiate payment.");
      }
      setLoadingConfig(false);
    }
  };

  return (
    <div className="billing-page-wrapper">
      <PaymentModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
      />

      <div className="billing-container">
        <div className="billing-header fade-in">
          <div className="badge-pill">Pricing Plans</div>
          <h1 className="billing-title">Upgrade Your Job Search</h1>
          <p className="billing-subtitle">
            Choose the plan that fits your career goals. Stand out with premium AI tools and exclusive features.
          </p>
        </div>
 
        <div className="billing-grid">
          {/* FREE PLAN CARD */}
          <div className="billing-card fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="card-header">
              <h3>Basic</h3>
              <p className="plan-desc">Essential tools to get you started on your job hunt.</p>
              <div className="price">
                <span className="currency">₹</span>0<span className="period">/mo</span>
              </div>
            </div>
            
            <div className="card-features">
              <div className="feature-item">
                <CheckCircle2 size={16} className="text-success" />
                <span>Create basic profile & apply to jobs</span>
              </div>
              <div className="feature-item">
                <CheckCircle2 size={16} className="text-success" />
                <span>Standard resume formatting options</span>
              </div>
              <div className="feature-item highlight">
                <div className="icon-box">
                  <FileText size={16} className="text-primary" />
                </div>
                <span><strong>2 Free</strong> AI Resume Generations</span>
              </div>
              <div className="feature-item disabled">
                <XIcon />
                <span>No priority applications</span>
              </div>
              <div className="feature-item disabled">
                <XIcon />
                <span>Limited AI writing capabilities</span>
              </div>
            </div>

            <button className="billing-btn btn-secondary" disabled>
              Current Plan
            </button>
          </div>

          {/* PRO PLAN CARD */}
          <div className="billing-card pro-card fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="pro-badge">
              <Sparkles size={12} /> RECOMMENDED
            </div>
            <div className="card-header">
              <h3>Pro Seeker</h3>
              <p className="plan-desc">Maximize your chances with unlimited AI tools and priority features.</p>
              <div className="price">
                <span className="currency">₹</span>499<span className="period">/mo</span>
              </div>
            </div>
            
            <div className="card-features">
              <div className="feature-item">
                <CheckCircle2 size={16} className="text-success" />
                <span>Everything in Basic</span>
              </div>
              <div className="feature-item highlight pro-highlight"> 
                <div className="icon-box pro-icon-box">
                  <Zap size={16} className="text-primary-light" color="#fff" /> 
                </div>
                <span><strong>Unlimited</strong> AI Resume Generations</span>
              </div>
              <div className="feature-item">
                <Shield size={16} className="text-success" />
                <span>Unlimited AI-powered section rewriting</span>
              </div>
              <div className="feature-item">
                <CheckCircle2 size={16} className="text-success" />
                <span>Priority application routing to employers</span>
              </div>
              <div className="feature-item">
                <CheckCircle2 size={16} className="text-success" />
                <span>Advanced analytics on your applications</span>
              </div>
            </div>

            <button 
              className="billing-btn btn-primary flex justify-center items-center" 
              onClick={handleUpgrade}
              disabled={loadingConfig}
            >
              {loadingConfig ? <Loader2 className="spin" size={20} /> : "Upgrade to Pro"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* Page Wrapper */
        .billing-page-wrapper {
          min-height: 100vh;
          background: var(--bg-root);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 0;
        }

        .billing-container {
          width: 100%;
          max-width: 900px; /* Reduced width for smaller UI */
          margin: 0 auto;
          padding: 0 24px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--text-main);
        }

        /* Header Section */
        .billing-header {
          text-align: center;
          margin-bottom: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .badge-pill {
          background: transparent;
          color: var(--primary);
          border: 1px solid var(--primary);
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .billing-title {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: var(--text-main);
          letter-spacing: -0.5px;
        }

        .billing-subtitle {
          font-size: 15px;
          color: var(--text-sub);
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.5;
        }

        /* Grid Layout (Compact & Centered) */
        .billing-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 24px;
        }

        /* Base Card Styling */
        .billing-card {
          flex: 1;
          min-width: 300px;
          max-width: 360px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
          position: relative;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .billing-card:hover {
          transform: translateY(-4px);
        }

        /* Pro Card Styling */
        .pro-card {
          border: 2px solid var(--primary);
          box-shadow: 0 8px 24px var(--primary-dim);
        }

        .pro-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--primary);
          color: #fff;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          letter-spacing: 0.5px;
        }

        /* Card Header */
        .card-header {
          margin-bottom: 24px;
          text-align: left;
        }

        .card-header h3 {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: var(--text-main);
        }

        .plan-desc {
          font-size: 13px;
          color: var(--text-sub);
          line-height: 1.5;
          margin: 0 0 16px 0;
          min-height: 40px; /* Aligns descriptions */
        }

        .price {
          font-size: 36px;
          font-weight: 800;
          color: var(--text-main);
          display: flex;
          align-items: flex-end;
          justify-content: flex-start;
          line-height: 1;
        }

        .currency {
          font-size: 18px;
          margin-right: 2px;
          margin-bottom: 4px;
          color: var(--text-sub);
          font-weight: 600;
        }

        .period {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-muted);
          margin-left: 4px;
          margin-bottom: 4px;
        }

        /* Features List */
        .card-features {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 32px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start; /* Changed from center for long text */
          gap: 10px;
          font-size: 13px;
          color: var(--text-main);
          line-height: 1.4;
          font-weight: 500;
        }

        .feature-item.highlight {
          background: var(--bg-input);
          padding: 8px 12px;
          border-radius: 8px;
          margin: 0 -12px;
          border: 1px solid var(--border);
          align-items: center;
        }

        .feature-item.pro-highlight {
          background: var(--primary-dim);
          border-color: transparent;
        }

        .icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pro-icon-box {
          background: var(--primary);
          padding: 4px;
          border-radius: 6px;
        }

        .feature-item.disabled {
          color: var(--text-muted);
          font-weight: 400;
        }

        .text-success { color: var(--success); flex-shrink: 0; margin-top: 1px; }
        .text-primary { color: var(--primary); }
        .text-primary-light { color: #fff; } /* Used in pro highlight */

        /* Buttons */
        .billing-btn {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          margin-top: auto;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .btn-primary {
          background: var(--primary);
          color: #fff;
        }

        .btn-primary:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--bg-input);
          color: var(--text-sub);
          border: 1px solid var(--border);
          cursor: not-allowed;
        }

        /* Animations & Utilities */
        .fade-in { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
};

// Helper for disabled items
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, flexShrink: 0, marginTop: '1px' }}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default SeekerBilling;