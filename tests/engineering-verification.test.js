import { test, describe, beforeEach } from 'node:test';
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

// DIRECT IMPORTS FROM REAL APPLICATION CODE
import {
  encryptData,
  decryptData,
  getVaultKeyHex,
  purgeVaultKeys,
} from '../src/utils/crypto.ts';
import { resetAllUserData } from '../src/utils/storage.ts';
import { purgeSecurityState, getSecurityConfig, saveSecurityConfig } from '../src/utils/security.ts';
import { calculateClinicalPeriodMetrics } from '../src/utils/clinicalMetrics.ts';

describe('PuffinLess Production Code Verification', () => {

  beforeEach(() => {
    globalThis.localStorage.clear();
    globalThis.sessionStorage.clear();
    purgeVaultKeys();
  });

  describe('Pillar 1: AES-GCM via Web Crypto API with Unique IVs & Explicit Keys', () => {
    test('encryptData uses Web Crypto AES-GCM with aes-gcm: prefix and unique 96-bit IV per call', async () => {
      const sensitiveData = {
        name: 'Marie Curie',
        cigarettesPerDay: 15,
        secretTrigger: 'Café matinal',
      };

      const cipher1 = await encryptData(sensitiveData);
      const cipher2 = await encryptData(sensitiveData);

      // Verify prefix
      assert.ok(cipher1.startsWith('aes-gcm:'), 'Ciphertext must start with aes-gcm: identifier');
      assert.ok(cipher2.startsWith('aes-gcm:'), 'Second ciphertext must also start with aes-gcm:');

      // Verify unique IV per encryption: same data encrypted twice MUST yield different ciphertexts and different IVs
      assert.notEqual(cipher1, cipher2, 'Each encryption MUST produce a distinct ciphertext due to unique IV');

      const parts1 = cipher1.split(':');
      const parts2 = cipher2.split(':');
      assert.equal(parts1.length, 3, 'Payload format must be aes-gcm:<ivHex>:<ciphertextBase64>');
      assert.equal(parts1[1].length, 24, 'IV must be 12 bytes = 24 hex characters');
      assert.notEqual(parts1[1], parts2[1], 'Consecutive encryptions must have different random IVs');

      // Verify zero plaintext leakage
      assert.ok(!cipher1.includes('Marie Curie'), 'Ciphertext must not leak user name');
      assert.ok(!cipher1.includes('Café matinal'), 'Ciphertext must not leak secret triggers');

      // Verify decryption fidelity with real code
      const decrypted = await decryptData(cipher1, null);
      assert.deepEqual(decrypted, sensitiveData, 'Decrypted object must match original payload exactly');
    });

    test('seamlessly migrates legacy AES-CBC (CryptoJS aes256:) payloads without data loss', async () => {
      const legacyPayload = {
        legacyId: 42,
        substance: 'puff_vape',
        quitDate: '2026-01-01T00:00:00.000Z',
      };

      // Create a legacy AES-CBC payload encrypted with the device vault key
      const keyHex = getVaultKeyHex();
      const rawString = JSON.stringify(legacyPayload);
      const legacyEncrypted = CryptoJS.AES.encrypt(rawString, keyHex).toString();
      const legacyCiphertext = `aes256:${legacyEncrypted}`;

      // Decrypt using the real production decryptData function
      const migratedData = await decryptData(legacyCiphertext, null);
      assert.deepEqual(migratedData, legacyPayload, 'Legacy AES-CBC ciphertext must be decrypted seamlessly');
    });

    test('gracefully handles non-string objects and raw fallback', async () => {
      const rawObj = { id: 'pre-encryption-object', active: true };
      const result = await decryptData(rawObj, null);
      assert.deepEqual(result, rawObj);

      const fallbackResult = await decryptData(null, { default: true });
      assert.deepEqual(fallbackResult, { default: true });
    });
  });

  describe('Pillar 2: Complete Data Erasure & Cryptoshredding (resetAllUserData)', () => {
    test('resetAllUserData clears storage, purges vault key, and renders past ciphertexts unrecoverable', async () => {
      // 1. Populate data and encrypt payload
      const sensitive = { bankBalance: 5400, secretCravings: ['cannabis'] };
      const ciphertext = await encryptData(sensitive);
      saveSecurityConfig(true, '1234');

      assert.ok(globalThis.localStorage.length > 0, 'Storage must contain entries before purge');
      assert.ok(getSecurityConfig().enabled, 'Security PIN must be active before purge');

      // 2. Perform complete erasure via real production function
      await resetAllUserData();
      purgeSecurityState();

      // 3. Verify total erasure of storage and keys
      assert.equal(globalThis.localStorage.length, 0, 'localStorage must be completely wiped (0 keys)');
      assert.equal(globalThis.sessionStorage.length, 0, 'sessionStorage must be completely wiped (0 keys)');

      // 4. Verify cryptoshredding: attempt decryption with a freshly generated key (simulating future user)
      const freshKey = CryptoJS.lib.WordArray.random(32).toString();
      globalThis.localStorage.setItem('puffinless_vault_key_v2', freshKey);

      const recoveryAttempt = await decryptData(ciphertext, null);
      assert.equal(recoveryAttempt, null, 'Old ciphertext must be cryptographically unrecoverable after purge');
    });
  });

  describe('Pillar 3: Period-Scoped Statistics (Direct Production Component Execution)', () => {
    test('calculates period-scoped cravings strictly within time cutoff via production function', () => {
      const nowMs = 1794110000000;

      const allCravings = [
        { id: 'c1', timestamp: new Date(nowMs - 3600000).toISOString(), resisted: true }, // 1h ago (inside period)
        { id: 'c2', timestamp: new Date(nowMs - 7200000).toISOString(), resisted: true }, // 2h ago (inside period)
        { id: 'c3', timestamp: new Date(nowMs - 86400000 * 5).toISOString(), resisted: false }, // 5 days ago (OUTSIDE period)
        { id: 'c4', timestamp: new Date(nowMs - 86400000 * 10).toISOString(), resisted: false }, // 10 days ago (OUTSIDE period)
      ];

      const metrics = calculateClinicalPeriodMetrics({
        timeRange: 'day',
        now: nowMs,
        cravings: allCravings,
        substanceLogs: [],
      });

      assert.equal(metrics.filteredCravings.length, 2, 'Only 2 cravings occurred in the last 24h');
      assert.equal(metrics.totalCravingsCount, 2);
      assert.equal(metrics.resistedCravingsCount, 2);
      assert.equal(metrics.cravingMasteryPct, 100, 'Period mastery must be strictly 100% without lifetime contamination');
    });

    test('when period has 0 cravings, reports 0 cravings without falling back to lifetime entries', () => {
      const nowMs = 1794110000000;

      const allCravings = [
        { id: 'cOld', timestamp: new Date(nowMs - 86400000 * 8).toISOString(), resisted: false },
      ];

      const metrics = calculateClinicalPeriodMetrics({
        timeRange: 'day',
        now: nowMs,
        cravings: allCravings,
        substanceLogs: [],
      });

      assert.equal(metrics.filteredCravings.length, 0);
      assert.equal(metrics.totalCravingsCount, 0, 'Must report 0 cravings logged in this period');
      assert.equal(metrics.resistedCravingsCount, 0);
      assert.equal(metrics.cravingMasteryPct, 100, 'Clean period without cravings must show 100% mastery');
    });

    test('computes period-scoped avoided doses and money saved strictly for window days', () => {
      const nowMs = 1794110000000;
      const metrics = calculateClinicalPeriodMetrics({
        timeRange: 'week',
        now: nowMs,
        profile: {
          cigarettesPerDay: 20,
          cigarettesInPack: 20,
          pricePerPack: 12,
        },
        substanceLogs: [
          { id: 's1', substance: 'cigarette', count: 5, timestamp: new Date(nowMs - 3600000).toISOString() },
        ],
        expenses: [
          { id: 'e1', itemType: 'accessories', title: 'Gum', price: 10, quantity: 1, timestamp: new Date(nowMs - 3600000).toISOString() },
        ],
      });

      assert.equal(metrics.periodDosesAvoided, 135, 'Period doses avoided must be 140 - 5 = 135');
      assert.equal(metrics.periodMoneySaved, 74, 'Period money saved must be 84 - 10 = $74 (not lifetime thousands)');
    });
  });
});
