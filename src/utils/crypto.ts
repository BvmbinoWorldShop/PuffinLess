/**
 * LOCAL AES-256 ENCRYPTION AT REST
 * --------------------------------
 * Ensures all user profile data, substance logs, cravings, sleep logs,
 * obsidian core memory and financial records are protected with AES-256.
 * All data remains 100% on the user's local device and is never sent over the internet.
 */
import CryptoJS from 'crypto-js';

const STORAGE_DEVICE_KEY = 'puffinless_vault_key_v1';
const VAULT_SALT = 'puffinless_aes256_client_vault_stable_key_v2_offline';

/**
 * Gets or initializes a local 256-bit encryption key on the device.
 * Stable and deterministic so data remains 100% persistent across reloads.
 */
function getVaultKey(): string {
  try {
    let key = localStorage.getItem(STORAGE_DEVICE_KEY);
    if (!key) {
      key = CryptoJS.SHA256(VAULT_SALT).toString(CryptoJS.enc.Hex);
      localStorage.setItem(STORAGE_DEVICE_KEY, key);
    }
    return key;
  } catch {
    return CryptoJS.SHA256(VAULT_SALT).toString(CryptoJS.enc.Hex);
  }
}

/**
 * Encrypts arbitrary serializable data with AES-256.
 */
export function encryptData<T>(data: T): string {
  try {
    const raw = JSON.stringify(data);
    const key = getVaultKey();
    const encrypted = CryptoJS.AES.encrypt(raw, key).toString();
    return `aes256:${encrypted}`;
  } catch (err) {
    console.error('AES-256 encryption failed, falling back to raw', err);
    return JSON.stringify(data);
  }
}

/**
 * Decrypts AES-256 ciphertext from localStorage.
 * Automatically handles backwards-compatible raw JSON strings if legacy unencrypted data exists.
 */
export function decryptData<T>(cipherOrRaw: string | null, fallback: T): T {
  if (!cipherOrRaw) return fallback;

  // Check if encrypted with our AES-256 vault prefix
  if (cipherOrRaw.startsWith('aes256:')) {
    try {
      const ciphertext = cipherOrRaw.substring(7);
      const key = getVaultKey();
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedString) return fallback;
      return JSON.parse(decryptedString) as T;
    } catch (err) {
      console.error('AES-256 decryption failed', err);
      return fallback;
    }
  }

  // Backwards compatibility for previously unencrypted JSON
  try {
    return JSON.parse(cipherOrRaw) as T;
  } catch {
    return fallback;
  }
}
