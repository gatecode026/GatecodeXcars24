"use client";

import { Suspense } from "react";
import ReturnHistoryPage from "@/src/pages-components/ReturnHistoryPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReturnHistoryPage />
    </Suspense>
  );
}
