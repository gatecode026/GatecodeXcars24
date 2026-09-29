"use client";

import { Suspense } from "react";
import ActivityLogsPage from "@/src/pages-components/ActivityLogsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ActivityLogsPage />
    </Suspense>
  );
}
