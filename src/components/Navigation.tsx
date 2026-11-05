import React from 'react';
import { LayoutDashboard, Coins, Wind, Award } from 'lucide-react';
import type { Language } from '../types';
import { t } from '../utils/i18n';
import { sound } from '../utils/audio';

export type TabType = 'dashboard' | 'money' | 'wellness' | 'rewards';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  language?: Language;
  isVisible?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab, language = 'en', isVisible = true }) => {
  const tabs = [
    { id: 'dashboard' as const, label: t('navTracker', language), icon: LayoutDashboard },
    { id: 'money' as const, label: t('navMoney', language), icon: Coins },
    { id: 'wellness' as const, label: t('navWellness', language), icon: Wind },
    { id: 'rewards' as const, label: t('navRewards', language), icon: Award },
  ];

  return (
    <div className={`fixed bottom-0 inset-x-0 z-40 p-3 pb-6 sm:pb-4 pointer-events-none transition-all duration-300 transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
    }`}>
      <nav className="max-w-md mx-auto pointer-events-auto rounded-3xl glass-panel-elevated p-2 shadow-2xl shadow-black/80 flex items-center justify-around border border-white/10 backdrop-blur-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                sound.vibrate(55);
                sound.playClick();
                onSelectTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'text-emerald-400 scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 bg-emerald-500/15 rounded-2xl border border-emerald-500/25 -z-10 shadow-lg shadow-emerald-500/10 animate-fade-in" />
              )}
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
              <span className={`text-[11px] mt-1 font-medium tracking-tight ${isActive ? 'font-semibold text-white' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
