"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api, emitDataSync, onDataSync } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import CsvImportModal from "../components/CsvImportModal";
import { exportTableToCsv } from "../utils/csvHelper";

const FILTERS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "custom", label: "Custom Range" }
];

const formatLabel = (f) => {
  const match = FILTERS.find((item) => item.id === f);
  return match ? match.label : f;
};

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const getInitialState = () => ({
  date: new Date().toISOString().split("T")[0],
  outgoingCalls: "",
  incomingCalls: "",
  connectedCalls: "",
  interestedLeads: "",
  notInterestedLeads: "",
  followUpCalls: "",
  followUpLeads: "",
  conversionsDone: "",
  revenueGenerated: ""
});

const downloadCallingPDF = (records, executiveName) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("GatecodeXcars24 — Telecalling & Performance Report", pageWidth / 2, y, { align: "center" });
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(
    `Executive: ${executiveName || "All"} | Generated: ${new Date().toLocaleDateString("en-IN")} | Total Records: ${records.length}`,
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 8;

  const rows = records.map((r) => [
    formatDate(r.date),
    r.employeeName || "-",
    r.outgoingCalls || 0,
    r.incomingCalls || 0,
    r.connectedCalls || 0,
    r.notConnectedCalls || 0,
    r.interestedLeads || 0,
    r.notInterestedLeads || 0,
    r.followUpCalls || 0,
    r.followUpLeads || 0,
    (r.outgoingCalls || 0) + (r.incomingCalls || 0) + (r.followUpCalls || 0),
    r.conversionsDone || 0,
    `₹${Number(r.revenueGenerated || 0).toLocaleString("en-IN")}`
  ]);

  const totals = records.reduce(
    (acc, r) => {
      acc.out += r.outgoingCalls || 0;
      acc.inc += r.incomingCalls || 0;
      acc.conn += r.connectedCalls || 0;
      acc.notConn += r.notConnectedCalls || 0;
      acc.int += r.interestedLeads || 0;
      acc.notInt += r.notInterestedLeads || 0;
      acc.fuCalls += r.followUpCalls || 0;
      acc.fuLeads += r.followUpLeads || 0;
      acc.total += (r.outgoingCalls || 0) + (r.incomingCalls || 0) + (r.followUpCalls || 0);
      acc.conv += r.conversionsDone || 0;
      acc.rev += Number(r.revenueGenerated) || 0;
      return acc;
    },
    { out: 0, inc: 0, conn: 0, notConn: 0, int: 0, notInt: 0, fuCalls: 0, fuLeads: 0, total: 0, conv: 0, rev: 0 }
  );

  const totalsRow = [
    "TOTAL",
    "-",
    totals.out,
    totals.inc,
    totals.conn,
    totals.notConn,
    totals.int,
    totals.notInt,
    totals.fuCalls,
    totals.fuLeads,
    totals.total,
    totals.conv,
    `₹${totals.rev.toLocaleString("en-IN")}`
  ];

  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [
      [
        "Date",
        "Executive",
        "Outgoing",
        "Incoming",
        "Connected",
        "Not Conn.",
        "Interested",
        "Not Int.",
        "F/U Calls",
        "F/U Leads",
        "Total Calls",
        "Conv.",
        "Revenue"
      ]
    ],
    body: [...rows, totalsRow],
    headStyles: { fillColor: [2, 132, 199], fontSize: 8, fontStyle: "bold", textColor: 255 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    styles: { cellPadding: 2, halign: "center" },
    columnStyles: {
      0: { cellWidth: 24, halign: "left" },
      1: { cellWidth: 32, halign: "left" },
      12: { halign: "right" }
    },
    didParseCell: (data) => {
      if (data.row.index === rows.length) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [241, 245, 249];
      }
    }
  });

  doc.save(`Gatecode_Calling_Report_${new Date().toISOString().split("T")[0]}.pdf`);
};

const EmployeeCallingPage = () => {
  const today = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(getInitialState());
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const tableContainerRef = useRef(null);

  const handleImportCallingRecords = async (rows) => {
    const res = await api.post("/employee/calling-records/bulk-import", { rows });
    showToast(res.data?.message || `Imported ${rows.length} calling records successfully!`, "success");
    emitDataSync({ type: "calling", action: "bulk" });
    fetchRecords(false);
  };

  const handleExportCSV = () => {
    if (!records || records.length === 0) {
      showToast("No calling records available to export", "error");
      return;
    }
    const headers = [
      "Date",
      "Outgoing Calls",
      "Incoming Calls",
      "Connected Calls",
      "Not Connected Calls",
      "Interested Leads",
      "Not Interested Leads",
      "Follow Up Calls",
      "Follow Up Leads",
      "Total Calls",
      "Conversions Done",
      "Revenue Generated"
    ];
    const rows = records.map((r) => [
      r.date ? new Date(r.date).toISOString().split("T")[0] : "-",
      r.outgoingCalls || 0,
      r.incomingCalls || 0,
      r.connectedCalls || 0,
      r.notConnectedCalls || 0,
      r.interestedLeads || 0,
      r.notInterestedLeads || 0,
      r.followUpCalls || 0,
      r.followUpLeads || 0,
      (r.outgoingCalls || 0) + (r.incomingCalls || 0) + (r.followUpCalls || 0),
      r.conversionsDone || 0,
      r.revenueGenerated || 0
    ]);
    exportTableToCsv(`Calling_Records_${user?.name || "Employee"}_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
    showToast("Calling records exported to CSV", "success");
  };

  const slideTable = (direction) => {
    if (tableContainerRef.current) {
      const scrollAmt = direction === "left" ? -400 : 400;
      tableContainerRef.current.scrollBy({ left: scrollAmt, behavior: "smooth" });
    }
  };

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

  const clearToast = useCallback(() => setToast(null), []);

  const validate = () => {
    const next = {};
    if (!form.date) {
      next.date = "Calling date is required";
    }

    if (form.conversionsDone === "" || form.conversionsDone === null || form.conversionsDone === undefined) {
      next.conversionsDone = "Conversions count is required";
    } else if (Number(form.conversionsDone) < 0) {
      next.conversionsDone = "Conversions must be 0 or more";
    }

    if (form.revenueGenerated === "" || form.revenueGenerated === null || form.revenueGenerated === undefined) {
      next.revenueGenerated = "Revenue generated is required";
    } else if (Number(form.revenueGenerated) < 0) {
      next.revenueGenerated = "Revenue must be 0 or more";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const fetchRecords = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = { filter };
      if (filter === "custom") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const res = await api.get("/employee/calling-records", { params, forceRefresh: silent });
      setRecords(res.data.data || []);
    } catch {
      setRecords([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter, startDate, endDate]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Multi-tab real-time synchronization
  useEffect(() => {
    const unsub = onDataSync((evt) => {
      if (evt?.type === "calling") {
        fetchRecords(true);
      }
    });
    return unsub;
  }, [fetchRecords]);

  useEffect(() => {
    const onFocus = () => fetchRecords(true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchRecords]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSaving(true);
      const outgoing = Number(form.outgoingCalls) || 0;
      const incoming = Number(form.incomingCalls) || 0;
      const connected = Number(form.connectedCalls) || 0;
      const notConnected = Math.max(outgoing + incoming - connected, 0);

      const payload = {
        date: form.date,
        outgoingCalls: outgoing,
        incomingCalls: incoming,
        connectedCalls: connected,
        notConnectedCalls: notConnected,
        interestedLeads: Number(form.interestedLeads) || 0,
        notInterestedLeads: Number(form.notInterestedLeads) || 0,
        followUpCalls: Number(form.followUpCalls) || 0,
        followUpLeads: Number(form.followUpLeads) || 0,
        conversionsDone: Number(form.conversionsDone) || 0,
        revenueGenerated: Number(form.revenueGenerated) || 0
      };

      if (editingId) {
        const res = await api.put(`/employee/calling-records/${editingId}`, payload);
        const updated = res.data?.data;
        if (updated) {
          setRecords((prev) => prev.map((rec) => (rec._id === editingId ? { ...rec, ...updated } : rec)));
        }
        setToast("Calling report updated successfully!");
        emitDataSync({ type: "calling", action: "update", record: updated });
      } else {
        const res = await api.post("/employee/calling-records", payload);
        const created = res.data?.data;
        if (created) {
          setRecords((prev) => [created, ...prev.filter((rec) => rec._id !== created._id)]);
        }
        setToast("Calling report submitted successfully!");
        emitDataSync({ type: "calling", action: "create", record: created });
      }

      setForm(getInitialState());
      setEditingId(null);
      setErrors({});
      setIsFormOpen(false);
      fetchRecords(true);
    } catch (error) {
      const errMsg = error.response?.data?.message || "Failed to save calling report";
      setToast(errMsg);
      const fieldErrors = error.response?.data?.errors || {};
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
      } else {
        const lower = errMsg.toLowerCase();
        if (lower.includes("conversion")) setErrors((prev) => ({ ...prev, conversionsDone: errMsg }));
        else if (lower.includes("revenue")) setErrors((prev) => ({ ...prev, revenueGenerated: errMsg }));
        else if (lower.includes("date")) setErrors((prev) => ({ ...prev, date: errMsg }));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(getInitialState());
    setEditingId(null);
    setErrors({});
    setIsFormOpen(false);
  };

  const handleEdit = (record) => {
    setForm({
      date: record.date ? record.date.split("T")[0] : "",
      outgoingCalls: record.outgoingCalls ?? "",
      incomingCalls: record.incomingCalls ?? "",
      connectedCalls: record.connectedCalls ?? "",
      interestedLeads: record.interestedLeads ?? "",
      notInterestedLeads: record.notInterestedLeads ?? "",
      followUpCalls: record.followUpCalls ?? "",
      followUpLeads: record.followUpLeads ?? "",
      conversionsDone: record.conversionsDone ?? "",
      revenueGenerated: record.revenueGenerated ?? ""
    });
    setEditingId(record._id);
    setIsFormOpen(true);
  };

  // Live Calculations for Form
  const formTotalCalls =
    (Number(form.outgoingCalls) || 0) + (Number(form.incomingCalls) || 0) + (Number(form.followUpCalls) || 0);
  const formNotConnected = Math.max(
    (Number(form.outgoingCalls) || 0) + (Number(form.incomingCalls) || 0) - (Number(form.connectedCalls) || 0),
    0
  );

  // Overall Totals for KPIs
  const totals = records.reduce(
    (acc, r) => {
      acc.outgoingCalls += r.outgoingCalls || 0;
      acc.incomingCalls += r.incomingCalls || 0;
      acc.connectedCalls += r.connectedCalls || 0;
      acc.notConnectedCalls += r.notConnectedCalls || 0;
      acc.interestedLeads += r.interestedLeads || 0;
      acc.notInterestedLeads += r.notInterestedLeads || 0;
      acc.followUpCalls += r.followUpCalls || 0;
      acc.followUpLeads += r.followUpLeads || 0;
      acc.conversionsDone += r.conversionsDone || 0;
      acc.revenueGenerated += Number(r.revenueGenerated) || 0;
      acc.totalCalls += (r.outgoingCalls || 0) + (r.incomingCalls || 0) + (r.followUpCalls || 0);
      return acc;
    },
    {
      outgoingCalls: 0,
      incomingCalls: 0,
      connectedCalls: 0,
      notConnectedCalls: 0,
      interestedLeads: 0,
      notInterestedLeads: 0,
      followUpCalls: 0,
      followUpLeads: 0,
      conversionsDone: 0,
      revenueGenerated: 0,
      totalCalls: 0
    }
  );

  // Derived Performance Metrics
  const connectRate = totals.totalCalls > 0 ? Math.round((totals.connectedCalls / totals.totalCalls) * 100) : 0;
  const leadRate = totals.connectedCalls > 0 ? Math.round((totals.interestedLeads / totals.connectedCalls) * 100) : 0;
  const convRate = totals.interestedLeads > 0 ? Math.round((totals.conversionsDone / totals.interestedLeads) * 100) : 0;
  const avgDealRevenue = totals.conversionsDone > 0 ? Math.round(totals.revenueGenerated / totals.conversionsDone) : 0;

  return (
    <div className="calling-page-wrap">
      {/* ─── SECTION 1: HEADER ─── */}
      <div className="calling-header-card">
        <div className="calling-title-group">
          <div className="calling-title-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </div>
          <div>
            <span className="calling-tag-chip">My Daily Calling Activity</span>
            <h1 className="calling-title-text">Telecalling Performance</h1>
            <p className="calling-subtitle-text">
              Submit and monitor your daily calling metrics, customer leads &amp; conversion revenue.
            </p>
          </div>
        </div>

        <div className="calling-header-actions">
          <button
            type="button"
            className="btn-calling-refresh"
            onClick={fetchRecords}
            disabled={loading}
            title="Refresh Calling Data"
          >
            <RefreshIcon />
            <span>{loading ? "Syncing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            className="btn-calling-pdf"
            onClick={() => downloadCallingPDF(records, user?.name)}
            disabled={records.length === 0}
            title={records.length === 0 ? "No records to export" : "Download PDF summary"}
          >
            <DownloadIcon />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            className="btn-calling-csv"
            onClick={() => setIsCsvModalOpen(true)}
            title="Import Calling Records from CSV"
          >
            <UploadIcon />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            className="btn-calling-csv"
            onClick={handleExportCSV}
            disabled={records.length === 0}
            title="Export calling records to CSV"
          >
            <DownloadIcon />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600
            }}
            onClick={() => {
              handleReset();
              setIsFormOpen(true);
            }}
          >
            <PlusIcon />
            <span>Submit Calling Record</span>
          </button>
        </div>
      </div>

      {/* ─── SECTION 2: KEY METRICS KPI GRID ─── */}
      <div className="calling-kpi-grid">
        {/* Total Calls */}
        <div className="calling-kpi-card" style={{ "--card-accent": "#0284c7" }}>
          <div className="calling-kpi-top">
            <span className="calling-kpi-label">Total Calls</span>
            <div className="calling-kpi-icon-wrap" style={{ background: "#f0f9ff", color: "#0284c7" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
          </div>
          <div className="calling-kpi-main">
            <span className="calling-kpi-number">{totals.totalCalls}</span>
            <span className="calling-kpi-badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>
              Out + In + F/U
            </span>
          </div>
          <p className="calling-kpi-subtext">All call interactions recorded</p>
        </div>

        {/* Outgoing Calls */}
        <div className="calling-kpi-card" style={{ "--card-accent": "#3b82f6" }}>
          <div className="calling-kpi-top">
            <span className="calling-kpi-label">Outgoing Calls</span>
            <div className="calling-kpi-icon-wrap" style={{ background: "#eff6ff", color: "#3b82f6" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 7 23 1 17 1" />
                <line x1="16" y1="8" x2="23" y2="1" />
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
          </div>
          <div className="calling-kpi-main">
            <span className="calling-kpi-number">{totals.outgoingCalls}</span>
            <span className="calling-kpi-badge" style={{ background: "#dbeafe", color: "#1e40af" }}>
              {totals.totalCalls > 0 ? Math.round((totals.outgoingCalls / totals.totalCalls) * 100) : 0}% outbound
            </span>
          </div>
          <p className="calling-kpi-subtext">Direct calls placed to customers</p>
        </div>

        {/* Incoming Calls */}
        <div className="calling-kpi-card" style={{ "--card-accent": "#8b5cf6" }}>
          <div className="calling-kpi-top">
            <span className="calling-kpi-label">Incoming Calls</span>
            <div className="calling-kpi-icon-wrap" style={{ background: "#f5f3ff", color: "#8b5cf6" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 2 16 8 22 8" />
                <line x1="23" y1="1" x2="16" y2="8" />
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
          </div>
          <div className="calling-kpi-main">
            <span className="calling-kpi-number">{totals.incomingCalls}</span>
            <span className="calling-kpi-badge" style={{ background: "#ede9fe", color: "#6b21a8" }}>
              {totals.totalCalls > 0 ? Math.round((totals.incomingCalls / totals.totalCalls) * 100) : 0}% inbound
            </span>
          </div>
          <p className="calling-kpi-subtext">Calls received from customers</p>
        </div>

        {/* Connected Calls */}
        <div className="calling-kpi-card" style={{ "--card-accent": "#10b981" }}>
          <div className="calling-kpi-top">
            <span className="calling-kpi-label">Connected</span>
            <div className="calling-kpi-icon-wrap" style={{ background: "#ecfdf5", color: "#10b981" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="calling-kpi-main">
            <span className="calling-kpi-number" style={{ color: "#059669" }}>{totals.connectedCalls}</span>
            <span className="calling-kpi-badge" style={{ background: "#d1fae5", color: "#065f46" }}>
              {connectRate}% connect
            </span>
          </div>
          <p className="calling-kpi-subtext">Successfully answered calls</p>
        </div>

        {/* Not Connected Calls */}
        <div className="calling-kpi-card" style={{ "--card-accent": "#ef4444" }}>
          <div className="calling-kpi-top">
            <span className="calling-kpi-label">Not Connected</span>
            <div className="calling-kpi-icon-wrap" style={{ background: "#fef2f2", color: "#ef4444" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="23" y1="1" x2="17" y2="7" />
                <line x1="17" y1="1" x2="23" y2="7" />
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
          </div>
          <div className="calling-kpi-main">
            <span className="calling-kpi-number" style={{ color: "#dc2626" }}>{totals.notConnectedCalls}</span>
            <span className="calling-kpi-badge" style={{ background: "#fee2e2", color: "#991b1b" }}>
              {totals.totalCalls > 0 ? Math.round((totals.notConnectedCalls / totals.totalCalls) * 100) : 0}% missed
            </span>
          </div>
          <p className="calling-kpi-subtext">Unanswered / busy numbers</p>
        </div>

        {/* Interested Leads */}
        <div className="calling-kpi-card" style={{ "--card-accent": "#f59e0b" }}>
          <div className="calling-kpi-top">
            <span className="calling-kpi-label">Interested Leads</span>
            <div className="calling-kpi-icon-wrap" style={{ background: "#fffbeb", color: "#f59e0b" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          </div>
          <div className="calling-kpi-main">
            <span className="calling-kpi-number" style={{ color: "#d97706" }}>{totals.interestedLeads}</span>
            <span className="calling-kpi-badge" style={{ background: "#fef3c7", color: "#92400e" }}>
              {leadRate}% of conn.
            </span>
          </div>
          <p className="calling-kpi-subtext">Positive customer leads</p>
        </div>

        {/* Conversions */}
        <div className="calling-kpi-card" style={{ "--card-accent": "#06b6d4" }}>
          <div className="calling-kpi-top">
            <span className="calling-kpi-label">Conversions</span>
            <div className="calling-kpi-icon-wrap" style={{ background: "#ecfeff", color: "#06b6d4" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
                <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
              </svg>
            </div>
          </div>
          <div className="calling-kpi-main">
            <span className="calling-kpi-number" style={{ color: "#0891b2" }}>{totals.conversionsDone}</span>
            <span className="calling-kpi-badge" style={{ background: "#cffafe", color: "#155e75" }}>
              {convRate}% close rate
            </span>
          </div>
          <p className="calling-kpi-subtext">Closed deals &amp; appointments</p>
        </div>

        {/* Revenue */}
        <div className="calling-kpi-card" style={{ "--card-accent": "#10b981" }}>
          <div className="calling-kpi-top">
            <span className="calling-kpi-label">Revenue Generated</span>
            <div className="calling-kpi-icon-wrap" style={{ background: "#ecfdf5", color: "#10b981" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12" />
                <path d="M6 8h12" />
                <path d="M6 13l8.5 8" />
                <path d="M6 13h3a4 4 0 0 0 0-8" />
              </svg>
            </div>
          </div>
          <div className="calling-kpi-main">
            <span className="calling-kpi-number" style={{ color: "#059669", fontSize: "23px" }}>
              ₹{totals.revenueGenerated.toLocaleString("en-IN")}
            </span>
            <span className="calling-kpi-badge" style={{ background: "#d1fae5", color: "#065f46" }}>
              My Total
            </span>
          </div>
          <p className="calling-kpi-subtext">
            {totals.conversionsDone > 0 ? `Avg ₹${avgDealRevenue.toLocaleString("en-IN")} / conv.` : "Total closed revenue"}
          </p>
        </div>
      </div>

      {/* ─── SECTION 3: EFFICIENCY & FUNNEL STRIP ─── */}
      <div className="calling-funnel-strip">
        <div className="calling-funnel-item">
          <div className="calling-funnel-label">
            <span>My Connect Rate</span>
            <span style={{ color: "#0284c7" }}>{connectRate}%</span>
          </div>
          <div className="calling-funnel-value">
            {totals.connectedCalls} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>/ {totals.totalCalls} calls</span>
          </div>
          <div className="calling-funnel-bar-track">
            <div
              className="calling-funnel-bar-fill"
              style={{
                width: `${Math.min(connectRate, 100)}%`,
                background: "linear-gradient(90deg, #38bdf8, #0284c7)"
              }}
            />
          </div>
        </div>

        <div className="calling-funnel-item">
          <div className="calling-funnel-label">
            <span>Lead Generation</span>
            <span style={{ color: "#f59e0b" }}>{leadRate}%</span>
          </div>
          <div className="calling-funnel-value">
            {totals.interestedLeads} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>/ {totals.connectedCalls} conn.</span>
          </div>
          <div className="calling-funnel-bar-track">
            <div
              className="calling-funnel-bar-fill"
              style={{
                width: `${Math.min(leadRate, 100)}%`,
                background: "linear-gradient(90deg, #fcd34d, #f59e0b)"
              }}
            />
          </div>
        </div>

        <div className="calling-funnel-item">
          <div className="calling-funnel-label">
            <span>Closing Ratio</span>
            <span style={{ color: "#06b6d4" }}>{convRate}%</span>
          </div>
          <div className="calling-funnel-value">
            {totals.conversionsDone} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>/ {totals.interestedLeads} leads</span>
          </div>
          <div className="calling-funnel-bar-track">
            <div
              className="calling-funnel-bar-fill"
              style={{
                width: `${Math.min(convRate, 100)}%`,
                background: "linear-gradient(90deg, #67e8f9, #06b6d4)"
              }}
            />
          </div>
        </div>

        <div className="calling-funnel-item">
          <div className="calling-funnel-label">
            <span>Avg Deal Value</span>
            <span style={{ color: "#10b981" }}>Live</span>
          </div>
          <div className="calling-funnel-value" style={{ color: "#059669" }}>
            ₹{avgDealRevenue.toLocaleString("en-IN")}
          </div>
          <div className="calling-funnel-bar-track">
            <div
              className="calling-funnel-bar-fill"
              style={{
                width: totals.conversionsDone > 0 ? "100%" : "0%",
                background: "linear-gradient(90deg, #6ee7b7, #10b981)"
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── SECTION 4: FILTER BAR ─── */}
      <div className="calling-filter-toolbar">
        <div className="calling-filter-left">
          <div className="calling-control-block">
            <span className="calling-control-label">Period:</span>
            <div className="calling-period-pills">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`calling-period-pill ${filter === f.id ? "active" : ""}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filter === "custom" && (
            <div className="calling-date-range-box">
              <input
                type="date"
                className="calling-date-input"
                value={startDate}
                max={today}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (endDate && val > endDate) setEndDate("");
                }}
              />
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>to</span>
              <input
                type="date"
                className="calling-date-input"
                value={endDate}
                min={startDate}
                max={today}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="calling-filter-right">
          <button
            type="button"
            className="btn-calling-refresh"
            onClick={fetchRecords}
            title="Refresh Data"
          >
            <RefreshIcon />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── SECTION 5: CALLING RECORDS TABLE ─── */}
      <div className="calling-table-card">
        <div className="calling-table-topbar">
          <div className="calling-table-title">
            <h2 className="calling-table-heading">My Calling Records</h2>
            <span className="calling-count-badge">
              {records.length} {records.length === 1 ? "Record" : "Records"}
            </span>
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#64748b", marginRight: "6px" }}>
              Period: <strong style={{ color: "#0f172a" }}>{formatLabel(filter)}</strong>
            </span>
            <button
              type="button"
              className="table-nav-btn"
              onClick={() => slideTable("left")}
              title="Slide Left"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              className="table-nav-btn"
              onClick={() => slideTable("right")}
              title="Slide Right"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>

        <div className="calling-table-scroll" ref={tableContainerRef}>
          <table className="calling-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>EXECUTIVE</th>
                <th>OUTGOING</th>
                <th>INCOMING</th>
                <th>CONNECTED</th>
                <th>NOT CONN.</th>
                <th>INTERESTED</th>
                <th>NOT INT.</th>
                <th>F/U CALLS</th>
                <th>F/U LEADS</th>
                <th>TOTAL CALLS</th>
                <th>CONV.</th>
                <th>REVENUE</th>
                <th style={{ textAlign: "center" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={14} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    Loading telecalling records...
                  </td>
                </tr>
              )}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No calling records found for this period. Click "+ Submit Calling Record" above.
                  </td>
                </tr>
              )}
              {!loading &&
                records.map((r) => {
                  const total = (r.outgoingCalls || 0) + (r.incomingCalls || 0) + (r.followUpCalls || 0);
                  return (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600, color: "var(--text-heading)", whiteSpace: "nowrap" }}>
                        {formatDate(r.date)}
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.employeeName || user?.name || "Executive"}</td>
                      <td>{r.outgoingCalls || 0}</td>
                      <td>{r.incomingCalls || 0}</td>
                      <td>
                        <span className="badge badge-green" style={{ fontSize: "11px", fontWeight: 700 }}>
                          {r.connectedCalls || 0}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: "#ef4444", fontWeight: 600 }}>{r.notConnectedCalls || 0}</span>
                      </td>
                      <td>
                        <span className="badge badge-yellow" style={{ fontSize: "11px", fontWeight: 700 }}>
                          {r.interestedLeads || 0}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{r.notInterestedLeads || 0}</td>
                      <td>{r.followUpCalls || 0}</td>
                      <td>{r.followUpLeads || 0}</td>
                      <td style={{ fontWeight: 700, color: "var(--primary)" }}>{total}</td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: "11px", fontWeight: 700 }}>
                          {r.conversionsDone || 0}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: "#10b981", whiteSpace: "nowrap" }}>
                        ₹{Number(r.revenueGenerated || 0).toLocaleString("en-IN")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn-action btn-action-edit"
                            title="Edit Record"
                            onClick={() => handleEdit(r)}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-delete"
                            title="Delete Record"
                            onClick={async () => {
                              if (!window.confirm(`Delete calling record of ${formatDate(r.date)}?`)) return;
                              // Immediately remove row from table without reload
                              setRecords((prev) => prev.filter((rec) => rec._id !== r._id));
                              try {
                                await api.delete(`/employee/calling-records/${r._id}`);
                                setToast("Calling report deleted successfully!");
                                emitDataSync({ type: "calling", action: "delete", id: r._id });
                                fetchRecords(true);
                              } catch (error) {
                                fetchRecords(true);
                                setToast(error.response?.data?.message || "Failed to delete record");
                              }
                            }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Page Zero Scroll Modal for Add/Edit Calling Record */}
      {isFormOpen && (
        <div className="modal-backdrop" onClick={handleReset}>
          <div className="modal-card modal-card-compact" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: "12px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="badge badge-blue" style={{ fontSize: "11px", fontWeight: 700 }}>
                  {editingId ? "EDIT RECORD" : "NEW RECORD"}
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                  {editingId ? "Update Calling Performance" : "Submit Daily Calling Performance"}
                </h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={handleReset}>
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-body modal-body-compact">
                {/* Section 1: Call Volume & Activity (Row 1) */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span>1. Calling Activity &amp; Executive Info</span>
                  </div>
                  <div className="compact-grid-4">
                    <div className="form-group">
                      <label className="form-label">Calling Date *</label>
                      <div className="styled-picker-wrap">
                        <span className="picker-icon"><CalendarIcon /></span>
                        <input
                          type="date"
                          name="date"
                          className={`form-control ${errors.date ? "is-invalid" : ""}`}
                          value={form.date}
                          max={today}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      {errors.date && <small className="error-text">{errors.date}</small>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Executive Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={user?.name || "Sales Executive"}
                        readOnly
                        disabled
                        style={{ background: "#f1f5f9", color: "#64748b" }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Outgoing Calls</label>
                      <input
                        type="number"
                        name="outgoingCalls"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={form.outgoingCalls}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Incoming Calls</label>
                      <input
                        type="number"
                        name="incomingCalls"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={form.incomingCalls}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Connectivity & Leads Generated (Row 2) */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                    <span>2. Call Connectivity &amp; Leads Outcome</span>
                  </div>
                  <div className="compact-grid-4">
                    <div className="form-group">
                      <label className="form-label">Connected Calls</label>
                      <input
                        type="number"
                        name="connectedCalls"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={form.connectedCalls}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Not Connected (Auto)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formNotConnected}
                        readOnly
                        disabled
                        style={{ background: "#fef2f2", color: "#b91c1c", fontWeight: 700 }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Interested Leads</label>
                      <input
                        type="number"
                        name="interestedLeads"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={form.interestedLeads}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Not Interested Leads</label>
                      <input
                        type="number"
                        name="notInterestedLeads"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={form.notInterestedLeads}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Follow-ups, Conversions & Revenue (Row 3) */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <span>3. Follow-ups, Conversions &amp; Revenue</span>
                  </div>
                  <div className="compact-grid-4">
                    <div className="form-group">
                      <label className="form-label">Follow-up Calls</label>
                      <input
                        type="number"
                        name="followUpCalls"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={form.followUpCalls}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Follow-up Leads</label>
                      <input
                        type="number"
                        name="followUpLeads"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={form.followUpLeads}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Conversions Done <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="number"
                        name="conversionsDone"
                        className={`form-control ${errors.conversionsDone ? "is-invalid" : ""}`}
                        placeholder="e.g. 2"
                        min="0"
                        required
                        value={form.conversionsDone}
                        onChange={handleChange}
                      />
                      {errors.conversionsDone && <small className="error-text">{errors.conversionsDone}</small>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Revenue Generated (₹) <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="number"
                        name="revenueGenerated"
                        className={`form-control ${errors.revenueGenerated ? "is-invalid" : ""}`}
                        placeholder="e.g. 15000"
                        min="0"
                        required
                        value={form.revenueGenerated}
                        onChange={handleChange}
                      />
                      {errors.revenueGenerated && <small className="error-text">{errors.revenueGenerated}</small>}
                    </div>
                  </div>
                </div>

                {/* Subtle calculation highlight bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 14px",
                    background: "#f0f9ff",
                    border: "1px solid #bae6fd",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#0369a1"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span>
                      Total Calls (Out + In + F/U): <strong>{formTotalCalls}</strong>
                    </span>
                    <span>
                      Not Connected: <strong>{formNotConnected}</strong>
                    </span>
                  </div>
                  <div>
                    {errors.conversionsDone || errors.revenueGenerated ? (
                      <span style={{ color: "#b91c1c", fontWeight: 600 }}>* Conversions and Revenue are required</span>
                    ) : (
                      <span style={{ color: "#0284c7" }}>All metrics calculated live</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer" style={{ padding: "10px 20px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: "6px 16px", fontSize: "13px" }}
                  onClick={handleReset}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "6px 20px", fontSize: "13px" }}
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingId ? "Update Calling Record" : "Save Calling Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type={toast.includes("successfully") ? "success" : "error"} onClose={clearToast} />}

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Calling Records from CSV"
        description="Upload your calling performance records. Columns will be automatically mapped to your dashboard."
        templateFilename="calling_records_template.csv"
        templateHeaders={[
          "Date",
          "Outgoing Calls",
          "Incoming Calls",
          "Connected Calls",
          "Not Connected Calls",
          "Interested Leads",
          "Not Interested Leads",
          "Follow Up Calls",
          "Follow Up Leads",
          "Conversions Done",
          "Revenue Generated"
        ]}
        templateSampleRows={[
          ["2026-09-29", "85", "25", "70", "15", "14", "56", "20", "12", "5", "520000"],
          ["2026-09-28", "90", "18", "72", "18", "16", "56", "22", "15", "6", "640000"]
        ]}
        requiredHeaders={["Date", "Outgoing Calls", "Connected Calls"]}
        onImport={handleImportCallingRecords}
      />
    </div>
  );
};

export default EmployeeCallingPage;
