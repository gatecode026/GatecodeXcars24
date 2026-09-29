"use client";

import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import Sidebar from "./Sidebar.jsx";
import TopNavbar from "./TopNavbar.jsx";

const DashboardLayout = ({ children }) => {
  const { closeSidebar } = useSidebar();
  const location = useLocation();

  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area main-content">
        <TopNavbar />
        <main className="content-area">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
