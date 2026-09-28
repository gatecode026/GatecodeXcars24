import mongoose from "mongoose";

const returnRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    employeeName: { type: String, default: "" },
    customerName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    productType: {
      type: String,
      enum: ["GPS", "Vending Machine", "Disposal", "Other"],
      required: true
    },
    numberOfUnitsReturning: { type: Number, required: true, min: 1 },
    returnReason: {
      type: String,
      enum: ["Product Damaged", "Wrong Product", "Product Not Working", "Extra Order", "Other"],
      required: true
    },
    customReason: { type: String, default: "" },
    additionalDescription: { type: String, default: "" },
    returnDate: { type: Date, default: Date.now },
    returnStatus: {
      type: String,
      enum: ["Return Requested", "Return Approved", "Pickup Scheduled", "Returned Successfully", "Return Rejected"],
      default: "Return Requested"
    }
  },
  { timestamps: true }
);

export const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);
