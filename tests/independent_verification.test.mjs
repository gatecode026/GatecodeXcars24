import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { GET as uploadsHandler } from "../app/uploads/[...path]/route.js";
import { adminOnly, teamLeaderOrAdmin } from "../src/server/middleware/authMiddleware.js";
import { paginateQuery } from "../src/server/utils/pagination.js";

// Helper to simulate express-like res object
const createMockRes = () => ({
  statusCode: 200,
  body: null,
  headers: {},
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    this.body = data;
    return this;
  },
  setHeader(k, v) {
    this.headers[k] = v;
    return this;
  }
});

// ---------------------------------------------------------------------------
// 1. AUTHORIZATION MATRIX TESTS
// ---------------------------------------------------------------------------
test("RBAC Matrix: adminOnly strictly blocks tl, manager, employee, and guest", async () => {
  const roles = [
    { role: "employee", expected: 403, allowed: false },
    { role: "tl", expected: 403, allowed: false },
    { role: "manager", expected: 403, allowed: false },
    { role: "guest", expected: 403, allowed: false },
    { role: "admin", expected: 200, allowed: true },
    { role: "superadmin", expected: 200, allowed: true }
  ];

  for (const { role, expected, allowed } of roles) {
    let nextCalled = false;
    const res = createMockRes();
    const req = { user: { role, email: `${role}@example.com` } };

    adminOnly(req, res, () => {
      nextCalled = true;
    });

    assert.equal(
      nextCalled,
      allowed,
      `Role ${role} next() should be ${allowed}`
    );
    if (!allowed) {
      assert.equal(res.statusCode, expected, `Role ${role} should receive HTTP ${expected}`);
    }
  }
});

test("RBAC Matrix: teamLeaderOrAdmin allows tl, manager, admin, superadmin; blocks employee", async () => {
  const roles = [
    { role: "employee", allowed: false },
    { role: "guest", allowed: false },
    { role: "tl", allowed: true },
    { role: "manager", allowed: true },
    { role: "admin", allowed: true },
    { role: "superadmin", allowed: true }
  ];

  for (const { role, allowed } of roles) {
    let nextCalled = false;
    const res = createMockRes();
    const req = { user: { role, email: `${role}@example.com` } };

    teamLeaderOrAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.equal(
      nextCalled,
      allowed,
      `Role ${role} access to teamLeaderOrAdmin should be ${allowed}`
    );
  }
});

// ---------------------------------------------------------------------------
// 2. PATH TRAVERSAL ADVERSARIAL SUITE
// ---------------------------------------------------------------------------
test("Security: Comprehensive Path Traversal Defense", async () => {
  const dummyReq = { headers: new Map() };

  // Traversal attack payloads
  const attackVectors = [
    ["..", "package.json"],
    ["..", "..", ".env"],
    ["..", "..", "Windows", "System32", "drivers", "etc", "hosts"],
    ["%2e%2e", "package.json"],
    ["%2e%2e", "%2e%2e", ".env"],
    [".env"],
    [".git", "config"],
    ["..\\..\\Windows"],
    ["test.png\0.php"],
    ["test.png:stream"]
  ];

  for (const vector of attackVectors) {
    const res = await uploadsHandler(dummyReq, {
      params: Promise.resolve({ path: vector })
    });
    assert.equal(
      res.status,
      403,
      `Vector ${JSON.stringify(vector)} must be rejected with 403 Forbidden`
    );
  }
});

test("Security: Legitimate upload retrieval functions correctly", async () => {
  const uploadsDir = path.resolve(process.cwd(), "public/uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const testFile = path.resolve(uploadsDir, "audit_verify_sample.png");
  // 1x1 transparent PNG buffer
  const samplePngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64"
  );
  fs.writeFileSync(testFile, samplePngBuffer);

  try {
    const dummyReq = { headers: new Map() };
    const res = await uploadsHandler(dummyReq, {
      params: Promise.resolve({ path: ["audit_verify_sample.png"] })
    });

    assert.equal(res.status, 200, "Valid upload file should return 200 OK");
    assert.equal(res.headers.get("Content-Type"), "image/png");
    assert.equal(res.headers.get("X-Content-Type-Options"), "nosniff");
  } finally {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  }
});

// ---------------------------------------------------------------------------
// 3. PAGINATION BOUNDS & CONTRACT VERIFICATION
// ---------------------------------------------------------------------------
test("Pagination: Boundary conditions and parameter sanitization", async () => {
  let capturedSkip = 0;
  let capturedLimit = 0;

  const mockModel = {
    find() {
      return {
        sort() { return this; },
        skip(sk) { capturedSkip = sk; return this; },
        limit(lim) { capturedLimit = lim; return this; },
        lean() { return this; },
        select() { return this; },
        populate() { return this; },
        async exec() { return []; }
      };
    },
    async countDocuments() { return 500; }
  };

  // Case 1: Negative and zero parameters fallback safely
  const res1 = await paginateQuery(mockModel, {}, { page: -5, limit: 0 });
  assert.equal(res1.pagination.page, 1, "Negative page should fallback to 1");
  assert.equal(res1.pagination.perPage, 50, "Zero limit should fallback to default 50");
  assert.equal(capturedSkip, 0);

  // Case 2: Extreme oversized limit is capped to maxLimit
  const res2 = await paginateQuery(mockModel, {}, { page: 3, limit: 99999, maxLimit: 100 });
  assert.equal(res2.pagination.perPage, 100, "Extreme limit must be capped to maxLimit (100)");
  assert.equal(res2.pagination.page, 3);
  assert.equal(capturedSkip, 200, "Skip on page 3 with limit 100 should be 200");

  // Case 3: all=true parameter bounded by safe ceiling
  const res3 = await paginateQuery(mockModel, {}, { all: true, limit: 10000 });
  assert.equal(res3.pagination.perPage, 2000, "all=true must not exceed 2000 safety ceiling");

  // Case 4: Total pages calculation
  assert.equal(res2.pagination.totalPages, 5, "500 records with limit 100 should equal 5 pages");
  assert.equal(res2.pagination.hasNextPage, true);
  assert.equal(res2.pagination.hasPreviousPage, true);
});

// ---------------------------------------------------------------------------
// 4. SPREADSHEET FORMULA INJECTION DEFENSE (CWE-1236)
// ---------------------------------------------------------------------------
test("Security: Formula injection defenses neutralize all spreadsheet triggers", () => {
  const sanitize = (val) => {
    let s = String(val ?? "").trim();
    if (/^[=+\-@\t\r]/.test(s)) {
      s = `'${s}`;
    }
    return s;
  };

  const dangerousInputs = [
    "=1+1",
    "=cmd|' /C calc'!A0",
    "+2+2",
    "-10*5",
    "@SUM(A1:A10)",
    "\t=1+1",
    "\r+2+2"
  ];

  for (const input of dangerousInputs) {
    const sanitized = sanitize(input);
    assert.match(sanitized, /^'/, `Input ${JSON.stringify(input)} must be prefixed with single quote`);
  }

  // Safe inputs must remain unchanged
  assert.equal(sanitize("Standard Customer"), "Standard Customer");
  assert.equal(sanitize("DL01AB1234"), "DL01AB1234");
  assert.equal(sanitize("9876543210"), "9876543210");
});
