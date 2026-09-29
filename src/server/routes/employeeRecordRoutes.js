import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getEmployeeRecords,
  createEmployeeRecord,
  deleteEmployeeRecord
} from "../controllers/employeeRecordController.js";

const router = express.Router();

router.get("/", protect, adminOnly, getEmployeeRecords);
router.post("/", protect, adminOnly, createEmployeeRecord);
router.delete("/:id", protect, adminOnly, deleteEmployeeRecord);

export default router;
