import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, Wind, Compass, Cigarette, Leaf } from 'lucide-react';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import type { SubstanceType, Language } from '../types';
import { t, TRIGGER_OPTIONS } from '../utils/i18n';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResistedCraving: (trigger: string, intensity: number, substance?: SubstanceType) => void;
  onLogSlip: (substance: SubstanceType, count: number, trigger?: string) => void;
  currency: string;
  moneySaved: number;
  language?: Language;
}

type BreathingPhase = 'Inhale' | 'Hold' | 'Exhale' | 'Ready';

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  onClose,
  onResistedCraving,
  onLogSlip,
  currency,
  moneySaved,
  language = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'breathe' | 'reality' | 'grounding'>('breathe');
  const [breathingPhase, setBreathingPhase] = useState<BreathingPhase>('Ready');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(4);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  const [craveIntensity, setCraveIntensity] = useState<number>(7);
  const [selectedSubstance, setSelectedSubstance] = useState<SubstanceType>('cigarette');
  const [selectedTrigger, setSelectedTrigger] = useState<string>('Stress');
  const [showSlipConfirm, setShowSlipConfirm] = useState<boolean>(false);

  // 4-7-8 Breathing Loop
  useEffect(() => {
    if (!isOpen || !isBreathingActive) return;

    const timer = setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Transition phase
        if (breathingPhase === 'Inhale') {
          setBreathingPhase('Hold');
          return 7;
        } else if (breathingPhase === 'Hold') {
          sound.playBreathTone(true);
          setBreathingPhase('Exhale');
          return 8;
        } else {
          // Exhale finished -> new cycle
          sound.playBreathTone(false);
          setCycleCount((c) => c + 1);
          setBreathingPhase('Inhale');
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isBreathingActive, breathingPhase]);

  if (!isOpen) return null;

  const startBreathing = () => {
    sound.playBreathTone(false);
    setIsBreathingActive(true);
    setBreathingPhase('Inhale');
    setPhaseSecondsLeft(4);
  };

  const handleVictory = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti fallback
    }
    sound.playCelebration();
    onResistedCraving(selectedTrigger, craveIntensity, selectedSubstance);
    onClose();
  };

  const handleRecordSlip = (substance: SubstanceType, count: number) => {
    onLogSlip(substance, count, selectedTrigger);
    setShowSlipConfirm(false);
    onClose();
  };

  const substanceOptions: { id: SubstanceType; label: string; icon: React.ElementType }[] = [
    { id: 'cigarette', label: t('substanceCigarette', language), icon: Cigarette },
    { id: 'puff_vape', label: t('substancePuff', language), icon: Wind },
    { id: 'cannabis', label: t('substanceCannabis', language), icon: Leaf },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel-elevated p-5 sm:p-7 border border-rose-500/30 shadow-2xl shadow-rose-950/60 text-left my-auto">
        {/* Glow backdrop */}
        <div className="absolute -top-20 inset-x-0 h-40 bg-gradient-to-b from-rose-500/20 to-transparent blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 w-8 h-8 rounded-full glass-button flex items-center justify-center text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/30 text-white border border-rose-300/30 animate-pulse shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {t('sosTitle', language)}
            </h3>
            <p className="text-xs text-rose-300">
              {t('sosSub', language)}
            </p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex rounded-2xl p-1 bg-slate-900/60 border border-white/10 mb-4">
          <button
            onClick={() => setActiveTab('breathe')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'breathe'
                ? 'bg-rose-500/25 text-rose-200 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>{t('sosTabBreathe', language)}</span>
          </button>
          <button
            onClick={() => setActiveTab('grounding')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'grounding'
                ? 'bg-rose-500/25 text-rose-200 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{t('sosTabGrounding', language)}</span>
          </button>
          <button
            onClick={() => setActiveTab('reality')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'reality'
                ? 'bg-rose-500/25 text-rose-200 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('sosTabReality', language)}</span>
          </button>
        </div>

        {/* TAB 1: 4-7-8 Breathing */}
        {activeTab === 'breathe' && (
          <div className="text-center py-2 space-y-4">
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div
                className={`absolute inset-0 rounded-full border-2 border-emerald-400/30 transition-transform duration-1000 ${
                  breathingPhase === 'Inhale'
                    ? 'scale-125 bg-emerald-500/10'
                    : breathingPhase === 'Hold'
                    ? 'scale-125 bg-amber-500/10 border-amber-400/40'
                    : breathingPhase === 'Exhale'
                    ? 'scale-90 bg-teal-500/5'
                    : 'scale-100'
                }`}
              />

              {/* Inner Circle with animated size */}
              <div
                className={`w-32 h-32 rounded-full glass-panel flex flex-col items-center justify-center border-2 shadow-2xl transition-all duration-1000 ${
                  breathingPhase === 'Inhale'
                    ? 'border-emerald-400 text-emerald-300 shadow-emerald-500/30'
                    : breathingPhase === 'Hold'
                    ? 'border-amber-400 text-amber-300 shadow-amber-500/30'
                    : breathingPhase === 'Exhale'
                    ? 'border-teal-400 text-teal-300 shadow-teal-500/30'
                    : 'border-white/20 text-white'
                }`}
              >
                <span className="text-xs uppercase tracking-widest font-bold opacity-80">
                  {breathingPhase === 'Ready'
                    ? t('breatheReady', language)
                    : breathingPhase === 'Inhale'
                    ? t('breatheInhale', language)
                    : breathingPhase === 'Hold'
                    ? t('breatheHold', language)
                    : t('breatheExhale', language)}
                </span>
                <span className="text-3xl font-extrabold my-0.5">
                  {breathingPhase === 'Ready' ? '4-7-8' : phaseSecondsLeft}
                </span>
                {cycleCount > 0 && (
                  <span className="text-[10px] text-slate-400">{t('breatheCycle', language)} {cycleCount + 1}</span>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-300 max-w-xs mx-auto">
              {breathingPhase === 'Inhale' && t('breatheHintInhale', language)}
              {breathingPhase === 'Hold' && t('breatheHintHold', language)}
              {breathingPhase === 'Exhale' && t('breatheHintExhale', language)}
              {breathingPhase === 'Ready' && t('breatheHintReady', language)}
            </div>

            {!isBreathingActive ? (
              <button
                type="button"
                onClick={startBreathing}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white keep-white font-semibold text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                {t('breatheBeginBtn', language)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsBreathingActive(false)}
                className="px-4 py-1.5 rounded-xl glass-button text-xs text-slate-400 hover:text-white"
              >
                {t('breathePauseBtn', language)}
              </button>
            )}
          </div>
        )}

        {/* TAB 2: Grounding */}
        {activeTab === 'grounding' && (
          <div className="space-y-2.5 py-1">
            <p className="text-xs text-slate-300 mb-2">
              {t('groundingPrompt', language)}
            </p>
            {[
              { num: '5', label: t('grounding5', language) },
              { num: '4', label: t('grounding4', language) },
              { num: '3', label: t('grounding3', language) },
              { num: '2', label: t('grounding2', language) },
              { num: '1', label: t('grounding1', language) },
            ].map((step) => (
              <div key={step.num} className="p-2.5 rounded-2xl glass-panel border border-white/10 flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 font-extrabold text-sm flex items-center justify-center border border-emerald-500/30 shrink-0">
                  {step.num}
                </span>
                <span className="text-xs text-slate-200">{step.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: Reality Check */}
        {activeTab === 'reality' && (
          <div className="space-y-3 py-1">
            <div className="p-4 rounded-2xl glass-panel-gold border border-amber-500/30">
              <span className="text-[11px] uppercase tracking-wider text-amber-300 font-bold">{t('hardWonWealth', language)}</span>
              <p className="text-lg font-bold text-white mt-1">
                {t('wealthSavedMsg', language)} {currency}{moneySaved}.
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {t('wealthWarning', language)}
              </p>
            </div>

            <div className="p-4 rounded-2xl glass-panel-emerald border border-emerald-500/30">
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold">{t('biologyRealityTitle', language)}</span>
              <p className="text-xs text-slate-200 mt-1">
                {t('biologyRealityMsg', language)}
              </p>
            </div>
          </div>
        )}

        {/* Substance & Motivation Selectors */}
        <div className="mt-4 pt-3.5 border-t border-white/10 space-y-3">
          {/* Substance selector */}
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 block">
              {t('sosCravedSubstance', language)}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {substanceOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedSubstance === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedSubstance(opt.id);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-rose-500/30 border-rose-400 text-rose-200 shadow-md shadow-rose-500/20'
                        : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trigger / Motivation selector */}
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 block">
              {t('sosTriggerLabel', language)}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TRIGGER_OPTIONS.map((trig) => {
                const isSelected = selectedTrigger === trig.id;
                const label = language === 'fr' ? trig.labelFr : trig.labelEn;
                return (
                  <button
                    key={trig.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedTrigger(trig.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      isSelected
                        ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-sm'
                        : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Crave intensity */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <label className="text-xs font-medium text-slate-300">
              {t('sosIntensityLabel', language)} <span className="text-rose-400 font-bold">{craveIntensity}/10</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={craveIntensity}
              onChange={(e) => setCraveIntensity(Number(e.target.value))}
              className="w-1/2 accent-rose-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Main CTA */}
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={handleVictory}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white keep-white font-bold text-sm shadow-xl shadow-emerald-500/30 border border-emerald-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{t('sosResistBtn', language)}</span>
          </button>

          {!showSlipConfirm ? (
            <button
              type="button"
              onClick={() => setShowSlipConfirm(true)}
              className="w-full py-1.5 text-center text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              {t('sosSlipQuestion', language)}
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center space-y-2">
              <p className="text-xs text-rose-200 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{t('sosSlipWarning', language)}</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRecordSlip('cigarette', 1)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/30 border border-rose-500/40 text-xs text-rose-200 hover:bg-rose-500/50 font-semibold"
                >
                  1 {t('substanceCigarette', language)}
                </button>
                <button
                  type="button"
                  onClick={() => handleRecordSlip('puff_vape', 10)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/30 border border-rose-500/40 text-xs text-rose-200 hover:bg-rose-500/50 font-semibold"
                >
                  10 {t('unitPuff', language)}
                </button>
                <button
                  type="button"
                  onClick={() => handleRecordSlip('cannabis', 1)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/30 border border-rose-500/40 text-xs text-rose-200 hover:bg-rose-500/50 font-semibold"
                >
                  1 {t('unitJoint', language)}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSlipConfirm(false)}
                  className="px-3 py-1.5 rounded-xl glass-button text-xs text-slate-300"
                >
                  {t('cancel', language)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
