import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, trim: true },
    username: { type: String, trim: true, unique: true, sparse: true },
    role: {
      type: String,
      enum: ["superadmin", "admin", "manager", "tl", "employee", "viewer", "user"],
      default: "employee"
    },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
    designation: { type: String, trim: true, default: "Executive" },
    joiningDate: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ departmentId: 1 });
userSchema.index({ branchId: 1 });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
