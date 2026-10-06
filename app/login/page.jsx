"use client";

import { Suspense } from "react";
import LoginPage from "@/src/pages-components/LoginPage";

const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc" }}>
    <div className="spinner-border" style={{ width: "36px", height: "36px", color: "#0284c7" }} />
  </div>
);

export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <LoginPage />
    </Suspense>
  );
}
