import { useEffect, useMemo, useState } from 'react';
import type {
  UserProfile,
  Language,
  SavingsGoal,
  CravingEntry,
  ForumPost,
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
  loadForumPosts, saveForumPosts,
  loadStreaks, saveStreaks,
  DEFAULT_PROFILE, DEFAULT_SAVINGS_GOALS, DEFAULT_FORUM_POSTS,
} from '../utils/storage';
import { calculateStats } from '../utils/calculations';
import { buildCoreReport, sumIntake } from '../core/obsidianCore';
import { localDateStr } from '../utils/dates';
import { sound } from '../utils/audio';

/**
 * Central app store. Owns all persisted state and every action, so screens stay thin and the
 * Obsidian Core always reads one consistent source of truth.
 */
export function useAppStore() {
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [goals, setGoals] = useState<SavingsGoal[]>(loadSavingsGoals);
  const [cravings, setCravings] = useState<CravingEntry[]>(loadCravings);
  const [expenses, setExpenses] = useState<PurchaseExpense[]>(loadExpenses);
  const [substanceLogs, setSubstanceLogs] = useState<SubstanceLog[]>(loadSubstanceLogs);
  const [sleepLogs, setSleepLogs] = useState<SleepEnergyEntry[]>(loadSleepEnergy);
  const [posts, setPosts] = useState<ForumPost[]>(loadForumPosts);
  const [streaks, setStreaks] = useState<StreakRecord[]>(loadStreaks);

  const [tick, setTick] = useState(0);

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
  const logSubstance = (substance: SubstanceType, count: number, trigger?: string) => {
    const now = new Date();
    const entry: SubstanceLog = {
      id: 'sub-' + now.getTime(),
      substance,
      count,
      timestamp: now.toISOString(),
      trigger,
    };
    const logs = [entry, ...substanceLogs];
    setSubstanceLogs(logs);
    saveSubstanceLogs(logs);

    // Close the streak (ignore accidental double taps under a minute)
    const streakLength = now.getTime() - new Date(profile.quitDate).getTime();
    if (streakLength >= 60000) {
      const record: StreakRecord = {
        id: 'st-' + now.getTime(),
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

  /** Mark a craving as resisted (from the Craving button). Remembered by the Core. */
  const resistCraving = (trigger: string, intensity: number, substance?: SubstanceType) => {
    const entry: CravingEntry = {
      id: 'c-' + Date.now(),
      timestamp: new Date().toISOString(),
      intensity,
      trigger,
      resisted: true,
      substance,
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
  const toggleGoal = (id: string) => {
    const next = goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g));
    setGoals(next);
    saveSavingsGoals(next);
  };

  const addPost = (p: ForumPost) => {
    const next = [p, ...posts];
    setPosts(next);
    saveForumPosts(next);
  };
  const toggleLike = (id: string) => {
    const next = posts.map((p) =>
      p.id === id ? { ...p, userLiked: !p.userLiked, likes: p.userLiked ? Math.max(0, p.likes - 1) : p.likes + 1 } : p
    );
    setPosts(next);
    saveForumPosts(next);
  };

  const completeOnboarding = (p: UserProfile) => updateProfile(p);

  const resetAll = () => {
    localStorage.clear();
    setProfile({ ...DEFAULT_PROFILE, quitDate: new Date().toISOString() });
    setGoals(DEFAULT_SAVINGS_GOALS);
    setPosts(DEFAULT_FORUM_POSTS);
    setExpenses([]);
    setSleepLogs([]);
    setSubstanceLogs([]);
    setCravings([]);
    setStreaks([]);
  };

  return {
    profile, goals, cravings, expenses, substanceLogs, sleepLogs, posts, streaks,
    stats, report,
    actions: {
      updateProfile, toggleTheme, toggleSound, toggleLanguage, setLanguage, logSubstance, resistCraving, saveSleepEnergyEntry,
      addExpense, deleteExpense, addGoal, toggleGoal, addPost, toggleLike, completeOnboarding, resetAll,
    },
  };
}
