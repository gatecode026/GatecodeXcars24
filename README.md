# GatecodeXcars24

**Used-Car CRM & Operations Platform (Next.js Unified Full-Stack)**

Enterprise automotive operations and customer relationship management platform featuring admin operations, team leader controls, executive CRM, car procurement, order lifecycle tracking, customer management, calling records, and performance metrics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, Unified Full-Stack) |
| **Frontend** | React 19 + Axios + React-Router-DOM compatibility layer |
| **Backend API** | Next.js Route Handlers (`app/api/[...slug]`, `app/api/health`) |
| **Database** | MongoDB (via Mongoose ODM with connection caching) |
| **Auth** | bcryptjs hashing + JSON Web Tokens (JWT) |
| **Validation** | express-validator execution in Next.js handlers + custom utils |
| **File Upload** | Native multipart form handling + `/uploads/[...path]` route handler |
| **PDF** | jsPDF + jspdf-autotable |
| **Design** | Clean SaaS Light UI with GatecodeXcars24 Official Brand Colors |

## Folder Structure

```
GatecodeXcars24/
├── app/                       # Next.js App Router
│   ├── layout.jsx             # Root layout with fonts, AuthProvider & styles
│   ├── page.jsx               # Root role-based redirect
│   ├── not-found.jsx          # Fallback 404 handler
│   ├── login/                 # Login routes (/login, /login/admin)
│   ├── admin/                 # Admin layout & 20+ subpages
│   ├── employee/              # Employee layout & subpages
│   ├── api/                   # Unified API route handlers (/api/[...slug], /api/health)
│   └── uploads/               # Dynamic uploads image server with SVG fallback
├── src/
│   ├── api/                   # Universal Axios client
│   ├── compat/                # react-router-dom compatibility layer
│   ├── components/            # Reusable UI components (Sidebar, TopNavbar, Tables, etc.)
│   ├── context/               # AuthContext & SidebarContext
│   ├── pages-components/      # 23 full page components (100% original UI & logic)
│   ├── server/                # Backend controllers, models, config, validators, services
│   ├── styles/                # Complete CSS design system (index.css)
│   └── utils/                 # Client-side validators
├── public/                    # Static assets & brand logos
│   └── uploads/               # Uploaded payment screenshots
├── .env.local                 # Next.js environment configuration
├── next.config.mjs            # Next.js configuration
├── package.json               # Next.js unified dependencies & scripts
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Locally

```bash
# Start Next.js development server
npm run dev

# Or build and run production server
npm run build
npm start
```

### 2. Backend Setup

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and fill in:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | Token expiry (default: 1d) |
| `ADMIN_EMAIL` | Auto-seeded admin email |
| `ADMIN_PASSWORD` | Auto-seeded admin password |
| `ADMIN_NAME` | Auto-seeded admin name |

```bash
cd server
npm run dev
```

### 3. Frontend Setup

```bash
cp client/.env.example client/.env
cd client
npm run dev
```

The app starts at `http://localhost:5173` (Vite default).

### Run Both Concurrently

From the root:

```bash
npm run dev
```

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (admin or employee) |

### Orders
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/orders` | Create an order |
| GET | `/api/orders` | List orders (admin JWT) |
| PATCH | `/api/orders/:id/status` | Update order status |
| DELETE | `/api/orders/:id` | Delete an order |

### Returns
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/returns` | Create a return request |
| GET | `/api/returns` | List returns (admin JWT) |
| PATCH | `/api/returns/:id/status` | Update return status |

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/summary` | Dashboard summary data |

### Employees
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/employee` | Create employee |
| GET | `/api/employee` | List employees |
| PATCH | `/api/employee/:id` | Update employee |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin` | List admins (GET) |

### Customers
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/customers` | Create customer |
| GET | `/api/customers` | List customers |

### Calling Records
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/calling-records` | Create calling record |
| GET | `/api/calling-records` | List calling records |

### Employee Records
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/employee-records` | Get employee records |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | API health check |

## Authentication

- **Admin registration is disabled**. A fixed admin is auto-created on server start using env variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`).
- Default admin: `sales@rmaxiot.in` / `rmax@2026`
- Login at `/admin/login` (admin) or `/login` (employee)
- Employees can be registered through the admin panel.

## Deployment

### Render (Backend)
The `render.yaml` file contains the service definition. Set `MONGO_URI` and `JWT_SECRET` as environment variables in the Render dashboard.

### Vercel (Frontend)
Set `VITE_API_BASE_URL` to the backend URL.

## Environment Variables

### Server (`server/.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/bpo-management
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-password
ADMIN_NAME=Admin Name
```

### Client (`client/.env`)
```
VITE_API_BASE_URL=/api
```
