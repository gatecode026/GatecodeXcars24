"use client";

import React from "react";
import { MONTH_NAMES, formatINR } from "./dashboardUtils";

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

export default function GlobalFilterBar({
  month,
  year,
  departmentId,
  branchId,
  role,
  departments = [],
  branches = [],
  settings,
  onFilterChange,
  onOpenSettings,
  onExport,
  exporting = false,
  onRefresh,
  loading = false
}) {
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div
      className="glass-card"
      style={{
        padding: "14px 18px",
        marginBottom: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        borderRadius: "12px",
        background: "#ffffff",
        border: "1px solid var(--border, #e2e8f0)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}
    >
      {/* Top Filter Controls Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Month Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
              Month:
            </span>
            <select
              className="form-control"
              style={{ height: "34px", padding: "4px 10px", fontSize: "12.5px", minWidth: "120px", width: "auto" }}
              value={month}
              onChange={(e) => onFilterChange({ month: Number(e.target.value) })}
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
              Year:
            </span>
            <select
              className="form-control"
              style={{ height: "34px", padding: "4px 10px", fontSize: "12.5px", minWidth: "85px", width: "auto" }}
              value={year}
              onChange={(e) => onFilterChange({ year: Number(e.target.value) })}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Department Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
              Dept:
            </span>
            <select
              className="form-control"
              style={{ height: "34px", padding: "4px 10px", fontSize: "12.5px", minWidth: "135px", width: "auto" }}
              value={departmentId || ""}
              onChange={(e) => onFilterChange({ departmentId: e.target.value })}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Branch Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
              Branch:
            </span>
            <select
              className="form-control"
              style={{ height: "34px", padding: "4px 10px", fontSize: "12.5px", minWidth: "125px", width: "auto" }}
              value={branchId || ""}
              onChange={(e) => onFilterChange({ branchId: e.target.value })}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
              Role:
            </span>
            <select
              className="form-control"
              style={{ height: "34px", padding: "4px 10px", fontSize: "12.5px", minWidth: "110px", width: "auto" }}
              value={role || ""}
              onChange={(e) => onFilterChange({ role: e.target.value })}
            >
              <option value="">All Roles</option>
              <option value="employee">Sales Executives</option>
              <option value="tl">Team Leaders</option>
              <option value="manager">Managers</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
          {onRefresh && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh performance data"
              style={{ height: "34px", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
            >
              <RefreshIcon spinning={loading} />
              <span>Refresh</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenSettings}
              title="Configure performance targets and bonus rules"
              style={{ height: "34px", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
            >
              <SettingsIcon />
              <span>Rules &amp; Targets</span>
            </button>
          )}

          {onExport && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onExport}
              disabled={exporting}
              title="Export report to CSV"
              style={{ height: "34px", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}
            >
              <DownloadIcon />
              <span>{exporting ? "Exporting..." : "Export CSV"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Rules Benchmark Strip (Directly from Server Source of Truth) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          flexWrap: "wrap",
          fontSize: "12px",
          color: "var(--text-muted, #64748b)",
          paddingTop: "8px",
          borderTop: "1px dashed var(--border-light, #f1f5f9)"
        }}
      >
        <span>
          Daily Goal: <strong style={{ color: "var(--text-heading, #0f172a)" }}>{settings?.dailyAppointmentTarget || 5} appts/day</strong>
        </span>
        <span>•</span>
        <span>
          Monthly Target: <strong style={{ color: "var(--text-heading, #0f172a)" }}>{formatINR(settings?.monthlySalesTarget || 1300000)}</strong>
        </span>
        <span>•</span>
        <span>
          Incentive Model: <strong style={{ color: "#059669" }}>
            {settings?.bonusType === "slab"
              ? "Progressive Tiered Slabs"
              : `${((settings?.bonusRate ?? 0.01) * 100).toFixed(2)}% on Surplus`}
          </strong>
        </span>
        <span>•</span>
        <span>
          Metric Source: <strong style={{ color: "#0284c7" }}>
            {settings?.salesMetricSource === "orders" ? "Direct Vehicle Orders" : (settings?.salesMetricSource === "combined" ? "Combined" : "Verified Visits")}
          </strong>
        </span>
      </div>
    </div>
  );
}
