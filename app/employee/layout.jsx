"use client";

import ProtectedRoute from "@/src/components/ProtectedRoute";
import { SidebarProvider } from "@/src/context/SidebarContext";
import EmployeeLayout from "@/src/components/EmployeeLayout";

export default function EmployeeAppLayout({ children }) {
  return (
    <ProtectedRoute role="employee">
      <SidebarProvider>
        <EmployeeLayout>{children}</EmployeeLayout>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
