import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/gatecodecars24";
await mongoose.connect(uri);

const hashedPassword = await bcrypt.hash("123456", 10);
const existing = await mongoose.connection.db.collection("users").findOne({
  $or: [{ username: "tl" }, { email: "tl@gatecode.in" }]
});

if (!existing) {
  const result = await mongoose.connection.db.collection("users").insertOne({
    name: "Team Leader (TL)",
    email: "tl@gatecode.in",
    username: "tl",
    password: hashedPassword,
    phoneNumber: "9876543211",
    role: "tl",
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log("TL user created with _id:", result.insertedId);
} else {
  await mongoose.connection.db.collection("users").updateOne(
    { _id: existing._id },
    { $set: { role: "tl" } }
  );
  console.log("TL user updated to role tl:", existing._id);
}

const all = await mongoose.connection.db.collection("users").find({}).toArray();
console.log("All users now:", all.map(u => ({ id: u._id, username: u.username, email: u.email, role: u.role })));
process.exit(0);
