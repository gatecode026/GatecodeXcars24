"use client";

import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import EmployeeSidebar from "./EmployeeSidebar";
import EmployeeTopNavbar from "./EmployeeTopNavbar";

const EmployeeLayout = ({ children }) => {
  const { closeSidebar } = useSidebar();
  const location = useLocation();

  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  return (
    <div className="app-shell">
      <EmployeeSidebar />
      <div className="main-area main-content">
        <EmployeeTopNavbar />
        <main className="content-area">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
