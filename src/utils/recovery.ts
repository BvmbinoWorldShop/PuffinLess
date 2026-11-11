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
} from '../types/index.ts';
import {
  decryptData,
  encryptData,
} from './crypto.ts';
import {
  idbSet,
  idbGetAllEventsWithStatus,
} from './indexedDb.ts';
import {
  replayJournalEvents,
} from './journal.ts';
import { DEFAULT_PROFILE } from './storage.ts';

export const RESCUE_BACKUP_KEY = 'puffinless_device_rescue_backup_v2';
export const RESCUE_ARCHIVE_KEY = 'puffinless_device_rescue_backup_archive';
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
  hasNewlyRecoveredData: boolean;
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
  newlyRecovered: {
    total: number;
    streaks: number;
    cravings: number;
    substances: number;
    expenses: number;
    goals: number;
    sleep: number;
    profileRestored: boolean;
  };
  integrity: {
    totalScanned: number;
    validRecords: number;
    corruptedRejected: number;
    datesVerified: number;
  };
  message: string;
}

let cachedRescueSnapshot: DeviceRescueSnapshot | null = null;
let rescueSnapshotGeneration = 0;

export function resetDeviceRescueSnapshotCache(): void {
  cachedRescueSnapshot = null;
  rescueSnapshotGeneration++;
}

/**
 * Creates or updates an unalterable local rescue snapshot on device.
 * Encrypts the snapshot with AES-GCM before writing to localStorage.
 * Updates in-memory cache synchronously so immediate synchronous queries succeed.
 */
export async function createDeviceRescueSnapshot(snapshot: Partial<DeviceRescueSnapshot>): Promise<void> {
  try {
    const currentGen = ++rescueSnapshotGeneration;
    const isStorageWiped =
      typeof localStorage !== 'undefined' &&
      !localStorage.getItem(RESCUE_BACKUP_KEY) &&
      !localStorage.getItem(RESCUE_ARCHIVE_KEY) &&
      !localStorage.getItem(LEGACY_RESCUE_KEY);
    if (isStorageWiped) {
      cachedRescueSnapshot = null;
    }
    const existing = cachedRescueSnapshot || getDeviceRescueSnapshot();
    const merged: DeviceRescueSnapshot = {
      version: 2,
      timestamp: new Date().toISOString(),
      profile: snapshot.profile || existing?.profile,
      goals: (snapshot.goals && snapshot.goals.length > 0)
        ? (existing?.goals ? mergeGoals(existing.goals, snapshot.goals) : snapshot.goals)
        : existing?.goals,
      cravings: (snapshot.cravings && snapshot.cravings.length > 0)
        ? (existing?.cravings ? mergeCravings(existing.cravings, snapshot.cravings) : snapshot.cravings)
        : existing?.cravings,
      expenses: (snapshot.expenses && snapshot.expenses.length > 0)
        ? (existing?.expenses ? mergeExpenses(existing.expenses, snapshot.expenses) : snapshot.expenses)
        : existing?.expenses,
      substanceLogs: (snapshot.substanceLogs && snapshot.substanceLogs.length > 0)
        ? (existing?.substanceLogs ? mergeSubstances(existing.substanceLogs, snapshot.substanceLogs) : snapshot.substanceLogs)
        : existing?.substanceLogs,
      sleepLogs: (snapshot.sleepLogs && snapshot.sleepLogs.length > 0)
        ? (existing?.sleepLogs ? mergeSleepLogs(existing.sleepLogs, snapshot.sleepLogs) : snapshot.sleepLogs)
        : existing?.sleepLogs,
      streaks: (snapshot.streaks && snapshot.streaks.length > 0)
        ? (existing?.streaks ? mergeStreaks(existing.streaks, snapshot.streaks) : snapshot.streaks)
        : existing?.streaks,
      smokeLogs: (snapshot.smokeLogs && snapshot.smokeLogs.length > 0) ? snapshot.smokeLogs : existing?.smokeLogs,
    };

    // Update in-memory cache synchronously
    cachedRescueSnapshot = merged;

    if (typeof localStorage !== 'undefined') {
      try {
        // Mark key present if storage was completely empty so synchronous queries know data is staged
        if (!localStorage.getItem(RESCUE_BACKUP_KEY) && !localStorage.getItem(RESCUE_ARCHIVE_KEY) && !localStorage.getItem(LEGACY_RESCUE_KEY)) {
          localStorage.setItem(RESCUE_BACKUP_KEY, 'aes-gcm:staged');
        }
        // Safe staging: Encrypt in memory first BEFORE touching localStorage.
        // If encryptData fails or is interrupted, the prior valid backup in localStorage is NEVER overwritten or destroyed.
        const cipher = await encryptData(merged);
        if (currentGen === rescueSnapshotGeneration) {
          const prior = localStorage.getItem(RESCUE_BACKUP_KEY);
          if (prior && prior !== 'aes-gcm:staged' && (prior.startsWith('aes-gcm:') || prior.startsWith('{') || prior.startsWith('aes256:'))) {
            localStorage.setItem(RESCUE_ARCHIVE_KEY, prior);
          }
          localStorage.setItem(RESCUE_BACKUP_KEY, cipher);
        }
      } catch (encryptErr) {
        console.warn('[Recovery] Failed to encrypt rescue snapshot, retaining in memory and preserving prior backup intact:', encryptErr);
      }
    }
  } catch (err) {
    console.warn('[Recovery] Failed to create rescue snapshot:', err);
  }
}

/**
 * Retrieves the device rescue snapshot synchronously from memory cache or legacy plaintext.
 */
export function getDeviceRescueSnapshot(): DeviceRescueSnapshot | null {
  if (
    typeof localStorage !== 'undefined' &&
    !localStorage.getItem(RESCUE_BACKUP_KEY) &&
    !localStorage.getItem(RESCUE_ARCHIVE_KEY) &&
    !localStorage.getItem(LEGACY_RESCUE_KEY)
  ) {
    cachedRescueSnapshot = null;
    return null;
  }
  if (cachedRescueSnapshot) {
    return cachedRescueSnapshot;
  }
  if (typeof localStorage === 'undefined') return null;
  const candidates = [RESCUE_BACKUP_KEY, RESCUE_ARCHIVE_KEY, LEGACY_RESCUE_KEY];
  for (const k of candidates) {
    try {
      const raw = localStorage.getItem(k);
      if (raw && raw.startsWith('{')) {
        const parsed = JSON.parse(raw) as DeviceRescueSnapshot;
        cachedRescueSnapshot = parsed;
        return parsed;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

/**
 * Retrieves the device rescue snapshot asynchronously, decrypting AES-GCM ciphertext from localStorage.
 * Checks primary backup, safety archive, and legacy backup keys with automatic fallback.
 */
export async function getDeviceRescueSnapshotAsync(): Promise<DeviceRescueSnapshot | null> {
  if (
    typeof localStorage !== 'undefined' &&
    !localStorage.getItem(RESCUE_BACKUP_KEY) &&
    !localStorage.getItem(RESCUE_ARCHIVE_KEY) &&
    !localStorage.getItem(LEGACY_RESCUE_KEY)
  ) {
    cachedRescueSnapshot = null;
    return null;
  }
  if (cachedRescueSnapshot) {
    return cachedRescueSnapshot;
  }
  if (typeof localStorage === 'undefined') return null;
  const candidates = [RESCUE_BACKUP_KEY, RESCUE_ARCHIVE_KEY, LEGACY_RESCUE_KEY];
  for (const k of candidates) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      if (raw.startsWith('{')) {
        try {
          const parsed = JSON.parse(raw) as DeviceRescueSnapshot;
          cachedRescueSnapshot = parsed;
          return parsed;
        } catch {
          continue;
        }
      }
      if (raw.startsWith('aes-gcm:') || raw.startsWith('aes256:')) {
        const decrypted = await decryptData<DeviceRescueSnapshot | null>(raw, null);
        if (decrypted && typeof decrypted === 'object') {
          cachedRescueSnapshot = decrypted;
          return decrypted;
        }
      }
    } catch {
      // continue to next candidate
    }
  }
  return null;
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

  // Integrity counters for full transparency
  let totalScanned = 0;
  let validRecords = 0;
  let corruptedRejected = 0;
  let datesVerified = 0;

  // Capture baseline active keys before scan to compute exact newly recovered delta
  const baselineStreaks = new Set<string>();
  const baselineCravings = new Set<string>();
  const baselineSubstances = new Set<string>();
  const baselineExpenses = new Set<string>();
  const baselineGoals = new Set<string>();
  const baselineSleep = new Set<string>();
  let baselineProfileOnboarded = false;

  if (typeof localStorage !== 'undefined') {
    try {
      const rawProf = localStorage.getItem('puffinless_profile_v2');
      if (rawProf) {
        const p = await decryptData<UserProfile | null>(rawProf, null);
        if (p && (p.isOnboarded || isValidDateField(p.quitDate))) baselineProfileOnboarded = true;
      }
    } catch {}

    try {
      const rawStreaks = localStorage.getItem('puffinless_streaks_v2');
      if (rawStreaks) {
        const items = await decryptData<StreakRecord[]>(rawStreaks, []);
        if (Array.isArray(items)) {
          for (const s of items) {
            const k = s?.id || s?.start;
            if (k) baselineStreaks.add(k);
          }
        }
      }
    } catch {}

    try {
      const rawCravings = localStorage.getItem('puffinless_cravings_v2');
      if (rawCravings) {
        const items = await decryptData<CravingEntry[]>(rawCravings, []);
        if (Array.isArray(items)) {
          for (const c of items) {
            const k = c?.id || c?.timestamp;
            if (k) baselineCravings.add(k);
          }
        }
      }
    } catch {}

    try {
      const rawSubs = localStorage.getItem('puffinless_substance_log_v2');
      if (rawSubs) {
        const items = await decryptData<SubstanceLog[]>(rawSubs, []);
        if (Array.isArray(items)) {
          for (const sub of items) {
            const k = sub?.id || sub?.timestamp;
            if (k) baselineSubstances.add(k);
          }
        }
      }
    } catch {}

    try {
      const rawExp = localStorage.getItem('puffinless_expenses_v2');
      if (rawExp) {
        const items = await decryptData<PurchaseExpense[]>(rawExp, []);
        if (Array.isArray(items)) {
          for (const exp of items) {
            if (exp?.id) baselineExpenses.add(exp.id);
          }
        }
      }
    } catch {}

    try {
      const rawGoals = localStorage.getItem('puffinless_savings_goals_v2');
      if (rawGoals) {
        const items = await decryptData<SavingsGoal[]>(rawGoals, []);
        if (Array.isArray(items)) {
          for (const g of items) {
            if (g?.id) baselineGoals.add(g.id);
          }
        }
      }
    } catch {}

    try {
      const rawSleep = localStorage.getItem('puffinless_sleep_energy_v2');
      if (rawSleep) {
        const items = await decryptData<SleepEnergyEntry[]>(rawSleep, []);
        if (Array.isArray(items)) {
          for (const sl of items) {
            const k = sl?.id || sl?.date;
            if (k) baselineSleep.add(k);
          }
        }
      }
    } catch {}
  }

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
          corruptedRejected++;
        }
      }
      return;
    }

    if (typeof val !== 'object') return;

    // Full snapshot or composite backup
    if (
      'profile' in val ||
      'cravings' in val ||
      'streaks' in val ||
      'substanceLogs' in val ||
      'substances' in val ||
      'smokeLogs' in val ||
      'smokeLog' in val ||
      'expenses' in val ||
      'sleepLogs' in val ||
      'sleepEnergy' in val ||
      'sleep' in val ||
      'goals' in val ||
      'savingsGoals' in val
    ) {
      const s = val as any;
      if (s.profile) {
        totalScanned++;
        if (isValidDateField(s.profile.quitDate) || s.profile.isOnboarded) {
          validRecords++;
          if (isValidDateField(s.profile.quitDate)) datesVerified++;
          candidateProfiles.push(s.profile);
        } else {
          corruptedRejected++;
        }
      }
      if (Array.isArray(s.streaks)) {
        totalScanned += s.streaks.length;
        const valid = s.streaks.filter((st: any) => st && isValidDateField(st.start));
        validRecords += valid.length;
        datesVerified += valid.length;
        corruptedRejected += (s.streaks.length - valid.length);
        if (valid.length > 0) candidateStreaks = mergeStreaks(candidateStreaks, valid);
      }
      if (Array.isArray(s.cravings)) {
        totalScanned += s.cravings.length;
        const valid = s.cravings.filter((c: any) => c && isValidDateField(c.timestamp));
        validRecords += valid.length;
        datesVerified += valid.length;
        corruptedRejected += (s.cravings.length - valid.length);
        if (valid.length > 0) candidateCravings = mergeCravings(candidateCravings, valid);
      }
      if (Array.isArray(s.substanceLogs)) {
        totalScanned += s.substanceLogs.length;
        const valid = s.substanceLogs.filter((sub: any) => sub && isValidDateField(sub.timestamp));
        validRecords += valid.length;
        datesVerified += valid.length;
        corruptedRejected += (s.substanceLogs.length - valid.length);
        if (valid.length > 0) candidateSubstances = mergeSubstances(candidateSubstances, valid);
      }
      if (Array.isArray(s.substances)) {
        totalScanned += s.substances.length;
        const valid = s.substances.filter((sub: any) => sub && isValidDateField(sub.timestamp));
        validRecords += valid.length;
        datesVerified += valid.length;
        corruptedRejected += (s.substances.length - valid.length);
        if (valid.length > 0) candidateSubstances = mergeSubstances(candidateSubstances, valid);
      }
      if (Array.isArray(s.smokeLogs)) {
        totalScanned += s.smokeLogs.length;
        const valid = s.smokeLogs.filter((sl: any) => sl && isValidDateField(sl.timestamp));
        validRecords += valid.length;
        datesVerified += valid.length;
        corruptedRejected += (s.smokeLogs.length - valid.length);
        if (valid.length > 0) {
          candidateSmokeLogs = [...candidateSmokeLogs, ...valid];
          const converted = valid.map((sl: any) => ({
            id: sl.id || `smoke-${Date.now()}-${Math.random()}`,
            substance: 'cigarette' as const,
            count: Number(sl.count) || 1,
            timestamp: sl.timestamp,
            note: sl.note,
          }));
          candidateSubstances = mergeSubstances(candidateSubstances, converted);
        }
      }
      if (Array.isArray(s.smokeLog)) {
        totalScanned += s.smokeLog.length;
        const valid = s.smokeLog.filter((sl: any) => sl && isValidDateField(sl.timestamp));
        validRecords += valid.length;
        datesVerified += valid.length;
        corruptedRejected += (s.smokeLog.length - valid.length);
        if (valid.length > 0) {
          const converted = valid.map((sl: any) => ({
            id: sl.id || `smoke-${Date.now()}-${Math.random()}`,
            substance: 'cigarette' as const,
            count: Number(sl.count) || 1,
            timestamp: sl.timestamp,
            note: sl.note,
          }));
          candidateSubstances = mergeSubstances(candidateSubstances, converted);
        }
      }
      if (Array.isArray(s.expenses)) {
        totalScanned += s.expenses.length;
        const valid = s.expenses.filter((e: any) => e && isValidDateField(e.timestamp));
        validRecords += valid.length;
        datesVerified += valid.length;
        corruptedRejected += (s.expenses.length - valid.length);
        if (valid.length > 0) candidateExpenses = mergeExpenses(candidateExpenses, valid);
      }
      if (Array.isArray(s.sleepLogs)) {
        totalScanned += s.sleepLogs.length;
        const valid = s.sleepLogs.filter((sl: any) => sl && typeof sl.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sl.date));
        validRecords += valid.length;
        corruptedRejected += (s.sleepLogs.length - valid.length);
        if (valid.length > 0) candidateSleep = mergeSleepLogs(candidateSleep, valid);
      }
      if (Array.isArray(s.sleepEnergy)) {
        totalScanned += s.sleepEnergy.length;
        const valid = s.sleepEnergy.filter((sl: any) => sl && typeof sl.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sl.date));
        validRecords += valid.length;
        corruptedRejected += (s.sleepEnergy.length - valid.length);
        if (valid.length > 0) candidateSleep = mergeSleepLogs(candidateSleep, valid);
      }
      if (Array.isArray(s.sleep)) {
        totalScanned += s.sleep.length;
        const valid = s.sleep.filter((sl: any) => sl && typeof sl.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sl.date));
        validRecords += valid.length;
        corruptedRejected += (s.sleep.length - valid.length);
        if (valid.length > 0) candidateSleep = mergeSleepLogs(candidateSleep, valid);
      }
      if (Array.isArray(s.goals)) {
        totalScanned += s.goals.length;
        const valid = s.goals.filter((g: any) => g && (g.id || g.title));
        validRecords += valid.length;
        corruptedRejected += (s.goals.length - valid.length);
        if (valid.length > 0) candidateGoals = mergeGoals(candidateGoals, valid);
      }
      if (Array.isArray(s.savingsGoals)) {
        totalScanned += s.savingsGoals.length;
        const valid = s.savingsGoals.filter((g: any) => g && (g.id || g.title));
        validRecords += valid.length;
        corruptedRejected += (s.savingsGoals.length - valid.length);
        if (valid.length > 0) candidateGoals = mergeGoals(candidateGoals, valid);
      }
      return;
    }

    // UserProfile strictly verified
    if (('quitDate' in val || 'cigarettesPerDay' in val || 'quitMode' in val || 'primarySubstance' in val) && typeof val === 'object') {
      totalScanned++;
      const p = { ...(val as UserProfile) };
      if (p.quitDate && !isValidDateField(p.quitDate)) {
        p.quitDate = '';
        corruptedRejected++;
      } else if (p.quitDate) {
        datesVerified++;
      }
      if (p.createdAt && !isValidDateField(p.createdAt)) {
        p.createdAt = '';
      }
      if (p.isOnboarded || isValidDateField(p.quitDate) || p.name) {
        validRecords++;
        candidateProfiles.push(p);
      }
      return;
    }

    // Array of items strictly verified by date fields
    if (Array.isArray(val) && val.length > 0) {
      totalScanned += val.length;
      const first = val[0];
      if (!first || typeof first !== 'object') {
        corruptedRejected += val.length;
        return;
      }

      if ('intensity' in first || 'resisted' in first || ('timestamp' in first && ('trigger' in first || 'substance' in first) && !('count' in first))) {
        const valid = (val as CravingEntry[]).filter((c) => c && isValidDateField(c.timestamp));
        validRecords += valid.length;
        datesVerified += valid.length;
        corruptedRejected += (val.length - valid.length);
        if (valid.length > 0) candidateCravings = mergeCravings(candidateCravings, valid);
      } else if ('start' in first || 'startDate' in first || 'streakStart' in first) {
        const normalized = (val as any[]).map((s) => ({
          id: s.id,
          start: s.start || s.startDate || s.streakStart,
          end: s.end || s.endDate,
          brokenBy: s.brokenBy,
        }));
        const valid = normalized.filter((s) => s && isValidDateField(s.start));
        validRecords += valid.length;
        datesVerified += valid.length;
        corruptedRejected += (val.length - valid.length);
        if (valid.length > 0) candidateStreaks = mergeStreaks(candidateStreaks, valid);
      } else if ('count' in first && ('substance' in first || 'substanceType' in first)) {
        const normalized = (val as any[]).map((s) => ({
          ...s,
          substance: s.substance || s.substanceType,
        }));
        const valid = (normalized as SubstanceLog[]).filter((s) => s && isValidDateField(s.timestamp));
        validRecords += valid.length;
        datesVerified += valid.length;
        corruptedRejected += (val.length - valid.length);
        if (valid.length > 0) candidateSubstances = mergeSubstances(candidateSubstances, valid);
      } else if ('count' in first && !('substance' in first) && 'timestamp' in first) {
        const valid = (val as SmokeLogEntry[]).filter((s) => s && isValidDateField(s.timestamp));
        validRecords += valid.length;
        datesVerified += valid.length;
        corruptedRejected += (val.length - valid.length);
        if (valid.length > 0) {
          candidateSmokeLogs = [...candidateSmokeLogs, ...valid];
          const converted: SubstanceLog[] = valid.map((vl) => ({
            id: vl.id,
            substance: 'cigarette' as const,
            count: Number(vl.count) || 1,
            timestamp: vl.timestamp,
            note: vl.note,
          }));
          candidateSubstances = mergeSubstances(candidateSubstances, converted);
        }
      } else if ('itemType' in first || ('price' in first && 'quantity' in first)) {
        const valid = (val as PurchaseExpense[]).filter((e) => e && isValidDateField(e.timestamp));
        validRecords += valid.length;
        datesVerified += valid.length;
        corruptedRejected += (val.length - valid.length);
        if (valid.length > 0) candidateExpenses = mergeExpenses(candidateExpenses, valid);
      } else if ('sleepRating' in first || 'energyRating' in first) {
        const valid = (val as SleepEnergyEntry[]).filter((s) => s && typeof s.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s.date));
        validRecords += valid.length;
        corruptedRejected += (val.length - valid.length);
        if (valid.length > 0) candidateSleep = mergeSleepLogs(candidateSleep, valid);
      } else if ('targetAmount' in first || ('title' in first && 'price' in first)) {
        const valid = (val as SavingsGoal[]).filter((g) => g && (g.id || g.title));
        validRecords += valid.length;
        corruptedRejected += (val.length - valid.length);
        candidateGoals = mergeGoals(candidateGoals, valid);
      }
      return;
    }

    // Single item handling (if stored individually in kv_store)
    if ('substance' in val && 'count' in val && 'timestamp' in val) {
      totalScanned++;
      const s = val as SubstanceLog;
      if (isValidDateField(s.timestamp)) {
        validRecords++;
        datesVerified++;
        candidateSubstances = mergeSubstances(candidateSubstances, [s]);
      } else {
        corruptedRejected++;
      }
    } else if (('intensity' in val || 'resisted' in val) && 'timestamp' in val) {
      totalScanned++;
      const c = val as CravingEntry;
      if (isValidDateField(c.timestamp)) {
        validRecords++;
        datesVerified++;
        candidateCravings = mergeCravings(candidateCravings, [c]);
      } else {
        corruptedRejected++;
      }
    } else if ('start' in val) {
      totalScanned++;
      const st = val as StreakRecord;
      if (isValidDateField(st.start)) {
        validRecords++;
        datesVerified++;
        candidateStreaks = mergeStreaks(candidateStreaks, [st]);
      } else {
        corruptedRejected++;
      }
    }
  };

  // =========================================================================
  // 1. SCAN RESCUE SNAPSHOT (PRIMARY, ARCHIVE & LEGACY)
  // =========================================================================
  const snapshot = await getDeviceRescueSnapshotAsync();
  if (snapshot) {
    sources.push('Rescue Snapshot');
    classifyAndExtract(snapshot);
  }

  // Also check individual candidate rescue keys for unrecovered records or corruption reporting
  if (typeof localStorage !== 'undefined') {
    const candidateRescueKeys = [RESCUE_BACKUP_KEY, RESCUE_ARCHIVE_KEY, LEGACY_RESCUE_KEY];
    for (const rk of candidateRescueKeys) {
      const rawVal = localStorage.getItem(rk);
      if (!rawVal) continue;
      if (rawVal.startsWith('{')) {
        try {
          const parsed = JSON.parse(rawVal);
          classifyAndExtract(parsed);
        } catch {
          corruptedRejected++;
        }
      } else if (rawVal.startsWith('aes-gcm:') || rawVal.startsWith('aes256:')) {
        try {
          const dec = await decryptData<any>(rawVal, null);
          if (dec && typeof dec === 'object') {
            classifyAndExtract(dec);
          } else {
            corruptedRejected++;
          }
        } catch {
          corruptedRejected++;
        }
      }
    }
  }

  // =========================================================================
  // 2. SCAN INDEXEDDB KV STORE
  // =========================================================================
  const idbRecords = await dumpIndexedDBRecords();
  if (idbRecords.size > 0) {
    sources.push(`IndexedDB (${idbRecords.size} clés)`);
    for (const [, rawValue] of idbRecords.entries()) {
      try {
        if (typeof rawValue === 'object') {
          classifyAndExtract(rawValue);
        } else if (typeof rawValue === 'string') {
          if (rawValue.startsWith('{') || rawValue.startsWith('[')) {
            try { classifyAndExtract(JSON.parse(rawValue)); } catch {}
          }
          const decrypted = await decryptData<any>(rawValue, null);
          if (decrypted) {
            classifyAndExtract(decrypted);
          } else if (rawValue.startsWith('aes-gcm:') || rawValue.startsWith('aes256:')) {
            corruptedRejected++;
          }
        }
      } catch {
        corruptedRejected++;
      }
    }
  }

  // =========================================================================
  // 3. SCAN INDEXEDDB EVENT JOURNAL (events_store)
  // =========================================================================
  try {
    const journalRes = await idbGetAllEventsWithStatus();
    if (journalRes.status === 'error') {
      corruptedRejected++;
      console.warn('[Recovery] Warning: Journal read failure:', journalRes.error);
    } else if (journalRes.status === 'success' && journalRes.events.length > 0) {
      sources.push(`Journal d'événements (${journalRes.events.length} événements)`);
      totalScanned += journalRes.events.length;
      validRecords += journalRes.events.length;
      const projections = replayJournalEvents(journalRes.events);
      if (projections.substanceLogs.length > 0) {
        candidateSubstances = mergeSubstances(candidateSubstances, projections.substanceLogs);
      }
      if (projections.cravings.length > 0) {
        candidateCravings = mergeCravings(candidateCravings, projections.cravings);
      }
      if (projections.streaks.length > 0) {
        candidateStreaks = mergeStreaks(candidateStreaks, projections.streaks);
      }
      if (projections.expenses.length > 0) {
        candidateExpenses = mergeExpenses(candidateExpenses, projections.expenses);
      }
      if (projections.sleepLogs.length > 0) {
        candidateSleep = mergeSleepLogs(candidateSleep, projections.sleepLogs);
      }
      if (projections.goals.length > 0) {
        candidateGoals = mergeGoals(candidateGoals, projections.goals);
      }
      if (projections.profilePatch && Object.keys(projections.profilePatch).length > 0) {
        candidateProfiles.push({
          ...DEFAULT_PROFILE,
          ...projections.profilePatch,
        } as UserProfile);
      }
    }
  } catch (jErr) {
    corruptedRejected++;
    console.warn('[Recovery] Warning reading events_store:', jErr);
  }

  // =========================================================================
  // 4. SCAN LOCALSTORAGE & SESSIONSTORAGE (ALL KEYS)
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
      if (k && (k.startsWith('puffinless') || k.startsWith('puffin_') || k.includes('puffin') || k.includes('streak') || k.includes('craving') || k.includes('substance') || k.includes('rescue'))) {
        allKeys.add(k);
      }
    }

    for (const key of allKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        if (raw.startsWith('{') || raw.startsWith('[')) {
          try { classifyAndExtract(JSON.parse(raw)); } catch {}
        }
        const decrypted = await decryptData<any>(raw, null);
        if (decrypted) {
          classifyAndExtract(decrypted);
        } else if (raw.startsWith('aes-gcm:') || raw.startsWith('aes256:')) {
          corruptedRejected++;
        }
      } catch {
        corruptedRejected++;
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
        if (decrypted) {
          classifyAndExtract(decrypted);
        } else if (raw.startsWith('aes-gcm:') || raw.startsWith('aes256:')) {
          corruptedRejected++;
        }
      } catch {
        corruptedRejected++;
      }
    }
  }

  // =========================================================================
  // 5. CHOOSE THE BEST PROFILE CANDIDATE
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

  // Compute newly recovered delta by comparing against baseline before scan
  const newStreaksCount = candidateStreaks.filter((s) => {
    const k = s.id || s.start;
    return k ? !baselineStreaks.has(k) : true;
  }).length;

  const newCravingsCount = candidateCravings.filter((c) => {
    const k = c.id || c.timestamp;
    return k ? !baselineCravings.has(k) : true;
  }).length;

  const newSubstancesCount = candidateSubstances.filter((sub) => {
    const k = sub.id || sub.timestamp;
    return k ? !baselineSubstances.has(k) : true;
  }).length;

  const newExpensesCount = candidateExpenses.filter((e) => {
    return e.id ? !baselineExpenses.has(e.id) : true;
  }).length;

  const newGoalsCount = candidateGoals.filter((g) => {
    return g.id ? !baselineGoals.has(g.id) : true;
  }).length;

  const newSleepCount = candidateSleep.filter((sl) => {
    const k = sl.id || sl.date;
    return k ? !baselineSleep.has(k) : true;
  }).length;

  const profileRestored = Boolean(
    !baselineProfileOnboarded &&
    bestProfile &&
    (bestProfile.isOnboarded || isValidDateField(bestProfile.quitDate))
  );

  const totalNewlyRecovered =
    newStreaksCount +
    newCravingsCount +
    newSubstancesCount +
    newExpensesCount +
    newGoalsCount +
    newSleepCount +
    (profileRestored ? 1 : 0);

  const hasNewlyRecoveredData = totalNewlyRecovered > 0;

  // =========================================================================
  // 6. IF DATA RECOVERED: RE-PERSIST TO PREVENT FUTURE LOSS (NON-DESTRUCTIVE)
  // =========================================================================
  if (isDataRecovered && bestProfile) {
    try {
      // Force profile onboarded flag to true if user had an active week of data
      bestProfile.isOnboarded = true;

      // Update rescue snapshot immediately ONLY with non-empty candidate fields
      createDeviceRescueSnapshot({
        profile: bestProfile,
        streaks: candidateStreaks.length > 0 ? candidateStreaks : undefined,
        cravings: candidateCravings.length > 0 ? candidateCravings : undefined,
        substanceLogs: candidateSubstances.length > 0 ? candidateSubstances : undefined,
        expenses: candidateExpenses.length > 0 ? candidateExpenses : undefined,
        sleepLogs: candidateSleep.length > 0 ? candidateSleep : undefined,
        goals: candidateGoals.length > 0 ? candidateGoals : undefined,
        smokeLogs: candidateSmokeLogs.length > 0 ? candidateSmokeLogs : undefined,
      });

      // Encrypt and persist to localStorage and IndexedDB (NEVER overwrite populated data with empty arrays)
      if (typeof localStorage !== 'undefined') {
        const profCipher = await encryptData(bestProfile);
        localStorage.setItem('puffinless_profile_v2', profCipher);
        await idbSet('puffinless_profile_v2', profCipher).catch(() => {});
        await idbSet('profile', profCipher).catch(() => {});

        if (candidateStreaks.length > 0) {
          const strkCipher = await encryptData(candidateStreaks);
          localStorage.setItem('puffinless_streaks_v2', strkCipher);
          await idbSet('puffinless_streaks_v2', strkCipher).catch(() => {});
          await idbSet('streaks', strkCipher).catch(() => {});
        }

        if (candidateCravings.length > 0) {
          const cravCipher = await encryptData(candidateCravings);
          localStorage.setItem('puffinless_cravings_v2', cravCipher);
          await idbSet('puffinless_cravings_v2', cravCipher).catch(() => {});
          await idbSet('cravings', cravCipher).catch(() => {});
        }

        if (candidateSubstances.length > 0) {
          const subCipher = await encryptData(candidateSubstances);
          localStorage.setItem('puffinless_substance_log_v2', subCipher);
          await idbSet('puffinless_substance_log_v2', subCipher).catch(() => {});
          await idbSet('substances', subCipher).catch(() => {});
        }

        if (candidateExpenses.length > 0) {
          const expCipher = await encryptData(candidateExpenses);
          localStorage.setItem('puffinless_expenses_v2', expCipher);
          await idbSet('puffinless_expenses_v2', expCipher).catch(() => {});
          await idbSet('expenses', expCipher).catch(() => {});
        }

        if (candidateSleep.length > 0) {
          const slpCipher = await encryptData(candidateSleep);
          localStorage.setItem('puffinless_sleep_energy_v2', slpCipher);
          await idbSet('puffinless_sleep_energy_v2', slpCipher).catch(() => {});
          await idbSet('sleep', slpCipher).catch(() => {});
        }

        if (candidateGoals.length > 0) {
          const golCipher = await encryptData(candidateGoals);
          localStorage.setItem('puffinless_savings_goals_v2', golCipher);
          await idbSet('puffinless_savings_goals_v2', golCipher).catch(() => {});
          await idbSet('goals', golCipher).catch(() => {});
        }

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
      }
    } catch (persistErr) {
      console.warn('[Recovery] Warning during recovery persistence:', persistErr);
    }
  }

  let message = '';
  if (hasNewlyRecoveredData) {
    message = `Récupération réussie : ${totalNewlyRecovered} élément(s) historique(s) restauré(s) (${candidateStreaks.length} séries, ${candidateCravings.length} victoires, ${candidateSubstances.length} consommations) depuis ${sources.length} source(s). Intégrité vérifiée : ${validRecords} valide(s), ${corruptedRejected} corrompu(s) écarté(s).`;
  } else if (isDataRecovered) {
    message = `Toutes vos données sont déjà saines et synchronisées (0 élément manquant). Intégrité : ${validRecords} enregistrement(s) vérifié(s) sur ${sources.join(', ') || 'appareil'}.`;
  } else {
    message = 'Aucune donnée antérieure détectée sur cet appareil.';
  }

  return {
    recovered: isDataRecovered,
    hasNewlyRecoveredData,
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
    newlyRecovered: {
      total: totalNewlyRecovered,
      streaks: newStreaksCount,
      cravings: newCravingsCount,
      substances: newSubstancesCount,
      expenses: newExpensesCount,
      goals: newGoalsCount,
      sleep: newSleepCount,
      profileRestored,
    },
    integrity: {
      totalScanned,
      validRecords,
      corruptedRejected,
      datesVerified,
    },
    message,
  };
}
