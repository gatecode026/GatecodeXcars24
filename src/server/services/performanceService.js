/**
 * performanceService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all performance calculations in GatecodeXcars24.
 *
 * Business rules (all configurable via PerformanceTarget model):
 *   • Daily appointment target : 5 / working day
 *   • Monthly sales target     : ₹13,00,000 / month
 *   • Bonus rate               : 1% on excess above monthly target
 *   • Working days             : Mon–Sat (configurable)
 *
 * Qualifying records:
 *   • Appointment : Customer with verificationStatus = "Verified"
 *     (Cancelled/Rejected/Pending/Follow-up excluded)
 *   • Sale        : Each Verified customer record (same dataset as appointment)
 *     Sales value is tracked separately if a monetary field is added; until then
 *     the admin populates it via a monthlySales figure stored on performance queries.
 *
 * NOTE on "sales":  The user confirmed qualifying sales = Verified Customer leads.
 *   We count the odometerKm field as a proxy for "sale value" if present,
 *   but since no explicit INR field exists on Customer, we expose a hook for
 *   the admin to configure sales value per verified lead OR use order records.
 *   For this implementation: monthly sales = sum of all verified leads created
 *   by the employee in that month (count × a configurable per-lead value).
 *   Default per-lead value = monthlySalesTarget / dailyAppointmentTarget / 20
 *   UNLESS the admin populates orders with amounts tied to employees.
 *   We use ORDER records (Order.totalAmount) for monetary sales when available,
 *   falling back to 0 when no orders exist for the employee.
 *
 * REVISION after user confirmation:
 *   Qualifying "sale" = Customer record with verificationStatus = "Verified".
 *   We do NOT have an INR field per verified appointment in the Customer model.
 *   Therefore "monthly sales" is calculated as:
 *     verified_count this month × per_appointment_value
 *   where per_appointment_value is a new configurable field on PerformanceTarget.
 *   Default = ₹0 (admin must configure), but the appointment performance system
 *   works independently with real counts.
 *
 *   PRACTICAL APPROACH USED HERE:
 *   Since the business says "Verified lead = sale" and there's no INR field,
 *   we will add a `saleValuePerLead` field to PerformanceTarget so admin sets
 *   a per-appointment revenue value. Monthly sales = verified_count × saleValuePerLead.
 *   Default = 65000 (₹65,000 per verified inspection, reaching ₹13L at 20 leads).
 */

import mongoose from "mongoose";
import { PerformanceTarget } from "../models/PerformanceTarget.js";
import { Customer } from "../models/Customer.js";
import { User } from "../models/User.js";

// In-memory target cache (60s TTL)
const targetCache = new Map();
const TARGET_CACHE_TTL_MS = 60 * 1000;

export function invalidateTargetCache() {
  targetCache.clear();
}

/**
 * Fetch the PerformanceTarget configuration effective for a given date.
 * Falls back to defaults if no configuration exists yet.
 */
export async function getTargetForDate(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0); // mid-day to avoid timezone edge cases
  const cacheKey = d.toISOString().split("T")[0];
  const cached = targetCache.get(cacheKey);
  if (cached && Date.now() - cached.time < TARGET_CACHE_TTL_MS) {
    return cached.data;
  }

  const config = await PerformanceTarget.findOne({
    effectiveFrom: { $lte: d },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: d } }]
  })
    .sort({ effectiveFrom: -1 })
    .lean();

  const data = config || {
    dailyAppointmentTarget: 5,
    monthlySalesTarget: 1300000,
    bonusRate: 0.01,
    workingDays: [1, 2, 3, 4, 5, 6], // Mon–Sat
    saleValuePerLead: 65000,
    effectiveFrom: new Date(0),
    effectiveTo: null
  };

  targetCache.set(cacheKey, { time: Date.now(), data });
  return data;
}

/**
 * Get the current (latest / open-ended) PerformanceTarget configuration.
 */
export async function getCurrentTarget() {
  const cached = targetCache.get("current");
  if (cached && Date.now() - cached.time < TARGET_CACHE_TTL_MS) {
    return cached.data;
  }

  const config = await PerformanceTarget.findOne({ effectiveTo: null })
    .sort({ effectiveFrom: -1 })
    .lean();

  const data = config || {
    dailyAppointmentTarget: 5,
    monthlySalesTarget: 1300000,
    bonusRate: 0.01,
    workingDays: [1, 2, 3, 4, 5, 6],
    saleValuePerLead: 65000
  };

  targetCache.set("current", { time: Date.now(), data });
  return data;
}

/**
 * Count working days between two dates (inclusive) given a working-day set.
 * @param {Date} start
 * @param {Date} end  - capped at today if in the future
 * @param {number[]} workingDays - array of JS day-of-week ints (0=Sun)
 * @param {Date|null} joinDate - if employee joined after start, use joinDate as start
 */
export function countWorkingDays(start, end, workingDays, joinDate = null) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let from = new Date(start);
  from.setHours(0, 0, 0, 0);

  if (joinDate) {
    const jd = new Date(joinDate);
    jd.setHours(0, 0, 0, 0);
    if (jd > from) from = jd;
  }

  let to = new Date(end);
  to.setHours(23, 59, 59, 999);
  if (to > today) to = today;

  if (from > to) return 0;

  let count = 0;
  const cur = new Date(from);
  const daySet = new Set(workingDays);

  while (cur <= to) {
    if (daySet.has(cur.getDay())) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/**
 * Determine if today is still "in progress" (before end of working day).
 * We use 18:00 local as end-of-working-day threshold.
 */
export function isTodayInProgress() {
  const now = new Date();
  const hour = now.getHours();
  return hour < 18; // before 6 PM → still in progress
}

// ─── Core Calculation Functions ─────────────────────────────────────────────

/**
 * Calculate appointment achievement percentage.
 * No cap — allows overachievement to be shown.
 */
export function calculateAppointmentAchievement(completed, target) {
  if (!target || target <= 0) return 0;
  return Math.round((completed / target) * 10000) / 100; // 2 decimal places
}

/**
 * Calculate sales achievement percentage.
 */
export function calculateSalesAchievement(sales, target) {
  if (!target || target <= 0) return 0;
  return Math.round((sales / target) * 10000) / 100;
}

/**
 * Calculate bonus (server-side only).
 * Formula: max(0, sales - target) × rate
 * Uses integer arithmetic to avoid floating-point errors.
 */
export function calculateBonus(sales, target, rate) {
  const excess = Math.max(0, sales - target);
  // Multiply then divide to maintain precision (rate is decimal like 0.01)
  const bonus = Math.round(excess * rate * 100) / 100;
  return { excess, bonus };
}

/**
 * Calculate raw performance score and ranking score.
 *
 * rawScore    = (appointmentAchievement × 0.5) + (salesAchievement × 0.5)
 * rankingScore = (min(apptAch,100) × 0.5) + (min(salesAch,100) × 0.5)
 */
export function calculatePerformanceScore(appointmentAchievement, salesAchievement) {
  const rawScore =
    Math.round((appointmentAchievement * 0.5 + salesAchievement * 0.5) * 100) / 100;
  const rankingScore =
    Math.round(
      (Math.min(appointmentAchievement, 100) * 0.5 +
        Math.min(salesAchievement, 100) * 0.5) *
        100
    ) / 100;
  return { rawScore, rankingScore };
}

/**
 * Determine daily appointment status.
 */
export function getDailyStatus(completed, target, isInProgress) {
  if (isInProgress && completed < target) return "In Progress";
  if (completed > target) return "Target Exceeded";
  if (completed === target) return "Target Met";
  return "Target Missed";
}

/**
 * Determine monthly sales status.
 */
export function getMonthlySalesStatus(sales, target) {
  if (sales > target) return "Target Exceeded";
  if (sales === target) return "Target Met";
  return "Target Pending";
}

// ─── Appointment Performance ─────────────────────────────────────────────────

/**
 * Get daily appointment performance for one employee.
 *
 * Qualifying appointment = Customer record where:
 *   - verificationStatus = "Verified"
 *   - appointmentDate falls on the given date (OR createdAt, as fallback)
 *   - employeeId = emp._id
 */
export async function getDailyAppointmentPerformance(employeeId, date) {
  const d = new Date(date);
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  const config = await getTargetForDate(d);
  const target = config.dailyAppointmentTarget;
  const isWorking = new Set(config.workingDays).has(d.getDay());

  if (!isWorking) {
    return {
      date: d,
      target: 0,
      completed: 0,
      remaining: 0,
      achievementPercent: 0,
      status: "Non-Working Day",
      isWorkingDay: false
    };
  }

  const empId =
    typeof employeeId === "string"
      ? new mongoose.Types.ObjectId(employeeId)
      : employeeId;

  const completed = await Customer.countDocuments({
    employeeId: empId,
    verificationStatus: "Verified",
    $or: [
      { appointmentDate: { $gte: dayStart, $lte: dayEnd } },
      {
        $and: [
          { appointmentDate: null },
          { createdAt: { $gte: dayStart, $lte: dayEnd } }
        ]
      }
    ]
  });

  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  const inProgress = isToday && isTodayInProgress();
  const achievementPercent = calculateAppointmentAchievement(completed, target);
  const remaining = Math.max(0, target - completed);
  const status = getDailyStatus(completed, target, inProgress);

  return {
    date: d,
    target,
    completed,
    remaining,
    achievementPercent,
    status,
    isWorkingDay: true,
    inProgress
  };
}

/**
 * Get monthly appointment performance for one employee.
 */
export async function getMonthlyAppointmentPerformance(employeeId, month, year, joinDate = null) {
  const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const config = await getTargetForDate(new Date(year, month, 15));

  const workingDays = countWorkingDays(startOfMonth, endOfMonth, config.workingDays, joinDate);
  const expectedAppointments = workingDays * config.dailyAppointmentTarget;

  const empId =
    typeof employeeId === "string"
      ? new mongoose.Types.ObjectId(employeeId)
      : employeeId;

  const completed = await Customer.countDocuments({
    employeeId: empId,
    verificationStatus: "Verified",
    $or: [
      { appointmentDate: { $gte: startOfMonth, $lte: endOfMonth } },
      {
        $and: [
          { appointmentDate: null },
          { createdAt: { $gte: startOfMonth, $lte: endOfMonth } }
        ]
      }
    ]
  });

  const achievementPercent = calculateAppointmentAchievement(completed, expectedAppointments);

  return {
    month,
    year,
    workingDays,
    dailyTarget: config.dailyAppointmentTarget,
    expectedAppointments,
    completed,
    remaining: Math.max(0, expectedAppointments - completed),
    achievementPercent
  };
}

// ─── Sales Performance ───────────────────────────────────────────────────────

/**
 * Calculate monthly sales for one employee.
 * Sales = number of Verified customer records × saleValuePerLead.
 * The saleValuePerLead is stored in the PerformanceTarget configuration.
 */
export async function getMonthlySalesPerformance(employeeId, month, year) {
  const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const config = await getTargetForDate(new Date(year, month, 15));
  const saleValuePerLead = config.saleValuePerLead || 65000;
  const monthlySalesTarget = config.monthlySalesTarget;
  const bonusRate = config.bonusRate;

  const empId =
    typeof employeeId === "string"
      ? new mongoose.Types.ObjectId(employeeId)
      : employeeId;

  const verifiedCount = await Customer.countDocuments({
    employeeId: empId,
    verificationStatus: "Verified",
    $or: [
      { appointmentDate: { $gte: startOfMonth, $lte: endOfMonth } },
      {
        $and: [
          { appointmentDate: null },
          { createdAt: { $gte: startOfMonth, $lte: endOfMonth } }
        ]
      }
    ]
  });

  const monthlySales = Math.round(verifiedCount * saleValuePerLead * 100) / 100;
  const salesAchievementPercent = calculateSalesAchievement(monthlySales, monthlySalesTarget);
  const { excess, bonus } = calculateBonus(monthlySales, monthlySalesTarget, bonusRate);

  return {
    month,
    year,
    verifiedLeadCount: verifiedCount,
    saleValuePerLead,
    monthlySales,
    target: monthlySalesTarget,
    achievementPercent: salesAchievementPercent,
    excessSales: excess,
    bonusRate,
    bonus,
    status: getMonthlySalesStatus(monthlySales, monthlySalesTarget)
  };
}

// ─── Combined Performance ────────────────────────────────────────────────────

/**
 * Full performance data for one employee for a given month/year.
 */
export async function getEmployeeMonthlyPerformance(employeeId, month, year, joinDate = null) {
  const [appt, sales] = await Promise.all([
    getMonthlyAppointmentPerformance(employeeId, month, year, joinDate),
    getMonthlySalesPerformance(employeeId, month, year)
  ]);

  const { rawScore, rankingScore } = calculatePerformanceScore(
    appt.achievementPercent,
    sales.achievementPercent
  );

  return {
    appointments: appt,
    sales,
    performance: { rawScore, rankingScore }
  };
}

// ─── Daily History ───────────────────────────────────────────────────────────

/**
 * Build a day-by-day performance history for an employee in a given month.
 */
export async function getEmployeeDailyHistory(employeeId, month, year) {
  const startOfMonth = new Date(year, month, 1);
  const today = new Date();
  const endOfMonth = new Date(year, month + 1, 0);
  const end = endOfMonth < today ? endOfMonth : today;

  const config = await getTargetForDate(new Date(year, month, 15));
  const workingDaySet = new Set(config.workingDays);
  const target = config.dailyAppointmentTarget;

  const empId =
    typeof employeeId === "string"
      ? new mongoose.Types.ObjectId(employeeId)
      : employeeId;

  // Fetch all verified appointments for the month in one query
  const records = await Customer.find({
    employeeId: empId,
    verificationStatus: "Verified",
    $or: [
      {
        appointmentDate: {
          $gte: new Date(year, month, 1, 0, 0, 0, 0),
          $lte: new Date(year, month + 1, 0, 23, 59, 59, 999)
        }
      },
      {
        $and: [
          { appointmentDate: null },
          {
            createdAt: {
              $gte: new Date(year, month, 1, 0, 0, 0, 0),
              $lte: new Date(year, month + 1, 0, 23, 59, 59, 999)
            }
          }
        ]
      }
    ]
  })
    .select("appointmentDate createdAt")
    .lean();

  // Group by date string
  const byDate = {};
  records.forEach((r) => {
    const dt = r.appointmentDate || r.createdAt;
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    byDate[key] = (byDate[key] || 0) + 1;
  });

  const history = [];
  const cur = new Date(startOfMonth);
  cur.setHours(0, 0, 0, 0);
  const endD = new Date(end);
  endD.setHours(23, 59, 59, 999);

  while (cur <= endD) {
    if (workingDaySet.has(cur.getDay())) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      const completed = byDate[key] || 0;
      const achievementPercent = calculateAppointmentAchievement(completed, target);

      const isToday =
        cur.getFullYear() === today.getFullYear() &&
        cur.getMonth() === today.getMonth() &&
        cur.getDate() === today.getDate();
      const inProgress = isToday && isTodayInProgress();

      history.push({
        date: new Date(cur),
        target,
        completed,
        remaining: Math.max(0, target - completed),
        achievementPercent,
        status: getDailyStatus(completed, target, inProgress),
        isToday
      });
    }
    cur.setDate(cur.getDate() + 1);
  }

  return history;
}

// ─── Rankings ────────────────────────────────────────────────────────────────

/**
 * Calculate rankings for all employees for a given month/year.
 * Returns sorted array with rank, tie-breakers applied.
 */
export async function calculateEmployeeRankings(month, year) {
  const employees = await User.find({ role: "employee" })
    .select("name email _id createdAt")
    .lean();

  const performances = await Promise.all(
    employees.map(async (emp) => {
      const perf = await getEmployeeMonthlyPerformance(
        emp._id,
        month,
        year,
        emp.createdAt
      );
      return {
        employee: { id: emp._id, name: emp.name, email: emp.email },
        ...perf
      };
    })
  );

  // Sort: rankingScore desc, then sales desc, then appt achievement desc, then completed desc
  performances.sort((a, b) => {
    const rs = b.performance.rankingScore - a.performance.rankingScore;
    if (rs !== 0) return rs;
    const sv = b.sales.monthlySales - a.sales.monthlySales;
    if (sv !== 0) return sv;
    const ap = b.appointments.achievementPercent - a.appointments.achievementPercent;
    if (ap !== 0) return ap;
    return b.appointments.completed - a.appointments.completed;
  });

  // Assign ranks (same score = same rank)
  let rank = 1;
  return performances.map((p, i) => {
    if (i > 0) {
      const prev = performances[i - 1];
      if (
        p.performance.rankingScore !== prev.performance.rankingScore ||
        p.sales.monthlySales !== prev.sales.monthlySales ||
        p.appointments.achievementPercent !== prev.appointments.achievementPercent ||
        p.appointments.completed !== prev.appointments.completed
      ) {
        rank = i + 1;
      }
    }
    return { ...p, rank };
  });
}

// ─── Admin Summary ───────────────────────────────────────────────────────────

/**
 * Admin-level monthly performance summary with bonus liability.
 */
export async function getAdminMonthlySummary(month, year) {
  const rankings = await calculateEmployeeRankings(month, year);
  const config = await getTargetForDate(new Date(year, month, 15));

  const totalEmployees = rankings.length;
  const totalMonthlySales = rankings.reduce((s, r) => s + r.sales.monthlySales, 0);
  const totalBonusLiability = rankings.reduce((s, r) => s + r.sales.bonus, 0);
  const employeesAboveTarget = rankings.filter(
    (r) => r.sales.monthlySales > config.monthlySalesTarget
  ).length;
  const employeesBelowTarget = totalEmployees - employeesAboveTarget;
  const meetingDailyTarget = rankings.filter(
    (r) => r.appointments.achievementPercent >= 100
  ).length;
  const belowDailyTarget = totalEmployees - meetingDailyTarget;

  return {
    period: { month, year },
    totalEmployees,
    meetingDailyTarget,
    belowDailyTarget,
    employeesAboveTarget,
    employeesBelowTarget,
    totalMonthlySales: Math.round(totalMonthlySales * 100) / 100,
    totalBonusLiability: Math.round(totalBonusLiability * 100) / 100,
    monthlySalesTarget: config.monthlySalesTarget,
    rankings
  };
}
