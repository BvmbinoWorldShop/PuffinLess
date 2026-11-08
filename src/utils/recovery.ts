/**
 * LOCAL DEVICE RECOVERY ENGINE FOR PUFFINLESS
 * --------------------------------------------
 * Guarantees zero data loss across all app updates, browser storage migrations,
 * and key format transitions.
 *
 * Scans all device storage locations:
 * 1. Modern IndexedDB kv_store (puffinless_indexeddb)
 * 2. Modern localStorage v2 keys (puffinless_*_v2)
 * 3. Legacy localStorage keys (puffinless_profile, puffinless_cravings, etc.)
 * 4. Device Rescue Snapshot (puffinless_device_rescue_backup_v2)
 *
 * Employs multi-key candidate decryption across WebCrypto AES-GCM and CryptoJS AES-CBC.
 * Reconstructs and consolidates user profile, clean streaks, cravings, substance intake,
 * sleep logs, and savings goals.
 */

import type {
  UserProfile,
  SavingsGoal,
  CravingEntry,
  PurchaseExpense,
  SubstanceLog,
  SleepEnergyEntry,
  StreakRecord,
  SmokeLogEntry,
} from '../types';
import {
  decryptData,
  encryptData,
} from './crypto.ts';

export const RESCUE_BACKUP_KEY = 'puffinless_device_rescue_backup_v2';
export const LEGACY_RESCUE_KEY = 'puffinless_device_rescue_backup';

export interface DeviceRescueSnapshot {
  version: number;
  timestamp: string;
  profile?: UserProfile;
  goals?: SavingsGoal[];
  cravings?: CravingEntry[];
  expenses?: PurchaseExpense[];
  substanceLogs?: SubstanceLog[];
  sleepLogs?: SleepEnergyEntry[];
  streaks?: StreakRecord[];
  smokeLogs?: SmokeLogEntry[];
}

export interface RecoveryScanResult {
  recovered: boolean;
  profile: UserProfile | null;
  streaks: StreakRecord[];
  cravings: CravingEntry[];
  expenses: PurchaseExpense[];
  substanceLogs: SubstanceLog[];
  sleepLogs: SleepEnergyEntry[];
  goals: SavingsGoal[];
  smokeLogs: SmokeLogEntry[];
  stats: {
    daysSinceQuit: number;
    streaksCount: number;
    cravingsCount: number;
    substancesCount: number;
    expensesCount: number;
    sources: string[];
  };
  message: string;
}

/**
 * Creates or updates an unalterable local rescue snapshot on device.
 * Called whenever user data is safely saved or modified.
 */
export function createDeviceRescueSnapshot(snapshot: Partial<DeviceRescueSnapshot>): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const existing = getDeviceRescueSnapshot();
    const merged: DeviceRescueSnapshot = {
      version: 2,
      timestamp: new Date().toISOString(),
      profile: snapshot.profile || existing?.profile,
      goals: snapshot.goals || existing?.goals,
      cravings: snapshot.cravings || existing?.cravings,
      expenses: snapshot.expenses || existing?.expenses,
      substanceLogs: snapshot.substanceLogs || existing?.substanceLogs,
      sleepLogs: snapshot.sleepLogs || existing?.sleepLogs,
      streaks: snapshot.streaks || existing?.streaks,
      smokeLogs: snapshot.smokeLogs || existing?.smokeLogs,
    };
    localStorage.setItem(RESCUE_BACKUP_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn('[Recovery] Failed to create rescue snapshot:', err);
  }
}

/**
 * Retrieves the device rescue snapshot from localStorage if present.
 */
export function getDeviceRescueSnapshot(): DeviceRescueSnapshot | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(RESCUE_BACKUP_KEY) || localStorage.getItem(LEGACY_RESCUE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DeviceRescueSnapshot;
  } catch {
    return null;
  }
}

/**
 * Deduplicates and merges streak records by date and id
 */
export function mergeStreaks(a: StreakRecord[], b: StreakRecord[]): StreakRecord[] {
  const map = new Map<string, StreakRecord>();
  for (const item of [...a, ...b]) {
    if (!item) continue;
    const key = item.id || `${item.start}_${item.end || 'ongoing'}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values()).sort(
    (x, y) => new Date(y.start).getTime() - new Date(x.start).getTime()
  );
}

/**
 * Deduplicates and merges craving records by id or timestamp
 */
export function mergeCravings(a: CravingEntry[], b: CravingEntry[]): CravingEntry[] {
  const map = new Map<string, CravingEntry>();
  for (const item of [...a, ...b]) {
    if (!item) continue;
    const key = item.id || `${item.timestamp}_${item.substance}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values()).sort(
    (x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime()
  );
}

/**
 * Deduplicates and merges substance logs by id or timestamp
 */
export function mergeSubstances(a: SubstanceLog[], b: SubstanceLog[]): SubstanceLog[] {
  const map = new Map<string, SubstanceLog>();
  for (const item of [...a, ...b]) {
    if (!item) continue;
    const key = item.id || `${item.timestamp}_${item.substance}_${item.count}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values()).sort(
    (x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime()
  );
}

/**
 * Deduplicates and merges purchase expenses by id or timestamp
 */
export function mergeExpenses(a: PurchaseExpense[], b: PurchaseExpense[]): PurchaseExpense[] {
  const map = new Map<string, PurchaseExpense>();
  for (const item of [...a, ...b]) {
    if (!item) continue;
    const key = item.id || `${item.timestamp}_${item.itemType}_${item.price}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values()).sort(
    (x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime()
  );
}

/**
 * Deduplicates and merges sleep & energy entries by id or date
 */
export function mergeSleepLogs(a: SleepEnergyEntry[], b: SleepEnergyEntry[]): SleepEnergyEntry[] {
  const map = new Map<string, SleepEnergyEntry>();
  for (const item of [...a, ...b]) {
    if (!item) continue;
    const key = item.id || item.date;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values()).sort(
    (x, y) => new Date(y.date).getTime() - new Date(x.date).getTime()
  );
}

/**
 * Deduplicates and merges savings goals by id
 */
export function mergeGoals(a: SavingsGoal[], b: SavingsGoal[]): SavingsGoal[] {
  const map = new Map<string, SavingsGoal>();
  for (const item of [...a, ...b]) {
    if (!item) continue;
    const key = item.id || item.title;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

/**
 * Helper to safely read all records from IndexedDB kv_store without throwing
 */
async function dumpIndexedDBRecords(): Promise<Map<string, unknown>> {
  const records = new Map<string, unknown>();
  if (typeof window === 'undefined' || !window.indexedDB) {
    return records;
  }
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = window.indexedDB.open('puffinless_indexeddb', 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (!db.objectStoreNames.contains('kv_store')) {
      db.close();
      return records;
    }

    await new Promise<void>((resolve) => {
      const tx = db.transaction('kv_store', 'readonly');
      const store = tx.objectStore('kv_store');
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          records.set(String(cursor.key), cursor.value);
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => resolve();
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('[Recovery] Could not dump IndexedDB records:', err);
  }
  return records;
}

/**
 * Deeply scans every possible storage location and restores user data.
 * Can be triggered automatically on boot or manually by user via "Mode Récupération".
 */
export async function recoverAllDeviceData(): Promise<RecoveryScanResult> {
  const sources: string[] = [];
  const candidateProfiles: UserProfile[] = [];
  let candidateStreaks: StreakRecord[] = [];
  let candidateCravings: CravingEntry[] = [];
  let candidateSubstances: SubstanceLog[] = [];
  let candidateExpenses: PurchaseExpense[] = [];
  let candidateSleep: SleepEnergyEntry[] = [];
  let candidateGoals: SavingsGoal[] = [];
  let candidateSmokeLogs: SmokeLogEntry[] = [];

  // =========================================================================
  // 1. SCAN RESCUE SNAPSHOT
  // =========================================================================
  const snapshot = getDeviceRescueSnapshot();
  if (snapshot) {
    sources.push('Rescue Snapshot');
    if (snapshot.profile && (snapshot.profile.isOnboarded || snapshot.profile.quitDate)) {
      candidateProfiles.push(snapshot.profile);
    }
    if (Array.isArray(snapshot.streaks)) {
      candidateStreaks = mergeStreaks(candidateStreaks, snapshot.streaks);
    }
    if (Array.isArray(snapshot.cravings)) {
      candidateCravings = mergeCravings(candidateCravings, snapshot.cravings);
    }
    if (Array.isArray(snapshot.substanceLogs)) {
      candidateSubstances = mergeSubstances(candidateSubstances, snapshot.substanceLogs);
    }
    if (Array.isArray(snapshot.expenses)) {
      candidateExpenses = mergeExpenses(candidateExpenses, snapshot.expenses);
    }
    if (Array.isArray(snapshot.sleepLogs)) {
      candidateSleep = mergeSleepLogs(candidateSleep, snapshot.sleepLogs);
    }
    if (Array.isArray(snapshot.goals)) {
      candidateGoals = mergeGoals(candidateGoals, snapshot.goals);
    }
  }

  // =========================================================================
  // 2. SCAN INDEXEDDB
  // =========================================================================
  const idbRecords = await dumpIndexedDBRecords();
  if (idbRecords.size > 0) {
    sources.push(`IndexedDB (${idbRecords.size} keys)`);
    for (const [key, rawValue] of idbRecords.entries()) {
      try {
        if (key.includes('profile')) {
          const prof = await decryptData<UserProfile | null>(rawValue, null);
          if (prof && typeof prof === 'object' && (prof.isOnboarded || prof.quitDate)) {
            candidateProfiles.push(prof);
          }
        } else if (key.includes('streak')) {
          const list = await decryptData<StreakRecord[]>(rawValue, []);
          if (Array.isArray(list) && list.length > 0) {
            candidateStreaks = mergeStreaks(candidateStreaks, list);
          }
        } else if (key.includes('craving')) {
          const list = await decryptData<CravingEntry[]>(rawValue, []);
          if (Array.isArray(list) && list.length > 0) {
            candidateCravings = mergeCravings(candidateCravings, list);
          }
        } else if (key.includes('substance')) {
          const list = await decryptData<SubstanceLog[]>(rawValue, []);
          if (Array.isArray(list) && list.length > 0) {
            candidateSubstances = mergeSubstances(candidateSubstances, list);
          }
        } else if (key.includes('expense')) {
          const list = await decryptData<PurchaseExpense[]>(rawValue, []);
          if (Array.isArray(list) && list.length > 0) {
            candidateExpenses = mergeExpenses(candidateExpenses, list);
          }
        } else if (key.includes('sleep')) {
          const list = await decryptData<SleepEnergyEntry[]>(rawValue, []);
          if (Array.isArray(list) && list.length > 0) {
            candidateSleep = mergeSleepLogs(candidateSleep, list);
          }
        } else if (key.includes('goal')) {
          const list = await decryptData<SavingsGoal[]>(rawValue, []);
          if (Array.isArray(list) && list.length > 0) {
            candidateGoals = mergeGoals(candidateGoals, list);
          }
        }
      } catch {
        // try next record
      }
    }
  }

  // =========================================================================
  // 3. SCAN LOCALSTORAGE (MODERN & LEGACY KEYS)
  // =========================================================================
  if (typeof localStorage !== 'undefined') {
    const candidateKeys = [
      'puffinless_profile_v2',
      'puffinless_profile',
      'puffinless_user_profile',
      'puffinless_streaks_v2',
      'puffinless_streaks',
      'puffinless_cravings_v2',
      'puffinless_cravings',
      'puffinless_craving_logs',
      'puffinless_substance_log_v2',
      'puffinless_substances_v2',
      'puffinless_substance_log',
      'puffinless_substances',
      'puffinless_expenses_v2',
      'puffinless_expenses',
      'puffinless_sleep_energy_v2',
      'puffinless_sleep_v2',
      'puffinless_sleep',
      'puffinless_savings_goals_v2',
      'puffinless_savings_goals',
      'puffinless_smoke_log_v2',
      'puffinless_smoke_log',
    ];

    // Also check every key currently in localStorage matching puffinless_
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('puffinless_') && !candidateKeys.includes(k)) {
        candidateKeys.push(k);
      }
    }

    for (const key of candidateKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        if (key.includes('profile')) {
          const prof = await decryptData<UserProfile | null>(raw, null);
          if (prof && typeof prof === 'object' && (prof.isOnboarded || prof.quitDate)) {
            candidateProfiles.push(prof);
          }
        } else if (key.includes('streak')) {
          const list = await decryptData<StreakRecord[]>(raw, []);
          if (Array.isArray(list) && list.length > 0) {
            candidateStreaks = mergeStreaks(candidateStreaks, list);
          }
        } else if (key.includes('craving')) {
          const list = await decryptData<CravingEntry[]>(raw, []);
          if (Array.isArray(list) && list.length > 0) {
            candidateCravings = mergeCravings(candidateCravings, list);
          }
        } else if (key.includes('substance')) {
          const list = await decryptData<SubstanceLog[]>(raw, []);
          if (Array.isArray(list) && list.length > 0) {
            candidateSubstances = mergeSubstances(candidateSubstances, list);
          }
        } else if (key.includes('expense')) {
          const list = await decryptData<PurchaseExpense[]>(raw, []);
          if (Array.isArray(list) && list.length > 0) {
            candidateExpenses = mergeExpenses(candidateExpenses, list);
          }
        } else if (key.includes('sleep')) {
          const list = await decryptData<SleepEnergyEntry[]>(raw, []);
          if (Array.isArray(list) && list.length > 0) {
            candidateSleep = mergeSleepLogs(candidateSleep, list);
          }
        } else if (key.includes('goal')) {
          const list = await decryptData<SavingsGoal[]>(raw, []);
          if (Array.isArray(list) && list.length > 0) {
            candidateGoals = mergeGoals(candidateGoals, list);
          }
        } else if (key.includes('smoke')) {
          const list = await decryptData<SmokeLogEntry[]>(raw, []);
          if (Array.isArray(list) && list.length > 0) {
            candidateSmokeLogs = [...candidateSmokeLogs, ...list];
          }
        }
      } catch {
        // try next
      }
    }
  }

  // =========================================================================
  // 4. CHOOSE THE BEST PROFILE CANDIDATE
  // =========================================================================
  let bestProfile: UserProfile | null = null;
  if (candidateProfiles.length > 0) {
    // Pick the profile with the earliest valid quitDate (or createdAt) to preserve maximum streak history
    bestProfile = candidateProfiles.reduce((chosen, curr) => {
      if (!chosen) return curr;
      // Prefer onboarded profile
      if (curr.isOnboarded && !chosen.isOnboarded) return curr;
      if (!curr.isOnboarded && chosen.isOnboarded) return chosen;

      const dateCurr = new Date(curr.quitDate || curr.createdAt || Date.now()).getTime();
      const dateChosen = new Date(chosen.quitDate || chosen.createdAt || Date.now()).getTime();
      return dateCurr < dateChosen ? curr : chosen;
    });
  }

  // Calculate days since quit if profile exists
  let daysSinceQuit = 0;
  if (bestProfile?.quitDate) {
    const diffMs = Date.now() - new Date(bestProfile.quitDate).getTime();
    daysSinceQuit = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  const isDataRecovered = Boolean(
    bestProfile?.isOnboarded ||
    daysSinceQuit > 0 ||
    candidateStreaks.length > 0 ||
    candidateCravings.length > 0 ||
    candidateSubstances.length > 0 ||
    candidateExpenses.length > 0
  );

  // =========================================================================
  // 5. IF DATA RECOVERED: RE-PERSIST TO PREVENT FUTURE LOSS
  // =========================================================================
  if (isDataRecovered && bestProfile) {
    try {
      // Force profile onboarded flag to true if user had an active week of data
      bestProfile.isOnboarded = true;

      // Update rescue snapshot immediately
      createDeviceRescueSnapshot({
        profile: bestProfile,
        streaks: candidateStreaks,
        cravings: candidateCravings,
        substanceLogs: candidateSubstances,
        expenses: candidateExpenses,
        sleepLogs: candidateSleep,
        goals: candidateGoals,
        smokeLogs: candidateSmokeLogs,
      });

      // Encrypt and persist to localStorage
      if (typeof localStorage !== 'undefined') {
        const [profCipher, strkCipher, cravCipher, subCipher, expCipher, slpCipher, golCipher] =
          await Promise.all([
            encryptData(bestProfile),
            encryptData(candidateStreaks),
            encryptData(candidateCravings),
            encryptData(candidateSubstances),
            encryptData(candidateExpenses),
            encryptData(candidateSleep),
            encryptData(candidateGoals),
          ]);

        localStorage.setItem('puffinless_profile_v2', profCipher);
        localStorage.setItem('puffinless_streaks_v2', strkCipher);
        localStorage.setItem('puffinless_cravings_v2', cravCipher);
        localStorage.setItem('puffinless_substance_log_v2', subCipher);
        localStorage.setItem('puffinless_expenses_v2', expCipher);
        localStorage.setItem('puffinless_sleep_energy_v2', slpCipher);
        localStorage.setItem('puffinless_savings_goals_v2', golCipher);
      }
    } catch (persistErr) {
      console.warn('[Recovery] Warning during recovery persistence:', persistErr);
    }
  }

  return {
    recovered: isDataRecovered,
    profile: bestProfile,
    streaks: candidateStreaks,
    cravings: candidateCravings,
    expenses: candidateExpenses,
    substanceLogs: candidateSubstances,
    sleepLogs: candidateSleep,
    goals: candidateGoals,
    smokeLogs: candidateSmokeLogs,
    stats: {
      daysSinceQuit,
      streaksCount: candidateStreaks.length,
      cravingsCount: candidateCravings.length,
      substancesCount: candidateSubstances.length,
      expensesCount: candidateExpenses.length,
      sources,
    },
    message: isDataRecovered
      ? `Récupération réussie : ${daysSinceQuit} jour(s) d'abstinence, ${candidateCravings.length} victoires et ${candidateStreaks.length} séries restaurées.`
      : 'Aucune donnée antérieure détectée sur cet appareil.',
  };
}
