"use client";

import { Suspense } from "react";
import EmployeeCustomerPage from "@/src/pages-components/EmployeeCustomerPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EmployeeCustomerPage />
    </Suspense>
  );
}
