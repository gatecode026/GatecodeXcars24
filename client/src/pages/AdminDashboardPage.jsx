import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

// Clean Line Icons
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ animation: spinning ? "spin 0.8s linear infinite" : "none" }}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
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

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
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

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState("week"); // week, month, year
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const recentTableRef = useRef(null);

  const slideRecentTable = (direction) => {
    if (recentTableRef.current) {
      const scrollAmt = direction === "left" ? -400 : 400;
      recentTableRef.current.scrollBy({ left: scrollAmt, behavior: "smooth" });
    }
  };

  const [summary, setSummary] = useState({
    totalLeads: 0,
    todayLeads: 0,
    pendingFollowUps: 0,
    todayAppointments: 0,
    verifiedLeads: 0,
    carsPurchased: 0,
    carsSold: 0,
    performanceTrend: [],
    topEmployees: [],
    recentLeads: []
  });

  // Modal & Drawer State
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [activeLeadDrawer, setActiveLeadDrawer] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New Lead Form State
  const [newLeadForm, setNewLeadForm] = useState({
    customerName: "",
    mobile: "",
    email: "",
    carNumber: "",
    appointmentDate: "",
    verificationStatus: "Pending",
    leadBy: user?.name || "",
    district: "",
    state: "",
    remark: ""
  });

  // Full Edit Lead Form State (TL can edit all fields)
  const [editLeadForm, setEditLeadForm] = useState({
    customerName: "",
    mobile: "",
    email: "",
    carNumber: "",
    odometerKm: "",
    leadDate: "",
    appointmentDate: "",
    leadBy: "",
    followUpBy: "",
    followUpDate: "",
    verificationStatus: "Pending",
    district: "",
    state: "",
    remark: ""
  });

  const handleOpenEditLead = (lead) => {
    setEditLead(lead);
    setEditLeadForm({
      customerName: lead.customerName || "",
      mobile: lead.mobile || "",
      email: lead.email || "",
      carNumber: lead.carNumber || "",
      odometerKm: lead.odometerKm || "",
      leadDate: lead.leadDate ? new Date(lead.leadDate).toISOString().split("T")[0] : "",
      appointmentDate: lead.appointmentDate ? new Date(lead.appointmentDate).toISOString().slice(0, 16) : "",
      leadBy: lead.leadBy || lead.employeeName || "",
      followUpBy: lead.followUpBy || "",
      followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().split("T")[0] : "",
      verificationStatus: lead.verificationStatus || (lead.verified ? "Verified" : "Pending"),
      district: lead.district || "",
      state: lead.state || "",
      remark: lead.remark || ""
    });
  };

  const handleSaveEditLead = async (e) => {
    e.preventDefault();
    if (!editLead) return;
    setSubmittingLead(true);
    try {
      const payload = {
        ...editLeadForm,
        odometerKm: Number(editLeadForm.odometerKm) || 0,
        verified: editLeadForm.verificationStatus === "Verified"
      };
      await api.put(`/customers/${editLead._id}`, payload);
      showToast(`Lead ${editLead.appointmentId} updated successfully!`, "success");
      setEditLead(null);
      fetchDashboardData(true);
    } catch (err) {
      console.error("Update lead error:", err);
      showToast(err.response?.data?.message || "Failed to update lead", "error");
    } finally {
      setSubmittingLead(false);
    }
  };

  const handleDeleteLead = async (id, aptId) => {
    if (!window.confirm(`Are you sure you want to delete lead ${aptId || "this lead"}? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/customers/${id}`);
      showToast(`Lead ${aptId || ""} deleted successfully`, "success");
      fetchDashboardData(true);
    } catch (err) {
      console.error("Delete lead error:", err);
      showToast(err.response?.data?.message || "Failed to delete lead", "error");
    }
  };

  const [employeesList, setEmployeesList] = useState([]);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get("/dashboard/summary");
      if (res.data?.data) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching dashboard summary:", err);
      showToast("Failed to load dashboard metrics", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  // Lock background scroll when any modal or drawer is open
  useEffect(() => {
    const isModalOpen = Boolean(showAddLeadModal || editLead || activeLeadDrawer);
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAddLeadModal, editLead, activeLeadDrawer]);

  // Handle Quick Status Update from Table Row
  const handleRowStatusChange = async (lead, newStatus) => {
    const isVerified = newStatus === "Verified";
    // 1. Optimistic update in table state
    setSummary((prev) => ({
      ...prev,
      recentLeads: (prev.recentLeads || []).map((l) =>
        l._id === lead._id
          ? {
              ...l,
              verificationStatus: newStatus,
              verified: isVerified,
              leadStatus: isVerified ? "Verified" : (newStatus === "Follow-up" ? "Follow-up" : "Pending")
            }
          : l
      )
    }));

    try {
      await api.put(`/customers/${lead._id}`, {
        verificationStatus: newStatus,
        verified: isVerified
      });
      showToast(`Status updated to ${newStatus}`, "success");
    } catch (err) {
      console.error("Update status error:", err);
      fetchDashboardData(true);
      showToast(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  // Handle Create Lead
  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLeadForm.customerName.trim() || !newLeadForm.mobile.trim()) {
      showToast("Customer Name and Mobile are required", "error");
      return;
    }

    setSubmittingLead(true);
    try {
      await api.post("/customers", {
        ...newLeadForm,
        verified: newLeadForm.verificationStatus === "Verified"
      });
      showToast("Lead created successfully!", "success");
      setShowAddLeadModal(false);
      setNewLeadForm({
        customerName: "",
        mobile: "",
        email: "",
        carNumber: "",
        appointmentDate: "",
        verificationStatus: "Pending",
        leadBy: user?.name || "",
        district: "",
        state: "",
        remark: ""
      });
      fetchDashboardData(true);
    } catch (err) {
      console.error("Create lead error:", err);
      showToast(err.response?.data?.message || "Failed to create lead", "error");
    } finally {
      setSubmittingLead(false);
    }
  };

  // Handle Quick Status Update in Drawer
  const handleUpdateLeadStatus = async (newStatus) => {
    if (!activeLeadDrawer?._id) return;
    try {
      await api.put(`/customers/${activeLeadDrawer._id}`, {
        verificationStatus: newStatus,
        verified: newStatus === "Verified"
      });
      setActiveLeadDrawer((prev) => ({
        ...prev,
        verificationStatus: newStatus,
        verified: newStatus === "Verified"
      }));
      showToast(`Status updated to ${newStatus}`, "success");
      fetchDashboardData(true);
    } catch (err) {
      console.error("Update status error:", err);
      showToast("Failed to update status", "error");
    }
  };

  // Export Recent Leads to CSV
  const handleExportCSV = () => {
    const leads = summary.recentLeads || [];
    if (!leads.length) {
      showToast("No leads available to export", "error");
      return;
    }
    const headers = ["Appointment ID,Customer Name,Mobile,Car Number,Lead By,Status,Date"];
    const rows = leads.map((l) =>
      `"${l.appointmentId}","${l.customerName}","${l.mobile}","${l.carNumber}","${l.leadBy}","${l.verificationStatus}","${new Date(l.createdAt).toLocaleDateString()}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GatecodeXcars24_Leads_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Leads exported to CSV", "success");
  };

  // Filtered Recent Leads
  const filteredRecentLeads = useMemo(() => {
    let list = summary.recentLeads || [];
    if (statusFilter !== "all") {
      list = list.filter((l) => (l.verificationStatus || "").toLowerCase() === statusFilter.toLowerCase());
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (l) =>
          l.customerName?.toLowerCase().includes(q) ||
          l.mobile?.includes(q) ||
          l.appointmentId?.toLowerCase().includes(q) ||
          l.carNumber?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [summary.recentLeads, statusFilter, searchTerm]);

  // Performance Trend Chart Points Calculation
  const trendData = summary.performanceTrend || [];
  const maxLeads = useMemo(() => {
    const maxVal = Math.max(...trendData.map((d) => Math.max(d.leads || 0, d.verified || 0)), 1);
    return Math.ceil(maxVal * 1.2);
  }, [trendData]);

  const chartWidth = 600;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;
  const innerW = chartWidth - paddingX * 2;
  const innerH = chartHeight - paddingY * 2;

  const pointsLeads = useMemo(() => {
    if (!trendData.length) return "";
    const step = innerW / Math.max(trendData.length - 1, 1);
    return trendData
      .map((d, i) => {
        const x = paddingX + i * step;
        const y = chartHeight - paddingY - (d.leads / maxLeads) * innerH;
        return `${x},${y}`;
      })
      .join(" ");
  }, [trendData, maxLeads, innerW, innerH]);

  const pointsVerified = useMemo(() => {
    if (!trendData.length) return "";
    const step = innerW / Math.max(trendData.length - 1, 1);
    return trendData
      .map((d, i) => {
        const x = paddingX + i * step;
        const y = chartHeight - paddingY - (d.verified / maxLeads) * innerH;
        return `${x},${y}`;
      })
      .join(" ");
  }, [trendData, maxLeads, innerW, innerH]);

  return (
    <div className="content-area">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className={`toast toast-${toastMessage.type}`}>
            {toastMessage.msg}
          </div>
        </div>
      )}

      {/* Page Header Row */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>Dashboard Overview</h1>
          <p>
            Welcome back, <strong>{user?.name || "Admin"}</strong> • GatecodeXcars24 Operations
          </p>
        </div>

        <div className="page-actions-group">
          <button
            className="btn btn-secondary"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            title="Refresh Metrics"
          >
            <RefreshIcon spinning={refreshing} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button className="btn btn-secondary" onClick={handleExportCSV} title="Export CSV">
            <DownloadIcon />
            Export CSV
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setShowAddLeadModal(true)}
            title="Add New Customer Lead"
          >
            <PlusIcon />
            Add New Lead
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards (Matching Reference Screenshot) */}
      <div className="kpi-grid">
        {/* Total Leads */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap cyan">
              <UsersIcon />
            </div>
            <span className="kpi-pill positive">+14.2%</span>
          </div>
          <div className="kpi-label">Total Leads</div>
          <div className="kpi-value">{loading ? "..." : summary.totalLeads}</div>
          <div className="kpi-subtext">Registered customer inquiries</div>
        </div>

        {/* Today's Leads */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap blue">
              <ClockIcon />
            </div>
            <span className="kpi-pill info">Today</span>
          </div>
          <div className="kpi-label">Today's Leads</div>
          <div className="kpi-value">{loading ? "..." : summary.todayLeads}</div>
          <div className="kpi-subtext">Fresh inquiries logged today</div>
        </div>

        {/* Pending Follow-ups */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap amber">
              <ClockIcon />
            </div>
            <span className="kpi-pill warning">Action Req</span>
          </div>
          <div className="kpi-label">Pending Follow-ups</div>
          <div className="kpi-value">{loading ? "..." : summary.pendingFollowUps}</div>
          <div className="kpi-subtext">Leads requiring executive call</div>
        </div>

        {/* Today's Appointments */}
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-icon-wrap purple">
              <CalendarIcon />
            </div>
            <span className="kpi-pill info">Scheduled</span>
          </div>
          <div className="kpi-label">Today's Appointments</div>
          <div className="kpi-value">{loading ? "..." : summary.todayAppointments}</div>
          <div className="kpi-subtext">Vehicle inspections booked</div>
        </div>
      </div>

      {/* Middle Row: Performance Area Chart (Left) + Top Performing Employees (Right) */}
      <div className="dashboard-middle-grid">
        {/* Performance Chart Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-box">
              <h3>Performance</h3>
              <p>Lead generation and verification trend</p>
            </div>
            <div className="time-filter-pills">
              <button
                className={`time-pill-btn ${timeFilter === "week" ? "active" : ""}`}
                onClick={() => setTimeFilter("week")}
              >
                This Week
              </button>
              <button
                className={`time-pill-btn ${timeFilter === "month" ? "active" : ""}`}
                onClick={() => setTimeFilter("month")}
              >
                This Month
              </button>
              <button
                className={`time-pill-btn ${timeFilter === "year" ? "active" : ""}`}
                onClick={() => setTimeFilter("year")}
              >
                This Year
              </button>
            </div>
          </div>

          <div className="chart-container">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg">
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="navyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0a2540" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0a2540" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.5, 1].map((pct, i) => {
                const y = paddingY + innerH * pct;
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Area Fills */}
              {pointsLeads && (
                <polygon
                  points={`${paddingX},${chartHeight - paddingY} ${pointsLeads} ${chartWidth - paddingX},${chartHeight - paddingY}`}
                  fill="url(#cyanGrad)"
                />
              )}

              {/* Trend Polylines */}
              {pointsLeads && (
                <polyline
                  points={pointsLeads}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {pointsVerified && (
                <polyline
                  points={pointsVerified}
                  fill="none"
                  stroke="#0a2540"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="3 3"
                />
              )}

              {/* Data points & X Axis Labels */}
              {trendData.map((d, i) => {
                const step = innerW / Math.max(trendData.length - 1, 1);
                const x = paddingX + i * step;
                const yLead = chartHeight - paddingY - (d.leads / maxLeads) * innerH;
                return (
                  <g key={i}>
                    <circle cx={x} cy={yLead} r="3.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                    <text
                      x={x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#94a3b8"
                      fontWeight="500"
                    >
                      {d.day}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: "#0284c7" }} />
                <span>Total Leads Inquired</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: "#0a2540" }} />
                <span>Verified / Converted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Employees Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-box">
              <h3>Top Performing Employees</h3>
              <p>Ranked by conversion rate</p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate("/admin/performance")}
            >
              View All
            </button>
          </div>

          <div className="top-employees-list">
            {(summary.topEmployees || []).length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "12.5px", padding: "16px 0", textAlign: "center" }}>
                No employee records found. Create leads to populate performance rankings.
              </p>
            ) : (
              (summary.topEmployees || []).map((emp, i) => {
                const rankClass = emp.rank === 1 ? "rank-gold" : emp.rank === 2 ? "rank-silver" : emp.rank === 3 ? "rank-bronze" : "rank-default";
                return (
                  <div key={i} className={`employee-row-item ${rankClass}`}>
                    <div className="emp-left-col">
                      <span className={`emp-rank-badge ${rankClass}`}>#{emp.rank}</span>
                      <div className={`emp-avatar-circle ${rankClass}`}>
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="emp-name-role">
                        <h4 title={emp.name}>{emp.name}</h4>
                        <span className="emp-role-tag">{emp.role}</span>
                      </div>
                    </div>

                    <div className="emp-right-col">
                      <div className="emp-stat-chip leads" title={`${emp.leads} Total Inquiries Logged`}>
                        <span className="chip-num">{emp.leads}</span>
                        <span className="chip-txt">Leads</span>
                      </div>
                      <div className="emp-stat-chip converted" title={`${emp.converted} Verified / Converted Leads`}>
                        <span className="chip-num">{emp.converted}</span>
                        <span className="chip-txt">Won</span>
                      </div>
                      <span className="emp-conv-badge" title="Conversion Rate">
                        {emp.rate}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Leads Table */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="card-title-box">
            <h3>Recent Leads</h3>
            <p>Latest customer inquiries, appointments and inspections</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Search Input */}
            <div className="table-search-input">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search recent leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              className="form-control"
              style={{ width: "auto", fontSize: "12.5px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Verified">Verified</option>
            </select>

            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate("/admin/customers")}
            >
              View All Leads →
            </button>
          </div>
        </div>

        <div className="table-container">
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
                <th style={{ textAlign: "center", minWidth: "150px" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecentLeads.length === 0 ? (
                <tr>
                  <td colSpan="13" style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                    No recent leads found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRecentLeads.map((lead) => {
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
                          onClick={() => setActiveLeadDrawer(lead)}
                          title="Click to view full lead details"
                        >
                          {lead.appointmentId}
                        </span>
                      </td>

                      {/* 2. Lead Date */}
                      <td>
                        <span style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text-heading)" }}>
                          {lead.leadDate ? new Date(lead.leadDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          }) : lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          }) : "-"}
                        </span>
                      </td>

                      {/* 3. Appointment Date */}
                      <td>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: lead.appointmentDate ? "#0284c7" : "var(--text-muted)" }}>
                          {lead.appointmentDate ? new Date(lead.appointmentDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          }) : "-"}
                        </span>
                      </td>

                      {/* 4. Car Number */}
                      <td>
                        <span className="car-number-badge">
                          {lead.carNumber || "N/A"}
                        </span>
                      </td>

                      {/* 5. Oddo Meter/KM */}
                      <td>
                        <span className="odometer-badge">
                          {lead.odometerKm ? Number(lead.odometerKm).toLocaleString("en-IN") : "0"} <span className="unit">KM</span>
                        </span>
                      </td>

                      {/* 6. CX Name */}
                      <td>
                        <span className="cust-name">{lead.customerName}</span>
                      </td>

                      {/* 7. Cx Mobile No. */}
                      <td>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cust-phone"
                        >
                          <span>{lead.mobile}</span>
                        </a>
                      </td>

                      {/* 8. Lead By */}
                      <td>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-heading)" }}>
                          {lead.leadBy || "Executive"}
                        </span>
                      </td>

                      {/* 9. Follow Up Done By */}
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {lead.followUpBy || "-"}
                        </span>
                      </td>

                      {/* 10. Date of Follow-up */}
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          }) : "-"}
                        </span>
                      </td>

                      {/* 11. VERIFIED */}
                      <td>
                        <select
                          className={`badge-verified-pill ${statusKey} table-status-select`}
                          value={lead.verificationStatus || (lead.verified ? "Verified" : "Pending")}
                          onChange={(e) => handleRowStatusChange(lead, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          title="Quick update verification status"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Verified">Verified</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>

                      {/* 12. Timestamp (Last Data Column) */}
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          }) : "-"}
                        </span>
                      </td>

                      {/* 14. Actions (At the End, Non-sticky) */}
                      <td style={{ textAlign: "center", minWidth: "120px" }}>
                        <div className="table-actions" style={{ justifyContent: "center" }}>
                          <button
                            type="button"
                            className="btn-action btn-action-view"
                            title="View Details"
                            aria-label="View Details"
                            onClick={() => setActiveLeadDrawer(lead)}
                          >
                            <EyeIcon />
                          </button>

                          <button
                            type="button"
                            className="btn-action btn-action-edit"
                            title="Edit Lead"
                            aria-label="Edit Lead"
                            onClick={() => handleOpenEditLead(lead)}
                          >
                            <EditIcon />
                          </button>

                          <button
                            type="button"
                            className="btn-action btn-action-delete"
                            title="Delete Lead"
                            aria-label="Delete Lead"
                            onClick={() => handleDeleteLead(lead._id, lead.appointmentId)}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Drawer (Slide-in) */}
      {activeLeadDrawer && (
        <div className="drawer-backdrop" onClick={() => setActiveLeadDrawer(null)}>
          <div className="drawer-card" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="appointment-id-pill" style={{ marginBottom: 4 }}>
                  {activeLeadDrawer.appointmentId}
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-heading)", marginTop: 4 }}>
                  {activeLeadDrawer.customerName}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveLeadDrawer(null)}>
                <CloseIcon />
              </button>
            </div>

            <div className="drawer-body">
              <div className="detail-label-val">
                <span className="detail-label">Status</span>
                <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                  {["Pending", "Follow-up", "Verified"].map((st) => (
                    <button
                      key={st}
                      className={`btn btn-sm ${
                        activeLeadDrawer.verificationStatus === st ? "btn-primary" : "btn-secondary"
                      }`}
                      onClick={() => handleUpdateLeadStatus(st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="detail-label-val">
                <span className="detail-label">Customer Mobile</span>
                <span className="detail-value">{activeLeadDrawer.mobile}</span>
              </div>

              <div className="detail-label-val">
                <span className="detail-label">Car Registration / Model</span>
                <span className="detail-value">{activeLeadDrawer.carNumber || "Not specified"}</span>
              </div>

              <div className="detail-label-val">
                <span className="detail-label">Lead Registered By</span>
                <span className="detail-value">{activeLeadDrawer.leadBy || "Executive"}</span>
              </div>

              <div className="detail-label-val">
                <span className="detail-label">Appointment Date</span>
                <span className="detail-value">
                  {activeLeadDrawer.appointmentDate
                    ? new Date(activeLeadDrawer.appointmentDate).toLocaleString("en-IN")
                    : "Not scheduled yet"}
                </span>
              </div>

              <div className="detail-label-val">
                <span className="detail-label">Created At</span>
                <span className="detail-value">
                  {new Date(activeLeadDrawer.createdAt).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="drawer-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const leadToEdit = activeLeadDrawer;
                  setActiveLeadDrawer(null);
                  handleOpenEditLead(leadToEdit);
                }}
              >
                <EditIcon />
                Edit Lead
              </button>
              <button className="btn btn-primary" onClick={() => setActiveLeadDrawer(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "+ Add New Lead" Modal — Single Page Zero Scroll */}
      {showAddLeadModal && (
        <div className="modal-backdrop" onClick={() => setShowAddLeadModal(false)}>
          <div className="modal-card modal-card-compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: "12px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="badge badge-blue" style={{ fontSize: "11px", fontWeight: 700 }}>
                  NEW LEAD
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                  Add New Customer Lead
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddLeadModal(false)}>
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleCreateLead}>
              <div className="modal-body modal-body-compact">
                {/* 1. Customer & Vehicle */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>1. Customer &amp; Vehicle Information</span>
                  </div>
                  <div className="compact-grid-4">
                    <div className="form-group">
                      <label className="form-label">Customer Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Rahul Sharma"
                        required
                        value={newLeadForm.customerName}
                        onChange={(e) =>
                          setNewLeadForm({ ...newLeadForm, customerName: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mobile Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 9876543210"
                        required
                        value={newLeadForm.mobile}
                        onChange={(e) =>
                          setNewLeadForm({ ...newLeadForm, mobile: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Car Reg No. / Model</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. DL-01-AB-1234 / Swift"
                        value={newLeadForm.carNumber}
                        onChange={(e) =>
                          setNewLeadForm({ ...newLeadForm, carNumber: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Oddo Meter / KM</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 45000"
                        value={newLeadForm.odometerKm || ""}
                        onChange={(e) =>
                          setNewLeadForm({ ...newLeadForm, odometerKm: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Appointment & Assignment */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>2. Appointment &amp; Assignment</span>
                  </div>
                  <div className="compact-grid-4">
                    <div className="form-group">
                      <label className="form-label">Lead Date</label>
                      <div className="styled-picker-wrap">
                        <span className="picker-icon"><CalendarIcon /></span>
                        <input
                          type="date"
                          className="form-control"
                          value={newLeadForm.leadDate || ""}
                          onChange={(e) =>
                            setNewLeadForm({ ...newLeadForm, leadDate: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Appointment Date &amp; Time</label>
                      <div className="styled-picker-wrap">
                        <span className="picker-icon"><ClockIcon /></span>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={newLeadForm.appointmentDate}
                          onChange={(e) =>
                            setNewLeadForm({ ...newLeadForm, appointmentDate: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Lead By (Executive)</label>
                      <select
                        className="form-control"
                        value={newLeadForm.leadBy}
                        onChange={(e) =>
                          setNewLeadForm({ ...newLeadForm, leadBy: e.target.value })
                        }
                      >
                        <option value="">-- Select Executive --</option>
                        {employeesList.map((emp) => (
                          <option key={emp} value={emp}>
                            {emp}
                          </option>
                        ))}
                        {newLeadForm.leadBy && !employeesList.includes(newLeadForm.leadBy) && (
                          <option value={newLeadForm.leadBy}>{newLeadForm.leadBy}</option>
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Follow Up Done By</label>
                      <select
                        className="form-control"
                        value={newLeadForm.followUpBy || ""}
                        onChange={(e) =>
                          setNewLeadForm({ ...newLeadForm, followUpBy: e.target.value })
                        }
                      >
                        <option value="">-- Select Executive --</option>
                        {employeesList.map((emp) => (
                          <option key={emp} value={emp}>
                            {emp}
                          </option>
                        ))}
                        {newLeadForm.followUpBy && !employeesList.includes(newLeadForm.followUpBy) && (
                          <option value={newLeadForm.followUpBy}>{newLeadForm.followUpBy}</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Status & Remarks */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    <span>3. Follow-up, Verification &amp; Inspection Notes</span>
                  </div>
                  <div className="compact-grid-4">
                    <div className="form-group">
                      <label className="form-label">Date of Follow-up</label>
                      <div className="styled-picker-wrap">
                        <span className="picker-icon"><CalendarIcon /></span>
                        <input
                          type="date"
                          className="form-control"
                          value={newLeadForm.followUpDate || ""}
                          onChange={(e) =>
                            setNewLeadForm({ ...newLeadForm, followUpDate: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">VERIFIED (Status)</label>
                      <select
                        className="form-control"
                        value={newLeadForm.verificationStatus}
                        onChange={(e) =>
                          setNewLeadForm({ ...newLeadForm, verificationStatus: e.target.value })
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Verified">Verified</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="form-group col-span-2">
                      <label className="form-label">Remarks / Inspection Notes</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter customer requirement, car condition, budget..."
                        value={newLeadForm.remark}
                        onChange={(e) =>
                          setNewLeadForm({ ...newLeadForm, remark: e.target.value })
                        }
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
                  onClick={() => setShowAddLeadModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "6px 20px", fontSize: "13px" }}
                  disabled={submittingLead}
                >
                  {submittingLead ? "Saving..." : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead Modal (TL can edit all fields) — Single Page Zero Scroll */}
      {editLead && (
        <div className="modal-backdrop" onClick={() => setEditLead(null)}>
          <div className="modal-card modal-card-compact" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: "12px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="badge badge-blue" style={{ fontSize: "11px", fontWeight: 700 }}>
                  {editLead.appointmentId}
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                  Edit Lead &amp; Appointment (TL Mode)
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setEditLead(null)}>
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSaveEditLead}>
              <div className="modal-body modal-body-compact">
                {/* 1. Customer & Vehicle Details */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>1. Customer Information &amp; Vehicle Details</span>
                  </div>
                  <div className="compact-grid-4">
                    <div className="form-group">
                      <label className="form-label">Customer Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Ramesh Patel"
                        required
                        value={editLeadForm.customerName}
                        onChange={(e) =>
                          setEditLeadForm({ ...editLeadForm, customerName: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Cx Mobile No. *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 9876543210"
                        required
                        value={editLeadForm.mobile}
                        onChange={(e) =>
                          setEditLeadForm({ ...editLeadForm, mobile: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Car Reg No. / Model</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. DL-01-AB-1234"
                        value={editLeadForm.carNumber}
                        onChange={(e) =>
                          setEditLeadForm({ ...editLeadForm, carNumber: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Oddo Meter / KM</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 45000"
                        value={editLeadForm.odometerKm}
                        onChange={(e) =>
                          setEditLeadForm({ ...editLeadForm, odometerKm: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Appointment & Assignment */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>2. Appointment &amp; Assignment</span>
                  </div>
                  <div className="compact-grid-4">
                    <div className="form-group">
                      <label className="form-label">Lead Date</label>
                      <div className="styled-picker-wrap">
                        <span className="picker-icon"><CalendarIcon /></span>
                        <input
                          type="date"
                          className="form-control"
                          value={editLeadForm.leadDate}
                          onChange={(e) =>
                            setEditLeadForm({ ...editLeadForm, leadDate: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Appointment Date &amp; Time</label>
                      <div className="styled-picker-wrap">
                        <span className="picker-icon"><ClockIcon /></span>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={editLeadForm.appointmentDate}
                          onChange={(e) =>
                            setEditLeadForm({ ...editLeadForm, appointmentDate: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Lead By (Executive)</label>
                      <select
                        className="form-control"
                        value={editLeadForm.leadBy}
                        onChange={(e) =>
                          setEditLeadForm({ ...editLeadForm, leadBy: e.target.value })
                        }
                      >
                        <option value="">-- Select Executive --</option>
                        {employeesList.map((emp) => (
                          <option key={emp} value={emp}>
                            {emp}
                          </option>
                        ))}
                        {editLeadForm.leadBy && !employeesList.includes(editLeadForm.leadBy) && (
                          <option value={editLeadForm.leadBy}>{editLeadForm.leadBy}</option>
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Follow Up Done By</label>
                      <select
                        className="form-control"
                        value={editLeadForm.followUpBy}
                        onChange={(e) =>
                          setEditLeadForm({ ...editLeadForm, followUpBy: e.target.value })
                        }
                      >
                        <option value="">-- Select Executive --</option>
                        {employeesList.map((emp) => (
                          <option key={emp} value={emp}>
                            {emp}
                          </option>
                        ))}
                        {editLeadForm.followUpBy && !employeesList.includes(editLeadForm.followUpBy) && (
                          <option value={editLeadForm.followUpBy}>{editLeadForm.followUpBy}</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Follow-up & Remarks */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    <span>3. Follow-up, Verification &amp; Inspection Notes</span>
                  </div>
                  <div className="compact-grid-4">
                    <div className="form-group">
                      <label className="form-label">Date of Follow-up</label>
                      <div className="styled-picker-wrap">
                        <span className="picker-icon"><CalendarIcon /></span>
                        <input
                          type="date"
                          className="form-control"
                          value={editLeadForm.followUpDate}
                          onChange={(e) =>
                            setEditLeadForm({ ...editLeadForm, followUpDate: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">VERIFIED (Status)</label>
                      <select
                        className="form-control"
                        value={editLeadForm.verificationStatus}
                        onChange={(e) =>
                          setEditLeadForm({ ...editLeadForm, verificationStatus: e.target.value })
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Verified">Verified</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="form-group col-span-2">
                      <label className="form-label">Remarks / Inspection Notes</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Customer expectations, valuation offer, evaluation notes..."
                        value={editLeadForm.remark}
                        onChange={(e) =>
                          setEditLeadForm({ ...editLeadForm, remark: e.target.value })
                        }
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
                  onClick={() => setEditLead(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "6px 20px", fontSize: "13px" }}
                  disabled={submittingLead}
                >
                  {submittingLead ? "Saving..." : "Update Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
