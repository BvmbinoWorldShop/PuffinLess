import React, { useState } from 'react';

export type Icon3DType = 'cigarette' | 'weed' | 'lighter' | 'pack' | 'vape' | 'rolling_paper';

interface Dynamic3DIconProps {
  size?: number;
  className?: string;
  forcedType?: Icon3DType;
  onClick?: () => void;
}

const ICONS_LIST: Icon3DType[] = ['cigarette', 'weed', 'lighter', 'pack', 'vape', 'rolling_paper'];

export const Dynamic3DIcon: React.FC<Dynamic3DIconProps> = ({
  size = 40,
  className = '',
  forcedType,
  onClick,
}) => {
  const [currentIcon, setCurrentIcon] = useState<Icon3DType>(() => {
    if (forcedType) return forcedType;
    try {
      const prevIdx = sessionStorage.getItem('puffinless_3d_icon_idx');
      const nextIdx = prevIdx !== null ? (parseInt(prevIdx, 10) + 1) % ICONS_LIST.length : Math.floor(Math.random() * ICONS_LIST.length);
      sessionStorage.setItem('puffinless_3d_icon_idx', nextIdx.toString());
      return ICONS_LIST[nextIdx];
    } catch {
      return 'cigarette';
    }
  });

  const activeIcon = forcedType || currentIcon;

  const cycleIcon = () => {
    setCurrentIcon((prev) => {
      const idx = (ICONS_LIST.indexOf(prev) + 1) % ICONS_LIST.length;
      return ICONS_LIST[idx];
    });
    if (onClick) onClick();
  };

  return (
    <div
      onClick={cycleIcon}
      title="Tap to switch 3D Habit Icon"
      className={`relative inline-flex items-center justify-center cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 3D ICON 1: CIGARETTE */}
      {activeIcon === 'cigarette' && (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="cigShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="cigBody" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#EDEDED" />
              <stop offset="100%" stopColor="#D4D4D8" />
            </linearGradient>
            <linearGradient id="cigFilter" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="cigEmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="40%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
            <linearGradient id="cigGoldRing" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
          {/* Ground drop shadow */}
          <ellipse cx="32" cy="56" rx="22" ry="5" fill="url(#cigShadow)" />
          {/* Cigarette cylinder rotated 35deg */}
          <g transform="rotate(-32 32 32)">
            {/* Filter cork */}
            <rect x="10" y="27" width="14" height="10" rx="3" fill="url(#cigFilter)" stroke="#B45309" strokeWidth="0.5" />
            {/* Gold band */}
            <rect x="23" y="27" width="2" height="10" fill="url(#cigGoldRing)" />
            {/* White cylinder */}
            <rect x="25" y="27" width="26" height="10" rx="2" fill="url(#cigBody)" stroke="#E4E4E7" strokeWidth="0.5" />
            {/* Specular highlight along the cylinder top */}
            <path d="M12 28.5 H50" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
            {/* Ember tip */}
            <ellipse cx="51" cy="32" rx="2" ry="4.8" fill="url(#cigEmber)" />
            <circle cx="51.5" cy="31" r="1.2" fill="#FDE047" opacity="0.9" />
            {/* Ash speckles */}
            <circle cx="49" cy="33.5" r="0.6" fill="#71717A" />
          </g>
          {/* 3D Smoke ring curls */}
          <path d="M46 22 C48 16 52 14 50 8 C48 4 44 6 42 3" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" opacity="0.75" />
        </svg>
      )}

      {/* 3D ICON 2: CANNABIS WEED LEAF */}
      {activeIcon === 'weed' && (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="weedShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="weedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="45%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>
            <linearGradient id="weedHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          {/* Shadow */}
          <ellipse cx="32" cy="56" rx="18" ry="4.5" fill="url(#weedShadow)" />
          {/* Stem */}
          <path d="M32 54 L32 42" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
          {/* 5-Lobe 3D Leaf */}
          {/* Bottom left lobe */}
          <path d="M32 42 C22 46 16 42 14 38 C18 36 24 37 32 40 Z" fill="url(#weedGrad)" stroke="#064E3B" strokeWidth="0.8" />
          {/* Bottom right lobe */}
          <path d="M32 42 C42 46 48 42 50 38 C46 36 40 37 32 40 Z" fill="url(#weedGrad)" stroke="#064E3B" strokeWidth="0.8" />
          {/* Mid left lobe */}
          <path d="M32 38 C16 32 14 26 12 18 C20 20 26 26 32 34 Z" fill="url(#weedHighlight)" stroke="#064E3B" strokeWidth="0.8" />
          {/* Mid right lobe */}
          <path d="M32 38 C48 32 50 26 52 18 C44 20 38 26 32 34 Z" fill="url(#weedHighlight)" stroke="#064E3B" strokeWidth="0.8" />
          {/* Central main tall lobe */}
          <path d="M32 36 C27 24 28 14 32 6 C36 14 37 24 32 36 Z" fill="url(#weedGrad)" stroke="#064E3B" strokeWidth="1" />
          {/* Vein lines */}
          <path d="M32 10 L32 42" stroke="#D1FAE5" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
          <path d="M32 24 L24 20" stroke="#D1FAE5" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
          <path d="M32 24 L40 20" stroke="#D1FAE5" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
        </svg>
      )}

      {/* 3D ICON 3: METALLIC FLIP LIGHTER WITH FLAME */}
      {activeIcon === 'lighter' && (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lighterBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="40%" stopColor="#059669" />
              <stop offset="100%" stopColor="#022C22" />
            </linearGradient>
            <linearGradient id="metalChrome" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="30%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>
          </defs>
          {/* Shadow */}
          <ellipse cx="32" cy="58" rx="16" ry="4" fill="rgba(0,0,0,0.35)" />
          {/* Lighter Rect Body */}
          <rect x="20" y="28" width="24" height="28" rx="4" fill="url(#lighterBody)" stroke="#34D399" strokeWidth="0.8" />
          {/* Body metallic reflection bevel */}
          <path d="M23 30 V54" stroke="#A7F3D0" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          {/* Chrome chimney / guard */}
          <rect x="24" y="20" width="16" height="8" rx="1.5" fill="url(#metalChrome)" stroke="#64748B" strokeWidth="0.5" />
          {/* Chimney air holes */}
          <circle cx="28" cy="24" r="1" fill="#1E293B" />
          <circle cx="32" cy="24" r="1" fill="#1E293B" />
          <circle cx="36" cy="24" r="1" fill="#1E293B" />
          {/* Flint wheel */}
          <rect x="36" y="21" width="5" height="6" rx="1" fill="#CBD5E1" stroke="#475569" strokeWidth="0.5" />
          {/* 3D Glowing Teardrop Flame */}
          <path
            d="M30 20 C27 15 26 10 32 4 C37 10 36 15 32 20 Z"
            fill="url(#flameGrad)"
            stroke="#FEF08A"
            strokeWidth="0.8"
          />
          {/* Inner blue oxygen core */}
          <ellipse cx="31.5" cy="18" rx="2" ry="2.5" fill="#60A5FA" opacity="0.85" />
        </svg>
      )}

      {/* 3D ICON 4: ISOMETRIC CIGARETTE PACK */}
      {activeIcon === 'pack' && (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="packFront" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="60%" stopColor="#020617" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="packGoldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
          {/* Shadow */}
          <ellipse cx="32" cy="58" rx="20" ry="4.5" fill="rgba(0,0,0,0.4)" />
          {/* Main pack box */}
          <rect x="18" y="22" width="28" height="34" rx="4" fill="url(#packFront)" stroke="#10B981" strokeWidth="1" />
          {/* Flip-lid top slightly ajar */}
          <path d="M18 24 L22 14 H42 L46 24 Z" fill="url(#packGoldFoil)" stroke="#F59E0B" strokeWidth="0.8" />
          {/* Tips of cigarettes peeking out */}
          <ellipse cx="26" cy="14" rx="2.5" ry="1.5" fill="#FBBF24" />
          <ellipse cx="32" cy="13.5" rx="2.5" ry="1.5" fill="#FBBF24" />
          <ellipse cx="38" cy="14" rx="2.5" ry="1.5" fill="#FBBF24" />
          {/* Pack brand emblem */}
          <path d="M25 36 L32 30 L39 36 L32 42 Z" fill="#10B981" stroke="#34D399" strokeWidth="0.8" />
          <circle cx="32" cy="36" r="2" fill="#FDE047" />
          {/* White label bottom band */}
          <rect x="22" y="47" width="20" height="5" rx="1.5" fill="#FFFFFF" fillOpacity="0.9" />
        </svg>
      )}

      {/* 3D ICON 5: 3D VAPE POD / PUFF BAR */}
      {activeIcon === 'vape' && (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="vapeBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="vapeGloss" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Shadow */}
          <ellipse cx="32" cy="58" rx="16" ry="4" fill="rgba(0,0,0,0.35)" />
          {/* Vape Pen Cylinder (rotated) */}
          <g transform="rotate(-15 32 32)">
            {/* Mouthpiece */}
            <path d="M28 10 H36 V17 H28 Z" rx="2" fill="#0F172A" stroke="#334155" strokeWidth="0.8" />
            {/* Pod Body */}
            <rect x="25" y="17" width="14" height="38" rx="6" fill="url(#vapeBody)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            {/* Specular high gloss stripe */}
            <rect x="27" y="19" width="3" height="34" rx="1.5" fill="url(#vapeGloss)" />
            {/* Indicator light ring */}
            <rect x="28" y="52" width="8" height="2" rx="1" fill="#34D399" />
          </g>
          {/* Cloud vapor puff */}
          <circle cx="44" cy="14" r="6" fill="#E2E8F0" fillOpacity="0.4" />
          <circle cx="49" cy="11" r="4.5" fill="#E2E8F0" fillOpacity="0.3" />
        </svg>
      )}

      {/* 3D ICON 6: ROLLING PAPERS & JOINT */}
      {activeIcon === 'rolling_paper' && (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="70%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="tipGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
          </defs>
          {/* Shadow */}
          <ellipse cx="32" cy="56" rx="20" ry="4.5" fill="rgba(0,0,0,0.35)" />
          {/* Rolled cone diagonal */}
          <g transform="rotate(-38 32 32)">
            {/* Brown filter roach */}
            <rect x="8" y="29" width="12" height="6" rx="1.5" fill="url(#tipGrad)" />
            {/* White cone body tapering outward */}
            <path d="M20 29 L54 26 L54 38 L20 35 Z" fill="url(#paperGrad)" stroke="#94A3B8" strokeWidth="0.6" />
            {/* Twist tip */}
            <path d="M54 28 C57 30 58 34 54 36 Z" fill="#10B981" />
            {/* Gloss crease */}
            <path d="M12 30 H52" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
          </g>
          {/* Sparkles */}
          <circle cx="48" cy="18" r="1.5" fill="#FBBF24" />
          <circle cx="43" cy="12" r="1" fill="#34D399" />
        </svg>
      )}
    </div>
  );
};
