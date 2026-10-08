"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DataManagementRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/data-management");
  }, [router]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc" }}>
      <div className="spinner-border" style={{ width: "36px", height: "36px", color: "#0284c7" }} />
    </div>
  );
}
