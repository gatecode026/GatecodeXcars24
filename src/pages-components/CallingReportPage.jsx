"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api, emitDataSync, onDataSync } from "../api/client";
import CsvImportModal from "../components/CsvImportModal";
import { exportTableToCsv } from "../utils/csvHelper";

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const HeadsetIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const PhoneCallIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const PhoneOutgoingIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 7 23 1 17 1" />
    <line x1="16" y1="8" x2="23" y2="1" />
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const PhoneIncomingIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 2 16 8 22 8" />
    <line x1="23" y1="1" x2="16" y2="8" />
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const PhoneMissedIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="23" y1="1" x2="17" y2="7" />
    <line x1="17" y1="1" x2="23" y2="7" />
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

const RupeeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13l8.5 8" />
    <path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: "transform 0.4s ease",
      transform: spinning ? "rotate(360deg)" : "none"
    }}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Filter Options ─────────────────────────────────────────────────────────
const FILTERS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "custom", label: "Custom Range" }
];

const formatLabel = (f) => {
  switch (f) {
    case "today": return "Today";
    case "yesterday": return "Yesterday";
    case "week": return "This Week";
    case "month": return "This Month";
    case "custom": return "Custom Range";
    default: return f;
  }
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

// ─── PDF Report Generation ──────────────────────────────────────────────────
const downloadCallingPDF = (records, filter, startDate, endDate) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 18;

  // Header banner
  doc.setFillColor(2, 132, 199);
  doc.rect(14, y, pageWidth - 28, 18, "F");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("GATECODEXCARS24 — TELECALLING MANAGEMENT REPORT", 20, y + 8);

  const periodText = startDate || endDate ? `${startDate || "..."} to ${endDate || "..."}` : formatLabel(filter);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(224, 242, 254);
  doc.text(`Report Period: ${periodText}  |  Generated on: ${new Date().toLocaleDateString("en-IN")}  |  Total Records: ${records.length}`, 20, y + 14);

  y += 24;

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
    `Rs. ${(r.revenueGenerated || 0).toLocaleString("en-IN")}`
  ]);

  const totalsRow = [
    "TOTALS",
    "-",
    records.reduce((s, r) => s + (r.outgoingCalls || 0), 0),
    records.reduce((s, r) => s + (r.incomingCalls || 0), 0),
    records.reduce((s, r) => s + (r.connectedCalls || 0), 0),
    records.reduce((s, r) => s + (r.notConnectedCalls || 0), 0),
    records.reduce((s, r) => s + (r.interestedLeads || 0), 0),
    records.reduce((s, r) => s + (r.notInterestedLeads || 0), 0),
    records.reduce((s, r) => s + (r.followUpCalls || 0), 0),
    records.reduce((s, r) => s + (r.followUpLeads || 0), 0),
    records.reduce((s, r) => s + (r.outgoingCalls || 0) + (r.incomingCalls || 0) + (r.followUpCalls || 0), 0),
    records.reduce((s, r) => s + (r.conversionsDone || 0), 0),
    `Rs. ${records.reduce((s, r) => s + (r.revenueGenerated || 0), 0).toLocaleString("en-IN")}`
  ];

  autoTable(doc, {
    startY: y,
    theme: "striped",
    head: [["Date", "Executive", "Outgoing", "Incoming", "Connected", "Not Conn.", "Interested", "Not Int.", "F/U Calls", "F/U Leads", "Total Calls", "Conv.", "Revenue"]],
    body: [...rows, totalsRow],
    headStyles: {
      fillColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: "bold",
      textColor: 255,
      halign: "center"
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    styles: {
      cellPadding: 2,
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: 24, halign: "left" },
      1: { cellWidth: 32, halign: "left" },
      12: { halign: "right", fontStyle: "bold" }
    },
    didParseCell: function (data) {
      if (data.row.index === rows.length) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [224, 242, 254];
        data.cell.styles.textColor = [2, 132, 199];
      }
    },
    margin: { left: 14, right: 14 }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Cars24 Gatecode CRM • Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  doc.save(`Telecalling_Report_${periodText.replace(/[\s/]/g, "_")}.pdf`);
};

// ─── Main Component ─────────────────────────────────────────────────────────
const CallingReportPage = () => {
  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const handleImportCallingRecords = async (rows) => {
    const res = await api.post("/calling-records/bulk-import", { rows });
    alert(res.data?.message || `Imported ${rows.length} calling records successfully!`);
    emitDataSync({ type: "calling", action: "bulk" });
    fetchRecords(false);
  };

  const handleExportCSV = () => {
    if (!filteredRecords || filteredRecords.length === 0) {
      alert("No calling records available to export");
      return;
    }
    const headers = [
      "Date",
      "Executive Name",
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
      "Revenue Generated (INR)"
    ];
    const rows = filteredRecords.map((r) => [
      r.date ? new Date(r.date).toISOString().split("T")[0] : "-",
      r.employeeName || r.employeeId?.name || "Executive",
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
    exportTableToCsv(`Admin_Calling_Report_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
  };

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get("/auth/users");
      const emps = (res.data.data || []).filter((u) => u.role === "employee");
      emps.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setEmployees(emps);
    } catch {
      setEmployees([]);
    }
  }, []);

  const fetchRecords = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = {};
      if (selectedEmployee) params.employeeId = selectedEmployee;

      const now = new Date();
      if (filter === "today") {
        params.startDate = now.toISOString().split("T")[0];
        params.endDate = now.toISOString().split("T")[0];
      } else if (filter === "yesterday") {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        params.startDate = y.toISOString().split("T")[0];
        params.endDate = y.toISOString().split("T")[0];
      } else if (filter === "week") {
        const start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        params.startDate = start.toISOString().split("T")[0];
        params.endDate = now.toISOString().split("T")[0];
      } else if (filter === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        params.startDate = start.toISOString().split("T")[0];
        params.endDate = now.toISOString().split("T")[0];
      } else if (filter === "custom") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await api.get("/calling-records", { params, forceRefresh: silent });
      setRecords(res.data.data || []);
    } catch {
      setRecords([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedEmployee, filter, startDate, endDate]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Multi-tab and cross-component sync
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

  // Aggregate totals
  const totals = useMemo(() => {
    return records.reduce(
      (acc, r) => {
        const out = r.outgoingCalls || 0;
        const inc = r.incomingCalls || 0;
        const fu = r.followUpCalls || 0;
        acc.outgoingCalls += out;
        acc.incomingCalls += inc;
        acc.connectedCalls += r.connectedCalls || 0;
        acc.notConnectedCalls += r.notConnectedCalls || 0;
        acc.interestedLeads += r.interestedLeads || 0;
        acc.notInterestedLeads += r.notInterestedLeads || 0;
        acc.followUpCalls += fu;
        acc.followUpLeads += r.followUpLeads || 0;
        acc.conversionsDone += r.conversionsDone || 0;
        acc.revenueGenerated += r.revenueGenerated || 0;
        acc.totalCalls += out + inc + fu;
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
  }, [records]);

  // Derived Performance Metrics
  const connectRate = totals.totalCalls > 0 ? Math.round((totals.connectedCalls / totals.totalCalls) * 100) : 0;
  const leadRate = totals.connectedCalls > 0 ? Math.round((totals.interestedLeads / totals.connectedCalls) * 100) : 0;
  const convRate = totals.interestedLeads > 0 ? Math.round((totals.conversionsDone / totals.interestedLeads) * 100) : 0;
  const avgDealRevenue = totals.conversionsDone > 0 ? Math.round(totals.revenueGenerated / totals.conversionsDone) : 0;

  // Filtered records by search query
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter((r) =>
      (r.employeeName || "").toLowerCase().includes(q) ||
      (r.date || "").includes(q)
    );
  }, [records, searchQuery]);

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete calling record of ${r.employeeName || "Executive"} for ${formatDate(r.date)}?`)) return;
    // Immediately remove row from state without reload
    setRecords((prev) => prev.filter((rec) => rec._id !== r._id));
    try {
      setDeletingId(r._id);
      await api.delete(`/calling-records/${r._id}`);
      emitDataSync({ type: "calling", action: "delete", id: r._id });
      fetchRecords(true);
    } catch (err) {
      alert("Failed to delete record: " + (err.response?.data?.message || err.message));
      fetchRecords(true);
    } finally {
      setDeletingId(null);
    }
  };

  const resetAllFilters = () => {
    setSelectedEmployee("");
    setFilter("today");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
  };

  return (
    <div className="calling-page-wrap">
      {/* ─── SECTION 1: HEADER ─── */}
      <div className="calling-header-card">
        <div className="calling-title-group">
          <div className="calling-title-icon">
            <HeadsetIcon />
          </div>
          <div>
            <span className="calling-tag-chip">Telecalling Intelligence</span>
            <h1 className="calling-title-text">Telecalling Management Report</h1>
            <p className="calling-subtitle-text">
              Monitor executive call connectivity, lead generation, sales conversion &amp; revenue metrics.
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
            <RefreshIcon spinning={loading} />
            <span>{loading ? "Syncing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            className="btn-calling-pdf"
            onClick={() => downloadCallingPDF(records, filter, startDate, endDate)}
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
            disabled={filteredRecords.length === 0}
            title="Export filtered records to CSV"
          >
            <DownloadIcon />
            <span>Export CSV</span>
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
              <PhoneCallIcon />
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
              <PhoneOutgoingIcon />
            </div>
          </div>
          <div className="calling-kpi-main">
            <span className="calling-kpi-number">{totals.outgoingCalls}</span>
            <span className="calling-kpi-badge" style={{ background: "#dbeafe", color: "#1e40af" }}>
              {totals.totalCalls > 0 ? Math.round((totals.outgoingCalls / totals.totalCalls) * 100) : 0}% outbound
            </span>
          </div>
          <p className="calling-kpi-subtext">Dialed by telecalling team</p>
        </div>

        {/* Incoming Calls */}
        <div className="calling-kpi-card" style={{ "--card-accent": "#8b5cf6" }}>
          <div className="calling-kpi-top">
            <span className="calling-kpi-label">Incoming Calls</span>
            <div className="calling-kpi-icon-wrap" style={{ background: "#f5f3ff", color: "#8b5cf6" }}>
              <PhoneIncomingIcon />
            </div>
          </div>
          <div className="calling-kpi-main">
            <span className="calling-kpi-number">{totals.incomingCalls}</span>
            <span className="calling-kpi-badge" style={{ background: "#ede9fe", color: "#6b21a8" }}>
              {totals.totalCalls > 0 ? Math.round((totals.incomingCalls / totals.totalCalls) * 100) : 0}% inbound
            </span>
          </div>
          <p className="calling-kpi-subtext">Customer inbound queries</p>
        </div>

        {/* Connected Calls */}
        <div className="calling-kpi-card" style={{ "--card-accent": "#10b981" }}>
          <div className="calling-kpi-top">
            <span className="calling-kpi-label">Connected</span>
            <div className="calling-kpi-icon-wrap" style={{ background: "#ecfdf5", color: "#10b981" }}>
              <CheckCircleIcon />
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
              <PhoneMissedIcon />
            </div>
          </div>
          <div className="calling-kpi-main">
            <span className="calling-kpi-number" style={{ color: "#dc2626" }}>{totals.notConnectedCalls}</span>
            <span className="calling-kpi-badge" style={{ background: "#fee2e2", color: "#991b1b" }}>
              {totals.totalCalls > 0 ? Math.round((totals.notConnectedCalls / totals.totalCalls) * 100) : 0}% missed
            </span>
          </div>
          <p className="calling-kpi-subtext">Unanswered / busy lines</p>
        </div>

        {/* Interested Leads */}
        <div className="calling-kpi-card" style={{ "--card-accent": "#f59e0b" }}>
          <div className="calling-kpi-top">
            <span className="calling-kpi-label">Interested Leads</span>
            <div className="calling-kpi-icon-wrap" style={{ background: "#fffbeb", color: "#f59e0b" }}>
              <StarIcon />
            </div>
          </div>
          <div className="calling-kpi-main">
            <span className="calling-kpi-number" style={{ color: "#d97706" }}>{totals.interestedLeads}</span>
            <span className="calling-kpi-badge" style={{ background: "#fef3c7", color: "#92400e" }}>
              {leadRate}% of conn.
            </span>
          </div>
          <p className="calling-kpi-subtext">Potential buyers / sellers</p>
        </div>

        {/* Conversions Done */}
        <div className="calling-kpi-card" style={{ "--card-accent": "#06b6d4" }}>
          <div className="calling-kpi-top">
            <span className="calling-kpi-label">Conversions</span>
            <div className="calling-kpi-icon-wrap" style={{ background: "#ecfeff", color: "#06b6d4" }}>
              <TrophyIcon />
            </div>
          </div>
          <div className="calling-kpi-main">
            <span className="calling-kpi-number" style={{ color: "#0891b2" }}>{totals.conversionsDone}</span>
            <span className="calling-kpi-badge" style={{ background: "#cffafe", color: "#155e75" }}>
              {convRate}% close rate
            </span>
          </div>
          <p className="calling-kpi-subtext">Won appointment / deals</p>
        </div>

        {/* Revenue Generated */}
        <div className="calling-kpi-card" style={{ "--card-accent": "#10b981" }}>
          <div className="calling-kpi-top">
            <span className="calling-kpi-label">Revenue Generated</span>
            <div className="calling-kpi-icon-wrap" style={{ background: "#ecfdf5", color: "#10b981" }}>
              <RupeeIcon />
            </div>
          </div>
          <div className="calling-kpi-main">
            <span className="calling-kpi-number" style={{ color: "#059669", fontSize: "23px" }}>
              ₹{totals.revenueGenerated.toLocaleString("en-IN")}
            </span>
            <span className="calling-kpi-badge" style={{ background: "#d1fae5", color: "#065f46" }}>
              Direct Value
            </span>
          </div>
          <p className="calling-kpi-subtext">
            {totals.conversionsDone > 0 ? `Avg ₹${avgDealRevenue.toLocaleString("en-IN")} / conv.` : "Total generated value"}
          </p>
        </div>
      </div>

      {/* ─── SECTION 3: EFFICIENCY & FUNNEL STRIP ─── */}
      <div className="calling-funnel-strip">
        <div className="calling-funnel-item">
          <div className="calling-funnel-label">
            <span>Connect Rate</span>
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
            <span>Interest Conversion</span>
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
            <span>Avg Deal Ticket</span>
            <span style={{ color: "#10b981" }}>Active</span>
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

      {/* ─── SECTION 4: FILTER & CONTROL TOOLBAR ─── */}
      <div className="calling-filter-toolbar">
        <div className="calling-filter-left">
          {/* Executive Filter Dropdown */}
          <div className="calling-control-block">
            <span className="calling-control-label">Executive:</span>
            <div className="calling-select-wrap">
              <select
                className="calling-select"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">All Executives ({employees.length})</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} {emp.email ? `(${emp.email})` : ""}
                  </option>
                ))}
              </select>
              <div className="calling-select-icon">
                <ChevronDownIcon />
              </div>
            </div>
          </div>

          {/* Period Segmented Pills */}
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

          {/* Custom Date Inputs if 'custom' is active */}
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
          {/* Quick Table Search */}
          <div className="calling-search-input-wrap">
            <div className="calling-search-icon">
              <SearchIcon />
            </div>
            <input
              type="text"
              className="calling-search-input"
              placeholder="Search executive or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Clear Filters Button if any active filter */}
          {(selectedEmployee || filter !== "today" || searchQuery) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={resetAllFilters}
              style={{ height: "38px", borderRadius: "10px", fontSize: "12.5px" }}
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ─── SECTION 5: CALLING RECORDS TABLE ─── */}
      <div className="calling-table-card">
        <div className="calling-table-topbar">
          <div className="calling-table-title">
            <h2 className="calling-table-heading">Calling Performance Records</h2>
            <span className="calling-count-badge">
              {filteredRecords.length} {filteredRecords.length === 1 ? "Record" : "Records"}
            </span>
            {selectedEmployee && (
              <span
                style={{
                  fontSize: "11.5px",
                  background: "#f1f5f9",
                  color: "#334155",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontWeight: 600
                }}
              >
                Filtered: {employees.find((e) => e._id === selectedEmployee)?.name || "Executive"}
              </span>
            )}
          </div>

          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
            Period: <strong style={{ color: "#0f172a" }}>{formatLabel(filter)}</strong>
          </div>
        </div>

        <div className="calling-table-scroll">
          <table className="calling-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Executive</th>
                <th className="text-center">Outgoing</th>
                <th className="text-center">Incoming</th>
                <th className="text-center">Total Calls</th>
                <th className="text-center">Connected</th>
                <th className="text-center">Not Conn.</th>
                <th className="text-center">Interested</th>
                <th className="text-center">Not Int.</th>
                <th className="text-center">Follow-ups</th>
                <th className="text-center">Conversions</th>
                <th className="text-right">Revenue</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={13} style={{ textAlign: "center", padding: "48px 20px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: "#0284c7", fontWeight: 600 }}>
                      <RefreshIcon spinning={true} />
                      <span>Loading telecalling records...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={13} style={{ padding: 0 }}>
                    <div className="calling-empty-state">
                      <div className="calling-empty-icon">
                        <HeadsetIcon />
                      </div>
                      <h3 className="calling-empty-title">No calling records found</h3>
                      <p className="calling-empty-desc">
                        {searchQuery
                          ? `No records match your search query "${searchQuery}".`
                          : "There are no calling activity entries logged for the selected executive and period."}
                      </p>
                      {(selectedEmployee || filter !== "today" || searchQuery) && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={resetAllFilters}
                        >
                          Clear Filters &amp; Show Today
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filteredRecords.map((r) => {
                  const rowTotalCalls = (r.outgoingCalls || 0) + (r.incomingCalls || 0) + (r.followUpCalls || 0);
                  const execInitials = (r.employeeName || "E")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={r._id}>
                      {/* Date */}
                      <td style={{ fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>
                        {formatDate(r.date)}
                      </td>

                      {/* Executive with avatar */}
                      <td>
                        <div className="calling-exec-cell">
                          <div className="calling-exec-avatar">{execInitials}</div>
                          <span className="calling-exec-name">{r.employeeName || "-"}</span>
                        </div>
                      </td>

                      {/* Outgoing */}
                      <td className="text-center" style={{ fontWeight: 600, color: "#3b82f6" }}>
                        {r.outgoingCalls || 0}
                      </td>

                      {/* Incoming */}
                      <td className="text-center" style={{ fontWeight: 600, color: "#8b5cf6" }}>
                        {r.incomingCalls || 0}
                      </td>

                      {/* Total Calls */}
                      <td className="text-center">
                        <span
                          style={{
                            fontWeight: 800,
                            color: "#0f172a",
                            background: "#f1f5f9",
                            padding: "3px 9px",
                            borderRadius: "6px",
                            fontSize: "12.5px"
                          }}
                        >
                          {rowTotalCalls}
                        </span>
                      </td>

                      {/* Connected */}
                      <td className="text-center">
                        <span
                          className="badge"
                          style={{
                            background: "#dcfce7",
                            color: "#15803d",
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: "999px"
                          }}
                        >
                          {r.connectedCalls || 0}
                        </span>
                      </td>

                      {/* Not Connected */}
                      <td className="text-center">
                        <span
                          style={{
                            color: "#ef4444",
                            fontWeight: 600,
                            background: "#fef2f2",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            fontSize: "12px"
                          }}
                        >
                          {r.notConnectedCalls || 0}
                        </span>
                      </td>

                      {/* Interested */}
                      <td className="text-center">
                        <span
                          className="badge"
                          style={{
                            background: "#fef3c7",
                            color: "#b45309",
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: "999px"
                          }}
                        >
                          {r.interestedLeads || 0}
                        </span>
                      </td>

                      {/* Not Interested */}
                      <td className="text-center" style={{ color: "#94a3b8", fontWeight: 500 }}>
                        {r.notInterestedLeads || 0}
                      </td>

                      {/* Follow-ups */}
                      <td className="text-center">
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          <strong style={{ color: "#0f172a" }}>{r.followUpCalls || 0}</strong> calls /{" "}
                          <strong style={{ color: "#0f172a" }}>{r.followUpLeads || 0}</strong> leads
                        </span>
                      </td>

                      {/* Conversions */}
                      <td className="text-center">
                        <span
                          className="badge"
                          style={{
                            background: "#e0f2fe",
                            color: "#0369a1",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: "999px"
                          }}
                        >
                          {r.conversionsDone || 0}
                        </span>
                      </td>

                      {/* Revenue */}
                      <td className="text-right" style={{ fontWeight: 800, color: "#059669", whiteSpace: "nowrap" }}>
                        ₹{Number(r.revenueGenerated || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Action */}
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn-action btn-action-delete"
                          title="Delete calling record"
                          disabled={deletingId === r._id}
                          onClick={() => handleDelete(r)}
                          style={{ opacity: deletingId === r._id ? 0.4 : 1 }}
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>

            {/* Totals Summary Footer Row */}
            {!loading && filteredRecords.length > 0 && (
              <tfoot>
                <tr>
                  <td>SUMMARY TOTALS</td>
                  <td>{filteredRecords.length} records aggregated</td>
                  <td className="text-center" style={{ color: "#3b82f6" }}>
                    {filteredRecords.reduce((s, r) => s + (r.outgoingCalls || 0), 0)}
                  </td>
                  <td className="text-center" style={{ color: "#8b5cf6" }}>
                    {filteredRecords.reduce((s, r) => s + (r.incomingCalls || 0), 0)}
                  </td>
                  <td className="text-center">
                    <span style={{ background: "#e2e8f0", padding: "3px 9px", borderRadius: "6px" }}>
                      {filteredRecords.reduce(
                        (s, r) => s + (r.outgoingCalls || 0) + (r.incomingCalls || 0) + (r.followUpCalls || 0),
                        0
                      )}
                    </span>
                  </td>
                  <td className="text-center" style={{ color: "#059669" }}>
                    {filteredRecords.reduce((s, r) => s + (r.connectedCalls || 0), 0)}
                  </td>
                  <td className="text-center" style={{ color: "#dc2626" }}>
                    {filteredRecords.reduce((s, r) => s + (r.notConnectedCalls || 0), 0)}
                  </td>
                  <td className="text-center" style={{ color: "#d97706" }}>
                    {filteredRecords.reduce((s, r) => s + (r.interestedLeads || 0), 0)}
                  </td>
                  <td className="text-center" style={{ color: "#64748b" }}>
                    {filteredRecords.reduce((s, r) => s + (r.notInterestedLeads || 0), 0)}
                  </td>
                  <td className="text-center">
                    {filteredRecords.reduce((s, r) => s + (r.followUpCalls || 0), 0)} calls /{" "}
                    {filteredRecords.reduce((s, r) => s + (r.followUpLeads || 0), 0)} leads
                  </td>
                  <td className="text-center" style={{ color: "#0284c7" }}>
                    {filteredRecords.reduce((s, r) => s + (r.conversionsDone || 0), 0)}
                  </td>
                  <td className="text-right" style={{ color: "#059669" }}>
                    ₹{filteredRecords.reduce((s, r) => s + (r.revenueGenerated || 0), 0).toLocaleString("en-IN")}
                  </td>
                  <td className="text-center">-</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Calling Records from CSV"
        description="Upload telecalling performance records. Employee name or email in CSV will be matched with registered team members."
        templateFilename="admin_calling_records_template.csv"
        templateHeaders={[
          "Date",
          "Employee Name",
          "Employee Email",
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
          ["2026-09-29", "Rahul Sharma", "rahul@cars24.com", "90", "20", "75", "15", "16", "59", "25", "18", "6", "620000"],
          ["2026-09-29", "Pooja Verma", "pooja@cars24.com", "80", "15", "68", "12", "14", "54", "20", "14", "5", "510000"]
        ]}
        requiredHeaders={["Date", "Outgoing Calls", "Connected Calls"]}
        onImport={handleImportCallingRecords}
      />
    </div>
  );
};

export default CallingReportPage;
