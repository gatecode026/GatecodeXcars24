import { isDatabaseReady, ensureDB } from "../config/db.js";
import { EmployeeRecord } from "../models/EmployeeRecord.js";
import { User } from "../models/User.js";

export const getEmployeeRecords = async (req, res, next) => {
  try {
    const _dbReady = await ensureDB();
      if (!_dbReady) {
        return res.status(503).json({ message: "Database unavailable." });
      }

    const { date, employeeId, type, limit } = req.query;
    const filter = {};

    if (employeeId) {
      filter.employeeId = employeeId;
    }
    if (type) {
      filter.type = type;
    }

    if (date) {
      const d = new Date(date);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      filter.date = { $gte: start, $lte: end };
    }

    const query = EmployeeRecord.find(filter)
      .populate("employeeId", "name email role")
      .sort({ date: -1, createdAt: -1 });

    if (limit) {
      query.limit(Number(limit));
    }

    const records = await query;

    return res.status(200).json({ data: records });
  } catch (error) {
    return next(error);
  }
};

export const createEmployeeRecord = async (req, res, next) => {
  try {
    const _dbReady = await ensureDB();
      if (!_dbReady) {
        return res.status(503).json({ message: "Database unavailable." });
      }

    const { employeeId, date, type, description, referenceId } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const record = await EmployeeRecord.create({
      employeeId,
      employeeName: employee.name,
      date: date || new Date(),
      type: type || "other",
      description: description || "",
      referenceId: referenceId || null,
      createdBy: req.user?.id || req.user?._id
    });

    return res.status(201).json({
      message: "Record created successfully",
      data: record
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteEmployeeRecord = async (req, res, next) => {
  try {
    const _dbReady = await ensureDB();
      if (!_dbReady) {
        return res.status(503).json({ message: "Database unavailable." });
      }

    const record = await EmployeeRecord.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    return res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    return next(error);
  }
};
