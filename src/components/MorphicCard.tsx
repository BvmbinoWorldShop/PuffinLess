import React from 'react';

interface MorphicCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'emerald' | 'gold' | 'rose' | 'obsidian';
  onClick?: () => void;
}

const VARIANT_CLASS: Record<NonNullable<MorphicCardProps['variant']>, string> = {
  default: 'glass-panel',
  elevated: 'glass-panel-elevated',
  emerald: 'glass-panel-emerald',
  gold: 'glass-panel-gold',
  rose: 'glass-panel-rose',
  obsidian: 'glass-panel-obsidian',
};

export const MorphicCard: React.FC<MorphicCardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl p-5 transition-all duration-300 relative overflow-hidden ${VARIANT_CLASS[variant]} ${
        onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''
      } ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
