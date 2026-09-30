import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, trim: true },
    username: { type: String, trim: true, unique: true, sparse: true },
    role: { type: String, enum: ["admin", "tl", "user", "employee"], default: "user" },
    tokenVersion: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ isDeleted: 1 });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
