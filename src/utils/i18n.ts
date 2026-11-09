import type { Language, SubstanceType, ExpenseItemType } from '../types/index.ts';

export const TRANSLATIONS = {
  en: {
    // Navigation
    navTracker: 'Tracker',
    navMoney: 'Money',
    navWellness: 'Wellness',
    navRewards: 'Rewards',

    // Header
    brandName: 'PuffinLess',
    smokeFree: 'smoke-free',
    cravingButton: 'CRAVING',
    switchLangTooltip: 'Traduire en Français (FR)',

    // Dashboard - Clean Breath Counter
    cleanBreathTitle: 'Clean Breath Counter',
    days: 'Days',
    hours: 'Hours',
    mins: 'Mins',
    secs: 'Secs',
    nextWin: 'Next win',
    bestStreak: 'best streak',
    restarts: 'restarts',
    lifeRegained: 'life regained',

    // Dashboard - Craving Prompt
    cravingCardTitle: 'Craving right now?',
    cravingCardSub: 'Breathe it out, then tap "I resisted" to log the win.',

    // Dashboard - Today's Intake
    intakeTitle: "Today's Intake",
    intakeSub: 'Be honest. Logging restarts your counter.',
    totalLogged: 'total',
    logButton: 'Log',
    nothingLogged: 'Nothing logged today. Your body is healing right now.',
    counterRestarted: 'Counter restarted. Your best streak is saved. Begin again.',

    // Intake Modal
    logSubstanceTitle: 'Log Intake',
    logSubstanceSub: 'This restarts your Clean Breath Counter. Your best streak and history are safely preserved.',
    selectSubstance: 'Substance:',
    selectQuantity: 'Quantity:',
    selectMotivation: 'Motivation / Trigger:',
    logAndRestart: 'Log & restart counter',
    cancel: 'Cancel',

    // Dashboard - Sleep & Energy
    sleepEnergyTitle: 'Sleep & Energy',
    sleepEnergySub: 'Rate today, see your week',
    sleepLabel: 'Sleep last night',
    energyLabel: 'Energy & focus today',
    saveCheckin: 'Save Check-In',
    loggedCheck: 'LOGGED ✓',

    // Dashboard - Milestones & Cravings
    cravingsBeaten: 'Cravings Beaten',
    noCravingsYet: 'None logged yet. Tap the Craving button next time an urge hits.',
    resistedCheck: 'Resisted ✓',
    intensity: 'intensity',

    // Substances
    substanceCigarette: 'Cigarette',
    substancePuff: 'Puff / Vape',
    substanceCannabis: 'Cannabis / CBD',
    unitCigarette: 'cig',
    unitPuff: 'puffs',
    unitJoint: 'joint',

    // Triggers / Motivations
    triggerStress: 'Stress',
    triggerHabit: 'Habit',
    triggerAfterMeal: 'After meal',
    triggerCoffeeDrink: 'Coffee / Drink',
    triggerBoredom: 'Boredom',
    triggerSocial: 'Social',
    triggerFatigue: 'Fatigue',
    triggerOther: 'Other',

    // SOS Crave Modal
    sosTitle: 'SOS Crave Interceptor',
    sosSub: "Cravings peak at 180 seconds. Let's disarm it together right now.",
    sosTabBreathe: '4-7-8 Breathing',
    sosTabGrounding: '5-4-3-2-1 Reset',
    sosTabReality: 'Reality Check',
    breatheReady: 'Tap Start',
    breatheInhale: 'Inhale',
    breatheHold: 'Hold',
    breatheExhale: 'Exhale',
    breatheCycle: 'Cycle',
    breatheBeginBtn: 'Begin 4-7-8 Breathing',
    breathePauseBtn: 'Pause Breathing',
    breatheHintInhale: 'Inhale deeply through your nose for 4 seconds...',
    breatheHintHold: 'Hold your breath gently. Feel your nervous system steady...',
    breatheHintExhale: 'Slowly release breath through your mouth for 8 seconds...',
    breatheHintReady: 'Follow the guided rhythm. 3 cycles will neutralize this urge.',
    groundingPrompt: 'Shock your mind out of autopilot by engaging the 5 senses right now:',
    grounding5: 'Look around and name 5 things you can see.',
    grounding4: 'Touch 4 physical textures (your phone, clothes, chair, desk).',
    grounding3: 'Listen for 3 distinct ambient sounds.',
    grounding2: 'Notice 2 distinct scents or take a sip of cold water.',
    grounding1: 'Take 1 slow, deep abdominal breath into clean lungs.',
    hardWonWealth: 'Hard-Won Wealth',
    wealthSavedMsg: 'You have already saved',
    wealthWarning: "Smoking one cigarette doesn't solve any problem—it only charges you another fee to hurt your lungs.",
    biologyRealityTitle: 'Biology Reality',
    biologyRealityMsg: 'Your brain is tricking you into thinking you "need" nicotine. In reality, every craving resisted starves the nicotine receptors until they permanently shut down.',
    sosCravedSubstance: 'Substance you are craving:',
    sosTriggerLabel: 'Motivation / Trigger:',
    sosIntensityLabel: 'Crave Intensity:',
    sosResistBtn: 'I Resisted This Craving! (+50 XP)',
    sosSlipQuestion: 'Did you slip up and have some? Click to log honestly',
    sosSlipWarning: "Slip ups happen. A single slip is not failure—it's data.",

    // Money View
    moneyTitle: 'Financial Freedom & Expense Tracker',
    moneySub: 'Track actual money spent on smoking and watch your accumulated savings grow.',
    outOfPocketTotal: 'Actual Money Spent',
    dailyBurnRate: 'Daily Habit Cost',
    annualProjection: 'Annual Projection',
    tenYearCost: '10-Year Cost (Invested @ 7%)',
    addExpenseBtn: 'Log Expense',
    addExpenseTitle: 'Log Smoking Purchase',
    itemTypeLabel: 'Item Type:',
    expenseTitleLabel: 'Title / Brand:',
    priceLabel: 'Price:',
    qtyLabel: 'Quantity:',
    saveExpenseBtn: 'Save Expense',
    expensesHistory: 'Recent Purchases',
    noExpenses: 'No purchases logged yet. Good job keeping your wallet closed!',
    savingsGoalsTitle: 'Savings Milestones & Goals',
    addGoalBtn: 'New Goal',

    // Item Types
    itemCigarettes: 'Cigarettes',
    itemPuffVape: 'Puff / Vape pod',
    itemCannabis: 'Cannabis',
    itemRollingPapers: 'Rolling papers / Tips',
    itemLighters: 'Lighters / Torches',
    itemAccessories: 'Filters & Accessories',

    // Wellness View
    wellnessTitle: 'Wellness, Mindset & Addiction Science',
    wellnessSub: 'Backed by clinical neuroscience, behavioral psychology, and peer-reviewed studies.',
    tabMasterclasses: 'Psychology Masterclasses',
    tabStudies: 'Scientific Evidence',
    tabMyths: 'Myths vs Facts',
    tabTimeline: 'Recovery Timeline',

    // Rewards View
    rewardsTitle: 'Milestones & Progressive Ladder',
    rewardsSub: 'From your first smoke-free hour to permanent neurobiological freedom.',
    tabLadder: 'Level Ladder',
    tabBadges: 'Badges & Trophies',
  },

  fr: {
    // Navigation
    navTracker: 'Suivi',
    navMoney: 'Argent',
    navWellness: 'Bien-être',
    navRewards: 'Paliers',

    // Header
    brandName: 'PuffinLess',
    smokeFree: 'sans fumer',
    cravingButton: 'ENVIE SOS',
    switchLangTooltip: 'Switch to English (EN)',

    // Dashboard - Clean Breath Counter
    cleanBreathTitle: 'Compteur de Souffle Pur',
    days: 'Jours',
    hours: 'Heures',
    mins: 'Mins',
    secs: 'Secs',
    nextWin: 'Prochain palier',
    bestStreak: 'meilleure série',
    restarts: 'reprises',
    lifeRegained: 'vie regagnée',

    // Dashboard - Craving Prompt
    cravingCardTitle: 'Une envie soudaine ?',
    cravingCardSub: 'Respirez profondément, puis validez "J\'ai résisté" pour marquer des points.',

    // Dashboard - Today's Intake
    intakeTitle: 'Consommation du Jour',
    intakeSub: 'Soyez honnête. Enregistrer relance le compteur.',
    totalLogged: 'total',
    logButton: 'Ajouter',
    nothingLogged: 'Rien aujourd\'hui. Vos poumons et vos artères se réparent actuellement.',
    counterRestarted: 'Compteur réinitialisé. Votre meilleure série est conservée. Continuez !',

    // Intake Modal
    logSubstanceTitle: 'Enregistrer une consommation',
    logSubstanceSub: 'Cela réinitialise votre Compteur de Souffle Pur. Votre meilleure série et tout votre historique restent préservés.',
    selectSubstance: 'Substance consommée :',
    selectQuantity: 'Quantité :',
    selectMotivation: 'Motivation / Déclencheur :',
    logAndRestart: 'Enregistrer & relancer le compteur',
    cancel: 'Annuler',

    // Dashboard - Sleep & Energy
    sleepEnergyTitle: 'Sommeil & Énergie',
    sleepEnergySub: 'Évaluez votre journée et analysez vos tendances',
    sleepLabel: 'Qualité du sommeil la nuit passée',
    energyLabel: 'Niveau d\'énergie & concentration',
    saveCheckin: 'Valider mon bilan du jour',
    loggedCheck: 'ENREGISTRÉ ✓',

    // Dashboard - Milestones & Cravings
    cravingsBeaten: 'Envies Surmontées',
    noCravingsYet: 'Aucune envie enregistrée. Utilisez le bouton SOS dès qu\'une pulsion survient.',
    resistedCheck: 'Surmontée ✓',
    intensity: 'intensité',

    // Substances
    substanceCigarette: 'Cigarette',
    substancePuff: 'Puff / Vape',
    substanceCannabis: 'Cannabis / CBD',
    unitCigarette: 'cig',
    unitPuff: 'bouffées',
    unitJoint: 'joint / dose',

    // Triggers / Motivations
    triggerStress: 'Stress',
    triggerHabit: 'Habitude',
    triggerAfterMeal: 'Après le repas',
    triggerCoffeeDrink: 'Café / Verre',
    triggerBoredom: 'Ennui',
    triggerSocial: 'En soirée / Amis',
    triggerFatigue: 'Fatigue',
    triggerOther: 'Autre',

    // SOS Crave Modal
    sosTitle: 'Intercepteur d\'Envie SOS',
    sosSub: 'Le pic d\'une pulsion ne dure que 180 secondes. Désamorçons-la ensemble immédiatement.',
    sosTabBreathe: 'Respiration 4-7-8',
    sosTabGrounding: 'Ancrage 5-4-3-2-1',
    sosTabReality: 'Vérification Réalité',
    breatheReady: 'Prêt',
    breatheInhale: 'Inspirez',
    breatheHold: 'Bloquez',
    breatheExhale: 'Expirez',
    breatheCycle: 'Cycle',
    breatheBeginBtn: 'Lancer la Respiration 4-7-8',
    breathePauseBtn: 'Mettre en pause',
    breatheHintInhale: 'Inspirez profondément par le nez pendant 4 secondes...',
    breatheHintHold: 'Bloquez votre respiration calmement. Votre système nerveux s\'apaise...',
    breatheHintExhale: 'Expirez lentement par la bouche pendant 8 secondes...',
    breatheHintReady: 'Suivez le rythme guidé. 3 cycles complets suffisent à neutraliser la pulsion.',
    groundingPrompt: 'Sortez votre esprit du pilotage automatique en stimulant vos 5 sens :',
    grounding5: 'Regardez autour de vous et identifiez 5 objets précis.',
    grounding4: 'Touchez 4 textures distinctes (téléphone, vêtement, bureau, peau).',
    grounding3: 'Écoutez attentivement 3 bruits d\'ambiance.',
    grounding2: 'Détectez 2 odeurs ou buvez une gorgée d\'eau très fraîche.',
    grounding1: 'Prenez 1 inspiration lente et profonde dans vos poumons propres.',
    hardWonWealth: 'Argent Sauvegardé',
    wealthSavedMsg: 'Vous avez déjà économisé',
    wealthWarning: 'Fumer une cigarette ne résout aucun problème—cela ne fait que prélever une taxe sur votre santé et repartir à zéro.',
    biologyRealityTitle: 'Réalité Neurobiologique',
    biologyRealityMsg: 'Votre cerveau vous fait croire que vous en "avez besoin". En vérité, chaque envie surmontée affame les récepteurs nicotiniques jusqu\'à leur disparition définitive.',
    sosCravedSubstance: 'Substance convoitée :',
    sosTriggerLabel: 'Motivation / Déclencheur :',
    sosIntensityLabel: 'Intensité de l\'envie :',
    sosResistBtn: 'J\'ai résisté à cette envie ! (+50 XP)',
    sosSlipQuestion: 'Avez-vous fait un écart ? Cliquez pour l\'enregistrer honnêtement',
    sosSlipWarning: 'Un écart arrive. Un faux pas n\'est pas un échec, c\'est un enseignement.',

    // Money View
    moneyTitle: 'Liberté Financière & Dépenses',
    moneySub: 'Suivez précisément l\'argent dépensé pour le tabac/vape et visualisez vos économies réelles.',
    outOfPocketTotal: 'Total Dépensé de Votre Poche',
    dailyBurnRate: 'Coût Quotidien de l\'Habitude',
    annualProjection: 'Projection Annuelle',
    tenYearCost: 'Coût sur 10 Ans (Investi à 7%)',
    addExpenseBtn: 'Ajouter une dépense',
    addExpenseTitle: 'Enregistrer un Achat',
    itemTypeLabel: 'Type d\'article :',
    expenseTitleLabel: 'Titre / Marque :',
    priceLabel: 'Prix :',
    qtyLabel: 'Quantité :',
    saveExpenseBtn: 'Enregistrer l\'achat',
    expensesHistory: 'Achats Récents',
    noExpenses: 'Aucun achat enregistré. Bravo pour avoir gardé votre portefeuille intact !',
    savingsGoalsTitle: 'Objectifs d\'Épargne & Projets',
    addGoalBtn: 'Nouvel Objectif',

    // Item Types
    itemCigarettes: 'Cigarettes',
    itemPuffVape: 'Puff / Pod de vape',
    itemCannabis: 'Cannabis / CBD',
    itemRollingPapers: 'Feuilles à rouler & filtres',
    itemLighters: 'Briquets & accessoires',
    itemAccessories: 'Accessoires divers',

    // Wellness View
    wellnessTitle: 'Bien-être, Mental & Neurosciences',
    wellnessSub: 'Basé sur les neurosciences cliniques, la thérapie comportementale et les études scientifiques.',
    tabMasterclasses: 'Masterclasses Psychologie',
    tabStudies: 'Preuves Scientifiques',
    tabMyths: 'Mythes vs Réalités',
    tabTimeline: 'Chronologie de Guérison',

    // Rewards View
    rewardsTitle: 'Paliers & Échelle de Progression',
    rewardsSub: 'De votre première heure sans fumer à la liberté neurobiologique permanente.',
    tabLadder: 'Échelle de Paliers',
    tabBadges: 'Badges & Trophées',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.en;

export function t(key: TranslationKey, lang: Language = 'en'): string {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return (dictionary[key] as string) || (TRANSLATIONS.en[key] as string) || key;
}

export const SUBSTANCE_LABELS: Record<Language, Record<SubstanceType, string>> = {
  en: {
    cigarette: 'Cigarette',
    puff_vape: 'Puff / Vape',
    cannabis: 'Cannabis',
  },
  fr: {
    cigarette: 'Cigarette',
    puff_vape: 'Puff / Vape',
    cannabis: 'Cannabis / CBD',
  },
};

export const TRIGGER_OPTIONS: { id: string; labelEn: string; labelFr: string }[] = [
  { id: 'Stress', labelEn: 'Stress', labelFr: 'Stress' },
  { id: 'Habit', labelEn: 'Habit', labelFr: 'Habitude' },
  { id: 'Avant/Après repas', labelEn: 'Before / After meal', labelFr: 'Avant / Après repas' },
  { id: 'Café/Matin', labelEn: 'Coffee / Morning', labelFr: 'Café / Matin' },
  { id: 'Soirée détente', labelEn: 'Relaxing Evening', labelFr: 'Soirée détente' },
  { id: 'Sport', labelEn: 'Workout / Sport', labelFr: 'Sport' },
  { id: 'Boredom', labelEn: 'Boredom', labelFr: 'Ennui' },
  { id: 'Social', labelEn: 'Social', labelFr: 'En soirée / Amis' },
  { id: 'Fatigue', labelEn: 'Fatigue', labelFr: 'Fatigue' },
  { id: 'Other', labelEn: 'Other', labelFr: 'Autre' },
];

export function getTriggerLabel(triggerId: string, lang: Language = 'en'): string {
  if (!triggerId || typeof triggerId !== 'string') return '';
  let lookupId = triggerId;
  if (triggerId === 'After Meal' || triggerId === 'Après repas') lookupId = 'Avant/Après repas';
  if (triggerId === 'Coffee/Drink' || triggerId === 'Café / Verre') lookupId = 'Café/Matin';

  const tLower = triggerId.toLowerCase();
  const found = TRIGGER_OPTIONS.find(
    (t) =>
      t.id === lookupId ||
      t.id === triggerId ||
      (t.labelEn && t.labelEn.toLowerCase() === tLower) ||
      (t.labelFr && t.labelFr.toLowerCase() === tLower)
  );
  if (found) {
    return lang === 'fr' ? found.labelFr : found.labelEn;
  }
  return triggerId;
}

export const EXPENSE_ITEM_LABELS: Record<Language, Record<ExpenseItemType, string>> = {
  en: {
    cigarettes: 'Cigarettes',
    puff_vape: 'Puff / Vape',
    cannabis: 'Cannabis',
    rolling_papers: 'Rolling papers',
    lighters: 'Lighters',
    accessories: 'Accessories',
  },
  fr: {
    cigarettes: 'Cigarettes',
    puff_vape: 'Puff / Vape',
    cannabis: 'Cannabis',
    rolling_papers: 'Feuilles / Filtres',
    lighters: 'Briquets',
    accessories: 'Accessoires',
  },
};
