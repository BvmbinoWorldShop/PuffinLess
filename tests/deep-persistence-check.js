import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';

// Mock Browser Storage
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

// Import production functions
const {
  saveSubstanceLogs,
  loadSubstanceLogsAsync,
  saveCravings,
  loadCravingsAsync,
  saveStreaks,
  loadStreaksAsync,
  saveProfile,
  loadProfileAsync,
  importUserDataJSON,
  exportAllUserDataJSON,
  resetAllUserData,
} = await import('../src/utils/storage.ts');

const {
  createDeviceRescueSnapshot,
  getDeviceRescueSnapshot,
} = await import('../src/utils/recovery.ts');

const {
  saveKeyToVault,
  loadKeyFromVault,
  createKeyFromSeed,
} = await import('../src/utils/crypto.ts');

console.log('🚀 Running Deep Persistence & Safeguards Runtime Verification...\n');

// ----------------------------------------------------
// TEST 1: Key Persistence failure-safety & usability
// ----------------------------------------------------
console.log('Test 1: Key persistence failure-safety...');
const initialKey = await createKeyFromSeed(new Uint8Array(32).fill(7));
await saveKeyToVault('master_key_v1', initialKey);
const retrievedKey = await loadKeyFromVault('master_key_v1');
assert.ok(retrievedKey, 'Key must be retrieved successfully');

// When IDB is unavailable, saveKeyToVault must reject and leave the old key untouched
const origIDB = globalThis.window.indexedDB;
globalThis.window.indexedDB = undefined;
try {
  const badKey = await createKeyFromSeed(new Uint8Array(32).fill(9));
  await assert.rejects(async () => {
    await saveKeyToVault('master_key_v1', badKey);
  }, /IndexedDB is unavailable/);
  const stillOldKey = await loadKeyFromVault('master_key_v1');
  assert.equal(stillOldKey, initialKey, 'Old key must remain untouched');
} finally {
  globalThis.window.indexedDB = origIDB;
}
console.log('  ✓ Key persistence failure-safe and untouched on error.');

// ----------------------------------------------------
// TEST 2: Serialized Persistence Queue (Concurrent Saves)
// ----------------------------------------------------
console.log('Test 2: Serialized write queue under concurrent pressure...');
const promises = [];
for (let i = 0; i < 20; i++) {
  promises.push(
    saveSubstanceLogs([
      { id: `sub-${i}`, substance: 'cigarette', count: i + 1, timestamp: new Date(Date.now() + i * 1000).toISOString() }
    ])
  );
}
await Promise.all(promises);
const finalSubstances = await loadSubstanceLogsAsync();
assert.equal(finalSubstances.length, 20, 'All 20 concurrent saves must be preserved in serialized FIFO queue without loss');
console.log('  ✓ 20 concurrent saves resolved cleanly in serialized FIFO queue with zero data loss.');

// ----------------------------------------------------
// TEST 3: Anti-Truncation Guard
// ----------------------------------------------------
console.log('Test 3: Anti-truncation guard refuses empty array overwrite...');
const richHistory = [
  { id: 'h1', substance: 'cigarette', count: 1, timestamp: '2026-02-01T08:00:00.000Z' },
  { id: 'h2', substance: 'cigarette', count: 2, timestamp: '2026-02-02T08:00:00.000Z' },
  { id: 'h3', substance: 'cigarette', count: 1, timestamp: '2026-02-03T08:00:00.000Z' },
  { id: 'h4', substance: 'cigarette', count: 3, timestamp: '2026-02-04T08:00:00.000Z' },
  { id: 'h5', substance: 'cigarette', count: 1, timestamp: '2026-02-05T08:00:00.000Z' },
];
await saveSubstanceLogs(richHistory, { overwrite: true });
let loadedRich = await loadSubstanceLogsAsync();
assert.equal(loadedRich.length, 5, 'History must have 5 entries');

// Attempt an empty overwrite
await saveSubstanceLogs([]);
const postEmpty = await loadSubstanceLogsAsync();
assert.equal(postEmpty.length, 5, 'History must STILL have 5 entries after empty array call!');
assert.deepEqual(postEmpty.map(s => s.id), ['h1', 'h2', 'h3', 'h4', 'h5']);
console.log('  ✓ Accidental empty array write safely blocked; 5 historical records preserved.');

// ----------------------------------------------------
// TEST 4: Rescue Snapshot Union Deduplication
// ----------------------------------------------------
console.log('Test 4: Rescue snapshot union deduplication (no loss on partial arrays)...');
globalThis.localStorage.clear();
createDeviceRescueSnapshot({
  substanceLogs: [
    { id: 'snap-1', substance: 'cigarette', count: 1, timestamp: '2026-02-01T00:00:00.000Z' },
    { id: 'snap-2', substance: 'cigarette', count: 2, timestamp: '2026-02-02T00:00:00.000Z' },
  ],
  cravings: [
    { id: 'crav-1', timestamp: '2026-02-01T10:00:00.000Z', intensity: 6, trigger: 'stress', resisted: true },
  ]
});

let snap = getDeviceRescueSnapshot();
assert.equal(snap.substanceLogs.length, 2);
assert.equal(snap.cravings.length, 1);

// Component sends a partial array containing only snap-3
createDeviceRescueSnapshot({
  substanceLogs: [
    { id: 'snap-3', substance: 'puff_vape', count: 4, timestamp: '2026-02-03T00:00:00.000Z' }
  ],
  cravings: [
    { id: 'crav-2', timestamp: '2026-02-02T10:00:00.000Z', intensity: 8, trigger: 'social', resisted: true },
  ]
});

snap = getDeviceRescueSnapshot();
assert.equal(snap.substanceLogs.length, 3, 'Must retain snap-1, snap-2 AND snap-3');
assert.equal(snap.cravings.length, 2, 'Must retain crav-1 AND crav-2');
console.log('  ✓ Partial snapshot updates merge additively into a complete unified history.');

// ----------------------------------------------------
// TEST 5: Full Export & Import Roundtrip
// ----------------------------------------------------
console.log('Test 5: Export and Import backup JSON roundtrip...');
await saveProfile({
  name: 'Alexandre',
  quitDate: '2026-02-01T00:00:00.000Z',
  createdAt: '2026-02-01T00:00:00.000Z',
  isOnboarded: true,
  theme: 'dark',
  language: 'fr',
  currency: '€',
  cigarettesPerDay: 15,
  pricePerPack: 12.5,
  cigarettesInPack: 20,
  puffsPerDay: 0,
  cannabisGramsPerWeek: 0,
  podPrice: 0,
  pricePerGram: 0,
  quitMode: 'cold_turkey',
  gradualDailyTarget: 0,
  motivators: ['Santé', 'Économies'],
  soundEnabled: true,
  customQuitDate: false,
  avatar: '',
  age: 30,
});
await saveCravings([
  { id: 'c-round-1', timestamp: '2026-02-02T12:00:00.000Z', intensity: 7, trigger: 'travail', resisted: true }
]);
await saveStreaks([
  { id: 'st-round-1', start: '2026-02-01T00:00:00.000Z', end: '2026-02-05T00:00:00.000Z', brokenBy: 'cigarette' }
]);

const exportedJSON = await exportAllUserDataJSON();
assert.ok(exportedJSON.includes('PuffinLess'), 'Export JSON must be valid PuffinLess payload');
assert.ok(exportedJSON.includes('Alexandre'), 'Export JSON must contain profile name');
assert.ok(exportedJSON.includes('c-round-1'), 'Export JSON must contain cravings');

// Simulate moving to a new device or complete browser reset
await resetAllUserData();
const cleanProfile = await loadProfileAsync();
assert.equal(cleanProfile.isOnboarded, false, 'After reset, profile is clean');

// Now import the JSON backup
const importResult = await importUserDataJSON(exportedJSON);
assert.equal(importResult.success, true, 'Import must succeed');
assert.equal(importResult.imported.cravingsCount, 1);
assert.equal(importResult.imported.streaksCount, 1);
assert.equal(importResult.imported.profile, true);

// Verify restored state in persistent storage
const restoredProfile = await loadProfileAsync();
assert.equal(restoredProfile.name, 'Alexandre');
assert.equal(restoredProfile.isOnboarded, true);
assert.equal(restoredProfile.currency, '€');

const restoredCravings = await loadCravingsAsync();
assert.equal(restoredCravings.length, 1);
assert.equal(restoredCravings[0].id, 'c-round-1');

const restoredStreaks = await loadStreaksAsync();
assert.equal(restoredStreaks.length, 1);
assert.equal(restoredStreaks[0].id, 'st-round-1');
console.log('  ✓ Full export/import roundtrip succeeded with 100% data integrity.');

console.log('\n🎉 ALL 5 COMPREHENSIVE RUNTIME SAFEGUARDS FULLY VERIFIED AND WORKING PROPERLY!\n');
