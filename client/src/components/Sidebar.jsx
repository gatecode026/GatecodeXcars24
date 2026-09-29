import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";

// Clean line icons inspired by reference
const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const LeadsIcon = () => (
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

const VerifiedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const CarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H7.5a1 1 0 0 0-.8.4L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3" />
    <circle cx="6.5" cy="16.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
);

const SalesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);

const PerformanceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const LogIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ChevronDown = ({ open }) => (
  <svg
    viewBox="0 0 24 24"
    style={{
      width: 14,
      height: 14,
      marginLeft: "auto",
      transform: open ? "rotate(0deg)" : "rotate(-90deg)",
      transition: "transform 0.2s"
    }}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { sidebarOpen, closeSidebar } = useSidebar();
  const navigate = useNavigate();
  const [reportsOpen, setReportsOpen] = useState(true);

  const handleLogout = () => {
    const loginPath = localStorage.getItem("dashboard_login_path") || "/login";
    logout();
    navigate(loginPath, { replace: true });
  };

  const userName = user?.name || user?.email || "Admin";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      <div className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={closeSidebar} />
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <img src="/logo.jpg" alt="GatecodeXcars24" className="sidebar-brand-img" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="sidebar-header-info">
            <h3>GatecodeXcars24</h3>
            <span>Buy &amp; Sell Cars</span>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="sidebar-nav" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <span className="sidebar-section-label">Main</span>
          <NavLink to="/admin/dashboard" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon"><DashboardIcon /></span>
            Dashboard
          </NavLink>
          <NavLink to="/admin/customers" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon"><CalendarIcon /></span>
            Appointments
          </NavLink>
          <NavLink to="/admin/orders/manage" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon"><CarIcon /></span>
            Cars Purchased
          </NavLink>
          <NavLink to="/admin/sales" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon"><SalesIcon /></span>
            Cars Sold
          </NavLink>

          <span className="sidebar-section-label">Team</span>
          <NavLink to="/admin/users" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon"><UsersIcon /></span>
            Employees
          </NavLink>
          <NavLink to="/admin/performance" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon"><PerformanceIcon /></span>
            Employee Performance
          </NavLink>

          <span className="sidebar-section-label">Reports &amp; Operations</span>
          <NavLink to="/admin/calling-report" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon"><PerformanceIcon /></span>
            Telecalling Report
          </NavLink>

          <span className="sidebar-section-label">Communication</span>
          <NavLink to="/admin/whatsapp" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon"><WhatsAppIcon /></span>
            WhatsApp
          </NavLink>

          <span className="sidebar-section-label">System</span>
          <NavLink to="/admin/activity-logs" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon"><LogIcon /></span>
            Activity Logs
          </NavLink>
        </nav>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{userInitial}</div>
            <div className="sidebar-user-info">
              <p>{userName}</p>
              <span>{user?.role === "admin" ? "Administrator" : "Operations"}</span>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Logout">
            <LogoutIcon />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
