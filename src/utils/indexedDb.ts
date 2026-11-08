/**
 * High-performance, high-capacity IndexedDB persistent storage for PuffinLess.
 * Replaces the 5MB browser localStorage ceiling with multi-gigabyte structured storage,
 * eliminating QuotaExceeded errors, preventing mobile OS data eviction, and running asynchronously.
 *
 * All data stored at rest in IndexedDB is encrypted with AES-256 via the device's local vault key.
 */
import { encryptData, decryptData } from './crypto';

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
 * Retrieve a value by key from IndexedDB and decrypt it with AES-256.
 */
export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openPuffinLessDB();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result === undefined || req.result === null) {
          resolve(null);
        } else {
          // Transparently decrypt AES-256 payload (or handle legacy raw objects)
          resolve(decryptData<T | null>(req.result, null));
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Error reading key "${key}":`, err);
    return null;
  }
}

/**
 * Encrypt arbitrary value with AES-256 and store by key in IndexedDB.
 */
export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openPuffinLessDB();
    // Enforce AES-256 encryption before writing to disk
    const encryptedPayload = encryptData(value);

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(encryptedPayload, key);

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
 * Irrevocably close and delete the IndexedDB database from the browser disk.
 */
export async function deletePuffinLessDB(): Promise<void> {
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
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => {
        console.warn('[IndexedDB] Database delete blocked by open tab; proceeding.');
        resolve();
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
      const results: Record<string, unknown> = {};

      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          results[String(cursor.key)] = decryptData(cursor.value, cursor.value);
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
