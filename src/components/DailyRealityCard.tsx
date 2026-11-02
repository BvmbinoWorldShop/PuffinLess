import React, { useState } from 'react';
import { Eye, Flame, Clock, HeartCrack, Wallet, Wind, Cigarette, Leaf } from 'lucide-react';
import type { UserProfile } from '../types';
import type { DailyReality } from '../core/obsidianCore';
import { MorphicCard } from './MorphicCard';
import { sound } from '../utils/audio';

type Period = 'day' | 'year' | 'decade';
const DAYS: Record<Period, number> = { day: 1, year: 365, decade: 3650 };

interface Props {
  profile: UserProfile;
  reality: DailyReality;
}

export const DailyRealityCard: React.FC<Props> = ({ profile, reality }) => {
  const isFr = profile.language === 'fr';
  const [period, setPeriod] = useState<Period>('day');
  const d = DAYS[period];
  const smokeMin = reality.smokingMinutes * d;
  const lifeMin = reality.lifeLostMinutes * d;
  const money = reality.cost * d;
  const cigs = reality.cigarettes * d;
  const packs = cigs / Math.max(1, profile.cigarettesInPack);
  const lineMeters = (cigs * 0.084).toFixed(cigs * 0.084 >= 100 ? 0 : 1);
  const wakingShare = Math.min(100, Math.round((reality.smokingMinutes / 960) * 100));

  const labels: Record<Period, string> = {
    day: isFr ? 'Par jour' : 'Per day',
    year: isFr ? 'Par an' : 'Per year',
    decade: isFr ? 'Sur 10 ans' : '10 years',
  };

  const fmtTime = (minutes: number) => {
    if (minutes < 90) return `${Math.round(minutes)} min`;
    const h = minutes / 60;
    if (h < 48) return `${h.toFixed(1)} ${isFr ? 'h' : 'hrs'}`;
    return `${(h / 24).toFixed(1)} ${isFr ? 'jours' : 'days'}`;
  };

  return (
    <MorphicCard variant="elevated" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/25">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {isFr ? 'Votre Réalité Quotidienne' : 'Your Daily Reality'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isFr ? 'L\'impact réel et cumulé de votre consommation' : 'What your habit really adds up to'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-900/60 border border-white/10">
        {(Object.keys(DAYS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => {
              sound.playClick();
              setPeriod(p);
            }}
            className={`py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
              period === p ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {labels[p]}
          </button>
        ))}
      </div>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 rounded-2xl glass-panel">
          <Cigarette className="w-4 h-4 mx-auto text-amber-400" />
          <div className="text-lg font-extrabold text-white mt-1 tabular-nums">{Math.round(cigs).toLocaleString()}</div>
          <div className="text-[10px] text-slate-400">{isFr ? 'cigarettes' : 'cigarettes'}</div>
        </div>
        <div className="p-3 rounded-2xl glass-panel">
          <Wind className="w-4 h-4 mx-auto text-cyan-400" />
          <div className="text-lg font-extrabold text-white mt-1 tabular-nums">{Math.round(reality.puffs * d).toLocaleString()}</div>
          <div className="text-[10px] text-slate-400">{isFr ? 'bouffées de vape' : 'vape puffs'}</div>
        </div>
        <div className="p-3 rounded-2xl glass-panel">
          <Leaf className="w-4 h-4 mx-auto text-lime-400" />
          <div className="text-lg font-extrabold text-white mt-1 tabular-nums">{Math.round(reality.joints * d).toLocaleString()}</div>
          <div className="text-[10px] text-slate-400">{isFr ? 'joints' : 'joints'}</div>
        </div>
      </div>

      {/* Consequences */}
      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center justify-between p-3 rounded-2xl glass-panel">
          <span className="flex items-center gap-2 text-xs text-slate-300">
            <Wallet className="w-4 h-4 text-amber-400" />
            {isFr ? 'Argent parti en fumée' : 'Money burned'}
          </span>
          <span className="text-sm font-extrabold text-amber-300 tabular-nums">{profile.currency}{Math.round(money).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl glass-panel">
          <span className="flex items-center gap-2 text-xs text-slate-300">
            <Clock className="w-4 h-4 text-sky-400" />
            {isFr ? 'Temps passé à fumer' : 'Time spent smoking'}
          </span>
          <span className="text-sm font-extrabold text-sky-300 tabular-nums">{fmtTime(smokeMin)}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-2xl glass-panel">
          <span className="flex items-center gap-2 text-xs text-slate-300">
            <HeartCrack className="w-4 h-4 text-rose-400" />
            {isFr ? 'Espérance de vie perdue estimée' : 'Estimated life lost'}
          </span>
          <span className="text-sm font-extrabold text-rose-300 tabular-nums">{fmtTime(lifeMin)}</span>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
        <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
          <Flame className="w-3.5 h-3.5" />
          {isFr ? 'Mise en perspective clinique' : 'Put it in perspective'}
        </div>
        {reality.wakingMinutesPerCig !== null && (
          <p>
            {isFr
              ? `Vous allumiez environ toutes les `
              : `You light up about every `}
            <b className="text-white">{reality.wakingMinutesPerCig} {isFr ? 'minutes' : 'minutes'}</b>
            {isFr ? ` de votre journée d'éveil, soit ` : ` of your waking day, and about `}
            <b className="text-white">{wakingShare}%</b>
            {isFr ? ` de vos journées passées à inhaler de la fumée.` : ` of that day is spent smoking.`}
          </p>
        )}
        <p>
          {Math.round(cigs).toLocaleString()} {isFr ? 'cigarettes représentent environ ' : 'cigarettes is about '}
          <b className="text-white">{Math.round(packs).toLocaleString()} {isFr ? 'paquets' : 'packs'}</b>,
          {isFr ? ' soit une ligne ininterrompue de ' : ' or a line of cigarettes '}
          <b className="text-white">{lineMeters} m</b> {isFr ? 'de long.' : 'long.'}
        </p>
        <p className="text-[10px] text-slate-400">
          {isFr
            ? 'Temps de vie calculé d\'après l\'étude du British Medical Journal (2000) : environ 11 minutes par cigarette. Estimations cliniques moyennes.'
            : 'Life lost uses the BMJ (2000) estimate of about 11 minutes per cigarette; vapes are counted at 15 puffs per cigarette-equivalent. These are estimates, not predictions.'}
        </p>
      </div>
    </MorphicCard>
  );
};
