import type {
  UserProfile,
  SavingsGoal,
  CravingEntry,
  SmokeLogEntry,
  ForumPost,
  WellnessArticle,
  Quote,
  PurchaseExpense,
  SubstanceLog,
  SleepEnergyEntry,
  StreakRecord,
} from '../types';

const STORAGE_KEYS = {
  PROFILE: 'puffinless_profile_v2',
  SAVINGS_GOALS: 'puffinless_savings_goals_v2',
  CRAVINGS: 'puffinless_cravings_v2',
  SMOKE_LOG: 'puffinless_smoke_log_v2',
  SUBSTANCE_LOG: 'puffinless_substance_log_v2',
  EXPENSES: 'puffinless_expenses_v2',
  SLEEP_ENERGY: 'puffinless_sleep_energy_v2',
  FORUM_POSTS: 'puffinless_forum_v2',
  STREAKS: 'puffinless_streaks_v2',
};

export function loadStreaks(): StreakRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STREAKS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading streaks', e);
  }
  return [];
}

export function saveStreaks(streaks: StreakRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(streaks));
  } catch (e) {
    console.error('Error saving streaks', e);
  }
}

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  quitDate: new Date().toISOString(),
  cigarettesPerDay: 10,
  pricePerPack: 12.0,
  cigarettesInPack: 20,
  puffsPerDay: 0,
  cannabisGramsPerWeek: 0,
  podPrice: 18,
  pricePerGram: 10,
  currency: '$',
  quitMode: 'cold_turkey',
  gradualDailyTarget: 5,
  motivators: ['My Health & Stamina', 'Financial Freedom', 'Fresh Breath & Skin'],
  isOnboarded: false,
  soundEnabled: true,
  theme: 'dark',
  language: 'en',
  age: 26,
  gender: 'Prefer not to say',
  ethnicity: 'Mixed / Global',
  religion: 'Spiritual / Personal',
  job: '',
  monthlyIncome: 3000,
  primarySubstance: 'cigarette',
  habits: ['cigarette'],
  smokingHabitByDay: {
    cigarettes: 10,
    puffs: 0,
    cannabis: 0,
    yearsSmoking: 3,
    peakTriggers: ['Stress', 'After meal'],
  },
  customCoachGoal: 'Reclaim my lung capacity, save my money to invest, and achieve peak cognitive performance.',
};

export const DEFAULT_PURCHASES: PurchaseExpense[] = [
  {
    id: 'exp-1',
    itemType: 'cigarettes',
    title: 'Marlboro Gold Box (2 packs)',
    price: 25.0,
    quantity: 2,
    timestamp: new Date(Date.now() - 86400000 * 6).toISOString(),
    note: 'Convenience store purchase before quitting',
  },
  {
    id: 'exp-2',
    itemType: 'puff_vape',
    title: 'ElfBar 600 Puffs Watermelon',
    price: 18.0,
    quantity: 1,
    timestamp: new Date(Date.now() - 86400000 * 8).toISOString(),
    note: 'Disposable vape pod',
  },
  {
    id: 'exp-3',
    itemType: 'cannabis',
    title: 'Dispensary Herb (3.5g)',
    price: 45.0,
    quantity: 1,
    timestamp: new Date(Date.now() - 86400000 * 10).toISOString(),
    note: 'Gram package',
  },
  {
    id: 'exp-4',
    itemType: 'rolling_papers',
    title: 'RAW King Size Slim + Filter Tips',
    price: 6.5,
    quantity: 2,
    timestamp: new Date(Date.now() - 86400000 * 12).toISOString(),
    note: 'Smoking accessories',
  },
  {
    id: 'exp-5',
    itemType: 'lighters',
    title: 'Clipper Metal Lighter + Flint',
    price: 7.0,
    quantity: 1,
    timestamp: new Date(Date.now() - 86400000 * 14).toISOString(),
    note: 'Lighter',
  },
];

export const DEFAULT_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    title: 'Apple Watch Ultra',
    targetAmount: 799,
    category: 'tech',
    icon: 'Watch',
    completed: false,
  },
  {
    id: 'goal-2',
    title: 'Luxury Weekend Retreat',
    targetAmount: 450,
    category: 'travel',
    icon: 'Plane',
    completed: false,
  },
  {
    id: 'goal-3',
    title: 'Michelin Star Tasting Menu',
    targetAmount: 180,
    category: 'luxury',
    icon: 'Utensils',
    completed: false,
  },
  {
    id: 'goal-4',
    title: 'Noise-Cancelling AirPods Max',
    targetAmount: 549,
    category: 'tech',
    icon: 'Headphones',
    completed: false,
  },
];

export const DAILY_QUOTES: Quote[] = [
  {
    id: 'q-1',
    quote: 'Every breath you take without smoke or vapor is a direct deposit into your biological and financial future.',
    author: 'Dr. James Clear',
    category: 'Mindset',
  },
  {
    id: 'q-2',
    quote: 'A craving is merely a three-minute neurological storm. You are the deep ocean beneath it.',
    author: 'Neurobiology of Habit',
    category: 'Cravings',
  },
  {
    id: 'q-3',
    quote: 'You did not give up a pleasure; you walked out of a costly biochemical trap.',
    author: 'Allen Carr',
    category: 'Freedom',
  },
  {
    id: 'q-4',
    quote: 'Deep sleep and clear mornings are the ultimate luxury. Smoke only robs you of both.',
    author: 'Matthew Walker, PhD',
    category: 'Vitality',
  },
  {
    id: 'q-5',
    quote: 'Discipline is simply choosing between what you crave now and the sovereign freedom you want most.',
    author: 'Abraham Lincoln',
    category: 'Willpower',
  },
];

export const WELLNESS_ARTICLES: WellnessArticle[] = [
  {
    id: 'art-1',
    title: 'The 3-Minute Peak: Why Cravings Always Subside',
    readTime: '3 min read',
    category: 'Neuroscience',
    summary: 'Nicotine and cannabinoid cravings follow a predictable biological bell curve. Learn why waiting 180 seconds breaks the cycle.',
    imageGradient: 'from-emerald-600/30 to-teal-800/30',
    content: [
      'When your brain senses a drop in synaptic nicotine or THC, the amygdala registers an emergency craving alert. It feels like an unbearable wave that will escalate forever.',
      'Clinical EEG studies demonstrate that craving neurochemistry peaks within 2 to 3 minutes, plateauing before descending back to baseline.',
      'Techniques like Box Breathing and cold water stimulation force your parasympathetic nervous system into activation, collapsing the craving amplitude by up to 70% in seconds.',
    ],
  },
  {
    id: 'art-2',
    title: 'Dopamine Reset: Restoring Natural Joy & Focus',
    readTime: '4 min read',
    category: 'Brain Health',
    summary: 'Substances artificially flood dopamine receptors. Here is how your natural motivation circuitry reboots.',
    imageGradient: 'from-amber-600/30 to-orange-800/30',
    content: [
      'Inhaling nicotine or cannabis sparks a non-physiological surge of dopamine within 10 seconds. In response, your brain down-regulates its native dopamine D2 receptors.',
      'During the first 7 to 14 days, you may experience brief anhedonia (feeling flat). This is not who you are—it is your receptors waking up from chemical numbness.',
      'Sunlight exposure in the morning, high-protein nutrition, brisk walking, and cold showers accelerate dopamine receptor up-regulation, restoring vivid daily focus.',
    ],
  },
  {
    id: 'art-3',
    title: 'Physical Repair: How Your Lungs Cleanse 24/7',
    readTime: '5 min read',
    category: 'Physiology',
    summary: 'From macroscopic carbon clearance to cellular cilia rejuvenation, discover your body’s miraculous repair team.',
    imageGradient: 'from-cyan-600/30 to-blue-800/30',
    content: [
      'Within 72 hours of cessation, the bronchial muscle spasms subside. Alveolar ventilation increases, and heart rate settles into a steady, relaxed rhythm.',
      'By day 14, pulmonary cilia (tiny hair-like filters paralyzed by tobacco and vape chemicals) begin beating synchronously again, sweeping out old tar and cellular debris.',
      'Deep abdominal breathing exercises expand lower lung lobes that were stagnant for years, restoring natural lung compliance and rich cellular oxygen exchange.',
    ],
  },
];

export const DEFAULT_FORUM_POSTS: ForumPost[] = [
  {
    id: 'post-1',
    authorName: 'Marcus Bennett',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    smokeFreeDays: 14,
    timestamp: '2 hours ago',
    tag: 'Milestone',
    title: '2 Full Weeks clean from cigarettes and puffs! Ran 5K this morning 🏃‍♂️',
    content: 'Honestly I thought I was doomed to wake up wheezing forever. Today at the 14-day mark, my lung capacity felt completely different. Cold mornings used to hurt, now I just feel alive. Week 2 is where the magic happens!',
    likes: 42,
    userLiked: false,
    commentsCount: 9,
  },
  {
    id: 'post-2',
    authorName: 'Elena Rostova',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    smokeFreeDays: 3,
    timestamp: '4 hours ago',
    tag: 'SOS Help',
    title: 'Day 3 evening craving hitting hard after dinner...',
    content: 'Just finished dinner and my brain went straight on autopilot reaching for my vape. Did the 4-7-8 breathing circle twice and read the lesson on Delta-FosB. Reminding myself I already saved $28. Anyone online?',
    likes: 29,
    userLiked: true,
    commentsCount: 16,
  },
  {
    id: 'post-3',
    authorName: 'David Chen',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    smokeFreeDays: 45,
    timestamp: '1 day ago',
    tag: 'Wins',
    title: 'Stopped smoking weed & cigs: My REM deep sleep jumped from 4 to 8.5/10! 😴',
    content: 'Used to think weed helped me sleep. In reality, it was destroying my REM stages. After 30 days clean, my mornings are crisp, my mind is razor sharp, and I bought my dream espresso machine with the money saved.',
    likes: 88,
    userLiked: false,
    commentsCount: 23,
  },
];

// Helper functions for persistent storage
export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading profile', e);
  }
  return { ...DEFAULT_PROFILE, quitDate: new Date().toISOString() };
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile', e);
  }
}

export function loadExpenses(): PurchaseExpense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading expenses', e);
  }
  return [];
}

export function saveExpenses(expenses: PurchaseExpense[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  } catch (e) {
    console.error('Error saving expenses', e);
  }
}

export function loadSubstanceLogs(): SubstanceLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSTANCE_LOG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading substance logs', e);
  }
  return [];
}

export function saveSubstanceLogs(logs: SubstanceLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBSTANCE_LOG, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving substance logs', e);
  }
}

export function loadSleepEnergy(): SleepEnergyEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SLEEP_ENERGY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading sleep energy', e);
  }
  return [];
}

export function saveSleepEnergy(entries: SleepEnergyEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SLEEP_ENERGY, JSON.stringify(entries));
  } catch (e) {
    console.error('Error saving sleep energy', e);
  }
}

export function loadSavingsGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading goals', e);
  }
  return DEFAULT_SAVINGS_GOALS;
}

export function saveSavingsGoals(goals: SavingsGoal[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(goals));
  } catch (e) {
    console.error('Error saving goals', e);
  }
}

export function loadCravings(): CravingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRAVINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading cravings', e);
  }
  return [
    {
      id: 'c-1',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      intensity: 7,
      trigger: 'After meal',
      resisted: true,
      substance: 'cigarette',
      note: 'Did 4-7-8 breathing technique',
    },
    {
      id: 'c-2',
      timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
      intensity: 8,
      trigger: 'Work stress',
      resisted: true,
      substance: 'puff_vape',
      note: 'Went for a 5-minute walk outside',
    },
  ];
}

export function saveCravings(cravings: CravingEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRAVINGS, JSON.stringify(cravings));
  } catch (e) {
    console.error('Error saving cravings', e);
  }
}

export function loadSmokeLog(): SmokeLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SMOKE_LOG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading smoke log', e);
  }
  return [];
}

export function saveSmokeLog(logs: SmokeLogEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SMOKE_LOG, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving smoke log', e);
  }
}

export function loadForumPosts(): ForumPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FORUM_POSTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading forum posts', e);
  }
  return DEFAULT_FORUM_POSTS;
}

export function saveForumPosts(posts: ForumPost[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FORUM_POSTS, JSON.stringify(posts));
  } catch (e) {
    console.error('Error saving forum posts', e);
  }
}
