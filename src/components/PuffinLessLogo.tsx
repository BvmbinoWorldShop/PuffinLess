import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const PuffinLessLogo: React.FC<LogoProps> = ({ className = '', size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="puffinLessBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        <linearGradient id="goldStreak" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        <linearGradient id="cleanAura" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Rounded Morphic Shield Backdrop */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="18"
        fill="url(#puffinLessBg)"
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth="1.5"
      />

      {/* Minimalist Break Cut & Clean Vapor Petal */}
      {/* 1. Cigarette base segment (left lower diagonal) */}
      <path
        d="M16 44 L28 32 C29 31 30.5 31 31.5 32 C32.5 33 32.5 34.5 31.5 35.5 L19.5 47.5 C18.5 48.5 17 48.5 16 47.5 C15 46.5 15 45 16 44 Z"
        fill="white"
        fillOpacity="0.9"
      />
      {/* Filter ring detail */}
      <path
        d="M18 46 L21 43"
        stroke="#f59e0b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* 2. Breaking Energy Sparks (The "Less" moment) */}
      <circle cx="34" cy="30" r="2" fill="#fbbf24" />
      <circle cx="38" cy="36" r="1.5" fill="#34d399" />

      {/* 3. Ascending Pure Leaf / Clean Breath Petal (dissolving smoke into life) */}
      <path
        d="M33 27 C34 19 44 14 49 14 C49 19 46 30 38 31 C35 31.5 32.5 29.5 33 27 Z"
        fill="url(#cleanAura)"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Leaf center spine / purity vein */}
      <path
        d="M36 27 Q41 22 47 16"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
    </svg>
  );
};
