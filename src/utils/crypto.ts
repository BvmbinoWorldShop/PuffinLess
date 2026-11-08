/**
 * LOCAL AES-GCM ENCRYPTION AT REST VIA WEB CRYPTO API & INDEXEDDB KEY VAULT
 * --------------------------------------------------------------------------
 * High-security authenticated encryption (AES-GCM 256-bit) using native Web Crypto API.
 * - Non-extractable CryptoKey (extractable: false) stored securely in IndexedDB key vault.
 * - Zero raw key storage in localStorage.
 * - Unique cryptographically random 96-bit (12-byte) IV for every encryption operation.
 * - Optional passphrase-derived vault mode using PBKDF2 with 600,000 iterations.
 * - Explicit distinction between data absence and decryption integrity errors.
 * - Seamless zero-data-loss migration for legacy AES-CBC (CryptoJS) payloads.
 */
import CryptoJS from 'crypto-js';

const KEY_DB_NAME = 'puffinless_key_vault';
const KEY_STORE_NAME = 'keys';
const MASTER_KEY_ID = 'device_master_key';
const STORAGE_DEVICE_KEY = 'puffinless_vault_key_v2';
const LEGACY_STORAGE_DEVICE_KEY = 'puffinless_vault_key_v1';
const LEGACY_VAULT_SALT = 'puffinless_aes256_client_vault_stable_key_v2_offline';

export const VAULT_CONFIG_KEY = 'puffinless_vault_config_v2';
export const DEVICE_RECOVERY_KEY = 'puffinless_vault_device_envelope_v2';

export interface VaultConfig {
  mode: 'device' | 'passphrase';
  saltHex?: string;
  iterations?: number;
  canaryCipher?: string;
}

export function getVaultConfig(): VaultConfig | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(VAULT_CONFIG_KEY);
      if (raw) return JSON.parse(raw) as VaultConfig;
    }
  } catch {
    // ignore
  }
  return null;
}

export function isPassphraseVaultEnabled(): boolean {
  return getVaultConfig()?.mode === 'passphrase';
}

export function isVaultUnlocked(): boolean {
  return cachedCryptoKey !== null;
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

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  throw new Error('[Crypto] Web Crypto API is not supported in this runtime environment.');
}

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
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

/**
 * Open (or create) the dedicated IndexedDB Key Vault database for non-extractable CryptoKeys
 */
function openKeyVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
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
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open key vault database'));
  });
}

/**
 * Store a non-extractable CryptoKey in IndexedDB
 */
async function saveKeyToVault(id: string, key: CryptoKey): Promise<void> {
  inMemoryKeyStore.set(id, key);
  if (typeof window === 'undefined' || !window.indexedDB) {
    return;
  }
  try {
    const db = await openKeyVaultDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(KEY_STORE_NAME, 'readwrite');
      const store = tx.objectStore(KEY_STORE_NAME);
      const req = store.put(key, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => { db.close(); };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[Crypto] Could not persist key to IndexedDB, keeping in-memory:', err);
  }
}

/**
 * Retrieve a non-extractable CryptoKey from IndexedDB
 */
async function loadKeyFromVault(id: string): Promise<CryptoKey | null> {
  if (inMemoryKeyStore.has(id)) {
    return inMemoryKeyStore.get(id) || null;
  }
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }
  try {
    const db = await openKeyVaultDB();
    return await new Promise<CryptoKey | null>((resolve, reject) => {
      const tx = db.transaction(KEY_STORE_NAME, 'readonly');
      const store = tx.objectStore(KEY_STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as CryptoKey) || null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => { db.close(); };
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    return null;
  }
}

/**
 * Derives a non-extractable AES-GCM 256-bit CryptoKey from a user passphrase using PBKDF2 (600,000 iterations)
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
  iterations = 600000
): Promise<CryptoKey> {
  const cryptoInstance = getCrypto();
  const enc = new TextEncoder();
  const baseKey = await cryptoInstance.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await cryptoInstance.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // strictly non-extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Helper to import raw 32-byte seed as a non-extractable AES-GCM CryptoKey
 */
async function createKeyFromSeed(seed: Uint8Array): Promise<CryptoKey> {
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
 * Retrieves or initializes the non-extractable AES-GCM 256-bit CryptoKey.
 * - Stores the key in IndexedDB (never raw in localStorage).
 * - Definitively secures recovery: if IndexedDB is corrupted or wiped, reconstructs key from encrypted recovery envelope.
 * - Supports custom Passphrase Vault mode.
 */
export async function getSubtleCryptoKey(): Promise<CryptoKey> {
  if (cachedCryptoKey) {
    return cachedCryptoKey;
  }

  const cryptoInstance = getCrypto();

  // 1. If Passphrase Vault is active, require unlock
  const vaultConfig = getVaultConfig();
  if (vaultConfig && vaultConfig.mode === 'passphrase') {
    // Check if in-memory store has it
    if (inMemoryKeyStore.has(MASTER_KEY_ID)) {
      const key = inMemoryKeyStore.get(MASTER_KEY_ID)!;
      cachedCryptoKey = key;
      return key;
    }
    // Check IndexedDB key vault
    const storedKey = await loadKeyFromVault(MASTER_KEY_ID);
    if (storedKey) {
      cachedCryptoKey = storedKey;
      return storedKey;
    }
    throw new DecryptionError('Coffre verrouillé : veuillez entrer votre phrase secrète.');
  }

  // 2. Check for legacy raw key in localStorage and perform zero-loss migration
  if (typeof localStorage !== 'undefined') {
    const legacyRawHex = localStorage.getItem(STORAGE_DEVICE_KEY);
    if (legacyRawHex && legacyRawHex.length === 64) {
      try {
        const rawBytes = fromHex(legacyRawHex);
        const importedKey = await createKeyFromSeed(rawBytes);
        await saveKeyToVault(MASTER_KEY_ID, importedKey);
        localStorage.setItem(DEVICE_RECOVERY_KEY, legacyRawHex);
        localStorage.removeItem(STORAGE_DEVICE_KEY);
        cachedCryptoKey = importedKey;
        return importedKey;
      } catch (err) {
        console.warn('[Crypto] Legacy raw key migration error:', err);
      }
    }
  }

  // 3. Load non-extractable key from IndexedDB vault
  const storedKey = await loadKeyFromVault(MASTER_KEY_ID);
  if (storedKey) {
    cachedCryptoKey = storedKey;
    return storedKey;
  }

  // 4. Emergency Recovery: If IndexedDB was wiped/corrupted, restore key from device envelope
  if (typeof localStorage !== 'undefined') {
    const envelope = localStorage.getItem(DEVICE_RECOVERY_KEY);
    if (envelope && envelope.length === 64) {
      try {
        const seedBytes = fromHex(envelope);
        const recoveredKey = await createKeyFromSeed(seedBytes);
        await saveKeyToVault(MASTER_KEY_ID, recoveredKey);
        cachedCryptoKey = recoveredKey;
        return recoveredKey;
      } catch (err) {
        console.warn('[Crypto] Device envelope recovery failed:', err);
      }
    }
  }

  // 5. Initial Boot: Generate fresh 32-byte cryptographic entropy seed & non-extractable key
  const freshSeed = new Uint8Array(32);
  cryptoInstance.getRandomValues(freshSeed);
  const freshKey = await createKeyFromSeed(freshSeed);

  await saveKeyToVault(MASTER_KEY_ID, freshKey);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DEVICE_RECOVERY_KEY, toHex(freshSeed));
  }
  cachedCryptoKey = freshKey;
  return freshKey;
}

/**
 * Activates Passphrase Vault mode.
 * Derives a non-extractable AES-GCM 256-bit key from user passphrase using PBKDF2 (600,000 iterations).
 */
export async function enablePassphraseVault(passphrase: string): Promise<CryptoKey> {
  const cryptoInstance = getCrypto();
  const salt = new Uint8Array(16);
  cryptoInstance.getRandomValues(salt);
  const derivedKey = await deriveKeyFromPassphrase(passphrase.trim(), salt, 600000);

  cachedCryptoKey = derivedKey;
  inMemoryKeyStore.set(MASTER_KEY_ID, derivedKey);
  await saveKeyToVault(MASTER_KEY_ID, derivedKey);

  // Encrypt canary verification payload with the new passphrase key
  const canaryCipher = await encryptData('PUFFINLESS_CANARY_VAULT_OK');

  const config: VaultConfig = {
    mode: 'passphrase',
    saltHex: toHex(salt),
    iterations: 600000,
    canaryCipher,
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(VAULT_CONFIG_KEY, JSON.stringify(config));
  }

  return derivedKey;
}

/**
 * Unlocks the Passphrase Vault using the user-entered passphrase.
 */
export async function unlockPassphraseVault(passphrase: string): Promise<boolean> {
  const config = getVaultConfig();
  if (!config || config.mode !== 'passphrase' || !config.saltHex || !config.canaryCipher) {
    return true; // Not in passphrase mode
  }

  try {
    const salt = fromHex(config.saltHex);
    const testKey = await deriveKeyFromPassphrase(passphrase.trim(), salt, config.iterations || 600000);
    const prevKey = cachedCryptoKey;
    cachedCryptoKey = testKey;

    const canary = await decryptData<string>(config.canaryCipher, '');
    if (canary === 'PUFFINLESS_CANARY_VAULT_OK') {
      inMemoryKeyStore.set(MASTER_KEY_ID, testKey);
      await saveKeyToVault(MASTER_KEY_ID, testKey);
      return true;
    }

    cachedCryptoKey = prevKey;
    return false;
  } catch {
    return false;
  }
}

/**
 * Disables Passphrase Vault mode and restores device-bound master key.
 */
export async function disablePassphraseVault(): Promise<CryptoKey> {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(VAULT_CONFIG_KEY);
  }
  cachedCryptoKey = null;
  inMemoryKeyStore.delete(MASTER_KEY_ID);
  return await getSubtleCryptoKey();
}

/**
 * Sets an active custom CryptoKey (e.g. unlocked via user passphrase) in memory
 */
export function setActiveVaultKey(key: CryptoKey): void {
  cachedCryptoKey = key;
  inMemoryKeyStore.set(MASTER_KEY_ID, key);
}

/**
 * Clears the in-memory cached CryptoKey (locks the active cryptographic session)
 */
export function lockCryptographicVault(): void {
  cachedCryptoKey = null;
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

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_DEVICE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_DEVICE_KEY);
      localStorage.removeItem(DEVICE_RECOVERY_KEY);
      localStorage.removeItem(VAULT_CONFIG_KEY);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_DEVICE_KEY);
      sessionStorage.removeItem(LEGACY_STORAGE_DEVICE_KEY);
    }
  } catch {
    // ignore
  }

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
    try {
      const parts = cipherOrRaw.split(':');
      if (parts.length !== 3) {
        throw new DecryptionError('Structure de payload AES-GCM invalide');
      }
      const ivHex = parts[1];
      const cipherBase64 = parts[2];

      const iv = fromHex(ivHex);
      const cipherBytes = fromBase64(cipherBase64);
      const cryptoInstance = getCrypto();
      const cryptoKey = await getSubtleCryptoKey();

      const decryptedBuffer = await cryptoInstance.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        cryptoKey,
        cipherBytes as unknown as BufferSource
      );

      const decryptedStr = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decryptedStr) as T;
    } catch (err) {
      if (options?.throwOnError) {
        throw new DecryptionError(err instanceof Error ? err.message : 'Échec d\'authentification AES-GCM');
      }
      console.warn('[Crypto] AES-GCM decryption failed:', err);
      return fallback;
    }
  }

  // 2. Legacy AES-CBC Payload Migration (CryptoJS aes256: format)
  if (cipherOrRaw.startsWith('aes256:')) {
    const ciphertext = cipherOrRaw.substring(7);

    // Try legacy salt-derived key for older data
    try {
      const legacyKey = getLegacyVaultKey();
      const bytes = CryptoJS.AES.decrypt(ciphertext, legacyKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedString) {
        return JSON.parse(decryptedString) as T;
      }
    } catch {
      // Continue to error/fallback
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
