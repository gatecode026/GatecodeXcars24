import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    employeeName: { type: String, required: true },
    customerName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    remark: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    distCordinate: { type: String, enum: ["", "CSP Incharge", "DC", "SH", "NH"], default: "" },
    followUp: { type: String, enum: ["Convert", "Converted", "Follow-up"], default: "Convert" },

    // Automotive CRM fields (GatecodeXcars24)
    appointmentId: { type: String, trim: true, default: "" },
    leadDate: { type: Date, default: Date.now },
    appointmentDate: { type: Date, default: null },
    carNumber: { type: String, trim: true, default: "" },
    leadBy: { type: String, trim: true, default: "" },
    followUpBy: { type: String, trim: true, default: "" },
    followUpDate: { type: Date, default: null },
    verified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["Verified", "Pending", "Follow-up", "Rejected"],
      default: "Pending"
    },
    odometerKm: { type: Number, default: 0 },
    leadStatus: {
      type: String,
      enum: ["Verified", "Pending", "Follow-up", "Completed", "Cancelled"],
      default: "Pending"
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

customerSchema.pre("save", function () {
  if (!this.appointmentId) {
    const idPart = this._id ? String(this._id).slice(-5).toUpperCase() : Math.floor(10000 + Math.random() * 90000);
    this.appointmentId = `AP-${idPart}`;
  }
  if (!this.leadBy) {
    this.leadBy = this.employeeName;
  }
  if (this.verificationStatus === "Verified") {
    this.verified = true;
    this.leadStatus = "Verified";
  } else if (this.verificationStatus === "Follow-up") {
    this.verified = false;
    this.leadStatus = "Follow-up";
  } else if (this.verificationStatus === "Pending") {
    this.verified = false;
    this.leadStatus = "Pending";
  } else if (this.verificationStatus === "Rejected") {
    this.verified = false;
    this.leadStatus = "Cancelled";
  }
});

customerSchema.index({ createdAt: -1 });
customerSchema.index({ appointmentDate: 1 });
customerSchema.index({ verificationStatus: 1 });
customerSchema.index({ employeeId: 1, createdAt: -1 });
customerSchema.index({ employeeId: 1, verificationStatus: 1 });
customerSchema.index({ employeeId: 1, appointmentDate: 1 });
customerSchema.index({ employeeId: 1, verificationStatus: 1, appointmentDate: 1 });
customerSchema.index({ leadDate: -1 });
customerSchema.index({ carNumber: 1 });
customerSchema.index({ appointmentId: 1 });
customerSchema.index({ mobile: 1 });
customerSchema.index({ customerName: 1 });
customerSchema.index({ leadBy: 1 });
customerSchema.index({ followUpBy: 1 });
customerSchema.index({ assignedTo: 1 });

export const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema);

