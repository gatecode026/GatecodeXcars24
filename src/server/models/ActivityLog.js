import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, required: false },
    performedByName: { type: String, required: true },
    performedByRole: { type: String, default: "employee" },
    actionType: {
      type: String,
      enum: ["LEAD_CREATED", "LEAD_UPDATED", "APPOINTMENT_SCHEDULED", "STATUS_CHANGED", "LEAD_DELETED"],
      required: true
    },
    targetCustomerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    appointmentId: { type: String, default: "" },
    customerName: { type: String, default: "" },
    carNumber: { type: String, default: "" },
    affectedEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    affectedEmployeeName: { type: String, default: "" },
    title: { type: String, required: true },
    details: { type: String, required: true },
    employeeMessage: { type: String, default: "" },
    adminMessage: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ performedBy: 1, createdAt: -1 });
activityLogSchema.index({ affectedEmployeeId: 1, createdAt: -1 });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);
