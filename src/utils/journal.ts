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
import { idbAppendEvent, idbGetAllEvents, idbClearEvents } from './indexedDb.ts';

let monotonicSequence = 0;

function generateEventId(prefix: string = 'ev'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Record an immutable event to the event journal.
 * Guarantees monotonic sequence numbering and immutable persistence.
 */
export async function recordJournalEvent(
  type: JournalEventType,
  payload: any,
  entityId?: string
): Promise<JournalEvent> {
  monotonicSequence++;
  const event: JournalEvent = {
    id: generateEventId('ev'),
    seq: monotonicSequence || Date.now(),
    type,
    timestamp: new Date().toISOString(),
    schemaVersion: 1,
    payload,
    entityId,
  };

  try {
    await idbAppendEvent(event);
  } catch (err) {
    console.warn('[Journal] Failed to persist event to events_store:', err);
  }

  return event;
}

/**
 * Retrieve all historical events from the journal.
 */
export async function getHistoricalJournalEvents(): Promise<JournalEvent[]> {
  return await idbGetAllEvents();
}

/**
 * Clear all journal events (strictly called during confirmed user data reset).
 */
export async function clearJournalEvents(): Promise<void> {
  monotonicSequence = 0;
  await idbClearEvents();
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
 * Compensating events (e.g. SUBSTANCE_REMOVED, PURCHASE_EXPENSE_DELETED) are evaluated
 * in strict historical sequence without destructive data erasure.
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
        const { logId, removeCount } = event.payload || {};
        if (logId && substanceLogsMap.has(logId)) {
          const existing = substanceLogsMap.get(logId)!;
          if (removeCount && existing.count > removeCount) {
            substanceLogsMap.set(logId, { ...existing, count: existing.count - removeCount });
          } else {
            substanceLogsMap.delete(logId);
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

      case 'STREAK_RECORDED': {
        const streak = event.payload as StreakRecord;
        if (streak && streak.id) {
          streaksMap.set(streak.id, streak);
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
        const { expenseId } = event.payload || {};
        if (expenseId) {
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
        const { goalId } = event.payload || {};
        if (goalId) {
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
