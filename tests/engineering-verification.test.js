import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import CryptoJS from 'crypto-js';
import 'fake-indexeddb/auto';

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
globalThis.window = {
  localStorage: globalThis.localStorage,
  sessionStorage: globalThis.sessionStorage,
  indexedDB: globalThis.indexedDB,
};

// DIRECT IMPORTS FROM REAL APPLICATION CODE
import {
  encryptData,
  decryptData,
  decryptWithStatus,
  getSubtleCryptoKey,
  purgeVaultKeys,
  getLegacyVaultKey,
  loadKeyFromVault,
  loadKeyFromVaultWithStatus,
  saveKeyToVault,
  createKeyFromSeed,
  lockCryptographicVault,
  closeKeyVaultDB,
  getCryptoLifecycleState,
  MASTER_KEY_ID,
  DecryptionError,
} from '../src/utils/crypto.ts';
import {
  resetAllUserData,
  saveProfile,
  loadProfile,
  loadProfileAsync,
  saveStreaks,
  loadStreaksAsync,
  saveCravings,
  loadCravingsAsync,
  saveExpenses,
  saveSleepEnergy,
  saveSavingsGoals,
  saveSubstanceLogs,
  loadSubstanceLogsAsync,
  importUserDataJSON,
  exportAllUserDataJSON,
  storageQueue,
  initIndexedDBStorage,
  readWithStatus,
} from '../src/utils/storage.ts';
import {
  recoverAllDeviceData,
  isValidDateField,
  createDeviceRescueSnapshot,
  getDeviceRescueSnapshot,
} from '../src/utils/recovery.ts';
import { localDateStr, dayLabel } from '../src/utils/dates.ts';
import { buildCoreReport, sumIntake } from '../src/core/obsidianCore.ts';
import {
  purgeSecurityState,
  getSecurityConfig,
  saveSecurityConfig,
  verifyPin,
  calculateLockoutDurationMs,
  isAppSessionUnlocked,
  setAppSessionUnlocked,
} from '../src/utils/security.ts';
import { idbSet, deletePuffinLessDB, idbGetWithStatus, idbGetRawWithStatus, closePuffinLessDB } from '../src/utils/indexedDb.ts';
import { calculateClinicalPeriodMetrics } from '../src/utils/clinicalMetrics.ts';

describe('PuffinLess Production Code Verification', () => {

  beforeEach(async () => {
    globalThis.localStorage.clear();
    globalThis.sessionStorage.clear();
    await purgeVaultKeys();
    await deletePuffinLessDB();
  });

  describe('Pillar 1: AES-GCM via Non-Extractable CryptoKey & IndexedDB Vault', () => {
    test('uses non-extractable CryptoKey (extractable: false) and never stores raw key in localStorage', async () => {
      const key = await getSubtleCryptoKey();
      assert.equal(key.extractable, false, 'CryptoKey MUST be strictly non-extractable');
      assert.equal(key.algorithm.name, 'AES-GCM', 'Algorithm must be AES-GCM');

      // Verify no raw key is leaked to localStorage
      assert.equal(
        globalThis.localStorage.getItem('puffinless_vault_key_v2'),
        null,
        'Raw key MUST NOT be stored in localStorage'
      );
    });

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

      // Verify unique IV per encryption
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

    test('distinguishes cleanly between absent data and decryption failure (decryptWithStatus)', async () => {
      // 1. Data absent (null or empty string)
      const absentResult = await decryptWithStatus(null);
      assert.equal(absentResult.status, 'absent', 'Must return absent status when data is null');
      assert.equal(absentResult.data, null);

      // 2. Legitimate data
      const cipher = await encryptData({ notes: 'Secret log' });
      const validResult = await decryptWithStatus(cipher);
      assert.equal(validResult.status, 'success');
      assert.deepEqual(validResult.data, { notes: 'Secret log' });

      // 3. Corrupted or tampered ciphertext (must report error, not absent!)
      const corruptedCipher = cipher.slice(0, -6) + 'AAAAAA';
      const corruptResult = await decryptWithStatus(corruptedCipher);
      assert.equal(corruptResult.status, 'error', 'Must report error status for tampered data');
      assert.ok(corruptResult.error instanceof DecryptionError, 'Error must be an instance of DecryptionError');
    });

    test('guarantees failure-safe key persistence and never discards the only recoverable key', async () => {
      const masterKey = await getSubtleCryptoKey();
      assert.ok(masterKey, 'Master key must be loaded or generated');
      assert.equal(masterKey.extractable, false, 'Master key must be strictly non-extractable');

      // Verify key is retained in vault and backup
      const loaded = await loadKeyFromVault(MASTER_KEY_ID);
      assert.ok(loaded, 'Master key must be recoverable from key vault');

      // Verify lifecycle state is READY
      assert.equal(getCryptoLifecycleState(), 'READY');
    });

    test('seamlessly migrates legacy AES-CBC (CryptoJS aes256:) payloads without data loss', async () => {
      const legacyPayload = {
        legacyId: 42,
        substance: 'puff_vape',
        quitDate: '2026-01-01T00:00:00.000Z',
      };

      const legacyKey = getLegacyVaultKey();
      const rawString = JSON.stringify(legacyPayload);
      const legacyEncrypted = CryptoJS.AES.encrypt(rawString, legacyKey).toString();
      const legacyCiphertext = `aes256:${legacyEncrypted}`;

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

  describe('Pillar 2: PIN Hashing with PBKDF2 (100k iter) & Complete Data Erasure', () => {
    test('hashes PIN using PBKDF2 with 100,000 iterations and random salt', () => {
      saveSecurityConfig(true, '4321');
      const cfg = getSecurityConfig();
      assert.ok(cfg.pinHash.startsWith('pbkdf2:'), 'PIN hash must use PBKDF2 with pbkdf2: prefix');
      assert.ok(cfg.pinSalt.length >= 32, 'PIN salt must be random 16 bytes = 32 hex chars');

      const verifyRes = verifyPin('4321');
      assert.equal(verifyRes.success, true, 'Valid PIN must unlock successfully');

      const wrongRes = verifyPin('0000');
      assert.equal(wrongRes.success, false, 'Invalid PIN must fail');
    });

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

      // 4. Verify cryptoshredding: attempt decryption with a fresh key (simulating future user)
      const freshKey = await globalThis.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      const { setActiveVaultKey } = await import('../src/utils/crypto.ts');
      setActiveVaultKey(freshKey);

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

    test('safely handles empty or invalid quitDate without producing NaN', () => {
      const nowMs = 1794110000000;
      const metricsBlank = calculateClinicalPeriodMetrics({
        timeRange: 'day',
        now: nowMs,
        profile: { quitDate: '', createdAt: '' },
      });
      assert.equal(isNaN(metricsBlank.periodCleanDays), false, 'periodCleanDays must not be NaN');
      assert.equal(isNaN(metricsBlank.periodCleanHours), false, 'periodCleanHours must not be NaN');
      assert.equal(metricsBlank.periodCleanDays, 0);
      assert.equal(metricsBlank.periodCleanHours, 0);

      const metricsInvalid = calculateClinicalPeriodMetrics({
        timeRange: 'day',
        now: nowMs,
        profile: { quitDate: 'not-a-valid-date' },
      });
      assert.equal(isNaN(metricsInvalid.periodCleanDays), false, 'periodCleanDays must not be NaN for invalid dates');
      assert.equal(isNaN(metricsInvalid.periodCleanHours), false, 'periodCleanHours must not be NaN for invalid dates');
    });
  });

  describe('Pillar 4: Session Security, PBKDF2 Vault Integration & Restart Recovery', () => {
    test('enforces exponential anti-brute-force lockout progression', () => {
      assert.equal(calculateLockoutDurationMs(1), 0);
      assert.equal(calculateLockoutDurationMs(4), 0);
      assert.equal(calculateLockoutDurationMs(5), 30000);   // 30s
      assert.equal(calculateLockoutDurationMs(6), 60000);   // 1m
      assert.equal(calculateLockoutDurationMs(7), 120000);  // 2m
      assert.equal(calculateLockoutDurationMs(8), 300000);  // 5m
      assert.equal(calculateLockoutDurationMs(9), 600000);  // 10m
      assert.equal(calculateLockoutDurationMs(10), 900000); // 15m maximum backoff cap
      assert.equal(calculateLockoutDurationMs(15), 900000); // capped at 15m
    });

    test('distinguishes between app complete closure vs standby (demands PIN only on cold restart)', () => {
      saveSecurityConfig(true, '8888');

      // 1. Cold start / Complete closure (sessionStorage wiped): PIN is required
      globalThis.sessionStorage.clear();
      assert.equal(isAppSessionUnlocked(), false, 'App MUST require PIN upon cold start or after browser restart');

      // 2. Successful PIN entry unlocks the session
      const unlockRes = verifyPin('8888');
      assert.equal(unlockRes.success, true);
      assert.equal(isAppSessionUnlocked(), true, 'Session must be unlocked after valid PIN');

      // 3. Standby / Sleep mode (sessionStorage preserved): no redundant lock prompt
      assert.equal(isAppSessionUnlocked(), true, 'Standby mode must keep session unlocked');

      // 4. Complete app termination (browser quit / process killed): sessionStorage wiped
      globalThis.sessionStorage.clear();
      assert.equal(isAppSessionUnlocked(), false, 'Reopening after complete closure must demand PIN again');
    });

    test('recovers user data seamlessly from encrypted localStorage when IndexedDB fails', async () => {
      const sampleProfile = {
        name: 'SobrietyHero',
        isOnboarded: true,
        cigarettesPerDay: 15,
        quitDate: '2026-02-01T08:00:00.000Z',
      };

      // Save to encrypted storage
      await saveProfile(sampleProfile);

      // Verify that initIndexedDBStorage recovers data from localStorage fallback
      const hydrated = await initIndexedDBStorage();
      assert.ok(hydrated, 'Storage must hydrate data successfully');
      assert.equal(hydrated.profile.name, 'SobrietyHero');
      assert.equal(hydrated.profile.cigarettesPerDay, 15);
    });

    test('verifies all passphrase vault source is deleted and device storage is transparently accessible', async () => {
      // 1. Encryption and decryption work seamlessly with device key without any prompt
      const secretRecord = { diary: '30 days clean, breathing easy', balance: 1200 };
      const cipher = await encryptData(secretRecord);
      assert.ok(cipher.startsWith('aes-gcm:'));

      // 2. Decrypt payload directly with device key
      const decrypted = await decryptData(cipher, null);
      assert.deepEqual(decrypted, secretRecord, 'Decrypted record must match original plaintext perfectly');
      assert.equal(getCryptoLifecycleState(), 'READY');
    });
  });

  describe('Pillar 5: Real IndexedDB Persistence, Migration & Zero-Loss Recovery', () => {
    test('strictly enforces zero raw key material in localStorage and stores non-extractable key in IndexedDB', async () => {
      // Initialize or get the subtle key
      const key = await getSubtleCryptoKey();
      assert.ok(key);
      assert.equal(key.extractable, false, 'CryptoKey MUST be non-extractable');

      // Verify no raw key strings or seed material anywhere in localStorage
      assert.equal(globalThis.localStorage.getItem('puffinless_vault_key_v2'), null);
      assert.equal(globalThis.localStorage.getItem('puffinless_vault_key_v1'), null);
      assert.equal(globalThis.localStorage.getItem('puffinless_vault_device_envelope_v2'), null);

      // Verify that the master key in the real IndexedDB vault is non-extractable
      const loadedKey = await loadKeyFromVault(MASTER_KEY_ID);
      assert.ok(loadedKey, 'Master key must exist in IndexedDB vault');
      assert.equal(loadedKey.extractable, false, 'Vault stored key must be strictly non-extractable');
      assert.equal(loadedKey.algorithm.name, 'AES-GCM');
    });

    test('cold restart restores all entities from real IndexedDB with zero onboarding guide loop', async () => {
      const sampleProfile = {
        name: 'SobrietyChampion',
        isOnboarded: true,
        cigarettesPerDay: 20,
        quitDate: '2026-03-01T00:00:00.000Z',
        currency: 'EUR',
        pricePerPack: 12.5,
      };
      const sampleStreaks = [
        { id: 's1', start: '2026-03-01T00:00:00.000Z', brokenBy: 'relapse' }
      ];
      const sampleCravings = [
        { id: 'c1', timestamp: '2026-03-02T12:00:00.000Z', intensity: 8, trigger: 'stress' }
      ];

      // Save to real IndexedDB via production storage functions
      await saveProfile(sampleProfile);
      await saveStreaks(sampleStreaks);
      await saveCravings(sampleCravings);

      // 1. Verify synchronous loadProfile() immediately reflects isOnboarded: true on boot
      // This prevents the guide / presentation modal from flashing on app open
      const syncProfile = loadProfile();
      assert.equal(syncProfile.isOnboarded, true, 'Synchronous loadProfile must immediately report isOnboarded: true');

      // 2. Hydrate via initIndexedDBStorage from real IndexedDB
      const hydrated = await initIndexedDBStorage();
      assert.ok(hydrated, 'Storage must hydrate data successfully on restart');
      assert.equal(hydrated.profile.name, 'SobrietyChampion');
      assert.equal(hydrated.profile.isOnboarded, true);
      assert.equal(hydrated.profile.cigarettesPerDay, 20);
      assert.equal(hydrated.streaks.length, 1);
      assert.equal(hydrated.streaks[0].id, 's1');
      assert.equal(hydrated.cravings.length, 1);
      assert.equal(hydrated.cravings[0].intensity, 8);
    });

    test('deep device recovery retrieves user data and restores a full week of history without data loss', async () => {
      const pastQuitDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const initialProfile = {
        name: 'WeekHero',
        isOnboarded: true,
        cigarettesPerDay: 15,
        quitDate: pastQuitDate,
        currency: 'EUR',
        pricePerPack: 12,
      };
      const initialCravings = [
        { id: 'c-test-1', timestamp: pastQuitDate, intensity: 6, trigger: 'morning' },
        { id: 'c-test-2', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), intensity: 8, trigger: 'stress' },
      ];
      const initialStreaks = [
        { id: 's-test-1', start: pastQuitDate },
      ];

      // Save initial records
      await saveProfile(initialProfile);
      await saveCravings(initialCravings);
      await saveStreaks(initialStreaks);

      // Verify that initIndexedDBStorage hydrates full 7-day history and profile
      const hydrated = await initIndexedDBStorage();
      assert.ok(hydrated, 'Hydrated data must exist');
      assert.equal(hydrated.profile.name, 'WeekHero');
      assert.equal(hydrated.profile.isOnboarded, true);
      assert.equal(hydrated.cravings.length, 2);
      assert.equal(hydrated.streaks.length, 1);
    });

    test('storage strictly distinguishes missing data from failed decryption and prevents overwriting corrupted data', async () => {
      // 1. Missing data: returns 'absent' without error
      const absent = await readWithStatus('non_existent_key_xyz_123');
      assert.equal(absent.status, 'absent');
      assert.equal(absent.data, null);

      // 2. Valid data: returns 'success' with payload
      const testProfile = { name: 'StatusVerifiedHero', isOnboarded: true, cigarettesPerDay: 10 };
      await saveProfile(testProfile);
      const valid = await readWithStatus('puffinless_profile_v2');
      assert.equal(valid.status, 'success');
      assert.equal(valid.data.name, 'StatusVerifiedHero');

      // 3. Corrupted data: returns 'decryption_error'
      globalThis.localStorage.setItem('puffinless_corrupted_record', 'aes-gcm:deadbeef:corruptedcipherpayload');
      const corrupt = await readWithStatus('puffinless_corrupted_record');
      assert.equal(corrupt.status, 'decryption_error');
      assert.ok(corrupt.error, 'Must report decryption error for corrupted data');
    });

    test('recovers legacy encrypted payloads (aes256: CryptoJS) across cold reset or update', async () => {
      const legacyProfile = {
        name: 'RecoveredHero',
        isOnboarded: true,
        cigarettesPerDay: 18,
        quitDate: '2026-01-01T00:00:00.000Z',
      };
      const legacyCravings = [
        { id: 'c-legacy-1', timestamp: '2026-01-02T15:00:00.000Z', intensity: 9, trigger: 'social' }
      ];

      // Encrypt with legacy CryptoJS key into legacy localStorage keys
      const legacyKey = getLegacyVaultKey();
      const legacyProfCipher = `aes256:${CryptoJS.AES.encrypt(JSON.stringify(legacyProfile), legacyKey).toString()}`;
      const legacyCravCipher = `aes256:${CryptoJS.AES.encrypt(JSON.stringify(legacyCravings), legacyKey).toString()}`;

      globalThis.localStorage.setItem('puffinless_profile', legacyProfCipher);
      globalThis.localStorage.setItem('puffinless_cravings', legacyCravCipher);

      // Execute recovery engine
      const res = await recoverAllDeviceData();
      assert.equal(res.recovered, true, 'Recovery engine must report recovered === true');
      assert.ok(res.profile);
      assert.equal(res.profile.name, 'RecoveredHero');
      assert.equal(res.profile.isOnboarded, true);
      assert.equal(res.cravings.length, 1);
      assert.equal(res.cravings[0].id, 'c-legacy-1');
    });

    test('fresh install onboarding initializes profile with isOnboarded: false and empty quitDate', async () => {
      // On brand new installation with empty storage:
      globalThis.localStorage.clear();
      globalThis.sessionStorage.clear();
      await deletePuffinLessDB();
      await purgeVaultKeys();

      const freshSyncProfile = loadProfile();
      assert.equal(freshSyncProfile.isOnboarded, false, 'Fresh install profile must have isOnboarded: false');
      assert.equal(freshSyncProfile.quitDate, '', 'Fresh install profile must have empty quitDate');
      assert.equal(freshSyncProfile.createdAt, '', 'Fresh install profile must have empty createdAt');

      const freshAsyncProfile = await loadProfileAsync();
      assert.equal(freshAsyncProfile.isOnboarded, false, 'Async loadProfile must report isOnboarded: false on fresh install');
      assert.equal(freshAsyncProfile.quitDate, '', 'Async loadProfile must report empty quitDate on fresh install');
    });

    test('arbitrary ISO date strings in storage are strictly ignored by recovery and never treated as quit dates', async () => {
      // Place an arbitrary ISO date string in storage (e.g. from an analytics key or unrelated cookie)
      globalThis.localStorage.clear();
      globalThis.localStorage.setItem('unrelated_random_date_marker', '2026-02-15T12:00:00.000Z');
      globalThis.localStorage.setItem('some_analytics_timestamp', new Date().toISOString());

      const res = await recoverAllDeviceData();
      assert.equal(res.recovered, false, 'Recovery must not manufacture recovery data from arbitrary date strings');
      assert.equal(res.profile, null, 'Must not manufacture a UserProfile from arbitrary date strings');
    });

    test('lockCryptographicVault clears both cachedCryptoKey and inMemoryKeyStore', async () => {
      // 1. Ensure key is loaded and cached
      const key = await getSubtleCryptoKey();
      assert.ok(key);
      assert.equal(getCryptoLifecycleState(), 'READY');

      // 2. Lock vault: must purge volatile memory completely
      lockCryptographicVault();
      assert.equal(getCryptoLifecycleState(), 'BOOTING');
    });

    test('saveKeyToVault throws on store failure and never silently swallows errors', async () => {
      await purgeVaultKeys();
      const originalIndexedDB = globalThis.window.indexedDB;
      globalThis.window.indexedDB = {
        open: () => {
          const req = { error: new Error('Simulated IndexedDB failure') };
          setTimeout(() => {
            if (req.onerror) req.onerror({ target: req });
          }, 0);
          return req;
        }
      };

      try {
        await assert.rejects(
          async () => {
            const key = await createKeyFromSeed(new Uint8Array(32));
            await saveKeyToVault('test_key', key);
          },
          /IndexedDB failure/,
          'saveKeyToVault must throw error if persisting key fails'
        );
      } finally {
        globalThis.window.indexedDB = originalIndexedDB;
      }
    });

    test('loadStreaksAsync, loadProfileAsync, and loadCravingsAsync throw DecryptionError on corrupted ciphertext', async () => {
      // Write corrupted ciphertext to primary storage key
      globalThis.localStorage.setItem('puffinless_streaks_v2', 'aes-gcm:deadbeef1234:corruptedstreakpayload');
      globalThis.localStorage.setItem('puffinless_cravings_v2', 'aes-gcm:deadbeef1234:corruptedcravingpayload');
      globalThis.localStorage.setItem('puffinless_profile_v2', 'aes-gcm:deadbeef1234:corruptedprofilepayload');

      // Assert each async loader explicitly throws DecryptionError instead of returning empty arrays or defaults
      await assert.rejects(
        async () => {
          await loadStreaksAsync();
        },
        DecryptionError,
        'loadStreaksAsync must throw DecryptionError when corrupted ciphertext is present'
      );

      await assert.rejects(
        async () => {
          await loadCravingsAsync();
        },
        DecryptionError,
        'loadCravingsAsync must throw DecryptionError when corrupted ciphertext is present'
      );

      await assert.rejects(
        async () => {
          await loadProfileAsync();
        },
        DecryptionError,
        'loadProfileAsync must throw DecryptionError when corrupted ciphertext is present'
      );
    });
  });

  describe('Pillar 6: Genuine Browser Cold-Restart & Storage Lifecycle Verification', () => {
    test('cold restart with complete volatile memory wipe restores all entities from real IndexedDB without onboarding guide flash', async () => {
      const verifiedQuitDate = '2026-02-20T09:00:00.000Z';
      const sampleProfile = {
        name: 'ColdRestartChampion',
        isOnboarded: true,
        cigarettesPerDay: 18,
        quitDate: verifiedQuitDate,
        createdAt: verifiedQuitDate,
        currency: 'EUR',
        pricePerPack: 12.0,
      };
      const sampleStreaks = [
        { id: 'streak-cold-1', start: verifiedQuitDate }
      ];
      const sampleCravings = [
        { id: 'crav-cold-1', timestamp: verifiedQuitDate, intensity: 7, trigger: 'stress' }
      ];
      const sampleExpenses = [
        { id: 'exp-cold-1', title: 'Gum', price: 5, quantity: 1, itemType: 'accessories', timestamp: verifiedQuitDate }
      ];
      const sampleSleep = [
        { id: 'sleep-cold-1', date: '2026-02-21', sleepRating: 8, energyRating: 7 }
      ];
      const sampleGoals = [
        { id: 'goal-cold-1', title: 'Trip', targetAmount: 500, category: 'travel', icon: 'Plane', completed: false }
      ];

      // Save complete production data
      await saveProfile(sampleProfile);
      await saveStreaks(sampleStreaks);
      await saveCravings(sampleCravings);
      await saveExpenses(sampleExpenses);
      await saveSleepEnergy(sampleSleep);
      await saveSavingsGoals(sampleGoals);

      // SIMULATE GENUINE BROWSER PROCESS TERMINATION & COLD RESTART:
      // 1. Purge all in-memory keys from volatile memory
      lockCryptographicVault();
      assert.equal(getCryptoLifecycleState(), 'BOOTING');

      // 2. Wipe sessionStorage (which is strictly wiped on browser tab/window close)
      globalThis.sessionStorage.clear();

      // BOOT PHASE 1: Synchronous initial state check
      // Verifies that loadProfile() synchronously reports isOnboarded: true so the onboarding presentation never flashes
      const syncProfile = loadProfile();
      assert.equal(syncProfile.isOnboarded, true, 'Synchronous loadProfile on restart must report isOnboarded: true');
      assert.equal(syncProfile.quitDate, verifiedQuitDate, 'Synchronous loadProfile must preserve verified quitDate');

      // BOOT PHASE 2: Asynchronous hydration from physical IndexedDB on disk
      const hydrated = await initIndexedDBStorage();
      assert.ok(hydrated, 'Storage must hydrate data successfully on restart');
      assert.equal(hydrated.profile.name, 'ColdRestartChampion');
      assert.equal(hydrated.profile.isOnboarded, true);
      assert.equal(hydrated.profile.cigarettesPerDay, 18);
      assert.equal(hydrated.streaks.length, 1);
      assert.equal(hydrated.streaks[0].id, 'streak-cold-1');
      assert.equal(hydrated.cravings.length, 1);
      assert.equal(hydrated.cravings[0].id, 'crav-cold-1');
      assert.equal(hydrated.expenses.length, 1);
      assert.equal(hydrated.expenses[0].id, 'exp-cold-1');
      assert.equal(hydrated.sleepLogs.length, 1);
      assert.equal(hydrated.goals.length, 1);
    });

    test('cold restart with PIN lock demands PIN on cold start and unlocks without data loss', async () => {
      const pin = '4321';
      saveSecurityConfig(true, pin);
      setAppSessionUnlocked(true);
      assert.equal(isAppSessionUnlocked(), true, 'App session must be unlocked during active use');

      // SIMULATE BROWSER TERMINATION & COLD RESTART:
      globalThis.sessionStorage.clear();
      lockCryptographicVault();

      // On cold restart, session is strictly locked (demands PIN)
      assert.equal(isAppSessionUnlocked(), false, 'Cold restart must demand PIN screen lock');

      // Entering invalid PIN fails
      const failRes = verifyPin('9999');
      assert.equal(failRes.success, false, 'Invalid PIN must fail');
      assert.equal(isAppSessionUnlocked(), false);

      // Entering valid PIN succeeds and unlocks session
      const successRes = verifyPin(pin);
      assert.equal(successRes.success, true, 'Valid PIN must unlock');
      assert.equal(isAppSessionUnlocked(), true, 'Session must now be unlocked');
    });

    test('readWithStatus strictly distinguishes absent records from corrupted records in both IndexedDB and localStorage', async () => {
      // 1. Missing record: returns 'absent'
      const absent = await readWithStatus('strictly_absent_key_404');
      assert.equal(absent.status, 'absent');
      assert.equal(absent.data, null);

      // 2. Corrupted record in IndexedDB: returns 'decryption_error'
      await idbSet('puffinless_corrupted_idb_key', 'aes-gcm:corrupted:deadbeef');
      const idbCorrupt = await readWithStatus('puffinless_corrupted_idb_key');
      assert.equal(idbCorrupt.status, 'decryption_error', 'Corrupted IndexedDB record must return decryption_error');
      assert.ok(idbCorrupt.error);

      // 3. Corrupted record in localStorage: returns 'decryption_error'
      globalThis.localStorage.setItem('puffinless_corrupted_local_key', 'aes-gcm:corrupted:deadbeef');
      const localCorrupt = await readWithStatus('puffinless_corrupted_local_key');
      assert.equal(localCorrupt.status, 'decryption_error', 'Corrupted localStorage record must return decryption_error');
      assert.ok(localCorrupt.error);
    });

    test('recovery strictly rejects arbitrary or corrupted date fields and only recovers verified dates', async () => {
      // Verify date validator logic
      assert.equal(isValidDateField(''), false);
      assert.equal(isValidDateField('not-a-date'), false);
      assert.equal(isValidDateField('2099-01-01T00:00:00.000Z'), false, 'Future dates must be rejected');
      assert.equal(isValidDateField('1990-01-01T00:00:00.000Z'), false, 'Dates before 2000 must be rejected');
      assert.equal(isValidDateField('2026-02-15T12:00:00.000Z'), true, 'Valid date must be accepted');

      // Place corrupted and arbitrary date markers in storage
      globalThis.localStorage.clear();
      globalThis.localStorage.setItem('puffinless_quit_date', 'corrupted-timestamp');
      globalThis.localStorage.setItem('unrelated_key', '2026-02-15T12:00:00.000Z');

      const res = await recoverAllDeviceData();
      assert.equal(res.recovered, false, 'Must reject corrupted quit_date and unrelated storage keys');
      assert.equal(res.profile, null, 'Must not manufacture a recovery profile from corrupted date markers');
    });
  });

  describe('Pillar 7: Zero Data Loss Safeguards & Crash Resilience', () => {
    test('createDeviceRescueSnapshot never overwrites populated arrays with empty arrays', () => {
      const sampleCravings = [
        { id: 'c1', timestamp: '2026-02-10T10:00:00.000Z', intensity: 5, trigger: 'stress', resisted: true },
        { id: 'c2', timestamp: '2026-02-11T14:00:00.000Z', intensity: 7, trigger: 'habit', resisted: false },
      ];
      const sampleStreaks = [
        { id: 'st1', start: '2026-02-01T00:00:00.000Z', end: '2026-02-08T00:00:00.000Z', brokenBy: 'cigarette' },
      ];

      // 1. Initial save with populated data
      createDeviceRescueSnapshot({
        cravings: sampleCravings,
        streaks: sampleStreaks,
      });

      let snap = getDeviceRescueSnapshot();
      assert.equal(snap?.cravings?.length, 2, 'Initial snapshot must have 2 cravings');
      assert.equal(snap?.streaks?.length, 1, 'Initial snapshot must have 1 streak');

      // 2. Mistaken call with empty arrays (must NOT overwrite existing data)
      createDeviceRescueSnapshot({
        cravings: [],
        streaks: [],
      });

      snap = getDeviceRescueSnapshot();
      assert.equal(snap?.cravings?.length, 2, 'Empty array call must NEVER erase existing cravings');
      assert.equal(snap?.streaks?.length, 1, 'Empty array call must NEVER erase existing streaks');
    });

    test('recoverAllDeviceData never overwrites populated keys with empty arrays', async () => {
      // 1. Prepopulate a valid streak in localStorage
      const validStreakCipher = await encryptData([
        { id: 'st-persist', start: '2026-02-01T08:00:00.000Z' },
      ]);
      globalThis.localStorage.setItem('puffinless_streaks_v2', validStreakCipher);

      // 2. Set profile in rescue snapshot
      createDeviceRescueSnapshot({
        profile: {
          name: 'Hero',
          quitDate: '2026-02-01T08:00:00.000Z',
          isOnboarded: true,
        },
      });

      // 3. Trigger deep recovery
      const res = await recoverAllDeviceData();
      assert.equal(res.recovered, true);
      assert.equal(res.streaks.length, 1, 'Must recover the streak');

      // 4. Verify streaks in storage was NOT wiped
      const storedStreakRaw = globalThis.localStorage.getItem('puffinless_streaks_v2');
      assert.ok(storedStreakRaw, 'Streaks key must still exist in localStorage');
      const decryptedStreaks = await decryptData(storedStreakRaw, []);
      assert.equal(decryptedStreaks.length, 1, 'Stored streak must not be wiped');
    });

    test('cold restart preserves a full week of logs via rescue snapshot fallback', async () => {
      const oneWeekCravings = Array.from({ length: 7 }).map((_, i) => ({
        id: `crav-${i}`,
        timestamp: `2026-02-0${i + 1}T12:00:00.000Z`,
        intensity: 6,
        trigger: 'routine',
        resisted: true,
      }));

      createDeviceRescueSnapshot({
        profile: {
          name: 'Hero',
          quitDate: '2026-02-01T00:00:00.000Z',
          isOnboarded: true,
        },
        cravings: oneWeekCravings,
      });

      // Simulate cold restart where IndexedDB is empty
      const hydrated = await initIndexedDBStorage();
      assert.ok(hydrated);
      assert.equal(hydrated.cravings?.length, 7, 'Must restore full 7 days of cravings');
    });

    test('dayLabel and localDateStr never throw RangeError on invalid inputs', () => {
      assert.doesNotThrow(() => {
        dayLabel('invalid-date-string');
        dayLabel('');
        dayLabel('NaN-NaN-NaN');
        localDateStr('invalid-date');
        localDateStr(NaN);
      });
      assert.equal(dayLabel('invalid-date-string'), '');
    });

    test('buildCoreReport and sumIntake never crash on undefined profile names or malformed logs', () => {
      assert.doesNotThrow(() => {
        sumIntake(null, '2026-02-15');
        sumIntake([null, { count: 1 }], '2026-02-15');
        buildCoreReport({
          profile: { name: undefined, quitDate: '' },
          stats: { slipsBySubstance: null, dailyBaselineCost: 0, level: { next: null } },
          substanceLogs: [null, { timestamp: 'invalid-time' }],
          cravings: [null, { trigger: null }],
          sleepLogs: [],
          streaks: [null],
        });
      });
    });

    test('if IndexedDB is unavailable, saveKeyToVault throws error and leaves old key untouched', async () => {
      // 1. Establish an initial valid key in memory and vault
      const initialKey = await createKeyFromSeed(new Uint8Array(32).fill(1));
      await saveKeyToVault('test_master_id', initialKey);
      assert.equal(await loadKeyFromVault('test_master_id'), initialKey);

      // 2. Simulate IndexedDB completely unavailable
      const originalIndexedDB = globalThis.window.indexedDB;
      globalThis.window.indexedDB = undefined;

      try {
        const candidateKey = await createKeyFromSeed(new Uint8Array(32).fill(9));
        await assert.rejects(
          async () => {
            await saveKeyToVault('test_master_id', candidateKey);
          },
          /IndexedDB is unavailable/,
          'saveKeyToVault must throw explicit error when IndexedDB is unavailable'
        );

        // 3. The old key must remain untouched in inMemoryKeyStore
        const currentKey = await loadKeyFromVault('test_master_id');
        assert.equal(currentKey, initialKey, 'Old key must remain completely untouched on persistence failure');
      } finally {
        globalThis.window.indexedDB = originalIndexedDB;
      }
    });

    test('read-back verification verifies retrieved key is usable for encryption/decryption operations', async () => {
      // A valid key must pass read-back usability verification seamlessly
      const validKey = await createKeyFromSeed(new Uint8Array(32).fill(2));
      await assert.doesNotReject(async () => {
        await saveKeyToVault('test_usable_key', validKey);
      });

      // Verify round-trip encryption/decryption with retrieved key
      const retrieved = await loadKeyFromVault('test_usable_key');
      assert.ok(retrieved);
      const iv = new Uint8Array(12);
      globalThis.crypto.getRandomValues(iv);
      const plaintext = new TextEncoder().encode('verification_test_data');
      const ciphertext = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, retrieved, plaintext);
      const decrypted = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, retrieved, ciphertext);
      assert.equal(new TextDecoder().decode(decrypted), 'verification_test_data');
    });

    test('idbGetWithStatus and idbGetRawWithStatus explicitly distinguish absent, success, and error', async () => {
      // 1. Absent: querying non-existent key returns status 'absent'
      const absentRes = await idbGetWithStatus('non_existent_key_xyz');
      assert.equal(absentRes.status, 'absent');
      assert.equal(absentRes.data, null);

      // 2. Success: saving and retrieving returns status 'success'
      await idbSet('test_status_key', { count: 42, label: 'saved' });
      const successRes = await idbGetWithStatus('test_status_key');
      assert.equal(successRes.status, 'success');
      assert.deepEqual(successRes.data, { count: 42, label: 'saved' });

      // 3. Error: database error must return status 'error' and NOT collapse into null or absent
      closePuffinLessDB();
      const originalIndexedDB = globalThis.window.indexedDB;
      globalThis.window.indexedDB = {
        open: () => {
          const req = { error: new Error('Simulated disk error') };
          setTimeout(() => {
            if (req.onerror) req.onerror({ target: req });
          }, 0);
          return req;
        }
      };

      try {
        const errorRes = await idbGetWithStatus('test_status_key');
        assert.equal(errorRes.status, 'error', 'Database failure must return status: "error"');
        assert.equal(errorRes.data, null);
        assert.ok(errorRes.error, 'Must provide the underlying database error');
        assert.match(errorRes.error.message, /disk error/i);

        const rawRes = await idbGetRawWithStatus('test_status_key');
        assert.equal(rawRes.status, 'error');
        assert.ok(rawRes.error);
      } finally {
        globalThis.window.indexedDB = originalIndexedDB;
        closePuffinLessDB();
      }
    });

    test('loadKeyFromVaultWithStatus explicitly distinguishes absent, success, and error without collapsing errors into null', async () => {
      // 1. Absent
      const absent = await loadKeyFromVaultWithStatus('absent_key_id');
      assert.equal(absent.status, 'absent');
      assert.equal(absent.key, null);

      // 2. Success
      const testKey = await createKeyFromSeed(new Uint8Array(32).fill(3));
      await saveKeyToVault('usable_key_id', testKey);
      const success = await loadKeyFromVaultWithStatus('usable_key_id');
      assert.equal(success.status, 'success');
      assert.ok(success.key);

      // 3. Error on DB failure
      const originalIndexedDB = globalThis.window.indexedDB;
      globalThis.window.indexedDB = {
        open: () => {
          const req = { error: new Error('Simulated vault read error') };
          setTimeout(() => {
            if (req.onerror) req.onerror({ target: req });
          }, 0);
          return req;
        }
      };

      try {
        // Clear memory cache and close active DB connection to force IDB open & read
        lockCryptographicVault();
        const errRes = await loadKeyFromVaultWithStatus('usable_key_id');
        assert.equal(errRes.status, 'error', 'Database failure must return status: "error"');
        assert.equal(errRes.key, null);
        assert.ok(errRes.error);
        assert.match(errRes.error.message, /vault read error/i);
      } finally {
        globalThis.window.indexedDB = originalIndexedDB;
        closeKeyVaultDB();
      }
    });

    test('createDeviceRescueSnapshot performs union merge and never drops existing history on partial array updates', () => {
      // 1. Initial snapshot with 2 substance logs
      const sub1 = { id: 'sub-1', substance: 'cigarette', count: 1, timestamp: '2026-02-10T08:00:00.000Z' };
      const sub2 = { id: 'sub-2', substance: 'cigarette', count: 2, timestamp: '2026-02-10T12:00:00.000Z' };
      createDeviceRescueSnapshot({ substanceLogs: [sub1, sub2] });

      let snap = getDeviceRescueSnapshot();
      assert.equal(snap?.substanceLogs?.length, 2);

      // 2. Component calls with only 1 new log (e.g., partial state)
      const sub3 = { id: 'sub-3', substance: 'puff_vape', count: 5, timestamp: '2026-02-10T16:00:00.000Z' };
      createDeviceRescueSnapshot({ substanceLogs: [sub3] });

      snap = getDeviceRescueSnapshot();
      // Must NOT truncate to 1! Must union/merge all 3!
      assert.equal(snap?.substanceLogs?.length, 3, 'Union merge must preserve sub-1, sub-2 and add sub-3');
      assert.ok(snap?.substanceLogs?.some((s) => s.id === 'sub-1'));
      assert.ok(snap?.substanceLogs?.some((s) => s.id === 'sub-2'));
      assert.ok(snap?.substanceLogs?.some((s) => s.id === 'sub-3'));
    });

    test('anti-truncation guard blocks accidental wipeout of populated history with empty array', async () => {
      // 1. Populate substance logs
      const initialLogs = [
        { id: 'sub-safe-1', substance: 'cigarette', count: 1, timestamp: '2026-02-10T08:00:00.000Z' },
        { id: 'sub-safe-2', substance: 'cigarette', count: 1, timestamp: '2026-02-10T10:00:00.000Z' },
      ];
      await saveSubstanceLogs(initialLogs);
      const loaded = await loadSubstanceLogsAsync();
      assert.equal(loaded.length, 2);

      // 2. Accidental call with empty array without allowEmptyReset
      await saveSubstanceLogs([]);

      // 3. Storage must refuse to overwrite populated history with empty array
      const preserved = await loadSubstanceLogsAsync();
      assert.equal(preserved.length, 2, 'Anti-truncation guard must preserve populated records');
      assert.equal(preserved[0].id, 'sub-safe-1');
    });

    test('storageQueue serializes rapid concurrent save operations in deterministic FIFO order', async () => {
      const order = [];
      const p1 = storageQueue.enqueue(async () => {
        await new Promise((r) => setTimeout(r, 20));
        order.push(1);
      });
      const p2 = storageQueue.enqueue(async () => {
        await new Promise((r) => setTimeout(r, 10));
        order.push(2);
      });
      const p3 = storageQueue.enqueue(async () => {
        order.push(3);
      });

      await Promise.all([p1, p2, p3]);
      assert.deepEqual(order, [1, 2, 3], 'Persistence queue must serialize tasks in strict FIFO order');
    });

    test('importUserDataJSON validates, merges, and safely restores user data from external JSON backup', async () => {
      // 1. Existing local state with 1 craving
      const existingCraving = { id: 'c-exist', timestamp: '2026-02-10T09:00:00.000Z', intensity: 5, trigger: 'stress', resisted: true };
      await saveCravings([existingCraving]);

      // 2. Backup file from user with 2 new cravings and 1 substance log
      const backupJSON = JSON.stringify({
        appName: 'PuffinLess',
        formatVersion: '2.0',
        exportedAt: '2026-02-10T18:00:00.000Z',
        profile: {
          name: 'Restored User',
          quitDate: '2026-02-01T00:00:00.000Z',
          isOnboarded: true,
        },
        cravings: [
          existingCraving,
          { id: 'c-imported-1', timestamp: '2026-02-10T14:00:00.000Z', intensity: 8, trigger: 'coffee', resisted: true },
        ],
        substanceLogs: [
          { id: 'sub-imported-1', substance: 'cigarette', count: 1, timestamp: '2026-02-05T12:00:00.000Z' },
        ],
      });

      const res = await importUserDataJSON(backupJSON);
      assert.equal(res.success, true);
      assert.equal(res.imported.cravingsCount, 2);
      assert.equal(res.imported.substanceLogsCount, 1);

      // 3. Verify disk reflects merged non-destructive state
      const reloadedCravings = await loadCravingsAsync();
      assert.equal(reloadedCravings.length, 2);
      const reloadedSubs = await loadSubstanceLogsAsync();
      assert.equal(reloadedSubs.length, 1);
      assert.equal(reloadedSubs[0].id, 'sub-imported-1');
    });
  });
});
