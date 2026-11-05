import React, { useState } from 'react';
import { Eye, Flame, Clock, HeartCrack, Wallet, Wind, Cigarette, Leaf, Plus, X, Sparkles, Minus, RotateCcw } from 'lucide-react';
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

const SUBSTANCES_CONFIG: Record<
  SubstanceType,
  {
    labelFr: string;
    labelEn: string;
    unitFr: string;
    unitEn: string;
    icon: React.ComponentType<{ className?: string }>;
    colorText: string;
    colorBg: string;
    colorBorder: string;
    quickAddCounts: number[];
    quickUndoStep: number;
  }
> = {
  cigarette: {
    labelFr: 'Cigarettes',
    labelEn: 'Cigarettes',
    unitFr: 'cig',
    unitEn: 'cigs',
    icon: Cigarette,
    colorText: 'text-amber-400',
    colorBg: 'bg-amber-500/15',
    colorBorder: 'border-amber-500/30',
    quickAddCounts: [1, 2, 3, 5],
    quickUndoStep: 1,
  },
  puff_vape: {
    labelFr: 'Puff / Vape',
    labelEn: 'Puff / Vape',
    unitFr: 'bouffées',
    unitEn: 'puffs',
    icon: Wind,
    colorText: 'text-cyan-400',
    colorBg: 'bg-cyan-500/15',
    colorBorder: 'border-cyan-500/30',
    quickAddCounts: [5, 10, 15, 20],
    quickUndoStep: 5,
  },
  cannabis: {
    labelFr: 'Cannabis / CBD',
    labelEn: 'Cannabis / CBD',
    unitFr: 'joint / g',
    unitEn: 'joint / g',
    icon: Leaf,
    colorText: 'text-lime-400',
    colorBg: 'bg-lime-500/15',
    colorBorder: 'border-lime-500/30',
    quickAddCounts: [1, 2, 3],
    quickUndoStep: 1,
  },
};

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

  // Respect selected substances from settings strictly (if none selected, all start from 0)
  const habits = profile.habits ?? [];
  const allowsCig = habits.includes('cigarette');
  const allowsPuff = habits.includes('puff_vape');
  const allowsCannabis = habits.includes('cannabis');

  const rawCigs = sourceMode === 'today' && todayIntake ? todayIntake.cigarette : reality.cigarettes;
  const rawPuffs = sourceMode === 'today' && todayIntake ? todayIntake.puff_vape : reality.puffs;
  const rawJoints = sourceMode === 'today' && todayIntake ? todayIntake.cannabis : reality.joints;

  const activeCigs = allowsCig ? rawCigs : 0;
  const activePuffs = allowsPuff ? rawPuffs : 0;
  const activeJoints = allowsCannabis ? rawJoints : 0;

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
    if (quickLogSubstance === s) {
      setQuickLogSubstance(null);
    } else {
      setQuickLogSubstance(s);
      setQuickLogCount(SUBSTANCES_CONFIG[s].quickAddCounts[0]);
      setQuickLogTrigger('Stress');
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

  const handleQuickUndo = (s: SubstanceType, stepCount?: number) => {
    sound.playClick();
    sound.vibrate(15);
    if (onRemoveSubstance) {
      const step = stepCount ?? SUBSTANCES_CONFIG[s].quickUndoStep;
      onRemoveSubstance(s, step);
    }
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

      {/* Projected Counts with easy + Add and -1 Correction */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {(['cigarette', 'puff_vape', 'cannabis'] as SubstanceType[]).map((s) => {
          const cfg = SUBSTANCES_CONFIG[s];
          const Icon = cfg.icon;
          const allowed = habits.length === 0 || habits.includes(s);
          const rawCount =
            s === 'cigarette' ? (activeCigs * d) :
            s === 'puff_vape' ? (activePuffs * d) :
            (activeJoints * d);
          const countDisplay = allowed ? Math.round(rawCount).toLocaleString() : '0';
          const todayCount = todayIntake ? todayIntake[s] : 0;
          const isSelected = quickLogSubstance === s;

          return (
            <div
              key={s}
              className={`p-3 rounded-2xl glass-panel flex flex-col items-center justify-between transition-all ${
                isSelected ? 'ring-2 ring-rose-400/80 bg-rose-500/15 shadow-md shadow-rose-500/20 scale-[1.02]' : ''
              } ${!allowed ? 'opacity-40' : ''}`}
            >
              <div className="w-full">
                <div className={`w-8 h-8 rounded-xl mx-auto flex items-center justify-center border mb-1.5 ${cfg.colorBg} ${cfg.colorBorder} ${cfg.colorText}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-lg font-extrabold text-white tabular-nums">{countDisplay}</div>
                <div className="text-[10px] text-slate-400 truncate">{isFr ? cfg.labelFr : cfg.labelEn}</div>
                {todayIntake && sourceMode === 'today' && (
                  <div className="text-[9px] text-slate-400 mt-0.5 tabular-nums">
                    {isFr ? 'Aujourd\'hui :' : 'Today:'} <b className={todayCount > 0 ? 'text-rose-400' : 'text-emerald-400'}>{todayCount}</b>
                  </div>
                )}
              </div>

              {/* Action Buttons: Add (+) and Correct (-1) */}
              <div className="mt-2 flex items-center gap-1 w-full pt-1 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => handleOpenQuickLog(s)}
                  className={`flex-1 py-1 rounded-xl text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all ${
                    isSelected
                      ? 'bg-rose-500 text-white keep-white shadow-sm'
                      : `glass-button ${cfg.colorText} hover:scale-105 active:scale-95`
                  }`}
                  title={isFr ? `Ajouter : ${cfg.labelFr}` : `Log ${cfg.labelEn}`}
                >
                  <Plus className="w-3 h-3" />
                  <span>{isSelected ? (isFr ? 'Fermer' : 'Close') : (isFr ? 'Ajouter' : 'Log')}</span>
                </button>

                {onRemoveSubstance && (
                  <button
                    type="button"
                    onClick={() => handleQuickUndo(s, cfg.quickUndoStep)}
                    disabled={todayCount <= 0}
                    className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all ${
                      todayCount > 0
                        ? 'border border-rose-500/40 bg-rose-500/20 text-rose-300 hover:bg-rose-500/35 hover:scale-105 active:scale-95 shadow-sm'
                        : 'border border-white/5 bg-slate-900/30 text-slate-600 cursor-not-allowed opacity-40'
                    }`}
                    title={isFr ? `Corriger (-${cfg.quickUndoStep} ${cfg.unitFr})` : `Undo (-${cfg.quickUndoStep} ${cfg.unitEn})`}
                  >
                    <Minus className="w-2.5 h-2.5" />
                    <span>{cfg.quickUndoStep === 1 ? '-1' : `-${cfg.quickUndoStep}`}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* INLINE QUICK-LOG & CORRECTION POPUP AT THE EXACT SAME LEVEL (NO SCROLLING) */}
      {quickLogSubstance && (
        <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-rose-500/40 shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">
                {isFr
                  ? `Saisie & Correction : ${SUBSTANCES_CONFIG[quickLogSubstance].labelFr}`
                  : `Log & Correction: ${SUBSTANCES_CONFIG[quickLogSubstance].labelEn}`}
              </span>
            </div>
            <button
              onClick={() => setQuickLogSubstance(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Switch between all 3 substances */}
          <div className="flex gap-1.5">
            {(['cigarette', 'puff_vape', 'cannabis'] as SubstanceType[]).map((s) => {
              const cfg = SUBSTANCES_CONFIG[s];
              const Icon = cfg.icon;
              const isSelected = quickLogSubstance === s;
              const cnt = todayIntake ? todayIntake[s] : 0;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setQuickLogSubstance(s);
                    setQuickLogCount(cfg.quickAddCounts[0]);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-rose-500/25 border-rose-400 text-rose-200 shadow-sm'
                      : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{isFr ? cfg.labelFr : cfg.labelEn}</span>
                  {cnt > 0 && (
                    <span className="text-[9px] px-1 py-0.2 rounded-full bg-rose-500/30 text-rose-300 font-extrabold">
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Today's status & Instant Correction Button (-1) */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-[10px] text-slate-400">{isFr ? 'Enregistré aujourd\'hui :' : 'Logged today:'}</span>
              <b className={`font-extrabold ${todayIntake && todayIntake[quickLogSubstance] > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {todayIntake ? todayIntake[quickLogSubstance] : 0} {isFr ? SUBSTANCES_CONFIG[quickLogSubstance].unitFr : SUBSTANCES_CONFIG[quickLogSubstance].unitEn}
              </b>
            </div>

            {onRemoveSubstance && (
              <button
                type="button"
                onClick={() => handleQuickUndo(quickLogSubstance, SUBSTANCES_CONFIG[quickLogSubstance].quickUndoStep)}
                disabled={!todayIntake || todayIntake[quickLogSubstance] <= 0}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 transition-all ${
                  todayIntake && todayIntake[quickLogSubstance] > 0
                    ? 'border-rose-500/50 bg-rose-500/25 text-rose-200 hover:bg-rose-500/40 active:scale-95 shadow-sm'
                    : 'border-white/5 bg-slate-900/40 text-slate-600 opacity-40 cursor-not-allowed'
                }`}
                title={isFr ? 'Annuler ou corriger une erreur' : 'Undo or fix a mistake'}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>
                  -{SUBSTANCES_CONFIG[quickLogSubstance].quickUndoStep} {isFr ? 'Corriger' : 'Undo'}
                </span>
              </button>
            )}
          </div>

          {/* Quick Add Quantities */}
          <div>
            <label className="text-[10px] font-semibold text-slate-300 block mb-1">
              {isFr ? 'Ou ajouter une prise :' : 'Or log consumption:'}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {SUBSTANCES_CONFIG[quickLogSubstance].quickAddCounts.map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setQuickLogCount(qty);
                  }}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    quickLogCount === qty
                      ? 'bg-rose-500/25 border-rose-400 text-rose-200 shadow-sm'
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
              {isFr ? 'Fermer' : 'Close'}
            </button>
            <button
              type="button"
              onClick={handleConfirmQuickLog}
              className="py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white keep-white font-bold text-xs shadow-md shadow-rose-500/25 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              {isFr ? `Valider (+${quickLogCount})` : `Confirm (+${quickLogCount})`}
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
