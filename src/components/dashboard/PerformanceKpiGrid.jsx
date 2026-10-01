"use client";

import React from "react";
import { formatINR, formatPct } from "./dashboardUtils";

// SVG Line Icons
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const UserCheckIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const TargetIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const RupeeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13l8.5 8" />
    <path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

const CoinsIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="M17 10h1v4" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

function SkeletonKpiCard() {
  return (
    <div className="kpi-card" style={{ padding: "16px 18px", minHeight: "115px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <div className="skeleton-box" style={{ width: "36px", height: "36px", borderRadius: "10px" }} />
        <div className="skeleton-box" style={{ width: "60px", height: "18px", borderRadius: "10px" }} />
      </div>
      <div className="skeleton-box" style={{ width: "100px", height: "14px", marginBottom: "8px" }} />
      <div className="skeleton-box" style={{ width: "80px", height: "24px" }} />
    </div>
  );
}

export default function PerformanceKpiGrid({
  data,
  loading = false,
  error = null,
  onRetry
}) {
  if (error) {
    return (
      <div
        style={{
          background: "rgba(239, 68, 68, 0.06)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "12px"
        }}
      >
        <div style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "15px" }}>
          <AlertTriangleIcon />
          <span>Unable to load this data</span>
        </div>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted, #64748b)", maxWidth: "480px" }}>
          {error}
        </p>
        {onRetry && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onRetry}
            style={{ marginTop: "4px", padding: "6px 18px" }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {[1, 2, 3, 4].map((i) => <SkeletonKpiCard key={i} />)}
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {[5, 6, 7, 8].map((i) => <SkeletonKpiCard key={i} />)}
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {[9, 10, 11, 12].map((i) => <SkeletonKpiCard key={i} />)}
        </div>
      </div>
    );
  }

  // Derive metrics strictly from backend response
  const totalEmployees = data?.totalEmployees ?? 0;
  const activeEmployees = data?.activeEmployees ?? totalEmployees;
  const todayAppointments = data?.todayAppointments ?? 0;
  const completedAppointments = data?.completedAppointments ?? 0;

  const appointmentAchievementPct = data?.appointmentAchievementPct ?? 0;
  const monthlySales = data?.totalMonthlySales ?? 0;
  const monthlySalesTarget = data?.monthlySalesTargetTotal ?? ((data?.monthlySalesTarget || 1300000) * (totalEmployees || 1));
  const salesAchievementPct = data?.salesAchievementPct ?? (monthlySalesTarget > 0 ? (monthlySales / monthlySalesTarget) * 100 : 0);

  const remainingSalesTarget = Math.max(0, monthlySalesTarget - monthlySales);
  const totalBonus = data?.totalBonusLiability ?? 0;
  const employeesTargetMet = data?.employeesAboveTarget ?? data?.meetingDailyTarget ?? 0;
  const employeesTargetMissed = data?.employeesBelowTarget ?? data?.belowDailyTarget ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
      {/* ── ROW 1: Employee & Daily Operational Volume ── */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {/* Total Employees */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap blue"><UsersIcon /></div>
            <span className="kpi-pill info">Team</span>
          </div>
          <div className="kpi-label">Total Employees</div>
          <div className="kpi-value">{totalEmployees}</div>
          <div className="kpi-subtext">Registered staff members</div>
        </div>

        {/* Active Employees */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap cyan"><UserCheckIcon /></div>
            <span className="kpi-pill positive">Active</span>
          </div>
          <div className="kpi-label">Active Employees</div>
          <div className="kpi-value" style={{ color: "#0284c7" }}>{activeEmployees}</div>
          <div className="kpi-subtext">Staff actively operating</div>
        </div>

        {/* Today's Appointments */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap purple"><CalendarIcon /></div>
            <span className="kpi-pill purple">Daily Schedule</span>
          </div>
          <div className="kpi-label">Today's Appointments</div>
          <div className="kpi-value">{todayAppointments}</div>
          <div className="kpi-subtext">Customer visits scheduled today</div>
        </div>

        {/* Completed Appointments */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap green"><CheckCircleIcon /></div>
            <span className="kpi-pill positive">Completed</span>
          </div>
          <div className="kpi-label">Completed Appointments</div>
          <div className="kpi-value" style={{ color: completedAppointments > 0 ? "#16a34a" : "inherit" }}>
            {completedAppointments}
          </div>
          <div className="kpi-subtext">Verified customer visits</div>
        </div>
      </div>

      {/* ── ROW 2: Benchmark & Sales Achievement ── */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {/* Appointment Achievement % */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap blue"><TargetIcon /></div>
            <span className={`kpi-pill ${appointmentAchievementPct >= 100 ? "positive" : "info"}`}>
              {appointmentAchievementPct >= 100 ? "Goal Met" : "Target"}
            </span>
          </div>
          <div className="kpi-label">Appointment Achievement %</div>
          <div className="kpi-value" style={{ color: appointmentAchievementPct >= 100 ? "#16a34a" : "#0284c7" }}>
            {formatPct(appointmentAchievementPct)}
          </div>
          <div className="kpi-subtext">Against expected working day quota</div>
        </div>

        {/* Monthly Sales */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap amber"><RupeeIcon /></div>
            <span className="kpi-pill warning">Sales</span>
          </div>
          <div className="kpi-label">Monthly Sales</div>
          <div className="kpi-value" style={{ fontSize: "20px" }}>{formatINR(monthlySales)}</div>
          <div className="kpi-subtext">Verified order &amp; lead revenue</div>
        </div>

        {/* Monthly Sales Target */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap purple"><TargetIcon /></div>
            <span className="kpi-pill purple">Quota</span>
          </div>
          <div className="kpi-label">Monthly Sales Target</div>
          <div className="kpi-value" style={{ fontSize: "20px" }}>{formatINR(monthlySalesTarget)}</div>
          <div className="kpi-subtext">Combined team monthly quota</div>
        </div>

        {/* Sales Achievement % */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap green"><CheckCircleIcon /></div>
            <span className={`kpi-pill ${salesAchievementPct >= 100 ? "positive" : "warning"}`}>
              {salesAchievementPct >= 100 ? "Qualified" : "Pacing"}
            </span>
          </div>
          <div className="kpi-label">Sales Achievement %</div>
          <div className="kpi-value" style={{ color: salesAchievementPct >= 100 ? "#16a34a" : "#d97706" }}>
            {formatPct(salesAchievementPct)}
          </div>
          <div className="kpi-subtext">Quota completion percentage</div>
        </div>
      </div>

      {/* ── ROW 3: Remaining Quota, Incentive Liability & Team Target Met ── */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {/* Remaining Sales Target */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap cyan"><RupeeIcon /></div>
            <span className={`kpi-pill ${remainingSalesTarget === 0 ? "positive" : "info"}`}>
              {remainingSalesTarget === 0 ? "Completed" : "Deficit"}
            </span>
          </div>
          <div className="kpi-label">Remaining Sales Target</div>
          <div className="kpi-value" style={{ fontSize: "20px", color: remainingSalesTarget === 0 ? "#16a34a" : "inherit" }}>
            {formatINR(remainingSalesTarget)}
          </div>
          <div className="kpi-subtext">
            {remainingSalesTarget === 0 ? "Target accomplished!" : "Required to meet team target"}
          </div>
        </div>

        {/* Total Bonus */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap green"><CoinsIcon /></div>
            <span className="kpi-pill positive">Incentives</span>
          </div>
          <div className="kpi-label">Total Bonus Liability</div>
          <div className="kpi-value" style={{ fontSize: "20px", color: totalBonus > 0 ? "#16a34a" : "inherit" }}>
            {formatINR(totalBonus)}
          </div>
          <div className="kpi-subtext">Payable on sales surplus above target</div>
        </div>

        {/* Employees Target Met */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap green"><CheckCircleIcon /></div>
            <span className="kpi-pill positive">Achieved</span>
          </div>
          <div className="kpi-label">Employees Target Met</div>
          <div className="kpi-value" style={{ color: "#16a34a" }}>{employeesTargetMet}</div>
          <div className="kpi-subtext">Met or exceeded performance goal</div>
        </div>

        {/* Employees Target Missed */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap amber"><AlertTriangleIcon /></div>
            <span className={`kpi-pill ${employeesTargetMissed > 0 ? "warning" : "positive"}`}>
              {employeesTargetMissed > 0 ? "Pending" : "Zero Missed"}
            </span>
          </div>
          <div className="kpi-label">Employees Target Missed</div>
          <div className="kpi-value" style={{ color: employeesTargetMissed > 0 ? "#ef4444" : "#16a34a" }}>
            {employeesTargetMissed}
          </div>
          <div className="kpi-subtext">Currently below benchmark quota</div>
        </div>
      </div>
    </div>
  );
}
