"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { exportTableToCsv } from "../utils/csvHelper";

// ─── Clean SVG Line Icons (Matching Website Theme) ───────────────────────────
const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const TargetIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const RupeeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13l8.5 8" />
    <path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

const CoinsIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="M17 10h1v4" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const INR = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function ModernProgressBar({ score, showLabel = true }) {
  const pctVal = Math.min(Math.max(score || 0, 0), 100);
  const color = score >= 100 ? "#10b981" : score >= 80 ? "#0284c7" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
      <div style={{ flex: 1, height: "7px", background: "rgba(226, 232, 240, 0.8)", borderRadius: "999px", overflow: "hidden" }}>
        <div
          style={{
            width: `${pctVal}%`,
            height: "100%",
            background: color,
            borderRadius: "999px",
            transition: "width 0.4s ease"
          }}
        />
      </div>
      {showLabel && (
        <span style={{ fontSize: "11.5px", fontWeight: 700, color, minWidth: "40px", textAlign: "right" }}>
          {pct(score)}
        </span>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  if (status === "Target Exceeded" || status === "Target Met") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
        {status}
      </span>
    );
  }
  if (status === "In Progress") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: "rgba(2, 132, 199, 0.12)", color: "#0284c7", border: "1px solid rgba(2, 132, 199, 0.25)" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0284c7" }} />
        In Progress
      </span>
    );
  }
  if (status === "Sunday" || status === "Holiday" || status === "Off") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 500, background: "rgba(148, 163, 184, 0.12)", color: "#64748b", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
        {status}
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
      Target Missed
    </span>
  );
}

export default function EmployeePerformancePage() {
  const { user } = useAuth();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [perfRes, histRes] = await Promise.all([
        api.get(`/employee/performance?month=${month}&year=${year}`),
        api.get(`/employee/performance/daily-history?month=${month}&year=${year}`)
      ]);
      setData(perfRes.data?.data);
      setHistory(histRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load employee performance:", err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const m = data?.monthly;
  const t = data?.today;
  const appt = m?.appointments;
  const sales = m?.sales;
  const perf = m?.performance;

  // Export Daily Appointment Log to CSV
  const handleExportCSV = () => {
    if (!history || history.length === 0) return;
    const headers = [
      "Date",
      "Day",
      "Daily Target",
      "Appointments Completed",
      "Remaining",
      "Achievement (%)",
      "Status"
    ];
    const rows = history.map((d) => {
      const dt = new Date(d.date);
      return [
        dt.toISOString().split("T")[0],
        dt.toLocaleDateString("en-IN", { weekday: "long" }),
        d.target || 0,
        d.completed || 0,
        d.remaining || 0,
        pct(d.achievementPercent),
        d.status || "-"
      ];
    });
    exportTableToCsv(`Daily_Appointments_${MONTHS[month]}_${year}.csv`, headers, rows);
  };

  return (
    <div className="content-area">
      {/* ── Page Header (Matching Website Design) ── */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>My Performance &amp; Goals</h1>
          <p>
            {MONTHS[month]} {year} • Personal appointment targets, verified sales &amp; bonus tracking
          </p>
        </div>

        <div className="page-actions-group">
          {data?.rank && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: data.rank === 1 ? "rgba(245, 158, 11, 0.12)" : "rgba(2, 132, 199, 0.08)",
                border: data.rank === 1 ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(2, 132, 199, 0.2)",
                padding: "6px 14px",
                borderRadius: "20px"
              }}
            >
              <TrophyIcon />
              <span style={{ fontSize: "13px", fontWeight: 700, color: data.rank === 1 ? "#d97706" : "var(--primary)" }}>
                Rank #{data.rank}
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                of {data.totalEmployees || 2} Executives
              </span>
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchData}
            disabled={loading}
            title="Refresh performance data"
          >
            <RefreshIcon spinning={loading} />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ── Filter Toolbar (Matching Website Glass Card Style) ── */}
      <div
        className="glass-card"
        style={{
          padding: "12px 18px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Month:
            </span>
            <select
              className="form-control"
              style={{ height: "34px", padding: "4px 10px", fontSize: "12.5px", width: "auto", minWidth: "130px" }}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Year:
            </span>
            <select
              className="form-control"
              style={{ height: "34px", padding: "4px 10px", fontSize: "12.5px", width: "auto", minWidth: "90px" }}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Active Target Benchmark Strip */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-muted)" }}>
          <span>
            Daily Goal: <strong style={{ color: "var(--text-heading)" }}>{t?.target || appt?.dailyTarget || 5} appts/day</strong>
          </span>
          <span>•</span>
          <span>
            Lead Value: <strong style={{ color: "var(--text-heading)" }}>{INR(sales?.saleValuePerLead || 65000)}</strong>
          </span>
          <span>•</span>
          <span>
            Monthly Target: <strong style={{ color: "var(--text-heading)" }}>{INR(sales?.target || 1300000)}</strong>
          </span>
        </div>
      </div>

      {loading ? (
        <div className="table-card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
          <div className="loading-spinner" style={{ marginBottom: "12px" }} />
          <div>Loading your performance metrics...</div>
        </div>
      ) : (
        <>
          {/* ── 4 Top KPI Cards (Matching Website Metric Grid) ── */}
          <div className="kpi-grid" style={{ marginBottom: "20px" }}>
            {/* 1. Today's Appointments */}
            <div className="kpi-card">
              <div className="kpi-top">
                <div className="kpi-icon-wrap cyan">
                  <CalendarIcon />
                </div>
                <span className={`kpi-pill ${t?.completed >= (t?.target || 5) ? "positive" : "info"}`}>
                  {t?.inProgress ? "In Progress" : "Today"}
                </span>
              </div>
              <div className="kpi-label">Today&apos;s Appointments</div>
              <div className="kpi-value">
                {t?.completed ?? 0} <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)" }}>/ {t?.target ?? 5}</span>
              </div>
              <div style={{ marginTop: "8px", marginBottom: "6px" }}>
                <ModernProgressBar score={t?.achievementPercent || 0} />
              </div>
              <div className="kpi-subtext">
                {t?.remaining === 0 ? "Target accomplished for today!" : `${t?.remaining ?? 0} appointments remaining today`}
              </div>
            </div>

            {/* 2. Monthly Appointments */}
            <div className="kpi-card">
              <div className="kpi-top">
                <div className="kpi-icon-wrap blue">
                  <CheckCircleIcon />
                </div>
                <span className={`kpi-pill ${appt?.achievementPercent >= 100 ? "positive" : "info"}`}>
                  {appt?.achievementPercent >= 100 ? "Goal Met" : "Target"}
                </span>
              </div>
              <div className="kpi-label">Monthly Appointments</div>
              <div className="kpi-value">
                {appt?.completed ?? 0} <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)" }}>/ {appt?.expectedAppointments ?? 0}</span>
              </div>
              <div style={{ marginTop: "8px", marginBottom: "6px" }}>
                <ModernProgressBar score={appt?.achievementPercent || 0} />
              </div>
              <div className="kpi-subtext">
                {appt?.workingDays ?? 0} active working days ({MONTHS[month]})
              </div>
            </div>

            {/* 3. Monthly Sales Achieved */}
            <div className="kpi-card">
              <div className="kpi-top">
                <div className="kpi-icon-wrap purple">
                  <RupeeIcon />
                </div>
                <span className={`kpi-pill ${sales?.achievementPercent >= 100 ? "positive" : "purple"}`}>
                  {sales?.achievementPercent >= 100 ? "Qualified" : "Sales"}
                </span>
              </div>
              <div className="kpi-label">Monthly Sales Value</div>
              <div className="kpi-value" style={{ fontSize: "20px" }}>
                {INR(sales?.monthlySales)}
              </div>
              <div style={{ marginTop: "8px", marginBottom: "6px" }}>
                <ModernProgressBar score={sales?.achievementPercent || 0} />
              </div>
              <div className="kpi-subtext">
                {sales?.verifiedLeadCount ?? 0} verified leads ({INR(sales?.saleValuePerLead)}/lead)
              </div>
            </div>

            {/* 4. Performance Bonus */}
            <div className="kpi-card">
              <div className="kpi-top">
                <div className="kpi-icon-wrap green">
                  <CoinsIcon />
                </div>
                <span className={`kpi-pill ${sales?.bonus > 0 ? "positive" : "warning"}`}>
                  {sales?.bonus > 0 ? "Bonus Earned" : "Benchmark"}
                </span>
              </div>
              <div className="kpi-label">Performance Bonus</div>
              <div className="kpi-value" style={{ fontSize: "20px", color: sales?.bonus > 0 ? "#10b981" : "inherit" }}>
                {INR(sales?.bonus)}
              </div>
              <div style={{ marginTop: "8px", marginBottom: "6px" }}>
                <ModernProgressBar score={sales?.achievementPercent || 0} showLabel={false} />
              </div>
              <div className="kpi-subtext">
                {sales?.bonus > 0
                  ? `Bonus on ${INR(sales?.excessSales)} surplus sales`
                  : `Reach ${INR(sales?.target)} to unlock incentive`}
              </div>
            </div>
          </div>

          {/* ── Middle Grid: Overall Score & Incentive Milestone (2 Columns) ── */}
          <div className="dashboard-middle-grid" style={{ marginBottom: "20px" }}>
            {/* Overall Score Card */}
            <div className="card" style={{ padding: "20px" }}>
              <div className="card-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "16px" }}>
                <div className="card-title-box">
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-heading)" }}>
                    Overall Performance Score
                  </h3>
                  <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                    {MONTHS[month]} {year} • Weighted composite evaluation
                  </p>
                </div>
                <span className="badge badge-info" style={{ fontSize: "11.5px" }}>
                  50% Appts + 50% Sales
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12.5px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-heading)" }}>Performance Score (Raw)</span>
                    <strong style={{ color: "#0284c7" }}>{pct(perf?.rawScore)}</strong>
                  </div>
                  <ModernProgressBar score={perf?.rawScore || 0} showLabel={false} />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12.5px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-heading)" }}>Ranking Score (Capped at 100%)</span>
                    <strong style={{ color: "#10b981" }}>{pct(perf?.rankingScore)}</strong>
                  </div>
                  <ModernProgressBar score={perf?.rankingScore || 0} showLabel={false} />
                </div>

                <div
                  style={{
                    background: "rgba(2, 132, 199, 0.04)",
                    border: "1px solid rgba(2, 132, 199, 0.15)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      Current Leaderboard Position
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-heading)", marginTop: "2px" }}>
                      Rank #{data?.rank || 1} among {data?.totalEmployees || 2} Sales Executives
                    </div>
                  </div>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "rgba(245, 158, 11, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#d97706"
                    }}
                  >
                    <TrophyIcon />
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Incentive & Milestone Card */}
            <div className="card" style={{ padding: "20px" }}>
              <div className="card-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "16px" }}>
                <div className="card-title-box">
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-heading)" }}>
                    Incentive &amp; Sales Milestone
                  </h3>
                  <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                    Target benchmark: {INR(sales?.target || 1300000)}
                  </p>
                </div>
                <span className="badge badge-success" style={{ fontSize: "11.5px" }}>
                  {((sales?.bonusRate || 0.01) * 100).toFixed(2)}% Bonus Rate
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ background: "rgba(248, 250, 252, 0.8)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Verified Leads Converted</div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-heading)", marginTop: "2px" }}>
                      {sales?.verifiedLeadCount || 0}
                    </div>
                  </div>
                  <div style={{ background: "rgba(248, 250, 252, 0.8)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Commission Value / Lead</div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-heading)", marginTop: "2px" }}>
                      {INR(sales?.saleValuePerLead || 65000)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: sales?.bonus > 0 ? "rgba(16, 185, 129, 0.06)" : "rgba(248, 250, 252, 0.8)",
                    border: sales?.bonus > 0 ? "1px solid rgba(16, 185, 129, 0.25)" : "1px dashed var(--border)",
                    borderRadius: "8px",
                    padding: "14px 16px",
                    textAlign: "center"
                  }}
                >
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                    {sales?.bonus > 0 ? "Earned Bonus Incentive" : "Milestone Target Status"}
                  </div>
                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: 800,
                      color: sales?.bonus > 0 ? "#10b981" : "var(--text-heading)",
                      margin: "4px 0"
                    }}
                  >
                    {INR(sales?.bonus || 0)}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {sales?.bonus > 0
                      ? `Surplus volume of ${INR(sales?.excessSales)} at ${((sales?.bonusRate || 0.01) * 100).toFixed(2)}% incentive rate`
                      : `Achieve ${INR(Math.max(0, (sales?.target || 1300000) - (sales?.monthlySales || 0)))} more in sales to start earning bonuses`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Daily Appointment Log Table (Signature Website Table Card) ── */}
          <div className="table-card">
            <div className="table-header-bar">
              <div className="card-title-box">
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-heading)" }}>
                  Daily Appointment Log — {MONTHS[month]} {year}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                  Chronological schedule of targets, completed customer visits &amp; status
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleExportCSV}
                  disabled={history.length === 0}
                  title="Export Daily Appointment Log to CSV"
                >
                  <DownloadIcon />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Target</th>
                    <th>Completed</th>
                    <th>Remaining</th>
                    <th style={{ minWidth: "160px" }}>Achievement</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                        No daily appointment logs recorded for {MONTHS[month]} {year}.
                      </td>
                    </tr>
                  ) : (
                    history.map((d, idx) => {
                      const dt = new Date(d.date);
                      const dayName = dt.toLocaleDateString("en-IN", { weekday: "short" });
                      const dateStr = dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

                      return (
                        <tr
                          key={idx}
                          style={{
                            background: d.isToday ? "rgba(2, 132, 199, 0.05)" : undefined
                          }}
                        >
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontWeight: d.isToday ? 700 : 500, color: d.isToday ? "#0284c7" : "var(--text-heading)" }}>
                                {dateStr}
                              </span>
                              {d.isToday && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    padding: "2px 6px",
                                    borderRadius: "10px",
                                    background: "#0284c7",
                                    color: "#ffffff",
                                    fontWeight: 700
                                  }}
                                >
                                  Today
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                            {dayName}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {d.target}
                          </td>
                          <td>
                            <strong style={{ color: d.completed >= d.target && d.target > 0 ? "#10b981" : "inherit" }}>
                              {d.completed}
                            </strong>
                          </td>
                          <td>
                            <span style={{ color: d.remaining === 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                              {d.remaining}
                            </span>
                          </td>
                          <td>
                            <ModernProgressBar score={d.achievementPercent || 0} />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <StatusPill status={d.status} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
