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
let cacheEpoch = Date.now();

// Cross-tab and cross-component real-time event bus
const syncListeners = new Set();
let broadcastChannel = null;

if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
  try {
    broadcastChannel = new BroadcastChannel("crm_realtime_sync_channel");
    broadcastChannel.onmessage = (evt) => {
      if (evt?.data) {
        clearApiCacheInternal();
        syncListeners.forEach((fn) => {
          try { fn(evt.data); } catch (e) { console.error("Broadcast sync listener error:", e); }
        });
      }
    };
  } catch (_) {}
}

const clearApiCacheInternal = (prefix = "") => {
  cacheEpoch = Date.now();
  inflightGetRequests.clear();
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

export const clearApiCache = (prefix = "") => {
  clearApiCacheInternal(prefix);
};

export const emitDataSync = (eventPayload = {}) => {
  clearApiCacheInternal();
  // Notify local subscribers in this tab
  syncListeners.forEach((fn) => {
    try { fn(eventPayload); } catch (e) { console.error("Local sync listener error:", e); }
  });
  // Notify other open tabs via BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(eventPayload);
    } catch (_) {}
  }
};

export const onDataSync = (callback) => {
  syncListeners.add(callback);
  return () => {
    syncListeners.delete(callback);
  };
};

// Override api.get to implement deduplication and micro-caching
const originalGet = api.get.bind(api);
api.get = function (url, config = {}) {
  // If skipCache, forceRefresh, or responseType is blob/stream, pass through directly
  if (config?.skipCache || config?.forceRefresh || config?.responseType === "blob") {
    return originalGet(url, config);
  }

  const currentToken = typeof window !== "undefined" ? (localStorage.getItem("dashboard_token") || "anon") : "server";
  const tokenSignature = currentToken.slice(-16);
  const cacheKey = `${tokenSignature}__${url}__${JSON.stringify(config?.params || {})}`;

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
  const requestStart = Date.now();
  const requestPromise = originalGet(url, config)
    .then((response) => {
      // Only cache if no mutation/cache invalidation occurred while this request was in flight
      if (requestStart >= cacheEpoch) {
        getResponseCache.set(cacheKey, {
          timestamp: Date.now(),
          response
        });
      }
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
    // On state-changing operations, invalidate relevant cached GET requests and broadcast sync
    const method = (res.config?.method || "").toLowerCase();
    if (method && method !== "get") {
      clearApiCacheInternal();
      const url = res.config?.url || "";
      let type = "general";
      if (url.includes("/customers")) type = "customer";
      else if (url.includes("/orders")) type = "order";
      else if (url.includes("/returns")) type = "return";
      else if (url.includes("/calling-records") || url.includes("/employee/calling-records")) type = "calling";
      else if (url.includes("/performance-settings")) type = "settings";
      else if (url.includes("/users")) type = "user";

      emitDataSync({ type, method, url, source: "interceptor" });
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
