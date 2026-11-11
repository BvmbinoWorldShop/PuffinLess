/**
 * Append-Only Event Journal for PuffinLess.
 * Implements an immutable event stream in IndexedDB events_store.
 * All meaningful user events are recorded as discrete, ordered events.
 * Projections (substanceLogs, cravings, streaks, expenses, sleep, goals)
 * can be replayed and deterministically rebuilt from the journal at any time.
 */

import type {
  JournalEvent,
  JournalEventType,
  SubstanceLog,
  CravingEntry,
  StreakRecord,
  PurchaseExpense,
  SleepEnergyEntry,
  SavingsGoal,
  UserProfile,
} from '../types/index.ts';
import {
  idbAppendEvent,
  idbGetAllEvents,
  idbGetAllEventsWithStatus,
  idbGetMaxEventSeq,
  idbClearEvents,
  idbAllocateNextSequence,
  SequenceAllocationError,
  JOURNAL_SEQ_COUNTER_KEY,
  idbGetRaw,
  type JournalReadResult,
} from './indexedDb.ts';

export { SequenceAllocationError } from './indexedDb.ts';

let monotonicSequence = 0;
let sequenceInitialized = false;
let initSequencePromise: Promise<number> | null = null;

const SYNC_CHANNEL_NAME = 'puffinless_journal_sync';
const SEQ_STORAGE_KEY = 'puffinless_seq_sync';
let syncChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined') {
  try {
    syncChannel = new window.BroadcastChannel(SYNC_CHANNEL_NAME);
    syncChannel.onmessage = (event) => {
      if (event.data && typeof event.data.seq === 'number') {
        monotonicSequence = Math.max(monotonicSequence, event.data.seq);
        sequenceInitialized = true;
      }
    };
  } catch {
    // fallback to storage events
  }
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (event.key === SEQ_STORAGE_KEY && event.newValue) {
      const parsed = parseInt(event.newValue, 10);
      if (!Number.isNaN(parsed)) {
        monotonicSequence = Math.max(monotonicSequence, parsed);
        sequenceInitialized = true;
      }
    }
  });
}

function broadcastSequence(seq: number): void {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'SEQ_ADVANCED', seq });
    } catch {
      // ignore
    }
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(SEQ_STORAGE_KEY, String(seq));
    } catch {
      // ignore
    }
  }
}

function generateEventId(prefix: string = 'ev'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Restores the monotonic sequence counter from persistent storage after a cold restart.
 * Queries highest seq in events_store to prevent collisions or numbering restarts.
 * Fails SAFELY: if querying disk fails, throws an explicit error,
 * leaves sequenceInitialized = false, and NEVER resets sequence to 0.
 */
export async function restoreJournalSequence(): Promise<number> {
  try {
    const maxSeq = await idbGetMaxEventSeq();
    let counterSeq = 0;
    try {
      const rawCounter = await idbGetRaw(JOURNAL_SEQ_COUNTER_KEY);
      if (typeof rawCounter === 'number' && !Number.isNaN(rawCounter)) {
        counterSeq = rawCounter;
      }
    } catch {
      // counter not yet initialized
    }
    monotonicSequence = Math.max(monotonicSequence, maxSeq, counterSeq);
    sequenceInitialized = true;
    broadcastSequence(monotonicSequence);
    return monotonicSequence;
  } catch (err) {
    sequenceInitialized = false;
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to restore journal sequence: ${msg}`, { cause: err });
  } finally {
    initSequencePromise = null;
  }
}

/**
 * Ensures that the journal sequence counter is initialized from disk before writing.
 * Throws explicitly if sequence restoration failed, preventing sequence reset to 1.
 */
export async function ensureSequenceInitialized(): Promise<void> {
  if (sequenceInitialized) return;
  if (!initSequencePromise) {
    initSequencePromise = restoreJournalSequence();
  }
  await initSequencePromise;
}

/**
 * Diagnostic helper to inspect journal sequence state.
 */
export function getJournalSequenceState(): { seq: number; initialized: boolean } {
  return { seq: monotonicSequence, initialized: sequenceInitialized };
}

let sequenceAllocationMutex: Promise<any> = Promise.resolve();

/**
 * Coordinate journal sequencing across tabs and disk with genuine atomicity.
 *
 * Sequence allocation uses IndexedDB's serialized ACID readwrite transactions
 * as the authoritative atomic coordinator across all tabs and workers on this origin.
 * When the Web Locks API (navigator.locks) is available, it provides cooperative
 * cross-tab scheduling and delegates allocation to `idbAllocateNextSequence()`.
 *
 * If sequence allocation cannot be guaranteed (e.g. database error, transaction abort),
 * this function FAILS SAFELY by throwing SequenceAllocationError, strictly preventing any
 * tab from allocating duplicate sequence numbers or proceeding uncoordinated.
 */
export async function getNextMonotonicSequence(): Promise<number> {
  const allocateAtomicSequence = async (): Promise<number> => {
    await ensureSequenceInitialized();
    let currentInMem = monotonicSequence;
    if (typeof localStorage !== 'undefined') {
      try {
        const syncVal = localStorage.getItem(SEQ_STORAGE_KEY);
        if (syncVal) {
          const parsed = parseInt(syncVal, 10);
          if (!Number.isNaN(parsed) && parsed > currentInMem) {
            currentInMem = parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    const nextSeq = await idbAllocateNextSequence(currentInMem);
    monotonicSequence = Math.max(monotonicSequence, nextSeq);
    broadcastSequence(nextSeq);
    return nextSeq;
  };

  // 1. Primary: If Web Locks API is supported (standard in modern browsers across tabs)
  if (
    typeof navigator !== 'undefined' &&
    navigator.locks &&
    typeof navigator.locks.request === 'function'
  ) {
    try {
      return await navigator.locks.request('puffinless_journal_seq_lock', allocateAtomicSequence);
    } catch (lockErr) {
      if (lockErr instanceof SequenceAllocationError || (lockErr instanceof Error && lockErr.name === 'SequenceAllocationError')) {
        throw lockErr;
      }
      console.warn('[Journal] Web Locks error during sequence allocation, falling back to IndexedDB atomic transaction:', lockErr);
    }
  }

  // 2. Fallback: In-process serialized mutex queue + IndexedDB atomic readwrite transaction
  // IndexedDB transactions with mode 'readwrite' guarantee strict cross-tab atomicity at the database engine level.
  const runWithMutex = async (): Promise<number> => {
    return await allocateAtomicSequence();
  };

  const task = sequenceAllocationMutex.then(runWithMutex, runWithMutex);
  sequenceAllocationMutex = task.catch(() => {});
  return task;
}

/**
 * Factory to create an immutable JournalEvent with coordinated sequence numbering.
 */
export async function createJournalEvent(
  type: JournalEventType,
  payload: any,
  entityId?: string
): Promise<JournalEvent> {
  const seq = await getNextMonotonicSequence();
  const event: JournalEvent = {
    id: generateEventId('ev'),
    seq,
    type,
    timestamp: new Date().toISOString(),
    schemaVersion: 1,
    payload,
    entityId,
  };
  return event;
}

/**
 * Record an immutable event to the event journal.
 * Guarantees monotonic sequence numbering and encrypted persistence.
 * Fails VISIBLY by rethrowing errors if persistence fails.
 */
export async function recordJournalEvent(
  type: JournalEventType,
  payload: any,
  entityId?: string
): Promise<JournalEvent> {
  const event = await createJournalEvent(type, payload, entityId);
  await idbAppendEvent(event);
  return event;
}

/**
 * Retrieve all historical events from the journal.
 * Throws explicitly if reading fails.
 */
export async function getHistoricalJournalEvents(): Promise<JournalEvent[]> {
  return await idbGetAllEvents();
}

/**
 * Retrieve all historical events explicitly distinguishing empty journal from failed read.
 */
export async function getHistoricalJournalEventsWithStatus(): Promise<JournalReadResult> {
  return await idbGetAllEventsWithStatus();
}

/**
 * Clear all journal events (strictly called during confirmed user data reset).
 * Awaits disk clearing first. If disk clearing fails, sequence state is NOT mutated.
 */
export async function clearJournalEvents(): Promise<void> {
  await idbClearEvents();
  monotonicSequence = 0;
  sequenceInitialized = true;
  initSequencePromise = null;
  broadcastSequence(0);
}

export interface ReplayedProjections {
  substanceLogs: SubstanceLog[];
  cravings: CravingEntry[];
  streaks: StreakRecord[];
  expenses: PurchaseExpense[];
  sleepLogs: SleepEnergyEntry[];
  goals: SavingsGoal[];
  profilePatch: Partial<UserProfile>;
}

/**
 * Replays an array of journal events chronologically to reconstruct state projections.
 * Compensating events (e.g. SUBSTANCE_REMOVED, STREAK_REMOVED, CRAVING_REMOVED, PURCHASE_EXPENSE_DELETED)
 * are evaluated in strict historical sequence without destructive data erasure.
 */
export function replayJournalEvents(events: JournalEvent[]): ReplayedProjections {
  const sorted = [...events].sort(
    (a, b) => (a.seq ?? 0) - (b.seq ?? 0) || new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const substanceLogsMap = new Map<string, SubstanceLog>();
  const cravingsMap = new Map<string, CravingEntry>();
  const streaksMap = new Map<string, StreakRecord>();
  const expensesMap = new Map<string, PurchaseExpense>();
  const sleepLogsMap = new Map<string, SleepEnergyEntry>();
  const goalsMap = new Map<string, SavingsGoal>();
  let profilePatch: Partial<UserProfile> = {};

  for (const event of sorted) {
    if (!event || !event.type) continue;

    switch (event.type) {
      case 'SUBSTANCE_LOGGED': {
        const entry = event.payload as SubstanceLog;
        if (entry && entry.id) {
          substanceLogsMap.set(entry.id, entry);
        }
        break;
      }

      case 'SUBSTANCE_REMOVED': {
        const { logId, removeCount, substance, count } = event.payload || {};
        if (logId && substanceLogsMap.has(logId)) {
          const existing = substanceLogsMap.get(logId)!;
          const toRemove = removeCount || count || 1;
          if (existing.count > toRemove) {
            substanceLogsMap.set(logId, { ...existing, count: existing.count - toRemove });
          } else {
            substanceLogsMap.delete(logId);
          }
        } else if (substance) {
          let toRemove = count || removeCount || 1;
          const eventTime = new Date(event.timestamp).getTime();
          // Find matching logs chronologically descending up to the removal event time
          const candidateLogs = Array.from(substanceLogsMap.values())
            .filter((l) => l.substance === substance && new Date(l.timestamp).getTime() <= eventTime + 1000)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          for (const log of candidateLogs) {
            if (toRemove <= 0) break;
            if (log.count <= toRemove) {
              toRemove -= log.count;
              substanceLogsMap.delete(log.id);
            } else {
              substanceLogsMap.set(log.id, { ...log, count: log.count - toRemove });
              toRemove = 0;
            }
          }
        }
        break;
      }

      case 'CRAVING_LOGGED': {
        const craving = event.payload as CravingEntry;
        if (craving && craving.id) {
          cravingsMap.set(craving.id, craving);
        }
        break;
      }

      case 'CRAVING_REMOVED': {
        const cravingId = event.payload?.cravingId || event.payload?.id || event.entityId;
        if (cravingId && cravingsMap.has(cravingId)) {
          cravingsMap.delete(cravingId);
        }
        break;
      }

      case 'STREAK_RECORDED': {
        const streak = event.payload as StreakRecord;
        if (streak && streak.id) {
          streaksMap.set(streak.id, streak);
        }
        break;
      }

      case 'STREAK_REMOVED': {
        const streakId = event.payload?.streakId || event.payload?.id || event.entityId;
        if (streakId && streaksMap.has(streakId)) {
          streaksMap.delete(streakId);
        }
        break;
      }

      case 'PURCHASE_EXPENSE_LOGGED': {
        const expense = event.payload as PurchaseExpense;
        if (expense && expense.id) {
          expensesMap.set(expense.id, expense);
        }
        break;
      }

      case 'PURCHASE_EXPENSE_DELETED': {
        const expenseId = event.payload?.expenseId || event.payload?.id || event.entityId;
        if (expenseId && expensesMap.has(expenseId)) {
          expensesMap.delete(expenseId);
        }
        break;
      }

      case 'SLEEP_ENERGY_LOGGED': {
        const sleep = event.payload as SleepEnergyEntry;
        if (sleep && (sleep.id || sleep.date)) {
          const key = sleep.id || sleep.date;
          sleepLogsMap.set(key, sleep);
        }
        break;
      }

      case 'SAVINGS_GOAL_ADDED': {
        const goal = event.payload as SavingsGoal;
        if (goal && goal.id) {
          goalsMap.set(goal.id, goal);
        }
        break;
      }

      case 'SAVINGS_GOAL_TOGGLED': {
        const { goalId, completed } = event.payload || {};
        if (goalId && goalsMap.has(goalId)) {
          const current = goalsMap.get(goalId)!;
          goalsMap.set(goalId, { ...current, completed: completed ?? !current.completed });
        }
        break;
      }

      case 'SAVINGS_GOAL_DELETED': {
        const goalId = event.payload?.goalId || event.payload?.id || event.entityId;
        if (goalId && goalsMap.has(goalId)) {
          goalsMap.delete(goalId);
        }
        break;
      }

      case 'PROFILE_UPDATED': {
        if (event.payload && typeof event.payload === 'object') {
          profilePatch = { ...profilePatch, ...event.payload };
        }
        break;
      }

      default:
        break;
    }
  }

  const substanceLogs = Array.from(substanceLogsMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const cravings = Array.from(cravingsMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const streaks = Array.from(streaksMap.values()).sort(
    (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
  );
  const expenses = Array.from(expensesMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const sleepLogs = Array.from(sleepLogsMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const goals = Array.from(goalsMap.values());

  return {
    substanceLogs,
    cravings,
    streaks,
    expenses,
    sleepLogs,
    goals,
    profilePatch,
  };
}
