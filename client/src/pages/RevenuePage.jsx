import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

const RevenueIcon = () => (
  <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
);

const PackageSmallIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
);

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
);

const formatINR = (n) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const RevenuePage = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (m, y) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/revenue-summary", {
        params: { month: m, year: y }
      });
      setRevenue(res.data.data);
    } catch (err) {
      console.error("Failed to load revenue", err);
      setRevenue(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(month, year); }, [month, year, load]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  const periods = revenue
    ? [
        { label: isCurrentMonth ? "Today" : `${revenue.filter.label} (Daily Avg)`, key: "daily", data: revenue.daily, color: "#06b6d4" },
        { label: isCurrentMonth ? "This Week" : `${revenue.filter.label} (Weekly Avg)`, key: "weekly", data: revenue.weekly, color: "#8b5cf6" },
        { label: revenue.filter.label, key: "monthly", data: revenue.monthly, color: "#10b981" }
      ]
    : [];

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Total Revenue</h2>
          <p className="page-subtitle">Daily, weekly & monthly revenue breakdown</p>
        </div>
        <button className="logout-btn" onClick={() => load(month, year)} title="Refresh">Refresh</button>
      </div>

      <div className="glass-card" style={{ padding: "12px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Filter by Month:</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={prevMonth} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", cursor: "pointer", padding: "6px 8px", display: "flex", alignItems: "center", lineHeight: 0 }}>
            <ChevronLeft />
          </button>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#ffffff", padding: "8px 12px", fontSize: 14, cursor: "pointer" }}
          >
            {MONTHS.map((name, i) => (
              <option key={i} value={i} style={{ background: "#1a2540", color: "#ffffff" }}>{name}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#ffffff", padding: "8px 12px", fontSize: 14, cursor: "pointer" }}
          >
            {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
              <option key={y} value={y} style={{ background: "#1a2540", color: "#ffffff" }}>{y}</option>
            ))}
          </select>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 8, color: isCurrentMonth ? "var(--text-muted)" : "var(--text)", cursor: isCurrentMonth ? "not-allowed" : "pointer", padding: "6px 8px", display: "flex", alignItems: "center", lineHeight: 0, opacity: isCurrentMonth ? 0.5 : 1 }}
          >
            <ChevronRight />
          </button>
        </div>
        {!isCurrentMonth && (
          <button
            onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()); }}
            style={{ background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.3)", borderRadius: 8, color: "var(--primary)", padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 500, marginLeft: "auto" }}
          >
            Back to Current Month
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: 40 }}>Loading revenue data...</p>
      ) : !revenue ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: 40 }}>Could not load revenue data.</p>
      ) : (
        <>
          <div className="stats-grid stats-grid-3">
            {periods.map(({ label, data, color }) => (
              <article
                key={label}
                className="stat-card glass-card"
                style={{ borderTop: `3px solid ${color}`, flexDirection: "column", gap: 12 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                  <div className="stat-icon" style={{ background: `${color}20`, color, width: 42, height: 42 }}>
                    <RevenueIcon />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{label}</p>
                    <h3 style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 800, color: "var(--text-heading)", letterSpacing: "-1px" }}>
                      {formatINR(data.total)}
                    </h3>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, width: "100%" }}>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <PhoneIcon />
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Calling</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-heading)" }}>{formatINR(data.calling)}</span>
                  </div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <PackageSmallIcon />
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Orders</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-heading)" }}>{formatINR(data.orders)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
            <div className="section-header" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Revenue Breakdown — {revenue.filter.label}</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Period</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Calling Revenue</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Order Revenue</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map(({ label, data }) => (
                    <tr key={label} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 12px", fontWeight: 600 }}>{label}</td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>{formatINR(data.calling)}</td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>{formatINR(data.orders)}</td>
                      <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>{formatINR(data.total)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "rgba(6, 182, 212, 0.05)" }}>
                    <td style={{ padding: "12px 12px", fontWeight: 700 }}>Grand Total ({revenue.filter.label})</td>
                    <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600 }}>{formatINR(revenue.monthly.calling)}</td>
                    <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600 }}>{formatINR(revenue.monthly.orders)}</td>
                    <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 800, color: "var(--primary)", fontSize: 16 }}>{formatINR(revenue.monthly.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default RevenuePage;
