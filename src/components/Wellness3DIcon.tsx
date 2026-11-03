import React from 'react';

export type WellnessIconType = 'mind' | 'library' | 'sleep' | 'breathe' | 'quotes';

interface Wellness3DIconProps {
  type: WellnessIconType;
  size?: number;
  className?: string;
}

export const Wellness3DIcon: React.FC<Wellness3DIconProps> = ({
  type,
  size = 28,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none drop-shadow-md transition-transform duration-300 hover:scale-110 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 1. 3D GLOSSY BRAIN (MENTAL / MIND) */}
      {type === 'mind' && (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="brainLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="brainRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="50%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
            <linearGradient id="brainSpec" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="28" fill="url(#brainGlow)" />
          {/* Left Hemisphere */}
          <path
            d="M30 16C23 16 16 21 16 29C16 32 17.5 35 19 37C17 39 16 42 16 45C16 51 22 55 29 55C29.7 55 30 54 30 53V16Z"
            fill="url(#brainLeft)"
            stroke="#a21caf"
            strokeWidth="1.5"
          />
          {/* Right Hemisphere */}
          <path
            d="M34 16C41 16 48 21 48 29C48 32 46.5 35 45 37C47 39 48 42 48 45C48 51 42 55 35 55C34.3 55 34 54 34 53V16Z"
            fill="url(#brainRight)"
            stroke="#7e22ce"
            strokeWidth="1.5"
          />
          {/* Neural Folds & Highlights */}
          <path
            d="M21 27C24 25 28 27 28 31M21 43C25 41 28 44 29 48M43 27C40 25 36 27 36 31M43 43C39 41 36 44 35 48"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.75"
          />
          {/* Top 3D Specular Sheen */}
          <ellipse cx="26" cy="22" rx="5" ry="2.5" fill="url(#brainSpec)" transform="rotate(-15 26 22)" />
          <ellipse cx="38" cy="22" rx="5" ry="2.5" fill="url(#brainSpec)" transform="rotate(15 38 22)" />
        </svg>
      )}

      {/* 2. 3D GLOSSY BOOKS (LIBRARY / BIBLIOTHÈQUE) */}
      {type === 'library' && (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bookBottom" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>
            <linearGradient id="bookMid" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="bookTop" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="bookPages" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
          {/* Bottom Book */}
          <rect x="12" y="44" width="40" height="10" rx="3" fill="url(#bookBottom)" stroke="#042f2e" strokeWidth="1.5" />
          <rect x="42" y="46" width="8" height="6" rx="1" fill="url(#bookPages)" />
          {/* Middle Book */}
          <rect x="14" y="32" width="37" height="9" rx="3" fill="url(#bookMid)" stroke="#172554" strokeWidth="1.5" />
          <rect x="41" y="34" width="8" height="5" rx="1" fill="url(#bookPages)" />
          {/* Top Book (Slight angle for 3D stack depth) */}
          <g transform="rotate(-3 32 23)">
            <rect x="16" y="20" width="34" height="9" rx="3" fill="url(#bookTop)" stroke="#78350f" strokeWidth="1.5" />
            <rect x="40" y="22" width="8" height="5" rx="1" fill="url(#bookPages)" />
            {/* Red silk ribbon bookmark */}
            <path d="M28 20V32L31 29L34 32V20H28Z" fill="#ef4444" />
          </g>
          {/* Specular shine */}
          <path d="M16 21H48" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" strokeLinecap="round" />
        </svg>
      )}

      {/* 3. 3D GLOSSY MOON & CLOUD (SLEEP / SOMMEIL) */}
      {type === 'sleep' && (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="30" r="26" fill="url(#moonGlow)" />
          {/* Golden 3D Crescent Moon */}
          <path
            d="M38 12C26.95 12 18 20.95 18 32C18 43.05 26.95 52 38 52C40.6 52 43.07 51.5 45.32 50.59C39.42 47.93 35.25 41.97 35.25 35C35.25 28.03 39.42 22.07 45.32 19.41C43.07 18.5 40.6 18 38 18V12Z"
            fill="url(#moonGrad)"
            stroke="#d97706"
            strokeWidth="1.5"
          />
          {/* Sparkle stars */}
          <path d="M46 16L47.5 21L52 22L47.5 23L46 28L44.5 23L40 22L44.5 21L46 16Z" fill="#ffffff" />
          <path d="M22 18L23 21L26 21.5L23 22L22 25L21 22L18 21.5L21 21L22 18Z" fill="#fde047" opacity="0.8" />
          {/* Glossy Bedtime Cloud */}
          <path
            d="M20 46C20 42.7 22.7 40 26 40C26.9 40 27.8 40.2 28.5 40.6C29.8 37.8 32.7 36 36 36C40.4 36 44 39.6 44 44C45.7 44 47 45.3 47 47C47 48.7 45.7 50 44 50H24C21.8 50 20 48.2 20 46Z"
            fill="url(#cloudGrad)"
            stroke="#312e81"
            strokeWidth="1.2"
            opacity="0.9"
          />
        </svg>
      )}

      {/* 4. 3D GLOSSY LUNGS & BREATH AURA (BREATHE / RESPIRATION) */}
      {type === 'breathe' && (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="breathAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="lungLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5eead4" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>
            <linearGradient id="lungRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="26" fill="url(#breathAura)" />
          {/* Trachea */}
          <path d="M32 14V26M30 20H34M30 24H34" stroke="#e0f2fe" strokeWidth="2.5" strokeLinecap="round" />
          {/* Left Lung lobe */}
          <path
            d="M30 26C24 24 16 29 16 38C16 46 22 52 29 52C30 52 30 46 30 38V26Z"
            fill="url(#lungLeft)"
            stroke="#115e59"
            strokeWidth="1.5"
          />
          {/* Right Lung lobe */}
          <path
            d="M34 26C40 24 48 29 48 38C48 46 42 52 35 52C34 52 34 46 34 38V26Z"
            fill="url(#lungRight)"
            stroke="#155e75"
            strokeWidth="1.5"
          />
          {/* Dynamic Air Flow waves */}
          <path
            d="M22 36C25 34 27 36 27 40M42 36C39 34 37 36 37 40"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
          {/* Breath particles */}
          <circle cx="20" cy="18" r="1.5" fill="#a5f3fc" />
          <circle cx="44" cy="18" r="1.5" fill="#99f6e4" />
        </svg>
      )}

      {/* 5. 3D GLOSSY GOLDEN QUOTE BUBBLE (CITATIONS) */}
      {type === 'quotes' && (
        <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="quoteGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="quoteBubble" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="26" fill="url(#quoteGlow)" />
          {/* Glossy Quote Bubble */}
          <path
            d="M16 18C16 14.7 18.7 12 22 12H42C45.3 12 48 14.7 48 18V36C48 39.3 45.3 42 42 42H28L18 50V42H22C18.7 42 16 39.3 16 36V18Z"
            fill="url(#quoteBubble)"
            stroke="#78350f"
            strokeWidth="1.5"
          />
          {/* 3D Quotation Marks */}
          <path
            d="M24 24C24 22 25.5 21 27.5 21C28.5 21 29 21.8 29 23C29 25 27 27 25 28M33 24C33 22 34.5 21 36.5 21C37.5 21 38 21.8 38 23C38 25 36 27 34 28"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Specular Glint */}
          <circle cx="43" cy="17" r="2" fill="#ffffff" fillOpacity="0.85" />
        </svg>
      )}
    </div>
  );
};
