# PuffinLess — Elite Habit Tracker, Addiction Recovery & Wealth Vault 🌿💎

> A state-of-the-art translucent-morphic Progressive Web App (PWA) designed to help smokers and vapers master their neurochemistry, track multi-substance consumption (Cigarettes, Puffs / Vapes, Cannabis), compound their financial savings, and permanently overcome cravings.

---

## ✨ Features Overview

### 1. 🇫🇷 & 🇺🇸 100% Instant Bilingual Experience
- **One-Tap Language Toggle**: Prominently situated at the top right header right next to the CRAVING button.
- **Deep Translation Across 100% of Content**:
  - 30 Motivational & Philosophical Quotes
  - 23 Peer-Reviewed Clinical Studies (Lancet, BMJ, JAMA, Nature)
  - 17 Curated Recovery Resources, Books & 24/7 Crisis Helplines
  - 9 Myth vs. Fact breakdowns
  - Complete Nicotine & Cannabis withdrawal recovery timelines
  - 11 Psychology & Neurobiology Masterclasses
  - Level ladders (Débutant, Intermédiaire, Expert) and tier badges

### 2. 🧠 Obsidian Intelligence Core
- **Adaptive Recovery Engine**: Continuously synthesizes user clean-time streaks, cravings resisted, and multi-substance intake.
- **Personalized Daily Coaching**: Dynamic headline, status chips, and contextual advice tailored to current recovery stage and emotional state.
- **Substance Science & Cellular Breakdown**: Rigorous pharmacokinetic impact models for Cigarettes (Tar, Carbon Monoxide), Puffs (Freebase/Salt Nicotine, Formaldehyde), and Cannabis (THC down-regulation, REM suppression).

### 3. 🚬 Multi-Substance & Situational Trigger Tracking
- **Granular Logging**: Add single or custom counts of **Cigarettes**, **Puffs / Vapes**, or **Cannabis joints / bowls**.
- **Context & Motivations**: Record exact situational triggers (Stress, Habit / Routine, After Meal, Social / Party, Boredom, Alcohol pairing).
- **Auto Clean-Breath Reset**: Logging a slip automatically resets the Clean Breath timer and calculates life regained/lost.

### 4. 💰 Money & Financial Impact Vault
- **Detailed Spending Breakdown**: Track expenditures on packs, vapes, papers, lighters, herbs, and accessories.
- **Comparative Wealth Projections**: 1 week, 1 month, 6 months, 1 year, and 5 years compounding.
- **Interactive Dream Goals**: Automatically allocates unspent smoke money towards funding personal rewards (Apple Watch Ultra, Alpine Retreat, etc.).

### 5. 🛌 Sleep Quality, Energy Ratings & Weekly Trends
- Daily rating for sleep (1-10) and energy levels (1-10).
- 7-day trend chart with multi-substance bar comparisons demonstrating how smoking directly suppresses sleep quality and stamina.

### 6. 🔐 Local-First Privacy, Cryptographic Vault & AES-GCM Web Crypto Architecture
- **Non-Extractable CryptoKey Stored in IndexedDB KeyVault**: Encryption keys use native `CryptoKey` with `extractable: false`, stored in a dedicated IndexedDB vault (`puffinless_key_vault`). No raw key bytes are ever stored in `localStorage`.
- **AES-GCM 256-bit Authenticated Encryption**: Powered by the native browser Web Crypto API (`crypto.subtle`) with dynamic 96-bit (12-byte) IV per write (`crypto.getRandomValues(new Uint8Array(12))`).
- **Cryptographic Key Derivation (PBKDF2 600,000 Iterations)**: Supports custom passphrase vault protection deriving non-extractable AES-GCM keys via PBKDF2-HMAC-SHA256 with random salt.
- **PIN Screen Lock Hashing (PBKDF2 100,000 Iterations)**: Replaced basic SHA-256 with salted PBKDF2 hashing for UI screen lock with anti-brute-force exponential lockout.
- **Separation of Concerns**: Strict architectural separation between UI Screen Lock (presentation access) and Cryptographic Vault Unlock (data decryption).
- **Explicit Error Separation**: Strict distinction between data absence (`status: 'absent'`) and cryptographic decryption failures (`DecryptionError`), preventing silent data overwrites.
- **100% Self-Hosted Local Fonts**: Bundled local WOFF2 fonts (`Plus Jakarta Sans` & `Space Grotesk`) with zero external network requests to third-party CDNs.
- **Cryptoshredding & Confirmed Storage Erasure (GDPR Art. 17)**: One-click erase awaits confirmed physical deletion of IndexedDB databases, deletes non-extractable keys, purges PIN credentials, and wipes browser storage.
- **Fail-Fast Persistence**: All storage and deletion operations explicitly bubble up errors upon quota or transaction failures instead of masking errors.
- **Direct Production Component Testing**: 11 automated tests (`npm test`) execute production modules directly (`src/utils/clinicalMetrics.ts`, `src/utils/crypto.ts`, `src/utils/storage.ts`, `src/utils/security.ts`).

### 7. 📱 PWA Ready (Progressive Web App)
- **Installable on iOS & Android**:
  - **iOS Safari**: Tap **Share** -> **Add to Home Screen**
  - **Android Chrome**: Tap the install banner or **Menu** -> **Install App**
- **Offline & Cache-Optimized**: Custom Service Worker (`sw.js`) and Web App Manifest (`manifest.json`) with standard 192x192 & 512x512 icons and vector maskable icons.
- **Ultra-fast Loading**: Pre-cached shell with Stale-While-Revalidate asset updates.

---

## 🚀 How to Deploy

### Option 1: 1-Click Deployment to Vercel (Recommended)
1. Push this repository to your GitHub account:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/PuffinLess.git
   git branch -M main
   git push -u origin main
   ```
2. Open [Vercel New Project](https://vercel.com/new).
3. Import the `PuffinLess` repository.
4. Click **Deploy**. Vercel will automatically detect `vite` and the pre-configured `vercel.json` and deploy in less than 30 seconds!

Or deploy directly with the Vercel CLI:
```bash
npx vercel
```

### Option 2: Automatic Deployment to GitHub Pages
A fully automated GitHub Actions workflow is included at `.github/workflows/deploy.yml`:
1. Push your repository to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/PuffinLess.git
   git branch -M main
   git push -u origin main
   ```
2. In your GitHub repository, go to **Settings** -> **Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. The workflow will automatically build and publish your app at:
   `https://YOUR_USERNAME.github.io/PuffinLess/`

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run lint audit
npm run lint

# Run automated engineering & encryption test suite
npm test

# Compile production build
npm run build
```

---

## 📱 Native App Packaging (Capacitor for iOS & Android)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "PuffinLess" "com.puffinless.app" --web-dir "dist"
npm run build
npx cap add ios
npx cap add android
npx cap copy
npx cap open android # or npx cap open ios
```
