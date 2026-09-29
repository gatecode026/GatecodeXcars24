"use client";

import { Suspense } from "react";
import AdminPerformancePage from "@/src/pages-components/AdminPerformancePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminPerformancePage />
    </Suspense>
  );
}
