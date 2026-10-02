import { ensureDB } from "../config/db.js";
import { CallingRecord } from "../models/CallingRecord.js";
import { User } from "../models/User.js";
import { invalidateDashboardCache } from "./dashboardController.js";
import { createMicroCache } from "../cache/serverCache.js";

const callingTableCache = createMicroCache("calling", 8000);

export const getCallingRecords = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(200).json({ data: [] });
    }

    const userId = req.user?._id || req.user?.id || "anon";
    const cacheKey = `${String(userId)}_${JSON.stringify(req.query || {})}`;
    const cached = callingTableCache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ data: cached });
    }

    const { startDate, endDate, employeeId } = req.query;
    const filter = {};

    if (employeeId) {
      filter.employeeId = employeeId;
    } else if (req.user?.role === "employee") {
      filter.employeeId = req.user._id;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        filter.date.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filter.date.$lte = e;
      }
    }

    const records = await CallingRecord.find(filter)
      .populate("employeeId", "name email role")
      .sort({ date: -1, createdAt: -1 })
      .lean();

    callingTableCache.set(cacheKey, records);
    return res.status(200).json({ data: records });
  } catch (error) {
    return next(error);
  }
};

export const createCallingRecord = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const {
      employeeId, date, outgoingCalls, incomingCalls, connectedCalls,
      notConnectedCalls, interestedLeads, notInterestedLeads,
      followUpCalls, followUpLeads, conversionsDone, revenueGenerated
    } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const record = await CallingRecord.create({
      employeeId,
      employeeName: employee.name,
      date: date || new Date(),
      outgoingCalls: outgoingCalls || 0,
      incomingCalls: incomingCalls || 0,
      connectedCalls: connectedCalls || 0,
      notConnectedCalls: notConnectedCalls || 0,
      interestedLeads: interestedLeads || 0,
      notInterestedLeads: notInterestedLeads || 0,
      followUpCalls: followUpCalls || 0,
      followUpLeads: followUpLeads || 0,
      conversionsDone: conversionsDone || 0,
      revenueGenerated: revenueGenerated || 0,
      createdBy: req.user?.id || req.user?._id
    });

    invalidateDashboardCache();
    return res.status(201).json({
      message: "Calling record created successfully",
      data: record
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteCallingRecord = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const record = await CallingRecord.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Calling record not found" });
    }

    invalidateDashboardCache();
    return res.status(200).json({ message: "Calling record deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const bulkImportCallingRecords = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "No data rows provided for import." });
    }

    const parseFlexibleDate = (str) => {
      if (!str) return null;
      const s = String(str).trim();
      if (!s) return null;
      if (s.includes("/")) {
        const parts = s.split(/[\/\s:]+/);
        if (parts.length >= 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          const dt = new Date(year, month, day);
          if (!isNaN(dt.getTime())) return dt;
        }
      }
      const dt = new Date(s);
      return isNaN(dt.getTime()) ? null : dt;
    };

    const getVal = (row, ...keys) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
          return String(row[k]).trim();
        }
        const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const actualKey of Object.keys(row)) {
          if (actualKey.toLowerCase().replace(/[^a-z0-9]/g, "") === lowerK) {
            if (row[actualKey] !== undefined && row[actualKey] !== null && String(row[actualKey]).trim() !== "") {
              return String(row[actualKey]).trim();
            }
          }
        }
      }
      return "";
    };

    const getNum = (row, ...keys) => {
      const v = getVal(row, ...keys);
      if (!v) return 0;
      const parsed = parseFloat(v.replace(/[^0-9.-]/g, ""));
      return isNaN(parsed) ? 0 : parsed;
    };

    const allUsers = await User.find({ isDeleted: { $ne: true } }, "_id name email").lean();
    const userMap = new Map();
    allUsers.forEach((u) => {
      if (u.name) userMap.set(u.name.toLowerCase().trim(), u);
      if (u.email) userMap.set(u.email.toLowerCase().trim(), u);
    });

    let insertedCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rawDate = getVal(r, "Date", "Record Date", "date");
      const recordDate = parseFlexibleDate(rawDate) || new Date();

      const empNameOrEmail = getVal(r, "Employee", "Employee Name", "Employee Email", "Agent", "employeeName");
      let targetUser = empNameOrEmail ? userMap.get(empNameOrEmail.toLowerCase().trim()) : null;
      if (!targetUser) {
        targetUser = req.user;
      }

      try {
        await CallingRecord.create({
          employeeId: targetUser._id || targetUser.id,
          employeeName: targetUser.name || "Executive",
          date: recordDate,
          outgoingCalls: getNum(r, "Outgoing Calls", "Outgoing", "outgoingCalls"),
          incomingCalls: getNum(r, "Incoming Calls", "Incoming", "incomingCalls"),
          connectedCalls: getNum(r, "Connected Calls", "Connected", "connectedCalls"),
          notConnectedCalls: getNum(r, "Not Connected Calls", "Not Connected", "notConnectedCalls"),
          interestedLeads: getNum(r, "Interested Leads", "Interested", "interestedLeads"),
          notInterestedLeads: getNum(r, "Not Interested Leads", "Not Interested", "notInterestedLeads"),
          followUpCalls: getNum(r, "Follow Up Calls", "Followup Calls", "followUpCalls"),
          followUpLeads: getNum(r, "Follow Up Leads", "Followup Leads", "followUpLeads"),
          conversionsDone: getNum(r, "Conversions Done", "Conversions", "Visit Booked", "conversionsDone"),
          revenueGenerated: getNum(r, "Revenue Generated", "Revenue", "revenueGenerated"),
          createdBy: req.user?._id || req.user?.id
        });
        insertedCount++;
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    invalidateDashboardCache();
    return res.status(200).json({
      message: `Successfully imported ${insertedCount} calling record(s).`,
      count: insertedCount,
      errors: errors.length > 0 ? errors.slice(0, 5) : []
    });
  } catch (error) {
    return next(error);
  }
};

