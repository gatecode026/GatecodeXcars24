"use client";

import React from "react";
import { formatINR, formatPct } from "./dashboardUtils";

const BarChartIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const LineChartIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export default function PerformanceChartsGrid({
  rankings = [],
  dailyHistory = [],
  loading = false
}) {
  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card" style={{ padding: "20px", minHeight: "260px" }}>
            <div className="skeleton-box" style={{ width: "160px", height: "20px", marginBottom: "16px" }} />
            <div className="skeleton-box" style={{ width: "100%", height: "180px", borderRadius: "8px" }} />
          </div>
        ))}
      </div>
    );
  }

  const hasData = rankings && rankings.length > 0;

  if (!hasData) {
    return (
      <div
        className="card"
        style={{
          padding: "48px 24px",
          textAlign: "center",
          color: "var(--text-muted, #64748b)",
          marginBottom: "24px",
          borderRadius: "12px"
        }}
      >
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>
          No performance data available for this period.
        </p>
      </div>
    );
  }

  // ── 1. Target vs Achievement (Top 5 Executives) ──
  const targetVsAchList = rankings.slice(0, 5);

  // ── 2. Monthly Sales (Top 5 Executives Target vs Actual) ──
  const topSalesList = rankings.slice(0, 5);
  const maxSales = Math.max(...topSalesList.map((r) => Math.max(r.sales.monthlySales, r.sales.target)), 1);

  // ── 3. Employee Ranking (Top 6 Performers) ──
  const topRanked = rankings.slice(0, 6);

  // ── 4. Bonus Distribution (Top Bonus Earners) ──
  const bonusEarners = rankings.filter((r) => (r.sales?.bonus || 0) > 0).slice(0, 6);
  const maxBonus = Math.max(...bonusEarners.map((r) => r.sales.bonus), 1);

  // ── 5. Department Performance Aggregation ──
  const deptMap = {};
  rankings.forEach((r) => {
    const deptName = r.employee.department?.name || "General";
    if (!deptMap[deptName]) {
      deptMap[deptName] = { name: deptName, apptAchSum: 0, salesAchSum: 0, count: 0 };
    }
    deptMap[deptName].apptAchSum += r.appointments?.achievementPercent || 0;
    deptMap[deptName].salesAchSum += r.sales?.achievementPercent || 0;
    deptMap[deptName].count += 1;
  });
  const deptList = Object.values(deptMap).map((d) => ({
    name: d.name,
    avgApptAch: d.count ? Math.round(d.apptAchSum / d.count) : 0,
    avgSalesAch: d.count ? Math.round(d.salesAchSum / d.count) : 0
  }));

  // ── 6. Performance Trend (Aggregated or Executive Daily Trajectory) ──
  const trendPoints = dailyHistory.slice(-14);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", marginBottom: "24px" }}>
      {/* ── Chart 1: Target vs Achievement ── */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChartIcon />
            <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
              Appointment Target vs Completed
            </h4>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>Top 5 Executives</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {targetVsAchList.map((r) => {
            const exp = r.appointments.expectedAppointments || 1;
            const comp = r.appointments.completed || 0;
            const pctVal = Math.min((comp / exp) * 100, 100);

            return (
              <div key={r.employee.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-heading, #0f172a)" }}>{r.employee.name}</span>
                  <span style={{ color: "var(--text-muted, #64748b)" }}>
                    <strong style={{ color: comp >= exp ? "#16a34a" : "#0284c7" }}>{comp}</strong> / {exp} appts ({formatPct(r.appointments.achievementPercent)})
                  </span>
                </div>
                <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${pctVal}%`,
                      height: "100%",
                      background: comp >= exp ? "#16a34a" : "#0284c7",
                      borderRadius: "999px",
                      transition: "width 0.4s ease"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Chart 2: Monthly Sales (Target vs Actual) ── */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChartIcon />
            <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
              Monthly Sales Target vs Actual
            </h4>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>Top Sales Volume</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {topSalesList.map((r) => {
            const sales = r.sales.monthlySales || 0;
            const target = r.sales.target || 1300000;
            const salesPct = Math.min((sales / maxSales) * 100, 100);
            const targetPct = Math.min((target / maxSales) * 100, 100);

            return (
              <div key={r.employee.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-heading, #0f172a)" }}>{r.employee.name}</span>
                  <span style={{ color: sales >= target ? "#16a34a" : "#d97706", fontWeight: 700 }}>
                    {formatINR(sales)} / {formatINR(target)}
                  </span>
                </div>
                {/* Dual Bars: Target & Actual */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ width: `${salesPct}%`, height: "100%", background: sales >= target ? "#16a34a" : "#0284c7" }} />
                  </div>
                  <div style={{ height: "3px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ width: `${targetPct}%`, height: "100%", background: "#94a3b8" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Chart 3: Employee Ranking ── */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LineChartIcon />
            <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
              Top Employee Ranking Scores
            </h4>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>Server Order</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {topRanked.map((r) => {
            const score = r.performance?.rankingScore || 0;
            const rankCls =
              r.rank === 1 ? "rank-gold" : r.rank === 2 ? "rank-silver" : r.rank === 3 ? "rank-bronze" : "rank-default";

            return (
              <div key={r.employee.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className={`rank-badge ${rankCls}`} style={{ width: "30px", height: "24px", fontSize: "11px" }}>
                  #{r.rank}
                </span>
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-heading, #0f172a)", minWidth: "120px" }}>
                  {r.employee.name}
                </span>
                <div style={{ flex: 1, height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(score, 100)}%`,
                      height: "100%",
                      background: score >= 100 ? "#16a34a" : "#0284c7"
                    }}
                  />
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, minWidth: "45px", textAlign: "right" }}>
                  {formatPct(score)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Chart 4: Bonus Distribution ── */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChartIcon />
            <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
              Incentive &amp; Bonus Distribution
            </h4>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>Surplus Earners</span>
        </div>

        {bonusEarners.length === 0 ? (
          <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--text-muted, #64748b)", fontSize: "12.5px" }}>
            No bonus liability accrued. Volume within baseline quotas.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {bonusEarners.map((r) => {
              const b = r.sales.bonus || 0;
              const pctVal = Math.min((b / maxBonus) * 100, 100);

              return (
                <div key={r.employee.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-heading, #0f172a)" }}>{r.employee.name}</span>
                    <span style={{ color: "#16a34a", fontWeight: 700 }}>{formatINR(b)}</span>
                  </div>
                  <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ width: `${pctVal}%`, height: "100%", background: "#10b981", borderRadius: "999px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Chart 5: Department Performance ── */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChartIcon />
            <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
              Departmental Achievement Averages
            </h4>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>Quota Completion</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {deptList.map((d, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
                <span style={{ fontWeight: 600, color: "var(--text-heading, #0f172a)" }}>{d.name}</span>
                <span style={{ fontSize: "11.5px", color: "var(--text-muted, #64748b)" }}>
                  Appts: <strong style={{ color: "#0284c7" }}>{d.avgApptAch}%</strong> • Sales: <strong style={{ color: "#16a34a" }}>{d.avgSalesAch}%</strong>
                </span>
              </div>
              <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min((d.avgApptAch + d.avgSalesAch) / 2, 100)}%`,
                    height: "100%",
                    background: (d.avgApptAch + d.avgSalesAch) / 2 >= 100 ? "#16a34a" : "#0284c7"
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chart 6: Performance Trend ── */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LineChartIcon />
            <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
              Daily Trajectory &amp; Run-Rate
            </h4>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>Daily History</span>
        </div>

        {trendPoints.length === 0 ? (
          <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--text-muted, #64748b)", fontSize: "12.5px" }}>
            Daily history logs populate as appointments are completed.
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", height: "140px", gap: "6px", paddingTop: "10px" }}>
            {trendPoints.map((pt, idx) => {
              const comp = pt.completed || 0;
              const target = pt.target || 5;
              const maxVal = Math.max(...trendPoints.map((p) => Math.max(p.completed || 0, p.target || 5)), 6);
              const barHeight = Math.max(8, (comp / maxVal) * 110);
              const dt = new Date(pt.date);
              const label = dt.getDate();

              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  title={`${dt.toDateString()}: ${comp}/${target} appointments`}
                >
                  <span style={{ fontSize: "10px", fontWeight: 700, color: comp >= target ? "#16a34a" : "#64748b" }}>
                    {comp}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "20px",
                      height: `${barHeight}px`,
                      background: comp >= target ? "#16a34a" : "#0284c7",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease"
                    }}
                  />
                  <span style={{ fontSize: "9.5px", color: "var(--text-muted, #64748b)" }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
