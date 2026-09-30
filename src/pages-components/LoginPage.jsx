"use client";
import "@/src/styles/index.css";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Clean Line Icons
const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      const decoded = await login(trimmedEmail, trimmedPassword);
      const targetRole = decoded?.role || "employee";
      navigate(
        targetRole === "admin" || targetRole === "tl" ? "/admin/dashboard" : "/employee/dashboard",
        { replace: true }
      );
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Invalid credentials. Please verify email and password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-bg-glow" />

      <div className="login-compact-card" style={{ maxWidth: "420px", width: "100%", margin: "auto" }}>
        {/* Header with Emblem */}
        <div className="login-card-header">
          <div className="login-logo-circle-wrap" style={{ width: "56px", height: "56px", margin: "0 auto 12px" }}>
            <img
              src="/logo.jpg"
              alt="GatecodeXcars24"
              className="login-card-logo"
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <span className="login-brand-chip">GatecodeXcars24</span>
          <h2 className="login-card-title">Sign In to Platform</h2>
          <p className="login-card-subtitle">
            Enter your credentials to access your operations portal
          </p>
        </div>

            {/* Error Message Alert */}
            {error && (
              <div className="login-alert-box">
                <span className="alert-dot" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-form-body">
              {/* Email / Username Input */}
              <div className="form-group-custom">
                <label className="input-label-custom">Email or Username</label>
                <div className="input-field-wrap">
                  <span className="input-field-icon"><MailIcon /></span>
                  <input
                    type="text"
                    className="input-custom"
                    placeholder="Enter email or username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Input with Eye Toggle */}
              <div className="form-group-custom">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="input-label-custom">Password</label>
                  <span style={{ fontSize: "11px", color: "var(--text-subtle)", fontWeight: 500 }}>Case-sensitive</span>
                </div>
                <div className="input-field-wrap">
                  <span className="input-field-icon"><LockIcon /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input-custom password-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  {/* Eye Toggle Button */}
                  <button
                    type="button"
                    className="password-eye-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="btn-arrow-icon"><ArrowRightIcon /></span>
                  </>
                )}
              </button>
            </form>

        <div className="login-card-footer">
          <span className="footer-secure-tag">
            <ShieldIcon /> Single Active Device Session Enforced
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
