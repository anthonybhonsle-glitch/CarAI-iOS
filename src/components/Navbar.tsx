import React from 'react';
import {
  Gauge,
  AlertTriangle,
  Sparkles,
  ShoppingBag,
  Car,
  Radio,
  Zap,
  Crown,
  User,
  Smartphone,
  ArrowLeft,
  Sliders,
  Tv,
  Settings as SettingsIcon,
} from 'lucide-react';
import { UserSubscriptionState } from '../types';
import { haptics } from '../services/haptics';
import { AuthUser } from '../services/authService';
import { useI18n } from '../i18n/I18nProvider';
import { LanguageSwitcher } from './LanguageSwitcher';

export type NavTab = 'flagship' | 'cockpit' | 'gauges' | 'diagnostics' | 'customizer' | 'marketplace' | 'garage' | 'payment' | 'settings';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  user: UserSubscriptionState;
  currentUser?: AuthUser | null;
  isConnected: boolean;
  isHardware: boolean;
  milActive: boolean;
  onOpenConnectModal: () => void;
  onOpenTerminalModal?: () => void;
  onOpenPaywall: (trigger?: any) => void;
  onOpenAuthModal: () => void;
  useMetric: boolean;
  setUseMetric: (metric: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  currentUser,
  isConnected,
  isHardware,
  milActive,
  onOpenConnectModal,
  onOpenPaywall,
  onOpenAuthModal,
  useMetric,
  setUseMetric,
}) => {
  const { t } = useI18n();

  const tabs = [
    { id: 'flagship' as NavTab, label: t('nav.home') === 'Home' ? 'CarAI Suite' : t('nav.home'), shortLabel: t('nav.home'), icon: Smartphone, badge: '4-in-1' },
    { id: 'cockpit' as NavTab, label: t('nav.cockpit'), shortLabel: t('nav.cockpit'), icon: Tv, badge: 'In-Car' },
    { id: 'gauges' as NavTab, label: 'Live Gauges', shortLabel: 'Gauges', icon: Gauge, badge: 'Live' },
    {
      id: 'diagnostics' as NavTab,
      label: 'DTC Diagnostics',
      shortLabel: 'DTC Scan',
      icon: AlertTriangle,
      alert: milActive,
      badge: milActive ? 'MIL ON' : undefined,
    },
    { id: 'customizer' as NavTab, label: '3D Tuning & Sound', shortLabel: '3D Studio', icon: Sliders, badge: user.isPro ? 'PRO' : '1 Free' },
    { id: 'marketplace' as NavTab, label: 'Repair Estimator', shortLabel: 'Estimates', icon: ShoppingBag },
    { id: 'garage' as NavTab, label: 'Smart Garage', shortLabel: 'Garage', icon: Car },
    { id: 'settings' as NavTab, label: t('nav.settings'), shortLabel: t('nav.settings'), icon: SettingsIcon },
    {
      id: 'payment' as NavTab,
      label: user.isPro ? 'Pro Active' : t('nav.upgrade'),
      shortLabel: user.isPro ? 'Pro' : t('nav.upgrade'),
      icon: Crown,
      badge: user.isPro ? 'Active' : '3d Trial',
    },
  ];

  return (
    <>
      {/* Top Application Bar */}
      <header id="app-header" className="sticky top-0 z-40 border-b border-[#202732] bg-[#0C1017]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6">
          {/* Brand & Back Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {activeTab !== 'flagship' && (
              <button
                id="nav-back-to-dashboard-btn"
                role="button"
                aria-label="Return to Flagship Dashboard"
                onClick={() => {
                  haptics.lightTap();
                  setActiveTab('flagship');
                }}
                className="flex items-center gap-1.5 rounded-xl bg-[#141B24] border border-[#242E3D] px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold text-cyan-300 hover:text-white transition-all min-h-[48px] shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-cyan-400" />
                <span className="hidden xs:inline">Suite</span>
              </button>
            )}

            <button
              id="brand-logo-btn"
              role="button"
              aria-label="CarAI Pro Home"
              onClick={() => {
                haptics.lightTap();
                setActiveTab('flagship');
              }}
              className="flex items-center gap-2 sm:gap-2.5 text-left transition-opacity hover:opacity-90 min-h-[48px]"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 font-display font-bold text-white shadow-md shadow-cyan-500/25 shrink-0">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
                  CAR<span className="text-cyan-400">AI</span>
                </span>
                <span className="rounded-md bg-[#161D27] border border-cyan-500/30 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300 font-mono-tech">
                  PRO
                </span>
              </div>
            </button>

            {/* Connection Status Button */}
            <button
              id="obd-connection-pill"
              role="button"
              aria-label={isConnected ? 'OBD-II dongle connected, click to configure' : 'Connect OBD-II adapter'}
              onClick={() => {
                haptics.lightTap();
                onOpenConnectModal();
              }}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl border px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold transition-all min-h-[48px] ${
                isConnected
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                  : 'border-[#242E3D] bg-[#141B24] text-zinc-300 hover:border-[#38465C] hover:text-white'
              }`}
              title="Configure OBD-II Dongle Connection"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isConnected ? 'animate-pulse bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-zinc-500'
                }`}
              />
              <Radio className="h-4 w-4" />
              <span className="font-mono-tech font-bold text-xs hidden sm:inline">
                {isConnected ? (isHardware ? 'ELM327 BLE' : 'CAN-Bus Live') : 'Connect'}
              </span>
            </button>
          </div>

          {/* Action Controls & Pro Entitlements */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <LanguageSwitcher compact />

            {/* Unit Switcher */}
            <button
              id="unit-toggle-btn"
              role="button"
              aria-label={`Toggle units, currently ${useMetric ? 'Metric' : 'Imperial'}`}
              onClick={() => {
                haptics.lightTap();
                setUseMetric(!useMetric);
              }}
              className="rounded-xl border border-[#242E3D] bg-[#141B24] px-2.5 sm:px-3 py-2 text-xs font-mono-tech font-bold text-zinc-300 transition-colors hover:border-cyan-500 hover:text-cyan-300 min-h-[48px] flex items-center justify-center"
              title="Toggle Speed & Temperature Units"
            >
              {useMetric ? 'KM/H • °C' : 'MPH • °F'}
            </button>

            {/* User Account / Driver Profile */}
            <button
              role="button"
              aria-label="Open Driver Profile and Account"
              onClick={() => {
                haptics.lightTap();
                onOpenAuthModal();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[#242E3D] bg-[#141B24] px-2.5 sm:px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-cyan-500 hover:text-white transition-colors min-h-[48px]"
              title="Driver Profile & Security Vault"
            >
              <User className="h-4 w-4 text-cyan-400" />
              <span className="hidden md:inline">
                {currentUser ? currentUser.fullName || currentUser.email.split('@')[0] : 'Account'}
              </span>
            </button>

            {/* Pro Subscription Badge / Upgrade Button */}
            {user.isPro ? (
              <button
                id="user-pro-badge"
                role="button"
                aria-label="View CarAI Pro Subscription Receipt & Status"
                onClick={() => {
                  haptics.lightTap();
                  setActiveTab('payment');
                }}
                className="flex items-center gap-1 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-3 py-2 text-xs font-bold text-cyan-200 shadow-sm shadow-cyan-500/20 hover:border-cyan-400 transition-all min-h-[48px]"
              >
                <Crown className="h-4 w-4 fill-cyan-400 shrink-0" />
                <span className="font-display tracking-wider">PRO</span>
              </button>
            ) : (
              <button
                id="upgrade-to-pro-header-btn"
                role="button"
                aria-label="Subscribe to CarAI Pro"
                onClick={() => {
                  haptics.lightTap();
                  setActiveTab('payment');
                }}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-3 sm:px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-900/40 transition-all active:scale-95 min-h-[48px]"
              >
                <Crown className="h-4 w-4 fill-current shrink-0" />
                <span className="tracking-wide">PRO</span>
              </button>
            )}
          </div>
        </div>

        {/* Desktop Navigation Tabs Bar (Visible on medium screens and up) */}
        <div className="hidden md:block mx-auto max-w-7xl px-4 pb-2 sm:px-6">
          <nav className="flex items-center gap-1.5 overflow-x-auto" role="tablist" aria-label="Main Navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={tab.label}
                  onClick={() => {
                    haptics.lightTap();
                    setActiveTab(tab.id);
                  }}
                  className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all min-h-[48px] ${
                    isActive
                      ? 'bg-[#18202B] text-cyan-300 border border-cyan-500/40 shadow-inner'
                      : 'text-zinc-300 hover:bg-[#131922] hover:text-white border border-transparent'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isActive
                        ? tab.id === 'diagnostics' && milActive
                          ? 'text-red-400'
                          : 'text-cyan-400'
                        : 'text-zinc-400'
                    }`}
                  />
                  <span className="tracking-normal font-semibold">{tab.label}</span>

                  {tab.badge && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold font-mono-tech ${
                        tab.alert
                          ? 'animate-pulse bg-red-500/25 text-red-300 border border-red-500/40'
                          : tab.badge === 'PRO'
                          ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40'
                          : 'bg-[#202835] text-zinc-300 border border-[#2E394A]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}

                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Native Bottom Navigation Bar (Thumb Zone - Android & iOS standards) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0D13]/95 backdrop-blur-lg border-t border-[#1C2430] px-1 py-1.5 pb-safe justify-around shadow-2xl"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => {
                haptics.lightTap();
                setActiveTab(tab.id);
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all min-h-[48px] relative ${
                isActive ? 'text-cyan-300' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    isActive
                      ? tab.id === 'diagnostics' && milActive
                        ? 'text-red-400 scale-110'
                        : 'text-cyan-400 scale-110'
                      : 'text-zinc-400'
                  }`}
                />
                {tab.alert && (
                  <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-red-500 animate-ping" />
                )}
              </div>
              <span
                className={`text-[10px] font-mono-tech mt-1 tracking-tight truncate max-w-[58px] ${
                  isActive ? 'font-bold text-cyan-300' : 'font-medium text-zinc-400'
                }`}
              >
                {tab.shortLabel}
              </span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
