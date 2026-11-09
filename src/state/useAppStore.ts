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
} from '../types/index.ts';
import {
  loadProfile, saveProfile,
  loadSavingsGoals, saveSavingsGoals,
  loadCravings, saveCravings,
  loadExpenses, saveExpenses,
  loadSubstanceLogs, saveSubstanceLogs,
  loadSleepEnergy, saveSleepEnergy,
  loadStreaks, saveStreaks,
  initIndexedDBStorage, resetAllUserData,
  importUserDataJSON,
  DEFAULT_PROFILE,
} from '../utils/storage.ts';
import { recoverAllDeviceData, createDeviceRescueSnapshot } from '../utils/recovery.ts';
import { recordJournalEvent, restoreJournalSequence } from '../utils/journal.ts';
import { calculateStats } from '../utils/calculations.ts';
import { buildCoreReport, sumIntake } from '../core/obsidianCore.ts';
import { localDateStr } from '../utils/dates.ts';
import { sound } from '../utils/audio.ts';

function generateSecureId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Single source of truth for PuffinLess application state.
 *
 * Boot sequence:
 * 1. Synchronous boot from local storage / defaults (zero UI flash).
 * 2. Asynchronous boot from IndexedDB + journal sequence restoration from disk.
 * 3. Connected journal persistence: all mutations await journal events and storage.
 *    If persistence or journal recording fails, changes rollback and trigger persistenceError.
 */
export function useAppStore() {
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [goals, setGoals] = useState<SavingsGoal[]>(loadSavingsGoals);
  const [cravings, setCravings] = useState<CravingEntry[]>(loadCravings);
  const [expenses, setExpenses] = useState<PurchaseExpense[]>(loadExpenses);
  const [substanceLogs, setSubstanceLogs] = useState<SubstanceLog[]>(loadSubstanceLogs);
  const [sleepLogs, setSleepLogs] = useState<SleepEnergyEntry[]>(loadSleepEnergy);
  const [streaks, setStreaks] = useState<StreakRecord[]>(loadStreaks);
  const [isHydrated, setIsHydrated] = useState(false);
  const [persistenceError, setPersistenceError] = useState<Error | null>(null);

  const [tick, setTick] = useState(0);

  const clearPersistenceError = () => setPersistenceError(null);

  // Hydrate from IndexedDB on startup (with automatic migration of localStorage on first run)
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      initIndexedDBStorage(),
      restoreJournalSequence(),
    ])
      .then(([data]) => {
        if (!isMounted || !data) return;
        if (data.profile) setProfile(data.profile);
        if (data.goals) setGoals(data.goals);
        if (data.cravings) setCravings(data.cravings);
        if (data.expenses) setExpenses(data.expenses);
        if (data.substanceLogs) setSubstanceLogs(data.substanceLogs);
        if (data.sleepLogs) setSleepLogs(data.sleepLogs);
        if (data.streaks) setStreaks(data.streaks);
      })
      .catch((err) => {
        console.error('[Store] Initialization / sequence restoration error:', err);
        if (isMounted) {
          setPersistenceError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsHydrated(true);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Theme + audio side-effects
  useEffect(() => {
    if (typeof document !== 'undefined' && document.body) {
      document.body.className = profile.theme === 'light' ? 'theme-light' : 'theme-dark';
    }
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

  // ---------- Actions with Fail-Visibly Journal Persistence ----------

  const updateProfile = async (p: UserProfile): Promise<void> => {
    const prevProfile = profile;
    setProfile(p);
    try {
      await saveProfile(p);
      await recordJournalEvent('PROFILE_UPDATED', p);
      setPersistenceError(null);
    } catch (err) {
      setProfile(prevProfile);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setPersistenceError(errorObj);
      throw errorObj;
    }
  };

  const toggleTheme = () => updateProfile({ ...profile, theme: profile.theme === 'light' ? 'dark' : 'light' });
  const toggleSound = () => updateProfile({ ...profile, soundEnabled: !profile.soundEnabled });
  const toggleLanguage = () => {
    const nextLang: Language = profile.language === 'fr' ? 'en' : 'fr';
    updateProfile({ ...profile, language: nextLang });
  };
  const setLanguage = (lang: Language) => updateProfile({ ...profile, language: lang });

  /** Log a cigarette / puffs / joint. This ends the current streak and restarts the Clean Breath Counter. */
  const logSubstance = async (
    substance: SubstanceType,
    count: number,
    trigger?: string,
    intensity?: number
  ): Promise<void> => {
    const prevLogs = substanceLogs;
    const prevCravings = cravings;
    const prevStreaks = streaks;
    const prevProfile = profile;
    const prevSleep = sleepLogs;

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

    // Close the streak (ignore accidental double taps under a minute)
    const streakLength = now.getTime() - new Date(profile.quitDate).getTime();
    let nextStreaks = streaks;
    let streakRecord: StreakRecord | null = null;
    if (streakLength >= 60000) {
      streakRecord = {
        id: generateSecureId('st'),
        start: profile.quitDate,
        end: now.toISOString(),
        brokenBy: substance,
      };
      nextStreaks = [streakRecord, ...streaks];
      setStreaks(nextStreaks);
    }

    const updatedProfile: UserProfile = { ...profile, quitDate: now.toISOString() };
    setProfile(updatedProfile);

    // Keep today's sleep/energy record in sync with what was actually consumed
    const today = localDateStr();
    let syncedSleep = sleepLogs;
    if (sleepLogs.some((e) => e.date === today)) {
      syncedSleep = sleepLogs.map((e) => (e.date === today ? { ...e, substancesLogged: sumIntake(logs, today) } : e));
      setSleepLogs(syncedSleep);
    }

    try {
      await saveSubstanceLogs(logs);
      await recordJournalEvent('SUBSTANCE_LOGGED', entry, entry.id);

      await saveCravings(nextCravings);
      await recordJournalEvent('CRAVING_LOGGED', craveEntry, craveEntry.id);

      if (streakRecord) {
        await saveStreaks(nextStreaks);
        await recordJournalEvent('STREAK_RECORDED', streakRecord, streakRecord.id);
      }

      await saveProfile(updatedProfile);
      await recordJournalEvent('PROFILE_UPDATED', updatedProfile);

      if (syncedSleep !== sleepLogs) {
        await saveSleepEnergy(syncedSleep);
      }
      setPersistenceError(null);
    } catch (err) {
      // Rollback optimistic state on persistence or journal failure
      setSubstanceLogs(prevLogs);
      setCravings(prevCravings);
      setStreaks(prevStreaks);
      setProfile(prevProfile);
      setSleepLogs(prevSleep);

      const errorObj = err instanceof Error ? err : new Error(String(err));
      setPersistenceError(errorObj);
      throw errorObj;
    }
  };

  /** Undo or remove a mistakenly logged intake for today */
  const removeSubstance = async (substance: SubstanceType, count: number = 1): Promise<void> => {
    const prevLogs = substanceLogs;
    const prevCravings = cravings;
    const prevStreaks = streaks;
    const prevProfile = profile;

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

    if (!modified) return;

    setSubstanceLogs(newLogs);

    let cleanedCravings = cravings;
    let removedCravings: CravingEntry[] = [];
    if (removedLogTimes.length > 0) {
      removedCravings = cravings.filter((c) => {
        if (c.resisted) return false;
        const cTime = new Date(c.timestamp).getTime();
        return removedLogTimes.some((rt) => Math.abs(rt - cTime) < 60000);
      });
      cleanedCravings = cravings.filter((c) => !removedCravings.includes(c));
      setCravings(cleanedCravings);
    }

    let remainingStreaks = streaks;
    let restoredStreak: StreakRecord | null = null;
    let restoredQuitDate: string | null = null;
    const todayTotal = sumIntake(newLogs, today);
    if (todayTotal.cigarette === 0 && todayTotal.puff_vape === 0 && todayTotal.cannabis === 0) {
      if (streaks.length > 0) {
        const lastStreak = streaks[0];
        const lastStreakEndDay = localDateStr(lastStreak.end);
        if (lastStreakEndDay === today && lastStreak.brokenBy === substance) {
          restoredStreak = lastStreak;
          remainingStreaks = streaks.slice(1);
          setStreaks(remainingStreaks);
          restoredQuitDate = lastStreak.start;
          setProfile({ ...profile, quitDate: lastStreak.start });
        }
      }
    }

    try {
      await saveSubstanceLogs(newLogs, { overwrite: true });
      await recordJournalEvent('SUBSTANCE_REMOVED', { substance, count, date: today });

      if (removedCravings.length > 0) {
        await saveCravings(cleanedCravings, { overwrite: true });
        for (const rc of removedCravings) {
          await recordJournalEvent('CRAVING_REMOVED', { cravingId: rc.id }, rc.id);
        }
      }

      if (restoredStreak && restoredQuitDate) {
        await saveStreaks(remainingStreaks, { overwrite: true });
        await recordJournalEvent('STREAK_REMOVED', { streakId: restoredStreak.id }, restoredStreak.id);
        const updated = { ...profile, quitDate: restoredQuitDate };
        await saveProfile(updated);
        await recordJournalEvent('PROFILE_UPDATED', updated);
      }
      setPersistenceError(null);
    } catch (err) {
      // Rollback on persistence failure
      setSubstanceLogs(prevLogs);
      setCravings(prevCravings);
      setStreaks(prevStreaks);
      setProfile(prevProfile);

      const errorObj = err instanceof Error ? err : new Error(String(err));
      setPersistenceError(errorObj);
      throw errorObj;
    }
  };

  /** Mark a craving as resisted (from the Craving button). Remembered by the Core. */
  const resistCraving = async (trigger: string, intensity: number, substance?: SubstanceType): Promise<void> => {
    const prevCravings = cravings;
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

    try {
      await saveCravings(next);
      await recordJournalEvent('CRAVING_LOGGED', entry, entry.id);
      setPersistenceError(null);
    } catch (err) {
      setCravings(prevCravings);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setPersistenceError(errorObj);
      throw errorObj;
    }
  };

  const saveSleepEnergyEntry = async (entry: SleepEnergyEntry): Promise<void> => {
    const prevSleep = sleepLogs;
    const idx = sleepLogs.findIndex((e) => e.date === entry.date);
    const next = idx >= 0 ? sleepLogs.map((e, i) => (i === idx ? entry : e)) : [entry, ...sleepLogs];
    setSleepLogs(next);

    try {
      await saveSleepEnergy(next);
      await recordJournalEvent('SLEEP_ENERGY_LOGGED', entry, entry.id || entry.date);
      setPersistenceError(null);
    } catch (err) {
      setSleepLogs(prevSleep);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setPersistenceError(errorObj);
      throw errorObj;
    }
  };

  const addExpense = async (e: PurchaseExpense): Promise<void> => {
    const prevExpenses = expenses;
    const next = [e, ...expenses];
    setExpenses(next);

    try {
      await saveExpenses(next);
      await recordJournalEvent('PURCHASE_EXPENSE_LOGGED', e, e.id);
      setPersistenceError(null);
    } catch (err) {
      setExpenses(prevExpenses);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setPersistenceError(errorObj);
      throw errorObj;
    }
  };

  const deleteExpense = async (id: string): Promise<void> => {
    const prevExpenses = expenses;
    const next = expenses.filter((e) => e.id !== id);
    setExpenses(next);

    try {
      await saveExpenses(next, { overwrite: true });
      await recordJournalEvent('PURCHASE_EXPENSE_DELETED', { expenseId: id }, id);
      setPersistenceError(null);
    } catch (err) {
      setExpenses(prevExpenses);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setPersistenceError(errorObj);
      throw errorObj;
    }
  };

  const addGoal = async (g: SavingsGoal): Promise<void> => {
    const prevGoals = goals;
    const next = [g, ...goals];
    setGoals(next);

    try {
      await saveSavingsGoals(next);
      await recordJournalEvent('SAVINGS_GOAL_ADDED', g, g.id);
      setPersistenceError(null);
    } catch (err) {
      setGoals(prevGoals);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setPersistenceError(errorObj);
      throw errorObj;
    }
  };

  const deleteGoal = async (id: string): Promise<void> => {
    const prevGoals = goals;
    const next = goals.filter((g) => g.id !== id);
    setGoals(next);

    try {
      await saveSavingsGoals(next, { overwrite: true });
      await recordJournalEvent('SAVINGS_GOAL_DELETED', { goalId: id }, id);
      setPersistenceError(null);
    } catch (err) {
      setGoals(prevGoals);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setPersistenceError(errorObj);
      throw errorObj;
    }
  };

  const toggleGoal = async (id: string): Promise<void> => {
    const prevGoals = goals;
    const current = goals.find((g) => g.id === id);
    const next = goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g));
    setGoals(next);

    try {
      await saveSavingsGoals(next, { overwrite: true });
      await recordJournalEvent('SAVINGS_GOAL_TOGGLED', { goalId: id, completed: !current?.completed }, id);
      setPersistenceError(null);
    } catch (err) {
      setGoals(prevGoals);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setPersistenceError(errorObj);
      throw errorObj;
    }
  };

  const completeOnboarding = async (p: UserProfile): Promise<void> => {
    const finalized: UserProfile = { ...p, isOnboarded: true };
    await updateProfile(finalized);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('puffinless_is_onboarded', 'true');
      if (p.quitDate) localStorage.setItem('puffinless_quit_date', p.quitDate);
      if (p.name) localStorage.setItem('puffinless_user_name', p.name);
      if (p.language) {
        localStorage.setItem('puffinless_app_lang', p.language);
        localStorage.setItem('puffinless_lang', p.language);
      }
      if (p.theme) {
        localStorage.setItem('puffinless_app_theme', p.theme);
        localStorage.setItem('puffinless_theme', p.theme);
      }
    }
    createDeviceRescueSnapshot({ profile: finalized });
  };

  const resetAll = async (): Promise<void> => {
    await resetAllUserData();
    setProfile({ ...DEFAULT_PROFILE, isOnboarded: false, quitDate: '', createdAt: '' });
    setGoals([]);
    setExpenses([]);
    setSleepLogs([]);
    setSubstanceLogs([]);
    setCravings([]);
    setStreaks([]);
    setPersistenceError(null);
  };

  const rehydrate = async (): Promise<void> => {
    setIsHydrated(false);
    try {
      const data = await initIndexedDBStorage();
      if (data) {
        if (data.profile) setProfile(data.profile);
        if (data.goals) setGoals(data.goals);
        if (data.cravings) setCravings(data.cravings);
        if (data.expenses) setExpenses(data.expenses);
        if (data.substanceLogs) setSubstanceLogs(data.substanceLogs);
        if (data.sleepLogs) setSleepLogs(data.sleepLogs);
        if (data.streaks) setStreaks(data.streaks);
      }
      setPersistenceError(null);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setPersistenceError(errorObj);
      throw errorObj;
    } finally {
      setIsHydrated(true);
    }
  };

  const recoverLocalData = async () => {
    const res = await recoverAllDeviceData();
    if (res.recovered) {
      if (res.profile) setProfile(res.profile);
      if (res.goals) setGoals(res.goals);
      if (res.cravings) setCravings(res.cravings);
      if (res.expenses) setExpenses(res.expenses);
      if (res.substanceLogs) setSubstanceLogs(res.substanceLogs);
      if (res.sleepLogs) setSleepLogs(res.sleepLogs);
      if (res.streaks) setStreaks(res.streaks);
    }
    return res;
  };

  const importUserData = async (jsonStr: string) => {
    const res = await importUserDataJSON(jsonStr);
    if (res.success && res.data) {
      if (res.data.profile) setProfile(res.data.profile);
      if (res.data.goals) setGoals(res.data.goals);
      if (res.data.cravings) setCravings(res.data.cravings);
      if (res.data.expenses) setExpenses(res.data.expenses);
      if (res.data.substanceLogs) setSubstanceLogs(res.data.substanceLogs);
      if (res.data.sleepLogs) setSleepLogs(res.data.sleepLogs);
      if (res.data.streaks) setStreaks(res.data.streaks);
    }
    return res;
  };

  return {
    isHydrated,
    persistenceError,
    clearPersistenceError,
    profile, goals, cravings, expenses, substanceLogs, sleepLogs, streaks,
    stats, report,
    actions: {
      updateProfile, toggleTheme, toggleSound, toggleLanguage, setLanguage, logSubstance, removeSubstance, resistCraving, saveSleepEnergyEntry,
      addExpense, deleteExpense, addGoal, deleteGoal, toggleGoal, completeOnboarding, resetAll, rehydrate, recoverLocalData, importUserData,
    },
  };
}
