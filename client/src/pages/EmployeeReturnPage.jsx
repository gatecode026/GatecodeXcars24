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
  pincode: "",
  productType: "GPS",
  numberOfUnitsReturning: "",
  returnReason: "Product Damaged",
  customReason: "",
  additionalDescription: "",
};

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  }).format(new Date(dateString));
};

const statusBadge = (status) => {
  const colors = {
    "Return Requested": "var(--warning)", "Return Approved": "var(--primary)",
    "Pickup Scheduled": "var(--primary)", "Returned Successfully": "var(--success)",
    "Return Rejected": "var(--danger)",
  };
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11,
      fontWeight: 600, background: `${colors[status] || "#666"}22`,
      color: colors[status] || "#666", border: `1px solid ${colors[status] || "#666"}44`,
      whiteSpace: "nowrap",
    }}>{status}</span>
  );
};

const downloadReturnsPDF = (returns) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Recent Returns Report", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")} | Total Returns: ${returns.length}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [["Customer Name", "Mobile Number", "Product", "Units", "Reason", "Status", "Date"]],
    body: returns.map((r) => [
      r.customerName || "-",
      r.mobileNumber || "-",
      r.productType || "-",
      r.numberOfUnitsReturning || 0,
      r.returnReason + (r.returnReason === "Other" && r.customReason ? `: ${r.customReason}` : ""),
      r.returnStatus || "-",
      r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "-"
    ]),
    headStyles: { fillColor: [139, 92, 246], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    styles: { cellPadding: 2 }
  });

  doc.save("Returns_Report.pdf");
};

const EmployeeReturnPage = () => {
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
  const [viewReturn, setViewReturn] = useState(null);
  const [recentReturns, setRecentReturns] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [returnSearch, setReturnSearch] = useState("");
  const [returnDateFrom, setReturnDateFrom] = useState("");
  const [returnDateTo, setReturnDateTo] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("today");

  const filteredReturns = useMemo(() => {
    let list = recentReturns;
    if (returnSearch.trim()) {
      const q = returnSearch.trim().toLowerCase();
      list = list.filter((r) => r.customerName?.toLowerCase().includes(q) || r.mobileNumber?.includes(q));
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (dateFilter === "today") {
      list = list.filter((r) => {
        const d = new Date(r.createdAt);
        return d >= startOfToday && d <= endOfToday;
      });
    } else if (dateFilter === "yesterday") {
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const endOfYesterday = new Date(endOfToday);
      endOfYesterday.setDate(endOfYesterday.getDate() - 1);
      list = list.filter((r) => {
        const d = new Date(r.createdAt);
        return d >= startOfYesterday && d <= endOfYesterday;
      });
    } else if (dateFilter === "week") {
      const startOfWeek = new Date(startOfToday);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      list = list.filter((r) => {
        const d = new Date(r.createdAt);
        return d >= startOfWeek && d <= endOfToday;
      });
    } else if (dateFilter === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      list = list.filter((r) => {
        const d = new Date(r.createdAt);
        return d >= startOfMonth && d <= endOfToday;
      });
    } else if (dateFilter === "custom") {
      if (returnDateFrom) {
        const from = new Date(returnDateFrom);
        from.setHours(0, 0, 0, 0);
        list = list.filter((r) => new Date(r.createdAt) >= from);
      }
      if (returnDateTo) {
        const to = new Date(returnDateTo);
        to.setHours(23, 59, 59, 999);
        list = list.filter((r) => new Date(r.createdAt) <= to);
      }
    }
    return list;
  }, [recentReturns, returnSearch, dateFilter, returnDateFrom, returnDateTo]);

  const sanitizeDigits = (value, max) => value.replace(/\D/g, "").slice(0, max);
  const sanitizeLetters = (value) => value.replace(/[^a-zA-Z\s]/g, "");
  const preventNonNumericKey = (e) => {
    if (e.ctrlKey || e.metaKey) return;
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
    if (Object.keys(next).length) {
      setTimeout(() => document.querySelector(".field-invalid")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    }
    return Object.keys(next).length === 0;
  };

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const clearToast = useCallback(() => setToast(null), []);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await api.get("/employee/returns");
      setRecentReturns(res.data?.data || []);
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

  const handleEditReturn = (r) => {
    setForm({
      customerName: r.customerName || "",
      mobileNumber: r.mobileNumber || "",
      pincode: r.pincode || "",
      productType: r.productType || "GPS",
      numberOfUnitsReturning: r.numberOfUnitsReturning || "",
      returnReason: r.returnReason || "Product Damaged",
      customReason: r.customReason || "",
      additionalDescription: r.additionalDescription || "",
    });
    setEditingId(r._id);
    setIsFormOpen(true);
  };

  const handleDeleteReturn = async (r) => {
    if (!window.confirm(`Delete return request for "${r.customerName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/employee/returns/${r._id}`);
      setToast("Return deleted successfully!");
      fetchRecent();
    } catch {
      setToast("Failed to delete return");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      if (editingId) {
        await api.put(`/employee/returns/${editingId}`, {
          ...form,
          numberOfUnitsReturning: Number(form.numberOfUnitsReturning),
        });
        setToast("Return updated successfully!");
      } else {
        await api.post("/returns", { ...form, numberOfUnitsReturning: Number(form.numberOfUnitsReturning) });
        setToast("Return request submitted successfully!");
      }
      setForm(initialState);
      setEditingId(null);
      setErrors({});
      setIsFormOpen(false);
      fetchRecent();
    } catch (error) {
      setToast(error.response?.data?.message || "Failed to submit return request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-page">
      <div className="form-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2>Returns</h2>
          <p className="form-subtitle">View and manage your return requests</p>
        </div>
        <button
          className="primary-btn"
          onClick={() => {
            setForm(initialState);
            setEditingId(null);
            setErrors({});
            setIsFormOpen(true);
          }}
        >
          + Create Return
        </button>
      </div>

      {isFormOpen && (
        <div className="modal-overlay" onClick={() => { setIsFormOpen(false); setForm(initialState); setEditingId(null); setErrors({}); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 className="modal-title" style={{ margin: 0 }}>{editingId ? "Edit Return" : "Create New Return"}</h3>
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
                  {loading ? "Submitting..." : editingId ? "Update Return" : "Submit Return Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toast && <Toast message={toast} type={toast.includes("successfully") ? "success" : "error"} onClose={clearToast} />}

      {viewReturn && (
        <div className="modal-overlay" onClick={() => setViewReturn(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <h3 className="modal-title">View Return Details</h3>
            <div className="modal-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", maxHeight: "60vh", overflowY: "auto", paddingRight: "8px" }}>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Customer Name</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewReturn.customerName || "-"}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Mobile Number</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewReturn.mobileNumber || "-"}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Pincode</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewReturn.pincode || "-"}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Product Type</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewReturn.productType || "-"}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Units Returning</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewReturn.numberOfUnitsReturning || 0}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Return Reason</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewReturn.returnReason || "-"}</div>
              </div>
              {viewReturn.returnReason === "Other" && (
                <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Custom Reason</span>
                  <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewReturn.customReason || "-"}</div>
                </div>
              )}
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Return Status</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewReturn.returnStatus || "-"}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Date</span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{formatDateTime(viewReturn.createdAt)}</div>
              </div>
              <div className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px", gridColumn: "1 / -1" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Additional Description</span>
                <div style={{ fontSize: "14px", color: "var(--text)", fontWeight: 500, whiteSpace: "pre-wrap" }}>{viewReturn.additionalDescription || "-"}</div>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: "24px" }}>
              <button className="primary-btn" onClick={() => setViewReturn(null)}>Close</button>
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
              value={returnDateFrom}
              max={today}
              onChange={(e) => {
                const val = e.target.value;
                setReturnDateFrom(val);
                if (returnDateTo && val > returnDateTo) {
                  setReturnDateTo("");
                }
              }}
              style={{ width: "auto", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, outline: "none", background: "rgba(255,255,255,0.05)", color: "var(--text)" }}
            />
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>to</span>
            <input
              type="date"
              value={returnDateTo}
              min={returnDateFrom}
              max={today}
              onChange={(e) => setReturnDateTo(e.target.value)}
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
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-heading)" }}>Recent Returns</h3>
          <button
            className="primary-btn"
            onClick={() => downloadReturnsPDF(filteredReturns)}
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
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No matching returns</td></tr>
                ) : (
                  filteredReturns.map((r) => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600 }}>{r.customerName}</td>
                      <td>{r.mobileNumber}</td>
                      <td>{r.productType}</td>
                      <td>{r.numberOfUnitsReturning}</td>
                      <td style={{ fontSize: 12 }}>{r.returnReason}{r.returnReason === "Other" && r.customReason ? `: ${r.customReason}` : ""}</td>
                      <td>{statusBadge(r.returnStatus)}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDateTime(r.createdAt)}</td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center" }}>
                          <button
                            title="View Details"
                            onClick={() => setViewReturn(r)}
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
                            onClick={() => handleEditReturn(r)}
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
                            onClick={() => handleDeleteReturn(r)}
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

export default EmployeeReturnPage;
