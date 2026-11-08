/**
 * Production utility for calculating period-scoped clinical and behavioral metrics.
 * Single source of truth for ClinicalCertificateModal and test suites,
 * strictly filtering by time range with zero lifetime data leaks.
 */

import type {
  UserProfile,
  SubstanceLog,
  CravingEntry,
  SleepEnergyEntry,
  PurchaseExpense,
} from '../types/index.ts';

export interface ClinicalMetricsInputs {
  timeRange: 'day' | 'week' | 'month';
  now?: Date | number | string;
  profile?: Partial<UserProfile> | null;
  substanceLogs?: SubstanceLog[];
  cravings?: CravingEntry[];
  sleepLogs?: SleepEnergyEntry[];
  expenses?: PurchaseExpense[];
}

export interface ClinicalMetricsResult {
  cutoffMs: number;
  windowDays: number;
  periodCleanDays: number;
  periodCleanHours: number;
  filteredSubstanceLogs: SubstanceLog[];
  filteredCravings: CravingEntry[];
  filteredSleepLogs: SleepEnergyEntry[];
  filteredExpenses: PurchaseExpense[];
  totalExpensesAmount: number;
  totalCigarettesTaken: number;
  totalPuffsTaken: number;
  totalCannabisTaken: number;
  totalSubstancesTakenDoses: number;
  periodExpectedDoses: number;
  periodDosesAvoided: number;
  periodExpectedSpending: number;
  periodMoneySaved: number;
  totalCravingsCount: number;
  resistedCravingsCount: number;
  cravingMasteryPct: number;
  avgSleep: string;
  avgEnergy: string;
}

export function calculateClinicalPeriodMetrics(input: ClinicalMetricsInputs): ClinicalMetricsResult {
  const nowDate = input.now ? new Date(input.now) : new Date();
  const nowMs = nowDate.getTime();

  const windowDays = input.timeRange === 'day' ? 1 : input.timeRange === 'week' ? 7 : 30;
  const cutoffMs = nowMs - windowDays * 24 * 60 * 60 * 1000;

  // Clean time strictly bounded by the period window
  const cleanDurationMs = Math.max(0, nowMs - new Date(input.profile?.quitDate || nowDate).getTime());
  const periodMaxMs = windowDays * 24 * 60 * 60 * 1000;
  const periodCleanMs = Math.min(cleanDurationMs, periodMaxMs);
  const periodCleanDays = Math.floor(periodCleanMs / (24 * 60 * 60 * 1000));
  const periodCleanHours = Math.floor((periodCleanMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  // Filter expenses
  const allExpenses = input.expenses || [];
  const filteredExpenses = allExpenses.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    return !isNaN(t) && t >= cutoffMs;
  });
  const totalExpensesAmount = filteredExpenses.reduce(
    (sum, e) => sum + (e.price || 0) * (e.quantity || 1),
    0
  );

  // Filter substance intakes strictly within window
  const allSubstanceLogs = input.substanceLogs || [];
  const filteredSubstanceLogs = allSubstanceLogs.filter((l) => {
    const t = new Date(l.timestamp).getTime();
    return !isNaN(t) && t >= cutoffMs;
  });

  let totalCigarettesTaken = 0;
  let totalPuffsTaken = 0;
  let totalCannabisTaken = 0;

  filteredSubstanceLogs.forEach((l) => {
    if (l.substance === 'cigarette') totalCigarettesTaken += l.count;
    else if (l.substance === 'puff_vape') totalPuffsTaken += l.count;
    else if (l.substance === 'cannabis') totalCannabisTaken += l.count;
  });
  const totalSubstancesTakenDoses = totalCigarettesTaken + totalPuffsTaken + totalCannabisTaken;

  // Filter cravings strictly within window
  const allCravings = input.cravings || [];
  const filteredCravings = allCravings.filter((c) => {
    const t = new Date(c.timestamp).getTime();
    return !isNaN(t) && t >= cutoffMs;
  });

  // Filter sleep logs strictly within window
  const cutoffDate = new Date(cutoffMs);
  const cutoffDateStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-${String(cutoffDate.getDate()).padStart(2, '0')}`;
  const allSleepLogs = input.sleepLogs || [];
  const filteredSleepLogs = allSleepLogs.filter((s) => s.date >= cutoffDateStr);

  // Avoided doses and spending based on daily expectation
  const dailyExpectedCigs = input.profile?.cigarettesPerDay || 0;
  const dailyExpectedPuffs = input.profile?.puffsPerDay || 0;
  const dailyExpectedCannabis = (input.profile?.cannabisGramsPerWeek || 0) / 7;
  const dailyExpectedDoses = dailyExpectedCigs + dailyExpectedPuffs + dailyExpectedCannabis;
  const periodExpectedDoses = Math.round(dailyExpectedDoses * windowDays);
  const periodDosesAvoided = Math.max(0, periodExpectedDoses - totalSubstancesTakenDoses);

  const cigCostPerDay =
    dailyExpectedCigs > 0
      ? (dailyExpectedCigs / (input.profile?.cigarettesInPack || 20)) * (input.profile?.pricePerPack || 12)
      : 0;
  const vapeCostPerDay =
    dailyExpectedPuffs > 0
      ? (dailyExpectedPuffs / 600) * (input.profile?.podPrice || 18)
      : 0;
  const cannabisCostPerDay = dailyExpectedCannabis * (input.profile?.pricePerGram || 10);
  const dailyExpectedSpending = cigCostPerDay + vapeCostPerDay + cannabisCostPerDay;
  const periodExpectedSpending = dailyExpectedSpending * windowDays;
  const periodMoneySaved = Math.max(0, Math.round(periodExpectedSpending - totalExpensesAmount));

  // Craving Mastery Rate (no lifetime fallback)
  const totalCravingsCount = filteredCravings.length;
  const resistedCravingsCount = filteredCravings.filter((c) => c.resisted).length;
  const cravingMasteryPct =
    totalCravingsCount > 0
      ? Math.round((resistedCravingsCount / totalCravingsCount) * 100)
      : totalSubstancesTakenDoses === 0
      ? 100
      : 0;

  // Sleep & energy averages strictly for this period
  const hasSufficientSleep = filteredSleepLogs.length > 0;
  const avgSleep = hasSufficientSleep
    ? (filteredSleepLogs.reduce((acc, l) => acc + l.sleepRating, 0) / filteredSleepLogs.length).toFixed(1)
    : '--';
  const avgEnergy = hasSufficientSleep
    ? (filteredSleepLogs.reduce((acc, l) => acc + l.energyRating, 0) / filteredSleepLogs.length).toFixed(1)
    : '--';

  return {
    cutoffMs,
    windowDays,
    periodCleanDays,
    periodCleanHours,
    filteredSubstanceLogs,
    filteredCravings,
    filteredSleepLogs,
    filteredExpenses,
    totalExpensesAmount,
    totalCigarettesTaken,
    totalPuffsTaken,
    totalCannabisTaken,
    totalSubstancesTakenDoses,
    periodExpectedDoses,
    periodDosesAvoided,
    periodExpectedSpending,
    periodMoneySaved,
    totalCravingsCount,
    resistedCravingsCount,
    cravingMasteryPct,
    avgSleep,
    avgEnergy,
  };
}
