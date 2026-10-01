# Current State Architecture & System Audit
**Project**: GatecodeXcars24 Enterprise Management & Performance Platform  
**Audit Date**: October 1, 2026  
**Auditor Roles**: Senior SaaS Architect, Backend Engineer, Frontend Engineer, Database Architect, Security Engineer, QA Engineer, DevOps Engineer, Product Analyst  

---

## Executive Summary
The platform is a Next.js (v15.1.7, React 19) full-stack web application integrated with MongoDB (Mongoose v9.6.3). It combines operational call-center / lead management for automotive inspections (GatecodeXcars24) with employee performance tracking, order management, and commission/bonus calculations.

While foundational features exist (such as dynamic performance configuration, monthly target tracking, and basic leaderboards), significant gaps exist between the current state and enterprise-grade production readiness. Specifically:
- Role-based authorization is ad-hoc rather than centralized.
- Database integrity relies heavily on application-level logic without strong uniqueness constraints or transaction boundaries.
- No automated test suite (Jest/Vitest/Cypress) currently exists.
- Database changes are executed without versioned migrations.
- Certain endpoints exhibit IDOR vulnerabilities and lack strict request validation.

---

## A. Current Architecture

```
[ Client Browser: Next.js App Router (React 19, Vanilla CSS) ]
                        │
                        ▼ (HTTP REST / JSON with JWT Bearer Token)
[ Next.js Catch-All Route: app/api/[...slug]/route.js ]
                        │
                        ▼
[ Express-Compatible Route Runner: src/server/routeRunner.js ]
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
 [ Middlewares ]             [ Domain Controllers ]
 - authMiddleware (protect)  - performanceController
 - validateRequest           - customerController
                             - employeeController
                             - adminController
                             - orderController / returnController
                                     │
                                     ▼
                          [ Domain Service Layer ]
                          - performanceService.js
                          - whatsappNotificationService.js
                                     │
                                     ▼
                          [ Mongoose Data Models ]
                          - User, Customer, Order,
                            PerformanceTarget, ActivityLog,
                            CallingRecord, EmployeeRecord
                                     │
                                     ▼
                          [ MongoDB Database ]
```

1. **Frontend**: Next.js 15 (App Router with Client Components `"use client"` in `src/pages-components/`). Styled with custom Vanilla CSS design tokens (`styles/globals.css`).
2. **Backend**: Embedded Node.js route runner inside Next.js Route Handlers (`app/api/[...slug]/route.js`). Emulates Express `req`, `res`, and middleware chaining.
3. **Database**: MongoDB via Mongoose ODM with connection pooling in `src/server/config/db.js`.
4. **Hosting / Dev Environment**: Windows local environment with Next.js development server running on port 3000.

---

## B. Current Database Structure

MongoDB Models (`src/server/models/`):

| Model | Primary Purpose | Key Fields | Indexes & Constraints |
| :--- | :--- | :--- | :--- |
| **`User`** | Auth & Employee profiles | `name`, `email`, `password` (bcrypt), `role` (`admin`, `tl`, `user`, `employee`), `tokenVersion`, `isDeleted` | Unique on `email`, sparse unique on `username`, indexes on `role`, `isDeleted`. Missing tenant/branch ID. |
| **`Customer`** | Leads & Appointments (Cars24 CRM) | `customerName`, `mobile`, `carNumber`, `appointmentId`, `leadDate`, `appointmentDate`, `leadBy`, `verificationStatus` (`Verified`, `Pending`, `Follow-up`, `Rejected`), `assignedTo`, `employeeId` | Indexed on `createdAt`, `appointmentDate`, `verificationStatus`, `carNumber`, `appointmentId`, `employeeId`. Pre-save hook sets `AP-XXXXX`. |
| **`Order`** | Car / Product sales orders | `employeeId`, `customerName`, `mobileNumber`, `carNumber`, `amount`, `totalAmount`, `advanceAmount`, `orderStatus`, `parcelStatus` | Indexed on `createdAt`, `employeeId`, `orderStatus`, `parcelStatus`. Floating-point currency representation. |
| **`PerformanceTarget`** | Business rules configuration | `effectiveFrom`, `effectiveTo`, `dailyAppointmentTarget`, `monthlySalesTarget`, `bonusRate`, `workingDays`, `saleValuePerLead`, `updatedBy`, `previousValues` | Indexed on `effectiveFrom`, `effectiveTo`. Historical append-only snapshots. |
| **`CallingRecord`** | Daily telecalling metrics | `employeeId`, `date`, `totalCalls`, `connectedCalls`, `conversionsDone`, `revenueGenerated` | Indexed on `employeeId`, `date`. |
| **`ActivityLog`** | Operational audit logs | `performedBy`, `actionType`, `title`, `details`, `metadata`, `createdAt` | Indexed on `createdAt`, `performedBy`. |
| **`EmployeeRecord`** | Legacy activity tracking | `employeeId`, `date`, `type`, `description` | Indexed on `employeeId`, `date`. Redundant with `ActivityLog`. |
| **`ReturnRequest`** | Customer issue/returns | `employeeId`, `orderId`, `reason`, `status` | Indexed on `employeeId`, `createdAt`. |

---

## C. Current Dashboard Structure

The application features two distinct dashboard paradigms:
1. **Admin Dashboard (`AdminDashboardPage.jsx` & `AdminPerformancePage.jsx`)**:
   - High-level KPIs: Total leads, appointments today, verified leads, employee performance summary.
   - Tabs: Performance Rankings (leaderboard with tie-breaking) and Bonus Report (with CSV export).
   - Modal for live configuration of targets (daily appointment target, monthly sales target, bonus %, working days).
2. **Executive / Employee Dashboard (`EmployeeDashboardPage.jsx` & `EmployeePerformancePage.jsx`)**:
   - Filter bar: Today, Yesterday, This Month, Last Month, All Time, Date Range.
   - 6 KPI Cards: Customer Leads, Calling Activity, Calling Revenue, Orders, Returns, Total Incentive.
   - Dedicated performance view (`/employee/performance`) displaying daily appointment breakdown, monthly sales progress, target remaining, and ranking score.

---

## D. Existing Employee / Appointment / Sales Functionality

- **Employees**: Managed through `/api/auth/users` and `/admin/employee-summary`. Basic CRUD exists. Lacks department, branch, designation, and supervisor hierarchies.
- **Appointments / Leads**: Stored in `Customer` collection. Appointments are marked `Verified`, `Pending`, `Follow-up`, or `Rejected`. Pre-save hooks generate appointment IDs (`AP-XXXXX`).
- **Sales**:
  - Direct car orders stored in `Order` collection (`totalAmount`).
  - CRM verified leads attributed at `saleValuePerLead` (default ₹65,000 per verified inspection) in `PerformanceTarget`.

---

## E. Existing Authentication & Permissions

- **Authentication**: JWT Bearer tokens signed with HMAC-SHA256 (`JWT_SECRET`). Stored in client `localStorage` and sent via `Authorization: Bearer <token>`.
- **Session Expiry**: Token expiration configured (1 day). Token invalidation via `tokenVersion` on User model exists but is not strictly verified on every route.
- **Permissions**:
  - Coarse binary check: `protect` (any authenticated user) vs `adminOnly` (`req.user?.role === "admin"`).
  - Roles `"tl"` (Team Leader) and `"user"` lack dedicated permission scopes.
  - No centralized RBAC helper like `can(user, action, resource)`.

---

## F. Existing APIs

| Module | Route | Method | Access | Function |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth/login` | POST | Public | User/Admin login, returns JWT token |
| | `/api/auth/profile` | GET/PUT | Authenticated | View/edit own profile |
| | `/api/auth/users` | GET/POST | Admin | List / create employees |
| | `/api/auth/users/:id` | GET/PUT/DEL | Admin | View / edit / soft-delete user |
| **Performance** | `/api/admin/performance-settings` | GET/PUT | Admin | View/update business rules (daily target, sales target, bonus %) |
| | `/api/admin/performance-ranking` | GET | Admin | Monthly employee leaderboard & KPI aggregate |
| | `/api/admin/performance-employee-detail/:id` | GET | Admin | Detailed employee breakdown & daily history |
| | `/api/admin/bonus-report` | GET | Admin | Bonus calculation summary per employee |
| | `/api/admin/bonus-report/export` | GET | Admin | Download Bonus CSV |
| | `/api/employee/performance` | GET | Authenticated | Own performance metrics |
| | `/api/employee/performance/daily-history`| GET | Authenticated | Day-by-day appointment breakdown for the month |
| **Customers** | `/api/customers` | GET/POST | Authenticated | List / create customer leads |
| | `/api/customers/:id` | PUT/DELETE | Authenticated | Update lead / delete lead |
| | `/api/customers/export` | GET | Authenticated | Export CSV of customer leads |
| **Orders** | `/api/orders` | GET/POST | Admin/Auth | List / create product & car orders |
| | `/api/orders/:id` | PUT/DELETE | Admin | Update / delete order |
| **Calling** | `/api/calling-records` | GET/POST | Admin | Manage telecalling daily reports |
| **Activities** | `/api/activities` | GET | Authenticated | Retrieve operational audit log |

---

## G. Existing Business Rules

1. **Daily Appointment Target**: Default 5/day. Configurable via `PerformanceTarget.dailyAppointmentTarget`.
2. **Monthly Sales Target**: Default ₹13,00,000. Configurable via `PerformanceTarget.monthlySalesTarget`.
3. **Bonus Formula**: Server-side calculation in `performanceService.js`:
   $$\text{excessSales} = \max(0, \text{achievedSales} - \text{monthlyTarget})$$
   $$\text{bonus} = \text{excessSales} \times \text{bonusRate}$$
   (Default `bonusRate` = 1% / 0.01).
4. **Working Days**: Monday–Saturday (array `[1, 2, 3, 4, 5, 6]`), configurable in `PerformanceTarget`.
5. **Ranking Tie-Breaking Algorithm**:
   1. `rankingScore` (50% appointment achievement capped at 100% + 50% sales achievement capped at 100%)
   2. Monthly sales volume (descending)
   3. Appointment achievement percentage (descending)
   4. Completed appointments count (descending)

---

## H. Missing Functionality & Gaps

1. **No Fine-Grained RBAC**: Missing granular roles (Super Admin, Manager, Team Leader, Employee, Viewer) and capability checks (`can(user, 'read', 'reports')`).
2. **Lookup / Master Data**: No central tables for Departments, Branches, Designations, Lead Sources, and Cancellation Reasons.
3. **Appointment Status Nuances**: Currently handles `Verified`, `Pending`, `Follow-up`, `Rejected`. Missing explicit support for `Rescheduled`, `No-Show`, and cancellation reason tracking.
4. **Department / Branch / Designation Filtering**: Missing from performance leaderboard.
5. **Database Integrity & Validations**: Currency values (`Order.amount`, `totalAmount`) are stored as floats/numbers rather than integer minor units (paise) or Decimal128.
6. **No Formal Database Migration Tool**: Database evolves via ad-hoc Mongoose scripts rather than versioned up/down migration scripts.
7. **No Automated Testing Suite**: Zero unit, integration, or E2E tests configured in `package.json`.
8. **Export Background Queuing**: Large CSV exports execute synchronously in the request loop rather than as background tasks.

---

## I. Security Risks

1. **Broken Authorization / IDOR on Customer Updates**:
   In `src/server/controllers/customerController.js` (`updateCustomer`), an authenticated employee can submit a `PUT /api/customers/:id` for a lead belonging to another employee and alter status, details, or verification status.
2. **Mass Assignment**:
   `updateCustomer` iterates over an array of fields from `req.body` without strict schema-level input sanitation.
3. **Binary Admin Checks**:
   Routes use `adminOnly` checking `req.user.role === "admin"`. If a user has role `"tl"` or `"manager"`, they are blocked from administrative views even though their operational duties require supervisory access.
4. **Absence of Rate Limiting**:
   No rate limiter is applied to `/api/auth/login`, creating risk of brute-force password guessing.
5. **Fallback Admin Credential Risk**:
   `authMiddleware.js` contains a fallback admin user structure (`admin-fallback`) if DB lookup fails under certain edge conditions.

---

## J. Performance Risks

1. **In-Memory Caching on Multi-Instance Environments**:
   `dashboardCache` and `targetCache` are stored in Node process memory (`new Map()`). In a clustered or serverless deployment, caches will desynchronize.
2. **Unindexed Field Lookups**:
   Filters on `leadBy` use case-insensitive regular expressions (`new RegExp(...)`), which bypass standard B-tree index lookups and can cause full collection scans on large datasets.
3. **Synchronous Reporting**:
   Bonus reports and customer CSV exports generate full strings in memory and write to the response buffer without streaming.
4. **N+1 Employee Aggregation**:
   `calculateEmployeeRankings` maps over all employees and executes separate asynchronous queries per employee rather than using a single MongoDB aggregation pipeline with `$lookup` and `$facet`.

---

## K. Data Integrity Risks

1. **Float Arithmetic for Financial Values**:
   `amount`, `totalAmount`, `bonus`, and `monthlySales` use standard JavaScript IEEE 754 floating-point numbers.
2. **Lack of Unique Compound Constraints**:
   An employee can accidentally create duplicate leads for the same car number or phone number on the same day because no compound unique index exists on `{ carNumber: 1, appointmentDate: 1 }`.
3. **Soft Delete Inconsistency**:
   `User` has `isDeleted`, but `Customer`, `Order`, and `CallingRecord` perform hard deletes (`findByIdAndDelete`), destroying operational audit trails.

---

## L. UI/UX Issues

1. **Missing Unified Error / Retry State**:
   If an API call fails, some cards show a fallback `0` or generic text rather than an explicit "Unable to load metric — Retry" UI component.
2. **Table Horizontal Overflow on Mobile**:
   Large data tables on `AdminPerformancePage.jsx` and `CustomersPage.jsx` require improved mobile card fallbacks on viewport widths < 768px.
3. **Form Validation Feedback**:
   Certain modals only display alert boxes (`alert(...)`) rather than integrated inline field error states.

---

## M. Recommended Implementation Phases

1. **Phase 1: Discovery & System Design Baseline** *(Current Phase)*
   - Deliver `CURRENT_STATE_AUDIT.md` and complete system architecture blueprint in `/docs/system-design.md`.
2. **Phase 2: Database Schema & Migration Foundation**
   - Introduce integer minor units (paise) for monetary amounts.
   - Add master data models: `Department`, `Branch`, `Designation`, `Lookup`.
   - Setup migration scripts and compound indexes (`carNumber` + `leadDate`, etc.).
3. **Phase 3: Centralized Security & RBAC Engine**
   - Implement `can(user, action, resource)` authorization framework.
   - Patch IDOR vulnerabilities in customer, order, and calling record controllers.
   - Implement rate limiting on auth endpoints.
4. **Phase 4: Unified Performance & Business Logic Engine**
   - Centralize all appointment, sales, target gap, bonus, and ranking rules in `performanceService.js`.
   - Implement single-roundtrip aggregation for leaderboards to eliminate N+1 queries.
   - Add support for rescheduled, cancelled, and no-show appointment tracking.
5. **Phase 5: Enterprise APIs & Reporting**
   - Add `/api/v2/` or clean REST endpoints matching enterprise standards.
   - Implement streaming/chunked CSV exports with proper date, department, and branch filters.
6. **Phase 6: Frontend Experience & Design System Polish**
   - Standardize loading, error, empty, and retry states across all KPI cards and tables.
   - Enhance mobile responsiveness (responsive cards on <768px screens).
7. **Phase 7: Testing & Verification**
   - Setup automated test framework (unit tests for performance formulas and bonus tiers).
   - Verify all boundary conditions (month boundaries, zero sales, 140% appointment overachievement).
8. **Phase 8: Documentation & Handover**
   - Provide complete architectural, database, security, and API documentation in `/docs/`.

---

## N. Files That Will Need Modification

1. **Core Models & Database**:
   - `src/server/models/User.js` (add department, branch, designation, role extensions)
   - `src/server/models/Customer.js` (add appointment sub-status: rescheduled, no-show, reason)
   - `src/server/models/PerformanceTarget.js` (expand tiered bonus/slab configurations)
   - `src/server/models/Department.js` (new)
   - `src/server/models/Branch.js` (new)
   - `src/server/models/Lookup.js` (new)
2. **Service & Domain Layer**:
   - `src/server/services/performanceService.js` (refactor for single aggregation, tie-breaking, tiered bonus)
   - `src/server/services/authorizationService.js` (new centralized RBAC)
3. **Controllers & Middlewares**:
   - `src/server/middleware/authMiddleware.js` (centralized RBAC integration)
   - `src/server/controllers/customerController.js` (fix IDOR, strict input validation)
   - `src/server/controllers/performanceController.js` (expand leaderboard filters: branch, dept)
   - `src/server/controllers/employeeController.js` (ensure scoped queries across all filters)
4. **Frontend Components**:
   - `src/pages-components/AdminPerformancePage.jsx` (add department/branch filters, empty/error retry states)
   - `src/pages-components/EmployeePerformancePage.jsx` (enhanced status badges, mobile view)
   - `src/pages-components/AdminDashboardPage.jsx` (enterprise KPI states)
   - `src/pages-components/EmployeeDashboardPage.jsx` (perfected time-scoping)

---

## O. Database Migrations Required

1. **Migration 001_seed_master_lookups**:
   - Seed standard departments (Sales, Telecalling, Inspection, Operations).
   - Seed branches and appointment status lookups.
2. **Migration 002_user_org_hierarchy**:
   - Populate `departmentId`, `branchId`, and `designation` references on existing `User` records.
3. **Migration 003_customer_appointment_integrity**:
   - Create compound index on `Customer`: `{ carNumber: 1, leadDate: 1 }` and `{ employeeId: 1, verificationStatus: 1, appointmentDate: 1 }`.
   - Normalize legacy records with missing `appointmentId`.
4. **Migration 004_currency_normalization**:
   - Add paise-based integer fields for order amount and sale value benchmarks.

---

## P. Questions & Assumptions Requiring Confirmation

1. **Appointment Conversion & Sale Value**:
   - *Current Implementation*: Each verified appointment contributes ₹65,000 to monthly sales benchmark (reaching ₹13L at 20 appointments) unless monetary car orders exist.
   - *Confirmation Needed*: Should sales achievement derive strictly from verified customer appointments at the configured lead value, or directly from the `Order.totalAmount` field, or allow the admin to toggle between the two?
2. **Bonus Rule Extensibility**:
   - *Current Implementation*: 1% on excess sales above ₹13,00,000.
   - *Confirmation Needed*: Do you require slab-based tiered bonuses immediately (e.g., 1% for ₹13L–₹15L, 2% above ₹15L), or should we build the schema for tiered rules while defaulting to the single flat percentage?
3. **Appointment Status Definitions**:
   - How should "Rescheduled" and "No-Show" appointments affect daily target calculations? (e.g., Excluded from target completion, but tracked as a quality metric)?
4. **Organizational Hierarchy**:
   - Are departments and branches fixed or dynamically created per company?
