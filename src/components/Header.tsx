import React from 'react';
import { Volume2, VolumeX, Zap, User, Smartphone, Monitor, Sun, Moon } from 'lucide-react';
import type { UserProfile } from '../types';
import { PuffinLessLogo } from './PuffinLessLogo';
import { sound } from '../utils/audio';
import { t } from '../utils/i18n';

interface HeaderProps {
  profile: UserProfile;
  streakLabel: string;
  levelLabel: string;
  onOpenSos: () => void;
  onOpenProfile: () => void;
  onToggleSound: () => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  isMobileDeviceFrame: boolean;
  onToggleDeviceFrame: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  streakLabel,
  levelLabel,
  onOpenSos,
  onOpenProfile,
  onToggleSound,
  onToggleTheme,
  onToggleLanguage,
  isMobileDeviceFrame,
  onToggleDeviceFrame,
}) => {
  const isDark = profile.theme === 'dark';
  const lang = profile.language || 'en';

  return (
    <header className="sticky top-0 z-40 w-full px-3 sm:px-4 pt-3 pb-3 backdrop-blur-xl border-b transition-all duration-300 bg-slate-950/70 border-white/5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shadow-lg shadow-emerald-500/20 shrink-0">
            <PuffinLessLogo size={36} />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight leading-none bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
              {t('brandName', lang)}
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="tabular-nums truncate">{streakLabel}</span>
              <span className="px-1.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                {levelLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => { sound.playClick(); onToggleTheme(); }}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex items-center justify-center w-8 h-8 rounded-xl glass-button text-slate-300"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          <button
            onClick={() => { sound.playClick(); onToggleDeviceFrame(); }}
            title={isMobileDeviceFrame ? 'Full layout' : 'Phone preview'}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-xl glass-button text-slate-300"
          >
            {isMobileDeviceFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>

          <button
            onClick={() => { onToggleSound(); sound.playClick(); }}
            title={profile.soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-xl glass-button text-slate-300"
          >
            {profile.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={() => { sound.playClick(); onOpenProfile(); }}
            className="w-8 h-8 rounded-xl p-0.5 border border-white/20 glass-button overflow-hidden flex items-center justify-center"
            title="Profile & settings"
          >
            {profile.avatar ? <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover rounded-lg" /> : <User className="w-4 h-4 text-slate-300" />}
          </button>

          {/* Craving button */}
          <button
            onClick={() => { sound.playBreathTone(); onOpenSos(); }}
            className="group relative flex items-center gap-1.5 pl-2.5 pr-3 h-8 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white keep-white font-bold text-[11px] tracking-wide shadow-lg shadow-rose-500/30 border border-rose-300/40 hover:scale-105 active:scale-95 transition-all"
          >
            <span className="absolute -inset-0.5 rounded-xl bg-rose-500/40 blur-sm -z-10 animate-pulse" />
            <Zap className="w-3.5 h-3.5 fill-white group-hover:rotate-12 transition-transform" />
            <span>{t('cravingButton', lang)}</span>
          </button>

          {/* French / US Flag Toggle Button (FAR RIGHT NEXT TO CRAVING) */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleLanguage();
            }}
            title={lang === 'en' ? 'Traduire en Français 🇫🇷' : 'Switch to English 🇺🇸'}
            className="flex items-center justify-center h-8 px-2 rounded-xl glass-button text-xs font-bold gap-1 hover:scale-105 active:scale-95 transition-all border border-white/20 shadow-md"
          >
            {lang === 'en' ? (
              <span className="flex items-center gap-1">
                <span className="text-base leading-none">🇫🇷</span>
                <span className="text-[10px] text-slate-200 font-bold hidden min-[400px]:inline">FR</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="text-base leading-none">🇺🇸</span>
                <span className="text-[10px] text-slate-200 font-bold hidden min-[400px]:inline">EN</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
