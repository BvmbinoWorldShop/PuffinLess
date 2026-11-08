/**
 * High-performance, high-capacity IndexedDB persistent storage for PuffinLess.
 * Replaces the 5MB browser localStorage ceiling with multi-gigabyte structured storage,
 * eliminating QuotaExceeded errors, preventing mobile OS data eviction, and running asynchronously.
 */

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
 * Retrieve a value by key from IndexedDB.
 */
export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openPuffinLessDB();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result !== undefined ? (req.result as T) : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Error reading key "${key}":`, err);
    return null;
  }
}

/**
 * Store a value by key in IndexedDB.
 */
export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openPuffinLessDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Error saving key "${key}":`, err);
  }
}

/**
 * Remove a key from IndexedDB.
 */
export async function idbRemove(key: string): Promise<void> {
  try {
    const db = await openPuffinLessDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Error deleting key "${key}":`, err);
  }
}

/**
 * Clear all records in the PuffinLess IndexedDB store.
 */
export async function idbClear(): Promise<void> {
  try {
    const db = await openPuffinLessDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error clearing store:', err);
  }
}

/**
 * Export all entries stored in IndexedDB as a structured dictionary.
 */
export async function idbGetAllEntries(): Promise<Record<string, unknown>> {
  try {
    const db = await openPuffinLessDB();
    return await new Promise<Record<string, unknown>>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const results: Record<string, unknown> = {};

      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          results[String(cursor.key)] = cursor.value;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error exporting all entries:', err);
    return {};
  }
}
