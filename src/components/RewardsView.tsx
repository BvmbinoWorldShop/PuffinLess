import React, { useState } from 'react';
import { Award, Trophy, Tag, FileText, Download, Sparkles } from 'lucide-react';
import type { Badge, Language, UserProfile, SubstanceLog, CravingEntry, SleepEnergyEntry, PurchaseExpense } from '../types';
import type { CoreReport } from '../core/obsidianCore';
import { getBadges } from '../utils/healthMilestones';
import type { CalculatedStats } from '../utils/calculations';
import { MorphicCard } from './MorphicCard';
import { LevelLadder } from './LevelLadder';
import { ClinicalCertificateModal } from './ClinicalCertificateModal';
import { Medallion3D } from './Medallion3D';
import { MilestoneHalfModal } from './MilestoneHalfModal';
import { sound } from '../utils/audio';

interface RewardsViewProps {
  stats: CalculatedStats;
  currency: string;
  language?: Language;
  profile?: UserProfile;
  report?: CoreReport;
  substanceLogs?: SubstanceLog[];
  cravings?: CravingEntry[];
  sleepLogs?: SleepEnergyEntry[];
  expenses?: PurchaseExpense[];
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

export const RewardsView: React.FC<RewardsViewProps> = ({
  stats,
  currency,
  language = 'en',
  profile,
  report,
  substanceLogs,
  cravings,
  sleepLogs,
  expenses,
}) => {
  const isFr = language === 'fr';
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

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

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <LevelLadder stats={stats} language={language} />

      {/* Official Clinical Certificate & Victory Report (Export PDF) */}
      <MorphicCard
        variant="elevated"
        className="relative overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900/60 to-emerald-950/20 shadow-xl"
      >
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-md">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {isFr ? 'Rapport Certifié PuffinLess' : 'Certified PuffinLess Report'}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3 h-3" /> A4 & PDF
                  </span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                  {isFr ? 'Certificat Clinique & Rapport de Victoire' : 'Clinical Certificate & Victory Report'}
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              {isFr
                ? "Exportez votre diplôme de sevrage haute résolution officiel au format A4 avec sceau cryptographique de validation, jours d'abstinence et économies certifiées."
                : 'Export your high-resolution official recovery diploma in A4 format with cryptographic validation seal, smoke-free days, and certified savings.'}
            </p>
          </div>

          <button
            onClick={() => {
              sound.vibrate(35);
              setIsCertificateOpen(true);
            }}
            className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all whitespace-nowrap self-stretch sm:self-auto cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isFr ? 'Générer mon Certificat (PDF)' : 'Generate Certificate (PDF)'}</span>
          </button>
        </div>
      </MorphicCard>

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
            <Award className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              {isFr ? 'Trophées & Jalons Débloqués' : 'Milestone Trophies'}
            </h3>
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{isFr ? 'Touchez pour inspecter' : 'Tap to inspect'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badgesList.map((badge) => {
            const isUnlocked = stats.unlockedBadgeIds.includes(badge.id);

            return (
              <div
                key={badge.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedBadge(badge);
                }}
                className={`trophy-card group p-4 rounded-3xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col items-center text-center ${
                  isUnlocked
                    ? 'glass-panel-elevated hover:scale-105 border-slate-200 dark:border-white/20 bg-white dark:bg-slate-900/70 shadow-md hover:shadow-xl'
                    : 'glass-panel hover:scale-[1.02] border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/40 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Illumination Hover Halo & 2D/3D Medallion Centerpiece */}
                <div className="my-1.5 transition-transform duration-300 group-hover:scale-110">
                  <Medallion3D
                    tier={badge.tier}
                    iconName={badge.icon}
                    isUnlocked={isUnlocked}
                    size="md"
                    showGlow={isUnlocked}
                  />
                </div>

                <span className="badge-title text-xs font-bold text-slate-900 dark:text-white mt-2 line-clamp-1 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
                  {badge.title}
                </span>

                <span className="badge-tier text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 capitalize mt-0.5">
                  {isFr ? `Rang ${badge.tier}` : `${badge.tier} Tier`}
                </span>

                <span className={`text-[10px] mt-2 px-2.5 py-0.5 rounded-full font-bold transition-all ${
                  isUnlocked
                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-white/10'
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
            <Tag className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              {isFr ? 'Offres & Privilèges Partenaires' : 'VIP Quitter Perks & Offers'}
            </h3>
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{isFr ? 'Avantages Exclusifs' : 'Exclusive Deals'}</span>
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

      {/* Interactive Milestone 3D Half-Window Modal with Fireworks and Personalized Message */}
      <MilestoneHalfModal
        badge={selectedBadge}
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
        profile={profile || ({ name: isFr ? 'Champion' : 'Champion', language, currency } as UserProfile)}
        language={language}
        moneySaved={stats.moneySaved}
        isUnlocked={selectedBadge ? stats.unlockedBadgeIds.includes(selectedBadge.id) : false}
      />

      {/* Official Certificate Modal */}
      <ClinicalCertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        stats={stats}
        profile={profile}
        report={report}
        substanceLogs={substanceLogs}
        cravings={cravings}
        sleepLogs={sleepLogs}
        expenses={expenses}
        currency={currency}
        language={language}
      />
    </div>
  );
};
