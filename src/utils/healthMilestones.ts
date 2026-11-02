import type { HealthMilestone, Badge, Language } from '../types';
import { HEALTH_MILESTONES_FR, BADGES_FR } from '../content/frenchTranslations';

export const HEALTH_MILESTONES: HealthMilestone[] = [
  {
    id: 'hm-20m',
    timeSeconds: 20 * 60, // 20 minutes
    label: '20 Minutes',
    title: 'Pulse & Blood Pressure Normalize',
    description: 'Heart rate and vascular tension drop back to baseline levels. Peripheral circulation starts warming up.',
    organ: 'heart',
  },
  {
    id: 'hm-8h',
    timeSeconds: 8 * 3600, // 8 hours
    label: '8 Hours',
    title: 'Carbon Monoxide Clears by 50%',
    description: 'Blood oxygen saturation climbs to normal ranges. Cellular oxygenation accelerates dramatically.',
    organ: 'blood',
  },
  {
    id: 'hm-24h',
    timeSeconds: 24 * 3600, // 24 hours
    label: '24 Hours',
    title: 'Cardiac Infarction Risk Drops',
    description: 'Lungs begin expelling accumulated mucus and smoking debris. Heart attack risk begins its downward curve.',
    organ: 'heart',
  },
  {
    id: 'hm-48h',
    timeSeconds: 48 * 3600, // 48 hours
    label: '48 Hours',
    title: 'Nerve Endings & Taste Regrowth',
    description: 'Nicotine is almost entirely metabolized. Olfactory and gustatory nerve endings regenerate; food tastes richer.',
    organ: 'senses',
  },
  {
    id: 'hm-72h',
    timeSeconds: 72 * 3600, // 72 hours
    label: '72 Hours',
    title: 'Bronchial Relaxation & Peak Energy',
    description: 'Bronchial tubes relax, increasing lung volume. Breathing feels noticeably effortless and full.',
    organ: 'lungs',
  },
  {
    id: 'hm-2w',
    timeSeconds: 14 * 86400, // 2 weeks
    label: '2 Weeks',
    title: 'Circulation & Stamina Rejuvenation',
    description: 'Blood flow to limbs improves substantially. Physical endurance and walking without shortness of breath surge.',
    organ: 'heart',
  },
  {
    id: 'hm-1m',
    timeSeconds: 30 * 86400, // 1 month
    label: '1 Month',
    title: 'Cilia Regeneration & Immunity Spike',
    description: 'Microscopic cilia in airways reactivate, clearing mucus naturally and slashing respiratory infection risks.',
    organ: 'lungs',
  },
  {
    id: 'hm-3m',
    timeSeconds: 90 * 86400, // 3 months
    label: '3 Months',
    title: 'Lung Capacity Boost (+10%)',
    description: 'Overall lung capacity improves by up to 10%. Chronic coughing, sinus congestion, and fatigue fade away.',
    organ: 'lungs',
  },
  {
    id: 'hm-1y',
    timeSeconds: 365 * 86400, // 1 year
    label: '1 Year',
    title: 'Coronary Disease Risk Halved',
    description: 'Excess risk of coronary heart disease drops to 50% that of a continuing smoker. A monumental health triumph!',
    organ: 'heart',
  },
];

export const ALL_BADGES: Badge[] = [
  {
    id: 'badge-first-step',
    title: 'First Step',
    description: 'Decided to quit and completed onboarding',
    icon: 'Sparkles',
    tier: 'bronze',
    conditionType: 'hours',
    conditionValue: 0.1,
  },
  {
    id: 'badge-day-one',
    title: '24 Hours Clear',
    description: 'Completed your first full smoke-free day',
    icon: 'Sun',
    tier: 'bronze',
    conditionType: 'hours',
    conditionValue: 24,
  },
  {
    id: 'badge-3days',
    title: 'The 72-Hour Summit',
    description: 'Conquered the hardest physical nicotine hurdle',
    icon: 'Mountain',
    tier: 'silver',
    conditionType: 'days',
    conditionValue: 3,
  },
  {
    id: 'badge-1week',
    title: 'Clean Week',
    description: '7 consecutive days breathing clean air',
    icon: 'ShieldCheck',
    tier: 'silver',
    conditionType: 'days',
    conditionValue: 7,
  },
  {
    id: 'badge-1month',
    title: 'Diamond Lung',
    description: '30 days smoke-free milestone achieved',
    icon: 'Award',
    tier: 'gold',
    conditionType: 'days',
    conditionValue: 30,
  },
  {
    id: 'badge-save-50',
    title: 'Wallet Guard',
    description: 'Saved your first $50 from unbought packs',
    icon: 'PiggyBank',
    tier: 'bronze',
    conditionType: 'money',
    conditionValue: 50,
  },
  {
    id: 'badge-save-250',
    title: 'Wealth Builder',
    description: 'Kept $250+ in your bank instead of smoke',
    icon: 'Coins',
    tier: 'silver',
    conditionType: 'money',
    conditionValue: 250,
  },
  {
    id: 'badge-save-1000',
    title: 'Grand Investor',
    description: 'Saved over $1,000 to invest in your dreams',
    icon: 'Gem',
    tier: 'platinum',
    conditionType: 'money',
    conditionValue: 1000,
  },
  {
    id: 'badge-cigs-100',
    title: 'Centurion',
    description: 'Avoided smoking over 100 cigarettes',
    icon: 'FlameOff',
    tier: 'silver',
    conditionType: 'cigsAvoided',
    conditionValue: 100,
  },
  {
    id: 'badge-cravings-5',
    title: 'Craving Master',
    description: 'Used breathing and resisted 5 acute cravings',
    icon: 'HeartHandshake',
    tier: 'gold',
    conditionType: 'cravingsResisted',
    conditionValue: 5,
  },
];

export function getHealthMilestones(lang: Language = 'en'): HealthMilestone[] {
  return lang === 'fr' ? HEALTH_MILESTONES_FR : HEALTH_MILESTONES;
}

export function getBadges(lang: Language = 'en'): Badge[] {
  return lang === 'fr' ? BADGES_FR : ALL_BADGES;
}
