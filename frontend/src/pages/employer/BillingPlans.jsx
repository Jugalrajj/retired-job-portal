import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Check,
  X,
  Crown,
  ShieldCheck,
  Coins,
  AlertCircle,
  CheckCircle,
  Briefcase,
  Calendar,
  Clock,
  Ticket,
  Loader2,
} from "lucide-react";
import useAuthStore from "../../context/useAuthStore";
import toast from "react-hot-toast";

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
            {isSuccess ? <CheckCircle size={40} /> : <AlertCircle size={40} />}
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
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        .modal-content {
          background: var(--bg-card); color: var(--text-main);
          width: 90%; max-width: 400px;
          border-radius: 16px; overflow: hidden;
          border: 1px solid var(--border);
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        .modal-header {
          display: flex; justify-content: flex-end;
          padding: 10px;
        }
        .close-btn {
          background: none; border: none; color: var(--text-sub); cursor: pointer;
        }
        .close-btn:hover { color: var(--text-main); }
        
        .modal-body {
          padding: 0 20px 20px; text-align: center;
        }
        .icon-box {
          display: inline-flex; margin-bottom: 15px;
        }
        .icon-box.success { color: var(--success); }
        .icon-box.error { color: var(--danger); }
        
        .modal-body h3 { margin: 0 0 10px; font-size: 20px; font-weight: 700; }
        .modal-body p { margin: 0; color: var(--text-sub); font-size: 14px; line-height: 1.5; }
        
        .modal-footer {
          padding: 15px 20px; border-top: 1px solid var(--border);
        }
        .action-btn {
          width: 100%; padding: 12px; border: none; border-radius: 8px;
          font-weight: 600; cursor: pointer; color: #fff;
        }
        .action-btn.success { background: var(--success); }
        .action-btn.success:hover { background: #059669; }
        .action-btn.error { background: var(--danger); }
        .action-btn.error:hover { background: #dc2626; }
      `}</style>
    </div>
  );
};

const BillingPlans = () => {
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [activeTab, setActiveTab] = useState("plans");
  const [currentCredits, setCurrentCredits] = useState(0);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [expiryDate, setExpiryDate] = useState(null);

  // --- COUPON STATE ---
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount, finalAmount, itemId }
  const [couponLoading, setCouponLoading] = useState(false);
  
  // 🔥 FIX: Error state is now an object tracking specific Item ID and Message
  const [couponError, setCouponError] = useState(null); // { itemId: "xxx", message: "xxx" }

  const [plansConfig, setPlansConfig] = useState({
    subscriptions: { free: null, pro: null },
    packs: []
  });

  const [modalState, setModalState] = useState({
    isOpen: false, type: "success", title: "", message: "",
  });

  const { user, refreshUser } = useAuthStore();
  const token = user?.token;
  const userId = user?.user?._id;

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch User Status
        if (token) {
          const userRes = await axios.get("http://localhost:5000/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (userRes.data && userRes.data.user) {
            const u = userRes.data.user;
            setCurrentPlan(u.plan || "free");
            setExpiryDate(u.subscriptionExpiry);
            setCurrentCredits(u.credits || 0);
          }
        }

        // 2. Fetch Pricing Config
        const configRes = await axios.get("http://localhost:5000/api/config/credits");
        if (configRes.data && configRes.data.subscriptions) {
          setPlansConfig(configRes.data);
        }

      } catch (error) {
        console.error("Error fetching billing data", error);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchData();
  }, [token]);

  const getDaysLeft = () => {
    if (!expiryDate) return 0;
    const diff = new Date(expiryDate) - new Date();
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  };

  const isProActive = currentPlan === "pro" && getDaysLeft() > 0;
  const isFreeActive = currentPlan === "free" || currentPlan === "starter" || !isProActive;

  const showModal = (type, title, message) => {
    setModalState({ isOpen: true, type, title, message });
  };
  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
    if (modalState.type === "success") window.location.reload();
  };

  // --- COUPON VALIDATION ---
  const handleApplyCoupon = async (planPrice, itemId) => {
    const code = couponCode;
    
    if (!code.trim()) return;
    if (!token) {
        showModal("error", "Login Required", "Please login to apply coupons.");
        return;
    }

    setCouponLoading(true);
    setCouponError(null); // Reset global error
    setAppliedCoupon(null); // Reset previous coupon

    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/coupons/validate", 
        { code: code, amount: planPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setAppliedCoupon({
          code: data.code,
          discount: data.discount,
          finalAmount: data.finalAmount,
          itemId: itemId 
        });
        toast.success(`Coupon Applied! Saved ₹${data.discount}`);
      }
    } catch (error) {
      // 🔥 FIX: Set error specifically for this itemId
      setCouponError({
        itemId: itemId,
        message: error.response?.data?.message || "Invalid Coupon Code"
      });
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };

  // --- PAYMENT HANDLER ---
  const handlePayment = async (item, type = "subscription") => {
    if (!userId || !token) {
      showModal("error", "Login Required", "Please login to make a purchase.");
      return;
    }

    if (type === "credit" && !isProActive) {
      showModal("error", "Subscription Required", "Active Pro Membership required for Credit Packs.");
      return;
    }

    setLoadingConfig(true);
    const itemName = item.name || (type === "subscription" ? "Pro Membership" : "Credit Pack");
    
    // Determine Price & Coupon
    let amountValue = item.price;
    let finalCouponCode = null;

    // Check if a coupon is applied AND it matches the item currently being purchased
    const currentItemId = item._id || (type === "subscription" ? "pro-plan" : item.id);
    
    if (appliedCoupon && appliedCoupon.itemId === currentItemId) {
      amountValue = appliedCoupon.finalAmount;
      finalCouponCode = appliedCoupon.code;
    }

    // Apply strict fallback rules based on requirements
    const validityDays = item.validity || (type === "subscription" ? 90 : 0);
    const activeJobDays = item.activeDays || (type === "subscription" ? 30 : 15);
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        showModal("error", "SDK Error", "Razorpay SDK failed to load.");
        setLoadingConfig(false); return;
      }

      const { data } = await axios.post(
        "http://localhost:5000/api/payment/create-order",
        { 
          amount: item.price, 
          planType: itemName, 
          type: type,
          couponCode: finalCouponCode 
        }, 
        config,
      );

      if (data.finalAmount !== amountValue) {
         amountValue = data.finalAmount;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        name: "IVGJobs",
        description: itemName,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(
              "http://localhost:5000/api/payment/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: userId,
                planName: itemName,
                amount: amountValue,
                type: type,
                validity: validityDays,
                jobActiveDays: activeJobDays,
                couponCode: finalCouponCode 
              },
              config,
            );

            if (verifyRes.data.success) {
              if (refreshUser) await refreshUser();
              showModal("success", "Payment Successful!", `Your purchase of ${itemName} is confirmed.`);
            } else {
              showModal("error", "Verification Failed", "Payment verification failed.");
            }
          } catch (error) {
            showModal("error", "Server Error", "An error occurred during verification.");
          }
        },
        theme: { color: "#fbbf24" },
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

  const freePlan = plansConfig.subscriptions.free;
  const proPlan = plansConfig.subscriptions.pro;
  const creditPacks = plansConfig.packs;

  if (loadingConfig && !plansConfig.subscriptions.free) {
    return (
      <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white', background: 'var(--bg-root)' }}>
        <Clock className="spin" size={48} />
        <p style={{ marginLeft: '15px', fontWeight: '600' }}>Loading Plans...</p>
      </div>
    );
  }

  // --- HELPER TO RENDER COUPON SECTION ---
  const renderCouponSection = (price, itemId) => {
    const isAppliedToThis = appliedCoupon && appliedCoupon.itemId === itemId;

    // 🔥 FIX: Only show error if the error object exists AND matches this itemId
    const isErrorForThis = couponError && couponError.itemId === itemId;

    return (
      <div className="coupon-section">
        {!isAppliedToThis ? (
          <>
            <div className="coupon-input-group">
              <input 
                type="text" 
                className="coupon-input" 
                placeholder="Have a coupon code?" 
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button 
                className="apply-btn" 
                onClick={() => handleApplyCoupon(price, itemId)}
                disabled={couponLoading}
              >
                {couponLoading ? <Loader2 className="spin" size={14} /> : "Apply"}
              </button>
            </div>
            {isErrorForThis && <span className="coupon-msg error">{couponError.message}</span>}
          </>
        ) : (
          <div className="coupon-msg success">
            <Ticket size={12} style={{display:'inline', marginRight:4}}/>
            Code <strong>{appliedCoupon.code}</strong> applied.
            <span className="remove-coupon" onClick={removeCoupon}>Remove</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="billing-page">
      <PaymentModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
      />

      <style>{`
        .billing-page {
          background-color: var(--bg-root); min-height: 100vh; color: var(--text-main);
          padding: 40px 20px; display: flex; justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif; transition: background-color 0.3s ease;
        }
        .container { width: 100%; max-width: 900px; }
        .header-section { text-align: center; margin-bottom: 40px; }
        .header-section h1 { font-size: 32px; margin-bottom: 10px; font-weight: 800; }
        .balance-info { 
          display: inline-block; background: var(--bg-card); padding: 8px 20px; 
          border-radius: 20px; color: var(--primary); font-weight: 600; border: 1px solid var(--border);
        }
        .tab-controls { display: flex; justify-content: center; gap: 15px; margin-bottom: 30px; }
        .tab-btn {
          background: transparent; border: 1px solid var(--border); color: var(--text-sub);
          padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 500;
          transition: 0.2s;
        }
        .tab-btn:hover { background: var(--bg-input); color: var(--text-main); }
        .tab-btn.active { background: var(--primary); color: #000; border-color: var(--primary); font-weight: 700; }
        .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .plan-card {
          background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 30px;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          position: relative; transition: transform 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }
        .plan-card:hover { transform: translateY(-5px); border-color: var(--primary); }
        .plan-card.highlight { border-color: var(--primary); background: var(--bg-input); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
        .active-chip {
            position: absolute; top: 12px; right: 12px; background-color: var(--success); color: #fff;
            font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px;
            text-transform: uppercase; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        .plan-icon { margin-bottom: 15px; color: var(--primary); }
        .plan-icon.gray { color: var(--text-sub); }
        .plan-name { font-size: 18px; font-weight: 700; margin-bottom: 10px; color: var(--text-main); }
        .plan-price { font-size: 28px; font-weight: 700; margin-bottom: 5px; color: var(--text-main); }
        .plan-price small { font-size: 14px; font-weight: 400; color: var(--text-sub); }
        .original-price { text-decoration: line-through; color: var(--text-sub); font-size: 16px; margin-right: 8px; }
        .feature-list { list-style: none; padding: 0; margin: 0 0 25px 0; width: 100%; text-align: left; }
        .feature-list li { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: var(--text-sub); font-size: 14px; }
        .plan-stats { width: 100%; margin-bottom: 20px; text-align: left; background: rgba(128,128,128, 0.05); padding: 15px; border-radius: 12px; }
        .stat-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: var(--text-main); font-size: 13px; font-weight: 500; }
        .stat-item:last-child { margin-bottom: 0; }
        .stat-item svg { color: var(--text-sub); min-width: 18px; }
        
        /* COUPON STYLES */
        .coupon-section { width: 100%; margin-bottom: 20px; text-align: left; }
        .coupon-toggle { font-size: 13px; color: var(--primary); cursor: pointer; display: flex; align-items: center; gap: 5px; font-weight: 600; }
        .coupon-input-group { display: flex; gap: 8px; margin-top: 8px; }
        .coupon-input { flex: 1; background: var(--bg-root); border: 1px solid var(--border); padding: 8px 12px; border-radius: 8px; color: var(--text-main); font-size: 13px; text-transform: uppercase; }
        .apply-btn { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-main); padding: 0 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .apply-btn:hover { border-color: var(--primary); color: var(--primary); }
        .coupon-msg { font-size: 12px; margin-top: 5px; display: block; }
        .coupon-msg.error { color: var(--danger); }
        .coupon-msg.success { color: var(--success); }
        .remove-coupon { color: var(--danger); font-size: 11px; cursor: pointer; text-decoration: underline; margin-left: 5px;}
        
        .buy-btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: auto; transition: 0.2s; }
        .buy-btn.primary { background: var(--primary); color: #000; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .buy-btn.primary:hover { transform: scale(1.02); }
        .buy-btn.disabled { background: var(--bg-input); border: 1px solid var(--border); color: var(--text-sub); cursor: not-allowed; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="container">
        <div className="header-section">
          <h1>Billing & Plans</h1>
          <div className="balance-info">
            Current Balance: {currentCredits} Credits
          </div>
          {isProActive && (
            <div style={{ color: "var(--success)", marginTop: 8, fontSize: 14, fontWeight: 600 }}>
              Pro Plan Active ({getDaysLeft()} days remaining)
            </div>
          )}
          {currentPlan === "pro" && getDaysLeft() <= 0 && (
            <div style={{ color: "var(--danger)", marginTop: 8, fontSize: 14, fontWeight: 600 }}>
              Plan Expired - Please Renew
            </div>
          )}
        </div>

        <div className="tab-controls">
          <button className={`tab-btn ${activeTab === "plans" ? "active" : ""}`} onClick={() => setActiveTab("plans")}>
            Membership
          </button>
          <button className={`tab-btn ${activeTab === "credits" ? "active" : ""}`} onClick={() => setActiveTab("credits")}>
            Credit Packs
          </button>
        </div>

        <div className="plans-grid">
          {activeTab === "plans" ? (
            <>
              {/* FREE PLAN */}
              {freePlan && (
                <div className="plan-card">
                  {isFreeActive && <div className="active-chip">Active</div>}
                  <div className="plan-icon gray">
                    <ShieldCheck size={36} />
                  </div>
                  <div className="plan-name">Free Plan</div>
                  <div className="plan-price">₹{freePlan.price || 0}</div>

                  <div className="plan-stats">
                    <div className="stat-item">
                      <Briefcase size={18} />
                      <span>{freePlan.monthlyCredits || 0} credits / month</span>
                    </div>
                    <div className="stat-item">
                      <Clock size={18} />
                      {/* Fixed Fallback for Free Plan 15 Days */}
                      <span>Jobs live for <strong>{freePlan.activeDays || 15} Days</strong></span>
                    </div>
                  </div>

                  <ul className="feature-list">
                    <li><Check size={16} color="var(--text-sub)" /> Access Basic Profiles (Masked)</li>
                    <li><Check size={16} color="var(--text-sub)" /> {freePlan.jobLimit || 3} Active Job Limit</li>
                    <li style={{ opacity: 0.6 }}><X size={16} /> No Direct Messaging</li>
                  </ul>
                  <button className="buy-btn disabled" disabled>
                    {isFreeActive ? "Current Plan" : "Default Plan"}
                  </button>
                </div>
              )}

              {/* PRO PLAN */}
              {proPlan && (
                <div className={`plan-card ${isProActive ? "highlight" : ""}`}>
                  {isProActive && <div className="active-chip">Active</div>}
                  <div className="plan-icon">
                    <Crown size={36} />
                  </div>
                  <div className="plan-name">Pro Membership</div>
                  
                  {/* --- PRICE SECTION --- */}
                  <div className="plan-price">
                    {appliedCoupon && appliedCoupon.itemId === "pro-plan" ? (
                      <>
                        <span className="original-price">₹{proPlan.price}</span>
                        ₹{appliedCoupon.finalAmount}
                      </>
                    ) : (
                      `₹${proPlan.price}`
                    )}
                    <small>/month</small>
                  </div>

                  <div className="plan-stats">
                    <div className="stat-item">
                      <Briefcase size={18} />
                      <span>{proPlan.monthlyCredits || 30} credits / month</span>
                    </div>
                    <div className="stat-item">
                      <Clock size={18} />
                      {/* Fixed Fallback for Pro Plan 30 Days */}
                      <span>Jobs live for <strong>{proPlan.activeDays || 30} Days</strong></span>
                    </div>
                    <div className="stat-item">
                      <Calendar size={18} />
                      {/* Fixed Fallback for Credit Validity 90 Days */}
                      <span>Credits valid for <strong>{proPlan.validity || 90} Days</strong></span>
                    </div>
                  </div>

                  {/* --- RENDER COUPON SECTION --- */}
                  {renderCouponSection(proPlan.price, "pro-plan")}

                  <ul className="feature-list">
                    <li><Check size={16} color="var(--primary)" /> <strong>Direct Messaging</strong></li>
                    <li><Check size={16} color="var(--primary)" /> {proPlan.jobLimit > 1000 ? "Unlimited" : (proPlan.jobLimit || "Unlimited")} Active Jobs</li>
                    <li><Check size={16} color="var(--primary)" /> Verified Badge</li>
                  </ul>
                  
                  <button className="buy-btn primary" onClick={() => handlePayment(proPlan, "subscription")}>
                    {isProActive ? "Extend Plan" : "Upgrade Now"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* CREDIT PACKS */}
              {creditPacks && creditPacks.length > 0 ? (
                creditPacks.map((pack, idx) => {
                  const packId = pack._id || pack.id || idx; // Fallback ID
                  return (
                    <div key={packId} className="plan-card">
                      <div className="plan-icon">
                        <Coins size={32} />
                      </div>
                      <div className="plan-name">{pack.name}</div>
                      
                      {/* --- CREDIT PACK PRICE SECTION --- */}
                      <div className="plan-price">
                         {appliedCoupon && appliedCoupon.itemId === packId ? (
                            <>
                              <span className="original-price">₹{pack.price}</span>
                              ₹{appliedCoupon.finalAmount}
                            </>
                          ) : (
                            `₹${pack.price}`
                          )}
                      </div>

                      <p style={{ color: "var(--text-sub)", marginBottom: 20 }}>
                        Add {pack.credits} Unlocks
                      </p>

                      <div className="plan-stats">
                        <div className="stat-item">
                          <CheckCircle size={18} />
                          <span>Credits never expire</span>
                        </div>
                      </div>

                      {/* --- 🔥 COUPON INTEGRATION FOR CREDIT PACKS --- */}
                      {renderCouponSection(pack.price, packId)}
                      {/* --------------------------------------------- */}

                      <button className="buy-btn primary" onClick={() => handlePayment(pack, "credit")}>
                        Purchase
                      </button>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: "var(--text-sub)", textAlign: "center", width: "100%", gridColumn: "1/-1" }}>
                  No credit packs available at the moment.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingPlans;