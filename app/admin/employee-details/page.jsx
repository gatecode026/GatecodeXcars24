"use client";

import { Suspense } from "react";
import EmployeeDetailsPage from "@/src/pages-components/EmployeeDetailsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EmployeeDetailsPage />
    </Suspense>
  );
}
