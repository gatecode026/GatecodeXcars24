"use client";

import React, { useState } from "react";
import { api } from "../../api/client";
import { formatINR, formatPct } from "./dashboardUtils";

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PerformanceSettingsModal({
  current,
  history = [],
  onSaved,
  onClose
}) {
  const [form, setForm] = useState({
    dailyAppointmentTarget: current?.dailyAppointmentTarget ?? 5,
    monthlySalesTarget: current?.monthlySalesTarget ?? 1300000,
    bonusRate: current?.bonusRate != null ? (current.bonusRate * 100).toFixed(2) : "1.00",
    saleValuePerLead: current?.saleValuePerLead ?? 65000,
    salesMetricSource: current?.salesMetricSource ?? "appointments",
    bonusType: current?.bonusType ?? "percentage",
    workingDays: current?.workingDays ?? [1, 2, 3, 4, 5, 6],
    effectiveFrom: new Date().toISOString().split("T")[0],
    note: ""
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeTab, setActiveTab] = useState("current"); // "current" | "history"

  const toggleDay = (d) =>
    setForm((f) => ({
      ...f,
      workingDays: f.workingDays.includes(d)
        ? f.workingDays.filter((x) => x !== d)
        : [...f.workingDays, d].sort()
    }));

  const validate = () => {
    const errs = {};
    if (!form.dailyAppointmentTarget || Number(form.dailyAppointmentTarget) <= 0) {
      errs.dailyAppointmentTarget = "Please enter a valid daily target (min 1)";
    }
    if (form.monthlySalesTarget === "" || Number(form.monthlySalesTarget) < 0) {
      errs.monthlySalesTarget = "Please enter a valid monthly sales target";
    }
    if (form.bonusRate === "" || Number(form.bonusRate) < 0) {
      errs.bonusRate = "Please enter a valid bonus rate";
    }
    if (form.saleValuePerLead === "" || Number(form.saleValuePerLead) < 0) {
      errs.saleValuePerLead = "Please enter a valid sale value per lead";
    }
    if (!form.effectiveFrom) {
      errs.effectiveFrom = "Effective date is required";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePreSave = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setShowConfirmModal(true);
  };

  const handleExecuteSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      await api.put("/admin/performance-settings", {
        dailyAppointmentTarget: Number(form.dailyAppointmentTarget),
        monthlySalesTarget: Number(form.monthlySalesTarget),
        bonusRate: Number(form.bonusRate) / 100,
        saleValuePerLead: Number(form.saleValuePerLead),
        salesMetricSource: form.salesMetricSource,
        bonusType: form.bonusType,
        workingDays: form.workingDays,
        effectiveFrom: form.effectiveFrom,
        note: form.note
      });
      setShowConfirmModal(false);
      onSaved && onSaved();
      onClose();
    } catch (e2) {
      const msg = e2.response?.data?.message || "Failed to update performance settings.";
      setErr(msg);
      setShowConfirmModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal-card"
          style={{ maxWidth: "660px", width: "95vw" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="badge badge-blue">TARGET CONFIGURATION</span>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                Performance Rules &amp; Targets
              </h3>
            </div>
            <button type="button" className="modal-close-btn" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "0 20px" }}>
            <button
              type="button"
              style={{
                padding: "10px 16px",
                border: "none",
                background: "none",
                borderBottom: activeTab === "current" ? "2px solid #0284c7" : "2px solid transparent",
                color: activeTab === "current" ? "#0284c7" : "#64748b",
                fontWeight: activeTab === "current" ? 700 : 500,
                cursor: "pointer",
                fontSize: "13px"
              }}
              onClick={() => setActiveTab("current")}
            >
              Current Configuration
            </button>
            <button
              type="button"
              style={{
                padding: "10px 16px",
                border: "none",
                background: "none",
                borderBottom: activeTab === "history" ? "2px solid #0284c7" : "2px solid transparent",
                color: activeTab === "history" ? "#0284c7" : "#64748b",
                fontWeight: activeTab === "history" ? 700 : 500,
                cursor: "pointer",
                fontSize: "13px"
              }}
              onClick={() => setActiveTab("history")}
            >
              Historical Versions ({history.length})
            </button>
          </div>

          {/* Body */}
          {activeTab === "current" ? (
            <form onSubmit={handlePreSave} noValidate>
              <div className="modal-body modal-body-compact" style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "20px" }}>
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
                      className={`form-control ${fieldErrors.dailyAppointmentTarget ? "is-invalid" : ""}`}
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
                      className={`form-control ${fieldErrors.monthlySalesTarget ? "is-invalid" : ""}`}
                      value={form.monthlySalesTarget}
                      onChange={(e) => setForm({ ...form, monthlySalesTarget: e.target.value })}
                      required
                    />
                    <span className="form-hint">Individual sales baseline quota</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label className="form-label">Bonus Rate (%) on Surplus</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="100"
                      className={`form-control ${fieldErrors.bonusRate ? "is-invalid" : ""}`}
                      value={form.bonusRate}
                      onChange={(e) => setForm({ ...form, bonusRate: e.target.value })}
                      required
                    />
                    <span className="form-hint">Calculated strictly on excess above monthly target</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Default Lead Valuation (₹) (Optional Fallback)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      className={`form-control ${fieldErrors.saleValuePerLead ? "is-invalid" : ""}`}
                      value={form.saleValuePerLead}
                      onChange={(e) => setForm({ ...form, saleValuePerLead: e.target.value })}
                    />
                    <span className="form-hint">Sales agents enter manual deal amount per lead; this is only a legacy fallback</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label className="form-label">Sales Metric Source</label>
                    <select
                      className="form-control"
                      value={form.salesMetricSource}
                      onChange={(e) => setForm({ ...form, salesMetricSource: e.target.value })}
                    >
                      <option value="appointments">Verified Appointments × Lead Value</option>
                      <option value="orders">Direct Vehicle Orders (Order Total)</option>
                      <option value="combined">Combined (Appointments + Orders)</option>
                    </select>
                    <span className="form-hint">Primary data stream for sales volume</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Incentive Calculation Model</label>
                    <select
                      className="form-control"
                      value={form.bonusType}
                      onChange={(e) => setForm({ ...form, bonusType: e.target.value })}
                    >
                      <option value="percentage">Flat Percentage on Excess Sales</option>
                      <option value="slab">Progressive Tiered Slabs (0-2L: 1%, 2L-5L: 1.5%, 5L+: 2%)</option>
                    </select>
                    <span className="form-hint">Surplus tier logic</span>
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
                  <span className="form-hint">Days counted towards monthly expected targets</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label className="form-label">Effective From</label>
                    <input
                      type="date"
                      className={`form-control ${fieldErrors.effectiveFrom ? "is-invalid" : ""}`}
                      value={form.effectiveFrom}
                      onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                      required
                    />
                    <span className="form-hint">Date when this revision becomes active</span>
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

              <div className="modal-footer" style={{ padding: "14px 20px" }}>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  Review &amp; Apply Changes
                </button>
              </div>
            </form>
          ) : (
            /* Historical Versions View (Section 18) */
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "450px", overflowY: "auto" }}>
              {history.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
                  No historical configurations recorded. Current version is initial baseline.
                </div>
              ) : (
                history.map((h, idx) => (
                  <div
                    key={h._id || idx}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      background: h.effectiveTo ? "#ffffff" : "rgba(2, 132, 199, 0.04)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-heading, #0f172a)" }}>
                        {h.effectiveTo ? "Archived Configuration" : "Currently Active Target"}
                      </span>
                      <span className={`badge ${h.effectiveTo ? "badge-secondary" : "badge-blue"}`} style={{ fontSize: "11px" }}>
                        {new Date(h.effectiveFrom).toLocaleDateString("en-IN")} — {h.effectiveTo ? new Date(h.effectiveTo).toLocaleDateString("en-IN") : "Present"}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", fontSize: "12px" }}>
                      <div>Daily Target: <strong>{h.dailyAppointmentTarget} appts</strong></div>
                      <div>Monthly Sales: <strong>{formatINR(h.monthlySalesTarget)}</strong></div>
                      <div>Bonus Rate: <strong>{((h.bonusRate || 0.01) * 100).toFixed(2)}%</strong></div>
                    </div>
                    {h.note && (
                      <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", marginTop: "6px" }}>
                        Note: {h.note}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 17: Confirmation Diff Modal ("Update Performance Rules?") ── */}
      {showConfirmModal && (
        <div className="modal-backdrop" style={{ zIndex: 1200 }}>
          <div className="modal-card" style={{ maxWidth: "500px", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px", color: "var(--text-heading, #0f172a)" }}>
              Update Performance Rules?
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
              Please review the revised configuration. Previous targets will be closed with historical versioning maintained.
            </p>

            {/* Comparison Table */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "12.5px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", fontWeight: 700, paddingBottom: "6px", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                <span>Rule</span>
                <span>Current</span>
                <span>New Value</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", padding: "6px 0", borderBottom: "1px dashed #e2e8f0" }}>
                <span>Daily Target</span>
                <span>{current?.dailyAppointmentTarget || 5}</span>
                <strong style={{ color: "#0284c7" }}>{form.dailyAppointmentTarget}</strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", padding: "6px 0", borderBottom: "1px dashed #e2e8f0" }}>
                <span>Monthly Quota</span>
                <span>{formatINR(current?.monthlySalesTarget || 1300000)}</span>
                <strong style={{ color: "#0284c7" }}>{formatINR(form.monthlySalesTarget)}</strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", padding: "6px 0", borderBottom: "1px dashed #e2e8f0" }}>
                <span>Bonus Rate</span>
                <span>{((current?.bonusRate || 0.01) * 100).toFixed(2)}%</span>
                <strong style={{ color: "#16a34a" }}>{Number(form.bonusRate).toFixed(2)}%</strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", padding: "6px 0" }}>
                <span>Lead Valuation</span>
                <span>{formatINR(current?.saleValuePerLead || 65000)}</span>
                <strong style={{ color: "#0284c7" }}>{formatINR(form.saleValuePerLead)}</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
              >
                Back to Edit
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExecuteSave}
                disabled={saving}
              >
                {saving ? "Updating..." : "Confirm & Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
