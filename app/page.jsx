"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user && !user.guest) {
      if (user.role === "employee") {
        router.replace("/employee/dashboard");
      } else {
        router.replace("/admin/dashboard");
      }
    } else {
      router.replace("/login");
    }
  }, [user, loading, router]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc" }}>
      <div className="spinner-border" style={{ width: "36px", height: "36px", color: "#0284c7" }} />
    </div>
  );
}
