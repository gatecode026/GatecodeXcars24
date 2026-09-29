import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isDatabaseReady } from "../config/db.js";
import { User } from "../models/User.js";

const getFixedAdminUser = () => ({
  id: "admin-fallback",
  name: process.env.ADMIN_NAME || "RMAX Admin",
  email: process.env.ADMIN_EMAIL || "sales@rmaxiot.in",
  role: "admin"
});

const isFixedAdminCredentials = (email, password) =>
  email === (process.env.ADMIN_EMAIL || "sales@rmaxiot.in") &&
  password === (process.env.ADMIN_PASSWORD || "rmax@2026");

const getJwtSecret = () => process.env.JWT_SECRET || "mySuperSecretKey123";

const signToken = (user) =>
  jwt.sign(
    { id: user.id || user._id, name: user.name, email: user.email, role: user.role, tokenVersion: user.tokenVersion ?? 0 },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

export const registerUser = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable. Cannot register user." });
    }

    const { name, email, password, phoneNumber, username, role } = req.body;
    const assignedRole = ["admin", "employee"].includes(role) ? role : "user";

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? "Email" : "Username";
      return res.status(409).json({ message: `${field} already registered` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      username,
      role: assignedRole
    });

    return res.status(201).json({
      message: "User registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    // Critical Security: Exclude the requesting active user (Admin / TL) from the subordinate employee list
    const currentUserId = req.user?._id || req.user?.id;
    const currentUserEmail = (req.user?.email || "").toLowerCase();

    const query = {};
    const filters = [];
    if (currentUserId && currentUserId !== "admin-fallback") {
      filters.push({ _id: { $ne: currentUserId } });
    }
    if (currentUserEmail) {
      filters.push({ email: { $ne: currentUserEmail } });
    }
    if (filters.length > 0) {
      query.$and = filters;
    }

    const users = await User.find(query, { password: 0 }).sort({ createdAt: -1 });
    return res.status(200).json({ data: users });
  } catch (error) {
    return next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }
    const user = await User.findById(req.params.id, { password: 0 });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ data: user });
  } catch (error) {
    return next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const { name, email, phoneNumber, username, role, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const masterAdminEmail = (process.env.ADMIN_EMAIL || "sales@rmaxiot.in").toLowerCase();
    if (user.email?.toLowerCase() === masterAdminEmail && role && role !== "admin") {
      return res.status(403).json({ message: "Critical Security Error: Cannot demote the primary administrator account." });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ message: "Email already in use" });
    }
    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) return res.status(409).json({ message: "Username already in use" });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (username !== undefined) user.username = username;
    if (role !== undefined) user.role = role;
    if (password && password.trim()) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const masterAdminEmail = (process.env.ADMIN_EMAIL || "sales@rmaxiot.in").toLowerCase();
    if (targetUser.email?.toLowerCase() === masterAdminEmail) {
      return res.status(403).json({ message: "Critical Security Error: Primary administrator account cannot be deleted." });
    }

    const currentUserId = req.user?._id || req.user?.id;
    const currentUserEmail = (req.user?.email || "").toLowerCase();

    if (
      (currentUserId && String(currentUserId) === String(targetUser._id)) ||
      (currentUserEmail && currentUserEmail === targetUser.email?.toLowerCase())
    ) {
      return res.status(403).json({ message: "Critical Security Error: You cannot delete your own active logged-in account." });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!isDatabaseReady()) {
      if (role === "employee") {
        return res.status(503).json({ message: "Database offline. Employee login unavailable." });
      }

      if (!isFixedAdminCredentials(email, password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const adminUser = getFixedAdminUser();
      return res.status(200).json({
        message: "Login successful",
        token: signToken(adminUser),
        user: adminUser
      });
    }

    const normalizedInput = String(email || "").toLowerCase().trim();
    const cleanPassword = String(password || "");

    const user = await User.findOne({
      $or: [
        { email: normalizedInput },
        { username: { $regex: new RegExp(`^${normalizedInput}$`, "i") } }
      ]
    });

    if (user) {
      const ok = await bcrypt.compare(cleanPassword, user.password);
      if (!ok) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const adminEmail = (process.env.ADMIN_EMAIL || "sales@rmaxiot.in").toLowerCase();
      const userRole = user.email.toLowerCase() === adminEmail ? "admin" : user.role;

      if (role === "admin" && userRole !== "admin") {
        return res.status(403).json({ message: "Only Admin users can login here." });
      }
      if (role === "employee" && userRole !== "employee") {
        return res.status(403).json({ message: "Only Employee users can login here." });
      }

      const newTokenVersion = Date.now();
      await User.updateOne(
        { _id: user._id },
        { $set: { tokenVersion: newTokenVersion } }
      );

      return res.status(200).json({
        message: "Login successful",
        token: signToken({ id: user._id, name: user.name, email: user.email, role: userRole, tokenVersion: newTokenVersion }),
        user: { id: user._id, name: user.name, email: user.email, role: userRole }
      });
    }

    if (role === "employee") {
      return res.status(401).json({ message: "Employee not found. Please contact admin to create your account." });
    }

    if (!isFixedAdminCredentials(email.toLowerCase().trim(), password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const adminUser = getFixedAdminUser();
    return res.status(200).json({
      message: "Login successful",
      token: signToken(adminUser),
      user: adminUser
    });
  } catch (error) {
    return next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(200).json({ message: "Logged out successfully" });
    }
    await User.findByIdAndUpdate(req.user._id, { tokenVersion: 0 });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return next(error);
  }
};
