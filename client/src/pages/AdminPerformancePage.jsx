import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

const FILTERS = ["today", "yesterday", "week", "month", "custom"];

const RefreshIcon = ({ spinning }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
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

const AdminPerformancePage = () => {
  const today = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPerformance = useCallback(async () => {
    try {
      setLoading(true);
      const params = { filter };
      if (filter === "custom") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const res = await api.get("/admin/employee-performance", { params });
      setEmployees(res.data.data || []);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [filter, startDate, endDate]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameStr = (emp.username || emp.name || "").toLowerCase().trim();
    return nameStr.includes(q);
  });

  const formatLabel = (f) => {
    switch (f) {
      case "today": return "Today";
      case "yesterday": return "Yesterday";
      case "week": return "This Week";
      case "month": return "This Month";
      case "custom": return "Custom Range";
      default: return f;
    }
  };

  return (
    <div className="content-area">
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>Employee Performance</h1>
          <p>Track team activity, vehicle orders logged, and telecalling productivity</p>
        </div>
        <div className="page-actions-group">
          <button
            className="btn btn-secondary"
            onClick={fetchPerformance}
            disabled={loading}
            title="Refresh Performance Records"
          >
            <RefreshIcon spinning={loading} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Control Card */}
      <div className="table-card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`}
              >
                {formatLabel(f)}
              </button>
            ))}

            {filter === "custom" && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginLeft: "6px" }}>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  max={today}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    if (endDate && val > endDate) setEndDate("");
                  }}
                  style={{ width: "auto", fontSize: "12.5px", padding: "6px 10px" }}
                />
                <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600 }}>to</span>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  min={startDate}
                  max={today}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: "auto", fontSize: "12.5px", padding: "6px 10px" }}
                />
              </div>
            )}
          </div>

          <div style={{ position: "relative", minWidth: "240px" }}>
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="form-control"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "32px", fontSize: "12.5px", padding: "6px 10px 6px 32px" }}
            />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="card-title-box">
            <h3>Employee Activity ({filteredEmployees.length})</h3>
          </div>
        </div>
        <div className="table-container">
          <table className="leads-table slidable-table">
            <thead>
              <tr>
                <th>Username of Employee</th>
                <th style={{ textAlign: "center" }}>Orders / Deals Handled</th>
                <th style={{ textAlign: "center" }}>Returns / Follow-ups</th>
                <th style={{ textAlign: "center" }}>Total Activity Entries</th>
                <th style={{ textAlign: "center" }}>Productivity Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                      <div className="spinner-border" />
                      Loading employee productivity metrics...
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
                    No employee activity records found for this period.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp._id || emp.username}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            background: "#0284c7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "12px",
                            color: "#ffffff"
                          }}
                        >
                          {(emp.username || emp.name || "?").charAt(0).toUpperCase()}
                        </span>
                        <strong style={{ color: "var(--text-heading)", fontSize: "13.5px" }}>
                          {emp.username || emp.name}
                        </strong>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge-verified-pill followup">
                        {emp.ordersToday ?? 0}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge-verified-pill pending">
                        {emp.returnsToday ?? 0}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <strong style={{ fontSize: "14px", color: "var(--text-heading)" }}>
                        {emp.totalEntries ?? 0}
                      </strong>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {(emp.totalEntries ?? 0) > 0 ? (
                        <span className="badge-verified-pill verified">Active</span>
                      ) : (
                        <span className="badge-verified-pill pending">Idle</span>
                      )}
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
};

export default AdminPerformancePage;
