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

### 6. 🔐 Zero-Knowledge Security & AES-GCM Web Crypto Architecture
- **AES-GCM 256-bit Authenticated Encryption**: Powered by the native browser Web Crypto API (`crypto.subtle`) for high-speed, hardware-accelerated local encryption.
- **Unique 96-bit IV per Encryption**: Every single save operation generates a cryptographically random 12-byte IV (`crypto.getRandomValues(new Uint8Array(12))`), ensuring ciphertexts never repeat even for identical data.
- **Explicit Key Management**: True random 256-bit device vault key (`puffinless_vault_key_v2`). All deterministic key fallbacks have been eliminated for new encryptions.
- **Seamless Legacy Migration**: Seamless backward compatibility for older AES-CBC (`aes256:`) payloads with zero data loss.
- **Physical Cryptoshredding & Total Erasure (GDPR Art. 17)**: One-click "Erase All My Data" permanently deletes the IndexedDB database (`indexedDB.deleteDatabase`), shreds encryption vault keys, purges PIN credentials, and wipes all storage (`localStorage.clear()` / `sessionStorage.clear()`).
- **Strictly Scoped Period Statistics**: Daily, weekly, and monthly reports filter metrics strictly within their timeframe with zero lifetime data contamination.
- **100% User-Logged Empirical Metrics**: No simulated or fake physiological gauges (e.g. hypothetical lung cilia or dopamine bars); replaced with genuine user-entered craving mastery, tracking regularity, self-reported sleep, and vitality scores.
- **WCAG Accessibility & Screen Reader Ready**: Fully equipped with accessible modal dialogs (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`), `role="tablist"` navigation, and explicit `aria-label` controls.

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
