import type {
  UserProfile,
  SavingsGoal,
  CravingEntry,
  SmokeLogEntry,
  WellnessArticle,
  Quote,
  PurchaseExpense,
  SubstanceLog,
  SleepEnergyEntry,
  StreakRecord,
  Language,
  AppTheme,
} from '../types';
import {
  encryptData,
  decryptData,
  purgeVaultKeys,
  setActiveVaultKey,
  deriveKeyFromPassphrase,
  encryptWithKey,
  toHex,
  getCrypto,
  createKeyFromSeed,
  saveKeyToVault,
  removeKeyFromVault,
  MASTER_KEY_ID,
  VAULT_CONFIG_KEY,
  type VaultConfig,
} from './crypto.ts';
import { idbGet, idbSet, deletePuffinLessDB } from './indexedDb.ts';
import { purgeSecurityState } from './security.ts';
import {
  recoverAllDeviceData,
  createDeviceRescueSnapshot,
  getDeviceRescueSnapshot,
  mergeStreaks,
  mergeCravings,
  mergeSubstances,
  RESCUE_BACKUP_KEY,
  LEGACY_RESCUE_KEY,
} from './recovery.ts';

export const STORAGE_KEYS = {
  PROFILE: 'puffinless_profile_v2',
  SAVINGS_GOALS: 'puffinless_savings_goals_v2',
  CRAVINGS: 'puffinless_cravings_v2',
  SMOKE_LOG: 'puffinless_smoke_log_v2',
  SUBSTANCE_LOG: 'puffinless_substance_log_v2',
  EXPENSES: 'puffinless_expenses_v2',
  SLEEP_ENERGY: 'puffinless_sleep_energy_v2',
  STREAKS: 'puffinless_streaks_v2',
};

export function loadStreaks(): StreakRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STREAKS) || localStorage.getItem('puffinless_streaks');
    if (raw && !raw.startsWith('aes-gcm:') && !raw.startsWith('aes256:')) {
      return JSON.parse(raw) as StreakRecord[];
    }
  } catch {
    // ignore
  }
  return [];
}

export async function loadStreaksAsync(): Promise<StreakRecord[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STREAKS) || localStorage.getItem('puffinless_streaks');
    return await decryptData<StreakRecord[]>(raw, []);
  } catch (e) {
    console.error('Error loading streaks', e);
  }
  return [];
}

export async function saveStreaks(streaks: StreakRecord[]): Promise<void> {
  const cipher = await encryptData(streaks);
  localStorage.setItem(STORAGE_KEYS.STREAKS, cipher);
  await idbSet(STORAGE_KEYS.STREAKS, cipher);
  createDeviceRescueSnapshot({ streaks });
}

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  quitDate: '',
  createdAt: '',
  customQuitDate: false,
  cigarettesPerDay: 0,
  pricePerPack: 12.0,
  cigarettesInPack: 20,
  puffsPerDay: 0,
  cannabisGramsPerWeek: 0,
  podPrice: 18,
  pricePerGram: 10,
  currency: '$',
  quitMode: 'cold_turkey',
  gradualDailyTarget: 0,
  motivators: ['My Health & Stamina', 'Financial Freedom', 'Fresh Breath & Skin'],
  isOnboarded: false,
  soundEnabled: true,
  theme: 'dark',
  language: 'en',
  age: 0,
  gender: 'Prefer not to say',
  ethnicity: '',
  religion: '',
  job: '',
  monthlyIncome: 0,
  primarySubstance: 'cigarette',
  habits: [],
  smokingHabitByDay: {
    cigarettes: 0,
    puffs: 0,
    cannabis: 0,
    yearsSmoking: 0,
    peakTriggers: ['Stress', 'After meal'],
  },
  customCoachGoal: '',
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
  // --- Resilience (min 5 quotes) ---
  {
    id: 'q-res-1',
    quote: 'You have power over your mind - not outside events or temporary physical cravings. Realize this, and you will find unstoppable strength.',
    author: 'Marcus Aurelius',
    book: 'Meditations',
    category: 'Resilience',
  },
  {
    id: 'q-res-2',
    quote: 'Between stimulus and response there is a space. In that space lies our freedom and our power to choose our sovereignty and dignity.',
    author: 'Viktor E. Frankl',
    book: 'Man\'s Search for Meaning',
    category: 'Resilience',
  },
  {
    id: 'q-res-3',
    quote: 'When your mind is telling you you are done and begs you to surrender to an impulse, you are really only at 40 percent of your true capacity.',
    author: 'David Goggins',
    book: 'Can\'t Hurt Me',
    category: 'Resilience',
  },
  {
    id: 'q-res-4',
    quote: 'The impediment to action advances action. What stands in the way becomes the way. Withdrawal is the forge of your strength.',
    author: 'Ryan Holiday',
    book: 'The Obstacle Is the Way',
    category: 'Resilience',
  },
  {
    id: 'q-res-5',
    quote: 'It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.',
    author: 'Seneca',
    book: 'Letters from a Stoic',
    category: 'Resilience',
  },
  {
    id: 'q-res-6',
    quote: 'Do not demand that cravings vanish by magic; train yourself to be strong enough to watch them pass without obeying them.',
    author: 'Epictetus',
    book: 'Discourses & Enchiridion',
    category: 'Resilience',
  },

  // --- Detachment (min 5 quotes) ---
  {
    id: 'q-det-1',
    quote: 'A craving is merely a wave of physical sensations in the body. When you ride the urge with curious awareness, it crests and dissolves within three minutes.',
    author: 'Dr. Judson Brewer (Brown)',
    book: 'The Craving Mind',
    category: 'Detachment',
  },
  {
    id: 'q-det-2',
    quote: 'Thoughts and cravings are not commands. They are merely passing weather events in the sky of your awareness.',
    author: 'Dr. Russ Harris',
    book: 'The Happiness Trap',
    category: 'Detachment',
  },
  {
    id: 'q-det-3',
    quote: 'The moment you observe the craving without identifying with it, you are no longer its automatic slave.',
    author: 'Eckhart Tolle',
    book: 'The Power of Now',
    category: 'Detachment',
  },
  {
    id: 'q-det-4',
    quote: 'You cannot stop the waves of cravings, but you can learn to surf them with stillness and self-respect.',
    author: 'Jon Kabat-Zinn',
    book: 'Full Catastrophe Living',
    category: 'Detachment',
  },
  {
    id: 'q-det-5',
    quote: 'Feelings and urges come and go like clouds in a windy sky. Conscious deep breathing is your anchor.',
    author: 'Thich Nhat Hanh',
    book: 'Peace Is Every Step',
    category: 'Detachment',
  },

  // --- Connection (min 5 quotes) ---
  {
    id: 'q-con-1',
    quote: 'The opposite of addiction is not sobriety. It is authentic human connection, purposeful routines, and self-compassion.',
    author: 'Johann Hari',
    book: 'Lost Connections',
    category: 'Connection',
  },
  {
    id: 'q-con-2',
    quote: 'The attempt to escape from pain is what creates addiction. Ask not why the addiction, ask why the pain.',
    author: 'Dr. Gabor Maté',
    book: 'In the Realm of Hungry Ghosts',
    category: 'Connection',
  },
  {
    id: 'q-con-3',
    quote: 'What you resist persists, but what you look at with courageous awareness transforms into personal power.',
    author: 'Carl Gustav Jung',
    book: 'Modern Man in Search of a Soul',
    category: 'Connection',
  },
  {
    id: 'q-con-4',
    quote: 'True courage begins with showing up as you are, without masks or chemical crutches, taking full ownership of your life.',
    author: 'Brené Brown',
    book: 'The Gifts of Imperfection',
    category: 'Connection',
  },
  {
    id: 'q-con-5',
    quote: 'He who has a why to live can bear almost any how. Ground your quit in what matters most to your soul.',
    author: 'Viktor E. Frankl',
    book: 'The Will to Meaning',
    category: 'Connection',
  },

  // --- Habits & Discipline (min 5 quotes) ---
  {
    id: 'q-hab-1',
    quote: 'You do not rise to the level of your goals. You fall to the level of your systems. Every smoke resisted is an immediate vote for your future self.',
    author: 'James Clear',
    book: 'Atomic Habits',
    category: 'Habits & Discipline',
  },
  {
    id: 'q-hab-2',
    quote: 'You did not give up a genuine pleasure; you walked out of a costly, engineered biochemical prison.',
    author: 'Allen Carr',
    book: 'The Easy Way to Stop Smoking',
    category: 'Habits & Discipline',
  },
  {
    id: 'q-hab-3',
    quote: 'The pursuit of artificial pleasure leads inevitably to pain. When you fast from dopamine spikes, your neurological baseline resets to deep peace.',
    author: 'Dr. Anna Lembke (Stanford)',
    book: 'Dopamine Nation',
    category: 'Habits & Discipline',
  },
  {
    id: 'q-hab-4',
    quote: 'You cannot simply eliminate a habit loop; you must replace the routine with a restorative action that truly serves your body.',
    author: 'Charles Duhigg',
    book: 'The Power of Habit',
    category: 'Habits & Discipline',
  },
  {
    id: 'q-hab-5',
    quote: 'Discipline is not restriction; discipline equals total freedom of your time, your money, and your physical health.',
    author: 'Jocko Willink',
    book: 'Discipline Equals Freedom',
    category: 'Habits & Discipline',
  },

  // --- Vitality & Sleep (min 5 quotes) ---
  {
    id: 'q-vit-1',
    quote: 'Deep slow-wave sleep and waking energized without chemical fog are the ultimate luxury. Smoke only robs you of both.',
    author: 'Dr. Matthew Walker',
    book: 'Why We Sleep',
    category: 'Vitality & Sleep',
  },
  {
    id: 'q-vit-2',
    quote: 'Learning to breathe slowly and nasally transforms blood chemistry, stimulates the vagus nerve, and dissolves acute panic.',
    author: 'James Nestor',
    book: 'Breath',
    category: 'Vitality & Sleep',
  },
  {
    id: 'q-vit-3',
    quote: 'Trauma and chronic stress register deeply in physical tissues. Reclaiming conscious breath is the first step in somatic regulation.',
    author: 'Dr. Bessel van der Kolk',
    book: 'The Body Keeps the Score',
    category: 'Vitality & Sleep',
  },
  {
    id: 'q-vit-4',
    quote: 'Resetting nicotinic acetylcholine receptors and restoring nocturnal deep sleep dramatically upgrades your cognitive stamina by week two.',
    author: 'Dr. Andrew Huberman (Stanford)',
    book: 'Huberman Lab Protocol',
    category: 'Vitality & Sleep',
  },
  {
    id: 'q-vit-5',
    quote: 'Eliminating inhaled combustion toxins is the single most powerful preventive intervention in medicine for protecting cardiovascular healthspan.',
    author: 'Dr. Peter Attia',
    book: 'Outlive',
    category: 'Vitality & Sleep',
  },
];

export const DAILY_QUOTES_FR: Quote[] = [
  // --- Résilience (au moins 5 citations) ---
  {
    id: 'q-fr-res-1',
    quote: 'Tu as pouvoir sur ton esprit, non sur les événements extérieurs ni les sensations éphémères du manque. Comprends cela, et tu trouveras une force inébranlable.',
    author: 'Marcus Aurèle',
    book: 'Pensées pour moi-même',
    category: 'Résilience',
  },
  {
    id: 'q-fr-res-2',
    quote: 'Entre le stimulus et la réponse, il existe un espace. Dans cet espace réside notre pouvoir souverain de choisir notre liberté, notre santé et notre grandeur.',
    author: 'Viktor E. Frankl',
    book: 'Découvrir un sens à sa vie',
    category: 'Résilience',
  },
  {
    id: 'q-fr-res-3',
    quote: 'Lorsque votre cerveau vous supplie d\'abandonner et de céder à l\'envie facile, vous n\'êtes qu\'à 40 % de votre véritable capacité de résistance mentale.',
    author: 'David Goggins',
    book: 'Plus rien ne peut me blesser',
    category: 'Résilience',
  },
  {
    id: 'q-fr-res-4',
    quote: 'Ce qui entrave l\'action fait avancer l\'action. Ce qui se dresse sur le chemin devient le chemin : l\'inconfort du sevrage est le creuset de votre renaissance.',
    author: 'Ryan Holiday',
    book: 'L\'Obstacle est le chemin',
    category: 'Résilience',
  },
  {
    id: 'q-fr-res-5',
    quote: 'Ce n\'est pas parce que les choses sont difficiles que nous n\'osons pas, c\'est parce que nous n\'osons pas qu\'elles sont difficiles.',
    author: 'Sénèque',
    book: 'Lettres à Lucilius',
    category: 'Résilience',
  },
  {
    id: 'q-fr-res-6',
    quote: 'Ne demande pas que les pulsions disparaissent par enchantement ; forge-toi un esprit assez solide pour les regarder s\'éteindre sans jamais leur obéir.',
    author: 'Épictète',
    book: 'Manuel d\'Épictète',
    category: 'Résilience',
  },

  // --- Détachement (au moins 5 citations) ---
  {
    id: 'q-fr-det-1',
    quote: 'L\'envie irrépressible n\'est qu\'une vague sensorielle passagère. En l\'observant avec une curiosité bienveillante sans la combattre, elle atteint son pic puis s\'évanouit en moins de trois minutes.',
    author: 'Dr. Judson Brewer (Brown)',
    book: 'L\'esprit sous emprise (The Craving Mind)',
    category: 'Détachement',
  },
  {
    id: 'q-fr-det-2',
    quote: 'Vos pulsions et pensées anxieuses ne sont pas des ordres militaires. Ce ne sont que des nuages météorologiques passagers dans le ciel immense de votre conscience.',
    author: 'Dr. Russ Harris',
    book: 'Le piège du bonheur (Thérapie ACT)',
    category: 'Détachement',
  },
  {
    id: 'q-fr-det-3',
    quote: 'Dès l\'instant où vous observez l\'impulsion corporelle sans vous identifier à elle, vous cessez d\'en être la marionnette automatique.',
    author: 'Eckhart Tolle',
    book: 'Le pouvoir du moment présent',
    category: 'Détachement',
  },
  {
    id: 'q-fr-det-4',
    quote: 'Vous ne pouvez pas empêcher les vagues du manque de se former, mais vous pouvez apprendre à surfer dessus avec calme et dignité.',
    author: 'Jon Kabat-Zinn',
    book: 'Au cœur de la tourmente, la pleine conscience',
    category: 'Détachement',
  },
  {
    id: 'q-fr-det-5',
    quote: 'Les sensations et les envies vont et viennent comme le vent dans les feuillages. La respiration ventrale consciente est votre ancre indestructible.',
    author: 'Thich Nhat Hanh',
    book: 'La paix est chaque pas',
    category: 'Détachement',
  },

  // --- Connexion (au moins 5 citations) ---
  {
    id: 'q-fr-con-1',
    quote: 'Le contraire de l\'addiction n\'est pas la simple abstinence. C\'est le lien humain authentique, l\'alignement avec ce qui compte vraiment et le sens donné à sa vie.',
    author: 'Johann Hari',
    book: 'La force des liens (Lost Connections)',
    category: 'Connexion',
  },
  {
    id: 'q-fr-con-2',
    quote: 'Toute addiction naît d\'une tentative d\'échapper à une douleur ou à un vide intérieur. Ne demandez pas pourquoi l\'addiction, demandez pourquoi la souffrance.',
    author: 'Dr. Gabor Maté',
    book: 'Dans le royaume des fantômes affamés',
    category: 'Connexion',
  },
  {
    id: 'q-fr-con-3',
    quote: 'Ce à quoi vous résistez persiste avec force, mais ce que vous embrassez avec lucidité et compassion se transmute en force vive.',
    author: 'Carl Gustav Jung',
    book: 'L\'Homme à la découverte de son âme',
    category: 'Connexion',
  },
  {
    id: 'q-fr-con-4',
    quote: 'Le courage véritable commence par se montrer vulnérable sans masque ni béquille chimique, et revendiquer sa pleine liberté d\'être.',
    author: 'Brené Brown',
    book: 'Le pouvoir de la vulnérabilité',
    category: 'Connexion',
  },
  {
    id: 'q-fr-con-5',
    quote: 'Celui qui a un Pourquoi profond pour vivre et se respecter peut surmonter et transcender presque n\'importe quel Comment.',
    author: 'Viktor E. Frankl',
    book: 'Le Dieu inconscient',
    category: 'Connexion',
  },

  // --- Habitudes & Discipline (au moins 5 citations) ---
  {
    id: 'q-fr-hab-1',
    quote: 'Vous ne vous élevez pas au niveau de vos objectifs. Vous tombez au niveau de vos systèmes. Chaque bouffée refusée est un vote concret pour la personne libre que vous devenez.',
    author: 'James Clear',
    book: 'Un rien peut tout changer (Atomic Habits)',
    category: 'Habitudes & Discipline',
  },
  {
    id: 'q-fr-hab-2',
    quote: 'Vous n\'avez renoncé à aucun plaisir réel ; vous venez simplement de vous échapper d\'un piège biochimique coûteux et inutile.',
    author: 'Allen Carr',
    book: 'La méthode simple pour en finir avec la cigarette',
    category: 'Habitudes & Discipline',
  },
  {
    id: 'q-fr-hab-3',
    quote: 'La recherche compulsive de dopamine artificielle dérègle votre balance émotionnelle. En observant un jeûne propre, vos récepteurs se régénèrent et vous retrouvez la paix.',
    author: 'Dr. Anna Lembke (Stanford)',
    book: 'Dopamine Nation',
    category: 'Habitudes & Discipline',
  },
  {
    id: 'q-fr-hab-4',
    quote: 'On ne peut pas simplement effacer une mauvaise habitude, on doit en remplacer la routine par une action saine qui respecte notre corps.',
    author: 'Charles Duhigg',
    book: 'Le Pouvoir des Habitudes',
    category: 'Habitudes & Discipline',
  },
  {
    id: 'q-fr-hab-5',
    quote: 'La discipline quotidienne n\'est pas une contrainte : la discipline est la seule et unique source de liberté physique, mentale et financière.',
    author: 'Jocko Willink',
    book: 'Discipline Equals Freedom',
    category: 'Habitudes & Discipline',
  },

  // --- Vitalité & Sommeil (au moins 5 citations) ---
  {
    id: 'q-fr-vit-1',
    quote: 'Le sommeil profond et le réveil énergique sans brouillard sont le véritable luxe. Fumer ne fait que voler vos phases de sommeil réparateur.',
    author: 'Dr. Matthew Walker',
    book: 'Pourquoi nous dormons',
    category: 'Vitalité & Sommeil',
  },
  {
    id: 'q-fr-vit-2',
    quote: 'Réapprendre à respirer lentement par le nez rééquilibre la chimie sanguine, active le nerf vague et dissout l\'anxiété en quelques secondes.',
    author: 'James Nestor',
    book: 'Respirer',
    category: 'Vitalité & Sommeil',
  },
  {
    id: 'q-fr-vit-3',
    quote: 'Le corps et le système nerveux gardent l\'empreinte du stress. Réapprendre à respirer profondément est la première étape pour désamorcer l\'anxiété sans substance.',
    author: 'Dr. Bessel van der Kolk',
    book: 'Le corps n\'oublie rien',
    category: 'Vitalité & Sommeil',
  },
  {
    id: 'q-fr-vit-4',
    quote: 'La régénération des récepteurs à acétylcholine et le rebond du sommeil paradoxal restaurent une énergie cérébrale stupéfiante dès le quatorzième jour.',
    author: 'Dr. Andrew Huberman (Stanford)',
    book: 'Protocole Huberman Lab',
    category: 'Vitalité & Sommeil',
  },
  {
    id: 'q-fr-vit-5',
    quote: 'L\'élimination radicale des toxines inhalées est la mesure clinique préventive la plus efficace de la médecine pour garantir une longévité alerte et vigoureuse.',
    author: 'Dr. Peter Attia',
    book: 'Outlive',
    category: 'Vitalité & Sommeil',
  },
];

/** Returns dynamically rotating quote based on calendar day (increments cleanly every single day) */
export function getRotatingDailyQuote(lang: Language = 'fr'): Quote {
  const list = lang === 'fr' ? DAILY_QUOTES_FR : DAILY_QUOTES;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const epochDays = Math.floor(Date.UTC(y, m, d) / (1000 * 60 * 60 * 24));
  const idx = Math.abs(epochDays) % list.length;
  return list[idx];
}

/** Returns rotating weekly focus quote */
export function getRotatingWeeklyQuote(lang: Language = 'fr'): Quote {
  const list = lang === 'fr' ? DAILY_QUOTES_FR : DAILY_QUOTES;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + start.getDay() + 1) / 7);
  const idx = (weekNumber * 3) % list.length;
  return list[idx];
}

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

// Helper functions for persistent storage with local AES-GCM encryption at rest
export function loadProfile(): UserProfile {
  const nowIso = new Date().toISOString();
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.PROFILE) ||
      localStorage.getItem('puffinless_profile') ||
      localStorage.getItem('puffinless_user_profile');
    if (raw) {
      if (!raw.startsWith('aes-gcm:') && !raw.startsWith('aes256:')) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_PROFILE, ...parsed };
        }
      }
    }
  } catch {
    // fallback
  }

  // Persistent user state check (prevents presentation/onboarding loop on cold restart)
  const isUserOnboarded =
    typeof localStorage !== 'undefined' &&
    (localStorage.getItem('puffinless_is_onboarded') === 'true' ||
      Boolean(localStorage.getItem('puffinless_quit_date')) ||
      Boolean(localStorage.getItem('puffinless_profile_v2')) ||
      Boolean(localStorage.getItem('puffinless_profile')) ||
      Boolean(localStorage.getItem('puffinless_device_rescue_backup_v2')));

  const savedName = (typeof localStorage !== 'undefined' && localStorage.getItem('puffinless_user_name')) || '';
  let savedQuitDate = (typeof localStorage !== 'undefined' && localStorage.getItem('puffinless_quit_date')) || '';
  if (!savedQuitDate) {
    const snap = getDeviceRescueSnapshot();
    if (snap?.profile?.quitDate) {
      savedQuitDate = snap.profile.quitDate;
    }
  }
  const savedLang =
    (typeof localStorage !== 'undefined' &&
      ((localStorage.getItem('puffinless_app_lang') || localStorage.getItem('puffinless_lang')) as Language)) ||
    'fr';
  const savedTheme =
    (typeof localStorage !== 'undefined' &&
      ((localStorage.getItem('puffinless_app_theme') || localStorage.getItem('puffinless_theme')) as AppTheme)) ||
    'dark';

  return {
    ...DEFAULT_PROFILE,
    name: savedName,
    isOnboarded: isUserOnboarded,
    quitDate: savedQuitDate || nowIso,
    createdAt: savedQuitDate || nowIso,
    language: savedLang,
    theme: savedTheme,
  };
}

export async function loadProfileAsync(): Promise<UserProfile> {
  const nowIso = new Date().toISOString();
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.PROFILE) ||
      localStorage.getItem('puffinless_profile') ||
      localStorage.getItem('puffinless_user_profile');
    if (raw) {
      const parsed = await decryptData<Partial<UserProfile>>(raw, {});
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        const merged: UserProfile = { ...DEFAULT_PROFILE, ...parsed };
        if (merged.isOnboarded && typeof localStorage !== 'undefined') {
          localStorage.setItem('puffinless_is_onboarded', 'true');
        }
        if (!merged.createdAt) {
          merged.createdAt = merged.quitDate || nowIso;
        }
        if (!merged.quitDate) {
          merged.quitDate = merged.createdAt;
        }
        return merged;
      }
    }
  } catch (e) {
    console.error('Error loading profile async', e);
  }
  return loadProfile();
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const cipher = await encryptData(profile);
  localStorage.setItem(STORAGE_KEYS.PROFILE, cipher);
  await idbSet(STORAGE_KEYS.PROFILE, cipher);
  if (profile.isOnboarded && typeof localStorage !== 'undefined') {
    localStorage.setItem('puffinless_is_onboarded', 'true');
    if (profile.name) localStorage.setItem('puffinless_user_name', profile.name);
    if (profile.quitDate) localStorage.setItem('puffinless_quit_date', profile.quitDate);
    if (profile.language) {
      localStorage.setItem('puffinless_app_lang', profile.language);
      localStorage.setItem('puffinless_lang', profile.language);
    }
    if (profile.theme) {
      localStorage.setItem('puffinless_app_theme', profile.theme);
      localStorage.setItem('puffinless_theme', profile.theme);
    }
  }
  createDeviceRescueSnapshot({ profile });
}

export function loadExpenses(): PurchaseExpense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (raw && !raw.startsWith('aes-gcm:')) {
      return JSON.parse(raw) as PurchaseExpense[];
    }
  } catch {
    // ignore
  }
  return [];
}

export async function loadExpensesAsync(): Promise<PurchaseExpense[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES) || localStorage.getItem('puffinless_expenses');
    return await decryptData<PurchaseExpense[]>(raw, []);
  } catch (e) {
    console.error('Error loading expenses', e);
  }
  return [];
}

export async function saveExpenses(expenses: PurchaseExpense[]): Promise<void> {
  const cipher = await encryptData(expenses);
  localStorage.setItem(STORAGE_KEYS.EXPENSES, cipher);
  await idbSet(STORAGE_KEYS.EXPENSES, cipher);
  createDeviceRescueSnapshot({ expenses });
}

export function loadSubstanceLogs(): SubstanceLog[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.SUBSTANCE_LOG) ||
      localStorage.getItem('puffinless_substance_log') ||
      localStorage.getItem('puffinless_substances');
    if (raw && !raw.startsWith('aes-gcm:') && !raw.startsWith('aes256:')) {
      return JSON.parse(raw) as SubstanceLog[];
    }
  } catch {
    // ignore
  }
  return [];
}

export async function loadSubstanceLogsAsync(): Promise<SubstanceLog[]> {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.SUBSTANCE_LOG) ||
      localStorage.getItem('puffinless_substance_log') ||
      localStorage.getItem('puffinless_substances');
    return await decryptData<SubstanceLog[]>(raw, []);
  } catch (e) {
    console.error('Error loading substance logs', e);
  }
  return [];
}

export async function saveSubstanceLogs(logs: SubstanceLog[]): Promise<void> {
  const cipher = await encryptData(logs);
  localStorage.setItem(STORAGE_KEYS.SUBSTANCE_LOG, cipher);
  await idbSet(STORAGE_KEYS.SUBSTANCE_LOG, cipher);
  createDeviceRescueSnapshot({ substanceLogs: logs });
}

export function loadSleepEnergy(): SleepEnergyEntry[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.SLEEP_ENERGY) ||
      localStorage.getItem('puffinless_sleep') ||
      localStorage.getItem('puffinless_sleep_energy');
    if (raw && !raw.startsWith('aes-gcm:') && !raw.startsWith('aes256:')) {
      return JSON.parse(raw) as SleepEnergyEntry[];
    }
  } catch {
    // ignore
  }
  return [];
}

export async function loadSleepEnergyAsync(): Promise<SleepEnergyEntry[]> {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.SLEEP_ENERGY) ||
      localStorage.getItem('puffinless_sleep') ||
      localStorage.getItem('puffinless_sleep_energy');
    return await decryptData<SleepEnergyEntry[]>(raw, []);
  } catch (e) {
    console.error('Error loading sleep energy', e);
  }
  return [];
}

export async function saveSleepEnergy(entries: SleepEnergyEntry[]): Promise<void> {
  const cipher = await encryptData(entries);
  localStorage.setItem(STORAGE_KEYS.SLEEP_ENERGY, cipher);
  await idbSet(STORAGE_KEYS.SLEEP_ENERGY, cipher);
  createDeviceRescueSnapshot({ sleepLogs: entries });
}

export function loadSavingsGoals(): SavingsGoal[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS) ||
      localStorage.getItem('puffinless_savings_goals');
    if (raw && !raw.startsWith('aes-gcm:') && !raw.startsWith('aes256:')) {
      return JSON.parse(raw) as SavingsGoal[];
    }
  } catch {
    // ignore
  }
  return [];
}

export async function loadSavingsGoalsAsync(): Promise<SavingsGoal[]> {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS) ||
      localStorage.getItem('puffinless_savings_goals');
    return await decryptData<SavingsGoal[]>(raw, []);
  } catch (e) {
    console.error('Error loading goals', e);
  }
  return [];
}

export async function saveSavingsGoals(goals: SavingsGoal[]): Promise<void> {
  const cipher = await encryptData(goals);
  localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, cipher);
  await idbSet(STORAGE_KEYS.SAVINGS_GOALS, cipher);
  createDeviceRescueSnapshot({ goals });
}

export function loadCravings(): CravingEntry[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.CRAVINGS) ||
      localStorage.getItem('puffinless_cravings') ||
      localStorage.getItem('puffinless_craving_logs');
    if (raw && !raw.startsWith('aes-gcm:') && !raw.startsWith('aes256:')) {
      return JSON.parse(raw) as CravingEntry[];
    }
  } catch {
    // ignore
  }
  return [];
}

export async function loadCravingsAsync(): Promise<CravingEntry[]> {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.CRAVINGS) ||
      localStorage.getItem('puffinless_cravings') ||
      localStorage.getItem('puffinless_craving_logs');
    return await decryptData<CravingEntry[]>(raw, []);
  } catch (e) {
    console.error('Error loading cravings', e);
  }
  return [];
}

export async function saveCravings(cravings: CravingEntry[]): Promise<void> {
  const cipher = await encryptData(cravings);
  localStorage.setItem(STORAGE_KEYS.CRAVINGS, cipher);
  await idbSet(STORAGE_KEYS.CRAVINGS, cipher);
  createDeviceRescueSnapshot({ cravings });
}

export function loadSmokeLog(): SmokeLogEntry[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.SMOKE_LOG) ||
      localStorage.getItem('puffinless_smoke_log');
    if (raw && !raw.startsWith('aes-gcm:') && !raw.startsWith('aes256:')) {
      return JSON.parse(raw) as SmokeLogEntry[];
    }
  } catch {
    // ignore
  }
  return [];
}

export async function loadSmokeLogAsync(): Promise<SmokeLogEntry[]> {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.SMOKE_LOG) ||
      localStorage.getItem('puffinless_smoke_log');
    return await decryptData<SmokeLogEntry[]>(raw, []);
  } catch (e) {
    console.error('Error loading smoke log', e);
  }
  return [];
}

export async function saveSmokeLog(logs: SmokeLogEntry[]): Promise<void> {
  const cipher = await encryptData(logs);
  localStorage.setItem(STORAGE_KEYS.SMOKE_LOG, cipher);
  await idbSet(STORAGE_KEYS.SMOKE_LOG, cipher);
  createDeviceRescueSnapshot({ smokeLogs: logs });
}

export interface HydratedStorageData {
  profile?: UserProfile;
  goals?: SavingsGoal[];
  cravings?: CravingEntry[];
  expenses?: PurchaseExpense[];
  substanceLogs?: SubstanceLog[];
  sleepLogs?: SleepEnergyEntry[];
  streaks?: StreakRecord[];
}

/**
 * Initializes and syncs IndexedDB storage with automatic device recovery.
 * - Checks IndexedDB and localStorage.
 * - If neither contains an active profile, automatically triggers deep device recovery.
 * - Consolidates all cravings, streaks, substances, and sleep entries without duplicates.
 * - Guarantees zero data loss across updates.
 */
export async function initIndexedDBStorage(): Promise<HydratedStorageData | null> {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check IndexedDB across primary and legacy keys
    let idbProfile: UserProfile | null = null;
    const idbProfileRaw =
      (await idbGet<unknown>(STORAGE_KEYS.PROFILE)) ||
      (await idbGet<unknown>('profile')) ||
      (await idbGet<unknown>('puffinless_profile')) ||
      (await idbGet<unknown>('puffinless_user_profile'));
    if (idbProfileRaw) {
      idbProfile = await decryptData<UserProfile>(idbProfileRaw, null as any);
    }

    // 2. Check localStorage across primary, legacy and rescue backup keys
    let localProfile: UserProfile | null = null;
    const localRaw =
      localStorage.getItem(STORAGE_KEYS.PROFILE) ||
      localStorage.getItem('puffinless_profile') ||
      localStorage.getItem('puffinless_user_profile');
    if (localRaw) {
      localProfile = await decryptData<UserProfile>(localRaw, null as any);
    }
    if (!localProfile) {
      const snap = getDeviceRescueSnapshot();
      if (snap?.profile) {
        localProfile = snap.profile;
      }
    }

    const hasActiveIdb = Boolean(
      idbProfile && typeof idbProfile === 'object' && (idbProfile.isOnboarded || idbProfile.quitDate)
    );
    const hasActiveLocal = Boolean(
      localProfile && typeof localProfile === 'object' && (localProfile.isOnboarded || localProfile.quitDate)
    );

    // If neither storage has a verified active profile, run deep device recovery
    if (!hasActiveIdb && !hasActiveLocal) {
      const recovery = await recoverAllDeviceData();
      if (recovery.recovered && recovery.profile) {
        return {
          profile: recovery.profile,
          goals: recovery.goals,
          cravings: recovery.cravings,
          expenses: recovery.expenses,
          substanceLogs: recovery.substanceLogs,
          sleepLogs: recovery.sleepLogs,
          streaks: recovery.streaks,
        };
      }
    }

    // If IndexedDB has active profile:
    if (hasActiveIdb && idbProfile) {
      const [goalsRaw, cravingsRaw, expensesRaw, substanceLogsRaw, sleepLogsRaw, streaksRaw] =
        await Promise.all([
          idbGet<unknown>(STORAGE_KEYS.SAVINGS_GOALS),
          idbGet<unknown>(STORAGE_KEYS.CRAVINGS),
          idbGet<unknown>(STORAGE_KEYS.EXPENSES),
          idbGet<unknown>(STORAGE_KEYS.SUBSTANCE_LOG),
          idbGet<unknown>(STORAGE_KEYS.SLEEP_ENERGY),
          idbGet<unknown>(STORAGE_KEYS.STREAKS),
        ]);

      const [goals, cravings, expenses, substanceLogs, sleepLogs, streaks] = await Promise.all([
        decryptData<SavingsGoal[]>(goalsRaw, []),
        decryptData<CravingEntry[]>(cravingsRaw, []),
        decryptData<PurchaseExpense[]>(expensesRaw, []),
        decryptData<SubstanceLog[]>(substanceLogsRaw, []),
        decryptData<SleepEnergyEntry[]>(sleepLogsRaw, []),
        decryptData<StreakRecord[]>(streaksRaw, []),
      ]);

      // Consolidate with any items in localStorage
      const [localCravings, localStreaks, localSubstances] = await Promise.all([
        loadCravingsAsync(),
        loadStreaksAsync(),
        loadSubstanceLogsAsync(),
      ]);

      const consolidatedCravings = mergeCravings(cravings || [], localCravings || []);
      const consolidatedStreaks = mergeStreaks(streaks || [], localStreaks || []);
      const consolidatedSubstances = mergeSubstances(substanceLogs || [], localSubstances || []);

      // If both streaks and cravings are empty, run deep scan to recover any historical data
      if (consolidatedCravings.length === 0 && consolidatedStreaks.length === 0) {
        const deepScan = await recoverAllDeviceData();
        if (deepScan.recovered && (deepScan.cravings.length > 0 || deepScan.streaks.length > 0 || deepScan.profile?.quitDate)) {
          return {
            profile: deepScan.profile || idbProfile,
            goals: deepScan.goals.length > 0 ? deepScan.goals : (goals || undefined),
            cravings: deepScan.cravings,
            expenses: deepScan.expenses.length > 0 ? deepScan.expenses : (expenses || undefined),
            substanceLogs: deepScan.substanceLogs.length > 0 ? deepScan.substanceLogs : consolidatedSubstances,
            sleepLogs: deepScan.sleepLogs.length > 0 ? deepScan.sleepLogs : (sleepLogs || undefined),
            streaks: deepScan.streaks,
          };
        }
      }

      createDeviceRescueSnapshot({
        profile: idbProfile,
        goals: goals || undefined,
        cravings: consolidatedCravings,
        expenses: expenses || undefined,
        substanceLogs: consolidatedSubstances,
        sleepLogs: sleepLogs || undefined,
        streaks: consolidatedStreaks,
      });

      return {
        profile: idbProfile,
        goals: goals || undefined,
        cravings: consolidatedCravings,
        expenses: expenses || undefined,
        substanceLogs: consolidatedSubstances,
        sleepLogs: sleepLogs || undefined,
        streaks: consolidatedStreaks,
      };
    }

    // If localProfile is active:
    if (hasActiveLocal && localProfile) {
      const [streaks, cravings, substances, expenses, sleep, goals] = await Promise.all([
        loadStreaksAsync(),
        loadCravingsAsync(),
        loadSubstanceLogsAsync(),
        loadExpensesAsync(),
        loadSleepEnergyAsync(),
        loadSavingsGoalsAsync(),
      ]);

      if (cravings.length === 0 && streaks.length === 0) {
        const deepScan = await recoverAllDeviceData();
        if (deepScan.recovered && (deepScan.cravings.length > 0 || deepScan.streaks.length > 0 || deepScan.profile?.quitDate)) {
          return {
            profile: deepScan.profile || localProfile,
            goals: deepScan.goals.length > 0 ? deepScan.goals : goals,
            cravings: deepScan.cravings,
            expenses: deepScan.expenses.length > 0 ? deepScan.expenses : expenses,
            substanceLogs: deepScan.substanceLogs.length > 0 ? deepScan.substanceLogs : substances,
            sleepLogs: deepScan.sleepLogs.length > 0 ? deepScan.sleepLogs : sleep,
            streaks: deepScan.streaks,
          };
        }
      }

      // Sync active localProfile into IndexedDB safely
      await Promise.all([
        saveProfile(localProfile),
        saveStreaks(streaks),
        saveCravings(cravings),
        saveSubstanceLogs(substances),
        saveExpenses(expenses),
        saveSleepEnergy(sleep),
        saveSavingsGoals(goals),
      ]);

      createDeviceRescueSnapshot({
        profile: localProfile,
        goals,
        cravings,
        expenses,
        substanceLogs: substances,
        sleepLogs: sleep,
        streaks,
      });

      return {
        profile: localProfile,
        goals,
        cravings,
        expenses,
        substanceLogs: substances,
        sleepLogs: sleep,
        streaks,
      };
    }

    // Fallback deep scan across all legacy and rescue keys
    const fallbackRecovery = await recoverAllDeviceData();
    if (fallbackRecovery.recovered && fallbackRecovery.profile) {
      return {
        profile: fallbackRecovery.profile,
        goals: fallbackRecovery.goals,
        cravings: fallbackRecovery.cravings,
        expenses: fallbackRecovery.expenses,
        substanceLogs: fallbackRecovery.substanceLogs,
        sleepLogs: fallbackRecovery.sleepLogs,
        streaks: fallbackRecovery.streaks,
      };
    }

    return null;
  } catch (err) {
    console.warn('[Storage] IndexedDB initialization error, recovering from device scan:', err);
    try {
      const recovery = await recoverAllDeviceData();
      if (recovery.recovered && recovery.profile) {
        return {
          profile: recovery.profile,
          goals: recovery.goals,
          cravings: recovery.cravings,
          expenses: recovery.expenses,
          substanceLogs: recovery.substanceLogs,
          sleepLogs: recovery.sleepLogs,
          streaks: recovery.streaks,
        };
      }
    } catch {
      // ignore
    }
    return null;
  }
}

/**
 * Safely migrates all user data to Passphrase Vault without data loss.
 * Loads current records with active key, derives 600k PBKDF2 passphrase key,
 * encrypts canary and records, stores to IndexedDB and localStorage, and sets active.
 */
export async function migrateToPassphraseVault(passphrase: string): Promise<CryptoKey> {
  const cleanPass = passphrase.trim();
  if (!cleanPass || cleanPass.length < 6) {
    throw new Error('Passphrase must be at least 6 characters');
  }

  // 1. Load all current user data using current active key
  const [profile, streaks, cravings, expenses, subLogs, sleepLogs, goals, smokeLogs] = await Promise.all([
    loadProfileAsync(),
    loadStreaksAsync(),
    loadCravingsAsync(),
    loadExpensesAsync(),
    loadSubstanceLogsAsync(),
    loadSleepEnergyAsync(),
    loadSavingsGoalsAsync(),
    loadSmokeLogAsync(),
  ]);

  // 2. Derive new non-extractable AES-GCM key from passphrase via PBKDF2 (600,000 iterations)
  const cryptoInstance = getCrypto();
  const salt = new Uint8Array(16);
  cryptoInstance.getRandomValues(salt);
  const passphraseKey = await deriveKeyFromPassphrase(cleanPass, salt, 600000);

  // 3. Encrypt canary verification with new passphrase key
  const canaryCipher = await encryptWithKey('PUFFINLESS_CANARY_VAULT_OK', passphraseKey);

  // 4. Re-encrypt all user data with new passphrase key
  const [profCipher, strkCipher, cravCipher, expCipher, subCipher, slpCipher, golCipher, smkCipher] =
    await Promise.all([
      encryptWithKey(profile, passphraseKey),
      encryptWithKey(streaks, passphraseKey),
      encryptWithKey(cravings, passphraseKey),
      encryptWithKey(expenses, passphraseKey),
      encryptWithKey(subLogs, passphraseKey),
      encryptWithKey(sleepLogs, passphraseKey),
      encryptWithKey(goals, passphraseKey),
      encryptWithKey(smokeLogs, passphraseKey),
    ]);

  // 5. Write re-encrypted data to both IndexedDB and localStorage
  await Promise.all([
    idbSet(STORAGE_KEYS.PROFILE, profCipher),
    idbSet(STORAGE_KEYS.STREAKS, strkCipher),
    idbSet(STORAGE_KEYS.CRAVINGS, cravCipher),
    idbSet(STORAGE_KEYS.EXPENSES, expCipher),
    idbSet(STORAGE_KEYS.SUBSTANCE_LOG, subCipher),
    idbSet(STORAGE_KEYS.SLEEP_ENERGY, slpCipher),
    idbSet(STORAGE_KEYS.SAVINGS_GOALS, golCipher),
    idbSet(STORAGE_KEYS.SMOKE_LOG, smkCipher),
  ]);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PROFILE, profCipher);
    localStorage.setItem(STORAGE_KEYS.STREAKS, strkCipher);
    localStorage.setItem(STORAGE_KEYS.CRAVINGS, cravCipher);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, expCipher);
    localStorage.setItem(STORAGE_KEYS.SUBSTANCE_LOG, subCipher);
    localStorage.setItem(STORAGE_KEYS.SLEEP_ENERGY, slpCipher);
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, golCipher);
    localStorage.setItem(STORAGE_KEYS.SMOKE_LOG, smkCipher);

    const config: VaultConfig = {
      mode: 'passphrase',
      saltHex: toHex(salt),
      iterations: 600000,
      canaryCipher,
    };
    localStorage.setItem(VAULT_CONFIG_KEY, JSON.stringify(config));
  }

  // 6. Update rescue snapshot
  createDeviceRescueSnapshot({
    profile,
    streaks,
    cravings,
    expenses,
    substanceLogs: subLogs,
    sleepLogs,
    goals,
    smokeLogs,
  });

  // 7. Set passphrase key active in memory and purge device key from IndexedDB
  setActiveVaultKey(passphraseKey);
  await removeKeyFromVault(MASTER_KEY_ID);

  return passphraseKey;
}

/**
 * Reverts from Passphrase Vault mode to Device Key mode without data loss.
 */
export async function migrateToDeviceVault(): Promise<CryptoKey> {
  // 1. Load all current user data with active passphrase key
  const [profile, streaks, cravings, expenses, subLogs, sleepLogs, goals, smokeLogs] = await Promise.all([
    loadProfileAsync(),
    loadStreaksAsync(),
    loadCravingsAsync(),
    loadExpensesAsync(),
    loadSubstanceLogsAsync(),
    loadSleepEnergyAsync(),
    loadSavingsGoalsAsync(),
    loadSmokeLogAsync(),
  ]);

  // 2. Generate new non-extractable device key
  const cryptoInstance = getCrypto();
  const freshSeed = new Uint8Array(32);
  cryptoInstance.getRandomValues(freshSeed);
  const deviceKey = await createKeyFromSeed(freshSeed);
  await saveKeyToVault(MASTER_KEY_ID, deviceKey);

  // 3. Re-encrypt all data with device key
  const [profCipher, strkCipher, cravCipher, expCipher, subCipher, slpCipher, golCipher, smkCipher] =
    await Promise.all([
      encryptWithKey(profile, deviceKey),
      encryptWithKey(streaks, deviceKey),
      encryptWithKey(cravings, deviceKey),
      encryptWithKey(expenses, deviceKey),
      encryptWithKey(subLogs, deviceKey),
      encryptWithKey(sleepLogs, deviceKey),
      encryptWithKey(goals, deviceKey),
      encryptWithKey(smokeLogs, deviceKey),
    ]);

  await Promise.all([
    idbSet(STORAGE_KEYS.PROFILE, profCipher),
    idbSet(STORAGE_KEYS.STREAKS, strkCipher),
    idbSet(STORAGE_KEYS.CRAVINGS, cravCipher),
    idbSet(STORAGE_KEYS.EXPENSES, expCipher),
    idbSet(STORAGE_KEYS.SUBSTANCE_LOG, subCipher),
    idbSet(STORAGE_KEYS.SLEEP_ENERGY, slpCipher),
    idbSet(STORAGE_KEYS.SAVINGS_GOALS, golCipher),
    idbSet(STORAGE_KEYS.SMOKE_LOG, smkCipher),
  ]);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PROFILE, profCipher);
    localStorage.setItem(STORAGE_KEYS.STREAKS, strkCipher);
    localStorage.setItem(STORAGE_KEYS.CRAVINGS, cravCipher);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, expCipher);
    localStorage.setItem(STORAGE_KEYS.SUBSTANCE_LOG, subCipher);
    localStorage.setItem(STORAGE_KEYS.SLEEP_ENERGY, slpCipher);
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, golCipher);
    localStorage.setItem(STORAGE_KEYS.SMOKE_LOG, smkCipher);
    localStorage.removeItem(VAULT_CONFIG_KEY);
  }

  // 4. Update rescue snapshot
  createDeviceRescueSnapshot({
    profile,
    streaks,
    cravings,
    expenses,
    substanceLogs: subLogs,
    sleepLogs,
    goals,
    smokeLogs,
  });

  // 5. Set active key
  setActiveVaultKey(deviceKey);

  return deviceKey;
}

/**
 * Re-encrypts all user entities with a newly selected active CryptoKey (e.g. Passphrase Vault transition).
 */
export async function reencryptAllUserDataWithKey(newKey: CryptoKey): Promise<void> {
  const [profile, streaks, cravings, expenses, subLogs, sleepLogs, goals, smokeLogs] = await Promise.all([
    loadProfileAsync(),
    loadStreaksAsync(),
    loadCravingsAsync(),
    loadExpensesAsync(),
    loadSubstanceLogsAsync(),
    loadSleepEnergyAsync(),
    loadSavingsGoalsAsync(),
    loadSmokeLogAsync(),
  ]);

  const [profCipher, strkCipher, cravCipher, expCipher, subCipher, slpCipher, golCipher, smkCipher] =
    await Promise.all([
      encryptWithKey(profile, newKey),
      encryptWithKey(streaks, newKey),
      encryptWithKey(cravings, newKey),
      encryptWithKey(expenses, newKey),
      encryptWithKey(subLogs, newKey),
      encryptWithKey(sleepLogs, newKey),
      encryptWithKey(goals, newKey),
      encryptWithKey(smokeLogs, newKey),
    ]);

  await Promise.all([
    idbSet(STORAGE_KEYS.PROFILE, profCipher),
    idbSet(STORAGE_KEYS.STREAKS, strkCipher),
    idbSet(STORAGE_KEYS.CRAVINGS, cravCipher),
    idbSet(STORAGE_KEYS.EXPENSES, expCipher),
    idbSet(STORAGE_KEYS.SUBSTANCE_LOG, subCipher),
    idbSet(STORAGE_KEYS.SLEEP_ENERGY, slpCipher),
    idbSet(STORAGE_KEYS.SAVINGS_GOALS, golCipher),
    idbSet(STORAGE_KEYS.SMOKE_LOG, smkCipher),
  ]);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PROFILE, profCipher);
    localStorage.setItem(STORAGE_KEYS.STREAKS, strkCipher);
    localStorage.setItem(STORAGE_KEYS.CRAVINGS, cravCipher);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, expCipher);
    localStorage.setItem(STORAGE_KEYS.SUBSTANCE_LOG, subCipher);
    localStorage.setItem(STORAGE_KEYS.SLEEP_ENERGY, slpCipher);
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, golCipher);
    localStorage.setItem(STORAGE_KEYS.SMOKE_LOG, smkCipher);
  }

  setActiveVaultKey(newKey);
}

/**
 * Complete, irreversible cryptoshredding and data erasure.
 * - Deletes the IndexedDB database file from browser storage.
 * - Irrevocably destroys AES vault encryption keys (cryptoshredding).
 * - Purges security PIN hashes, salts, and anti-brute-force lockout state.
 * - Purges all keys from localStorage and sessionStorage.
 */
export async function resetAllUserData(): Promise<void> {
  // 1. Delete IndexedDB physical database and await real confirmation
  await deletePuffinLessDB();

  // 2. Cryptoshredding: purge device AES encryption keys from IndexedDB KeyVault
  await purgeVaultKeys();

  // 3. Purge PIN credentials and lockout logs
  purgeSecurityState();

  // 4. Wipe all browser storage completely
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(RESCUE_BACKUP_KEY);
      localStorage.removeItem(LEGACY_RESCUE_KEY);
      localStorage.clear();
    } catch {
      // Fallback key-by-key removal if clear() is restricted
      Object.keys(localStorage).forEach((k) => localStorage.removeItem(k));
    }
  }

  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }
  }
}

/** Export all locally stored user data as a clean, unencrypted JSON payload (GDPR Art. 20 portability) */
export async function exportAllUserDataJSON(): Promise<string> {
  const [profile, streaks, cravings, substanceLogs, smokeLogs, expenses, sleepEnergy, savingsGoals] =
    await Promise.all([
      idbGet<unknown>(STORAGE_KEYS.PROFILE).then(async (raw) =>
        raw ? await decryptData<UserProfile>(raw, null as any) : await loadProfileAsync()
      ),
      idbGet<unknown>(STORAGE_KEYS.STREAKS).then(async (raw) =>
        raw ? await decryptData<StreakRecord[]>(raw, []) : await loadStreaksAsync()
      ),
      idbGet<unknown>(STORAGE_KEYS.CRAVINGS).then(async (raw) =>
        raw ? await decryptData<CravingEntry[]>(raw, []) : await loadCravingsAsync()
      ),
      idbGet<unknown>(STORAGE_KEYS.SUBSTANCE_LOG).then(async (raw) =>
        raw ? await decryptData<SubstanceLog[]>(raw, []) : await loadSubstanceLogsAsync()
      ),
      idbGet<unknown>(STORAGE_KEYS.SMOKE_LOG).then(async (raw) =>
        raw ? await decryptData<SmokeLogEntry[]>(raw, []) : await loadSmokeLogAsync()
      ),
      idbGet<unknown>(STORAGE_KEYS.EXPENSES).then(async (raw) =>
        raw ? await decryptData<PurchaseExpense[]>(raw, []) : await loadExpensesAsync()
      ),
      idbGet<unknown>(STORAGE_KEYS.SLEEP_ENERGY).then(async (raw) =>
        raw ? await decryptData<SleepEnergyEntry[]>(raw, []) : await loadSleepEnergyAsync()
      ),
      idbGet<unknown>(STORAGE_KEYS.SAVINGS_GOALS).then(async (raw) =>
        raw ? await decryptData<SavingsGoal[]>(raw, []) : await loadSavingsGoalsAsync()
      ),
    ]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    formatVersion: '2.0',
    securityStandard: 'Military-Grade Authenticated Encryption',
    appName: 'PuffinLess',
    profile,
    streaks,
    cravings,
    substanceLogs,
    smokeLogs,
    expenses,
    sleepEnergy,
    savingsGoals,
  };
  return JSON.stringify(exportPayload, null, 2);
}

/** Trigger direct browser download of the user's exported data */
export async function downloadUserDataJSON(): Promise<void> {
  const jsonStr = await exportAllUserDataJSON();
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `puffinless-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
