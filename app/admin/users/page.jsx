"use client";

import { Suspense } from "react";
import UsersPage from "@/src/pages-components/UsersPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <UsersPage />
    </Suspense>
  );
}
