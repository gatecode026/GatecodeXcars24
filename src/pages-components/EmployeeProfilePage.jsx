"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

// Clean UI Icons
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

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
    <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

const BadgeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const EmployeeProfilePage = () => {
  const { user: authUser, updateUserData } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");

  // Executive Performance Stats
  const [perfStats, setPerfStats] = useState({
    orderCount: 0,
    leadCount: 0,
    totalIncentive: 0,
    callingCount: 0
  });

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load current executive profile & dashboard stats
  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        setLoading(true);
        const [profileRes, dashRes, callRes] = await Promise.all([
          api.get("/auth/profile"),
          api.get("/employee/dashboard", { params: { filter: "month" } }).catch(() => ({ data: { data: {} } })),
          api.get("/employee/calling-records").catch(() => ({ data: { data: [] } }))
        ]);

        const profile = profileRes.data?.data;
        if (profile) {
          setName(profile.name || "");
          setEmail(profile.email || "");
          setPhoneNumber(profile.phoneNumber || "");
          setUsername(profile.username || "");
        }

        const dData = dashRes.data?.data || {};
        const callList = Array.isArray(callRes.data?.data) ? callRes.data.data : [];

        setPerfStats({
          orderCount: dData.orderCount || 0,
          leadCount: dData.leadCount || 0,
          totalIncentive: dData.totalIncentive || 0,
          callingCount: callList.length
        });
      } catch (err) {
        if (authUser) {
          setName(authUser.name || "");
          setEmail(authUser.email || "");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndStats();
  }, [authUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!name.trim()) {
      setToast({ type: "error", message: "Full Name cannot be empty." });
      return;
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setToast({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        setToast({ type: "error", message: "Please enter your Current Password to verify the password change." });
        return;
      }
      if (newPassword.length < 6) {
        setToast({ type: "error", message: "New Password must be at least 6 characters long." });
        return;
      }
      if (newPassword !== confirmPassword) {
        setToast({ type: "error", message: "New Password and Confirm Password do not match." });
        return;
      }
    }

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
            role: updated.role || "employee"
          },
          newToken
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setToast({
        type: "success",
        message: res.data?.message || "Executive profile and credentials updated successfully!"
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update profile. Please try again.";
      setToast({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const userInitial = (name || authUser?.name || "E").charAt(0).toUpperCase();

  return (
    <div className="content-area">
      {/* Page Header Row */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>Sales Executive Profile</h1>
          <p>Manage your account credentials, contact information, and security preferences</p>
        </div>
        <div className="page-actions-group">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/employee/dashboard")}
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
          {toast.type === "success" ? <CheckCircleIcon /> : <UserIcon />}
          <span>{toast.message}</span>
        </div>
      )}

      {loading ? (
        <div className="table-card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
          <div className="spinner-border" style={{ marginBottom: "12px", width: "36px", height: "36px", color: "var(--primary)" }} />
          <div>Loading executive profile...</div>
        </div>
      ) : (
        /* Full-Width 2-Column Responsive Layout */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", alignItems: "start" }}>
          
          {/* Left Column: Profile Card & Performance Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Identity Card */}
            <div className="table-card" style={{ padding: "28px 24px", textAlign: "center" }}>
              <div
                style={{
                  width: "84px",
                  height: "84px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "36px",
                  fontWeight: 800,
                  color: "#ffffff",
                  boxShadow: "0 0 0 6px rgba(5, 150, 105, 0.15), 0 10px 20px rgba(0,0,0,0.08)",
                  marginBottom: "16px"
                }}
              >
                {userInitial}
              </div>

              <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-heading)" }}>
                {name || "Sales Executive"}
              </h2>

              <div style={{ display: "inline-block", marginBottom: "18px" }}>
                <span className="badge-verified-pill verified" style={{ textTransform: "capitalize" }}>
                  Certified Operations &amp; Sales Executive
                </span>
              </div>

              <div style={{ textAlign: "left", borderTop: "1px solid var(--border)", paddingTop: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="detail-label-val">
                  <span className="detail-label">Official Email</span>
                  <span className="detail-value" style={{ fontSize: "13px" }}>{email || "-"}</span>
                </div>
                <div className="detail-label-val">
                  <span className="detail-label">Username</span>
                  <span className="detail-value" style={{ fontSize: "13px", fontFamily: "monospace" }}>
                    {username ? `@${username}` : "-"}
                  </span>
                </div>
                <div className="detail-label-val">
                  <span className="detail-label">Contact Number</span>
                  <span className="detail-value" style={{ fontSize: "13px" }}>{phoneNumber || "Not provided"}</span>
                </div>
                <div className="detail-label-val">
                  <span className="detail-label">Designation</span>
                  <span className="detail-value" style={{ color: "#059669", fontWeight: 700 }}>
                    Operations &amp; Sales
                  </span>
                </div>
                <div className="detail-label-val">
                  <span className="detail-label">Portal Access</span>
                  <span className="detail-value" style={{ color: "var(--text-body)" }}>
                    Lead Inquiries, Purchases, Telecalling
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Stats Card */}
            <div className="table-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", color: "var(--text-heading)", fontWeight: 700 }}>
                <TrophyIcon />
                This Month's Achievements
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ padding: "12px", background: "var(--bg-subtle, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: 600 }}>Cars Purchased</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#0284c7", marginTop: "4px" }}>
                    {perfStats.orderCount}
                  </div>
                </div>

                <div style={{ padding: "12px", background: "var(--bg-subtle, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: 600 }}>Leads Managed</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#8b5cf6", marginTop: "4px" }}>
                    {perfStats.leadCount}
                  </div>
                </div>

                <div style={{ padding: "12px", background: "var(--bg-subtle, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: 600 }}>Calls Logged</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#f59e0b", marginTop: "4px" }}>
                    {perfStats.callingCount}
                  </div>
                </div>

                <div style={{ padding: "12px", background: "var(--bg-subtle, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: 600 }}>Earned Incentive</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
                    ₹{Number(perfStats.totalIncentive).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Guidelines Card */}
            <div className="table-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", color: "var(--text-heading)", fontWeight: 700 }}>
                <BadgeIcon />
                Operations Notice
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
                Please ensure all customer telecalling records and car inspection notes are logged promptly. Your session stays active across your browser tabs for 7 days.
              </p>
            </div>
          </div>

          {/* Right Column: Edit Profile Form & Change Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <form onSubmit={handleSubmit}>
              
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
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sales Executive"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. executive_user"
                    />
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Official Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="employee@cars24.com"
                      required
                    />
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
                  Change Account Password
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "18px" }}>
                  Leave these fields blank if you do not wish to update your login password.
                </p>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label className="form-label">Current Password</label>
                  <div className="password-input-wrap">
                    <input
                      type={showCurrent ? "text" : "password"}
                      className="form-control"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password to verify identity"
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
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="password-input-wrap">
                      <input
                        type={showNew ? "text" : "password"}
                        className="form-control"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div className="password-input-wrap">
                      <input
                        type={showConfirm ? "text" : "password"}
                        className="form-control"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate("/employee/dashboard")}
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

export default EmployeeProfilePage;
