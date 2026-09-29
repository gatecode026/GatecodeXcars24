"use client";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";

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

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const OrderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H7.5a1 1 0 0 0-.8.4L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3" />
    <circle cx="6.5" cy="16.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
);

const ReturnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const EmployeeSidebar = () => {
  const { user, logout } = useAuth();
  const { sidebarOpen, closeSidebar } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => {
    const loginPath = localStorage.getItem("dashboard_login_path") || "/login";
    logout();
    navigate(loginPath, { replace: true });
  };

  const userName = user?.name || user?.email || "Executive";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      <div className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={closeSidebar} />
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <img src="/logo.jpg" alt="GatecodeXcars24" className="sidebar-brand-img" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="sidebar-header-info">
            <h3>GatecodeXcars24</h3>
            <span>Executive Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <span className="sidebar-section-label">Operations</span>
          <NavLink to="/employee/dashboard" className="sidebar-link" end onClick={closeSidebar}>
            <span className="sidebar-icon"><DashboardIcon /></span>
            Dashboard
          </NavLink>
          <NavLink to="/employee/customers" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon"><LeadsIcon /></span>
            Leads &amp; Inquiries
          </NavLink>
          <NavLink to="/employee/calling-report" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon"><PhoneIcon /></span>
            Telecalling Records
          </NavLink>
          <NavLink to="/employee/orders" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon"><OrderIcon /></span>
            Cars Purchased
          </NavLink>
          <NavLink to="/employee/returns" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon"><ReturnIcon /></span>
            Returns &amp; Issues
          </NavLink>
          <NavLink to="/employee/performance" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
              </svg>
            </span>
            My Performance
          </NavLink>

          <span className="sidebar-section-label" style={{ marginTop: "16px" }}>Account</span>
          <NavLink to="/employee/profile" className="sidebar-link" onClick={closeSidebar}>
            <span className="sidebar-icon"><UserIcon /></span>
            My Profile
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div
            className="sidebar-user"
            onClick={() => {
              closeSidebar();
              navigate("/employee/profile");
            }}
            style={{ cursor: "pointer" }}
            title="Manage Executive Profile"
          >
            <div className="sidebar-user-avatar" suppressHydrationWarning>{userInitial}</div>
            <div className="sidebar-user-info">
              <p suppressHydrationWarning>{userName}</p>
              <span>Sales Executive</span>
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

export default EmployeeSidebar;
