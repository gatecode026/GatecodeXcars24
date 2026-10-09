import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

const DEFAULT_ADMIN_EMAIL = "surendraadmin@gmail.com";
const DEFAULT_ADMIN_NAME = "Surendra Admin";

/**
 * Ensures an initial administrator account is securely provisioned in the database.
 *
 * Security Requirements & Guardrails:
 * 1. Checks if any administrator account already exists. If so, aborts immediately
 *    to guarantee that existing administrator credentials and passwords are NEVER modified or reset.
 * 2. Requires `process.env.ADMIN_PASSWORD`. There is NO hardcoded default fallback password.
 * 3. In production (`NODE_ENV === "production"`), missing or empty `ADMIN_PASSWORD`
 *    throws an explicit Error to prevent running with unconfigured administrative access.
 * 4. Passwords, hashes, and secrets are NEVER logged or exposed in diagnostics.
 * 5. Uses bcrypt hashing with cost factor 10.
 * 6. Uses `$setOnInsert` to prevent race conditions from overwriting existing credentials.
 */
export const ensureFixedAdminUser = async (options = {}) => {
  const { throwOnMissing = false } = options;
  const adminEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();

  // 1. Guardrail: If any administrator exists, do not modify or reset anything
  const existingAdmin = await User.findOne({
    $or: [{ role: "admin" }, { email: adminEmail }]
  });

  if (existingAdmin) {
    return { seeded: false, reason: "ADMIN_EXISTS", email: existingAdmin.email };
  }

  // 2. Guardrail: Validate ADMIN_PASSWORD presence (no default fallback)
  const rawPassword = process.env.ADMIN_PASSWORD;
  const adminPassword = typeof rawPassword === "string" ? rawPassword.trim() : "";

  if (!adminPassword) {
    const errorMsg = "ADMIN_PASSWORD environment variable is missing or empty. Cannot provision initial administrator account.";
    if (process.env.NODE_ENV === "production" || throwOnMissing) {
      throw new Error(errorMsg);
    }
    console.warn(`[Security Warning] ${errorMsg} Provisioning skipped safely.`);
    return { seeded: false, reason: "MISSING_ADMIN_PASSWORD" };
  }

  // 3. Provision administrator account with bcrypt hash
  const adminName = (process.env.ADMIN_NAME || DEFAULT_ADMIN_NAME).trim();
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminDoc = await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $setOnInsert: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        isDeleted: false
      }
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  console.log(`Initial administrator provisioned successfully: ${adminEmail}`);
  return { seeded: true, email: adminEmail, id: adminDoc?._id };
};



