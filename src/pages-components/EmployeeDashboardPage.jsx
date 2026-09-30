"use client";
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

const PhoneCallIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const TargetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const EmployeeDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    orderCount: 0,
    returnCount: 0,
    totalIncentive: 0,
    leadCount: 0,
    callingStats: { totalCalls: 0, connectedCalls: 0, conversionsDone: 0, revenueGenerated: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(async (f, sd, ed, isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const params = { filter: f };
      if (f === "custom") {
        if (sd) params.startDate = sd;
        if (ed) params.endDate = ed;
      }
      const dashRes = await api.get("/employee/dashboard", { params });
      const dData = dashRes.data?.data || {};

      setStats({
        orderCount: dData.orderCount || 0,
        returnCount: dData.returnCount || 0,
        totalIncentive: dData.totalIncentive || 0,
        leadCount: dData.leadCount || 0,
        callingStats: dData.callingStats || { totalCalls: 0, connectedCalls: 0, conversionsDone: 0, revenueGenerated: 0 }
      });
    } catch {
      // keep previous state if background
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter, startDate, endDate);
  }, [filter, startDate, endDate, load]);

  // Real-time live background polling & focus synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      load(filter, startDate, endDate, true);
    }, 8000);

    const onFocus = () => load(filter, startDate, endDate, true);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ margin: 0 }}>Executive Dashboard</h1>
            <span className="badge-live-pulse">
              <span className="badge-live-dot" /> Live Data
            </span>
          </div>
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

      {/* 6 KPI Cards Grid */}
      <div className="kpi-grid">
        {loading && stats.leadCount === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`skel-card-${i}`} className="skeleton-card">
              <div className="skeleton-box" style={{ height: "20px", width: "40%" }} />
              <div className="skeleton-box" style={{ height: "36px", width: "60%" }} />
              <div className="skeleton-box" style={{ height: "14px", width: "75%" }} />
            </div>
          ))
        ) : (
          <>
            <div className="kpi-card">
              <div className="kpi-top">
                <div className="kpi-icon-wrap cyan">
                  <UsersIcon />
                </div>
                <span className="kpi-pill positive">Active</span>
              </div>
              <div className="kpi-label">Your Customer Leads</div>
              <div className="kpi-value">{stats.leadCount}</div>
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
              <div className="kpi-value">{stats.orderCount}</div>
              <div className="kpi-subtext">Vehicle purchases booked</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <div className="kpi-icon-wrap purple">
                  <PhoneCallIcon />
                </div>
                <span className="kpi-pill info">Calls</span>
              </div>
              <div className="kpi-label">Calls Done / Connected</div>
              <div className="kpi-value">
                {stats.callingStats?.totalCalls || 0}
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)", marginLeft: "6px" }}>
                  ({stats.callingStats?.connectedCalls || 0} conn)
                </span>
              </div>
              <div className="kpi-subtext">Total calls dialed &amp; engaged</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <div className="kpi-icon-wrap emerald">
                  <TargetIcon />
                </div>
                <span className="kpi-pill positive">Deals</span>
              </div>
              <div className="kpi-label">Call Conversions</div>
              <div className="kpi-value">{stats.callingStats?.conversionsDone || 0}</div>
              <div className="kpi-subtext">Deals successfully closed via telecalling</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-top">
                <div className="kpi-icon-wrap amber">
                  <RefreshIcon />
                </div>
                <span className="kpi-pill warning">Returns</span>
              </div>
              <div className="kpi-label">Returns / Issues</div>
              <div className="kpi-value">{stats.returnCount}</div>
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
                ₹{Number(stats.totalIncentive || 0).toLocaleString("en-IN")}
              </div>
              <div className="kpi-subtext">
                Approved payout {stats.callingStats?.revenueGenerated > 0 ? `• ₹${stats.callingStats.revenueGenerated.toLocaleString("en-IN")} rev` : ""}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboardPage;