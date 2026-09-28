import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    employeeName: { type: String, default: "" },
    customerName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    alternateMobileNumber: { type: String, default: "", trim: true },
    fullAddress: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    productType: {
      type: String,
      enum: ["GPS", "Vending Machine", "Disposal", "Other"],
      required: true
    },
    customProductName: { type: String, default: "" },
    numberOfUnits: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    advanceAmount: { type: Number, required: true, min: 0 },
    paymentScreenshot: { type: String, default: "" },
    dateOfOrder: { type: Date, default: Date.now },
    orderStatus: {
      type: String,
      enum: ["Pending", "Approved", "Processing", "Delivered", "Cancelled"],
      default: "Pending"
    },
    parcelStatus: {
      type: String,
      enum: ["Pending", "Process", "Parcel", "Packed", "Dispatched", "Delivered"],
      default: "Pending"
    },
    trackingId: { type: String, default: "" },
    courierCompany: { type: String, default: "" },
    bankName: {
      type: String,
      enum: ["SBI", "BOB", "BOM", "MGB", "UPGB", "MPGB"],
      default: ""
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
