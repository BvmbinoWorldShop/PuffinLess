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
import { PrivacyTermsModal } from './components/PrivacyTermsModal';
import { AppLockScreen } from './components/AppLockScreen';
import { isAppSessionUnlocked } from './utils/security';
import { formatDuration } from './utils/dates';
import { t } from './utils/i18n';

export function App() {
  const store = useAppStore();
  const { profile, stats, report, actions, isHydrated, persistenceError, clearPersistenceError } = store;
  const lang = profile.language || 'en';

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isUnlocked, setIsUnlocked] = useState(() => isAppSessionUnlocked());
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isManualOnboardingOpen, setIsManualOnboardingOpen] = useState(false);
  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return (
        localStorage.getItem('puffinless_is_onboarded') === 'true' ||
        Boolean(localStorage.getItem('puffinless_quit_date')) ||
        Boolean(localStorage.getItem('puffinless_profile_v2')) ||
        Boolean(localStorage.getItem('puffinless_profile')) ||
        Boolean(localStorage.getItem('puffinless_device_rescue_backup_v2'))
      );
    }
    return false;
  });
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPrivacyTermsOpen, setIsPrivacyTermsOpen] = useState(false);

  // Synchronize onboarding state with profile to permanently prevent presentation guide loop
  useEffect(() => {
    if (profile.isOnboarded) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('puffinless_is_onboarded', 'true');
      }
    }
  }, [profile.isOnboarded]);

  const hasOnboardedEvidence =
    profile.isOnboarded ||
    isOnboardingDismissed;

  const isOnboardingOpen = isManualOnboardingOpen || (isHydrated && !hasOnboardedEvidence);

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

  if (!isHydrated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#10b981]" />
          </div>
          <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">PuffinLess</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex justify-center bg-slate-950 sm:bg-slate-950/85 transition-colors">
      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative selection:bg-emerald-500/30 sm:border-x sm:border-white/10 sm:shadow-[0_0_80px_rgba(0,0,0,0.7)] transition-all">
        {/* Fixed / Sticky Top Bar (Contains centered PuffinLess pill + Header) */}
        <div className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-xl border-b border-white/5 transition-colors">
          {persistenceError && (
            <div data-testid="persistence-error-banner" className="w-full bg-rose-950/95 border-b border-rose-500/50 px-4 py-2 flex items-center justify-between text-xs text-rose-100 z-50 shadow-lg">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-2 h-2 shrink-0 rounded-full bg-rose-500 animate-ping" />
                <span className="font-bold text-rose-300 shrink-0">
                  {lang === 'fr' ? 'Erreur de stockage :' : 'Persistence Error:'}
                </span>
                <span className="truncate text-[11px] text-rose-200">{persistenceError.message}</span>
              </div>
              <button
                onClick={clearPersistenceError}
                className="ml-2 shrink-0 text-rose-200 hover:text-white px-2 py-0.5 rounded bg-rose-800/60 hover:bg-rose-700/80 text-[10px] font-bold tracking-wide transition-colors"
              >
                {lang === 'fr' ? 'Fermer' : 'Dismiss'}
              </button>
            </div>
          )}
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
            substanceLogs={store.substanceLogs}
            cravings={store.cravings}
            sleepLogs={store.sleepLogs}
            expenses={store.expenses}
          />
        )}
      </main>

      <Navigation currentTab={currentTab} onSelectTab={goTab} language={lang} isVisible={showBottomNav} />

      <SosModal
        key={`sos-${isSosOpen}-${profile.primarySubstance || 'default'}`}
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        onResistedCraving={actions.resistCraving}
        onLogSlip={actions.logSubstance}
        currency={profile.currency}
        moneySaved={stats.moneySaved}
        language={lang}
        defaultSubstance={profile.primarySubstance}
      />

      <OnboardingModal
        key={`onboarding-${isOnboardingOpen}-${onboardingStep}`}
        isOpen={isOnboardingOpen}
        initialProfile={profile}
        initialStep={onboardingStep}
        onRecover={actions.recoverLocalData}
        onOpenPrivacyTerms={() => setIsPrivacyTermsOpen(true)}
        onClose={() => {
          setIsManualOnboardingOpen(false);
          setIsOnboardingDismissed(true);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('puffinless_is_onboarded', 'true');
          }
        }}
        onComplete={(p) => {
          actions.completeOnboarding(p);
          setIsManualOnboardingOpen(false);
          setIsOnboardingDismissed(true);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('puffinless_is_onboarded', 'true');
          }
        }}
      />

      {isProfileOpen && (
        <ProfileModal
          key={`profile-${profile.updatedAt || profile.quitDate || 'modal'}`}
          isOpen={isProfileOpen}
          profile={profile}
          onClose={() => setIsProfileOpen(false)}
          onSaveProfile={actions.updateProfile}
          onRecoverData={actions.recoverLocalData}
          onImportData={actions.importUserData}
          onOpenPrivacyTerms={() => setIsPrivacyTermsOpen(true)}
          onRerunOnboarding={(step = 1) => {
            setOnboardingStep(step);
            setIsOnboardingDismissed(false);
            setIsManualOnboardingOpen(true);
          }}
          onResetData={async () => {
            await actions.resetAll();
            setOnboardingStep(1);
            setIsOnboardingDismissed(false);
            setIsManualOnboardingOpen(true);
          }}
        />
      )}

      <PrivacyTermsModal
        isOpen={isPrivacyTermsOpen}
        onClose={() => setIsPrivacyTermsOpen(false)}
        language={lang}
      />
    </div>
  </div>
);
}

export default App;
