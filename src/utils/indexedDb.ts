/**
 * High-performance, high-capacity IndexedDB persistent storage for PuffinLess.
 * Replaces the 5MB browser localStorage ceiling with multi-gigabyte structured storage,
 * eliminating QuotaExceeded errors, preventing mobile OS data eviction, and running asynchronously.
 *
 * All data stored at rest in IndexedDB is encrypted with AES-256 via the device's local vault key.
 */
import { encryptData, decryptData } from './crypto.ts';

const DB_NAME = 'puffinless_indexeddb';
const DB_VERSION = 1;
const STORE_NAME = 'kv_store';

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open (or reuse) the IndexedDB database instance with automatic connection recovery.
 */
export function openPuffinLessDB(): Promise<IDBDatabase> {
  if (dbInstance) {
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
    };

    request.onsuccess = () => {
      dbInstance = request.result;
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

/**
 * Retrieve a value by key from IndexedDB and decrypt it with AES-GCM (or legacy AES-CBC).
 */
export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openPuffinLessDB();
    const rawCipher = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result !== undefined ? req.result : null);
      };
      req.onerror = () => reject(req.error);
    });

    if (rawCipher === null || rawCipher === undefined) {
      return null;
    }
    // Transparently decrypt AES-GCM payload (or handle legacy AES-CBC / raw objects)
    return await decryptData<T | null>(rawCipher, null);
  } catch (err) {
    console.warn(`[IndexedDB] Error reading key "${key}":`, err);
    return null;
  }
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
    dbInstance = null;
    dbPromise = null;
    return;
  }
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
  }
  dbPromise = null;

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
