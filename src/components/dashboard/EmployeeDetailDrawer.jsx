"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../api/client";
import { formatINR, formatPct, MONTH_NAMES, getStatusBadge } from "./dashboardUtils";

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

export default function EmployeeDetailDrawer({
  empId,
  month,
  year,
  onClose
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!empId) return;
    setLoading(true);
    setError(null);
    api.get(`/admin/performance-employee-detail/${empId}?month=${month}&year=${year}`)
      .then((res) => {
        setData(res.data?.data);
      })
      .catch((err) => {
        console.error("Failed to load employee detail:", err);
        setError(err.response?.data?.message || "Failed to load employee performance record.");
      })
      .finally(() => setLoading(false));
  }, [empId, month, year]);

  const emp = data?.employee;
  const m = data?.monthly;
  const t = data?.today;
  const sales = m?.sales;
  const appt = m?.appointments;
  const perf = m?.performance;

  const salesTarget = sales?.target || 1300000;
  const achievedSales = sales?.monthlySales || 0;
  const remainingSales = Math.max(0, salesTarget - achievedSales);
  const excessSales = sales?.excessSales || Math.max(0, achievedSales - salesTarget);
  const salesAchPct = sales?.achievementPercent || (salesTarget > 0 ? (achievedSales / salesTarget) * 100 : 0);
  const salesProgressPct = Math.min(salesAchPct, 100);

  const initial = (emp?.name || "E").charAt(0).toUpperCase();

  return (
    <div className="perf-drawer-backdrop" onClick={onClose}>
      <div className="perf-drawer" onClick={(e) => e.stopPropagation()} style={{ width: "520px", maxWidth: "95vw" }}>
        {/* ── Enterprise Header (Section 13) ── */}
        <div className="perf-drawer-header" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "16px",
                flexShrink: 0
              }}
            >
              {initial}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-heading, #0f172a)" }}>
                  {emp?.name || "Executive Record"}
                </h3>
                {data?.rank && (
                  <span className={`rank-badge ${data.rank === 1 ? "rank-gold" : data.rank === 2 ? "rank-silver" : data.rank === 3 ? "rank-bronze" : "rank-default"}`} style={{ fontSize: "11px", padding: "2px 6px" }}>
                    #{data.rank} of {data.totalEmployees}
                  </span>
                )}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", marginTop: "2px" }}>
                ID: {String(empId).slice(-6).toUpperCase()} • {emp?.designation || "Sales Executive"} • {emp?.department?.name || "Operations"}
              </div>
            </div>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose} title="Close drawer">
            <CloseIcon />
          </button>
        </div>

        {/* ── Drawer Body ── */}
        <div className="perf-drawer-body" style={{ padding: "18px 20px", gap: "16px" }}>
          {loading && (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
              <div className="skeleton-box" style={{ width: "100%", height: "80px", marginBottom: "12px" }} />
              <div className="skeleton-box" style={{ width: "100%", height: "160px" }} />
            </div>
          )}

          {error && (
            <div style={{ padding: "20px", background: "rgba(239, 68, 68, 0.08)", color: "#ef4444", borderRadius: "10px", fontSize: "13px" }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Composite Score Strip */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span className="perf-score-chip blue" style={{ fontSize: "12px" }}>
                  Raw Score: {formatPct(perf?.rawScore)}
                </span>
                <span className="perf-score-chip" style={{ background: "#f1f5f9", color: "#334155", fontSize: "12px" }}>
                  Rank Score: {formatPct(perf?.rankingScore)}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    display: "inline-block",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: getStatusBadge(sales?.status).bg,
                    color: getStatusBadge(sales?.status).color,
                    border: `1px solid ${getStatusBadge(sales?.status).border}`
                  }}
                >
                  {getStatusBadge(sales?.status).label}
                </span>
              </div>

              {/* ── Section 15: Monthly Sales Performance & Progress ── */}
              <div className="perf-drawer-section">
                <div className="perf-drawer-section-title">
                  <span>Monthly Sales Target &amp; Incentive</span>
                  <span style={{ color: "#16a34a" }}>
                    {formatINR(sales?.bonus || 0)} Bonus
                  </span>
                </div>

                {/* Progress Visualizer */}
                <div style={{ margin: "4px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-heading, #0f172a)" }}>
                      {formatINR(achievedSales)} / {formatINR(salesTarget)}
                    </span>
                    <strong style={{ color: salesAchPct >= 100 ? "#16a34a" : "#d97706" }}>
                      {formatPct(salesAchPct)}
                    </strong>
                  </div>
                  <div style={{ height: "9px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${salesProgressPct}%`,
                        height: "100%",
                        background: salesAchPct >= 100 ? "#16a34a" : "#0284c7",
                        borderRadius: "999px",
                        transition: "width 0.4s ease"
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted, #64748b)", marginTop: "4px" }}>
                    <span>
                      {remainingSales === 0 ? "Target accomplished!" : `Remaining: ${formatINR(remainingSales)}`}
                    </span>
                    <span>
                      {excessSales > 0 ? `Surplus: ${formatINR(excessSales)}` : "No surplus volume"}
                    </span>
                  </div>
                </div>

                <div className="perf-drawer-kv-grid">
                  <div className="perf-drawer-kv">
                    <span>Verified Leads</span>
                    <strong>{sales?.verifiedLeadCount || 0} visits</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Valuation / Lead</span>
                    <strong>{formatINR(sales?.saleValuePerLead || 65000)}</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Excess Sales Above Quota</span>
                    <strong style={{ color: excessSales > 0 ? "#16a34a" : "inherit" }}>{formatINR(excessSales)}</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Bonus Earned</span>
                    <strong style={{ color: "#16a34a" }}>{formatINR(sales?.bonus || 0)}</strong>
                  </div>
                </div>
              </div>

              {/* Today's Appointments */}
              <div className="perf-drawer-section">
                <div className="perf-drawer-section-title">
                  <span>Today's Daily Quota</span>
                  <span style={{ color: "#0284c7" }}>{formatPct(t?.achievementPercent)}</span>
                </div>
                <div className="perf-drawer-kv-grid">
                  <div className="perf-drawer-kv">
                    <span>Target</span>
                    <strong>{t?.target || 5} appts</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Completed</span>
                    <strong style={{ color: "#16a34a" }}>{t?.completed || 0} appts</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Remaining</span>
                    <strong>{t?.remaining || 0} appts</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Daily Status</span>
                    <strong>{t?.status || "Pending"}</strong>
                  </div>
                </div>
              </div>

              {/* Monthly Appointment Status Breakdown */}
              <div className="perf-drawer-section">
                <div className="perf-drawer-section-title">
                  <span>Monthly Appointment Pipeline</span>
                  <span>{MONTH_NAMES[month]} {year}</span>
                </div>
                <div className="perf-drawer-kv-grid">
                  <div className="perf-drawer-kv">
                    <span>Working Days</span>
                    <strong>{appt?.workingDays || 0} days</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Expected Target</span>
                    <strong>{appt?.expectedAppointments || 0} appts</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Completed / Verified</span>
                    <strong style={{ color: "#16a34a" }}>{appt?.completed || 0}</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Pending Verification</span>
                    <strong style={{ color: "#0284c7" }}>{appt?.pending || 0}</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Rescheduled</span>
                    <strong style={{ color: "#d97706" }}>{appt?.rescheduled || 0}</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Cancelled / Rejected</span>
                    <strong style={{ color: "#ef4444" }}>{appt?.cancelled || 0}</strong>
                  </div>
                </div>
              </div>

              {/* ── Section 14: Chronological Daily History ── */}
              {data.dailyHistory?.length > 0 && (
                <div className="perf-drawer-section">
                  <div className="perf-drawer-section-title">
                    <span>Daily History Log</span>
                    <span>{data.dailyHistory.length} Recorded Days</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "240px", overflowY: "auto" }}>
                    {data.dailyHistory.map((d, i) => {
                      const dt = new Date(d.date);
                      const isMet = d.completed >= d.target;
                      const badge = getStatusBadge(d.status);

                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            background: "#ffffff",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            fontSize: "12px"
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "var(--text-heading, #0f172a)" }}>
                            {dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", weekday: "short" })}
                          </span>
                          <span style={{ color: "var(--text-muted, #64748b)" }}>
                            Target: {d.target}
                          </span>
                          <span style={{ fontWeight: 700, color: isMet ? "#16a34a" : "#ef4444" }}>
                            {d.completed}/{d.target} ({formatPct(d.achievementPercent)})
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              background: badge.bg,
                              color: badge.color
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
