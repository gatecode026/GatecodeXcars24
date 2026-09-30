"use client";
import { useState } from "react";

const EditModal = ({ title, fields, data, onSave, onClose }) => {
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = () => {
    const errs = {};
    if (fields) {
      fields.forEach((f) => {
        const val = form[f.key];
        if (f.key === "customerName" && (!val || !val.toString().trim())) {
          errs.customerName = "Customer name is required";
        }
        if (f.key === "mobileNumber") {
          const digits = (val || "").toString().replace(/\D/g, "");
          if (!digits) {
            errs.mobileNumber = "Mobile number is required";
          } else if (digits.length !== 10) {
            errs.mobileNumber = "Must be a valid 10-digit mobile number";
          }
        }
        if (f.key === "pincode" && val) {
          const digits = val.toString().replace(/\D/g, "");
          if (digits.length !== 6) {
            errs.pincode = "Pincode must be 6 digits";
          }
        }
      });
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setGeneralError(null);
    try {
      await onSave(form);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save changes";
      setGeneralError(msg);
      const lower = msg.toLowerCase();
      const errs = {};
      if (lower.includes("mobile") || lower.includes("phone")) errs.mobileNumber = msg;
      if (lower.includes("name")) errs.customerName = msg;
      if (lower.includes("pin")) errs.pincode = msg;
      if (Object.keys(errs).length > 0) setErrors(errs);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Edit {title}</h3>

        {generalError && (
          <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "12.5px", marginBottom: "12px", border: "1px solid #fecaca" }}>
            {generalError}
          </div>
        )}

        <div className="modal-fields">
          {fields.map((f) => (
            <label key={f.key} className="field-wrap">
              <span>{f.label}</span>
              {f.type === "select" ? (
                <select
                  value={form[f.key] || ""}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  className={errors[f.key] ? "is-invalid" : ""}
                >
                  <option value="">-- Select --</option>
                  {f.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  value={form[f.key] || ""}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  className={errors[f.key] ? "is-invalid" : ""}
                />
              ) : (
                <input
                  type={f.type || "text"}
                  value={form[f.key] || ""}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  className={errors[f.key] ? "is-invalid" : ""}
                />
              )}
              {errors[f.key] && <small className="error-text">{errors[f.key]}</small>}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button className="primary-btn modal-cancel-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
