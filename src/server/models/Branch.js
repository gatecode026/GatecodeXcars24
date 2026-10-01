import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

branchSchema.index({ city: 1 });
branchSchema.index({ isActive: 1 });

export const Branch =
  mongoose.models.Branch || mongoose.model("Branch", branchSchema);
