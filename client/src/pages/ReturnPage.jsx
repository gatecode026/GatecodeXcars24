import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Field from "../components/Field";
import { isValidMobile, isValidPincode } from "../utils/validators";

const initialState = {
  customerName: "",
  mobileNumber: "",
  pincode: "",
  productType: "GPS",
  numberOfUnitsReturning: "",
  returnReason: "Product Damaged",
  customReason: "",
  additionalDescription: "",
};

const ReturnPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sanitizeDigits = (value, max) => value.replace(/\D/g, "").slice(0, max);
  const sanitizeLetters = (value) => value.replace(/[^a-zA-Z\s]/g, "");
  const preventNonNumericKey = (e) => {
    if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const validate = () => {
    const next = {};
    if (!form.customerName.trim()) next.customerName = "Customer name is required";
    if (!isValidMobile(form.mobileNumber)) next.mobileNumber = "Enter valid 10-digit mobile number";
    if (!isValidPincode(form.pincode)) next.pincode = "Enter valid 6-digit pincode";
    if (!form.numberOfUnitsReturning || Number(form.numberOfUnitsReturning) <= 0) {
      next.numberOfUnitsReturning = "Units must be > 0";
    }
    if (form.returnReason === "Other" && !form.customReason.trim()) {
      next.customReason = "Custom return reason is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!validate()) return;
    try {
      setLoading(true);
      await api.post("/returns", { ...form, numberOfUnitsReturning: Number(form.numberOfUnitsReturning) });
      navigate("/admin/returns/manage", { replace: true });
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to submit return request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-page">
      <div className="form-head">
        <div>
          <h2>Create New Return</h2>
          <p className="form-subtitle">Submit a product return request below</p>
        </div>
      </div>

      <div className="form-card glass-card">
        <form className="modern-form" onSubmit={onSubmit}>
          <div className="form-section">
            <h3 className="form-section-title">Customer Information</h3>
            <div className="form-section-content">
              <Field label="Customer Name" error={errors.customerName}>
                <input
                  placeholder="Enter customer name"
                  value={form.customerName}
                  onChange={(e) => onChange("customerName", sanitizeLetters(e.target.value))}
                />
              </Field>
              <Field label="Mobile Number" error={errors.mobileNumber}>
                <input
                  placeholder="10-digit number"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.mobileNumber}
                  onKeyDown={preventNonNumericKey}
                  onChange={(e) => onChange("mobileNumber", sanitizeDigits(e.target.value, 10))}
                />
              </Field>
              <Field label="Pincode" error={errors.pincode}>
                <input
                  placeholder="6-digit pincode"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onKeyDown={preventNonNumericKey}
                  onChange={(e) => onChange("pincode", sanitizeDigits(e.target.value, 6))}
                />
              </Field>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Return Details</h3>
            <div className="form-section-content">
              <Field label="Product Type">
                <select value={form.productType} onChange={(e) => onChange("productType", e.target.value)}>
                  <option>GPS</option>
                  <option>Vending Machine</option>
                  <option>Disposal</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Number of Units" error={errors.numberOfUnitsReturning}>
                <input
                  placeholder="How many units?"
                  value={form.numberOfUnitsReturning}
                  onKeyDown={preventNonNumericKey}
                  onChange={(e) => onChange("numberOfUnitsReturning", sanitizeDigits(e.target.value, 6))}
                />
              </Field>
              <Field label="Return Reason">
                <select value={form.returnReason} onChange={(e) => onChange("returnReason", e.target.value)}>
                  <option>Product Damaged</option>
                  <option>Wrong Product</option>
                  <option>Product Not Working</option>
                  <option>Extra Order</option>
                  <option>Other</option>
                </select>
              </Field>
              {form.returnReason === "Other" && (
                <Field label="Custom Reason" error={errors.customReason}>
                  <input
                    placeholder="Describe the reason"
                    value={form.customReason}
                    onChange={(e) => onChange("customReason", e.target.value)}
                  />
                </Field>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Additional Information</h3>
            <div className="form-section-content">
              <Field label="Additional Description">
                <textarea
                  value={form.additionalDescription}
                  onChange={(e) => onChange("additionalDescription", e.target.value)}
                  placeholder="Enter any additional details or notes..."
                  rows={3}
                />
              </Field>
            </div>
          </div>

          <div className="form-actions">
            <button className="primary-btn form-submit-btn" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Return Request"}
            </button>
            {message && <p className={`form-message ${message.includes("successfully") ? "success" : "error"}`}>{message}</p>}
          </div>
        </form>
      </div>
    </section>
  );
};

export default ReturnPage;
