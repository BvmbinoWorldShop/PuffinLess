import { useEffect, useMemo, useState } from 'react';
import type {
  UserProfile,
  Language,
  SavingsGoal,
  CravingEntry,
  PurchaseExpense,
  SubstanceLog,
  SubstanceType,
  SleepEnergyEntry,
  StreakRecord,
} from '../types';
import {
  loadProfile, saveProfile,
  loadSavingsGoals, saveSavingsGoals,
  loadCravings, saveCravings,
  loadExpenses, saveExpenses,
  loadSubstanceLogs, saveSubstanceLogs,
  loadSleepEnergy, saveSleepEnergy,
  loadStreaks, saveStreaks,
  initIndexedDBStorage, resetAllUserData,
  DEFAULT_PROFILE,
} from '../utils/storage';
import { calculateStats } from '../utils/calculations';
import { buildCoreReport, sumIntake } from '../core/obsidianCore';
import { localDateStr } from '../utils/dates';
import { sound } from '../utils/audio';

function generateSecureId(prefix: string = ''): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return prefix ? `${prefix}-${crypto.randomUUID()}` : crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Central app store. Owns all persisted state and every action, so screens stay thin and the
 * Obsidian Core always reads one consistent source of truth.
 * Powered by high-capacity IndexedDB with instantaneous in-memory bootstrap.
 */
export function useAppStore() {
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [goals, setGoals] = useState<SavingsGoal[]>(loadSavingsGoals);
  const [cravings, setCravings] = useState<CravingEntry[]>(loadCravings);
  const [expenses, setExpenses] = useState<PurchaseExpense[]>(loadExpenses);
  const [substanceLogs, setSubstanceLogs] = useState<SubstanceLog[]>(loadSubstanceLogs);
  const [sleepLogs, setSleepLogs] = useState<SleepEnergyEntry[]>(loadSleepEnergy);
  const [streaks, setStreaks] = useState<StreakRecord[]>(loadStreaks);

  const [tick, setTick] = useState(0);

  // Hydrate from IndexedDB on startup (with automatic migration of localStorage on first run)
  useEffect(() => {
    let isMounted = true;
    initIndexedDBStorage().then((data) => {
      if (!isMounted || !data) return;
      if (data.profile) setProfile(data.profile);
      if (data.goals) setGoals(data.goals);
      if (data.cravings) setCravings(data.cravings);
      if (data.expenses) setExpenses(data.expenses);
      if (data.substanceLogs) setSubstanceLogs(data.substanceLogs);
      if (data.sleepLogs) setSleepLogs(data.sleepLogs);
      if (data.streaks) setStreaks(data.streaks);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Theme + audio side-effects
  useEffect(() => {
    document.body.className = profile.theme === 'light' ? 'theme-light' : 'theme-dark';
  }, [profile.theme]);
  useEffect(() => {
    sound.setEnabled(profile.soundEnabled);
  }, [profile.soundEnabled]);

  // Live clock: re-render every second so the Clean Breath Counter ticks
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const stats = calculateStats(profile, substanceLogs, cravings, streaks);

  // The Core report is heavier; recompute once a minute or whenever memory changes
  const minuteTick = Math.floor(tick / 60);
  const report = useMemo(
    () => buildCoreReport({ profile, stats: calculateStats(profile, substanceLogs, cravings, streaks), substanceLogs, cravings, sleepLogs, streaks }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, substanceLogs, cravings, sleepLogs, streaks, minuteTick]
  );

  // ---------- Actions ----------
  const updateProfile = (p: UserProfile) => {
    setProfile(p);
    saveProfile(p);
  };

  const toggleTheme = () => updateProfile({ ...profile, theme: profile.theme === 'light' ? 'dark' : 'light' });
  const toggleSound = () => updateProfile({ ...profile, soundEnabled: !profile.soundEnabled });
  const toggleLanguage = () => {
    const nextLang: Language = profile.language === 'fr' ? 'en' : 'fr';
    updateProfile({ ...profile, language: nextLang });
  };
  const setLanguage = (lang: Language) => updateProfile({ ...profile, language: lang });

  /** Log a cigarette / puffs / joint. This ends the current streak and restarts the Clean Breath Counter. */
  const logSubstance = (substance: SubstanceType, count: number, trigger?: string, intensity?: number) => {
    const now = new Date();
    const cleanTrigger = trigger && trigger.trim().length > 0 ? trigger.trim() : 'Habitude / Routine';
    const cleanIntensity = Math.min(10, Math.max(1, intensity ?? 5));

    const entry: SubstanceLog = {
      id: generateSecureId('sub'),
      substance,
      count,
      timestamp: now.toISOString(),
      trigger: cleanTrigger,
    };
    const logs = [entry, ...substanceLogs];
    setSubstanceLogs(logs);
    saveSubstanceLogs(logs);

    // Record an unresisted craving entry (slip event) to ensure complete behavioral correlation
    const craveEntry: CravingEntry = {
      id: generateSecureId('c'),
      timestamp: now.toISOString(),
      intensity: cleanIntensity,
      trigger: cleanTrigger,
      resisted: false,
      substance,
      note: 'Slip logged with craving motivation',
    };
    const nextCravings = [craveEntry, ...cravings];
    setCravings(nextCravings);
    saveCravings(nextCravings);

    // Close the streak (ignore accidental double taps under a minute)
    const streakLength = now.getTime() - new Date(profile.quitDate).getTime();
    if (streakLength >= 60000) {
      const record: StreakRecord = {
        id: generateSecureId('st'),
        start: profile.quitDate,
        end: now.toISOString(),
        brokenBy: substance,
      };
      const next = [record, ...streaks];
      setStreaks(next);
      saveStreaks(next);
    }
    updateProfile({ ...profile, quitDate: now.toISOString() });

    // Keep today's sleep/energy record in sync with what was actually consumed
    const today = localDateStr();
    if (sleepLogs.some((e) => e.date === today)) {
      const synced = sleepLogs.map((e) => (e.date === today ? { ...e, substancesLogged: sumIntake(logs, today) } : e));
      setSleepLogs(synced);
      saveSleepEnergy(synced);
    }
  };

  /** Undo or remove a mistakenly logged intake for today */
  const removeSubstance = (substance: SubstanceType, count: number = 1) => {
    const today = localDateStr();
    let remainingToRemove = count;
    const newLogs: SubstanceLog[] = [];
    const removedLogTimes: number[] = [];
    let modified = false;

    // Iterate through logs and decrement/remove today's matches
    for (const log of substanceLogs) {
      const isToday = localDateStr(log.timestamp) === today;
      if (isToday && log.substance === substance && remainingToRemove > 0) {
        modified = true;
        removedLogTimes.push(new Date(log.timestamp).getTime());
        if (log.count <= remainingToRemove) {
          remainingToRemove -= log.count;
          // Omit this log
        } else {
          newLogs.push({ ...log, count: log.count - remainingToRemove });
          remainingToRemove = 0;
        }
      } else {
        newLogs.push(log);
      }
    }

    if (modified) {
      setSubstanceLogs(newLogs);
      saveSubstanceLogs(newLogs);

      // Clean up corresponding unresisted craving entries from the same time
      if (removedLogTimes.length > 0) {
        const cleanedCravings = cravings.filter((c) => {
          if (c.resisted) return true;
          const cTime = new Date(c.timestamp).getTime();
          return !removedLogTimes.some((rt) => Math.abs(rt - cTime) < 60000);
        });
        setCravings(cleanedCravings);
        saveCravings(cleanedCravings);
      }

      // If today is now clean and a streak was broken TODAY, safely restore previous streak start
      const todayTotal = sumIntake(newLogs, today);
      if (todayTotal.cigarette === 0 && todayTotal.puff_vape === 0 && todayTotal.cannabis === 0) {
        if (streaks.length > 0) {
          const lastStreak = streaks[0];
          const lastStreakEndDay = localDateStr(lastStreak.end);
          // Only restore if the most recent streak actually ended today and was broken by this substance
          if (lastStreakEndDay === today && lastStreak.brokenBy === substance) {
            const remainingStreaks = streaks.slice(1);
            setStreaks(remainingStreaks);
            saveStreaks(remainingStreaks);
            updateProfile({ ...profile, quitDate: lastStreak.start });
          }
        }
      }
    }
  };

  /** Mark a craving as resisted (from the Craving button). Remembered by the Core. */
  const resistCraving = (trigger: string, intensity: number, substance?: SubstanceType) => {
    const cleanTrigger = trigger && trigger.trim().length > 0 ? trigger.trim() : 'Pulsion spontanée';
    const cleanIntensity = Math.min(10, Math.max(1, Math.round(intensity || 5)));
    const entry: CravingEntry = {
      id: generateSecureId('c'),
      timestamp: new Date().toISOString(),
      intensity: cleanIntensity,
      trigger: cleanTrigger,
      resisted: true,
      substance: substance || profile.primarySubstance || 'puff_vape',
      note: 'Resisted with PuffinLess Craving tools',
    };
    const next = [entry, ...cravings];
    setCravings(next);
    saveCravings(next);
  };

  const saveSleepEnergyEntry = (entry: SleepEnergyEntry) => {
    const idx = sleepLogs.findIndex((e) => e.date === entry.date);
    const next = idx >= 0 ? sleepLogs.map((e, i) => (i === idx ? entry : e)) : [entry, ...sleepLogs];
    setSleepLogs(next);
    saveSleepEnergy(next);
  };

  const addExpense = (e: PurchaseExpense) => {
    const next = [e, ...expenses];
    setExpenses(next);
    saveExpenses(next);
  };
  const deleteExpense = (id: string) => {
    const next = expenses.filter((e) => e.id !== id);
    setExpenses(next);
    saveExpenses(next);
  };

  const addGoal = (g: SavingsGoal) => {
    const next = [g, ...goals];
    setGoals(next);
    saveSavingsGoals(next);
  };
  const deleteGoal = (id: string) => {
    const next = goals.filter((g) => g.id !== id);
    setGoals(next);
    saveSavingsGoals(next);
  };
  const toggleGoal = (id: string) => {
    const next = goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g));
    setGoals(next);
    saveSavingsGoals(next);
  };

  const completeOnboarding = (p: UserProfile) => updateProfile(p);

  const resetAll = async () => {
    await resetAllUserData();
    setProfile({ ...DEFAULT_PROFILE, isOnboarded: false, quitDate: '', createdAt: '' });
    setGoals([]);
    setExpenses([]);
    setSleepLogs([]);
    setSubstanceLogs([]);
    setCravings([]);
    setStreaks([]);
  };

  return {
    profile, goals, cravings, expenses, substanceLogs, sleepLogs, streaks,
    stats, report,
    actions: {
      updateProfile, toggleTheme, toggleSound, toggleLanguage, setLanguage, logSubstance, removeSubstance, resistCraving, saveSleepEnergyEntry,
      addExpense, deleteExpense, addGoal, deleteGoal, toggleGoal, completeOnboarding, resetAll,
    },
  };
}
