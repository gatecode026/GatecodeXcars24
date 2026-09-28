# GatecodeXcars24

**Used-Car CRM & Operations Platform**

Enterprise automotive operations and customer relationship management platform featuring admin operations, team leader controls, executive CRM, car procurement, order lifecycle tracking, customer management, calling records, and performance metrics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite 8 + React Router 7 + Axios |
| **Backend** | Node.js + Express 5 + Mongoose + JWT |
| **Database** | MongoDB (via Mongoose ODM) |
| **Auth** | bcryptjs hashing + JSON Web Tokens |
| **Validation** | express-validator (server) + custom utils (client) |
| **File Upload** | Multer |
| **PDF** | jsPDF + jspdf-autotable |
| **Design** | Clean SaaS Light UI with GatecodeXcars24 Official Brand Colors |

## Folder Structure

```
GatecodeXcars24/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── api/               # Axios client
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # Auth context provider
│   │   ├── pages/             # Page components
│   │   ├── utils/             # Client-side validators
│   │   ├── App.jsx            # Routes & layout
│   │   └── main.jsx           # Entry point
│   └── .env.example
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # DB connection, seed admin
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth, validation, upload, error handling
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # Express route definitions
│   │   ├── validators/        # express-validator rules
│   │   ├── app.js             # Express app setup
│   │   └── server.js          # Entry point
│   ├── uploads/               # Uploaded files
│   └── .env.example
├── package.json               # Monorepo workspaces
└── render.yaml                # Render deployment config
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)

### 1. Clone & Install

```bash
cd GatecodeXcars24
npm install
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
