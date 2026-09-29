"use client";

import { Suspense } from "react";
import AdminDashboardPage from "@/src/pages-components/AdminDashboardPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminDashboardPage />
    </Suspense>
  );
}
