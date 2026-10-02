"use client";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api, emitDataSync, onDataSync } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import CsvImportModal from "../components/CsvImportModal";
import CustomDateTimePicker from "../components/CustomDateTimePicker";
import ConfirmModal from "../components/ConfirmModal";

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const FileSpreadsheetIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M8 13h8" />
    <path d="M8 17h8" />
    <path d="M12 9v12" />
  </svg>
);

const FilePdfIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="15" y2="17" />
  </svg>
);

const FilterIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

// --- Premium Header Icons ---
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const EventIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <circle cx="12" cy="15" r="1.5" />
  </svg>
);

const CarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

const GaugeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M2 12h2" />
    <path d="M16.24 7.76l-2.12 2.12" />
    <path d="M20 16a8 8 0 1 0-16 0" />
    <circle cx="12" cy="16" r="2" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const UserCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
);

const HeadsetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const ActionWrenchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Format helper
const formatDateTime = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatDateOnly = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

const downloadLeadsPDF = (records) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("GatecodeXcars24 — Automotive Leads & Appointment Register", pageWidth / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")} | Total Records: ${records.length}`, pageWidth / 2, y, { align: "center" });
  y += 9;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [[
      "Appointment ID",
      "Lead Date",
      "Appointment Date",
      "Car Number",
      "Oddo Meter/KM",
      "CX Name",
      "Cx Mobile No.",
      "Lead By",
      "Follow Up Done By",
      "Date of Follow-up",
      "VERIFIED",
      "Timestamp"
    ]],
    body: records.map((c) => [
      c.appointmentId || "-",
      c.leadDate ? formatDateOnly(c.leadDate) : "-",
      c.appointmentDate ? formatDateTime(c.appointmentDate) : "-",
      c.carNumber || "-",
      c.odometerKm ? `${Number(c.odometerKm).toLocaleString("en-IN")} KM` : "0 KM",
      c.customerName || "-",
      c.mobile || "-",
      c.leadBy || c.employeeName || "-",
      c.followUpBy || "-",
      c.followUpDate ? formatDateOnly(c.followUpDate) : "-",
      c.verificationStatus || (c.verified ? "Verified" : "Pending"),
      c.createdAt ? formatDateTime(c.createdAt) : "-"
    ]),
    headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5 },
    styles: { cellPadding: 2 }
  });

  doc.save(`GatecodeXcars24_Appointments_${new Date().toISOString().split("T")[0]}.pdf`);
};

// Smart Auto-Formatter for Car Registration & Model
// Automatically formats inputs like "RJ14ZH6476ACTIVA" -> "RJ-14-ZH-6476 / Activa"
// or "dl01ab1234 honda city" -> "DL-01-AB-1234 / Honda City"
export const formatCarRegAndModel = (input, isBlur = false) => {
  if (!input) return "";
  let str = String(input).trim();
  if (!str) return "";

  let regPart = "";
  let modelPart = "";

  // 1. Explicit slash separating reg and model
  if (str.includes("/")) {
    const parts = str.split("/");
    regPart = parts[0].trim();
    modelPart = parts.slice(1).join("/").trim();
  } else {
    // 2. Check BH series: e.g. 22BH1234AA followed optionally by model (e.g. 22BH1234AA THAR)
    const bhMatch = str.match(/^([0-9]{2}[\s\-]?[A-Za-z]{2}[\s\-]?[0-9]{1,4}[\s\-]?[A-Za-z]{1,2})(.*)$/);
    if (bhMatch) {
      regPart = bhMatch[1];
      modelPart = bhMatch[2] || "";
    } else {
      // 3. Standard Indian plate: State (2) + RTO (1-2) + Series (0-3) + Number (1-4)
      // Followed by ANY remaining characters (which is the car model, e.g. ACTIVA, SWIFT)
      const stdMatch = str.match(/^([A-Za-z]{2}[\s\-]?[0-9]{1,2}[\s\-]?[A-Za-z]{0,3}[\s\-]?[0-9]{1,4})(.*)$/);
      if (stdMatch) {
        regPart = stdMatch[1];
        modelPart = stdMatch[2] || "";
      } else {
        regPart = str;
      }
    }
  }

  // Format Registration Number
  const cleanReg = regPart.toUpperCase().replace(/[^A-Z0-9]/g, "");
  let formattedReg = "";

  const bhClean = cleanReg.match(/^([0-9]{2})([A-Z]{2})([0-9]{1,4})([A-Z]{1,2})?$/);
  if (bhClean) {
    formattedReg = [bhClean[1], bhClean[2], bhClean[3], bhClean[4]].filter(Boolean).join("-");
  } else {
    const stdClean = cleanReg.match(/^([A-Z]{2})([0-9]{1,2})?([A-Z]{1,3})?([0-9]{1,4})?/);
    if (stdClean && stdClean[1]) {
      const p1 = stdClean[1];
      let p2 = stdClean[2] || "";
      if (isBlur && p2.length === 1) p2 = `0${p2}`;
      const p3 = stdClean[3] || "";
      const p4 = stdClean[4] || "";
      formattedReg = [p1, p2, p3, p4].filter(Boolean).join("-");
    } else {
      formattedReg = cleanReg;
    }
  }

  // Format Model Part (Title Case)
  let formattedModel = "";
  if (modelPart) {
    const cleanModel = modelPart.replace(/^[\s\/\-_]+/, "").trim();
    if (cleanModel) {
      formattedModel = cleanModel
        .replace(/\s+/g, " ")
        .toLowerCase()
        .replace(/\b([a-z])/g, (c) => c.toUpperCase());
    }
  }

  if (formattedReg && formattedModel) {
    return `${formattedReg} / ${formattedModel}`;
  }
  if (formattedReg && (str.includes("/") || (formattedReg.length >= 10 && !formattedModel && str.endsWith(" ")))) {
    return `${formattedReg} / `;
  }
  return formattedReg || str;
};

// Smart Auto-Formatter for Appointment ID (e.g. "12345" -> "AP-12345")
export const formatAptId = (val) => {
  if (!val) return "-";
  let s = String(val).trim().toUpperCase();
  if (!s || s === "-") return "-";
  if (!s.startsWith("AP-")) {
    s = `AP-${s.replace(/^AP-?/, "")}`;
  }
  return s;
};

// Smart Auto-Formatter for Customer Name (Title Case)
export const formatCustomerName = (val) => {
  if (!val) return "-";
  return String(val)
    .trim()
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase());
};

const CustomersPage = ({ defaultTab = "all" }) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const tableContainerRef = useRef(null);

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [toast, setToast] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmLead, setDeleteConfirmLead] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    appointmentId: "",
    customerName: "",
    mobile: "",
    email: "",
    carNumber: "",
    odometerKm: "",
    appointmentDate: "",
    leadDate: new Date().toISOString().split("T")[0],
    verificationStatus: "Pending",
    followUp: "Follow-up",
    leadBy: user?.name || "",
    followUpBy: "",
    followUpDate: "",
    district: "",
    state: "",
    remark: ""
  });
  const [formErrors, setFormErrors] = useState({});

  // Server-side filter state
  const [dateType, setDateType] = useState("createdAt");
  const [period, setPeriod] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [leadByFilter, setLeadByFilter] = useState("");
  // Debounced search
  const [searchDebounced, setSearchDebounced] = useState(initialSearch);
  const searchTimerRef = useRef(null);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;
  // Export loading
  const [exporting, setExporting] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const handleImportCustomers = async (rows) => {
    const res = await api.post("/customers/bulk-import", { rows });
    setToast({ message: res.data?.message || `Imported ${rows.length} leads successfully!`, type: "success" });
    emitDataSync({ type: "customer", action: "bulk" });
    fetchLeads({ silent: false });
  };

  const slideTable = (direction) => {
    if (tableContainerRef.current) {
      const scrollAmt = direction === "left" ? -400 : 400;
      tableContainerRef.current.scrollBy({ left: scrollAmt, behavior: "smooth" });
    }
  };

  const [employeesList, setEmployeesList] = useState([]);

  const fetchLeads = useCallback(async (options = {}) => {
    const isSilent = options?.silent === true;
    if (!isSilent) setLoading(true);
    try {
      const params = {};
      if (dateType !== "createdAt") params.dateType = dateType;
      if (period !== "all") {
        params.period = period;
        if (period === "custom") {
          if (fromDate) params.fromDate = fromDate;
          if (toDate) params.toDate = toDate;
        }
      }
      if (statusFilter) params.verificationStatus = statusFilter;
      if (leadByFilter) params.leadBy = leadByFilter;
      if (searchDebounced.trim()) params.search = searchDebounced.trim();
      const res = await api.get("/customers", { params, forceRefresh: isSilent });
      setLeads(res.data?.data || []);
      if (!isSilent) setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load customer leads:", err);
      if (!isSilent) setToast({ message: "Failed to load leads from server", type: "error" });
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [dateType, period, fromDate, toDate, statusFilter, leadByFilter, searchDebounced]);

  // Subscribe to real-time sync across components and open browser tabs
  useEffect(() => {
    const unsub = onDataSync((evt) => {
      if (evt?.type === "customer") {
        fetchLeads({ silent: true });
      }
    });
    return unsub;
  }, [fetchLeads]);

  // Re-sync on window focus
  useEffect(() => {
    const onFocus = () => fetchLeads({ silent: true });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchLeads]);

  useEffect(() => {
    const isModalOpen = Boolean(showAddModal || editLead || activeDrawer);
    if (isModalOpen) {
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showAddModal, editLead, activeDrawer]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get("/customers/employees-list");
        if (res.data?.data && Array.isArray(res.data.data)) {
          setEmployeesList(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch employees list:", err);
      }
    };
    fetchEmployees();
  }, []);

  // Reset page when tab changes
  useEffect(() => { setCurrentPage(1); }, [activeTab]);

  // Debounced search handler
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearchDebounced(val), 500);
  };

  // CSV export respects current filters & role scoping (enforced backend)
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = {};
      if (dateType !== "createdAt") params.dateType = dateType;
      if (period !== "all") {
        params.period = period;
        if (period === "custom") {
          if (fromDate) params.fromDate = fromDate;
          if (toDate) params.toDate = toDate;
        }
      }
      if (statusFilter) params.verificationStatus = statusFilter;
      if (leadByFilter) params.leadBy = leadByFilter;
      if (searchDebounced.trim()) params.search = searchDebounced.trim();
      const res = await api.get("/customers/export", { params, responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `GatecodeXcars24_Leads_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToast({ message: `CSV exported successfully`, type: "success" });
    } catch {
      setToast({ message: "CSV export failed. Please try again.", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      appointmentId: "",
      customerName: "",
      mobile: "",
      email: "",
      carNumber: "",
      odometerKm: "",
      appointmentDate: "",
      leadDate: new Date().toISOString().split("T")[0],
      verificationStatus: "Pending",
      leadBy: user?.name || "",
      followUpBy: "",
      followUpDate: "",
      district: "",
      state: "",
      remark: ""
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleOpenEditModal = (lead) => {
    setEditLead(lead);
    setFormErrors({});
    setFormData({
      appointmentId: lead.appointmentId || "",
      customerName: lead.customerName || "",
      mobile: lead.mobile || "",
      email: lead.email || "",
      carNumber: lead.carNumber || "",
      odometerKm: lead.odometerKm || "",
      appointmentDate: lead.appointmentDate ? new Date(lead.appointmentDate).toISOString().slice(0, 16) : "",
      leadDate: lead.leadDate ? new Date(lead.leadDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      verificationStatus: lead.verificationStatus || (lead.verified ? "Verified" : "Pending"),
      followUp: lead.followUp || (lead.leadStatus === "Completed" ? "Converted" : "Follow-up"),
      leadBy: lead.leadBy || lead.employeeName || "",
      followUpBy: lead.followUpBy || "",
      followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().split("T")[0] : "",
      district: lead.district || "",
      state: lead.state || "",
      remark: lead.remark || ""
    });
  };

  const validateLead = () => {
    const errs = {};
    if (!formData.customerName || !formData.customerName.trim()) {
      errs.customerName = "Customer name is required";
    }
    if (!formData.mobile || !formData.mobile.trim()) {
      errs.mobile = "Mobile number is required";
    } else {
      const clean = formData.mobile.replace(/\D/g, "");
      if (clean.length < 10) {
        errs.mobile = "Enter valid 10-digit mobile number";
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    if (!validateLead()) {
      setToast({ message: "Please check required fields: Customer Name and a valid 10-digit mobile number.", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const rawAptId = formData.appointmentId ? formData.appointmentId.trim().toUpperCase() : "";
      const trimmedAptId = rawAptId ? (rawAptId.startsWith("AP-") ? rawAptId : `AP-${rawAptId.replace(/^AP-?/, "")}`) : undefined;
      const formattedCustName = formData.customerName ? formatCustomerName(formData.customerName) : "";
      const formattedCarNum = formData.carNumber ? formatCarRegAndModel(formData.carNumber, true) : "";

      const payload = {
        ...formData,
        customerName: formattedCustName || formData.customerName,
        carNumber: formattedCarNum || formData.carNumber,
        appointmentId: trimmedAptId || undefined,
        odometerKm: Number(formData.odometerKm) || 0,
        verified: formData.verificationStatus === "Verified",
        followUp: formData.followUp || "Follow-up",
        leadStatus: formData.followUp === "Converted" ? "Completed" : (formData.verificationStatus === "Verified" ? "Verified" : "Follow-up")
      };

      if (editLead) {
        const res = await api.put(`/customers/${editLead._id}`, payload);
        const updatedLead = res.data?.data || { ...editLead, ...payload, appointmentId: trimmedAptId || editLead.appointmentId };
        // Immediately update row in table without reload
        setLeads((prev) => prev.map((l) => (l._id === editLead._id ? { ...l, ...updatedLead } : l)));
        setToast({ message: `Lead ${updatedLead.appointmentId || editLead.appointmentId} updated successfully!`, type: "success" });
        setEditLead(null);
        emitDataSync({ type: "customer", action: "update", record: updatedLead });
      } else {
        const res = await api.post("/customers", payload);
        const createdLead = res.data?.data;
        if (createdLead) {
          // Immediately prepend new row without reload, deduplicating by _id
          setLeads((prev) => [createdLead, ...prev.filter((l) => l._id !== createdLead._id)]);
        }
        setToast({ message: `New Lead & Appointment created successfully! [${createdLead?.appointmentId || ""}]`, type: "success" });
        setShowAddModal(false);
        emitDataSync({ type: "customer", action: "create", record: createdLead });
      }
      fetchLeads({ silent: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save lead";
      setToast({ message: msg, type: "error" });
      if (msg.toLowerCase().includes("mobile")) {
        setFormErrors((prev) => ({ ...prev, mobile: msg }));
      } else if (msg.toLowerCase().includes("name") || msg.toLowerCase().includes("customer")) {
        setFormErrors((prev) => ({ ...prev, customerName: msg }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestDeleteLead = (id, aptId) => {
    setDeleteConfirmLead({ id, aptId: formatAptId(aptId) });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmLead) return;
    const { id, aptId } = deleteConfirmLead;
    setDeleting(true);
    try {
      // Immediately remove record from table without reload
      setLeads((prev) => prev.filter((l) => l._id !== id));
      await api.delete(`/customers/${id}`);
      setToast({ message: `Lead ${aptId || ""} deleted successfully`, type: "success" });
      emitDataSync({ type: "customer", action: "delete", id });
      setDeleteConfirmLead(null);
      fetchLeads({ silent: true });
    } catch (err) {
      fetchLeads({ silent: true });
      setToast({ message: err.response?.data?.message || "Failed to delete lead", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const handleRowStatusChange = async (lead, newStatus) => {
    const isVerified = newStatus === "Verified";
    const previousStatus = lead.verificationStatus;
    const previousVerified = lead.verified;
    const previousLeadStatus = lead.leadStatus;

    // 1. Immediate optimistic UI update so the select updates smoothly without freezing
    setLeads((prev) =>
      prev.map((l) =>
        l._id === lead._id
          ? {
              ...l,
              verificationStatus: newStatus,
              verified: isVerified,
              leadStatus: isVerified ? "Verified" : (newStatus === "Follow-up" ? "Follow-up" : "Pending")
            }
          : l
      )
    );

    try {
      const res = await api.put(`/customers/${lead._id}`, {
        verificationStatus: newStatus,
        verified: isVerified
      });
      const updated = res.data?.data;
      if (updated) {
        setLeads((prev) => prev.map((l) => (l._id === lead._id ? { ...l, ...updated } : l)));
      }
      setToast({ message: `Marked as ${newStatus === "Verified" ? "Yes (Verified)" : "No (Pending)"}`, type: "success" });
      emitDataSync({ type: "customer", action: "update", record: updated || { ...lead, verificationStatus: newStatus } });
      fetchLeads({ silent: true });
    } catch (err) {
      console.error("Failed to update status:", err);
      // Rollback on failure
      setLeads((prev) =>
        prev.map((l) =>
          l._id === lead._id
            ? {
                ...l,
                verificationStatus: previousStatus,
                verified: previousVerified,
                leadStatus: previousLeadStatus
              }
            : l
        )
      );
      fetchLeads({ silent: true });
      setToast({ message: err.response?.data?.message || "Failed to update status", type: "error" });
    }
  };

  const filteredLeads = useMemo(() => {
    let list = leads;
    // Tab-based client-side view (server already applied main filters)
    if (activeTab === "verified") {
      list = list.filter((l) => l.verified || l.verificationStatus === "Verified");
    } else if (activeTab === "appointments") {
      list = list.filter((l) => Boolean(l.appointmentDate));
    } else if (activeTab === "followup") {
      list = list.filter((l) => l.verificationStatus === "Follow-up" || l.leadStatus === "Follow-up");
    }
    return list;
  }, [leads, activeTab]);

  const totalPages = Math.ceil(filteredLeads.length / PAGE_SIZE);
  const paginatedLeads = useMemo(
    () => filteredLeads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredLeads, currentPage, PAGE_SIZE]
  );

  const clearAllFilters = () => {
    setDateType("createdAt");
    setPeriod("all");
    setFromDate("");
    setToDate("");
    setStatusFilter("");
    setLeadByFilter("");
    setSearchTerm("");
    setSearchDebounced("");
  };

  const hasActiveFilters = dateType !== "createdAt" || period !== "all" || Boolean(statusFilter) || Boolean(leadByFilter) || Boolean(searchTerm) || Boolean(searchDebounced.trim());

  return (
    <div className="content-area">
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>Lead Management &amp; Customer Inquiries</h1>
          <p>Automotive sales pipeline, inspection appointments and evaluation records</p>
        </div>

        <div className="page-actions-group">
          <button
            className="btn btn-secondary"
            onClick={() => setIsCsvModalOpen(true)}
            title="Import Leads from CSV"
          >
            <UploadIcon />
            <span>Import CSV</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={exporting}
            title="Export current filtered results to CSV (Excel-ready)"
          >
            <FileSpreadsheetIcon />
            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => downloadLeadsPDF(filteredLeads)}
            title="Export to PDF"
          >
            <FilePdfIcon />
            <span>Export PDF</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <PlusIcon />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="table-card">
        <div className="table-header-bar">
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {[
              { key: "all", label: `All Leads (${leads.length})` },
              { key: "verified", label: "Verified Only" },
              { key: "appointments", label: "Scheduled Appointments" },
              { key: "followup", label: "Pending Follow-up" }
            ].map((t) => (
              <button
                key={t.key}
                className={`btn btn-sm ${activeTab === t.key ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="table-search-input">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search leads, ID, phone, car..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSearchDebounced("");
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center"
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Server-Side Filter Bar Container */}
        <div className="filter-bar-container">
          <div className="filter-bar-top">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div className="filter-field-item">
                <span className="filter-field-label" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <CalendarIcon />
                  <span>Date Field</span>
                </span>
                <select
                  className="filter-select-modern"
                  value={dateType}
                  onChange={(e) => setDateType(e.target.value)}
                >
                  <option value="createdAt">Timestamp</option>
                  <option value="leadDate">Lead Date</option>
                  <option value="appointmentDate">Appointment Date</option>
                </select>
              </div>

              <div className="filter-period-pills-modern">
                {[
                  { key: "all", label: "All" },
                  { key: "today", label: "Today" },
                  { key: "yesterday", label: "Yesterday" },
                  { key: "week", label: "This Week" },
                  { key: "month", label: "This Month" },
                  { key: "last_month", label: "Last Month" },
                  { key: "custom", label: "Custom" }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`filter-pill-modern ${period === key ? "active" : ""}`}
                    onClick={() => setPeriod(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {period === "custom" && (
              <div className="filter-custom-range" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "135px" }}>
                  <CustomDateTimePicker
                    mode="date"
                    value={fromDate}
                    onChange={(val) => setFromDate(val)}
                    placeholder="From Date"
                  />
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>to</span>
                <div style={{ width: "135px" }}>
                  <CustomDateTimePicker
                    mode="date"
                    value={toDate}
                    onChange={(val) => setToDate(val)}
                    placeholder="To Date"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="filter-bar-bottom">
            <div className="filter-controls-group">
              <div className="filter-field-item">
                <label className="filter-field-label">Verified</label>
                <select
                  className="filter-select-modern"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="filter-field-item">
                <label className="filter-field-label">Lead By</label>
                <select
                  className="filter-select-modern"
                  value={leadByFilter}
                  onChange={(e) => setLeadByFilter(e.target.value)}
                >
                  <option value="">All Executives</option>
                  {employeesList.map((emp) => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="filter-clear-btn-modern"
                  onClick={clearAllFilters}
                  title="Clear all applied filters"
                >
                  ✕ Reset Filters
                </button>
              )}
            </div>

            <div className="table-slide-controls">
              <button
                type="button"
                className="slide-btn"
                onClick={() => slideTable("left")}
                title="Scroll Left"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                className="slide-btn"
                onClick={() => slideTable("right")}
                title="Scroll Right"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Table / Empty State */}
        {loading ? (
          <div className="table-empty-state-modern" style={{ border: "none" }}>
            <div className="empty-icon-wrap" style={{ background: "#f0f9ff" }}>
              <ClockIcon />
            </div>
            <h4 className="empty-title">Loading leads &amp; appointments...</h4>
            <p className="empty-subtitle">Fetching latest pipeline records and dossiers.</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="table-empty-state-modern">
            <div className="empty-icon-wrap">
              <SearchIcon />
            </div>
            <h4 className="empty-title">No leads found</h4>
            <p className="empty-subtitle">
              {hasActiveFilters
                ? "No leads match your current search or filter criteria."
                : "You have not registered any customer leads yet."}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={clearAllFilters}
              >
                ✕ Clear All Filters
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenAddModal}
              >
                <PlusIcon /> Add New Lead
              </button>
            )}
          </div>
        ) : (
          <div className="table-container" ref={tableContainerRef}>
            <table className="leads-table slidable-table">
              <thead>
                <tr>
                  <th>Appointment ID</th>
                  <th>Lead Date</th>
                  <th>Appointment Date</th>
                  <th>Car Number</th>
                  <th>Oddo Meter/KM</th>
                  <th>CX Name</th>
                  <th>Cx Mobile No.</th>
                  <th>Lead By</th>
                  <th>Follow Up Done By</th>
                  <th>Date of Follow-up</th>
                  <th>VERIFIED</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: "center", minWidth: "120px" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.map((lead) => {
                  const statusKey = (lead.verificationStatus || (lead.verified ? "Verified" : "Pending")).toLowerCase().replace(/\s+/g, "");
                  const cleanMobile = (lead.mobile || "").replace(/\D/g, "");
                  const waUrl = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(
                    `Hello ${lead.customerName}, regarding your car inquiry with GatecodeXcars24 (Appointment ID: ${lead.appointmentId}).`
                  )}`;

                  return (
                    <tr key={lead._id}>
                      {/* 1. Appointment ID */}
                      <td>
                        <span
                          className="appointment-id-pill"
                          style={{ cursor: "pointer" }}
                          onClick={() => setActiveDrawer(lead)}
                          title="Click to view full lead dossier"
                        >
                          {formatAptId(lead.appointmentId)}
                        </span>
                      </td>

                      {/* 2. Lead Date */}
                      <td>
                        <span style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text-heading)" }}>
                          {formatDateOnly(lead.leadDate || lead.createdAt)}
                        </span>
                      </td>

                      {/* 3. Appointment Date */}
                      <td>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: lead.appointmentDate ? "#0284c7" : "var(--text-muted)" }}>
                          {formatDateTime(lead.appointmentDate)}
                        </span>
                      </td>

                      {/* 4. Car Number */}
                      <td>
                        <span className="car-number-badge">
                          {formatCarRegAndModel(lead.carNumber) || "N/A"}
                        </span>
                      </td>

                      {/* 5. Oddo Meter/KM */}
                      <td>
                        <span className="odometer-badge">
                          {lead.odometerKm ? Number(lead.odometerKm).toLocaleString("en-IN") : "0"}
                          <span className="unit">KM</span>
                        </span>
                      </td>

                      {/* 6. CX Name */}
                      <td>
                        <span className="cust-name">
                          {formatCustomerName(lead.customerName)}
                        </span>
                      </td>

                      {/* 7. Cx Mobile No. */}
                      <td>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cust-phone"
                          title="Open WhatsApp chat"
                        >
                          <span>{lead.mobile}</span>
                        </a>
                      </td>

                      {/* 8. Lead By */}
                      <td>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-heading)" }}>
                          {lead.leadBy || lead.employeeName || "Executive"}
                        </span>
                      </td>

                      {/* 9. Follow Up Done By */}
                      <td>
                        <span style={{ fontSize: "12px", color: lead.followUpBy ? "var(--text-heading)" : "var(--text-muted)" }}>
                          {lead.followUpBy || "-"}
                        </span>
                      </td>

                      {/* 10. Date of Follow-up */}
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {formatDateOnly(lead.followUpDate)}
                        </span>
                      </td>

                      {/* 11. VERIFIED — toggle switch */}
                      <td>
                        <label
                          className="yn-switch"
                          onClick={(e) => e.stopPropagation()}
                          title={(lead.verificationStatus === "Verified" || lead.verified) ? "Verified — click to unverify" : "Not Verified — click to verify"}
                        >
                          <input
                            type="checkbox"
                            checked={lead.verificationStatus === "Verified" || lead.verified}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleRowStatusChange(lead, e.target.checked ? "Verified" : "Pending");
                            }}
                          />
                          <span className="yn-slider">
                            <span className="yn-label-yes">Yes</span>
                            <span className="yn-label-no">No</span>
                          </span>
                        </label>
                      </td>

                      {/* 12. Timestamp (Last Data Column) */}
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>
                          {formatDateTime(lead.createdAt)}
                        </span>
                      </td>

                      {/* 14. Actions (At the End, Non-sticky) */}
                      <td style={{ textAlign: "center", minWidth: "120px" }}>
                        <div className="table-actions" style={{ justifyContent: "center" }}>
                          <button
                            type="button"
                            className="btn-action btn-action-view"
                            title="View Full Details"
                            aria-label="View Full Details"
                            onClick={() => setActiveDrawer(lead)}
                          >
                            <EyeIcon />
                          </button>

                          <button
                            type="button"
                            className="btn-action btn-action-edit"
                            title="Edit Lead"
                            aria-label="Edit Lead"
                            onClick={() => handleOpenEditModal(lead)}
                          >
                            <EditIcon />
                          </button>

                          <button
                            type="button"
                            className="btn-action btn-action-delete"
                            title="Delete Lead"
                            aria-label="Delete Lead"
                            onClick={() => handleRequestDeleteLead(lead._id, lead.appointmentId)}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-bar">
            <span className="pagination-info">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredLeads.length)} of {filteredLeads.length} records
            </span>
            <div className="pagination-controls">
              <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} title="First">«</button>
              <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>‹ Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${currentPage === pageNum ? "active" : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >{pageNum}</button>
                );
              })}
              <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next ›</button>
              <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} title="Last">»</button>
            </div>
          </div>
        )}
        {totalPages <= 1 && filteredLeads.length > 0 && (
          <div className="pagination-bar" style={{ justifyContent: "flex-end" }}>
            <span className="pagination-info">{filteredLeads.length} record{filteredLeads.length !== 1 ? "s" : ""} total</span>
          </div>
        )}
      </div>

      {/* Add / Edit Lead Modal */}
      {/* Add / Edit Lead Modal — Single Page Zero Scroll */}
      {(showAddModal || editLead) && (
        <div className="modal-backdrop" onClick={() => { setShowAddModal(false); setEditLead(null); }}>
          <div className="modal-card modal-card-compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: "12px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="badge badge-blue" style={{ fontSize: "11px", fontWeight: 700 }}>
                  {formData.appointmentId || (editLead ? editLead.appointmentId : "NEW LEAD")}
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                  {editLead ? `Edit Customer Lead` : "Add New Customer Lead"}
                </h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => { setShowAddModal(false); setEditLead(null); }}
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSaveLead} noValidate>
              <div className="modal-body modal-body-compact">
                {/* 1. Customer & Vehicle Information */}
                <div className="compact-section-box">
                  <div className="compact-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span>1. Customer &amp; Vehicle Information</span>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        color: formData.verificationStatus === "Verified" ? "#16a34a" : "#64748b",
                        background: formData.verificationStatus === "Verified" ? "#dcfce7" : "#f1f5f9",
                        border: formData.verificationStatus === "Verified" ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                        padding: "2px 9px",
                        borderRadius: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: formData.verificationStatus === "Verified" ? "#16a34a" : "#94a3b8" }}></span>
                      {formData.verificationStatus === "Verified" ? "Verified" : "Pending"}
                    </span>
                  </div>

                  <div className="compact-grid-3">
                    {/* Row 1: Identity & Contact */}
                    <div className="form-group">
                      <label className="form-label" title="Manual Appointment ID (Leave blank to auto-generate)">
                        Appointment ID <span style={{ fontSize: "10.5px", fontWeight: 400, color: "var(--text-muted)" }}>(Manual / Auto)</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. AP-12345 (Auto if blank)"
                        value={formData.appointmentId}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
                          setFormData({ ...formData, appointmentId: val });
                        }}
                        onBlur={(e) => {
                          let val = (e.target.value || "").trim().toUpperCase();
                          if (val && !val.startsWith("AP-")) {
                            val = `AP-${val.replace(/^AP-?/, "")}`;
                          }
                          setFormData({ ...formData, appointmentId: val });
                        }}
                        style={{ textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.02em" }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Customer Name <span style={{ color: "#ef4444" }}>*</span></label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.customerName ? "is-invalid" : ""}`}
                        placeholder="e.g. Ramesh Patel"
                        required
                        value={formData.customerName}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const formatted = raw.replace(/\b([a-zA-Z])/g, (c) => c.toUpperCase());
                          setFormData({ ...formData, customerName: formatted });
                          if (formErrors.customerName) setFormErrors((prev) => ({ ...prev, customerName: "" }));
                        }}
                        onBlur={() => {
                          if (formData.customerName) {
                            setFormData((prev) => ({ ...prev, customerName: formatCustomerName(prev.customerName) }));
                          }
                        }}
                      />
                      {formErrors.customerName && (
                        <small className="error-text">{formErrors.customerName}</small>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Cx Mobile No. <span style={{ color: "#ef4444" }}>*</span></label>
                      <input
                        type="tel"
                        maxLength={10}
                        className={`form-control ${formErrors.mobile ? "is-invalid" : ""}`}
                        placeholder="e.g. 9876543210"
                        required
                        value={formData.mobile}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "");
                          if (val.startsWith("91") && val.length > 10) val = val.slice(2);
                          val = val.slice(0, 10);
                          setFormData({ ...formData, mobile: val });
                          if (formErrors.mobile) setFormErrors((prev) => ({ ...prev, mobile: "" }));
                        }}
                      />
                      {formErrors.mobile && (
                        <small className="error-text">{formErrors.mobile}</small>
                      )}
                    </div>

                    {/* Row 2: Vehicle & Verification */}
                    <div className="form-group">
                      <label className="form-label">Car Reg No. / Model</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. DL-01-AB-1234 / Honda City"
                        value={formData.carNumber}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (e.nativeEvent && e.nativeEvent.inputType && e.nativeEvent.inputType.startsWith("delete")) {
                            setFormData({ ...formData, carNumber: val.toUpperCase() });
                            return;
                          }
                          setFormData({ ...formData, carNumber: formatCarRegAndModel(val, false) });
                        }}
                        onBlur={() => {
                          if (formData.carNumber) {
                            setFormData({ ...formData, carNumber: formatCarRegAndModel(formData.carNumber, true) });
                          }
                        }}
                        style={{ fontWeight: 600, letterSpacing: "0.02em" }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Oddo Meter / KM</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 45000"
                        value={formData.odometerKm}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          setFormData({ ...formData, odometerKm: digits });
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Lead Verification</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "38px" }}>
                        <label
                          className="yn-switch yn-switch-lg"
                          title={formData.verificationStatus === "Verified" ? "Verified — click to set Pending" : "Pending — click to set Verified"}
                        >
                          <input
                            type="checkbox"
                            checked={formData.verificationStatus === "Verified"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                verificationStatus: e.target.checked ? "Verified" : "Pending"
                              })
                            }
                          />
                          <span className="yn-slider">
                            <span className="yn-label-yes">Yes</span>
                            <span className="yn-label-no">No</span>
                          </span>
                        </label>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.03em",
                            color: formData.verificationStatus === "Verified" ? "#16a34a" : "#64748b",
                            padding: "3px 9px",
                            borderRadius: "10px",
                            background: formData.verificationStatus === "Verified" ? "#dcfce7" : "#f1f5f9",
                            border: formData.verificationStatus === "Verified" ? "1px solid #bbf7d0" : "1px solid #e2e8f0"
                          }}
                        >
                          {formData.verificationStatus === "Verified" ? "VERIFIED" : "PENDING"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Appointment & Assignment */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>2. Appointment &amp; Assignment</span>
                  </div>
                  <div className="compact-grid-4">
                    <div className="form-group">
                      <label className="form-label">Lead Date</label>
                      <CustomDateTimePicker
                        mode="date"
                        value={formData.leadDate}
                        onChange={(val) => setFormData({ ...formData, leadDate: val })}
                        placeholder="Select lead date"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Appointment Date &amp; Time</label>
                      <CustomDateTimePicker
                        mode="datetime"
                        value={formData.appointmentDate}
                        onChange={(val) => setFormData({ ...formData, appointmentDate: val })}
                        placeholder="Select date &amp; time"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Lead By (Executive)</label>
                      <select
                        className="form-control"
                        value={formData.leadBy}
                        onChange={(e) => setFormData({ ...formData, leadBy: e.target.value })}
                      >
                        <option value="">-- Select Executive --</option>
                        {employeesList.map((emp) => (
                          <option key={emp} value={emp}>
                            {emp}
                          </option>
                        ))}
                        {formData.leadBy && !employeesList.includes(formData.leadBy) && (
                          <option value={formData.leadBy}>{formData.leadBy}</option>
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Follow Up Done By</label>
                      <select
                        className="form-control"
                        value={formData.followUpBy}
                        onChange={(e) => setFormData({ ...formData, followUpBy: e.target.value })}
                      >
                        <option value="">-- Select Executive --</option>
                        {employeesList.map((emp) => (
                          <option key={emp} value={emp}>
                            {emp}
                          </option>
                        ))}
                        {formData.followUpBy && !employeesList.includes(formData.followUpBy) && (
                          <option value={formData.followUpBy}>{formData.followUpBy}</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Follow-up & Inspection Notes */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    <span>3. Follow-up &amp; Inspection Notes</span>
                  </div>
                  <div className="compact-grid-4">
                    <div className="form-group">
                      <label className="form-label">Date of Follow-up</label>
                      <CustomDateTimePicker
                        mode="date"
                        value={formData.followUpDate}
                        onChange={(val) => setFormData({ ...formData, followUpDate: val })}
                        placeholder="Select follow-up date"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Deal / Converted</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "38px" }}>
                        <label className="yn-switch yn-switch-lg" title="Toggle Lead Converted vs Follow-up Required">
                          <input
                            type="checkbox"
                            checked={formData.followUp === "Converted"}
                            onChange={(e) =>
                              setFormData({ ...formData, followUp: e.target.checked ? "Converted" : "Follow-up" })
                            }
                          />
                          <span className="yn-slider">
                            <span className="yn-label-yes">Yes</span>
                            <span className="yn-label-no">No</span>
                          </span>
                        </label>
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 700,
                            letterSpacing: "0.02em",
                            color: formData.followUp === "Converted" ? "#0284c7" : "#64748b",
                            padding: "3px 9px",
                            borderRadius: "10px",
                            background: formData.followUp === "Converted" ? "#e0f2fe" : "#f1f5f9",
                            border: formData.followUp === "Converted" ? "1px solid #bae6fd" : "1px solid #e2e8f0"
                          }}
                        >
                          {formData.followUp === "Converted" ? "✓ CONVERTED" : "⏳ FOLLOW-UP"}
                        </span>
                      </div>
                    </div>

                    <div className="form-group col-span-2">
                      <label className="form-label">Remarks / Inspection Notes</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter customer expectations, valuation offer, evaluation notes..."
                        value={formData.remark}
                        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: "10px 20px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: "6px 16px", fontSize: "13px" }}
                  onClick={() => { setShowAddModal(false); setEditLead(null); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "6px 20px", fontSize: "13px" }}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : editLead ? "Update Lead" : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail Drawer (Slide-in) */}
      {activeDrawer && (
        <div className="drawer-backdrop" onClick={() => setActiveDrawer(null)}>
          <div className="drawer-card" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="appointment-id-pill">{formatAptId(activeDrawer.appointmentId)}</span>
                <h3 style={{ marginTop: "4px", fontSize: "18px", fontWeight: 700 }}>
                  {formatCustomerName(activeDrawer.customerName)}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveDrawer(null)}>
                <CloseIcon />
              </button>
            </div>

            <div className="drawer-body">
              {/* Customer Contact Badge */}
              <div style={{
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                borderRadius: "12px",
                padding: "16px",
                color: "#ffffff",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div>
                  <p style={{ fontSize: "12px", opacity: 0.9 }}>Primary Customer Contact</p>
                  <p style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "0.5px" }}>{activeDrawer.mobile}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ background: "#ffffff", color: "#0284c7", fontWeight: 700 }}
                  onClick={() => {
                    const leadToEdit = activeDrawer;
                    setActiveDrawer(null);
                    handleOpenEditModal(leadToEdit);
                  }}
                >
                  <EditIcon /> Edit Lead
                </button>
              </div>

              {/* Status Update Quick Bar */}
              <div style={{ marginBottom: "20px" }}>
                <label className="form-label" style={{ marginBottom: "8px", display: "block" }}>
                  Verification Status
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["Pending", "Follow-up", "Verified", "Rejected"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`btn btn-sm ${activeDrawer.verificationStatus === st ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => handleRowStatusChange(activeDrawer, st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail Grid */}
              <div className="form-grid-2">
                <div className="detail-label-val">
                  <span className="detail-label">Car Reg Number</span>
                  <div className="detail-value">
                    <span className="car-number-badge">{formatCarRegAndModel(activeDrawer.carNumber) || "N/A"}</span>
                  </div>
                </div>

                <div className="detail-label-val">
                  <span className="detail-label">Oddo Meter / KM</span>
                  <div className="detail-value">
                    <span className="odometer-badge">
                      {activeDrawer.odometerKm ? Number(activeDrawer.odometerKm).toLocaleString("en-IN") : "0"} <span className="unit">KM</span>
                    </span>
                  </div>
                </div>

                <div className="detail-label-val">
                  <span className="detail-label">Lead Date</span>
                  <div className="detail-value">{formatDateOnly(activeDrawer.leadDate || activeDrawer.createdAt)}</div>
                </div>

                <div className="detail-label-val">
                  <span className="detail-label">Appointment Scheduled</span>
                  <div className="detail-value">{formatDateTime(activeDrawer.appointmentDate)}</div>
                </div>

                <div className="detail-label-val">
                  <span className="detail-label">Lead Created By</span>
                  <div className="detail-value">{activeDrawer.leadBy || activeDrawer.employeeName || "-"}</div>
                </div>

                <div className="detail-label-val">
                  <span className="detail-label">Follow-up Done By</span>
                  <div className="detail-value">{activeDrawer.followUpBy || "-"}</div>
                </div>

                <div className="detail-label-val">
                  <span className="detail-label">Date of Follow-up</span>
                  <div className="detail-value">{formatDateOnly(activeDrawer.followUpDate)}</div>
                </div>

                <div className="detail-label-val">
                  <span className="detail-label">Timestamp (Created At)</span>
                  <div className="detail-value">{formatDateTime(activeDrawer.createdAt)}</div>
                </div>
              </div>

              {activeDrawer.remark && (
                <div style={{ marginTop: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <span className="detail-label" style={{ display: "block", marginBottom: "4px" }}>Remarks</span>
                  <p style={{ fontSize: "13px", color: "var(--text)" }}>{activeDrawer.remark}</p>
                </div>
              )}
            </div>

            <div className="drawer-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const leadToEdit = activeDrawer;
                  setActiveDrawer(null);
                  handleOpenEditModal(leadToEdit);
                }}
              >
                <EditIcon /> Edit Record
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveDrawer(null)}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Leads & Appointments from CSV"
        description="Upload customer leads, car details, and inspection appointments from an Excel/CSV spreadsheet."
        templateFilename="leads_and_appointments_template.csv"
        templateHeaders={[
          "Appointment ID",
          "Lead Date",
          "Appointment Date",
          "Appointment Time",
          "Car Number",
          "Oddo Meter/KM",
          "CX Name",
          "Cx Mobile No.",
          "Lead By",
          "Follow Up Done By",
          "Date of Follow-up",
          "VERIFIED",
          "Cx Expectation / Remarks"
        ]}
        templateSampleRows={[
          ["AP-94821", "2026-09-29", "2026-09-30", "14:30", "DL01AB1234", "45000 KM", "Ramesh Kumar", "9876543210", "Pooja Verma", "Pooja Verma", "2026-09-29", "Verified", "Customer interested in selling Swift VDI"],
          ["AP-83921", "2026-09-29", "2026-10-01", "11:00", "HR26DK5678", "32000 KM", "Amit Sharma", "9812345678", "Rahul Sharma", "Rahul Sharma", "", "Pending", "Wants evaluation at home"]
        ]}
        requiredHeaders={["CX Name", "Cx Mobile No."]}
        onImport={handleImportCustomers}
      />

      <ConfirmModal
        isOpen={Boolean(deleteConfirmLead)}
        title={`Delete Lead ${deleteConfirmLead?.aptId || ""}`}
        message={`Are you sure you want to delete lead ${deleteConfirmLead?.aptId || "this lead"}? This action cannot be undone and will permanently remove the lead dossier.`}
        confirmText="Delete Lead"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmLead(null)}
      />
    </div>
  );
};

export default CustomersPage;
