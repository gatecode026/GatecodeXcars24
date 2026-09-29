import mongoose from "mongoose";

/**
 * PerformanceTarget — stores configurable target configurations with effective dates.
 * Every change creates a new record so historical calculations remain accurate.
 */
const performanceTargetSchema = new mongoose.Schema(
  {
    // When this configuration becomes active (start of day UTC)
    effectiveFrom: { type: Date, required: true },
    // Null means "current / open-ended"
    effectiveTo: { type: Date, default: null },

    // Core targets
    dailyAppointmentTarget: { type: Number, required: true, default: 5, min: 1 },
    monthlySalesTarget: { type: Number, required: true, default: 1300000, min: 0 },
    bonusRate: { type: Number, required: true, default: 0.01, min: 0, max: 1 }, // stored as decimal e.g. 0.01 = 1%

    // Working days: array of JS day-of-week integers (0=Sun,1=Mon,...,6=Sat)
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6], // Mon–Sat
      validate: {
        validator: (arr) => arr.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
        message: "workingDays must contain integers 0–6"
      }
    },

    // Audit fields
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedByName: { type: String, default: "" },
    note: { type: String, default: "" },

    // Snapshot of previous values for audit trail
    previousValues: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

performanceTargetSchema.index({ effectiveFrom: -1 });
performanceTargetSchema.index({ effectiveTo: 1 });

export const PerformanceTarget =
  mongoose.models.PerformanceTarget ||
  mongoose.model("PerformanceTarget", performanceTargetSchema);
