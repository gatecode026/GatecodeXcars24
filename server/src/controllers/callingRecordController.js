import { isDatabaseReady } from "../config/db.js";
import { CallingRecord } from "../models/CallingRecord.js";
import { User } from "../models/User.js";

export const getCallingRecords = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const { startDate, endDate, employeeId } = req.query;
    const filter = {};

    if (employeeId) {
      filter.employeeId = employeeId;
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
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json({ data: records });
  } catch (error) {
    return next(error);
  }
};

export const createCallingRecord = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
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
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const record = await CallingRecord.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Calling record not found" });
    }

    return res.status(200).json({ message: "Calling record deleted successfully" });
  } catch (error) {
    return next(error);
  }
};
