import { useCallback, useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

const FILTERS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "custom", label: "Custom Range" }
];

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
  const tableContainerRef = useRef(null);

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
    if (form.conversionsDone === "" || form.conversionsDone === null || form.conversionsDone === undefined) {
      next.conversionsDone = "Required";
    } else if (Number(form.conversionsDone) < 0) {
      next.conversionsDone = "Must be 0+";
    }

    if (form.revenueGenerated === "" || form.revenueGenerated === null || form.revenueGenerated === undefined) {
      next.revenueGenerated = "Required";
    } else if (Number(form.revenueGenerated) < 0) {
      next.revenueGenerated = "Must be 0+";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = { filter };
      if (filter === "custom") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const res = await api.get("/employee/calling-records", { params });
      setRecords(res.data.data || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filter, startDate, endDate]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
        await api.put(`/employee/calling-records/${editingId}`, payload);
        setToast("Calling report updated successfully!");
      } else {
        await api.post("/employee/calling-records", payload);
        setToast("Calling report submitted successfully!");
      }

      setForm(getInitialState());
      setEditingId(null);
      setErrors({});
      setIsFormOpen(false);
      fetchRecords();
    } catch (error) {
      setToast(error.response?.data?.message || "Failed to save calling report");
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

  return (
    <div className="customers-page">
      {/* Page Header */}
      <div className="customers-page-header">
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "var(--text-heading)" }}>
            Telecalling Performance
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
            Submit and monitor your daily calling metrics, customer leads &amp; conversion revenue
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => downloadCallingPDF(records, user?.name)}
            disabled={records.length === 0}
          >
            <DownloadIcon />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
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

      {/* KPI Summary Cards */}
      <div className="kpi-grid-4">
        <div className="glass-card" style={{ padding: "12px 14px", borderTop: "3px solid #0284c7" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Total Calls
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#0284c7", marginTop: "4px" }}>
            {totals.totalCalls}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "12px 14px", borderTop: "3px solid #3b82f6" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Outgoing
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#3b82f6", marginTop: "4px" }}>
            {totals.outgoingCalls}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "12px 14px", borderTop: "3px solid #8b5cf6" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Incoming
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#8b5cf6", marginTop: "4px" }}>
            {totals.incomingCalls}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "12px 14px", borderTop: "3px solid #10b981" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Connected
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#10b981", marginTop: "4px" }}>
            {totals.connectedCalls}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "12px 14px", borderTop: "3px solid #ef4444" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Not Connected
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#ef4444", marginTop: "4px" }}>
            {totals.notConnectedCalls}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "12px 14px", borderTop: "3px solid #f59e0b" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Interested
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#f59e0b", marginTop: "4px" }}>
            {totals.interestedLeads}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "12px 14px", borderTop: "3px solid #06b6d4" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Conversions
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#06b6d4", marginTop: "4px" }}>
            {totals.conversionsDone}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "12px 14px", borderTop: "3px solid #10b981" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Revenue
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#10b981", marginTop: "4px" }}>
            ₹{totals.revenueGenerated.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-card"
        style={{
          padding: "12px 16px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Period:
          </span>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`btn btn-sm ${filter === f.id ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "5px 12px", fontSize: "12px", borderRadius: "20px" }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {filter === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="date"
                className="form-control"
                style={{ height: "32px", fontSize: "12px", width: "auto" }}
                value={startDate}
                max={today}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (endDate && val > endDate) setEndDate("");
                }}
              />
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>to</span>
              <input
                type="date"
                className="form-control"
                style={{ height: "32px", fontSize: "12px", width: "auto" }}
                value={endDate}
                min={startDate}
                max={today}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchRecords}
            style={{ height: "32px", padding: "0 12px" }}
            title="Refresh Data"
          >
            <RefreshIcon />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Calling Records Table */}
      <div className="table-card">
        <div
          className="table-card-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid #f1f5f9"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--text-heading)" }}>
              Calling Records
            </h3>
            <span className="badge badge-blue" style={{ fontSize: "11px" }}>
              {records.length} Records
            </span>
          </div>

          <div style={{ display: "flex", gap: "4px" }}>
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

        <div className="table-container" ref={tableContainerRef} style={{ overflowX: "auto" }}>
          <table className="customers-table">
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
                              try {
                                await api.delete(`/employee/calling-records/${r._id}`);
                                setToast("Calling report deleted successfully!");
                                fetchRecords();
                              } catch (error) {
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

            <form onSubmit={handleSubmit}>
              <div className="modal-body modal-body-compact">
                {/* Section 1: Call Volume & Activity (Row 1) */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span>1. Calling Activity &amp; Executive Info</span>
                  </div>
                  <div className="compact-grid-4">
                    <div className="form-group">
                      <label className="form-label">Calling Date</label>
                      <div className="styled-picker-wrap">
                        <span className="picker-icon"><CalendarIcon /></span>
                        <input
                          type="date"
                          name="date"
                          className="form-control"
                          value={form.date}
                          max={today}
                          onChange={handleChange}
                          required
                        />
                      </div>
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
                        className="form-control"
                        placeholder="e.g. 2"
                        min="0"
                        required
                        value={form.conversionsDone}
                        onChange={handleChange}
                        style={errors.conversionsDone ? { borderColor: "#ef4444" } : {}}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Revenue Generated (₹) <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="number"
                        name="revenueGenerated"
                        className="form-control"
                        placeholder="e.g. 15000"
                        min="0"
                        required
                        value={form.revenueGenerated}
                        onChange={handleChange}
                        style={errors.revenueGenerated ? { borderColor: "#ef4444" } : {}}
                      />
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
    </div>
  );
};

export default EmployeeCallingPage;
