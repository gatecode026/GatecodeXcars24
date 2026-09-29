"use client";

import { Suspense } from "react";
import RevenuePage from "@/src/pages-components/RevenuePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RevenuePage />
    </Suspense>
  );
}
