import type { SubstanceType, Language } from '../types/index.ts';

export interface SubstanceDetails {
  name: string;
  tagline: string;
  activeAgents: string[];
  unitLabel: string;
  defaultQuickStep: number;
  healthEffects: {
    organs: string[];
    summary: string;
    cardiovascular: string;
    pulmonary: string;
    neuroSleep: string;
  };
  financialImpactTip: string;
  clinicalStudyReference: string;
}

export const SUBSTANCE_DATABASE: Record<SubstanceType, SubstanceDetails> = {
  cigarette: {
    name: 'Cigarettes & Rolling Tobacco',
    tagline: 'High-combustion tobacco with 7,000 chemicals & 69 carcinogens',
    activeAgents: ['Nicotine', 'Carbon Monoxide', 'Tar', 'Benzene', 'Formaldehyde'],
    unitLabel: 'Cigarettes',
    defaultQuickStep: 1,
    healthEffects: {
      organs: ['Cardiovascular System', 'Lungs & Airways', 'Brain & Neuro-receptors', 'Skin & Gums'],
      summary: 'Each stick introduces carbon monoxide that binds to hemoglobin 200x tighter than oxygen, suffocating cellular mitochondria.',
      cardiovascular: 'Increases heart rate by 15-25 BPM, hardens arterial walls, and raises thrombosis (blood clot) risk by 300%.',
      pulmonary: 'Paralyzes airway cilia for 48 hours per pack, allowing tar to solidify inside alveoli and slashing vital capacity.',
      neuroSleep: 'Nicotine withdrawal every 90 minutes causes micro-arousals during sleep, cutting REM sleep by 24% and causing morning exhaustion.',
    },
    financialImpactTip: 'At $12/pack, smoking a pack a day costs over $4,380/year. Invested at 8% annual return, that is over $63,000 lost in 10 years.',
    clinicalStudyReference: 'British Medical Journal (BMJ) Doctors Cohort: 1 cigarette = 11 minutes of biological life expectancy lost.',
  },
  puff_vape: {
    name: 'Puffs & E-Cigarettes',
    tagline: 'Superheated synthetic nicotine salts & flavored aerosol',
    activeAgents: ['Nicotine Salts (20-50mg)', 'Propylene Glycol', 'Acrolein', 'Heavy Metals (Nickel, Lead)'],
    unitLabel: 'Puffs',
    defaultQuickStep: 10,
    healthEffects: {
      organs: ['Lung Epithelium', 'Vascular Endothelium', 'Dopaminergic Mesolimbic Pathway'],
      summary: 'Ultra-concentrated nicotine salts reach the brain in 7 seconds, delivering sharp dopamine spikes that accelerate psychological dependence.',
      cardiovascular: 'Causes acute endothelial dysfunction and artery stiffness comparable to combustible tobacco.',
      pulmonary: 'Acrolein and heated chemical flavoring irritate delicate lung bronchioles, triggering chronic dry coughing and macrophage inflammation.',
      neuroSleep: 'High-potency nicotine elevates nighttime cortisol and core body temperature, cutting restorative deep slow-wave sleep by 28%.',
    },
    financialImpactTip: 'Disposable 600-puff or 5,000-puff vapes cost $15–$25 each. Average users burn through $180–$300 monthly on synthetic pods.',
    clinicalStudyReference: 'American Heart Association (AHA): E-cigarette aerosol triggers cellular oxidative stress and acute endothelial stiffening within 5 minutes.',
  },
  cannabis: {
    name: 'Cannabis / Weed & Joints',
    tagline: 'Combusted herb, THC cannabinoids, rolling papers & blunts',
    activeAgents: ['Delta-9-THC', 'Combustion Tar', 'Terpenes', 'Carbon Monoxide'],
    unitLabel: 'Joints / Grams',
    defaultQuickStep: 1,
    healthEffects: {
      organs: ['Endocannabinoid CB1 Receptors', 'Prefrontal Cortex', 'Respiratory Tract', 'Sleep Architecture'],
      summary: 'When smoked with rolling papers or tobacco mixes, unfiltered smoke delivers 3x more tar deposits into the lung branches than filtered tobacco.',
      cardiovascular: 'Induces acute tachycardia (heart rate increases by 20-50 BPM for up to 3 hours), elevating myocardial oxygen demand.',
      pulmonary: 'Frequent cannabis inhalation causes bronchial cell hyperplasia and goblet cell proliferation, causing morning phlegm and chest tightness.',
      neuroSleep: 'Severely suppresses Stage 4 REM sleep by up to 40%. While it knocks you out quickly, your brain misses critical emotional and memory consolidation.',
    },
    financialImpactTip: 'Average consumers spend $200–$450/month on herb, papers, tips, and smoking gear. Over 5 years, this equals $18,000–$35,000 of wealth burnt.',
    clinicalStudyReference: 'Sleep Medicine Reviews (2020): Chronic cannabinoid use leads to REM sleep deprivation, daytime grogginess, and rebound insomnia upon withdrawal.',
  },
};

export const SUBSTANCE_DATABASE_FR: Record<SubstanceType, SubstanceDetails> = {
  cigarette: {
    name: 'Cigarettes & Tabac à Rouler',
    tagline: 'Combustion toxique libérant 7 000 composés chimiques dont 69 cancérigènes avérés',
    activeAgents: ['Nicotine', 'Monoxyde de carbone (CO)', 'Goudrons', 'Benzène', 'Formaldéhyde'],
    unitLabel: 'Cigarettes',
    defaultQuickStep: 1,
    healthEffects: {
      organs: ['Système cardiovasculaire', 'Voies respiratoires & alvéoles', 'Cerveau & récepteurs nicotiniques', 'Peau & gencives'],
      summary: 'Chaque cigarette libère du monoxyde de carbone qui prend la place de l\'oxygène sur l\'hémoglobine 200 fois plus fortement, asphyxiant vos mitochondries cellulaires.',
      cardiovascular: 'Accélère les pulsations de 15 à 25 BPM, durcit la paroi artérielle et multiplie par 3 le risque de thrombose et d\'infarctus.',
      pulmonary: 'Paralyse les cils bronchiques protecteurs pendant 48 h par paquet, laissant les goudrons s\'incruster au cœur des alvéoles et étouffant votre capacité vitale.',
      neuroSleep: 'Le manque de nicotine toutes les 90 minutes provoque des micro-réveils invisibles la nuit, amputant le sommeil paradoxal (REM) de 24 % et causant l\'épuisement matinal.',
    },
    financialImpactTip: 'À 12 € le paquet, fumer 1 paquet par jour coûte plus de 4 380 € par an. Réinvesti à 8 % annuel, c\'est plus de 63 000 € de patrimoine vaporisé sur 10 ans.',
    clinicalStudyReference: 'British Medical Journal (BMJ) Doctors Study : 1 cigarette fumée = 11 minutes d\'espérance de vie biologique perdue en moyenne.',
  },
  puff_vape: {
    name: 'Puffs & Cigarettes Électroniques',
    tagline: 'Sels de nicotine synthétiques ultra-concentrés & aérosols chimiques chauffés',
    activeAgents: ['Sels de nicotine (20-50 mg)', 'Propylène glycol', 'Acroléine', 'Métaux lourds (Nickel, Plomb)'],
    unitLabel: 'Bouffées (Puffs)',
    defaultQuickStep: 10,
    healthEffects: {
      organs: ['Épithélium bronchique', 'Endothélium vasculaire', 'Circuit dopaminergique mésolimbique'],
      summary: 'Les sels de nicotine synthétiques pénètrent le système nerveux central en seulement 7 secondes, générant un pic dopaminergique artificiel violent qui verrouille l\'addiction.',
      cardiovascular: 'Engendre une dysfonction endothéliale immédiate et une vasoconstriction artérielle mesurable identique à la fumée de tabac.',
      pulmonary: 'L\'acroléine et les arômes de synthèse chauffés irritent les bronchioles profondes, déclenchant toux sèche réflexe et inflammation persistante des macrophages.',
      neuroSleep: 'La surstimulation nicotinique maintient un taux élevé de cortisol et de température corporelle la nuit, amputant de 28 % le sommeil profond réparateur.',
    },
    financialImpactTip: 'Une puff jetable coûte de 9 à 20 €. Les vapoteurs réguliers consomment entre 150 et 320 € par mois en pods ou recharges jetables.',
    clinicalStudyReference: 'American Heart Association (AHA) : L\'aérosol de cigarette électronique induit un stress oxydatif cellulaire et une rigidification artérielle en 5 minutes.',
  },
  cannabis: {
    name: 'Cannabis / CBD, Herbe & Joints',
    tagline: 'Herbe en combustion, cannabinoïdes THC/CBD, feuilles à rouler et résine',
    activeAgents: ['Delta-9-THC', 'Goudrons de combustion', 'Terpènes', 'Monoxyde de carbone'],
    unitLabel: 'Joints / Grammes',
    defaultQuickStep: 1,
    healthEffects: {
      organs: ['Récepteurs endocannabinoïdes CB1', 'Cortex préfrontal', 'Arbre respiratoire', 'Sommeil paradoxal'],
      summary: 'Fumé avec du tabac ou en feuille sans filtre, la fumée génère 3 fois plus de dépôts goudronneux dans les poumons qu\'une cigarette industrielle avec filtre.',
      cardiovascular: 'Déclenche une tachycardie immédiate (le cœur s\'accélère de 20 à 50 BPM pendant 2 à 3 heures), augmentant dangereusement la consommation d\'oxygène du myocarde.',
      pulmonary: 'L\'inhalation profonde et prolongée cause une métaplasie de la muqueuse bronchique, à l\'origine des glaires épaisses et de l\'oppression matinale.',
      neuroSleep: 'Élimine jusqu\'à 40 % du sommeil paradoxal (REM). Même s\'il accélère l\'endormissement, le cerveau est privé de consolidation émotionnelle et mnésique.',
    },
    financialImpactTip: 'Un fumeur moyen dépense entre 150 et 450 € par mois en fleurs, résines et accessoires. Sur 5 ans, c\'est 18 000 à 35 000 € brûlés.',
    clinicalStudyReference: 'Sleep Medicine Reviews (2020) : L\'exposition chronique aux cannabinoïdes cause une dette chronique de sommeil paradoxal, brouillard mental diurne et insomnie rebelle au sevrage.',
  },
};

export function getSubstanceDetails(substance: SubstanceType, lang: Language = 'en'): SubstanceDetails {
  if (lang === 'fr') {
    return SUBSTANCE_DATABASE_FR[substance] || SUBSTANCE_DATABASE[substance];
  }
  return SUBSTANCE_DATABASE[substance];
}

export interface HealthExpenseLossReport {
  totalSpentCash: number;
  opportunityCost10Years: number; // compound at 7% return
  estimatedLifeLostHours: number;
  sleepEfficiencyLossPercent: number;
  toxicLoadIndex: number; // 0 - 100
}

export function computeHarmAndWealthMetrics(
  totalSpent: number,
  cigsSmoked: number,
  puffsVaped: number,
  cannabisConsumed: number
): HealthExpenseLossReport {
  // 10 year compound value: FV = P * (((1 + r)^n - 1) / r) assuming monthly savings
  // Simplified realistic formula:
  const monthlyCostEstimate = Math.max(30, totalSpent > 0 ? (totalSpent / 30) * 30 : 150);
  const annual = monthlyCostEstimate * 12;
  // FV of annual annuity for 10 years at 7% return = annual * 13.816
  const opportunityCost10Years = Math.round(annual * 13.816);

  // Life lost: Cigarette = 11 mins, Joint = ~15 mins of combustion damage, 10 Puffs = ~2 mins equivalent vascular stress
  const lifeLostMinutes = (cigsSmoked * 11) + (cannabisConsumed * 15) + (puffsVaped * 0.2);
  const estimatedLifeLostHours = Number((lifeLostMinutes / 60).toFixed(1));

  // Sleep damage estimation
  const totalSubstanceEvents = cigsSmoked + (puffsVaped / 10) + (cannabisConsumed * 3);
  const sleepEfficiencyLossPercent = Math.min(48, Math.round(totalSubstanceEvents * 1.8));

  // Toxic load score
  const toxicLoadIndex = Math.min(100, Math.round(cigsSmoked * 2.5 + (puffsVaped / 10) * 1.5 + cannabisConsumed * 3.5));

  return {
    totalSpentCash: totalSpent,
    opportunityCost10Years,
    estimatedLifeLostHours,
    sleepEfficiencyLossPercent,
    toxicLoadIndex,
  };
}
