import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { User } from "../src/server/models/User.js";
import { ensureFixedAdminUser } from "../src/server/config/seedAdmin.js";
import { getJwtSecret } from "../src/server/middleware/authMiddleware.js";
import { connectDB } from "../src/server/config/db.js";

test("Seed Security: Missing ADMIN_PASSWORD fails safely", async () => {
  const origEnv = { ...process.env };
  const origFindOne = User.findOne;
  const origFindOneAndUpdate = User.findOneAndUpdate;

  try {
    delete process.env.ADMIN_PASSWORD;
    User.findOne = async () => null; // Simulate empty DB with no admin
    let updatedCalled = false;
    User.findOneAndUpdate = async () => {
      updatedCalled = true;
      return null;
    };

    // 1. In non-production: safe skip without throwing or creating user
    process.env.NODE_ENV = "development";
    const devResult = await ensureFixedAdminUser();
    assert.equal(devResult.seeded, false, "Must not seed admin when password is missing");
    assert.equal(devResult.reason, "MISSING_ADMIN_PASSWORD");
    assert.equal(updatedCalled, false, "Must NOT call findOneAndUpdate without password");

    // 2. In production: must fail explicitly and safely by throwing
    process.env.NODE_ENV = "production";
    await assert.rejects(
      async () => ensureFixedAdminUser(),
      /ADMIN_PASSWORD environment variable is missing or empty/,
      "Must throw in production when ADMIN_PASSWORD is missing"
    );
    assert.equal(updatedCalled, false, "Must never invoke database update in production without password");
  } finally {
    process.env = origEnv;
    User.findOne = origFindOne;
    User.findOneAndUpdate = origFindOneAndUpdate;
  }
});

test("Seed Security: Empty or whitespace-only ADMIN_PASSWORD fails safely", async () => {
  const origEnv = { ...process.env };
  const origFindOne = User.findOne;
  const origFindOneAndUpdate = User.findOneAndUpdate;

  try {
    User.findOne = async () => null;
    let updatedCalled = false;
    User.findOneAndUpdate = async () => {
      updatedCalled = true;
      return null;
    };

    // Test whitespace string "   "
    process.env.ADMIN_PASSWORD = "    ";
    process.env.NODE_ENV = "production";

    await assert.rejects(
      async () => ensureFixedAdminUser(),
      /ADMIN_PASSWORD environment variable is missing or empty/,
      "Whitespace password must be rejected as empty in production"
    );
    assert.equal(updatedCalled, false, "Database update must not be invoked for whitespace password");
  } finally {
    process.env = origEnv;
    User.findOne = origFindOne;
    User.findOneAndUpdate = origFindOneAndUpdate;
  }
});

test("Seed Security: Existing administrator credentials are not overwritten by rerunning seed", async () => {
  const origEnv = { ...process.env };
  const origFindOne = User.findOne;
  const origFindOneAndUpdate = User.findOneAndUpdate;

  try {
    const existingAdminDoc = {
      _id: "admin-existing-uuid-1234",
      email: "active_admin@gatecodexcars24.com",
      role: "admin",
      name: "Existing Active Administrator",
      password: "$2a$10$existingActivePasswordHashDoNotOverwrite"
    };

    User.findOne = async () => existingAdminDoc;
    let updateCalled = false;
    User.findOneAndUpdate = async () => {
      updateCalled = true;
      return null;
    };

    process.env.ADMIN_PASSWORD = "SomeNewPasswordAttempt";
    process.env.NODE_ENV = "production";

    const result = await ensureFixedAdminUser();
    assert.equal(result.seeded, false, "Must not seed when admin already exists");
    assert.equal(result.reason, "ADMIN_EXISTS", "Must indicate admin already exists");
    assert.equal(result.email, "active_admin@gatecodexcars24.com");
    assert.equal(updateCalled, false, "Rerunning seed must NEVER update or reset existing admin credentials");
  } finally {
    process.env = origEnv;
    User.findOne = origFindOne;
    User.findOneAndUpdate = origFindOneAndUpdate;
  }
});

test("Seed Security: Valid configured administrator provisioning succeeds with bcrypt hash", async () => {
  const origEnv = { ...process.env };
  const origFindOne = User.findOne;
  const origFindOneAndUpdate = User.findOneAndUpdate;

  try {
    User.findOne = async () => null;
    let capturedQuery = null;
    let capturedUpdate = null;
    let capturedOptions = null;

    User.findOneAndUpdate = async (query, update, options) => {
      capturedQuery = query;
      capturedUpdate = update;
      capturedOptions = options;
      return { _id: "new-admin-id-999" };
    };

    const strongPassword = "StrongEnterprisePassword#2026!";
    process.env.ADMIN_PASSWORD = strongPassword;
    process.env.ADMIN_EMAIL = "new_admin@company.com";
    process.env.ADMIN_NAME = "Enterprise Admin";
    process.env.NODE_ENV = "production";

    const result = await ensureFixedAdminUser();
    assert.equal(result.seeded, true, "Provisioning must succeed with valid credentials");
    assert.equal(result.email, "new_admin@company.com");
    assert.equal(result.id, "new-admin-id-999");

    // Verify query and update structure
    assert.equal(capturedQuery.email, "new_admin@company.com");
    assert.ok(capturedUpdate.$setOnInsert, "Must use $setOnInsert to prevent overwrite on race condition");
    assert.equal(capturedUpdate.$setOnInsert.name, "Enterprise Admin");
    assert.equal(capturedUpdate.$setOnInsert.role, "admin");

    // Verify bcrypt hashing of the password
    const storedHash = capturedUpdate.$setOnInsert.password;
    assert.notEqual(storedHash, strongPassword, "Password must never be stored in plain text");
    const isPasswordValid = await bcrypt.compare(strongPassword, storedHash);
    assert.equal(isPasswordValid, true, "Hashed password must verify against original password");

    // Verify options prevent accidental updates
    assert.equal(capturedOptions.upsert, true);
    assert.equal(capturedOptions.setDefaultsOnInsert, true);
  } finally {
    process.env = origEnv;
    User.findOne = origFindOne;
    User.findOneAndUpdate = origFindOneAndUpdate;
  }
});

test("Environment Security: Missing production secrets (JWT_SECRET, MONGO_URI) fail safely", async () => {
  const origEnv = { ...process.env };

  try {
    process.env.NODE_ENV = "production";

    // 1. Missing or empty JWT_SECRET must throw in production
    delete process.env.JWT_SECRET;
    assert.throws(
      () => getJwtSecret(),
      /CRITICAL: JWT_SECRET environment variable is missing/,
      "Must throw when JWT_SECRET is missing in production"
    );

    process.env.JWT_SECRET = "   ";
    assert.throws(
      () => getJwtSecret(),
      /CRITICAL: JWT_SECRET environment variable is missing/,
      "Must throw when JWT_SECRET is whitespace in production"
    );

    // 2. Missing or empty MONGO_URI must reject in connectDB
    delete process.env.MONGO_URI;
    await assert.rejects(
      async () => connectDB(100),
      /CRITICAL: MONGO_URI environment variable is missing/,
      "Must throw when MONGO_URI is missing"
    );

    process.env.MONGO_URI = "   ";
    await assert.rejects(
      async () => connectDB(100),
      /CRITICAL: MONGO_URI environment variable is missing/,
      "Must throw when MONGO_URI is whitespace"
    );
  } finally {
    process.env = origEnv;
  }
});
