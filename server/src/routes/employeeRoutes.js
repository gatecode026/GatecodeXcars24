import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getEmployeeDashboard,
  getEmployeeOrdersHistory,
  getEmployeeReturnsHistory,
  updateEmployeeOrder,
  deleteEmployeeOrder,
  updateEmployeeReturn,
  deleteEmployeeReturn,
  getEmployeeCallingRecords,
  createEmployeeCallingRecord,
  updateEmployeeCallingRecord,
  deleteEmployeeCallingRecord
} from "../controllers/employeeController.js";

const router = express.Router();

router.get("/dashboard", protect, getEmployeeDashboard);
router.get("/orders", protect, getEmployeeOrdersHistory);
router.get("/returns", protect, getEmployeeReturnsHistory);
router.put("/orders/:id", protect, updateEmployeeOrder);
router.delete("/orders/:id", protect, deleteEmployeeOrder);
router.put("/returns/:id", protect, updateEmployeeReturn);
router.delete("/returns/:id", protect, deleteEmployeeReturn);
router.get("/calling-records", protect, getEmployeeCallingRecords);
router.post("/calling-records", protect, createEmployeeCallingRecord);
router.put("/calling-records/:id", protect, updateEmployeeCallingRecord);
router.delete("/calling-records/:id", protect, deleteEmployeeCallingRecord);

export default router;
