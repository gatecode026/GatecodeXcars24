"use client";
import { useCallback, useEffect, useState } from "react";
import { api, emitDataSync, onDataSync } from "../api/client";
import CsvImportModal from "../components/CsvImportModal";
import { exportTableToCsv } from "../utils/csvHelper";

// Clean UI Icons
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
const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ animation: spinning ? "spin 0.8s linear infinite" : "none" }}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const DollarIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const CarIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H7.5a1 1 0 0 0-.8.4L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3" />
    <circle cx="6.5" cy="16.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
);

const formatINR = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SalesPage = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const handleExportCSV = () => {
    if (!data) {
      alert("No sales data available to export");
      return;
    }
    const headers = ["Period", "Cars Sold", "Units Sold", "Total Revenue (INR)", "Avg Price per Unit (INR)"];
    const rows = [
      ["Today", data.today?.count || 0, data.today?.units || 0, data.today?.total || 0, data.today?.count > 0 ? Math.round(data.today.total / data.today.count) : 0],
      ["Yesterday", data.yesterday?.count || 0, data.yesterday?.units || 0, data.yesterday?.total || 0, data.yesterday?.count > 0 ? Math.round(data.yesterday.total / data.yesterday.count) : 0],
      ["This Week", data.weekly?.count || 0, data.weekly?.units || 0, data.weekly?.total || 0, data.weekly?.count > 0 ? Math.round(data.weekly.total / data.weekly.count) : 0],
      [`Monthly Total (${data.filter?.label || ""})`, data.monthly?.count || 0, data.monthly?.units || 0, data.monthly?.total || 0, data.monthly?.count > 0 ? Math.round(data.monthly.total / data.monthly.count) : 0]
    ];
    exportTableToCsv(`Sales_Breakdown_${MONTHS[month]}_${year}.csv`, headers, rows);
  };

  const handleImportSales = async (rows) => {
    const mappedRows = rows.map((r) => ({
      ...r,
      orderStatus: "Delivered",
      parcelStatus: "Delivered"
    }));
    const res = await api.post("/orders/bulk-import", { rows: mappedRows });
    alert(res.data?.message || `Imported ${rows.length} sales records successfully!`);
    emitDataSync({ type: "order", action: "bulk" });
    load(month, year, true);
  };

  const load = useCallback(async (m, y, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get("/admin/sales-summary", { params: { month: m, year: y } });
      setData(res.data.data);
    } catch (err) {
      console.error("Failed to load sales", err);
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(month, year);
  }, [month, year, load]);

  // Real-time multi-tab and cross-component sync
  useEffect(() => {
    const unsub = onDataSync(() => {
      load(month, year, true);
    });
    return unsub;
  }, [month, year, load]);

  useEffect(() => {
    const onFocus = () => load(month, year, true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [month, year, load]);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  const periods = data
    ? [
        { label: isCurrentMonth ? "Today" : `${data.filter.label} (Daily Avg)`, key: "daily", d: data.daily, color: "#0284c7" },
        { label: isCurrentMonth ? "This Week" : `${data.filter.label} (Weekly Avg)`, key: "weekly", d: data.weekly, color: "#8b5cf6" },
        { label: data.filter.label, key: "monthly", d: data.monthly, color: "#10b981" }
      ]
    : [];

  return (
    <div className="content-area">
      {/* Header Row */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>Cars Sold &amp; Revenue Overview</h1>
          <p>Daily, weekly, and monthly vehicle retail performance and sales analytics</p>
        </div>
        <div className="page-actions-group">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsCsvModalOpen(true)}
            title="Import Sales from CSV"
          >
            <UploadIcon />
            Import CSV
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={!data}
            title="Export Sales Breakdown to CSV"
          >
            <DownloadIcon />
            Export CSV
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => load(month, year, true)}
            disabled={refreshing}
            title="Refresh Metrics"
          >
            <RefreshIcon spinning={refreshing} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Month/Year Filter Card */}
      <div className="table-card" style={{ marginBottom: "20px", padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
              Filter by Month:
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={prevMonth}
                title="Previous Month"
                style={{ padding: "6px 8px" }}
              >
                <ChevronLeftIcon />
              </button>

              <select
                className="form-control"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                style={{ width: "auto", fontSize: "13px", padding: "6px 12px", fontWeight: 600 }}
              >
                {MONTHS.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>

              <select
                className="form-control"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                style={{ width: "auto", fontSize: "13px", padding: "6px 12px", fontWeight: 600 }}
              >
                {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={nextMonth}
                disabled={isCurrentMonth}
                title="Next Month"
                style={{ padding: "6px 8px" }}
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>

          {!isCurrentMonth && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()); }}
              style={{ color: "var(--primary)", borderColor: "var(--primary)" }}
            >
              Current Month
            </button>
          )}
        </div>
      </div>

      {loading && !data ? (
        <div className="table-card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
          <div className="spinner-border" style={{ marginBottom: "12px" }} />
          <div>Loading sales summary...</div>
        </div>
      ) : !data ? (
        <div className="table-card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
          Could not load sales analytics data.
        </div>
      ) : (
        <>
          {/* Top 3 KPI Summary Cards */}
          <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginBottom: "24px" }}>
            {periods.map(({ label, d, color }) => (
              <div key={label} className="kpi-card" style={{ borderLeft: `4px solid ${color}` }}>
                <div className="kpi-top">
                  <div className="kpi-icon-wrap" style={{ background: `${color}15`, color }}>
                    <DollarIcon />
                  </div>
                  <span className="kpi-pill info" style={{ background: `${color}15`, color }}>
                    {label}
                  </span>
                </div>
                <div className="kpi-label">Total Revenue</div>
                <div className="kpi-value" style={{ color: "var(--text-heading)", fontSize: "24px" }}>
                  {formatINR(d.total)}
                </div>
                <div style={{ display: "flex", gap: "16px", marginTop: "12px", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Cars Sold</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-heading)" }}>{d.count}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Units</span>
                    <strong style={{ fontSize: "14px", color: "var(--text-heading)" }}>{d.units}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Avg / Car</span>
                    <strong style={{ fontSize: "14px", color: "var(--primary)" }}>
                      {d.count > 0 ? formatINR(Math.round(d.total / d.count)) : "₹0"}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sales Breakdown Data Table */}
          <div className="table-card">
            <div className="table-header-bar">
              <div className="card-title-box">
                <h3>Sales Breakdown — {data.filter.label}</h3>
              </div>
            </div>
            <div className="table-container">
              <table className="leads-table slidable-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th style={{ textAlign: "right" }}>Cars Sold</th>
                    <th style={{ textAlign: "right" }}>Units Sold</th>
                    <th style={{ textAlign: "right" }}>Total Revenue</th>
                    <th style={{ textAlign: "right" }}>Avg Price per Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map(({ label, d }) => (
                    <tr key={label}>
                      <td>
                        <strong style={{ color: "var(--text-heading)" }}>{label}</strong>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{d.count}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{d.units}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>
                        {formatINR(d.total)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 500, color: "var(--text-muted)" }}>
                        {d.count > 0 ? formatINR(Math.round(d.total / d.count)) : "₹0"}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "#f8fafc", borderTop: "2px solid var(--border)" }}>
                    <td>
                      <strong style={{ color: "var(--primary)", fontSize: "14px" }}>
                        Total ({data.filter.label})
                      </strong>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{data.monthly.count}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{data.monthly.units}</td>
                    <td style={{ textAlign: "right", fontWeight: 800, color: "var(--primary)", fontSize: "15px" }}>
                      {formatINR(data.monthly.total)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text-heading)" }}>
                      {data.monthly.count > 0 ? formatINR(Math.round(data.monthly.total / data.monthly.count)) : "₹0"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Sales & Delivered Vehicles from CSV"
        description="Upload completed car sales and delivered order records."
        templateFilename="car_sales_template.csv"
        templateHeaders={[
          "Customer Name",
          "Mobile Number",
          "Product Type",
          "Units",
          "Amount",
          "Total Amount",
          "Date Of Order",
          "Courier Company"
        ]}
        templateSampleRows={[
          ["Sunil Mehta", "9876501234", "GPS", "1", "680000", "680000", "2026-09-29", "Delivery Hub"]
        ]}
        requiredHeaders={["Customer Name", "Mobile Number"]}
        onImport={handleImportSales}
      />
    </div>
  );
};

export default SalesPage;
