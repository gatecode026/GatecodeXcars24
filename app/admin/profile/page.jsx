"use client";

import { Suspense } from "react";
import AdminProfilePage from "@/src/pages-components/AdminProfilePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminProfilePage />
    </Suspense>
  );
}
