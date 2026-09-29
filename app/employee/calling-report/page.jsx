"use client";

import { Suspense } from "react";
import EmployeeCallingPage from "@/src/pages-components/EmployeeCallingPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EmployeeCallingPage />
    </Suspense>
  );
}
