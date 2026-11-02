import React, { useState } from 'react';
import { ArrowRight, Check, Heart, Shield, DollarSign, Clock, Wind, Award, Zap, Leaf } from 'lucide-react';
import type { UserProfile, QuitMode } from '../types';
import { PuffinLessLogo } from './PuffinLessLogo';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  isOpen: boolean;
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  initialProfile,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState(initialProfile.name || '');
  const [cigsPerDay, setCigsPerDay] = useState(initialProfile.cigarettesPerDay || 15);
  const [puffsPerDay, setPuffsPerDay] = useState(initialProfile.puffsPerDay || 80);
  const [cannabisGrams, setCannabisGrams] = useState(initialProfile.cannabisGramsPerWeek || 3.5);
  const [pricePerPack, setPricePerPack] = useState(initialProfile.pricePerPack || 12.5);
  const [cigsInPack] = useState(initialProfile.cigarettesInPack || 20);
  const [currency, setCurrency] = useState(initialProfile.currency || '$');
  const [quitMode] = useState<QuitMode>(initialProfile.quitMode || 'cold_turkey');
  const [quitDateChoice, setQuitDateChoice] = useState<'today' | 'yesterday' | 'few_days_ago'>('few_days_ago');
  const [selectedMotivators, setSelectedMotivators] = useState<string[]>(
    initialProfile.motivators.length > 0
      ? initialProfile.motivators
      : ['Health & Longevity', 'Financial Freedom', 'Deep Restorative Sleep', 'Unshakable Mindset']
  );

  if (!isOpen) return null;

  const MOTIVATOR_OPTIONS = [
    { label: 'Health & Longevity', icon: Heart },
    { label: 'Financial Freedom', icon: DollarSign },
    { label: 'Deep Restorative Sleep', icon: Clock },
    { label: 'Loved Ones & Family', icon: Shield },
    { label: 'Athletic Stamina', icon: Wind },
    { label: 'Clean Dopamine Focus', icon: Zap },
  ];

  const handleNextStep = () => {
    sound.playClick();
    if (step < 3) {
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
        cigarettesPerDay: Number(cigsPerDay) || 15,
        puffsPerDay: Number(puffsPerDay) || 80,
        cannabisGramsPerWeek: Number(cannabisGrams) || 3.5,
        pricePerPack: Number(pricePerPack) || 12,
        cigarettesInPack: Number(cigsInPack) || 20,
        currency,
        quitMode,
        quitDate: dateObj.toISOString(),
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

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
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
          <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
            Step {step} of 3
          </span>
        </div>

        {/* STEP 1: Welcome & PuffinLess Showcase */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <PuffinLessLogo size={64} className="shadow-2xl shadow-emerald-500/30" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-200 bg-clip-text text-transparent">
                Welcome to PuffinLess
              </h2>
              <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                The ultimate companion to conquer cigarettes, vapes/puffs, and weed. Reclaim deep sleep, clean lungs, and compounded wealth.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Substance Counters</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Track cigarettes, puffs, & weed with live clinical body impact.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">The Money Vault</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Log papers, lighters, weed, packs, and watch unspent money grow.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Sleep & Energy Ratings</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Analyze how clean days dramatically restore your REM sleep & stamina.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Psychology Masterclasses</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Learn why dopamine hijacks willpower and how to surf urges.</p>
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
                Your Substance Baseline
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tell us your current smoking/vaping habits so PuffinLess can calculate your exact recovery.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="$">$ USD</option>
                    <option value="€">€ EUR</option>
                    <option value="£">£ GBP</option>
                    <option value="C$">C$ CAD</option>
                    <option value="A$">A$ AUD</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Cigs / Day</label>
                  <input
                    type="number"
                    min="0"
                    value={cigsPerDay}
                    onChange={(e) => setCigsPerDay(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Pack Price</label>
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
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Vape Puffs / Day</label>
                  <input
                    type="number"
                    min="0"
                    value={puffsPerDay}
                    onChange={(e) => setPuffsPerDay(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Weed (Grams/Wk)</label>
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

              {/* Quit Date Selector */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">When did your smoke-free journey start?</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: 'few_days_ago', label: '3 Days Ago' },
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
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wealth Projection Banner */}
              <div className="p-3 rounded-2xl glass-panel-gold border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold block">
                    Estimated 1-Year Wealth Gain
                  </span>
                  <p className="text-xl font-extrabold text-amber-200">
                    {currency}{Number(estimatedYearlyCost).toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-[10px] text-amber-200/80 max-w-[140px]">
                  Ready to invest in your goals rather than burning it away.
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">What matters most to you?</label>
                <div className="flex flex-wrap gap-1.5">
                  {MOTIVATOR_OPTIONS.map((m) => {
                    const isSelected = selectedMotivators.includes(m.label);
                    return (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => toggleMotivator(m.label)}
                        className={`px-3 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200 shadow-sm'
                            : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                        <span>{m.label}</span>
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
                Your PuffinLess Arsenal is Primed
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Here is how PuffinLess protects your commitment 24/7.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl glass-panel-emerald border border-emerald-500/30 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">The SOS Button</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    1-tap emergency 4-7-8 breathing & 5-4-3-2-1 sensory grounding to collapse acute craving waves.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel-gold border border-amber-500/30 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">The Money Center</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Log purchases of papers, lighters, weed, and cigarettes to see the 10-year compound loss vs. money saved.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Psychology & Sleep Trends</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Study the neurochemistry of cravings and see how clean days boost your deep sleep scores.
                  </p>
                </div>
              </div>
            </div>
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
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNextStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all ml-auto"
          >
            <span>{step === 3 ? "Start My PuffinLess Journey" : "Continue"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
