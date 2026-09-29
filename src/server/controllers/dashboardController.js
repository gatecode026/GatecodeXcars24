import { Customer } from "../models/Customer.js";
import { Order } from "../models/Order.js";
import { ReturnRequest } from "../models/ReturnRequest.js";
import { User } from "../models/User.js";
import { isDatabaseReady, ensureDB, connectDB } from "../config/db.js";

export const getDashboardSummary = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      try {
        await connectDB();
      } catch (_) {}
    }

    if (!isDatabaseReady()) {
      return res.status(200).json({
        data: {
          totalLeads: 0,
          todayLeads: 0,
          pendingFollowUps: 0,
          todayAppointments: 0,
          verifiedLeads: 0,
          carsPurchased: 0,
          carsSold: 0,
          activeEmployees: 0,
          totalOrders: 0,
          pendingOrders: 0,
          deliveredOrders: 0,
          totalReturns: 0,
          performanceTrend: [],
          topEmployees: [],
          recentLeads: []
        }
      });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Filter scope for employee vs admin
    const customerFilter = {};
    if (req.user?.role === "employee") {
      customerFilter.$or = [{ employeeId: req.user._id }, { assignedTo: req.user._id }];
    }

    const [
      totalLeads,
      todayLeads,
      pendingFollowUps,
      todayAppointments,
      verifiedLeads,
      carsPurchased,
      carsSold,
      activeEmployees,
      totalReturns
    ] = await Promise.all([
      Customer.countDocuments(customerFilter),
      Customer.countDocuments({
        ...customerFilter,
        createdAt: { $gte: startOfToday, $lte: endOfToday }
      }),
      Customer.countDocuments({
        ...customerFilter,
        $or: [
          { leadStatus: "Follow-up" },
          { followUp: "Follow-up" },
          { verificationStatus: "Follow-up" }
        ]
      }),
      Customer.countDocuments({
        ...customerFilter,
        appointmentDate: { $gte: startOfToday, $lte: endOfToday }
      }),
      Customer.countDocuments({
        ...customerFilter,
        $or: [{ verified: true }, { verificationStatus: "Verified" }]
      }),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "Delivered" }),
      User.countDocuments({ role: "employee" }),
      ReturnRequest.countDocuments()
    ]);

    // Calculate real 7-day trend from actual Customer collection
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    let trendAggregation = await Customer.aggregate([
      {
        $match: {
          ...customerFilter,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          leads: { $sum: 1 },
          verified: {
            $sum: {
              $cond: [{ $or: [{ $eq: ["$verified", true] }, { $eq: ["$verificationStatus", "Verified"] }] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const performanceTrend = [];
    const daysArr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    if (trendAggregation.length > 0) {
      const trendMap = {};
      trendAggregation.forEach((item) => {
        trendMap[item._id] = { leads: item.leads, verified: item.verified };
      });

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const dayName = daysArr[d.getDay()];
        performanceTrend.push({
          date: key,
          day: dayName,
          label: `${dayName} ${d.getDate()}`,
          leads: trendMap[key]?.leads || 0,
          verified: trendMap[key]?.verified || 0
        });
      }
    } else {
      // If no leads exist in the exact recent 7 calendar days, query the most recent active days
      const recentDayAgg = await Customer.aggregate([
        { $match: customerFilter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            leads: { $sum: 1 },
            verified: {
              $sum: {
                $cond: [{ $or: [{ $eq: ["$verified", true] }, { $eq: ["$verificationStatus", "Verified"] }] }, 1, 0]
              }
            }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 7 }
      ]);

      const sortedAgg = recentDayAgg.reverse();
      if (sortedAgg.length > 0) {
        sortedAgg.forEach((item) => {
          const d = new Date(item._id);
          const dayName = isNaN(d.getTime()) ? item._id : daysArr[d.getDay()];
          performanceTrend.push({
            date: item._id,
            day: dayName,
            label: `${dayName} ${d.getDate() || ""}`,
            leads: item.leads,
            verified: item.verified
          });
        });
      } else {
        // Fallback default empty 7 days
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayName = daysArr[d.getDay()];
          performanceTrend.push({
            date: d.toISOString().split("T")[0],
            day: dayName,
            label: `${dayName} ${d.getDate()}`,
            leads: 0,
            verified: 0
          });
        }
      }
    }

    // Top Performing Employees (real aggregation from Customer collection)
    const topEmployeesAggregation = await Customer.aggregate([
      {
        $match: {
          $or: [
            { employeeName: { $exists: true, $ne: "" } },
            { leadBy: { $exists: true, $ne: "" } }
          ]
        }
      },
      {
        $group: {
          _id: { $ifNull: ["$leadBy", "$employeeName"] },
          totalLeads: { $sum: 1 },
          verifiedCount: {
            $sum: {
              $cond: [{ $or: [{ $eq: ["$verified", true] }, { $eq: ["$verificationStatus", "Verified"] }] }, 1, 0]
            }
          }
        }
      },
      { $sort: { totalLeads: -1 } },
    ]);

    const topEmployees = topEmployeesAggregation.map((emp, index) => {
      const convRate = emp.totalLeads > 0 ? Math.round((emp.verifiedCount / emp.totalLeads) * 100) : 0;
      return {
        rank: index + 1,
        name: emp._id || "Executive",
        role: "Sales Executive",
        leads: emp.totalLeads,
        converted: emp.verifiedCount,
        rate: `${convRate}%`
      };
    });

    // Recent 10 leads with automotive normalization
    const recentLeadsRaw = await Customer.find(customerFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentLeads = recentLeadsRaw.map((c) => ({
      _id: c._id,
      appointmentId: c.appointmentId || `AP-${String(c._id).slice(-5).toUpperCase()}`,
      customerName: c.customerName,
      mobile: c.mobile,
      carNumber: c.carNumber || "N/A",
      leadBy: c.leadBy || c.employeeName || "Executive",
      verificationStatus: c.verificationStatus || (c.verified ? "Verified" : "Pending"),
      leadStatus: c.leadStatus || (c.followUp === "Converted" ? "Completed" : "Pending"),
      appointmentDate: c.appointmentDate,
      createdAt: c.createdAt
    }));

    return res.status(200).json({
      data: {
        // Automotive KPIs
        totalLeads,
        todayLeads,
        pendingFollowUps,
        todayAppointments,
        verifiedLeads,
        carsPurchased,
        carsSold,
        activeEmployees,

        // Legacy compatibility
        totalOrders: carsPurchased,
        pendingOrders: pendingFollowUps,
        deliveredOrders: carsSold,
        totalReturns,

        // Real visualizations & tables
        performanceTrend,
        topEmployees,
        recentLeads
      }
    });
  } catch (error) {
    return next(error);
  }
};
