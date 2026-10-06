"use client";

import { useEffect } from "react";

export default function GlobalErrorPage({ error, reset }) {
  useEffect(() => {
    console.error("Application Render Error:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        padding: "24px",
        textAlign: "center",
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#fef2f2",
          color: "#ef4444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          fontWeight: 700,
          marginBottom: "16px",
          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)"
        }}
      >
        !
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
        Page Rendering Interrupted
      </h2>
      <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "420px", margin: "0 0 24px", lineHeight: 1.5 }}>
        {error?.message && !error.message.includes("minified React error")
          ? error.message
          : "The interface encountered a temporary synchronization issue. Click below to refresh."}
      </p>
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => (reset ? reset() : window.location.reload())}
          style={{
            background: "#0284c7",
            color: "#ffffff",
            border: "none",
            padding: "10px 22px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)"
          }}
        >
          Reload Page
        </button>
        <button
          onClick={() => (window.location.href = "/login")}
          style={{
            background: "#f1f5f9",
            color: "#334155",
            border: "1px solid #cbd5e1",
            padding: "10px 18px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
