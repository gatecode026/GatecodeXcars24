"use client";
import { useState } from "react";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LiveActivityPanel from "./LiveActivityPanel";

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const HamburgerIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const TopNavbar = () => {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const userName = user?.name || user?.email || "Admin";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleGlobalSearch = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      navigate(`/admin/customers?search=${encodeURIComponent(e.target.value.trim())}`);
    }
  };

  const [showActivityDrawer, setShowActivityDrawer] = useState(false);

  return (
    <>
      <header className="top-navbar">
        <div className="top-navbar-left">
          <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle navigation">
            <HamburgerIcon />
          </button>

          <div className="top-navbar-search">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by Appointment ID, Customer Name, Car Number..."
              onKeyDown={handleGlobalSearch}
            />
          </div>
        </div>

        <div className="top-navbar-right">
          <button
            className="live-pulse-badge"
            style={{ cursor: "pointer" }}
            onClick={() => setShowActivityDrawer(true)}
            title="Open Live Operations Feed"
          >
            <span className="live-pulse-dot" />
            Live
          </button>

          <span className="date-badge" suppressHydrationWarning>
            <CalendarIcon />
            {today}
          </span>

          <button
            className="top-nav-action-btn"
            title="WhatsApp Hub"
            onClick={() => navigate("/admin/whatsapp")}
          >
            <WhatsAppIcon />
          </button>

          <button
            className="top-nav-action-btn"
            title="Live Activity & Notifications"
            onClick={() => setShowActivityDrawer(true)}
          >
            <BellIcon />
            <span className="notification-dot" />
          </button>

          <div
            className="top-navbar-user-chip"
            onClick={() => navigate("/admin/profile")}
            style={{ cursor: "pointer" }}
            title={`Account Settings & Profile — Logged in as ${userName}`}
            suppressHydrationWarning
          >
            <div className="top-user-avatar" suppressHydrationWarning>{userInitial}</div>
            <span className="top-user-name" suppressHydrationWarning>{userName}</span>
          </div>
        </div>
      </header>

      <LiveActivityPanel
        isOpen={showActivityDrawer}
        onClose={() => setShowActivityDrawer(false)}
      />
    </>
  );
};

export default TopNavbar;
