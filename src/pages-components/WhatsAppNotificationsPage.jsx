"use client";
import { useState, useEffect } from "react";
import { api } from "../api/client";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const WhatsAppNotificationsPage = () => {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [customPhone, setCustomPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("appointment");
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    api.get("/customers")
      .then((res) => {
        setLeads(res.data?.data || []);
      })
      .catch((err) => console.error("Error loading leads:", err));
  }, []);

  const templates = {
    appointment: `Hello {NAME},\n\nYour vehicle inspection appointment with GatecodeXcars24 has been scheduled successfully!\n\nAppointment ID: {AP_ID}\nCar Registration: {CAR}\nDate & Time: {DATE}\n\nOur certified evaluator will contact you 30 minutes prior. Please keep your RC and insurance copy handy.`,
    followup: `Hello {NAME},\n\nThank you for reaching out to GatecodeXcars24 regarding your car ({CAR}).\n\nWe have great offers and instant price evaluation ready for your vehicle. Would you like to schedule an inspection today?`,
    verified: `Congratulations {NAME}!\n\nYour vehicle inspection for {CAR} is verified and passed. Our team is ready with the instant payment guarantee.\n\nReference: {AP_ID}`
  };

  const handleSelectLead = (leadId) => {
    const lead = leads.find((l) => l._id === leadId);
    if (!lead) return;
    setSelectedLead(lead);
    setCustomPhone(lead.mobile || "");
    setCustomerName(lead.customerName || "");
    generateMessage(selectedTemplate, lead);
  };

  const generateMessage = (tmplKey, lead) => {
    const raw = templates[tmplKey] || "";
    const name = lead ? lead.customerName : customerName || "Customer";
    const car = lead ? lead.carNumber || "Car" : "Vehicle";
    const apId = lead ? lead.appointmentId || "AP-NEW" : "AP-NEW";
    const dateStr = lead?.appointmentDate ? new Date(lead.appointmentDate).toLocaleString("en-IN") : "Today";

    const msg = raw
      .replace(/{NAME}/g, name)
      .replace(/{CAR}/g, car)
      .replace(/{AP_ID}/g, apId)
      .replace(/{DATE}/g, dateStr);

    setMessageText(msg);
  };

  const handleTemplateChange = (tmplKey) => {
    setSelectedTemplate(tmplKey);
    generateMessage(tmplKey, selectedLead);
  };

  const handleSendWhatsApp = () => {
    const phone = customPhone.replace(/\D/g, "");
    if (!phone) {
      alert("Please enter a valid phone number");
      return;
    }
    const cleanPhone = phone.startsWith("91") ? phone : `91${phone}`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="content-area">
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>WhatsApp Communication Hub</h1>
          <p>Send instant appointment alerts, inspection reports and follow-up templates to customers</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.4fr", gap: "24px" }}>
        {/* Recipient & Template Config */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-box">
              <h3>Recipient &amp; Message Setup</h3>
              <p>Select an existing customer or enter details manually</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Select from Active Leads</label>
              <select
                className="form-control"
                onChange={(e) => handleSelectLead(e.target.value)}
                defaultValue=""
              >
                <option value="">-- Choose Customer Lead --</option>
                {leads.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.appointmentId} • {l.customerName} ({l.carNumber || l.mobile})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ramesh Patel"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    generateMessage(selectedTemplate, { ...selectedLead, customerName: e.target.value });
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp Mobile Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 9876543210"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Pre-Approved Template</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { key: "appointment", label: "Appointment Booking" },
                  { key: "followup", label: "Lead Follow-up" },
                  { key: "verified", label: "Inspection Verified" }
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`btn btn-sm ${selectedTemplate === t.key ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => handleTemplateChange(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Message Preview & Action */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-box">
              <h3>WhatsApp Message Preview</h3>
              <p>Live preview formatted for WhatsApp Web / App</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <textarea
              className="form-control"
              style={{ minHeight: "220px", fontFamily: "inherit", fontSize: "13.5px", lineHeight: "1.6" }}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Recipient: <strong>{customPhone || "No number specified"}</strong>
              </span>

              <button
                className="btn btn-primary"
                onClick={handleSendWhatsApp}
                style={{ padding: "10px 20px" }}
              >
                <WhatsAppIcon />
                Open in WhatsApp Web
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppNotificationsPage;
