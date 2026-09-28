import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ animation: spinning ? "spin 0.8s linear infinite" : "none" }}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UserPlusIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "-";
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
};

export const LiveActivityPanel = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef(null);

  const fetchActivities = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get("/activities", {
        params: { limit: 50, type: filter !== "all" ? filter : undefined }
      });
      setActivities(res.data?.data || []);
    } catch (err) {
      console.error("Live activity fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isOpen) {
      fetchActivities();
      // Auto-poll every 7 seconds while drawer is open
      pollRef.current = setInterval(() => {
        fetchActivities(true);
      }, 7000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOpen, fetchActivities]);

  if (!isOpen) return null;

  const isTLOrAdmin = user?.role === "admin" || user?.role === "tl";

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case "LEAD_CREATED":
        return <UserPlusIcon />;
      case "APPOINTMENT_SCHEDULED":
        return <CalendarIcon />;
      case "STATUS_CHANGED":
        return <CheckCircleIcon />;
      case "LEAD_DELETED":
        return <TrashIcon />;
      default:
        return <EditIcon />;
    }
  };

  const getIconColorClass = (actionType) => {
    switch (actionType) {
      case "LEAD_CREATED":
        return "green";
      case "APPOINTMENT_SCHEDULED":
        return "blue";
      case "STATUS_CHANGED":
        return "amber";
      case "LEAD_DELETED":
        return "red";
      default:
        return "blue";
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="live-activity-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="live-activity-header">
          <div className="live-activity-header-left">
            <span className="live-pulse-badge">
              <span className="live-pulse-dot" /> Live
            </span>
            <h3 className="live-activity-title">Live Activity Log</h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              className="top-nav-action-btn"
              title="Refresh Activity Log"
              onClick={() => fetchActivities(true)}
              style={{ width: "32px", height: "32px" }}
            >
              <RefreshIcon spinning={refreshing} />
            </button>
            <button
              className="modal-close-btn"
              onClick={onClose}
              title="Close Panel"
              style={{ width: "32px", height: "32px" }}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="live-activity-filter-bar">
          <button
            className={`activity-filter-chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Updates
          </button>
          <button
            className={`activity-filter-chip ${filter === "APPOINTMENT_SCHEDULED" ? "active" : ""}`}
            onClick={() => setFilter("APPOINTMENT_SCHEDULED")}
          >
            Appointments
          </button>
          <button
            className={`activity-filter-chip ${filter === "LEAD_CREATED" ? "active" : ""}`}
            onClick={() => setFilter("LEAD_CREATED")}
          >
            New Leads
          </button>
          <button
            className={`activity-filter-chip ${filter === "STATUS_CHANGED" ? "active" : ""}`}
            onClick={() => setFilter("STATUS_CHANGED")}
          >
            Status Updates
          </button>
          <button
            className={`activity-filter-chip ${filter === "LEAD_UPDATED" ? "active" : ""}`}
            onClick={() => setFilter("LEAD_UPDATED")}
          >
            Edits
          </button>
        </div>

        {/* Activity List */}
        <div className="live-activity-list">
          {loading && activities.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              <div className="loading-spinner" />
              <p style={{ marginTop: "10px", fontSize: "13px" }}>Loading live operations stream...</p>
            </div>
          ) : activities.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              <p style={{ fontSize: "14px", fontWeight: 600 }}>No recent activities</p>
              <p style={{ fontSize: "12px", marginTop: "4px" }}>
                Actions performed by TL and executives will appear here live.
              </p>
            </div>
          ) : (
            activities.map((act) => {
              const isTLItem = act.performedByRole === "admin" || act.performedByRole === "tl";
              const highlightClass = isTLItem
                ? "tl-highlight"
                : act.isTarget
                ? "target-highlight"
                : "emp-highlight";

              return (
                <div key={act._id} className={`activity-card-item ${highlightClass}`}>
                  <div className={`activity-card-icon-box ${getIconColorClass(act.actionType)}`}>
                    {getActionIcon(act.actionType)}
                  </div>

                  <div className="activity-card-content">
                    <div className="activity-card-top">
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className={`activity-actor-tag ${isTLItem ? "tl" : "employee"}`}>
                          {isTLItem ? "TL / Admin" : "Executive"}
                        </span>
                        <strong style={{ fontSize: "12px", color: "var(--text-heading)" }}>
                          {act.performedByName}
                        </strong>
                      </div>
                      <span className="activity-time-text" title={new Date(act.createdAt).toLocaleString()}>
                        {formatTimeAgo(act.createdAt)}
                      </span>
                    </div>

                    <div className="activity-message-text">
                      {act.message}
                    </div>

                    <div className="activity-chips-row">
                      {act.appointmentId && (
                        <span className="activity-sub-badge" style={{ color: "#0284c7", fontWeight: 700 }}>
                          {act.appointmentId}
                        </span>
                      )}
                      {act.customerName && (
                        <span className="activity-sub-badge">
                          CX: {act.customerName}
                        </span>
                      )}
                      {act.carNumber && (
                        <span className="activity-sub-badge" style={{ fontWeight: 700 }}>
                          {act.carNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveActivityPanel;
