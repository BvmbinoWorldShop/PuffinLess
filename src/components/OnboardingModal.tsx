import React, { useState } from 'react';
import { ArrowRight, Check, Heart, Shield, DollarSign, Clock, Wind, Award, Zap, Leaf, Target, BarChart2, X } from 'lucide-react';
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
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  initialProfile,
  initialStep = 1,
  onComplete,
  onClose,
}) => {
  const [lang, setLang] = useState<Language>(initialProfile.language || 'en');
  const isFr = lang === 'fr';

  const [step, setStep] = useState<number>(initialStep);
  const [pwaPlatform, setPwaPlatform] = useState<'ios' | 'android'>('ios');
  const [name, setName] = useState(initialProfile.name || '');
  const [quitGoal, setQuitGoal] = useState<QuitGoal>(initialProfile.quitGoal || 'want_to_quit');
  const [cigsPerDay, setCigsPerDay] = useState(initialProfile.cigarettesPerDay || 15);
  const [puffsPerDay, setPuffsPerDay] = useState(initialProfile.puffsPerDay || 80);
  const [cannabisGrams, setCannabisGrams] = useState(initialProfile.cannabisGramsPerWeek || 3.5);
  const [pricePerPack, setPricePerPack] = useState(initialProfile.pricePerPack || 12.5);
  const [cigsInPack] = useState(initialProfile.cigarettesInPack || 20);
  const [currency, setCurrency] = useState(initialProfile.currency || '€');
  const [quitMode] = useState<QuitMode>(initialProfile.quitMode || 'cold_turkey');
  const [quitDateChoice, setQuitDateChoice] = useState<'today' | 'yesterday' | 'few_days_ago'>('few_days_ago');
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

  const handleNextStep = () => {
    sound.playClick();
    if (step < 4) {
      setStep(step + 1);
    } else {
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
        cigarettesPerDay: Number(cigsPerDay) || 15,
        puffsPerDay: Number(puffsPerDay) || 80,
        cannabisGramsPerWeek: Number(cannabisGrams) || 3.5,
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

  const costPerCig = cigsInPack > 0 ? pricePerPack / cigsInPack : 0.5;
  const estimatedYearlyCost = (cigsPerDay * costPerCig * 365 + (cannabisGrams * 52 * 12)).toFixed(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel-elevated p-6 sm:p-8 border border-white/15 shadow-2xl shadow-emerald-950/40 text-left my-auto">
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Step Indicator & Language Flags Switcher & Close button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-gradient-to-r from-emerald-400 to-teal-400 shadow-sm shadow-emerald-400/50'
                    : s < step
                    ? 'w-4 bg-emerald-500/60'
                    : 'w-4 bg-white/10'
                }`}
              />
            ))}
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
              {isFr ? `Étape ${step} sur 4` : `Step ${step} of 4`}
            </span>

            {onClose && initialProfile.isOnboarded && (
              <button
                type="button"
                onClick={() => { sound.playClick(); onClose(); }}
                className="w-7 h-7 rounded-full glass-button flex items-center justify-center text-slate-400 hover:text-white shrink-0 ml-1"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* STEP 1: Welcome & PuffinLess Showcase */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <PuffinLessLogo size={64} className="shadow-2xl shadow-emerald-500/30" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-200 bg-clip-text text-transparent">
                {isFr ? 'Bienvenue sur PuffinLess' : 'Welcome to PuffinLess'}
              </h2>
              <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                {isFr
                  ? 'Votre compagnon ultime pour vaincre la cigarette, la vape et le cannabis. Retrouvez un sommeil profond, des poumons propres et une vraie richesse.'
                  : 'The ultimate companion to conquer cigarettes, vapes/puffs, and weed. Reclaim deep sleep, clean lungs, and compounded wealth.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {isFr ? 'Compteurs de Sobriété' : 'Substance Counters'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isFr ? 'Suivi en direct du temps sans fumer et de la récupération de vos organes.' : 'Track cigarettes, puffs, & weed with live clinical body impact.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {isFr ? 'Coffre-Fort & Projets' : 'The Money Vault'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isFr ? 'Mesurez l\'argent économisé et financez vos projets de rêve.' : 'Log papers, lighters, weed, packs, and watch unspent money grow.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {isFr ? 'Sommeil & Énergie' : 'Sleep & Energy Ratings'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isFr ? 'Analysez comment chaque journée propre restaure votre énergie vitale.' : 'Analyze how clean days dramatically restore your REM sleep & stamina.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {isFr ? 'Masterclasses & Mental' : 'Psychology Masterclasses'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isFr ? 'Comprenez les circuits de dopamine et apprenez à surfer sur les envies.' : 'Learn why dopamine hijacks willpower and how to surf urges.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Baseline Habits */}
        {step === 2 && (
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
                    onChange={(e) => setCigsPerDay(Number(e.target.value))}
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
                    min="1"
                    value={pricePerPack}
                    onChange={(e) => setPricePerPack(Number(e.target.value))}
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
                    onChange={(e) => setPuffsPerDay(Number(e.target.value))}
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
                    onChange={(e) => setCannabisGrams(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                ℹ️ {isFr
                  ? 'Ces repères servent uniquement à estimer vos économies. Ils ne comptabilisent aucune consommation dans votre journal.'
                  : 'This baseline is only used to project savings and does not add any consumed intake to your logs.'}
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
              </div>

              {/* Wealth Projection Banner */}
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

        {/* STEP 3: Quitting Arsenal */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {isFr ? 'Votre Arsenal PuffinLess est Prêt' : 'Your PuffinLess Arsenal is Primed'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFr ? 'Voici les outils conçus pour protéger votre décision 24h/24.' : 'Here is how PuffinLess protects your commitment 24/7.'}
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl glass-panel-emerald border border-emerald-500/30 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {isFr ? 'Le Bouton SOS Pulsion' : 'The SOS Button'}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {isFr
                      ? 'Respiration 4-7-8 d\'urgence et ancrage sensoriel en 1 clic pour désamorcer les pulsions vives.'
                      : '1-tap emergency 4-7-8 breathing & 5-4-3-2-1 sensory grounding to collapse acute craving waves.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel-gold border border-amber-500/30 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {isFr ? 'Le Centre Financier' : 'The Money Center'}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {isFr
                      ? 'Suivi des dépenses et visualisation de votre richesse préservée sur 10 ans.'
                      : 'Log purchases of papers, lighters, weed, and cigarettes to see the 10-year compound loss vs. money saved.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {isFr ? 'Neurobiologie & Sommeil' : 'Psychology & Sleep Trends'}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {isFr
                      ? 'Découvrez comment vos récepteurs de dopamine se réparent et boostent votre sommeil.'
                      : 'Study the neurochemistry of cravings and see how clean days boost your deep sleep scores.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Mobile PWA Install Tips (iOS & Android) */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">📲</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {isFr ? 'Installer sur Mobile (PWA)' : 'Install on Mobile (PWA)'}
                </h2>
              </div>
              <p className="text-xs text-slate-300">
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

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
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
            <span>{step === 4 ? (isFr ? 'Démarrer Mon Aventure PuffinLess' : 'Start My PuffinLess Journey') : (isFr ? 'Continuer' : 'Continue')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
