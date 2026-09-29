"use client";

import { Suspense } from "react";
import WhatsAppNotificationsPage from "@/src/pages-components/WhatsAppNotificationsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <WhatsAppNotificationsPage />
    </Suspense>
  );
}
