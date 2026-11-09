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
  JournalEvent,
} from '../types/index.ts';
import {
  loadProfile,
  loadSavingsGoals,
  loadCravings,
  loadExpenses,
  loadSubstanceLogs,
  loadSleepEnergy,
  loadStreaks,
  initIndexedDBStorage, resetAllUserData,
  importUserDataJSON,
  DEFAULT_PROFILE,
  STORAGE_KEYS,
  persistAtomicBatch,
} from '../utils/storage.ts';
import { recoverAllDeviceData, createDeviceRescueSnapshot } from '../utils/recovery.ts';
import { createJournalEvent, restoreJournalSequence } from '../utils/journal.ts';
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
        if (data.profile) setProfile((prev) => data.profile || prev);
        if (data.goals && data.goals.length > 0) setGoals(data.goals);
        if (data.cravings && data.cravings.length > 0) setCravings(data.cravings);
        if (data.expenses && data.expenses.length > 0) setExpenses(data.expenses);
        if (data.substanceLogs && data.substanceLogs.length > 0) setSubstanceLogs(data.substanceLogs);
        if (data.sleepLogs && data.sleepLogs.length > 0) setSleepLogs(data.sleepLogs);
        if (data.streaks && data.streaks.length > 0) setStreaks(data.streaks);
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

  // ---------- Actions with Truly Atomic Journal & Projection Persistence ----------

  const updateProfile = async (p: Partial<UserProfile>): Promise<void> => {
    const prevProfile = profile;
    const merged: UserProfile = { ...DEFAULT_PROFILE, ...profile, ...p };
    setProfile(merged);
    try {
      const event = await createJournalEvent('PROFILE_UPDATED', merged);
      await persistAtomicBatch({
        projections: [{ key: STORAGE_KEYS.PROFILE, value: merged }],
        events: [event],
        rescueSnapshot: { profile: merged },
      });
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
      const evLog = await createJournalEvent('SUBSTANCE_LOGGED', entry, entry.id);
      const evCrave = await createJournalEvent('CRAVING_LOGGED', craveEntry, craveEntry.id);
      const events: JournalEvent[] = [evLog, evCrave];

      if (streakRecord) {
        const evStreak = await createJournalEvent('STREAK_RECORDED', streakRecord, streakRecord.id);
        events.push(evStreak);
      }

      const evProfile = await createJournalEvent('PROFILE_UPDATED', updatedProfile);
      events.push(evProfile);

      const projections: Array<{ key: string; value: unknown }> = [
        { key: STORAGE_KEYS.SUBSTANCE_LOG, value: logs },
        { key: STORAGE_KEYS.CRAVINGS, value: nextCravings },
        { key: STORAGE_KEYS.PROFILE, value: updatedProfile },
      ];
      if (streakRecord) {
        projections.push({ key: STORAGE_KEYS.STREAKS, value: nextStreaks });
      }
      if (syncedSleep !== sleepLogs) {
        projections.push({ key: STORAGE_KEYS.SLEEP_ENERGY, value: syncedSleep });
      }

      await persistAtomicBatch({
        projections,
        events,
        rescueSnapshot: {
          substanceLogs: logs,
          cravings: nextCravings,
          streaks: nextStreaks,
          profile: updatedProfile,
          sleepLogs: syncedSleep,
        },
      });

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
      const events: JournalEvent[] = [
        await createJournalEvent('SUBSTANCE_REMOVED', { substance, count, date: today }),
      ];

      if (removedCravings.length > 0) {
        for (const rc of removedCravings) {
          events.push(await createJournalEvent('CRAVING_REMOVED', { cravingId: rc.id }, rc.id));
        }
      }

      if (restoredStreak && restoredQuitDate) {
        events.push(await createJournalEvent('STREAK_REMOVED', { streakId: restoredStreak.id }, restoredStreak.id));
        events.push(await createJournalEvent('PROFILE_UPDATED', { ...profile, quitDate: restoredQuitDate }));
      }

      const projections: Array<{ key: string; value: unknown }> = [
        { key: STORAGE_KEYS.SUBSTANCE_LOG, value: newLogs },
      ];
      if (removedCravings.length > 0) {
        projections.push({ key: STORAGE_KEYS.CRAVINGS, value: cleanedCravings });
      }
      if (restoredStreak && restoredQuitDate) {
        projections.push({ key: STORAGE_KEYS.STREAKS, value: remainingStreaks });
        projections.push({ key: STORAGE_KEYS.PROFILE, value: { ...profile, quitDate: restoredQuitDate } });
      }

      await persistAtomicBatch({
        projections,
        events,
        rescueSnapshot: {
          substanceLogs: newLogs,
          cravings: cleanedCravings,
          streaks: remainingStreaks,
          profile: restoredStreak && restoredQuitDate ? { ...profile, quitDate: restoredQuitDate } : undefined,
        },
      });

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
      const event = await createJournalEvent('CRAVING_LOGGED', entry, entry.id);
      await persistAtomicBatch({
        projections: [{ key: STORAGE_KEYS.CRAVINGS, value: next }],
        events: [event],
        rescueSnapshot: { cravings: next },
      });
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
      const event = await createJournalEvent('SLEEP_ENERGY_LOGGED', entry, entry.id || entry.date);
      await persistAtomicBatch({
        projections: [{ key: STORAGE_KEYS.SLEEP_ENERGY, value: next }],
        events: [event],
        rescueSnapshot: { sleepLogs: next },
      });
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
      const event = await createJournalEvent('PURCHASE_EXPENSE_LOGGED', e, e.id);
      await persistAtomicBatch({
        projections: [{ key: STORAGE_KEYS.EXPENSES, value: next }],
        events: [event],
        rescueSnapshot: { expenses: next },
      });
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
      const event = await createJournalEvent('PURCHASE_EXPENSE_DELETED', { expenseId: id }, id);
      await persistAtomicBatch({
        projections: [{ key: STORAGE_KEYS.EXPENSES, value: next }],
        events: [event],
        rescueSnapshot: { expenses: next },
      });
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
      const event = await createJournalEvent('SAVINGS_GOAL_ADDED', g, g.id);
      await persistAtomicBatch({
        projections: [{ key: STORAGE_KEYS.SAVINGS_GOALS, value: next }],
        events: [event],
        rescueSnapshot: { goals: next },
      });
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
      const event = await createJournalEvent('SAVINGS_GOAL_DELETED', { goalId: id }, id);
      await persistAtomicBatch({
        projections: [{ key: STORAGE_KEYS.SAVINGS_GOALS, value: next }],
        events: [event],
        rescueSnapshot: { goals: next },
      });
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
      const event = await createJournalEvent('SAVINGS_GOAL_TOGGLED', { goalId: id, completed: !current?.completed }, id);
      await persistAtomicBatch({
        projections: [{ key: STORAGE_KEYS.SAVINGS_GOALS, value: next }],
        events: [event],
        rescueSnapshot: { goals: next },
      });
      setPersistenceError(null);
    } catch (err) {
      setGoals(prevGoals);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setPersistenceError(errorObj);
      throw errorObj;
    }
  };

  const completeOnboarding = async (p: Partial<UserProfile>): Promise<void> => {
    const finalized: UserProfile = { ...DEFAULT_PROFILE, ...profile, ...p, isOnboarded: true };
    await updateProfile(finalized);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('puffinless_is_onboarded', 'true');
      if (finalized.quitDate) localStorage.setItem('puffinless_quit_date', finalized.quitDate);
      if (finalized.name) localStorage.setItem('puffinless_user_name', finalized.name);
      if (finalized.language) {
        localStorage.setItem('puffinless_app_lang', finalized.language);
        localStorage.setItem('puffinless_lang', finalized.language);
      }
      if (finalized.theme) {
        localStorage.setItem('puffinless_app_theme', finalized.theme);
        localStorage.setItem('puffinless_theme', finalized.theme);
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
        if (data.profile) setProfile((prev) => data.profile || prev);
        if (data.goals && data.goals.length > 0) setGoals(data.goals);
        if (data.cravings && data.cravings.length > 0) setCravings(data.cravings);
        if (data.expenses && data.expenses.length > 0) setExpenses(data.expenses);
        if (data.substanceLogs && data.substanceLogs.length > 0) setSubstanceLogs(data.substanceLogs);
        if (data.sleepLogs && data.sleepLogs.length > 0) setSleepLogs(data.sleepLogs);
        if (data.streaks && data.streaks.length > 0) setStreaks(data.streaks);
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

  const store = {
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

  if (typeof window !== 'undefined') {
    (window as any).__PUFFINLESS_STORE__ = store;
  }

  return store;
}
