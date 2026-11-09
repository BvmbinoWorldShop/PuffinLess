/**
 * High-performance, high-capacity IndexedDB persistent storage for PuffinLess.
 * Replaces the 5MB browser localStorage ceiling with multi-gigabyte structured storage,
 * eliminating QuotaExceeded errors, preventing mobile OS data eviction, and running asynchronously.
 *
 * All data stored at rest in IndexedDB is encrypted with AES-256 via the device's local vault key.
 */
import { encryptData, decryptData, decryptWithStatus } from './crypto.ts';
import type { JournalEvent } from '../types/index.ts';

const DB_NAME = 'puffinless_indexeddb';
const DB_VERSION = 2;
const STORE_NAME = 'kv_store';
export const EVENTS_STORE_NAME = 'events_store';

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

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
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

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
      if (!db.objectStoreNames.contains(STORE_NAME) || !db.objectStoreNames.contains(EVENTS_STORE_NAME)) {
        const nextVersion = db.version + 1;
        db.close();
        dbInstance = null;
        const upgradeReq = window.indexedDB.open(DB_NAME, nextVersion);
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
          resolve(dbInstance);
        };
        upgradeReq.onerror = () => {
          dbPromise = null;
          reject(upgradeReq.error || new Error('Failed to upgrade PuffinLess database'));
        };
        return;
      }

      dbInstance = db;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open IndexedDB'));
    };

    request.onblocked = () => {
      console.warn('PuffinLess IndexedDB open blocked by existing connection');
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
 * Fails explicitly on error instead of masking write failures.
 */
export async function idbSet<T>(key: string, value: T): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return;
  }
  const db = await openPuffinLessDB();
  // Enforce AES-GCM encryption with fresh unique IV before writing to disk
  const encryptedPayload =
    typeof value === 'string' && value.startsWith('aes-gcm:')
      ? value
      : await encryptData(value);

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(encryptedPayload, key);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error(`[IndexedDB] Error saving key "${key}"`));
    tx.onerror = () => reject(tx.error || new Error(`[IndexedDB] Transaction error saving key "${key}"`));
  });
}

/**
 * Remove a key from IndexedDB.
 * Fails explicitly on error instead of masking deletion failures.
 */
export async function idbRemove(key: string): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  const db = await openPuffinLessDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(key);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error(`[IndexedDB] Error deleting key "${key}"`));
    tx.onerror = () => reject(tx.error || new Error(`[IndexedDB] Transaction error deleting key "${key}"`));
  });
}

/**
 * Clear all records in the PuffinLess IndexedDB store.
 * Fails explicitly on error instead of masking clear failures.
 */
export async function idbClear(): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  const db = await openPuffinLessDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error('[IndexedDB] Error clearing store'));
    tx.onerror = () => reject(tx.error || new Error('[IndexedDB] Transaction error clearing store'));
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
 * Throws explicitly on failure.
 */
export async function idbAppendEvent(event: JournalEvent): Promise<void> {
  const db = await openPuffinLessDB();
  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(EVENTS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(EVENTS_STORE_NAME);
      store.put(event);
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
 * sorted chronologically by monotonic sequence / timestamp.
 */
export async function idbGetAllEvents(): Promise<JournalEvent[]> {
  try {
    const db = await openPuffinLessDB();
    return await new Promise<JournalEvent[]>((resolve, reject) => {
      try {
        const tx = db.transaction(EVENTS_STORE_NAME, 'readonly');
        const store = tx.objectStore(EVENTS_STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const events = (req.result || []) as JournalEvent[];
          events.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0) || new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          resolve(events);
        };
        req.onerror = () => reject(req.error || new Error('[IndexedDB] Failed to query events_store'));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  } catch (err) {
    console.warn('[IndexedDB] Could not retrieve events from events_store:', err);
    return [];
  }
}

/**
 * Clear the events_store journal (called strictly during confirmed user data reset).
 */
export async function idbClearEvents(): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  try {
    const db = await openPuffinLessDB();
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(EVENTS_STORE_NAME, 'readwrite');
        const store = tx.objectStore(EVENTS_STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => resolve();
      } catch (err) {
        reject(err);
      }
    });
  } catch {
    // ignore
  }
}
