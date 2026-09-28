import express from "express";
import { getDashboardSummary } from "../controllers/dashboardController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/summary", protect, adminOnly, getDashboardSummary);

export default router;
