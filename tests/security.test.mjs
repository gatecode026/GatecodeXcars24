import test from "node:test";
import assert from "node:assert/strict";
import { GET as uploadsHandler } from "../app/uploads/[...path]/route.js";
import { adminOnly, teamLeaderOrAdmin } from "../src/server/middleware/authMiddleware.js";

test("Security: Uploads path traversal rejection", async () => {
  // Test 1: Attempt to read ../package.json or traversal
  const mockReqTraversal = {
    headers: new Map(),
  };
  const resTraversal = await uploadsHandler(mockReqTraversal, {
    params: Promise.resolve({ path: ["..", "..", "package.json"] })
  });
  assert.equal(resTraversal.status, 403, "Should return 403 Forbidden on directory traversal");

  // Test 2: Attempt encoded traversal %2e%2e
  const resEncoded = await uploadsHandler(mockReqTraversal, {
    params: Promise.resolve({ path: ["%2e%2e", "etc", "passwd"] })
  });
  assert.equal(resEncoded.status, 403, "Should return 403 Forbidden on encoded traversal");

  // Test 3: Attempt dot file access like .env
  const resDotenv = await uploadsHandler(mockReqTraversal, {
    params: Promise.resolve({ path: [".env"] })
  });
  assert.equal(resDotenv.status, 403, "Should return 403 Forbidden on dotfile access");
});

test("Security: RBAC separation of Admin vs Team Leader", async () => {
  // Verify adminOnly blocks employee and tl
  let tlPassedAdminOnly = false;
  let employeePassedAdminOnly = false;
  let adminPassedAdminOnly = false;

  const mockRes = () => ({
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  });

  // TL on adminOnly
  const res1 = mockRes();
  adminOnly({ user: { role: "tl", name: "Lead" } }, res1, () => { tlPassedAdminOnly = true; });
  assert.equal(tlPassedAdminOnly, false, "Team Leader must NOT pass adminOnly middleware");
  assert.equal(res1.statusCode, 403, "Should return 403 for TL on adminOnly");

  // Employee on adminOnly
  const res2 = mockRes();
  adminOnly({ user: { role: "employee", name: "Agent" } }, res2, () => { employeePassedAdminOnly = true; });
  assert.equal(employeePassedAdminOnly, false, "Employee must NOT pass adminOnly middleware");
  assert.equal(res2.statusCode, 403, "Should return 403 for employee on adminOnly");

  // Admin on adminOnly
  const res3 = mockRes();
  adminOnly({ user: { role: "admin", name: "Admin" } }, res3, () => { adminPassedAdminOnly = true; });
  assert.equal(adminPassedAdminOnly, true, "Admin MUST pass adminOnly middleware");

  // TL on teamLeaderOrAdmin
  let tlPassedTLOrAdmin = false;
  const res4 = mockRes();
  teamLeaderOrAdmin({ user: { role: "tl", name: "Lead" } }, res4, () => { tlPassedTLOrAdmin = true; });
  assert.equal(tlPassedTLOrAdmin, true, "Team Leader MUST pass teamLeaderOrAdmin middleware");

  // Employee on teamLeaderOrAdmin
  let empPassedTLOrAdmin = false;
  const res5 = mockRes();
  teamLeaderOrAdmin({ user: { role: "employee", name: "Agent" } }, res5, () => { empPassedTLOrAdmin = false; });
  assert.equal(empPassedTLOrAdmin, false, "Employee must NOT pass teamLeaderOrAdmin middleware");
  assert.equal(res5.statusCode, 403, "Should return 403 for employee on teamLeaderOrAdmin");
});
