"use client";

import { Suspense } from "react";
import EmployeeDashboardPage from "@/src/pages-components/EmployeeDashboardPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EmployeeDashboardPage />
    </Suspense>
  );
}
