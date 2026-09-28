import { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../api/client";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

const statusBadge = (status) => {
  const s = (status || "").toLowerCase();
  const map = {
    pending: "#f59e0b", approved: "#3b82f6", processing: "#3b82f6",
    delivered: "#22c55e", cancelled: "#ef4444", "return requested": "#f59e0b",
    "return approved": "#3b82f6", "pickup scheduled": "#3b82f6",
    "returned successfully": "#22c55e", "return rejected": "#ef4444"
  };
  const c = map[s] || "#64748b";
  return <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: `${c}20`, color: c }}>{status}</span>;
};

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const downloadEmployeePDF = async (employee, startDate, endDate) => {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await api.get(`/admin/employee-details/${employee._id}`, { params });
    const { orders, returns, callingRecords, customers } = res.data.data;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // ── Title ──
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Employee Details Report", pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setDrawColor(6, 182, 212);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    y += 10;

    // ── Employee Info ──
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Employee Information", 14, y);
    y += 8;

    const rangeText = startDate || endDate ? `${startDate || "..."} to ${endDate || "..."}` : "All Time";
    const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalRevenue = callingRecords.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);

    const empInfo = [
      ["Employee ID", (employee._id || "").slice(-8).toUpperCase()],
      ["Name", employee.name || "-"],
      ["Email", employee.email || "-"],
      ["Phone", employee.phoneNumber || "-"],
      ["Username", employee.username || "-"],
      ["Role", employee.role || "-"],
      ["Total Sales", `Rs.${totalSales.toLocaleString("en-IN")}`],
      ["Total Revenue", `Rs.${totalRevenue.toLocaleString("en-IN")}`],
      ["Registered", employee.createdAt ? new Date(employee.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"],
      ["Report Period", rangeText],
      ["Generated On", new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })]
    ];

    doc.setFontSize(10);
    empInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 14, y);
      const tw = doc.getTextWidth(`${label}: `);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), 14 + tw + 2, y);
      y += 6;
    });
    y += 6;

    y += 4;

    // ── Orders ──
    if (orders.length > 0) {
      if (y > 200) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(`Orders (${orders.length})`, 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        theme: "grid",
        head: [["ID", "Customer", "Mobile", "Product", "Qty", "Amount", "Advance", "Status", "Parcel", "Tracking", "Date"]],
        body: orders.map((o) => [
          (o._id || "").slice(-6).toUpperCase(),
          o.customerName || "-",
          o.mobileNumber || "-",
          o.productType === "Other" ? (o.customProductName || "Other") : (o.productType || "-"),
          o.numberOfUnits || 0,
          `Rs.${o.totalAmount || 0}`,
          `Rs.${o.advanceAmount || 0}`,
          o.orderStatus || "-",
          o.parcelStatus || "-",
          o.trackingId || "-",
          formatDate(o.dateOfOrder || o.createdAt)
        ]),
        headStyles: { fillColor: [6, 182, 212], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 7 },
        styles: { cellPadding: 1.5, overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 22 },
          2: { cellWidth: 20 },
          3: { cellWidth: 22 },
          6: { cellWidth: 18 },
          9: { cellWidth: 22 }
        },
        margin: { left: 14 }
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    // ── Returns ──
    if (returns.length > 0) {
      if (y > 200) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(`Returns (${returns.length})`, 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        theme: "grid",
        head: [["ID", "Customer", "Mobile", "Product", "Qty", "Reason", "Description", "Status", "Date"]],
        body: returns.map((r) => [
          (r._id || "").slice(-6).toUpperCase(),
          r.customerName || "-",
          r.mobileNumber || "-",
          r.productType === "Other" ? (r.customReason || "Other") : (r.productType || "-"),
          r.numberOfUnitsReturning || 0,
          r.returnReason || "-",
          r.additionalDescription || "-",
          r.returnStatus || "-",
          formatDate(r.returnDate || r.createdAt)
        ]),
        headStyles: { fillColor: [245, 158, 11], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 7 },
        styles: { cellPadding: 1.5, overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 22 },
          2: { cellWidth: 20 },
          3: { cellWidth: 22 },
          6: { cellWidth: 30 }
        },
        margin: { left: 14 }
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    // ── Calling Records ──
    if (callingRecords.length > 0) {
      if (y > 200) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(`Calling Records (${callingRecords.length})`, 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        theme: "grid",
        head: [["Date", "Outgoing", "Incoming", "Connected", "Not Connected", "Interested", "Not Interested", "F/U Calls", "F/U Leads", "Total", "Conversions", "Revenue"]],
        body: callingRecords.map((c) => [
          formatDate(c.date),
          c.outgoingCalls || 0,
          c.incomingCalls || 0,
          c.connectedCalls || 0,
          c.notConnectedCalls || 0,
          c.interestedLeads || 0,
          c.notInterestedLeads || 0,
          c.followUpCalls || 0,
          c.followUpLeads || 0,
          (c.outgoingCalls || 0) + (c.incomingCalls || 0) + (c.followUpCalls || 0),
          c.conversionsDone || 0,
          `Rs.${c.revenueGenerated || 0}`
        ]),
        headStyles: { fillColor: [16, 185, 129], fontSize: 7, fontStyle: "bold" },
        bodyStyles: { fontSize: 7 },
        styles: { cellPadding: 1.5 },
        margin: { left: 14 }
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    // ── CRM Customers ──
    if (customers.length > 0) {
      if (y > 200) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(`CRM Customers (${customers.length})`, 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        theme: "grid",
        head: [["Name", "Mobile", "Email", "District", "State", "Follow Up", "Remark", "Date"]],
        body: customers.map((c) => [
          c.customerName || "-",
          c.mobile || "-",
          c.email || "-",
          c.district || "-",
          c.state || "-",
          c.followUp || "-",
          c.remark || "-",
          formatDate(c.createdAt)
        ]),
        headStyles: { fillColor: [139, 92, 246], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 7 },
        styles: { cellPadding: 1.5, overflow: "linebreak" },
        margin: { left: 14 }
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    // ── Summary ──
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Sales & Revenue Summary", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Total Sales:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(`Rs.${totalSales.toLocaleString("en-IN")}`, 50, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Total Revenue:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(`Rs.${totalRevenue.toLocaleString("en-IN")}`, 50, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Total Orders:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(orders.length), 50, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Total Returns:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(returns.length), 50, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Total Calling Records:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(callingRecords.length), 50, y);
    y += 10;

    // ── Footer ──
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
      doc.text("Confidential - Employee Report", 14, doc.internal.pageSize.getHeight() - 8);
    }

    doc.save(`${employee.name.replace(/\s+/g, "_")}_Report.pdf`);
  } catch (err) {
    alert("Failed to generate PDF: " + (err.response?.data?.message || err.message));
  }
};

const EmployeeDetailsPage = () => {
  const today = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get("/admin/employee-summary", { params });
      setEmployees(res.data.data || []);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter((e) => {
      const nameVal = (e.name || "").toLowerCase().trim();
      const emailVal = (e.email || "").toLowerCase().trim();
      const phoneVal = (e.phoneNumber || "").toLowerCase().trim();
      const userVal = (e.username || "").toLowerCase().trim();
      return (
        nameVal.startsWith(q) ||
        emailVal.startsWith(q) ||
        phoneVal.startsWith(q) ||
        userVal.startsWith(q)
      );
    });
  }, [employees, search]);

  const handleViewDetails = async (emp) => {
    setSelected(emp);
    setIsModalOpen(true);
    setDetailsLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get(`/admin/employee-details/${emp._id}`, { params });
      setDetails(res.data.data);
    } catch {
      setDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDownload = async (emp) => {
    setDownloading(emp._id);
    await downloadEmployeePDF(emp, startDate, endDate);
    setDownloading(null);
  };

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Employee Details</h2>
          <p className="page-subtitle">View all employee data with orders, returns & calling records</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "end" }}>
        <label className="field-wrap" style={{ minWidth: 160 }}>
          <span>From Date</span>
          <input
            type="date"
            value={startDate}
            max={today}
            onChange={(e) => {
              const val = e.target.value;
              setStartDate(val);
              if (endDate && val > endDate) {
                setEndDate("");
              }
            }}
          />
        </label>
        <label className="field-wrap" style={{ minWidth: 160 }}>
          <span>To Date</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={today}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        {(startDate || endDate) && (
          <button className="primary-btn" style={{ background: "#64748b" }} onClick={() => { setStartDate(""); setEndDate(""); }}>
            Clear Filter
          </button>
        )}
      </div>

      <div className="table-shell glass-card" style={{ marginBottom: 20 }}>
        <div className="table-header">
          <h3>All Employees ({filtered.length})</h3>
          <div className="table-controls">
            <div style={{ position: "relative" }}>
              <SearchIcon />
              <input
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 32, minWidth: 0, width: "100%" }}
              />
            </div>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>USERNAME</th>
                <th>PHONE</th>
                <th>ORDERS</th>
                <th>RETURNS</th>
                <th>CALLING</th>
                <th>SALES</th>
                <th>REVENUE</th>
                <th style={{ textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>Loading...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>No employees found</td></tr>}
              {filtered.map((emp) => (
                <tr key={emp._id} style={{ background: selected?._id === emp._id ? "rgba(6,182,212,0.06)" : "transparent" }}>
                  <td style={{ fontWeight: 600 }}>{emp.username || emp.name}</td>
                  <td>{emp.phoneNumber || "-"}</td>
                  <td><span style={{ fontWeight: 700, color: "#3b82f6" }}>{emp.orderCount || 0}</span></td>
                  <td><span style={{ fontWeight: 700, color: "#f59e0b" }}>{emp.returnCount || 0}</span></td>
                  <td><span style={{ fontWeight: 700, color: "#10b981" }}>{emp.callingCount || 0}</span></td>
                  <td><span style={{ fontWeight: 700, color: "#8b5cf6" }}>Rs.{(emp.totalSales || 0).toLocaleString("en-IN")}</span></td>
                  <td><span style={{ fontWeight: 700, color: "#ec4899" }}>Rs.{(emp.totalRevenue || 0).toLocaleString("en-IN")}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", flexWrap: "nowrap" }}>
                      <button
                        title="View Details"
                        onClick={(e) => { e.stopPropagation(); handleViewDetails(emp); }}
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
                        className="primary-btn"
                        style={{ padding: "6px 14px", fontSize: 12, background: "#10b981" }}
                        onClick={(e) => { e.stopPropagation(); handleDownload(emp); }}
                        disabled={downloading === emp._id}
                      >
                        {downloading === emp._id ? "Generating..." : "PDF"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selected && (
        <div className="modal-overlay" onClick={() => { setIsModalOpen(false); setSelected(null); setDetails(null); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "1000px", width: "95%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 className="modal-title" style={{ margin: 0 }}>
                {selected.name} ({selected.username}) — Full Details
                {(startDate || endDate) && <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)", marginLeft: 12 }}>({startDate || "..."} to {endDate || "..."})</span>}
              </h3>
              <button
                className="primary-btn"
                style={{ padding: "6px 14px", fontSize: 12, background: "#64748b" }}
                onClick={() => { setIsModalOpen(false); setSelected(null); setDetails(null); }}
              >
                Close
              </button>
            </div>

            {detailsLoading && <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>Loading details...</p>}

            {!detailsLoading && details && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Orders table */}
                <div className="table-shell glass-card" style={{ padding: 20 }}>
                  <div className="table-header"><h3>Orders ({details.orders.length})</h3></div>
                  <div className="table-scroll" style={{ overflowX: "auto", width: "100%", maxWidth: "100%" }}>
                    <table style={{ minWidth: "800px" }}>
                      <thead>
                        <tr><th>ID</th><th>Customer</th><th>Product</th><th>Qty</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                      </thead>
                      <tbody>
                        {details.orders.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>No orders</td></tr>}
                        {details.orders.map((o) => (
                          <tr key={o._id}>
                            <td style={{ fontFamily: "monospace", fontSize: 12 }}>{(o._id || "").slice(-6).toUpperCase()}</td>
                            <td>{o.customerName || "-"}</td>
                            <td>{o.productType || "-"}</td>
                            <td>{o.numberOfUnits || 0}</td>
                            <td>Rs.{o.totalAmount || 0}</td>
                            <td>{statusBadge(o.orderStatus)}</td>
                            <td>{formatDateTime(o.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Returns table */}
                <div className="table-shell glass-card" style={{ padding: 20 }}>
                  <div className="table-header"><h3>Returns ({details.returns.length})</h3></div>
                  <div className="table-scroll" style={{ overflowX: "auto", width: "100%", maxWidth: "100%" }}>
                    <table style={{ minWidth: "800px" }}>
                      <thead>
                        <tr><th>ID</th><th>Customer</th><th>Product</th><th>Qty</th><th>Reason</th><th>Status</th><th>Date</th></tr>
                      </thead>
                      <tbody>
                        {details.returns.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>No returns</td></tr>}
                        {details.returns.map((r) => (
                          <tr key={r._id}>
                            <td style={{ fontFamily: "monospace", fontSize: 12 }}>{(r._id || "").slice(-6).toUpperCase()}</td>
                            <td>{r.customerName || "-"}</td>
                            <td>{r.productType || "-"}</td>
                            <td>{r.numberOfUnitsReturning || 0}</td>
                            <td>{r.returnReason || "-"}</td>
                            <td>{statusBadge(r.returnStatus)}</td>
                            <td>{formatDateTime(r.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* CRM Customers table */}
                <div className="table-shell glass-card" style={{ padding: 20 }}>
                  <div className="table-header"><h3>CRM Customers ({details.customers.length})</h3></div>
                  <div className="table-scroll" style={{ overflowX: "auto", width: "100%", maxWidth: "100%" }}>
                    <table style={{ minWidth: "800px" }}>
                      <thead>
                        <tr><th>Name</th><th>Mobile</th><th>Email</th><th>District</th><th>State</th><th>Follow Up</th><th>Date</th></tr>
                      </thead>
                      <tbody>
                        {details.customers.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>No CRM customers</td></tr>}
                        {details.customers.map((c) => (
                          <tr key={c._id}>
                            <td style={{ fontWeight: 600 }}>{c.customerName || "-"}</td>
                            <td>{c.mobile || "-"}</td>
                            <td>{c.email || "-"}</td>
                            <td>{c.district || "-"}</td>
                            <td>{c.state || "-"}</td>
                            <td>{c.followUp || "-"}</td>
                            <td>{formatDateTime(c.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Calling Records table */}
                <div className="table-shell glass-card" style={{ padding: 20 }}>
                  <div className="table-header"><h3>Calling Records ({details.callingRecords.length})</h3></div>
                  <div className="table-scroll" style={{ overflowX: "auto", width: "100%", maxWidth: "100%" }}>
                    <table style={{ minWidth: "1200px" }}>
                      <thead>
                        <tr><th>Date</th><th>Outgoing</th><th>Incoming</th><th>Connected</th><th>Not Connected</th><th>Interested</th><th>Not Interested</th><th>F/U Calls</th><th>F/U Leads</th><th>Total Calls</th><th>Conversions</th><th>Revenue</th></tr>
                      </thead>
                      <tbody>
                        {details.callingRecords.length === 0 && <tr><td colSpan={12} style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>No calling records</td></tr>}
                        {details.callingRecords.map((c) => {
                          const totalCalls = (c.outgoingCalls || 0) + (c.incomingCalls || 0) + (c.followUpCalls || 0);
                          return (
                            <tr key={c._id}>
                              <td>{formatDate(c.date)}</td>
                              <td>{c.outgoingCalls || 0}</td>
                              <td>{c.incomingCalls || 0}</td>
                              <td>{c.connectedCalls || 0}</td>
                              <td>{c.notConnectedCalls || 0}</td>
                              <td>{c.interestedLeads || 0}</td>
                              <td>{c.notInterestedLeads || 0}</td>
                              <td>{c.followUpCalls || 0}</td>
                              <td>{c.followUpLeads || 0}</td>
                              <td style={{ fontWeight: 600 }}>{totalCalls}</td>
                              <td>{c.conversionsDone || 0}</td>
                              <td style={{ fontWeight: 600 }}>Rs.{c.revenueGenerated || 0}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default EmployeeDetailsPage;
