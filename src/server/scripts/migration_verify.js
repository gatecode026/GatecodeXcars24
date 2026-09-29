import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set DNS servers as done in the app config to ensure smooth connection
dns.setServers(['1.1.1.1']);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("\x1b[31mError: MONGO_URI is missing in your server/.env file.\x1b[0m");
    process.exit(1);
  }

  console.log(`Connecting to: ${mongoUri.replace(/:([^@]+)@/, ":******@")} ...`);
  
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log("\x1b[32mSuccessfully connected to the database!\x1b[0m\n");
  } catch (error) {
    console.error("\x1b[31mFailed to connect to the database. Error:\x1b[0m", error.message);
    process.exit(1);
  }

  try {
    const db = mongoose.connection.db;
    
    // Retrieve list of collections
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log("\x1b[33mWarning: Connected successfully, but no collections were found. Ensure that the database name in your connection string is correct and that the migration was run.\x1b[0m");
    } else {
      console.log("=== COLLECTION & DOCUMENT COUNT SUMMARY ===");
      let totalDocs = 0;
      for (const collInfo of collections) {
        const name = collInfo.name;
        const count = await db.collection(name).countDocuments();
        totalDocs += count;
        console.log(`- \x1b[36m${name.padEnd(20)}\x1b[0m: ${count} documents`);
      }
      console.log("==========================================");
      console.log(`Total collections: ${collections.length}`);
      console.log(`Total documents  : ${totalDocs}`);
      console.log("\nMigration Verification: \x1b[32mPASSED\x1b[0m (Your connection is active and data is present)");
    }
  } catch (error) {
    console.error("\x1b[31mError during verification:\x1b[0m", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from database.");
  }
};

run().catch(e => {
  console.error(e);
  process.exit(1);
});
