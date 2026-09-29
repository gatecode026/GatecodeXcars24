import mongoose from "mongoose";
import dns from "node:dns/promises";

try {
  dns.setServers(["1.1.1.1"]);
} catch (_) {}

import fs from "node:fs";
import path from "node:path";

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

export const connectDB = async (timeoutMs = 10000) => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return cached.conn;
  }
  const rawUri = process.env.MONGO_URI;
  if (!rawUri) {
    throw new Error("MONGO_URI is missing in environment variables.");
  }
  const mongoUri = sanitizeMongoUri(rawUri);

  if (!cached.promise) {
    cached.promise = Promise.race([
      mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("MongoDB connection timed out")), timeoutMs))
    ])
      .then((m) => {
        console.log("MongoDB connected");
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
};
