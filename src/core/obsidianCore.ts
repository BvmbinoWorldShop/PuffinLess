/**
 * OBSIDIAN CORE
 * -------------
 * The single brain of PuffinLess. Every screen reads from the same report, so the app feels
 * like one connected system that remembers the user instead of a set of separate tabs.
 *
 * Memory = the raw logs (substances, cravings, sleep/energy, streak history).
 * The Core derives from them: habit profile, weekly trends, daily reality and
 * personalised coaching insights.
 */
import type { UserProfile, SubstanceLog, CravingEntry, SleepEnergyEntry, StreakRecord, SubstanceType } from '../types';
import type { CalculatedStats } from '../utils/calculations';
import { computeSleepEnergyCorrelation } from '../utils/sleepTracker';
import { formatDuration, formatHour, lastNDates, dayLabel, localDateStr } from '../utils/dates';

export type InsightTone = 'win' | 'alert' | 'tip' | 'info';

export interface CoreInsight {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
  priority: number;
}

export interface Intake {
  cigarette: number;
  puff_vape: number;
  cannabis: number;
}

export interface WeeklyPoint {
  date: string;
  label: string;
  isToday: boolean;
  sleep: number | null;
  energy: number | null;
  intake: Intake;
  /** cigarettes + puffs/15 + joints*2, used for the bar chart */
  units: number;
  clean: boolean;
}

export interface DailyReality {
  cigarettes: number;
  puffs: number;
  joints: number;
  cost: number;
  smokingMinutes: number;
  lifeLostMinutes: number;
  wakingMinutesPerCig: number | null;
}

export interface CoreReport {
  greeting: string;
  headline: string;
  insights: CoreInsight[];
  today: Intake;
  weekly: WeeklyPoint[];
  weeklySummary: {
    avgSleep: number | null;
    avgEnergy: number | null;
    sleepDelta: number | null;
    energyDelta: number | null;
    cleanDays: number;
    loggedDays: number;
    bestDay: WeeklyPoint | null;
  };
  habit: {
    peakHour: number | null;
    topTrigger: string | null;
    topTriggerCount: number;
    topSubstance: SubstanceType | null;
    memoryEvents: number;
  };
  reality: DailyReality;
}

const SUBSTANCE_NAME: Record<SubstanceType, string> = {
  cigarette: 'cigarettes',
  puff_vape: 'puffs',
  cannabis: 'joints',
};

export function sumIntake(logs: SubstanceLog[], date: string): Intake {
  const out: Intake = { cigarette: 0, puff_vape: 0, cannabis: 0 };
  logs.forEach((l) => {
    if (localDateStr(l.timestamp) === date) out[l.substance] += l.count;
  });
  return out;
}

const unitsOf = (i: Intake) => i.cigarette + i.puff_vape / 15 + i.cannabis * 2;
const total = (i: Intake) => i.cigarette + i.puff_vape + i.cannabis;
const avg = (n: number[]) => (n.length ? n.reduce((a, b) => a + b, 0) / n.length : null);
const round1 = (n: number | null) => (n === null ? null : Number(n.toFixed(1)));

/** What a normal day of the user's habit looks like, before quitting, strictly respecting selected substances in settings. */
export function computeDailyReality(profile: UserProfile, dailyCost: number): DailyReality {
  const habits = profile.habits ?? [];
  const cigarettes = habits.includes('cigarette') ? (profile.cigarettesPerDay || 0) : 0;
  const puffs = habits.includes('puff_vape') ? (profile.puffsPerDay || 0) : 0;
  const joints = habits.includes('cannabis')
    ? Number(((((profile.cannabisGramsPerWeek || 0) / 7) * 2)).toFixed(1)) // ~0.5 g per joint
    : 0;

  const smokingMinutes = cigarettes * 7 + puffs * 0.2 + joints * 15;
  // BMJ 2000: ~11 min of life per cigarette. Vapes are counted at 15 puffs per cigarette-equivalent (estimate).
  const lifeLostMinutes = (cigarettes + puffs / 15) * 11;
  return {
    cigarettes,
    puffs,
    joints,
    cost: dailyCost,
    smokingMinutes,
    lifeLostMinutes,
    wakingMinutesPerCig: cigarettes > 0 ? Math.round(960 / cigarettes) : null,
  };
}

function greetingFor(name: string, isFr: boolean = false): string {
  const h = new Date().getHours();
  const firstName = name.split(' ')[0] || (isFr ? 'ami' : 'friend');
  if (isFr) {
    const part = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
    return `${part}, ${firstName}`;
  }
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${firstName}`;
}

export function buildCoreReport(input: {
  profile: UserProfile;
  stats: CalculatedStats;
  substanceLogs: SubstanceLog[];
  cravings: CravingEntry[];
  sleepLogs: SleepEnergyEntry[];
  streaks: StreakRecord[];
}): CoreReport {
  const { profile, stats, substanceLogs, cravings, sleepLogs } = input;
  const todayStr = localDateStr();
  const today = sumIntake(substanceLogs, todayStr);

  // ---- Weekly trend (last 7 days) ----
  const weekly: WeeklyPoint[] = lastNDates(7).map((date) => {
    const entry = sleepLogs.find((e) => e.date === date);
    const logged = sumIntake(substanceLogs, date);
    const intake = logged; // Strictly calculated from real substance database logs
    return {
      date,
      label: dayLabel(date),
      isToday: date === todayStr,
      sleep: entry ? entry.sleepRating : null,
      energy: entry ? entry.energyRating : null,
      intake,
      units: Number(unitsOf(intake).toFixed(1)),
      clean: total(intake) === 0,
    };
  });

  const ratedDays = weekly.filter((p) => p.sleep !== null);
  const recent = ratedDays.slice(-3);
  const earlier = ratedDays.slice(0, -3);
  const deltaOf = (key: 'sleep' | 'energy') => {
    const a = avg(recent.map((p) => p[key] as number));
    const b = avg(earlier.map((p) => p[key] as number));
    return a !== null && b !== null ? round1(a - b) : null;
  };
  const bestDay = ratedDays.length
    ? ratedDays.reduce((best, p) => ((p.sleep ?? 0) + (p.energy ?? 0) > (best.sleep ?? 0) + (best.energy ?? 0) ? p : best))
    : null;

  const weeklySummary = {
    avgSleep: round1(avg(ratedDays.map((p) => p.sleep as number))),
    avgEnergy: round1(avg(ratedDays.map((p) => p.energy as number))),
    sleepDelta: deltaOf('sleep'),
    energyDelta: deltaOf('energy'),
    cleanDays: weekly.filter((p) => p.clean).length,
    loggedDays: ratedDays.length,
    bestDay,
  };

  // ---- Habit memory ----
  const hourHist = new Array(24).fill(0) as number[];
  substanceLogs.forEach((l) => {
    hourHist[new Date(l.timestamp).getHours()] += 1;
  });
  const peakCount = Math.max(...hourHist);
  const peakHour = substanceLogs.length >= 3 && peakCount >= 2 ? hourHist.indexOf(peakCount) : null;

  const triggerCounts: Record<string, number> = {};
  cravings.forEach((c) => {
    triggerCounts[c.trigger] = (triggerCounts[c.trigger] || 0) + 1;
  });
  const triggerEntries = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
  const topTrigger = cravings.length >= 2 && triggerEntries.length ? triggerEntries[0][0] : null;

  const subCounts = stats.slipsBySubstance;
  const topSub = (Object.keys(subCounts) as SubstanceType[]).sort((a, b) => subCounts[b] - subCounts[a])[0];
  const topSubstance = subCounts[topSub] > 0 ? topSub : null;

  const habit = {
    peakHour,
    topTrigger,
    topTriggerCount: topTrigger ? triggerCounts[topTrigger] : 0,
    topSubstance,
    memoryEvents: substanceLogs.length + cravings.length + sleepLogs.length,
  };

  const reality = computeDailyReality(profile, stats.dailyBaselineCost);

  const isFr = profile.language === 'fr';
  const SUB_FR: Record<SubstanceType, string> = {
    cigarette: 'cigarettes',
    puff_vape: 'bouffées de vape',
    cannabis: 'joints',
  };

  // ---- Personalised insights ----
  const insights: CoreInsight[] = [];
  const add = (i: CoreInsight) => insights.push(i);

  const lastLog = substanceLogs[0];
  const hoursSinceSlip = lastLog ? (Date.now() - new Date(lastLog.timestamp).getTime()) / 3600000 : Infinity;
  const todayTotal = total(today);

  if (todayTotal > 0) {
    const parts = (Object.keys(today) as SubstanceType[])
      .filter((k) => today[k] > 0)
      .map((k) => `${today[k]} ${isFr ? SUB_FR[k] : SUBSTANCE_NAME[k]}`)
      .join(', ');
    add({
      id: 'slip-today',
      tone: 'alert',
      priority: 100,
      title: isFr ? `Aujourd'hui : ${parts}` : `Today so far: ${parts}`,
      body: isFr
        ? `Le compteur a redémarré, mais c'est une donnée, pas un échec. Votre meilleure série est de ${formatDuration(stats.bestStreakSeconds)}, vous avez déjà prouvé que vous en êtes capable. L'heure qui commence est celle qui compte.`
        : `Your counter restarted, but this is data, not failure. Your longest streak is ${formatDuration(stats.bestStreakSeconds)}, so you have already proven you can do it. The next hour is the one that matters.`,
    });
  }

  if (hoursSinceSlip < 6 && todayTotal === 0 && lastLog) {
    add({
      id: 'slip-recent',
      tone: 'tip',
      priority: 90,
      title: isFr ? 'Les premières heures après un écart sont sensibles' : 'The first hours after a slip are fragile',
      body: isFr
        ? 'Les envies arrivent par vagues de quelques minutes. Ouvrez le bouton SOS dès qu\'une pulsion survient pour surfer dessus calmement.'
        : 'Cravings come in waves of a few minutes. Open the Craving button the moment one hits and ride it out.',
    });
  }

  if (stats.level.next) {
    const left = stats.level.remainingSeconds;
    add({
      id: 'next-goal',
      tone: 'win',
      priority: left < 6 * 3600 ? 85 : 55,
      title: isFr ? `${formatDuration(left)} jusqu'à "${stats.level.next.title}"` : `${formatDuration(left)} to "${stats.level.next.title}"`,
      body: isFr
        ? `Vous êtes à ${Math.round(stats.level.progressPercent)}% du chemin vers ${stats.level.next.label}. ${stats.level.next.blurb}`
        : `You are ${Math.round(stats.level.progressPercent)}% of the way from ${stats.level.completed.length ? stats.level.completed[stats.level.completed.length - 1].label : 'the start'} to ${stats.level.next.label}. ${stats.level.next.blurb}`,
    });
  }

  if (habit.peakHour !== null) {
    add({
      id: 'peak-hour',
      tone: 'tip',
      priority: 80,
      title: isFr ? `Votre heure critique se situe vers ${formatHour(habit.peakHour)}` : `Your danger hour is around ${formatHour(habit.peakHour)}`,
      body: isFr
        ? `La majorité de vos écarts passés ont eu lieu vers ${formatHour(habit.peakHour)}. Programmez un rituel alternatif 15 minutes avant : marche rapide, eau glacée ou respiration 4-7-8.`
        : `Most of your logged slips happen near ${formatHour(habit.peakHour)}. Schedule a replacement ritual 15 minutes earlier: a walk, cold water or a 4-7-8 breathing round.`,
    });
  }

  if (habit.topTrigger) {
    add({
      id: 'top-trigger',
      tone: 'tip',
      priority: 75,
      title: isFr ? `Votre déclencheur n°1 est "${habit.topTrigger}"` : `Your #1 trigger is "${habit.topTrigger}"`,
      body: isFr
        ? `Il apparaît dans ${habit.topTriggerCount} de vos ${cravings.length} envies enregistrées. Définissez dès maintenant votre parade pour la prochaine fois.`
        : `It showed up in ${habit.topTriggerCount} of your ${cravings.length} logged cravings. Decide now what you will do next time it appears. If-then plans roughly double follow-through.`,
    });
  }

  const corr = computeSleepEnergyCorrelation(sleepLogs);
  if (corr.hasEnoughData && corr.sleepImprovementPercent > 0) {
    add({
      id: 'sleep-corr',
      tone: 'win',
      priority: 70,
      title: isFr ? `Les jours sans fumer vous offrent ${corr.sleepImprovementPercent}% de meilleur sommeil` : `Clean days give you ${corr.sleepImprovementPercent}% better sleep`,
      body: isFr
        ? `Vos propres bilans indiquent ${corr.avgCleanSleep}/10 de sommeil les jours sobres contre ${corr.avgHeavySleep}/10 les jours de fumée, avec ${corr.energyMultiplier}x plus d'énergie au réveil.`
        : `Your own logs show ${corr.avgCleanSleep}/10 sleep on clean days vs ${corr.avgHeavySleep}/10 on heavy days, with ${corr.energyMultiplier}x the energy. That is your body's verdict.`,
    });
  } else if (weeklySummary.sleepDelta !== null && weeklySummary.sleepDelta >= 0.5) {
    add({
      id: 'sleep-up',
      tone: 'win',
      priority: 60,
      title: isFr ? `Le sommeil gagne +${weeklySummary.sleepDelta} points` : `Sleep is up ${weeklySummary.sleepDelta} points`,
      body: isFr
        ? 'Vos trois dernières nuits affichent un score supérieur aux précédentes. Un sommeil profond restaure votre volonté pour demain.'
        : 'Your last three nights score higher than the days before. Better sleep means stronger willpower tomorrow.',
    });
  }

  if (!weekly[weekly.length - 1].sleep) {
    add({
      id: 'log-vitals',
      tone: 'info',
      priority: 50,
      title: isFr ? 'Notez votre sommeil et votre énergie du jour' : 'Log today\'s sleep and energy',
      body: isFr
        ? 'Dix secondes par jour suffisent au Core pour vous révéler précisément comment l\'arrêt transforme votre vitalité.'
        : 'Ten seconds a day is what lets the Core show you how smoking really affects your body.',
    });
  }

  if (stats.cravingsResistedCount > 0) {
    add({
      id: 'resisted',
      tone: 'win',
      priority: 45,
      title: isFr ? `${stats.cravingsResistedCount} envies terrassées` : `${stats.cravingsResistedCount} cravings beaten`,
      body: isFr
        ? 'Chaque pulsion que vous traversez sans fumer affame les récepteurs cérébraux. L\'automatisme perd définitivement du terrain.'
        : 'Every craving you ride out without smoking weakens the next one. The loop is physically losing strength.',
    });
  }

  // ---- Personalized AI Life Coach Modules ----
  if (profile.job) {
    add({
      id: 'career-coaching',
      tone: 'tip',
      priority: 65,
      title: isFr
        ? `Coaching Pro (${profile.job}) : Focus & Énergie`
        : `Career Coaching (${profile.job}): Sustained Focus`,
      body: isFr
        ? `Dans votre activité (${profile.job}), les cycles de manque chimique provoquaient des chutes de dopamine et des sautes de concentration. L'arrêt stabilise votre système nerveux et décuple votre endurance mentale.`
        : `In your profession (${profile.job}), withdrawal loops caused mid-day dopamine crashes and focus dips. Staying clean stabilizes your baseline dopamine and sustained mental stamina.`,
    });
  }

  if (profile.monthlyIncome && profile.monthlyIncome > 0) {
    const monthlyBurn = Math.round(stats.dailyBaselineCost * 30.5);
    const incomePercent = Math.round((monthlyBurn / profile.monthlyIncome) * 100);
    if (incomePercent > 0) {
      add({
        id: 'income-freedom',
        tone: 'win',
        priority: 62,
        title: isFr
          ? `Pouvoir d'achat : ${incomePercent}% de vos revenus libérés`
          : `Financial Freedom: ${incomePercent}% of Your Income Liberated`,
        body: isFr
          ? `Vous dépensiez environ ${profile.currency}${monthlyBurn}/mois (${incomePercent}% de votre salaire net de ${profile.currency}${profile.monthlyIncome.toLocaleString()}). En arrêtant, vous récupérez ${profile.currency}${Math.round(monthlyBurn * 12).toLocaleString()} par an pour vos vrais projets.`
          : `You were spending ~${profile.currency}${monthlyBurn}/month (${incomePercent}% of your ${profile.currency}${profile.monthlyIncome.toLocaleString()} net salary). Quitting frees up ${profile.currency}${Math.round(monthlyBurn * 12).toLocaleString()} every single year.`,
      });
    }
  }

  const primarySub = profile.primarySubstance || (habit.topSubstance ?? 'cigarette');
  if (primarySub === 'cannabis') {
    add({
      id: 'substance-cannabis-coach',
      tone: 'info',
      priority: 58,
      title: isFr ? 'Restauration des Récepteurs CB1 & Sommeil Paradoxal' : 'CB1 Receptor Recovery & REM Sleep',
      body: isFr
        ? 'Après l\'arrêt du cannabis, les récepteurs cannabinoïdes CB1 du cerveau se régénèrent en 3 à 4 semaines. Le sommeil paradoxal profond (rêves, consolidation mnésique) redevient naturel et réparateur.'
        : 'After stopping cannabis, CB1 cannabinoid receptors regenerate over 3 to 4 weeks. Deep REM sleep rebounds, restoring natural dream cycles and sharp daytime recall.',
    });
  } else if (primarySub === 'puff_vape') {
    add({
      id: 'substance-vape-coach',
      tone: 'info',
      priority: 58,
      title: isFr ? 'Désactivation des Puffs & Vapeurs Chauffées' : 'Dismantling Vape Salt-Nic Loops',
      body: isFr
        ? 'Les puffs délivrent des sels de nicotine à absorption fulgurante incitant au micro-puffing continu. En coupant ce flux, vos bronches et alvéoles éliminent les traces d\'aérosols en quelques jours.'
        : 'Vape puffs deliver ultra-rapid nicotine salts that drive compulsive micro-puffing all day long. Breaking this loop allows airways to expel aerosol traces within days.',
    });
  } else if (primarySub === 'cigarette') {
    add({
      id: 'substance-cig-coach',
      tone: 'info',
      priority: 58,
      title: isFr ? 'Désoxydation Sanguine & Oxygène Cellulaire' : 'Oxygen Saturation & Arterial Cleansing',
      body: isFr
        ? 'Le monoxyde de carbone quitte définitivement votre système cardiovasculaire en 24 à 48 heures. Votre taux d\'oxygène remonte à 100%, allégeant immédiatement la charge cardiaque.'
        : 'Carbon monoxide fully leaves your vascular system within 24 to 48 hours. Cellular oxygen saturation climbs back to 100%, immediately easing cardiac load.',
    });
  }

  if (profile.customCoachGoal) {
    add({
      id: 'personal-motto',
      tone: 'win',
      priority: 52,
      title: isFr ? `Motivation : ${profile.customCoachGoal}` : `Personal Goal: ${profile.customCoachGoal}`,
      body: isFr
        ? `Votre engagement ("${profile.customCoachGoal}") renforce votre détermination. Chaque pulsion surmontée réaffirme votre souveraineté sur les dépendances.`
        : `Your commitment ("${profile.customCoachGoal}") reinforces your mindset. Every resisted urge reclaims sovereignty over chemical dependencies.`,
    });
  }

  if (stats.moneySaved > 0) {
    add({
      id: 'money',
      tone: 'win',
      priority: 40,
      title: isFr ? `${profile.currency}${stats.moneySaved.toLocaleString()} sauvés dans votre poche` : `${profile.currency}${stats.moneySaved.toLocaleString()} kept in your pocket`,
      body: isFr
        ? `À raison de ${profile.currency}${stats.dailyBaselineCost}/jour, une année complète sans fumer représente ${profile.currency}${Math.round(stats.dailyBaselineCost * 365).toLocaleString()} d'économies pures.`
        : `At ${profile.currency}${stats.dailyBaselineCost}/day, a full year of clean living is worth ${profile.currency}${Math.round(stats.dailyBaselineCost * 365).toLocaleString()}.`,
    });
  }

  if (insights.length === 0) {
    add({
      id: 'awareness',
      tone: 'info',
      priority: 10,
      title: isFr ? 'Connaître vos chiffres' : 'Know your numbers',
      body: isFr
        ? `Avant d'arrêter, vous fumiez environ ${reality.cigarettes} cigarettes par jour. Ouvrez "Votre Réalité Quotidienne" pour en visualiser le coût exact.`
        : `Before quitting you smoked about ${reality.cigarettes} cigarettes a day. Open "Your Daily Reality" to see what that really costs.`,
    });
  }

  insights.sort((a, b) => b.priority - a.priority);

  const headline =
    todayTotal > 0
      ? (isFr ? 'Un faux pas est un signal d\'apprentissage, pas un verdict. Repartez immédiatement.' : 'A slip is a signal, not a verdict. Reset your plan and keep going.')
      : stats.level.next
      ? (isFr ? `Vous progressez vers le niveau "${stats.level.next.title}". Continuez ainsi.` : `You are ${stats.level.rankTitle === 'Fresh Start' ? 'at the start of something big' : `a "${stats.level.rankTitle}"`}. Next up: ${stats.level.next.title}.`)
      : (isFr ? 'Vous avez franchi tous les paliers. Vous êtes libre.' : 'You have completed every level. You are free.');

  return {
    greeting: greetingFor(profile.name, isFr),
    headline,
    insights: insights.slice(0, 7),
    today,
    weekly,
    weeklySummary,
    habit,
    reality,
  };
}
