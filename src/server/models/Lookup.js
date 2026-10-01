import mongoose from "mongoose";

const lookupSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      enum: ["designation", "lead_source", "cancellation_reason", "dist_coordinate"]
    },
    code: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

lookupSchema.index({ type: 1, code: 1 }, { unique: true });
lookupSchema.index({ type: 1, order: 1 });

export const Lookup =
  mongoose.models.Lookup || mongoose.model("Lookup", lookupSchema);
