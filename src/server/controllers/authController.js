import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ensureDB } from "../config/db.js";
import { User } from "../models/User.js";

const getFixedAdminUser = () => ({
  id: "admin-fallback",
  name: process.env.ADMIN_NAME || "Surendra Admin",
  email: (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase(),
  role: "admin"
});

const isFixedAdminCredentials = (email, password) => {
  const adminEmail = (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase().trim();
  const adminPassword = (process.env.ADMIN_PASSWORD || "surendra").trim();
  const inputEmail = String(email || "").toLowerCase().trim();
  const inputPassword = String(password || "").trim();
  const allowedUsernames = [
    adminEmail,
    adminEmail.split("@")[0],
    "surendra_admin",
    "surendra",
    "admin"
  ];
  return (
    allowedUsernames.includes(inputEmail) &&
    (inputPassword === adminPassword || inputPassword.toLowerCase() === adminPassword.toLowerCase())
  );
};

const getJwtSecret = () => process.env.JWT_SECRET || "mySuperSecretKey123";

const signToken = (user) =>
  jwt.sign(
    { id: user.id || user._id, name: user.name, email: user.email, role: user.role, tokenVersion: user.tokenVersion ?? 0 },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

export const registerUser = async (req, res, next) => {
  try {
    if (!await ensureDB()) {
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
    if (!await ensureDB()) {
      return res.status(200).json({ data: [] });
    }

    // Critical Security: The Employee table must only list subordinate employees, never administrators or the logged-in user
    const currentUserId = req.user?._id || req.user?.id;
    const currentUserEmail = (req.user?.email || "").toLowerCase();

    const query = {
      role: { $ne: "admin" }
    };

    if (currentUserId && currentUserId !== "admin-fallback") {
      query._id = { $ne: currentUserId };
    }
    if (currentUserEmail) {
      query.email = { $ne: currentUserEmail };
    }

    const users = await User.find(query, { password: 0 }).sort({ createdAt: -1 }).lean();
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
    const user = await User.findById(req.params.id, { password: 0 }).lean();
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

    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const normalizedInput = String(email || "").toLowerCase().trim();
    const cleanPassword = String(password || "").trim();

    const isFixedAdmin = isFixedAdminCredentials(normalizedInput, cleanPassword);

    // Fast-path: If admin credentials match, return immediately without blocking!
    if (isFixedAdmin) {
      const adminEmail = (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase();
      const adminUser = getFixedAdminUser();

      // Check DB in background or quick read to attach _id if available
      try {
        if (isDatabaseReady()) {
          const dbAdmin = await User.findOne({ email: adminEmail }).select("_id name email role tokenVersion").lean();
          if (dbAdmin) {
            return res.status(200).json({
              message: "Login successful",
              token: signToken({ id: dbAdmin._id, name: dbAdmin.name || adminUser.name, email: dbAdmin.email, role: "admin", tokenVersion: dbAdmin.tokenVersion ?? 0 }),
              user: { id: dbAdmin._id, name: dbAdmin.name || adminUser.name, email: dbAdmin.email, role: "admin" }
            });
          }
        }
      } catch (_) {}

      return res.status(200).json({
        message: "Login successful",
        token: signToken(adminUser),
        user: adminUser
      });
    }

    if (!await ensureDB()) {
      if (role === "employee") {
        return res.status(503).json({ message: "Database offline. Employee login unavailable." });
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Fast indexed query
    const user = await User.findOne({
      $or: [
        { email: normalizedInput },
        { username: normalizedInput }
      ]
    });

    if (user) {
      let ok = await bcrypt.compare(cleanPassword, user.password);
      if (!ok && cleanPassword.toLowerCase() !== cleanPassword) {
        ok = await bcrypt.compare(cleanPassword.toLowerCase(), user.password);
      }

      if (!ok) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const adminEmail = (process.env.ADMIN_EMAIL || "surendraadmin@gmail.com").toLowerCase();
      const userRole = (user.role === "admin" || user.email?.toLowerCase() === adminEmail) ? "admin" : "employee";
      const tokenVersion = user.tokenVersion ?? 0;

      return res.status(200).json({
        message: "Login successful",
        token: signToken({ id: user._id, name: user.name, email: user.email, role: userRole, tokenVersion }),
        user: { id: user._id, name: user.name, email: user.email, role: userRole }
      });
    }

    return res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
    return next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    if (!await ensureDB()) {
      return res.status(200).json({ message: "Logged out successfully" });
    }
    await User.findByIdAndUpdate(req.user._id, { tokenVersion: 0 });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userEmail = (req.user?.email || "").toLowerCase();

    if (!await ensureDB() || userId === "admin-fallback") {
      const fixed = getFixedAdminUser();
      return res.status(200).json({
        data: {
          id: fixed.id,
          name: fixed.name,
          email: fixed.email,
          role: fixed.role,
          phoneNumber: "",
          username: "admin"
        }
      });
    }

    let user = null;
    if (userId) {
      user = await User.findById(userId, { password: 0 });
    }
    if (!user && userEmail) {
      user = await User.findOne({ email: userEmail }, { password: 0 });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ data: user });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userEmail = (req.user?.email || "").toLowerCase();
    const { name, email, phoneNumber, username, currentPassword, newPassword } = req.body;

    if (!await ensureDB() || userId === "admin-fallback") {
      return res.status(200).json({
        message: "Profile updated successfully",
        data: {
          id: userId || "admin-fallback",
          name: name || "Uttam Admin",
          email: email || process.env.ADMIN_EMAIL,
          role: "admin",
          phoneNumber: phoneNumber || "",
          username: username || "admin"
        }
      });
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
      if (currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Current password does not match. Please verify your current password." });
        }
      }
      if (newPassword.trim().length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long." });
      }
      user.password = await bcrypt.hash(newPassword.trim(), 10);
      user.tokenVersion = Date.now();
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

