import { Customer } from "../models/Customer.js";
import { Order } from "../models/Order.js";
import { ReturnRequest } from "../models/ReturnRequest.js";
import { User } from "../models/User.js";
import { CallingRecord } from "../models/CallingRecord.js";
import { ensureDB } from "../config/db.js";

// Micro-cache (5s) for instant tab switching and rapid dashboard refreshes
const dashboardCache = new Map();
const DASHBOARD_CACHE_TTL = 5000;

export const invalidateDashboardCache = () => {
  dashboardCache.clear();
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
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

    const userId = req.user?._id || req.user?.id || "guest";
    const userRole = req.user?.role || "employee";
    const isPrivileged = ["superadmin", "admin", "manager", "tl"].includes(userRole);
    const cacheKey = `${userRole}_${userId}`;

    const cached = dashboardCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < DASHBOARD_CACHE_TTL) {
      return res.status(200).json({ data: cached.data });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Filter scope for employee/non-privileged vs admin
    const customerFilter = {};
    if (!isPrivileged) {
      customerFilter.$or = [
        { employeeId: req.user._id },
        { assignedTo: req.user._id }
      ];
    }

    // Consolidated single roundtrip for all customer KPIs, 7-day trend, and top employees
    const [customerFacetResult, orderStatsResult, activeEmployees, totalReturns, recentLeadsRaw, callingAggregate] = await Promise.all([
      Customer.aggregate([
        { $match: customerFilter },
        {
          $facet: {
            total: [{ $count: "count" }],
            today: [
              {
                $match: {
                  $or: [
                    { createdAt: { $gte: startOfToday, $lte: endOfToday } },
                    { leadDate: { $gte: startOfToday, $lte: endOfToday } }
                  ]
                }
              },
              { $count: "count" }
            ],
            followUps: [
              {
                $match: {
                  $or: [
                    { leadStatus: "Follow-up" },
                    { followUp: "Follow-up" },
                    { verificationStatus: "Follow-up" }
                  ]
                }
              },
              { $count: "count" }
            ],
            todayAppointments: [
              { $match: { appointmentDate: { $gte: startOfToday, $lte: endOfToday } } },
              { $count: "count" }
            ],
            verified: [
              { $match: { $or: [{ verified: true }, { verificationStatus: "Verified" }] } },
              { $count: "count" }
            ],
            trend: [
              { $match: { createdAt: { $gte: sevenDaysAgo } } },
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
              { $sort: { _id: 1 } }
            ],
            topEmployees: [
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
              { $limit: 10 }
            ]
          }
        }
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            delivered: {
              $sum: { $cond: [{ $eq: ["$orderStatus", "Delivered"] }, 1, 0] }
            }
          }
        }
      ]),
      User.countDocuments({ role: "employee", isDeleted: { $ne: true } }),
      ReturnRequest.countDocuments(),
      Customer.find(customerFilter, {
        appointmentId: 1,
        customerName: 1,
        mobile: 1,
        carNumber: 1,
        leadBy: 1,
        employeeName: 1,
        verificationStatus: 1,
        verified: 1,
        leadStatus: 1,
        followUp: 1,
        appointmentDate: 1,
        createdAt: 1
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      CallingRecord.aggregate([
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            totalCalls: { $sum: { $add: ["$outgoingCalls", "$incomingCalls", "$followUpCalls"] } },
            connectedCalls: { $sum: "$connectedCalls" },
            conversionsDone: { $sum: "$conversionsDone" },
            revenueGenerated: { $sum: "$revenueGenerated" }
          }
        }
      ])
    ]);

    const cStats = (callingAggregate && callingAggregate[0]) || {};
    const callingStats = {
      totalReports: cStats.totalReports || 0,
      totalCalls: cStats.totalCalls || 0,
      connectedCalls: cStats.connectedCalls || 0,
      conversionsDone: cStats.conversionsDone || 0,
      revenueGenerated: cStats.revenueGenerated || 0
    };

    const f = customerFacetResult[0] || {};
    const totalLeads = f.total?.[0]?.count || 0;
    const todayLeads = f.today?.[0]?.count || 0;
    const pendingFollowUps = f.followUps?.[0]?.count || 0;
    const todayAppointments = f.todayAppointments?.[0]?.count || 0;
    const verifiedLeads = f.verified?.[0]?.count || 0;

    const o = orderStatsResult[0] || {};
    const carsPurchased = o.total || 0;
    const carsSold = o.delivered || 0;

    // Build 7-day trend
    const trendMap = {};
    (f.trend || []).forEach((item) => {
      trendMap[item._id] = { leads: item.leads, verified: item.verified };
    });

    const performanceTrend = [];
    const daysArr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

    // Top Performing Employees
    const topEmployees = (f.topEmployees || []).map((emp, index) => {
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

    const responseData = {
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

      // Visualizations & tables
      performanceTrend,
      topEmployees,
      recentLeads,

      // Telecalling KPI summary
      callingStats
    };

    dashboardCache.set(cacheKey, { timestamp: Date.now(), data: responseData });

    return res.status(200).json({ data: responseData });
  } catch (error) {
    return next(error);
  }
};
