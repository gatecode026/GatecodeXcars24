"use client";

import { Suspense } from "react";
import OrderManagePage from "@/src/pages-components/OrderManagePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OrderManagePage />
    </Suspense>
  );
}
