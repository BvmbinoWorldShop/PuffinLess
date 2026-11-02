import type { SubstanceType } from '../types';

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
