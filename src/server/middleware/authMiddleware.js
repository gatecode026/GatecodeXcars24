import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ensureDB } from "../config/db.js";
import { User } from "../models/User.js";

const getTokenFromHeader = (req) => {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1]?.trim() || null;
};

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: JWT_SECRET environment variable is missing.");
    }
    console.warn("[Security Warning] JWT_SECRET environment variable is not defined.");
  }
  return secret || "dev-fallback-local-only-replace-immediately";
};

export const protect = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized. Token missing." });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const adminEmail = (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase().trim();

    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(503).json({ message: "Database temporarily unavailable." });
    }

    let user = null;

    // 1. Direct ObjectId lookup
    if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
      user = await User.findById(decoded.id).select("-password").lean();
    }

    // 2. Admin lookup fallback if token has admin email or role
    if (!user && (decoded.role === "admin" || (decoded.email && decoded.email.toLowerCase() === adminEmail))) {
      user = await User.findOne({
        $or: [
          { email: adminEmail },
          { role: "admin" }
        ],
        isDeleted: { $ne: true }
      }).select("-password").lean();
    }

    if (!user) {
      return res.status(401).json({ message: "Unauthorized. User account not found." });
    }

    if (user.isDeleted) {
      return res.status(403).json({ message: "Forbidden. Account deactivated." });
    }

    // Token version revocation check
    if (user.tokenVersion && (decoded.tokenVersion === undefined || user.tokenVersion > decoded.tokenVersion)) {
      return res.status(401).json({ message: "Session expired. You have been logged out." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized. Invalid or expired token." });
  }
};

/**
 * Strict Admin-Only authorization check.
 * Crucial Security Fix: Team Leaders (TL) are NEVER granted adminOnly access.
 */
export const adminOnly = (req, res, next) => {
  const adminEmail = (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase().trim();

  if (req.user) {
    const userRole = (req.user.role || "").toLowerCase();
    const userEmail = (req.user.email || "").toLowerCase().trim();
    if (
      userRole === "admin" ||
      userRole === "superadmin" ||
      userEmail === adminEmail
    ) {
      return next();
    }
  }

  return res.status(403).json({ message: "Forbidden. Administrative privileges required." });
};

/**
 * Team Leader or Admin access for operational supervision views.
 */
export const teamLeaderOrAdmin = (req, res, next) => {
  const adminEmail = (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase().trim();

  if (req.user) {
    const userRole = (req.user.role || "").toLowerCase();
    const userEmail = (req.user.email || "").toLowerCase().trim();
    if (
      userRole === "admin" ||
      userRole === "superadmin" ||
      userRole === "tl" ||
      userRole === "manager" ||
      userEmail === adminEmail
    ) {
      return next();
    }
  }

  return res.status(403).json({ message: "Forbidden. Admin or Team Leader access required." });
};
