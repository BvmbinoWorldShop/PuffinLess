import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { PuffinLessLogo } from './PuffinLessLogo';
import { sound } from '../utils/audio';
import { unlockPassphraseVault } from '../utils/crypto';
import type { Language } from '../types';

interface VaultUnlockScreenProps {
  onUnlock: () => void;
  language: Language;
}

export const VaultUnlockScreen: React.FC<VaultUnlockScreenProps> = ({ onUnlock, language }) => {
  const isFr = language === 'fr';
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState(false);
  const [isDeriving, setIsDeriving] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase || isDeriving) return;

    setError(false);
    setIsDeriving(true);
    sound.playClick();

    try {
      const success = await unlockPassphraseVault(passphrase);
      if (success) {
        sound.playCelebration();
        onUnlock();
      } else {
        sound.playWarning();
        setError(true);
        setPassphrase('');
      }
    } catch {
      sound.playWarning();
      setError(true);
      setPassphrase('');
    } finally {
      setIsDeriving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 text-center select-none animate-fade-in">
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm rounded-3xl glass-panel-elevated p-6 sm:p-8 border border-cyan-500/30 shadow-2xl flex flex-col items-center space-y-5">
        {/* Brand & Security Badge */}
        <div className="relative">
          <PuffinLessLogo size={68} className="shadow-2xl shadow-cyan-500/30" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center border-2 border-slate-900 shadow-md">
            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>{isFr ? 'Coffre-fort Cryptographique' : 'Cryptographic Data Vault'}</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {isFr
              ? 'Entrez votre phrase secrète pour déchiffrer votre coffre local.'
              : 'Enter your secret passphrase to unlock and decrypt your local vault.'}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{isFr ? 'Phrase secrète incorrecte' : 'Incorrect secret passphrase'}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="w-full space-y-3 pt-2">
          <input
            type="password"
            autoFocus
            value={passphrase}
            onChange={(e) => {
              setPassphrase(e.target.value);
              setError(false);
            }}
            placeholder={isFr ? 'Votre phrase secrète...' : 'Your secret passphrase...'}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white text-xs text-center focus:outline-none focus:border-cyan-400 transition-all tracking-wider"
          />

          <button
            type="submit"
            disabled={!passphrase || isDeriving}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 hover:from-cyan-500 hover:to-teal-500 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeriving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isFr ? 'Déchiffrement (600k itér.)...' : 'Deriving & Decrypting...'}</span>
              </>
            ) : (
              <>
                <span>{isFr ? 'Déverrouiller le Coffre' : 'Unlock Vault'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
