import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

const DEFAULT_ADMIN_EMAIL = "surendraadmin@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "surendra";
const DEFAULT_ADMIN_NAME = "Surendra Admin";

export const ensureFixedAdminUser = async () => {
  // If an admin already exists in the database, preserve the active admin user!
  const existingAdmin = await User.findOne({ role: "admin" });
  if (!existingAdmin) {
    const adminEmail = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || DEFAULT_ADMIN_NAME;

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin"
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    console.log(`Fixed admin user ready: ${adminEmail}`);
  }
};


