"use client";

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial client hydration (before mount), ALWAYS render identical loading placeholder
  if (!mounted || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc" }}>
        <div className="spinner-border" style={{ width: "36px", height: "36px", color: "#0284c7" }} />
      </div>
    );
  }

  if (!user || user.guest) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization: "admin" routes permit both admin and tl
  const isAuthorized =
    !role ||
    user.role === role ||
    (role === "admin" && (user.role === "admin" || user.role === "tl"));

  if (!isAuthorized) {
    return <Navigate to={user.role === "employee" ? "/employee/dashboard" : "/admin/dashboard"} replace />;
  }

  return children;
};

export default ProtectedRoute;
