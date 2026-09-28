import { useCallback, useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../api/client";

const FILTERS = ["today", "yesterday", "week", "month", "custom"];

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

const downloadCallingPDF = (records, filter, startDate, endDate) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Calling Report", pageWidth / 2, y, { align: "center" });
  y += 8;

  const period = startDate || endDate ? `${startDate || "..."} to ${endDate || "..."}` : formatLabel(filter);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Period: ${period} | Total Records: ${records.length}`, pageWidth / 2, y, { align: "center" });
  y += 10;

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
    `Rs.${r.revenueGenerated || 0}`
  ]);

  const totalsRow = [
    "TOTAL", "-",
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
    `Rs.${records.reduce((s, r) => s + (r.revenueGenerated || 0), 0).toLocaleString("en-IN")}`
  ];

  autoTable(doc, {
    startY: y, theme: "grid",
    head: [["Date", "Executive", "Outgoing", "Incoming", "Connected", "Not Conn.", "Interested", "Not Int.", "F/U Calls", "F/U Leads", "Total Calls", "Conv.", "Revenue"]],
    body: [...rows, totalsRow],
    headStyles: { fillColor: [6, 182, 212], fontSize: 7, fontStyle: "bold", textColor: 255 },
    bodyStyles: { fontSize: 7, textColor: [30, 30, 30] },
    styles: { cellPadding: 1.5, halign: "center" },
    columnStyles: {
      0: { cellWidth: 24, halign: "left" },
      1: { cellWidth: 30, halign: "left" },
      12: { halign: "right" }
    },
    didParseCell: function (data) {
      if (data.row.index === rows.length) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 240, 240];
      }
    },
    margin: { left: 14 }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  doc.save("Calling_Report.pdf");
};

const CallingReportPage = () => {
  const today = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get("/auth/users");
      const emps = (res.data.data || []).filter((u) => u.role === "employee");
      // Sort alphabetically by employee name
      emps.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setEmployees(emps);
    } catch {
      setEmployees([]);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedEmployee) params.employeeId = selectedEmployee;

      const now = new Date();
      if (filter === "today") {
        params.startDate = now.toISOString().split("T")[0];
        params.endDate = now.toISOString().split("T")[0];
      } else if (filter === "yesterday") {
        const y = new Date(now); y.setDate(y.getDate() - 1);
        params.startDate = y.toISOString().split("T")[0];
        params.endDate = y.toISOString().split("T")[0];
      } else if (filter === "week") {
        const start = new Date(now); start.setDate(start.getDate() - start.getDay());
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

      const res = await api.get("/calling-records", { params });
      setRecords(res.data.data || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, filter, startDate, endDate]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

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
      acc.revenueGenerated += r.revenueGenerated || 0;
      acc.totalCalls += (r.outgoingCalls || 0) + (r.incomingCalls || 0) + (r.followUpCalls || 0);
      return acc;
    },
    {
      outgoingCalls: 0, incomingCalls: 0, connectedCalls: 0,
      notConnectedCalls: 0, interestedLeads: 0, notInterestedLeads: 0,
      followUpCalls: 0, followUpLeads: 0, conversionsDone: 0, revenueGenerated: 0,
      totalCalls: 0
    }
  );

  return (
    <div className="customers-page">
      {/* Page Header */}
      <div className="customers-page-header">
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "var(--text-heading)" }}>
            Telecalling Management Report
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
            Monitor executive calling performance, lead generation, conversions &amp; revenue
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: "#10b981", borderColor: "#10b981" }}
            onClick={() => downloadCallingPDF(records, filter, startDate, endDate)}
            disabled={records.length === 0}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download PDF</span>
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Executive:
            </span>
            <select
              className="form-control"
              style={{ height: "34px", padding: "4px 10px", fontSize: "12.5px", width: "auto", minWidth: "180px" }}
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">-- All Executives --</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Period:
            </span>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "5px 12px", fontSize: "12px", borderRadius: "20px" }}
              >
                {formatLabel(f)}
              </button>
            ))}
          </div>
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
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
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
        </div>

        <div className="table-container" style={{ overflowX: "auto" }}>
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
                    Loading calling records...
                  </td>
                </tr>
              )}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No calling records found for selected period and executive.
                  </td>
                </tr>
              )}
              {!loading &&
                records.map((r) => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600, color: "var(--text-heading)", whiteSpace: "nowrap" }}>
                      {formatDate(r.date)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.employeeName || "-"}</td>
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
                    <td style={{ fontWeight: 700, color: "var(--primary)" }}>
                      {(r.outgoingCalls || 0) + (r.incomingCalls || 0) + (r.followUpCalls || 0)}
                    </td>
                    <td>
                      <span className="badge badge-blue" style={{ fontSize: "11px", fontWeight: 700 }}>
                        {r.conversionsDone || 0}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "#10b981", whiteSpace: "nowrap" }}>
                      ₹{Number(r.revenueGenerated || 0).toLocaleString("en-IN")}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="btn-action btn-action-delete"
                        title="Delete Record"
                        onClick={async () => {
                          if (!window.confirm(`Delete calling record from ${formatDate(r.date)}?`)) return;
                          await api.delete(`/calling-records/${r._id}`);
                          fetchRecords();
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CallingReportPage;
