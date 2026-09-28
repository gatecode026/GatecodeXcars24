import { isDatabaseReady } from "../config/db.js";
import { Order } from "../models/Order.js";
import { ReturnRequest } from "../models/ReturnRequest.js";
import { CallingRecord } from "../models/CallingRecord.js";
import { Customer } from "../models/Customer.js";
import { User } from "../models/User.js";

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
    case "custom": {
      start = startDate ? new Date(startDate) : new Date(0);
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

export const getEmployeePerformance = async (req, res, next) => {
  try {
    const { filter = "today", startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter, startDate, endDate);

    const employees = await User.find({ role: "employee" }, { name: 1, email: 1, username: 1 });

    const performance = await Promise.all(
      employees.map(async (emp) => {
        const [ordersToday, returnsToday, totalEntries] = await Promise.all([
          Order.countDocuments({
            employeeId: emp._id,
            createdAt: { $gte: start, $lte: end }
          }),
          ReturnRequest.countDocuments({
            employeeId: emp._id,
            createdAt: { $gte: start, $lte: end }
          }),
          Promise.all([
            Order.countDocuments({ employeeId: emp._id, createdAt: { $gte: start, $lte: end } }),
            ReturnRequest.countDocuments({ employeeId: emp._id, createdAt: { $gte: start, $lte: end } })
          ]).then(([o, r]) => o + r)
        ]);

        return {
          _id: emp._id,
          name: emp.name,
          email: emp.email,
          username: emp.username,
          ordersToday,
          returnsToday,
          totalEntries
        };
      })
    );

    return res.status(200).json({ data: performance });
  } catch (error) {
    return next(error);
  }
};

export const getEmployeeHistory = async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const filter = {};

    if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [orders, returns] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }),
      ReturnRequest.find(filter).sort({ createdAt: -1 })
    ]);

    return res.status(200).json({ data: { orders, returns } });
  } catch (error) {
    return next(error);
  }
};

const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) { const s = new Date(startDate); s.setHours(0, 0, 0, 0); filter.createdAt.$gte = s; }
    if (endDate) { const e = new Date(endDate); e.setHours(23, 59, 59, 999); filter.createdAt.$lte = e; }
  }
  return filter;
};

const buildCallingDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) { const s = new Date(startDate); s.setHours(0, 0, 0, 0); filter.date.$gte = s; }
    if (endDate) { const e = new Date(endDate); e.setHours(23, 59, 59, 999); filter.date.$lte = e; }
  }
  return filter;
};

export const getEmployeeDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const employee = await User.findById(id).select("-password");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const orderFilter = { employeeId: id, ...buildDateFilter(startDate, endDate) };
    const returnFilter = { employeeId: id, ...buildDateFilter(startDate, endDate) };
    const callFilter = { employeeId: id, ...buildCallingDateFilter(startDate, endDate) };
    const customerFilter = { employeeId: id, ...buildDateFilter(startDate, endDate) };

    const [orders, returns, callingRecords, customers] = await Promise.all([
      Order.find(orderFilter).sort({ createdAt: -1 }),
      ReturnRequest.find(returnFilter).sort({ createdAt: -1 }),
      CallingRecord.find(callFilter).sort({ date: -1, createdAt: -1 }),
      Customer.find(customerFilter).sort({ createdAt: -1 })
    ]);

    return res.status(200).json({
      data: {
        employee,
        orders,
        returns,
        callingRecords,
        customers
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getRevenueSummary = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const now = new Date();
    const filterMonth = parseInt(req.query.month);
    const filterYear = parseInt(req.query.year);

    const targetMonth = !isNaN(filterMonth) ? filterMonth : now.getMonth();
    const targetYear = !isNaN(filterYear) ? filterYear : now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const today = new Date(now);
    const isCurrentMonth = targetMonth === today.getMonth() && targetYear === today.getFullYear();

    let startOfDay = null, endOfDay = null, startOfWeek = null, endOfWeek = null;

    if (isCurrentMonth) {
      startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      startOfWeek = new Date(today);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      endOfWeek = new Date(today);
      endOfWeek.setHours(23, 59, 59, 999);
    }

    const callMatch = { date: { $gte: startOfMonth, $lte: endOfMonth } };
    const orderMatch = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };

    const dayCallMatch = startOfDay ? { date: { $gte: startOfDay, $lte: endOfDay } } : null;
    const dayOrderMatch = startOfDay ? { createdAt: { $gte: startOfDay, $lte: endOfDay } } : null;
    const weekCallMatch = startOfWeek ? { date: { $gte: startOfWeek, $lte: endOfWeek } } : null;
    const weekOrderMatch = startOfWeek ? { createdAt: { $gte: startOfWeek, $lte: endOfWeek } } : null;

    const aggregate = async (model, match) => {
      if (!match) return [{ total: 0 }];
      return model.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: "$revenueGenerated" } } }
      ]);
    };

    const aggregateOrder = async (match) => {
      if (!match) return [{ total: 0 }];
      return Order.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]);
    };

    const [dayRevenue, weekRevenue, monthRevenue, dayOrderRevenue, weekOrderRevenue, monthOrderRevenue] =
      await Promise.all([
        aggregate(CallingRecord, dayCallMatch),
        aggregate(CallingRecord, weekCallMatch),
        aggregate(CallingRecord, callMatch),
        aggregateOrder(dayOrderMatch),
        aggregateOrder(weekOrderMatch),
        aggregateOrder(orderMatch)
      ]);

    const getVal = (arr) => (arr[0]?.total || 0);

    const dailyCall = getVal(dayRevenue);
    const weeklyCall = getVal(weekRevenue);
    const monthlyCall = getVal(monthRevenue);

    const dailyOrd = getVal(dayOrderRevenue);
    const weeklyOrd = getVal(weekOrderRevenue);
    const monthlyOrd = getVal(monthOrderRevenue);

    return res.status(200).json({
      data: {
        daily: { calling: dailyCall, orders: dailyOrd, total: dailyCall + dailyOrd },
        weekly: { calling: weeklyCall, orders: weeklyOrd, total: weeklyCall + weeklyOrd },
        monthly: { calling: monthlyCall, orders: monthlyOrd, total: monthlyCall + monthlyOrd },
        filter: { month: targetMonth, year: targetYear, label: new Date(targetYear, targetMonth).toLocaleString("default", { month: "long", year: "numeric" }) }
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getEmployeeSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const employees = await User.find({ role: "employee" }).select("-password").lean();
    const orderFilter = buildDateFilter(startDate, endDate);
    const returnFilter = buildDateFilter(startDate, endDate);
    const callFilter = buildCallingDateFilter(startDate, endDate);

    const summary = await Promise.all(
      employees.map(async (emp) => {
        const [orderCount, returnCount, callingCount, salesAgg, revenueAgg] = await Promise.all([
          Order.countDocuments({ employeeId: emp._id, ...orderFilter }),
          ReturnRequest.countDocuments({ employeeId: emp._id, ...returnFilter }),
          CallingRecord.countDocuments({ employeeId: emp._id, ...callFilter }),
          Order.aggregate([
            { $match: { employeeId: emp._id, ...orderFilter } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
          ]),
          CallingRecord.aggregate([
            { $match: { employeeId: emp._id, ...callFilter } },
            { $group: { _id: null, total: { $sum: "$revenueGenerated" } } }
          ])
        ]);
        const totalSales = salesAgg[0]?.total || 0;
        const totalRevenue = revenueAgg[0]?.total || 0;
        return { ...emp, orderCount, returnCount, callingCount, totalSales, totalRevenue };
      })
    );

    return res.status(200).json({ data: summary });
  } catch (error) {
    return next(error);
  }
};

export const getSalesSummary = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const now = new Date();
    const filterMonth = parseInt(req.query.month);
    const filterYear = parseInt(req.query.year);

    const targetMonth = !isNaN(filterMonth) ? filterMonth : now.getMonth();
    const targetYear = !isNaN(filterYear) ? filterYear : now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const today = new Date(now);
    const isCurrentMonth = targetMonth === today.getMonth() && targetYear === today.getFullYear();

    let startOfDay = null, endOfDay = null, startOfWeek = null, endOfWeek = null;

    if (isCurrentMonth) {
      startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      startOfWeek = new Date(today);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      endOfWeek = new Date(today);
      endOfWeek.setHours(23, 59, 59, 999);
    }

    const orderMatch = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
    const dayOrderMatch = startOfDay ? { createdAt: { $gte: startOfDay, $lte: endOfDay } } : null;
    const weekOrderMatch = startOfWeek ? { createdAt: { $gte: startOfWeek, $lte: endOfWeek } } : null;

    const aggregateSales = async (match) => {
      if (!match) return [{ total: 0, count: 0, units: 0 }];
      return Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
            count: { $sum: 1 },
            units: { $sum: "$numberOfUnits" }
          }
        }
      ]);
    };

    const [dayData, weekData, monthData] = await Promise.all([
      aggregateSales(dayOrderMatch),
      aggregateSales(weekOrderMatch),
      aggregateSales(orderMatch)
    ]);

    const getVal = (arr, field) => (arr[0]?.[field] || 0);
    const label = new Date(targetYear, targetMonth).toLocaleString("default", { month: "long", year: "numeric" });

    return res.status(200).json({
      data: {
        daily: { total: getVal(dayData, "total"), count: getVal(dayData, "count"), units: getVal(dayData, "units") },
        weekly: { total: getVal(weekData, "total"), count: getVal(weekData, "count"), units: getVal(weekData, "units") },
        monthly: { total: getVal(monthData, "total"), count: getVal(monthData, "count"), units: getVal(monthData, "units") },
        filter: { month: targetMonth, year: targetYear, label }
      }
    });
  } catch (error) {
    return next(error);
  }
};
