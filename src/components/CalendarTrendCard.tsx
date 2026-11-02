import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon, BarChart3, ChevronLeft, ChevronRight,
  Sparkles, AlertTriangle, CheckCircle, Info, Moon, BatteryCharging
} from 'lucide-react';
import type { SubstanceLog, SleepEnergyEntry, CravingEntry, Language } from '../types';
import { MorphicCard } from './MorphicCard';
import { localDateStr } from '../utils/dates';
import { sound } from '../utils/audio';

interface CalendarTrendCardProps {
  substanceLogs: SubstanceLog[];
  sleepLogs: SleepEnergyEntry[];
  cravings?: CravingEntry[];
  language?: Language;
}

export const CalendarTrendCard: React.FC<CalendarTrendCardProps> = ({
  substanceLogs,
  sleepLogs,
  cravings = [],
  language = 'en',
}) => {
  const isFr = language === 'fr';
  const [viewMode, setViewMode] = useState<'calendar' | 'weekday'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(() => localDateStr());

  // Month navigation (pure state-based)
  const [activeMonthDate, setActiveMonthDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Aggregate logs by date
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

    // Process substance logs
    for (const log of substanceLogs) {
      const d = log.timestamp.split('T')[0];
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

    // Merge cravings
    for (const c of cravings) {
      const d = c.timestamp.split('T')[0];
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
      map.set(d, curr);
    }

    // Merge sleep logs
    for (const s of sleepLogs) {
      const curr = map.get(s.date) || {
        date: s.date,
        cigarette: s.substancesLogged.cigarette,
        puff_vape: s.substancesLogged.puff_vape,
        cannabis: s.substancesLogged.cannabis,
        totalUnits: s.substancesLogged.cigarette + Math.round(s.substancesLogged.puff_vape / 15) + s.substancesLogged.cannabis * 2,
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

    const stats = days.map((d) => {
      let totalUnits = 0;
      let occurrences = 0;

      dailyData.forEach((val, dateStr) => {
        const [y, m, dayNum] = dateStr.split('-').map(Number);
        const dt = new Date(y, m - 1, dayNum);
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

  const selectedDayInfo = dailyData.get(selectedDate);
  const weekDayHeaders = isFr
    ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <MorphicCard variant="elevated" className="space-y-4">
      {/* Header & View Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/25">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {isFr ? 'Calendrier & Tendances' : 'Calendar & Habit Trends'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isFr ? 'Visualisez les jours où vous fumez le plus' : 'Identify patterns and peak smoking days'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex p-0.5 rounded-xl bg-slate-900/60 border border-white/10 text-[11px] font-semibold">
          <button
            onClick={() => {
              sound.playClick();
              setViewMode('calendar');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
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
              setViewMode('weekday');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
              viewMode === 'weekday'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>{isFr ? 'Semaine' : 'Week'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MONTHLY CALENDAR GRID */}
      {viewMode === 'calendar' && (
        <div className="space-y-3">
          {/* Month selector */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => {
                sound.playClick();
                setActiveMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
              }}
              className="p-1.5 rounded-xl glass-button text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white capitalize">{monthName}</span>
            <button
              onClick={() => {
                sound.playClick();
                setActiveMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
              }}
              className="p-1.5 rounded-xl glass-button text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

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
              const isClean = data && data.totalUnits === 0;

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
                  className={`relative h-9 rounded-xl border flex flex-col items-center justify-center transition-all ${badgeColor} ${
                    isSelected ? 'ring-2 ring-teal-400 shadow-md scale-105 z-10' : ''
                  }`}
                >
                  <span className="text-[11px]">{cell.dayNumber}</span>
                  {hasIntake && (
                    <span className="text-[8px] leading-none opacity-90">
                      {data.totalUnits}u
                    </span>
                  )}
                  {isClean && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5 shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {isFr ? 'Sobre (0)' : 'Clean (0)'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {isFr ? 'Modéré (1-5)' : 'Moderate (1-5)'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              {isFr ? 'Chargé (6+)' : 'Heavy (6+)'}
            </span>
          </div>

          {/* Selected Day Details Panel */}
          {selectedDate && (
            <div className="p-3 rounded-2xl bg-slate-900/50 border border-white/10 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-teal-400" />
                  {isFr ? `Détails du ${selectedDate}` : `Details for ${selectedDate}`}
                </span>
                {selectedDayInfo && selectedDayInfo.totalUnits === 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {isFr ? 'Journée Propre' : 'Clean Day'}
                  </span>
                )}
              </div>

              {selectedDayInfo ? (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                    <div className="text-[10px] text-slate-400">{isFr ? 'Cigarettes' : 'Cigarettes'}</div>
                    <div className="text-sm font-bold text-amber-400">{selectedDayInfo.cigarette}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                    <div className="text-[10px] text-slate-400">{isFr ? 'Puffs' : 'Puffs'}</div>
                    <div className="text-sm font-bold text-teal-400">{selectedDayInfo.puff_vape}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                    <div className="text-[10px] text-slate-400">{isFr ? 'Cannabis' : 'Cannabis'}</div>
                    <div className="text-sm font-bold text-emerald-400">{selectedDayInfo.cannabis}</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  {isFr ? 'Aucune consommation enregistrée pour ce jour.' : 'No intake logged for this date.'}
                </p>
              )}

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
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DAY OF THE WEEK TREND BAR CHART */}
      {viewMode === 'weekday' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              {isFr ? 'Comparaison par Jour de la Semaine' : 'Weekly Consumption Pattern'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {isFr
                ? 'Moyenne de substances consommées selon le jour de la semaine :'
                : 'Average substance units consumed by day of the week:'}
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
