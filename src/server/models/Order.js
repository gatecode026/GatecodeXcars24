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
    carNumber: { type: String, default: "", trim: true },
    carModel: { type: String, default: "", trim: true },
    fuelType: { type: String, default: "Petrol", trim: true },
    manufacturingYear: { type: String, default: "", trim: true },
    odometerKm: { type: Number, default: 0 },
    productType: {
      type: String,
      default: "Car",
      trim: true
    },
    customProductName: { type: String, default: "" },
    numberOfUnits: { type: Number, default: 1, min: 1 },
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
      default: ""
    }
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ employeeId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ parcelStatus: 1 });
orderSchema.index({ mobileNumber: 1 });
orderSchema.index({ customerName: 1 });

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
