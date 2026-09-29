"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

// ─── Clean Line SVG Icons (Matching Website Design) ───────────────────────────
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const TargetIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const RupeeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13l8.5 8" />
    <path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

const CoinsIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="M17 10h1v4" />
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

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const INR = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

const getBarColor = (score) =>
  score >= 100 ? "#16a34a" : score >= 75 ? "#0284c7" : score >= 50 ? "#d97706" : "#ef4444";

const statusBadge = (status) => {
  if (status === "Target Exceeded") return { cls: "perf-badge exceeded", label: "Exceeded" };
  if (status === "Target Met") return { cls: "perf-badge met", label: "Met" };
  return { cls: "perf-badge pending", label: "Pending" };
};

// ─── Mini Progress Bar Component ──────────────────────────────────────────────
function MiniProgressBar({ score }) {
  const w = Math.min(Math.max(score || 0, 0), 100);
  const color = getBarColor(score);
  return (
    <div className="perf-bar-wrap">
      <div className="perf-bar-track">
        <div className="perf-bar-fill" style={{ width: `${w}%`, background: color }} />
      </div>
      <span className="perf-bar-label" style={{ color }}>{pct(score)}</span>
    </div>
  );
}

// ─── Settings Modal (Website Clean Style) ─────────────────────────────────────
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SettingsModal({ current, onSaved, onClose }) {
  const [form, setForm] = useState({
    dailyAppointmentTarget: current?.dailyAppointmentTarget ?? 5,
    monthlySalesTarget: current?.monthlySalesTarget ?? 1300000,
    bonusRate: current?.bonusRate != null ? (current.bonusRate * 100).toFixed(2) : "1.00",
    saleValuePerLead: current?.saleValuePerLead ?? 65000,
    workingDays: current?.workingDays ?? [1, 2, 3, 4, 5, 6],
    effectiveFrom: new Date().toISOString().split("T")[0],
    note: ""
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const toggleDay = (d) =>
    setForm((f) => ({
      ...f,
      workingDays: f.workingDays.includes(d)
        ? f.workingDays.filter((x) => x !== d)
        : [...f.workingDays, d].sort()
    }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await api.put("/admin/performance-settings", {
        dailyAppointmentTarget: Number(form.dailyAppointmentTarget),
        monthlySalesTarget: Number(form.monthlySalesTarget),
        bonusRate: Number(form.bonusRate) / 100,
        saleValuePerLead: Number(form.saleValuePerLead),
        workingDays: form.workingDays,
        effectiveFrom: form.effectiveFrom,
        note: form.note
      });
      onSaved();
      onClose();
    } catch (e2) {
      setErr(e2.response?.data?.message || "Failed to update performance settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card-compact" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="badge badge-blue">TARGET CONFIGURATION</span>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Performance &amp; Incentive Settings</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body modal-body-compact" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {err && (
              <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "12.5px" }}>
                {err}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="form-group">
                <label className="form-label">Daily Appointment Target</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="form-control"
                  value={form.dailyAppointmentTarget}
                  onChange={(e) => setForm({ ...form, dailyAppointmentTarget: e.target.value })}
                  required
                />
                <span className="form-hint">Appointments required per employee per working day</span>
              </div>

              <div className="form-group">
                <label className="form-label">Monthly Sales Target (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  className="form-control"
                  value={form.monthlySalesTarget}
                  onChange={(e) => setForm({ ...form, monthlySalesTarget: e.target.value })}
                  required
                />
                <span className="form-hint">Standard monthly sales benchmark</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="form-group">
                <label className="form-label">Bonus Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.05"
                  className="form-control"
                  value={form.bonusRate}
                  onChange={(e) => setForm({ ...form, bonusRate: e.target.value })}
                  required
                />
                <span className="form-hint">Applied to sales surplus above monthly target</span>
              </div>

              <div className="form-group">
                <label className="form-label">Sale Value per Verified Lead (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className="form-control"
                  value={form.saleValuePerLead}
                  onChange={(e) => setForm({ ...form, saleValuePerLead: e.target.value })}
                  required
                />
                <span className="form-hint">Attributed value counted for verified leads</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Working Days</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                {DAY_NAMES.map((name, d) => (
                  <button
                    key={d}
                    type="button"
                    className={`day-pill-toggle ${form.workingDays.includes(d) ? "active" : ""}`}
                    onClick={() => toggleDay(d)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <span className="form-hint">Selected days are counted towards monthly expected targets</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="form-group">
                <label className="form-label">Effective From</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.effectiveFrom}
                  onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                  required
                />
                <span className="form-hint">Date when this configuration takes effect</span>
              </div>

              <div className="form-group">
                <label className="form-label">Change Note (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Reason for revision..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Employee Detail Slide-Over Drawer (Clean Website Style) ──────────────────
function EmployeeDrawer({ empId, month, year, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/performance-employee-detail/${empId}?month=${month}&year=${year}`)
      .then((r) => setData(r.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [empId, month, year]);

  const m = data?.monthly;
  const t = data?.today;

  return (
    <div className="perf-drawer-backdrop" onClick={onClose}>
      <div className="perf-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="perf-drawer-header">
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)" }}>
              {data?.employee?.name || "Employee Detail"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              {MONTHS[month]} {year} Performance Log
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {data?.rank && (
              <span className={`rank-badge ${data.rank === 1 ? "rank-gold" : data.rank === 2 ? "rank-silver" : data.rank === 3 ? "rank-bronze" : "rank-default"}`}>
                #{data.rank}
              </span>
            )}
            <button type="button" className="modal-close-btn" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="perf-drawer-body">
          {loading && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              Loading employee record...
            </div>
          )}

          {!loading && !data && (
            <div style={{ textAlign: "center", padding: "40px", color: "#ef4444" }}>
              Failed to load employee records.
            </div>
          )}

          {!loading && data && (
            <>
              {/* Score strip */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className="perf-score-chip blue">
                  Score: {pct(m?.performance?.rawScore)}
                </span>
                <span className="perf-score-chip" style={{ background: "#f1f5f9", color: "#334155" }}>
                  Rank Score: {pct(m?.performance?.rankingScore)}
                </span>
                <span className={statusBadge(m?.sales?.status).cls} style={{ marginLeft: "auto" }}>
                  {statusBadge(m?.sales?.status).label}
                </span>
              </div>

              {/* Today's appointments */}
              <div className="perf-drawer-section">
                <div className="perf-drawer-section-title">
                  <span>Today's Appointments</span>
                  <span style={{ color: "#0284c7" }}>{pct(t?.achievementPercent)}</span>
                </div>
                <div className="perf-drawer-kv-grid">
                  <div className="perf-drawer-kv">
                    <span>Target</span>
                    <strong>{t?.target ?? 0} appts</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Completed</span>
                    <strong style={{ color: "#16a34a" }}>{t?.completed ?? 0} appts</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Remaining</span>
                    <strong>{t?.remaining ?? 0} appts</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Achievement</span>
                    <strong>{pct(t?.achievementPercent)}</strong>
                  </div>
                </div>
                <MiniProgressBar score={t?.achievementPercent || 0} />
              </div>

              {/* Monthly appointments */}
              <div className="perf-drawer-section">
                <div className="perf-drawer-section-title">
                  <span>Monthly Appointments</span>
                  <span style={{ color: "#0284c7" }}>{pct(m?.appointments?.achievementPercent)}</span>
                </div>
                <div className="perf-drawer-kv-grid">
                  <div className="perf-drawer-kv">
                    <span>Working Days</span>
                    <strong>{m?.appointments?.workingDays} days</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Expected Appts</span>
                    <strong>{m?.appointments?.expectedAppointments}</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Completed</span>
                    <strong style={{ color: "#16a34a" }}>{m?.appointments?.completed}</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Monthly Appt %</span>
                    <strong>{pct(m?.appointments?.achievementPercent)}</strong>
                  </div>
                </div>
                <MiniProgressBar score={m?.appointments?.achievementPercent || 0} />
              </div>

              {/* Sales & Incentive */}
              <div className="perf-drawer-section">
                <div className="perf-drawer-section-title">
                  <span>Sales &amp; Incentive</span>
                  <span style={{ color: "#10b981" }}>{INR(m?.sales?.bonus)} Bonus</span>
                </div>
                <div className="perf-drawer-kv-grid">
                  <div className="perf-drawer-kv">
                    <span>Verified Leads</span>
                    <strong>{m?.sales?.verifiedLeadCount}</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Value per Lead</span>
                    <strong>{INR(m?.sales?.saleValuePerLead)}</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Monthly Sales</span>
                    <strong style={{ color: "#0284c7" }}>{INR(m?.sales?.monthlySales)}</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Sales Target</span>
                    <strong>{INR(m?.sales?.target)}</strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Surplus / Excess</span>
                    <strong style={{ color: m?.sales?.excessSales > 0 ? "#16a34a" : "var(--text-muted)" }}>
                      {INR(m?.sales?.excessSales)}
                    </strong>
                  </div>
                  <div className="perf-drawer-kv">
                    <span>Calculated Bonus</span>
                    <strong style={{ color: "#10b981" }}>{INR(m?.sales?.bonus)}</strong>
                  </div>
                </div>
                <MiniProgressBar score={m?.sales?.achievementPercent || 0} />
              </div>

              {/* Daily breakdown */}
              {data.dailyHistory?.length > 0 && (
                <div className="perf-drawer-section">
                  <div className="perf-drawer-section-title">
                    <span>Daily History Log</span>
                    <span>{data.dailyHistory.length} Days</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {data.dailyHistory.map((d, i) => {
                      const dt = new Date(d.date);
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            background: "#ffffff",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            fontSize: "12px"
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "var(--text-heading)" }}>
                            {dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </span>
                          <span style={{ color: "var(--text-muted)" }}>
                            Target: {d.target}
                          </span>
                          <span style={{ fontWeight: 700, color: d.completed >= d.target ? "#16a34a" : "#ef4444" }}>
                            {d.completed}/{d.target} appts ({pct(d.achievementPercent)})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Performance Page ──────────────────────────────────────────────
export default function AdminPerformancePage() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const [activeTab, setActiveTab] = useState("ranking");
  const [summary, setSummary] = useState(null);
  const [bonus, setBonus] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/admin/performance-settings");
      setSettings(res.data?.data);
    } catch {}
  }, []);

  const fetchRankings = useCallback(async () => {
    try {
      const res = await api.get(`/admin/performance-ranking?month=${month}&year=${year}`);
      setSummary(res.data?.data);
    } catch {}
  }, [month, year]);

  const fetchBonus = useCallback(async () => {
    try {
      const res = await api.get(`/admin/bonus-report?month=${month}&year=${year}`);
      setBonus(res.data?.data);
    } catch {}
  }, [month, year]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([fetchRankings(), fetchBonus(), fetchSettings()]);
    setLoading(false);
  }, [fetchRankings, fetchBonus, fetchSettings]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const endpoint =
        activeTab === "ranking"
          ? `/admin/performance-ranking?month=${month}&year=${year}`
          : `/admin/bonus-report?month=${month}&year=${year}`;
      const res = await api.get(endpoint);
      const data = res.data?.data;

      let csv = "";
      if (activeTab === "ranking") {
        const rows = data?.rankings || [];
        csv = [
          "Rank,Employee Name,Email,Working Days,Expected Appts,Completed Appts,Appt Achievement %,Monthly Sales,Sales Target,Sales Achievement %,Performance Score %,Bonus",
          ...rows.map((r) =>
            [
              r.rank,
              `"${r.employee.name}"`,
              `"${r.employee.email}"`,
              r.appointments.workingDays,
              r.appointments.expectedAppointments,
              r.appointments.completed,
              pct(r.appointments.achievementPercent),
              r.sales.monthlySales,
              r.sales.target,
              pct(r.sales.achievementPercent),
              pct(r.performance.rankingScore),
              r.sales.bonus
            ].join(",")
          )
        ].join("\n");
      } else {
        const rows = data?.report || [];
        csv = [
          "Rank,Employee Name,Verified Leads,Sale Value Per Lead,Monthly Sales,Sales Target,Excess Sales,Bonus Rate,Bonus Earned,Status",
          ...rows.map((r) =>
            [
              r.rank,
              `"${r.employee.name}"`,
              r.verifiedLeadCount,
              r.saleValuePerLead,
              r.monthlySales,
              r.salesTarget,
              r.excessSales,
              pct((r.bonusRate || 0) * 100),
              r.bonus,
              `"${r.salesStatus}"`
            ].join(",")
          )
        ].join("\n");
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTab === "ranking" ? "Performance_Ranking" : "Bonus_Report"}_${MONTHS[month]}_${year}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export CSV report.");
    } finally {
      setExporting(false);
    }
  };

  const rankings = summary?.rankings || [];

  return (
    <div className="customers-page">
      {/* ── Modals & Drawers ── */}
      {showSettings && (
        <SettingsModal current={settings} onSaved={fetchAll} onClose={() => setShowSettings(false)} />
      )}
      {selectedEmpId && (
        <EmployeeDrawer empId={selectedEmpId} month={month} year={year} onClose={() => setSelectedEmpId(null)} />
      )}

      {/* ── Page Header (Matching Website Design) ── */}
      <div
        className="customers-page-header page-header-row"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
          width: "100%"
        }}
      >
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "var(--text-heading)" }}>
            Employee Performance
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
            Track monthly appointment goals, employee rankings, sales benchmarks &amp; bonuses
          </p>
        </div>

        <div
          className="page-actions-group"
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
            marginLeft: "auto"
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowSettings(true)}
            title="Configure performance targets"
          >
            <SettingsIcon />
            <span>Settings</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting}
            title="Export CSV report"
          >
            <DownloadIcon />
            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* ── Filter & Benchmark Toolbar (Matching Website Glass Card) ── */}
      <div
        className="glass-card"
        style={{
          padding: "12px 18px",
          marginBottom: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Month:
            </span>
            <select
              className="form-control"
              style={{ height: "34px", padding: "4px 10px", fontSize: "12.5px", width: "auto", minWidth: "130px" }}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Year:
            </span>
            <select
              className="form-control"
              style={{ height: "34px", padding: "4px 10px", fontSize: "12.5px", width: "auto", minWidth: "90px" }}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Active Target Strip */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-muted)" }}>
          <span>
            Daily Target: <strong style={{ color: "var(--text-heading)" }}>{settings?.dailyAppointmentTarget || 5} appts/day</strong>
          </span>
          <span>•</span>
          <span>
            Monthly Target: <strong style={{ color: "var(--text-heading)" }}>{INR(settings?.monthlySalesTarget || 1300000)}</strong>
          </span>
          <span>•</span>
          <span>
            Surplus Bonus: <strong style={{ color: "#16a34a" }}>{((settings?.bonusRate || 0.01) * 100).toFixed(2)}%</strong>
          </span>
        </div>
      </div>

      {/* ── KPI Grid (Matching Website Core System) ── */}
      {summary && (
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "20px" }}>
          {/* Total Employees */}
          <div className="kpi-card">
            <div className="kpi-top">
              <div className="kpi-icon-wrap blue">
                <UsersIcon />
              </div>
              <span className="kpi-pill info">Team</span>
            </div>
            <div className="kpi-label">Total Employees</div>
            <div className="kpi-value">{summary.totalEmployees}</div>
            <div className="kpi-subtext">Active staff members</div>
          </div>

          {/* Meeting Daily Target */}
          <div className="kpi-card">
            <div className="kpi-top">
              <div className="kpi-icon-wrap cyan">
                <CheckCircleIcon />
              </div>
              <span className="kpi-pill positive">Daily Goal</span>
            </div>
            <div className="kpi-label">Meeting Daily Target</div>
            <div className="kpi-value" style={{ color: summary.meetingDailyTarget > 0 ? "#16a34a" : "inherit" }}>
              {summary.meetingDailyTarget}
            </div>
            <div className="kpi-subtext">{summary.belowDailyTarget} below daily target</div>
          </div>

          {/* Above Sales Target */}
          <div className="kpi-card">
            <div className="kpi-top">
              <div className="kpi-icon-wrap purple">
                <TargetIcon />
              </div>
              <span className="kpi-pill purple">Monthly Sales</span>
            </div>
            <div className="kpi-label">Above Sales Target</div>
            <div className="kpi-value" style={{ color: summary.employeesAboveTarget > 0 ? "#7c3aed" : "inherit" }}>
              {summary.employeesAboveTarget}
            </div>
            <div className="kpi-subtext">{summary.employeesBelowTarget} pending target</div>
          </div>

          {/* Total Monthly Sales */}
          <div className="kpi-card">
            <div className="kpi-top">
              <div className="kpi-icon-wrap amber">
                <RupeeIcon />
              </div>
              <span className="kpi-pill warning">Sales</span>
            </div>
            <div className="kpi-label">Total Monthly Sales</div>
            <div className="kpi-value" style={{ fontSize: "20px" }}>
              {INR(summary.totalMonthlySales)}
            </div>
            <div className="kpi-subtext">Target: {INR((summary.monthlySalesTarget || 1300000) * summary.totalEmployees)}</div>
          </div>

          {/* Total Bonus Payable */}
          <div className="kpi-card">
            <div className="kpi-top">
              <div className="kpi-icon-wrap green">
                <CoinsIcon />
              </div>
              <span className="kpi-pill positive">Incentives</span>
            </div>
            <div className="kpi-label">Total Bonus Payable</div>
            <div className="kpi-value" style={{ fontSize: "20px", color: summary.totalBonusLiability > 0 ? "#16a34a" : "inherit" }}>
              {INR(summary.totalBonusLiability)}
            </div>
            <div className="kpi-subtext">Company incentive liability</div>
          </div>
        </div>
      )}

      {/* ── Tab Switcher (Matching Website Button System) ── */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "ranking" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("ranking")}
          style={{ padding: "8px 18px", borderRadius: "8px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <TrophyIcon />
          <span>Performance Ranking</span>
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "bonus" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("bonus")}
          style={{ padding: "8px 18px", borderRadius: "8px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <CoinsIcon />
          <span>Bonus Report</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)", fontSize: "14px" }}>
          Loading performance rankings &amp; statistics...
        </div>
      ) : (
        <>
          {/* ══════════ TAB 1: RANKING VIEW ══════════ */}
          {activeTab === "ranking" && (
            <div className="table-card">
              {/* Horizontal Team Ranking Chart */}
              <div className="perf-chart-card">
                <div className="perf-chart-title">
                  <TrophyIcon />
                  <span>Team Performance Rankings — {MONTHS[month]} {year}</span>
                </div>
                <div className="perf-chart-list">
                  {rankings.length === 0 ? (
                    <div style={{ padding: "16px 0", color: "var(--text-muted)", fontSize: "13px" }}>
                      No employee performance records available for this month.
                    </div>
                  ) : (
                    rankings.map((r) => {
                      const rankCls =
                        r.rank === 1 ? "rank-gold" : r.rank === 2 ? "rank-silver" : r.rank === 3 ? "rank-bronze" : "rank-default";
                      const scoreColor = getBarColor(r.performance.rankingScore);

                      return (
                        <div key={r.employee.id} className="perf-chart-row">
                          <div className="perf-chart-meta">
                            <span className={`rank-badge ${rankCls}`}>#{r.rank}</span>
                            <span className="perf-chart-name">{r.employee.name}</span>
                          </div>
                          <div className="perf-chart-bar-area">
                            <div className="perf-chart-track">
                              <div
                                className="perf-chart-fill"
                                style={{
                                  width: `${Math.min(r.performance.rankingScore, 100)}%`,
                                  background: scoreColor
                                }}
                              />
                            </div>
                            <span className="perf-chart-pct" style={{ color: scoreColor }}>
                              {pct(r.performance.rankingScore)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Table Header */}
              <div className="table-card-header" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--text-heading)" }}>
                    Team Performance Details
                  </h3>
                  <span className="badge badge-blue">{rankings.length} Employees</span>
                </div>
              </div>

              {/* Table */}
              <div className="table-container" style={{ overflowX: "auto" }}>
                <table className="customers-table">
                  <thead>
                    <tr>
                      <th style={{ width: "60px" }}>Rank</th>
                      <th>Employee</th>
                      <th style={{ textAlign: "center" }}>Working Days</th>
                      <th style={{ textAlign: "center" }}>Expected Appts</th>
                      <th style={{ textAlign: "center" }}>Completed</th>
                      <th style={{ minWidth: "120px" }}>Appt %</th>
                      <th style={{ textAlign: "right" }}>Monthly Sales</th>
                      <th style={{ textAlign: "right" }}>Sales Target</th>
                      <th style={{ minWidth: "120px" }}>Sales %</th>
                      <th style={{ textAlign: "center" }}>Score</th>
                      <th style={{ textAlign: "right" }}>Bonus</th>
                      <th style={{ textAlign: "center" }}>Status</th>
                      <th style={{ textAlign: "center", width: "70px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.length === 0 ? (
                      <tr>
                        <td colSpan={13} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                          No performance data recorded for {MONTHS[month]} {year}.
                        </td>
                      </tr>
                    ) : (
                      rankings.map((r) => {
                        const badge = statusBadge(r.sales.status);
                        const rankCls =
                          r.rank === 1 ? "rank-gold" : r.rank === 2 ? "rank-silver" : r.rank === 3 ? "rank-bronze" : "rank-default";

                        return (
                          <tr key={r.employee.id}>
                            <td>
                              <span className={`rank-badge ${rankCls}`}>#{r.rank}</span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: "var(--text-heading)" }}>{r.employee.name}</div>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{r.employee.email}</div>
                            </td>
                            <td style={{ textAlign: "center" }}>{r.appointments.workingDays}</td>
                            <td style={{ textAlign: "center" }}>{r.appointments.expectedAppointments}</td>
                            <td style={{ textAlign: "center" }}>
                              <span style={{ fontWeight: 700, color: "var(--text-heading)" }}>
                                {r.appointments.completed}
                              </span>
                              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                                /{r.appointments.expectedAppointments}
                              </span>
                            </td>
                            <td>
                              <MiniProgressBar score={r.appointments.achievementPercent} />
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text-heading)" }}>
                              {INR(r.sales.monthlySales)}
                            </td>
                            <td style={{ textAlign: "right", color: "var(--text-muted)" }}>
                              {INR(r.sales.target)}
                            </td>
                            <td>
                              <MiniProgressBar score={r.sales.achievementPercent} />
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className="perf-score-chip blue">
                                {pct(r.performance.rankingScore)}
                              </span>
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: r.sales.bonus > 0 ? "#16a34a" : "var(--text-muted)" }}>
                              {INR(r.sales.bonus)}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className={badge.cls}>{badge.label}</span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                type="button"
                                className="btn-action btn-action-view"
                                title="View Employee Daily Detail"
                                onClick={() => setSelectedEmpId(r.employee.id)}
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
            </div>
          )}

          {/* ══════════ TAB 2: BONUS REPORT VIEW ══════════ */}
          {activeTab === "bonus" && (
            <div className="table-card">
              <div className="table-card-header" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--text-heading)" }}>
                    Bonus &amp; Incentive Calculations — {MONTHS[month]} {year}
                  </h3>
                  <span className="badge badge-green">
                    Total Bonus: {INR(bonus?.totalBonusLiability || 0)}
                  </span>
                </div>
              </div>

              <div className="table-container" style={{ overflowX: "auto" }}>
                <table className="customers-table">
                  <thead>
                    <tr>
                      <th style={{ width: "60px" }}>Rank</th>
                      <th>Employee</th>
                      <th style={{ textAlign: "center" }}>Verified Leads</th>
                      <th style={{ textAlign: "right" }}>Value / Lead</th>
                      <th style={{ textAlign: "right" }}>Monthly Sales</th>
                      <th style={{ textAlign: "right" }}>Sales Target</th>
                      <th style={{ textAlign: "right" }}>Excess Sales</th>
                      <th style={{ textAlign: "center" }}>Bonus Rate</th>
                      <th style={{ textAlign: "right" }}>Bonus Earned</th>
                      <th style={{ textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bonus?.report || []).length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                          No bonus calculation data for {MONTHS[month]} {year}.
                        </td>
                      </tr>
                    ) : (
                      (bonus?.report || []).map((r, i) => {
                        const badge = statusBadge(r.salesStatus);
                        const rankCls =
                          r.rank === 1 ? "rank-gold" : r.rank === 2 ? "rank-silver" : r.rank === 3 ? "rank-bronze" : "rank-default";

                        return (
                          <tr key={i}>
                            <td>
                              <span className={`rank-badge ${rankCls}`}>#{r.rank}</span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: "var(--text-heading)" }}>{r.employee.name}</div>
                            </td>
                            <td style={{ textAlign: "center", fontWeight: 600 }}>{r.verifiedLeadCount}</td>
                            <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{INR(r.saleValuePerLead)}</td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text-heading)" }}>
                              {INR(r.monthlySales)}
                            </td>
                            <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{INR(r.salesTarget)}</td>
                            <td style={{ textAlign: "right", fontWeight: 600, color: r.excessSales > 0 ? "#16a34a" : "var(--text-muted)" }}>
                              {INR(r.excessSales)}
                            </td>
                            <td style={{ textAlign: "center", fontWeight: 600 }}>
                              {((r.bonusRate || 0) * 100).toFixed(2)}%
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: r.bonus > 0 ? "#16a34a" : "var(--text-muted)" }}>
                              {INR(r.bonus)}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className={badge.cls}>{badge.label}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
