"use client";

import { usePathname } from "next/navigation";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import { SidebarProvider } from "@/src/context/SidebarContext";
import DashboardLayout from "@/src/components/DashboardLayout";

export default function AdminAppLayout({ children }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute role="admin">
      <SidebarProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
