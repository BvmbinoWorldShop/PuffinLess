# Puff Less — Premium Quitting Companion & Wealth Vault 🌿💎

> A translucent-morphic mobile app designed to help smokers track their habits, reclaim their physical vitality, compound their savings, and conquer cravings with science-backed neuro-tools.

---

## ✨ Features Overview

### 1. 💎 Translucent Morphic Luxury Design
- **Frosted Glassmorphism**: Deep obsidian-emerald backdrop (`radial-gradient`), layered glass surfaces (`backdrop-blur-xl`), metallic bevels, and subtle rim highlights.
- **Cross-Platform Responsive**: Native mobile layout with an integrated **Mobile Device Preview Frame** (simulating dynamic island, status bar, and curved chassis) or responsive full-screen desktop view.
- **Haptic & Meditative Audio**: Built-in Web Audio API sound generator providing subtle tactile click sounds, celebratory milestone chimes, and calming inhale/exhale meditation tones.

### 2. 🚀 3-Step Guided Onboarding
- **Step 1: Introduction**: High-aesthetic morphic showcase detailing cellular healing, the wealth vault, 3-minute SOS crave defense, and prestige trophies.
- **Step 2: Habit Baseline**: Configure cigarettes smoked per day, cost per pack, currency symbol, quit date, and primary motivators with instant 1-year wealth forecast.
- **Step 3: Interactive Quitting Arsenal**: Hands-on tutorial on navigating the emergency tools and rewards system with celebration confetti.

### 3. ⏱️ Real-Time Smoke-Free Tracker & Cellular Healing
- **Digital Clean Breath Clock**: Days, hours, minutes, and seconds elapsed since quitting or tapering.
- **Avoided Cigarettes & Regained Life**: Medical computation (+11 minutes of biological life reclaimed per cigarette avoided).
- **WHO & CDC Regeneration Milestones**:
  - `20 Minutes`: Pulse & vascular blood pressure normalization
  - `8 Hours`: 50% Carbon monoxide clearance & oxygen saturation
  - `24 Hours`: Cardiac infarction risk reduction & debris expulsion
  - `48 Hours`: Nerve ending regrowth, enhanced taste & smell
  - `72 Hours`: Bronchial muscle relaxation & increased lung capacity
  - `2 Weeks`: Peripheral circulation & physical stamina surge
  - `1 Month`: Cilia reactivation in airways & immunity boost
  - `3 Months`: +10% Lung capacity gain & wheeze reduction
  - `1 Year`: Coronary artery disease excess risk cut by 50%

### 4. 💰 Wealth Vault & Dream Wishlist Goals
- **Compound Forecasts**: Visual projections across 1 week, 1 month, 6 months, 1 year, and 5 years.
- **Interactive Wishlists**: Assign goals (Apple Watch Ultra, Weekend Alpine Retreat, Michelin Dining, Headphones) that automatically fill with progress bars funded by unburned cigarette money.
- **Goal Completion**: Confetti celebration when a dream goal reaches 100% funding.

### 5. 🧘 Neuro-Breathing Studio & Wellness Center
- **3 Guided Breathing Modes**:
  - **4-7-8 Tranquility**: Inhale 4s, Hold 7s, Exhale 8s (activates parasympathetic brake).
  - **Box Breathing 4-4-4-4**: Inhale 4s, Hold 4s, Exhale 4s, Pause 4s (Navy SEAL composure protocol).
  - **Resonant 5.5s Flow**: Heart Rate Variability (HRV) optimization.
- **Daily Mindset Sparks**: Curated quote deck with bookmarking and one-click share/copy.
- **Science of Recovery Articles**: In-depth medical breakdowns on dopamine reset, the 3-minute craving bell curve, and alveolar repair.

### 6. 🚨 SOS Crave Interceptor (Emergency Button)
- Available at all times via the glowing top-right header button.
- **Immediate 3-Minute Neutralizer**: 4-7-8 breathing circle with audio cues.
- **5-4-3-2-1 Sensory Grounding**: Breaks obsessive loop by engaging physical senses.
- **Reality Check**: Real-time reminder of money saved and timer preservation.
- **"I Resisted This Craving!"**: Logs victory to craving history with +50 XP and celebration confetti.

### 7. 🏆 Prestige Trophy Hall & VIP Discounts
- **Trophy System**: Bronze, Silver, Gold, Platinum, and Diamond tiers for time, money, and craving milestones.
- **VIP Partner Perks**: Exclusive discount codes (smart wearable rebates, gym memberships, mindfulness subscriptions) unlocked automatically as milestones are achieved.

### 8. 💬 The Smoke-Free Tribe (Community Forum)
- Filter posts by `#Milestone`, `#SOS Help`, `#Advice`, `#Wins`.
- Author cards showing current smoke-free day count.
- Interactive support hearts and custom post publishing.

---

## 🛠️ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Build for production
npm run build
```

---

## 📱 Packaging for iOS and Android (Capacitor)

To compile this project into native iOS (.ipa) and Android (.apk / .aab) apps:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Puff Less" "com.puffinless.app" --web-dir "dist"
npm run build
npx cap add ios
npx cap add android
npx cap copy
npx cap open android # or npx cap open ios
```
