"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global Root Error:", error);
    // If it's a webpack chunk/module mismatch, auto-recover by reloading
    var msg = (error && error.message) ? error.message : "";
    if (msg.includes("reading 'call'") || msg.includes("ChunkLoadError") || msg.includes("Loading chunk")) {
      var last = sessionStorage.getItem("global_retry");
      var now = Date.now();
      if (!last || now - Number(last) > 5000) {
        sessionStorage.setItem("global_retry", String(now));
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, sans-serif", background: "#f8fafc" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "24px",
            textAlign: "center"
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#eff6ff",
              color: "#0284c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "16px",
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.15)"
            }}
          >
            ↻
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
            Application Reload Required
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "440px", margin: "0 0 24px", lineHeight: 1.5 }}>
            A newer version of the platform has been compiled. Click below to load the latest version.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#0284c7",
              color: "#ffffff",
              border: "none",
              padding: "10px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)"
            }}
          >
            Refresh Now
          </button>
        </div>
      </body>
    </html>
  );
}
