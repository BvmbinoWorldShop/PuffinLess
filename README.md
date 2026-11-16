# PuffinLess — Offline-First Multi-Substance Habit & Sobriety Companion 🌿💎

> A state-of-the-art, local-first Progressive Web App (PWA) and standalone offline tool designed to help individuals conquer nicotine, vapes, and cannabis addictions. Built with atomic event-journal persistence, zero cloud reliance, precision relapse prevention tools, and 10-year compound wealth projections.

---

## 🌟 What Sets PuffinLess Apart

Most addiction and habit-tracking apps suffer from three fundamental problems:
1. **Aggressive Monthly Subscriptions** ($49–$99/year) that profit off users' struggles.
2. **Mandatory Cloud Accounts & Data Harvesting**, exposing sensitive personal health and habit history to third-party databases, trackers, and advertisers.
3. **Cigarette-Only Focus**, completely ignoring the modern reality of nicotine disposable vapes/puffs and cannabis dependency.

**PuffinLess solves all three:**
- **Zero Cloud Database**: 100% of your personal habit logs, streak records, cravings, and financial metrics stay on your physical device.
- **Tri-Substance Precision**: Simultaneously tracks **Cigarettes**, **E-Cigarettes / Vapes / Puffs**, and **Cannabis / Weed / CBD**.
- **One-Time Lifetime Ownership**: Pay once (€19.99 lifetime access), with zero recurring fees, zero ads, and zero account signups.
- **Zero-Dependency Offline Portability**: Works as an installable PWA or as an all-in-one standalone single-file `.html` document that runs anywhere in airplane mode without internet.

---

## 🏗️ Architecture & How It's Built

PuffinLess is built on an enterprise-grade **Local-First, Event-Sourced Architecture**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION & UI LAYER                         │
│  React 19 + TypeScript • Tailwind CSS v4 • Plus Jakarta Sans & Lucide   │
│  [Dashboard]  [Money Center]  [Wellness & Sleep]  [SOS Crave]  [PDF]   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Unidirectional Actions
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          STATE MANAGEMENT                              │
│  src/state/useAppStore.ts (Reactive Zustand-style architecture)        │
│  • Optimistic UI state updates                                         │
│  • Deterministic projections calculated in memory                      │
│  • Safe error boundary & non-blocking hydration                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Atomic Persistence
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PERSISTENCE & SECURITY ENGINE                        │
│  src/storage/db.ts • src/utils/crypto.ts • src/utils/recovery.ts       │
│                                                                        │
│  1. Atomic Event Journal (IndexedDB 'events' store):                   │
│     - Monotonically increasing sequence IDs (1, 2, 3...)               │
│     - Web Locks API cross-tab coordination (`navigator.locks`)        │
│     - Fallback distributed lease lock for legacy/unsupported engines   │
│                                                                        │
│  2. Deterministic Projection Cache (IndexedDB 'projection_cache'):    │
│     - Reconciled snapshot cache for instant cold-boot startup          │
│     - Reconstructible from raw event log at any time                   │
│                                                                        │
│  3. Cryptographic Storage at Rest (Web Crypto API):                   │
│     - AES-GCM 256-bit encryption with unique 96-bit IV per write       │
│     - Non-extractable CryptoKey stored in dedicated key vault          │
│     - PBKDF2 (100,000 iterations) salted PIN screen lock               │
│     - Anti-brute-force exponential lockout protection                  │
│                                                                        │
│  4. Self-Healing Disaster Recovery:                                    │
│     - Corrupted record isolation (`decryptWithStatus`)                 │
│     - Encrypted multi-store rescue snapshot in persistent storage      │
│     - Zero-data-loss fallback during browser cache wipes or power loss │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Directory Structure

```text
PuffinLess/
├── dist/                             # Compiled production bundle & standalone HTML
│   ├── index.html                    # Minified PWA web distribution
│   ├── standalone.html               # 100% inlined single-file offline portable app
│   └── assets/                       # Chunks, CSS, and icons
├── docs/                             # Engineering specs, audits & commercial playbooks
│   ├── ENGINEERING_ARCHITECTURE.md   # Complete technical architecture specification
│   ├── COMMERCIAL_RELEASE_AUDIT_EN.md# English pre-release audit report
│   ├── AUDIT_COMMERCIAL_VERSION_FINALE_FR.md # French pre-release audit report
│   ├── MARKETING_AND_SALES_STRATEGY_EN.md    # English commercial marketing playbook
│   └── STRATEGIE_MARKETING_ET_VENTE_FR.md    # French commercial marketing playbook
├── public/                           # Static assets, PWA manifest, service worker
│   ├── fonts/                        # Self-hosted WOFF2 fonts (Plus Jakarta Sans)
│   ├── icons/                        # PWA icons (192x192, 512x512, maskable)
│   ├── manifest.json                 # Web App Manifest
│   └── sw.js                         # Offline cache service worker
├── scripts/                          # Build & developer automation scripts
│   ├── make-standalone.js            # Bundles app into a single offline HTML file
│   └── serve-website.js              # Ultra-fast local static HTTP server for website
├── src/                              # Application source code
│   ├── components/                   # Modular UI components & modals
│   │   ├── AnalyticsView.tsx         # Comprehensive recovery statistics & streak logs
│   │   ├── AppLockScreen.tsx         # Secure PIN lock screen with PBKDF2 hashing
│   │   ├── CalendarTrendCard.tsx     # Monthly habit calendar with daily metrics
│   │   ├── ClinicalCertificateModal.tsx # A4 printable sobriety audit report generator
│   │   ├── DailyRealityCard.tsx      # Daily dose countdown & financial impact card
│   │   ├── DashboardView.tsx         # Main sobriety command center & streak counter
│   │   ├── Dynamic3DIcon.tsx         # 3D habit visual icons (Cigarette, Vape, Cannabis)
│   │   ├── ErrorBoundary.tsx         # Fault-tolerant React error boundary
│   │   ├── Header.tsx                # App header with language & theme toggles
│   │   ├── MoneyView.tsx             # 10-year compound wealth & financial goals
│   │   ├── Navigation.tsx            # Bottom floating navigation bar
│   │   ├── OnboardingModal.tsx       # First-run welcome wizard & legal/privacy notice
│   │   ├── PrivacyTermsModal.tsx     # Independent Privacy Policy & Terms of Service
│   │   ├── ProfileModal.tsx          # Settings, habits config, backup export & reset
│   │   ├── PuffinLessLogo.tsx        # Official brand SVG logo
│   │   ├── RewardsView.tsx           # Achievement badges & level progression ladder
│   │   ├── SosModal.tsx              # SOS Crave Interceptor (4-7-8 breathing)
│   │   └── WellnessView.tsx          # Sleep ratings, dopamine recovery & library
│   ├── core/                         # Pure business logic & models
│   │   ├── achievements.ts           # Milestone achievement definitions
│   │   ├── levels.ts                 # Level tier ladder (Beginner, Mid, Expert)
│   │   ├── recovery.ts               # Pharmacokinetic recovery timeline models
│   │   └── substances.ts             # Cigarette, Vape, and Cannabis metrics
│   ├── state/                        # State management
│   │   └── useAppStore.ts            # Reactive store with atomic persistence hooks
│   ├── storage/                      # Persistence layer
│   │   └── db.ts                     # Multi-store IndexedDB engine & Web Locks
│   ├── utils/                        # Utilities & algorithmic helpers
│   │   ├── audio.ts                  # Haptic sound effects
│   │   ├── clinicalMetrics.ts        # Health recovery calculations
│   │   ├── crypto.ts                 # Web Crypto AES-GCM engine & KeyVault
│   │   ├── dates.ts                  # High-precision duration & calendar formatters
│   │   ├── i18n.ts                   # Bilingual EN / FR dictionary
│   │   ├── recovery.ts               # Self-healing cold-boot recovery engine
│   │   ├── security.ts               # PBKDF2 PIN hashing & lockout logic
│   │   └── storage.ts                # Storage adapters & JSON backup exporter
│   ├── App.tsx                       # Root application component
│   ├── index.css                     # Tailwind CSS v4 styling & dark obsidian theme
│   └── main.tsx                      # Application bootstrap entry point
├── tests/                            # Automated verification test suites
│   ├── engineering-verification.test.js # 71 unit & persistence integrity tests
│   └── real-browser-verification.js     # End-to-end real browser CDP test suite
├── website/                          # Commercial sales landing page
│   └── index.html                    # High-converting bilingual sales landing page
├── package.json                      # Dependencies and npm scripts
├── tsconfig.json                     # TypeScript strict configuration
└── vite.config.ts                    # Vite build configuration
```

---

## ✨ Key Features & Capabilities

### 1. 🇫🇷 & 🇬🇧 100% Instant Bilingual Experience
- Seamless real-time language switcher (French & English) across all screens.
- Fully translated scientific studies, ACT/CBT psychological coaching tips, motivational masterclasses, and PDF reports.

### 2. 🛡️ SOS Crave Interceptor
- When acute urges hit, 1 tap launches the guided **4-7-8 breathing pacer** (inhale 4s, hold 7s, exhale 8s) to stimulate the vagus nerve and down-regulate cortisol.
- **5-4-3-2-1 Sensory Grounding**: Step-by-step cognitive disengagement protocol.
- **Craving Mastery Tracker**: Records every resisted crave as an active psychological victory.

### 3. 📅 Sobriety Calendar & Habit Trends
- Monthly calendar visualizing clean days (emerald checkmarks), slip days (dose counters), and cravings conquered.
- Clickable day cards detailing recorded triggers (Stress, Social, After Meal, Alcohol) paired with personalized micro-coaching advice.
- Daily Sleep Quality (1-10) and Energy Rating (1-10) tracking to prove tangible physical recovery over time.

### 4. 💎 Money Center & 10-Year Compounding Wealth
- Real-time calculations of money preserved vs. burned on smoking accessories.
- **10-Year Compound Wealth Horizon**: Calculates what saved funds would grow into if invested at a standard 7% annual yield (often exceeding €65,000+).
- Custom personal reward goals funded directly from avoided smoke expenditures.

### 5. 📄 Personal Sobriety & Habit Audit (Printable A4 PDF)
- Generates an in-browser, high-resolution A4 printable report with official verification seals.
- Summarizes sobriety duration, doses avoided, financial savings, and cellular health progress milestones.
- Tabulated intake logs with recorded triggers and corrective actions.

### 6. 🔒 Non-Medical Habit Companion Notice
- PuffinLess is built strictly as a personal habit tracker and self-monitoring companion.
- It does **not** provide medical diagnoses, treatment, or clinical prescriptions. Clear health disclaimers are present in the onboarding flow, settings, and generated reports.

---

## 🧪 Testing & Verification

PuffinLess is backed by a comprehensive automated test harness:

```bash
# Run unit & persistence verification tests (71 tests across 8 pillars)
npm run test:unit

# Run full test suite including real-browser CDP verification
npm test

# Run code linter
npm run lint

# Compile production bundle and generate standalone single-file HTML
npm run build
```

### Verified Engineering Pillars:
1. **Pillar 1**: AES-GCM via Non-Extractable CryptoKey & IndexedDB KeyVault.
2. **Pillar 2**: PIN Hashing with PBKDF2 (100k iter) & Irreversible Data Shredding.
3. **Pillar 3**: Period-Scoped Statistics & Strict Time-Window Precision.
4. **Pillar 4**: Session Security, Standby vs. Cold-Restart Differentiation.
5. **Pillar 5**: Real IndexedDB Persistence, Migration & Zero-Loss Recovery.
6. **Pillar 6**: Genuine Browser Cold-Restart & Storage Lifecycle Verification.
7. **Pillar 7**: Zero Data Loss Safeguards, Multi-Tab Atomic Writes & Web Locks.
8. **Pillar 8**: Discrete Event-Journal Replay & Rescue Snapshot Fallback.

---

## 🚀 Commercial Landing Page & Website

A high-converting, responsive landing page is included in the `website/` folder:
- **Interactive 10-Year Wealth Slider**: Real-time slider calculating monthly expense, annual loss, and 10-year compounding return.
- **Interactive App Showcase**: Live previews of the Sobriety Dashboard, Calendar & Metrics, SOS Crave Interceptor, and Exported PDF Report.
- **Instant Language Toggle**: English 🇬🇧 and French 🇫🇷 translations with zero latency.
- **Local Development Server**:
  ```bash
  npm run serve:website
  # Serves website at http://localhost:4180
  ```

---

## 💻 Local Development & Build

```bash
# 1. Install dependencies
npm install

# 2. Run Vite dev server for main application
npm run dev

# 3. Build production web bundle + standalone single-file HTML
npm run build
# Output files:
#   dist/index.html      -> PWA distribution
#   dist/standalone.html -> Inlined single-file offline portable app

# 4. Preview commercial sales website
npm run serve:website
```

---

## 📜 License & Intellectual Property

© 2026 PuffinLess. All rights reserved. Commercial application proprietary code.
