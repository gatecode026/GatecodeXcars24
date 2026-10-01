"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api, clearApiCache } from "../api/client";

const AuthContext = createContext(null);

const decodeToken = (token) => {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const decodedStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(decodedStr);
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }
    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Start with null, not a guest user
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      let token = null;
      try {
        token = localStorage.getItem("dashboard_token");
      } catch {}

      if (token) {
        const decoded = decodeToken(token);
        if (decoded) {
          setUser(decoded);
          setLoading(false);
          return;
        }
        // Bad/corrupted token — remove it
        try {
          localStorage.removeItem("dashboard_token");
        } catch {}
      }

      // No valid token - set user to null (not logged in)
      setUser(null);
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password, role) => {
    try {
      const payload = { email, password };
      if (role) payload.role = role;
      const res = await api.post("/auth/login", payload);
      const { token, user: serverUser } = res.data;
      if (token) {
        localStorage.setItem("dashboard_token", token);
      }
      clearApiCache();

      const decoded = decodeToken(token) || serverUser;
      setUser(decoded);

      return decoded;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("dashboard_token");
    clearApiCache();
    setUser(null);
  }, []);

  const updateUserData = useCallback((updatedFields, newToken) => {
    if (newToken) {
      localStorage.setItem("dashboard_token", newToken);
      const decoded = decodeToken(newToken);
      if (decoded) {
        setUser(decoded);
        return;
      }
    }
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : updatedFields));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
