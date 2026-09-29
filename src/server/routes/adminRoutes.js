import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getEmployeePerformance,
  getEmployeeHistory,
  getEmployeeDetails,
  getEmployeeSummary,
  getRevenueSummary,
  getSalesSummary
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/revenue-summary", protect, adminOnly, getRevenueSummary);
router.get("/sales-summary", protect, adminOnly, getSalesSummary);
router.get("/employee-performance", protect, adminOnly, getEmployeePerformance);
router.get("/employee-history", protect, adminOnly, getEmployeeHistory);
router.get("/employee-summary", protect, adminOnly, getEmployeeSummary);
router.get("/employee-details/:id", protect, adminOnly, getEmployeeDetails);

export default router;
