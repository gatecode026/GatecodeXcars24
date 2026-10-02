import mongoose from "mongoose";
import dns from "node:dns/promises";
import dnsSync from "node:dns";

// Prefer IPv4 first to eliminate Windows IPv6 SRV DNS resolution timeouts for MongoDB Atlas
try {
  if (dnsSync && typeof dnsSync.setDefaultResultOrder === "function") {
    dnsSync.setDefaultResultOrder("ipv4first");
  }
} catch (_) {}

import fs from "node:fs";
import path from "node:path";

export const DEFAULT_MONGO_URI =
  "mongodb+srv://gatecode026:tBNyNzO68BNn3Zkn@cluster0.1meot8l.mongodb.net/gatecodecars24";

function loadEnvFallback() {
  if (process.env.MONGO_URI && process.env.JWT_SECRET) return;
  const envFiles = [".env.local", ".env", "server/.env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        content.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) return;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
      } catch (_) {}
    }
  }
}
loadEnvFallback();
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "mySuperSecretKey123";
}
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = DEFAULT_MONGO_URI;
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const isDatabaseReady = () => mongoose.connection.readyState === 1;

const sanitizeMongoUri = (uri) => {
  try {
    const url = new URL(uri.replace("mongodb+srv://", "mongodb://"));
    const dbName = url.pathname.replace(/^\//, "");
    if (dbName && /\s/.test(decodeURIComponent(dbName))) {
      const cleanDbName = decodeURIComponent(dbName).replace(/\s+/g, "_");
      return uri.replace(/\/[^/]+$/, `/${cleanDbName}`);
    }
  } catch {}
  return uri;
};

export const connectDB = async (timeoutMs = 8000) => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return cached.conn;
  }

  // If already connecting, await the existing connection promise rather than starting a duplicate
  if (cached.promise && mongoose.connection.readyState === 2) {
    try {
      return await cached.promise;
    } catch (_) {}
  }

  cached.conn = null;
  cached.promise = null;

  const rawUri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
  const mongoUri = sanitizeMongoUri(rawUri);

  cached.promise = Promise.race([
    mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000,
      maxPoolSize: 50,
      minPoolSize: 5,
      maxIdleTimeMS: 60000,
      socketTimeoutMS: 30000,
      family: 4
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("MongoDB connection timed out")), timeoutMs)
    )
  ])
    .then((m) => {
      console.log("MongoDB connected");
      cached.conn = m;
      return m;
    })
    .catch((err) => {
      cached.conn = null;
      cached.promise = null;
      throw err;
    });

  try {
    const conn = await cached.promise;
    return conn;
  } catch (err) {
    cached.conn = null;
    cached.promise = null;
    throw err;
  }
};

/**
 * ensureDB - tries connectDB if not ready, then checks again.
 * Returns true if DB is ready, false otherwise.
 * Use this instead of raw isDatabaseReady() in controllers.
 */
export const ensureDB = async () => {
  if (isDatabaseReady()) return true;
  try {
    await connectDB(8000);
  } catch (err) {
    console.error("ensureDB primary connection attempt:", err?.message || err);
    if (!isDatabaseReady()) {
      try {
        dns.setServers(["1.1.1.1", "8.8.8.8"]);
        await connectDB(8000);
      } catch (err2) {
        console.error("ensureDB fallback connection attempt:", err2?.message || err2);
      }
    }
  }
  return isDatabaseReady();
};
