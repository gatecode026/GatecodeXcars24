"use client";

import { Suspense } from "react";
import OrderHistoryPage from "@/src/pages-components/OrderHistoryPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OrderHistoryPage />
    </Suspense>
  );
}
