import React, { useState, useEffect } from 'react';
import { Lock, Shield, Delete, AlertCircle, RotateCcw, Clock } from 'lucide-react';
import { PuffinLessLogo } from './PuffinLessLogo';
import { sound } from '../utils/audio';
import { getSecurityConfig, verifyPin, getRemainingLockoutSeconds } from '../utils/security';
import type { Language } from '../types';

interface AppLockScreenProps {
  onUnlock: () => void;
  language: Language;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({ onUnlock, language }) => {
  const isFr = language === 'fr';
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [lockoutSec, setLockoutSec] = useState<number>(() => getRemainingLockoutSeconds());
  const [isVerifying, setIsVerifying] = useState(false);

  const config = getSecurityConfig();
  const expectedLen = config.pinLength || 4;

  useEffect(() => {
    if (lockoutSec <= 0) return;
    const interval = setInterval(() => {
      const remaining = getRemainingLockoutSeconds();
      setLockoutSec(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSec]);

  const handleKeyPress = (num: string) => {
    if (lockoutSec > 0 || isVerifying) return;
    sound.playClick();
    setError(false);
    if (pin.length < 8) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length >= expectedLen) {
        setIsVerifying(true);
        setTimeout(() => {
          const result = verifyPin(nextPin);
          if (result.success) {
            sound.playCelebration();
            onUnlock();
          } else {
            sound.playWarning();
            setError(true);
            if (result.isLockedOut) {
              setLockoutSec(result.remainingSeconds);
            }
            setTimeout(() => {
              setPin('');
              setError(false);
              setIsVerifying(false);
            }, 600);
          }
        }, 25);
      }
    }
  };

  const handleDelete = () => {
    if (lockoutSec > 0 || isVerifying) return;
    sound.playClick();
    setError(false);
    setPin((p) => p.slice(0, -1));
  };

  const handleClear = () => {
    if (lockoutSec > 0 || isVerifying) return;
    sound.playClick();
    setError(false);
    setPin('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSec > 0 || isVerifying) return;
    setIsVerifying(true);
    setTimeout(() => {
      const result = verifyPin(pin);
      if (result.success) {
        sound.playCelebration();
        onUnlock();
      } else {
        sound.playWarning();
        setError(true);
        if (result.isLockedOut) {
          setLockoutSec(result.remainingSeconds);
        }
        setTimeout(() => {
          setPin('');
          setError(false);
          setIsVerifying(false);
        }, 600);
      }
    }, 25);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 text-center select-none animate-fade-in">
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm rounded-3xl glass-panel-elevated p-6 sm:p-8 border border-white/15 shadow-2xl flex flex-col items-center space-y-5">
        {/* Brand & Security Badge */}
        <div className="relative">
          <PuffinLessLogo size={68} className="shadow-2xl shadow-emerald-500/30" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center border-2 border-slate-900 shadow-md">
            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>{isFr ? 'PuffinLess Protégé' : 'PuffinLess Protected'}</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {lockoutSec > 0
              ? (isFr
                  ? `Trop de tentatives erronées. Réessayez dans ${lockoutSec}s`
                  : `Too many failed attempts. Try again in ${lockoutSec}s`)
              : (isFr
                  ? 'Entrez votre code pour déverrouiller l\'application'
                  : 'Enter your code to unlock the application')}
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className={`flex items-center justify-center gap-3 py-2 transition-transform ${error ? 'animate-bounce text-rose-400' : ''}`}>
          {Array.from({ length: expectedLen }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                i < pin.length
                  ? error
                    ? 'bg-rose-500 border-rose-400 scale-125 shadow-md shadow-rose-500/40'
                    : 'bg-emerald-400 border-emerald-300 scale-110 shadow-md shadow-emerald-500/40'
                  : 'bg-white/5 border-white/20'
              }`}
            />
          ))}
        </div>

        {lockoutSec > 0 ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse">
            <Clock className="w-4 h-4" />
            <span>{isFr ? `Verrouillé temporairement (${lockoutSec}s)` : `Temporarily locked (${lockoutSec}s)`}</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{isFr ? 'Code PIN incorrect' : 'Incorrect PIN code'}</span>
          </div>
        ) : null}

        {/* Numeric Keypad */}
        <div className={`grid grid-cols-3 gap-2.5 w-full pt-2 ${lockoutSec > 0 ? 'opacity-40 pointer-events-none' : ''}`}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleKeyPress(n)}
              className="h-12 rounded-2xl bg-slate-900/80 border border-white/10 text-white font-extrabold text-lg hover:bg-slate-800 hover:border-emerald-400/40 active:scale-90 transition-all flex items-center justify-center shadow-sm cursor-pointer"
            >
              {n}
            </button>
          ))}

          {/* Reset / Clear */}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90 transition-all flex items-center justify-center shadow-sm cursor-pointer"
            title={isFr ? 'Effacer tout' : 'Clear all'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-2xl bg-slate-900/80 border border-white/10 text-white font-extrabold text-lg hover:bg-slate-800 hover:border-emerald-400/40 active:scale-90 transition-all flex items-center justify-center shadow-sm cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 active:scale-90 transition-all flex items-center justify-center shadow-sm cursor-pointer"
            title="Delete"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Fallback form submit */}
        {pin.length > 0 && lockoutSec <= 0 && (
          <form onSubmit={handleSubmit} className="w-full pt-1">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer"
            >
              {isFr ? 'Valider' : 'Unlock'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
