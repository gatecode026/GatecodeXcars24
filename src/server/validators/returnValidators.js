import { body } from "express-validator";

const productTypes = ["GPS", "Vending Machine", "Disposal", "Other"];
const returnReasons = ["Product Damaged", "Wrong Product", "Product Not Working", "Extra Order", "Other"];
const returnStatuses = [
  "Return Requested",
  "Return Approved",
  "Pickup Scheduled",
  "Returned Successfully",
  "Return Rejected"
];

export const createReturnRequestValidator = [
  body("customerName").trim().notEmpty().withMessage("Customer name is required"),
  body("mobileNumber").matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10-digit mobile number"),
  body("pincode").matches(/^\d{6}$/).withMessage("Pincode must be 6 digits"),
  body("productType").isIn(productTypes).withMessage("Invalid product type"),
  body("numberOfUnitsReturning")
    .isInt({ min: 1 })
    .withMessage("Number of returning units must be at least 1"),
  body("returnReason").isIn(returnReasons).withMessage("Invalid return reason"),
  body("customReason")
    .optional()
    .custom((value, { req }) => {
      if (req.body.returnReason === "Other" && !value?.trim()) {
        throw new Error("Custom reason is required when return reason is Other");
      }
      return true;
    }),
  body("additionalDescription").optional().isString(),
  body("returnDate").optional()
];

export const updateReturnStatusValidator = [
  body("returnStatus").isIn(returnStatuses).withMessage("Invalid return status")
];
