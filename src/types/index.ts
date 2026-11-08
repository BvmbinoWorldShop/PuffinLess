export type QuitMode = 'cold_turkey' | 'gradual';
export type AppTheme = 'dark' | 'light';
export type Language = 'en' | 'fr';
export type QuitGoal = 'want_to_quit' | 'already_quit' | 'just_tracking';

export type SubstanceType = 'cigarette' | 'puff_vape' | 'cannabis';

export interface SubstanceLog {
  id: string;
  substance: SubstanceType;
  count: number; // e.g. 1 cigarette, 10 puffs, 1 joint/gram
  timestamp: string;
  trigger?: string; // motivation: Stress, Habit, After meal, etc.
  note?: string;
}

/** A finished smoke-free streak, closed when the user logs a cigarette, puff or joint. */
export interface StreakRecord {
  id: string;
  start: string;
  end: string;
  brokenBy: SubstanceType;
}

export type ExpenseItemType = 
  | 'cigarettes'
  | 'puff_vape'
  | 'cannabis'
  | 'rolling_papers'
  | 'lighters'
  | 'accessories';

export interface PurchaseExpense {
  id: string;
  itemType: ExpenseItemType;
  title: string;
  price: number; // per item or total
  quantity: number;
  timestamp: string;
  note?: string;
}

export interface SleepEnergyEntry {
  id: string;
  date: string; // YYYY-MM-DD
  sleepRating: number; // 1 to 10
  energyRating: number; // 1 to 10
  substancesLogged: {
    cigarette: number;
    puff_vape: number;
    cannabis: number;
  };
  notes?: string;
}

export interface PsychologyLesson {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  category:
    | 'Biology of Craving'
    | 'Habit Rewiring'
    | 'Identity & Mindset'
    | 'Dopamine & Brain'
    | 'Relapse Recovery'
    | 'Substance Guides';
  iconName: string;
  summary: string;
  keyInsights: string[];
  biologicalDeepDive: string[];
  actionableMicroSteps: string[];
}

export interface UserProfile {
  name: string;
  avatar: string;
  quitDate: string; // ISO date string
  createdAt?: string; // ISO timestamp of when user first used/onboarded the app
  customQuitDate?: boolean; // Whether user entered an explicit custom quit date
  updatedAt?: string;
  cigarettesPerDay: number;
  pricePerPack: number;
  cigarettesInPack: number;
  puffsPerDay: number;
  cannabisGramsPerWeek: number;
  podPrice: number; // price of one ~600 puff vape
  pricePerGram: number; // price of one gram of cannabis
  currency: string;
  quitMode: QuitMode;
  gradualDailyTarget: number;
  motivators: string[];
  isOnboarded: boolean;
  soundEnabled: boolean;
  theme: AppTheme;
  language: Language;
  quitGoal?: QuitGoal;

  // Personalized Life & Coach Context
  age?: number;
  gender?: string;
  ethnicity?: string;
  religion?: string;
  job?: string;
  monthlyIncome?: number;
  primarySubstance?: SubstanceType;
  habits?: SubstanceType[];
  smokingHabitByDay?: {
    cigarettes?: number;
    puffs?: number;
    cannabis?: number;
    yearsSmoking?: number;
    peakTriggers?: string[];
  };
  customCoachGoal?: string;
}

export interface CravingEntry {
  id: string;
  timestamp: string;
  intensity: number; // 1 to 10
  trigger: string;
  resisted: boolean;
  substance?: SubstanceType;
  note?: string;
}

export interface SmokeLogEntry {
  id: string;
  timestamp: string;
  count: number;
  note?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  category: 'travel' | 'tech' | 'luxury' | 'wellness' | 'family';
  icon: string;
  completed: boolean;
}

export interface HealthMilestone {
  id: string;
  timeSeconds: number;
  label: string;
  title: string;
  description: string;
  organ: 'heart' | 'lungs' | 'blood' | 'brain' | 'senses' | 'overall';
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  conditionType: 'hours' | 'days' | 'money' | 'cigsAvoided' | 'cravingsResisted';
  conditionValue: number;
}

export interface WellnessArticle {
  id: string;
  title: string;
  readTime: string;
  category: string;
  summary: string;
  content: string[];
  imageGradient: string;
}

export interface Quote {
  id: string;
  quote: string;
  author: string;
  category: string;
  book?: string;
}
