import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL
});

export const toAbsoluteAssetUrl = (assetPath = "") => {
  if (!assetPath) return "";
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  return `${API_ORIGIN}${assetPath.startsWith("/") ? "" : "/"}${assetPath}`;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dashboard_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      const hadToken = localStorage.getItem("dashboard_token");
      localStorage.removeItem("dashboard_token");
      if (hadToken && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
