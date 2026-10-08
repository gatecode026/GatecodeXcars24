"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { api } from "../api/client";
import {
  Search,
  Phone,
  Car,
  User,
  ChevronDown,
  X,
  Check,
  Send,
  Calendar,
  ShieldCheck,
  MessageSquare
} from "lucide-react";

const WhatsAppNotificationsPage = () => {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [customPhone, setCustomPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("appointment");
  const [messageText, setMessageText] = useState("");

  // Searchable combobox states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    api.get("/customers")
      .then((res) => {
        setLeads(res.data?.data || []);
      })
      .catch((err) => console.error("Error loading leads:", err));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [dropdownOpen]);

  const templates = {
    appointment: `Hello {NAME},\n\nYour vehicle inspection appointment with GatecodeXcars24 has been scheduled successfully!\n\nAppointment ID: {AP_ID}\nCar Registration: {CAR}\nDate & Time: {DATE}\n\nOur certified evaluator will contact you 30 minutes prior. Please keep your RC and insurance copy handy.`,
    followup: `Hello {NAME},\n\nThank you for reaching out to GatecodeXcars24 regarding your car ({CAR}).\n\nWe have great offers and instant price evaluation ready for your vehicle. Would you like to schedule an inspection today?`,
    verified: `Congratulations {NAME}!\n\nYour vehicle inspection for {CAR} is verified and passed. Our team is ready with the instant payment guarantee.\n\nReference: {AP_ID}`
  };

  const generateMessage = (tmplKey, lead) => {
    const raw = templates[tmplKey] || "";
    const name = lead ? lead.customerName : customerName || "Customer";
    const car = lead ? lead.carNumber || "Car" : "Vehicle";
    const apId = lead ? (lead.appointmentId ? `AP-${lead.appointmentId}` : "AP-NEW") : "AP-NEW";
    const dateStr = lead?.appointmentDate ? new Date(lead.appointmentDate).toLocaleString("en-IN") : "Today";

    const msg = raw
      .replace(/{NAME}/g, name)
      .replace(/{CAR}/g, car)
      .replace(/{AP_ID}/g, apId)
      .replace(/{DATE}/g, dateStr);

    setMessageText(msg);
  };

  const handleSelectLead = (lead) => {
    if (!lead) {
      setSelectedLead(null);
      setCustomPhone("");
      setCustomerName("");
      setMessageText("");
      setDropdownOpen(false);
      return;
    }
    setSelectedLead(lead);
    setCustomPhone(lead.mobile || "");
    setCustomerName(lead.customerName || "");
    generateMessage(selectedTemplate, lead);
    setDropdownOpen(false);
    setSearchTerm("");
  };

  const handleClearLead = (e) => {
    e.stopPropagation();
    handleSelectLead(null);
  };

  const handleTemplateChange = (tmplKey) => {
    setSelectedTemplate(tmplKey);
    generateMessage(tmplKey, selectedLead);
  };

  const handleSendWhatsApp = () => {
    const phone = customPhone.replace(/\D/g, "");
    if (!phone) {
      alert("Please select a customer lead with a valid mobile number.");
      return;
    }
    const cleanPhone = phone.startsWith("91") ? phone : `91${phone}`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank");
  };

  // Filter leads by Lead/Appointment ID, Customer Name, Mobile Number, or Car Number
  const filteredLeads = useMemo(() => {
    if (!searchTerm.trim()) return leads;
    const q = searchTerm.toLowerCase().trim();
    const digitsOnly = q.replace(/\D/g, "");

    return leads.filter((l) => {
      const apt = String(l.appointmentId || "").toLowerCase();
      const name = String(l.customerName || "").toLowerCase();
      const mobile = String(l.mobile || "").replace(/\D/g, "");
      const car = String(l.carNumber || "").toLowerCase();

      return (
        apt.includes(q) ||
        `ap-${apt}`.includes(q) ||
        name.includes(q) ||
        (digitsOnly.length > 0 && mobile.includes(digitsOnly)) ||
        car.includes(q)
      );
    });
  }, [leads, searchTerm]);

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
              <p>Search &amp; select an active lead to auto-populate verified customer details</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Searchable Combobox for Active Leads */}
            <div className="form-group" ref={dropdownRef} style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label className="form-label" style={{ marginBottom: 0, fontWeight: 600 }}>
                  Select from Active Leads
                </label>
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: 500 }}>
                  Search by Lead ID, Name, or Mobile
                </span>
              </div>

              {/* Selector Box */}
              <div
                className="form-control"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  minHeight: "44px",
                  borderColor: dropdownOpen ? "var(--primary, #2563eb)" : "var(--border, #e2e8f0)",
                  boxShadow: dropdownOpen ? "0 0 0 3px rgba(37, 99, 235, 0.12)" : "none",
                  backgroundColor: "var(--bg-card, #fff)",
                  padding: "0 12px",
                  userSelect: "none"
                }}
              >
                {selectedLead ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                    <span
                      style={{
                        padding: "2px 7px",
                        borderRadius: "5px",
                        fontSize: "12px",
                        fontWeight: 700,
                        backgroundColor: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                        whiteSpace: "nowrap"
                      }}
                    >
                      AP-{selectedLead.appointmentId}
                    </span>
                    <span style={{ fontWeight: 600, color: "var(--text-heading)", whiteSpace: "nowrap" }}>
                      {selectedLead.customerName}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      <Phone size={12} style={{ color: "#64748b" }} /> {selectedLead.mobile}
                    </span>
                    {selectedLead.carNumber && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        <Car size={12} style={{ color: "#64748b" }} /> {selectedLead.carNumber}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "13.5px" }}>
                    <Search size={15} style={{ color: "#94a3b8" }} />
                    <span>Search &amp; choose customer lead...</span>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
                  {selectedLead && (
                    <button
                      type="button"
                      onClick={handleClearLead}
                      title="Clear selected customer"
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                  <ChevronDown
                    size={15}
                    style={{
                      color: "var(--text-muted)",
                      transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s"
                    }}
                  />
                </div>
              </div>

              {/* Floating Dropdown Panel */}
              {dropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    backgroundColor: "var(--bg-card, #ffffff)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                    overflow: "hidden"
                  }}
                >
                  {/* Search Input Bar */}
                  <div
                    style={{
                      padding: "8px 10px",
                      borderBottom: "1px solid var(--border)",
                      backgroundColor: "var(--bg-subtle, #f8fafc)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <Search size={15} style={{ color: "#94a3b8", flexShrink: 0 }} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="form-control"
                      placeholder="Type lead ID, name, or phone number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: "6px 10px",
                        fontSize: "13px",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        width: "100%",
                        backgroundColor: "#fff"
                      }}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchTerm("");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          display: "flex",
                          padding: "2px"
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Filtered Leads List */}
                  <div
                    style={{
                      maxHeight: "260px",
                      overflowY: "auto",
                      padding: "4px 0"
                    }}
                  >
                    {filteredLeads.length === 0 ? (
                      <div
                        style={{
                          padding: "20px 16px",
                          textAlign: "center",
                          color: "var(--text-muted)",
                          fontSize: "13px"
                        }}
                      >
                        No leads found matching &quot;{searchTerm}&quot;
                      </div>
                    ) : (
                      filteredLeads.map((l) => {
                        const isSelected = selectedLead?._id === l._id;
                        return (
                          <div
                            key={l._id}
                            onClick={() => handleSelectLead(l)}
                            style={{
                              padding: "10px 14px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              backgroundColor: isSelected ? "#eff6ff" : "transparent",
                              borderBottom: "1px solid var(--border-subtle, #f1f5f9)",
                              transition: "background-color 0.15s"
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = "var(--bg-subtle, #f8fafc)";
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span
                                  style={{
                                    fontSize: "11.5px",
                                    fontWeight: 700,
                                    color: "#1d4ed8",
                                    backgroundColor: "#dbeafe",
                                    padding: "1px 6px",
                                    borderRadius: "4px"
                                  }}
                                >
                                  AP-{l.appointmentId}
                                </span>
                                <span style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--text-heading)" }}>
                                  {l.customerName}
                                </span>
                              </div>
                              <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "12px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <Phone size={12} style={{ color: "#94a3b8" }} /> {l.mobile}
                                </span>
                                {l.carNumber && (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <Car size={12} style={{ color: "#94a3b8" }} /> {l.carNumber}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isSelected && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#2563eb", fontSize: "12px", fontWeight: 700 }}>
                                <Check size={14} /> Selected
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Details (Auto-populated from selected lead) */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Customer Name
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                    <User size={15} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={selectedLead ? "" : "Select a lead above"}
                    value={customerName}
                    readOnly
                    style={{
                      paddingLeft: "36px",
                      backgroundColor: "var(--bg-subtle, #f8fafc)",
                      cursor: "not-allowed",
                      color: selectedLead ? "var(--text-heading)" : "var(--text-muted)",
                      fontWeight: 600,
                      borderColor: "var(--border, #e2e8f0)"
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  WhatsApp Mobile Number
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                    <Phone size={15} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={selectedLead ? "" : "Select a lead above"}
                    value={customPhone}
                    readOnly
                    style={{
                      paddingLeft: "36px",
                      backgroundColor: "var(--bg-subtle, #f8fafc)",
                      cursor: "not-allowed",
                      color: selectedLead ? "var(--text-heading)" : "var(--text-muted)",
                      fontWeight: 600,
                      borderColor: "var(--border, #e2e8f0)"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Pre-Approved Template</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { key: "appointment", label: "Appointment Booking", icon: Calendar },
                  { key: "followup", label: "Lead Follow-up", icon: Phone },
                  { key: "verified", label: "Inspection Verified", icon: ShieldCheck }
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = selectedTemplate === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      className={`btn btn-sm ${isActive ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => handleTemplateChange(t.key)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <Icon size={14} />
                      {t.label}
                    </button>
                  );
                })}
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
                Recipient: <strong>{customPhone || "No customer selected"}</strong>
              </span>

              <button
                className="btn btn-primary"
                onClick={handleSendWhatsApp}
                style={{ padding: "10px 20px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                disabled={!customPhone}
              >
                <Send size={15} />
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
