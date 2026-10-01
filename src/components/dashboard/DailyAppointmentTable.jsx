"use client";

import React, { useState, useMemo } from "react";
import { formatPct, getStatusBadge } from "./dashboardUtils";

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function DailyAppointmentTable({
  rankings = [],
  dailyTargetDefault = 5,
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
        const ach = r.appointments?.achievementPercent || 0;
        if (statusFilter === "met") return ach >= 100;
        if (statusFilter === "missed") return ach < 100;
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
              background: "rgba(2, 132, 199, 0.12)",
              color: "#0284c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <CalendarIcon />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
              Today's Appointment Performance
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted, #64748b)" }}>
              Executive schedule breakdown across completed, pending, rescheduled, and cancelled customer visits
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Status Filter */}
          <select
            className="form-control"
            style={{ height: "34px", padding: "4px 10px", fontSize: "12px", width: "auto" }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="met">Target Met / Exceeded</option>
            <option value="missed">Target Missed</option>
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
              <th style={{ textAlign: "center" }}>Daily Target</th>
              <th style={{ textAlign: "center" }}>Completed</th>
              <th style={{ textAlign: "center" }}>Pending</th>
              <th style={{ textAlign: "center" }}>Rescheduled</th>
              <th style={{ textAlign: "center" }}>Cancelled</th>
              <th style={{ textAlign: "center" }}>No-Show</th>
              <th style={{ textAlign: "center" }}>Achievement %</th>
              <th style={{ textAlign: "center" }}>Daily Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <tr key={i}>
                  <td colSpan={9} style={{ padding: "16px" }}>
                    <div className="skeleton-box" style={{ width: "100%", height: "24px" }} />
                  </td>
                </tr>
              ))
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted, #64748b)" }}>
                  No appointment performance records available for this period.
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => {
                const appt = r.appointments || {};
                const target = appt.dailyTarget || dailyTargetDefault;
                const completed = appt.completed || 0;
                const pending = appt.pending || 0;
                const rescheduled = appt.rescheduled || 0;
                const cancelled = appt.cancelled || 0;
                const noShow = appt.noShow || 0;
                const ach = appt.achievementPercent || 0;

                // Status logic matching backend rule
                const status =
                  ach > 100
                    ? "Target Exceeded"
                    : ach === 100
                    ? "Target Met"
                    : completed === 0
                    ? "Target Missed"
                    : "In Progress";
                const badge = getStatusBadge(status);

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
                          {r.employee.department?.name || "General Operations"}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center", color: "var(--text-muted, #64748b)", fontWeight: 600 }}>
                      {target}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: completed >= target ? "#16a34a" : "#0f172a" }}>
                      {completed}
                    </td>
                    <td style={{ textAlign: "center", color: pending > 0 ? "#0284c7" : "var(--text-muted, #64748b)" }}>
                      {pending}
                    </td>
                    <td style={{ textAlign: "center", color: rescheduled > 0 ? "#d97706" : "var(--text-muted, #64748b)" }}>
                      {rescheduled}
                    </td>
                    <td style={{ textAlign: "center", color: cancelled > 0 ? "#ef4444" : "var(--text-muted, #64748b)" }}>
                      {cancelled}
                    </td>
                    <td style={{ textAlign: "center", color: noShow > 0 ? "#64748b" : "var(--text-muted, #64748b)" }}>
                      {noShow}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: ach >= 100 ? "#16a34a" : "#0284c7" }}>
                        {formatPct(ach)}
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
