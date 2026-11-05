import React, { useState } from 'react';
import { Eye, Flame, Clock, HeartCrack, Wallet, Wind, Cigarette, Leaf, Sparkles } from 'lucide-react';
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
}

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
}) => {
  const isFr = profile.language === 'fr';
  const [period, setPeriod] = useState<Period>('day');
  const [sourceMode, setSourceMode] = useState<'today' | 'baseline'>('today');

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

          return (
            <div
              key={s}
              className={`p-3 rounded-2xl glass-panel flex flex-col items-center justify-between transition-all ${
                !allowed ? 'opacity-40' : ''
              }`}
            >
              <div className="w-full">
                <div className={`w-8 h-8 rounded-xl mx-auto flex items-center justify-center border mb-1.5 ${cfg.colorBg} ${cfg.colorBorder} ${cfg.colorText}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-lg font-extrabold text-white tabular-nums">{countDisplay}</div>
                <div className="text-[10px] text-slate-400 truncate">{isFr ? cfg.labelFr : cfg.labelEn}</div>
              </div>

              {/* Clear, effortless comparative view: Today vs Baseline Settings (No + or - buttons) */}
              <div className="w-full mt-2.5 pt-2 border-t border-white/5 space-y-1 text-[10px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span>{isFr ? 'Aujourd\'hui :' : 'Today:'}</span>
                  <b className={todayCount > 0 ? 'text-amber-400 font-extrabold' : 'text-emerald-400 font-extrabold'}>
                    {todayCount} {cfg.unitFr}
                  </b>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>{isFr ? 'Profil de base :' : 'Base habit:'}</span>
                  <b className="text-slate-300">
                    {s === 'cigarette' ? reality.cigarettes : s === 'puff_vape' ? reality.puffs : reality.joints} {cfg.unitFr}
                  </b>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
