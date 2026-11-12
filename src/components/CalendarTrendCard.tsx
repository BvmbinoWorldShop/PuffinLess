import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon, BarChart3, ChevronLeft, ChevronRight,
  Sparkles, AlertTriangle, CheckCircle, Info, Moon, BatteryCharging,
  TrendingDown, TrendingUp, Minus, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import type { SubstanceLog, SleepEnergyEntry, CravingEntry, Language, SubstanceType } from '../types';
import { MorphicCard } from './MorphicCard';
import { localDateStr, lastNDates } from '../utils/dates';
import { sound } from '../utils/audio';

interface CalendarTrendCardProps {
  substanceLogs: SubstanceLog[];
  sleepLogs: SleepEnergyEntry[];
  cravings?: CravingEntry[];
  language?: Language;
  lang?: Language;
}

export const CalendarTrendCard: React.FC<CalendarTrendCardProps> = ({
  substanceLogs,
  sleepLogs,
  cravings = [],
  language,
  lang,
}) => {
  const currentLang = language || lang || 'fr';
  const isFr = currentLang === 'fr';
  const [viewMode, setViewMode] = useState<'calendar' | 'daily' | 'weekday'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(() => localDateStr());
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const getTriggerTip = (trigger?: string) => {
    if (!trigger) return isFr ? 'Respiration 4-7-8 immédiate et changement d\'environnement' : '4-7-8 breathing and change environment';
    const t = trigger.toLowerCase();
    if (t.includes('stress') || t.includes('pression')) {
      return isFr ? 'Respiration 4-7-8 immédiate pour faire chuter le cortisol' : '4-7-8 breathing to lower cortisol';
    }
    if (t.includes('café') || t.includes('coffee') || t.includes('matin')) {
      return isFr ? 'Remplacer par un thé vert matcha ou un grand verre d\'eau citronnée' : 'Swap with iced matcha or lemon water';
    }
    if (t.includes('repas') || t.includes('meal')) {
      return isFr ? 'Brossage de dents immédiat ou chewing-gum menthe forte' : 'Brush teeth immediately or chew strong mint';
    }
    if (t.includes('sport') || t.includes('workout')) {
      return isFr ? 'Hydratation avec électrolytes et étirements post-effort' : 'Hydrate with electrolytes and stretch';
    }
    if (t.includes('soir') || t.includes('détente') || t.includes('relax')) {
      return isFr ? 'Tisane mélisse/camomille et extinction des écrans 30 min avant le coucher' : 'Chamomile tea and screen curfew 30 min before bed';
    }
    return isFr ? 'Astuce anti-pulsion : boire de l\'eau fraîche pour laisser passer l\'envie' : 'Craving tip: drink fresh water to help the urge pass';
  };

  // Month navigation
  const [activeMonthDate, setActiveMonthDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Aggregate logs strictly by date from user's actual database inputs
  const dailyData = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        cigarette: number;
        puff_vape: number;
        cannabis: number;
        totalUnits: number;
        triggers: string[];
        cravingsCount: number;
        resistedCravingsCount: number;
        sleep?: number;
        energy?: number;
      }
    >();

    // 1. Process substance logs (STRICT SOURCE OF TRUTH for intake)
    for (const log of substanceLogs) {
      if (!log || typeof log.timestamp !== 'string') continue;
      const d = log.timestamp.split('T')[0];
      if (!d) continue;
      const curr = map.get(d) || {
        date: d,
        cigarette: 0,
        puff_vape: 0,
        cannabis: 0,
        totalUnits: 0,
        triggers: [],
        cravingsCount: 0,
        resistedCravingsCount: 0,
      };
      if (log.substance === 'cigarette') curr.cigarette += log.count;
      else if (log.substance === 'puff_vape') curr.puff_vape += log.count;
      else if (log.substance === 'cannabis') curr.cannabis += log.count;

      if (log.trigger && !curr.triggers.includes(log.trigger)) {
        curr.triggers.push(log.trigger);
      }
      curr.totalUnits = curr.cigarette + Math.round(curr.puff_vape / 15) + curr.cannabis * 2;
      map.set(d, curr);
    }

    // 2. Merge cravings (does NOT fabricate or inflate substance units)
    for (const c of cravings) {
      if (!c || typeof c.timestamp !== 'string') continue;
      const d = c.timestamp.split('T')[0];
      if (!d) continue;
      const curr = map.get(d) || {
        date: d,
        cigarette: 0,
        puff_vape: 0,
        cannabis: 0,
        totalUnits: 0,
        triggers: [],
        cravingsCount: 0,
        resistedCravingsCount: 0,
      };
      curr.cravingsCount += 1;
      if (c.resisted) curr.resistedCravingsCount += 1;
      if (c.trigger && !curr.triggers.includes(c.trigger)) {
        curr.triggers.push(c.trigger);
      }
      map.set(d, curr);
    }

    // 3. Merge sleep logs (ONLY sleep & energy scores, never overrides substances)
    for (const s of sleepLogs) {
      const curr = map.get(s.date) || {
        date: s.date,
        cigarette: 0,
        puff_vape: 0,
        cannabis: 0,
        totalUnits: 0,
        triggers: [],
        cravingsCount: 0,
        resistedCravingsCount: 0,
      };
      curr.sleep = s.sleepRating;
      curr.energy = s.energyRating;
      map.set(s.date, curr);
    }

    return map;
  }, [substanceLogs, sleepLogs, cravings]);

  // Calendar matrix calculations
  const year = activeMonthDate.getFullYear();
  const month = activeMonthDate.getMonth();
  const monthName = activeMonthDate.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Day of week for 1st day (0 = Sunday, 1 = Monday, ...) -> convert to Monday = 0
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const daysCount = lastDayOfMonth.getDate();
    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isFuture: boolean;
    }> = [];

    // Empty lead cells
    for (let i = 0; i < startDay; i++) {
      cells.push({
        dateStr: '',
        dayNumber: 0,
        isCurrentMonth: false,
        isToday: false,
        isFuture: false,
      });
    }

    const todayStr = localDateStr();
    for (let d = 1; d <= daysCount; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr: dStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isFuture: dStr > todayStr,
      });
    }

    return cells;
  }, [year, month]);

  // Day of week analysis (Monday=1, Sunday=0 in JS getDay())
  const weekdayAnalysis = useMemo(() => {
    const days = [
      { nameEn: 'Mon', nameFr: 'Lun', dayIdx: 1 },
      { nameEn: 'Tue', nameFr: 'Mar', dayIdx: 2 },
      { nameEn: 'Wed', nameFr: 'Mer', dayIdx: 3 },
      { nameEn: 'Thu', nameFr: 'Jeu', dayIdx: 4 },
      { nameEn: 'Fri', nameFr: 'Ven', dayIdx: 5 },
      { nameEn: 'Sat', nameFr: 'Sam', dayIdx: 6 },
      { nameEn: 'Sun', nameFr: 'Dim', dayIdx: 0 },
    ];

    const todayStr = localDateStr();
    const stats = days.map((d) => {
      let totalUnits = 0;
      let occurrences = 0;

      dailyData.forEach((val, dateStr) => {
        if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return;
        if (dateStr > todayStr) return; // ignore future dates
        const parts = dateStr.split('-');
        if (parts.length < 3) return;
        const [y, m, dayNum] = parts.map(Number);
        if (isNaN(y) || isNaN(m) || isNaN(dayNum)) return;
        const dt = new Date(y, m - 1, dayNum);
        if (isNaN(dt.getTime())) return;
        if (dt.getDay() === d.dayIdx) {
          totalUnits += val.totalUnits;
          occurrences += 1;
        }
      });

      const avgUnits = occurrences > 0 ? Number((totalUnits / occurrences).toFixed(1)) : 0;
      return {
        ...d,
        label: isFr ? d.nameFr : d.nameEn,
        avgUnits,
        totalUnits,
        occurrences,
      };
    });

    const maxAvg = Math.max(1, ...stats.map((s) => s.avgUnits));
    const sorted = [...stats].sort((a, b) => b.avgUnits - a.avgUnits);
    const peakDay = sorted[0];
    const cleanestDay = sorted[sorted.length - 1];

    return {
      stats,
      maxAvg,
      peakDay,
      cleanestDay,
    };
  }, [dailyData, isFr]);

  // 7-day chronological day-by-day comparison from the database
  const recentDaysComparison = useMemo(() => {
    const dates = lastNDates(7);

    return dates.map((dStr, idx) => {
      const data = dailyData.get(dStr) || {
        date: dStr,
        cigarette: 0,
        puff_vape: 0,
        cannabis: 0,
        totalUnits: 0,
        triggers: [],
        cravingsCount: 0,
        resistedCravingsCount: 0,
      };

      const prevDStr = idx > 0 ? dates[idx - 1] : null;
      const prevData = prevDStr ? dailyData.get(prevDStr) : null;
      const prevUnits = prevData ? prevData.totalUnits : 0;
      const delta = idx > 0 ? data.totalUnits - prevUnits : 0;

      const dateObj = new Date(dStr + 'T12:00:00');
      const dayName = dateObj.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { weekday: 'short' });
      const dayFormatted = dateObj.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' });

      return {
        dateStr: dStr,
        dayName,
        dayFormatted,
        data,
        isToday: dStr === localDateStr(),
        delta,
      };
    });
  }, [dailyData, isFr]);

  const selectedDayInfo = dailyData.get(selectedDate);

  type DayTimelineItem =
    | { kind: 'log'; id: string; timestamp: string; substance: SubstanceType; count: number; trigger?: string }
    | { kind: 'craving'; id: string; timestamp: string; intensity: number; resisted: boolean; trigger?: string; substance?: SubstanceType };

  const selectedDayTimeline = useMemo(() => {
    const items: DayTimelineItem[] = [];

    for (const l of substanceLogs) {
      if (l.timestamp.startsWith(selectedDate)) {
        items.push({
          kind: 'log',
          id: l.id,
          timestamp: l.timestamp,
          substance: l.substance,
          count: l.count,
          trigger: l.trigger,
        });
      }
    }

    for (const c of cravings) {
      if (c.timestamp.startsWith(selectedDate)) {
        items.push({
          kind: 'craving',
          id: c.id,
          timestamp: c.timestamp,
          intensity: c.intensity,
          resisted: c.resisted,
          trigger: c.trigger,
          substance: c.substance,
        });
      }
    }

    // Follow regular day timeline chronologically ascending: 08:00 AM, then 1:00 PM, then 2:00 PM
    return items.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [substanceLogs, cravings, selectedDate]);
  const weekDayHeaders = isFr
    ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <MorphicCard variant="elevated" className="space-y-3">
      {/* Compact Top Bar: Month Navigation & Mode Switcher — Streamlined, No Bulky Title */}
      <div className="flex items-center justify-between gap-2">
        {viewMode === 'calendar' ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                sound.playClick();
                setActiveMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
              }}
              aria-label="Previous month"
              className="p-1 rounded-lg glass-button text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold text-white capitalize px-1">{monthName}</span>
            <button
              onClick={() => {
                sound.playClick();
                setActiveMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
              }}
              aria-label="Next month"
              className="p-1 rounded-lg glass-button text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{viewMode === 'daily' ? (isFr ? 'Derniers 7 Jours' : 'Last 7 Days') : (isFr ? 'Profil par Jour' : 'Weekday Profile')}</span>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex p-0.5 rounded-xl bg-slate-900/60 border border-white/10 text-[10px] sm:text-[11px] font-semibold shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              setViewMode('calendar');
            }}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
              viewMode === 'calendar'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarIcon className="w-3 h-3" />
            <span>{isFr ? 'Mois' : 'Month'}</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setViewMode('daily');
            }}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
              viewMode === 'daily'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{isFr ? '7 Jours' : '7 Days'}</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setViewMode('weekday');
            }}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
              viewMode === 'weekday'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>{isFr ? 'Profil' : 'Profile'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MONTHLY CALENDAR GRID */}
      {viewMode === 'calendar' && (
        <div className="space-y-2.5">

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDayHeaders.map((h, i) => (
              <span key={i} className="text-[10px] font-semibold text-slate-400">
                {h}
              </span>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return <div key={`empty-${idx}`} className="h-9 rounded-xl opacity-0" />;
              }

              const data = dailyData.get(cell.dateStr);
              const isSelected = selectedDate === cell.dateStr;
              const hasIntake = data && data.totalUnits > 0;
              const isClean = !cell.isFuture && (!data || data.totalUnits === 0);
              const resistedCravings = data?.resistedCravingsCount || 0;
              const smokedCravings = (data?.cravingsCount || 0) - resistedCravings;

              let badgeColor = 'bg-slate-900/30 border-white/5 text-slate-400';
              if (cell.isFuture) {
                badgeColor = 'opacity-30 border-transparent text-slate-400';
              } else if (isClean) {
                badgeColor = 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 font-bold';
              } else if (hasIntake) {
                if (data.totalUnits >= 6) {
                  badgeColor = 'bg-rose-500/25 border-rose-500/40 text-rose-300 font-bold';
                } else {
                  badgeColor = 'bg-amber-500/25 border-amber-500/40 text-amber-300 font-bold';
                }
              }

              return (
                <button
                  key={cell.dateStr}
                  disabled={cell.isFuture}
                  onClick={() => {
                    sound.playClick();
                    setSelectedDate(cell.dateStr);
                  }}
                  className={`relative h-9 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${badgeColor} ${
                    isSelected ? 'ring-2 ring-teal-400 shadow-md scale-105 z-10' : ''
                  }`}
                >
                  <span className="text-[11px]">{cell.dayNumber}</span>
                  {hasIntake && (
                    <span className="text-[8px] leading-none opacity-90 font-bold">
                      {data.totalUnits}u
                    </span>
                  )}
                  {isClean && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm" />
                      {resistedCravings > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm" title={`${resistedCravings} ${isFr ? 'pulsions surmontées' : 'cravings resisted'}`} />
                      )}
                    </div>
                  )}
                  {!isClean && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {resistedCravings > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm" title={`${resistedCravings} ${isFr ? 'pulsions surmontées' : 'cravings resisted'}`} />
                      )}
                      {smokedCravings > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-sm" title={`${smokedCravings} ${isFr ? 'craving cédé' : 'craving smoked'}`} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2.5 pt-1 text-[10px] text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {isFr ? 'Sobre (0)' : 'Clean (0)'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              {isFr ? 'Pulsion Résistée' : 'Craving Resisted'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {isFr ? 'Modéré (1-5)' : 'Moderate (1-5)'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              {isFr ? 'Intense (6+)' : 'Heavy (6+)'}
            </span>
          </div>

          {/* Selected Day Details Panel */}
          {selectedDate && (
            <div className="p-3 rounded-2xl bg-slate-900/50 border border-white/10 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-teal-400" />
                  {isFr ? `Données saisies le ${selectedDate}` : `Database inputs for ${selectedDate}`}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(!selectedDayInfo || selectedDayInfo.totalUnits === 0) ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {isFr ? 'Journée Propre (0)' : 'Clean Day (0)'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {selectedDayInfo.totalUnits} {isFr ? 'unités consommées' : 'units logged'}
                    </span>
                  )}
                  {selectedDayInfo && selectedDayInfo.resistedCravingsCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      🛡️ {selectedDayInfo.resistedCravingsCount} {isFr ? 'résisté(s)' : 'resisted'}
                    </span>
                  )}
                  {selectedDayInfo && (selectedDayInfo.cravingsCount - selectedDayInfo.resistedCravingsCount) > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      ⚡ {selectedDayInfo.cravingsCount - selectedDayInfo.resistedCravingsCount} {isFr ? 'fumé(s)' : 'smoked'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                  <div className="text-[10px] text-slate-400">{isFr ? 'Cigarettes' : 'Cigarettes'}</div>
                  <div className="text-sm font-bold text-amber-400">{selectedDayInfo?.cigarette ?? 0}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                  <div className="text-[10px] text-slate-400">{isFr ? 'Puffs Vape' : 'Vape Puffs'}</div>
                  <div className="text-sm font-bold text-teal-400">{selectedDayInfo?.puff_vape ?? 0}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                  <div className="text-[10px] text-slate-400">{isFr ? 'Cannabis / Joints' : 'Joints'}</div>
                  <div className="text-sm font-bold text-emerald-400">{selectedDayInfo?.cannabis ?? 0}</div>
                </div>
              </div>

              {selectedDayInfo && (selectedDayInfo.sleep !== undefined || selectedDayInfo.energy !== undefined) && (
                <div className="flex items-center gap-3 pt-1 border-t border-white/5 text-[11px] text-slate-300">
                  {selectedDayInfo.sleep !== undefined && (
                    <span className="flex items-center gap-1">
                      <Moon className="w-3 h-3 text-indigo-400" />
                      {isFr ? 'Sommeil :' : 'Sleep:'} <b className="text-white">{selectedDayInfo.sleep}/10</b>
                    </span>
                  )}
                  {selectedDayInfo.energy !== undefined && (
                    <span className="flex items-center gap-1">
                      <BatteryCharging className="w-3 h-3 text-emerald-400" />
                      {isFr ? 'Énergie :' : 'Energy:'} <b className="text-white">{selectedDayInfo.energy}/10</b>
                    </span>
                  )}
                </div>
              )}

              {selectedDayInfo && selectedDayInfo.triggers.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-medium text-slate-400">
                    {isFr ? 'Déclencheurs :' : 'Triggers:'}
                  </span>
                  {selectedDayInfo.triggers.map((trig, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/15 border border-rose-500/25 text-rose-300"
                    >
                      {trig}
                    </span>
                  ))}
                </div>
              )}

              {/* Detailed Chronological Day Logs: Follows regular day timeline from morning to night */}
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>{isFr ? 'Chronologie de la journée (cliquez pour inspecter)' : 'Day timeline (click to inspect)'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {selectedDayTimeline.length} {isFr ? 'entrées' : 'entries'}
                  </span>
                </div>

                {selectedDayTimeline.length === 0 ? (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-[11px] text-emerald-300">
                    ✨ {isFr ? 'Aucune consommation ni pulsion enregistrée ce jour.' : 'No consumption or cravings logged on this day.'}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                    {selectedDayTimeline.map((item) => {
                      const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const isExpanded = expandedItemId === item.id;

                      if (item.kind === 'log') {
                        const isCig = item.substance === 'cigarette';
                        const isVape = item.substance === 'puff_vape';

                        const badgeStyle = isCig
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : isVape
                          ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                          : 'bg-lime-500/15 border-lime-500/30 text-lime-300';

                        const unitLabel = isCig
                          ? (isFr ? 'cig' : 'cig')
                          : isVape
                          ? (isFr ? 'puffs' : 'puffs')
                          : (isFr ? 'joint' : 'joint');

                        const nameLabel = isCig
                          ? (isFr ? '🟡 Cigarette' : '🟡 Cigarette')
                          : isVape
                          ? (isFr ? '🔵 Vape / Puff' : '🔵 Vape / Puff')
                          : (isFr ? '🟢 Cannabis / Weed' : '🟢 Cannabis / Weed');

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              sound.playClick();
                              setExpandedItemId(isExpanded ? null : item.id);
                            }}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isExpanded
                                ? 'bg-slate-800/80 border-teal-500/40 shadow-lg shadow-black/40 ring-1 ring-teal-500/30'
                                : 'bg-slate-900/70 border-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-teal-400 font-semibold tabular-nums">{timeStr}</span>
                                <span className="px-2 py-0.5 rounded-lg border text-[10px] font-bold bg-slate-800 border-white/10 text-slate-200">
                                  {isFr ? 'Fumée enregistrée' : 'Logged smoke'}
                                </span>
                                <span className="font-bold text-white tabular-nums">
                                  +{item.count} {unitLabel}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {item.trigger && !isExpanded && (
                                  <span className="text-[10px] font-medium text-rose-300 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md">
                                    🎯 {item.trigger}
                                  </span>
                                )}
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                )}
                              </div>
                            </div>

                            {/* Detailed substance view revealed on click */}
                            {isExpanded && (
                              <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5 text-[11px] animate-fade-in">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 text-[10px]">{isFr ? 'Substance consommée :' : 'Substance consumed:'}</span>
                                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${badgeStyle}`}>
                                    {nameLabel}
                                  </span>
                                </div>
                                {item.trigger && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-[10px]">{isFr ? 'Déclencheur identifié :' : 'Trigger identified:'}</span>
                                    <span className="text-rose-300 font-semibold">🎯 {item.trigger}</span>
                                  </div>
                                )}
                                <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] flex items-center gap-1.5">
                                  <span>💡</span>
                                  <span>{getTriggerTip(item.trigger)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Craving item
                      const cravedSub = (item.substance || 'puff_vape') as SubstanceType;
                      const isWeed = cravedSub === 'cannabis';
                      const isPuff = cravedSub === 'puff_vape';
                      const subBadgeStyle = isWeed
                        ? 'bg-lime-500/20 border-lime-500/40 text-lime-300'
                        : isPuff
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-300';
                      const subLabel = isWeed ? '🟢 Cannabis / Weed' : isPuff ? '🔵 Puff / Vape' : '🟡 Cigarette';

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            sound.playClick();
                            setExpandedItemId(isExpanded ? null : item.id);
                          }}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-slate-800/80 border-teal-500/40 shadow-lg shadow-black/40 ring-1 ring-teal-500/30'
                              : 'bg-slate-900/70 border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-teal-400 font-semibold tabular-nums">{timeStr}</span>
                              <span
                                className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${
                                  item.resisted
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                }`}
                              >
                                {item.resisted
                                  ? (isFr ? '🛡️ Crave Résisté' : '🛡️ Craving Resisted')
                                  : (isFr ? '⚡ Crave Fumé' : '⚡ Craving Smoked')}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {isFr ? 'Intensité' : 'Intensity'} <b className="text-white">{item.intensity}/10</b>
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {!isExpanded ? (
                                <span className="text-[10px] text-teal-400/90 flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                                  {isFr ? 'Voir substance' : 'View substance'}
                                  <ChevronDown className="w-3 h-3 text-teal-400" />
                                </span>
                              ) : (
                                <ChevronUp className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                              )}
                            </div>
                          </div>

                          {/* Interactive Expanded Card revealing substance & clinical protocol */}
                          {isExpanded && (
                            <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-2 text-[11px] animate-fade-in">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-[10px]">
                                  {isFr ? 'Substance concernée par la pulsion :' : 'Craved substance:'}
                                </span>
                                <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${subBadgeStyle}`}>
                                  {subLabel}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-[10px]">{isFr ? 'Issue de la pulsion :' : 'Craving outcome:'}</span>
                                <span className={`font-bold text-[10.5px] ${item.resisted ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {item.resisted
                                    ? (isFr ? '🛡️ Surmontée avec succès (0 inhalation)' : '🛡️ Successfully resisted (0 hit)')
                                    : (isFr ? '⚡ Consommation après pulsion' : '⚡ Consumed after craving')}
                                </span>
                              </div>

                              {/* Intensity meter */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-400">
                                  <span>{isFr ? 'Intensité ressentie' : 'Felt intensity'}</span>
                                  <span className="font-bold text-white">{item.intensity} / 10</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      item.intensity >= 7
                                        ? 'bg-rose-500'
                                        : item.intensity >= 4
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(10, item.intensity * 10))}%` }}
                                  />
                                </div>
                              </div>

                              {item.trigger && (
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 text-[10px]">{isFr ? 'Déclencheur identifié :' : 'Trigger:'}</span>
                                  <span className="text-amber-300 font-semibold">🎯 {item.trigger}</span>
                                </div>
                              )}

                              <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10.5px] flex items-start gap-1.5">
                                <span className="shrink-0 mt-0.5">💡</span>
                                <div>
                                  <b className="text-teal-200">{isFr ? 'Protocole recommandé : ' : 'Recommended protocol: '}</b>
                                  <span>{getTriggerTip(item.trigger)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: 7-DAY CHRONOLOGICAL EVOLUTION & DAY-TO-DAY COMPARISON */}
      {viewMode === 'daily' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              {isFr ? 'Comparaison Quotidienne (7 derniers jours)' : 'Daily Comparison (Last 7 Days)'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {isFr
                ? 'Progression jour par jour comparée à la veille :'
                : 'Day-by-day evolution compared to yesterday:'}
            </p>
          </div>

          <div className="space-y-1.5">
            {recentDaysComparison.map((day) => {
              const isClean = day.data.totalUnits === 0;
              return (
                <div
                  key={day.dateStr}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    day.isToday
                      ? 'bg-teal-500/10 border-teal-500/30'
                      : 'bg-slate-900/40 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isClean
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isClean ? '0' : day.data.totalUnits}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white capitalize">{day.dayName}</span>
                        <span className="text-[10px] text-slate-400">({day.dayFormatted})</span>
                        {day.isToday && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">
                            {isFr ? 'Aujourd\'hui' : 'Today'}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isClean ? (
                          <span className="text-emerald-400 font-medium">
                            {isFr ? 'Journée 100% sobre' : 'Smoke-free day'}
                          </span>
                        ) : (
                          <span>
                            {day.data.cigarette > 0 && `${day.data.cigarette} cig `}
                            {day.data.puff_vape > 0 && `${day.data.puff_vape} puffs `}
                            {day.data.cannabis > 0 && `${day.data.cannabis} joints`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Day-to-Day Delta Comparison */}
                  <div className="text-right">
                    {day.delta < 0 ? (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-400">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {Math.abs(day.delta)} {isFr ? 'en moins' : 'less'}
                      </span>
                    ) : day.delta > 0 ? (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-rose-400">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{day.delta} {isFr ? 'en plus' : 'more'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-400">
                        <Minus className="w-3 h-3" />
                        {isFr ? 'Stable' : 'Equal'}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-500 block">
                      {isFr ? 'vs jour précédent' : 'vs prior day'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: DAY OF THE WEEK TREND BAR CHART */}
      {viewMode === 'weekday' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              {isFr ? 'Profil d\'Habitudes par Jour de Semaine' : 'Weekly Habit Patterns'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {isFr
                ? 'Moyenne réelle d\'unités selon le jour de la semaine (calculée sur vos saisies) :'
                : 'Actual average units by weekday from logged records:'}
            </p>
          </div>

          {/* Bar Chart Container */}
          <div className="grid grid-cols-7 gap-1.5 items-end h-32 pt-4 px-1 border-b border-white/10 pb-2">
            {weekdayAnalysis.stats.map((day) => {
              const heightPercent = Math.max(12, Math.round((day.avgUnits / weekdayAnalysis.maxAvg) * 100));
              const isPeak = day.dayIdx === weekdayAnalysis.peakDay?.dayIdx && day.avgUnits > 0;
              const isCleanest = day.dayIdx === weekdayAnalysis.cleanestDay?.dayIdx;

              let barBg = 'bg-teal-500/40 border-teal-500/50';
              if (isPeak) barBg = 'bg-gradient-to-t from-rose-500 to-amber-500 border-rose-400 shadow-md shadow-rose-500/30';
              else if (isCleanest) barBg = 'bg-gradient-to-t from-emerald-500 to-teal-400 border-emerald-400';

              return (
                <div key={day.dayIdx} className="flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[9px] font-bold text-slate-300 tabular-nums">
                    {day.avgUnits > 0 ? `${day.avgUnits}u` : '0'}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg border transition-all duration-500 ${barBg}`}
                  />
                  <span
                    className={`text-[10px] font-bold mt-1 ${
                      isPeak ? 'text-rose-400' : isCleanest ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Highlights & Coach Insight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
            {weekdayAnalysis.peakDay && weekdayAnalysis.peakDay.avgUnits > 0 ? (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{isFr ? 'Jour le Plus Vulnérable' : 'Highest Vulnerability'}</span>
                </div>
                <p className="text-white font-semibold">
                  {weekdayAnalysis.peakDay.label} ({weekdayAnalysis.peakDay.avgUnits} {isFr ? 'unités en moy.' : 'units avg'})
                </p>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {isFr
                    ? 'C\'est le jour où la tentation est la plus forte. Anticipez avec la respiration 4-7-8 avant les moments critiques.'
                    : 'Your cravings peak on this day. Schedule alternative routines to protect your streak.'}
                </p>
              </div>
            ) : null}

            {weekdayAnalysis.cleanestDay ? (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{isFr ? 'Jour le Plus Sobre' : 'Cleanest Day'}</span>
                </div>
                <p className="text-white font-semibold">
                  {weekdayAnalysis.cleanestDay.label} ({weekdayAnalysis.cleanestDay.avgUnits} {isFr ? 'unités en moy.' : 'units avg'})
                </p>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {isFr
                    ? 'Excellente maîtrise ce jour-là. Vous prouvez que votre cerveau peut facilement fonctionner sans fumer.'
                    : 'Highest control demonstrated. Proof that your reward system can run smoothly smoke-free.'}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </MorphicCard>
  );
};
