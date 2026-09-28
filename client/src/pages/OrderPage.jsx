import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Field from "../components/Field";
import { isValidMobile, isValidPincode } from "../utils/validators";

const initialState = {
  customerName: "",
  mobileNumber: "",
  fullAddress: "",
  pincode: "",
  productType: "GPS",
  customProductName: "",
  numberOfUnits: "",
  amount: "",
  advanceAmount: "",
  description: "",
  parcelStatus: "Pending",
  trackingId: "",
  courierCompany: "",
  bankName: "",
};

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
const maxFileSize = 2 * 1024 * 1024;

const OrderPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentFile, setPaymentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadState, setUploadState] = useState("");

  const totalAmount = useMemo(() => {
    const units = Number(form.numberOfUnits || 0);
    const amount = Number(form.amount || 0);
    return units * amount;
  }, [form.numberOfUnits, form.amount]);

  const incentive = useMemo(() => {
    const units = Number(form.numberOfUnits || 0);
    const amount = Number(form.amount || 0);
    if (amount <= 3200) return amount * 0.0225 * units;
    return (amount - 3200) * units;
  }, [form.numberOfUnits, form.amount]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const getFieldClass = (key) => {
    if (!form[key]) return "";
    return errors[key] ? "field-invalid" : "field-valid";
  };

  const sanitizeDigits = (value, max) => value.replace(/\D/g, "").slice(0, max);
  const sanitizeLetters = (value) => value.replace(/[^a-zA-Z\s]/g, "");
  const sanitizePositiveNumber = (value) => {
    if (value === "") return "";
    return value.replace(/[^\d.]/g, "").replace(/^0+(?=\d)/, "");
  };

  const preventNonNumericKey = (e) => {
    if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const validate = (candidate = form) => {
    const next = {};
    if (!candidate.customerName.trim()) next.customerName = "Customer name is required";
    if (!isValidMobile(candidate.mobileNumber)) next.mobileNumber = "Enter valid 10-digit mobile number";
    if (!candidate.fullAddress.trim()) next.fullAddress = "Address is required";
    if (!isValidPincode(candidate.pincode)) next.pincode = "Enter valid 6-digit pincode";
    if (candidate.productType === "Other" && !candidate.customProductName.trim()) {
      next.customProductName = "Custom product name is required";
    }
    if (!candidate.numberOfUnits || Number(candidate.numberOfUnits) <= 0) next.numberOfUnits = "Units must be > 0";
    if (candidate.amount === "" || Number(candidate.amount) < 0) next.amount = "Amount must be positive";
    if (candidate.advanceAmount === "" || Number(candidate.advanceAmount) < 0) {
      next.advanceAmount = "Advance must be positive";
    } else if (Number(candidate.advanceAmount) > totalAmount) {
      next.advanceAmount = "Advance amount cannot exceed total amount";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleScreenshot = (file) => {
    setUploadState("");
    if (!file) return;
    if (!allowedImageTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, paymentScreenshot: "Only JPG, JPEG and PNG allowed" }));
      return;
    }
    if (file.size > maxFileSize) {
      setErrors((prev) => ({ ...prev, paymentScreenshot: "File size must be <= 2MB" }));
      return;
    }
    setErrors((prev) => ({ ...prev, paymentScreenshot: "" }));
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPaymentFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadState("Upload ready");
  };

  const removeScreenshot = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPaymentFile(null);
    setPreviewUrl("");
    setUploadState("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!validate()) return;
    try {
      setLoading(true);
      const payload = new FormData();
      payload.append("customerName", form.customerName);
      payload.append("mobileNumber", form.mobileNumber);
      payload.append("fullAddress", form.fullAddress);
      payload.append("pincode", form.pincode);
      payload.append("productType", form.productType);
      payload.append("customProductName", form.customProductName);
      payload.append("numberOfUnits", String(Number(form.numberOfUnits)));
      payload.append("amount", String(Number(form.amount)));
      payload.append("totalAmount", String(totalAmount));
      payload.append("advanceAmount", String(Number(form.advanceAmount)));
      payload.append("description", form.description);
      payload.append("parcelStatus", form.parcelStatus);
      payload.append("trackingId", form.trackingId);
      payload.append("courierCompany", form.courierCompany);
      payload.append("bankName", form.bankName);
      if (paymentFile) payload.append("paymentScreenshot", paymentFile);
      await api.post("/orders", payload);
      navigate("/admin/orders/manage", { replace: true });
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to submit order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-page">
      <div className="form-head">
        <div>
          <h2>Create New Order</h2>
          <p className="form-subtitle">Fill in the order details below</p>
        </div>
      </div>

      <div className="form-card glass-card">
        <form className="modern-form" onSubmit={onSubmit}>
          <div className="form-section">
            <h3 className="form-section-title">Customer Information</h3>
            <div className="form-section-content">
              <Field label="Customer Name" error={errors.customerName}>
                <input
                  className={getFieldClass("customerName")}
                  placeholder="Enter customer name"
                  value={form.customerName}
                  onChange={(e) => onChange("customerName", sanitizeLetters(e.target.value))}
                />
              </Field>
              <Field label="Mobile Number" error={errors.mobileNumber}>
                <input
                  className={getFieldClass("mobileNumber")}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.mobileNumber}
                  onKeyDown={preventNonNumericKey}
                  onChange={(e) => onChange("mobileNumber", sanitizeDigits(e.target.value, 10))}
                />
              </Field>
              <Field label="Full Address" error={errors.fullAddress}>
                <textarea
                  className={getFieldClass("fullAddress")}
                  placeholder="Enter complete address"
                  value={form.fullAddress}
                  onChange={(e) => onChange("fullAddress", e.target.value)}
                />
              </Field>
              <Field label="Pincode" error={errors.pincode}>
                <input
                  className={getFieldClass("pincode")}
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
            <h3 className="form-section-title">Product Information</h3>
            <div className="form-section-content">
              <Field label="Product Type">
                <select value={form.productType} onChange={(e) => onChange("productType", e.target.value)}>
                  <option>GPS</option>
                  <option>Vending Machine</option>
                  <option>Disposal</option>
                  <option>Other</option>
                </select>
              </Field>
              {form.productType === "Other" && (
                <Field label="Custom Product Name" error={errors.customProductName}>
                  <input
                    className={getFieldClass("customProductName")}
                    placeholder="Enter product name"
                    value={form.customProductName}
                    onChange={(e) => onChange("customProductName", e.target.value)}
                  />
                </Field>
              )}
              <Field label="Number of Units" error={errors.numberOfUnits}>
                <input
                  className={getFieldClass("numberOfUnits")}
                  placeholder="How many units?"
                  inputMode="numeric"
                  value={form.numberOfUnits}
                  onKeyDown={preventNonNumericKey}
                  onChange={(e) => onChange("numberOfUnits", sanitizeDigits(e.target.value, 6))}
                />
              </Field>
              <Field label="Amount per Unit" error={errors.amount}>
                <input
                  className={getFieldClass("amount")}
                  placeholder="Enter amount"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => onChange("amount", sanitizePositiveNumber(e.target.value))}
                />
              </Field>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Order Summary</h3>
            <div className="form-section-content">
              <Field label="Total Amount">
                <input readOnly value={formatCurrency(totalAmount)} className="readonly-input summary-value" />
              </Field>
              <Field label="Incentive">
                <input readOnly value={formatCurrency(incentive)} className="readonly-input summary-value" />
              </Field>
              <Field label="Advance Amount" error={errors.advanceAmount}>
                <input
                  className={getFieldClass("advanceAmount")}
                  placeholder="Enter advance amount"
                  inputMode="decimal"
                  value={form.advanceAmount}
                  onChange={(e) => onChange("advanceAmount", sanitizePositiveNumber(e.target.value))}
                />
              </Field>
              <Field label="Remaining Amount">
                <input readOnly value={formatCurrency(Math.max(0, totalAmount - Number(form.advanceAmount || 0)))} className="readonly-input summary-value" />
              </Field>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Additional Details</h3>
            <div className="form-section-content">
              <Field label="Bank Name">
                <select value={form.bankName} onChange={(e) => onChange("bankName", e.target.value)}>
                  <option value="">Select Bank</option>
                  <option value="SBI">SBI</option>
                  <option value="BOB">BOB</option>
                  <option value="BOM">BOM</option>
                  <option value="MGB">MGB</option>
                  <option value="UPGB">UPGB</option>
                  <option value="MPGB">MPGB</option>
                </select>
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => onChange("description", e.target.value)}
                  placeholder="Enter any additional order details or notes..."
                  rows={3}
                />
              </Field>
              <Field label="Parcel Status">
                <select value={form.parcelStatus} onChange={(e) => onChange("parcelStatus", e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Process">Process</option>
                  <option value="Parcel">Parcel</option>
                  <option value="Packed">Packed</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </Field>
              <Field label="Tracking ID">
                <input
                  placeholder="Enter tracking ID"
                  value={form.trackingId}
                  onChange={(e) => onChange("trackingId", e.target.value)}
                />
              </Field>
              <Field label="Courier Company">
                <input
                  placeholder="Enter courier company name"
                  value={form.courierCompany}
                  onChange={(e) => onChange("courierCompany", e.target.value)}
                />
              </Field>
              <Field label="Payment Screenshot (Optional)" error={errors.paymentScreenshot}>
                <div className={`upload-box ${errors.paymentScreenshot ? "upload-error" : paymentFile ? "upload-ok" : ""}`}>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(e) => handleScreenshot(e.target.files?.[0])}
                  />
                  <p>Upload JPG, JPEG, PNG (max 2MB)</p>
                  {uploadState && <small className="upload-state">{uploadState}</small>}
                </div>
                {previewUrl && (
                  <div className="upload-preview">
                    <img src={previewUrl} alt="Payment preview" />
                    <button type="button" onClick={removeScreenshot}>Remove</button>
                  </div>
                )}
              </Field>
            </div>
          </div>

          <div className="form-actions">
            <button className="primary-btn form-submit-btn" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>
            {message && <p className={`form-message ${message.includes("successfully") ? "success" : "error"}`}>{message}</p>}
          </div>
        </form>
      </div>
    </section>
  );
};

export default OrderPage;
