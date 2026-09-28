import { useMemo, useState, useCallback, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api, toAbsoluteAssetUrl } from "../api/client";
import Field from "../components/Field";
import Toast from "../components/Toast";
import { isValidMobile, isValidPincode } from "../utils/validators";

const initialState = {
  customerName: "",
  mobileNumber: "",
  alternateMobileNumber: "",
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

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  }).format(new Date(dateString));
};

const downloadOrdersPDF = (orders) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Recent Orders Report", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")} | Total Orders: ${orders.length}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [["Customer Name", "Mobile Number", "Product", "Units", "Total Amount", "Status", "Date"]],
    body: orders.map((o) => [
      o.customerName || "-",
      o.mobileNumber || "-",
      o.productType === "Custom" ? o.customProductName : o.productType,
      o.numberOfUnits || 0,
      `Rs. ${o.totalAmount || 0}`,
      o.orderStatus || "-",
      o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "-"
    ]),
    headStyles: { fillColor: [139, 92, 246], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    styles: { cellPadding: 2 }
  });

  doc.save("Orders_Report.pdf");
};

const EmployeeOrderPage = () => {
  const today = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadState, setUploadState] = useState("");
  const [recentOrders, setRecentOrders] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("today");

  const filteredOrders = useMemo(() => {
    let list = recentOrders;
    if (orderSearch.trim()) {
      const q = orderSearch.trim().toLowerCase();
      list = list.filter((o) => o.customerName?.toLowerCase().includes(q) || o.mobileNumber?.includes(q));
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (dateFilter === "today") {
      list = list.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= startOfToday && d <= endOfToday;
      });
    } else if (dateFilter === "yesterday") {
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const endOfYesterday = new Date(endOfToday);
      endOfYesterday.setDate(endOfYesterday.getDate() - 1);
      list = list.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= startOfYesterday && d <= endOfYesterday;
      });
    } else if (dateFilter === "week") {
      const startOfWeek = new Date(startOfToday);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      list = list.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= startOfWeek && d <= endOfToday;
      });
    } else if (dateFilter === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      list = list.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= startOfMonth && d <= endOfToday;
      });
    } else if (dateFilter === "custom") {
      if (orderDateFrom) {
        const from = new Date(orderDateFrom);
        from.setHours(0, 0, 0, 0);
        list = list.filter((o) => new Date(o.createdAt) >= from);
      }
      if (orderDateTo) {
        const to = new Date(orderDateTo);
        to.setHours(23, 59, 59, 999);
        list = list.filter((o) => new Date(o.createdAt) <= to);
      }
    }
    return list;
  }, [recentOrders, orderSearch, dateFilter, orderDateFrom, orderDateTo]);

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
    if (e.ctrlKey || e.metaKey) return;
    if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const validate = (candidate = form) => {
    const next = {};
    if (!candidate.customerName.trim()) next.customerName = "Customer name is required";
    if (!isValidMobile(candidate.mobileNumber)) next.mobileNumber = "Enter valid 10-digit mobile number";
    if (candidate.alternateMobileNumber && !isValidMobile(candidate.alternateMobileNumber)) next.alternateMobileNumber = "Enter valid 10-digit number";
    if (!candidate.fullAddress.trim()) next.fullAddress = "Address is required";
    if (!isValidPincode(candidate.pincode)) next.pincode = "Enter valid 6-digit pincode";
    if (candidate.productType === "Other" && !candidate.customProductName.trim()) {
      next.customProductName = "Custom product name is required";
    }
    if (!candidate.bankName) next.bankName = "Bank name is required";
    if (!candidate.numberOfUnits || Number(candidate.numberOfUnits) <= 0) next.numberOfUnits = "Units must be > 0";
    if (candidate.amount === "" || Number(candidate.amount) < 0) next.amount = "Amount must be positive";
    if (candidate.advanceAmount === "" || Number(candidate.advanceAmount) < 0) {
      next.advanceAmount = "Advance must be positive";
    } else if (Number(candidate.advanceAmount) > totalAmount) {
      next.advanceAmount = "Advance amount cannot exceed total amount";
    }
    setErrors(next);
    if (Object.keys(next).length) {
      setTimeout(() => document.querySelector(".field-invalid")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    }
    return Object.keys(next).length === 0;
  };

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
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

  const clearToast = useCallback(() => setToast(null), []);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await api.get("/employee/orders");
      setRecentOrders(res.data?.data || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { fetchRecent(); }, [fetchRecent]);

  useEffect(() => {
    if (isFormOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFormOpen]);

  const handleEditOrder = (order) => {
    setForm({
      customerName: order.customerName || "",
      mobileNumber: order.mobileNumber || "",
      alternateMobileNumber: order.alternateMobileNumber || "",
      fullAddress: order.fullAddress || "",
      pincode: order.pincode || "",
      productType: order.productType || "GPS",
      customProductName: order.customProductName || "",
      numberOfUnits: order.numberOfUnits || "",
      amount: order.amount || "",
      advanceAmount: order.advanceAmount || "",
      description: order.description || "",
      parcelStatus: order.parcelStatus || "Pending",
      trackingId: order.trackingId || "",
      courierCompany: order.courierCompany || "",
      bankName: order.bankName || "",
      orderStatus: order.orderStatus || "Pending",
    });
    setEditingId(order._id);
    setIsFormOpen(true);
  };

  const handleDeleteOrder = async (order) => {
    if (!window.confirm(`Delete order for "${order.customerName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/employee/orders/${order._id}`);
      setToast("Order deleted successfully!");
      fetchRecent();
    } catch {
      setToast("Failed to delete order");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const payload = new FormData();
      payload.append("customerName", form.customerName);
      payload.append("mobileNumber", form.mobileNumber);
      if (form.alternateMobileNumber) payload.append("alternateMobileNumber", form.alternateMobileNumber);
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
      if (editingId) {
        await api.put(`/employee/orders/${editingId}`, {
          customerName: form.customerName,
          mobileNumber: form.mobileNumber,
          alternateMobileNumber: form.alternateMobileNumber,
          fullAddress: form.fullAddress,
          pincode: form.pincode,
          productType: form.productType,
          customProductName: form.customProductName,
          numberOfUnits: Number(form.numberOfUnits),
          amount: Number(form.amount),
          totalAmount,
          advanceAmount: Number(form.advanceAmount),
          description: form.description,
          parcelStatus: form.parcelStatus,
          trackingId: form.trackingId,
          courierCompany: form.courierCompany,
          bankName: form.bankName,
          orderStatus: form.orderStatus,
        });
        setToast("Order updated successfully!");
      } else {
        await api.post("/orders", payload);
        setToast("Order submitted successfully!");
      }
      setForm(initialState);
      setEditingId(null);
      setErrors({});
      setIsFormOpen(false);
      setPaymentFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      setUploadState("");
      fetchRecent();
    } catch (error) {
      setToast(error.response?.data?.message || "Failed to submit order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-page">
      <div className="form-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2>Orders</h2>
          <p className="form-subtitle">View and manage your order submissions</p>
        </div>
        <button
          className="primary-btn"
          onClick={() => {
            setForm(initialState);
            setEditingId(null);
            setErrors({});
            setPaymentFile(null);
            setPreviewUrl("");
            setUploadState("");
            setIsFormOpen(true);
          }}
        >
          + Create Order
        </button>
      </div>

      {isFormOpen && (
        <div className="modal-overlay" onClick={() => { setIsFormOpen(false); setForm(initialState); setEditingId(null); setErrors({}); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 className="modal-title" style={{ margin: 0 }}>{editingId ? "Edit Order" : "Create New Order"}</h3>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setIsFormOpen(false);
                  setForm(initialState);
                  setEditingId(null);
                  setErrors({});
                }}
                style={{ padding: "6px 14px", fontSize: 12 }}
              >
                Close
              </button>
            </div>
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
                  <Field label="Alternate Mobile (Optional)" error={errors.alternateMobileNumber}>
                    <input
                      className={getFieldClass("alternateMobileNumber")}
                      placeholder="10-digit number"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.alternateMobileNumber}
                      onKeyDown={preventNonNumericKey}
                      onChange={(e) => onChange("alternateMobileNumber", sanitizeDigits(e.target.value, 10))}
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
                  <Field label="Bank Name" error={errors.bankName}>
                    <select className={getFieldClass("bankName")} value={form.bankName} onChange={(e) => onChange("bankName", e.target.value)}>
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
                  {editingId && (
                    <Field label="Order Status">
                      <select value={form.orderStatus} onChange={(e) => onChange("orderStatus", e.target.value)}>
                        <option>Pending</option>
                        <option>Approved</option>
                        <option>Processing</option>
                        <option>Delivered</option>
                        <option>Cancelled</option>
                      </select>
                    </Field>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button className="primary-btn form-submit-btn" type="submit" disabled={loading}>
                  {loading ? "Submitting..." : editingId ? "Update Order" : "Submit Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toast && <Toast message={toast} type={toast.includes("successfully") ? "success" : "error"} onClose={clearToast} />}

      {viewOrder && (
        <div className="modal-overlay" onClick={() => setViewOrder(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <h3 className="modal-title">View Order Details</h3>
            <div className="modal-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", maxHeight: "60vh", overflowY: "auto", paddingRight: "8px" }}>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Customer Name</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.customerName || "-"}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Mobile Number</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.mobileNumber || "-"}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Alternate Mobile</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.alternateMobileNumber || "-"}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Full Address</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.fullAddress || "-"}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Pincode</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.pincode || "-"}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Product Type</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.productType || "-"}</div>
              </div>
              {viewOrder.productType === "Other" && (
                <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Custom Product Name</span>
                  <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.customProductName || "-"}</div>
                </div>
              )}
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Units</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.numberOfUnits || 0}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Amount per Unit</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>Rs.{viewOrder.amount || 0}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Total Amount</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>Rs.{viewOrder.totalAmount || 0}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Advance Amount</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>Rs.{viewOrder.advanceAmount || 0}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Date</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{formatDateTime(viewOrder.createdAt)}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Order Status</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.orderStatus || "-"}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Parcel Status</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.parcelStatus || "-"}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Tracking ID</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.trackingId || "-"}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Courier Company</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.courierCompany || "-"}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Bank Name</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.bankName || "-"}</div>
              </div>
              {viewOrder.paymentScreenshot && (
                <div style={{ gridColumn: "1 / -1", marginTop: "12px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Payment Screenshot</span>
                  <div style={{ display: "flex", justifyContent: "center", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "12px", border: "1px solid var(--border)" }}>
                    <a href={toAbsoluteAssetUrl(viewOrder.paymentScreenshot)} target="_blank" rel="noreferrer">
                      <img
                        src={toAbsoluteAssetUrl(viewOrder.paymentScreenshot)}
                        alt="Payment Screenshot"
                        style={{ maxWidth: "100%", maxHeight: "250px", objectFit: "contain", borderRadius: "4px" }}
                      />
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions" style={{ marginTop: "24px" }}>
              <button className="primary-btn" onClick={() => setViewOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Date Filters Container - Outside of Table Card */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <button
          className="primary-btn"
          onClick={() => setDateFilter("today")}
          style={{
            background: dateFilter === "today" ? "var(--primary)" : "var(--bg-card)",
            border: "1px solid var(--border)",
            color: dateFilter === "today" ? "#fff" : "var(--text)",
            padding: "8px 16px", fontSize: 13, cursor: "pointer"
          }}
        >
          Today
        </button>
        <button
          className="primary-btn"
          onClick={() => setDateFilter("yesterday")}
          style={{
            background: dateFilter === "yesterday" ? "var(--primary)" : "var(--bg-card)",
            border: "1px solid var(--border)",
            color: dateFilter === "yesterday" ? "#fff" : "var(--text)",
            padding: "8px 16px", fontSize: 13, cursor: "pointer"
          }}
        >
          Yesterday
        </button>
        <button
          className="primary-btn"
          onClick={() => setDateFilter("week")}
          style={{
            background: dateFilter === "week" ? "var(--primary)" : "var(--bg-card)",
            border: "1px solid var(--border)",
            color: dateFilter === "week" ? "#fff" : "var(--text)",
            padding: "8px 16px", fontSize: 13, cursor: "pointer"
          }}
        >
          This Week
        </button>
        <button
          className="primary-btn"
          onClick={() => setDateFilter("month")}
          style={{
            background: dateFilter === "month" ? "var(--primary)" : "var(--bg-card)",
            border: "1px solid var(--border)",
            color: dateFilter === "month" ? "#fff" : "var(--text)",
            padding: "8px 16px", fontSize: 13, cursor: "pointer"
          }}
        >
          This Month
        </button>
        <button
          className="primary-btn"
          onClick={() => setDateFilter("custom")}
          style={{
            background: dateFilter === "custom" ? "var(--primary)" : "var(--bg-card)",
            border: "1px solid var(--border)",
            color: dateFilter === "custom" ? "#fff" : "var(--text)",
            padding: "8px 16px", fontSize: 13, cursor: "pointer"
          }}
        >
          Custom Range
        </button>

        {dateFilter === "custom" && (
          <>
            <input
              type="date"
              value={orderDateFrom}
              max={today}
              onChange={(e) => {
                const val = e.target.value;
                setOrderDateFrom(val);
                if (orderDateTo && val > orderDateTo) {
                  setOrderDateTo("");
                }
              }}
              style={{ width: "auto", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, outline: "none", background: "rgba(255,255,255,0.05)", color: "var(--text)" }}
            />
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>to</span>
            <input
              type="date"
              value={orderDateTo}
              min={orderDateFrom}
              max={today}
              onChange={(e) => setOrderDateTo(e.target.value)}
              style={{ width: "auto", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, outline: "none", background: "rgba(255,255,255,0.05)", color: "var(--text)" }}
            />
          </>
        )}

        <button
          className="primary-btn"
          onClick={fetchRecent}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            marginLeft: "auto"
          }}
        >
          Refresh
        </button>
      </div>

      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-heading)" }}>Recent Orders</h3>
          <button
            className="primary-btn"
            onClick={() => downloadOrdersPDF(filteredOrders)}
            style={{ background: "#10b981", padding: "8px 16px", fontSize: 13 }}
          >
            ⬇ Download PDF
          </button>
        </div>
          
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>Product</th>
                  <th>Units</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No matching orders</td></tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o._id}>
                      <td style={{ fontWeight: 600 }}>{o.customerName}</td>
                      <td>{o.mobileNumber}</td>
                      <td>{o.productType}</td>
                      <td>{o.numberOfUnits}</td>
                      <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(o.totalAmount || 0))}
                      </td>
                      <td><span className="status-badge" style={{ background: "rgba(6,182,212,0.12)", color: "var(--primary)" }}>{o.orderStatus}</span></td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDateTime(o.createdAt)}</td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center" }}>
                          <button
                            title="View Details"
                            onClick={() => setViewOrder(o)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "6px",
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#06b6d4"
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button
                            title="Edit"
                            onClick={() => handleEditOrder(o)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "6px",
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#f59e0b"
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                            </svg>
                          </button>
                          <button
                            title="Delete"
                            onClick={() => handleDeleteOrder(o)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "6px",
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ef4444"
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </section>
  );
};

export default EmployeeOrderPage;
