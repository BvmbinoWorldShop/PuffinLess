import type { UserProfile, SubstanceLog, CravingEntry, Badge, StreakRecord } from '../types';
import { HEALTH_MILESTONES, ALL_BADGES } from './healthMilestones';
import { computeLevelProgress } from '../core/levels';
import type { LevelProgress } from '../core/levels';

export interface CalculatedStats {
  /** Seconds of the CURRENT smoke-free streak (resets on every logged cigarette, puff or joint). */
  elapsedSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  bestStreakSeconds: number;
  totalCleanSeconds: number;
  relapseCount: number;
  cigarettesAvoided: number;
  puffsAvoided: number;
  gramsAvoided: number;
  cigarettesSmokedSlips: number;
  slipsBySubstance: { cigarette: number; puff_vape: number; cannabis: number };
  moneySaved: number;
  dailyCost: number;
  dailyBaselineCost: number;
  monthlyProjectedSavings: number;
  yearlyProjectedSavings: number;
  lifeRegainedHours: number;
  cravingsResistedCount: number;
  currentMilestoneProgress: {
    milestoneId: string;
    progressPercent: number;
    remainingTimeText: string;
  } | null;
  unlockedBadgeIds: string[];
  level: LevelProgress;
}

/** What the user's habit costs per day, strictly counting ONLY the selected substances in profile settings. If nothing is selected, returns 0. */
export function baselineDailyCost(profile: UserProfile): number {
  const habits = profile.habits ?? [];
  if (habits.length === 0) return 0;

  let total = 0;
  if (habits.includes('cigarette')) {
    const costPerCig = profile.cigarettesInPack > 0 ? profile.pricePerPack / profile.cigarettesInPack : 0.5;
    total += (profile.cigarettesPerDay || 0) * costPerCig;
  }
  if (habits.includes('puff_vape')) {
    total += (profile.puffsPerDay || 0) * ((profile.podPrice ?? 18) / 600);
  }
  if (habits.includes('cannabis')) {
    total += (((profile.cannabisGramsPerWeek || 0) / 7) * (profile.pricePerGram ?? 10));
  }
  return Number(total.toFixed(2));
}

export function calculateStats(
  profile: UserProfile,
  substanceLogs: SubstanceLog[],
  cravings: CravingEntry[],
  streaks: StreakRecord[]
): CalculatedStats {
  const now = Date.now();
  // As default, the app starts the count from the day it is used unless a specific date is entered
  const effectiveQuitDate = profile.quitDate || profile.createdAt;
  const hasValidQuitDate = Boolean(effectiveQuitDate && !isNaN(new Date(effectiveQuitDate).getTime()));
  const elapsedSeconds = hasValidQuitDate && effectiveQuitDate
    ? Math.max(0, Math.floor((now - new Date(effectiveQuitDate).getTime()) / 1000))
    : 0;

  const days = Math.floor(elapsedSeconds / 86400);
  const hours = Math.floor((elapsedSeconds % 86400) / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  // Streak memory
  const pastDurations = streaks.map((s) =>
    Math.max(0, Math.floor((new Date(s.end).getTime() - new Date(s.start).getTime()) / 1000))
  );
  const bestStreakSeconds = Math.max(elapsedSeconds, ...pastDurations, 0);
  const totalCleanSeconds = elapsedSeconds + pastDurations.reduce((a, b) => a + b, 0);

  const slipsBySubstance = { cigarette: 0, puff_vape: 0, cannabis: 0 };
  substanceLogs.forEach((l) => {
    slipsBySubstance[l.substance] += l.count;
  });

  // Everything avoided = baseline habit over all smoke-free time, strictly for selected substances in settings
  const habits = profile.habits ?? [];
  const hasCig = habits.includes('cigarette');
  const hasPuff = habits.includes('puff_vape');
  const hasCannabis = habits.includes('cannabis');

  const cleanDays = totalCleanSeconds / 86400;
  const cigarettesAvoided = hasCig ? Math.floor(cleanDays * (profile.cigarettesPerDay || 0)) : 0;
  const puffsAvoided = hasPuff ? Math.floor(cleanDays * (profile.puffsPerDay || 0)) : 0;
  const gramsAvoided = hasCannabis ? Number((cleanDays * ((profile.cannabisGramsPerWeek || 0) / 7)).toFixed(1)) : 0;

  const dailyBaselineCost = baselineDailyCost(profile);
  const moneySaved = Number((cleanDays * dailyBaselineCost).toFixed(2));
  const costPerCigarette = profile.cigarettesInPack > 0 ? profile.pricePerPack / profile.cigarettesInPack : 0.5;
  const dailyCost = hasCig ? Number(((profile.cigarettesPerDay || 0) * costPerCigarette).toFixed(2)) : 0;

  // ~11 minutes of life per cigarette (BMJ 2000); vape puffs counted at 15 puffs ≈ 1 cigarette of nicotine
  const lifeRegainedHours = Number((((cigarettesAvoided + puffsAvoided / 15) * 11) / 60).toFixed(1));

  const cravingsResistedCount = cravings.filter((c) => c.resisted).length;

  let currentMilestoneProgress: CalculatedStats['currentMilestoneProgress'] = null;
  const nextMilestone = HEALTH_MILESTONES.find((m) => m.timeSeconds > elapsedSeconds);
  if (nextMilestone) {
    const prev = HEALTH_MILESTONES[HEALTH_MILESTONES.indexOf(nextMilestone) - 1]?.timeSeconds || 0;
    const progressPercent = Math.min(100, Math.max(0, ((elapsedSeconds - prev) / (nextMilestone.timeSeconds - prev)) * 100));
    const remaining = nextMilestone.timeSeconds - elapsedSeconds;
    const remD = Math.floor(remaining / 86400);
    const remH = Math.floor((remaining % 86400) / 3600);
    const remM = Math.floor((remaining % 3600) / 60);
    currentMilestoneProgress = {
      milestoneId: nextMilestone.id,
      progressPercent: Number(progressPercent.toFixed(1)),
      remainingTimeText: remD > 0 ? `${remD}d ${remH}h left` : remH > 0 ? `${remH}h ${remM}m left` : `${remM}m left`,
    };
  }

  const elapsedHours = elapsedSeconds / 3600;
  const unlockedBadgeIds: string[] = [];
  ALL_BADGES.forEach((badge: Badge) => {
    let unlocked = false;
    switch (badge.conditionType) {
      case 'hours': unlocked = elapsedHours >= badge.conditionValue; break;
      case 'days': unlocked = days >= badge.conditionValue; break;
      case 'money': unlocked = moneySaved >= badge.conditionValue; break;
      case 'cigsAvoided': unlocked = cigarettesAvoided >= badge.conditionValue; break;
      case 'cravingsResisted': unlocked = cravingsResistedCount >= badge.conditionValue; break;
    }
    if (unlocked) unlockedBadgeIds.push(badge.id);
  });

  return {
    elapsedSeconds,
    days,
    hours,
    minutes,
    seconds,
    bestStreakSeconds,
    totalCleanSeconds,
    relapseCount: streaks.length,
    cigarettesAvoided,
    puffsAvoided,
    gramsAvoided,
    cigarettesSmokedSlips: slipsBySubstance.cigarette,
    slipsBySubstance,
    moneySaved,
    dailyCost,
    dailyBaselineCost,
    monthlyProjectedSavings: Number((dailyBaselineCost * 30.41).toFixed(2)),
    yearlyProjectedSavings: Number((dailyBaselineCost * 365).toFixed(2)),
    lifeRegainedHours,
    cravingsResistedCount,
    currentMilestoneProgress,
    unlockedBadgeIds,
    level: computeLevelProgress(elapsedSeconds),
  };
}
