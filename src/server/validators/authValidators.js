import { body } from "express-validator";

export const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("phoneNumber").trim().notEmpty().withMessage("Mobile number is required"),
  body("username").optional().trim()
];

export const loginValidator = [
  body("email").trim().notEmpty().withMessage("Email or username is required"),
  body("password").notEmpty().withMessage("Password is required")
];
