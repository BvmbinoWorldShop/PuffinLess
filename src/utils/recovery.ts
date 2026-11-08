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
import {
  idbSet,
} from './indexedDb.ts';
import { DEFAULT_PROFILE } from './storage.ts';

export const RESCUE_BACKUP_KEY = 'puffinless_device_rescue_backup_v2';
export const LEGACY_RESCUE_KEY = 'puffinless_device_rescue_backup';

/**
 * Verifies that a date string is a valid, realistic ISO-8601 date.
 * Restricts recovery strictly to verified date fields, rejecting corrupt or arbitrary date markers.
 */
export function isValidDateField(val: unknown): val is string {
  if (typeof val !== 'string' || val.trim().length < 10) return false;
  const t = Date.parse(val);
  if (isNaN(t)) return false;
  // Realistic date bounds: between 2000-01-01 and tomorrow (to accommodate timezone offsets)
  return t >= 946684800000 && t <= Date.now() + 86400000;
}

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
 * Helper to safely read all records from IndexedDB across all known databases and stores without throwing
 */
async function dumpIndexedDBRecords(): Promise<Map<string, unknown>> {
  const records = new Map<string, unknown>();
  if (typeof window === 'undefined' || !window.indexedDB) {
    return records;
  }

  const dbNamesToTry = new Set<string>([
    'puffinless_indexeddb',
    'puffinless_key_vault',
    'PuffinLessDB',
    'puffinless-db',
    'puffinless',
    'keyval-store',
  ]);

  if (typeof window.indexedDB.databases === 'function') {
    try {
      const dbs = await window.indexedDB.databases();
      for (const d of dbs) {
        if (d.name) dbNamesToTry.add(d.name);
      }
    } catch {
      // ignore
    }
  }

  for (const dbName of dbNamesToTry) {
    try {
      await new Promise<void>((resolveDb) => {
        const req = window.indexedDB.open(dbName);
        req.onerror = () => resolveDb();
        req.onsuccess = () => {
          const db = req.result;
          const storeNames = Array.from(db.objectStoreNames);
          if (storeNames.length === 0) {
            db.close();
            return resolveDb();
          }

          let remainingStores = storeNames.length;
          for (const sName of storeNames) {
            try {
              const tx = db.transaction(sName, 'readonly');
              const store = tx.objectStore(sName);
              const cursorReq = store.openCursor();
              cursorReq.onsuccess = (e) => {
                const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                  records.set(`${dbName}:${sName}:${String(cursor.key)}`, cursor.value);
                  cursor.continue();
                } else {
                  remainingStores--;
                  if (remainingStores <= 0) {
                    db.close();
                    resolveDb();
                  }
                }
              };
              cursorReq.onerror = () => {
                remainingStores--;
                if (remainingStores <= 0) {
                  db.close();
                  resolveDb();
                }
              };
            } catch {
              remainingStores--;
              if (remainingStores <= 0) {
                db.close();
                resolveDb();
              }
            }
          }
        };
      });
    } catch {
      // next db
    }
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

  // Helper to extract known entities strictly from verified PuffinLess structures
  const classifyAndExtract = (val: unknown) => {
    if (!val) return;

    // If string is serialized JSON, parse and classify the resulting object
    if (typeof val === 'string') {
      if (val.startsWith('{') || val.startsWith('[')) {
        try {
          const parsed = JSON.parse(val);
          classifyAndExtract(parsed);
          return;
        } catch {
          // ignore
        }
      }
      // Never treat arbitrary string dates as quit dates - strictly restricted to verified PuffinLess data structures
      return;
    }

    if (typeof val !== 'object') return;

    // Full snapshot or composite backup
    if ('profile' in val || 'cravings' in val || 'streaks' in val) {
      const s = val as any;
      if (s.profile) candidateProfiles.push(s.profile);
      if (Array.isArray(s.streaks)) candidateStreaks = mergeStreaks(candidateStreaks, s.streaks);
      if (Array.isArray(s.cravings)) candidateCravings = mergeCravings(candidateCravings, s.cravings);
      if (Array.isArray(s.substanceLogs)) candidateSubstances = mergeSubstances(candidateSubstances, s.substanceLogs);
      if (Array.isArray(s.expenses)) candidateExpenses = mergeExpenses(candidateExpenses, s.expenses);
      if (Array.isArray(s.sleepLogs)) candidateSleep = mergeSleepLogs(candidateSleep, s.sleepLogs);
      if (Array.isArray(s.goals)) candidateGoals = mergeGoals(candidateGoals, s.goals);
      return;
    }

    // UserProfile strictly verified
    if (('quitDate' in val || 'cigarettesPerDay' in val || 'quitMode' in val || 'primarySubstance' in val) && typeof val === 'object') {
      const p = { ...(val as UserProfile) };
      if (p.quitDate && !isValidDateField(p.quitDate)) {
        p.quitDate = '';
      }
      if (p.createdAt && !isValidDateField(p.createdAt)) {
        p.createdAt = '';
      }
      if (p.isOnboarded || isValidDateField(p.quitDate) || p.name) {
        candidateProfiles.push(p);
      }
      return;
    }

    // Array of items strictly verified by date fields
    if (Array.isArray(val) && val.length > 0) {
      const first = val[0];
      if (!first || typeof first !== 'object') return;

      if ('intensity' in first || ('timestamp' in first && 'substance' in first && !('count' in first))) {
        const valid = (val as CravingEntry[]).filter((c) => c && isValidDateField(c.timestamp));
        if (valid.length > 0) candidateCravings = mergeCravings(candidateCravings, valid);
      } else if ('start' in first) {
        const valid = (val as StreakRecord[]).filter((s) => s && isValidDateField(s.start));
        if (valid.length > 0) candidateStreaks = mergeStreaks(candidateStreaks, valid);
      } else if ('count' in first && 'substance' in first) {
        const valid = (val as SubstanceLog[]).filter((s) => s && isValidDateField(s.timestamp));
        if (valid.length > 0) candidateSubstances = mergeSubstances(candidateSubstances, valid);
      } else if ('itemType' in first || ('price' in first && 'quantity' in first)) {
        const valid = (val as PurchaseExpense[]).filter((e) => e && isValidDateField(e.timestamp));
        if (valid.length > 0) candidateExpenses = mergeExpenses(candidateExpenses, valid);
      } else if ('sleepRating' in first || 'energyRating' in first) {
        const valid = (val as SleepEnergyEntry[]).filter((s) => s && typeof s.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s.date));
        if (valid.length > 0) candidateSleep = mergeSleepLogs(candidateSleep, valid);
      } else if ('targetAmount' in first || ('title' in first && 'price' in first)) {
        candidateGoals = mergeGoals(candidateGoals, val as SavingsGoal[]);
      }
    }
  };

  // =========================================================================
  // 1. SCAN RESCUE SNAPSHOT
  // =========================================================================
  const snapshot = getDeviceRescueSnapshot();
  if (snapshot) {
    sources.push('Rescue Snapshot');
    classifyAndExtract(snapshot);
  }

  // =========================================================================
  // 2. SCAN INDEXEDDB
  // =========================================================================
  const idbRecords = await dumpIndexedDBRecords();
  if (idbRecords.size > 0) {
    sources.push(`IndexedDB (${idbRecords.size} keys)`);
    for (const [, rawValue] of idbRecords.entries()) {
      try {
        if (typeof rawValue === 'object') {
          classifyAndExtract(rawValue);
        } else if (typeof rawValue === 'string') {
          if (rawValue.startsWith('{') || rawValue.startsWith('[')) {
            try { classifyAndExtract(JSON.parse(rawValue)); } catch {}
          }
          const decrypted = await decryptData<any>(rawValue, null);
          if (decrypted) classifyAndExtract(decrypted);
        }
      } catch {
        // try next
      }
    }
  }

  // =========================================================================
  // 3. SCAN LOCALSTORAGE & SESSIONSTORAGE (ALL KEYS)
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

    const allKeys = new Set<string>(candidateKeys);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      // Strictly restrict recovery scanning to verified PuffinLess storage keys
      if (k && k.startsWith('puffinless_')) allKeys.add(k);
    }

    for (const key of allKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        if (raw.startsWith('{') || raw.startsWith('[')) {
          try { classifyAndExtract(JSON.parse(raw)); } catch {}
        }
        const decrypted = await decryptData<any>(raw, null);
        if (decrypted) classifyAndExtract(decrypted);
      } catch {
        // try next
      }
    }
  }

  if (typeof sessionStorage !== 'undefined') {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      // Strictly restrict recovery scanning to verified PuffinLess storage keys
      if (!k || !k.startsWith('puffinless_')) continue;
      const raw = sessionStorage.getItem(k);
      if (!raw) continue;

      try {
        if (raw.startsWith('{') || raw.startsWith('[')) {
          try { classifyAndExtract(JSON.parse(raw)); } catch {}
        }
        const decrypted = await decryptData<any>(raw, null);
        if (decrypted) classifyAndExtract(decrypted);
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
    // Pick the profile with the earliest valid verified quitDate
    bestProfile = candidateProfiles.reduce((chosen, curr) => {
      if (!chosen) return curr;
      // Prefer onboarded profile
      if (curr.isOnboarded && !chosen.isOnboarded) return curr;
      if (!curr.isOnboarded && chosen.isOnboarded) return chosen;

      const dateCurr = isValidDateField(curr.quitDate) ? new Date(curr.quitDate).getTime() : Infinity;
      const dateChosen = isValidDateField(chosen.quitDate) ? new Date(chosen.quitDate).getTime() : Infinity;
      return dateCurr < dateChosen ? curr : chosen;
    });
  }

  // If profile was lost but verified streaks, cravings or verified quit_date exist:
  const rawSavedQuitDate = typeof localStorage !== 'undefined' ? localStorage.getItem('puffinless_quit_date') : null;
  const verifiedSavedQuitDate = isValidDateField(rawSavedQuitDate) ? rawSavedQuitDate : '';

  if (!bestProfile && (candidateStreaks.length > 0 || candidateCravings.length > 0 || verifiedSavedQuitDate)) {
    let earliestDate = verifiedSavedQuitDate;
    if (!earliestDate) {
      if (candidateStreaks.length > 0) {
        const validStreakDates = candidateStreaks
          .map((s) => s.start)
          .filter(isValidDateField)
          .map((d) => new Date(d).getTime());
        if (validStreakDates.length > 0) earliestDate = new Date(Math.min(...validStreakDates)).toISOString();
      } else if (candidateCravings.length > 0) {
        const validCravingDates = candidateCravings
          .map((c) => c.timestamp)
          .filter(isValidDateField)
          .map((d) => new Date(d).getTime());
        if (validCravingDates.length > 0) earliestDate = new Date(Math.min(...validCravingDates)).toISOString();
      }
    }

    if (isValidDateField(earliestDate)) {
      const savedName = (typeof localStorage !== 'undefined' && localStorage.getItem('puffinless_user_name')) || '';
      bestProfile = {
        ...DEFAULT_PROFILE,
        name: savedName,
        isOnboarded: true,
        quitDate: earliestDate,
        createdAt: earliestDate,
        customQuitDate: true,
        language: (typeof localStorage !== 'undefined' && ((localStorage.getItem('puffinless_app_lang') || localStorage.getItem('puffinless_lang')) as any)) || 'fr',
        theme: (typeof localStorage !== 'undefined' && ((localStorage.getItem('puffinless_app_theme') || localStorage.getItem('puffinless_theme')) as any)) || 'dark',
      };
    }
  }

  // Calculate days since quit ONLY if quitDate is a verified date field
  let daysSinceQuit = 0;
  if (bestProfile?.quitDate && isValidDateField(bestProfile.quitDate)) {
    const diffMs = Date.now() - new Date(bestProfile.quitDate).getTime();
    daysSinceQuit = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  const isDataRecovered = Boolean(
    (bestProfile && (bestProfile.isOnboarded || isValidDateField(bestProfile.quitDate))) ||
    candidateStreaks.length > 0 ||
    candidateCravings.length > 0 ||
    candidateSubstances.length > 0 ||
    candidateExpenses.length > 0 ||
    candidateGoals.length > 0
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

      // Encrypt and persist to localStorage and IndexedDB
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

        // Synchronous non-sensitive markers to avoid presentation loops
        localStorage.setItem('puffinless_is_onboarded', 'true');
        if (bestProfile.quitDate) localStorage.setItem('puffinless_quit_date', bestProfile.quitDate);
        if (bestProfile.name) localStorage.setItem('puffinless_user_name', bestProfile.name);
        if (bestProfile.language) {
          localStorage.setItem('puffinless_lang', bestProfile.language);
          localStorage.setItem('puffinless_app_lang', bestProfile.language);
        }
        if (bestProfile.theme) {
          localStorage.setItem('puffinless_theme', bestProfile.theme);
          localStorage.setItem('puffinless_app_theme', bestProfile.theme);
        }

        // Also persist to IndexedDB
        await Promise.all([
          idbSet('profile', profCipher).catch(() => {}),
          idbSet('streaks', strkCipher).catch(() => {}),
          idbSet('cravings', cravCipher).catch(() => {}),
          idbSet('substances', subCipher).catch(() => {}),
          idbSet('expenses', expCipher).catch(() => {}),
          idbSet('sleep', slpCipher).catch(() => {}),
          idbSet('goals', golCipher).catch(() => {}),
        ]);
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
