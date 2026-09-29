"use client";

import { Suspense } from "react";
import EmployeeProfilePage from "@/src/pages-components/EmployeeProfilePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EmployeeProfilePage />
    </Suspense>
  );
}
