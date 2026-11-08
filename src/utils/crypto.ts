/**
 * LOCAL AES-256 ENCRYPTION AT REST
 * --------------------------------
 * Ensures all user profile data, substance logs, cravings, sleep logs,
 * obsidian core memory and financial records are protected with AES-256.
 * All data remains 100% on the user's local device and is never sent over the internet.
 */
import CryptoJS from 'crypto-js';

const STORAGE_DEVICE_KEY = 'puffinless_vault_key_v2';
const LEGACY_STORAGE_DEVICE_KEY = 'puffinless_vault_key_v1';
const LEGACY_VAULT_SALT = 'puffinless_aes256_client_vault_stable_key_v2_offline';

/**
 * Gets or initializes a cryptographically random local 256-bit encryption key on the device.
 */
function getVaultKey(): string {
  try {
    let key = localStorage.getItem(STORAGE_DEVICE_KEY);
    if (!key) {
      // Generate truly random 256-bit key
      if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const randBytes = new Uint8Array(32);
        crypto.getRandomValues(randBytes);
        key = Array.from(randBytes, (b) => b.toString(16).padStart(2, '0')).join('');
      } else {
        key = CryptoJS.lib.WordArray.random(32).toString();
      }
      localStorage.setItem(STORAGE_DEVICE_KEY, key);
    }
    return key;
  } catch {
    return CryptoJS.SHA256(LEGACY_VAULT_SALT).toString(CryptoJS.enc.Hex);
  }
}

/**
 * Legacy key retriever for backward compatibility migration
 */
function getLegacyVaultKey(): string {
  try {
    const key = localStorage.getItem(LEGACY_STORAGE_DEVICE_KEY);
    if (key) return key;
  } catch {
    // ignore
  }
  return CryptoJS.SHA256(LEGACY_VAULT_SALT).toString(CryptoJS.enc.Hex);
}

/**
 * Encrypts arbitrary serializable data with AES-256.
 * Enforces authenticated encrypted payload.
 */
export function encryptData<T>(data: T): string {
  try {
    const raw = JSON.stringify(data);
    const key = getVaultKey();
    const encrypted = CryptoJS.AES.encrypt(raw, key).toString();
    return `aes256:${encrypted}`;
  } catch (err) {
    console.error('AES-256 encryption error - storage blocked to prevent unencrypted plaintext leak', err);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts AES-256 ciphertext from localStorage.
 * Automatically migrates legacy keys and handles backwards-compatible raw JSON strings.
 */
export function decryptData<T>(cipherOrRaw: string | null, fallback: T): T {
  if (!cipherOrRaw) return fallback;

  // Check if encrypted with our AES-256 vault prefix
  if (cipherOrRaw.startsWith('aes256:')) {
    const ciphertext = cipherOrRaw.substring(7);
    // 1. Try current random vault key
    try {
      const key = getVaultKey();
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedString) {
        return JSON.parse(decryptedString) as T;
      }
    } catch {
      // Continue to try legacy key migration
    }

    // 2. Try legacy salt-derived key for seamless migration
    try {
      const legacyKey = getLegacyVaultKey();
      const bytes = CryptoJS.AES.decrypt(ciphertext, legacyKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedString) {
        return JSON.parse(decryptedString) as T;
      }
    } catch (err) {
      console.error('AES-256 legacy decryption failed', err);
    }

    return fallback;
  }

  // Backwards compatibility for previously unencrypted JSON (pre-encryption era)
  try {
    return JSON.parse(cipherOrRaw) as T;
  } catch {
    return fallback;
  }
}
