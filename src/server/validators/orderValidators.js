import { body } from "express-validator";

const productTypes = [
  "Hatchback",
  "Sedan",
  "SUV",
  "Compact SUV",
  "MUV",
  "Luxury",
  "Commercial",
  "Used Car",
  "Car",
  "GPS",
  "Vending Machine",
  "Disposal",
  "Other"
];
const orderStatuses = ["Pending", "Approved", "Processing", "Delivered", "Cancelled"];
const parcelStatuses = ["Pending", "Process", "Parcel", "Packed", "Dispatched", "Delivered"];
const bankNames = ["SBI", "BOB", "BOM", "MGB", "UPGB", "MPGB"];

export const createOrderValidator = [
  body("customerName").trim().notEmpty().withMessage("Customer name is required"),
  body("mobileNumber").matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10-digit mobile number"),
  body("alternateMobileNumber").optional({ values: "falsy" }).matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10-digit alternate mobile number"),
  body("fullAddress").trim().notEmpty().withMessage("Full address is required"),
  body("pincode").matches(/^\d{6}$/).withMessage("Pincode must be 6 digits"),
  body("carModel").optional().trim().isString(),
  body("carNumber").optional().trim().isString(),
  body("fuelType").optional().trim().isString(),
  body("productType").optional().isString(),
  body("customProductName").optional().isString(),
  body("numberOfUnits").optional().isInt({ min: 1 }).withMessage("Number of units must be at least 1"),
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
  body("bankName").optional({ values: "falsy" }).isString()
];

export const updateOrderStatusValidator = [
  body("orderStatus").isIn(orderStatuses).withMessage("Invalid order status")
];

export const updateParcelStatusValidator = [
  body("parcelStatus").isIn(parcelStatuses).withMessage("Invalid parcel status"),
  body("trackingId").optional().trim().isString(),
  body("courierCompany").optional().trim().isString()
];
