import React, { useState } from 'react';
import {
  Activity, CheckCircle, ChevronRight, Wind, ShieldCheck, Cigarette, Leaf, Plus, Moon,
  BatteryCharging, Sparkles, AlertCircle, Zap, Trophy, TrendingUp, TrendingDown, X, RotateCcw,
} from 'lucide-react';
import type { UserProfile, CravingEntry, SubstanceType, SleepEnergyEntry } from '../types';
import type { CalculatedStats } from '../utils/calculations';
import type { CoreReport } from '../core/obsidianCore';
import { getTierMeta } from '../core/levels';
import { getHealthMilestones } from '../utils/healthMilestones';
import { SUBSTANCE_DATABASE } from '../utils/substanceScience';
import { localDateStr, formatDuration } from '../utils/dates';
import { t, TRIGGER_OPTIONS, getTriggerLabel } from '../utils/i18n';
import { MorphicCard } from './MorphicCard';
import { ObsidianCoreCard } from './ObsidianCoreCard';
import { DailyRealityCard } from './DailyRealityCard';
import { WeeklyTrendChart } from './WeeklyTrendChart';
import { sound } from '../utils/audio';

interface DashboardViewProps {
  profile: UserProfile;
  stats: CalculatedStats;
  report: CoreReport;
  cravings: CravingEntry[];
  sleepEnergyLogs: SleepEnergyEntry[];
  onLogSubstance: (substance: SubstanceType, count: number, trigger?: string) => void;
  onSaveSleepEnergy: (entry: SleepEnergyEntry) => void;
  onOpenSos: () => void;
  onNavigateToTab: (tab: 'money' | 'wellness' | 'rewards') => void;
}

const Delta: React.FC<{ value: number | null }> = ({ value }) => {
  if (value === null || value === 0) return <span className="text-[10px] text-slate-400">no change yet</span>;
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
      <Icon className="w-3 h-3" />
      {up ? '+' : ''}{value} vs earlier
    </span>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  stats,
  report,
  cravings,
  sleepEnergyLogs,
  onLogSubstance,
  onSaveSleepEnergy,
  onOpenSos,
  onNavigateToTab,
}) => {
  const lang = profile.language || 'en';
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [activeSubstance, setActiveSubstance] = useState<SubstanceType>('cigarette');
  const [pending, setPending] = useState<SubstanceType | null>(null);
  const [pendingCount, setPendingCount] = useState(1);
  const [pendingTrigger, setPendingTrigger] = useState<string>('Stress');

  const LOG_OPTIONS: Record<SubstanceType, { label: string; unit: string; counts: number[]; icon: React.ElementType; box: string; text: string }> = {
    cigarette: {
      label: t('substanceCigarette', lang),
      unit: t('unitCigarette', lang),
      counts: [1, 2, 3],
      icon: Cigarette,
      box: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
      text: 'text-amber-400',
    },
    puff_vape: {
      label: t('substancePuff', lang),
      unit: t('unitPuff', lang),
      counts: [5, 10, 20],
      icon: Wind,
      box: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
      text: 'text-cyan-400',
    },
    cannabis: {
      label: t('substanceCannabis', lang),
      unit: t('unitJoint', lang),
      counts: [1, 2],
      icon: Leaf,
      box: 'bg-lime-500/15 text-lime-400 border-lime-500/25',
      text: 'text-lime-400',
    },
  };

  const todayStr = localDateStr();
  const existing = sleepEnergyLogs.find((e) => e.date === todayStr);
  const [sleepScore, setSleepScore] = useState(existing?.sleepRating ?? 7);
  const [energyScore, setEnergyScore] = useState(existing?.energyRating ?? 7);
  const [rated, setRated] = useState(!!existing);

  const { today, weeklySummary: ws } = report;
  const todayTotal = today.cigarette + today.puff_vape + today.cannabis;

  const milestones = getHealthMilestones(lang);
  const achieved = milestones.filter((m) => m.timeSeconds <= stats.elapsedSeconds);
  const upcoming = milestones.filter((m) => m.timeSeconds > stats.elapsedSeconds);
  const nextMilestone = upcoming[0] ?? milestones[milestones.length - 1];
  const sub = SUBSTANCE_DATABASE[activeSubstance];
  const recentCravings = cravings.slice(0, 3);

  const openLog = (s: SubstanceType) => {
    sound.playClick();
    setPending(s);
    setPendingCount(LOG_OPTIONS[s].counts[0]);
  };

  const confirmLog = () => {
    if (!pending) return;
    sound.playClick();
    onLogSubstance(pending, pendingCount, pendingTrigger);
    setPending(null);
  };

  const saveRatings = () => {
    sound.playCelebration();
    onSaveSleepEnergy({
      id: existing?.id ?? 'se-' + Date.now(),
      date: todayStr,
      sleepRating: sleepScore,
      energyRating: energyScore,
      substancesLogged: { cigarette: today.cigarette, puff_vape: today.puff_vape, cannabis: today.cannabis },
      notes: 'Logged from dashboard',
    });
    setRated(true);
  };

  const tierMeta = getTierMeta(lang);
  const levelChip = `${tierMeta[stats.level.tier].name} · ${lang === 'fr' ? 'Niveau' : 'Level'} ${stats.level.levelNumber}`;

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      {/* 1. Clean Breath Counter */}
      <MorphicCard variant="emerald" className="border-emerald-500/30">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">{t('cleanBreathTitle', lang)}</span>
          </div>
          <button
            onClick={() => { sound.playClick(); onNavigateToTab('rewards'); }}
            className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
          >
            {levelChip}
          </button>
        </div>

        <div className="relative grid grid-cols-4 gap-2 sm:gap-3 py-2 text-center">
          {[
            { v: stats.days, l: t('days', lang) },
            { v: String(stats.hours).padStart(2, '0'), l: t('hours', lang) },
            { v: String(stats.minutes).padStart(2, '0'), l: t('mins', lang) },
            { v: String(stats.seconds).padStart(2, '0'), l: t('secs', lang), accent: true },
          ].map((c) => (
            <div key={c.l} className="p-3 rounded-2xl glass-panel">
              <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${c.accent ? 'text-emerald-400' : 'text-white'}`}>{c.v}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mt-1">{c.l}</div>
            </div>
          ))}
        </div>

        {stats.level.next && (
          <div className="relative mt-3 space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-slate-300">{t('nextWin', lang)}: {stats.level.next.title}</span>
              <span className="text-slate-400 tabular-nums">{formatDuration(stats.level.remainingSeconds)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800/60 overflow-hidden border border-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-1000" style={{ width: `${stats.level.progressPercent}%` }} />
            </div>
          </div>
        )}

        <div className="relative mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div><div className="font-extrabold text-white tabular-nums">{formatDuration(stats.bestStreakSeconds)}</div><div className="text-slate-400">{t('bestStreak', lang)}</div></div>
          <div><div className="font-extrabold text-white tabular-nums">{stats.relapseCount}</div><div className="text-slate-400">{t('restarts', lang)}</div></div>
          <div><div className="font-extrabold text-emerald-400 tabular-nums">+{stats.lifeRegainedHours}h</div><div className="text-slate-400">{t('lifeRegained', lang)}</div></div>
        </div>
      </MorphicCard>

      {/* 2. Craving CTA */}
      <button
        onClick={() => { sound.playBreathTone(); onOpenSos(); }}
        className="w-full flex items-center justify-between p-4 rounded-3xl glass-panel-rose text-left group hover:scale-[1.01] active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white">{t('cravingCardTitle', lang)}</h4>
            <p className="text-[11px] text-slate-400">{t('cravingCardSub', lang)}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-rose-400 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* 3. Obsidian Core */}
      <ObsidianCoreCard report={report} language={lang} />

      {/* 4. Intake counter */}
      <MorphicCard variant="elevated" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25"><Cigarette className="w-4 h-4" /></div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{t('intakeTitle', lang)}</h3>
              <p className="text-[11px] text-slate-400">{t('intakeSub', lang)}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-300 tabular-nums">{todayTotal} {t('totalLogged', lang)}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(LOG_OPTIONS) as SubstanceType[]).map((s) => {
            const o = LOG_OPTIONS[s];
            const Icon = o.icon;
            const val = today[s];
            return (
              <div key={s} className="p-3 rounded-2xl glass-panel flex flex-col items-center text-center">
                <div className={`p-2 rounded-xl mb-1.5 border ${o.box}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-white">{o.label}</span>
                <span className={`text-xl font-extrabold my-0.5 tabular-nums ${o.text}`}>{val}</span>
                <button
                  onClick={() => openLog(s)}
                  className={`mt-1 w-full py-1.5 rounded-xl glass-button text-[10px] font-bold flex items-center justify-center gap-1 ${o.text}`}
                >
                  <Plus className="w-3 h-3" />{t('logButton', lang)}
                </button>
              </div>
            );
          })}
        </div>

        {todayTotal === 0 ? (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{t('nothingLogged', lang)}</span>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{t('counterRestarted', lang)} ({formatDuration(stats.bestStreakSeconds)} sauvegardée).</span>
          </div>
        )}
      </MorphicCard>

      {/* 5. Daily reality */}
      <DailyRealityCard profile={profile} reality={report.reality} />

      {/* 6. Sleep & energy check-in + weekly trend */}
      <MorphicCard variant="elevated" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"><Moon className="w-4 h-4" /></div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{t('sleepEnergyTitle', lang)}</h3>
              <p className="text-[11px] text-slate-400">{t('sleepEnergySub', lang)}</p>
            </div>
          </div>
          {rated && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">{t('loggedCheck', lang)}</span>}
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5"><Moon className="w-3.5 h-3.5 text-indigo-400" />{t('sleepLabel', lang)}</span>
              <span className="font-bold text-indigo-400">{sleepScore}/10</span>
            </div>
            <input type="range" min={1} max={10} value={sleepScore} onChange={(e) => { setSleepScore(Number(e.target.value)); setRated(false); }} className="w-full accent-indigo-500 cursor-pointer" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5"><BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />{t('energyLabel', lang)}</span>
              <span className="font-bold text-emerald-400">{energyScore}/10</span>
            </div>
            <input type="range" min={1} max={10} value={energyScore} onChange={(e) => { setEnergyScore(Number(e.target.value)); setRated(false); }} className="w-full accent-emerald-500 cursor-pointer" />
          </div>

          <button
            onClick={saveRatings}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 text-white keep-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            {t('saveCheckin', lang)}
          </button>
        </div>

        {/* Weekly Trend Chart */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">
              {lang === 'fr' ? 'Tendance 7 Jours : Sommeil vs Consommation' : '7-Day Trend: Sleep vs. Intake'}
            </span>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400" />{lang === 'fr' ? 'Sommeil' : 'Sleep'}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />{lang === 'fr' ? 'Énergie' : 'Energy'}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" />{lang === 'fr' ? 'Doses' : 'Intake'}</span>
            </div>
          </div>
          <WeeklyTrendChart points={report.weekly} />
        </div>

        {/* Dynamic Correlations */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-white/5">
            <div className="text-[10px] text-slate-400">
              {lang === 'fr' ? 'Sommeil moy. (jours sobres)' : 'Avg sleep (clean days)'}
            </div>
            <div className="text-base font-extrabold text-emerald-400 tabular-nums">
              {ws.avgSleep !== null ? `${ws.avgSleep}/10` : '—'}
            </div>
            <Delta value={ws.sleepDelta} />
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-white/5">
            <div className="text-[10px] text-slate-400">
              {lang === 'fr' ? 'Énergie moy. (jours sobres)' : 'Avg energy (clean days)'}
            </div>
            <div className="text-base font-extrabold text-emerald-400 tabular-nums">
              {ws.avgEnergy !== null ? `${ws.avgEnergy}/10` : '—'}
            </div>
            <Delta value={ws.energyDelta} />
          </div>
        </div>
      </MorphicCard>

      {/* 7. Next Milestone */}
      <MorphicCard variant="default">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('nextWin', lang)}</h4>
          </div>
          <span className="text-[11px] font-bold text-amber-400">
            {achieved.length}/{milestones.length} {lang === 'fr' ? 'validés' : 'achieved'}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-950/80 border border-amber-500/25">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-amber-300">{nextMilestone.label}</span>
            <span className="text-[10px] font-semibold text-slate-400">{lang === 'fr' ? 'Objectif' : 'Target'}</span>
          </div>
          <h5 className="text-sm font-bold text-white mb-1">{nextMilestone.title}</h5>
          <p className="text-xs text-slate-300">{nextMilestone.description}</p>
        </div>
      </MorphicCard>

      {/* 8. Substance science switcher */}
      <MorphicCard variant="default" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'fr' ? 'Science des Substances' : 'Substance Science'}
            </h4>
          </div>
          <div className="flex gap-1">
            {(['cigarette', 'puff_vape', 'cannabis'] as SubstanceType[]).map((s) => (
              <button
                key={s}
                onClick={() => { sound.playClick(); setActiveSubstance(s); }}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                  activeSubstance === s ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' : 'bg-slate-900/40 border-white/5 text-slate-400'
                }`}
              >
                {LOG_OPTIONS[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
          <h5 className="text-xs font-bold text-white">{sub.name}</h5>
          <p className="text-[11px] text-amber-300/90 font-medium">{sub.tagline}</p>
          <p className="text-xs text-slate-300">{sub.healthEffects.summary}</p>
          <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px] text-slate-300">
            <div><b className="text-rose-400">{lang === 'fr' ? 'Cardiovasculaire :' : 'Cardiovascular:'}</b> {sub.healthEffects.cardiovascular}</div>
            <div><b className="text-cyan-400">{lang === 'fr' ? 'Pulmonaire :' : 'Pulmonary:'}</b> {sub.healthEffects.pulmonary}</div>
            <div><b className="text-indigo-400">{lang === 'fr' ? 'Sommeil & Cerveau :' : 'Sleep/Brain:'}</b> {sub.healthEffects.neuroSleep}</div>
          </div>
          <p className="text-[10px] text-slate-400 pt-1 italic border-t border-white/5">{sub.clinicalStudyReference}</p>
        </div>
      </MorphicCard>

      {/* 9. Vitals slider */}
      <MorphicCard variant="default">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'fr' ? 'Paliers de Santé Biologiques' : 'Health Milestones'}
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            {achieved.length} {lang === 'fr' ? 'validés' : 'complete'}
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {milestones.slice(0, 8).map((m) => {
            const isDone = m.timeSeconds <= stats.elapsedSeconds;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMilestoneId(selectedMilestoneId === m.id ? null : m.id)}
                className={`shrink-0 w-44 p-3 rounded-2xl border cursor-pointer transition-all ${
                  isDone ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/40 border-white/5 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                  <span className={isDone ? 'text-emerald-400' : 'text-slate-400'}>{m.label}</span>
                  {isDone ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-[9px] text-slate-400">{lang === 'fr' ? 'À débloquer' : 'Locked'}</span>}
                </div>
                <div className="text-xs font-bold text-white truncate">{m.title}</div>
                {selectedMilestoneId === m.id && <p className="mt-2 pt-2 border-t border-white/10 text-xs text-slate-300">{m.description}</p>}
              </div>
            );
          })}
        </div>
      </MorphicCard>

      {/* 10. Recent wins */}
      <MorphicCard variant="default">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('cravingsBeaten', lang)}</h4>
          </div>
          <span className="text-xs font-bold text-emerald-400">{stats.cravingsResistedCount} {t('totalLogged', lang)}</span>
        </div>
        {recentCravings.length === 0 ? (
          <p className="text-xs text-slate-400">{t('noCravingsYet', lang)}</p>
        ) : (
          <div className="space-y-2">
            {recentCravings.map((c) => (
              <div key={c.id} className="p-2.5 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between text-xs">
                <span>
                  <b className="text-white">{getTriggerLabel(c.trigger, lang)}</b>
                  {c.substance && <span className="text-slate-400 ml-1">({t(('substance' + (c.substance === 'cigarette' ? 'Cigarette' : c.substance === 'puff_vape' ? 'Puff' : 'Cannabis')) as any, lang)})</span>}
                  <span className="text-slate-400 ml-1">{t('intensity', lang)} {c.intensity}/10</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-400">{t('resistedCheck', lang)}</span>
              </div>
            ))}
          </div>
        )}
      </MorphicCard>

      {/* Comprehensive Intake Modal: Substance, Count & Trigger/Motivation */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-panel-elevated p-5 sm:p-6 border border-white/15 shadow-2xl">
            <button
              onClick={() => setPending(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full glass-button flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">{t('logSubstanceTitle', lang)}</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {t('logSubstanceSub', lang)}
            </p>

            {/* 1. Substance Selector */}
            <div className="mb-3.5">
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                {t('selectSubstance', lang)}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['cigarette', 'puff_vape', 'cannabis'] as SubstanceType[]).map((s) => {
                  const o = LOG_OPTIONS[s];
                  const Icon = o.icon;
                  const isSelected = pending === s;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        sound.playClick();
                        setPending(s);
                        setPendingCount(LOG_OPTIONS[s].counts[0]);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="truncate">{o.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Quantity Selector */}
            <div className="mb-3.5">
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                {t('selectQuantity', lang)}
              </label>
              <div className="flex gap-2">
                {LOG_OPTIONS[pending].counts.map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      sound.playClick();
                      setPendingCount(n);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      pendingCount === n
                        ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-sm'
                        : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {n} {LOG_OPTIONS[pending].unit}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Motivation / Trigger Selector */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                {t('selectMotivation', lang)}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TRIGGER_OPTIONS.map((trig) => {
                  const isSelected = pendingTrigger === trig.id;
                  const label = lang === 'fr' ? trig.labelFr : trig.labelEn;
                  return (
                    <button
                      key={trig.id}
                      onClick={() => {
                        sound.playClick();
                        setPendingTrigger(trig.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                        isSelected
                          ? 'bg-rose-500/30 border-rose-400 text-rose-200 shadow-sm'
                          : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPending(null)}
                className="py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-300"
              >
                {t('cancel', lang)}
              </button>
              <button
                onClick={confirmLog}
                className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white keep-white text-xs font-bold shadow-lg shadow-rose-500/25 hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                {t('logAndRestart', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
