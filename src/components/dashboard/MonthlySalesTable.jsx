"use client";

import React, { useState, useMemo } from "react";
import { formatINR, formatPct, getStatusBadge } from "./dashboardUtils";

const RupeeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13l8.5 8" />
    <path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function MonthlySalesTable({
  rankings = [],
  loading = false,
  onSelectEmployee
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredList = useMemo(() => {
    let list = rankings;
    if (statusFilter !== "all") {
      list = list.filter((r) => {
        const sales = r.sales?.monthlySales || 0;
        const target = r.sales?.target || 1300000;
        if (statusFilter === "met") return sales >= target;
        if (statusFilter === "pending") return sales < target;
        return true;
      });
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((r) => {
        const name = (r.employee?.name || "").toLowerCase();
        const dept = (r.employee?.department?.name || "").toLowerCase();
        return name.includes(term) || dept.includes(term);
      });
    }
    return list;
  }, [rankings, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  return (
    <div className="table-card" style={{ marginBottom: "24px" }}>
      {/* Header bar */}
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
            <RupeeIcon />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
              Monthly Sales Performance
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted, #64748b)" }}>
              Quota attainment tracking • Remaining deficit = max(Target − Sales, 0) • Surplus = max(Sales − Target, 0)
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Status filter */}
          <select
            className="form-control"
            style={{ height: "34px", padding: "4px 10px", fontSize: "12px", width: "auto" }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Sales Statuses</option>
            <option value="met">Target Achieved / Exceeded</option>
            <option value="pending">Target In Deficit</option>
          </select>

          {/* Search */}
          <div style={{ position: "relative", minWidth: "200px" }}>
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
      </div>

      {/* Table */}
      <div className="table-container" style={{ overflowX: "auto" }}>
        <table className="customers-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th style={{ textAlign: "right" }}>Target</th>
              <th style={{ textAlign: "right" }}>Achieved</th>
              <th style={{ textAlign: "right" }}>Remaining</th>
              <th style={{ textAlign: "center" }}>Achievement %</th>
              <th style={{ textAlign: "right" }}>Excess Sales</th>
              <th style={{ textAlign: "right" }}>Bonus</th>
              <th style={{ textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <tr key={i}>
                  <td colSpan={8} style={{ padding: "16px" }}>
                    <div className="skeleton-box" style={{ width: "100%", height: "24px" }} />
                  </td>
                </tr>
              ))
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted, #64748b)" }}>
                  No monthly sales performance records available.
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => {
                const s = r.sales || {};
                const target = s.target || 1300000;
                const achieved = s.monthlySales || 0;
                const remaining = Math.max(0, target - achieved);
                const excess = s.excessSales || Math.max(0, achieved - target);
                const ach = s.achievementPercent || 0;
                const bonus = s.bonus || 0;
                const badge = getStatusBadge(s.status);

                return (
                  <tr
                    key={r.employee.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => onSelectEmployee && onSelectEmployee(r.employee.id)}
                  >
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-heading, #0f172a)" }}>
                          {r.employee.name}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>
                          {r.employee.department?.name || "Sales Division"}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", color: "var(--text-muted, #64748b)" }}>
                      {formatINR(target)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text-heading, #0f172a)" }}>
                      {formatINR(achieved)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: remaining === 0 ? "#16a34a" : "#ef4444" }}>
                      {remaining === 0 ? "Achieved" : formatINR(remaining)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: ach >= 100 ? "#16a34a" : "#d97706" }}>
                        {formatPct(ach)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: excess > 0 ? "#16a34a" : "var(--text-muted, #64748b)" }}>
                      {formatINR(excess)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: bonus > 0 ? "#16a34a" : "var(--text-muted, #64748b)" }}>
                      {formatINR(bonus)}
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
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredList.length)} of {filteredList.length} records
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
