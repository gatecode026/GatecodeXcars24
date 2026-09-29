"use client";

import { Suspense } from "react";
import ReturnManagePage from "@/src/pages-components/ReturnManagePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReturnManagePage />
    </Suspense>
  );
}
