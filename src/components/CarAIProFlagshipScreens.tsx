import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Battery,
  BookOpen,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Gauge,
  Info,
  Mic,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Thermometer,
  Wrench,
  Zap,
  ArrowRight,
  Radio,
  X,
  Tv,
} from 'lucide-react';
import { haptics } from '../services/haptics';
import { useI18n } from '../i18n/I18nProvider';

interface CarAIProFlagshipScreensProps {
  onNavigateToDiagnostics?: () => void;
  onNavigateToCustomizer?: (carModel?: string) => void;
  onOpenPaywall?: (ctx?: any) => void;
  onNavigateToMarketplace?: (cat?: string) => void;
  onNavigateToCockpit?: () => void;
}

export const CarAIProFlagshipScreens: React.FC<CarAIProFlagshipScreensProps> = ({
  onNavigateToDiagnostics,
  onNavigateToCustomizer,
  onOpenPaywall,
  onNavigateToMarketplace,
  onNavigateToCockpit,
}) => {
  const { t } = useI18n();
  // Screen selector: 1 = Live OBD-II Diagnostics, 2 = Health Radar, 3 = 3D Tuning & Sound, 4 = Repair Estimator
  const [activeScreen, setActiveScreen] = useState<1 | 2 | 3 | 4>(1);

  // Screen 3: Tuning & Sound state
  const [aeroKit, setAeroKit] = useState<boolean>(false);
  const [exhaustStage2, setExhaustStage2] = useState<boolean>(true);
  const [forgedWheels, setForgedWheels] = useState<boolean>(false);
  const [airSuspension, setAirSuspension] = useState<boolean>(false);
  const [isMicSampling, setIsMicSampling] = useState<boolean>(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean>(false);
  const [showMicRationaleModal, setShowMicRationaleModal] = useState<boolean>(false);

  // Screen 1: DTC Fix Guide Modal state
  const [showFixGuideModal, setShowFixGuideModal] = useState<boolean>(false);

  // Screen 4: Repair Checklist state
  const [downloadedChecklist, setDownloadedChecklist] = useState<boolean>(false);

  // Dynamic sound waveform bars
  const [waveHeights, setWaveHeights] = useState<number[]>([
    24, 38, 52, 68, 92, 96, 78, 60, 44, 30,
  ]);

  useEffect(() => {
    if (!isMicSampling) return;
    const interval = setInterval(() => {
      setWaveHeights((prev) =>
        prev.map(() => Math.floor(Math.random() * 60) + 30)
      );
    }, 140);
    return () => clearInterval(interval);
  }, [isMicSampling]);

  const handleToggleMic = () => {
    haptics.lightTap();
    if (!hasMicPermission && !isMicSampling) {
      setShowMicRationaleModal(true);
      return;
    }
    setIsMicSampling(!isMicSampling);
  };

  const handleGrantMicPermission = () => {
    haptics.mediumSuccess();
    setHasMicPermission(true);
    setIsMicSampling(true);
    setShowMicRationaleModal(false);
  };

  const handleDownloadChecklist = () => {
    haptics.mediumSuccess();
    setDownloadedChecklist(true);
    const content = `CARAI PRO - VEHICLE REPAIR & ESTIMATE CHECKLIST
Vehicle: 2022 BMW 330i (42,100 Miles)
Service: Brake Rotor & Pad Replacement (Front Axle)
Estimated Fair Range: $340 - $410
Itemized Breakdown:
- OEM Ceramic Brake Pads & Wear Sensors: $145.00
- Front Vented Rotors (Pair): $180.00
- Certified Labor (1.4 hrs @ $85/hr): $119.00
- Verified Fair Average Total: $444.00
Advisory Note: Confirm brake fluid copper content before approving full hydraulic flush. Potential savings: $120.00.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CarAI-Repair-Checklist-BMW330i.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setDownloadedChecklist(false), 3000);
  };

  return (
    <div id="carai-flagship-suite" className="space-y-4 pb-6 w-full max-w-5xl mx-auto">
      {/* Executive Suite Header & Screen Switcher */}
      <div className="rounded-2xl border border-[#202732] bg-[#0E1218] p-3 sm:p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1E2530] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold tracking-wide text-white uppercase flex items-center gap-2">
                <span>CarAI Pro — AI Mechanic</span>
                <span className="rounded-md bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-xs text-cyan-300 font-mono-tech">
                  v1.2.0
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-200 font-sans">
                {t('app.tagline')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-mono-tech font-bold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ELM327 CAN-Bus Live</span>
            </span>
          </div>
        </div>

        {/* 4 Core Suite Segment Switchers (Google Play 48dp Touch Targets) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2" role="tablist" aria-label="Suite Features">
          <button
            role="tab"
            aria-selected={activeScreen === 1}
            aria-label="Screen 1: OBD-II Diagnostics and AI Fixes"
            onClick={() => {
              haptics.lightTap();
              setActiveScreen(1);
            }}
            className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-bold transition-all min-h-[48px] ${
              activeScreen === 1
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 ring-1 ring-cyan-400'
                : 'bg-[#151C26] text-zinc-300 hover:text-white hover:bg-[#1A2330] border border-[#242E3D]'
            }`}
          >
            <Activity className="h-4 w-4 shrink-0 text-cyan-300" />
            <span className="truncate">1. OBD Diagnostics</span>
          </button>

          <button
            role="tab"
            aria-selected={activeScreen === 2}
            aria-label="Screen 2: Real-time Vehicle Health Radar"
            onClick={() => {
              haptics.lightTap();
              setActiveScreen(2);
            }}
            className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-bold transition-all min-h-[48px] ${
              activeScreen === 2
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 ring-1 ring-cyan-400'
                : 'bg-[#151C26] text-zinc-300 hover:text-white hover:bg-[#1A2330] border border-[#242E3D]'
            }`}
          >
            <Shield className="h-4 w-4 shrink-0 text-cyan-300" />
            <span className="truncate">2. Health Radar</span>
          </button>

          <button
            role="tab"
            aria-selected={activeScreen === 3}
            aria-label="Screen 3: 3D Tuning Studio and Acoustic Sound"
            onClick={() => {
              haptics.lightTap();
              setActiveScreen(3);
            }}
            className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-bold transition-all min-h-[48px] ${
              activeScreen === 3
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 ring-1 ring-orange-400'
                : 'bg-[#151C26] text-zinc-300 hover:text-white hover:bg-[#1A2330] border border-[#242E3D]'
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0 text-orange-300" />
            <span className="truncate">3. Tuning &amp; Sound</span>
          </button>

          <button
            role="tab"
            aria-selected={activeScreen === 4}
            aria-label="Screen 4: Smart AI Repair Estimator"
            onClick={() => {
              haptics.lightTap();
              setActiveScreen(4);
            }}
            className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-bold transition-all min-h-[48px] ${
              activeScreen === 4
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400'
                : 'bg-[#151C26] text-zinc-300 hover:text-white hover:bg-[#1A2330] border border-[#242E3D]'
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" />
            <span className="truncate">4. Repair Estimator</span>
          </button>
        </div>

        {/* In-Car Screen & Android Auto / Cockpit Banner */}
        <div className="bg-gradient-to-r from-cyan-950/70 via-zinc-900 to-blue-950/60 border border-cyan-500/40 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-inner">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">
                  Car In-Built Display &amp; Cockpit HUD Mode
                </span>
                <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  AAOS &amp; Auto
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Run directly on your car screen: Engine heating, live Urea / DEF levels, 4-wheel TPMS, and ambient LED sync.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              haptics.mediumSuccess();
              if (onNavigateToCockpit) {
                onNavigateToCockpit();
              }
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5 shrink-0 transition"
          >
            <span>Launch Car Cockpit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 1: LIVE OBD-II DIAGNOSTICS & AI FIXES                              */}
      {/* ========================================================================= */}
      {activeScreen === 1 && (
        <section aria-label="OBD-II Diagnostics and AI Fixes" className="space-y-4">
          {/* Section Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl bg-gradient-to-r from-[#0C1520] via-[#0E1A27] to-[#0A1017] border border-cyan-500/40 p-4 shadow-lg">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-extrabold text-white tracking-wide uppercase">
                Live OBD-II Diagnostics &amp; AI Fixes
              </h3>
              <p className="text-xs sm:text-sm text-cyan-300 font-mono-tech mt-0.5">
                Instant Fault Code Decoding • Live Freeze-Frame • Step-by-Step Fix Guides
              </p>
            </div>
            {onNavigateToDiagnostics && (
              <button
                role="button"
                aria-label="Open Deep Diagnostic Scanner"
                onClick={() => {
                  haptics.lightTap();
                  onNavigateToDiagnostics();
                }}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2.5 text-xs sm:text-sm transition-colors min-h-[48px] self-start sm:self-auto shrink-0 shadow-md shadow-cyan-600/30"
              >
                <span>Deep Scanner</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 3 Circular Arc Gauges in a Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0E1218] p-4 rounded-2xl border border-[#222B38] shadow-md">
            {/* 3,450 RPM Gauge */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#131922] border border-[#263140]">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#1A222D" strokeWidth="7" />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="7"
                    strokeDasharray="238"
                    strokeDashoffset="105"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="font-display text-lg font-extrabold text-white block leading-none">
                    3,450
                  </span>
                  <span className="text-xs font-mono-tech text-cyan-300 font-bold">RPM</span>
                </div>
              </div>
              <div className="flex justify-between w-full px-2 mt-1 text-xs font-mono-tech text-zinc-300">
                <span>0 RPM</span>
                <span className="text-zinc-400">Redline: 7,200</span>
                <span>8K</span>
              </div>
            </div>

            {/* 21.4 PSI Boost Gauge */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#131922] border border-[#263140]">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#1A222D" strokeWidth="7" />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="7"
                    strokeDasharray="238"
                    strokeDashoffset="125"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="font-display text-lg font-extrabold text-white block leading-none">
                    21.4
                  </span>
                  <span className="text-xs font-mono-tech text-orange-400 font-bold">PSI</span>
                </div>
              </div>
              <div className="flex justify-between w-full px-2 mt-1 text-xs font-mono-tech text-zinc-300">
                <span>0 PSI</span>
                <span className="text-zinc-400">Twin-Turbo</span>
                <span>35 PSI</span>
              </div>
            </div>

            {/* 92 °C Coolant Temp Gauge */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#131922] border border-[#263140]">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#1A222D" strokeWidth="7" />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="7"
                    strokeDasharray="238"
                    strokeDashoffset="90"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="font-display text-lg font-extrabold text-white block leading-none">
                    92°C
                  </span>
                  <span className="text-xs font-mono-tech text-sky-300 font-bold">COOLANT</span>
                </div>
              </div>
              <div className="flex justify-between w-full px-2 mt-1 text-xs font-mono-tech text-zinc-300">
                <span>40°C</span>
                <span className="text-emerald-400 font-bold">Optimal</span>
                <span>120°C</span>
              </div>
            </div>
          </div>

          {/* ACTIVE FAULT CARD (Red/Orange Border) */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Active fault code P0300 cylinder misfire, click to open step-by-step fix guide"
            onClick={() => {
              haptics.lightTap();
              setShowFixGuideModal(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowFixGuideModal(true);
              }
            }}
            className="cursor-pointer rounded-2xl border border-red-500/60 bg-gradient-to-br from-red-950/40 via-[#181014] to-[#120E13] p-4 sm:p-5 shadow-xl space-y-3 transition-all hover:border-red-400 hover:shadow-red-500/10 focus-visible:ring-2 focus-visible:ring-red-400 outline-none"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold font-mono-tech text-red-400 tracking-wider block">
                    ACTIVE FAULT CONFIRMED
                  </span>
                  <h4 className="font-display text-base sm:text-lg font-bold text-white">
                    DTC P0300 • Random / Multiple Cylinder Misfire
                  </h4>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300 text-xs sm:text-sm font-semibold">
                <span className="hidden sm:inline">Inspect Fix</span>
                <ChevronRight className="h-5 w-5 text-zinc-300" />
              </div>
            </div>

            <p className="text-sm text-zinc-200 leading-relaxed font-normal">
              Engine control module detected multiple cylinder misfire cycles during cold idle. High probability of worn ignition coil on Cylinder 3 or fouled spark plugs.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-red-500/20 text-center font-mono-tech text-xs">
              <div className="p-2 rounded-xl bg-[#1A1217]">
                <span className="text-zinc-300 block text-[11px] mb-0.5">Status</span>
                <span className="font-bold text-white">Confirmed MIL ON</span>
              </div>
              <div className="p-2 rounded-xl bg-[#1A1217]">
                <span className="text-zinc-300 block text-[11px] mb-0.5">Severity</span>
                <span className="font-bold text-red-400">High Risk</span>
              </div>
              <div className="p-2 rounded-xl bg-[#1A1217]">
                <span className="text-zinc-300 block text-[11px] mb-0.5">System</span>
                <span className="font-bold text-white">Powertrain (ECU)</span>
              </div>
            </div>
          </div>

          {/* AI MECHANIC ASSISTANT CARD */}
          <div className="rounded-2xl border border-cyan-500/40 bg-[#0E1520] p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono-tech text-xs font-bold text-cyan-300 uppercase tracking-wide block">
                    AI MECHANIC ASSISTANT
                  </span>
                  <h4 className="font-display text-sm sm:text-base font-bold text-white">
                    Verified DIY Diagnostic Analysis
                  </h4>
                </div>
              </div>
              <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs text-emerald-300 font-bold font-mono-tech">
                Verified DIY
              </span>
            </div>

            <p className="text-sm text-zinc-200 leading-relaxed font-normal">
              Primary Root Cause: Resistance breakdown inside <strong className="text-white font-bold">Ignition Coil #3</strong> under high spark load. Replacement is straightforward and requires only a 10mm socket.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm font-mono-tech text-zinc-200 bg-[#141C28] p-3 rounded-xl border border-[#232F42]">
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Repair Difficulty:</span>
                <span className="text-emerald-400 font-bold">Easy (DIY 25 min)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Estimated OEM Parts:</span>
                <span className="text-white font-bold">$45 - $65 (Delphi / Bosch)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                role="button"
                aria-label="Open Step-by-Step Fix Guide for DTC P0300"
                onClick={() => {
                  haptics.mediumSuccess();
                  setShowFixGuideModal(true);
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-3 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all min-h-[48px]"
              >
                <BookOpen className="h-4 w-4" />
                <span>Step-by-Step Fix Guide</span>
                <ChevronRight className="h-4 w-4" />
              </button>

              {onNavigateToMarketplace && (
                <button
                  role="button"
                  aria-label="Compare replacement ignition parts"
                  onClick={() => {
                    haptics.lightTap();
                    onNavigateToMarketplace('ignition');
                  }}
                  className="rounded-xl bg-[#1A2230] border border-[#2B394E] hover:border-cyan-500/50 text-cyan-300 hover:text-white py-3 px-4 text-sm font-bold transition-all min-h-[48px] flex items-center justify-center gap-2"
                >
                  <span>Parts Finder</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: REAL-TIME VEHICLE HEALTH RADAR                                 */}
      {/* ========================================================================= */}
      {activeScreen === 2 && (
        <section aria-label="Real-Time Vehicle Health Radar" className="space-y-4">
          {/* Section Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl bg-gradient-to-r from-[#071724] via-[#0A1F30] to-[#0A1017] border border-cyan-500/40 p-4 shadow-lg">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-extrabold text-white tracking-wide uppercase">
                Real-Time Vehicle Health Radar
              </h3>
              <p className="text-xs sm:text-sm text-cyan-300 font-mono-tech mt-0.5">
                Complete 360° Subsystem Telemetry &amp; Battery Degradation Analysis
              </p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-3 py-1.5 text-emerald-300 font-mono-tech text-xs sm:text-sm font-bold self-start sm:self-auto">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Overall Score: 96/100 Optimal</span>
            </div>
          </div>

          {/* 3D Wireframe Car Graphic with Floating Subsystem Badges */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#0F1622] via-[#0A1018] to-[#070B10] border border-[#202B3B] p-4 sm:p-6 flex flex-col items-center justify-center min-h-[220px] overflow-hidden shadow-xl">
            {/* Background grid matrix */}
            <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

            {/* Subsystem Floating Badges (Top Row) */}
            <div className="w-full flex justify-between z-10 text-xs sm:text-sm font-mono-tech font-bold gap-2">
              <div className="flex items-center gap-1.5 bg-[#121B28]/95 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-emerald-300 shadow-md">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span>Powertrain 98%</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#121B28]/95 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-emerald-300 shadow-md">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span>Electrical 100%</span>
              </div>
            </div>

            {/* Futuristic Car Silhouette with Blue Radar Glow */}
            <div className="relative my-3 w-full flex items-center justify-center">
              <div className="absolute h-28 w-56 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
              <img
                src="https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80"
                alt="Vehicle Health 3D Diagnostic Model"
                className="h-28 sm:h-36 w-full max-w-md object-cover rounded-2xl border border-cyan-500/40 shadow-xl relative z-10 mix-blend-luminosity brightness-110 contrast-125"
              />
            </div>

            {/* Subsystem Floating Badges (Bottom Row) */}
            <div className="w-full flex justify-between z-10 text-xs sm:text-sm font-mono-tech font-bold gap-2">
              <div className="flex items-center gap-1.5 bg-[#121B28]/95 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-emerald-300 shadow-md">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Braking 85%</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#121B28]/95 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-emerald-300 shadow-md">
                <Sliders className="h-4 w-4 text-emerald-400" />
                <span>Transmission 94%</span>
              </div>
            </div>
          </div>

          {/* 4 Telemetry Metric Cards (2x2 Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 12V Battery */}
            <div className="rounded-2xl bg-[#0E131B] border border-[#202936] p-3.5 space-y-1.5 shadow-md">
              <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Battery className="h-4 w-4 text-emerald-400" />
                  <span>12V BATTERY</span>
                </span>
                <span className="text-emerald-400 font-bold">14.2V</span>
              </div>
              <div className="font-display text-xl sm:text-2xl font-extrabold text-white">
                14.20 V
              </div>
              <div className="flex items-center gap-1 text-xs font-mono-tech text-emerald-400 font-bold">
                <Check className="h-3.5 w-3.5" />
                <span>Alternator Charging OK</span>
              </div>
            </div>

            {/* Transmission Fluid */}
            <div className="rounded-2xl bg-[#0E131B] border border-[#202936] p-3.5 space-y-1.5 shadow-md">
              <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Thermometer className="h-4 w-4 text-cyan-400" />
                  <span>TRANSMISSION FLUID</span>
                </span>
                <span className="text-cyan-400 font-bold">78°C</span>
              </div>
              <div className="font-display text-xl sm:text-2xl font-extrabold text-white">
                78.4 °C
              </div>
              <div className="flex items-center gap-1 text-xs font-mono-tech text-cyan-400 font-bold">
                <Check className="h-3.5 w-3.5" />
                <span>Thermal Range Optimal</span>
              </div>
            </div>

            {/* O2 Sensor Bank 1 */}
            <div className="rounded-2xl bg-[#0E131B] border border-[#202936] p-3.5 space-y-1.5 shadow-md">
              <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span>O2 SENSOR BANK 1</span>
                </span>
                <span className="text-cyan-400 font-bold">0.85V</span>
              </div>
              <div className="font-display text-xl sm:text-2xl font-extrabold text-white">
                0.85 V
              </div>
              <div className="flex items-center gap-1 text-xs font-mono-tech text-emerald-400 font-bold">
                <Check className="h-3.5 w-3.5" />
                <span>Stoichiometric Lambda 1.0</span>
              </div>
            </div>

            {/* Fuel Economy */}
            <div className="rounded-2xl bg-[#0E131B] border border-[#202936] p-3.5 space-y-1.5 shadow-md">
              <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Gauge className="h-4 w-4 text-emerald-400" />
                  <span>FUEL ECONOMY</span>
                </span>
                <span className="text-emerald-400 font-bold">31.4 MPG</span>
              </div>
              <div className="font-display text-xl sm:text-2xl font-extrabold text-white">
                31.4 MPG
              </div>
              <div className="flex items-center gap-1 text-xs font-mono-tech text-emerald-400 font-bold">
                <Check className="h-3.5 w-3.5" />
                <span>Eco Highway Cruise</span>
              </div>
            </div>
          </div>

          {/* NEXT RECOMMENDED SERVICE CARD */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Next recommended service: Cabin air filter in 1200 miles, click to view repair estimates"
            onClick={() => {
              haptics.lightTap();
              setActiveScreen(4);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveScreen(4);
              }
            }}
            className="cursor-pointer rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-[#18130E] to-[#120F0D] p-4 flex items-center justify-between shadow-lg hover:border-amber-400 transition-all min-h-[48px] focus-visible:ring-2 focus-visible:ring-amber-400 outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold font-mono-tech text-amber-300 uppercase tracking-wider block">
                  NEXT RECOMMENDED SERVICE
                </span>
                <h4 className="font-display text-sm sm:text-base font-bold text-white">
                  Cabin Air Filter &amp; Microfilter Service{' '}
                  <span className="text-xs font-normal text-zinc-300">due in 1,200 miles</span>
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-amber-300">
              <span className="hidden sm:inline">View Estimator</span>
              <ChevronRight className="h-5 w-5 text-amber-300" />
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: AI 3D TUNING STUDIO & SOUND DIAGNOSTICS                         */}
      {/* ========================================================================= */}
      {activeScreen === 3 && (
        <section aria-label="3D Tuning Studio and Acoustic Sound Diagnostics" className="space-y-4">
          {/* Section Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl bg-gradient-to-r from-[#211409] via-[#1C1108] to-[#0A0D14] border border-orange-500/40 p-4 shadow-lg">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-extrabold text-white tracking-wide uppercase">
                AI 3D Tuning Studio &amp; Acoustic Inspector
              </h3>
              <p className="text-xs sm:text-sm text-orange-300 font-mono-tech mt-0.5">
                Analyze Engine Harmonics • Frequency Spectrum • Visualize Custom Builds
              </p>
            </div>
            {onNavigateToCustomizer && (
              <button
                role="button"
                aria-label="Open Full 3D AI Customizer"
                onClick={() => {
                  haptics.lightTap();
                  onNavigateToCustomizer();
                }}
                className="flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2.5 text-xs sm:text-sm transition-colors min-h-[48px] self-start sm:self-auto shrink-0 shadow-md shadow-orange-600/30"
              >
                <span>Full 3D Studio</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Car Hero Image */}
          <div className="relative rounded-2xl overflow-hidden border border-[#2A3444] bg-[#0A0E15] shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80"
              alt="BMW M4 Studio 3D Customizer"
              className="w-full h-48 sm:h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-transparent to-black/30" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono-tech text-orange-400 font-bold uppercase tracking-wider block">
                  STAGED PERFORMANCE
                </span>
                <h4 className="font-display text-lg sm:text-xl font-extrabold text-white">
                  BMW M4 Competition (G82)
                </h4>
              </div>
              <span className="rounded-lg bg-orange-500/20 border border-orange-500/40 px-3 py-1 text-xs font-mono-tech font-bold text-orange-300">
                548 WHP Stage 2
              </span>
            </div>
          </div>

          {/* CUSTOMIZATION SECTION: 4 Interactive Toggle Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono-tech font-bold uppercase tracking-wider text-zinc-300">
                INTERACTIVE PERFORMANCE HARDWARE
              </span>
              <button
                role="button"
                aria-label="Reset hardware modifications"
                onClick={() => {
                  haptics.lightTap();
                  setAeroKit(false);
                  setExhaustStage2(false);
                  setForgedWheels(false);
                  setAirSuspension(false);
                }}
                className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white min-h-[44px] px-2 font-mono-tech"
              >
                <span>Reset All</span>
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Aero Kit */}
              <button
                type="button"
                role="switch"
                aria-checked={aeroKit}
                aria-label="Toggle Carbon Aero Kit"
                onClick={() => {
                  haptics.lightTap();
                  setAeroKit(!aeroKit);
                }}
                className={`rounded-2xl border p-3 flex flex-col justify-between transition-all min-h-[110px] text-left ${
                  aeroKit
                    ? 'border-orange-500 bg-orange-950/30 ring-1 ring-orange-500/50 shadow-md'
                    : 'border-[#222B38] bg-[#0E131C] hover:border-[#323E50]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-white">Carbon Aero Kit</span>
                  <div
                    className={`h-4 w-8 rounded-full relative transition-colors ${
                      aeroKit ? 'bg-orange-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full bg-white transition-transform absolute top-0.5 ${
                        aeroKit ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-zinc-300 mt-1 font-mono-tech">
                  Front Splitter &amp; Canards
                </p>
                <span className="text-[11px] font-mono-tech font-bold text-orange-400 mt-2">
                  +18 kg Downforce
                </span>
              </button>

              {/* Exhaust Stage 2 */}
              <button
                type="button"
                role="switch"
                aria-checked={exhaustStage2}
                aria-label="Toggle Titanium Exhaust Stage 2"
                onClick={() => {
                  haptics.lightTap();
                  setExhaustStage2(!exhaustStage2);
                }}
                className={`rounded-2xl border p-3 flex flex-col justify-between transition-all min-h-[110px] text-left ${
                  exhaustStage2
                    ? 'border-orange-500 bg-orange-950/30 ring-1 ring-orange-500/50 shadow-md'
                    : 'border-[#222B38] bg-[#0E131C] hover:border-[#323E50]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-white">Titanium Exhaust</span>
                  <div
                    className={`h-4 w-8 rounded-full relative transition-colors ${
                      exhaustStage2 ? 'bg-orange-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full bg-white transition-transform absolute top-0.5 ${
                        exhaustStage2 ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-zinc-300 mt-1 font-mono-tech">
                  Stage 2 Free-Flow Catback
                </p>
                <span className="text-[11px] font-mono-tech font-bold text-orange-400 mt-2">
                  +38 HP / Aggressive
                </span>
              </button>

              {/* Forged Wheels */}
              <button
                type="button"
                role="switch"
                aria-checked={forgedWheels}
                aria-label="Toggle Lightweight Forged Wheels"
                onClick={() => {
                  haptics.lightTap();
                  setForgedWheels(!forgedWheels);
                }}
                className={`rounded-2xl border p-3 flex flex-col justify-between transition-all min-h-[110px] text-left ${
                  forgedWheels
                    ? 'border-orange-500 bg-orange-950/30 ring-1 ring-orange-500/50 shadow-md'
                    : 'border-[#222B38] bg-[#0E131C] hover:border-[#323E50]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-white">Forged Wheels</span>
                  <div
                    className={`h-4 w-8 rounded-full relative transition-colors ${
                      forgedWheels ? 'bg-orange-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full bg-white transition-transform absolute top-0.5 ${
                        forgedWheels ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-zinc-300 mt-1 font-mono-tech">
                  20&quot; Monoblock Lightweight
                </p>
                <span className="text-[11px] font-mono-tech font-bold text-orange-400 mt-2">
                  -4.2 kg Unsprung Mass
                </span>
              </button>

              {/* Air Suspension */}
              <button
                type="button"
                role="switch"
                aria-checked={airSuspension}
                aria-label="Toggle Adjustable Air Suspension"
                onClick={() => {
                  haptics.lightTap();
                  setAirSuspension(!airSuspension);
                }}
                className={`rounded-2xl border p-3 flex flex-col justify-between transition-all min-h-[110px] text-left ${
                  airSuspension
                    ? 'border-orange-500 bg-orange-950/30 ring-1 ring-orange-500/50 shadow-md'
                    : 'border-[#222B38] bg-[#0E131C] hover:border-[#323E50]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-white">Air Suspension</span>
                  <div
                    className={`h-4 w-8 rounded-full relative transition-colors ${
                      airSuspension ? 'bg-orange-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full bg-white transition-transform absolute top-0.5 ${
                        airSuspension ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-zinc-300 mt-1 font-mono-tech">
                  Dual-Chamber Electronic Valving
                </p>
                <span className="text-[11px] font-mono-tech font-bold text-orange-400 mt-2">
                  Stance &amp; Track Presets
                </span>
              </button>
            </div>
          </div>

          {/* AI ACOUSTIC ENGINE INSPECTOR • LIVE */}
          <div className="rounded-2xl border border-[#242F40] bg-[#0C111A] p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-mono-tech">
              <div className="flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-orange-400" />
                <span className="font-bold tracking-wider text-sm">
                  AI ACOUSTIC ENGINE SOUND INSPECTOR
                </span>
              </div>
              <button
                type="button"
                role="button"
                aria-label={isMicSampling ? 'Stop Acoustic Microphone Sampling' : 'Start Acoustic Microphone Sampling'}
                onClick={handleToggleMic}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition-all min-h-[48px] self-start sm:self-auto ${
                  isMicSampling
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/20'
                    : 'bg-[#18212E] text-zinc-300 hover:text-white border border-[#2E3C50]'
                }`}
              >
                <Mic className={`h-4 w-4 ${isMicSampling ? 'text-emerald-400 animate-pulse' : 'text-zinc-400'}`} />
                <span>{isMicSampling ? 'Listening (Tap to Pause)' : 'Start Acoustic Inspection'}</span>
              </button>
            </div>

            {/* Animated Frequency Equalizer Spectrum */}
            <div className="space-y-1">
              <div className="h-16 flex items-end justify-between gap-1.5 px-3 bg-[#06080C] rounded-xl border border-[#1E2838] py-2">
                {waveHeights.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-gradient-to-t from-cyan-500 via-sky-400 to-orange-400 rounded-t-sm transition-all duration-150"
                    style={{ height: `${isMicSampling ? h : 15}%` }}
                  />
                ))}
              </div>

              <div className="flex justify-between text-xs font-mono-tech text-zinc-300 px-1">
                <span>20 Hz</span>
                <span>100 Hz</span>
                <span>500 Hz</span>
                <span>1 kHz</span>
                <span>5 kHz</span>
                <span>20 kHz</span>
              </div>
            </div>

            {/* 4 Telemetry Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono-tech text-xs">
              <div className="bg-[#121924] p-2 rounded-xl border border-[#1E2838]">
                <span className="text-zinc-300 block text-[11px] mb-0.5">CURRENT RPM</span>
                <span className="font-bold text-white text-sm">2,450 rpm</span>
              </div>
              <div className="bg-[#121924] p-2 rounded-xl border border-[#1E2838]">
                <span className="text-zinc-300 block text-[11px] mb-0.5">ENGINE LOAD</span>
                <span className="font-bold text-white text-sm">68.2 %</span>
              </div>
              <div className="bg-[#121924] p-2 rounded-xl border border-[#1E2838]">
                <span className="text-zinc-300 block text-[11px] mb-0.5">THROTTLE</span>
                <span className="font-bold text-white text-sm">23.0 %</span>
              </div>
              <div className="bg-[#121924] p-2 rounded-xl border border-[#1E2838]">
                <span className="text-zinc-300 block text-[11px] mb-0.5">OIL TEMP</span>
                <span className="font-bold text-orange-400 text-sm">92.0 °C</span>
              </div>
            </div>

            {/* DIAGNOSTIC SUMMARY */}
            <div className="rounded-xl bg-[#101B28] border border-emerald-500/40 p-3 flex items-start gap-3">
              <div className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-4 w-4 stroke-[3]" />
              </div>
              <div>
                <span className="text-xs font-mono-tech font-bold text-emerald-400 tracking-wider block">
                  ACOUSTIC HARMONIC DIAGNOSIS
                </span>
                <h5 className="font-display text-sm sm:text-base font-bold text-white leading-tight mt-0.5">
                  Engine Sound: Normal Harmonic Rhythm (No Rod Knock Detected)
                </h5>
                <p className="text-xs sm:text-sm text-zinc-300 mt-1">
                  Valvetrain frequency profile matches OEM S58 baseline. Zero anomalous high-frequency metallic ping or valve slap detected in sampling buffer.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: SMART AI REPAIR ESTIMATOR                                       */}
      {/* ========================================================================= */}
      {activeScreen === 4 && (
        <section aria-label="Smart AI Repair Estimator and Anti-Ripoff Protection" className="space-y-4">
          {/* Section Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl bg-gradient-to-r from-[#081812] via-[#0D241B] to-[#0A1017] border border-emerald-500/40 p-4 shadow-lg">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-extrabold text-white tracking-wide uppercase">
                Smart AI Repair Estimator
              </h3>
              <p className="text-xs sm:text-sm text-emerald-300 font-mono-tech mt-0.5">
                Fair Pricing Breakdown • Anti-Ripoff Protection • Verified Regional Rates
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs sm:text-sm font-mono-tech font-bold text-emerald-300 self-start sm:self-auto">
              <ShieldCheck className="h-4 w-4" />
              <span>Anti-Ripoff Active</span>
            </div>
          </div>

          {/* Vehicle Sub-header with BMW Logo */}
          <div className="flex items-center justify-between bg-[#0E1520] p-4 rounded-2xl border border-[#202C3E] shadow-md">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#182332] border border-[#2D3F58] flex items-center justify-center font-bold text-xs text-white font-mono-tech shrink-0">
                BMW
              </div>
              <div>
                <h4 className="font-display text-base sm:text-lg font-bold text-white">
                  2022 BMW 330i xDrive
                </h4>
                <p className="text-xs sm:text-sm font-mono-tech text-zinc-300">
                  42,100 Miles • Front Brake Rotor &amp; Ceramic Pad Service
                </p>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=240&q=80"
              alt="BMW 330i xDrive Sedan"
              className="h-12 w-20 object-cover rounded-xl border border-[#273549] hidden xs:block"
            />
          </div>

          {/* FAIR PRICE ESTIMATE SEMICIRCULAR DIAL */}
          <div className="rounded-2xl border border-emerald-500/30 bg-[#0B1515] p-5 text-center space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-300">
              <span className="font-bold uppercase tracking-wider text-sm text-emerald-300">
                REGIONAL FAIR PRICE ESTIMATE
              </span>
              <span className="flex items-center gap-1 text-zinc-300">
                <Info className="h-4 w-4 text-emerald-400" />
                <span>OEM Verified</span>
              </span>
            </div>

            {/* Dial Graphic */}
            <div className="relative flex h-28 items-center justify-center">
              <svg className="h-32 w-64" viewBox="0 0 200 120" aria-hidden="true">
                {/* Background Arc */}
                <path
                  d="M 20 110 A 80 80 0 0 1 180 110"
                  fill="none"
                  stroke="#172624"
                  strokeWidth="11"
                  strokeLinecap="round"
                />
                {/* Active Green Arc */}
                <path
                  d="M 20 110 A 80 80 0 0 1 142 38"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="11"
                  strokeLinecap="round"
                />
                {/* Ticks */}
                {Array.from({ length: 21 }).map((_, i) => {
                  const rad = ((-180 + i * 9) * Math.PI) / 180;
                  const x1 = 100 + 64 * Math.cos(rad);
                  const y1 = 110 + 64 * Math.sin(rad);
                  const x2 = 100 + 72 * Math.cos(rad);
                  const y2 = 110 + 72 * Math.sin(rad);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#34D399"
                      strokeWidth="1.2"
                      opacity="0.6"
                    />
                  );
                })}
              </svg>
              <div className="absolute top-8 text-center">
                <span className="text-xs font-mono-tech text-zinc-300 block">
                  Estimated Fair Market Range
                </span>
                <span className="font-display text-2xl font-extrabold text-emerald-400 block tracking-tight">
                  $340 – $410
                </span>
                <span className="text-xs font-mono-tech text-zinc-300 block mt-0.5">
                  Includes Parts, Certified Labor &amp; Taxes
                </span>
              </div>
            </div>

            {/* Fair Local Market Average Badge */}
            <div className="flex items-center justify-center gap-2 rounded-xl bg-[#0F2420] border border-emerald-500/40 p-2.5 text-center text-xs sm:text-sm text-emerald-300 font-medium">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="block text-white font-bold">Fair Local Market Average Guaranteed</strong>
                <span className="text-xs text-zinc-300">Real-time quotes matched against 4,200 regional repair shops</span>
              </div>
            </div>
          </div>

          {/* COST BREAKDOWN TABLE */}
          <div className="rounded-2xl bg-[#0E141D] border border-[#202936] p-4 sm:p-5 space-y-2 shadow-lg">
            <span className="text-xs font-mono-tech font-bold uppercase tracking-wider text-zinc-300 block">
              ITEMIZED COST BREAKDOWN
            </span>
            <div className="space-y-2 text-sm text-zinc-200 divide-y divide-[#1E2838]">
              <div className="flex justify-between items-center pt-2">
                <span>OEM Brake Pads &amp; Electronic Wear Sensors</span>
                <span className="font-mono-tech font-bold text-white">$145.00</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span>Front Vented Rotors (Matched Pair)</span>
                <span className="font-mono-tech font-bold text-white">$180.00</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span>Certified ASE Labor (1.4 hrs @ $85/hr)</span>
                <span className="font-mono-tech font-bold text-white">$119.00</span>
              </div>
              <div className="flex justify-between items-center pt-2 font-bold text-emerald-300 text-base">
                <span>Total Estimated Cost</span>
                <span className="font-mono-tech text-lg">$444.00 ✓</span>
              </div>
            </div>
          </div>

          {/* AI MECHANIC ADVISOR TIP CARD */}
          <div className="rounded-2xl border border-cyan-500/40 bg-[#0E1522] p-4 sm:p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono-tech">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">AI MECHANIC ADVISOR TIP</span>
              </div>
              <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">
                PRO TIP
              </span>
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed font-normal">
              Advisor Warning: Many shops suggest an unnecessary brake fluid flush when changing pads. Ask the technician to test copper PPM moisture content first. Potential savings: <strong className="text-emerald-400 font-bold">$120.00</strong>.
            </p>

            <button
              role="button"
              aria-label="Download Vehicle Repair Checklist"
              onClick={handleDownloadChecklist}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-3 px-4 text-sm font-bold text-white shadow-lg shadow-cyan-700/30 flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              <Download className="h-4 w-4" />
              <span>{downloadedChecklist ? 'Checklist Downloaded to Device!' : 'Download Repair Checklist (PDF/TXT)'}</span>
            </button>
          </div>

          {/* Anti-Ripoff Protection Footer Badges */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono-tech text-xs text-zinc-300 border-t border-[#1E2838]">
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#0E141D]">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="font-bold">ANTI-RIPOFF</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#0E141D]">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span className="font-bold">100% PRIVATE</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#0E141D]">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="font-bold">VERIFIED RATES</span>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* GOOGLE PLAY COMPLIANT IN-APP PERMISSION RATIONALE: MICROPHONE             */}
      {/* ========================================================================= */}
      {showMicRationaleModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mic-rationale-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-orange-500/40 bg-[#121822] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#243042] pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 shrink-0">
                  <Mic className="h-6 w-6" />
                </div>
                <div>
                  <h4 id="mic-rationale-title" className="font-display text-base sm:text-lg font-bold text-white">
                    Microphone Access Required
                  </h4>
                  <p className="text-xs text-orange-300 font-mono-tech">
                    Engine Acoustic Harmonic Analysis
                  </p>
                </div>
              </div>
              <button
                role="button"
                aria-label="Close permission dialog"
                onClick={() => setShowMicRationaleModal(false)}
                className="rounded-full bg-[#1A2330] p-2 text-zinc-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-zinc-200 leading-relaxed">
              <p>
                <strong>Why Car AI requires audio permission:</strong>
              </p>
              <p>
                Car AI samples acoustic frequency waves from your vehicle's engine bay and exhaust to diagnose mechanical irregularities—including rod knock, timing chain slap, and valve ticking.
              </p>
              <div className="p-3 rounded-xl bg-[#17212F] border border-orange-500/30 text-xs font-mono-tech text-orange-200">
                • Audio data is analyzed purely on-device in real-time.<br />
                • Recordings are never saved, uploaded, or shared with third parties.<br />
                • Analysis stops immediately when you pause or leave the screen.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                role="button"
                aria-label="Grant Audio Permission"
                onClick={handleGrantMicPermission}
                className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-4 text-sm transition-colors min-h-[48px] flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30"
              >
                <Mic className="h-4 w-4" />
                <span>Grant Audio Access</span>
              </button>
              <button
                role="button"
                aria-label="Cancel permission request"
                onClick={() => setShowMicRationaleModal(false)}
                className="rounded-xl bg-[#1A2330] border border-[#2C3B50] text-zinc-300 hover:text-white font-bold py-3 px-4 text-sm transition-colors min-h-[48px]"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE STEP-BY-STEP FIX GUIDE MODAL                                  */}
      {/* ========================================================================= */}
      {showFixGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="fix-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
        >
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-[#0E1520] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222E40] pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 id="fix-guide-title" className="font-display text-base sm:text-lg font-bold text-white">
                    DTC P0300 Complete Fix Guide
                  </h4>
                  <p className="text-xs font-mono-tech text-cyan-300">
                    BMW B48/B58 • Ignition Coil &amp; Spark Plug DIY
                  </p>
                </div>
              </div>
              <button
                role="button"
                aria-label="Close fix guide modal"
                onClick={() => setShowFixGuideModal(false)}
                className="rounded-full bg-[#1A2330] p-2 text-zinc-300 hover:text-white min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-zinc-200 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-[#141E2C] border border-[#243346] space-y-1">
                <strong className="text-white block font-bold text-sm">
                  Step 1: Disconnect Battery Negative Terminal
                </strong>
                <p className="text-zinc-300">
                  Loosen the 10mm negative battery terminal clamp in the trunk to prevent electrical arcing while working with the engine coil pack wiring loom.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141E2C] border border-[#243346] space-y-1">
                <strong className="text-white block font-bold text-sm">
                  Step 2: Remove Engine Acoustic Beauty Cover
                </strong>
                <p className="text-zinc-300">
                  Carefully pull straight up on the 4 corners of the engine decorative engine cover to disengage the rubber mounting grommets from the valve cover ball pins.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141E2C] border border-[#243346] space-y-1">
                <strong className="text-white block font-bold text-sm">
                  Step 3: Unclip Cylinder 3 Electrical Harness &amp; Swap Coil
                </strong>
                <p className="text-zinc-300">
                  Press the white locking tab on the Cylinder 3 coil connector. Slide the coil straight out of the spark plug well. Insert new OEM Delphi coil ($48) firmly until the boot snaps onto the plug terminal.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141E2C] border border-[#243346] space-y-1">
                <strong className="text-white block font-bold text-sm">
                  Step 4: Clear DTC &amp; Verify Readiness Monitors
                </strong>
                <p className="text-zinc-300">
                  Reconnect the battery, open Car AI Diagnostic Scanner, and execute &ldquo;Clear DTC Codes&rdquo;. Take a 10-minute test drive to confirm the Check Engine Light stays off.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#222E40] flex flex-col sm:flex-row gap-2.5">
              <button
                role="button"
                aria-label="Done and return to diagnostics"
                onClick={() => setShowFixGuideModal(false)}
                className="flex-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 py-3 text-sm font-bold text-white transition-all shadow-md min-h-[48px]"
              >
                Close &amp; Return to Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
