// Security & App Lock utilities with local PIN / Password protection

export interface SecurityConfig {
  enabled: boolean;
  pin: string; // stored locally
}

const STORAGE_KEY = 'puffinless_security_config';

export function getSecurityConfig(): SecurityConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: Boolean(parsed.enabled),
        pin: typeof parsed.pin === 'string' ? parsed.pin : '',
      };
    }
  } catch {
    // fallback
  }
  return {
    enabled: false,
    pin: '',
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
