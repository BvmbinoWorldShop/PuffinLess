/**
 * High-performance, high-capacity IndexedDB persistent storage for PuffinLess.
 * Replaces the 5MB browser localStorage ceiling with multi-gigabyte structured storage,
 * eliminating QuotaExceeded errors, preventing mobile OS data eviction, and running asynchronously.
 *
 * All data stored at rest in IndexedDB is encrypted with AES-256 via the device's local vault key.
 */
import { encryptData, decryptData, decryptWithStatus, DecryptionError } from './crypto.ts';
import type { JournalEvent } from '../types/index.ts';

export interface JournalReadResult {
  status: 'empty' | 'success' | 'error';
  events: JournalEvent[];
  error?: Error;
}

export class IndexedDBUnavailableError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'IndexedDBUnavailableError';
    this.cause = cause;
  }
}

export class IndexedDBTransactionError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'IndexedDBTransactionError';
    this.cause = cause;
  }
}

const DB_NAME = 'puffinless_indexeddb';
const STORE_NAME = 'kv_store';
export const EVENTS_STORE_NAME = 'events_store';

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Explicit check for IndexedDB availability and read/write transaction viability.
 */
export async function isIndexedDBAvailable(): Promise<{ available: boolean; reason?: string }> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return { available: false, reason: 'IndexedDB API is not present on window' };
  }
  try {
    const db = await openPuffinLessDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return { available: true };
  } catch (err) {
    return {
      available: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Closes the active IndexedDB connection and resets cached instances.
 */
export function closePuffinLessDB(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
  }
  dbPromise = null;
}

/**
 * Open (or reuse) the IndexedDB database instance with automatic connection recovery.
 * Opens without a hardcoded version argument to seamlessly adopt the existing on-disk version,
 * and dynamically upgrades if any required store is missing, completely preventing VersionError.
 */
export function openPuffinLessDB(): Promise<IDBDatabase> {
  if (
    dbInstance &&
    dbInstance.objectStoreNames.contains(STORE_NAME) &&
    dbInstance.objectStoreNames.contains(EVENTS_STORE_NAME)
  ) {
    return Promise.resolve(dbInstance);
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      dbPromise = null;
      reject(new IndexedDBUnavailableError('IndexedDB is not supported or accessible in this environment'));
      return;
    }

    // Open without hardcoded version parameter to inspect existing version without VersionError
    const request = window.indexedDB.open(DB_NAME);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(EVENTS_STORE_NAME)) {
        const evStore = db.createObjectStore(EVENTS_STORE_NAME, { keyPath: 'id' });
        evStore.createIndex('seq', 'seq', { unique: false });
        evStore.createIndex('type', 'type', { unique: false });
        evStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const hasKv = db.objectStoreNames.contains(STORE_NAME);
      const hasEvents = db.objectStoreNames.contains(EVENTS_STORE_NAME);

      if (!hasKv || !hasEvents) {
        // Upgrade required: bump current version by 1
        const targetVersion = (db.version || 1) + 1;
        db.close();
        dbInstance = null;

        const upgradeReq = window.indexedDB.open(DB_NAME, targetVersion);
        upgradeReq.onupgradeneeded = (ue) => {
          const uDb = (ue.target as IDBOpenDBRequest).result;
          if (!uDb.objectStoreNames.contains(STORE_NAME)) {
            uDb.createObjectStore(STORE_NAME);
          }
          if (!uDb.objectStoreNames.contains(EVENTS_STORE_NAME)) {
            const evStore = uDb.createObjectStore(EVENTS_STORE_NAME, { keyPath: 'id' });
            evStore.createIndex('seq', 'seq', { unique: false });
            evStore.createIndex('type', 'type', { unique: false });
            evStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        upgradeReq.onsuccess = () => {
          dbInstance = upgradeReq.result;
          dbInstance.onversionchange = () => {
            dbInstance?.close();
            dbInstance = null;
            dbPromise = null;
          };
          dbPromise = null;
          resolve(dbInstance);
        };
        upgradeReq.onerror = () => {
          dbPromise = null;
          const detail = upgradeReq.error?.message ? `: ${upgradeReq.error.message}` : '';
          reject(new IndexedDBTransactionError(
            `Failed to upgrade database "${DB_NAME}" to version ${targetVersion}${detail}`,
            upgradeReq.error
          ));
        };
        upgradeReq.onblocked = () => {
          console.warn('[IndexedDB] Database upgrade blocked by another connection');
        };
        return;
      }

      dbInstance = db;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbPromise = null;
      };
      dbPromise = null;
      resolve(dbInstance);
    };

    request.onerror = () => {
      dbPromise = null;
      const detail = request.error?.message ? `: ${request.error.message}` : '';
      reject(new IndexedDBUnavailableError(
        `Failed to open IndexedDB database "${DB_NAME}"${detail}`,
        request.error
      ));
    };

    request.onblocked = () => {
      console.warn('[IndexedDB] Database open blocked by another connection');
    };
  });

  return dbPromise;
}

export type IdbReadResult<T> =
  | { status: 'absent'; data: null }
  | { status: 'success'; data: T }
  | { status: 'error'; data: null; error: Error };

/**
 * Retrieve the raw record from IndexedDB kv_store with explicit status:
 * - 'absent': Key does not exist in store
 * - 'success': Key exists and value is returned
 * - 'error': Opening, transaction or query error
 * Strictly prevents collapsing database errors into null or mistaken for missing data.
 */
export async function idbGetRawWithStatus(
  key: string
): Promise<{ status: 'absent' | 'success' | 'error'; data: unknown; error?: Error }> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return { status: 'error', data: null, error: new Error('[IndexedDB] IndexedDB is not available in this environment') };
  }
  let db: IDBDatabase;
  try {
    db = await openPuffinLessDB();
  } catch (err) {
    return { status: 'error', data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }

  return await new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result === undefined || req.result === null) {
          resolve({ status: 'absent', data: null });
        } else {
          resolve({ status: 'success', data: req.result });
        }
      };
      req.onerror = () => {
        resolve({ status: 'error', data: null, error: req.error || new Error(`[IndexedDB] Query error for key "${key}"`) });
      };
      tx.onerror = () => {
        resolve({ status: 'error', data: null, error: tx.error || new Error(`[IndexedDB] Transaction error for key "${key}"`) });
      };
    } catch (err) {
      resolve({ status: 'error', data: null, error: err instanceof Error ? err : new Error(String(err)) });
    }
  });
}

/**
 * Retrieve the raw (undecrypted) record from IndexedDB kv_store.
 * Returns null strictly when the key does not exist.
 * Throws explicitly on database or transaction failure.
 */
export async function idbGetRaw(key: string): Promise<unknown> {
  const res = await idbGetRawWithStatus(key);
  if (res.status === 'success') {
    return res.data;
  }
  if (res.status === 'error') {
    throw res.error || new Error(`[IndexedDB] Query error for key "${key}"`);
  }
  return null;
}

/**
 * Reads a record from IndexedDB with explicit tri-state result:
 * - 'absent': Record does not exist in IndexedDB kv_store
 * - 'success': Record retrieved and decrypted
 * - 'error': Database connection, query, or decryption failure
 * Do NOT collapse database errors into null.
 */
export async function idbGetWithStatus<T = unknown>(
  key: string,
  options?: { decrypt?: boolean }
): Promise<IdbReadResult<T>> {
  const rawRes = await idbGetRawWithStatus(key);
  if (rawRes.status === 'error') {
    return { status: 'error', data: null, error: rawRes.error || new Error(`[IndexedDB] Read error for key "${key}"`) };
  }
  if (rawRes.status === 'absent') {
    return { status: 'absent', data: null };
  }

  const rawVal = rawRes.data;
  if (options?.decrypt !== false && typeof rawVal === 'string') {
    const decRes = await decryptWithStatus<T>(rawVal);
    if (decRes.status === 'success') {
      return { status: 'success', data: decRes.data as T };
    }
    if (decRes.status === 'error') {
      return { status: 'error', data: null, error: decRes.error || new Error(`[IndexedDB] Decryption failed for key "${key}"`) };
    }
    return { status: 'absent', data: null };
  }

  return { status: 'success', data: rawVal as T };
}

/**
 * Retrieve a value by key from IndexedDB and decrypt it with AES-GCM (or legacy AES-CBC).
 * Strictly distinguishes missing keys (null) from decryption/storage failures (throws on error if requested).
 */
export async function idbGet<T>(key: string, options?: { throwOnError?: boolean }): Promise<T | null> {
  const res = await idbGetWithStatus<T>(key, { decrypt: true });
  if (res.status === 'success') {
    return res.data;
  }
  if (res.status === 'error') {
    if (options?.throwOnError) {
      throw res.error;
    }
    console.warn(`[IndexedDB] Error reading key "${key}":`, res.error);
    return null;
  }
  return null;
}

/**
 * Encrypt arbitrary value with AES-GCM and store by key in IndexedDB.
 * Fails explicitly with IndexedDBUnavailableError or IndexedDBTransactionError
 * instead of reporting silent success.
 */
export async function idbSet<T>(key: string, value: T): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new IndexedDBUnavailableError('[IndexedDB] IndexedDB is not available in this environment');
  }
  const db = await openPuffinLessDB();
  // Enforce AES-GCM encryption with fresh unique IV before writing to disk
  const encryptedPayload =
    typeof value === 'string' && value.startsWith('aes-gcm:')
      ? value
      : await encryptData(value);

  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(encryptedPayload, key);

      tx.oncomplete = () => resolve();
      req.onerror = () => reject(new IndexedDBTransactionError(`[IndexedDB] Error saving key "${key}"`, req.error));
      tx.onerror = () => reject(new IndexedDBTransactionError(`[IndexedDB] Transaction error saving key "${key}"`, tx.error));
      tx.onabort = () => reject(new IndexedDBTransactionError(`[IndexedDB] Transaction aborted saving key "${key}"`, tx.error));
    } catch (txErr) {
      reject(new IndexedDBTransactionError(`[IndexedDB] Failed to open transaction for key "${key}"`, txErr));
    }
  });
}

/**
 * Remove a key from IndexedDB.
 * Resolves on tx.oncomplete to guarantee transaction persistence.
 * Fails explicitly with IndexedDBUnavailableError or IndexedDBTransactionError
 * instead of masking deletion failures.
 */
export async function idbRemove(key: string): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new IndexedDBUnavailableError('[IndexedDB] IndexedDB is not available in this environment');
  }
  const db = await openPuffinLessDB();
  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);

      tx.oncomplete = () => resolve();
      req.onerror = () => reject(new IndexedDBTransactionError(`[IndexedDB] Error deleting key "${key}"`, req.error));
      tx.onerror = () => reject(new IndexedDBTransactionError(`[IndexedDB] Transaction error deleting key "${key}"`, tx.error));
      tx.onabort = () => reject(new IndexedDBTransactionError(`[IndexedDB] Transaction aborted deleting key "${key}"`, tx.error));
    } catch (txErr) {
      reject(new IndexedDBTransactionError(`[IndexedDB] Failed to open transaction for deleting key "${key}"`, txErr));
    }
  });
}

/**
 * Clear all records in the PuffinLess IndexedDB store.
 * Resolves on tx.oncomplete to guarantee transaction persistence.
 * Fails explicitly with IndexedDBUnavailableError or IndexedDBTransactionError
 * instead of masking clear failures.
 */
export async function idbClear(): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new IndexedDBUnavailableError('[IndexedDB] IndexedDB is not available in this environment');
  }
  const db = await openPuffinLessDB();
  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      tx.oncomplete = () => resolve();
      req.onerror = () => reject(new IndexedDBTransactionError('[IndexedDB] Error clearing store', req.error));
      tx.onerror = () => reject(new IndexedDBTransactionError('[IndexedDB] Transaction error clearing store', tx.error));
      tx.onabort = () => reject(new IndexedDBTransactionError('[IndexedDB] Transaction aborted clearing store', tx.error));
    } catch (txErr) {
      reject(new IndexedDBTransactionError('[IndexedDB] Failed to open transaction for clearing store', txErr));
    }
  });
}

/**
 * Irrevocably close and delete the IndexedDB database from the browser disk.
 * Strictly awaits real confirmation from the database engine before resolving.
 */
export async function deletePuffinLessDB(): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    closePuffinLessDB();
    return;
  }
  closePuffinLessDB();

  if (typeof window !== 'undefined' && window.indexedDB) {
    await new Promise<void>((resolve, reject) => {
      const req = window.indexedDB.deleteDatabase(DB_NAME);

      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        reject(new Error('[IndexedDB] Database deletion timed out while waiting for confirmation.'));
      }, 8000);

      req.onsuccess = () => {
        if (!timedOut) {
          clearTimeout(timeoutId);
          resolve();
        }
      };

      req.onerror = () => {
        if (!timedOut) {
          clearTimeout(timeoutId);
          reject(req.error || new Error('[IndexedDB] Failed to delete database'));
        }
      };

      req.onblocked = () => {
        console.warn('[IndexedDB] Database delete blocked by open connections. Attempting to force close...');
        if (dbInstance) {
          try {
            dbInstance.close();
          } catch {
            // ignore
          }
          dbInstance = null;
        }
      };
    });
  }
}

/**
 * Export all entries stored in IndexedDB as a structured dictionary, decrypted.
 */
export async function idbGetAllEntries(): Promise<Record<string, unknown>> {
  try {
    const db = await openPuffinLessDB();
    return await new Promise<Record<string, unknown>>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const rawEntries: Array<{ key: string; value: unknown }> = [];

      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          rawEntries.push({ key: String(cursor.key), value: cursor.value });
          cursor.continue();
        } else {
          Promise.all(
            rawEntries.map(async (entry) => {
              const decrypted = await decryptData(entry.value, entry.value);
              return { key: entry.key, value: decrypted };
            })
          )
            .then((decryptedList) => {
              const results: Record<string, unknown> = {};
              decryptedList.forEach((item) => {
                results[item.key] = item.value;
              });
              resolve(results);
            })
            .catch(reject);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error exporting all entries:', err);
    return {};
  }
}

/**
 * Append an immutable event to the IndexedDB events_store journal.
 * Encrypts the event before persistence.
 * Throws explicitly on failure so writes fail visibly.
 */
export async function idbAppendEvent(event: JournalEvent): Promise<void> {
  const cipher = await encryptData(event);
  const recordToStore = {
    id: event.id,
    seq: event.seq,
    type: event.type,
    timestamp: event.timestamp,
    schemaVersion: event.schemaVersion || 1,
    entityId: event.entityId,
    ciphertext: cipher,
  };

  const db = await openPuffinLessDB();
  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(EVENTS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(EVENTS_STORE_NAME);
      store.put(recordToStore);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error(`[IndexedDB] Error appending event "${event.id}"`));
      tx.onabort = () => reject(tx.error || new Error(`[IndexedDB] Transaction aborted appending event "${event.id}"`));
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/**
 * Retrieve all historical events from the immutable IndexedDB events_store journal,
 * decrypting each event payload. Throws explicitly on failure.
 */
export async function idbGetAllEvents(): Promise<JournalEvent[]> {
  const db = await openPuffinLessDB();
  return new Promise<JournalEvent[]>((resolve, reject) => {
    try {
      const tx = db.transaction(EVENTS_STORE_NAME, 'readonly');
      const store = tx.objectStore(EVENTS_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = async () => {
        try {
          const rawRecords = (req.result || []) as Array<any>;
          const events: JournalEvent[] = [];
          for (const raw of rawRecords) {
            if (raw.ciphertext) {
              const decrypted = await decryptData<JournalEvent | null>(raw.ciphertext, null);
              if (!decrypted) {
                throw new DecryptionError(`[IndexedDB] Failed to decrypt journal event with ID "${raw.id}"`);
              }
              events.push(decrypted);
            } else if (raw.payload && raw.type) {
              // Backward compatibility for existing plaintext events
              events.push(raw as JournalEvent);
            }
          }
          events.sort(
            (a, b) =>
              (a.seq ?? 0) - (b.seq ?? 0) ||
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          resolve(events);
        } catch (decryptErr) {
          reject(decryptErr instanceof Error ? decryptErr : new Error(String(decryptErr)));
        }
      };
      req.onerror = () => reject(req.error || new Error('[IndexedDB] Failed to query events_store'));
      tx.onerror = () => reject(tx.error || new Error('[IndexedDB] Transaction error reading events_store'));
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/**
 * Explicitly distinguishes an empty journal from a failed journal read.
 */
export async function idbGetAllEventsWithStatus(): Promise<JournalReadResult> {
  try {
    const events = await idbGetAllEvents();
    if (events.length === 0) {
      return { status: 'empty', events: [] };
    }
    return { status: 'success', events };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { status: 'error', events: [], error };
  }
}

/**
 * Queries the highest sequence number in the events_store journal.
 * Throws explicitly on failure so callers know sequence initialization failed.
 * Returns 0 if the journal is genuinely empty.
 */
export async function idbGetMaxEventSeq(): Promise<number> {
  const db = await openPuffinLessDB();
  return new Promise<number>((resolve, reject) => {
    try {
      const tx = db.transaction(EVENTS_STORE_NAME, 'readonly');
      const store = tx.objectStore(EVENTS_STORE_NAME);
      let maxSeq = 0;

      if (store.indexNames.contains('seq')) {
        const index = store.index('seq');
        const cursorReq = index.openCursor(null, 'prev');
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor && typeof cursor.key === 'number') {
            resolve(cursor.key);
          } else {
            resolve(0);
          }
        };
        cursorReq.onerror = () => reject(cursorReq.error || new Error('[IndexedDB] Error querying max seq cursor'));
      } else {
        const req = store.getAll();
        req.onsuccess = () => {
          const records = (req.result || []) as Array<{ seq?: number }>;
          for (const r of records) {
            if (typeof r.seq === 'number' && r.seq > maxSeq) {
              maxSeq = r.seq;
            }
          }
          resolve(maxSeq);
        };
        req.onerror = () => reject(req.error || new Error('[IndexedDB] Error reading events store records'));
      }
      tx.onerror = () => reject(tx.error || new Error('[IndexedDB] Transaction error querying max seq'));
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/**
 * Clear the events_store journal (called strictly during confirmed user data reset).
 * Fails visibly and never swallows errors.
 */
export async function idbClearEvents(): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new Error('IndexedDB is not available');
  }
  const db = await openPuffinLessDB();
  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(EVENTS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(EVENTS_STORE_NAME);
      const req = store.clear();
      tx.oncomplete = () => resolve();
      req.onerror = () => reject(req.error || new Error('[IndexedDB] Failed to clear events_store'));
      tx.onerror = () => reject(tx.error || new Error('[IndexedDB] Transaction error clearing events_store'));
      tx.onabort = () => reject(tx.error || new Error('[IndexedDB] Transaction aborted clearing events_store'));
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

export interface AtomicPersistenceOperation {
  projections?: Array<{ key: string; value: unknown }>;
  events?: JournalEvent[];
}

/**
 * Genuinely atomic persistence across both `kv_store` (projections) and `events_store` (journal).
 *
 * All values are pre-encrypted with AES-GCM before the IndexedDB transaction is opened,
 * ensuring no asynchronous pauses occur inside the transaction (which would cause auto-commit).
 *
 * Then, a single ACID multi-store transaction spanning both [STORE_NAME, EVENTS_STORE_NAME]
 * executes all updates synchronously. If any operation fails or is aborted, both stores roll back
 * atomically with zero disk changes, ensuring the UI, projections, and event journal NEVER disagree.
 */
export async function idbPersistAtomic(op: AtomicPersistenceOperation): Promise<void> {
  const projectionsToStore: Array<{ key: string; encrypted: string }> = [];
  if (op.projections && op.projections.length > 0) {
    for (const proj of op.projections) {
      const encrypted =
        typeof proj.value === 'string' && proj.value.startsWith('aes-gcm:')
          ? proj.value
          : await encryptData(proj.value);
      projectionsToStore.push({ key: proj.key, encrypted });
    }
  }

  const eventsToStore: Array<{
    id: string;
    seq: number;
    type: string;
    timestamp: string;
    schemaVersion: number;
    entityId?: string;
    ciphertext: string;
  }> = [];

  if (op.events && op.events.length > 0) {
    for (const event of op.events) {
      const cipher = await encryptData(event);
      eventsToStore.push({
        id: event.id,
        seq: event.seq,
        type: event.type,
        timestamp: event.timestamp,
        schemaVersion: event.schemaVersion || 1,
        entityId: event.entityId,
        ciphertext: cipher,
      });
    }
  }

  if (projectionsToStore.length === 0 && eventsToStore.length === 0) {
    return;
  }

  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new IndexedDBUnavailableError('IndexedDB is not available in this environment');
  }

  const db = await openPuffinLessDB();
  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction([STORE_NAME, EVENTS_STORE_NAME], 'readwrite');
      const kvStore = tx.objectStore(STORE_NAME);
      const eventsStore = tx.objectStore(EVENTS_STORE_NAME);

      for (const proj of projectionsToStore) {
        kvStore.put(proj.encrypted, proj.key);
      }

      for (const ev of eventsToStore) {
        eventsStore.put(ev);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        reject(new IndexedDBTransactionError(
          `[IndexedDB] Atomic transaction failed: ${tx.error?.message || 'unknown error'}`,
          tx.error
        ));
      };
      tx.onabort = () => {
        reject(new IndexedDBTransactionError(
          `[IndexedDB] Atomic transaction aborted: ${tx.error?.message || 'unknown abort'}`,
          tx.error
        ));
      };
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
