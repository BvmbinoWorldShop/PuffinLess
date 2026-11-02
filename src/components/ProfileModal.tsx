import React, { useState } from 'react';
import { X, User, Volume2, Sparkles, Trash2, Sun, Moon } from 'lucide-react';
import type { UserProfile, QuitMode, AppTheme } from '../types';
import { sound } from '../utils/audio';

interface ProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSaveProfile: (profile: UserProfile) => void;
  onRerunOnboarding: () => void;
  onResetData: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSaveProfile,
  onRerunOnboarding,
  onResetData,
}) => {
  const [name, setName] = useState(profile.name);
  const [cigsPerDay, setCigsPerDay] = useState(profile.cigarettesPerDay);
  const [pricePerPack, setPricePerPack] = useState(profile.pricePerPack);
  const [puffsPerDay, setPuffsPerDay] = useState(profile.puffsPerDay || 80);
  const [cannabisGrams, setCannabisGrams] = useState(profile.cannabisGramsPerWeek || 3.5);
  const [currency, setCurrency] = useState(profile.currency);
  const [podPrice, setPodPrice] = useState(profile.podPrice ?? 18);
  const [pricePerGram, setPricePerGram] = useState(profile.pricePerGram ?? 10);
  const [quitMode, setQuitMode] = useState<QuitMode>(profile.quitMode);
  const [theme, setTheme] = useState<AppTheme>(profile.theme || 'dark');
  const [quitDate, setQuitDate] = useState(profile.quitDate.substring(0, 10));
  const [soundEnabled, setSoundEnabled] = useState(profile.soundEnabled);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name: name.trim() || 'Champion',
      cigarettesPerDay: Number(cigsPerDay) || 15,
      pricePerPack: Number(pricePerPack) || 12,
      puffsPerDay: Number(puffsPerDay) || 80,
      podPrice: Number(podPrice) || 18,
      pricePerGram: Number(pricePerGram) || 10,
      cannabisGramsPerWeek: Number(cannabisGrams) || 3.5,
      currency,
      quitMode,
      theme,
      quitDate: new Date(quitDate).toISOString(),
      soundEnabled,
    };
    sound.setEnabled(soundEnabled);
    sound.playClick();
    onSaveProfile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl glass-panel-elevated p-6 border border-white/15 shadow-2xl my-auto">
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 w-8 h-8 rounded-full glass-button flex items-center justify-center text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white border border-emerald-300/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Settings & Habit Baseline</h3>
            <p className="text-xs text-slate-400">Configure your personal smoking & substance profile</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">App Appearance Theme</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-emerald-500/50 text-emerald-300 shadow-md'
                    : 'bg-slate-950/40 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4 text-emerald-400" />
                <span>Luxury Obsidian (Dark)</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  theme === 'light'
                    ? 'bg-white/90 border-emerald-500/50 text-slate-900 shadow-md'
                    : 'bg-slate-950/40 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Luxury Pearl (Light)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-2.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Cigs / Day</label>
              <input
                type="number"
                min="0"
                value={cigsPerDay}
                onChange={(e) => setCigsPerDay(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Pack Price</label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={pricePerPack}
                onChange={(e) => setPricePerPack(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Vape Puffs / Day</label>
              <input
                type="number"
                min="0"
                value={puffsPerDay}
                onChange={(e) => setPuffsPerDay(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Weed (Grams/Wk)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={cannabisGrams}
                onChange={(e) => setCannabisGrams(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Quit Date</label>
            <input
              type="date"
              value={quitDate}
              onChange={(e) => setQuitDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Quit Protocol</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'cold_turkey', label: 'Cold Turkey (Instant 0)' },
                { id: 'gradual', label: 'Gradual Tapering' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setQuitMode(m.id as QuitMode)}
                  className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    quitMode === m.id
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                      : 'bg-slate-900/50 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Vape device price (600 puffs)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={podPrice}
                onChange={(e) => setPodPrice(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cannabis price / gram</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={pricePerGram}
                onChange={(e) => setPricePerGram(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Sound toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl glass-panel border border-white/10">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-white">Audio & Meditation Chimes</span>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  soundEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Reset / Onboarding re-run */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onRerunOnboarding();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-button text-xs text-slate-300 hover:text-white"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Rerun Tour</span>
            </button>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-button text-xs text-rose-400 hover:text-rose-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onResetData();
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
              >
                Confirm Reset?
              </button>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
