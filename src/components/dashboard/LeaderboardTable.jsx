"use client";

import React, { useState, useMemo } from "react";
import { formatINR, formatPct, getStatusBadge } from "./dashboardUtils";

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

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

export default function LeaderboardTable({
  rankings = [],
  loading = false,
  onSelectEmployee
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter rankings strictly on client search without disrupting deterministic server rank
  const filteredRankings = useMemo(() => {
    if (!searchTerm.trim()) return rankings;
    const term = searchTerm.toLowerCase().trim();
    return rankings.filter((r) => {
      const name = (r.employee?.name || "").toLowerCase();
      const email = (r.employee?.email || "").toLowerCase();
      const dept = (r.employee?.department?.name || "").toLowerCase();
      const branch = (r.employee?.branch?.name || "").toLowerCase();
      return name.includes(term) || email.includes(term) || dept.includes(term) || branch.includes(term);
    });
  }, [rankings, searchTerm]);

  const totalPages = Math.ceil(filteredRankings.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRankings.slice(start, start + pageSize);
  }, [filteredRankings, currentPage, pageSize]);

  return (
    <div className="table-card" style={{ marginBottom: "24px" }}>
      {/* Table Header Bar */}
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
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.12)",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <TrophyIcon />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
              Employee Performance Leaderboard
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted, #64748b)" }}>
              Authoritative ranking sorted by composite ranking score, sales volume &amp; appointment rate
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Quick Search */}
          <div style={{ position: "relative", minWidth: "220px" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted, #64748b)" }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search executive, department..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ height: "34px", paddingLeft: "32px", fontSize: "12.5px" }}
            />
          </div>
        </div>
      </div>

      {/* Table Scroll Area */}
      <div className="table-container" style={{ overflowX: "auto" }}>
        <table className="customers-table">
          <thead>
            <tr>
              <th style={{ width: "55px", textAlign: "center" }}>Rank</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Branch</th>
              <th style={{ textAlign: "center" }}>Today's Appts</th>
              <th style={{ textAlign: "center" }}>Daily Target</th>
              <th style={{ textAlign: "center" }}>Daily Ach %</th>
              <th style={{ textAlign: "right" }}>Monthly Sales</th>
              <th style={{ textAlign: "right" }}>Monthly Target</th>
              <th style={{ textAlign: "center" }}>Sales Ach %</th>
              <th style={{ textAlign: "center" }}>Overall Score</th>
              <th style={{ textAlign: "right" }}>Bonus</th>
              <th style={{ textAlign: "center" }}>Status</th>
              <th style={{ width: "50px", textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td colSpan={14} style={{ padding: "16px" }}>
                    <div className="skeleton-box" style={{ width: "100%", height: "24px" }} />
                  </td>
                </tr>
              ))
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={14} style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted, #64748b)" }}>
                  No employee performance records found matching the active filters.
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => {
                const rankCls =
                  r.rank === 1 ? "rank-gold" : r.rank === 2 ? "rank-silver" : r.rank === 3 ? "rank-bronze" : "rank-default";
                const badge = getStatusBadge(r.sales?.status);
                const score = r.performance?.rankingScore ?? 0;
                const scoreColor = score >= 100 ? "#16a34a" : score >= 75 ? "#0284c7" : score >= 50 ? "#d97706" : "#ef4444";

                return (
                  <tr
                    key={r.employee.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => onSelectEmployee && onSelectEmployee(r.employee.id)}
                  >
                    <td style={{ textAlign: "center" }}>
                      <span className={`rank-badge ${rankCls}`}>#{r.rank}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-heading, #0f172a)" }}>
                          {r.employee.name}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>
                          {r.employee.email}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text, #334155)" }}>
                        {r.employee.department?.name || "-"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text, #334155)" }}>
                        {r.employee.branch?.name || "-"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>
                      {r.appointments.completed}
                    </td>
                    <td style={{ textAlign: "center", color: "var(--text-muted, #64748b)" }}>
                      {r.appointments.dailyTarget}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "12px",
                          color: r.appointments.achievementPercent >= 100 ? "#16a34a" : "#0284c7"
                        }}
                      >
                        {formatPct(r.appointments.achievementPercent)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text-heading, #0f172a)" }}>
                      {formatINR(r.sales.monthlySales)}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--text-muted, #64748b)", fontSize: "12px" }}>
                      {formatINR(r.sales.target)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "12px",
                          color: r.sales.achievementPercent >= 100 ? "#16a34a" : "#d97706"
                        }}
                      >
                        {formatPct(r.sales.achievementPercent)}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "45px", height: "6px", background: "#e2e8f0", borderRadius: "99px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${Math.min(score, 100)}%`,
                              height: "100%",
                              background: scoreColor
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: scoreColor }}>
                          {formatPct(score)}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: r.sales.bonus > 0 ? "#16a34a" : "var(--text-muted, #64748b)" }}>
                      {formatINR(r.sales.bonus)}
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
                    <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-action btn-action-view"
                        title="View Employee Detail"
                        onClick={() => onSelectEmployee && onSelectEmployee(r.employee.id)}
                      >
                        <EyeIcon />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
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
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRankings.length)} of {filteredRankings.length} executives
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
  );
}
