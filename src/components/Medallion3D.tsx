import React from 'react';
import {
  Award,
  Trophy,
  Shield,
  Hourglass,
  Flame,
  Heart,
  Brain,
  Zap,
  Sparkles,
  Crown,
  Target,
  Coins,
  Sun,
  Mountain,
  ShieldCheck,
  PiggyBank,
  Gem,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import type { Badge } from '../types';

interface Medallion3DProps {
  tier: Badge['tier'];
  iconName?: string;
  isUnlocked: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

export const Medallion3D: React.FC<Medallion3DProps> = ({
  tier,
  iconName = 'Award',
  isUnlocked,
  size = 'md',
  className = '',
  showGlow = true,
}) => {
  // Dimensions
  const sizeConfig = {
    sm: { box: 'w-10 h-10', icon: 'w-5 h-5', border: 'p-1', star: 'w-2 h-2' },
    md: { box: 'w-14 h-14 sm:w-16 sm:h-16', icon: 'w-7 h-7 sm:w-8 sm:h-8', border: 'p-1.5', star: 'w-2.5 h-2.5' },
    lg: { box: 'w-20 h-20 sm:w-24 sm:h-24', icon: 'w-10 h-10 sm:w-12 sm:h-12', border: 'p-2', star: 'w-3.5 h-3.5' },
    xl: { box: 'w-28 h-28 sm:w-32 sm:h-32', icon: 'w-14 h-14 sm:w-16 sm:h-16', border: 'p-2.5', star: 'w-4 h-4' },
  }[size];

  // Resolve Icon
  const renderIcon = () => {
    if (!isUnlocked) return <Lock className={`${sizeConfig.icon} text-slate-500 drop-shadow-md`} />;
    const iconClass = `${sizeConfig.icon} text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110`;

    switch (iconName?.toLowerCase()) {
      case 'hourglass': return <Hourglass className={iconClass} />;
      case 'shield': return <Shield className={iconClass} />;
      case 'shieldcheck': return <ShieldCheck className={iconClass} />;
      case 'flame': return <Flame className={iconClass} />;
      case 'heart': return <Heart className={iconClass} />;
      case 'brain': return <Brain className={iconClass} />;
      case 'zap': return <Zap className={iconClass} />;
      case 'sparkles': return <Sparkles className={iconClass} />;
      case 'crown': return <Crown className={iconClass} />;
      case 'target': return <Target className={iconClass} />;
      case 'coins': return <Coins className={iconClass} />;
      case 'trophy': return <Trophy className={iconClass} />;
      case 'sun': return <Sun className={iconClass} />;
      case 'mountain': return <Mountain className={iconClass} />;
      case 'piggybank': return <PiggyBank className={iconClass} />;
      case 'gem': return <Gem className={iconClass} />;
      case 'checkcircle2': return <CheckCircle2 className={iconClass} />;
      default: return <Award className={iconClass} />;
    }
  };

  // Tier 3D styling presets
  const tierStyles = {
    bronze: {
      rim: 'bg-gradient-to-br from-amber-600 via-amber-400 to-amber-900 border-amber-500/70 shadow-amber-950/40',
      coin: 'bg-gradient-to-tr from-amber-900 via-amber-700 to-amber-500 text-amber-100',
      innerGlow: 'inset 0 2px 2px rgba(255, 230, 180, 0.4), inset 0 -3px 4px rgba(0, 0, 0, 0.6)',
      glowColor: 'rgba(217, 119, 6, 0.45)',
      haloGlow: 'shadow-[0_0_35px_-5px_rgba(217,119,6,0.6)]',
    },
    silver: {
      rim: 'bg-gradient-to-br from-slate-200 via-white to-slate-400 border-slate-300 shadow-slate-900/40',
      coin: 'bg-gradient-to-tr from-slate-600 via-slate-400 to-slate-200 text-white',
      innerGlow: 'inset 0 2px 3px rgba(255, 255, 255, 0.8), inset 0 -3px 4px rgba(15, 23, 42, 0.5)',
      glowColor: 'rgba(203, 213, 225, 0.55)',
      haloGlow: 'shadow-[0_0_35px_-5px_rgba(203,213,225,0.7)]',
    },
    gold: {
      rim: 'bg-gradient-to-br from-amber-300 via-yellow-100 to-amber-600 border-yellow-300 shadow-amber-500/50',
      coin: 'bg-gradient-to-tr from-amber-700 via-amber-500 to-yellow-300 text-yellow-50',
      innerGlow: 'inset 0 2.5px 3.5px rgba(255, 255, 255, 0.75), inset 0 -3px 5px rgba(120, 53, 15, 0.7)',
      glowColor: 'rgba(245, 158, 11, 0.65)',
      haloGlow: 'shadow-[0_0_40px_-5px_rgba(245,158,11,0.75)]',
    },
    platinum: {
      rim: 'bg-gradient-to-br from-cyan-200 via-teal-100 to-indigo-500 border-cyan-300 shadow-teal-500/40',
      coin: 'bg-gradient-to-tr from-teal-800 via-cyan-600 to-teal-300 text-cyan-50',
      innerGlow: 'inset 0 2.5px 3.5px rgba(255, 255, 255, 0.8), inset 0 -3px 5px rgba(19, 78, 74, 0.7)',
      glowColor: 'rgba(20, 184, 166, 0.65)',
      haloGlow: 'shadow-[0_0_40px_-5px_rgba(20,184,166,0.75)]',
    },
    diamond: {
      rim: 'bg-gradient-to-br from-indigo-300 via-purple-100 to-pink-400 border-purple-300 shadow-purple-500/50',
      coin: 'bg-gradient-to-tr from-purple-900 via-indigo-600 to-pink-300 text-white',
      innerGlow: 'inset 0 3px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(88, 28, 135, 0.7)',
      glowColor: 'rgba(168, 85, 247, 0.7)',
      haloGlow: 'shadow-[0_0_45px_-5px_rgba(168,85,247,0.85)]',
    },
  }[tier] || {
    rim: 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300',
    coin: 'bg-gradient-to-tr from-amber-700 to-yellow-400 text-white',
    innerGlow: 'inset 0 2px 2px rgba(255,255,255,0.4)',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    haloGlow: 'shadow-lg',
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* 1. Illumination Hover Glow Halo */}
      {isUnlocked && showGlow && (
        <div
          className={`absolute inset-0 rounded-full blur-xl opacity-40 group-hover:opacity-100 transition-all duration-500 pointer-events-none scale-110 group-hover:scale-135`}
          style={{ backgroundColor: tierStyles.glowColor }}
        />
      )}

      {/* 2. Concentric 3D Metallic Outer Rim */}
      <div
        className={`${sizeConfig.box} ${sizeConfig.border} rounded-full border shadow-xl transition-all duration-500 relative flex items-center justify-center ${
          isUnlocked
            ? `${tierStyles.rim} group-hover:${tierStyles.haloGlow} group-hover:scale-105 active:scale-95`
            : 'bg-gradient-to-br from-slate-800 to-slate-950 border-white/10 shadow-black/60'
        }`}
      >
        {/* 3. Inner 3D Coin Plate with Specular Lighting & Bevel */}
        <div
          className={`w-full h-full rounded-full flex items-center justify-center relative overflow-hidden transition-transform duration-300 ${
            isUnlocked
              ? `${tierStyles.coin}`
              : 'bg-slate-900 border border-white/5'
          }`}
          style={{
            boxShadow: isUnlocked ? tierStyles.innerGlow : 'inset 0 2px 4px rgba(0,0,0,0.8)',
          }}
        >
          {/* 4. Specular Curved Light Glare (3D Glass Sheen) */}
          {isUnlocked && (
            <div className="absolute -top-3 -left-3 w-3/4 h-3/4 bg-gradient-to-br from-white/45 via-white/10 to-transparent rounded-full blur-[0.5px] pointer-events-none transform -rotate-12" />
          )}

          {/* 5. Shimmer Sweep on Hover */}
          {isUnlocked && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
          )}

          {/* 6. Centered Medallion Icon */}
          <div className="relative z-10 flex items-center justify-center">
            {renderIcon()}
          </div>
        </div>
      </div>
    </div>
  );
};
