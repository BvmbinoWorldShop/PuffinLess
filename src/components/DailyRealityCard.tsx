import React, { useState } from 'react';
import { Eye, Flame, Clock, HeartCrack, Wallet, Wind, Cigarette, Leaf, Plus, X, AlertTriangle, Sparkles, Minus } from 'lucide-react';
import type { UserProfile, SubstanceType } from '../types';
import type { DailyReality } from '../core/obsidianCore';
import { MorphicCard } from './MorphicCard';
import { sound } from '../utils/audio';

type Period = 'day' | 'year' | 'decade';
const DAYS: Record<Period, number> = { day: 1, year: 365, decade: 3650 };

interface Props {
  profile: UserProfile;
  reality: DailyReality;
  todayIntake?: { cigarette: number; puff_vape: number; cannabis: number };
  onOpenLog?: (substance: SubstanceType) => void;
  onLogSubstance?: (substance: SubstanceType, count: number, trigger: string, note?: string) => void;
  onRemoveSubstance?: (substance: SubstanceType, count?: number) => void;
}

const TRIGGERS = [
  { id: 'Stress', fr: 'Stress', en: 'Stress' },
  { id: 'After meal', fr: 'Après repas', en: 'After meal' },
  { id: 'Social', fr: 'Soirée / Amis', en: 'Social' },
  { id: 'Boredom', fr: 'Ennui', en: 'Boredom' },
  { id: 'Work break', fr: 'Pause travail', en: 'Work break' },
  { id: 'Other', fr: 'Autre', en: 'Other' },
];

export const DailyRealityCard: React.FC<Props> = ({
  profile,
  reality,
  todayIntake,
  onOpenLog,
  onLogSubstance,
  onRemoveSubstance,
}) => {
  const isFr = profile.language === 'fr';
  const [period, setPeriod] = useState<Period>('day');
  const [sourceMode, setSourceMode] = useState<'today' | 'baseline'>(() => {
    if (todayIntake && (todayIntake.cigarette > 0 || todayIntake.puff_vape > 0 || todayIntake.cannabis > 0)) {
      return 'today';
    }
    return 'baseline';
  });

  const [quickLogSubstance, setQuickLogSubstance] = useState<SubstanceType | null>(null);
  const [quickLogCount, setQuickLogCount] = useState<number>(1);
  const [quickLogTrigger, setQuickLogTrigger] = useState<string>('Stress');

  const d = DAYS[period];

  // Unit costs
  const costPerCig = profile.cigarettesInPack > 0 ? profile.pricePerPack / profile.cigarettesInPack : 0.6;
  const costPerPuff = (profile.podPrice ?? 18) / 600;
  const costPerGram = profile.pricePerGram ?? 10;

  const activeCigs = sourceMode === 'today' && todayIntake ? todayIntake.cigarette : reality.cigarettes;
  const activePuffs = sourceMode === 'today' && todayIntake ? todayIntake.puff_vape : reality.puffs;
  const activeJoints = sourceMode === 'today' && todayIntake ? todayIntake.cannabis : reality.joints;

  const activeCostPerDay =
    sourceMode === 'today' && todayIntake
      ? activeCigs * costPerCig + activePuffs * costPerPuff + activeJoints * (costPerGram * 0.5)
      : reality.cost;

  const activeSmokingMinutes = activeCigs * 7 + activePuffs * 0.2 + activeJoints * 15;
  const activeLifeLostMinutes = (activeCigs + activePuffs / 15) * 11;

  const smokeMin = activeSmokingMinutes * d;
  const lifeMin = activeLifeLostMinutes * d;
  const money = activeCostPerDay * d;
  const cigs = activeCigs * d;
  const packs = cigs / Math.max(1, profile.cigarettesInPack);
  const lineMeters = (cigs * 0.084).toFixed(cigs * 0.084 >= 100 ? 0 : 1);
  const wakingShare = Math.min(100, Math.round((activeSmokingMinutes / 960) * 100));

  const labels: Record<Period, string> = {
    day: isFr ? 'Par jour' : 'Per day',
    year: isFr ? 'Sur 1 an' : '1 Year',
    decade: isFr ? 'Sur 10 ans' : '10 Years',
  };

  const fmtTime = (minutes: number) => {
    if (minutes < 90) return `${Math.round(minutes)} min`;
    const h = minutes / 60;
    if (h < 48) return `${h.toFixed(1)} ${isFr ? 'h' : 'hrs'}`;
    return `${(h / 24).toFixed(1)} ${isFr ? 'jours' : 'days'}`;
  };

  const handleOpenQuickLog = (s: SubstanceType) => {
    sound.playClick();
    if (onLogSubstance) {
      setQuickLogSubstance(s);
      setQuickLogCount(s === 'puff_vape' ? 10 : 1);
      setQuickLogTrigger('Stress');
    } else if (onOpenLog) {
      onOpenLog(s);
    }
  };

  const handleConfirmQuickLog = () => {
    if (!quickLogSubstance) return;
    sound.playWarning(); // warning audio + distinct hapticWarning vibration
    if (onLogSubstance) {
      onLogSubstance(quickLogSubstance, quickLogCount, quickLogTrigger);
    } else if (onOpenLog) {
      onOpenLog(quickLogSubstance);
    }
    setQuickLogSubstance(null);
  };

  const handleQuickUndo = (s: SubstanceType) => {
    sound.playClick();
    if (onRemoveSubstance) {
      onRemoveSubstance(s, s === 'puff_vape' ? 5 : 1);
    }
    setQuickLogSubstance(null);
  };

  return (
    <MorphicCard variant="elevated" className="space-y-4 relative">
      {/* Header & Source Mode Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/25">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {isFr ? 'Votre Réalité & Projection' : 'Your Reality & Projection'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {sourceMode === 'today'
                ? (isFr ? 'Impact projeté à votre rythme réel d\'aujourd\'hui' : 'Projected impact at today\'s real pace')
                : (isFr ? 'Impact de votre profil de base habituel' : 'Impact of your baseline habit profile')}
            </p>
          </div>
        </div>

        {/* Source Toggle: Rythme d'Aujourd'hui vs Profil Initial */}
        <div className="flex p-0.5 rounded-xl bg-slate-900/60 border border-white/10 text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setSourceMode('today');
            }}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
              sourceMode === 'today'
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/35 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{isFr ? 'Aujourd\'hui' : 'Today\'s Pace'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setSourceMode('baseline');
            }}
            className={`px-2 py-1 rounded-lg transition-all ${
              sourceMode === 'baseline'
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/35 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>{isFr ? 'Profil de Base' : 'Baseline'}</span>
          </button>
        </div>
      </div>

      {/* Projection Period Switcher */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-900/60 border border-white/10">
        {(Object.keys(DAYS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => {
              sound.playClick();
              setPeriod(p);
            }}
            className={`py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
              period === p ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {labels[p]}
          </button>
        ))}
      </div>

      {/* Projected Counts */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 rounded-2xl glass-panel flex flex-col items-center justify-between">
          <div>
            <Cigarette className="w-4 h-4 mx-auto text-amber-400" />
            <div className="text-lg font-extrabold text-white mt-1 tabular-nums">{Math.round(cigs).toLocaleString()}</div>
            <div className="text-[10px] text-slate-400">{isFr ? 'cigarettes' : 'cigarettes'}</div>
          </div>
          <button
            onClick={() => handleOpenQuickLog('cigarette')}
            className="mt-2 w-full py-1 rounded-xl glass-button text-[9px] font-bold text-amber-400 flex items-center justify-center gap-0.5 hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-2.5 h-2.5" />
            {isFr ? 'Ajouter' : 'Log'}
          </button>
        </div>
        <div className="p-3 rounded-2xl glass-panel flex flex-col items-center justify-between">
          <div>
            <Wind className="w-4 h-4 mx-auto text-cyan-400" />
            <div className="text-lg font-extrabold text-white mt-1 tabular-nums">{Math.round(activePuffs * d).toLocaleString()}</div>
            <div className="text-[10px] text-slate-400">{isFr ? 'bouffées vape' : 'vape puffs'}</div>
          </div>
          <button
            onClick={() => handleOpenQuickLog('puff_vape')}
            className="mt-2 w-full py-1 rounded-xl glass-button text-[9px] font-bold text-cyan-400 flex items-center justify-center gap-0.5 hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-2.5 h-2.5" />
            {isFr ? 'Ajouter' : 'Log'}
          </button>
        </div>
        <div className="p-3 rounded-2xl glass-panel flex flex-col items-center justify-between">
          <div>
            <Leaf className="w-4 h-4 mx-auto text-lime-400" />
            <div className="text-lg font-extrabold text-white mt-1 tabular-nums">{Math.round(activeJoints * d).toLocaleString()}</div>
            <div className="text-[10px] text-slate-400">{isFr ? 'Cannabis / CBD' : 'Cannabis / CBD'}</div>
          </div>
          <button
            onClick={() => handleOpenQuickLog('cannabis')}
            className="mt-2 w-full py-1 rounded-xl glass-button text-[9px] font-bold text-lime-400 flex items-center justify-center gap-0.5 hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-2.5 h-2.5" />
            {isFr ? 'Ajouter' : 'Log'}
          </button>
        </div>
      </div>

      {/* INLINE QUICK-LOG POPUP AT THE EXACT SAME LEVEL (NO SCROLLING) */}
      {quickLogSubstance && (
        <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-rose-500/40 shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              {isFr
                ? `Enregistrer : ${quickLogSubstance === 'cigarette' ? 'Cigarette' : quickLogSubstance === 'puff_vape' ? 'Puff Vape' : 'Cannabis / CBD'}`
                : `Log intake: ${quickLogSubstance === 'cannabis' ? 'Cannabis / CBD' : quickLogSubstance}`}
            </span>
            <button
              onClick={() => setQuickLogSubstance(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Quantities (+ and -1 correction option) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold text-slate-300">
                {isFr ? 'Quantité consommée :' : 'Quantity consumed:'}
              </label>
              {todayIntake && todayIntake[quickLogSubstance] > 0 && onRemoveSubstance && (
                <button
                  type="button"
                  onClick={() => handleQuickUndo(quickLogSubstance)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold border border-rose-500/40 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all flex items-center gap-1"
                >
                  <Minus className="w-3 h-3" />
                  <span>{isFr ? 'Corriger (-1)' : 'Undo (-1)'}</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(quickLogSubstance === 'puff_vape' ? [5, 10, 15, 20] : [1, 2, 3, 5]).map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setQuickLogCount(qty);
                  }}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    quickLogCount === qty
                      ? 'bg-rose-500/25 border-rose-400 text-rose-200'
                      : 'bg-slate-900/40 border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  +{qty}
                </button>
              ))}
            </div>
          </div>

          {/* Triggers */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-1">
              {isFr ? 'Déclencheur contextuel :' : 'Contextual trigger:'}
            </label>
            <div className="flex items-center gap-1 flex-wrap">
              {TRIGGERS.map((trig) => (
                <button
                  key={trig.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setQuickLogTrigger(trig.id);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-all ${
                    quickLogTrigger === trig.id
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                      : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {isFr ? trig.fr : trig.en}
                </button>
              ))}
            </div>
          </div>

          {/* Validation & Cancel */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setQuickLogSubstance(null)}
              className="py-1.5 rounded-xl glass-button text-xs font-semibold text-slate-300"
            >
              {isFr ? 'Annuler' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirmQuickLog}
              className="py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white keep-white font-bold text-xs shadow-md shadow-rose-500/25 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              {isFr ? 'Valider la prise' : 'Confirm intake'}
            </button>
          </div>
        </div>
      )}

      {/* Consequences & Projections */}
      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center justify-between p-3 rounded-2xl glass-panel">
          <span className="flex items-center gap-2 text-xs text-slate-300">
            <Wallet className="w-4 h-4 text-amber-400" />
            {isFr ? 'Argent consumé à ce rythme' : 'Money burned at this pace'}
          </span>
          <span className="text-sm font-extrabold text-amber-300 tabular-nums">{profile.currency}{Math.round(money).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl glass-panel">
          <span className="flex items-center gap-2 text-xs text-slate-300">
            <Clock className="w-4 h-4 text-sky-400" />
            {isFr ? 'Temps passé à inhaler' : 'Time spent smoking'}
          </span>
          <span className="text-sm font-extrabold text-sky-300 tabular-nums">{fmtTime(smokeMin)}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl glass-panel">
          <span className="flex items-center gap-2 text-xs text-slate-300">
            <HeartCrack className="w-4 h-4 text-rose-400" />
            {isFr ? 'Espérance de vie perdue estimée' : 'Estimated life lost'}
          </span>
          <span className="text-sm font-extrabold text-rose-300 tabular-nums">{fmtTime(lifeMin)}</span>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
        <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
          <Flame className="w-3.5 h-3.5" />
          {isFr ? 'Mise en perspective de votre rythme' : 'Pace clinical perspective'}
        </div>
        {activeCigs > 0 ? (
          <p>
            {isFr
              ? `À ce rythme journalier, vous consommez environ `
              : `At this daily rate, you consume about `}
            <b className="text-white">{Math.round(cigs).toLocaleString()} {isFr ? 'cigarettes' : 'cigarettes'}</b>
            {isFr ? ` (soit ` : ` (about `}
            <b className="text-white">{Math.round(packs).toLocaleString()} {isFr ? 'paquets' : 'packs'}</b>)
            {isFr ? `, formant une ligne ininterrompue de ` : `, forming an unbroken line of `}
            <b className="text-white">{lineMeters} m</b> {isFr ? `de long (~${wakingShare}% de temps d'éveil passé à fumer).` : `long (~${wakingShare}% of waking hours spent smoking).`}
          </p>
        ) : (
          <p className="text-emerald-400 font-medium">
            {isFr
              ? '✨ À votre rythme d\'aujourd\'hui (0 consommation), vous ne perdez aucun temps de vie ni argent !'
              : '✨ At today\'s clean pace (0 intake), you lose zero life time or money!'}
          </p>
        )}
        <p className="text-[10px] text-slate-400">
          {isFr
            ? 'Temps de vie calculé d\'après l\'étude du British Medical Journal (2000) : environ 11 minutes par cigarette. Visualiser cet impact cumulé aide le cerveau à ralentir et se désengager.'
            : 'Life lost uses the BMJ (2000) estimate of ~11 min per cigarette. Visualizing this cumulative impact creates the pause needed to slow down.'}
        </p>
      </div>
    </MorphicCard>
  );
};
