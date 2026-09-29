import mongoose from "mongoose";
import dns from "node:dns/promises";

const targetUri = "mongodb+srv://gatecode026:tBNyNzO68BNn3Zkn@cluster0.1meot8l.mongodb.net/bpo-management";

const testDefaultDns = async () => {
  console.log("Testing with Default DNS...");
  try {
    const conn = await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 5000 });
    console.log("SUCCESS with Default DNS!");
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log("FAILED with Default DNS:", error.message);
    return false;
  }
};

const testCustomDns = async () => {
  console.log("\nTesting with Custom DNS (1.1.1.1)...");
  try {
    dns.setServers(['1.1.1.1']);
    const conn = await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 5000 });
    console.log("SUCCESS with Custom DNS!");
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log("FAILED with Custom DNS:", error.message);
    return false;
  }
};

const run = async () => {
  await testDefaultDns();
  await testCustomDns();
};

run();
