"use client";

import React, { useState, useMemo } from "react";
import { formatINR, formatPct, getStatusBadge } from "./dashboardUtils";

const CoinsIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="M17 10h1v4" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function BonusAnalyticsWidget({
  bonusData,
  settings,
  loading = false,
  onSelectEmployee
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const rows = bonusData?.report || [];

  // Summary Metrics
  const eligibleEmployees = rows.filter((r) => (r.bonus || 0) > 0);
  const totalEligibleCount = eligibleEmployees.length;
  const totalExcessSales = rows.reduce((acc, r) => acc + (r.excessSales || 0), 0);
  const totalBonusLiability = bonusData?.totalBonusLiability ?? rows.reduce((acc, r) => acc + (r.bonus || 0), 0);
  const averageBonus = totalEligibleCount > 0 ? Math.round(totalBonusLiability / totalEligibleCount) : 0;
  const highestBonus = rows.reduce((max, r) => Math.max(max, r.bonus || 0), 0);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase().trim();
    return rows.filter((r) => {
      const name = (r.employee?.name || "").toLowerCase();
      const dept = (r.employee?.department?.name || "").toLowerCase();
      return name.includes(term) || dept.includes(term);
    });
  }, [rows, searchTerm]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px" }}>
      {/* 5 Top KPI Cards for Bonus / Incentives */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        {/* Total Eligible Employees */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap green"><CoinsIcon /></div>
            <span className="kpi-pill positive">Eligible</span>
          </div>
          <div className="kpi-label">Eligible Employees</div>
          <div className="kpi-value" style={{ color: "#16a34a" }}>{totalEligibleCount}</div>
          <div className="kpi-subtext">Achieved surplus sales</div>
        </div>

        {/* Total Excess Sales */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap blue"><CoinsIcon /></div>
            <span className="kpi-pill info">Surplus</span>
          </div>
          <div className="kpi-label">Total Excess Sales</div>
          <div className="kpi-value" style={{ fontSize: "19px" }}>{formatINR(totalExcessSales)}</div>
          <div className="kpi-subtext">Volume generated above targets</div>
        </div>

        {/* Total Bonus Liability */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap amber"><CoinsIcon /></div>
            <span className="kpi-pill warning">Liability</span>
          </div>
          <div className="kpi-label">Total Bonus Liability</div>
          <div className="kpi-value" style={{ fontSize: "19px", color: totalBonusLiability > 0 ? "#16a34a" : "inherit" }}>
            {formatINR(totalBonusLiability)}
          </div>
          <div className="kpi-subtext">Total payout pool</div>
        </div>

        {/* Average Bonus */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap cyan"><CoinsIcon /></div>
            <span className="kpi-pill positive">Average</span>
          </div>
          <div className="kpi-label">Average Bonus</div>
          <div className="kpi-value" style={{ fontSize: "19px" }}>{formatINR(averageBonus)}</div>
          <div className="kpi-subtext">Per qualified executive</div>
        </div>

        {/* Highest Bonus */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap purple"><CoinsIcon /></div>
            <span className="kpi-pill purple">Top Earner</span>
          </div>
          <div className="kpi-label">Highest Bonus</div>
          <div className="kpi-value" style={{ fontSize: "19px", color: highestBonus > 0 ? "#7c3aed" : "inherit" }}>
            {formatINR(highestBonus)}
          </div>
          <div className="kpi-subtext">Max incentive recorded</div>
        </div>
      </div>

      {/* Bonus Rule Callout Strip */}
      <div
        style={{
          background: "rgba(16, 185, 129, 0.05)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: "10px",
          padding: "12px 18px",
          fontSize: "12.5px",
          color: "#065f46",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px"
        }}
      >
        <div>
          <strong>Authoritative Incentive Formula:</strong> Bonus is calculated strictly on sales excess above quota (<strong>max(Sales − Target, 0)</strong>). Bonus is never computed from total gross sales.
        </div>
        <span className="badge badge-green" style={{ fontSize: "11px" }}>
          Active Model: {settings?.bonusType === "slab" ? "Tiered Progressive Slabs" : "Flat Percentage"}
        </span>
      </div>

      {/* Detailed Bonus Report Table */}
      <div className="table-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "14px",
            marginBottom: "14px",
            borderBottom: "1px solid var(--border-light, #e2e8f0)",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
              Incentive &amp; Bonus Audit Report
            </h3>
            <span className="badge badge-green">
              Pool: {formatINR(totalBonusLiability)}
            </span>
          </div>

          <div style={{ position: "relative", minWidth: "220px" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted, #64748b)" }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search executive..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ height: "34px", paddingLeft: "30px", fontSize: "12.5px" }}
            />
          </div>
        </div>

        <div className="table-container" style={{ overflowX: "auto" }}>
          <table className="customers-table">
            <thead>
              <tr>
                <th style={{ width: "55px", textAlign: "center" }}>Rank</th>
                <th>Employee</th>
                <th>Department</th>
                <th style={{ textAlign: "right" }}>Monthly Target</th>
                <th style={{ textAlign: "right" }}>Monthly Sales</th>
                <th style={{ textAlign: "right" }}>Excess Sales</th>
                <th style={{ textAlign: "center" }}>Bonus Rate</th>
                <th style={{ textAlign: "right" }}>Bonus Earned</th>
                <th style={{ textAlign: "center" }}>Bonus Type</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    <td colSpan={10} style={{ padding: "16px" }}>
                      <div className="skeleton-box" style={{ width: "100%", height: "24px" }} />
                    </td>
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted, #64748b)" }}>
                    No bonus calculation records for this period.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, i) => {
                  const badge = getStatusBadge(r.salesStatus);
                  const rankCls =
                    r.rank === 1 ? "rank-gold" : r.rank === 2 ? "rank-silver" : r.rank === 3 ? "rank-bronze" : "rank-default";
                  const bonusType = settings?.bonusType === "slab" ? "Progressive Slab" : "Flat Rate";

                  return (
                    <tr
                      key={i}
                      style={{ cursor: "pointer" }}
                      onClick={() => onSelectEmployee && onSelectEmployee(r.employee.id)}
                    >
                      <td style={{ textAlign: "center" }}>
                        <span className={`rank-badge ${rankCls}`}>#{r.rank}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-heading, #0f172a)" }}>
                          {r.employee.name}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--text, #334155)" }}>
                          {r.employee.department?.name || "-"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", color: "var(--text-muted, #64748b)" }}>
                        {formatINR(r.salesTarget)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text-heading, #0f172a)" }}>
                        {formatINR(r.monthlySales)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: r.excessSales > 0 ? "#16a34a" : "var(--text-muted, #64748b)" }}>
                        {formatINR(r.excessSales)}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>
                        {((r.bonusRate || 0.01) * 100).toFixed(2)}%
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: r.bonus > 0 ? "#16a34a" : "var(--text-muted, #64748b)" }}>
                        {formatINR(r.bonus)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", fontWeight: 500 }}>
                          {bonusType}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "16px",
              paddingTop: "12px",
              borderTop: "1px solid var(--border-light, #e2e8f0)",
              fontSize: "12.5px",
              color: "var(--text-muted, #64748b)"
            }}
          >
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} bonus records
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ display: "inline-flex", alignItems: "center", padding: "0 10px", fontWeight: 600 }}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
