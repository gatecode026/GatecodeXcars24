"use client";

import { Suspense } from "react";
import SalesPage from "@/src/pages-components/SalesPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SalesPage />
    </Suspense>
  );
}
