"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import LoginPage from "@/src/pages-components/LoginPage";
import AdminDashboardPage from "@/src/pages-components/AdminDashboardPage";
import EmployeeDashboardPage from "@/src/pages-components/EmployeeDashboardPage";
import DashboardLayout from "@/src/components/DashboardLayout";
import EmployeeLayout from "@/src/components/EmployeeLayout";
import { SidebarProvider } from "@/src/context/SidebarContext";

export default function RootPage() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial client hydration (before mount), render identical placeholder to prevent mismatch
  if (!mounted || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc" }}>
        <div className="spinner-border" style={{ width: "36px", height: "36px", color: "#0284c7" }} />
      </div>
    );
  }

  // If authenticated user is present, render their role dashboard directly
  if (user && !user.guest) {
    if (user.role === "employee") {
      return (
        <SidebarProvider>
          <EmployeeLayout>
            <EmployeeDashboardPage />
          </EmployeeLayout>
        </SidebarProvider>
      );
    }
    return (
      <SidebarProvider>
        <DashboardLayout>
          <AdminDashboardPage />
        </DashboardLayout>
      </SidebarProvider>
    );
  }

  // For all guests / unauthenticated visitors, render the login page directly
  return <LoginPage />;
}
