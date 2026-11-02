import React, { useEffect, useMemo, useState } from 'react';
import {
  Wind, Brain, Quote as QuoteIcon, Bookmark, Share2, Play, Pause, RotateCcw, Check, ChevronRight, X, Moon,
  BatteryCharging, Sparkles, Library, FlaskConical, MonitorPlay, ShieldQuestion, CalendarClock, Phone,
} from 'lucide-react';
import type { PsychologyLesson, SleepEnergyEntry, Language } from '../types';
import type { CoreReport } from '../core/obsidianCore';
import { getLessons } from '../utils/psychologyLessons';
import {
  getStudies, getResources, getMyths, getTimeline, getQuotes,
} from '../content/library';
import type { StudyTopic, QuoteItem } from '../content/library';
import { computeSleepEnergyCorrelation } from '../utils/sleepTracker';
import { MorphicCard } from './MorphicCard';
import { WeeklyTrendChart } from './WeeklyTrendChart';
import { sound } from '../utils/audio';

type Technique = '4-7-8' | 'box' | 'calm';
type WellnessTab = 'mind' | 'library' | 'sleep' | 'breathe' | 'quotes';
type LibraryTab = 'studies' | 'resources' | 'myths' | 'timeline';

interface WellnessViewProps {
  report: CoreReport;
  sleepEnergyLogs: SleepEnergyEntry[];
  language?: Language;
}

export const WellnessView: React.FC<WellnessViewProps> = ({ report, sleepEnergyLogs, language = 'en' }) => {
  const isFr = language === 'fr';
  const [tab, setTab] = useState<WellnessTab>('mind');
  const [libTab, setLibTab] = useState<LibraryTab>('studies');
  const [studyTopic, setStudyTopic] = useState<StudyTopic | 'All'>('All');
  const [resourceType, setResourceType] = useState<string>('All');
  const [timelineKind, setTimelineKind] = useState<'nicotine' | 'cannabis'>('nicotine');
  const [selectedLesson, setSelectedLesson] = useState<PsychologyLesson | null>(null);

  // breathing
  const [technique, setTechnique] = useState<Technique>('4-7-8');
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [secs, setSecs] = useState(4);
  const [cycles, setCycles] = useState(0);

  // quotes
  const [quoteCat, setQuoteCat] = useState<QuoteItem['category'] | 'All'>('All');
  const [bookmarks, setBookmarks] = useState<string[]>(['ql1', 'ql27']);
  const [copied, setCopied] = useState<string | null>(null);

  const corr = computeSleepEnergyCorrelation(sleepEnergyLogs);

  const lessons = getLessons(language);
  const studies = getStudies(language);
  const resources = getResources(language);
  const myths = getMyths(language);
  const timeline = getTimeline(timelineKind, language);
  const quotes = getQuotes(language);

  const TECHNIQUES: Record<Technique, { name: string; inhale: number; hold: number; exhale: number; pause: number; desc: string }> = useMemo(() => ({
    '4-7-8': {
      name: isFr ? 'Sérénité 4-7-8' : '4-7-8 Tranquility',
      inhale: 4, hold: 7, exhale: 8, pause: 0,
      desc: isFr
        ? 'Ralentit le rythme cardiaque et déclenche le réflexe parasympathique. Idéal lors d\'une pulsion vive.'
        : 'Slows the heart and shifts the body toward calm. Ideal for sudden cravings.',
    },
    box: {
      name: isFr ? 'Respiration Carrée 4-4-4-4' : 'Box Breathing 4-4-4-4',
      inhale: 4, hold: 4, exhale: 4, pause: 4,
      desc: isFr
        ? 'Respiration égale et rythmée utilisée par les forces spéciales pour garder son sang-froid sous stress.'
        : 'Even, steady breathing used to stay composed under pressure.',
    },
    calm: {
      name: isFr ? 'Flux Résonant 5-6' : 'Resonant Flow 5-6',
      inhale: 5, hold: 0, exhale: 6, pause: 0,
      desc: isFr
        ? 'Respiration douce à six respirations par minute, optimisant la variabilité de la fréquence cardiaque.'
        : 'Slow breathing near six breaths a minute supports heart-rate variability.',
    },
  }), [isFr]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSecs((prev) => {
        if (prev > 1) return prev - 1;
        const cfg = TECHNIQUES[technique];
        if (phase === 'Inhale') {
          if (cfg.hold > 0) { setPhase('Hold'); return cfg.hold; }
          sound.playBreathTone(true); setPhase('Exhale'); return cfg.exhale;
        }
        if (phase === 'Hold') { sound.playBreathTone(true); setPhase('Exhale'); return cfg.exhale; }
        if (phase === 'Exhale' && cfg.pause > 0) { setPhase('Pause'); return cfg.pause; }
        sound.playBreathTone(false); setCycles((c) => c + 1); setPhase('Inhale'); return cfg.inhale;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, phase, technique, TECHNIQUES]);

  const startStop = () => {
    if (!running) { sound.playBreathTone(false); setPhase('Inhale'); setSecs(TECHNIQUES[technique].inhale); }
    setRunning(!running);
  };
  const resetBreath = () => { setRunning(false); setPhase('Inhale'); setSecs(TECHNIQUES[technique].inhale); setCycles(0); };

  const TABS: Array<{ id: WellnessTab; label: string; icon: React.ElementType }> = [
    { id: 'mind', label: isFr ? 'Mental' : 'Mind', icon: Brain },
    { id: 'library', label: isFr ? 'Bibliothèque' : 'Library', icon: Library },
    { id: 'sleep', label: isFr ? 'Sommeil' : 'Sleep', icon: Moon },
    { id: 'breathe', label: isFr ? 'Respirer' : 'Breathe', icon: Wind },
    { id: 'quotes', label: isFr ? 'Citations' : 'Quotes', icon: QuoteIcon },
  ];

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap border transition-all ${
      active ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'
    }`;

  const topicOptions: Array<{ id: StudyTopic | 'All'; label: string }> = [
    { id: 'All', label: isFr ? 'Tous les sujets' : 'All' },
    { id: 'Quitting', label: isFr ? 'Sevrage' : 'Quitting' },
    { id: 'Nicotine', label: 'Nicotine' },
    { id: 'Cannabis', label: 'Cannabis' },
    { id: 'Vaping', label: isFr ? 'Vape / Puffs' : 'Vaping' },
    { id: 'Sleep', label: isFr ? 'Sommeil' : 'Sleep' },
    { id: 'Mindset', label: isFr ? 'Psychologie' : 'Mindset' },
    { id: 'Habits', label: isFr ? 'Habitudes' : 'Habits' },
  ];

  const typeOptions: Array<{ id: string; label: string }> = [
    { id: 'All', label: isFr ? 'Tous les formats' : 'All' },
    { id: 'Talk', label: isFr ? 'Conférences TED' : 'Talk' },
    { id: 'Documentary', label: isFr ? 'Documentaires' : 'Documentary' },
    { id: 'Book', label: isFr ? 'Livres recommandés' : 'Book' },
    { id: 'Free help', label: isFr ? 'Numéros gratuits' : 'Free help' },
  ];

  const quoteCatOptions: Array<{ id: QuoteItem['category'] | 'All'; label: string }> = [
    { id: 'All', label: isFr ? 'Toutes' : 'All' },
    { id: 'Starting', label: isFr ? 'Démarrage' : 'Starting' },
    { id: 'Resilience', label: isFr ? 'Résilience' : 'Resilience' },
    { id: 'Habits', label: isFr ? 'Habitudes' : 'Habits' },
    { id: 'Health', label: isFr ? 'Santé' : 'Health' },
    { id: 'Calm', label: isFr ? 'Sérénité' : 'Calm' },
    { id: 'Identity', label: isFr ? 'Identité' : 'Identity' },
  ];

  const phaseLabel = () => {
    if (!running) return isFr ? 'Prêt' : 'Ready';
    if (phase === 'Inhale') return isFr ? 'Inspirez' : 'Inhale';
    if (phase === 'Hold') return isFr ? 'Bloquez' : 'Hold';
    if (phase === 'Exhale') return isFr ? 'Expirez' : 'Exhale';
    return isFr ? 'Pause' : 'Pause';
  };

  const phaseTone =
    phase === 'Inhale' ? 'border-emerald-400 text-emerald-300 scale-100' :
    phase === 'Hold' ? 'border-amber-400 text-amber-300 scale-100' :
    phase === 'Exhale' ? 'border-teal-400 text-teal-300 scale-95' : 'border-slate-500 text-slate-300 scale-95';

  return (
    <div className="space-y-5 pb-28 animate-fade-in">
      {/* Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-slate-900/60 border border-white/10">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { sound.playClick(); setTab(t.id); }}
              className={`py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'}`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-semibold">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* MIND */}
      {tab === 'mind' && (
        <div className="space-y-3">
          <MorphicCard variant="emerald">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><Brain className="w-5 h-5" /></div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isFr ? 'Masterclasses Psychologie & Mental' : 'Psychology & Mindset Masterclasses'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isFr ? `${lessons.length} cours cliniques sur l'addiction, la dopamine et le cerveau` : `${lessons.length} free lessons on addiction, habits and the brain`}
                </p>
              </div>
            </div>
          </MorphicCard>
          {lessons.map((l) => (
            <MorphicCard key={l.id} variant="elevated" onClick={() => { sound.playClick(); setSelectedLesson(l); }} className="group">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="text-emerald-400 font-bold uppercase tracking-wider">{l.category}</span>
                    <span>·</span><span>{l.duration}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors mt-0.5">{l.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">{l.subtitle}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 ml-3" />
              </div>
            </MorphicCard>
          ))}
        </div>
      )}

      {/* LIBRARY */}
      {tab === 'library' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-900/60 border border-white/10">
            {([
              { id: 'studies', label: isFr ? 'Études' : 'Studies', icon: FlaskConical },
              { id: 'resources', label: isFr ? 'Médias' : 'Watch & Read', icon: MonitorPlay },
              { id: 'myths', label: isFr ? 'Mythes' : 'Myths', icon: ShieldQuestion },
              { id: 'timeline', label: isFr ? 'Étapes' : 'Timeline', icon: CalendarClock },
            ] as const).map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => { sound.playClick(); setLibTab(t.id); }} className={`py-1.5 rounded-xl flex flex-col items-center gap-0.5 ${libTab === t.id ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400'}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold">{t.label}</span>
                </button>
              );
            })}
          </div>

          {libTab === 'studies' && (
            <div className="space-y-3">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {topicOptions.map((opt) => (
                  <button key={opt.id} onClick={() => setStudyTopic(opt.id)} className={chip(studyTopic === opt.id)}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                {isFr
                  ? `${studies.filter((s) => studyTopic === 'All' || s.topic === studyTopic).length} études médicales avec comités de lecture (BMJ, NEJM, Lancet)`
                  : `${studies.filter((s) => studyTopic === 'All' || s.topic === studyTopic).length} peer-reviewed studies and public-health sources`}
              </p>
              {studies.filter((s) => studyTopic === 'All' || s.topic === studyTopic).map((s) => (
                <MorphicCard key={s.id} variant="default" className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{s.topic}</span>
                    <span className="text-[10px] text-slate-400">{s.year}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-snug">{s.title}</h4>
                  <p className="text-[10px] text-slate-400 italic">{s.source}</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.finding}</p>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{s.takeaway}</span>
                  </div>
                </MorphicCard>
              ))}
              <p className="text-[10px] text-slate-400 text-center">
                {isFr ? 'Résumés synthétisés pour la clarté. Recherchez le titre pour lire l\'étude originale.' : 'Summaries are simplified for readability. Search the title to read the original source. Not medical advice.'}
              </p>
            </div>
          )}

          {libTab === 'resources' && (
            <div className="space-y-3">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {typeOptions.map((opt) => (
                  <button key={opt.id} onClick={() => setResourceType(opt.id)} className={chip(resourceType === opt.id)}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {resources.filter((r) => resourceType === 'All' || r.type === resourceType).map((r) => (
                <MorphicCard key={r.id} variant="default" className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${r.type === 'Free help' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'}`}>
                      {r.type === 'Free help' && <Phone className="w-3 h-3 inline mr-1" />}{r.type}
                    </span>
                    {r.year && <span className="text-[10px] text-slate-400">{r.year}</span>}
                  </div>
                  <h4 className="text-sm font-bold text-white">{r.title}</h4>
                  <p className="text-[11px] text-emerald-400 font-semibold">{r.creator}</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{r.why}</p>
                </MorphicCard>
              ))}
            </div>
          )}

          {libTab === 'myths' && (
            <div className="space-y-3">
              {myths.map((m) => (
                <MorphicCard key={m.id} variant="default" className="space-y-2">
                  <div className="flex gap-2 text-xs"><span className="font-bold text-rose-400 shrink-0">{isFr ? 'Mythe' : 'Myth'}</span><span className="text-slate-200 font-semibold">{m.myth}</span></div>
                  <div className="flex gap-2 text-xs"><span className="font-bold text-emerald-400 shrink-0">{isFr ? 'Réalité' : 'Fact'}</span><span className="text-slate-300 leading-relaxed">{m.fact}</span></div>
                </MorphicCard>
              ))}
            </div>
          )}

          {libTab === 'timeline' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setTimelineKind('nicotine')} className={chip(timelineKind === 'nicotine')}>
                  {isFr ? 'Nicotine (cigarettes & puffs)' : 'Nicotine (cigs & vape)'}
                </button>
                <button onClick={() => setTimelineKind('cannabis')} className={chip(timelineKind === 'cannabis')}>
                  {isFr ? 'Cannabis / Joints' : 'Cannabis'}
                </button>
              </div>
              {timeline.map((w, i) => (
                <MorphicCard key={w.when} variant="default" className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-extrabold flex items-center justify-center">{i + 1}</span>
                    <h4 className="text-sm font-bold text-white">{w.when}</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{w.what}</p>
                  <p className="text-[11px] text-amber-400"><b>{isFr ? 'Conseil pratique : ' : 'Tip: '}</b>{w.tip}</p>
                </MorphicCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SLEEP */}
      {tab === 'sleep' && (
        <div className="space-y-4">
          <MorphicCard variant="elevated" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"><Moon className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-sm font-bold text-white">{isFr ? 'Bilan Hebdomadaire du Sommeil' : 'Your Week'}</h3>
                  <p className="text-[11px] text-slate-400">
                    {isFr
                      ? `${report.weeklySummary.cleanDays}/7 jours sans fumer · ${report.weeklySummary.loggedDays} bilans notés`
                      : `${report.weeklySummary.cleanDays}/7 clean days · ${report.weeklySummary.loggedDays} logged`}
                  </p>
                </div>
              </div>
            </div>
            <WeeklyTrendChart points={report.weekly} />
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl glass-panel text-center">
                <div className="text-[10px] text-slate-400">{isFr ? 'Moyenne Sommeil' : 'Avg sleep'}</div>
                <div className="text-xl font-extrabold text-indigo-400 tabular-nums">{report.weeklySummary.avgSleep ?? '–'}</div>
              </div>
              <div className="p-3 rounded-2xl glass-panel text-center">
                <div className="text-[10px] text-slate-400">{isFr ? 'Moyenne Énergie' : 'Avg energy'}</div>
                <div className="text-xl font-extrabold text-emerald-400 tabular-nums">{report.weeklySummary.avgEnergy ?? '–'}</div>
              </div>
            </div>
          </MorphicCard>

          <MorphicCard variant="obsidian" className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {isFr ? 'Jours propres vs Jours avec consommation' : 'Clean days vs heavy days'}
            </h4>
            {corr.hasEnoughData ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl glass-panel">
                  <div className="text-[10px] font-bold uppercase text-indigo-400 flex items-center gap-1"><Moon className="w-3 h-3" />{isFr ? 'Sommeil' : 'Sleep'}</div>
                  <div className="text-xl font-extrabold text-white tabular-nums">{corr.avgCleanSleep}<span className="text-[10px] text-slate-400">{isFr ? ' propre' : ' clean'}</span></div>
                  <div className="text-[10px] text-slate-400">{isFr ? `vs ${corr.avgHeavySleep} chargé` : `vs ${corr.avgHeavySleep} heavy`}</div>
                </div>
                <div className="p-3 rounded-2xl glass-panel">
                  <div className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1"><BatteryCharging className="w-3 h-3" />{isFr ? 'Énergie' : 'Energy'}</div>
                  <div className="text-xl font-extrabold text-white tabular-nums">{corr.avgCleanEnergy}<span className="text-[10px] text-slate-400">{isFr ? ' propre' : ' clean'}</span></div>
                  <div className="text-[10px] text-slate-400">{isFr ? `vs ${corr.avgHeavyEnergy} chargé` : `vs ${corr.avgHeavyEnergy} heavy`}</div>
                </div>
              </div>
            ) : null}
            <p className="text-xs text-slate-300 leading-relaxed">{corr.insightSummary}</p>
          </MorphicCard>

          <MorphicCard variant="default" className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {isFr ? 'Historique Récent' : 'Recent records'}
            </h4>
            {sleepEnergyLogs.slice(0, 7).map((log) => {
              const t = log.substancesLogged.cigarette + log.substancesLogged.puff_vape + log.substancesLogged.cannabis;
              return (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between text-xs gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <b className="text-white">{log.date}</b>
                      <span className={`text-[9px] px-1.5 rounded-full border font-bold ${t === 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                        {t === 0 ? (isFr ? 'Propre' : 'Clean') : (isFr ? `${t} consommés` : `${t} logged`)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{log.notes || (isFr ? 'Bilan quotidien' : 'Daily check-in')}</p>
                  </div>
                  <div className="flex gap-3 text-right shrink-0">
                    <div><div className="text-[9px] text-indigo-400 font-bold">{isFr ? 'Sommeil' : 'Sleep'}</div><b className="text-white">{log.sleepRating}</b></div>
                    <div><div className="text-[9px] text-emerald-400 font-bold">{isFr ? 'Énergie' : 'Energy'}</div><b className="text-white">{log.energyRating}</b></div>
                  </div>
                </div>
              );
            })}
          </MorphicCard>
        </div>
      )}

      {/* BREATHE */}
      {tab === 'breathe' && (
        <MorphicCard variant="emerald" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><Wind className="w-5 h-5" /></div>
              <div>
                <h3 className="text-sm font-bold text-white">{isFr ? 'Studio de Respiration Guidée' : 'Breathing Studio'}</h3>
                <p className="text-[11px] text-slate-400">{isFr ? 'Désamorcez n\'importe quelle pulsion en 3 minutes' : 'Calm a craving in 3 minutes'}</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{cycles} {isFr ? 'cycles' : 'cycles'}</span>
          </div>

          <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-900/50 border border-white/10">
            {(Object.keys(TECHNIQUES) as Technique[]).map((t) => (
              <button
                key={t}
                onClick={() => { sound.playClick(); setTechnique(t); setRunning(false); setPhase('Inhale'); setSecs(TECHNIQUES[t].inhale); }}
                className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${technique === t ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300' : 'text-slate-400'}`}
              >
                {t === '4-7-8' ? '4-7-8' : t === 'box' ? (isFr ? 'Carrée' : 'Box') : (isFr ? 'Résonant' : 'Resonant')}
              </button>
            ))}
          </div>

          <div className="text-center py-2">
            <div className={`w-44 h-44 mx-auto rounded-full glass-panel-elevated flex flex-col items-center justify-center border-2 shadow-2xl transition-all duration-1000 ${phaseTone}`}>
              <span className="text-[11px] uppercase tracking-widest font-bold opacity-80">{phaseLabel()}</span>
              <span className="text-5xl font-extrabold my-0.5 tabular-nums">{running ? secs : '·'}</span>
              <span className="text-[10px] text-slate-400">{TECHNIQUES[technique].name}</span>
            </div>
            <p className="text-xs text-slate-300 max-w-xs mx-auto mt-4">{TECHNIQUES[technique].desc}</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={startStop} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xl transition-all keep-white ${running ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 hover:scale-105'}`}>
                {running ? <><Pause className="w-4 h-4" />{isFr ? 'Pause' : 'Pause'}</> : <><Play className="w-4 h-4" />{isFr ? 'Commencer' : 'Begin'}</>}
              </button>
              <button onClick={resetBreath} title="Reset" className="p-2.5 rounded-xl glass-button text-slate-400"><RotateCcw className="w-4 h-4" /></button>
            </div>
          </div>
        </MorphicCard>
      )}

      {/* QUOTES */}
      {tab === 'quotes' && (
        <div className="space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {quoteCatOptions.map((opt) => (
              <button key={opt.id} onClick={() => setQuoteCat(opt.id)} className={chip(quoteCat === opt.id)}>
                {opt.label}
              </button>
            ))}
          </div>
          {quotes.filter((q) => quoteCat === 'All' || q.category === quoteCat).map((q) => {
            const saved = bookmarks.includes(q.id);
            return (
              <MorphicCard key={q.id} variant="default">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{q.category}</span>
                    <p className="text-sm font-medium text-white italic leading-relaxed">“{q.quote}”</p>
                    <p className="text-xs font-semibold text-emerald-400">{q.author}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => { sound.playClick(); setBookmarks(saved ? bookmarks.filter((b) => b !== q.id) : [...bookmarks, q.id]); }}
                      className={`p-2 rounded-xl border transition-all ${saved ? 'bg-amber-500/20 border-amber-400/40 text-amber-400' : 'glass-button text-slate-400'}`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => { sound.playClick(); navigator.clipboard?.writeText(`"${q.quote}" - ${q.author}`); setCopied(q.id); setTimeout(() => setCopied(null), 1800); }}
                      className="p-2 rounded-xl glass-button text-slate-400"
                    >
                      {copied === q.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </MorphicCard>
            );
          })}
        </div>
      )}

      {/* Lesson modal */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl glass-panel-elevated p-6 border border-white/15 shadow-2xl my-auto">
            <button onClick={() => setSelectedLesson(null)} className="absolute top-5 right-5 w-8 h-8 rounded-full glass-button flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-400 mb-2">
              <span className="uppercase tracking-wider">{selectedLesson.category}</span><span>·</span><span className="text-slate-400">{selectedLesson.duration}</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1 pr-8">{selectedLesson.title}</h3>
            <p className="text-xs text-slate-400 mb-4">{selectedLesson.subtitle}</p>
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <b className="block mb-1">{isFr ? 'Principe fondamental' : 'Core principle'}</b>
                {selectedLesson.summary}
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  {isFr ? 'Enseignements clés' : 'Key insights'}
                </span>
                {selectedLesson.keyInsights.map((t, i) => (
                  <div key={i} className="flex gap-2 p-2.5 rounded-xl bg-slate-900/40 border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span><span>{t}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  {isFr ? 'Analyse neurobiologique approfondie' : 'Deep dive'}
                </span>
                {selectedLesson.biologicalDeepDive.map((p, i) => <p key={i} className="p-3 rounded-2xl bg-slate-900/30 border border-white/5">{p}</p>)}
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  {isFr ? 'Action concrète immédiate' : 'Do this now'}
                </span>
                {selectedLesson.actionableMicroSteps.map((t, i) => (
                  <div key={i} className="flex gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300"><Check className="w-4 h-4 shrink-0 mt-0.5" /><span>{t}</span></div>
                ))}
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
              <button onClick={() => setSelectedLesson(null)} className="px-5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                {isFr ? 'J\'ai compris' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
