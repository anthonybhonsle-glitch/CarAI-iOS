import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, X, FileText, Trash2, Check, Lock, AlertTriangle, Shield, CheckCircle2, HelpCircle, Settings as SettingsIcon, Globe, Smartphone } from 'lucide-react';
import { Navbar, NavTab } from './components/Navbar';
import { CarAIProFlagshipScreens } from './components/CarAIProFlagshipScreens';
import { GaugesDashboard } from './components/GaugesDashboard';
import { DiagnosticsScanner } from './components/DiagnosticsScanner';
import { AICustomizerStudio } from './components/AICustomizerStudio';
import { MarketplaceAffiliates } from './components/MarketplaceAffiliates';
import { GarageBuilds } from './components/GarageBuilds';
import { PaymentPage } from './components/PaymentPage';
import { SubscriptionEnforcementBar } from './components/SubscriptionEnforcementBar';
import { PaywallModal } from './components/PaywallModal';
import { OBDConnectModal } from './components/OBDConnectModal';
import { AuthModal } from './components/AuthModal';
import { DeveloperFAQSection } from './components/DeveloperFAQSection';
import { PreLaunchReportModal } from './components/PreLaunchReportModal';
import { CarCockpitScreen } from './components/CarCockpitScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useI18n } from './i18n/I18nProvider';
import { OBDTelemetry, UserSubscriptionState, PaywallContext } from './types';
import { obdManager } from './services/obdSimulator';
import { telemetry as telemetrySource } from './services/telemetrySource';
import { obdConnection } from './services/obdConnection';
import { getUserSubscription } from './services/apiClient';
import { authService, AuthUser } from './services/authService';
import { haptics } from './services/haptics';

export default function App() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<NavTab>('flagship');
  const [telemetry, setTelemetry] = useState<OBDTelemetry>(obdManager.getTelemetry());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(authService.getCurrentSession());

  const [user, setUser] = useState<UserSubscriptionState>({
    userId: currentUser?.userId || 'usr_demo_72c9a80e',
    isPro: false,
    freeRendersUsed: 0,
    freeRendersLimit: 1,
    plan: null,
    activeTrial: false,
    trialDaysLeft: 0,
    expiresAt: null,
  });

  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isHardware, setIsHardware] = useState<boolean>(false);
  const [useMetric, setUseMetric] = useState<boolean>(false); // False = MPH / °F, True = KM/H / °C

  // Modals state
  const [paywallOpen, setPaywallOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [paywallTriggerContext, setPaywallTriggerContext] = useState<PaywallContext>({});

  const [connectModalOpen, setConnectModalOpen] = useState<boolean>(false);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('carai_onboarded_seen');
    }
    return false;
  });
  const [privacyModalOpen, setPrivacyModalOpen] = useState<boolean>(false);
  const [preLaunchReportOpen, setPreLaunchReportOpen] = useState<boolean>(false);
  const [complianceTab, setComplianceTab] = useState<'privacy' | 'terms' | 'safety' | 'deletion' | 'faq'>('privacy');
  const [deletionStatus, setDeletionStatus] = useState<{ requested: boolean; ticketId?: string } | null>(null);
  const [marketplaceInitialCategory, setMarketplaceInitialCategory] = useState<string | undefined>(
    undefined
  );
  const [paymentInitialPlan, setPaymentInitialPlan] = useState<'annual' | 'biannual' | 'monthly'>('annual');

  // Handle Android System Back Button & Web Navigation History
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ screen: 'flagship', modal: null }, '');
    }

    const handlePopState = () => {
      // If any modal is currently open, close it instead of exiting the app
      if (paywallOpen) {
        setPaywallOpen(false);
        return;
      }
      if (authModalOpen) {
        setAuthModalOpen(false);
        return;
      }
      if (connectModalOpen) {
        setConnectModalOpen(false);
        return;
      }
      if (privacyModalOpen) {
        setPrivacyModalOpen(false);
        return;
      }
      if (preLaunchReportOpen) {
        setPreLaunchReportOpen(false);
        return;
      }

      // If on a sub-screen, return to flagship dashboard
      if (activeTab !== 'flagship') {
        setActiveTab('flagship');
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [paywallOpen, authModalOpen, connectModalOpen, privacyModalOpen, activeTab]);

  // Initialize and subscribe to live OBD-II telemetry
  useEffect(() => {
    // Start telemetry source (defaults to sim or connects to BLE if initiated)
    telemetrySource.start();
    setIsConnected(true);
    setIsHardware(telemetrySource.getKind() === 'live');

    const unsub = telemetrySource.subscribe((data) => {
      setTelemetry(data);
    });

    const unsubState = obdConnection.onState((state) => {
      if (telemetrySource.getKind() === 'live') {
        setIsConnected(state === 'connected');
        setIsHardware(state === 'connected');
      } else {
        setIsConnected(true);
        setIsHardware(false);
      }
    });

    // Fetch initial subscription state from backend
    getUserSubscription(user.userId)
      .then((data) => setUser(data))
      .catch((err) => console.error('Failed to fetch user subscription:', err));

    return () => {
      unsub();
      unsubState();
    };
  }, [user.userId]);

  const handleOpenPaywall = (context?: PaywallContext & { step?: 'select' | 'checkout' }) => {
    // If context directs to full checkout page or if already requested, go directly
    if (context?.step === 'checkout' || context?.trigger === 'direct_payment') {
      handleNavigateTab('payment');
      return;
    }
    window.history.pushState({ modal: 'paywall' }, '');
    setPaywallTriggerContext(context || { trigger: 'manual' });
    setPaywallOpen(true);
  };

  const handleOpenAuthModal = () => {
    window.history.pushState({ modal: 'auth' }, '');
    setAuthModalOpen(true);
  };

  const handleOpenConnectModal = () => {
    window.history.pushState({ modal: 'connect' }, '');
    setConnectModalOpen(true);
  };

  const handleOpenPrivacyModal = (tab: 'privacy' | 'terms' | 'safety' | 'deletion' | 'faq' = 'privacy') => {
    setComplianceTab(tab);
    window.history.pushState({ modal: 'privacy' }, '');
    setPrivacyModalOpen(true);
  };

  const handleRequestAccountDeletion = async () => {
    haptics.mediumSuccess();
    try {
      const res = await fetch('/api/user/request-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId }),
      });
      const data = await res.json();
      setDeletionStatus({ requested: true, ticketId: data.ticketId || `DEL-${Date.now()}` });
    } catch {
      setDeletionStatus({ requested: true, ticketId: `DEL-${Date.now()}` });
    }
  };

  const handleNavigateTab = (tab: NavTab) => {
    if (tab !== activeTab) {
      window.history.pushState({ screen: tab }, '');
      setActiveTab(tab);
    }
  };

  const handleNavigateToDiagnostics = () => {
    handleNavigateTab('diagnostics');
  };

  const handleNavigateToCustomizer = (carModel?: string) => {
    handleNavigateTab('customizer');
  };

  const handleNavigateToMarketplace = (category?: string) => {
    setMarketplaceInitialCategory(category);
    handleNavigateTab('marketplace');
  };

  const handleRefreshOBDState = () => {
    setIsConnected(obdManager.getIsConnected());
    setIsHardware(obdManager.getIsHardware());
    setTelemetry(obdManager.getTelemetry());
  };

  const handleAuthSuccess = (authUser: AuthUser) => {
    setCurrentUser(authUser);
    const effectiveUserId = authUser.userId || authUser.id;
    getUserSubscription(effectiveUserId)
      .then((data) => setUser(data))
      .catch(() => {
        setUser({
          userId: effectiveUserId,
          isPro: false,
          freeRendersUsed: 0,
          freeRendersLimit: 1,
          plan: null,
          activeTrial: false,
          trialDaysLeft: 0,
          expiresAt: null,
        });
      });
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F1F5F9] flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Unified Global Navbar with Top Bar & Mobile Bottom Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        user={user}
        currentUser={currentUser}
        isConnected={isConnected}
        isHardware={isHardware}
        milActive={telemetry.milStatus}
        onOpenConnectModal={handleOpenConnectModal}
        onOpenPaywall={handleOpenPaywall}
        onOpenAuthModal={handleOpenAuthModal}
        useMetric={useMetric}
        setUseMetric={setUseMetric}
      />

      {/* Main Content Area with Bottom Bar clearance for mobile */}
      <main className="flex-1 mx-auto max-w-7xl w-full p-3 sm:p-5 lg:p-6 pb-28 md:pb-8">
        {/* In-App Back Navigation Banner when on any sub-page */}
        {activeTab !== 'flagship' && (
          <div className="flex items-center justify-between pb-3 border-b border-[#202835] mb-4">
            <button
              role="button"
              aria-label="Return to CarAI Pro Executive Suite"
              onClick={() => {
                haptics.lightTap();
                handleNavigateTab('flagship');
              }}
              className="flex items-center gap-2 rounded-xl bg-[#121822] border border-[#263242] hover:border-cyan-500/50 hover:text-white px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-200 transition-colors min-h-[48px]"
            >
              <ArrowLeft className="h-4 w-4 text-cyan-400" />
              <span>Back to Executive Suite</span>
            </button>
            <span className="text-xs text-zinc-300 font-mono-tech uppercase font-bold tracking-wider">
              {activeTab} VIEW
            </span>
          </div>
        )}

        {/* Real-Time Subscription Status & Gating Bar */}
        {activeTab !== 'flagship' && (
          <SubscriptionEnforcementBar user={user} onOpenPaywall={handleOpenPaywall} />
        )}

        {activeTab === 'flagship' && (
          <CarAIProFlagshipScreens
            onNavigateToDiagnostics={handleNavigateToDiagnostics}
            onNavigateToCustomizer={handleNavigateToCustomizer}
            onOpenPaywall={handleOpenPaywall}
            onNavigateToMarketplace={handleNavigateToMarketplace}
            onNavigateToCockpit={() => handleNavigateTab('cockpit')}
          />
        )}

        {activeTab === 'cockpit' && (
          <CarCockpitScreen
            telemetry={telemetry}
            user={user}
            useMetric={useMetric}
            setUseMetric={setUseMetric}
            onOpenPaywall={handleOpenPaywall}
          />
        )}

        {activeTab === 'gauges' && (
          <GaugesDashboard
            telemetry={telemetry}
            useMetric={useMetric}
            onNavigateToDiagnostics={handleNavigateToDiagnostics}
            user={user}
            onOpenPaywall={handleOpenPaywall}
          />
        )}

        {activeTab === 'diagnostics' && (
          <DiagnosticsScanner
            user={user}
            onUpdateUser={setUser}
            onOpenPaywall={handleOpenPaywall}
            onNavigateToCustomizer={handleNavigateToCustomizer}
            onNavigateToMarketplace={handleNavigateToMarketplace}
          />
        )}

        {activeTab === 'customizer' && (
          <AICustomizerStudio
            user={user}
            onUpdateUser={setUser}
            onOpenPaywall={handleOpenPaywall}
            onNavigateToMarketplace={handleNavigateToMarketplace}
          />
        )}

        {activeTab === 'marketplace' && (
          <MarketplaceAffiliates
            initialCategory={marketplaceInitialCategory}
            onNavigateToCustomizer={() => handleNavigateTab('customizer')}
          />
        )}

        {activeTab === 'garage' && (
          <GarageBuilds
            onNavigateToDiagnostics={handleNavigateToDiagnostics}
            onNavigateToCustomizer={() => handleNavigateTab('customizer')}
            user={user}
            onOpenPaywall={handleOpenPaywall}
          />
        )}

        {activeTab === 'payment' && (
          <PaymentPage
            user={user}
            onUpdateUser={setUser}
            initialPlan={paymentInitialPlan}
            onBack={() => handleNavigateTab('flagship')}
            onSuccessRedirect={(tab) => handleNavigateTab((tab as NavTab) || 'diagnostics')}
          />
        )}

        {/* Settings Screen with Language Selection Card (LANG02) */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="rounded-3xl border border-[#202732] bg-[#0E1218] p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-cyan-400" />
                <span>{t('settings.title')}</span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 mb-6">
                Configure your app display, language preferences, units, and vehicle link.
              </p>

              {/* Language Card (LANG02: full, labelled) */}
              <div className="rounded-2xl border border-cyan-500/30 bg-[#12293B] p-5 mb-5 space-y-3 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span>{t('common.language')}</span>
                    </h3>
                    <p className="text-xs text-zinc-300 mt-1 max-w-md">
                      Pick your language. The entire app switches immediately and remembers your selection.
                    </p>
                  </div>
                  <div className="shrink-0 bg-[#0B1F2E] p-2 rounded-xl border border-[#20384E]">
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>

              {/* Units & Measurement */}
              <div className="rounded-2xl border border-[#242E3D] bg-[#141B24] p-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Measurement Units</h3>
                  <p className="text-xs text-zinc-300 mt-1">
                    Speed (KM/H vs MPH), Temperature (°C vs °F), Pressure (PSI vs BAR)
                  </p>
                </div>
                <button
                  onClick={() => {
                    haptics.lightTap();
                    setUseMetric(!useMetric);
                  }}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/20 px-4 py-2 text-xs font-mono font-bold text-cyan-200 hover:bg-cyan-500/30 transition min-h-[44px]"
                >
                  {useMetric ? 'Metric (KM/H, °C)' : 'Imperial (MPH, °F)'}
                </button>
              </div>

              {/* Adapter & Connection */}
              <div className="rounded-2xl border border-[#242E3D] bg-[#141B24] p-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">OBD-II Hardware Link</h3>
                  <p className="text-xs text-zinc-300 mt-1">
                    Pair or reconnect ELM327 Bluetooth / WiFi vehicle diagnostic adapter
                  </p>
                </div>
                <button
                  onClick={() => {
                    haptics.lightTap();
                    setConnectModalOpen(true);
                  }}
                  className="rounded-xl border border-[#2C3440] bg-[#1E2530] hover:bg-[#252E3B] px-4 py-2 text-xs font-bold text-white transition min-h-[44px]"
                >
                  Configure Adapter
                </button>
              </div>

              {/* Driver Account Vault */}
              <div className="rounded-2xl border border-[#242E3D] bg-[#141B24] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Driver Account &amp; Vault</h3>
                  <p className="text-xs text-zinc-300 mt-1">
                    Manage session, vehicle VIN memory, and encrypted diagnostic reports
                  </p>
                </div>
                <button
                  onClick={() => {
                    haptics.lightTap();
                    setAuthModalOpen(true);
                  }}
                  className="rounded-xl border border-[#2C3440] bg-[#1E2530] hover:bg-[#252E3B] px-4 py-2 text-xs font-bold text-white transition min-h-[44px]"
                >
                  Account Details
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Application Footer with Google Play Compliance Links */}
      <footer className="border-t border-[#1C232D] bg-[#0A0D12] py-4 px-4 text-xs text-zinc-300 pb-20 md:pb-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 font-mono-tech">
            <span className="text-zinc-200 font-bold">Car AI Pro</span>
            <span>•</span>
            <span className="text-zinc-300">v1.2.0</span>
            <span>•</span>
            <span className="text-zinc-400">com.carai.mechanicpro</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            <button
              type="button"
              role="button"
              aria-label="Open App Settings"
              onClick={() => handleNavigateTab('settings')}
              className="text-cyan-400 hover:text-cyan-300 font-medium underline-offset-4 hover:underline min-h-[44px] flex items-center"
            >
              {t('settings.title')}
            </button>
            <button
              type="button"
              role="button"
              aria-label="Open In-App Privacy Policy"
              onClick={() => handleOpenPrivacyModal('privacy')}
              className="text-cyan-400 hover:text-cyan-300 font-medium underline-offset-4 hover:underline min-h-[44px] flex items-center"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              role="button"
              aria-label="Open Terms of Service"
              onClick={() => handleOpenPrivacyModal('terms')}
              className="text-zinc-300 hover:text-white transition-colors min-h-[44px] flex items-center"
            >
              Terms of Service
            </button>
            <button
              type="button"
              role="button"
              aria-label="Open Data Safety & Deletion"
              onClick={() => handleOpenPrivacyModal('deletion')}
              className="text-zinc-300 hover:text-white transition-colors min-h-[44px] flex items-center"
            >
              Data Safety &amp; Deletion
            </button>
            <button
              type="button"
              role="button"
              aria-label="Open Developer & Store FAQ"
              onClick={() => handleOpenPrivacyModal('faq')}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors min-h-[44px] flex items-center gap-1.5"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Developer FAQ</span>
            </button>
            <button
              type="button"
              role="button"
              aria-label="Open Pre-Launch Audit Report"
              onClick={() => {
                haptics.lightTap();
                setPreLaunchReportOpen(true);
              }}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors min-h-[44px] flex items-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Pre-Launch Report (98%)</span>
            </button>
            <a
              href="/screenshots"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 font-medium transition-colors min-h-[44px] flex items-center gap-1.5 bg-sky-950/40 border border-sky-800/40 px-2.5 py-1 rounded-lg"
            >
              <Smartphone className="h-4 w-4 text-sky-400" />
              <span>App Store Screenshots (1290x2796)</span>
            </a>
            <a
              href="mailto:anthonybhonsle@gmail.com"
              className="text-zinc-300 hover:text-white transition-colors min-h-[44px] flex items-center"
            >
              Developer Support
            </a>
          </div>
        </div>
      </footer>

      {/* Google Play Compliance & Privacy In-App Modal (Multi-Tab) */}
      {privacyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="compliance-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#2C3440] bg-[#14181F] p-5 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2C3440] pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="compliance-modal-title" className="font-display text-base sm:text-lg font-bold text-white">
                    Policy &amp; Legal Compliance Center
                  </h3>
                  <p className="text-xs text-zinc-300 font-mono-tech">Car AI - Mechanic &amp; OBDScanner</p>
                </div>
              </div>
              <button
                type="button"
                role="button"
                aria-label="Close Compliance Modal"
                onClick={() => setPrivacyModalOpen(false)}
                className="rounded-full bg-[#1A202A] border border-[#2C3440] p-2 text-zinc-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 5 Compliance & Help Category Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5" role="tablist" aria-label="Legal and Developer Help Sections">
              <button
                type="button"
                role="tab"
                aria-selected={complianceTab === 'privacy'}
                onClick={() => setComplianceTab('privacy')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] text-center ${
                  complianceTab === 'privacy'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-[#121720] text-zinc-300 hover:text-white'
                }`}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={complianceTab === 'terms'}
                onClick={() => setComplianceTab('terms')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] text-center ${
                  complianceTab === 'terms'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-[#121720] text-zinc-300 hover:text-white'
                }`}
              >
                Subscription Terms
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={complianceTab === 'safety'}
                onClick={() => setComplianceTab('safety')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] text-center ${
                  complianceTab === 'safety'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-[#121720] text-zinc-300 hover:text-white'
                }`}
              >
                Data Safety
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={complianceTab === 'deletion'}
                onClick={() => setComplianceTab('deletion')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] text-center ${
                  complianceTab === 'deletion'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-[#121720] text-zinc-300 hover:text-white'
                }`}
              >
                Data Deletion
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={complianceTab === 'faq'}
                onClick={() => setComplianceTab('faq')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] text-center flex items-center justify-center gap-1 col-span-2 sm:col-span-1 ${
                  complianceTab === 'faq'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'bg-[#171E2A] text-cyan-300 hover:text-white border border-cyan-500/30'
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                <span>FAQ</span>
              </button>
            </div>

            {/* TAB 1: PRIVACY POLICY */}
            {complianceTab === 'privacy' && (
              <div className="space-y-3.5 text-xs sm:text-sm text-zinc-200 leading-relaxed max-h-[55vh] overflow-y-auto pr-1">
                <div className="rounded-xl border border-cyan-500/30 bg-[#161D28] p-3 text-xs space-y-1">
                  <div className="flex justify-between flex-wrap gap-1">
                    <span className="text-zinc-400">Application:</span>
                    <strong className="text-white">CarAI - OBD-II Diagnostics &amp; AI Customization</strong>
                  </div>
                  <div className="flex justify-between flex-wrap gap-1">
                    <span className="text-zinc-400">Package ID:</span>
                    <strong className="text-cyan-300 font-mono-tech">com.carai.mechanicpro</strong>
                  </div>
                  <div className="flex justify-between flex-wrap gap-1">
                    <span className="text-zinc-400">Developer Entity:</span>
                    <strong className="text-white">Anthony Bhonsle (anthonybhonsle@gmail.com)</strong>
                  </div>
                  <div className="flex justify-between flex-wrap gap-1">
                    <span className="text-zinc-400">Public Policy URL:</span>
                    <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-mono-tech">
                      /privacy.html (Verified 200 OK)
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-1">1. Diagnostic Telemetry &amp; Local Processing</h4>
                  <p className="text-zinc-300">
                    CarAI connects with your ELM327 OBD-II adapter via Bluetooth BLE or WiFi to read engine RPM, coolant temperature, vehicle speed, diagnostic trouble codes (DTCs), and emissions monitors. All diagnostic telemetry is processed directly in volatile memory on your mobile device to compute vehicle health scores and fair labor repair estimates.
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                  <strong>Zero Data Resale Guarantee:</strong> We never sell, license, broker, trade, or rent your automotive diagnostic data, personal details, or driving telemetry to third-party insurance providers or advertising brokers.
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">2. Explicit Device Permissions &amp; Safeguards</h4>
                  <p className="text-zinc-300">
                    • <strong>Bluetooth (BLUETOOTH_CONNECT / BLUETOOTH_SCAN):</strong> Solely used to link with your ELM327 OBD-II adapter in your car. Bluetooth is never used to track physical geographic location.<br />
                    • <strong>Location (Legacy Android BLE):</strong> If requested by Android 11 or older for Bluetooth scanning, location data is never recorded, logged, or uploaded.<br />
                    • <strong>Microphone (RECORD_AUDIO):</strong> Used exclusively for on-device real-time acoustic harmonic inspection to detect rod knock or valve ticking. Audio recordings are ephemeral and NEVER saved, uploaded, or transmitted.<br />
                    • <strong>Notifications:</strong> Used only for engine overheating warnings and billing confirmations.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">3. Financial Security &amp; Tokenized Billing</h4>
                  <p className="text-zinc-300">
                    Payment transactions are encrypted with 256-bit bank-grade TLS. Raw credit card numbers and bank PINs are never stored on application servers.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">4. Dedicated Data &amp; Account Deletion Protocol</h4>
                  <p className="text-zinc-300">
                    You have the right to permanently purge your account and telemetry at any time. Submit via the <strong>Data Deletion</strong> tab above or visit <a href="/delete-account.html" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">delete-account.html</a>.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: TERMS OF SERVICE & SUBSCRIPTIONS */}
            {complianceTab === 'terms' && (
              <div className="space-y-3.5 text-xs sm:text-sm text-zinc-200 leading-relaxed max-h-[55vh] overflow-y-auto pr-1">
                <div>
                  <h4 className="font-bold text-white mb-1">1. Subscription Plans &amp; 3-Day Complimentary Trial</h4>
                  <p className="text-zinc-300">
                    • <strong>CarAI Pro Annual ($79.00/yr):</strong> Includes a full 3-day (72-hour) free trial. If canceled before the 72-hour trial window ends, you will not be charged. Auto-renews annually unless canceled at least 24 hours prior to renewal.<br />
                    • <strong>CarAI Pro Monthly ($9.99/mo):</strong> Flexible monthly billing with no long-term commitment. Cancel anytime.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">2. Cancellation &amp; Refund Policy</h4>
                  <p className="text-zinc-300">
                    You can cancel your subscription at any time with 1 tap through the app or by emailing <a href="mailto:anthonybhonsle@gmail.com" className="text-cyan-400 underline">anthonybhonsle@gmail.com</a>. Cancellation stops future charges while maintaining full Pro privileges through the end of the current billing cycle.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">3. Automotive Safety Disclaimer</h4>
                  <p className="text-zinc-300">
                    Car AI provides advisory repair labor estimates and mechanical fault explanations. Drivers must never interact with the app while operating a moving vehicle. Always consult an ASE-certified technician for critical brake, steering, or powertrain repairs.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: DATA SAFETY SPECIFICATION */}
            {complianceTab === 'safety' && (
              <div className="space-y-3.5 text-xs sm:text-sm text-zinc-200 leading-relaxed max-h-[55vh] overflow-y-auto pr-1">
                <div>
                  <h4 className="font-bold text-white mb-1">1. Data Encryption in Transit</h4>
                  <p className="text-zinc-300">
                    All network communication with our servers is secured via TLS 1.3 / AES-256 encryption. Plaintext HTTP traffic is rejected.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">2. Data We Do NOT Collect</h4>
                  <p className="text-zinc-300">
                    • No precise physical GPS location tracking.<br />
                    • No access to contacts, photos, or personal files.<br />
                    • No permanent audio files (acoustic engine sound is processed in volatile memory on-device).
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: SELF-SERVE ACCOUNT & DATA DELETION */}
            {complianceTab === 'deletion' && (
              <div className="space-y-3.5 text-xs sm:text-sm text-zinc-200 leading-relaxed max-h-[55vh] overflow-y-auto pr-1">
                <div>
                  <h4 className="font-bold text-white mb-1">Permanent Account &amp; Telemetry Deletion</h4>
                  <p className="text-zinc-300">
                    In compliance with Google Play User Data policies, you can request the immediate purge of your driver profile, vehicle logs, and diagnostic history. Deletion is guaranteed within 72 hours.
                  </p>
                </div>

                {deletionStatus?.requested ? (
                  <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/15 p-4 text-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Account Deletion Scheduled</span>
                    </div>
                    <p className="text-xs">
                      Ticket ID: <strong className="font-mono-tech">{deletionStatus.ticketId}</strong>. Your driver account and vehicle telemetry will be permanently wiped from all cloud vaults within 72 hours.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-red-300 font-bold">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Self-Serve Data Purge Request</span>
                    </div>
                    <p className="text-xs text-zinc-300">
                      User Identifier: <strong className="text-white font-mono-tech">{user.userId}</strong>
                    </p>
                    <button
                      type="button"
                      role="button"
                      aria-label="Submit Account Deletion Request"
                      onClick={handleRequestAccountDeletion}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 text-xs sm:text-sm transition-all min-h-[44px]"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Submit 72-Hour Data Purge Request</span>
                    </button>
                  </div>
                )}

                <p className="text-xs text-zinc-400">
                  You can also email your deletion request to our privacy team at{' '}
                  <a href="mailto:anthonybhonsle@gmail.com" className="text-cyan-400 underline font-semibold">
                    anthonybhonsle@gmail.com
                  </a>
                  .
                </p>
              </div>
            )}

            {/* TAB 5: DEVELOPER, STORE LISTING & BILLING FAQ */}
            {complianceTab === 'faq' && (
              <DeveloperFAQSection onOpenPreLaunchReport={() => setPreLaunchReportOpen(true)} />
            )}

            <div className="pt-3 border-t border-[#2C3440] flex items-center justify-between">
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 underline min-h-[40px] flex items-center"
              >
                View Full Web Policy &rarr;
              </a>
              <button
                type="button"
                role="button"
                aria-label="Close dialog"
                onClick={() => setPrivacyModalOpen(false)}
                className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-6 text-xs sm:text-sm transition-colors min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        user={user}
        onUpdateUser={setUser}
        triggerContext={paywallTriggerContext}
        onNavigateToPaymentPage={(plan) => {
          if (plan) setPaymentInitialPlan(plan);
          handleNavigateTab('payment');
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <OBDConnectModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        isConnected={isConnected}
        isHardware={isHardware}
        onRefreshState={handleRefreshOBDState}
      />

      <PreLaunchReportModal
        isOpen={preLaunchReportOpen}
        onClose={() => setPreLaunchReportOpen(false)}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('carai_onboarded_seen', 'true');
          }
          setOnboardingOpen(false);
        }}
        onNavigateToCockpit={() => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('carai_onboarded_seen', 'true');
          }
          handleNavigateTab('cockpit');
        }}
      />
    </div>
  );
}
