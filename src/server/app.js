import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import returnRoutes from "./routes/returnRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import employeeRecordRoutes from "./routes/employeeRecordRoutes.js";
import callingRecordRoutes from "./routes/callingRecordRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/uploads", (req, res, next) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.status(404).send(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="100%" height="100%" fill="#1e293b"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#94a3b8">Screenshot Not Found</text>
    </svg>`
  );
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/employee-records", employeeRecordRoutes);
app.use("/api/calling-records", callingRecordRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/activities", activityRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
