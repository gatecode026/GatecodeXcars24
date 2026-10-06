"use client";

import { Suspense } from "react";
import CustomersPage from "@/src/pages-components/CustomersPage";

const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
    <div className="spinner-border" style={{ width: "36px", height: "36px", color: "#0284c7" }} />
  </div>
);

export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <CustomersPage />
    </Suspense>
  );
}
