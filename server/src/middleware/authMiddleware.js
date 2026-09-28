import fs from "node:fs";
import jwt from "jsonwebtoken";
import { isDatabaseReady } from "../config/db.js";
import { User } from "../models/User.js";

const logFile = new URL("../../debug.log", import.meta.url).pathname;
const debugLog = (msg) => {
  try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`); } catch (_) {}
};

const getFixedAdminUser = () => ({
  id: "admin-fallback",
  name: process.env.ADMIN_NAME || "RMAX Admin",
  email: process.env.ADMIN_EMAIL || "sales@rmaxiot.in",
  role: "admin"
});

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
};

export const protect = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized. Token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!isDatabaseReady()) {
      if (decoded.role !== "admin") {
        return res.status(401).json({ message: "Unauthorized. User not found." });
      }
      req.user = getFixedAdminUser();
      return next();
    }

    const user = await User.findById(decoded.id).select("-password").lean();
    if (user) {
      if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
        return res.status(401).json({ message: "Session expired. You have been logged out from another device." });
      }

      const adminEmail = process.env.ADMIN_EMAIL || "sales@rmaxiot.in";
      if (user.email?.toLowerCase() === adminEmail.toLowerCase()) {
        user.role = "admin";
      }
      req.user = user;
      return next();
    }

    const adminEmail = process.env.ADMIN_EMAIL || "sales@rmaxiot.in";
    if (decoded.role === "admin" || decoded.email === adminEmail) {
      req.user = getFixedAdminUser();
      return next();
    }

    return res.status(401).json({ message: "Unauthorized. User not found." });
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized. Invalid token." });
  }
};

export const adminOnly = (req, res, next) => {
  // Primary check: decode JWT directly
  const token = getTokenFromHeader(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const adminEmail = process.env.ADMIN_EMAIL || "sales@rmaxiot.in";
      debugLog(`adminOnly JWT check: role=${decoded.role}, email=${decoded.email}, adminEmail=${adminEmail}`);
      if (decoded.role === "admin" || decoded.email === adminEmail) {
        return next();
      }
      debugLog(`adminOnly JWT check FAILED`);
    } catch (e) {
      debugLog(`adminOnly JWT verify error: ${e.message}`);
    }
  } else {
    debugLog(`adminOnly: no token found in header`);
  }

  // Fallback: check req.user
  if (req.user) {
    const adminEmail = process.env.ADMIN_EMAIL || "sales@rmaxiot.in";
    debugLog(`adminOnly fallback: user.role=${req.user.role}, user.email=${req.user.email}`);
    if (req.user.role === "admin" || req.user.email?.toLowerCase() === adminEmail.toLowerCase()) {
      return next();
    }
    debugLog(`adminOnly fallback FAILED`);
  } else {
    debugLog(`adminOnly: no req.user`);
  }

  return res.status(403).json({ message: "Forbidden. Admin access required." });
};
