import { body } from "express-validator";

const productTypes = ["GPS", "Vending Machine", "Disposal", "Other"];
const orderStatuses = ["Pending", "Approved", "Processing", "Delivered", "Cancelled"];
const parcelStatuses = ["Pending", "Process", "Parcel", "Packed", "Dispatched", "Delivered"];
const bankNames = ["SBI", "BOB", "BOM", "MGB", "UPGB", "MPGB"];

export const createOrderValidator = [
  body("customerName").trim().notEmpty().withMessage("Customer name is required"),
  body("mobileNumber").matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10-digit mobile number"),
  body("alternateMobileNumber").optional({ values: "falsy" }).matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10-digit alternate mobile number"),
  body("fullAddress").trim().notEmpty().withMessage("Full address is required"),
  body("pincode").matches(/^\d{6}$/).withMessage("Pincode must be 6 digits"),
  body("productType").isIn(productTypes).withMessage("Invalid product type"),
  body("customProductName")
    .optional()
    .isString()
    .custom((value, { req }) => {
      if (req.body.productType === "Other" && !value?.trim()) {
        throw new Error("Custom product name is required for Other product type");
      }
      return true;
    }),
  body("numberOfUnits").isInt({ min: 1 }).withMessage("Number of units must be at least 1"),
  body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
  body("advanceAmount")
    .isFloat({ min: 0 })
    .withMessage("Advance amount must be a positive number")
    .custom((value, { req }) => {
      const units = Number(req.body.numberOfUnits || 0);
      const amount = Number(req.body.amount || 0);
      const totalAmount = units * amount;
      if (Number(value) > totalAmount) {
        throw new Error("Advance amount cannot be greater than total amount");
      }
      return true;
    }),
  body("dateOfOrder").optional(),
  body("bankName").notEmpty().withMessage("Bank name is required").isIn(bankNames).withMessage("Invalid bank name")
];

export const updateOrderStatusValidator = [
  body("orderStatus").isIn(orderStatuses).withMessage("Invalid order status")
];

export const updateParcelStatusValidator = [
  body("parcelStatus").isIn(parcelStatuses).withMessage("Invalid parcel status"),
  body("trackingId").optional().trim().isString(),
  body("courierCompany").optional().trim().isString()
];
