"use client";

import { Suspense } from "react";
import EmployeeOrderPage from "@/src/pages-components/EmployeeOrderPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EmployeeOrderPage />
    </Suspense>
  );
}
