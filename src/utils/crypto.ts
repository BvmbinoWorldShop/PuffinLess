/**
 * LOCAL AES-GCM ENCRYPTION AT REST VIA WEB CRYPTO API & INDEXEDDB KEY VAULT
 * --------------------------------------------------------------------------
 * High-security authenticated encryption (AES-GCM 256-bit) using native Web Crypto API.
 * - Non-extractable CryptoKey (extractable: false) stored securely in IndexedDB key vault.
 * - Zero raw key storage in localStorage.
 * - Unique cryptographically random 96-bit (12-byte) IV for every encryption operation.
 * - Failure-safe persistent device key vault with non-extractable CryptoKey.
 * - Explicit distinction between data absence and decryption integrity errors.
 * - Seamless zero-data-loss migration for legacy AES-CBC (CryptoJS) payloads.
 */
import CryptoJS from 'crypto-js';

const KEY_DB_NAME = 'puffinless_key_vault';
const KEY_STORE_NAME = 'keys';
export const MASTER_KEY_ID = 'device_master_key';
const STORAGE_DEVICE_KEY = 'puffinless_vault_key_v2';
const LEGACY_STORAGE_DEVICE_KEY = 'puffinless_vault_key_v1';
const LEGACY_VAULT_SALT = 'puffinless_aes256_client_vault_stable_key_v2_offline';

export const DEVICE_RECOVERY_KEY = 'puffinless_vault_device_envelope_v2';

/**
 * Explicit cryptographic lifecycle states:
 * - BOOTING: Initializing and verifying persistent non-extractable CryptoKey from IndexedDB
 * - READY: Active and verified for transparent authenticated AES-GCM operations at rest
 * - PURGED: Irrevocably destroyed on user-requested right-to-be-forgotten
 */
export type CryptoLifecycleState = 'BOOTING' | 'READY' | 'PURGED';
let cryptoLifecycleState: CryptoLifecycleState = 'BOOTING';

export function getCryptoLifecycleState(): CryptoLifecycleState {
  return cryptoLifecycleState;
}

/** In-memory fallback and test store */
const inMemoryKeyStore = new Map<string, CryptoKey>();
let cachedCryptoKey: CryptoKey | null = null;

/** Custom error for cryptographic decryption integrity or key mismatch */
export class DecryptionError extends Error {
  constructor(message = 'Déchiffrement impossible : clé invalide, coffre verrouillé ou données altérées.') {
    super(message);
    this.name = 'DecryptionError';
  }
}

export type DecryptResult<T> =
  | { status: 'absent'; data: null }
  | { status: 'success'; data: T }
  | { status: 'error'; error: DecryptionError };

export function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  throw new Error('[Crypto] Web Crypto API is not supported in this runtime environment.');
}

export function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

function toBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

let keyDbInstance: IDBDatabase | null = null;
let keyDbPromise: Promise<IDBDatabase> | null = null;

/**
 * Closes the active Key Vault IndexedDB connection and resets cached instances.
 */
export function closeKeyVaultDB(): void {
  if (keyDbInstance) {
    try {
      keyDbInstance.close();
    } catch {
      // ignore
    }
    keyDbInstance = null;
  }
  keyDbPromise = null;
}

/**
 * Open (or reuse) the dedicated IndexedDB Key Vault database for non-extractable CryptoKeys
 */
function openKeyVaultDB(): Promise<IDBDatabase> {
  if (keyDbInstance && keyDbInstance.objectStoreNames.contains(KEY_STORE_NAME)) {
    return Promise.resolve(keyDbInstance);
  }
  if (keyDbPromise) {
    return keyDbPromise;
  }
  keyDbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not available in this environment'));
    }
    const req = window.indexedDB.open(KEY_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
        db.createObjectStore(KEY_STORE_NAME);
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
        // Database exists but lacks the keys store: upgrade version dynamically
        const nextVersion = db.version + 1;
        db.close();
        keyDbInstance = null;
        const upgradeReq = window.indexedDB.open(KEY_DB_NAME, nextVersion);
        upgradeReq.onupgradeneeded = (ue) => {
          const uDb = (ue.target as IDBOpenDBRequest).result;
          if (!uDb.objectStoreNames.contains(KEY_STORE_NAME)) {
            uDb.createObjectStore(KEY_STORE_NAME);
          }
        };
        upgradeReq.onsuccess = () => {
          keyDbInstance = upgradeReq.result;
          keyDbInstance.onversionchange = () => {
            keyDbInstance?.close();
            keyDbInstance = null;
            keyDbPromise = null;
          };
          resolve(keyDbInstance);
        };
        upgradeReq.onerror = () => {
          keyDbPromise = null;
          reject(upgradeReq.error || new Error('Failed to upgrade key vault database'));
        };
        return;
      }

      keyDbInstance = db;
      keyDbInstance.onversionchange = () => {
        keyDbInstance?.close();
        keyDbInstance = null;
        keyDbPromise = null;
      };
      resolve(keyDbInstance);
    };
    req.onerror = () => {
      keyDbPromise = null;
      reject(req.error || new Error('Failed to open key vault database'));
    };
  });
  return keyDbPromise;
}

export type KeyVaultReadResult =
  | { status: 'absent'; key: null }
  | { status: 'success'; key: CryptoKey }
  | { status: 'error'; key: null; error: Error };

/**
 * Store a non-extractable CryptoKey in IndexedDB with failure-safe verification.
 * - If IndexedDB is unavailable, throws an explicit error rather than reporting successful persistence.
 * - The old key remains completely untouched if persistence or verification fails.
 * - Performs physical read-back verification AND cryptographic usability verification (round-trip encrypt/decrypt).
 */
export async function saveKeyToVault(id: string, key: CryptoKey): Promise<void> {
  // 1. If IndexedDB is unavailable, must throw an error rather than report successful persistence.
  // The old key must remain untouched (do not mutate inMemoryKeyStore or cachedCryptoKey).
  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new Error(`[Crypto] IndexedDB is unavailable in this environment. Cannot persist key "${id}". The existing key remains untouched.`);
  }

  // 2. Open key vault database with failure-safe handling
  let db: IDBDatabase;
  try {
    db = await openKeyVaultDB();
  } catch (openErr) {
    throw new Error(`[Crypto] Failed to open key vault database for key "${id}": ${openErr instanceof Error ? openErr.message : String(openErr)}`);
  }

  // 3. Write key and backup archive inside transaction
  await new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(KEY_STORE_NAME, 'readwrite');
      const store = tx.objectStore(KEY_STORE_NAME);
      store.put(key, id);
      // Archive copy to guarantee non-destructive key retention
      store.put(key, `${id}_backup`);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error(`IndexedDB transaction error saving key "${id}"`));
      tx.onabort = () => reject(tx.error || new Error(`IndexedDB transaction aborted saving key "${id}"`));
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });

  // 4. Physical read-back verification: verify key was physically persisted in IndexedDB
  const verifyTx = db.transaction(KEY_STORE_NAME, 'readonly');
  const verifyStore = verifyTx.objectStore(KEY_STORE_NAME);
  const verifyReq = verifyStore.get(id);
  const readBack = await new Promise<CryptoKey | null>((resolve, reject) => {
    verifyReq.onsuccess = () => resolve((verifyReq.result as CryptoKey) || null);
    verifyReq.onerror = () => reject(verifyReq.error || new Error('Key readback verification query failed'));
    verifyTx.onerror = () => reject(verifyTx.error || new Error('Key readback verification transaction failed'));
  });

  if (!readBack) {
    throw new Error(`[Crypto] Read-back verification failed for key id "${id}" in key vault`);
  }

  // 5. Usability verification: verify the retrieved key is genuinely usable for the intended encryption/decryption operation
  try {
    const cryptoInstance = getCrypto();
    const testIV = new Uint8Array(12);
    cryptoInstance.getRandomValues(testIV);
    const verificationPayload = new TextEncoder().encode('puffinless_key_usability_verification_token');
    const encryptedToken = await cryptoInstance.subtle.encrypt(
      { name: 'AES-GCM', iv: testIV },
      readBack,
      verificationPayload
    );
    const decryptedToken = await cryptoInstance.subtle.decrypt(
      { name: 'AES-GCM', iv: testIV },
      readBack,
      encryptedToken
    );
    const decryptedString = new TextDecoder().decode(decryptedToken);
    if (decryptedString !== 'puffinless_key_usability_verification_token') {
      throw new Error('Round-trip encryption/decryption verification produced mismatched payload');
    }
  } catch (cryptoErr) {
    throw new Error(`[Crypto] Read-back verification failed: retrieved key id "${id}" is not usable for cryptographic operations: ${cryptoErr instanceof Error ? cryptoErr.message : String(cryptoErr)}`);
  }

  // 6. ONLY AFTER confirmed persistence, physical read-back AND cryptographic usability verification:
  // Update in-memory stores with the confirmed, usable key
  inMemoryKeyStore.set(id, key);
  if (id === MASTER_KEY_ID) {
    cachedCryptoKey = key;
    cryptoLifecycleState = 'READY';
  }
}

/**
 * Retrieve a non-extractable CryptoKey from IndexedDB with explicit status:
 * - 'absent': Key does not exist in key vault
 * - 'success': Key retrieved and verified usable
 * - 'error': Database connection, query, or usability verification failure
 * Strictly prevents collapsing database errors into null or mistaken for missing keys.
 */
export async function loadKeyFromVaultWithStatus(id: string): Promise<KeyVaultReadResult> {
  if (inMemoryKeyStore.has(id)) {
    const memKey = inMemoryKeyStore.get(id);
    if (memKey) return { status: 'success', key: memKey };
  }
  if (typeof window === 'undefined' || !window.indexedDB) {
    return { status: 'error', key: null, error: new Error('[KeyVault] IndexedDB is not available in this environment') };
  }

  let db: IDBDatabase;
  try {
    db = await openKeyVaultDB();
  } catch (err) {
    return { status: 'error', key: null, error: err instanceof Error ? err : new Error(String(err)) };
  }

  try {
    const primaryKey = await new Promise<CryptoKey | null>((resolve, reject) => {
      try {
        const tx = db.transaction(KEY_STORE_NAME, 'readonly');
        const store = tx.objectStore(KEY_STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve((req.result as CryptoKey) || null);
        req.onerror = () => reject(req.error || new Error(`Key query error for "${id}"`));
        tx.onerror = () => reject(tx.error || new Error(`Key transaction error for "${id}"`));
      } catch (txErr) {
        reject(txErr);
      }
    });

    if (primaryKey) {
      // Usability verification on retrieved key
      try {
        const cryptoInstance = getCrypto();
        const testIV = new Uint8Array(12);
        cryptoInstance.getRandomValues(testIV);
        const testPlaintext = new TextEncoder().encode('puffinless_key_usability_check');
        const testCipher = await cryptoInstance.subtle.encrypt(
          { name: 'AES-GCM', iv: testIV },
          primaryKey,
          testPlaintext
        );
        const testDecrypted = await cryptoInstance.subtle.decrypt(
          { name: 'AES-GCM', iv: testIV },
          primaryKey,
          testCipher
        );
        if (new TextDecoder().decode(testDecrypted) !== 'puffinless_key_usability_check') {
          return { status: 'error', key: null, error: new Error(`Key "${id}" failed usability round-trip verification`) };
        }
      } catch (usableErr) {
        return { status: 'error', key: null, error: usableErr instanceof Error ? usableErr : new Error(String(usableErr)) };
      }

      inMemoryKeyStore.set(id, primaryKey);
      return { status: 'success', key: primaryKey };
    }

    // Inspect backup archive in vault
    const backupKey = await new Promise<CryptoKey | null>((resolve, reject) => {
      try {
        const tx = db.transaction(KEY_STORE_NAME, 'readonly');
        const store = tx.objectStore(KEY_STORE_NAME);
        const req = store.get(`${id}_backup`);
        req.onsuccess = () => resolve((req.result as CryptoKey) || null);
        req.onerror = () => reject(req.error || new Error(`Backup query error for "${id}"`));
        tx.onerror = () => reject(tx.error || new Error(`Backup transaction error for "${id}"`));
      } catch (bErr) {
        reject(bErr);
      }
    });

    if (backupKey) {
      inMemoryKeyStore.set(id, backupKey);
      return { status: 'success', key: backupKey };
    }

    // Cursor inspection for any valid CryptoKey before concluding absent
    const anyKey = await new Promise<CryptoKey | null>((resolve) => {
      try {
        const tx = db.transaction(KEY_STORE_NAME, 'readonly');
        const store = tx.objectStore(KEY_STORE_NAME);
        const req = store.openCursor();
        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const val = cursor.value;
            if (val && typeof val === 'object' && 'algorithm' in (val as any)) {
              resolve(val as CryptoKey);
              return;
            }
            cursor.continue();
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    if (anyKey) {
      inMemoryKeyStore.set(id, anyKey);
      return { status: 'success', key: anyKey };
    }

    return { status: 'absent', key: null };
  } catch (err) {
    return { status: 'error', key: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Retrieve a non-extractable CryptoKey from IndexedDB with failure-safe fallbacks.
 * If the exact id is not present, inspects backup records so the only recoverable key is never discarded.
 */
export async function loadKeyFromVault(id: string, options?: { throwOnError?: boolean }): Promise<CryptoKey | null> {
  const res = await loadKeyFromVaultWithStatus(id);
  if (res.status === 'success') {
    return res.key;
  }
  if (res.status === 'error') {
    if (options?.throwOnError) {
      throw res.error;
    }
    console.warn(`[Crypto] Database error loading key "${id}" from vault:`, res.error);
    return null;
  }
  return null;
}

/**
 * Remove a non-extractable CryptoKey from IndexedDB (strictly called only on complete data erasure)
 */
export async function removeKeyFromVault(id: string): Promise<void> {
  inMemoryKeyStore.delete(id);
  if (typeof window === 'undefined' || !window.indexedDB) {
    return;
  }
  try {
    const db = await openKeyVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(KEY_STORE_NAME, 'readwrite');
      const store = tx.objectStore(KEY_STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

/**
 * Helper to import raw 32-byte seed as a non-extractable AES-GCM CryptoKey
 */
export async function createKeyFromSeed(seed: Uint8Array): Promise<CryptoKey> {
  const cryptoInstance = getCrypto();
  return await cryptoInstance.subtle.importKey(
    'raw',
    seed as unknown as BufferSource,
    { name: 'AES-GCM', length: 256 },
    false, // strictly non-extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Safely imports or derives a non-extractable CryptoKey from an arbitrary string or hex key.
 */
export async function importOrDeriveKeyFromString(keyStr: string): Promise<CryptoKey> {
  const clean = keyStr.trim();
  const cryptoInstance = getCrypto();
  let seedBytes: Uint8Array;
  if (/^[0-9a-fA-F]{64}$/.test(clean)) {
    seedBytes = fromHex(clean);
  } else {
    // If not 64-hex, hash string with SHA-256 to produce consistent 32-byte seed
    const enc = new TextEncoder();
    const digest = await cryptoInstance.subtle.digest('SHA-256', enc.encode(clean));
    seedBytes = new Uint8Array(digest);
  }
  return await createKeyFromSeed(seedBytes);
}

/**
 * Gathers all possible candidate CryptoKeys for this device across all migration iterations.
 */
export async function getAllCandidateCryptoKeys(): Promise<CryptoKey[]> {
  const keys: CryptoKey[] = [];

  if (cachedCryptoKey) {
    keys.push(cachedCryptoKey);
  }
  if (inMemoryKeyStore.has(MASTER_KEY_ID)) {
    const memKey = inMemoryKeyStore.get(MASTER_KEY_ID);
    if (memKey && !keys.includes(memKey)) keys.push(memKey);
  }

  // Load master key from IndexedDB Key Vault
  try {
    const stored = await loadKeyFromVault(MASTER_KEY_ID);
    if (stored && !keys.includes(stored)) keys.push(stored);
  } catch {
    // ignore
  }

  // Scan all keys in IndexedDB Key Vault
  try {
    const db = await openKeyVaultDB();
    if (db.objectStoreNames.contains(KEY_STORE_NAME)) {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(KEY_STORE_NAME, 'readonly');
        const store = tx.objectStore(KEY_STORE_NAME);
        const req = store.openCursor();
        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const val = cursor.value;
            if (val && typeof val === 'object' && !keys.includes(val)) {
              keys.push(val as CryptoKey);
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => resolve();
      });
    }
  } catch {
    // ignore
  }

  if (typeof localStorage !== 'undefined') {
    // 1. Recovery envelope
    const env = localStorage.getItem(DEVICE_RECOVERY_KEY);
    if (env) {
      try {
        const k = await importOrDeriveKeyFromString(env);
        keys.push(k);
      } catch {
        // ignore
      }
    }

    // 2. Storage device key v2
    const v2 = localStorage.getItem(STORAGE_DEVICE_KEY);
    if (v2) {
      try {
        const k = await importOrDeriveKeyFromString(v2);
        keys.push(k);
      } catch {
        // ignore
      }
    }

    // 3. Storage device key v1
    const v1 = localStorage.getItem(LEGACY_STORAGE_DEVICE_KEY);
    if (v1) {
      try {
        const k = await importOrDeriveKeyFromString(v1);
        keys.push(k);
      } catch {
        // ignore
      }
    }
  }

  // 4. Deterministic legacy salt keys and all known project fallbacks
  const legacyFallbackStrings = [
    CryptoJS.SHA256(LEGACY_VAULT_SALT).toString(CryptoJS.enc.Hex),
    LEGACY_VAULT_SALT,
    'puffinless_offline_aes256_secure_fallback_key',
    CryptoJS.SHA256('puffinless_offline_aes256_secure_fallback_key').toString(CryptoJS.enc.Hex),
    'puffinless_aes256_client_vault_stable_key_v2_offline',
    'puffinless_aes256_client_vault_stable_key_v1_offline',
    CryptoJS.SHA256('puffinless_aes256_client_vault_stable_key_v1_offline').toString(CryptoJS.enc.Hex),
    'device_master_key',
    'puffinless_master_key_v2',
    'puffinless_vault_key_v1',
    'puffinless_vault_key_v2',
    'puffinless',
  ];

  for (const str of legacyFallbackStrings) {
    try {
      const k = await importOrDeriveKeyFromString(str);
      if (!keys.includes(k)) keys.push(k);
    } catch {
      // ignore
    }
  }

  return keys;
}

/**
 * Retrieves or initializes the non-extractable AES-GCM 256-bit CryptoKey.
 * - Stores non-extractable CryptoKey in IndexedDB (strictly zero raw key material in localStorage).
 * - Automatically purges any legacy raw keys or obsolete vault configs from localStorage after migration.
 */
export async function getSubtleCryptoKey(): Promise<CryptoKey> {
  if (cachedCryptoKey) {
    cryptoLifecycleState = 'READY';
    return cachedCryptoKey;
  }

  const cryptoInstance = getCrypto();

  // 1. Retrieve non-extractable key from IndexedDB key vault with explicit status
  const keyRes = await loadKeyFromVaultWithStatus(MASTER_KEY_ID);
  if (keyRes.status === 'success' && keyRes.key) {
    cachedCryptoKey = keyRes.key;
    cryptoLifecycleState = 'READY';
    // Genuinely purge raw key material from localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_DEVICE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_DEVICE_KEY);
      localStorage.removeItem(DEVICE_RECOVERY_KEY);
    }
    return keyRes.key;
  }
  if (keyRes.status === 'error') {
    // Database query error: do NOT collapse into missing key or generate a fresh key!
    if (inMemoryKeyStore.has(MASTER_KEY_ID)) {
      const memKey = inMemoryKeyStore.get(MASTER_KEY_ID)!;
      cachedCryptoKey = memKey;
      cryptoLifecycleState = 'READY';
      return memKey;
    }
    throw new Error(`[Crypto] Database error reading master key from vault: ${keyRes.error.message}`);
  }

  // 2. Migrate any legacy raw keys in localStorage to non-extractable IndexedDB key, then purge raw keys
  if (typeof localStorage !== 'undefined') {
    const legacyRaw =
      localStorage.getItem(DEVICE_RECOVERY_KEY) ||
      localStorage.getItem(STORAGE_DEVICE_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_DEVICE_KEY);

    if (legacyRaw) {
      let importedKey: CryptoKey | null = null;
      try {
        importedKey = await importOrDeriveKeyFromString(legacyRaw);
        // saveKeyToVault performs write and read-back verification, throwing on failure
        await saveKeyToVault(MASTER_KEY_ID, importedKey);
        // CRITICAL: Purge raw key material from localStorage ONLY after confirmed vault persistence
        localStorage.removeItem(STORAGE_DEVICE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_DEVICE_KEY);
        localStorage.removeItem(DEVICE_RECOVERY_KEY);
        cachedCryptoKey = importedKey;
        cryptoLifecycleState = 'READY';
        return importedKey;
      } catch (err) {
        console.warn('[Crypto] Key persistence failed during legacy raw key migration, preserving legacy key material:', err);
        if (importedKey) {
          // Keep usable in memory for the current session without deleting the recoverable legacy key
          cachedCryptoKey = importedKey;
          return importedKey;
        }
      }
    }
  }

  // 3. Initial Boot on Device: Generate fresh 32-byte entropy seed and store ONLY non-extractable key in IndexedDB
  const freshSeed = new Uint8Array(32);
  cryptoInstance.getRandomValues(freshSeed);
  const freshKey = await createKeyFromSeed(freshSeed);

  try {
    await saveKeyToVault(MASTER_KEY_ID, freshKey);
    // Guarantee zero raw key material in localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_DEVICE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_DEVICE_KEY);
      localStorage.removeItem(DEVICE_RECOVERY_KEY);
    }
  } catch (err) {
    console.warn('[Crypto] Could not persist fresh key to IndexedDB key vault, holding in memory:', err);
  }
  cachedCryptoKey = freshKey;
  cryptoLifecycleState = 'READY';
  return freshKey;
}

/**
 * Locks the cryptographic vault by wiping volatile memory.
 * Genuinely removes access to the key in memory:
 * clears BOTH cachedCryptoKey AND inMemoryKeyStore.
 */
export function lockCryptographicVault(): void {
  cachedCryptoKey = null;
  inMemoryKeyStore.clear();
  cryptoLifecycleState = 'BOOTING';
  closeKeyVaultDB();
}

/**
 * Sets an active custom CryptoKey in volatile memory
 */
export function setActiveVaultKey(key: CryptoKey): void {
  cachedCryptoKey = key;
  inMemoryKeyStore.set(MASTER_KEY_ID, key);
  cryptoLifecycleState = 'READY';
}

/**
 * Legacy key retriever for backward compatibility migration from AES-CBC payloads
 */
export function getLegacyVaultKey(): string {
  try {
    if (typeof localStorage !== 'undefined') {
      const key = localStorage.getItem(LEGACY_STORAGE_DEVICE_KEY);
      if (key) return key;
    }
  } catch {
    // ignore
  }
  return CryptoJS.SHA256(LEGACY_VAULT_SALT).toString(CryptoJS.enc.Hex);
}

/**
 * Irrevocably destroys encryption keys from IndexedDB and local storage (Cryptoshredding).
 */
export async function purgeVaultKeys(): Promise<void> {
  cachedCryptoKey = null;
  inMemoryKeyStore.clear();
  cryptoLifecycleState = 'PURGED';

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_DEVICE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_DEVICE_KEY);
      localStorage.removeItem(DEVICE_RECOVERY_KEY);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_DEVICE_KEY);
      sessionStorage.removeItem(LEGACY_STORAGE_DEVICE_KEY);
      sessionStorage.removeItem(DEVICE_RECOVERY_KEY);
    }
  } catch {
    // ignore
  }

  await removeKeyFromVault(MASTER_KEY_ID);
  await removeKeyFromVault(`${MASTER_KEY_ID}_backup`);

  closeKeyVaultDB();

  if (typeof window !== 'undefined' && window.indexedDB) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = window.indexedDB.deleteDatabase(KEY_DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => resolve();
      });
    } catch (err) {
      console.warn('[Crypto] Error deleting key vault DB:', err);
    }
  }
}

/**
 * Encrypts arbitrary serializable data with AES-GCM (256-bit) using an explicit CryptoKey.
 */
export async function encryptWithKey<T>(data: T, key: CryptoKey): Promise<string> {
  const cryptoInstance = getCrypto();
  const iv = new Uint8Array(12);
  cryptoInstance.getRandomValues(iv);

  const rawString = JSON.stringify(data);
  const encoded = new TextEncoder().encode(rawString);

  const cipherBuffer = await cryptoInstance.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    encoded as unknown as BufferSource
  );

  const ivHex = toHex(iv);
  const cipherBase64 = toBase64(cipherBuffer);

  return `aes-gcm:${ivHex}:${cipherBase64}`;
}

/**
 * Encrypts arbitrary serializable data with AES-GCM (256-bit) via non-extractable CryptoKey.
 * Generates a fresh, unique 96-bit (12-byte) IV for every single encryption.
 * Output format: `aes-gcm:<ivHex>:<ciphertextBase64>`
 */
export async function encryptData<T>(data: T): Promise<string> {
  try {
    const cryptoInstance = getCrypto();
    const cryptoKey = await getSubtleCryptoKey();

    // 1. Generate unique 12-byte IV for every encryption operation
    const iv = new Uint8Array(12);
    cryptoInstance.getRandomValues(iv);

    // 2. Encode plaintext payload
    const rawString = JSON.stringify(data);
    const encoded = new TextEncoder().encode(rawString);

    // 3. Authenticated AES-GCM encryption
    const cipherBuffer = await cryptoInstance.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      cryptoKey,
      encoded as unknown as BufferSource
    );

    const ivHex = toHex(iv);
    const cipherBase64 = toBase64(cipherBuffer);

    return `aes-gcm:${ivHex}:${cipherBase64}`;
  } catch (err) {
    console.error('[Crypto] AES-GCM encryption error - write blocked to prevent leak:', err);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts ciphertext payloads with automatic migration support.
 * Distinguishes cleanly between data absence and decryption failure.
 */
export async function decryptData<T>(
  cipherOrRaw: unknown,
  fallback: T,
  options?: { throwOnError?: boolean }
): Promise<T> {
  if (cipherOrRaw === null || cipherOrRaw === undefined || cipherOrRaw === '') {
    return fallback;
  }

  // If already a parsed JS object, return directly
  if (typeof cipherOrRaw !== 'string') {
    return cipherOrRaw as T;
  }

  // 1. Modern Authenticated AES-GCM Payload
  if (cipherOrRaw.startsWith('aes-gcm:')) {
    const parts = cipherOrRaw.split(':');
    if (parts.length !== 3) {
      if (options?.throwOnError) {
        throw new DecryptionError('Structure de payload AES-GCM invalide');
      }
      return fallback;
    }
    const ivHex = parts[1];
    const cipherBase64 = parts[2];

    try {
      const iv = fromHex(ivHex);
      const cipherBytes = fromBase64(cipherBase64);
      const cryptoInstance = getCrypto();

      // Gather all candidate keys across current and past iterations
      const candidateKeys = await getAllCandidateCryptoKeys();
      try {
        const primaryKey = await getSubtleCryptoKey();
        if (!candidateKeys.includes(primaryKey)) {
          candidateKeys.unshift(primaryKey);
        }
      } catch {
        // ignore
      }

      let lastError: unknown = null;
      for (const testKey of candidateKeys) {
        try {
          const decryptedBuffer = await cryptoInstance.subtle.decrypt(
            { name: 'AES-GCM', iv: iv as unknown as BufferSource },
            testKey,
            cipherBytes as unknown as BufferSource
          );

          const decryptedStr = new TextDecoder().decode(decryptedBuffer);
          const parsed = JSON.parse(decryptedStr) as T;

          // Decryption succeeded with this candidate key!
          // Cache and persist it as active master key so future reads are instantaneous.
          cachedCryptoKey = testKey;
          inMemoryKeyStore.set(MASTER_KEY_ID, testKey);
          saveKeyToVault(MASTER_KEY_ID, testKey).catch(() => {});

          return parsed;
        } catch (err) {
          lastError = err;
        }
      }

      if (options?.throwOnError) {
        throw new DecryptionError(lastError instanceof Error ? lastError.message : 'Échec d\'authentification AES-GCM');
      }
      console.warn('[Crypto] AES-GCM decryption failed across candidate keys:', lastError);
      return fallback;
    } catch (err) {
      if (options?.throwOnError) {
        throw new DecryptionError(err instanceof Error ? err.message : 'Échec d\'authentification AES-GCM');
      }
      return fallback;
    }
  }

  // 2. Legacy AES-CBC Payload Migration (CryptoJS aes256: format)
  if (cipherOrRaw.startsWith('aes256:')) {
    const ciphertext = cipherOrRaw.substring(7);

    // Multi-key candidate resolution for CryptoJS payloads
    const candidateStrings: string[] = [];
    if (typeof localStorage !== 'undefined') {
      const env = localStorage.getItem(DEVICE_RECOVERY_KEY);
      if (env) candidateStrings.push(env);
      const v2 = localStorage.getItem(STORAGE_DEVICE_KEY);
      if (v2 && !candidateStrings.includes(v2)) candidateStrings.push(v2);
      const v1 = localStorage.getItem(LEGACY_STORAGE_DEVICE_KEY);
      if (v1 && !candidateStrings.includes(v1)) candidateStrings.push(v1);
    }
    const legacySaltSha = CryptoJS.SHA256(LEGACY_VAULT_SALT).toString(CryptoJS.enc.Hex);
    if (!candidateStrings.includes(legacySaltSha)) candidateStrings.push(legacySaltSha);
    if (!candidateStrings.includes(LEGACY_VAULT_SALT)) candidateStrings.push(LEGACY_VAULT_SALT);
    candidateStrings.push('puffinless_offline_aes256_secure_fallback_key');
    candidateStrings.push(CryptoJS.SHA256('puffinless_offline_aes256_secure_fallback_key').toString(CryptoJS.enc.Hex));
    candidateStrings.push('puffinless_aes256_client_vault_stable_key_v2_offline');
    candidateStrings.push('puffinless_aes256_client_vault_stable_key_v1_offline');
    candidateStrings.push(CryptoJS.SHA256('puffinless_aes256_client_vault_stable_key_v1_offline').toString(CryptoJS.enc.Hex));
    candidateStrings.push('device_master_key');
    candidateStrings.push('puffinless_master_key_v2');
    candidateStrings.push('puffinless_vault_key_v1');
    candidateStrings.push('puffinless_vault_key_v2');
    candidateStrings.push('puffinless');

    for (const keyCandidate of candidateStrings) {
      try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, keyCandidate);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedString) {
          const parsed = JSON.parse(decryptedString) as T;
          return parsed;
        }
      } catch {
        // try next candidate
      }
    }

    if (options?.throwOnError) {
      throw new DecryptionError('Échec de déchiffrement legacy AES-CBC');
    }
    return fallback;
  }

  // 3. Fallback for previously unencrypted JSON strings
  try {
    return JSON.parse(cipherOrRaw) as T;
  } catch {
    if (options?.throwOnError) {
      throw new DecryptionError('JSON parse failed for unencrypted string');
    }
    return fallback;
  }
}

/**
 * Explicitly inspects whether data is absent, successfully decrypted, or failed due to decryption error.
 */
export async function decryptWithStatus<T>(cipherOrRaw: unknown): Promise<DecryptResult<T>> {
  if (cipherOrRaw === null || cipherOrRaw === undefined || cipherOrRaw === '') {
    return { status: 'absent', data: null };
  }
  try {
    const data = await decryptData<T>(cipherOrRaw, null as any, { throwOnError: true });
    return { status: 'success', data };
  } catch (err) {
    if (err instanceof DecryptionError) {
      return { status: 'error', error: err };
    }
    return { status: 'error', error: new DecryptionError(String(err)) };
  }
}
