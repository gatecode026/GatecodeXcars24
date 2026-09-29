import { validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const firstMsg = errors.array()[0]?.msg || "Validation failed";
  return res.status(400).json({
    message: firstMsg,
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg }))
  });
};
