import fs from "node:fs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { isDatabaseReady, ensureDB } from "../config/db.js";
import { User } from "../models/User.js";

import path from "node:path";

const logFile = path.resolve(process.cwd(), "debug.log");
const debugLog = (msg) => {
  try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`); } catch (_) {}
};

const getFixedAdminUser = () => ({
  id: "admin-fallback",
  _id: "admin-fallback",
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
    const adminEmail = (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase();

    // 1. Admin/TL token handling (supports fallback ID and valid ObjectIds without CastError)
    const isAdmin =
      decoded.role === "admin" ||
      decoded.role === "tl" ||
      (decoded.email && decoded.email.toLowerCase() === adminEmail) ||
      decoded.id === "admin-fallback";

    if (isAdmin) {
      if (decoded.id && decoded.id !== "admin-fallback" && mongoose.Types.ObjectId.isValid(decoded.id)) {
        try {
          const user = await User.findById(decoded.id).select("-password").lean();
          if (user) {
            user.role = user.role || decoded.role || "admin";
            req.user = user;
            return next();
          }
        } catch (_) {}
      }
      const fallbackUser = getFixedAdminUser();
      if (decoded.role === "tl") {
        fallbackUser.role = "tl";
        fallbackUser.name = decoded.name || "Team Leader";
      }
      req.user = fallbackUser;
      return next();
    }

    // 2. Regular employee lookup
    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    if (!decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    const user = await User.findById(decoded.id).select("-password").lean();
    if (user) {
      if (user.tokenVersion && (decoded.tokenVersion === undefined || user.tokenVersion > decoded.tokenVersion)) {
        return res.status(401).json({ message: "Session expired. You have been logged out." });
      }

      req.user = user;
      return next();
    }

    return res.status(401).json({ message: "Unauthorized. User not found." });
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized. Invalid token." });
  }
};

export const adminOnly = (req, res, next) => {
  const adminEmail = (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase();

  // Primary check: if protect already resolved admin or tl
  if (req.user) {
    if (
      req.user.role === "admin" ||
      req.user.role === "tl" ||
      (req.user.email && req.user.email.toLowerCase() === adminEmail)
    ) {
      return next();
    }
  }

  // Secondary check: decode JWT directly
  const token = getTokenFromHeader(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      if (
        decoded.role === "admin" ||
        decoded.role === "tl" ||
        (decoded.email && decoded.email.toLowerCase() === adminEmail)
      ) {
        return next();
      }
    } catch (e) {
      debugLog(`adminOnly JWT verify error: ${e.message}`);
    }
  }

  return res.status(403).json({ message: "Forbidden. Admin or TL access required." });
};
