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
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000; // 30 seconds lockout

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

export function hashPin(pin: string, salt: string): string {
  return CryptoJS.SHA256(pin + salt).toString(CryptoJS.enc.Hex);
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

  const computedHash = hashPin(enteredPin.trim(), cfg.pinSalt);
  if (computedHash === cfg.pinHash) {
    // Reset lockout counters on success
    saveLockoutState({ failedAttempts: 0, lockoutUntil: 0 });
    return { success: true, isLockedOut: false, remainingSeconds: 0, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  // Increment failed attempts
  const state = getLockoutState();
  const nextFailed = state.failedAttempts + 1;
  let lockoutUntil = 0;
  if (nextFailed >= MAX_FAILED_ATTEMPTS) {
    lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  saveLockoutState({ failedAttempts: nextFailed, lockoutUntil });

  return {
    success: false,
    isLockedOut: lockoutUntil > Date.now(),
    remainingSeconds: lockoutUntil > Date.now() ? Math.ceil(LOCKOUT_DURATION_MS / 1000) : 0,
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
    }
  } catch (err) {
    console.error('[Security] Failed to purge security state:', err);
  }
}
