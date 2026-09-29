import axios from "axios";

const API_BASE_URL = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_BASE_URL || "/api")
  : (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api");

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL
});

export const toAbsoluteAssetUrl = (assetPath = "") => {
  if (!assetPath) return "";
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const normalized = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return `${API_ORIGIN}${normalized}`;
};

// In-flight deduplication and short-TTL response cache for ultra-fast loading
const inflightGetRequests = new Map();
const getResponseCache = new Map();
const CACHE_TTL_MS = 2500; // 2.5 seconds cache for instant tab transitions

export const clearApiCache = (prefix = "") => {
  if (!prefix) {
    getResponseCache.clear();
  } else {
    for (const key of getResponseCache.keys()) {
      if (key.includes(prefix)) {
        getResponseCache.delete(key);
      }
    }
  }
};

// Override api.get to implement deduplication and micro-caching
const originalGet = api.get.bind(api);
api.get = function (url, config = {}) {
  // If skipCache or responseType is blob/stream, pass through directly
  if (config?.skipCache || config?.responseType === "blob") {
    return originalGet(url, config);
  }

  const cacheKey = `${url}__${JSON.stringify(config?.params || {})}`;

  // Check recent cached response
  const cached = getResponseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return Promise.resolve(cached.response);
  }

  // Check if identical request is currently in-flight
  if (inflightGetRequests.has(cacheKey)) {
    return inflightGetRequests.get(cacheKey);
  }

  // Dispatch new request and track promise
  const requestPromise = originalGet(url, config)
    .then((response) => {
      getResponseCache.set(cacheKey, {
        timestamp: Date.now(),
        response
      });
      return response;
    })
    .finally(() => {
      inflightGetRequests.delete(cacheKey);
    });

  inflightGetRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("dashboard_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    // On state-changing operations, invalidate relevant cached GET requests
    const method = (res.config?.method || "").toLowerCase();
    if (method && method !== "get") {
      clearApiCache();
    }
    return res;
  },
  (err) => {
    if (typeof window !== "undefined") {
      const isLoginRequest = err.config?.url?.includes("/auth/login");
      // Only 401 (Unauthorized / expired token) should clear the session, NEVER 403 (Forbidden)
      if (err.response?.status === 401 && !isLoginRequest) {
        const hadToken = localStorage.getItem("dashboard_token");
        localStorage.removeItem("dashboard_token");
        clearApiCache();
        if (hadToken && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);
