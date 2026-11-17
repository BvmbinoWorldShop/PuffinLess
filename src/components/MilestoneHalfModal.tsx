import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Heart, CheckCircle2, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Badge, Language, UserProfile } from '../types';
import { Medallion3D } from './Medallion3D';
import { getMilestoneExplanation } from '../utils/milestoneContent';
import { sound } from '../utils/audio';

interface MilestoneHalfModalProps {
  badge: Badge | null;
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  language?: Language;
  moneySaved?: number;
  isUnlocked?: boolean;
}

// Multi-stage fireworks simulation
export function triggerMilestoneFireworks(tier: Badge['tier'] = 'gold') {
  try {
    const tierColors: Record<string, string[]> = {
      bronze: ['#d97706', '#b45309', '#f59e0b', '#78350f', '#fde68a'],
      silver: ['#94a3b8', '#cbd5e1', '#e2e8f0', '#ffffff', '#64748b'],
      gold: ['#fbbf24', '#f59e0b', '#d97706', '#fef08a', '#ffffff'],
      platinum: ['#2dd4bf', '#06b6d4', '#38bdf8', '#818cf8', '#ffffff'],
      diamond: ['#a855f7', '#ec4899', '#6366f1', '#38bdf8', '#ffffff'],
    };

    const colors = tierColors[tier] || tierColors.gold;

    // Center celebratory explosion
    confetti({
      particleCount: 75,
      spread: 90,
      startVelocity: 42,
      origin: { y: 0.65 },
      colors,
    });

    // Left flare
    setTimeout(() => {
      confetti({
        particleCount: 45,
        angle: 60,
        spread: 60,
        startVelocity: 35,
        origin: { x: 0.2, y: 0.7 },
        colors,
      });
    }, 180);

    // Right flare
    setTimeout(() => {
      confetti({
        particleCount: 45,
        angle: 120,
        spread: 60,
        startVelocity: 35,
        origin: { x: 0.8, y: 0.7 },
        colors,
      });
    }, 360);
  } catch {
    // Confetti fallback
  }
}

export const MilestoneHalfModal: React.FC<MilestoneHalfModalProps> = ({
  badge,
  isOpen,
  onClose,
  profile,
  language = 'fr',
  moneySaved = 0,
  isUnlocked = false,
}) => {
  const isFr = language === 'fr';

  useEffect(() => {
    if (isOpen && badge) {
      sound.playCelebration();
      triggerMilestoneFireworks(badge.tier);
    }
  }, [isOpen, badge]);

  if (!isOpen || !badge || typeof document === 'undefined') return null;

  const explanation = getMilestoneExplanation(badge, profile, language, moneySaved);

  const tierBadgeStyle = {
    bronze: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
    silver: 'bg-slate-200 dark:bg-slate-700/40 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-500/40',
    gold: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border-yellow-500/40',
    platinum: 'bg-teal-500/20 text-teal-800 dark:text-teal-300 border-teal-500/40',
    diamond: 'bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-500/40',
  }[badge.tier];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-half-title"
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="milestone-half-window relative w-full sm:max-w-lg rounded-t-[32px] sm:rounded-3xl glass-panel-elevated p-5 sm:p-7 border border-white/20 shadow-2xl bg-white dark:bg-slate-950/98 text-left max-h-[88vh] flex flex-col overflow-hidden animate-fade-in"
      >
        {/* Top Half-Window Handle / Grab Bar on Mobile */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20 mx-auto mb-3 shrink-0 sm:hidden" />

        {/* Close Button Pinned at Top Right */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          aria-label={isFr ? 'Fermer la vue du trophée' : 'Close trophy view'}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full glass-button flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer z-20 shrink-0 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ambient Glow */}
        <div className="absolute -top-16 inset-x-0 h-32 bg-gradient-to-b from-amber-500/15 via-teal-500/10 to-transparent blur-2xl pointer-events-none" />

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto overscroll-contain pr-1 -mr-1 flex-1 space-y-4 pt-1 pb-2">
          {/* 1. Medallion Display Centerpiece */}
          <div className="text-center pt-2 pb-1 relative">
            <Medallion3D
              tier={badge.tier}
              iconName={badge.icon}
              isUnlocked={isUnlocked}
              size="lg"
              className="mx-auto my-1"
              showGlow={true}
            />

            <div className="mt-3 flex items-center justify-center gap-2">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${tierBadgeStyle}`}>
                {isFr ? `Rang ${badge.tier}` : `${badge.tier} Tier`}
              </span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                isUnlocked
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-white/10'
              }`}>
                {isUnlocked ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{isFr ? 'Trophée Gagné ✓' : 'Earned Trophy ✓'}</span>
                  </>
                ) : (
                  <span>{isFr ? 'En cours d\'acquisition' : 'In Progress'}</span>
                )}
              </span>
            </div>

            <h3 id="milestone-half-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
              {badge.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto font-medium">
              {badge.description}
            </p>
          </div>

          {/* 2. Ce que cet accomplissement signifie ("What this accomplishment means") */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-200 dark:border-white/10 space-y-2 bg-slate-50/80 dark:bg-slate-900/40">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                {isFr ? 'Ce que cet accomplissement signifie' : 'What this accomplishment means'}
              </h4>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {explanation.meaning}
            </p>
          </div>

          {/* 3. Message personnel pour vous ("Personal message to you") */}
          <div className="p-4 rounded-2xl glass-panel-gold border border-amber-500/30 space-y-2 bg-amber-50/70 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Heart className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                {isFr ? 'Message personnel pour vous' : 'Personal message to you'}
              </h4>
            </div>
            <p className="text-xs text-slate-800 dark:text-amber-100/90 leading-relaxed font-medium italic">
              « {explanation.personalMessage} »
            </p>
          </div>

          {/* 4. Interactive Fireworks Replay & Close CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                sound.playCelebration();
                triggerMilestoneFireworks(badge.tier);
              }}
              className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-slate-950 shrink-0" />
              <span>{isFr ? 'Relancer le Feu d\'Artifice 🎉' : 'Replay Fireworks 🎉'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl glass-button text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
            >
              {isFr ? 'Continuer ma Progression' : 'Keep Moving Forward'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
