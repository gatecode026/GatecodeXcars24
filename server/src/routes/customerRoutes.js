import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getEmployeesList
} from "../controllers/customerController.js";

const router = express.Router();

router.get("/employees-list", protect, getEmployeesList);
router.get("/", protect, getCustomers);
router.post("/", protect, createCustomer);
router.put("/:id", protect, updateCustomer);
router.delete("/:id", protect, deleteCustomer);

export default router;
