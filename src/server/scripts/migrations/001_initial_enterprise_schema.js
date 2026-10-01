import mongoose from "mongoose";
import { DEFAULT_MONGO_URI } from "../../config/db.js";
import { Department } from "../../models/Department.js";
import { Branch } from "../../models/Branch.js";
import { Lookup } from "../../models/Lookup.js";
import { PerformanceTarget } from "../../models/PerformanceTarget.js";
import { User } from "../../models/User.js";
import { Customer } from "../../models/Customer.js";
import { Order } from "../../models/Order.js";

export async function runMigration() {
  const uri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
  console.log("Starting Enterprise Schema Migration against:", uri.replace(/\/\/.*@/, "//***@"));
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  // 1. Seed Departments
  console.log("Seeding default departments...");
  const defaultDepts = [
    { name: "Vehicle Inspection", code: "INSPECT", description: "Automotive inspection and evaluation" },
    { name: "Telecalling & Lead Gen", code: "TELECALL", description: "Inbound and outbound customer communications" },
    { name: "Sales & Operations", code: "SALES", description: "Direct retail and business car transactions" }
  ];

  for (const d of defaultDepts) {
    await Department.findOneAndUpdate(
      { code: d.code },
      { $setOnInsert: d },
      { upsert: true, new: true }
    );
  }
  const defaultDept = await Department.findOne({ code: "INSPECT" });

  // 2. Seed Branches
  console.log("Seeding default branches...");
  const defaultBranches = [
    { name: "New Delhi Central Hub", code: "DEL-01", city: "Delhi", state: "Delhi" },
    { name: "Gurugram Operations Hub", code: "GGN-01", city: "Gurugram", state: "Haryana" },
    { name: "Noida Sector 62 Hub", code: "NOI-01", city: "Noida", state: "Uttar Pradesh" }
  ];

  for (const b of defaultBranches) {
    await Branch.findOneAndUpdate(
      { code: b.code },
      { $setOnInsert: b },
      { upsert: true, new: true }
    );
  }
  const defaultBranch = await Branch.findOne({ code: "DEL-01" });

  // 3. Seed Lookups
  console.log("Seeding master lookups...");
  const lookups = [
    // Designations
    { type: "designation", code: "EXEC", label: "Executive", order: 1 },
    { type: "designation", code: "SR_EXEC", label: "Senior Executive", order: 2 },
    { type: "designation", code: "TL", label: "Team Leader", order: 3 },
    { type: "designation", code: "MGR", label: "Branch Manager", order: 4 },
    // Lead sources
    { type: "lead_source", code: "CARS24_INBOUND", label: "Cars24 Inbound Portal", order: 1 },
    { type: "lead_source", code: "DIRECT_WALKIN", label: "Direct Walk-in", order: 2 },
    { type: "lead_source", code: "TELECALLING", label: "Outbound Telecalling", order: 3 },
    { type: "lead_source", code: "REFERRAL", label: "Customer Referral", order: 4 },
    // Cancellation reasons
    { type: "cancellation_reason", code: "PRICE_MISMATCH", label: "Customer Price Expectation Mismatch", order: 1 },
    { type: "cancellation_reason", code: "TIME_CONFLICT", label: "Inspection Slot Conflict", order: 2 },
    { type: "cancellation_reason", code: "SOLD_OUTSIDE", label: "Vehicle Already Sold Elsewhere", order: 3 },
    { type: "cancellation_reason", code: "NO_SHOW", label: "Customer Did Not Arrive", order: 4 }
  ];

  for (const l of lookups) {
    await Lookup.findOneAndUpdate(
      { type: l.type, code: l.code },
      { $setOnInsert: l },
      { upsert: true }
    );
  }

  // 4. Ensure Default Active Performance Target
  console.log("Checking active performance target...");
  const activeTarget = await PerformanceTarget.findOne({ effectiveTo: null });
  if (!activeTarget) {
    console.log("Creating initial PerformanceTarget record...");
    await PerformanceTarget.create({
      effectiveFrom: new Date(2026, 0, 1),
      effectiveTo: null,
      dailyAppointmentTarget: 5,
      monthlySalesTarget: 1300000,
      bonusRate: 0.01,
      saleValuePerLead: 65000,
      salesMetricSource: "appointments",
      bonusType: "percentage",
      bonusTiers: [
        { minExcess: 0, maxExcess: 200000, rate: 0.01, fixedAmount: 0 },
        { minExcess: 200001, maxExcess: null, rate: 0.02, fixedAmount: 0 }
      ],
      workingDays: [1, 2, 3, 4, 5, 6],
      note: "Initial Enterprise baseline target configuration"
    });
  } else {
    // Ensure new fields exist
    if (!activeTarget.saleValuePerLead) activeTarget.saleValuePerLead = 65000;
    if (!activeTarget.salesMetricSource) activeTarget.salesMetricSource = "appointments";
    if (!activeTarget.bonusType) activeTarget.bonusType = "percentage";
    if (!activeTarget.bonusTiers || activeTarget.bonusTiers.length === 0) {
      activeTarget.bonusTiers = [
        { minExcess: 0, maxExcess: 200000, rate: 0.01, fixedAmount: 0 },
        { minExcess: 200001, maxExcess: null, rate: 0.02, fixedAmount: 0 }
      ];
    }
    await activeTarget.save();
  }

  // 5. Update existing users with default department and branch if missing
  console.log("Associating unassigned users with default organization units...");
  if (defaultDept && defaultBranch) {
    await User.updateMany(
      { departmentId: null },
      { $set: { departmentId: defaultDept._id, branchId: defaultBranch._id, designation: "Executive" } }
    );
  }

  // 6. Build and Sync Database Indexes
  console.log("Synchronizing collection indexes...");
  await Department.syncIndexes();
  await Branch.syncIndexes();
  await Lookup.syncIndexes();
  await User.syncIndexes();
  await Customer.syncIndexes();
  await Order.syncIndexes();
  await PerformanceTarget.syncIndexes();

  console.log("✅ Migration 001_initial_enterprise_schema completed successfully.");
}

// Allow direct execution
if (process.argv[1]?.endsWith("001_initial_enterprise_schema.js")) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
