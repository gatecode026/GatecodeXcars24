"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";

// Clean UI Icons
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

const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const RegisterPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id && searchParams.get("edit") === "true");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    username: "",
    role: "employee",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);

  // Load existing user details when editing
  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/auth/users/${id}`);
        const u = res.data?.data;
        if (u) {
          setForm({
            name: u.name || "",
            phoneNumber: u.phoneNumber || "",
            email: u.email || "",
            username: u.username || "",
            role: u.role || "employee",
            password: ""
          });
        }
      } catch (err) {
        setToast({ message: "Failed to load user information", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const sanitizeDigits = (value, max) => value.replace(/\D/g, "").slice(0, max);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Full name is required";
    if (!form.phoneNumber.trim()) next.phoneNumber = "Mobile number is required";
    else if (form.phoneNumber.length < 10) next.phoneNumber = "Enter valid 10-digit mobile number";

    if (!form.email.trim()) next.email = "Email address is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email address";

    if (!form.username.trim()) next.username = "Username is required";

    if (!isEdit) {
      if (!form.password) next.password = "Password is required";
      else if (form.password.length < 6) next.password = "Password must be at least 6 characters";
    } else if (form.password && form.password.length < 6) {
      next.password = "Password must be at least 6 characters";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setToast(null);

    try {
      if (isEdit) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/auth/users/${id}`, payload);
        alert("User updated successfully!");
        navigate("/admin/users");
      } else {
        await api.post("/auth/register", form);
        alert("Employee registered successfully!");
        navigate("/admin/users");
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || "Operation failed. Please try again.";
      setToast({ message: errMsg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content-area">
      {/* Header Row */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>{isEdit ? "Edit Employee User" : "Register New User"}</h1>
          <p>{isEdit ? "Update user account details and permissions" : "Create new employee account and login credentials"}</p>
        </div>
        <div className="page-actions-group">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/admin/users")}
            title="Return to Users"
          >
            <ArrowLeftIcon />
            Back to Users
          </button>
        </div>
      </div>

      {toast && (
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto 20px auto",
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: toast.type === "error" ? "#fef2f2" : "#ecfdf5",
            color: toast.type === "error" ? "#b91c1c" : "#047857",
            border: `1px solid ${toast.type === "error" ? "#fecaca" : "#a7f3d0"}`,
            fontSize: "13.5px",
            fontWeight: 500
          }}
        >
          {toast.message}
        </div>
      )}

      {loading ? (
        <div className="table-card" style={{ maxWidth: "760px", margin: "0 auto", padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
          <div className="spinner-border" style={{ marginBottom: "12px" }} />
          <div>Loading user information...</div>
        </div>
      ) : (
        /* Form Card */
        <div className="table-card" style={{ maxWidth: "760px", margin: "0 auto", padding: "28px" }}>
          <form onSubmit={onSubmit}>
            {/* 1. Account Profile */}
            <div className="form-section-card">
              <div className="form-section-heading">Employee Profile Information</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ramesh Patel"
                    value={form.name}
                    onChange={(e) => onChange("name", e.target.value)}
                    required
                  />
                  {errors.name && <span style={{ color: "#ef4444", fontSize: "11.5px", marginTop: "4px", display: "block" }}>{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phoneNumber}
                    onChange={(e) => onChange("phoneNumber", sanitizeDigits(e.target.value, 10))}
                    required
                  />
                  {errors.phoneNumber && <span style={{ color: "#ef4444", fontSize: "11.5px", marginTop: "4px", display: "block" }}>{errors.phoneNumber}</span>}
                </div>
              </div>

              <div className="form-grid-2" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. employee@gatexpay.co.in"
                    value={form.email}
                    onChange={(e) => onChange("email", e.target.value)}
                    required
                  />
                  {errors.email && <span style={{ color: "#ef4444", fontSize: "11.5px", marginTop: "4px", display: "block" }}>{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. ramesh_24"
                    value={form.username}
                    onChange={(e) => onChange("username", e.target.value)}
                    required
                  />
                  {errors.username && <span style={{ color: "#ef4444", fontSize: "11.5px", marginTop: "4px", display: "block" }}>{errors.username}</span>}
                </div>
              </div>
            </div>

            {/* 2. Security & Role */}
            <div className="form-section-card">
              <div className="form-section-heading">Security &amp; System Permissions</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    {isEdit ? "Password (leave blank to keep current)" : "Password *"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder={isEdit ? "Enter new password if changing" : "Minimum 6 characters"}
                      value={form.password}
                      autoComplete="new-password"
                      onChange={(e) => onChange("password", e.target.value)}
                      style={{ paddingRight: "40px" }}
                      required={!isEdit}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center"
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {errors.password && <span style={{ color: "#ef4444", fontSize: "11.5px", marginTop: "4px", display: "block" }}>{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Role *</label>
                  <select
                    className="form-control"
                    value={form.role}
                    onChange={(e) => onChange("role", e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="employee">Employee / Executive</option>
                    <option value="admin">Administrator / TL</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: "flex", gap: "12px", marginTop: "24px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/admin/users")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                <UserIcon />
                {submitting ? "Saving..." : isEdit ? "Update User" : "Register User"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
