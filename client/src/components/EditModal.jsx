import { useState } from "react";

const EditModal = ({ title, fields, data, onSave, onClose }) => {
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Edit {title}</h3>
        <div className="modal-fields">
          {fields.map((f) => (
            <label key={f.key} className="field-wrap">
              <span>{f.label}</span>
              {f.type === "select" ? (
                <select value={form[f.key] || ""} onChange={(e) => handleChange(f.key, e.target.value)}>
                  <option value="">-- Select --</option>
                  {f.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea value={form[f.key] || ""} onChange={(e) => handleChange(f.key, e.target.value)} />
              ) : (
                <input
                  type={f.type || "text"}
                  value={form[f.key] || ""}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button className="primary-btn modal-cancel-btn" onClick={onClose}>
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
