import { ensureDB } from "../config/db.js";
import { PerformanceTarget } from "../models/PerformanceTarget.js";
import { User } from "../models/User.js";
import { recordActivity } from "./activityController.js";
import { invalidateDashboardCache } from "./dashboardController.js";
import {
  getCurrentTarget,
  getTargetForDate,
  calculateEmployeeRankings,
  getAdminMonthlySummary,
  getEmployeeMonthlyPerformance,
  getDailyAppointmentPerformance,
  getEmployeeDailyHistory,
  getMonthlySalesPerformance,
  countWorkingDays,
  invalidateTargetCache
} from "../services/performanceService.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPeriodParams = (query) => {
  const now = new Date();
  const month = query.month !== undefined ? parseInt(query.month) : now.getMonth();
  const year  = query.year  !== undefined ? parseInt(query.year)  : now.getFullYear();
  return { month: isNaN(month) ? now.getMonth() : month, year: isNaN(year) ? now.getFullYear() : year };
};

// ─── Settings ─────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/performance-settings
 * Returns the current active configuration.
 */
export const getPerformanceSettings = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) return res.status(503).json({ message: "Database unavailable." });
    const current = await getCurrentTarget();
    const history = await PerformanceTarget.find()
      .sort({ effectiveFrom: -1 })
      .limit(10)
      .lean();
    return res.status(200).json({ data: { current, history } });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/admin/performance-settings
 * Creates a new PerformanceTarget config and closes the previous one.
 * Body: { dailyAppointmentTarget, monthlySalesTarget, bonusRate, workingDays, saleValuePerLead, effectiveFrom, note }
 */
export const updatePerformanceSettings = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) return res.status(503).json({ message: "Database unavailable." });

    const {
      dailyAppointmentTarget,
      monthlySalesTarget,
      bonusRate,
      workingDays,
      saleValuePerLead,
      salesMetricSource,
      bonusType,
      bonusTiers,
      effectiveFrom,
      note
    } = req.body;

    // Validate
    if (!dailyAppointmentTarget || !monthlySalesTarget || bonusRate === undefined) {
      return res.status(400).json({ message: "dailyAppointmentTarget, monthlySalesTarget and bonusRate are required." });
    }
    if (bonusRate < 0 || bonusRate > 1) {
      return res.status(400).json({ message: "bonusRate must be between 0 and 1 (e.g. 0.01 for 1%)." });
    }

    const effectiveDate = effectiveFrom ? new Date(effectiveFrom) : new Date();
    effectiveDate.setHours(0, 0, 0, 0);

    // Fetch previous settings for audit
    const previous = await getCurrentTarget();

    // Close the current open-ended config
    await PerformanceTarget.updateMany(
      { effectiveTo: null, effectiveFrom: { $lt: effectiveDate } },
      { $set: { effectiveTo: new Date(effectiveDate.getTime() - 1) } }
    );

    // Create new config
    const newConfig = await PerformanceTarget.create({
      dailyAppointmentTarget: Number(dailyAppointmentTarget),
      monthlySalesTarget: Number(monthlySalesTarget),
      bonusRate: Number(bonusRate),
      workingDays: workingDays || [1, 2, 3, 4, 5, 6],
      saleValuePerLead: Number(saleValuePerLead) || 65000,
      salesMetricSource: salesMetricSource || "appointments",
      bonusType: bonusType || "percentage",
      bonusTiers: Array.isArray(bonusTiers) && bonusTiers.length > 0 ? bonusTiers : [
        { minExcess: 0, maxExcess: 200000, rate: 0.01, fixedAmount: 0 },
        { minExcess: 200001, maxExcess: null, rate: 0.02, fixedAmount: 0 }
      ],
      effectiveFrom: effectiveDate,
      effectiveTo: null,
      updatedBy: req.user?._id || null,
      updatedByName: req.user?.name || "Admin",
      note: note || "",
      previousValues: previous?._id ? {
        dailyAppointmentTarget: previous.dailyAppointmentTarget,
        monthlySalesTarget: previous.monthlySalesTarget,
        bonusRate: previous.bonusRate,
        workingDays: previous.workingDays,
        saleValuePerLead: previous.saleValuePerLead,
        salesMetricSource: previous.salesMetricSource,
        bonusType: previous.bonusType
      } : null
    });

    // Audit log
    await recordActivity({
      performedBy: req.user?._id,
      performedByName: req.user?.name || "Admin",
      performedByRole: req.user?.role || "admin",
      actionType: "LEAD_UPDATED",
      title: "Performance Settings Updated",
      details: `Performance settings updated. Daily target: ${dailyAppointmentTarget} appts, Monthly sales: ₹${Number(monthlySalesTarget).toLocaleString("en-IN")}, Bonus: ${(bonusRate * 100).toFixed(2)}%, Source: ${salesMetricSource || "appointments"}, Type: ${bonusType || "percentage"}. Effective from: ${effectiveDate.toDateString()}`,
      adminMessage: `Admin updated performance targets effective ${effectiveDate.toDateString()}`,
      metadata: {
        old: previous?._id ? {
          dailyAppointmentTarget: previous.dailyAppointmentTarget,
          monthlySalesTarget: previous.monthlySalesTarget,
          bonusRate: previous.bonusRate,
          salesMetricSource: previous.salesMetricSource
        } : null,
        new: { dailyAppointmentTarget, monthlySalesTarget, bonusRate, salesMetricSource, bonusType },
        effectiveFrom: effectiveDate
      }
    });

    invalidateTargetCache();
    invalidateDashboardCache();

    return res.status(200).json({
      message: "Performance settings updated successfully.",
      data: newConfig
    });
  } catch (err) {
    return next(err);
  }
};

// ─── Admin: Monthly Performance + Rankings ────────────────────────────────────

/**
 * GET /api/admin/performance-ranking?month=8&year=2026&departmentId=...&branchId=...
 */
export const getAdminPerformanceRanking = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) return res.status(503).json({ message: "Database unavailable." });
    const { month, year } = getPeriodParams(req.query);
    const filterOptions = {
      departmentId: req.query.departmentId || null,
      branchId: req.query.branchId || null,
      designation: req.query.designation || null,
      employeeId: req.query.employeeId || null
    };
    const summary = await getAdminMonthlySummary(month, year, filterOptions);
    return res.status(200).json({ data: summary });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/performance-employee-detail/:id?month=8&year=2026
 */
export const getAdminEmployeePerformanceDetail = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) return res.status(503).json({ message: "Database unavailable." });
    const { id } = req.params;
    const { month, year } = getPeriodParams(req.query);

    const employee = await User.findById(id).select("-password").lean();
    if (!employee) return res.status(404).json({ message: "Employee not found." });

    const [monthly, dailyHistory, todayPerf] = await Promise.all([
      getEmployeeMonthlyPerformance(id, month, year, employee?.joiningDate || null),
      getEmployeeDailyHistory(id, month, year),
      getDailyAppointmentPerformance(id, new Date())
    ]);

    // Also compute rank among all employees for this month
    const rankings = await calculateEmployeeRankings(month, year);
    const empRank = rankings.find((r) => String(r.employee.id) === String(id));

    return res.status(200).json({
      data: {
        employee: { id: employee._id, name: employee.name, email: employee.email },
        period: { month, year },
        rank: empRank?.rank ?? null,
        totalEmployees: rankings.length,
        today: todayPerf,
        monthly,
        dailyHistory
      }
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/bonus-report?month=8&year=2026
 */
export const getAdminBonusReport = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) return res.status(503).json({ message: "Database unavailable." });
    const { month, year } = getPeriodParams(req.query);
    const filterOptions = {
      departmentId: req.query.departmentId || null,
      branchId: req.query.branchId || null,
      designation: req.query.designation || null,
      employeeId: req.query.employeeId || null
    };
    const rankings = await calculateEmployeeRankings(month, year, filterOptions);

    const report = rankings.map((r) => ({
      employee: r.employee,
      rank: r.rank,
      month,
      year,
      verifiedLeadCount: r.sales.verifiedLeadCount,
      saleValuePerLead: r.sales.saleValuePerLead,
      orderSales: r.sales.orderSales || 0,
      monthlySales: r.sales.monthlySales,
      salesTarget: r.sales.target,
      salesAchievementPercent: r.sales.achievementPercent,
      excessSales: r.sales.excessSales,
      bonusRate: r.sales.bonusRate,
      bonus: r.sales.bonus,
      bonusEligibility: r.sales.bonusEligibility,
      salesStatus: r.sales.status,
      appointments: r.appointments,
      performance: r.performance
    }));

    return res.status(200).json({ data: { report, month, year, filterOptions } });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/bonus-report/export?month=8&year=2026
 * Returns CSV
 */
export const exportBonusReportCSV = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) return res.status(503).json({ message: "Database unavailable." });
    const { month, year } = getPeriodParams(req.query);
    const filterOptions = {
      departmentId: req.query.departmentId || null,
      branchId: req.query.branchId || null,
      designation: req.query.designation || null,
      employeeId: req.query.employeeId || null
    };
    const rankings = await calculateEmployeeRankings(month, year, filterOptions);

    const monthLabel = new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" });

    const headers = [
      "Rank", "Employee", "Month",
      "Working Days", "Expected Appointments", "Completed Appointments", "Appointment Achievement %",
      "Verified Leads", "Sale Value/Lead (INR)", "Monthly Sales (INR)", "Sales Target (INR)",
      "Sales Achievement %", "Excess Sales (INR)", "Bonus Rate (%)", "Bonus (INR)",
      "Performance Score (%)", "Ranking Score (%)", "Sales Status"
    ];

    const rows = rankings.map((r) => [
      r.rank,
      r.employee.name,
      monthLabel,
      r.appointments.workingDays,
      r.appointments.expectedAppointments,
      r.appointments.completed,
      r.appointments.achievementPercent.toFixed(2),
      r.sales.verifiedLeadCount,
      r.sales.saleValuePerLead,
      r.sales.monthlySales.toFixed(2),
      r.sales.target,
      r.sales.achievementPercent.toFixed(2),
      r.sales.excessSales.toFixed(2),
      (r.sales.bonusRate * 100).toFixed(2),
      r.sales.bonus.toFixed(2),
      r.performance.rawScore.toFixed(2),
      r.performance.rankingScore.toFixed(2),
      r.sales.status
    ]);

    const escCsv = (val) => {
      let s = String(val ?? "").replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(s)) {
        s = `'${s}`;
      }
      return `"${s}"`;
    };

    const csvLines = [
      headers.map(escCsv).join(","),
      ...rows.map((row) => row.map(escCsv).join(","))
    ];

    const csv = "\uFEFF" + csvLines.join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="GatecodeXcars24_BonusReport_${monthLabel.replace(/\s/g, "_")}.csv"`
    );
    return res.send(csv);
  } catch (err) {
    return next(err);
  }
};

// ─── Employee: Own Performance ────────────────────────────────────────────────

/**
 * GET /api/employee/performance?month=8&year=2026
 * Employee sees only their own data.
 */
export const getMyPerformance = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) return res.status(503).json({ message: "Database unavailable." });

    const empId = req.user?._id || req.user?.id;
    if (!empId) return res.status(401).json({ message: "Unauthorized." });

    const { month, year } = getPeriodParams(req.query);
    const employee = await User.findById(empId).select("-password").lean();

    const [monthly, todayPerf, allRankings] = await Promise.all([
      getEmployeeMonthlyPerformance(empId, month, year, employee?.joiningDate || null),
      getDailyAppointmentPerformance(empId, new Date()),
      calculateEmployeeRankings(month, year)
    ]);

    const myRank = allRankings.find((r) => String(r.employee.id) === String(empId));

    return res.status(200).json({
      data: {
        employee: { id: employee._id, name: employee.name, email: employee.email },
        period: { month, year },
        rank: myRank?.rank ?? null,
        totalEmployees: allRankings.length,
        today: todayPerf,
        monthly
      }
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/employee/performance/daily-history?month=8&year=2026
 */
export const getMyDailyHistory = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) return res.status(503).json({ message: "Database unavailable." });

    const empId = req.user?._id || req.user?.id;
    if (!empId) return res.status(401).json({ message: "Unauthorized." });

    const { month, year } = getPeriodParams(req.query);
    const history = await getEmployeeDailyHistory(empId, month, year);
    return res.status(200).json({ data: history });
  } catch (err) {
    return next(err);
  }
};
