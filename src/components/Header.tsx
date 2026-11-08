import React from 'react';
import { Zap, User, Sun, Moon } from 'lucide-react';
import type { UserProfile } from '../types';
import type { LevelTier } from '../core/levels';
import { Dynamic3DIcon } from './Dynamic3DIcon';
import { sound } from '../utils/audio';
import { t } from '../utils/i18n';

interface HeaderProps {
  profile: UserProfile;
  streakLabel: string;
  tier: LevelTier;
  onOpenSos: () => void;
  onOpenProfile: () => void;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  streakLabel,
  tier,
  onOpenSos,
  onOpenProfile,
  onToggleTheme,
}) => {
  const isDark = profile.theme === 'dark';
  const lang = profile.language || 'en';
  const isFr = lang === 'fr';

  // Level color code: Green = Beginner, Orange = Mid, Red = Expert
  const tierMeta =
    tier === 'expert'
      ? {
          dot: 'bg-rose-500 shadow-[0_0_10px_#f43f5e]',
          border: 'border-rose-500/40',
          tooltip: isFr ? 'Niveau Rouge : Expert' : 'Red Tier: Expert',
        }
      : tier === 'intermediate'
      ? {
          dot: 'bg-amber-400 shadow-[0_0_10px_#fbbf24]',
          border: 'border-amber-500/40',
          tooltip: isFr ? 'Niveau Orange : Intermédiaire' : 'Orange Tier: Mid',
        }
      : {
          dot: 'bg-emerald-400 shadow-[0_0_10px_#34d399]',
          border: 'border-emerald-500/40',
          tooltip: isFr ? 'Niveau Vert : Débutant' : 'Green Tier: Beginner',
        };

  return (
    <header className="sticky top-0 z-40 w-full px-3 sm:px-4 pt-3 pb-3 backdrop-blur-xl border-b transition-all duration-300 bg-slate-950/70 border-white/5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand with 3D Dynamic Habit Icon */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 drop-shadow-md">
            <Dynamic3DIcon size={36} />
          </div>
          <div className="min-w-0">
            <h1
              className={`font-extrabold text-base sm:text-lg tracking-tight leading-none bg-clip-text text-transparent transition-all ${
                isDark
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200'
                  : 'bg-gradient-to-r from-slate-950 via-emerald-950 to-teal-950 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]'
              }`}
            >
              {t('brandName', lang)}
            </h1>
            {/* Color-coded habit indicator without level text */}
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
              <span
                className={`inline-block w-2 h-2 rounded-full ${tierMeta.dot} animate-pulse shrink-0`}
                title={tierMeta.tooltip}
              />
              <span className="tabular-nums truncate font-medium text-slate-300">{streakLabel}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => { sound.playClick(); onToggleTheme(); }}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
            className="flex items-center justify-center w-8 h-8 rounded-xl glass-button text-slate-300 cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* Profile & Settings Button */}
          <button
            type="button"
            onClick={() => { sound.playClick(); onOpenProfile(); }}
            className={`w-8 h-8 rounded-xl p-0.5 border ${tierMeta.border} glass-button overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition-all ring-1 ring-white/10 cursor-pointer`}
            title="Profile, Coach Settings & Avatar"
            aria-label={isFr ? 'Profil et paramètres' : 'Profile and settings'}
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name || 'User avatar'} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <User className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* Craving button */}
          <button
            type="button"
            onClick={() => { sound.playBreathTone(); onOpenSos(); }}
            aria-label={t('cravingButton', lang)}
            className="group relative flex items-center gap-1.5 pl-2.5 pr-3 h-8 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white keep-white font-bold text-[11px] tracking-wide shadow-lg shadow-rose-500/30 border border-rose-300/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="absolute -inset-0.5 rounded-xl bg-rose-500/40 blur-sm -z-10 animate-pulse" />
            <Zap className="w-3.5 h-3.5 fill-white group-hover:rotate-12 transition-transform" />
            <span>{t('cravingButton', lang)}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
