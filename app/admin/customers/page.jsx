"use client";

import { Suspense } from "react";
import CustomersPage from "@/src/pages-components/CustomersPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CustomersPage />
    </Suspense>
  );
}
