import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark, Share2, Play, Pause, RotateCcw, Check, ChevronRight, X, Moon,
  BatteryCharging, Sparkles, FlaskConical, MonitorPlay, ShieldQuestion, CalendarClock, Phone,
  BookOpen,
} from 'lucide-react';
import type { PsychologyLesson, SleepEnergyEntry, Language, SubstanceLog, CravingEntry } from '../types';
import type { CoreReport } from '../core/obsidianCore';
import { getLessons } from '../utils/psychologyLessons';
import {
  getStudies, getResources, getMyths, getTimeline,
} from '../content/library';
import type { StudyTopic, ResourceItem } from '../content/library';
import { computeSleepEnergyCorrelation } from '../utils/sleepTracker';
import { MorphicCard } from './MorphicCard';
import { WeeklyTrendChart } from './WeeklyTrendChart';
import { CalendarTrendCard } from './CalendarTrendCard';
import { sound } from '../utils/audio';
import { Wellness3DIcon } from './Wellness3DIcon';
import { getRotatingDailyQuote, DAILY_QUOTES, DAILY_QUOTES_FR } from '../utils/storage';

type Technique = '4-7-8' | 'box' | 'calm';
type WellnessTab = 'mind' | 'library' | 'sleep' | 'breathe' | 'quotes';
type LibraryTab = 'studies' | 'resources' | 'myths' | 'timeline';

interface WellnessViewProps {
  report: CoreReport;
  sleepEnergyLogs: SleepEnergyEntry[];
  substanceLogs?: SubstanceLog[];
  cravings?: CravingEntry[];
  language?: Language;
}

export const WellnessView: React.FC<WellnessViewProps> = ({
  report,
  sleepEnergyLogs,
  substanceLogs,
  cravings,
  language = 'en',
}) => {
  const isFr = language === 'fr';
  const [tab, setTab] = useState<WellnessTab>('mind');
  const [libTab, setLibTab] = useState<LibraryTab>('studies');
  const [studyTopic, setStudyTopic] = useState<StudyTopic | 'All'>('All');
  const [resourceType, setResourceType] = useState<string>('All');
  const [timelineKind, setTimelineKind] = useState<'nicotine' | 'cannabis'>('nicotine');
  const [selectedLesson, setSelectedLesson] = useState<PsychologyLesson | null>(null);
  const [selectedBook, setSelectedBook] = useState<ResourceItem | null>(null);

  // breathing
  const [technique, setTechnique] = useState<Technique>('4-7-8');
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [secs, setSecs] = useState(4);
  const [cycles, setCycles] = useState(0);

  // quotes
  const [quoteCat, setQuoteCat] = useState<string>('All');
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('puffinless_quote_bookmarks');
      return saved ? JSON.parse(saved) : ['ql1', 'ql27'];
    } catch {
      return ['ql1', 'ql27'];
    }
  });
  const [copied, setCopied] = useState<string | null>(null);

  const toggleBookmark = (id: string) => {
    sound.playClick();
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((b) => b !== id) : [id, ...prev];
      try {
        localStorage.setItem('puffinless_quote_bookmarks', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const corr = computeSleepEnergyCorrelation(sleepEnergyLogs, isFr);

  const formatLessonCat = (cat: string) => {
    if (!isFr) return cat;
    const map: Record<string, string> = {
      'Biology of Craving': 'Biologie du Manque',
      'Habit Rewiring': 'Recâblage des Habitudes',
      'Identity & Mindset': 'Identité & Psychologie',
      'Dopamine & Brain': 'Dopamine & Cerveau',
      'Relapse Recovery': 'Surmonter les Faux Pas',
      'Substance Guides': 'Guides Substances',
    };
    return map[cat] || cat;
  };

  const formatStudyTopicLabel = (topic: string) => {
    if (!isFr) return topic;
    const map: Record<string, string> = {
      'Quitting': 'Sevrage',
      'Nicotine': 'Nicotine',
      'Cannabis': 'Cannabis',
      'Vaping': 'Vape & Puffs',
      'Sleep': 'Sommeil',
      'Mindset': 'Psychologie',
      'Habits': 'Habitudes',
    };
    return map[topic] || topic;
  };

  const formatResourceKind = (type: string) => {
    if (!isFr) return type;
    const map: Record<string, string> = {
      'Talk': 'Conférence TED',
      'Documentary': 'Documentaire',
      'Book': 'Livre',
      'Free help': 'Aide gratuite',
    };
    return map[type] || type;
  };

  const lessons = getLessons(language);
  const studies = getStudies(language);
  const resources = getResources(language);
  const myths = getMyths(language);
  const timeline = getTimeline(timelineKind, language);

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
          if (cfg.hold > 0) {
            sound.vibrate([55, 45, 55]); // firm double tap when entering Hold
            setPhase('Hold');
            return cfg.hold;
          }
          sound.playBreathTone(true);
          sound.vibrate([80, 50, 60, 40]); // descending release rumble for Exhale
          setPhase('Exhale');
          return cfg.exhale;
        }
        if (phase === 'Hold') {
          sound.playBreathTone(true);
          sound.vibrate([80, 50, 60, 40]); // descending release rumble for Exhale
          setPhase('Exhale');
          return cfg.exhale;
        }
        if (phase === 'Exhale' && cfg.pause > 0) {
          sound.vibrate(40); // gentle resting tap for Pause
          setPhase('Pause');
          return cfg.pause;
        }
        sound.playBreathTone(false);
        sound.vibrate([60, 50, 70, 50, 80]); // ascending tactile swell for Inhale
        setCycles((c) => c + 1);
        setPhase('Inhale');
        return cfg.inhale;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, phase, technique, TECHNIQUES]);

  const startStop = () => {
    if (!running) {
      sound.playBreathTone(false);
      sound.vibrate([60, 50, 70]);
      setPhase('Inhale');
      setSecs(TECHNIQUES[technique].inhale);
    } else {
      sound.vibrate(40);
    }
    setRunning(!running);
  };
  const resetBreath = () => {
    sound.vibrate(45);
    setRunning(false);
    setPhase('Inhale');
    setSecs(TECHNIQUES[technique].inhale);
    setCycles(0);
  };

  const TABS: Array<{ id: WellnessTab; label: string }> = [
    { id: 'mind', label: isFr ? 'Mental' : 'Mind' },
    { id: 'library', label: isFr ? 'Bibliothèque' : 'Library' },
    { id: 'sleep', label: isFr ? 'Sommeil' : 'Sleep' },
    { id: 'breathe', label: isFr ? 'Respirer' : 'Breathe' },
    { id: 'quotes', label: isFr ? 'Citations' : 'Quotes' },
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

  const allQuotes = isFr ? DAILY_QUOTES_FR : DAILY_QUOTES;
  const quoteCatOptions = useMemo(() => {
    const cats = Array.from(new Set(allQuotes.map((q) => q.category)));
    return [
      { id: 'All', label: isFr ? 'Toutes' : 'All' },
      ...cats.map((c) => ({ id: c, label: c })),
    ];
  }, [allQuotes, isFr]);

  const filteredQuotes = useMemo(() => {
    const list = quoteCat === 'All' ? allQuotes : allQuotes.filter((q) => q.category === quoteCat);
    // User request: In citation the one saved as favorite comes automatically on top of the list
    return [...list].sort((a, b) => {
      const aFav = bookmarks.includes(a.id) ? 1 : 0;
      const bFav = bookmarks.includes(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav; // Favorites on top
      return 0;
    });
  }, [allQuotes, quoteCat, bookmarks]);

  const phaseLabel = () => {
    if (!running) return isFr ? 'Prêt' : 'Ready';
    if (phase === 'Inhale') return isFr ? 'Inspirez' : 'Inhale';
    if (phase === 'Hold') return isFr ? 'Bloquez' : 'Hold';
    if (phase === 'Exhale') return isFr ? 'Expirez' : 'Exhale';
    return isFr ? 'Pause' : 'Pause';
  };

  return (
    <div className="space-y-5 pb-28 animate-fade-in">
      {/* 3D Colorful Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1.5 rounded-2xl bg-slate-900/70 border border-white/10 shadow-lg">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { sound.playClick(); setTab(t.id); }}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                active
                  ? 'bg-emerald-500/25 text-white border border-emerald-400/50 shadow-md shadow-emerald-500/20 scale-[1.03]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wellness3DIcon type={t.id} size={26} />
              <span className={`text-[10px] font-bold tracking-tight truncate ${active ? 'text-white' : 'text-slate-400'}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* MIND */}
      {tab === 'mind' && (
        <div className="space-y-3">
          <MorphicCard variant="emerald">
            <div className="flex items-center gap-2">
              <Wellness3DIcon type="mind" size={36} />
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
                    <span className="text-emerald-400 font-bold uppercase tracking-wider">{formatLessonCat(l.category)}</span>
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
          <MorphicCard variant="emerald">
            <div className="flex items-center gap-2.5">
              <Wellness3DIcon type="library" size={34} />
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isFr ? 'Bibliothèque Scientifique & Ressources' : 'Scientific Library & Resources'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isFr ? 'Études cliniques évaluées par des pairs, livres de référence et démystification' : 'Peer-reviewed clinical studies, recommended books & myth busting'}
                </p>
              </div>
            </div>
          </MorphicCard>

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
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{formatStudyTopicLabel(s.topic)}</span>
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
              {resources.filter((r) => resourceType === 'All' || r.type === resourceType).map((r) => {
                const isBook = r.type === 'Book';
                return (
                  <MorphicCard
                    key={r.id}
                    variant="default"
                    className={`space-y-1.5 transition-all ${
                      isBook
                        ? 'cursor-pointer hover:border-amber-400/50 hover:bg-slate-900/90 active:scale-[0.99] group shadow-sm hover:shadow-amber-500/10'
                        : ''
                    }`}
                    onClick={() => {
                      if (isBook) {
                        sound.playClick();
                        setSelectedBook(r);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        r.type === 'Free help'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : r.type === 'Book'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                      }`}>
                        {r.type === 'Free help' && <Phone className="w-3 h-3 inline mr-1" />}
                        {r.type === 'Book' && <BookOpen className="w-3 h-3 inline mr-1" />}
                        {formatResourceKind(r.type)}
                      </span>
                      {r.year && <span className="text-[10px] text-slate-400">{r.year}</span>}
                    </div>
                    <h4 className={`text-sm font-bold text-white transition-colors ${isBook ? 'group-hover:text-amber-200' : ''}`}>
                      {r.title}
                    </h4>
                    <p className="text-[11px] text-emerald-400 font-semibold">{r.creator}</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{r.why}</p>

                    {isBook && (
                      <div className="pt-2 mt-1 border-t border-white/5 flex items-center justify-between text-[11px] text-amber-400 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{isFr ? 'Lire l\'extrait & le résumé' : 'Read excerpt & summary'}</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    )}
                  </MorphicCard>
                );
              })}
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
                  {isFr ? 'Cannabis / CBD' : 'Cannabis / CBD'}
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
              <div className="flex items-center gap-2.5">
                <Wellness3DIcon type="sleep" size={34} />
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
            <WeeklyTrendChart points={report.weekly} language={language} />
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

          {/* Calendrier & Habitudes Synchronisé sous Sommeil */}
          <CalendarTrendCard
            substanceLogs={substanceLogs || []}
            sleepLogs={sleepEnergyLogs}
            cravings={cravings || []}
            language={language}
          />
        </div>
      )}

      {/* BREATHE */}
      {tab === 'breathe' && (
        <MorphicCard variant="emerald" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wellness3DIcon type="breathe" size={36} />
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

          {/* LUXURY MULTI-RING INTERACTIVE BREATHING SPHERE */}
          <div className="text-center py-2">
            <div
              onClick={startStop}
              className="relative w-64 h-64 mx-auto flex items-center justify-center my-4 select-none cursor-pointer group active:scale-95 transition-transform"
              title={running ? (isFr ? 'Touchez pour mettre en pause' : 'Tap to pause') : (isFr ? 'Touchez pour démarrer' : 'Tap to start')}
            >
              {/* Outer Glowing Pulse Aura */}
              <div
                className={`absolute inset-0 rounded-full blur-3xl transition-all ${
                  phase === 'Inhale'
                    ? 'bg-gradient-to-tr from-emerald-500/50 via-teal-400/40 to-cyan-400/50 scale-135 opacity-90'
                    : phase === 'Hold'
                    ? 'bg-gradient-to-tr from-amber-500/50 via-yellow-400/40 to-amber-600/50 scale-120 opacity-85 animate-pulse'
                    : phase === 'Exhale'
                    ? 'bg-gradient-to-tr from-teal-500/40 via-indigo-500/35 to-sky-600/40 scale-90 opacity-60'
                    : 'bg-emerald-500/25 scale-100 opacity-40'
                }`}
                style={{
                  transitionDuration: running ? (phase === 'Inhale' ? `${TECHNIQUES[technique].inhale}s` : phase === 'Exhale' ? `${TECHNIQUES[technique].exhale}s` : '1s') : '1s',
                  transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
                }}
              />

              {/* Concentric Outer Ripple Ring */}
              <div
                className={`absolute inset-2 rounded-full border border-dashed transition-all ${
                  phase === 'Inhale'
                    ? 'border-emerald-400/50 scale-120 opacity-80'
                    : phase === 'Hold'
                    ? 'border-amber-400/60 scale-110 opacity-70'
                    : 'border-teal-400/30 scale-95 opacity-40'
                }`}
                style={{
                  transitionDuration: running ? (phase === 'Inhale' ? `${TECHNIQUES[technique].inhale}s` : phase === 'Exhale' ? `${TECHNIQUES[technique].exhale}s` : '1s') : '1s',
                }}
              />

              {/* Concentric Middle Halo Ring with Glow */}
              <div
                className={`absolute inset-5 rounded-full border-2 transition-all ${
                  phase === 'Inhale'
                    ? 'border-emerald-400/70 scale-110 shadow-lg shadow-emerald-500/30'
                    : phase === 'Hold'
                    ? 'border-amber-400/70 scale-105 shadow-lg shadow-amber-500/30 animate-pulse'
                    : 'border-teal-400/40 scale-95'
                }`}
                style={{
                  transitionDuration: running ? (phase === 'Inhale' ? `${TECHNIQUES[technique].inhale}s` : phase === 'Exhale' ? `${TECHNIQUES[technique].exhale}s` : '1s') : '1s',
                }}
              />

              {/* 3D Glass Morphic Interactive Core */}
              <div
                className={`relative w-44 h-44 rounded-full glass-panel-elevated flex flex-col items-center justify-center border-2 shadow-2xl transition-all ${
                  phase === 'Inhale'
                    ? 'border-emerald-400 text-emerald-300 scale-110 shadow-emerald-500/30'
                    : phase === 'Hold'
                    ? 'border-amber-400 text-amber-300 scale-105 shadow-amber-500/30'
                    : phase === 'Exhale'
                    ? 'border-teal-400 text-teal-300 scale-90'
                    : 'border-slate-500 text-slate-300 scale-95'
                }`}
                style={{
                  transitionDuration: running ? (phase === 'Inhale' ? `${TECHNIQUES[technique].inhale}s` : phase === 'Exhale' ? `${TECHNIQUES[technique].exhale}s` : '1s') : '1s',
                  transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
                }}
              >
                <span className="text-[11px] uppercase tracking-widest font-extrabold opacity-90">
                  {phaseLabel()}
                </span>
                <span className="text-5xl font-extrabold my-0.5 tabular-nums tracking-tighter">
                  {running ? secs : '·'}
                </span>
                <span className="text-[10px] text-slate-300 font-semibold">
                  {running ? (isFr ? 'Touchez pour pause' : 'Tap to pause') : (isFr ? 'Touchez pour démarrer' : 'Tap to begin')}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-xs mx-auto mt-2 leading-relaxed">{TECHNIQUES[technique].desc}</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={startStop} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xl transition-all keep-white ${running ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 hover:scale-105'}`}>
                {running ? <><Pause className="w-4 h-4" />{isFr ? 'Pause' : 'Pause'}</> : <><Play className="w-4 h-4" />{isFr ? 'Commencer' : 'Begin'}</>}
              </button>
              <button onClick={resetBreath} title="Reset" className="p-2.5 rounded-xl glass-button text-slate-400"><RotateCcw className="w-4 h-4" /></button>
            </div>
          </div>
        </MorphicCard>
      )}

      {/* QUOTES & LITERATURE */}
      {tab === 'quotes' && (
        <div className="space-y-4">
          {/* Daily Spotlight Wisdom Card with Real Author & Book */}
          {(() => {
            const dailyQuote = getRotatingDailyQuote(isFr ? 'fr' : 'en');
            return (
              <div className="p-4 rounded-3xl glass-panel-gold border border-amber-500/35 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wellness3DIcon type="quotes" size={26} />
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                      {isFr ? 'Citation Phare du Jour' : 'Daily Spotlight Wisdom'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/30">
                    {dailyQuote.category}
                  </span>
                </div>
                <p className="text-sm italic text-white font-medium leading-relaxed">
                  « {dailyQuote.quote} »
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 text-xs flex-wrap gap-2">
                  <span className="font-bold text-white">— {dailyQuote.author}</span>
                  {dailyQuote.book && (
                    <span className="text-[11px] text-amber-400 font-medium italic">
                      📖 {dailyQuote.book}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {quoteCatOptions.map((opt) => (
              <button key={opt.id} onClick={() => setQuoteCat(opt.id)} className={chip(quoteCat === opt.id)}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Dynamic rotating quote library from clinical authors */}
          {filteredQuotes.map((q) => {
            const saved = bookmarks.includes(q.id);
            return (
              <MorphicCard key={q.id} variant="default">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{q.category}</span>
                      {saved && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                          ★ {isFr ? 'Favori' : 'Favorite'}
                        </span>
                      )}
                      {q.book && (
                        <span className="text-[10px] text-emerald-400 font-medium truncate">📖 {q.book}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-white italic leading-relaxed">“{q.quote}”</p>
                    <p className="text-xs font-semibold text-emerald-400">{q.author}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleBookmark(q.id)}
                      title={saved ? (isFr ? 'Retirer des favoris' : 'Remove favorite') : (isFr ? 'Enregistrer en favori (en haut)' : 'Save as favorite (top)')}
                      className={`p-2 rounded-xl border transition-all ${saved ? 'bg-amber-500/25 border-amber-400/50 text-amber-300 shadow-md shadow-amber-500/20 scale-105' : 'glass-button text-slate-400'}`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current text-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => { sound.playClick(); navigator.clipboard?.writeText(`"${q.quote}" - ${q.author} (${q.book || ''})`); setCopied(q.id); setTimeout(() => setCopied(null), 1800); }}
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
              <span className="uppercase tracking-wider">{formatLessonCat(selectedLesson.category)}</span><span>·</span><span className="text-slate-400">{selectedLesson.duration}</span>
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

      {/* Book snippet & resume modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl glass-panel-elevated p-6 sm:p-7 border border-amber-500/30 shadow-2xl my-auto">
            <button
              onClick={() => { sound.playClick(); setSelectedBook(null); }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full glass-button flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-400 mb-2">
              <span className="uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                📖 {isFr ? 'Livre Recommandé' : 'Recommended Book'}
              </span>
              {selectedBook.year && (
                <>
                  <span>·</span>
                  <span className="text-slate-400">{selectedBook.year}</span>
                </>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-1 pr-8">{selectedBook.title}</h3>
            <p className="text-xs text-emerald-400 font-semibold mb-4">— {selectedBook.creator}</p>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              {/* Snippet / Extrait marquant */}
              {selectedBook.snippet && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider block text-amber-400 mb-1 flex items-center gap-1.5">
                    <span>✨</span>
                    <span>{isFr ? 'Extrait Marquant' : 'Key Excerpt'}</span>
                  </span>
                  <p className="italic font-medium text-xs text-white leading-relaxed">
                    {selectedBook.snippet}
                  </p>
                </div>
              )}

              {/* Résumé & Thèse centrale */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  {isFr ? 'Résumé & Analyse de l\'Œuvre' : 'Book Summary & Core Thesis'}
                </span>
                <p className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 text-slate-300 leading-relaxed">
                  {selectedBook.summary || selectedBook.why}
                </p>
              </div>

              {/* Clé pratique pour le sevrage */}
              {selectedBook.keyTakeaway && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider block text-emerald-400 mb-1 flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>{isFr ? 'Application Pratique PuffinLess' : 'PuffinLess Actionable Protocol'}</span>
                  </span>
                  <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                    {selectedBook.keyTakeaway}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => { sound.playClick(); setSelectedBook(null); }}
                className="px-5 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 text-xs font-bold transition-all"
              >
                {isFr ? 'Fermer la fiche' : 'Close Summary'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
