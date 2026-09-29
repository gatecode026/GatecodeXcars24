"use client";

import { Suspense } from "react";
import RegisterPage from "@/src/pages-components/RegisterPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RegisterPage />
    </Suspense>
  );
}
