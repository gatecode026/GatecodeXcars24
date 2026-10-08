"use client";

import { Suspense } from "react";
import DataManagementPage from "@/src/pages-components/DataManagementPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div className="spinner-border" style={{ width: "36px", height: "36px", color: "#0284c7" }} />
        </div>
      }
    >
      <DataManagementPage />
    </Suspense>
  );
}
