# GatecodeXcars24 — API Contract Changes & Backward Compatibility Guide

**Date:** October 9, 2026  
**Auditor / Engineering Team:** Antigravity Senior Application Security & Engineering Team  
**Architecture:** Next.js 15 App Router (`app/api/[...slug]/route.js`), Mongoose 9, React 19

---

## 1. Overview of Contract Standardization

In accordance with Phase 2 requirements, all list and historical reporting endpoints have been transitioned from unbounded array responses to a standardized, server-paginated contract.

### Standard Response Envelope
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "perPage": 50,
    "total": 1250,
    "totalPages": 25,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Backward Compatibility Guarantee
All frontend components accessing `response.data.data` continue to receive the array of records without alteration. Existing client-side filtering, rendering, and length calculations remain intact. Consumers that support pagination can now consume the `response.data.pagination` metadata object.

---

## 2. Affected Endpoints & Contracts

### A. Customer Leads (`GET /api/customers`)
* **Previous Behavior:** Unbounded query returning `{ data: Customer[] }` (up to 1,000 documents).
* **New Contract:**
  * Query parameters supported: `page` (default 1), `limit` / `perPage` (default 50, capped at 1,000 for exports/bulk views), `all=true` (bounded ceiling of 2,000), `search`, `status`, `leadBy`, `period`, `fromDate`, `toDate`.
  * Response: `{ data: Customer[], pagination: { page, perPage, total, totalPages, hasNextPage, hasPreviousPage } }`.
  * Sorting: Stable sort with tie-breaker `{ createdAt: -1, _id: -1 }`.
* **Affected Consumers:** `src/pages-components/CustomersPage.jsx`, `src/pages-components/WhatsAppNotificationsPage.jsx`.

### B. Purchase Orders (`GET /api/orders`)
* **Previous Behavior:** Unbounded `Order.find(filter).lean()` returning `{ data: Order[] }`.
* **New Contract:**
  * Query parameters supported: `page` (default 1), `limit` / `perPage` (default 50, max 100), `all=true` (ceiling 2,000), `orderStatus`, `parcelStatus`, `search`.
  * Response: `{ data: Order[], pagination: { page, perPage, total, totalPages, hasNextPage, hasPreviousPage } }`.
  * Sorting: `{ createdAt: -1, _id: -1 }`.
* **Affected Consumers:** `src/pages-components/OrderManagePage.jsx`, `src/pages-components/OrderHistoryPage.jsx`.

### C. Return Requests (`GET /api/returns`)
* **Previous Behavior:** Unbounded `ReturnRequest.find(filter).lean()` returning `{ data: ReturnRequest[] }`.
* **New Contract:**
  * Query parameters supported: `page` (default 1), `limit` / `perPage` (default 50, max 100), `returnStatus`, `search`.
  * Response: `{ data: ReturnRequest[], pagination: { page, perPage, total, totalPages, hasNextPage, hasPreviousPage } }`.
  * Sorting: `{ createdAt: -1, _id: -1 }`.
* **Affected Consumers:** `src/pages-components/ReturnManagePage.jsx`, `src/pages-components/ReturnHistoryPage.jsx`.

### D. Calling Records (`GET /api/calling-records`)
* **Previous Behavior:** Unbounded `CallingRecord.find(filter).lean()` returning `{ data: CallingRecord[] }`.
* **New Contract:**
  * Query parameters supported: `page` (default 1), `limit` / `perPage` (default 50, max 100), `startDate`, `endDate`, `employeeId`.
  * Response: `{ data: CallingRecord[], pagination: { page, perPage, total, totalPages, hasNextPage, hasPreviousPage } }`.
  * Sorting: `{ date: -1, createdAt: -1, _id: -1 }`.
* **Affected Consumers:** `src/pages-components/CallingReportPage.jsx`.

### E. Employee Portal Endpoints
* **`GET /api/employee/orders`**: Standardized pagination with `{ data: Order[], pagination: { ... } }`.
* **`GET /api/employee/returns`**: Standardized pagination with `{ data: ReturnRequest[], pagination: { ... } }`.
* **`GET /api/employee/calling-records`**: Standardized pagination with `{ data: CallingRecord[], pagination: { ... } }`.
* **Affected Consumers:** `src/pages-components/EmployeeOrderPage.jsx`, `src/pages-components/EmployeeReturnPage.jsx`, `src/pages-components/EmployeeCallingReportPage.jsx`.

---

## 3. Mutation & Permission Contract Changes

### A. Employee Order Updates (`PUT /api/employee/orders/:id`)
* **Restriction:** Non-privileged employees (`role: "employee"`) can now only update contact and vehicle details (`customerName`, `mobileNumber`, `fullAddress`, `pincode`, `carModel`, `carNumber`, `fuelType`, `manufacturingYear`, `odometerKm`, `customProductName`, `numberOfUnits`).
* **Protected Fields:** `amount`, `totalAmount`, `advanceAmount`, `orderStatus`, `parcelStatus`, `trackingId`, `courierCompany`, `bankName` are stripped and rejected from regular employee requests to prevent status escalation or financial tampering. Only `tl`, `admin`, and `superadmin` can modify order statuses and financial amounts.
* **Deletion Protection:** Regular employees cannot delete orders in `Delivered` or `Approved` status.

### B. Employee Return Updates (`PUT /api/employee/returns/:id`)
* **Restriction:** Regular employees cannot mutate `returnStatus`. Only `tl`, `admin`, and `superadmin` can approve, reject, or complete return requests.
