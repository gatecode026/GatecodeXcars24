"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

// Clean UI Icons
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const AdminProfilePage = () => {
  const { user: authUser, updateUserData } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  // Profile fields pre-filled from auth context
  const [name, setName] = useState(authUser?.name || "");
  const [email, setEmail] = useState(authUser?.email || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load current admin profile in background
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        const profile = res.data?.data;
        if (profile && isMounted) {
          setName(profile.name || "");
          setEmail(profile.email || "");
          setPhoneNumber(profile.phoneNumber || "");
          setUsername(profile.username || "");
        }
      } catch (err) {
        if (authUser && isMounted) {
          setName(authUser.name || "");
          setEmail(authUser.email || "");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, [authUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    const errs = {};
    if (!name.trim()) {
      errs.name = "Full Name cannot be empty.";
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      errs.email = "Please enter a valid email address.";
    }

    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        errs.currentPassword = "Please enter your Current Password to verify the password change.";
      }
      if (newPassword.length < 6) {
        errs.newPassword = "New Password must be at least 6 characters long.";
      }
      if (newPassword !== confirmPassword) {
        errs.confirmPassword = "New Password and Confirm Password do not match.";
      }
    }

    if (Object.keys(errs).length) {
      setErrors(errs);
      setToast({ type: "error", message: Object.values(errs)[0] });
      return;
    }

    setErrors({});

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        username: username.trim()
      };

      if (newPassword && newPassword.trim()) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword.trim();
      }

      const res = await api.put("/auth/profile", payload);
      const updated = res.data?.data;
      const newToken = res.data?.token;

      if (updateUserData && updated) {
        updateUserData(
          {
            name: updated.name,
            email: updated.email,
            role: updated.role || "admin"
          },
          newToken
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setToast({
        type: "success",
        message: res.data?.message || "Administrator profile and credentials updated successfully!"
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update profile. Please try again.";
      setToast({ type: "error", message: msg });
      const lower = msg.toLowerCase();
      if (lower.includes("current password") || lower.includes("old password")) setErrors((p) => ({ ...p, currentPassword: msg }));
      else if (lower.includes("email")) setErrors((p) => ({ ...p, email: msg }));
      else if (lower.includes("name")) setErrors((p) => ({ ...p, name: msg }));
      else if (lower.includes("password")) setErrors((p) => ({ ...p, newPassword: msg }));
    } finally {
      setSubmitting(false);
    }
  };

  const userInitial = (name || authUser?.name || "A").charAt(0).toUpperCase();

  return (
    <div className="content-area">
      {/* Page Header Row */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>Administrator Profile &amp; Settings</h1>
          <p>Manage your master account credentials, identity, and security preferences</p>
        </div>
        <div className="page-actions-group">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/admin/dashboard")}
            title="Return to Dashboard"
          >
            <ArrowLeftIcon />
            Dashboard
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            borderRadius: "10px",
            backgroundColor: toast.type === "error" ? "#fef2f2" : "#ecfdf5",
            color: toast.type === "error" ? "#b91c1c" : "#047857",
            border: `1px solid ${toast.type === "error" ? "#fecaca" : "#a7f3d0"}`,
            fontSize: "13.5px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          {toast.type === "success" ? <CheckCircleIcon /> : <ShieldIcon />}
          <span>{toast.message}</span>
        </div>
      )}

      {loading ? (
        <div className="table-card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
          <div className="spinner-border" style={{ marginBottom: "12px", width: "36px", height: "36px", color: "var(--primary)" }} />
          <div>Loading administrator profile...</div>
        </div>
      ) : (
        /* Full-Width 2-Column Responsive Layout */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", alignItems: "start" }}>
          
          {/* Left Column: Profile Card & Account Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="table-card" style={{ padding: "28px 24px", textAlign: "center" }}>
              <div
                style={{
                  width: "84px",
                  height: "84px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "36px",
                  fontWeight: 800,
                  color: "#ffffff",
                  boxShadow: "0 0 0 6px rgba(2, 132, 199, 0.15), 0 10px 20px rgba(0,0,0,0.08)",
                  marginBottom: "16px"
                }}
              >
                {userInitial}
              </div>

              <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-heading)" }}>
                {name || "Administrator"}
              </h2>

              <div style={{ display: "inline-block", marginBottom: "18px" }}>
                <span className="badge-verified-pill verified" style={{ textTransform: "capitalize" }}>
                  System Administrator
                </span>
              </div>

              <div style={{ textAlign: "left", borderTop: "1px solid var(--border)", paddingTop: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="detail-label-val">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value" style={{ fontSize: "13px" }}>{email || "-"}</span>
                </div>
                <div className="detail-label-val">
                  <span className="detail-label">Username</span>
                  <span className="detail-value" style={{ fontSize: "13px", fontFamily: "monospace" }}>
                    {username ? `@${username}` : "-"}
                  </span>
                </div>
                <div className="detail-label-val">
                  <span className="detail-label">Phone Number</span>
                  <span className="detail-value" style={{ fontSize: "13px" }}>{phoneNumber || "Not provided"}</span>
                </div>
                <div className="detail-label-val">
                  <span className="detail-label">Role Access</span>
                  <span className="detail-value" style={{ color: "#0284c7", fontWeight: 700 }}>Master Administrator</span>
                </div>
              </div>
            </div>

            {/* Security Status Box */}
            <div className="table-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", color: "var(--text-heading)", fontWeight: 700 }}>
                <ShieldIcon />
                Security &amp; Permissions
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
                This account holds full root privileges across operations, orders, customers, telecalling, and team management. Keep your password confidential.
              </p>
            </div>
          </div>

          {/* Right Column: Edit Profile Form & Change Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <form onSubmit={handleSubmit} noValidate>
              {/* Card 1: Personal Details */}
              <div className="table-card" style={{ padding: "26px", marginBottom: "20px" }}>
                <div className="form-section-heading" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                  <UserIcon />
                  Edit Personal Information
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? "is-invalid" : ""}`}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      placeholder="e.g. Sureandra Admin"
                      required
                    />
                    {errors.name && <small className="error-text">{errors.name}</small>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. surendra_admin"
                    />
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? "is-invalid" : ""}`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      placeholder="admin@cars24.com"
                      required
                    />
                    {errors.email && <small className="error-text">{errors.email}</small>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Password Change */}
              <div className="table-card" style={{ padding: "26px", marginBottom: "20px" }}>
                <div className="form-section-heading" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <LockIcon />
                  Change Master Password
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "18px" }}>
                  Leave these fields blank if you do not want to change your password.
                </p>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label className="form-label">Current Password</label>
                  <div className="password-input-wrap">
                    <input
                      type={showCurrent ? "text" : "password"}
                      className={`form-control ${errors.currentPassword ? "is-invalid" : ""}`}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (errors.currentPassword) setErrors((prev) => ({ ...prev, currentPassword: "" }));
                      }}
                      placeholder="Enter current password to authorize changes"
                      style={{ width: "100%", paddingRight: "40px", boxSizing: "border-box" }}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowCurrent(!showCurrent)}
                      tabIndex={-1}
                      title={showCurrent ? "Hide password" : "Show password"}
                    >
                      {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {errors.currentPassword && <small className="error-text">{errors.currentPassword}</small>}
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="password-input-wrap">
                      <input
                        type={showNew ? "text" : "password"}
                        className={`form-control ${errors.newPassword ? "is-invalid" : ""}`}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: "" }));
                        }}
                        placeholder="Min. 6 characters"
                        style={{ width: "100%", paddingRight: "40px", boxSizing: "border-box" }}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowNew(!showNew)}
                        tabIndex={-1}
                        title={showNew ? "Hide password" : "Show password"}
                      >
                        {showNew ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    {errors.newPassword && <small className="error-text">{errors.newPassword}</small>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div className="password-input-wrap">
                      <input
                        type={showConfirm ? "text" : "password"}
                        className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                        }}
                        placeholder="Repeat new password"
                        style={{ width: "100%", paddingRight: "40px", boxSizing: "border-box" }}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowConfirm(!showConfirm)}
                        tabIndex={-1}
                        title={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    {errors.confirmPassword && <small className="error-text">{errors.confirmPassword}</small>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate("/admin/dashboard")}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ minWidth: "170px" }}
                >
                  {submitting ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div className="spinner-border" style={{ width: "16px", height: "16px" }} />
                      Saving Changes...
                    </div>
                  ) : (
                    "Save Profile Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfilePage;
