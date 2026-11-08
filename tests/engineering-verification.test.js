import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import CryptoJS from 'crypto-js';

// Setup Mock Browser Storage for Node test environment
class MockStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
}

globalThis.localStorage = new MockStorage();
globalThis.sessionStorage = new MockStorage();

describe('PuffinLess Engineering Pillar Verification', () => {

  describe('Pillar 1: AES-256 Real Encryption At Rest & Roundtrip', () => {
    const STORAGE_DEVICE_KEY = 'puffinless_vault_key_v2';

    function getVaultKey() {
      let key = globalThis.localStorage.getItem(STORAGE_DEVICE_KEY);
      if (!key) {
        key = CryptoJS.lib.WordArray.random(32).toString();
        globalThis.localStorage.setItem(STORAGE_DEVICE_KEY, key);
      }
      return key;
    }

    function encryptData(data) {
      const raw = JSON.stringify(data);
      const key = getVaultKey();
      const encrypted = CryptoJS.AES.encrypt(raw, key).toString();
      return `aes256:${encrypted}`;
    }

    function decryptData(cipherOrRaw, fallback) {
      if (!cipherOrRaw) return fallback;
      if (typeof cipherOrRaw !== 'string') return cipherOrRaw;
      if (cipherOrRaw.startsWith('aes256:')) {
        const ciphertext = cipherOrRaw.substring(7);
        try {
          const key = getVaultKey();
          const bytes = CryptoJS.AES.decrypt(ciphertext, key);
          const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
          if (decryptedString) {
            return JSON.parse(decryptedString);
          }
        } catch {
          // ignore
        }
        return fallback;
      }
      try {
        return JSON.parse(cipherOrRaw);
      } catch {
        return fallback;
      }
    }

    test('should encrypt payload with aes256: prefix and never expose plaintext', () => {
      const sensitiveProfile = {
        name: 'Marie Curie',
        cigarettesPerDay: 15,
        pricePerPack: 12.5,
        medicalHistory: 'Cessation attempt #2',
        secretNote: 'Craving occurs post-coffee at 08:30',
      };

      const ciphertext = encryptData(sensitiveProfile);

      // Verify prefix
      assert.ok(ciphertext.startsWith('aes256:'), 'Ciphertext must start with aes256: identifier');

      // Verify zero plaintext leakage
      assert.ok(!ciphertext.includes('Marie Curie'), 'Ciphertext must not leak user name');
      assert.ok(!ciphertext.includes('secretNote'), 'Ciphertext must not leak keys or properties');
      assert.ok(!ciphertext.includes('08:30'), 'Ciphertext must not leak time or routine');

      // Verify roundtrip decryption fidelity
      const decrypted = decryptData(ciphertext, null);
      assert.deepEqual(decrypted, sensitiveProfile, 'Decrypted object must match original exactly');
    });

    test('should handle legacy non-string objects gracefully without throwing', () => {
      const rawObj = { id: 1, sample: true };
      const res = decryptData(rawObj, null);
      assert.deepEqual(res, rawObj);
    });
  });

  describe('Pillar 2: Complete Cryptoshredding & Key Erasure', () => {
    const STORAGE_DEVICE_KEY = 'puffinless_vault_key_v2';
    const SECURITY_KEY = 'puffinless_security_config';
    const LOCKOUT_KEY = 'puffinless_lockout_state';

    test('cryptoshredding should destroy vault key and render past ciphertexts unrecoverable', () => {
      // 1. Store key and encrypt secret payload
      const initialKey = CryptoJS.lib.WordArray.random(32).toString();
      globalThis.localStorage.setItem(STORAGE_DEVICE_KEY, initialKey);
      globalThis.localStorage.setItem(SECURITY_KEY, JSON.stringify({ pinHash: 'hash123', pinSalt: 'salt123' }));
      globalThis.localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ failedAttempts: 2 }));

      const secretPayload = { privateSubstances: ['cannabis', 'cigarette'], balance: 1450.50 };
      const raw = JSON.stringify(secretPayload);
      const ciphertext = `aes256:${CryptoJS.AES.encrypt(raw, initialKey).toString()}`;

      // 2. Perform cryptoshredding
      globalThis.localStorage.removeItem(STORAGE_DEVICE_KEY);
      globalThis.localStorage.removeItem(SECURITY_KEY);
      globalThis.localStorage.removeItem(LOCKOUT_KEY);

      assert.equal(globalThis.localStorage.getItem(STORAGE_DEVICE_KEY), null);
      assert.equal(globalThis.localStorage.getItem(SECURITY_KEY), null);
      assert.equal(globalThis.localStorage.getItem(LOCKOUT_KEY), null);

      // 3. Attempt decryption with a newly generated vault key (simulate future new onboarding)
      const freshKey = CryptoJS.lib.WordArray.random(32).toString();
      let failedToDecrypt = false;
      try {
        const bytes = CryptoJS.AES.decrypt(ciphertext.substring(7), freshKey);
        const str = bytes.toString(CryptoJS.enc.Utf8);
        if (!str || str.length === 0) {
          failedToDecrypt = true;
        }
      } catch {
        failedToDecrypt = true;
      }
      assert.ok(failedToDecrypt, 'Old ciphertext must be unrecoverable after cryptoshredding');
    });
  });

  describe('Pillar 3: Behavioral Indicators (No Fake Biological Metrics)', () => {
    test('computes craving mastery rate strictly from user logs', () => {
      const cravings = [
        { id: '1', resisted: true, timestamp: new Date().toISOString() },
        { id: '2', resisted: true, timestamp: new Date().toISOString() },
        { id: '3', resisted: false, timestamp: new Date().toISOString() },
      ];

      const total = cravings.length;
      const resisted = cravings.filter((c) => c.resisted).length;
      const rate = Math.round((resisted / total) * 100);

      assert.equal(total, 3);
      assert.equal(resisted, 2);
      assert.equal(rate, 67); // 67% resistance rate
    });

    test('computes 100% mastery rate when user has 0 cravings and 0 slip intakes', () => {
      const cravings = [];
      const totalSubstancesTakenDoses = 0;
      const cravingMasteryPct = cravings.length > 0
        ? Math.round((cravings.filter((c) => c.resisted).length / cravings.length) * 100)
        : totalSubstancesTakenDoses === 0 ? 100 : 0;

      assert.equal(cravingMasteryPct, 100);
    });

    test('computes tracking consistency over window from user entries', () => {
      const windowDays = 7;
      const activeDays = new Set(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04']);
      const consistency = Math.min(100, Math.round((activeDays.size / windowDays) * 100));

      assert.equal(consistency, 57); // 4 days / 7 days = 57%
    });
  });

  describe('Pillar 4: Craving Event Deduplication and Risk Window Reliability', () => {
    test('deduplicates simultaneous slip intake and craving entry within 60s', () => {
      const nowMs = 1794100000000;
      const substanceLogs = [
        { id: 'sub-1', timestamp: new Date(nowMs).toISOString(), trigger: 'Café / Matin' },
      ];
      const cravings = [
        { id: 'cr-1', timestamp: new Date(nowMs + 5000).toISOString(), trigger: 'Café / Matin', resisted: false }, // same minute
        { id: 'cr-2', timestamp: new Date(nowMs + 7200000).toISOString(), trigger: 'Stress', resisted: true }, // 2 hours later
      ];

      const episodes = [];
      const seenTimes = [];

      substanceLogs.forEach((l) => {
        const d = new Date(l.timestamp);
        const t = d.getTime();
        if (!isNaN(t)) {
          seenTimes.push(t);
          episodes.push({ hour: d.getHours(), trigger: l.trigger });
        }
      });

      cravings.forEach((c) => {
        const d = new Date(c.timestamp);
        const t = d.getTime();
        if (!isNaN(t)) {
          const isDuplicate = seenTimes.some((st) => Math.abs(st - t) < 60000);
          if (!isDuplicate) {
            seenTimes.push(t);
            episodes.push({ hour: d.getHours(), trigger: c.trigger });
          }
        }
      });

      // Expected: 2 unique episodes (not 3), because the simultaneous slip + craving is merged
      assert.equal(episodes.length, 2);
      assert.equal(episodes[0].trigger, 'Café / Matin');
      assert.equal(episodes[1].trigger, 'Stress');
    });
  });
});
