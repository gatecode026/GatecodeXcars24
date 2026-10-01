import { ensureDB } from "../config/db.js";
import { Order } from "../models/Order.js";
import { ReturnRequest } from "../models/ReturnRequest.js";
import { CallingRecord } from "../models/CallingRecord.js";
import { Customer } from "../models/Customer.js";
import { invalidateDashboardCache } from "./dashboardController.js";

const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const getEmployeeId = (req) => req.user?._id || req.user?.id;
const getEmployeeName = (req) => req.user?.name || "Employee";

const getDateRange = (filter, startDate, endDate) => {
  const now = new Date();
  let start, end;

  switch (filter) {
    case "yesterday": {
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "week": {
      start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "month": {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "last_month": {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "all": {
      start = new Date(0);
      end = new Date(8640000000000000);
      break;
    }
    case "custom": {
      start = startDate ? new Date(startDate) : new Date(0);
      start.setHours(0, 0, 0, 0);
      end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      break;
    }
    default: {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    }
  }

  return { start, end };
};

export const getEmployeeDashboard = async (req, res, next) => {
  try {
    if (!await ensureDB()) {
      return res.status(200).json({
        data: {
          name: getEmployeeName(req),
          filter: req.query.filter || "today",
          orderCount: 0,
          returnCount: 0,
          totalIncentive: 0,
          recentOrders: [],
          recentReturns: []
        }
      });
    }

    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }

    const { filter = "today", startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter, startDate, endDate);

    const dateFilter = { employeeId, createdAt: { $gte: start, $lte: end } };

    const leadEmpFilter = {
      $or: [
        { employeeId },
        { assignedTo: employeeId }
      ]
    };

    const leadDateCondition = filter === "all" ? null : {
      $or: [
        { createdAt: { $gte: start, $lte: end } },
        { leadDate: { $gte: start, $lte: end } }
      ]
    };

    const customerQuery = leadDateCondition
      ? { $and: [leadEmpFilter, leadDateCondition] }
      : leadEmpFilter;

    const [orderCount, returnCount, leadCount, recentOrders, recentReturns, allOrders, callingRecords] = await Promise.all([
      Order.countDocuments(dateFilter),
      ReturnRequest.countDocuments(dateFilter),
      Customer.countDocuments(customerQuery),
      Order.find(dateFilter).sort({ createdAt: -1 }).limit(5).lean(),
      ReturnRequest.find(dateFilter).sort({ createdAt: -1 }).limit(5).lean(),
      Order.find(dateFilter).select("numberOfUnits amount").lean(),
      CallingRecord.find({
        employeeId,
        date: { $gte: start, $lte: end }
      }).lean()
    ]);

    const totalIncentive = allOrders.reduce((sum, o) => {
      const units = Number(o.numberOfUnits || 0);
      const amount = Number(o.amount || 0);
      let inc = 0;
      if (amount <= 3200) {
        inc = amount * 0.0225 * units;
      } else {
        inc = (amount - 3200) * units;
      }
      return sum + inc;
    }, 0);

    const totalCallsDone = (callingRecords || []).reduce((sum, r) => sum + (r.outgoingCalls || 0) + (r.incomingCalls || 0) + (r.followUpCalls || 0), 0);
    const connectedCalls = (callingRecords || []).reduce((sum, r) => sum + (r.connectedCalls || 0), 0);
    const conversionsDone = (callingRecords || []).reduce((sum, r) => sum + (r.conversionsDone || 0), 0);
    const callingRevenue = (callingRecords || []).reduce((sum, r) => sum + (r.revenueGenerated || 0), 0);

    return res.status(200).json({
      data: {
        name: getEmployeeName(req),
        filter,
        orderCount,
        returnCount,
        leadCount,
        callingCount: (callingRecords || []).length,
        totalCallsDone,
        connectedCalls,
        conversionsDone,
        callingRevenue,
        totalIncentive: Math.round(totalIncentive),
        recentOrders,
        recentReturns
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getEmployeeOrdersHistory = async (req, res, next) => {
  try {
    if (!await ensureDB()) {
      return res.status(200).json({ data: [] });
    }
    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }
    const orders = await Order.find({ employeeId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ data: orders });
  } catch (error) {
    return next(error);
  }
};

export const getEmployeeReturnsHistory = async (req, res, next) => {
  try {
    if (!await ensureDB()) {
      return res.status(200).json({ data: [] });
    }
    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }
    const requests = await ReturnRequest.find({ employeeId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ data: requests });
  } catch (error) {
    return next(error);
  }
};

export const updateEmployeeOrder = async (req, res, next) => {
  try {
    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }

    const order = await Order.findOne({ _id: req.params.id, employeeId });
    if (!order) {
      return res.status(404).json({ message: "Order not found or unauthorized" });
    }

    const allowedFields = [
      "customerName", "mobileNumber", "alternateMobileNumber", "fullAddress", "pincode",
      "carModel", "carNumber", "fuelType", "manufacturingYear", "odometerKm",
      "productType", "customProductName", "numberOfUnits", "amount",
      "totalAmount", "advanceAmount", "dateOfOrder", "orderStatus"
    ];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) order[field] = req.body[field];
    }

    await order.save();
    return res.status(200).json({ message: "Order updated successfully", data: order });
  } catch (error) {
    return next(error);
  }
};

export const deleteEmployeeOrder = async (req, res, next) => {
  try {
    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }

    const order = await Order.findOneAndDelete({ _id: req.params.id, employeeId });
    if (!order) {
      return res.status(404).json({ message: "Order not found or unauthorized" });
    }
    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const updateEmployeeReturn = async (req, res, next) => {
  try {
    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }

    const request = await ReturnRequest.findOne({ _id: req.params.id, employeeId });
    if (!request) {
      return res.status(404).json({ message: "Return request not found or unauthorized" });
    }

    const allowedFields = [
      "customerName", "mobileNumber", "pincode", "productType",
      "numberOfUnitsReturning", "returnReason", "customReason",
      "additionalDescription", "returnDate", "returnStatus"
    ];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) request[field] = req.body[field];
    }

    await request.save();
    return res.status(200).json({ message: "Return updated successfully", data: request });
  } catch (error) {
    return next(error);
  }
};

export const deleteEmployeeReturn = async (req, res, next) => {
  try {
    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }

    const request = await ReturnRequest.findOneAndDelete({ _id: req.params.id, employeeId });
    if (!request) {
      return res.status(404).json({ message: "Return request not found or unauthorized" });
    }
    return res.status(200).json({ message: "Return request deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const getEmployeeCallingRecords = async (req, res, next) => {
  try {
    if (!await ensureDB()) {
      return res.status(200).json({ data: [] });
    }
    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }

    const { filter: dateFilter = "today", startDate, endDate } = req.query;
    const filter = { employeeId };

    const range = getDateRange(dateFilter, startDate, endDate);
    filter.date = { $gte: range.start, $lte: range.end };

    const records = await CallingRecord.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    return res.status(200).json({ data: records });
  } catch (error) {
    return next(error);
  }
};

export const createEmployeeCallingRecord = async (req, res, next) => {
  try {
    if (!await ensureDB()) {
      return res.status(503).json({ message: "Database unavailable." });
    }
    const employeeId = getEmployeeId(req);
    const employeeName = getEmployeeName(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }

    const {
      date, outgoingCalls, incomingCalls, connectedCalls,
      notConnectedCalls, interestedLeads, notInterestedLeads,
      followUpCalls, followUpLeads, conversionsDone, revenueGenerated
    } = req.body;

    const record = await CallingRecord.create({
      employeeId,
      employeeName,
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
      createdBy: employeeId
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

export const deleteEmployeeCallingRecord = async (req, res, next) => {
  try {
    if (!await ensureDB()) {
      return res.status(503).json({ message: "Database unavailable." });
    }
    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }
    const record = await CallingRecord.findOneAndDelete({ _id: req.params.id, employeeId });
    if (!record) {
      return res.status(404).json({ message: "Calling record not found or unauthorized" });
    }
    invalidateDashboardCache();
    return res.status(200).json({ message: "Calling record deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const updateEmployeeCallingRecord = async (req, res, next) => {
  try {
    const employeeId = getEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
    }

    const record = await CallingRecord.findOne({ _id: req.params.id, employeeId });
    if (!record) {
      return res.status(404).json({ message: "Calling record not found or unauthorized" });
    }

    const allowedFields = [
      "date", "outgoingCalls", "incomingCalls", "connectedCalls",
      "notConnectedCalls", "interestedLeads", "notInterestedLeads",
      "followUpCalls", "followUpLeads", "conversionsDone", "revenueGenerated"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        record[field] = req.body[field];
      }
    });

    await record.save();
    invalidateDashboardCache();
    return res.status(200).json({
      message: "Calling record updated successfully",
      data: record
    });
  } catch (error) {
    return next(error);
  }
};

export const bulkImportEmployeeCallingRecords = async (req, res, next) => {
  try {
    if (!await ensureDB()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const employeeId = getEmployeeId(req);
    const employeeName = getEmployeeName(req);
    if (!employeeId) {
      return res.status(401).json({ message: "Employee context not found" });
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

    let insertedCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rawDate = getVal(r, "Date", "Record Date", "date");
      const recordDate = parseFlexibleDate(rawDate) || new Date();

      try {
        await CallingRecord.create({
          employeeId,
          employeeName,
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
          createdBy: employeeId
        });
        insertedCount++;
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    return res.status(200).json({
      message: `Successfully imported ${insertedCount} calling record(s).`,
      count: insertedCount,
      errors: errors.length > 0 ? errors.slice(0, 5) : []
    });
  } catch (error) {
    return next(error);
  }
};

