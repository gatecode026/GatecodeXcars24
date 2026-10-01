"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { api, onDataSync } from "../api/client";
import GlobalFilterBar from "../components/dashboard/GlobalFilterBar";
import PerformanceKpiGrid from "../components/dashboard/PerformanceKpiGrid";
import LeaderboardTable from "../components/dashboard/LeaderboardTable";
import DailyAppointmentTable from "../components/dashboard/DailyAppointmentTable";
import MonthlySalesTable from "../components/dashboard/MonthlySalesTable";
import BonusAnalyticsWidget from "../components/dashboard/BonusAnalyticsWidget";
import PerformanceChartsGrid from "../components/dashboard/PerformanceChartsGrid";
import DepartmentBranchPerformance from "../components/dashboard/DepartmentBranchPerformance";
import EmployeeDetailDrawer from "../components/dashboard/EmployeeDetailDrawer";
import PerformanceSettingsModal from "../components/dashboard/PerformanceSettingsModal";
import { MONTH_NAMES, formatINR, formatPct } from "../components/dashboard/dashboardUtils";

// SVG Tab Icons
const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
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

const RupeeIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13l8.5 8" />
    <path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

const CoinsIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="M17 10h1v4" />
  </svg>
);

const BarChartIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

export default function AdminPerformancePage() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [departmentId, setDepartmentId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [role, setRole] = useState("");

  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);

  const [activeTab, setActiveTab] = useState("leaderboard"); // "leaderboard" | "daily" | "sales" | "bonus" | "charts"
  const [summary, setSummary] = useState(null);
  const [bonus, setBonus] = useState(null);
  const [settingsData, setSettingsData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Fetch Master Data once
  useEffect(() => {
    api.get("/departments")
      .then((res) => setDepartments(res.data?.data || []))
      .catch(() => {});
    api.get("/branches")
      .then((res) => setBranches(res.data?.data || []))
      .catch(() => {});
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/admin/performance-settings");
      setSettingsData(res.data?.data);
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }, []);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (departmentId) params.append("departmentId", departmentId);
    if (branchId) params.append("branchId", branchId);
    if (role) params.append("designation", role);
    return params.toString();
  }, [month, year, departmentId, branchId, role]);

  const fetchRankings = useCallback(async () => {
    const query = buildQuery();
    const res = await api.get(`/admin/performance-ranking?${query}`);
    setSummary(res.data?.data);
  }, [buildQuery]);

  const fetchBonus = useCallback(async () => {
    const query = buildQuery();
    const res = await api.get(`/admin/bonus-report?${query}`);
    setBonus(res.data?.data);
  }, [buildQuery]);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchRankings(), fetchBonus(), fetchSettings()]);
    } catch (err) {
      console.error("Error fetching performance data:", err);
      if (!silent) setError(err.response?.data?.message || "Failed to load performance metrics from server.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [fetchRankings, fetchBonus, fetchSettings]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Real-time synchronization
  useEffect(() => {
    const unsub = onDataSync(() => {
      fetchAll(true);
    });
    return unsub;
  }, [fetchAll]);

  useEffect(() => {
    const onFocus = () => fetchAll(true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchAll]);

  const handleFilterChange = (updates) => {
    if (updates.month !== undefined) setMonth(updates.month);
    if (updates.year !== undefined) setYear(updates.year);
    if (updates.departmentId !== undefined) setDepartmentId(updates.departmentId);
    if (updates.branchId !== undefined) setBranchId(updates.branchId);
    if (updates.role !== undefined) setRole(updates.role);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const query = buildQuery();
      const endpoint =
        activeTab === "bonus"
          ? `/admin/bonus-report?${query}`
          : `/admin/performance-ranking?${query}`;
      const res = await api.get(endpoint);
      const data = res.data?.data;

      let csv = "";
      if (activeTab === "bonus") {
        const rows = data?.report || [];
        csv = [
          "Rank,Employee Name,Department,Monthly Target,Monthly Sales,Excess Sales,Bonus Rate,Bonus Earned,Status",
          ...rows.map((r) =>
            [
              r.rank,
              `"${r.employee?.name || ""}"`,
              `"${r.employee?.department?.name || ""}"`,
              r.salesTarget,
              r.monthlySales,
              r.excessSales,
              formatPct((r.bonusRate || 0) * 100),
              r.bonus,
              `"${r.salesStatus}"`
            ].join(",")
          )
        ].join("\n");
      } else {
        const rows = data?.rankings || [];
        csv = [
          "Rank,Employee Name,Email,Department,Branch,Working Days,Daily Target,Completed Appts,Appt Achievement %,Monthly Sales,Sales Target,Sales Achievement %,Ranking Score %,Bonus",
          ...rows.map((r) =>
            [
              r.rank,
              `"${r.employee?.name || ""}"`,
              `"${r.employee?.email || ""}"`,
              `"${r.employee?.department?.name || ""}"`,
              `"${r.employee?.branch?.name || ""}"`,
              r.appointments?.workingDays || 0,
              r.appointments?.dailyTarget || 5,
              r.appointments?.completed || 0,
              formatPct(r.appointments?.achievementPercent),
              r.sales?.monthlySales || 0,
              r.sales?.target || 0,
              formatPct(r.sales?.achievementPercent),
              formatPct(r.performance?.rankingScore),
              r.sales?.bonus || 0
            ].join(",")
          )
        ].join("\n");
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Performance_${activeTab}_${MONTH_NAMES[month]}_${year}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export CSV report: " + (err.message || "Network error"));
    } finally {
      setExporting(false);
    }
  };

  const rankings = summary?.rankings || [];
  const currentSettings = settingsData?.current;
  const historySettings = settingsData?.history || [];

  // Compute aggregated KPIs for the 3-row PerformanceKpiGrid
  const kpiData = useMemo(() => {
    if (!summary) return null;
    const totalEmps = summary.totalEmployees || 0;
    const completedAppts = rankings.reduce((acc, r) => acc + (r.appointments?.completed || 0), 0);
    const expectedAppts = rankings.reduce((acc, r) => acc + (r.appointments?.expectedAppointments || 0), 0);
    const apptAchPct = expectedAppts > 0 ? (completedAppts / expectedAppts) * 100 : 0;
    const monthlySalesTargetTotal = (summary.monthlySalesTarget || 1300000) * (totalEmps || 1);

    return {
      totalEmployees: totalEmps,
      activeEmployees: totalEmps,
      todayAppointments: rankings.reduce((acc, r) => acc + (r.appointments?.completed || 0), 0),
      completedAppointments: completedAppts,
      appointmentAchievementPct: Math.round(apptAchPct * 10) / 10,
      totalMonthlySales: summary.totalMonthlySales || 0,
      monthlySalesTargetTotal,
      monthlySalesTarget: summary.monthlySalesTarget || 1300000,
      salesAchievementPct: monthlySalesTargetTotal > 0 ? (summary.totalMonthlySales / monthlySalesTargetTotal) * 100 : 0,
      totalBonusLiability: summary.totalBonusLiability || 0,
      employeesAboveTarget: summary.employeesAboveTarget || 0,
      employeesBelowTarget: summary.employeesBelowTarget || 0,
      meetingDailyTarget: summary.meetingDailyTarget || 0,
      belowDailyTarget: summary.belowDailyTarget || 0
    };
  }, [summary, rankings]);

  return (
    <div className="content-area">
      {/* ── Modals & Drawers ── */}
      {showSettings && (
        <PerformanceSettingsModal
          current={currentSettings}
          history={historySettings}
          onSaved={fetchAll}
          onClose={() => setShowSettings(false)}
        />
      )}

      {selectedEmpId && (
        <EmployeeDetailDrawer
          empId={selectedEmpId}
          month={month}
          year={year}
          onClose={() => setSelectedEmpId(null)}
        />
      )}

      {/* ── Page Header ── */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
            Enterprise Performance Management
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
            Real-time appointment delivery, sales quota tracking, deterministic rankings &amp; incentive liabilities
          </p>
        </div>
      </div>

      {/* ── Global Filter Bar ── */}
      <GlobalFilterBar
        month={month}
        year={year}
        departmentId={departmentId}
        branchId={branchId}
        role={role}
        departments={departments}
        branches={branches}
        settings={currentSettings}
        onFilterChange={handleFilterChange}
        onOpenSettings={() => setShowSettings(true)}
        onExport={handleExport}
        exporting={exporting}
        onRefresh={fetchAll}
        loading={loading}
      />

      {/* ── 3-Row Executive KPI Grid ── */}
      <PerformanceKpiGrid
        data={kpiData}
        loading={loading}
        error={error}
        onRetry={fetchAll}
      />

      {/* ── Section Navigation Tab Bar ── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          overflowX: "auto",
          paddingBottom: "4px"
        }}
      >
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "leaderboard" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("leaderboard")}
          style={{ padding: "8px 16px", borderRadius: "8px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <TrophyIcon />
          <span>Leaderboard</span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeTab === "daily" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("daily")}
          style={{ padding: "8px 16px", borderRadius: "8px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <CalendarIcon />
          <span>Daily Appointments</span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeTab === "sales" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("sales")}
          style={{ padding: "8px 16px", borderRadius: "8px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RupeeIcon />
          <span>Monthly Sales</span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeTab === "bonus" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("bonus")}
          style={{ padding: "8px 16px", borderRadius: "8px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <CoinsIcon />
          <span>Bonus Report</span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeTab === "charts" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("charts")}
          style={{ padding: "8px 16px", borderRadius: "8px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <BarChartIcon />
          <span>Analytics &amp; Charts</span>
        </button>
      </div>

      {/* ── Active Tab View ── */}
      {activeTab === "leaderboard" && (
        <LeaderboardTable
          rankings={rankings}
          loading={loading}
          onSelectEmployee={(id) => setSelectedEmpId(id)}
        />
      )}

      {activeTab === "daily" && (
        <DailyAppointmentTable
          rankings={rankings}
          dailyTargetDefault={currentSettings?.dailyAppointmentTarget || 5}
          loading={loading}
          onSelectEmployee={(id) => setSelectedEmpId(id)}
        />
      )}

      {activeTab === "sales" && (
        <MonthlySalesTable
          rankings={rankings}
          loading={loading}
          onSelectEmployee={(id) => setSelectedEmpId(id)}
        />
      )}

      {activeTab === "bonus" && (
        <BonusAnalyticsWidget
          bonusData={bonus}
          settings={currentSettings}
          loading={loading}
          onSelectEmployee={(id) => setSelectedEmpId(id)}
        />
      )}

      {activeTab === "charts" && (
        <>
          <PerformanceChartsGrid
            rankings={rankings}
            dailyHistory={[]}
            loading={loading}
          />
          <DepartmentBranchPerformance
            rankings={rankings}
            loading={loading}
            onSelectDepartment={(id) => setDepartmentId(id)}
            onSelectBranch={(id) => setBranchId(id)}
          />
        </>
      )}
    </div>
  );
}
