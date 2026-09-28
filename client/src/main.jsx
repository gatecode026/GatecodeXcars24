// main.jsx - Back to normal
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Component } from "react";
import App from "./App";
import "./styles/index.css";

console.log("[main.jsx] Script loaded");

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#ef4444",
          fontSize: "18px",
          padding: "40px",
          textAlign: "center",
          flexDirection: "column",
          gap: "12px"
        }}>
          <div style={{ fontSize: "24px" }}>⚠️ Application Error</div>
          <div style={{ color: "#f87171" }}>{this.state.error?.message || "Unknown error"}</div>
          <button
            onClick={() => { localStorage.removeItem("dashboard_token"); window.location.reload(); }}
            style={{
              marginTop: "16px",
              padding: "10px 24px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Clear Token & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById("root");
console.log("[main.jsx] #root element:", root);

createRoot(root).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);

console.log("[main.jsx] render() called");