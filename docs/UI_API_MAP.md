# GatecodeXcars24 — UI to API Route Mapping

This reference document defines the complete mapping between all frontend views, interactive components, and backend REST API endpoints in **GatecodeXcars24**.

---

## 1. Authentication & Session Scoping

| UI View / Component | HTTP Method & Route | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `LoginPage.jsx` (Admin Tab) | `POST /api/auth/login` | Public | Authenticates admin, validates password, issues JWT with `tokenVersion`. |
| `LoginPage.jsx` (Executive Tab) | `POST /api/auth/login` | Public | Authenticates sales executive with role-restricted scope. |
| Any Authenticated View | `GET /api/auth/me` | Protected | Validates active session and confirms `tokenVersion` matches database. |
| Sidebar Logout Button | `POST /api/auth/logout` | Protected | Clears client session and redirects to `/login`. |

---

## 2. Dashboard & KPI Analytics

| UI View / Component | HTTP Method & Route | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `AdminDashboardPage.jsx` (KPI Cards) | `GET /api/dashboard/summary` | Admin | Fetches `totalLeads`, `todayLeads`, `pendingFollowUps`, `todayAppointments`, `verifiedLeads`, `carsPurchased`. |
| `AdminDashboardPage.jsx` (Performance Chart) | `GET /api/dashboard/summary` | Admin | Delivers real MongoDB 7-day aggregation (`performanceTrend`) for SVG area chart. |
| `AdminDashboardPage.jsx` (Top Employees) | `GET /api/dashboard/summary` | Admin | Groups leads by sales executive and calculates conversion rates. |
| `AdminDashboardPage.jsx` (Recent Leads) | `GET /api/dashboard/summary` | Admin | Returns latest 10 automotive leads with `appointmentId` and status. |
| `EmployeeDashboardPage.jsx` | `GET /api/employee/dashboard` | Employee | Returns personal order count, lead counts, and approved incentive total. |

---

## 3. Leads & Appointment Operations

| UI View / Component | HTTP Method & Route | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `CustomersPage.jsx` (Table & Filter Tabs) | `GET /api/customers` | Protected | Fetches leads with optional query params (`?search=`, `?status=`, `?verified=`, `?employeeId=`). |
| `AdminDashboardPage.jsx` (`+ Add New Lead`) | `POST /api/customers` | Protected | Creates new customer lead with auto-generated `AP-XXXXX`, car number, and appointment date. |
| `CustomersPage.jsx` (`+ Add New Lead`) | `POST /api/customers` | Protected | Creates new customer lead with auto-generation and validation. |
| Lead Detail Drawer (Status Quick Switch) | `PUT /api/customers/:id` | Protected | Updates `verificationStatus` (Pending / Follow-up / Verified / Completed). |
| Customer Edit Modal | `PUT /api/customers/:id` | Protected | Updates remark, contact details, car number, and inspection notes. |
| Lead Actions (Delete) | `DELETE /api/customers/:id` | Admin Only | Removes lead record and creates audit entry in `EmployeeRecord`. |

---

## 4. Cars Purchased, Sold & Inventory Operations

| UI View / Component | HTTP Method & Route | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `OrderManagePage.jsx` (Cars Purchased) | `GET /api/orders` | Protected | Fetches procurement records, chassis numbers, and status. |
| `OrderPage.jsx` (New Vehicle Purchase) | `POST /api/orders` | Protected | Registers new acquired car with buyer/seller particulars and amounts. |
| `OrderHistoryPage.jsx` | `GET /api/orders/history` | Protected | Full chronological log of completed car transactions. |
| `SalesPage.jsx` & `RevenuePage.jsx` | `GET /api/analytics/sales` | Admin Only | Financial breakdown, sales volume, margin analysis, and payout summaries. |
| `ReturnManagePage.jsx` (Cancellations) | `GET /api/returns` | Protected | Inspection disputes, booking cancellations, and return logistics. |

---

## 5. Employee Management & Performance

| UI View / Component | HTTP Method & Route | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `UsersPage.jsx` (Employee Directory) | `GET /api/users` | Admin Only | Lists registered administrators and sales executives. |
| `RegisterPage.jsx` | `POST /api/users/register` | Admin Only | Registers a new sales executive or operations staff member. |
| `AdminPerformancePage.jsx` | `GET /api/employee-records` | Admin Only | Evaluates individual executive conversion rates and targets. |
| `CallingReportPage.jsx` | `GET /api/calling-records` | Protected | Telecalling logs, customer feedback, and follow-up schedules. |

---

## 6. System Audit & Communication

| UI View / Component | HTTP Method & Route | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `ActivityLogsPage.jsx` | `GET /api/employee-records` | Admin Only | Real-time audit trail of all platform mutations (`?type=lead`, `?type=appointment`, etc.). |
| `WhatsAppNotificationsPage.jsx` | Client-Side Web API + `POST /api/employee-records` | Protected | Pre-populates formatted WhatsApp templates and launches WhatsApp Web while logging activity. |
| PDF Export Controls | Client-Side (`jsPDF` + `autoTable`) | Protected | Generates downloadable branded PDF reports directly in-browser. |
