import { ensureDB } from "../config/db.js";
import { Department } from "../models/Department.js";
import { Branch } from "../models/Branch.js";
import { Lookup } from "../models/Lookup.js";

/**
 * GET /api/departments
 */
export const getDepartments = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) return res.status(503).json({ message: "Database unavailable." });
    const departments = await Department.find({ isActive: true }).sort({ name: 1 }).lean();
    return res.status(200).json({ data: departments });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/branches
 */
export const getBranches = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) return res.status(503).json({ message: "Database unavailable." });
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();
    return res.status(200).json({ data: branches });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/lookups?type=designation|lead_source|cancellation_reason
 */
export const getLookups = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) return res.status(503).json({ message: "Database unavailable." });
    const query = { isActive: true };
    if (req.query.type) {
      query.type = req.query.type;
    }
    const lookups = await Lookup.find(query).sort({ type: 1, order: 1 }).lean();
    return res.status(200).json({ data: lookups });
  } catch (err) {
    return next(err);
  }
};
