"use client";

import { Suspense } from "react";
import ReturnPage from "@/src/pages-components/ReturnPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReturnPage />
    </Suspense>
  );
}
