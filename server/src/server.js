import dotenv from "dotenv";
// Trigger reload
import { fileURLToPath } from "url";
import path from "path";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { ensureFixedAdminUser } from "./config/seedAdmin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PORT = process.env.PORT || 5000;
const DB_TIMEOUT = parseInt(process.env.DB_TIMEOUT_MS || "10000", 10);

const start = async () => {
  try {
    await connectDB(DB_TIMEOUT);
    await ensureFixedAdminUser();
  } catch (error) {
    console.error("MongoDB unavailable. Starting API without database:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
