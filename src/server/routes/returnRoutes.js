import express from "express";
import {
  createReturnRequest,
  getReturnRequests,
  updateReturn,
  updateReturnStatus,
  deleteReturn
} from "../controllers/returnController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";
import {
  createReturnRequestValidator,
  updateReturnStatusValidator
} from "../validators/returnValidators.js";

const router = express.Router();

router.post("/", protect, createReturnRequestValidator, validateRequest, createReturnRequest);
router.get("/", protect, adminOnly, getReturnRequests);
router.put("/:id", protect, adminOnly, updateReturn);
router.patch("/:id/status", protect, adminOnly, updateReturnStatusValidator, validateRequest, updateReturnStatus);
router.delete("/:id", protect, adminOnly, deleteReturn);

export default router;
