import { useState, useEffect } from 'react';
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
import { AppLockScreen } from './components/AppLockScreen';
import { isSecurityEnabled } from './utils/security';
import { formatDuration } from './utils/dates';
import { t } from './utils/i18n';

export function App() {
  const store = useAppStore();
  const { profile, stats, report, actions } = store;
  const lang = profile.language || 'en';

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isUnlocked, setIsUnlocked] = useState(() => !isSecurityEnabled());
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(!profile.isOnboarded);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Auto-hide bottom navigation on scroll down, show on scroll up
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 30) {
        setShowBottomNav(true);
      } else if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 8) {
        // Scrolling DOWN -> hide bottom bar to free up space
        setShowBottomNav(false);
      } else if (currentScrollY < lastScrollY && lastScrollY - currentScrollY > 8) {
        // Scrolling UP -> reveal bottom bar
        setShowBottomNav(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const goTab = (tab: TabType) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isUnlocked) {
    return <AppLockScreen onUnlock={() => setIsUnlocked(true)} language={lang} />;
  }

  return (
    <div className="min-h-screen w-full flex justify-center bg-slate-950 sm:bg-slate-950/85 transition-colors">
      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative selection:bg-emerald-500/30 sm:border-x sm:border-white/10 sm:shadow-[0_0_80px_rgba(0,0,0,0.7)] transition-all">
        {/* Fixed / Sticky Top Bar (Contains centered PuffinLess pill + Header) */}
        <div className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-xl border-b border-white/5 transition-colors">
          {/* Centered PuffinLess pill only - no time, battery or service icons */}
          <div className="w-full px-4 pt-[max(env(safe-area-inset-top),0.5rem)] pb-1 flex items-center justify-center select-none">
            <div className="h-5 px-3 rounded-full bg-slate-900/90 border border-emerald-500/30 flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-[10px] text-emerald-300 font-extrabold tracking-wide">PuffinLess</span>
            </div>
          </div>

          <Header
            profile={profile}
            streakLabel={`${formatDuration(stats.elapsedSeconds)} ${t('smokeFree', lang)}`}
            tier={stats.level.tier}
            onOpenSos={() => setIsSosOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onToggleTheme={actions.toggleTheme}
          />
        </div>

        <main className="flex-1 w-full mx-auto px-4 pt-4">
        {currentTab === 'dashboard' && (
          <DashboardView
            profile={profile}
            stats={stats}
            report={report}
            cravings={store.cravings}
            sleepEnergyLogs={store.sleepLogs}
            substanceLogs={store.substanceLogs}
            onLogSubstance={actions.logSubstance}
            onRemoveSubstance={actions.removeSubstance}
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
            onDeleteGoal={actions.deleteGoal}
          />
        )}
        {currentTab === 'wellness' && (
          <WellnessView
            report={report}
            sleepEnergyLogs={store.sleepLogs}
            substanceLogs={store.substanceLogs}
            cravings={store.cravings}
            language={lang}
          />
        )}
        {currentTab === 'rewards' && (
          <RewardsView
            stats={stats}
            currency={profile.currency}
            language={lang}
            profile={profile}
            report={report}
          />
        )}
      </main>

      <Navigation currentTab={currentTab} onSelectTab={goTab} language={lang} isVisible={showBottomNav} />

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
        key={`onboarding-${isOnboardingOpen}-${onboardingStep}`}
        isOpen={isOnboardingOpen}
        initialProfile={profile}
        initialStep={onboardingStep}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={(p) => {
          actions.completeOnboarding(p);
          setIsOnboardingOpen(false);
        }}
      />

      {isProfileOpen && (
        <ProfileModal
          key={`profile-${profile.updatedAt || profile.quitDate || 'modal'}`}
          isOpen={isProfileOpen}
          profile={profile}
          onClose={() => setIsProfileOpen(false)}
          onSaveProfile={actions.updateProfile}
          onRerunOnboarding={(step = 1) => {
            setOnboardingStep(step);
            setIsOnboardingOpen(true);
          }}
          onResetData={() => {
            actions.resetAll();
            setOnboardingStep(1);
            setIsOnboardingOpen(true);
          }}
        />
      )}
    </div>
  </div>
);
}

export default App;
