"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import GlobalFilterBar from "../components/dashboard/GlobalFilterBar";
import PerformanceKpiGrid from "../components/dashboard/PerformanceKpiGrid";
import LeaderboardTable from "../components/dashboard/LeaderboardTable";
import DailyAppointmentTable from "../components/dashboard/DailyAppointmentTable";
import PerformanceChartsGrid from "../components/dashboard/PerformanceChartsGrid";
import DepartmentBranchPerformance from "../components/dashboard/DepartmentBranchPerformance";
import EmployeeDetailDrawer from "../components/dashboard/EmployeeDetailDrawer";
import PerformanceSettingsModal from "../components/dashboard/PerformanceSettingsModal";
import { MONTH_NAMES, formatINR, formatPct } from "../components/dashboard/dashboardUtils";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [departmentId, setDepartmentId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [role, setRole] = useState("");

  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);

  const [summary, setSummary] = useState(null);
  const [bonus, setBonus] = useState(null);
  const [settingsData, setSettingsData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Fetch Master Data (Departments & Branches)
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

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchRankings(), fetchBonus(), fetchSettings()]);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard metrics from server.");
    } finally {
      setLoading(false);
    }
  }, [fetchRankings, fetchBonus, fetchSettings]);

  useEffect(() => {
    fetchAll();
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
      const res = await api.get(`/admin/performance-ranking?${query}`);
      const data = res.data?.data;
      const rows = data?.rankings || [];

      const csv = [
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

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Executive_Dashboard_${MONTH_NAMES[month]}_${year}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export dashboard report: " + (err.message || "Network error"));
    } finally {
      setExporting(false);
    }
  };

  const rankings = summary?.rankings || [];
  const currentSettings = settingsData?.current;
  const historySettings = settingsData?.history || [];

  // Compute aggregated 3-row KPI metrics strictly from backend
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

      {/* ── Header ── */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
            Enterprise BPO Dashboard
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
            Comprehensive management overview of employee daily appointments, sales quotas, rankings &amp; incentives
          </p>
        </div>
      </div>

      {/* ── Global Filter Bar (Section 4) ── */}
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

      {/* ── 3-Row Executive KPI Grid (Section 3) ── */}
      <PerformanceKpiGrid
        data={kpiData}
        loading={loading}
        error={error}
        onRetry={fetchAll}
      />

      {/* ── Performance Charts Grid (Section 11) ── */}
      <PerformanceChartsGrid
        rankings={rankings}
        dailyHistory={[]}
        loading={loading}
      />

      {/* ── Employee Performance Leaderboard (Section 5 & 6) ── */}
      <LeaderboardTable
        rankings={rankings}
        loading={loading}
        onSelectEmployee={(id) => setSelectedEmpId(id)}
      />

      {/* ── Today's Appointment Performance (Section 7) ── */}
      <DailyAppointmentTable
        rankings={rankings}
        dailyTargetDefault={currentSettings?.dailyAppointmentTarget || 5}
        loading={loading}
        onSelectEmployee={(id) => setSelectedEmpId(id)}
      />

      {/* ── Department & Regional Branch Performance (Sections 19 & 20) ── */}
      <DepartmentBranchPerformance
        rankings={rankings}
        loading={loading}
        onSelectDepartment={(id) => setDepartmentId(id)}
        onSelectBranch={(id) => setBranchId(id)}
      />
    </div>
  );
}
