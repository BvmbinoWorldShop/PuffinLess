// Security & App Lock utilities with local Salted SHA-256 PIN & Anti-Brute-Force Lockout
import CryptoJS from 'crypto-js';

export interface SecurityConfig {
  enabled: boolean;
  pinHash?: string;
  pinSalt?: string;
  pinLength?: number;
}

interface LockoutState {
  failedAttempts: number;
  lockoutUntil: number; // timestamp
}

const STORAGE_KEY = 'puffinless_security_config';
const LOCKOUT_KEY = 'puffinless_lockout_state';
const SESSION_UNLOCKED_KEY = 'puffinless_session_unlocked';
const MAX_FAILED_ATTEMPTS = 5;

/**
 * Calculates exponential anti-brute-force lockout duration:
 * - Attempts 1-4: 0s (warning countdown)
 * - Attempt 5: 30s
 * - Attempt 6: 60s (1 min)
 * - Attempt 7: 120s (2 min)
 * - Attempt 8: 300s (5 min)
 * - Attempt 9: 600s (10 min)
 * - Attempt 10+: 900s (15 min maximum backoff cap)
 */
export function calculateLockoutDurationMs(failedAttempts: number): number {
  if (failedAttempts < MAX_FAILED_ATTEMPTS) return 0;
  const exponent = failedAttempts - MAX_FAILED_ATTEMPTS;
  switch (exponent) {
    case 0:
      return 30000;
    case 1:
      return 60000;
    case 2:
      return 120000;
    case 3:
      return 300000;
    case 4:
      return 600000;
    default:
      return 900000;
  }
}

/**
 * Tracks session unlock state.
 * Stored strictly in sessionStorage:
 * - Survives standby / phone screen lock / sleep mode without harassing the user.
 * - Is wiped immediately when the application or browser is completely closed, demanding the PIN upon cold start.
 */
export function isAppSessionUnlocked(): boolean {
  if (!isSecurityEnabled()) return true;
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(SESSION_UNLOCKED_KEY) === 'true';
    }
  } catch {
    // ignore
  }
  return false;
}

export function setAppSessionUnlocked(unlocked: boolean): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      if (unlocked) {
        sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
      } else {
        sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
      }
    }
  } catch {
    // ignore
  }
}

function generateSalt(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // fallback to CryptoJS random WordArray
  }
  return CryptoJS.lib.WordArray.random(16).toString();
}

/**
 * Hashes a user PIN using PBKDF2 (100,000 iterations) with a cryptographic salt.
 * Replaces simple SHA-256 to provide strong resistance against offline brute-force and dictionary attacks.
 */
export function hashPin(pin: string, salt: string): string {
  const derived = CryptoJS.PBKDF2(pin.trim(), salt, {
    keySize: 256 / 32,
    iterations: 100000,
    hasher: CryptoJS.algo.SHA256,
  });
  return `pbkdf2:${derived.toString(CryptoJS.enc.Hex)}`;
}

/**
 * Verifies a PIN against stored hash, supporting both PBKDF2 and legacy SHA-256 hashes.
 */
export function verifyPinHash(enteredPin: string, storedHash: string, salt: string): boolean {
  if (storedHash.startsWith('pbkdf2:')) {
    const computed = hashPin(enteredPin, salt);
    return computed === storedHash;
  }
  // Backward compatibility: verify older SHA-256 hash
  const legacyHash = CryptoJS.SHA256(enteredPin.trim() + salt).toString(CryptoJS.enc.Hex);
  return legacyHash === storedHash;
}

function getLockoutState(): LockoutState {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        failedAttempts: Number(parsed.failedAttempts) || 0,
        lockoutUntil: Number(parsed.lockoutUntil) || 0,
      };
    }
  } catch {
    // ignore
  }
  return { failedAttempts: 0, lockoutUntil: 0 };
}

function saveLockoutState(state: LockoutState): void {
  try {
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function getRemainingLockoutSeconds(): number {
  const state = getLockoutState();
  const now = Date.now();
  if (state.lockoutUntil > now) {
    return Math.ceil((state.lockoutUntil - now) / 1000);
  }
  return 0;
}

export function getSecurityConfig(): SecurityConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Transparent migration: if legacy plaintext pin exists, migrate it to salted hash
      if (typeof parsed.pin === 'string' && parsed.pin.length > 0 && !parsed.pinHash) {
        const salt = generateSalt();
        const hash = hashPin(parsed.pin.trim(), salt);
        const migrated: SecurityConfig = {
          enabled: Boolean(parsed.enabled),
          pinHash: hash,
          pinSalt: salt,
          pinLength: parsed.pin.trim().length,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }

      return {
        enabled: Boolean(parsed.enabled),
        pinHash: parsed.pinHash || '',
        pinSalt: parsed.pinSalt || '',
        pinLength: typeof parsed.pinLength === 'number' ? parsed.pinLength : 4,
      };
    }
  } catch {
    // fallback
  }
  return {
    enabled: false,
    pinHash: '',
    pinSalt: '',
    pinLength: 4,
  };
}

export function saveSecurityConfig(enabled: boolean, newPlainPin?: string): void {
  try {
    const current = getSecurityConfig();
    let pinHash = current.pinHash || '';
    let pinSalt = current.pinSalt || '';
    let pinLength = current.pinLength || 4;

    if (newPlainPin && newPlainPin.trim().length > 0) {
      pinSalt = generateSalt();
      pinHash = hashPin(newPlainPin.trim(), pinSalt);
      pinLength = newPlainPin.trim().length;
    }

    const config: SecurityConfig = {
      enabled: enabled && pinHash.length > 0,
      pinHash,
      pinSalt,
      pinLength,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function isSecurityEnabled(): boolean {
  const cfg = getSecurityConfig();
  return Boolean(cfg.enabled && cfg.pinHash && cfg.pinHash.length > 0);
}

export interface VerifyPinResult {
  success: boolean;
  isLockedOut: boolean;
  remainingSeconds: number;
  remainingAttempts: number;
}

export function verifyPin(enteredPin: string): VerifyPinResult {
  const cfg = getSecurityConfig();
  if (!cfg.enabled || !cfg.pinHash || !cfg.pinSalt) {
    return { success: true, isLockedOut: false, remainingSeconds: 0, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const remainingLockout = getRemainingLockoutSeconds();
  if (remainingLockout > 0) {
    return { success: false, isLockedOut: true, remainingSeconds: remainingLockout, remainingAttempts: 0 };
  }

  const isMatch = verifyPinHash(enteredPin.trim(), cfg.pinHash, cfg.pinSalt);
  if (isMatch) {
    // If user was using legacy SHA-256 hash, automatically upgrade to PBKDF2
    if (!cfg.pinHash.startsWith('pbkdf2:')) {
      saveSecurityConfig(true, enteredPin.trim());
    }
    // Reset lockout counters on success
    saveLockoutState({ failedAttempts: 0, lockoutUntil: 0 });
    setAppSessionUnlocked(true);
    return { success: true, isLockedOut: false, remainingSeconds: 0, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  // Increment failed attempts with exponential backoff
  const state = getLockoutState();
  const nextFailed = state.failedAttempts + 1;
  const lockoutDurationMs = calculateLockoutDurationMs(nextFailed);
  const lockoutUntil = lockoutDurationMs > 0 ? Date.now() + lockoutDurationMs : 0;
  saveLockoutState({ failedAttempts: nextFailed, lockoutUntil });

  return {
    success: false,
    isLockedOut: lockoutUntil > Date.now(),
    remainingSeconds: lockoutUntil > Date.now() ? Math.ceil((lockoutUntil - Date.now()) / 1000) : 0,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - nextFailed),
  };
}

/**
 * Irrevocably purges PIN hash, salt, and brute-force lockout states.
 */
export function purgeSecurityState(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LOCKOUT_KEY);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(LOCKOUT_KEY);
      sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
    }
  } catch (err) {
    console.error('[Security] Failed to purge security state:', err);
  }
}
