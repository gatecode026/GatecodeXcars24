import mongoose from "mongoose";

const employeeRecordSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    employeeName: { type: String, required: true },
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ["order", "return", "lead", "appointment", "verification", "telecalling", "other"],
      default: "other"
    },
    description: { type: String, default: "" },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

employeeRecordSchema.index({ employeeId: 1, date: -1 });

export const EmployeeRecord = mongoose.models.EmployeeRecord || mongoose.model("EmployeeRecord", employeeRecordSchema);
