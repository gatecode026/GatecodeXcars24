import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getCallingRecords,
  createCallingRecord,
  deleteCallingRecord
} from "../controllers/callingRecordController.js";

const router = express.Router();

router.get("/", protect, adminOnly, getCallingRecords);
router.post("/", protect, adminOnly, createCallingRecord);
router.delete("/:id", protect, adminOnly, deleteCallingRecord);

export default router;
