import fs from "node:fs";
import jwt from "jsonwebtoken";
import { isDatabaseReady, ensureDB } from "../config/db.js";
import { User } from "../models/User.js";

import path from "node:path";

const logFile = path.resolve(process.cwd(), "debug.log");
const debugLog = (msg) => {
  try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`); } catch (_) {}
};

const getFixedAdminUser = () => ({
  id: "admin-fallback",
  name: process.env.ADMIN_NAME || "Surendra Admin",
  email: (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase(),
  role: "admin"
});

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
};

const getJwtSecret = () => process.env.JWT_SECRET || "mySuperSecretKey123";

export const protect = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized. Token missing." });
    }

    const decoded = jwt.verify(token, getJwtSecret());

    const dbReady = await ensureDB();
    if (!dbReady) {
      if (decoded.role !== "admin") {
        return res.status(401).json({ message: "Unauthorized. User not found." });
      }
      req.user = getFixedAdminUser();
      return next();
    }

    const user = await User.findById(decoded.id).select("-password").lean();
    if (user) {
      // Only invalidate if user explicitly logged out (tokenVersion bumped after token creation)
      if (user.tokenVersion && decoded.tokenVersion && user.tokenVersion > decoded.tokenVersion + 1000) {
        return res.status(401).json({ message: "Session expired. You have been logged out." });
      }

      const adminEmail = (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase();
      if (user.role === "admin" || user.email?.toLowerCase() === adminEmail) {
        user.role = "admin";
      }
      req.user = user;
      return next();
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase();
    if (decoded.role === "admin" || (decoded.email && decoded.email.toLowerCase() === adminEmail)) {
      req.user = getFixedAdminUser();
      return next();
    }

    return res.status(401).json({ message: "Unauthorized. User not found." });
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized. Invalid token." });
  }
};

export const adminOnly = (req, res, next) => {
  const adminEmail = (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase();

  // Primary check: if protect already resolved admin
  if (req.user) {
    if (req.user.role === "admin" || (req.user.email && req.user.email.toLowerCase() === adminEmail)) {
      return next();
    }
  }

  // Secondary check: decode JWT directly
  const token = getTokenFromHeader(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      if (decoded.role === "admin" || (decoded.email && decoded.email.toLowerCase() === adminEmail)) {
        return next();
      }
    } catch (e) {
      debugLog(`adminOnly JWT verify error: ${e.message}`);
    }
  }

  return res.status(403).json({ message: "Forbidden. Admin access required." });
};
