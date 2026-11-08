import React, { useMemo, useState, useEffect } from 'react';
import { Clock, ShieldAlert, Activity, Sparkles } from 'lucide-react';
import type { CravingEntry, SubstanceLog, UserProfile, Language } from '../types';
import { MorphicCard } from './MorphicCard';

interface CravingPredictionCardProps {
  cravings: CravingEntry[];
  substanceLogs: SubstanceLog[];
  profile: UserProfile;
  language?: Language;
}

interface RiskWindow {
  hour: number;
  labelEn: string;
  labelFr: string;
  triggerEn: string;
  triggerFr: string;
  eventCount: number;
  levelEn: string;
  levelFr: string;
  isCurrent: boolean;
  isNext: boolean;
}

export const CravingPredictionCard: React.FC<CravingPredictionCardProps> = ({
  cravings,
  substanceLogs,
  profile: _profile,
  language = 'en',
}) => {
  const isFr = language === 'fr';
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  // Dynamically refresh current hour as time elapses
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Deduplicate distinct user events: when a slip is logged, it creates a substanceLog
  // and may also create a simultaneous craving entry. We group events within 60s as a single episode.
  const uniqueEpisodes = useMemo(() => {
    const episodes: Array<{ hour: number; trigger?: string }> = [];
    const seenTimes: number[] = [];

    // Substance logs (intake slips)
    substanceLogs.forEach((l) => {
      const t = new Date(l.timestamp).getTime();
      seenTimes.push(t);
      episodes.push({ hour: new Date(l.timestamp).getHours(), trigger: l.trigger });
    });

    // Craving logs (resisted urges and unlinked cravings)
    cravings.forEach((c) => {
      const t = new Date(c.timestamp).getTime();
      const isDuplicate = seenTimes.some((st) => Math.abs(st - t) < 60000);
      if (!isDuplicate) {
        seenTimes.push(t);
        episodes.push({ hour: new Date(c.timestamp).getHours(), trigger: c.trigger });
      }
    });

    return episodes;
  }, [cravings, substanceLogs]);

  const totalEvents = uniqueEpisodes.length;
  const hasSufficientData = totalEvents >= 3;

  // Compute empirical risk windows based strictly on real user logs (no artificial weights)
  const riskWindows: RiskWindow[] = useMemo(() => {
    if (!hasSufficientData) return [];

    const hourlyCounts = new Array(24).fill(0);
    const triggerCounts: Record<number, Record<string, number>> = {};

    uniqueEpisodes.forEach((ep) => {
      hourlyCounts[ep.hour] += 1;
      if (ep.trigger) {
        if (!triggerCounts[ep.hour]) triggerCounts[ep.hour] = {};
        triggerCounts[ep.hour][ep.trigger] = (triggerCounts[ep.hour][ep.trigger] || 0) + 1;
      }
    });

    const sorted = hourlyCounts
      .map((count, hour) => ({ hour, count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    const topThree = sorted.slice(0, 3).sort((a, b) => a.hour - b.hour);
    const nextImpendingIndex = topThree.findIndex(
      (item) => item.hour > currentHour || (currentHour > 20 && item.hour < 10)
    );

    return topThree.map((item, index) => {
      const isCurrent = currentHour === item.hour || currentHour === (item.hour + 1) % 24;
      const isNext = !isCurrent && index === nextImpendingIndex;

      const hFormatted = `${item.hour.toString().padStart(2, '0')}:00`;
      const hEndFormatted = `${((item.hour + 1) % 24).toString().padStart(2, '0')}:30`;

      const triggers = triggerCounts[item.hour] || {};
      let topTrig = '';
      let maxCount = 0;
      Object.entries(triggers).forEach(([trig, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topTrig = trig;
        }
      });

      const fallbackTrig = item.hour < 11
        ? (isFr ? 'Café / Matin' : 'Morning Routine')
        : item.hour < 16
        ? (isFr ? 'Pause / Avant/après repas' : 'Post-Meal Break')
        : (isFr ? 'Soirée détente' : 'Evening Relax');

      const trigLabel = topTrig || fallbackTrig;

      const levelFr = item.count >= 4 ? 'Élevé' : item.count >= 2 ? 'Modéré' : 'Sensible';
      const levelEn = item.count >= 4 ? 'High' : item.count >= 2 ? 'Moderate' : 'Watch';

      return {
        hour: item.hour,
        labelEn: `${hFormatted} - ${hEndFormatted}`,
        labelFr: `${hFormatted} - ${hEndFormatted}`,
        triggerEn: trigLabel,
        triggerFr: trigLabel,
        eventCount: Math.round(item.count),
        levelEn,
        levelFr,
        isCurrent,
        isNext,
      };
    });
  }, [uniqueEpisodes, currentHour, hasSufficientData, isFr]);

  const activeWindow = riskWindows.find((w) => w.isCurrent);
  const nextWindow = riskWindows.find((w) => w.isNext) || riskWindows[0];

  return (
    <MorphicCard variant="obsidian" className="space-y-3.5 relative overflow-hidden border border-emerald-500/30">
      {/* Background sweep glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400">
                {isFr ? 'Moments Sensibles Observés' : 'Observed Craving Windows'}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {hasSufficientData
                  ? (isFr ? `${totalEvents} événements observés` : `${totalEvents} observed events`)
                  : (isFr ? 'Collecte en cours' : 'Collecting data')}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white tracking-tight">
              {isFr ? 'Chronobiologie des Pulsions' : 'Circadian Craving Rhythm'}
            </h4>
          </div>
        </div>

        {/* Live Status Badge */}
        {hasSufficientData && activeWindow ? (
          <div className="px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-extrabold flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>{isFr ? 'Créneau Sensible en Cours' : 'Current Vulnerability Window'}</span>
          </div>
        ) : hasSufficientData && nextWindow ? (
          <div className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>
              {isFr
                ? `Prochain créneau : ${nextWindow.labelFr}`
                : `Next window: ${nextWindow.labelEn}`}
            </span>
          </div>
        ) : null}
      </div>

      {/* Narrative Advice or Insufficient Data State */}
      {!hasSufficientData ? (
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isFr ? 'Données insuffisantes pour établir votre rythme' : 'Insufficient data to map your rhythm'}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isFr
              ? `Vous avez enregistré ${totalEvents}/3 événement(s). Utilisez le bouton SOS dès qu'une envie survient : vos créneaux récurrents et déclencheurs apparaîtront ici automatiquement.`
              : `You have logged ${totalEvents}/3 event(s). Use the SOS button whenever an urge occurs: your recurring peak windows will be revealed here automatically.`}
          </p>
        </div>
      ) : (
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
                  ? `⚠️ Vous êtes dans votre plage horaire historiquement sensible (${activeWindow.labelFr}). Le cerveau associe souvent ce moment à un automatisme. Buvez un grand verre d'eau et faites 3 minutes de respiration.`
                  : `⚠️ You are currently in your historically sensitive window (${activeWindow.labelEn}). Your subconscious associates this moment with routine cues. Drink cold water and take 3 deep breaths.`}
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                {isFr
                  ? "Ces 3 créneaux correspondent aux heures où vos pulsions et prises sont historiquement les plus fréquentes. Anticipez votre stratégie de substitution 15 minutes avant."
                  : "These 3 windows map your historically recorded cravings and intakes. Prepare your sensory substitution 15 minutes before."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3 Predicted Windows Grid (only shown if sufficient data) */}
      {hasSufficientData && (
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
                <span className="text-slate-400">{isFr ? 'Niveau' : 'Level'}</span>
                <span className={w.isCurrent ? 'text-rose-400' : w.isNext ? 'text-amber-400' : 'text-emerald-400'}>
                  {isFr ? w.levelFr : w.levelEn} ({w.eventCount})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </MorphicCard>
  );
};
