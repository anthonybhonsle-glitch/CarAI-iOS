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
  const [safetyAccepted, setSafetyAccepted] = useState<boolean>(false);
  const [showExplainer, setShowExplainer] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConnectAdapter = async () => {
    haptics.lightTap();
    setIsConnecting(true);
    try {
      telemetry.use('live');
      await obdConnection.connect();
      onClose();
      onNavigateToCockpit();
    } catch (e) {
      setIsConnecting(false);
    }
  };

  const handleTryDemoCar = () => {
    haptics.lightTap();
    telemetry.use('sim');
    onClose();
    onNavigateToCockpit();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1F2E]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#12293B] border border-[#20384E] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-left">
        {/* Language selector in top left */}
        <div className="absolute top-4 left-4">
          <LanguageSwitcher compact />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#9FB6C8] hover:text-[#EAF6FF] hover:bg-white/5 transition"
          aria-label="Close onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step 1: Welcome Header */}
        <div className="text-center mb-6 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-[#00D1FF]/20 border border-[#00D1FF]/40 flex items-center justify-center mx-auto mb-3 text-[#00D1FF]">
            <Car className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#EAF6FF] tracking-tight">
            Welcome to CarAI Pro
          </h2>
          <p className="text-sm font-semibold text-[#00D1FF] mt-1">
            "{t('app.tagline')}"
          </p>
        </div>

        {/* Step 2: Safety Note (Must Accept) */}
        <div className="bg-[#0B1F2E] border border-amber-500/30 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FFB020] shrink-0 mt-0.5" />
            <div className="text-xs text-[#EAF6FF] space-y-1">
              <span className="font-bold text-[#FFB020] block">DRIVER SAFETY ADVISORY</span>
              <p className="text-[#9FB6C8] leading-relaxed">
                Do not interact with the screen while operating the vehicle. Diagnostic readings and AI suggestions are advisory only and cannot replace licensed automotive mechanical inspections.
              </p>
              <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={safetyAccepted}
                  onChange={(e) => {
                    haptics.lightTap();
                    setSafetyAccepted(e.target.checked);
                  }}
                  className="rounded border-[#20384E] text-[#00D1FF] focus:ring-[#00D1FF] h-4 w-4 bg-[#12293B]"
                />
                <span className="text-xs font-semibold text-[#EAF6FF]">
                  I understand. I will not interact while driving.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Step 3: Connect your car */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#9FB6C8] uppercase tracking-wider">
              CONNECT YOUR CAR
            </span>
            <button
              onClick={() => {
                haptics.lightTap();
                setShowExplainer(!showExplainer);
              }}
              className="text-xs text-[#00D1FF] hover:underline flex items-center gap-1 font-semibold"
            >
              <HelpCircle className="w-3.5 h-3.5" /> What's this?
            </button>
          </div>

          {showExplainer && (
            <div className="bg-[#0B1F2E] border border-[#00D1FF]/30 p-3 rounded-xl text-xs text-[#EAF6FF] space-y-1 animate-fadeIn">
              <p className="font-semibold text-[#00D1FF]">20-Second OBD-II Explainer:</p>
              <p className="text-[#9FB6C8]">
                Every gasoline and diesel car built since 1996 has a standard 16-pin OBD-II port under the steering wheel. Plug in any standard $15–$30 ELM327 or OBDLink Bluetooth adapter.
              </p>
              <p className="text-[11px] text-[#13C2A3] font-semibold">
                ✓ Works with any standard ELM327 v1.5 / v2.1 or OBDLink BLE dongle.
              </p>
            </div>
          )}

          <p className="text-xs text-[#9FB6C8]">
            Plug your OBD-II Bluetooth adapter into the port under your dashboard, then tap below:
          </p>

          <div className="space-y-2 pt-1">
            <button
              onClick={handleConnectAdapter}
              disabled={!safetyAccepted || isConnecting}
              className="w-full py-3 rounded-xl bg-[#00D1FF] hover:bg-[#00b8e6] text-[#06151F] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00D1FF]/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Bluetooth className="w-4 h-4" />
              <span>{isConnecting ? 'Searching Bluetooth...' : 'Connect OBD Adapter'}</span>
            </button>

            <button
              onClick={handleTryDemoCar}
              disabled={!safetyAccepted}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#EAF6FF] font-semibold text-xs border border-white/10 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlugZap className="w-4 h-4 text-[#FFB020]" />
              <span>Try Demo Car (No Adapter Needed)</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-[#9FB6C8] text-center mt-4">
          Never blocked behind paywalls. Free tier includes live speed, RPM, diagnostic codes, and demo car access.
        </p>
      </div>
    </div>
  );
};
