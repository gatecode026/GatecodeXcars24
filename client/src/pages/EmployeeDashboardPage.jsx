import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H7.5a1 1 0 0 0-.8.4L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3" />
    <circle cx="6.5" cy="16.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const RupeeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12M6 8h12M9 3l3 18M15 3l-3 18" />
    <path d="M12 21c-2.5 0-5-1.5-5-4s2.5-4 5-4 5 1.5 5 4-2.5 4-5 4z" />
  </svg>
);

const FILTERS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Date Range" },
];

const EmployeeDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ orderCount: 0, returnCount: 0, totalIncentive: 0, leadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(async (f, sd, ed) => {
    try {
      setLoading(true);
      const params = { filter: f };
      if (f === "custom") {
        if (sd) params.startDate = sd;
        if (ed) params.endDate = ed;
      }
      const [dashRes, custRes] = await Promise.all([
        api.get("/employee/dashboard", { params }).catch(() => ({ data: { data: {} } })),
        api.get("/customers").catch(() => ({ data: { data: [] } }))
      ]);

      const dData = dashRes.data?.data || {};
      const cData = custRes.data?.data || [];

      setStats({
        orderCount: dData.orderCount || 0,
        returnCount: dData.returnCount || 0,
        totalIncentive: dData.totalIncentive || 0,
        leadCount: cData.length
      });
    } catch {
      setStats({ orderCount: 0, returnCount: 0, totalIncentive: 0, leadCount: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter, startDate, endDate);
  }, [filter, startDate, endDate, load]);

  const handleFilterClick = (key) => {
    setFilter(key);
    if (key !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="content-area">
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>Executive Dashboard</h1>
          <p>Welcome back, <strong>{user?.name || "Executive"}</strong> • GatecodeXcars24 Operations</p>
        </div>

        <div className="page-actions-group">
          <button className="btn btn-secondary" onClick={() => load(filter, startDate, endDate)}>
            <RefreshIcon />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: "12px 18px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>Filter Period:</span>
        <div className="time-filter-pills">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleFilterClick(key)}
              className={`time-pill-btn ${filter === key ? "active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        {filter === "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "10px" }}>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={todayStr}
              style={{ width: "auto", padding: "4px 8px", fontSize: "12.5px" }}
            />
            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>to</span>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={todayStr}
              style={{ width: "auto", padding: "4px 8px", fontSize: "12.5px" }}
            />
          </div>
        )}
      </div>

      {/* 4 KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap cyan">
              <UsersIcon />
            </div>
            <span className="kpi-pill positive">Active</span>
          </div>
          <div className="kpi-label">Your Customer Leads</div>
          <div className="kpi-value">{loading ? "..." : stats.leadCount}</div>
          <div className="kpi-subtext">Total leads generated &amp; assigned</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap blue">
              <CarIcon />
            </div>
            <span className="kpi-pill info">Purchased</span>
          </div>
          <div className="kpi-label">Cars Processed</div>
          <div className="kpi-value">{loading ? "..." : stats.orderCount}</div>
          <div className="kpi-subtext">Vehicle purchases booked</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap amber">
              <RefreshIcon />
            </div>
            <span className="kpi-pill warning">Returns</span>
          </div>
          <div className="kpi-label">Returns / Issues</div>
          <div className="kpi-value">{loading ? "..." : stats.returnCount}</div>
          <div className="kpi-subtext">Customer complaints or returns</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap purple">
              <RupeeIcon />
            </div>
            <span className="kpi-pill positive">Earned</span>
          </div>
          <div className="kpi-label">Total Incentive</div>
          <div className="kpi-value">
            {loading ? "..." : `₹${Number(stats.totalIncentive || 0).toLocaleString("en-IN")}`}
          </div>
          <div className="kpi-subtext">Approved incentive payouts</div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboardPage;