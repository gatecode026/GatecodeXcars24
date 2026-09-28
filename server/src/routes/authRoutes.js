import express from "express";
import { loginAdmin, registerUser, getUsers, getUserById, updateUser, deleteUser, logoutUser } from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";
import { loginValidator, registerValidator } from "../validators/authValidators.js";

const router = express.Router();

router.post("/login", loginValidator, validateRequest, loginAdmin);
router.post("/logout", protect, logoutUser);
router.post("/register", protect, adminOnly, registerValidator, validateRequest, registerUser);
router.get("/users", protect, adminOnly, getUsers);
router.get("/users/:id", protect, adminOnly, getUserById);
router.put("/users/:id", protect, adminOnly, updateUser);
router.delete("/users/:id", protect, adminOnly, deleteUser);

export default router;
