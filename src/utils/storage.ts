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
  Language,
} from '../types';
import { encryptData, decryptData } from './crypto';

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
    return decryptData<StreakRecord[]>(raw, []);
  } catch (e) {
    console.error('Error loading streaks', e);
  }
  return [];
}

export function saveStreaks(streaks: StreakRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STREAKS, encryptData(streaks));
  } catch (e) {
    console.error('Error saving streaks', e);
  }
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

/** Returns dynamically rotating quote based on day and week of the year */
export function getRotatingDailyQuote(lang: Language = 'fr'): Quote {
  const list = lang === 'fr' ? DAILY_QUOTES_FR : DAILY_QUOTES;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const idx = dayOfYear % list.length;
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

// Helper functions for persistent storage with local AES-256 encryption at rest
export function loadProfile(): UserProfile {
  const nowIso = new Date().toISOString();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      const parsed = decryptData<Partial<UserProfile>>(raw, {});
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        const merged: UserProfile = { ...DEFAULT_PROFILE, ...parsed };
        if (!merged.createdAt) {
          merged.createdAt = merged.quitDate || nowIso;
        }
        // As default the app starts the count from the day it is used unless a specific date is entered by the user
        if (!merged.quitDate) {
          merged.quitDate = merged.createdAt;
        }
        return merged;
      }
    }
  } catch (e) {
    console.error('Error loading profile', e);
  }
  return { ...DEFAULT_PROFILE, createdAt: nowIso, quitDate: nowIso };
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, encryptData(profile));
  } catch (e) {
    console.error('Error saving profile', e);
  }
}

export function loadExpenses(): PurchaseExpense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return decryptData<PurchaseExpense[]>(raw, []);
  } catch (e) {
    console.error('Error loading expenses', e);
  }
  return [];
}

export function saveExpenses(expenses: PurchaseExpense[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, encryptData(expenses));
  } catch (e) {
    console.error('Error saving expenses', e);
  }
}

export function loadSubstanceLogs(): SubstanceLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSTANCE_LOG);
    return decryptData<SubstanceLog[]>(raw, []);
  } catch (e) {
    console.error('Error loading substance logs', e);
  }
  return [];
}

export function saveSubstanceLogs(logs: SubstanceLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBSTANCE_LOG, encryptData(logs));
  } catch (e) {
    console.error('Error saving substance logs', e);
  }
}

export function loadSleepEnergy(): SleepEnergyEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SLEEP_ENERGY);
    return decryptData<SleepEnergyEntry[]>(raw, []);
  } catch (e) {
    console.error('Error loading sleep energy', e);
  }
  return [];
}

export function saveSleepEnergy(entries: SleepEnergyEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SLEEP_ENERGY, encryptData(entries));
  } catch (e) {
    console.error('Error saving sleep energy', e);
  }
}

export function loadSavingsGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS);
    return decryptData<SavingsGoal[]>(raw, []);
  } catch (e) {
    console.error('Error loading goals', e);
  }
  return [];
}

export function saveSavingsGoals(goals: SavingsGoal[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, encryptData(goals));
  } catch (e) {
    console.error('Error saving goals', e);
  }
}

export function loadCravings(): CravingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRAVINGS);
    return decryptData<CravingEntry[]>(raw, []);
  } catch (e) {
    console.error('Error loading cravings', e);
  }
  return [];
}

export function saveCravings(cravings: CravingEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRAVINGS, encryptData(cravings));
  } catch (e) {
    console.error('Error saving cravings', e);
  }
}

export function loadSmokeLog(): SmokeLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SMOKE_LOG);
    return decryptData<SmokeLogEntry[]>(raw, []);
  } catch (e) {
    console.error('Error loading smoke log', e);
  }
  return [];
}

export function saveSmokeLog(logs: SmokeLogEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SMOKE_LOG, encryptData(logs));
  } catch (e) {
    console.error('Error saving smoke log', e);
  }
}

export function loadForumPosts(): ForumPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FORUM_POSTS);
    return decryptData<ForumPost[]>(raw, DEFAULT_FORUM_POSTS);
  } catch (e) {
    console.error('Error loading forum posts', e);
  }
  return DEFAULT_FORUM_POSTS;
}

export function saveForumPosts(posts: ForumPost[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FORUM_POSTS, encryptData(posts));
  } catch (e) {
    console.error('Error saving forum posts', e);
  }
}
