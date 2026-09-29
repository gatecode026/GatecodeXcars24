"use client";

import { Suspense } from "react";
import EmployeeReturnPage from "@/src/pages-components/EmployeeReturnPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EmployeeReturnPage />
    </Suspense>
  );
}
