import React from 'react';
import { BrainCircuit, Trophy, AlertTriangle, Lightbulb, Info, Clock, Target, Cigarette } from 'lucide-react';
import type { CoreReport, InsightTone } from '../core/obsidianCore';
import type { Language } from '../types';
import { formatHour } from '../utils/dates';
import { getTriggerLabel } from '../utils/i18n';
import { MorphicCard } from './MorphicCard';

const TONE: Record<InsightTone, { icon: React.ElementType; chip: string }> = {
  win: { icon: Trophy, chip: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  alert: { icon: AlertTriangle, chip: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  tip: { icon: Lightbulb, chip: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  info: { icon: Info, chip: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
};

interface Props {
  report: CoreReport;
  language?: Language;
}

export const ObsidianCoreCard: React.FC<Props> = ({ report, language = 'en' }) => {
  const isFr = language === 'fr';
  const { habit } = report;
  const chips: Array<{ icon: React.ElementType; label: string }> = [];

  if (habit.peakHour !== null) {
    chips.push({
      icon: Clock,
      label: isFr ? `Heure critique vers ${formatHour(habit.peakHour)}` : `Danger hour ${formatHour(habit.peakHour)}`,
    });
  }
  if (habit.topTrigger) {
    chips.push({
      icon: Target,
      label: isFr ? `Déclencheur n°1 : ${getTriggerLabel(habit.topTrigger, language)}` : `Top trigger: ${habit.topTrigger}`,
    });
  }
  if (habit.topSubstance) {
    const subLabel = isFr
      ? (habit.topSubstance === 'puff_vape' ? 'vape' : habit.topSubstance === 'cannabis' ? 'cannabis' : 'cigarettes')
      : (habit.topSubstance === 'puff_vape' ? 'puffs' : habit.topSubstance === 'cannabis' ? 'cannabis' : 'cigarettes');
    chips.push({
      icon: Cigarette,
      label: isFr ? `Plus consommé : ${subLabel}` : `Most logged: ${subLabel}`,
    });
  }

  return (
    <MorphicCard variant="obsidian" className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <span className="absolute inset-0 rounded-2xl bg-emerald-400/40 blur-md animate-pulse" />
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 flex items-center justify-center border border-white/30 shadow-lg">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">Obsidian Core</span>
            <span className="text-[10px] text-slate-400">
              {isFr ? `mémorise ${habit.memoryEvents} événements` : `remembers ${habit.memoryEvents} moments`}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white tracking-tight leading-tight mt-0.5">{report.greeting}</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{report.headline}</p>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const Icon = c.icon;
            return (
              <span key={c.label} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold glass-panel text-slate-300">
                <Icon className="w-3 h-3 text-emerald-400" />
                {c.label}
              </span>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        {report.insights.map((ins) => {
          const t = TONE[ins.tone];
          const Icon = t.icon;
          return (
            <div key={ins.id} className="flex items-start gap-2.5 p-3 rounded-2xl glass-panel">
              <div className={`p-1.5 rounded-lg border shrink-0 ${t.chip}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-snug">{ins.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{ins.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </MorphicCard>
  );
};
