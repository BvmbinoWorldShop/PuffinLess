import React, { useState } from 'react';
import {
  ArrowRight, Check, Heart, Shield, DollarSign, Clock, Wind, Award, Zap,
  Leaf, Target, BarChart2, X, RefreshCw, Lock, FileText, Download, AlertTriangle, Database
} from 'lucide-react';
import type { UserProfile, QuitMode, Language, QuitGoal } from '../types';
import { PuffinLessLogo } from './PuffinLessLogo';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  isOpen: boolean;
  initialProfile: UserProfile;
  initialStep?: number;
  onComplete: (profile: UserProfile) => void;
  onClose?: () => void;
  onRecover?: () => Promise<any>;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  initialProfile,
  initialStep = 1,
  onComplete,
  onClose,
  onRecover,
}) => {
  const [lang, setLang] = useState<Language>(initialProfile.language || 'en');
  const isFr = lang === 'fr';

  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = useState<string | null>(null);

  // If user has already onboarded, clicking "Guide" shows the 4 guide parts: Welcome, Arsenal, Privacy/Terms/Disclaimer, Mobile PWA
  const isGuideMode = Boolean(initialProfile.isOnboarded);
  const totalSteps = isGuideMode ? 4 : 5;

  const [step, setStep] = useState<number>(() => {
    if (isGuideMode) {
      if (initialStep === 5) return 4; // PWA step in guide mode is 4
      if (initialStep === 4) return 4; // Direct PWA request
      if (initialStep === 3) return 3; // Direct Legal & Privacy request
      return Math.min(initialStep, 4);
    }
    return Math.min(initialStep, 5);
  });

  const [pwaPlatform, setPwaPlatform] = useState<'ios' | 'android'>('ios');
  const [name, setName] = useState(initialProfile.name || '');
  const [quitGoal, setQuitGoal] = useState<QuitGoal>(initialProfile.quitGoal || 'want_to_quit');

  // Baseline quantities always start blank unless user has explicit non-zero data
  const [cigsPerDay, setCigsPerDay] = useState<number | ''>(
    initialProfile.cigarettesPerDay ? initialProfile.cigarettesPerDay : ''
  );
  const [puffsPerDay, setPuffsPerDay] = useState<number | ''>(
    initialProfile.puffsPerDay ? initialProfile.puffsPerDay : ''
  );
  const [cannabisGrams, setCannabisGrams] = useState<number | ''>(
    initialProfile.cannabisGramsPerWeek ? initialProfile.cannabisGramsPerWeek : ''
  );
  const [pricePerPack, setPricePerPack] = useState<number | ''>(
    initialProfile.pricePerPack ? initialProfile.pricePerPack : ''
  );
  const [cigsInPack] = useState(initialProfile.cigarettesInPack || 20);
  const [currency, setCurrency] = useState(initialProfile.currency || '€');
  const [quitMode] = useState<QuitMode>(initialProfile.quitMode || 'cold_turkey');
  const [quitDateChoice, setQuitDateChoice] = useState<'today' | 'yesterday' | 'few_days_ago'>('today');
  const [selectedMotivators, setSelectedMotivators] = useState<string[]>(
    initialProfile.motivators.length > 0
      ? initialProfile.motivators
      : ['Health & Longevity', 'Financial Freedom', 'Deep Restorative Sleep', 'Unshakable Mindset']
  );

  if (!isOpen) return null;

  const MOTIVATOR_OPTIONS = [
    { labelEn: 'Health & Longevity', labelFr: 'Santé & Longévité', icon: Heart },
    { labelEn: 'Financial Freedom', labelFr: 'Liberté Financière', icon: DollarSign },
    { labelEn: 'Deep Restorative Sleep', labelFr: 'Sommeil Réparateur', icon: Clock },
    { labelEn: 'Loved Ones & Family', labelFr: 'Famille & Proches', icon: Shield },
    { labelEn: 'Athletic Stamina', labelFr: 'Souffle & Cardio', icon: Wind },
    { labelEn: 'Clean Dopamine Focus', labelFr: 'Dopamine Saine & Clarté', icon: Zap },
  ];

  const handleRecover = async () => {
    if (!onRecover) return;
    setIsRecovering(true);
    setRecoveryFeedback(null);
    try {
      sound.playClick();
      const res = await onRecover();
      if (res && res.recovered) {
        sound.playCelebration();
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
        setRecoveryFeedback(
          isFr
            ? `✓ Données retrouvées : ${res.stats?.daysSinceQuit || 0} jour(s) d'abstinence et ${res.stats?.cravingsCount || 0} victoires restaurées !`
            : `✓ Data restored: ${res.stats?.daysSinceQuit || 0} day(s) smoke-free and ${res.stats?.cravingsCount || 0} victories recovered!`
        );
        setTimeout(() => {
          if (res.profile) {
            onComplete(res.profile);
          }
          if (onClose) {
            onClose();
          }
        }, 700);
      } else {
        setRecoveryFeedback(
          isFr
            ? 'Aucune donnée antérieure détectée sur cet appareil.'
            : 'No prior data detected on this device.'
        );
      }
    } catch (err) {
      console.error('[Onboarding] Recovery error:', err);
      setRecoveryFeedback(
        isFr ? 'Erreur lors de la récupération.' : 'Recovery attempt failed.'
      );
    } finally {
      setIsRecovering(false);
    }
  };

  const handleNextStep = () => {
    sound.playClick();
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      if (isGuideMode) {
        // Guide mode completed, simply close
        sound.playCelebration();
        if (onClose) {
          onClose();
        } else {
          onComplete(initialProfile);
        }
        return;
      }

      // Initial first-time onboarding completion
      const dateObj = new Date();
      if (quitDateChoice === 'yesterday') {
        dateObj.setDate(dateObj.getDate() - 1);
      } else if (quitDateChoice === 'few_days_ago') {
        dateObj.setDate(dateObj.getDate() - 3);
      }

      const updated: UserProfile = {
        ...initialProfile,
        name: name.trim() || 'Champion',
        language: lang,
        quitGoal,
        cigarettesPerDay: Number(cigsPerDay) || 0,
        puffsPerDay: Number(puffsPerDay) || 0,
        cannabisGramsPerWeek: Number(cannabisGrams) || 0,
        pricePerPack: Number(pricePerPack) || 12,
        cigarettesInPack: Number(cigsInPack) || 20,
        currency,
        quitMode,
        quitDate: quitGoal === 'just_tracking' ? new Date().toISOString() : dateObj.toISOString(),
        motivators: selectedMotivators,
        isOnboarded: true,
      };

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
      sound.playCelebration();
      onComplete(updated);
    }
  };

  const toggleMotivator = (item: string) => {
    sound.playClick();
    if (selectedMotivators.includes(item)) {
      setSelectedMotivators(selectedMotivators.filter(m => m !== item));
    } else {
      setSelectedMotivators([...selectedMotivators, item]);
    }
  };

  const numCigs = Number(cigsPerDay) || 0;
  const numCannabis = Number(cannabisGrams) || 0;
  const costPerCig = cigsInPack > 0 && pricePerPack ? Number(pricePerPack) / cigsInPack : 0.6;
  const estimatedYearlyCost = (numCigs * costPerCig * 365 + (numCannabis * 52 * 12)).toFixed(0);

  // In Guide Mode: Step 1 = Welcome, Step 2 = Arsenal, Step 3 = Privacy & Legal, Step 4 = PWA
  // In Onboarding: Step 1 = Welcome, Step 2 = Baseline Habits, Step 3 = Arsenal, Step 4 = Privacy & Legal, Step 5 = PWA
  const isWelcomeStep = step === 1;
  const isBaselineStep = !isGuideMode && step === 2;
  const isArsenalStep = (isGuideMode && step === 2) || (!isGuideMode && step === 3);
  const isLegalPrivacyStep = (isGuideMode && step === 3) || (!isGuideMode && step === 4);
  const isPwaStep = (isGuideMode && step === 4) || (!isGuideMode && step === 5);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isFr ? 'Guide de démarrage PuffinLess' : 'PuffinLess Onboarding Guide'}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-2xl p-3 sm:p-6 flex items-center justify-center min-h-screen"
    >
      <div className="guide-modal relative w-full max-w-lg rounded-3xl glass-panel-elevated border border-white/15 shadow-2xl shadow-emerald-950/40 text-left my-auto max-h-[92vh] flex flex-col overflow-hidden">
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* FIXED HEADER: Step Indicator & Language Flags Switcher & Close button */}
        <div className="p-4 sm:p-6 pb-3 border-b border-white/10 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => {
              const s = idx + 1;
              return (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step
                      ? 'w-8 bg-gradient-to-r from-emerald-400 to-teal-400 shadow-sm shadow-emerald-400/50'
                      : s < step
                      ? 'w-3.5 bg-emerald-500/60'
                      : 'w-3.5 bg-white/10'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* 🇫🇷 / 🇬🇧 Language Toggle */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-900/80 border border-white/15 text-xs">
              <button
                type="button"
                onClick={() => { sound.playClick(); setLang('fr'); }}
                className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  isFr ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-200 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇫🇷</span>
                <span className="text-[10px]">FR</span>
              </button>
              <button
                type="button"
                onClick={() => { sound.playClick(); setLang('en'); }}
                className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  !isFr ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-200 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇬🇧</span>
                <span className="text-[10px]">EN</span>
              </button>
            </div>

            <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
              {isFr ? `Étape ${step} sur ${totalSteps}` : `Step ${step} of ${totalSteps}`}
            </span>

            {onClose && (
              <button
                type="button"
                onClick={() => { sound.playClick(); onClose(); }}
                className="w-7 h-7 rounded-full glass-button flex items-center justify-center text-slate-400 hover:text-white shrink-0 ml-1 cursor-pointer"
                aria-label={isFr ? 'Fermer le guide' : 'Close guide'}
                title={isFr ? 'Fermer' : 'Close'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* SCROLLABLE BODY: Allows smooth full scrolling without trapped bounds */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain space-y-4">
          {/* STEP 1: Welcome & PuffinLess Showcase */}
          {isWelcomeStep && (
            <div className="space-y-5">
              <div className="flex justify-center">
                <PuffinLessLogo size={64} className="shadow-2xl shadow-emerald-500/30" />
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white guide-main-heading">
                  {isFr ? 'Bienvenue sur PuffinLess' : 'Welcome to PuffinLess'}
                </h2>
                <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {isFr
                    ? 'Votre sanctuaire d\'élite pour vaincre la cigarette, la vape et le cannabis. Retrouvez un sommeil profond, des poumons propres et une vraie richesse.'
                    : 'The ultimate companion to conquer cigarettes, vapes/puffs, and weed. Reclaim deep sleep, clean lungs, and compounded wealth.'}
                </p>
              </div>

              {/* Mode Récupération Banner: 1-click restore for existing device data */}
              {onRecover && !isGuideMode && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/60 border border-emerald-500/40 shadow-lg space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block">
                          {isFr ? 'Déjà sur PuffinLess sur cet appareil ?' : 'Already on PuffinLess on this device?'}
                        </span>
                        <span className="text-[11px] text-slate-300 block">
                          {isFr ? 'Restaurer instantanément vos jours d\'abstinence et historique sauvegardés' : 'Instantly restore your streak days and history saved on device'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        type="button"
                        disabled={isRecovering}
                        onClick={handleRecover}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRecovering ? 'animate-spin' : ''}`} />
                        <span>{isRecovering ? (isFr ? 'Scan...' : 'Scanning...') : (isFr ? 'Restaurer mes données' : 'Restore Data')}</span>
                      </button>
                    </div>
                  </div>
                  {recoveryFeedback && (
                    <div
                      className={`p-2 rounded-xl text-[11px] font-semibold ${
                        recoveryFeedback.startsWith('✓')
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border border-white/10'
                      }`}
                    >
                      {recoveryFeedback}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      {isFr ? 'Compteurs de Sobriété' : 'Substance Counters'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {isFr ? 'Suivi en direct du temps sans fumer et de la récupération de vos organes.' : 'Track cigarettes, puffs, & weed with live clinical body impact.'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      {isFr ? 'Coffre-Fort & Projets' : 'The Money Vault'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {isFr ? 'Mesurez l\'argent économisé et financez vos projets de rêve.' : 'Log papers, lighters, weed, packs, and watch unspent money grow.'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      {isFr ? 'Sommeil & Énergie' : 'Sleep & Energy Ratings'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {isFr ? 'Analysez comment chaque journée propre restaure votre énergie vitale.' : 'Analyze how clean days dramatically restore your REM sleep & stamina.'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      {isFr ? 'Masterclasses & Mental' : 'Psychology Masterclasses'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {isFr ? 'Comprenez les circuits de dopamine et apprenez à surfer sur les envies.' : 'Learn why dopamine hijacks willpower and how to surf urges.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 (First-time Onboarding only): Baseline Habits starting BLANK */}
          {isBaselineStep && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {isFr ? 'Votre Profil de Consommation' : 'Your Substance Baseline'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isFr
                    ? 'Indiquez vos habitudes actuelles pour que PuffinLess calcule précisément vos progrès.'
                    : 'Tell us your current smoking/vaping habits so PuffinLess can calculate your exact recovery.'}
                </p>
              </div>

              <div className="space-y-3">
                {/* Objective Selector */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1.5">
                    🎯 {isFr ? 'Quel est votre objectif principal ?' : 'What is your main goal?'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'want_to_quit' as QuitGoal, labelFr: 'Je veux arrêter', labelEn: 'Want to quit', icon: Target },
                      { id: 'already_quit' as QuitGoal, labelFr: 'Déjà arrêté', labelEn: 'Already quit', icon: Shield },
                      { id: 'just_tracking' as QuitGoal, labelFr: 'Suivi simple', labelEn: 'Just tracking', icon: BarChart2 },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setQuitGoal(g.id);
                        }}
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                          quitGoal === g.id
                            ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-sm'
                            : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <g.icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">{isFr ? g.labelFr : g.labelEn}</span>
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between px-1">
                    <span>{isFr ? 'Point de départ enregistré :' : 'Recorded start point:'}</span>
                    <span className="text-emerald-400 font-bold">
                      {quitDateChoice === 'today'
                        ? (isFr ? "Aujourd'hui (démarrage immédiat)" : 'Today (immediate start)')
                        : quitDateChoice === 'yesterday'
                        ? (isFr ? 'Hier (-24h)' : 'Yesterday (-24h)')
                        : (isFr ? 'Il y a 3 jours (-72h)' : '3 days ago (-72h)')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isFr ? 'Votre prénom ou pseudo' : 'Your Name'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isFr ? 'ex: Thomas' : 'e.g. Alex'}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      {isFr ? 'Devise' : 'Currency'}
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="€">€ EUR</option>
                      <option value="$">$ USD</option>
                      <option value="£">£ GBP</option>
                      <option value="CHF">CHF</option>
                      <option value="C$">C$ CAD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      {isFr ? 'Cigarettes / J' : 'Cigs / Day'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cigsPerDay}
                      onChange={(e) => setCigsPerDay(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      {isFr ? 'Prix paquet' : 'Pack Price'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={pricePerPack}
                      onChange={(e) => setPricePerPack(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="12.5"
                      className="w-full px-2 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      {isFr ? 'Bouffées Vape / J' : 'Vape Puffs / Day'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={puffsPerDay}
                      onChange={(e) => setPuffsPerDay(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      {isFr ? 'Cannabis / CBD (g/sem)' : 'Cannabis/CBD (g/wk)'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={cannabisGrams}
                      onChange={(e) => setCannabisGrams(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  ℹ️ {isFr
                    ? 'Tous les champs débutent vierges. Ces repères servent uniquement à estimer vos économies sans ajouter de consommation.'
                    : 'All inputs start blank. This baseline is only used to project savings without adding logged intake.'}
                </p>

                {/* Quit Date Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {isFr ? 'Quand avez-vous fumé pour la dernière fois ?' : 'When did your smoke-free journey start?'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'today', labelEn: 'Today', labelFr: "Aujourd'hui" },
                      { id: 'yesterday', labelEn: 'Yesterday', labelFr: 'Hier' },
                      { id: 'few_days_ago', labelEn: '3 Days Ago', labelFr: 'Il y a 3 jours' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setQuitDateChoice(opt.id as any)}
                        className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                          quitDateChoice === opt.id
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/50 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isFr ? opt.labelFr : opt.labelEn}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between px-1">
                    <span>{isFr ? 'Point de départ enregistré :' : 'Recorded start point:'}</span>
                    <span className="text-emerald-400 font-bold">
                      {quitDateChoice === 'today'
                        ? (isFr ? "Aujourd'hui (démarrage immédiat)" : 'Today (immediate start)')
                        : quitDateChoice === 'yesterday'
                        ? (isFr ? 'Hier (-24h)' : 'Yesterday (-24h)')
                        : (isFr ? 'Il y a 3 jours (-72h)' : '3 days ago (-72h)')}
                    </span>
                  </div>
                </div>

                {/* Wealth Projection Banner */}
                {Number(estimatedYearlyCost) > 0 && (
                  <div className="p-3 rounded-2xl glass-panel-gold border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold block">
                        {isFr ? 'Gain Financier Estimé sur 1 An' : 'Estimated 1-Year Wealth Gain'}
                      </span>
                      <p className="text-xl font-extrabold text-amber-200">
                        {currency}{Number(estimatedYearlyCost).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-amber-200/80 max-w-[140px]">
                      {isFr ? 'À investir dans vos vrais projets plutôt que de le brûler.' : 'Ready to invest in your goals rather than burning it away.'}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {isFr ? 'Quelles sont vos motivations prioritaires ?' : 'What matters most to you?'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOTIVATOR_OPTIONS.map((m) => {
                      const label = isFr ? m.labelFr : m.labelEn;
                      const isSelected = selectedMotivators.includes(m.labelEn) || selectedMotivators.includes(m.labelFr);
                      return (
                        <button
                          key={m.labelEn}
                          type="button"
                          onClick={() => toggleMotivator(m.labelEn)}
                          className={`px-3 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                            isSelected
                              ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200 shadow-sm'
                              : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ARSENAL PART: PuffinLess Arsenal, Military-Grade Privacy, and Sobriety Timer Rule */}
          {isArsenalStep && (
            <div className="space-y-3.5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {isFr ? 'Votre Arsenal PuffinLess est Prêt' : 'Your PuffinLess Arsenal is Primed'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isFr ? 'Découvrez les outils cliniques conçus pour protéger votre décision 24h/24.' : 'Here is how PuffinLess protects your commitment 24/7.'}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl glass-panel-emerald border border-emerald-500/30 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      {isFr ? 'Le Bouton SOS Pulsion' : 'The SOS Button'}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {isFr
                        ? 'Respiration 4-7-8 d\'urgence et ancrage sensoriel en 1 clic pour désamorcer les pulsions vives en moins de 3 minutes.'
                        : '1-tap emergency 4-7-8 breathing & 5-4-3-2-1 sensory grounding to collapse acute craving waves.'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl glass-panel-gold border border-amber-500/30 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      {isFr ? 'Le Centre Financier & Économies' : 'The Money Center'}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {isFr
                        ? 'Suivi précis des dépenses et projection de votre capital préservé sur 10 ans.'
                        : 'Log purchases of papers, lighters, weed, and cigarettes to see the 10-year compound loss vs. money saved.'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      {isFr ? 'Neurobiologie & Sommeil' : 'Psychology & Sleep Trends'}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {isFr
                        ? 'Découvrez comment vos récepteurs de dopamine se réparent et boostent votre sommeil réparateur.'
                        : 'Study the neurochemistry of cravings and see how clean days boost your deep sleep scores.'}
                    </p>
                  </div>
                </div>

                {/* Confidentialité & Protection de type militaire */}
                <div className="p-3.5 rounded-2xl glass-panel border border-teal-500/30 bg-teal-950/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-teal-200 flex items-center gap-1.5">
                      <span>{isFr ? 'Confidentialité Client & Protection Militaire' : 'Client Privacy & Military-Grade Protection'}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-teal-500/30 text-teal-200 font-bold">100% Local</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {isFr
                        ? 'Vos données personnelles et habitudes sont strictement confidentielles. Elles demeurent exclusivement sur votre appareil avec un système de protection autonome de type militaire : aucun serveur distant, aucun cloud externe, confidentialité absolue.'
                        : 'Your personal data and logs are strictly confidential, protected locally on your device with autonomous military-grade security. No remote servers, no third-party tracking, absolute privacy.'}
                    </p>
                  </div>
                </div>

                {/* Règle d'or du chronomètre */}
                <div className="p-3.5 rounded-2xl glass-panel border border-rose-500/30 bg-rose-950/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-rose-200">
                      {isFr ? 'Règle Fondamentale pour le Chronomètre' : 'Core Rule for the Sobriety Timer'}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {isFr
                        ? 'Pour une précision clinique, enregistrez toujours votre prise à la fin exacte de votre consommation. Le chronomètre démarrera ainsi au moment réel de votre arrêt définitif.'
                        : 'For clinical accuracy, always log your intake right at the end of consumption so the sobriety timer starts at the exact moment you actually stop.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LEGAL, PRIVACY, LOCAL MEMORY & DISCLAIMER PART */}
          {isLegalPrivacyStep && (
            <div className="space-y-3.5 animate-fade-in">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🛡️</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {isFr ? 'Confidentialité Locale & Cadre Légal' : 'Local-First Privacy & Legal Framework'}
                  </h2>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isFr
                    ? 'PuffinLess ne collecte ni ne transmet aucune donnée en ligne. Votre appareil est votre sanctuaire de mémoire souverain et autonome.'
                    : 'PuffinLess never collects, stores, or transmits your personal data online. Your device is your sovereign, self-contained memory vault.'}
                </p>
              </div>

              <div className="space-y-2.5">
                {/* 1. Architecture 100% Locale (Mémoire de l'appareil) */}
                <div className="p-3.5 rounded-2xl glass-panel border border-emerald-500/30 bg-emerald-950/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-emerald-300">
                        {isFr ? 'Stockage 100% Local (Mémoire Appareil)' : '100% Local Storage (Device Memory)'}
                      </h4>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-200 font-bold">
                        {isFr ? 'Zéro Cloud' : 'Zero Cloud'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {isFr
                        ? 'Toutes vos données (consommations, envies, finances, journal d\'événements, objectifs) sont enregistrées exclusivement dans la mémoire interne de votre navigateur (IndexedDB & stockage local chiffré AES-GCM). Rien n\'est jamais envoyé en ligne ni sur des serveurs distants.'
                        : 'All your intake logs, cravings, finances, event journals, and goals are stored exclusively inside your browser\'s local database (AES-GCM encrypted IndexedDB). Zero data is ever sent online or to remote cloud servers.'}
                    </p>
                  </div>
                </div>

                {/* 2. Politique de Confidentialité & Traitement des Données */}
                <div className="p-3.5 rounded-2xl glass-panel border border-teal-500/30 bg-teal-950/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-teal-300">
                        {isFr ? 'Politique de Confidentialité (Zéro Collecte)' : 'Privacy Policy (Zero Data Collection)'}
                      </h4>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-teal-500/25 text-teal-200 font-bold">
                        {isFr ? 'Anonymat Total' : '100% Anonymous'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {isFr
                        ? 'Aucun compte requis, aucun traceur analytique, aucune télémétrie, aucune publicité. Vous restez totalement anonyme. Aucun tiers, employeur ou assureur ne peut accéder à votre progression.'
                        : 'No account required, no analytics trackers, no telemetry, and no ads. You remain completely anonymous. No third party, employer, or insurer can ever access your sobriety logs.'}
                    </p>
                  </div>
                </div>

                {/* 3. Conditions Générales & Usage Commercial */}
                <div className="p-3.5 rounded-2xl glass-panel border border-amber-500/30 bg-amber-950/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-amber-300">
                        {isFr ? 'Conditions de Service & Licence Commerciale' : 'Terms of Service & Commercial Conditions'}
                      </h4>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-200 font-bold">
                        {isFr ? 'Licence Perpétuelle' : 'Perpetual Access'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {isFr
                        ? 'PuffinLess est une application web autonome et pérenne. Votre achat ou licence commerciale vous confère un droit d\'utilisation complet et illimité sur vos appareils personnels sans abonnement récurrent imposé ni dépendance à un serveur.'
                        : 'PuffinLess is an autonomous, standalone web application. Commercial purchase or license provides full, unrestricted personal use across your devices with zero forced subscription lock-in and zero remote server dependence.'}
                    </p>
                  </div>
                </div>

                {/* 4. Export, Récupération & Suppression Souveraine */}
                <div className="p-3.5 rounded-2xl glass-panel border border-indigo-500/30 bg-indigo-950/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-indigo-300">
                        {isFr ? 'Export, Restauration & Suppression Définitive' : 'Data Export, Recovery & Irreversible Deletion'}
                      </h4>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-500/25 text-indigo-200 font-bold">
                        {isFr ? 'Souveraineté' : 'Full Control'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {isFr
                        ? 'Vous êtes l\'unique propriétaire de vos données. Exportez votre historique complet en format JSON en 1 clic dans les Paramètres, restaurez vos données sur un nouvel appareil par simple import, ou détruisez instantanément toutes les bases et clés de chiffrement via la réinitialisation définitive.'
                        : 'You have full sovereign ownership. Export your complete data in 1-click JSON from Profile Settings, restore backups onto any new device via simple file import, or permanently shred all database records and cryptographic keys with the Reset button.'}
                    </p>
                  </div>
                </div>

                {/* 5. Avertissement Médical & Limites Cliniques */}
                <div className="p-3.5 rounded-2xl glass-panel border border-rose-500/30 bg-rose-950/20 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-rose-300">
                        {isFr ? 'Avertissement Médical & Limites Légales' : 'Medical & Clinical Disclaimer'}
                      </h4>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-500/25 text-rose-200 font-bold">
                        {isFr ? 'Non-Médical' : 'Non-Medical Tool'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {isFr
                        ? 'PuffinLess est un outil d\'auto-mesure comportementale et de soutien psychologique au sevrage. PuffinLess n\'est PAS un dispositif médical, un service d\'urgence ni un fournisseur de soins de santé, et ne fournit aucun diagnostic médical, traitement ou ordonnance. En cas de symptômes de sevrage sévères ou de détresse physiologique, consultez immédiatement un médecin ou les services d\'urgence.'
                        : 'PuffinLess is a behavioral habit-tracking and psycho-educational self-management companion. PuffinLess is NOT a medical device, medical practice, or emergency healthcare service, and does not provide clinical diagnoses, treatments, or prescriptions. For severe withdrawal symptoms or medical emergencies, consult a licensed healthcare professional immediately.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PWA PART: Mobile PWA Install Tips (iOS & Android) */}
          {isPwaStep && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">📲</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {isFr ? 'Installer sur Mobile (PWA)' : 'Install on Mobile (PWA)'}
                  </h2>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isFr
                    ? 'Ajoutez PuffinLess à votre écran d\'accueil pour l\'utiliser comme une véritable application native (plein écran, sans barre d\'adresse, haptique).'
                    : 'Add PuffinLess to your home screen for the full native app experience (fullscreen, no browser URL bar, haptics).'}
                </p>
              </div>

              {/* Platform Toggle (iOS vs Android) */}
              <div className="flex p-1 rounded-2xl bg-slate-900/80 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setPwaPlatform('ios');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    pwaPlatform === 'ios'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🍎</span>
                  <span>iPhone / iPad (iOS)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setPwaPlatform('android');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    pwaPlatform === 'android'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🤖</span>
                  <span>Android (Chrome)</span>
                </button>
              </div>

              {/* Step-by-step instructions */}
              {pwaPlatform === 'ios' ? (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {isFr ? 'Ouvrez Safari' : 'Open in Safari'}
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {isFr
                          ? 'Sur iPhone, assurez-vous d\'ouvrir l\'application dans le navigateur Safari officiel.'
                          : 'On iPhone, make sure to open this URL inside Apple Safari.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{isFr ? 'Touchez le bouton Partager' : 'Tap the Share Button'}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px]">⎋ / ⬆️</span>
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {isFr
                          ? 'En bas au milieu de l\'écran Safari, touchez le carré avec la flèche vers le haut.'
                          : 'At the bottom bar of Safari, tap the square icon with an arrow pointing up.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{isFr ? '« Sur l\'écran d\'accueil »' : '« Add to Home Screen »'}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px]">➕</span>
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {isFr
                          ? 'Faites défiler le menu vers le bas et sélectionnez l\'option « Sur l\'écran d\'accueil ».'
                          : 'Scroll down the share sheet and tap « Add to Home Screen ».'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-300">
                        {isFr ? 'Touchez « Ajouter »' : 'Tap « Add »'}
                      </h4>
                      <p className="text-[11px] text-emerald-200/90 mt-0.5">
                        {isFr
                          ? 'Touchez « Ajouter » en haut à droite. L\'icône PuffinLess apparaît immédiatement sur votre écran d\'accueil !'
                          : 'Tap « Add » in the top-right corner. The PuffinLess icon is now on your home screen ready to launch!'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {isFr ? 'Ouvrez Google Chrome' : 'Open in Google Chrome'}
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {isFr
                          ? 'Sur votre téléphone Android, ouvrez le lien dans le navigateur Google Chrome.'
                          : 'On Android, open this web address inside Google Chrome.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{isFr ? 'Touchez le menu ⋮' : 'Tap the Menu ⋮'}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px]">⋮</span>
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {isFr
                          ? 'Touchez les 3 petits points verticaux en haut à droite du navigateur.'
                          : 'Tap the 3 vertical dots in the top-right corner of Chrome.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {isFr ? '« Installer l\'application »' : '« Install App » / « Add to Home »'}
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {isFr
                          ? 'Appuyez sur « Installer l\'application » ou « Ajouter à l\'écran d\'accueil ».'
                          : 'Tap « Install App » or « Add to Home screen » in the Chrome menu.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-300">
                        {isFr ? 'Confirmez l\'Installation' : 'Confirm Install'}
                      </h4>
                      <p className="text-[11px] text-emerald-200/90 mt-0.5">
                        {isFr
                          ? 'Appuyez sur « Installer ». L\'application PuffinLess s\'installe en 1 seconde avec icône dédiée !'
                          : 'Tap « Install ». PuffinLess installs in 1 second with a dedicated app icon!'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FIXED FOOTER: Always accessible without scrolling struggle */}
        <div className="p-4 sm:p-5 pt-3 border-t border-white/10 flex items-center justify-between gap-3 shrink-0 bg-slate-950/60">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setStep(step - 1);
              }}
              className="px-4 py-2 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white"
            >
              {isFr ? 'Retour' : 'Back'}
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNextStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all ml-auto"
          >
            <span>
              {isGuideMode
                ? (step === totalSteps ? (isFr ? 'Terminer' : 'Finish') : (isFr ? 'Continuer' : 'Continue'))
                : (step === totalSteps ? (isFr ? 'Démarrer Mon Aventure PuffinLess' : 'Start My PuffinLess Journey') : (isFr ? 'Continuer' : 'Continue'))}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
