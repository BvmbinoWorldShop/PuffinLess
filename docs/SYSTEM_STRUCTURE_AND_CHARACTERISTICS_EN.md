# PuffinLess — System Structure & Characteristics Manual

**Version:** 2.2 (Connected Store Resilience, Safe Sequence Restoration & Genuine Browser Verification Release)  
**Classification:** Core System Architecture Specification  
**Architecture Paradigm:** 100% On-Device, Offline-First, Zero-Telemetry, Encrypted Event Sourcing & Multi-Tier Persistence  
**Author:** DeepMind Advanced Agentic Coding Pair Programming Team

---

## 1. Executive Overview & Core Philosophy

PuffinLess is an autonomous, clinical-grade substance-recovery and sobriety-tracking web application designed for cigarettes, nicotine vapes/puffs, cannabis, and custom habits. Unlike typical commercial health applications that rely on remote cloud databases, third-party analytics, and centralized servers, PuffinLess is built on an uncompromising **Local-First, Privacy-by-Design** foundation.

### Foundational Characteristics
1. **Zero External Network Dependencies (100% Offline)**: All computation, data persistence, cryptographic encryption, and statistical analytics execute locally on the user's host browser. Zero network requests leave the device.
2. **Encrypted Append-Only Event Sourcing**: User interactions are recorded as discrete, monotonic, immutable journal events in an IndexedDB event store (`events_store`), encrypted at rest with Web Crypto AES-GCM 256-bit. Guarantees replayability, crash resilience, sequence monotonicity, and confidential auditability.
3. **Fail-Visibly Storage & Rollback Policy**: All journal and vault operations fail visibly. Critical write failures are never silently swallowed; if persistence or encryption fails, the in-memory state automatically rolls back to prevent desynchronization, an explicit exception propagates immediately, and a visible alert banner is rendered in the UI.
4. **Safe Sequence Restoration**: Sequence numbering is restored safely from disk via `idbGetMaxEventSeq()`. If disk queries fail, sequence restoration throws explicitly, preserves `sequenceInitialized = false`, and prevents sequence resets or numbering collisions with past records.
5. **Multi-Tier Defense-in-Depth Storage**: Data is protected and persisted simultaneously across four physical and logical tiers: IndexedDB Key-Value Store, Encrypted IndexedDB Event Journal, Modern LocalStorage v2, and Unalterable Local Device Rescue Snapshots.
6. **Hardware-Accelerated Web Crypto AES-GCM**: Military-grade authenticated encryption using non-extractable 256-bit Web Crypto keys (`crypto.subtle`), unique 96-bit initialization vectors (IVs) per operation, and PBKDF2 (100,000 iterations) key/PIN protection.
7. **Strict Anti-Truncation & Error Distinction**: Empty arrays are rejected whenever existing data or decryption failures exist. Corrupted records or disk I/O errors throw explicit exceptions (`DecryptionError`, `Error`) and are never misconstrued as missing data.
8. **Honest, Transparent Disaster Recovery**: Recovery scanning evaluates baseline data, reports genuine newly restored records versus already-healthy state, itemizes scanned storage engines, and verifies date field authenticity.
9. **High-Contrast Clinical Ergonomics**: Critical quantitative views, including the Financial Center (`MoneyView.tsx`) and persistence error banners, employ crisp high-contrast white and alert typography guaranteeing 100% legibility in all lighting conditions and theme modes.
10. **Single-File Portable Distribution**: Compiles to an obfuscated, fully standalone single `.html` file (`dist/standalone.html`) with embedded WOFF2 fonts and assets, deployable on any desktop or mobile browser without installation.

---

## 2. Global System Architecture Diagram

```mermaid
flowchart TD
    subgraph UI_Layer ["Presentation & UI Layer (React 19 + Tailwind v4)"]
        UI_Dash["Dashboard & Daily Sobriety Dial"]
        UI_Log["Intake Logger (Cigarettes, Puffs, Cannabis)"]
        UI_Money["Financial Center & High-Contrast Metrics (MoneyView)"]
        UI_ErrorBanner["Sticky Persistence Error Banner (Fail-Visibly)"]
        UI_SOS["SOS Emergency 180s Craving Breaker"]
        UI_Cert["Clinical Certificate & Period Metrics"]
        UI_Modals["Profile, Security PIN, & Recovery Modal"]
    end

    subgraph State_Layer ["State Management & Reactive Store (useAppStore)"]
        AppStore["useAppStore Hook"]
        SyncHydrate["Boot Phase 1: Sync Hydration (Zero-Flash)"]
        AsyncHydrate["Boot Phase 2: Async IDB Hydration"]
        SeqRestore["Cold Restart: restoreJournalSequence() (Fails Safely)"]
        RollbackMgr["Optimistic State Rollback Manager"]
        CalcEngine["Clinical Calculation Engine (obsidianCore)"]
    end

    subgraph Journal_Layer ["Append-Only Event Sourcing Engine (journal.ts)"]
        RecEvent["recordJournalEvent() (Fail-Visibly)"]
        ReplayEngine["replayJournalEvents() (Multi-Entity Undo)"]
        SeqCounter["Monotonic Sequence Counter (Restored from Disk)"]
        ReadStatus["getHistoricalJournalEventsWithStatus() ('empty'|'success'|'error')"]
        ClearJournal["clearJournalEvents() (Unswallowed Errors)"]
    end

    subgraph Storage_Queue ["Serialization & Concurrency Barrier (storage.ts)"]
        FIFO["storageQueue (Promise FIFO Pipeline)"]
        Guard["verifySafeEmptyOverwrite (Anti-Truncation Guard)"]
        UnionMerge["Union Merge Operators (mergeSubstances, etc.)"]
    end

    subgraph Crypto_Layer ["Cryptographic Security Vault (crypto.ts)"]
        WebCrypto["Web Crypto API (AES-GCM 256-bit)"]
        NonExtract["Non-Extractable CryptoKey Vault (IDB)"]
        PBKDF2["PBKDF2 PIN Hashing (100k iter + Salt)"]
        LockMgr["Vault Lock Manager (Volatile Cache Purge)"]
    end

    subgraph Physical_Storage ["Multi-Tier Physical Storage Subsystem"]
        IDB_KV["IndexedDB: kv_store (puffinless_indexeddb)"]
        IDB_Events["IndexedDB: events_store (AES-GCM Encrypted at Rest)"]
        IDB_Vault["IndexedDB: key_vault (CryptoKey Storage)"]
        Local_V2["localStorage: puffinless_*_v2 (Encrypted Backup)"]
        Rescue_Snap["localStorage: puffinless_device_rescue_backup_v2"]
        Session_Store["sessionStorage: Ephemeral Session Lock State"]
    end

    UI_Dash --> AppStore
    UI_Log --> AppStore
    UI_Money --> AppStore
    UI_SOS --> AppStore
    UI_Cert --> CalcEngine
    UI_Modals --> AppStore
    AppStore --> UI_ErrorBanner

    AppStore --> SyncHydrate
    AppStore --> AsyncHydrate
    AppStore --> SeqRestore
    AppStore --> RecEvent
    AppStore --> FIFO
    AppStore --> RollbackMgr

    SeqRestore --> SeqCounter
    RecEvent --> SeqCounter
    RecEvent --> WebCrypto
    WebCrypto --> IDB_Events
    ReadStatus <-- IDB_Events
    ReplayEngine <-- ReadStatus
    ClearJournal --> IDB_Events

    FIFO --> Guard
    Guard --> UnionMerge
    UnionMerge --> WebCrypto

    WebCrypto <--> NonExtract
    NonExtract <--> IDB_Vault
    UI_Modals <--> PBKDF2

    WebCrypto --> IDB_KV
    WebCrypto --> Local_V2
    UnionMerge --> Rescue_Snap
    LockMgr --> Session_Store
```

---

## 3. Structural Breakdown & Characteristics by Module

### 3.1. Cryptographic Security Engine (`src/utils/crypto.ts`)
The cryptographic core guarantees confidentiality, authenticity, and non-extractability of user addiction logs.

| Characteristic | Specification | Implementation Detail |
|---|---|---|
| **Cipher Algorithm** | AES-GCM (Galois/Counter Mode) | Standard 256-bit key length, 128-bit authentication tag |
| **Key Extractability** | `extractable: false` | Enforced at generation; raw key bytes cannot be read by scripts |
| **Key Persistence** | IndexedDB `puffinless_key_vault` | Stored as structured `CryptoKey` object; never written to `localStorage` |
| **IV Generation** | Dynamic 96-bit (12 bytes) per write | `crypto.getRandomValues(new Uint8Array(12))` guarantees unique ciphertexts |
| **Payload Envelope** | `aes-gcm:<ivHex>:<ciphertextBase64>` | Identifies payload type and carries explicit initialization vector |
| **Status Separation** | `readWithStatus` / `decryptWithStatus` | Returns `'absent'`, `'success'`, or `'decryption_error'` (never collapses to null) |
| **Volatile Memory Purge** | `lockCryptographicVault()` | Wipes `cachedCryptoKey` and `inMemoryKeyStore` on screen lock/restart |
| **Legacy Compatibility** | `aes256:` (CryptoJS AES-CBC) | Auto-migrates historical records to AES-GCM seamlessly on first write |
| **Cryptoshredding** | Irrevocable key destruction | `purgeVaultKeys()` deletes key material, rendering disk ciphertexts unreadable |

---

### 3.2. Encrypted Append-Only Event Journal (`src/utils/journal.ts` & `src/utils/indexedDb.ts`)
PuffinLess implements event sourcing to solve data overwriting and race conditions across concurrent browser activities, while keeping all past sensitive health actions encrypted at rest.

```
+--------------------------------------------------------------------------------------------------------------------+
|                                                  events_store                                                      |
+-----+-----------------------+--------------------------+----------+------------------------------------------------+
| seq | type                  | timestamp                | entityId | ciphertext (AES-GCM 256-bit encrypted payload) |
+-----+-----------------------+--------------------------+----------+------------------------------------------------+
| 1   | PROFILE_UPDATED       | 2026-02-10T08:00:00.000Z | user     | aes-gcm:d4e9a...:82fba7c10b...                |
| 2   | SUBSTANCE_LOGGED      | 2026-02-10T09:30:00.000Z | sub-1    | aes-gcm:90cf1...:1a2c5e7b8f...                |
| 3   | CRAVING_LOGGED        | 2026-02-10T11:15:00.000Z | crav-1   | aes-gcm:31bb4...:90de8812c3...                |
| 4   | SUBSTANCE_REMOVED     | 2026-02-10T12:00:00.000Z | sub-1    | aes-gcm:48fa2...:e43a912bb0...                |
| 5   | SAVINGS_GOAL_ADDED    | 2026-02-10T14:00:00.000Z | goal-1   | aes-gcm:77ac9...:7d8a9e145c...                |
+-----+-----------------------+--------------------------+----------+------------------------------------------------+
                                          |
                                          v
                              idbGetAllEventsWithStatus()
                       ('empty' | 'success' | 'error' distinction)
                                          |
                                          v
                                replayJournalEvents()
                                          |
                                          v
        +------------------------------------------------------------------+
        | Replayed Projections:                                            |
        | - substanceLogs: [] (Compensated by SUBSTANCE_REMOVED)           |
        | - cravings: [crav-1]                                             |
        | - goals: [goal-1]                                                |
        | - profilePatch: { quitDate: ... }                                |
        +------------------------------------------------------------------+
```

#### Journal Hardening Principles
1. **Encrypted at Rest**: All journal events persisted to IndexedDB `events_store` are encrypted with Web Crypto AES-GCM 256-bit. Raw sensitive notes or intake payloads are never stored in plaintext.
2. **Fail-Visibly Persistence**: `recordJournalEvent()` awaits `idbAppendEvent()` and never swallows storage or encryption errors. If persistence fails, the call throws immediately, preventing silent corruption.
3. **Safe Sequence Restoration (`restoreJournalSequence`)**:
   - Queries `idbGetMaxEventSeq()`, which checks the `seq` index directly in $O(1)$.
   - If disk reading fails, the exception is rethrown, `sequenceInitialized` remains `false`, and `monotonicSequence` is **never** reset to 0.
   - Any attempt to write while sequence restoration failed throws immediately, preventing numbering collisions with past records.
4. **Unswallowed Clearing Errors**: `idbClearEvents()` and `clearJournalEvents()` rethrow errors immediately if disk clearing fails. `monotonicSequence` is reset only after disk confirmation.
5. **Multi-Entity Removal Replay**: `replayJournalEvents()` accurately replays removals and deletions:
   - `SUBSTANCE_REMOVED`: Decrements matching intake counts up to event timestamp.
   - `STREAK_REMOVED`: Evicts deleted streaks by ID.
   - `CRAVING_REMOVED`: Evicts removed cravings by ID.
   - `PURCHASE_EXPENSE_DELETED`: Evicts deleted expenses by ID.
   - `SAVINGS_GOAL_DELETED`: Evicts removed goals by ID.

---

### 3.3. Store Actions, Concurrency & Rollback Mechanics (`src/state/useAppStore.ts` & `src/App.tsx`)

#### 1. Connected Store Actions
All state mutation actions (`logSubstance`, `removeSubstance`, `resistCraving`, `addExpense`, `deleteExpense`, `addGoal`, `deleteGoal`, `toggleGoal`, `saveSleepEnergyEntry`, `updateProfile`) are connected directly to journal persistence and storage snapshot promises:
- They are asynchronous (`Promise<void>`).
- If IndexedDB or journal recording throws, the action catches the error, rolls back in-memory state to the pre-action snapshot, sets `persistenceError`, and rethrows.

#### 2. Visual Persistence Alert Banner
`App.tsx` subscribes to `persistenceError`:
- When persistence fails, a sticky top banner appears with high contrast (`bg-rose-950/95`, `text-rose-100`) detailing the exact failure and providing an immediate dismiss button.
- The user is never misled into believing that an unpersisted action succeeded.

#### 3. The FIFO Promise Pipeline (`storageQueue`)
To eliminate write races when multiple components or rapid taps fire simultaneously, all read-modify-write storage operations are funnelled through `storageQueue.enqueue()`. Calls execute in strict FIFO order, preventing out-of-order completions.

#### 4. Strict Empty-Array Protection (`verifySafeEmptyOverwrite`)
Empty arrays (`[]`) are prohibited from overwriting stored data unless:
- The user explicitly calls reset (`{ allowEmptyReset: true }`), **AND**
- Primary storage is genuinely absent or empty, **AND**
- Legacy storage is genuinely absent or empty, **AND**
- The rescue snapshot contains zero records.

---

### 3.4. Deep Disaster Recovery Engine (`src/utils/recovery.ts`)

PuffinLess provides an integrated local recovery scanner that reconstructs user history even if browser cache was partially cleared, updated, or corrupted.

#### Recovery Workflow
1. **Baseline Snapshot**: Records currently active IDs in memory/storage before scanning.
2. **Multi-Source Crawl**:
   - Tier 1: Local Device Rescue Snapshot (`puffinless_device_rescue_backup_v2`).
   - Tier 2: IndexedDB Key-Value Store (`puffinless_indexeddb` / `kv_store`).
   - Tier 3: Encrypted IndexedDB Event Journal (`events_store`), queried with `idbGetAllEventsWithStatus` and replayed via `replayJournalEvents`.
   - Tier 4: Modern LocalStorage (`puffinless_*_v2`).
   - Tier 5: Legacy LocalStorage (`puffinless_profile`, `puffinless_cravings`, etc. in AES-CBC).
3. **Strict Date Field Validation (`isValidDateField`)**:
   - Rejects corrupted strings, numbers, and out-of-bounds timestamps.
   - Accepts only verified ISO-8601 timestamps between `2000-01-01` and `now + 24h`.
4. **Honest Differential Reporting**:
   - `hasNewlyRecoveredData`: Set to `true` **only** if newly found records were missing from baseline.
   - `newlyRecovered`: Itemized counts (`streaks`, `cravings`, `substances`, `expenses`, `goals`, `sleep`, `profileRestored`).
   - `integrity`: Reports `totalScanned`, `validRecords`, `corruptedRejected`, and `datesVerified`.
   - If storage was already healthy, the UI displays: *"All your data is already healthy and synchronized (0 items missing)."*

---

### 3.5. Application Security & Anti-Brute-Force Lockout (`src/utils/security.ts`)

| Parameter | Value / Mechanism | Security Objective |
|---|---|---|
| **PIN Hash Algorithm** | PBKDF2-HMAC-SHA256 | High-cost one-way stretching against offline dictionaries |
| **Iterations** | 100,000 iterations | Mitigates GPU/ASIC hash cracking |
| **Salt** | 16 cryptographically random bytes | Prevents rainbow tables and cross-user correlation |
| **Lockout Progression** | Exponential backoff: `1s -> 2s -> 4s -> 8s -> ... -> 300s` | Defeats automated client-side brute-force attacks |
| **Session Boundary** | `sessionStorage` token validation | Distinguishes page refreshes from complete browser cold-starts |

---

### 3.6. Clinical Period Metrics Engine (`src/utils/clinicalMetrics.ts`)

To avoid skewed charts and misleading clinical claims:
- **Strict Time Window Isolation**: Metrics calculated for Day (24h), Week (7d), Month (30d), and Lifetime strictly enforce timestamps within `[now - window, now]`.
- **Zero-Leakage Guarantee**: If zero cravings or slips occurred in the active 24-hour window, the report calculates strictly `0 cravings` (100% mastery), never falling back to lifetime numbers.
- **Financial & Intake Accuracy**: Savings represent baseline daily allocation minus actual recorded purchases within that specific period window.

---

### 3.7. Financial Center Typography & Visual Ergonomics (`src/components/MoneyView.tsx`)

Financial and clinical metrics require immediate, high-contrast readability without eye fatigue or low-contrast washouts:
- **High-Contrast White Typography**: All key analytical metrics, card titles, descriptions, quadrant analyses, and compound projections utilize crisp white fonts (`text-white`, `text-white/95`, `text-white/90`, `text-white/85 font-medium`).
- **Complete Elimination of Low-Contrast Text**: Muted grays, low-contrast dark slates, and unreadable subtext across the 4 key benchmarks (10-Yr Loss, Life Lost, REM Sleep, Lung Load) have been replaced with white-weighted tokens.
- **Modal & Form Clarity**: Purchase logging and savings goal creation modals enforce bold white field labels (`text-white font-semibold`) and readable placeholder/helper copy.

---

## 4. Production Build, Hardening & Obfuscation Pipeline

The application compiles into a standalone, tamper-resistant bundle:

```
src/ (TypeScript, React 19, CSS)
  │
  ├──> npx tsc -b                    (Strict typecheck, 0 errors allowed)
  ├──> vite build                    (Minification, chunking, asset bundling)
  ├──> scripts/make-standalone.js    (Inlines CSS, JS, SVG, and WOFF2 fonts into a single HTML)
  └──> javascript-obfuscator         (Control flow flattening, base64 strings, hex mangling)
        │
        └──> dist/standalone.html    (Self-contained ~2.7 MB production executable)
              │
              └──> Synchronized to: C:\Users\tiegb\Desktop\final version 1\PuffinLess_App.html
```

---

## 5. Automated Verification Harnesses (Unit, Integration & Genuine Browser)

PuffinLess maintains two independent automated test suites:

### 1. Codebase Engineering Test Suite (57 Tests Across 8 Pillars)
Executed via `npm run test:unit` (`tests/engineering-verification.test.js`):
1. **Pillar 1: AES-GCM via Non-Extractable CryptoKey & IndexedDB Vault** (6 tests)
2. **Pillar 2: PIN Hashing with PBKDF2 (100k iter) & Complete Data Erasure** (2 tests)
3. **Pillar 3: Period-Scoped Statistics (Direct Production Execution)** (4 tests)
4. **Pillar 4: Session Security, PBKDF2 Vault Integration & Restart Recovery** (4 tests)
5. **Pillar 5: Real IndexedDB Persistence, Migration & Zero-Loss Recovery** (10 tests)
6. **Pillar 6: Genuine Browser Cold-Restart & Storage Lifecycle Verification** (4 tests)
7. **Pillar 7: Zero Data Loss Safeguards, Event Journaling & Concurrency** (27 tests)
   - Encrypted events at rest with AES-GCM in `events_store`.
   - Fail-visibly error propagation on journal write failures.
   - Safe sequence restoration (`idbGetMaxEventSeq()`) without reset to 0 on storage error.
   - Unswallowed journal clear errors.
   - Real application actions (`logSubstance`, `resistCraving`, `addExpense`) connected to journal.
   - Real application actions rollback optimistic state and surface `persistenceError`.
   - Real application removal actions (`removeSubstance`).
   - 20-event rapid concurrent persistence without loss.

### 2. Genuine Browser Verification Suite (Real Chromium / Edge Engine)
Executed via `npm run test:browser` (`tests/real-browser-verification.js`):
1. **Real Browser Boot & Journaling**: Loads `dist/standalone.html`, performs Web Crypto key generation, and appends encrypted events to real IndexedDB on disk.
2. **Genuine Cold Restart**: Terminates the browser process completely (wipes all RAM), launches a new browser process with the exact same user data directory, and verifies 0-flash hydration, data preservation, and sequence continuity (`maxSeq=2`).
3. **Storage Failure & DOM Banner**: Simulates IndexedDB failure, verifies action rejection, state rollback, and DOM rendering of the persistence error banner.
4. **Disaster Recovery**: Simulates corrupted primary store and recovers data from rescue snapshots.
5. **Roundtrip Backup Restoration**: Full JSON backup export, complete database wipe, and JSON restoration in the live browser.

---

## 6. Directory Map & Code Structure

```
PuffinLess/
├── docs/                                           # Architecture, security audits & reviews
│   ├── ENGINEERING_ARCHITECTURE.md                 # Technical security notes
│   ├── SYSTEM_STRUCTURE_AND_CHARACTERISTICS_EN.md   # System Architecture Manual (English)
│   ├── STRUCTURE_SYSTEME_ET_CARACTERISTIQUES_FR.md # Manuel d'Architecture Système (Français)
│   └── PuffinLess_Persistent_Memory_Storage_Review_2026-11-08.pdf
├── src/
│   ├── components/                                 # UI Presentation layer
│   │   ├── MoneyView.tsx                           # High-contrast white typography Financial Center
│   │   ├── ProfileModal.tsx                        # Profile, data export, and honest recovery UI
│   │   ├── SosModal.tsx                            # 180-second craving protocol
│   │   ├── ClinicalCertificateModal.tsx           # Period-scoped medical summary
│   │   └── ...
│   ├── core/
│   │   └── obsidianCore.ts                         # Addiction metrics, clinical indicators, quotes
│   ├── state/
│   │   └── useAppStore.ts                          # Central store with sequence restoration & connected actions
│   ├── types/
│   │   └── index.ts                                # TypeScript types, journal event schema
│   └── utils/
│       ├── crypto.ts                               # Web Crypto AES-GCM, key vault, cryptoshredding
│       ├── indexedDb.ts                            # Encrypted events_store, idbGetMaxEventSeq, kv_store driver
│       ├── journal.ts                              # Safe sequence restore & projection replay engine
│       ├── recovery.ts                             # Deep multi-tier recovery engine
│       ├── storage.ts                              # FIFO queue, union merge, empty-array protection
│       ├── security.ts                             # PBKDF2 PIN hashing & exponential lockout
│       ├── clinicalMetrics.ts                      # Period-scoped calculations
│       └── dates.ts                                # Robust date formatting & parsing
├── tests/
│   ├── engineering-verification.test.js            # 57 comprehensive verification tests (100% green)
│   └── real-browser-verification.js                # Genuine Chromium/Edge cold restart & recovery suite (100% green)
└── scripts/
    └── make-standalone.js                          # Inliner & JavaScript obfuscation pipeline
```

---

## 7. Operational Policy for Future Audits & Updates

From this release forward, all engineering reviews, security audits, cryptographic assessments, and major structural changes must be systematically exported and versioned directly within the `docs/` directory of the PuffinLess repository. This guarantees long-term maintainability, full traceability, and historical auditability for users and developers alike.
