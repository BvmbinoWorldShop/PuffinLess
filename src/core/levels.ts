import type { Language } from '../types';

export type LevelTier = 'beginner' | 'intermediate' | 'expert';

export interface LevelGoal {
  id: string;
  tier: LevelTier;
  seconds: number;
  label: string;
  title: string;
  blurb: string;
}

const H = 3600;
const D = 86400;

export const LEVEL_GOALS: LevelGoal[] = [
  { id: 'g-1h', tier: 'beginner', seconds: H, label: '1 hour', title: 'First Hour Won', blurb: 'The hardest decision is the first one. You made it.' },
  { id: 'g-1d', tier: 'beginner', seconds: D, label: '1 day', title: 'Day One Done', blurb: 'Carbon monoxide is gone from your blood. Oxygen is back.' },
  { id: 'g-2d', tier: 'beginner', seconds: 2 * D, label: '2 days', title: 'Two-Day Streak', blurb: 'Nerve endings are regrowing. Food and air smell richer.' },
  { id: 'g-4d', tier: 'beginner', seconds: 4 * D, label: '4 days', title: 'Nicotine Peak Passed', blurb: 'Nicotine has left your body. What remains is habit, and habit can be beaten.' },
  { id: 'g-1w', tier: 'beginner', seconds: 7 * D, label: '1 week', title: 'Week Warrior', blurb: 'You survived the most intense week of withdrawal.' },
  { id: 'g-2w', tier: 'intermediate', seconds: 14 * D, label: '2 weeks', title: 'Fortnight Fighter', blurb: 'Circulation and stamina are visibly improving.' },
  { id: 'g-3w', tier: 'intermediate', seconds: 21 * D, label: '3 weeks', title: 'Habit Breaker', blurb: 'Cravings are shorter and weaker. The loop is losing power.' },
  { id: 'g-1m', tier: 'intermediate', seconds: 30 * D, label: '1 month', title: 'Monthly Master', blurb: 'Airway cilia are working again. A real milestone.' },
  { id: 'g-2m', tier: 'intermediate', seconds: 60 * D, label: '2 months', title: 'Iron Will', blurb: 'Most people never reach this. You are rewriting your identity.' },
  { id: 'g-3m', tier: 'expert', seconds: 90 * D, label: '3 months', title: 'Lung Renewal', blurb: 'Lung function and energy are measurably better.' },
  { id: 'g-6m', tier: 'expert', seconds: 180 * D, label: '6 months', title: 'Half-Year Hero', blurb: 'Stress no longer reaches for a cigarette. You have new tools.' },
  { id: 'g-9m', tier: 'expert', seconds: 270 * D, label: '9 months', title: 'Unbreakable', blurb: 'Smoke-free is simply who you are now.' },
  { id: 'g-1y', tier: 'expert', seconds: 365 * D, label: '1 year', title: 'Free Forever', blurb: 'Your heart-disease risk is about half that of a continuing smoker.' },
];

export const LEVEL_GOALS_FR: LevelGoal[] = [
  { id: 'g-1h', tier: 'beginner', seconds: H, label: '1 heure', title: 'Première Heure Gagnée', blurb: 'La décision la plus difficile est la première. Vous l\'avez prise.' },
  { id: 'g-1d', tier: 'beginner', seconds: D, label: '1 jour', title: 'Jour 1 Accompli', blurb: 'Le monoxyde de carbone a quitté votre sang. L\'oxygène est de retour.' },
  { id: 'g-2d', tier: 'beginner', seconds: 2 * D, label: '2 jours', title: 'Série de Deux Jours', blurb: 'Vos terminaisons nerveuses repoussent. Les saveurs et l\'air sentent meilleur.' },
  { id: 'g-4d', tier: 'beginner', seconds: 4 * D, label: '4 jours', title: 'Pic de Nicotine Franchi', blurb: 'La nicotine a totalement quitté votre corps. Ce qui reste est une simple habitude.' },
  { id: 'g-1w', tier: 'beginner', seconds: 7 * D, label: '1 semaine', title: 'Guerrier de la Semaine', blurb: 'Vous avez survécu à la semaine de sevrage la plus intense.' },
  { id: 'g-2w', tier: 'intermediate', seconds: 14 * D, label: '2 semaines', title: 'Combattant des 14 Jours', blurb: 'Votre circulation et votre endurance s\'améliorent nettement.' },
  { id: 'g-3w', tier: 'intermediate', seconds: 21 * D, label: '3 semaines', title: 'Briseur d\'Habitudes', blurb: 'Les envies sont plus courtes et plus faibles. L\'automatisme perd toute force.' },
  { id: 'g-1m', tier: 'intermediate', seconds: 30 * D, label: '1 mois', title: 'Maître du Mois', blurb: 'Vos cils bronchiques fonctionnent à nouveau. Un jalon historique.' },
  { id: 'g-2m', tier: 'intermediate', seconds: 60 * D, label: '2 mois', title: 'Volonté de Fer', blurb: 'La plupart n\'atteignent jamais ce stade. Vous réécrivez votre identité.' },
  { id: 'g-3m', tier: 'expert', seconds: 90 * D, label: '3 mois', title: 'Renouveau Pulmonaire', blurb: 'La fonction pulmonaire et votre niveau d\'énergie sont métamorphosés.' },
  { id: 'g-6m', tier: 'expert', seconds: 180 * D, label: '6 mois', title: 'Héros du Semestre', blurb: 'Face au stress, votre main ne cherche plus la fumée. Vous êtes libre.' },
  { id: 'g-9m', tier: 'expert', seconds: 270 * D, label: '9 mois', title: 'Inébranlable', blurb: 'Vivre sans fumer est simplement devenu qui vous êtes.' },
  { id: 'g-1y', tier: 'expert', seconds: 365 * D, label: '1 an', title: 'Libre pour Toujours', blurb: 'Votre risque cardiaque est réduit de moitié par rapport à un fumeur actif.' },
];

export const TIER_META: Record<LevelTier, { name: string; tagline: string }> = {
  beginner: { name: 'Beginner', tagline: 'Every hour is a win' },
  intermediate: { name: 'Intermediate', tagline: 'Breaking the habit' },
  expert: { name: 'Expert', tagline: 'Mastery & freedom' },
};

export const TIER_META_FR: Record<LevelTier, { name: string; tagline: string }> = {
  beginner: { name: 'Débutant', tagline: 'Chaque heure est une victoire' },
  intermediate: { name: 'Intermédiaire', tagline: 'Briser l\'habitude' },
  expert: { name: 'Expert', tagline: 'Maîtrise & liberté totale' },
};

export function getLevelGoals(lang: Language = 'en'): LevelGoal[] {
  return lang === 'fr' ? LEVEL_GOALS_FR : LEVEL_GOALS;
}

export function getTierMeta(lang: Language = 'en'): Record<LevelTier, { name: string; tagline: string }> {
  return lang === 'fr' ? TIER_META_FR : TIER_META;
}

export interface LevelProgress {
  tier: LevelTier;
  levelNumber: number;
  totalLevels: number;
  completed: LevelGoal[];
  next: LevelGoal | null;
  progressPercent: number;
  remainingSeconds: number;
  rankTitle: string;
  tierStats: Record<LevelTier, { done: number; total: number }>;
}

export function computeLevelProgress(streakSeconds: number, lang: Language = 'en'): LevelProgress {
  const goals = getLevelGoals(lang);
  const completed = goals.filter((g) => g.seconds <= streakSeconds);
  const next = goals.find((g) => g.seconds > streakSeconds) ?? null;
  const prevSeconds = completed.length > 0 ? completed[completed.length - 1].seconds : 0;

  const progressPercent = next
    ? Math.min(100, Math.max(0, ((streakSeconds - prevSeconds) / (next.seconds - prevSeconds)) * 100))
    : 100;

  const tierStats = (['beginner', 'intermediate', 'expert'] as LevelTier[]).reduce((acc, t) => {
    const all = goals.filter((g) => g.tier === t);
    acc[t] = { done: all.filter((g) => g.seconds <= streakSeconds).length, total: all.length };
    return acc;
  }, {} as Record<LevelTier, { done: number; total: number }>);

  return {
    tier: next ? next.tier : 'expert',
    levelNumber: completed.length,
    totalLevels: goals.length,
    completed,
    next,
    progressPercent: Number(progressPercent.toFixed(1)),
    remainingSeconds: next ? next.seconds - streakSeconds : 0,
    rankTitle: completed.length > 0 ? completed[completed.length - 1].title : (lang === 'fr' ? 'Nouveau Départ' : 'Fresh Start'),
    tierStats,
  };
}
