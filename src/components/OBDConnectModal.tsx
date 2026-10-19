import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radio,
  Bluetooth,
  Cpu,
  X,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sliders,
  Car,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { obdManager, DrivingProfile } from '../services/obdSimulator';
import { haptics } from '../services/haptics';
import { useI18n } from '../i18n/I18nProvider';

interface OBDConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  isHardware: boolean;
  onRefreshState: () => void;
}

export const OBDConnectModal: React.FC<OBDConnectModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  isHardware,
  onRefreshState,
}) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState<boolean>(false);
  const [justConnected, setJustConnected] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<DrivingProfile>(
    obdManager.getActiveProfile()
  );
  const [showPermissionExplainer, setShowPermissionExplainer] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleInitiateHardwarePairing = () => {
    haptics.lightTap();
    setShowPermissionExplainer(true);
  };

  const handleConfirmGrantAndPair = async () => {
    setShowPermissionExplainer(false);
    setLoading(true);
    setErrorMsg(null);
    haptics.lightTap();
    try {
      const res = await obdManager.connectWebBluetooth();
      if (!res.success) {
        setErrorMsg(res.error || 'Bluetooth pairing was cancelled or no device was selected.');
      } else {
        setJustConnected(true);
        haptics.mediumSuccess();
        setTimeout(() => {
          onRefreshState();
          onClose();
          setJustConnected(false);
        }, 900);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Bluetooth connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSimulator = async () => {
    setLoading(true);
    setErrorMsg(null);
    haptics.lightTap();
    try {
      await obdManager.connectVirtualDongle();
      setJustConnected(true);
      haptics.mediumSuccess();
      setTimeout(() => {
        onRefreshState();
        onClose();
        setJustConnected(false);
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    haptics.lightTap();
    obdManager.disconnect();
    onRefreshState();
  };

  const handleProfileSelect = (p: DrivingProfile) => {
    haptics.lightTap();
    setSelectedProfile(p);
    obdManager.setDrivingProfile(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 sm:p-8 shadow-2xl space-y-6"
      >
        {/* Header with Back Navigation and Close */}
        <div className="flex items-center justify-between border-b border-[#2C3440] pb-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => {
                haptics.lightTap();
                onClose();
              }}
              className="flex items-center gap-1 rounded-xl bg-[#1A202A] border border-[#2C3440] px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold text-cyan-300 hover:text-white transition-all min-h-[48px] shrink-0"
              aria-label="Return to Dashboard"
            >
              <ArrowLeft className="h-4 w-4 text-cyan-400 shrink-0" />
              <span className="hidden xs:inline">Back</span>
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
              <Radio className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-base sm:text-lg font-bold text-white truncate">
                CarAI — Connect OBD Adapter
              </h3>
              <p className="text-xs text-zinc-300 truncate">
                {t('app.tagline')}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              haptics.lightTap();
              onClose();
            }}
            className="rounded-full bg-[#1A202A] border border-[#2C3440] p-3 text-zinc-300 hover:text-white transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Safety Note Advisory (Must Not Interact While Driving) */}
        <div className="rounded-xl bg-[#0B1F2E] border border-[#13C2A3]/30 px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-[#EAF6FF]">
          <span className="h-2 w-2 rounded-full bg-[#13C2A3] shrink-0" />
          <p>
            <strong className="text-[#13C2A3]">Safety Advisory:</strong> Never interact with screen while driving. Designed for hands-free car displays and passenger use. Works with any standard ELM327 / OBDLink / vLinker adapter.
          </p>
        </div>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-start gap-2.5 rounded-2xl border border-red-500/40 bg-red-500/15 p-4 text-sm text-red-200"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{errorMsg}</span>
          </motion.div>
        )}

        {/* Dynamic Radar-to-Checkmark Visual Stage */}
        <div className="relative flex flex-col items-center justify-center py-6 rounded-2xl bg-[#0E1116] border border-[#2C3440] overflow-hidden">
          {/* Concentric Radar Rings Animation */}
          {loading && !justConnected ? (
            <div className="relative flex items-center justify-center h-28 w-28">
              {[1, 2, 3].map((ring) => (
                <motion.div
                  key={ring}
                  initial={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ scale: [0.6, 1.8], opacity: [0.8, 0] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    delay: (ring - 1) * 0.55,
                    ease: 'easeOut',
                  }}
                  className="absolute inset-0 rounded-full border border-cyan-400/40 bg-cyan-500/5 pointer-events-none"
                />
              ))}
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 shadow-lg shadow-cyan-500/20">
                <Car className="h-8 w-8 animate-pulse" />
              </div>
            </div>
          ) : justConnected || isConnected ? (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              className="relative flex items-center justify-center h-28 w-28"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 shadow-lg shadow-emerald-500/30">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>
            </motion.div>
          ) : (
            <div className="relative flex items-center justify-center h-28 w-28">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A202A] border border-[#2C3440] text-zinc-400">
                <Radio className="h-7 w-7" />
              </div>
            </div>
          )}

          <div className="mt-3 text-center px-4">
            <span className="font-mono-tech text-xs sm:text-sm font-bold text-white tracking-wider block">
              {loading
                ? 'SCANNING CAN BUS PROTOCOLS (ISO 15765-4)...'
                : isConnected
                ? isHardware
                  ? 'ECU LINKED VIA PHYSICAL BLUETOOTH BLE'
                  : 'ECU LINKED VIA 50Hz HIGH-FIDELITY SIMULATOR'
                : 'READY TO PAIR WITH VEHICLE OBD-II PORT'}
            </span>
            <p className="text-xs text-zinc-300 mt-1">
              {isConnected
                ? 'Telemetry streaming active: 11-bit CAN (500 kbaud)'
                : 'Plug adapter into OBD port underneath steering wheel'}
            </p>
          </div>
        </div>

        {/* Current Connection Controls */}
        <div className="flex items-center justify-between rounded-2xl bg-[#0E1116] border border-[#2C3440] p-4">
          <div>
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono-tech font-bold">
              Status
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`h-3 w-3 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                }`}
              />
              <span className="font-mono-tech text-sm font-bold text-white">
                {isConnected ? 'ONLINE & STREAMING' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="rounded-xl bg-[#1A202A] border border-red-500/40 px-5 py-2.5 text-xs sm:text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-colors min-h-[48px] flex items-center justify-center"
              aria-label="Disconnect OBD adapter"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* In-App Bluetooth Permission Explanation Dialog */}
        <AnimatePresence>
          {showPermissionExplainer && (
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="bt-rationale-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl border border-cyan-500/40 bg-cyan-950/40 p-4 sm:p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                  <Bluetooth className="h-5 w-5" />
                </div>
                <div>
                  <h4 id="bt-rationale-title" className="text-sm font-bold text-white">Bluetooth Access Required</h4>
                  <p className="text-xs text-cyan-200 font-mono-tech">OBD-II Hardware Communication</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal">
                Car AI connects via Bluetooth to communicate with your vehicle&apos;s physical ELM327 OBD-II adapter. This permission is used exclusively to exchange real-time engine telemetry, read Diagnostic Trouble Codes (DTCs), and monitor emissions sensors. No personal location or audio data is ever tracked or stored.
              </p>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  role="button"
                  aria-label="Grant Bluetooth and Pair Adapter"
                  onClick={handleConfirmGrantAndPair}
                  className="flex-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-3 text-xs sm:text-sm transition-colors min-h-[48px] flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/30"
                >
                  <Bluetooth className="h-4 w-4" />
                  <span>Grant &amp; Pair Adapter</span>
                </button>
                <button
                  type="button"
                  role="button"
                  aria-label="Cancel Bluetooth Permission Request"
                  onClick={() => setShowPermissionExplainer(false)}
                  className="rounded-xl bg-[#1A202A] border border-[#2C3440] text-zinc-300 hover:text-white font-bold py-3 px-4 text-xs sm:text-sm transition-colors min-h-[48px]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Mode Selection Buttons */}
        <div className="space-y-3">
          {/* Hardware Bluetooth */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleInitiateHardwarePairing}
            disabled={loading}
            className="flex w-full items-center justify-between rounded-2xl border border-[#2C3440] bg-[#1A202A] p-4 text-left hover:border-cyan-400/80 transition-all disabled:opacity-50 min-h-[56px]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shrink-0">
                <Bluetooth className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Pair Physical Bluetooth ELM327</h4>
                <p className="text-xs text-zinc-300">
                  Connect to Veepeak, OBDLink, or generic ELM327 BLE dongle
                </p>
              </div>
            </div>
            <span className="rounded-lg bg-[#0E1116] border border-[#2C3440] px-2.5 py-1 text-xs font-bold text-zinc-300 font-mono-tech shrink-0">
              BLE Hardware
            </span>
          </motion.button>

          {/* Software Virtual Dongle Simulator */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleConnectSimulator}
            disabled={loading}
            className="flex w-full items-center justify-between rounded-2xl border border-[#2C3440] bg-[#1A202A] p-4 text-left hover:border-cyan-400/80 transition-all disabled:opacity-50 min-h-[56px]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shrink-0">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Connect Virtual OBD-II Simulator</h4>
                <p className="text-xs text-zinc-300">
                  Emulates 50Hz CAN bus telemetry, freeze frame & DTC packets
                </p>
              </div>
            </div>
            <span className="rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-1 text-xs font-bold text-cyan-300 font-mono-tech shrink-0">
              Instant
            </span>
          </motion.button>
        </div>

        {/* Driving Profile Switcher */}
        <div className="space-y-3 pt-3 border-t border-[#2C3440]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Simulation Profile</span>
            <span className="text-xs text-zinc-400 font-mono-tech">Live 5Hz Sensor Output</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'highway_cruise' as DrivingProfile, label: 'Highway Cruise (68 mph)' },
              { id: 'city_stop_go' as DrivingProfile, label: 'City Stop & Go' },
              { id: 'spirited_boost' as DrivingProfile, label: 'Spirited Track / Boost' },
              { id: 'idle_cold_start' as DrivingProfile, label: 'Cold Start Idle' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleProfileSelect(p.id)}
                className={`rounded-2xl border p-3 text-left text-xs sm:text-sm font-medium transition-all min-h-[48px] ${
                  selectedProfile === p.id
                    ? 'border-cyan-400 bg-cyan-500/20 text-white'
                    : 'border-[#2C3440] bg-[#0E1116] text-zinc-300 hover:border-[#3A4556]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
