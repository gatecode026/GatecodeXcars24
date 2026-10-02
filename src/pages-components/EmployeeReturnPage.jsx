"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import { getPdfDoc } from "../utils/pdfExport";
import { api, toAbsoluteAssetUrl, emitDataSync, onDataSync } from "../api/client";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import CsvImportModal from "../components/CsvImportModal";
import { exportTableToCsv } from "../utils/csvHelper";
import { isValidMobile, isValidPincode } from "../utils/validators";

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

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
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(dateString));
};

const statusBadge = (status) => {
  const styles = {
    "Return Requested": { bg: "#fef3c7", text: "#d97706", border: "#fde68a" },
    "Return Approved": { bg: "#e0f2fe", text: "#0284c7", border: "#bae6fd" },
    "Pickup Scheduled": { bg: "#ede9fe", text: "#7c3aed", border: "#ddd6fe" },
    "Returned Successfully": { bg: "#dcfce7", text: "#16a34a", border: "#bbf7d0" },
    "Return Rejected": { bg: "#fee2e2", text: "#dc2626", border: "#fecaca" },
  };
  const current = styles[status] || { bg: "#f1f5f9", text: "#64748b", border: "#e2e8f0" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        background: current.bg,
        color: current.text,
        border: `1px solid ${current.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {status || "Return Requested"}
    </span>
  );
};

const downloadReturnsPDF = async (returns) => {
  const { doc, autoTable } = await getPdfDoc({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("GatecodeXcars24 — Returns Report", pageWidth / 2, y, { align: "center" });
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
      r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "-",
    ]),
    headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    styles: { cellPadding: 2 },
  });

  doc.save(`Returns_Report_${new Date().toISOString().split("T")[0]}.pdf`);
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deleteConfirmReturn, setDeleteConfirmReturn] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewReturn, setViewReturn] = useState(null);
  const [recentReturns, setRecentReturns] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [returnSearch, setReturnSearch] = useState("");
  const [returnDateFrom, setReturnDateFrom] = useState("");
  const [returnDateTo, setReturnDateTo] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("today");
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const fetchRecent = useCallback(async (isBackground = false, force = false) => {
    try {
      if (!isBackground) setInitialLoading(true);
      const res = await api.get("/employee/returns", force ? { forceRefresh: true } : {});
      setRecentReturns(res.data?.data || []);
    } catch {
      // silent
    } finally {
      if (!isBackground) setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent(false);
    // Background polling every 8 seconds for real-time live data
    const interval = setInterval(() => {
      fetchRecent(true);
    }, 8000);
    const onFocus = () => fetchRecent(true);
    window.addEventListener("focus", onFocus);

    const unsub = onDataSync((evt) => {
      if (evt?.type === "return") {
        fetchRecent(true, true);
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      unsub();
    };
  }, [fetchRecent]);

  useEffect(() => {
    if (isFormOpen || viewReturn) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isFormOpen, viewReturn]);

  const filteredReturns = useMemo(() => {
    let list = recentReturns;
    if (returnSearch.trim()) {
      const q = returnSearch.trim().toLowerCase();
      list = list.filter((r) => r.customerName?.toLowerCase().includes(q) || r.mobileNumber?.includes(q) || r.productType?.toLowerCase().includes(q));
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
    return Object.keys(next).length === 0;
  };

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const clearToast = useCallback(() => setToast(null), []);

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

  const handleDeleteReturn = (r) => {
    setDeleteConfirmReturn(r);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmReturn) return;
    const r = deleteConfirmReturn;
    setDeleting(true);
    // Immediately remove from state without reload
    setRecentReturns((prev) => prev.filter((ret) => ret._id !== r._id));
    try {
      await api.delete(`/employee/returns/${r._id}`);
      setToast("Return deleted successfully!");
      emitDataSync({ type: "return", action: "delete", id: r._id });
      setDeleteConfirmReturn(null);
      fetchRecent(true);
    } catch {
      fetchRecent(true);
      setToast("Failed to delete return");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (!filteredReturns || filteredReturns.length === 0) {
      setToast("No return records available to export");
      return;
    }
    const headers = [
      "Customer Name",
      "Mobile Number",
      "Pincode",
      "Product Type",
      "Units Returning",
      "Return Reason",
      "Additional Description",
      "Return Status",
      "Date",
    ];
    const rows = filteredReturns.map((r) => [
      r.customerName || "-",
      r.mobileNumber || "-",
      r.pincode || "-",
      r.productType || "-",
      r.numberOfUnitsReturning || 1,
      r.returnReason || "-",
      r.additionalDescription || "-",
      r.returnStatus || "Return Requested",
      r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "-",
    ]);
    exportTableToCsv(`Returns_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
    setToast("Returns exported to CSV");
  };

  const handleImportReturns = async (rows) => {
    for (const r of rows) {
      const customerName = r["Customer Name"] || r["customerName"];
      const mobileNumber = r["Mobile Number"] || r["mobileNumber"];
      if (!customerName || !mobileNumber) continue;
      try {
        await api.post("/returns", {
          customerName,
          mobileNumber,
          pincode: r["Pincode"] || r["pincode"] || "110001",
          productType: r["Product Type"] || r["productType"] || "GPS",
          numberOfUnitsReturning: Number(r["Units Returning"] || r["numberOfUnitsReturning"]) || 1,
          returnReason: r["Return Reason"] || r["returnReason"] || "Product Damaged",
          additionalDescription: r["Additional Description"] || r["additionalDescription"] || "",
        });
      } catch (_) {}
    }
    setToast("Processed CSV return requests");
    emitDataSync({ type: "return", action: "bulk" });
    fetchRecent(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      if (editingId) {
        const res = await api.put(`/employee/returns/${editingId}`, {
          ...form,
          numberOfUnitsReturning: Number(form.numberOfUnitsReturning),
        });
        const updated = res.data?.data;
        if (updated) {
          setRecentReturns((prev) => prev.map((ret) => (ret._id === editingId ? { ...ret, ...updated } : ret)));
        }
        setToast("Return updated successfully!");
        emitDataSync({ type: "return", action: "update", record: updated });
      } else {
        const res = await api.post("/returns", { ...form, numberOfUnitsReturning: Number(form.numberOfUnitsReturning) });
        const created = res.data?.data;
        if (created) {
          setRecentReturns((prev) => [created, ...prev.filter((ret) => ret._id !== created._id)]);
        }
        setToast("Return request submitted successfully!");
        emitDataSync({ type: "return", action: "create", record: created });
      }
      setForm(initialState);
      setEditingId(null);
      setErrors({});
      setIsFormOpen(false);
      fetchRecent(true);
    } catch (error) {
      const errMsg = error.response?.data?.message || "Failed to submit return request";
      setToast(errMsg);
      const fieldErrors = error.response?.data?.errors || {};
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
      } else {
        const lower = errMsg.toLowerCase();
        if (lower.includes("mobile")) setErrors((prev) => ({ ...prev, mobileNumber: errMsg }));
        else if (lower.includes("customer")) setErrors((prev) => ({ ...prev, customerName: errMsg }));
        else if (lower.includes("pincode")) setErrors((prev) => ({ ...prev, pincode: errMsg }));
        else if (lower.includes("unit")) setErrors((prev) => ({ ...prev, numberOfUnitsReturning: errMsg }));
        else if (lower.includes("reason")) setErrors((prev) => ({ ...prev, customReason: errMsg }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-area">
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1>Returns</h1>
            <span className="badge-live-pulse" title="Real-time syncing enabled">
              <span className="badge-live-dot" /> LIVE
            </span>
          </div>
          <p>View and manage customer return requests and hardware issues</p>
        </div>

        <div className="page-actions-group">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsCsvModalOpen(true)}
            title="Import Returns from CSV"
          >
            <UploadIcon />
            Import CSV
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={filteredReturns.length === 0}
            title="Export Returns to CSV"
          >
            <DownloadIcon />
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setForm(initialState);
              setEditingId(null);
              setErrors({});
              setIsFormOpen(true);
            }}
          >
            <PlusIcon />
            Create Return
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="table-card">
        {/* Table Header Bar with Filters */}
        <div className="table-header-bar" style={{ flexWrap: "wrap", gap: "10px" }}>
          <div className="filter-period-pills" style={{ display: "flex", gap: "4px" }}>
            {[
              { key: "today", label: "Today" },
              { key: "yesterday", label: "Yesterday" },
              { key: "week", label: "This Week" },
              { key: "month", label: "This Month" },
              { key: "custom", label: "Custom Range" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`filter-pill ${dateFilter === key ? "active" : ""}`}
                onClick={() => setDateFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {dateFilter === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="date"
                className="form-control"
                style={{ width: "auto", height: "32px", padding: "2px 8px", fontSize: "12px" }}
                value={returnDateFrom}
                max={today}
                onChange={(e) => {
                  const val = e.target.value;
                  setReturnDateFrom(val);
                  if (returnDateTo && val > returnDateTo) setReturnDateTo("");
                }}
              />
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>to</span>
              <input
                type="date"
                className="form-control"
                style={{ width: "auto", height: "32px", padding: "2px 8px", fontSize: "12px" }}
                value={returnDateTo}
                min={returnDateFrom}
                max={today}
                onChange={(e) => setReturnDateTo(e.target.value)}
              />
            </div>
          )}

          <div className="table-search-input" style={{ marginLeft: "auto", minWidth: "220px" }}>
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by customer, mobile, product..."
              value={returnSearch}
              onChange={(e) => setReturnSearch(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchRecent(false)}
            title="Refresh records"
          >
            <RefreshIcon />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: "#10b981", color: "#ffffff", border: "1px solid #10b981", display: "inline-flex", alignItems: "center", gap: "6px" }}
            onClick={() => downloadReturnsPDF(filteredReturns)}
            title="Download PDF Report"
          >
            <DownloadIcon />
            Download PDF
          </button>
        </div>

        {/* Table Container */}
        <div className="table-container">
          <table className="leads-table slidable-table">
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>MOBILE</th>
                <th>PRODUCT</th>
                <th>UNITS</th>
                <th>REASON</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th style={{ textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {initialLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`}>
                    <td><div className="skeleton-box" style={{ width: "120px", height: "14px" }} /></td>
                    <td><div className="skeleton-box" style={{ width: "90px", height: "14px" }} /></td>
                    <td><div className="skeleton-box" style={{ width: "80px", height: "14px" }} /></td>
                    <td><div className="skeleton-box" style={{ width: "30px", height: "14px" }} /></td>
                    <td><div className="skeleton-box" style={{ width: "110px", height: "14px" }} /></td>
                    <td><div className="skeleton-box" style={{ width: "90px", height: "20px", borderRadius: "10px" }} /></td>
                    <td><div className="skeleton-box" style={{ width: "100px", height: "14px" }} /></td>
                    <td style={{ textAlign: "center" }}><div className="skeleton-box" style={{ width: "60px", height: "24px", margin: "0 auto" }} /></td>
                  </tr>
                ))
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "36px 16px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>No matching returns found</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Create a new return request or adjust your date filter.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((r) => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{r.customerName}</td>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: "12.5px" }}>{r.mobileNumber}</span>
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: "11px" }}>{r.productType}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.numberOfUnitsReturning || 0}</td>
                    <td style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                      {r.returnReason}
                      {r.returnReason === "Other" && r.customReason ? `: ${r.customReason}` : ""}
                    </td>
                    <td>{statusBadge(r.returnStatus)}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {formatDateTime(r.createdAt)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" }}>
                        <button
                          type="button"
                          className="btn-icon"
                          title="View Details"
                          onClick={() => setViewReturn(r)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "5px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            color: "#0284c7",
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEditReturn(r)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "5px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            color: "#f59e0b",
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDeleteReturn(r)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "5px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            color: "#ef4444",
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Modern Modal: Create / Edit Return */}
      {isFormOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setIsFormOpen(false);
            setForm(initialState);
            setEditingId(null);
            setErrors({});
          }}
        >
          <div
            className="modal-card modal-lg"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "780px", width: "95%", maxHeight: "92vh", display: "flex", flexDirection: "column" }}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="badge badge-blue" style={{ fontSize: "11px", fontWeight: 700 }}>
                  {editingId ? "EDIT RETURN" : "NEW RETURN"}
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                  {editingId ? "Edit Return Request" : "Create New Return Request"}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setIsFormOpen(false);
                  setForm(initialState);
                  setEditingId(null);
                  setErrors({});
                }}
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
              <div className="modal-body modal-body-compact" style={{ overflowY: "auto", maxHeight: "calc(90vh - 130px)", flex: 1, padding: "16px 20px" }}>
                {/* 1. Customer Information */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>1. Customer Information</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "10px" }}>
                    <div className="form-group">
                      <label className="form-label">Customer Name *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.customerName ? "is-invalid" : ""}`}
                        placeholder="Enter customer name"
                        required
                        value={form.customerName}
                        onChange={(e) => onChange("customerName", sanitizeLetters(e.target.value))}
                      />
                      {errors.customerName && <small className="error-text">{errors.customerName}</small>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mobile Number *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.mobileNumber ? "is-invalid" : ""}`}
                        placeholder="10-digit number"
                        inputMode="numeric"
                        maxLength={10}
                        required
                        value={form.mobileNumber}
                        onKeyDown={preventNonNumericKey}
                        onChange={(e) => onChange("mobileNumber", sanitizeDigits(e.target.value, 10))}
                      />
                      {errors.mobileNumber && <small className="error-text">{errors.mobileNumber}</small>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Pincode *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.pincode ? "is-invalid" : ""}`}
                        placeholder="6-digit pincode"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={form.pincode}
                        onKeyDown={preventNonNumericKey}
                        onChange={(e) => onChange("pincode", sanitizeDigits(e.target.value, 6))}
                      />
                      {errors.pincode && <small className="error-text">{errors.pincode}</small>}
                    </div>
                  </div>
                </div>

                {/* 2. Return Details */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                    <span>2. Return Details</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: form.returnReason === "Other" ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1.2fr", gap: "10px" }}>
                    <div className="form-group">
                      <label className="form-label">Product Type</label>
                      <select
                        className="form-control"
                        value={form.productType}
                        onChange={(e) => onChange("productType", e.target.value)}
                      >
                        <option value="GPS">GPS</option>
                        <option value="Vending Machine">Vending Machine</option>
                        <option value="Disposal">Disposal</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Number of Units *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.numberOfUnitsReturning ? "is-invalid" : ""}`}
                        placeholder="e.g. 1"
                        inputMode="numeric"
                        required
                        value={form.numberOfUnitsReturning}
                        onKeyDown={preventNonNumericKey}
                        onChange={(e) => onChange("numberOfUnitsReturning", sanitizeDigits(e.target.value, 6))}
                      />
                      {errors.numberOfUnitsReturning && <small className="error-text">{errors.numberOfUnitsReturning}</small>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Return Reason</label>
                      <select
                        className="form-control"
                        value={form.returnReason}
                        onChange={(e) => onChange("returnReason", e.target.value)}
                      >
                        <option value="Product Damaged">Product Damaged</option>
                        <option value="Wrong Product">Wrong Product</option>
                        <option value="Product Not Working">Product Not Working</option>
                        <option value="Extra Order">Extra Order</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {form.returnReason === "Other" && (
                      <div className="form-group">
                        <label className="form-label">Custom Reason *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.customReason ? "is-invalid" : ""}`}
                          placeholder="Describe specific reason"
                          value={form.customReason}
                          onChange={(e) => onChange("customReason", e.target.value)}
                        />
                        {errors.customReason && <small className="error-text">{errors.customReason}</small>}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Additional Information */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <span>3. Additional Notes</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Additional Description / Issue Details</label>
                    <textarea
                      className="form-control"
                      value={form.additionalDescription}
                      onChange={(e) => onChange("additionalDescription", e.target.value)}
                      placeholder="Enter any additional details, diagnostic notes or courier tracking..."
                      rows={3}
                      style={{ resize: "vertical" }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsFormOpen(false);
                    setForm(initialState);
                    setEditingId(null);
                    setErrors({});
                  }}
                >
                  Close
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Submitting..." : editingId ? "Update Return" : "Submit Return Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Modal: View Return Details */}
      {viewReturn && (
        <div className="modal-backdrop" onClick={() => setViewReturn(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", width: "95%" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="badge badge-blue" style={{ fontSize: "11px", fontWeight: 700 }}>DETAILS</span>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Return Request Details</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setViewReturn(null)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px", fontWeight: 600 }}>
                    Customer Name
                  </span>
                  <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 600 }}>{viewReturn.customerName || "-"}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px", fontWeight: 600 }}>
                    Mobile Number
                  </span>
                  <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500, fontFamily: "monospace" }}>{viewReturn.mobileNumber || "-"}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px", fontWeight: 600 }}>
                    Pincode
                  </span>
                  <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewReturn.pincode || "-"}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px", fontWeight: 600 }}>
                    Product Type
                  </span>
                  <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 600 }}>{viewReturn.productType || "-"}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px", fontWeight: 600 }}>
                    Units Returning
                  </span>
                  <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 600 }}>{viewReturn.numberOfUnitsReturning || 0}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px", fontWeight: 600 }}>
                    Return Reason
                  </span>
                  <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewReturn.returnReason || "-"}</div>
                </div>
                {viewReturn.returnReason === "Other" && (
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", gridColumn: "1 / -1" }}>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px", fontWeight: 600 }}>
                      Custom Reason
                    </span>
                    <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewReturn.customReason || "-"}</div>
                  </div>
                )}
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px", fontWeight: 600 }}>
                    Return Status
                  </span>
                  <div>{statusBadge(viewReturn.returnStatus)}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px", fontWeight: 600 }}>
                    Created Date
                  </span>
                  <div style={{ fontSize: "13px", color: "var(--text-heading)", fontWeight: 500 }}>{formatDateTime(viewReturn.createdAt)}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", gridColumn: "1 / -1" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "3px", fontWeight: 600 }}>
                    Additional Description
                  </span>
                  <div style={{ fontSize: "13.5px", color: "var(--text-secondary)", whiteSpace: "pre-wrap", background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    {viewReturn.additionalDescription || "No additional description provided."}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setViewReturn(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImport={handleImportReturns}
        title="Import Return Requests"
        description="Upload customer return requests, damaged units, or replacements from a CSV spreadsheet."
        templateFilename="return_requests_template.csv"
        templateHeaders={[
          "Customer Name",
          "Mobile Number",
          "Pincode",
          "Product Type",
          "Units Returning",
          "Return Reason",
          "Additional Description",
        ]}
        templateSampleRows={[
          ["Rajesh Kumar", "9876543210", "110001", "GPS", "1", "Product Damaged", "Device screen cracked upon delivery"],
          ["Priya Sharma", "9812345678", "400001", "GPS", "2", "Wrong Product", "Sent model A instead of B"],
        ]}
        requiredHeaders={["Customer Name", "Mobile Number"]}
      />

      {toast && <Toast message={toast} type={toast.includes("successfully") ? "success" : "error"} onClose={clearToast} />}

      <ConfirmModal
        isOpen={Boolean(deleteConfirmReturn)}
        title={`Delete Return — ${deleteConfirmReturn?.customerName || ""}`}
        message={`Are you sure you want to delete the return request for "${deleteConfirmReturn?.customerName || "this customer"}"? This action cannot be undone.`}
        confirmText="Delete Return"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmReturn(null)}
      />
    </div>
  );
};

export default EmployeeReturnPage;
