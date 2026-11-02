import React, { useState } from 'react';
import { Award, Trophy, Tag, Lock } from 'lucide-react';
import type { Badge, Language } from '../types';
import { getBadges } from '../utils/healthMilestones';
import type { CalculatedStats } from '../utils/calculations';
import { MorphicCard } from './MorphicCard';
import { LevelLadder } from './LevelLadder';
import { sound } from '../utils/audio';

interface RewardsViewProps {
  stats: CalculatedStats;
  currency: string;
  language?: Language;
}

interface Perk {
  id: string;
  title: string;
  partner: string;
  discount: string;
  requirement: string;
  unlocked: boolean;
  code: string;
}

export const RewardsView: React.FC<RewardsViewProps> = ({ stats, currency, language = 'en' }) => {
  const isFr = language === 'fr';
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const perks: Perk[] = [
    {
      id: 'perk-1',
      title: isFr ? 'Remboursement Whoop 4.0 / Apple Watch' : 'Whoop 4.0 / Apple Watch Rebate',
      partner: 'HealthTech Direct',
      discount: isFr ? '-15% + Bracelet Offert' : '15% OFF + Free Band',
      requirement: isFr ? 'Débloqué à 7 jours sans fumer' : 'Unlocked at 7 Days Smoke-Free',
      unlocked: stats.days >= 7,
      code: 'PUFFLESS-HEALTH15',
    },
    {
      id: 'perk-2',
      title: isFr ? 'Pass 1 Mois Salle de Sport Equinox / Basic-Fit' : 'Equinox & PureGym 1-Month Pass',
      partner: 'Fitness Club Network',
      discount: isFr ? '1 Mois d\'Essai Gratuit' : '1 Month Free Trial',
      requirement: isFr ? 'Débloqué à 14 jours sans fumer' : 'Unlocked at 14 Days Smoke-Free',
      unlocked: stats.days >= 14,
      code: 'PUFFLESS-FITFREE',
    },
    {
      id: 'perk-3',
      title: isFr ? 'Abonnement Calm / Headspace Premium' : 'Headspace / Calm Premium',
      partner: 'Mindfulness Partners',
      discount: isFr ? '-30% à vie sur l\'abonnement' : '30% Lifetime Savings',
      requirement: isFr ? 'Débloqué avec 5 envies surmontées' : 'Unlocked with 5 Cravings Resisted',
      unlocked: stats.cravingsResistedCount >= 5,
      code: 'PUFFLESS-MIND30',
    },
    {
      id: 'perk-4',
      title: isFr ? 'Week-end Spa & Retraite Bien-être' : 'Luxury Wellness Spa Weekend',
      partner: 'Zenith Retreats',
      discount: isFr ? 'Crédit Cadeau de 150 $' : '$150 Gift Credit',
      requirement: isFr ? `Débloqué avec ${currency}500 économisés` : `Unlocked with ${currency}500 Saved`,
      unlocked: stats.moneySaved >= 500,
      code: 'PUFFLESS-RETREAT',
    },
  ];

  const badgesList = getBadges(language);
  const unlockedCount = stats.unlockedBadgeIds.length;
  const totalBadges = badgesList.length;
  const progressPercent = ((unlockedCount / totalBadges) * 100).toFixed(0);

  const getTierBadgeColor = (tier: Badge['tier']) => {
    switch (tier) {
      case 'diamond': return 'from-cyan-400 to-blue-500 text-cyan-200 border-cyan-400/40';
      case 'platinum': return 'from-indigo-400 to-purple-500 text-indigo-200 border-indigo-400/40';
      case 'gold': return 'from-amber-400 to-yellow-600 text-amber-200 border-amber-400/40';
      case 'silver': return 'from-slate-300 to-slate-400 text-slate-100 border-slate-300/40';
      default: return 'from-amber-700 to-amber-900 text-amber-300 border-amber-700/40';
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <LevelLadder stats={stats} language={language} />

      {/* 1. Prestige Rank Summary */}
      <MorphicCard variant="gold" className="relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                {isFr ? 'Galerie d\'Honneur & Trophées' : 'Prestige Hall of Honors'}
              </span>
              <p className="text-[11px] text-amber-200/80">
                {isFr ? 'Chaque badge célèbre une victoire biologique permanente' : 'Every badge marks permanent biological liberation'}
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
            {unlockedCount} / {totalBadges} {isFr ? 'Badges' : 'Badges'}
          </span>
        </div>

        <div className="py-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-200">
            <span>{isFr ? 'Progression Globale' : 'Trophy Progression'}</span>
            <span>{progressPercent}% {isFr ? 'Accompli' : 'Complete'}</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-900/80 overflow-hidden border border-amber-500/20">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 rounded-full transition-all duration-1000 shadow-sm shadow-amber-400/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </MorphicCard>

      {/* 2. Interactive Badges Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {isFr ? 'Trophées & Jalons Débloqués' : 'Milestone Trophies'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">{isFr ? 'Touchez pour inspecter' : 'Tap to inspect'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badgesList.map((badge) => {
            const isUnlocked = stats.unlockedBadgeIds.includes(badge.id);
            const tierStyle = getTierBadgeColor(badge.tier);

            return (
              <div
                key={badge.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedBadge(badge);
                }}
                className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center ${
                  isUnlocked
                    ? 'glass-panel-elevated hover:scale-105 border-white/20'
                    : 'glass-panel opacity-60 border-white/5 hover:opacity-80'
                }`}
              >
                {/* Glow for unlocked */}
                {isUnlocked && (
                  <div className="absolute -top-10 inset-x-0 h-20 bg-gradient-to-b from-amber-400/15 to-transparent blur-md pointer-events-none" />
                )}

                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border my-2 ${
                    isUnlocked
                      ? `bg-gradient-to-br ${tierStyle}`
                      : 'bg-slate-900 text-slate-600 border-white/5'
                  }`}
                >
                  {isUnlocked ? (
                    <Award className="w-7 h-7 text-white" />
                  ) : (
                    <Lock className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                <span className="text-xs font-bold text-white mt-1 line-clamp-1">
                  {badge.title}
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 capitalize mt-0.5">
                  {isFr ? `Rang ${badge.tier}` : `${badge.tier} Tier`}
                </span>

                <span className={`text-[10px] mt-2 px-2 py-0.5 rounded-full font-semibold ${
                  isUnlocked
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {isUnlocked ? (isFr ? 'Gagné ✓' : 'Earned ✓') : (isFr ? 'Verrouillé' : 'Locked')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Exclusive Smoke-Free Perks & Discounts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {isFr ? 'Offres & Privilèges Partenaires' : 'VIP Quitter Perks & Offers'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">{isFr ? 'Avantages Exclusifs' : 'Exclusive Deals'}</span>
        </div>

        <div className="space-y-3">
          {perks.map((p) => (
            <MorphicCard
              key={p.id}
              variant={p.unlocked ? 'elevated' : 'default'}
              className="border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{p.title}</span>
                    {p.unlocked ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        {isFr ? 'DÉBLOQUÉ' : 'UNLOCKED'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {p.requirement}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-purple-300">
                    {p.discount} • {p.partner}
                  </p>
                </div>

                {p.unlocked && (
                  <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-mono font-bold select-all">
                    {p.code}
                  </div>
                )}
              </div>
            </MorphicCard>
          ))}
        </div>
      </div>

      {/* Badge Modal Inspection */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl glass-panel-elevated p-6 text-center border border-white/20 shadow-2xl">
            <div
              className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-xl border my-2 ${
                stats.unlockedBadgeIds.includes(selectedBadge.id)
                  ? `bg-gradient-to-br ${getTierBadgeColor(selectedBadge.tier)}`
                  : 'bg-slate-900 text-slate-600 border-white/5'
              }`}
            >
              <Award className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-xl font-bold text-white mt-3">{selectedBadge.title}</h3>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mt-1">
              {isFr ? `Badge de Prestige Rang ${selectedBadge.tier}` : `${selectedBadge.tier} Prestige Badge`}
            </span>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {selectedBadge.description}
            </p>

            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                {isFr ? 'Fermer' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
