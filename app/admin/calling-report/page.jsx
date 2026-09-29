"use client";

import { Suspense } from "react";
import CallingReportPage from "@/src/pages-components/CallingReportPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CallingReportPage />
    </Suspense>
  );
}
