import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAppointmentAchievement,
  calculateSalesAchievement,
  calculateBonus,
  calculatePerformanceScore,
  getDailyStatus,
  getMonthlySalesStatus,
  countWorkingDays
} from "../services/performanceService.js";

describe("Performance Engine — Business Rules & Formulas", () => {

  describe("Daily Appointment Target Achievement", () => {
    test("5 target / 5 completed = 100%", () => {
      const result = calculateAppointmentAchievement(5, 5);
      assert.strictEqual(result, 100);
    });

    test("5 target / 3 completed = 60%", () => {
      const result = calculateAppointmentAchievement(3, 5);
      assert.strictEqual(result, 60);
    });

    test("5 target / 7 completed = 140%", () => {
      const result = calculateAppointmentAchievement(7, 5);
      assert.strictEqual(result, 140);
    });

    test("Zero appointments: 5 target / 0 completed = 0%", () => {
      const result = calculateAppointmentAchievement(0, 5);
      assert.strictEqual(result, 0);
    });

    test("Zero or negative target returns 0% safely", () => {
      assert.strictEqual(calculateAppointmentAchievement(5, 0), 0);
      assert.strictEqual(calculateAppointmentAchievement(5, -1), 0);
    });
  });

  describe("Daily Status Determination", () => {
    test("During work hours (in progress): completed < target returns 'In Progress'", () => {
      assert.strictEqual(getDailyStatus(3, 5, true), "In Progress");
    });

    test("End of day: completed < target returns 'Target Missed'", () => {
      assert.strictEqual(getDailyStatus(3, 5, false), "Target Missed");
    });

    test("completed === target returns 'Target Met'", () => {
      assert.strictEqual(getDailyStatus(5, 5, true), "Target Met");
      assert.strictEqual(getDailyStatus(5, 5, false), "Target Met");
    });

    test("completed > target returns 'Target Exceeded'", () => {
      assert.strictEqual(getDailyStatus(7, 5, true), "Target Exceeded");
      assert.strictEqual(getDailyStatus(7, 5, false), "Target Exceeded");
    });
  });

  describe("Monthly Sales Achievement", () => {
    test("₹13,00,000 target / ₹13,00,000 sales = 100%", () => {
      assert.strictEqual(calculateSalesAchievement(1300000, 1300000), 100);
    });

    test("₹13,00,000 target / ₹15,00,000 sales = 115.38%", () => {
      const result = calculateSalesAchievement(1500000, 1300000);
      assert.strictEqual(result, 115.38);
    });

    test("₹13,00,000 target / ₹12,00,000 sales = 92.31%", () => {
      const result = calculateSalesAchievement(1200000, 1300000);
      assert.strictEqual(result, 92.31);
    });

    test("Zero sales = 0%", () => {
      assert.strictEqual(calculateSalesAchievement(0, 1300000), 0);
    });
  });

  describe("Bonus Rule — Strictly on Excess Above Target", () => {
    test("Sales equal to target (₹13L / ₹13L) -> Bonus = ₹0", () => {
      const { excess, bonus } = calculateBonus(1300000, 1300000, 0.01);
      assert.strictEqual(excess, 0);
      assert.strictEqual(bonus, 0);
    });

    test("Sales below target (₹12L / ₹13L) -> Bonus = ₹0", () => {
      const { excess, bonus } = calculateBonus(1200000, 1300000, 0.01);
      assert.strictEqual(excess, 0);
      assert.strictEqual(bonus, 0);
    });

    test("Sales above target (₹15L / ₹13L) at 1% bonus -> Excess = ₹2,00,000, Bonus = ₹2,000", () => {
      const { excess, bonus } = calculateBonus(1500000, 1300000, 0.01);
      assert.strictEqual(excess, 200000);
      assert.strictEqual(bonus, 2000);
    });

    test("Configurable bonus: 2% on ₹15L sales with ₹13L target -> Bonus = ₹4,000", () => {
      const { excess, bonus } = calculateBonus(1500000, 1300000, 0.02);
      assert.strictEqual(excess, 200000);
      assert.strictEqual(bonus, 4000);
    });

    test("Tiered slab bonus: 1% for first 2L excess, 2% above 2L excess", () => {
      const config = {
        bonusRate: 0.01,
        bonusType: "slab",
        bonusTiers: [
          { minExcess: 0, maxExcess: 200000, rate: 0.01, fixedAmount: 0 },
          { minExcess: 200000, maxExcess: null, rate: 0.02, fixedAmount: 0 }
        ]
      };
      // Sales: 16,00,000, Target: 13,00,000 -> Excess: 3,00,000
      // Tier 1: 2,00,000 * 1% = 2,000
      // Tier 2: 1,00,000 * 2% = 2,000
      // Total bonus = 4,000
      const { excess, bonus } = calculateBonus(1600000, 1300000, config);
      assert.strictEqual(excess, 300000);
      assert.strictEqual(bonus, 4000);
    });

    test("Verify bonus NEVER calculates from total sales (DO NOT multiply total sales by rate)", () => {
      const { bonus } = calculateBonus(1500000, 1300000, 0.01);
      // 15,00,000 * 1% = 15,000 (WRONG)
      assert.notStrictEqual(bonus, 15000);
      // Correct: 2,00,000 * 1% = 2,000
      assert.strictEqual(bonus, 2000);
    });
  });

  describe("Performance & Ranking Scores", () => {
    test("Balanced score: 100% appointments and 100% sales -> 100% rankingScore", () => {
      const { rawScore, rankingScore } = calculatePerformanceScore(100, 100);
      assert.strictEqual(rawScore, 100);
      assert.strictEqual(rankingScore, 100);
    });

    test("Overachievement: 140% appointments and 120% sales", () => {
      const { rawScore, rankingScore } = calculatePerformanceScore(140, 120);
      // rawScore = 140*0.5 + 120*0.5 = 130
      assert.strictEqual(rawScore, 130);
      // rankingScore caps achievements at 100% for fair rank comparison: 100*0.5 + 100*0.5 = 100
      assert.strictEqual(rankingScore, 100);
    });

    test("Partial achievement: 60% appointments and 80% sales -> 70%", () => {
      const { rawScore, rankingScore } = calculatePerformanceScore(60, 80);
      assert.strictEqual(rawScore, 70);
      assert.strictEqual(rankingScore, 70);
    });
  });

  describe("Working Days Calculation & Mid-Month Joiners", () => {
    test("September 2026 working days (Mon-Sat): 26 days", () => {
      const start = new Date(2026, 8, 1);
      const end = new Date(2026, 8, 30);
      const days = countWorkingDays(start, end, [1, 2, 3, 4, 5, 6]);
      assert.strictEqual(days, 26);
    });

    test("Mid-month joiner (joined Sep 16, 2026) counts only working days from join date", () => {
      const start = new Date(2026, 8, 1);
      const end = new Date(2026, 8, 30);
      const joinDate = new Date(2026, 8, 16);
      const days = countWorkingDays(start, end, [1, 2, 3, 4, 5, 6], joinDate);
      assert.strictEqual(days, 13);
    });
  });

});
