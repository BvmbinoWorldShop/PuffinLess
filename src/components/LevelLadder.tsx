import React from 'react';
import { Check, Lock, Flag, Crown, Medal, Sparkles } from 'lucide-react';
import { getLevelGoals, getTierMeta } from '../core/levels';
import type { LevelTier } from '../core/levels';
import type { CalculatedStats } from '../utils/calculations';
import type { Language } from '../types';
import { formatDuration } from '../utils/dates';
import { MorphicCard } from './MorphicCard';

const TIER_STYLE: Record<LevelTier, { ring: string; chip: string; icon: React.ElementType }> = {
  beginner: { ring: 'from-emerald-400 to-teal-500', chip: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: Flag },
  intermediate: { ring: 'from-amber-400 to-orange-500', chip: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Medal },
  expert: { ring: 'from-fuchsia-400 to-indigo-500', chip: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30', icon: Crown },
};

interface LevelLadderProps {
  stats: CalculatedStats;
  language?: Language;
}

export const LevelLadder: React.FC<LevelLadderProps> = ({ stats, language = 'en' }) => {
  const isFr = language === 'fr';
  const goalsList = getLevelGoals(language);
  const tierMeta = getTierMeta(language);

  // Compute tier completion
  const completedGoals = goalsList.filter((g) => g.seconds <= stats.elapsedSeconds);
  const nextGoal = goalsList.find((g) => g.seconds > stats.elapsedSeconds) ?? null;
  const currentRankTitle = completedGoals.length > 0
    ? completedGoals[completedGoals.length - 1].title
    : (isFr ? 'Nouveau Départ' : 'Fresh Start');
  const activeTier: LevelTier = nextGoal ? nextGoal.tier : 'expert';

  const prevSec = completedGoals.length > 0 ? completedGoals[completedGoals.length - 1].seconds : 0;
  const progressPct = nextGoal
    ? Math.min(100, Math.max(0, ((stats.elapsedSeconds - prevSec) / (nextGoal.seconds - prevSec)) * 100))
    : 100;
  const remainingSec = nextGoal ? nextGoal.seconds - stats.elapsedSeconds : 0;

  const tiers: LevelTier[] = ['beginner', 'intermediate', 'expert'];

  return (
    <div className="space-y-4">
      <MorphicCard variant="obsidian" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
              {isFr ? 'Votre Rang Actuel' : 'Your Rank'}
            </span>
            <h3 className="text-lg font-extrabold text-white tracking-tight">{currentRankTitle}</h3>
            <p className="text-[11px] text-slate-400">
              {tierMeta[activeTier].name} · {isFr ? `Niveau ${completedGoals.length} sur ${goalsList.length}` : `Level ${completedGoals.length} of ${goalsList.length}`}
            </p>
          </div>
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${TIER_STYLE[activeTier].ring} flex items-center justify-center shadow-xl border border-white/30`}>
            <Sparkles className="w-7 h-7 text-white" />
          </div>
        </div>

        {nextGoal ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                {isFr ? 'Prochain jalon :' : 'Next:'} {nextGoal.title} ({nextGoal.label})
              </span>
              <span className="text-slate-400 tabular-nums">
                {formatDuration(remainingSec)} {isFr ? 'restant' : 'left'}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-800/70 overflow-hidden border border-white/5">
              <div className={`h-full rounded-full bg-gradient-to-r ${TIER_STYLE[activeTier].ring} transition-all duration-1000`} style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-[11px] text-slate-400">{nextGoal.blurb}</p>
          </div>
        ) : (
          <p className="text-xs text-emerald-400 font-semibold">
            {isFr ? 'Vous avez franchi tous les paliers. Libre pour toujours.' : 'You have completed every level. Free forever.'}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 text-center pt-1">
          <div className="p-2.5 rounded-xl glass-panel">
            <div className="text-sm font-extrabold text-white tabular-nums">{formatDuration(stats.elapsedSeconds)}</div>
            <div className="text-[10px] text-slate-400">{isFr ? 'série actuelle' : 'current streak'}</div>
          </div>
          <div className="p-2.5 rounded-xl glass-panel">
            <div className="text-sm font-extrabold text-white tabular-nums">{formatDuration(stats.bestStreakSeconds)}</div>
            <div className="text-[10px] text-slate-400">{isFr ? 'meilleure série' : 'best streak'}</div>
          </div>
        </div>
      </MorphicCard>

      {tiers.map((tier) => {
        const tierGoals = goalsList.filter((g) => g.tier === tier);
        const doneCount = tierGoals.filter((g) => g.seconds <= stats.elapsedSeconds).length;
        const TierIcon = TIER_STYLE[tier].icon;
        return (
          <MorphicCard key={tier} variant="default" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl border ${TIER_STYLE[tier].chip}`}>
                  <TierIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{tierMeta[tier].name}</h4>
                  <p className="text-[11px] text-slate-400">{tierMeta[tier].tagline}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TIER_STYLE[tier].chip}`}>
                {doneCount}/{tierGoals.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {tierGoals.map((g) => {
                const done = g.seconds <= stats.elapsedSeconds;
                const isNext = nextGoal?.id === g.id;
                return (
                  <div
                    key={g.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      done ? 'bg-emerald-500/10 border-emerald-500/25' : isNext ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900/40 border-white/5 opacity-80'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {done ? <Check className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{g.title}</span>
                        {isNext && <span className="text-[9px] font-bold px-1.5 rounded bg-amber-500/20 text-amber-400">{isFr ? 'PROCHAIN' : 'NEXT'}</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{g.blurb}</p>
                    </div>
                    <span className="text-[11px] font-bold text-slate-300 shrink-0">{g.label}</span>
                  </div>
                );
              })}
            </div>
          </MorphicCard>
        );
      })}
    </div>
  );
};
