import { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Sparkles } from 'lucide-react';
import { useAppStore } from './state/useAppStore';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import type { TabType } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { MoneyView } from './components/MoneyView';
import { WellnessView } from './components/WellnessView';
import { RewardsView } from './components/RewardsView';
import { SosModal } from './components/SosModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfileModal } from './components/ProfileModal';
import { formatDuration } from './utils/dates';
import { t } from './utils/i18n';

export function App() {
  const store = useAppStore();
  const { profile, stats, report, actions } = store;
  const lang = profile.language || 'en';

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(!profile.isOnboarded);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  const [timeStr, setTimeStr] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const goTab = (tab: TabType) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const content = (
    <div className="min-h-screen flex flex-col relative selection:bg-emerald-500/30">
      {/* Status bar (Always visible with dynamic safe-area for iPhone) */}
      <div className="w-full px-4 sm:px-6 pt-[max(env(safe-area-inset-top),0.5rem)] pb-1 flex items-center justify-between text-xs text-slate-400 font-medium select-none">
        <span className="font-semibold text-slate-200 tabular-nums">{timeStr}</span>
        <div className="h-5 px-2.5 rounded-full bg-slate-900/90 border border-emerald-500/30 flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="text-[10px] text-emerald-300 font-extrabold tracking-wide">PuffinLess</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Signal className="w-3.5 h-3.5" />
          <Wifi className="w-3.5 h-3.5" />
          <Battery className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      </div>

      <Header
        profile={profile}
        streakLabel={`${formatDuration(stats.elapsedSeconds)} ${t('smokeFree', lang)}`}
        tier={stats.level.tier}
        onOpenSos={() => setIsSosOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onToggleTheme={actions.toggleTheme}
        isMobileDeviceFrame={isMobileFrame}
        onToggleDeviceFrame={() => setIsMobileFrame(!isMobileFrame)}
      />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-4">
        {currentTab === 'dashboard' && (
          <DashboardView
            profile={profile}
            stats={stats}
            report={report}
            cravings={store.cravings}
            sleepEnergyLogs={store.sleepLogs}
            onLogSubstance={actions.logSubstance}
            onSaveSleepEnergy={actions.saveSleepEnergyEntry}
            onOpenSos={() => setIsSosOpen(true)}
            onNavigateToTab={goTab}
          />
        )}
        {currentTab === 'money' && (
          <MoneyView
            profile={profile}
            stats={stats}
            goals={store.goals}
            expenses={store.expenses}
            onAddExpense={actions.addExpense}
            onDeleteExpense={actions.deleteExpense}
            onAddGoal={actions.addGoal}
            onToggleGoalComplete={actions.toggleGoal}
          />
        )}
        {currentTab === 'wellness' && <WellnessView report={report} sleepEnergyLogs={store.sleepLogs} language={lang} />}
        {currentTab === 'rewards' && <RewardsView stats={stats} currency={profile.currency} language={lang} />}
      </main>

      <Navigation currentTab={currentTab} onSelectTab={goTab} language={lang} />

      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        onResistedCraving={actions.resistCraving}
        onLogSlip={actions.logSubstance}
        currency={profile.currency}
        moneySaved={stats.moneySaved}
        language={lang}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        initialProfile={profile}
        onComplete={(p) => {
          actions.completeOnboarding(p);
          setIsOnboardingOpen(false);
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        profile={profile}
        onClose={() => setIsProfileOpen(false)}
        onSaveProfile={actions.updateProfile}
        onRerunOnboarding={() => setIsOnboardingOpen(true)}
        onResetData={() => {
          actions.resetAll();
          setIsOnboardingOpen(true);
        }}
      />
    </div>
  );

  if (isMobileFrame) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-6 overflow-y-auto">
        <div className="mb-3 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Phone preview</span>
          <button onClick={() => setIsMobileFrame(false)} className="text-emerald-400 hover:underline font-semibold ml-2">
            Full screen
          </button>
        </div>
        <div className="relative w-full max-w-[420px] h-[880px] rounded-[52px] bg-slate-950 border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(16,185,129,0.15)] overflow-hidden ring-1 ring-white/10">
          <div className="w-full h-full overflow-y-auto">{content}</div>
        </div>
      </div>
    );
  }

  return content;
}

export default App;
