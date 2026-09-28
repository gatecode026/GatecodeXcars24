import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dns.setServers(['1.1.1.1']);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const orders = await db.collection("orders").find({
    createdAt: { $gte: oneDayAgo }
  }).toArray();
  
  console.log("=== ORDERS CREATED IN THE LAST 24 HOURS ===");
  if (orders.length === 0) {
    console.log("No orders found in the last 24 hours.");
  } else {
    orders.forEach(o => {
      console.log(`Order ID: ${o._id}`);
      console.log(`Customer: ${o.customerName}`);
      console.log(`Employee: ${o.employeeName}`);
      console.log(`Payment Screenshot: "${o.paymentScreenshot}"`);
      console.log(`Courier Company: "${o.courierCompany}"`);
      console.log(`Created At: ${o.createdAt}`);
      console.log("------------------------");
    });
  }

  await mongoose.disconnect();
};

run().catch(console.error);
