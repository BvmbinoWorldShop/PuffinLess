import type { SleepEnergyEntry } from '../types';
import { localDateStr } from './dates';

/** Demo history for the last 6 days (relative to today) so trends are visible from day one. */
function buildSampleData(): SleepEnergyEntry[] {
  const rows: Array<Omit<SleepEnergyEntry, 'id' | 'date'>> = [
    { sleepRating: 5, energyRating: 4, substancesLogged: { cigarette: 18, puff_vape: 80, cannabis: 2 }, notes: 'Heavy smoking evening, dry mouth and chest tightness' },
    { sleepRating: 4, energyRating: 5, substancesLogged: { cigarette: 15, puff_vape: 60, cannabis: 1 }, notes: 'Late-night vape in bed, restless sleep' },
    { sleepRating: 7, energyRating: 6, substancesLogged: { cigarette: 4, puff_vape: 15, cannabis: 0 }, notes: 'Cut down noticeably, easier breathing in the morning' },
    { sleepRating: 8, energyRating: 8, substancesLogged: { cigarette: 0, puff_vape: 0, cannabis: 0 }, notes: 'First clean day. Deep sleep, no morning cough' },
    { sleepRating: 9, energyRating: 8, substancesLogged: { cigarette: 0, puff_vape: 0, cannabis: 0 }, notes: 'Woke before the alarm with steady focus' },
    { sleepRating: 8, energyRating: 9, substancesLogged: { cigarette: 0, puff_vape: 0, cannabis: 0 }, notes: 'Great workout, heart rate stayed controlled' },
  ];
  return rows
    .map((r, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (rows.length - i));
      return { ...r, id: `se-sample-${i}`, date: localDateStr(d) };
    })
    .reverse(); // newest first, like real logs
}

export const SAMPLE_SLEEP_DATA: SleepEnergyEntry[] = buildSampleData();

export interface SleepCorrelationReport {
  avgCleanSleep: number;
  avgHeavySleep: number;
  sleepImprovementPercent: number;
  avgCleanEnergy: number;
  avgHeavyEnergy: number;
  energyMultiplier: number;
  insightSummary: string;
  hasEnoughData: boolean;
}

const intakeUnits = (e: SleepEnergyEntry) =>
  e.substancesLogged.cigarette + e.substancesLogged.puff_vape / 10 + e.substancesLogged.cannabis * 2;

export function computeSleepEnergyCorrelation(entries: SleepEnergyEntry[], isFr: boolean = false): SleepCorrelationReport {
  const cleanDays = entries.filter((e) => intakeUnits(e) === 0);
  const heavyDays = entries.filter((e) => intakeUnits(e) >= 6);
  const avg = (list: SleepEnergyEntry[], key: 'sleepRating' | 'energyRating') =>
    Number((list.reduce((a, d) => a + d[key], 0) / list.length).toFixed(1));

  const hasEnoughData = cleanDays.length >= 3 && heavyDays.length >= 3;
  const avgCleanSleep = cleanDays.length ? avg(cleanDays, 'sleepRating') : 0;
  const avgHeavySleep = heavyDays.length ? avg(heavyDays, 'sleepRating') : 0;
  const avgCleanEnergy = cleanDays.length ? avg(cleanDays, 'energyRating') : 0;
  const avgHeavyEnergy = heavyDays.length ? avg(heavyDays, 'energyRating') : 0;

  const sleepImprovementPercent = hasEnoughData
    ? Math.round(((avgCleanSleep - avgHeavySleep) / Math.max(1, avgHeavySleep)) * 100)
    : 0;
  const energyMultiplier = hasEnoughData ? Number((avgCleanEnergy / Math.max(1, avgHeavyEnergy)).toFixed(1)) : 0;

  const insightSummary = hasEnoughData
    ? isFr
      ? `Tendance indicative (${cleanDays.length} j sobres vs ${heavyDays.length} j avec consommation) : sommeil noté ${avgCleanSleep}/10 vs ${avgHeavySleep}/10 (${sleepImprovementPercent >= 0 ? '+' : ''}${sleepImprovementPercent}%), et énergie estimée à ${avgCleanEnergy}/10 vs ${avgHeavyEnergy}/10 (${energyMultiplier}x). Note : corrélation d'auto-évaluation, ne constitue pas une preuve de causalité directe.`
      : `Indicative trend (${cleanDays.length} clean days vs ${heavyDays.length} consumption days): sleep self-rated ${avgCleanSleep}/10 vs ${avgHeavySleep}/10 (${sleepImprovementPercent >= 0 ? '+' : ''}${sleepImprovementPercent}%), and energy ${avgCleanEnergy}/10 vs ${avgHeavyEnergy}/10 (${energyMultiplier}x). Note: self-reported correlation, does not prove direct causation.`
    : isFr
      ? `Données insuffisantes pour dégager une tendance fiable (minimum requis : 3 jours sobres et 3 jours avec consommation — actuellement ${cleanDays.length}/3 sobres, ${heavyDays.length}/3 consommations). Poursuivez vos relevés quotidiens.`
      : `Insufficient data for a reliable trend (minimum required: 3 clean days and 3 consumption days — currently ${cleanDays.length}/3 clean, ${heavyDays.length}/3 heavy). Keep logging daily.`;

  return {
    avgCleanSleep,
    avgHeavySleep,
    sleepImprovementPercent,
    avgCleanEnergy,
    avgHeavyEnergy,
    energyMultiplier,
    insightSummary,
    hasEnoughData,
  };
}
