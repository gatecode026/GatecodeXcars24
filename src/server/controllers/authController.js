import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ensureDB, isDatabaseReady } from "../config/db.js";
import { ensureFixedAdminUser } from "../config/seedAdmin.js";
import { getJwtSecret } from "../middleware/authMiddleware.js";
import { User } from "../models/User.js";
import { Customer } from "../models/Customer.js";
import { recordActivity } from "./activityController.js";
import { invalidateEmployeesListCache } from "./customerController.js";
import { createMicroCache } from "../cache/serverCache.js";

const usersTableCache = createMicroCache("users", 10000);

const signToken = (user) =>
  jwt.sign(
    {
      id: String(user.id || user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

export const registerUser = async (req, res, next) => {
  try {
    if (!await ensureDB()) {
      return res.status(503).json({ message: "Database unavailable. Cannot register user." });
    }

    const { name, email, password, phoneNumber, username, role } = req.body;
    const assignedRole = ["admin", "tl", "employee"].includes(role) ? role : "employee";

    const cleanUsername = username && typeof username === "string" && username.trim() ? username.trim() : undefined;
    const existing = await User.findOne(cleanUsername ? { $or: [{ email }, { username: cleanUsername }] } : { email });
    if (existing) {
      if (existing.isDeleted) {
        existing.isDeleted = false;
        existing.deletedAt = null;
        existing.name = name;
        existing.phoneNumber = phoneNumber;
        existing.role = assignedRole;
        if (cleanUsername) existing.username = cleanUsername;
        existing.password = await bcrypt.hash(password, 10);
        await existing.save();
        invalidateEmployeesListCache();
        return res.status(200).json({
          message: "Employee account reactivated and updated successfully",
          data: {
            id: existing._id,
            name: existing.name,
            email: existing.email,
            phoneNumber: existing.phoneNumber,
            username: existing.username,
            role: existing.role
          }
        });
      }
      const field = existing.email === email ? "Email" : "Username";
      return res.status(409).json({ message: `${field} already registered` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      ...(cleanUsername ? { username: cleanUsername } : {}),
      role: assignedRole,
      isDeleted: false
    });

    invalidateEmployeesListCache();

    const actorName = req.user?.name || (req.user?.role === "tl" ? "Team Leader" : "Administrator");
    const actorRole = req.user?.role || "admin";
    await recordActivity({
      performedBy: req.user?._id || req.user?.id || null,
      performedByName: actorName,
      performedByRole: actorRole,
      actionType: "EMPLOYEE_CREATED",
      affectedEmployeeId: user._id,
      affectedEmployeeName: user.name,
      title: "Employee Account Created",
      details: `${actorName} created new ${user.role === "tl" ? "Team Leader" : "employee"} account for "${user.name}" (${user.email})`,
      employeeMessage: `Account created for ${user.name}`,
      adminMessage: `${actorName} created new ${user.role === "tl" ? "Team Leader" : "employee"} account for "${user.name}" (${user.email})`,
      metadata: { email: user.email, role: user.role, username: user.username }
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
    if (!await ensureDB()) {
      return res.status(200).json({ data: [] });
    }

    // Critical Security: The Employee table must only list subordinate employees, never administrators or the logged-in user
    const currentUserId = req.user?._id || req.user?.id || "anon";
    const currentUserEmail = (req.user?.email || "").toLowerCase();
    const cacheKey = `${String(currentUserId)}_${JSON.stringify(req.query || {})}`;

    const cached = usersTableCache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ data: cached });
    }

    const query = {
      role: { $ne: "admin" },
      isDeleted: { $ne: true }
    };

    if (currentUserId && currentUserId !== "admin-fallback") {
      query._id = { $ne: currentUserId };
    }
    if (currentUserEmail) {
      query.email = { $ne: currentUserEmail };
    }

    const users = await User.find(query, { password: 0 }).sort({ createdAt: -1 }).lean();
    usersTableCache.set(cacheKey, users);
    return res.status(200).json({ data: users });
  } catch (error) {
    return next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    if (!await ensureDB()) {
      return res.status(503).json({ message: "Database unavailable." });
    }
    const user = await User.findOne({ _id: req.params.id, isDeleted: { $ne: true } }, { password: 0 }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found or account is deactivated" });
    }
    return res.status(200).json({ data: user });
  } catch (error) {
    return next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    if (!await ensureDB()) {
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
    if (username && typeof username === "string" && username.trim() && username.trim() !== user.username) {
      const existing = await User.findOne({ username: username.trim() });
      if (existing) return res.status(409).json({ message: "Username already in use" });
    }

    const oldName = user.name;
    if (name !== undefined && name.trim()) user.name = name.trim();
    if (email !== undefined && email.trim()) user.email = email.trim().toLowerCase();
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
    if (username !== undefined && typeof username === "string" && username.trim()) user.username = username.trim();
    if (role !== undefined) user.role = role;
    if (password && password.trim()) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // If employee name changed, update corresponding lead records to prevent duplicate employee display
    if (name && oldName && name.trim() !== oldName) {
      try {
        await Customer.updateMany(
          { employeeId: user._id },
          { $set: { employeeName: user.name } }
        );
        await Customer.updateMany(
          { employeeId: user._id, leadBy: oldName },
          { $set: { leadBy: user.name } }
        );
      } catch (syncErr) {
        console.warn("Failed to synchronize lead employee names:", syncErr.message);
      }
    }

    invalidateEmployeesListCache();

    const actorName = req.user?.name || (req.user?.role === "tl" ? "Team Leader" : "Administrator");
    const actorRole = req.user?.role || "admin";
    await recordActivity({
      performedBy: req.user?._id || req.user?.id || null,
      performedByName: actorName,
      performedByRole: actorRole,
      actionType: "EMPLOYEE_UPDATED",
      affectedEmployeeId: user._id,
      affectedEmployeeName: user.name,
      title: "Employee Profile Updated",
      details: `${actorName} updated details / role for "${user.name}" (${user.role})`,
      employeeMessage: `Your profile details were updated by ${actorName}`,
      adminMessage: `${actorName} updated profile of "${user.name}"`,
      metadata: { email: user.email, role: user.role }
    });

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
    if (!await ensureDB()) {
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

    // Soft delete: mark employee as deleted and keep record for data consistency
    await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );

    invalidateEmployeesListCache();

    const actorName = req.user?.name || (req.user?.role === "tl" ? "Team Leader" : "Administrator");
    const actorRole = req.user?.role || "admin";
    await recordActivity({
      performedBy: req.user?._id || req.user?.id || null,
      performedByName: actorName,
      performedByRole: actorRole,
      actionType: "EMPLOYEE_DELETED",
      affectedEmployeeId: targetUser._id,
      affectedEmployeeName: targetUser.name,
      title: "Employee Account Deleted",
      details: `${actorName} deleted account for "${targetUser.name}" (${targetUser.email})`,
      employeeMessage: `Account for ${targetUser.name} deleted`,
      adminMessage: `${actorName} deleted employee "${targetUser.name}" (${targetUser.email})`,
      metadata: { email: targetUser.email, role: targetUser.role }
    });

    return res.status(200).json({ message: "Employee soft-deleted successfully", id: targetUser._id });
  } catch (error) {
    return next(error);
  }
};

export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const normalizedInput = String(email || "").toLowerCase().trim();
    const cleanPassword = String(password || "").trim();

    if (!normalizedInput || !cleanPassword) {
      return res.status(400).json({ message: "Email/username and password are required" });
    }

    const ready = await ensureDB();
    if (!ready) {
      return res.status(503).json({ message: "Database temporarily unavailable. Please retry shortly." });
    }

    // Fast indexed query with .lean() for minimal overhead
    let user = await User.findOne({
      $or: [
        { email: normalizedInput },
        { username: normalizedInput }
      ]
    }).lean();

    // If user not found, check if admin needs initial auto-seeding
    if (!user) {
      const adminEmail = (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase().trim();
      if (normalizedInput === adminEmail || normalizedInput === "admin") {
        await ensureFixedAdminUser();
        user = await User.findOne({
          $or: [{ email: adminEmail }, { role: "admin" }]
        }).lean();
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isDeleted) {
      return res.status(403).json({ message: "This account has been deactivated. Please contact your administrator." });
    }

    const ok = await bcrypt.compare(cleanPassword, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase();
    const userRole = (user.role === "admin" || user.email?.toLowerCase() === adminEmail)
      ? "admin"
      : (user.role === "tl" ? "tl" : "employee");
    const tokenVersion = user.tokenVersion ?? 0;

    const token = signToken({
      id: user._id,
      name: user.name,
      email: user.email,
      role: userRole,
      tokenVersion
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    if (!await ensureDB()) {
      return res.status(200).json({ message: "Logged out successfully" });
    }
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
    }
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userEmail = (req.user?.email || "").toLowerCase();

    if (!await ensureDB()) {
      return res.status(503).json({ message: "Database temporarily unavailable." });
    }

    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId, { password: 0 }).lean();
    }
    if (!user && userEmail) {
      user = await User.findOne({ email: userEmail, isDeleted: { $ne: true } }, { password: 0 }).lean();
    }

    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    return res.status(200).json({
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber || "",
        username: user.username || ""
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userEmail = (req.user?.email || "").toLowerCase();
    const { name, email, phoneNumber, username, currentPassword, newPassword } = req.body;

    if (!await ensureDB()) {
      return res.status(503).json({ message: "Database temporarily unavailable." });
    }

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }
    if (!user && userEmail) {
      user = await User.findOne({ email: userEmail });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check unique email if changed
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({ message: "This email address is already in use by another account." });
      }
      user.email = email.toLowerCase().trim();
    }

    // Check unique username if changed
    if (username && username.toLowerCase() !== (user.username || "").toLowerCase()) {
      const existing = await User.findOne({ username: username.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({ message: "This username is already taken. Please choose another." });
      }
      user.username = username.toLowerCase().trim();
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (phoneNumber !== undefined) {
      user.phoneNumber = phoneNumber.trim();
    }

    // Password change
    if (newPassword && newPassword.trim()) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to change your password." });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password does not match. Please verify your current password." });
      }
      if (newPassword.trim().length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long." });
      }
      user.password = await bcrypt.hash(newPassword.trim(), 10);
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save();

    const updatedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    };

    const newToken = signToken(updatedUser);

    return res.status(200).json({
      message: "Profile updated successfully",
      token: newToken,
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

export const bulkImportUsers = async (req, res, next) => {
  try {
    if (!await ensureDB()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "No data rows provided for import." });
    }

    const getVal = (row, ...keys) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
          return String(row[k]).trim();
        }
        const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const actualKey of Object.keys(row)) {
          if (actualKey.toLowerCase().replace(/[^a-z0-9]/g, "") === lowerK) {
            if (row[actualKey] !== undefined && row[actualKey] !== null && String(row[actualKey]).trim() !== "") {
              return String(row[actualKey]).trim();
            }
          }
        }
      }
      return "";
    };

    let insertedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const name = getVal(r, "Name", "Full Name", "Employee Name", "name");
      const email = getVal(r, "Email", "Email Address", "email").toLowerCase();
      const phoneNumber = getVal(r, "Phone Number", "Phone", "Mobile", "phoneNumber");
      const rawRole = getVal(r, "Role", "role").toLowerCase();
      const rawPassword = getVal(r, "Password", "password") || "User@12345";

      if (!name || !email) {
        continue;
      }

      // Check if user already exists
      const existing = await User.findOne({ email });
      if (existing) {
        skippedCount++;
        continue;
      }

      try {
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const assignedRole = ["admin", "employee"].includes(rawRole) ? rawRole : "employee";

        await User.create({
          name,
          email,
          password: hashedPassword,
          phoneNumber,
          role: assignedRole
        });
        insertedCount++;
      } catch (err) {
        errors.push({ row: i + 1, email, error: err.message });
      }
    }

    return res.status(200).json({
      message: `Successfully imported ${insertedCount} user(s).${skippedCount > 0 ? ` (${skippedCount} already existed/skipped)` : ""}`,
      count: insertedCount,
      skippedCount,
      errors: errors.length > 0 ? errors.slice(0, 5) : []
    });
  } catch (error) {
    return next(error);
  }
};

