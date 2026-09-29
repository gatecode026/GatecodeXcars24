import "dotenv/config";
import { connectDB } from "../config/db.js";
import { Customer } from "../models/Customer.js";
import { Order } from "../models/Order.js";
import { CallingRecord } from "../models/CallingRecord.js";
import { ReturnRequest } from "../models/ReturnRequest.js";
import { EmployeeRecord } from "../models/EmployeeRecord.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { User } from "../models/User.js";
import { ensureFixedAdminUser } from "../config/seedAdmin.js";

async function cleanSlate() {
  await connectDB();
  const adminEmail = (process.env.ADMIN_EMAIL || "uttam306115@gmail.com").toLowerCase();

  console.log("Purging all previous records...");
  const c1 = await Customer.deleteMany({});
  const c2 = await Order.deleteMany({});
  const c3 = await CallingRecord.deleteMany({});
  const c4 = await ReturnRequest.deleteMany({});
  const c5 = await EmployeeRecord.deleteMany({});
  const c6 = await ActivityLog.deleteMany({});
  const c7 = await User.deleteMany({ email: { $ne: adminEmail } });

  console.log(`Deleted:
- Customers: ${c1.deletedCount}
- Orders: ${c2.deletedCount}
- Calling Records: ${c3.deletedCount}
- Returns: ${c4.deletedCount}
- Employee Records: ${c5.deletedCount}
- Activity Logs: ${c6.deletedCount}
- Non-admin Users: ${c7.deletedCount}`);

  await ensureFixedAdminUser();

  const users = await User.find({}, { name: 1, email: 1, role: 1 }).lean();
  console.log("Remaining users:", users);

  console.log("Database is now 100% clean and fresh!");
  process.exit(0);
}

cleanSlate().catch((err) => {
  console.error("Clean slate failed:", err);
  process.exit(1);
});
