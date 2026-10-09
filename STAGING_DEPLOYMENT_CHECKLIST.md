# GatecodeXcars24 — Staging Deployment Checklist & Smoke Test Guide

**Target Environment:** Staging  
**Application Branch:** `remediation/security-performance`  
**Framework:** Next.js 15 (App Router), React 19, MongoDB Atlas, Node.js 22  

---

## 1. Pre-Deployment Configuration Verification

Before triggering the deployment pipeline, ensure all staging environment variables are declared in the hosting platform environment configuration:

- [ ] **`MONGO_URI`:** Configured to an isolated staging MongoDB database (e.g., `gatecode_staging`). Ensure the IP of the staging server is allowed in Atlas Network Access.
- [ ] **`JWT_SECRET`:** 256-bit cryptographically random string (min 32 characters).
- [ ] **`ADMIN_EMAIL`:** Explicit staging administrator email (e.g., `admin-staging@cars24.internal`).
- [ ] **`ADMIN_PASSWORD`:** Complex staging administrator password (min 16 chars).
- [ ] **`ADMIN_NAME`:** Display name for staging admin (e.g., `Staging Administrator`).
- [ ] **`NODE_ENV`:** Set to `production` (or `staging`).
- [ ] **`PORT`:** Default `3000` (or platform default).

---

## 2. Deployment Execution

- [ ] Deploy code from branch `remediation/security-performance`.
- [ ] Verify build logs:
  - Exit code `0` (Success).
  - 37 static pages generated.
  - No uncaught type errors or compilation warnings.
- [ ] If required for initial seed: Run migration script on staging database:
  ```bash
  npm run migrate
  ```
  Verify output: `✅ Migration 001_initial_enterprise_schema completed successfully.`

---

## 3. Staging Smoke Test Matrix

Execute the following end-to-end smoke tests against the deployed staging environment:

### Test Group A: Authentication & Role Enforcement
| # | Test Scenario | Steps | Expected Outcome | Status |
|---|---|---|---|---|
| A1 | Initial Admin Login | Log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` | Successful login, receives JWT, redirects to `/admin` dashboard | [ ] |
| A2 | Missing/Invalid Password | Attempt login with wrong password | Receives `401 Unauthorized: Invalid credentials` | [ ] |
| A3 | Team Leader Login | Log in with a user assigned `tl` role | Access to `/tl` dashboard granted; accessing `/admin/data-management` returns 403 or redirects | [ ] |
| A4 | Employee Login | Log in with `employee` role | Access to `/employee` portal granted; accessing `/admin` or `/tl` returns 403 or redirects | [ ] |
| A5 | Logout & Invalidation | Click Logout in employee portal | Token removed, redirects to `/`, subsequent protected requests return 401 | [ ] |

### Test Group B: Security Boundary Tests
| # | Test Scenario | Steps | Expected Outcome | Status |
|---|---|---|---|---|
| B1 | Upload Traversal Rejection | Send `GET /uploads/..%2f..%2fpackage.json` | Returns `403 Forbidden` with `nosniff` header | [ ] |
| B2 | Dotfile Protection | Send `GET /uploads/.env` | Returns `403 Forbidden` | [ ] |
| B3 | Legitimate Media Access | Send `GET /uploads/valid-file.png` | Returns `200 OK` with appropriate `Content-Type` | [ ] |
| B4 | Employee Privilege Protection | Employee sends `PUT /api/employee/orders/:id` attempting to alter `orderStatus` or `totalAmount` | Request succeeds for employee notes, but `orderStatus` and financial fields are ignored | [ ] |
| B5 | Admin User Management | Team Leader sends `DELETE /api/auth/users/:id` | Returns `403 Forbidden: Administrator access required` | [ ] |

### Test Group C: Data Management, Pagination & Bulk Imports
| # | Test Scenario | Steps | Expected Outcome | Status |
|---|---|---|---|---|
| C1 | Order Pagination Envelope | Navigate to Order Management page | Response matches `{ data: [...], pagination: { page: 1, perPage: 50, ... } }` | [ ] |
| C2 | Pagination Page Advance | Click Next Page | Requests `?page=2`, updates table cleanly without full reload | [ ] |
| C3 | CSV Export Formula Defense | Export customer leads with name starting with `=SUM(1,2)` | CSV cell output contains `'=SUM(1,2)` (prefixed with single quote) | [ ] |
| C4 | Chunked Bulk Import | Upload 500 sample customer rows via Data Management | Import finishes in batches of 250 with accurate success/failure counts | [ ] |
| C5 | Bundle Verification | Inspect Network tab on `/admin/data-management` | First Load JS bundle is ~149 kB; `xlsx` loads dynamically only when export/import is triggered | [ ] |

---

## 4. Post-Staging Sign-off

- [ ] All smoke tests passed on staging environment.
- [ ] No uncaught exceptions in server logs.
- [ ] No MongoDB connection drops or timeouts.
- [ ] Sign-off approved for Production Release Review.
