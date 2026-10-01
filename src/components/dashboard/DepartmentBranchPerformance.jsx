"use client";

import React, { useMemo } from "react";
import { formatINR, formatPct } from "./dashboardUtils";

export default function DepartmentBranchPerformance({
  rankings = [],
  loading = false,
  onSelectDepartment,
  onSelectBranch
}) {
  // Aggregate by Department
  const departmentStats = useMemo(() => {
    const map = {};
    rankings.forEach((r) => {
      const dept = r.employee.department?.name || "General Operations";
      const deptId = r.employee.department?.id || "";
      if (!map[dept]) {
        map[dept] = {
          name: dept,
          id: deptId,
          employees: 0,
          expectedAppts: 0,
          completedAppts: 0,
          salesTarget: 0,
          monthlySales: 0,
          bonus: 0
        };
      }
      map[dept].employees += 1;
      map[dept].expectedAppts += r.appointments?.expectedAppointments || 0;
      map[dept].completedAppts += r.appointments?.completed || 0;
      map[dept].salesTarget += r.sales?.target || 1300000;
      map[dept].monthlySales += r.sales?.monthlySales || 0;
      map[dept].bonus += r.sales?.bonus || 0;
    });

    return Object.values(map).map((d) => ({
      ...d,
      apptAch: d.expectedAppts ? (d.completedAppts / d.expectedAppts) * 100 : 0,
      salesAch: d.salesTarget ? (d.monthlySales / d.salesTarget) * 100 : 0
    }));
  }, [rankings]);

  // Aggregate by Branch
  const branchStats = useMemo(() => {
    const map = {};
    rankings.forEach((r) => {
      const branch = r.employee.branch?.name || "Main Hub";
      const branchId = r.employee.branch?.id || "";
      const city = r.employee.branch?.city || "";
      if (!map[branch]) {
        map[branch] = {
          name: branch,
          id: branchId,
          city,
          employees: 0,
          completedAppts: 0,
          expectedAppts: 0,
          monthlySales: 0,
          salesTarget: 0,
          bonus: 0
        };
      }
      map[branch].employees += 1;
      map[branch].expectedAppts += r.appointments?.expectedAppointments || 0;
      map[branch].completedAppts += r.appointments?.completed || 0;
      map[branch].salesTarget += r.sales?.target || 1300000;
      map[branch].monthlySales += r.sales?.monthlySales || 0;
      map[branch].bonus += r.sales?.bonus || 0;
    });

    return Object.values(map).map((b) => ({
      ...b,
      apptAch: b.expectedAppts ? (b.completedAppts / b.expectedAppts) * 100 : 0,
      salesAch: b.salesTarget ? (b.monthlySales / b.salesTarget) * 100 : 0
    }));
  }, [rankings]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: "20px", marginBottom: "24px" }}>
      {/* ── Department Comparison ── */}
      <div className="table-card">
        <div style={{ paddingBottom: "12px", marginBottom: "14px", borderBottom: "1px solid var(--border-light, #e2e8f0)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
            Department Performance Analytics
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted, #64748b)" }}>
            Operational appointment and sales benchmark attainment across company divisions
          </p>
        </div>

        <div className="table-container" style={{ overflowX: "auto" }}>
          <table className="customers-table">
            <thead>
              <tr>
                <th>Department</th>
                <th style={{ textAlign: "center" }}>Staff</th>
                <th style={{ textAlign: "center" }}>Appt Ach %</th>
                <th style={{ textAlign: "right" }}>Monthly Sales</th>
                <th style={{ textAlign: "center" }}>Sales Ach %</th>
                <th style={{ textAlign: "right" }}>Bonus</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} style={{ padding: "14px" }}>
                      <div className="skeleton-box" style={{ width: "100%", height: "20px" }} />
                    </td>
                  </tr>
                ))
              ) : departmentStats.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted, #64748b)" }}>
                    No department data recorded.
                  </td>
                </tr>
              ) : (
                departmentStats.map((d, i) => (
                  <tr
                    key={i}
                    style={{ cursor: d.id ? "pointer" : "default" }}
                    onClick={() => d.id && onSelectDepartment && onSelectDepartment(d.id)}
                    title={d.id ? `Filter dashboard for ${d.name}` : undefined}
                  >
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--text-heading, #0f172a)" }}>{d.name}</span>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>{d.employees}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: d.apptAch >= 100 ? "#16a34a" : "#0284c7" }}>
                        {formatPct(d.apptAch)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatINR(d.monthlySales)}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: d.salesAch >= 100 ? "#16a34a" : "#d97706" }}>
                        {formatPct(d.salesAch)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: d.bonus > 0 ? "#16a34a" : "var(--text-muted, #64748b)" }}>
                      {formatINR(d.bonus)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Branch Comparison ── */}
      <div className="table-card">
        <div style={{ paddingBottom: "12px", marginBottom: "14px", borderBottom: "1px solid var(--border-light, #e2e8f0)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
            Regional Branch Analytics
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted, #64748b)" }}>
            Regional hub performance tracking and sales target efficiency
          </p>
        </div>

        <div className="table-container" style={{ overflowX: "auto" }}>
          <table className="customers-table">
            <thead>
              <tr>
                <th>Branch / Hub</th>
                <th style={{ textAlign: "center" }}>Staff</th>
                <th style={{ textAlign: "center" }}>Appt Ach %</th>
                <th style={{ textAlign: "right" }}>Monthly Sales</th>
                <th style={{ textAlign: "center" }}>Sales Ach %</th>
                <th style={{ textAlign: "right" }}>Bonus</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} style={{ padding: "14px" }}>
                      <div className="skeleton-box" style={{ width: "100%", height: "20px" }} />
                    </td>
                  </tr>
                ))
              ) : branchStats.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted, #64748b)" }}>
                    No regional branch data recorded.
                  </td>
                </tr>
              ) : (
                branchStats.map((b, i) => (
                  <tr
                    key={i}
                    style={{ cursor: b.id ? "pointer" : "default" }}
                    onClick={() => b.id && onSelectBranch && onSelectBranch(b.id)}
                    title={b.id ? `Filter dashboard for ${b.name}` : undefined}
                  >
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-heading, #0f172a)" }}>{b.name}</span>
                        {b.city && <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>{b.city}</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>{b.employees}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: b.apptAch >= 100 ? "#16a34a" : "#0284c7" }}>
                        {formatPct(b.apptAch)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatINR(b.monthlySales)}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: b.salesAch >= 100 ? "#16a34a" : "#d97706" }}>
                        {formatPct(b.salesAch)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: b.bonus > 0 ? "#16a34a" : "var(--text-muted, #64748b)" }}>
                      {formatINR(b.bonus)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
