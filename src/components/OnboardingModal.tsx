import React, { useState } from 'react';
import {
  Car,
  Bluetooth,
  PlugZap,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  X,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { obdConnection } from '../services/obdConnection';
import { telemetry } from '../services/telemetrySource';
import { haptics } from '../services/haptics';
import { useI18n } from '../i18n/I18nProvider';
import { LanguageSwitcher } from './LanguageSwitcher';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCockpit: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onNavigateToCockpit,
}) => {
  const { t } = useI18n();
  const [showExplainer, setShowExplainer] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const markOnboarded = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('carai_onboarded_seen', 'true');
      } catch {}
    }
  };

  const handleConnectAdapter = async () => {
    haptics.lightTap();
    setIsConnecting(true);
    setStatusNotice(null);
    try {
      telemetry.use('live');
      await obdConnection.connect();
      markOnboarded();
      onClose();
      onNavigateToCockpit();
    } catch (e: any) {
      setIsConnecting(false);
      // If hardware connection fails or is unavailable on test device,
      // inform the user and offer automatic fallback to Demo Car
      setStatusNotice('No Bluetooth adapter detected. Switched to Demo Car mode so you can test all features!');
      setTimeout(() => {
        handleTryDemoCar();
      }, 1200);
    }
  };

  const handleTryDemoCar = () => {
    haptics.lightTap();
    markOnboarded();
    telemetry.use('sim');
    onClose();
    onNavigateToCockpit();
  };

  const handleDismiss = () => {
    haptics.lightTap();
    markOnboarded();
    telemetry.use('sim');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B1F2E]/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <div className="bg-[#12293B] border border-[#20384E] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-left">
        {/* Language selector in top left */}
        <div className="absolute top-4 left-4">
          <LanguageSwitcher compact />
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#9FB6C8] hover:text-[#EAF6FF] hover:bg-white/5 transition"
          aria-label="Close onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step 1: Welcome Header */}
        <div className="text-center mb-5 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-[#00D1FF]/20 border border-[#00D1FF]/40 flex items-center justify-center mx-auto mb-3 text-[#00D1FF] shadow-lg shadow-[#00D1FF]/10">
            <Car className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#EAF6FF] tracking-tight">
            Welcome to CarAI Pro
          </h2>
          <p className="text-sm font-semibold text-[#00D1FF] mt-1">
            "{t('app.tagline')}"
          </p>
        </div>

        {/* Step 2: Driver Safety Advisory Notice (Always visible, non-blocking) */}
        <div className="bg-[#0B1F2E] border border-amber-500/30 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FFB020] shrink-0 mt-0.5" />
            <div className="text-xs text-[#EAF6FF] space-y-1.5">
              <span className="font-bold text-[#FFB020] block tracking-wide">
                DRIVER SAFETY ADVISORY
              </span>
              <p className="text-[#9FB6C8] leading-relaxed">
                Do not interact with the screen while operating the vehicle. Diagnostic readings and AI suggestions are advisory only and cannot replace certified automotive mechanical inspections.
              </p>
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#13C2A3] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#13C2A3] shrink-0" />
                <span>Safety Advisory Acknowledged &bull; Operate only when stationary</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status notification if hardware connection failed */}
        {statusNotice && (
          <div className="mb-4 bg-[#13C2A3]/15 border border-[#13C2A3]/40 rounded-xl p-3 text-xs text-[#13C2A3] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Step 3: Choose Mode */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#9FB6C8] uppercase tracking-wider">
              GET STARTED
            </span>
            <button
              onClick={() => {
                haptics.lightTap();
                setShowExplainer(!showExplainer);
              }}
              className="text-xs text-[#00D1FF] hover:underline flex items-center gap-1 font-semibold"
            >
              <HelpCircle className="w-3.5 h-3.5" /> What is OBD-II?
            </button>
          </div>

          {showExplainer && (
            <div className="bg-[#0B1F2E] border border-[#00D1FF]/30 p-3 rounded-xl text-xs text-[#EAF6FF] space-y-1 animate-fadeIn">
              <p className="font-semibold text-[#00D1FF]">20-Second OBD-II Explainer:</p>
              <p className="text-[#9FB6C8]">
                Every gasoline and diesel car built since 1996 has a standard 16-pin OBD-II port under the steering wheel. Plug in any standard $15–$30 ELM327 or OBDLink Bluetooth adapter.
              </p>
              <p className="text-[11px] text-[#13C2A3] font-semibold">
                ✓ Works with standard ELM327 v1.5 / v2.1 or OBDLink BLE dongles.
              </p>
            </div>
          )}

          {/* Primary Action 1: Instant Demo Car (Prominent, Always Active, NEVER disabled) */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleTryDemoCar}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00D1FF] to-[#13C2A3] hover:opacity-95 text-[#06151F] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00D1FF]/20 transition active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-[#06151F]" />
              <span>Explore Demo Car (Instant Access)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {/* Primary Action 2: Connect Hardware Adapter */}
            <button
              type="button"
              onClick={handleConnectAdapter}
              disabled={isConnecting}
              className="w-full py-3 px-4 rounded-xl bg-[#0B1F2E] hover:bg-[#163348] border border-[#20384E] hover:border-[#00D1FF]/40 text-[#EAF6FF] font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
            >
              <Bluetooth className="w-4 h-4 text-[#00D1FF]" />
              <span>{isConnecting ? 'Searching for Bluetooth OBD...' : 'Connect Physical OBD-II Bluetooth Dongle'}</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-[#9FB6C8] text-center mt-4">
          Never blocked behind paywalls. Free tier includes live speed, RPM gauges, diagnostic trouble codes, and demo car access.
        </p>
      </div>
    </div>
  );
};
