/**
 * High-Performance Server-Side Micro-Cache
 * Keeps query results in RAM for 8-15s to eliminate repeated database roundtrips
 * and network latency during rapid table viewing, filtering, and tab switching.
 */

const registeredCaches = new Map();

export const createMicroCache = (name, ttlMs = 10000) => {
  const store = new Map();
  registeredCaches.set(name, store);

  return {
    get: (key) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() - entry.timestamp > ttlMs) {
        store.delete(key);
        return null;
      }
      return entry.data;
    },
    set: (key, data) => {
      // Keep store size bounded to prevent memory growth
      if (store.size > 200) {
        const firstKey = store.keys().next().value;
        store.delete(firstKey);
      }
      store.set(key, { timestamp: Date.now(), data });
    },
    clear: () => {
      store.clear();
    }
  };
};

export const clearAllServerCaches = () => {
  for (const store of registeredCaches.values()) {
    store.clear();
  }
};
