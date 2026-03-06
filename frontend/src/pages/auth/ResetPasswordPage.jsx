import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuthStore from "../../context/useAuthStore";
import { Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuthStore();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/auth/seeker"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Link might be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card fade-in">
        
        {success ? (
          <div className="success-view">
            <div className="icon-circle"><CheckCircle2 size={40} /></div>
            <h2>Password Reset!</h2>
            <p>Your password has been updated successfully. Redirecting you to login...</p>
          </div>
        ) : (
          <>
            <div className="header">
              <div className="icon-box"><Lock size={24} /></div>
              <h2>Set New Password</h2>
              <p>Please enter your new password below.</p>
            </div>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>New Password</label>
                <div className="input-field">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <div className="input-field">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <Loader2 className="spin" /> : "Reset Password"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        .reset-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%);
          font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 20px;
        }
        .reset-card {
          background: white;
          width: 100%;
          max-width: 400px;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
        }
        .header { text-align: center; margin-bottom: 30px; }
        .icon-box {
          width: 50px; height: 50px;
          background: #eff6ff; color: #2563eb;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 15px;
        }
        .header h2 { margin: 0 0 8px; color: #0f172a; font-size: 24px; font-weight: 800; }
        .header p { margin: 0; color: #64748b; font-size: 14px; }

        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px; }
        .input-field { display: flex; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0 16px; transition: 0.2s; }
        .input-field:focus-within { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        .input-field input { width: 100%; padding: 12px 0; border: none; background: transparent; outline: none; font-size: 15px; color: #0f172a; }
        .eye-btn { background: none; border: none; color: #94a3b8; cursor: pointer; }
        
        .submit-btn { width: 100%; padding: 14px; background: #2563eb; color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
        .submit-btn:hover { background: #1d4ed8; transform: translateY(-2px); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .error-box { background: #fef2f2; color: #dc2626; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; text-align: center; border: 1px solid #fecaca; }

        .success-view { text-align: center; padding: 20px 0; }
        .success-view .icon-circle { width: 60px; height: 60px; background: #dcfce7; color: #166534; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .success-view h2 { color: #166534; margin-bottom: 10px; }
        .success-view p { color: #64748b; font-size: 14px; line-height: 1.5; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.6s ease-out; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ResetPasswordPage;