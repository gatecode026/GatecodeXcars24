import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, trim: true },
    username: { type: String, trim: true, unique: true, sparse: true },
    role: { type: String, enum: ["admin", "user", "employee"], default: "user" },
    tokenVersion: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
