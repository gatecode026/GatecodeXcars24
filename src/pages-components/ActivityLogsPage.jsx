"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { exportTableToCsv } from "../utils/csvHelper";

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== "all") params.type = typeFilter;
      const res = await api.get("/activities", { params });
      setLogs(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load activity logs:", err);
      // Fallback
      try {
        const fb = await api.get("/employee-records");
        setLogs(fb.data?.data || []);
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (log.performedByName || log.employeeName)?.toLowerCase().includes(q) ||
      (log.message || log.details || log.description)?.toLowerCase().includes(q) ||
      (log.actionType || log.type)?.toLowerCase().includes(q) ||
      log.appointmentId?.toLowerCase().includes(q)
    );
  });

  const getTypeBadgeClass = (actionType) => {
    switch (actionType) {
      case "LEAD_CREATED":
        return "badge-verified";
      case "APPOINTMENT_SCHEDULED":
        return "badge-followup";
      case "STATUS_CHANGED":
        return "badge-completed";
      case "LEAD_DELETED":
        return "badge-rejected";
      default:
        return "badge-pending";
    }
  };

  const handleExportCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) return;
    const headers = [
      "Event Type",
      "Executive Name",
      "Role",
      "Activity Description",
      "Appointment ID",
      "Timestamp"
    ];
    const rows = filteredLogs.map((log) => [
      (log.actionType || log.type || "ACTIVITY").replace(/_/g, " "),
      log.performedByName || log.employeeName || "-",
      log.performedByRole || "-",
      log.message || log.details || log.description || "-",
      log.appointmentId || "-",
      log.createdAt || log.date ? new Date(log.createdAt || log.date).toISOString().replace("T", " ").slice(0, 19) : "-"
    ]);
    exportTableToCsv(`Activity_Logs_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
  };

  return (
    <div className="content-area">
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>Activity Logs &amp; Audit Trail</h1>
          <p>Real-time records of lead creation, appointments, verifications and sales</p>
        </div>

        <div className="page-actions-group">
          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            title="Export Activity Logs to CSV"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <button className="btn btn-secondary" onClick={fetchLogs}>
            <RefreshIcon />
            Refresh Logs
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-search-input">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search activity by executive or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <select
              className="form-control"
              style={{ width: "auto" }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Event Types</option>
              <option value="lead">Leads</option>
              <option value="appointment">Appointments</option>
              <option value="verification">Verifications</option>
              <option value="order">Orders / Purchases</option>
              <option value="return">Returns / Issues</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Employee / Executive</th>
                <th>Activity Description</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "30px" }}>
                    <div className="loading-spinner" /> Loading activity logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <span className={`badge ${getTypeBadgeClass(log.actionType || log.type)}`}>
                        {(log.actionType || log.type || "ACTIVITY").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "var(--text-heading)" }}>
                        {log.performedByName || log.employeeName}
                      </strong>
                      {log.performedByRole && (
                        <span style={{ fontSize: "11px", marginLeft: "6px", color: "var(--text-muted)" }}>
                          ({log.performedByRole.toUpperCase()})
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", fontWeight: 500 }}>
                        {log.message || log.details || log.description || "-"}
                      </span>
                      {log.appointmentId && (
                        <span style={{ marginLeft: "8px", fontSize: "11px", color: "#0284c7", fontWeight: 700 }}>
                          [{log.appointmentId}]
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {new Date(log.createdAt || log.date).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
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

export default ActivityLogsPage;
