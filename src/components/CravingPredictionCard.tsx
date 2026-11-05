import React, { useMemo, useState } from 'react';
import { Radar, Clock, ShieldAlert, Wind } from 'lucide-react';
import type { CravingEntry, SubstanceLog, UserProfile, Language } from '../types';
import { MorphicCard } from './MorphicCard';
import { sound } from '../utils/audio';

interface CravingPredictionCardProps {
  cravings: CravingEntry[];
  substanceLogs: SubstanceLog[];
  profile: UserProfile;
  language?: Language;
  onOpenSos?: () => void;
  onNavigateToWellness?: () => void;
}

interface RiskWindow {
  hour: number;
  labelEn: string;
  labelFr: string;
  triggerEn: string;
  triggerFr: string;
  probability: number; // 0 - 100
  isCurrent: boolean;
  isNext: boolean;
}

export const CravingPredictionCard: React.FC<CravingPredictionCardProps> = ({
  cravings,
  substanceLogs,
  profile,
  language = 'en',
  onOpenSos,
  onNavigateToWellness,
}) => {
  const isFr = language === 'fr';
  const [currentHour] = useState(() => new Date().getHours());

  // Compute predictive risk windows using past logs and profile triggers
  const riskWindows: RiskWindow[] = useMemo(() => {
    // 1. Build an hourly histogram from all logged cravings and slips
    const hourlyCounts = new Array(24).fill(0);
    const triggerCounts: Record<number, Record<string, number>> = {};

    cravings.forEach((c) => {
      const h = new Date(c.timestamp).getHours();
      hourlyCounts[h] += 1;
      if (c.trigger) {
        if (!triggerCounts[h]) triggerCounts[h] = {};
        triggerCounts[h][c.trigger] = (triggerCounts[h][c.trigger] || 0) + 1;
      }
    });

    substanceLogs.forEach((l) => {
      const h = new Date(l.timestamp).getHours();
      hourlyCounts[h] += 1.5; // Slightly heavier weight for past slip times
      if (l.trigger) {
        if (!triggerCounts[h]) triggerCounts[h] = {};
        triggerCounts[h][l.trigger] = (triggerCounts[h][l.trigger] || 0) + 1;
      }
    });

    // Profile configured triggers weighting if user set peak triggers
    const profileTriggers = profile.smokingHabitByDay?.peakTriggers || [];
    if (profileTriggers.length > 0) {
      hourlyCounts[8] += 1;
      hourlyCounts[13] += 1;
      hourlyCounts[18] += 1;
    }

    // Total events recorded
    const totalEvents = cravings.length + substanceLogs.length;

    // Default chronobiological windows if few logs exist
    const defaultHours = [
      { h: 8, fr: 'Café du matin / Réveil', en: 'Morning Coffee & Wakeup', trigFr: 'Café & Routine', trigEn: 'Morning Coffee' },
      { h: 13, fr: 'Après le repas / Pause travail', en: 'Post-Lunch / Work Break', trigFr: 'Digestion & Écran', trigEn: 'After Meal' },
      { h: 20, fr: 'Détente du soir / Soirée', en: 'Evening Wind-down / Relax', trigFr: 'Décompression', trigEn: 'Evening Stress' },
    ];

    let candidateHours: { hour: number; score: number; topTrigger: string }[] = [];

    if (totalEvents >= 3) {
      // Find top 3 hours with highest counts
      const sorted = hourlyCounts
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .filter((item) => item.count > 0);

      candidateHours = sorted.slice(0, 3).map((item) => {
        const triggers = triggerCounts[item.hour] || {};
        let topTrig = '';
        let maxCount = 0;
        Object.entries(triggers).forEach(([trig, count]) => {
          if (count > maxCount) {
            maxCount = count;
            topTrig = trig;
          }
        });
        return {
          hour: item.hour,
          score: Math.min(95, Math.round((item.count / Math.max(1, totalEvents)) * 140)),
          topTrigger: topTrig || (item.hour < 11 ? 'Morning routine' : item.hour < 16 ? 'Work break' : 'Evening relax'),
        };
      });
    }

    // Fallback if not enough data
    if (candidateHours.length < 3) {
      defaultHours.forEach((def) => {
        if (!candidateHours.find((c) => c.hour === def.h)) {
          candidateHours.push({
            hour: def.h,
            score: 75,
            topTrigger: def.en,
          });
        }
      });
    }

    // Sort chronologically
    candidateHours.sort((a, b) => a.hour - b.hour);

    const topThree = candidateHours.slice(0, 3);
    const nextImpendingIndex = topThree.findIndex(
      (item) => item.hour > currentHour || (currentHour > 20 && item.hour < 10)
    );

    return topThree.map((item, index) => {
      const isCurrent = currentHour === item.hour || currentHour === (item.hour + 1) % 24;
      const isNext = !isCurrent && index === nextImpendingIndex;

      const hFormatted = `${item.hour.toString().padStart(2, '0')}:00`;
      const hEndFormatted = `${((item.hour + 1) % 24).toString().padStart(2, '0')}:30`;

      return {
        hour: item.hour,
        labelEn: `${hFormatted} - ${hEndFormatted}`,
        labelFr: `${hFormatted} - ${hEndFormatted}`,
        triggerEn: item.topTrigger,
        triggerFr: item.topTrigger,
        probability: item.score,
        isCurrent,
        isNext,
      };
    });
  }, [cravings, substanceLogs, currentHour, profile.smokingHabitByDay?.peakTriggers]);

  const activeWindow = riskWindows.find((w) => w.isCurrent);
  const nextWindow = riskWindows.find((w) => w.isNext) || riskWindows[0];

  return (
    <MorphicCard variant="obsidian" className="space-y-3.5 relative overflow-hidden border border-emerald-500/30">
      {/* Background radar sweep glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
            <Radar className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400">
                {isFr ? 'Radar Obsidian IA' : 'Obsidian AI Radar'}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {isFr ? 'Chronobiologie' : 'Predictive'}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white tracking-tight">
              {isFr ? 'Prédiction des Pics de Pulsion' : 'Craving Peak Forecasting'}
            </h4>
          </div>
        </div>

        {/* Live Status Badge */}
        {activeWindow ? (
          <div className="px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-extrabold flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>{isFr ? 'Fenêtre à Risque En Cours' : 'Peak Window Active'}</span>
          </div>
        ) : (
          <div className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>
              {isFr
                ? `Prochain pic : ${nextWindow.labelFr}`
                : `Next peak: ${nextWindow.labelEn}`}
            </span>
          </div>
        )}
      </div>

      {/* Narrative Advice */}
      <div className={`p-3 rounded-2xl border text-xs leading-relaxed transition-all ${
        activeWindow
          ? 'bg-rose-950/30 border-rose-500/35 text-rose-200'
          : 'bg-slate-900/60 border-white/10 text-slate-300'
      }`}>
        {activeWindow ? (
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>
              {isFr
                ? `⚠️ Vous êtes dans votre plage horaire sensible (${activeWindow.labelFr}). Le cerveau associe souvent ce moment à une pause. Buvez un grand verre d'eau et faites 3 minutes de respiration.`
                : `⚠️ You are currently in your vulnerability window (${activeWindow.labelEn}). Your subconscious expects a dopamine cue here. Drink cold water and breathe.`}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              {isFr
                ? `L'Obsidian Core anticipe vos 3 moments charnières de la journée d'après votre rythme. Préparez votre parade mentale 15 minutes avant l'échéance.`
                : `The Obsidian engine maps your 3 daily habit peaks. Stay ahead of cravings by arming your sensory replacement 15 minutes early.`}
            </p>
          </div>
        )}
      </div>

      {/* 3 Predicted Windows Grid */}
      <div className="grid grid-cols-3 gap-2">
        {riskWindows.map((w, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col justify-between ${
              w.isCurrent
                ? 'bg-rose-500/20 border-rose-500/50 shadow-md shadow-rose-500/20'
                : w.isNext
                ? 'bg-amber-500/15 border-amber-500/40'
                : 'bg-slate-900/50 border-white/5 opacity-80'
            }`}
          >
            <div>
              <div className="text-[10px] font-extrabold text-white tabular-nums tracking-tight">
                {isFr ? w.labelFr : w.labelEn}
              </div>
              <div className="text-[9px] text-slate-400 truncate mt-0.5">
                {isFr ? w.triggerFr : w.triggerEn}
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-white/5 flex items-center justify-between text-[9px] font-bold">
              <span className="text-slate-400">{isFr ? 'Risque' : 'Risk'}</span>
              <span className={w.isCurrent ? 'text-rose-400' : w.isNext ? 'text-amber-400' : 'text-emerald-400'}>
                {w.probability}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Button to deploy prevention */}
      <div className="flex items-center gap-2 pt-1">
        {onOpenSos && (
          <button
            type="button"
            onClick={() => {
              sound.vibrate(45);
              sound.playClick();
              onOpenSos();
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500/25 to-amber-500/25 border border-rose-500/40 text-rose-200 text-xs font-bold hover:bg-rose-500/35 transition-all flex items-center justify-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>{isFr ? 'Désamorcer une Pulsion (SOS)' : 'De-escalate Craving (SOS)'}</span>
          </button>
        )}

        {onNavigateToWellness && (
          <button
            type="button"
            onClick={() => {
              sound.vibrate(45);
              sound.playClick();
              onNavigateToWellness();
            }}
            className="py-2 px-3 rounded-xl bg-slate-900/80 border border-white/10 text-emerald-300 text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-1"
            title={isFr ? 'Studio de Respiration' : 'Breathing Studio'}
          >
            <Wind className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isFr ? 'Respirer' : 'Breathe'}</span>
          </button>
        )}
      </div>
    </MorphicCard>
  );
};
