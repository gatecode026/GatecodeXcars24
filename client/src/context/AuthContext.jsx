import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
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
      const { token } = res.data;
      localStorage.setItem("dashboard_token", token);

      const decoded = decodeToken(token);
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
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
