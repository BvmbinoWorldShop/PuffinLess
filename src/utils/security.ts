// Security & App Lock utilities with local PIN and WebAuthn Face ID / Touch ID support

export interface SecurityConfig {
  enabled: boolean;
  pin: string; // stored locally
  biometricEnabled: boolean;
}

const STORAGE_KEY = 'puffinless_security_config';

export function getSecurityConfig(): SecurityConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    enabled: false,
    pin: '',
    biometricEnabled: false,
  };
}

export function saveSecurityConfig(config: SecurityConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function isSecurityEnabled(): boolean {
  const cfg = getSecurityConfig();
  return Boolean(cfg.enabled && cfg.pin.trim().length > 0);
}

export function verifyPin(enteredPin: string): boolean {
  const cfg = getSecurityConfig();
  if (!cfg.enabled || !cfg.pin) return true;
  return cfg.pin.trim() === enteredPin.trim();
}

/** Check if device supports platform biometrics (Face ID, Touch ID, Windows Hello) */
export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return Boolean(available);
    }
  } catch {
    return false;
  }
  return false;
}

/** Register / Test biometric access via WebAuthn platform authenticator (Face ID / Fingerprint) */
export async function registerBiometrics(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'PuffinLess',
        },
        user: {
          id: userId,
          name: 'puffinless_user',
          displayName: 'PuffinLess Champion',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    });

    return Boolean(credential);
  } catch (err) {
    console.warn('Biometric registration error or cancelled:', err);
    return false;
  }
}

/** Verify user identity via Face ID / Touch ID / Platform Authenticator */
export async function authenticateWithBiometrics(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
      },
    });

    return Boolean(assertion);
  } catch (err) {
    console.warn('Biometric authentication cancelled or failed:', err);
    return false;
  }
}
