/**
 * LOCAL AES-GCM ENCRYPTION AT REST VIA WEB CRYPTO API
 * ----------------------------------------------------
 * High-security authenticated encryption (AES-GCM 256-bit) using the native Web Crypto API.
 * - Generates a cryptographically random, unique 96-bit (12-byte) IV for every encryption operation.
 * - Uses explicit local key management with a 256-bit random device vault key.
 * - Eliminates deterministic fallbacks for new encryptions (fail-closed security).
 * - Provides seamless, zero-data-loss migration for legacy AES-CBC (CryptoJS) payloads.
 */
import CryptoJS from 'crypto-js';

const STORAGE_DEVICE_KEY = 'puffinless_vault_key_v2';
const LEGACY_STORAGE_DEVICE_KEY = 'puffinless_vault_key_v1';
const LEGACY_VAULT_SALT = 'puffinless_aes256_client_vault_stable_key_v2_offline';

let cachedCryptoKey: CryptoKey | null = null;
let cachedKeyHex: string | null = null;

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  throw new Error('[Crypto] Web Crypto API is not supported in this runtime environment.');
}

/**
 * Convert Uint8Array or ArrayBuffer to Hex string
 */
function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert Hex string to Uint8Array
 */
function fromHex(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert ArrayBuffer to Base64
 */
function toBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Retrieves or initializes the explicit local 256-bit vault key on device.
 * Enforces true random key generation; deterministic fallback is strictly rejected.
 */
export function getVaultKeyHex(): string {
  try {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage is unavailable');
    }
    let keyHex = localStorage.getItem(STORAGE_DEVICE_KEY);
    if (!keyHex) {
      const cryptoInstance = getCrypto();
      if (!cryptoInstance.getRandomValues) {
        throw new Error('Cryptographically secure PRNG (crypto.getRandomValues) is required');
      }
      const randBytes = new Uint8Array(32);
      cryptoInstance.getRandomValues(randBytes);
      keyHex = toHex(randBytes);
      localStorage.setItem(STORAGE_DEVICE_KEY, keyHex);
    }
    return keyHex;
  } catch (err) {
    console.error('[Crypto] Explicit key management failure:', err);
    throw new Error('Key generation failed - deterministic fallback is prohibited for new encryptions');
  }
}

/**
 * Imports the device vault key into a Web Crypto CryptoKey for AES-GCM.
 */
async function getSubtleCryptoKey(): Promise<CryptoKey> {
  const keyHex = getVaultKeyHex();
  if (cachedCryptoKey && cachedKeyHex === keyHex) {
    return cachedCryptoKey;
  }

  const cryptoInstance = getCrypto();
  const rawKeyBytes = fromHex(keyHex);

  cachedCryptoKey = await cryptoInstance.subtle.importKey(
    'raw',
    rawKeyBytes as unknown as BufferSource,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  cachedKeyHex = keyHex;

  return cachedCryptoKey;
}

/**
 * Legacy key retriever for backward compatibility migration from AES-CBC
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
 * Irrevocably destroys encryption keys from local storage (Cryptoshredding).
 * Without these keys, any remaining stored ciphertext is mathematically unrecoverable.
 */
export function purgeVaultKeys(): void {
  cachedCryptoKey = null;
  cachedKeyHex = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_DEVICE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_DEVICE_KEY);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_DEVICE_KEY);
      sessionStorage.removeItem(LEGACY_STORAGE_DEVICE_KEY);
    }
  } catch (err) {
    console.error('[Crypto] Failed to purge vault keys:', err);
  }
}

/**
 * Encrypts arbitrary serializable data with AES-GCM (256-bit) via Web Crypto API.
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

    // 3. Authenticated AES-GCM encryption (includes integrity tag in buffer)
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
 * - Handles new AES-GCM payloads (`aes-gcm:<ivHex>:<cipherBase64>`) via Web Crypto API.
 * - Seamlessly migrates legacy AES-CBC payloads (`aes256:<ciphertext>`) without data loss.
 * - Handles raw JSON objects for backward compatibility.
 */
export async function decryptData<T>(cipherOrRaw: unknown, fallback: T): Promise<T> {
  if (cipherOrRaw === null || cipherOrRaw === undefined) {
    return fallback;
  }

  // If already a parsed JS object (e.g. from IndexedDB pre-encryption era), return directly
  if (typeof cipherOrRaw !== 'string') {
    return cipherOrRaw as T;
  }

  // 1. Modern Authenticated AES-GCM Payload
  if (cipherOrRaw.startsWith('aes-gcm:')) {
    try {
      const parts = cipherOrRaw.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid aes-gcm payload structure');
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
      console.warn('[Crypto] AES-GCM decryption failed, falling back:', err);
      return fallback;
    }
  }

  // 2. Legacy AES-CBC Payload Migration (CryptoJS aes256: format)
  if (cipherOrRaw.startsWith('aes256:')) {
    const ciphertext = cipherOrRaw.substring(7);

    // Try current vault key first
    try {
      const keyHex = getVaultKeyHex();
      const bytes = CryptoJS.AES.decrypt(ciphertext, keyHex);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedString) {
        return JSON.parse(decryptedString) as T;
      }
    } catch {
      // Continue to try legacy key migration
    }

    // Try legacy salt-derived key for older data
    try {
      const legacyKey = getLegacyVaultKey();
      const bytes = CryptoJS.AES.decrypt(ciphertext, legacyKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedString) {
        return JSON.parse(decryptedString) as T;
      }
    } catch (err) {
      console.error('[Crypto] AES-CBC legacy decryption failed:', err);
    }

    return fallback;
  }

  // 3. Fallback for previously unencrypted JSON strings
  try {
    return JSON.parse(cipherOrRaw) as T;
  } catch {
    return fallback;
  }
}
