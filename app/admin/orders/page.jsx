"use client";

import { Suspense } from "react";
import OrderPage from "@/src/pages-components/OrderPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OrderPage />
    </Suspense>
  );
}
