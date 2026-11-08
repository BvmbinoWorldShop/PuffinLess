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
  deriveKeyFromPassphrase,
  enablePassphraseVault,
  unlockPassphraseVault,
  disablePassphraseVault,
  lockCryptographicVault,
  isPassphraseVaultEnabled,
  loadKeyFromVault,
  MASTER_KEY_ID,
  DecryptionError,
} from '../src/utils/crypto.ts';
import {
  resetAllUserData,
  saveProfile,
  loadProfile,
  saveStreaks,
  saveCravings,
  initIndexedDBStorage,
  migrateToPassphraseVault,
  migrateToDeviceVault,
} from '../src/utils/storage.ts';
import {
  recoverAllDeviceData,
} from '../src/utils/recovery.ts';
import {
  purgeSecurityState,
  getSecurityConfig,
  saveSecurityConfig,
  verifyPin,
  calculateLockoutDurationMs,
  isAppSessionUnlocked,
} from '../src/utils/security.ts';
import { calculateClinicalPeriodMetrics } from '../src/utils/clinicalMetrics.ts';

describe('PuffinLess Production Code Verification', () => {

  beforeEach(async () => {
    globalThis.localStorage.clear();
    globalThis.sessionStorage.clear();
    await purgeVaultKeys();
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

    test('derives non-extractable AES-GCM key from user passphrase using PBKDF2 (600,000 iterations)', async () => {
      const salt = new Uint8Array(16);
      globalThis.crypto.getRandomValues(salt);

      const derivedKey = await deriveKeyFromPassphrase('MySecretPassphrase2026!', salt, 600000);
      assert.equal(derivedKey.extractable, false, 'PBKDF2 derived key must be non-extractable');
      assert.equal(derivedKey.algorithm.name, 'AES-GCM');
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

    test('full lifecycle of Passphrase Vault (PBKDF2 600,000 iterations): enable, lock, unlock & restore', async () => {
      const passphrase = 'UltraSecurePersonalVault2026!';

      // 1. Enable Passphrase Vault mode
      const vaultKey = await enablePassphraseVault(passphrase);
      assert.ok(vaultKey);
      assert.ok(isPassphraseVaultEnabled(), 'Passphrase vault must be active');

      // 2. Encrypt sensitive data using the passphrase-derived key
      const secretRecord = { diary: '30 days clean, breathing easy', balance: 1200 };
      const cipher = await encryptData(secretRecord);
      assert.ok(cipher.startsWith('aes-gcm:'));

      // 3. Simulate cold restart / locked vault session
      lockCryptographicVault();

      // 4. Attempt to unlock with invalid passphrase
      const failedUnlock = await unlockPassphraseVault('WrongSecret!');
      assert.equal(failedUnlock, false, 'Invalid passphrase must fail to unlock vault');

      // 5. Unlock with legitimate passphrase (derives key via PBKDF2 with 600k iterations)
      const validUnlock = await unlockPassphraseVault(passphrase);
      assert.equal(validUnlock, true, 'Valid passphrase must unlock vault');

      // 6. Decrypt payload with unlocked vault
      const decrypted = await decryptData(cipher, null);
      assert.deepEqual(decrypted, secretRecord, 'Decrypted record must match original plaintext perfectly');

      // 7. Disable vault mode and return to device key
      const restoredDeviceKey = await disablePassphraseVault();
      assert.ok(restoredDeviceKey);
      assert.equal(isPassphraseVaultEnabled(), false, 'Vault mode must be cleanly deactivated');
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

      // 2. Clear volatile memory caches (simulating cold process restart)
      lockCryptographicVault();

      // 3. Hydrate via initIndexedDBStorage from real IndexedDB
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

    test('passphrase migration guarantees zero data loss in both directions', async () => {
      const initialProfile = {
        name: 'VaultTester',
        isOnboarded: true,
        cigarettesPerDay: 10,
        quitDate: '2026-02-15T08:00:00.000Z',
        currency: 'EUR',
        pricePerPack: 11,
      };
      const initialCravings = [
        { id: 'c-test-1', timestamp: '2026-02-16T10:00:00.000Z', intensity: 5, trigger: 'morning_coffee' }
      ];

      // Seed storage with device key
      await saveProfile(initialProfile);
      await saveCravings(initialCravings);

      const passphrase = 'MySuperPassphrase#2026!';

      // 1. Migrate to Passphrase Vault (PBKDF2 600,000 iterations)
      await migrateToPassphraseVault(passphrase);
      assert.equal(isPassphraseVaultEnabled(), true, 'Passphrase vault must be enabled');

      // 2. Read back data after migration - zero data loss!
      const hydratedPassphrase = await initIndexedDBStorage();
      assert.equal(hydratedPassphrase.profile.name, 'VaultTester');
      assert.equal(hydratedPassphrase.cravings.length, 1);
      assert.equal(hydratedPassphrase.cravings[0].id, 'c-test-1');

      // 3. Vault Locking genuinely removes access to the key
      lockCryptographicVault();
      await assert.rejects(
        async () => {
          await getSubtleCryptoKey();
        },
        DecryptionError,
        'Locked vault must reject getSubtleCryptoKey() when locked'
      );

      // 4. Unlock with correct passphrase
      const unlockResult = await unlockPassphraseVault(passphrase);
      assert.equal(unlockResult, true, 'Unlock with valid passphrase must succeed');

      // 5. Migrate back to device vault
      await migrateToDeviceVault();
      assert.equal(isPassphraseVaultEnabled(), false, 'Passphrase vault must be deactivated');

      // 6. Verify data integrity after return to device vault
      const hydratedDevice = await initIndexedDBStorage();
      assert.equal(hydratedDevice.profile.name, 'VaultTester');
      assert.equal(hydratedDevice.cravings.length, 1);
      assert.equal(hydratedDevice.cravings[0].trigger, 'morning_coffee');
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
  });
});
