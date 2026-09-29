"use client";

import { Suspense } from "react";
import EmployeePerformancePage from "@/src/pages-components/EmployeePerformancePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EmployeePerformancePage />
    </Suspense>
  );
}
