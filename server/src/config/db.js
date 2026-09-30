import mongoose from "mongoose";
import dns from "node:dns/promises";

export const DEFAULT_MONGO_URI =
  "mongodb+srv://gatecode026:tBNyNzO68BNn3Zkn@cluster0.1meot8l.mongodb.net/gatecodecars24";

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

export const connectDB = async (timeoutMs = 15000) => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  const rawUri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
  const mongoUri = sanitizeMongoUri(rawUri);
  await Promise.race([
    mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 50,
      minPoolSize: 5,
      maxIdleTimeMS: 60000,
      socketTimeoutMS: 45000,
      family: 4
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("MongoDB connection timed out")), timeoutMs)
    )
  ]);
  console.log("MongoDB connected");
};

export const ensureDB = async () => {
  if (isDatabaseReady()) return true;
  try {
    await connectDB(15000);
  } catch (err) {
    console.error("ensureDB primary connect attempt:", err?.message || err);
    if (!isDatabaseReady()) {
      try {
        dns.setServers(["1.1.1.1", "8.8.8.8"]);
        await connectDB(15000);
      } catch (err2) {
        console.error("ensureDB fallback connect attempt:", err2?.message || err2);
      }
    }
  }
  return isDatabaseReady();
};
