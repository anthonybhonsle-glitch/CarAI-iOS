import React, { useState, useEffect } from 'react';
import {
  Tv,
  Gauge,
  Thermometer,
  Disc,
  Palette,
  Wind,
  ShieldAlert,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Lock,
  Crown,
  Sparkles,
  QrCode,
  Smartphone,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Car,
  ChevronRight,
  Info,
  Layers,
  Fuel,
  Sun,
  Moon,
  Compass,
  Timer,
  BatteryCharging,
  Mic,
  Camera,
  Leaf,
  DollarSign,
  Wrench,
} from 'lucide-react';
import { OBDTelemetry, UserSubscriptionState, PaywallContext } from '../types';
import { obdManager } from '../services/obdSimulator';
import { haptics } from '../services/haptics';
import { ConnectBar } from './ConnectBar';
import { WindshieldHUDModal } from './cockpit/WindshieldHUDModal';
import { VoiceMechanicPanel } from './cockpit/VoiceMechanicPanel';
import { PerformanceTimerPanel } from './cockpit/PerformanceTimerPanel';
import { TelemetryDashcamPanel } from './cockpit/TelemetryDashcamPanel';
import { BatteryHealthPanel } from './cockpit/BatteryHealthPanel';
import { TripFuelCoachPanel } from './cockpit/TripFuelCoachPanel';
import { PredictiveMaintenancePanel } from './cockpit/PredictiveMaintenancePanel';
import { PrePurchaseInspectionPanel } from './cockpit/PrePurchaseInspectionPanel';
import { MultiVehicleGaragePanel } from './cockpit/MultiVehicleGaragePanel';
import { ClusterThemeSelector, ClusterSkinId } from './cockpit/ClusterThemeSelector';
import { useI18n } from '../i18n/I18nProvider';

interface CarCockpitScreenProps {
  telemetry: OBDTelemetry;
  user: UserSubscriptionState;
  useMetric: boolean;
  setUseMetric: (metric: boolean) => void;
  onOpenPaywall: (context?: PaywallContext) => void;
}

type CockpitSubTab =
  | 'overview'
  | 'voice_mechanic'
  | 'performance'
  | 'dashcam'
  | 'battery'
  | 'fuel_coach'
  | 'maintenance'
  | 'inspection'
  | 'garage_fleet'
  | 'thermal'
  | 'urea_emissions'
  | 'tpms'
  | 'ambient'
  | 'air_purity';

const AMBIENT_PRESETS = [
  { name: 'Cyber Cyan', hex: '#00F0FF', desc: 'Electric Cyan Tron Glow' },
  { name: 'Nürburgring Red', hex: '#EF4444', desc: 'Sport / Track Aggressive' },
  { name: 'Apex Amber', hex: '#F59E0B', desc: 'Classic GT Endurance Amber' },
  { name: 'Midnight Violet', hex: '#8B5CF6', desc: 'Luxury Deep Amethyst' },
  { name: 'Eco Emerald', hex: '#10B981', desc: 'Efficiency & Clean Energy' },
  { name: 'Solar Gold', hex: '#EAB308', desc: 'Warm Radiant Sunburst' },
  { name: 'Hyper Magenta', hex: '#EC4899', desc: 'Neon Velocity Accent' },
  { name: 'Pure White', hex: '#F8FAFC', desc: '6000K Crisp Illumination' },
];

export const CarCockpitScreen: React.FC<CarCockpitScreenProps> = ({
  telemetry,
  user,
  useMetric,
  setUseMetric,
  onOpenPaywall,
}) => {
  const { t, lang } = useI18n();
  const [activeSubTab, setActiveSubTab] = useState<CockpitSubTab>('overview');
  const [selectedClusterSkin, setSelectedClusterSkin] = useState<ClusterSkinId>('cyberpunk_2077');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hudMirrorMode, setHudMirrorMode] = useState<boolean>(false);
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState<boolean>(true);
  const [nightMode, setNightMode] = useState<boolean>(true);
  const [lastSpokenWarning, setLastSpokenWarning] = useState<string>('');
  const [showPhoneQrModal, setShowPhoneQrModal] = useState<boolean>(false);

  // Selected Ambient Color
  const currentAmbient = telemetry.ambientLighting || {
    enabled: true,
    colorHex: '#00F0FF',
    colorName: 'Cyber Cyan',
    brightnessPercent: 85,
    mode: 'dynamic_rpm',
  };

  // Fullscreen toggle for in-car tablets / Android Auto head units
  const toggleFullscreen = () => {
    haptics.lightTap();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Driver Voice Alerts for In-Car Screen
  useEffect(() => {
    if (!voiceAlertsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    let warningText = '';
    if (telemetry.coolantTempC >= 108 && lastSpokenWarning !== 'overheat') {
      warningText = t('alert.coolant_critical');
      setLastSpokenWarning('overheat');
    } else if (telemetry.ureaLevelPercent !== undefined && telemetry.ureaLevelPercent <= 12 && lastSpokenWarning !== 'urea') {
      warningText = t('alert.def_low');
      setLastSpokenWarning('urea');
    } else if (telemetry.tpms && (telemetry.tpms.fl < 28 || telemetry.tpms.fr < 28 || telemetry.tpms.rl < 28 || telemetry.tpms.rr < 28) && lastSpokenWarning !== 'tpms') {
      warningText = 'Caution: Low tire pressure detected on vehicle chassis.';
      setLastSpokenWarning('tpms');
    }

    if (warningText) {
      try {
        const utterance = new SpeechSynthesisUtterance(warningText);
        utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'es' ? 'es-ES' : lang === 'ta' ? 'ta-IN' : lang === 'te' ? 'te-IN' : lang === 'mr' ? 'mr-IN' : lang === 'bn' ? 'bn-IN' : 'en-US';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // Speech synthesis fallback
      }
    }
  }, [telemetry.coolantTempC, telemetry.ureaLevelPercent, telemetry.tpms, voiceAlertsEnabled, lastSpokenWarning, useMetric, lang, t]);

  const handleAmbientColorChange = (hex: string, name: string) => {
    haptics.lightTap();
    if (!user.isPro && !user.activeTrial) {
      onOpenPaywall({
        trigger: 'ambient_lighting',
        featureTitle: 'In-Car Ambient Lighting CAN-Bus Sync',
        description: 'Sync your car cabin RGB ambient LEDs with engine RPM, shift points, and thermal warnings.',
      });
      return;
    }
    obdManager.setAmbientLighting({ colorHex: hex, colorName: name });
  };

  const handleAmbientModeChange = (mode: 'static' | 'dynamic_rpm' | 'thermal_sync' | 'music_pulse') => {
    haptics.lightTap();
    if (!user.isPro && !user.activeTrial) {
      onOpenPaywall({
        trigger: 'ambient_lighting',
        featureTitle: 'Dynamic Ambient Lighting Modes',
        description: 'Dynamic RPM shift illumination and thermal sync require CarAI Pro.',
      });
      return;
    }
    obdManager.setAmbientLighting({ mode });
  };

  const isProActive = user.isPro || user.activeTrial;

  // Formatting helpers
  const speed = useMetric ? telemetry.speedKmh : telemetry.speedMph;
  const speedUnit = useMetric ? 'KM/H' : 'MPH';
  const coolantTemp = useMetric ? `${telemetry.coolantTempC}°C` : `${telemetry.coolantTempF}°F`;
  const oilTemp = useMetric ? `${telemetry.oilTempC}°C` : `${telemetry.oilTempF || Math.round((telemetry.oilTempC * 9) / 5 + 32)}°F`;
  const transTemp = useMetric ? `${telemetry.transTempC || 82}°C` : `${telemetry.transTempF || 180}°F`;

  return (
    <div
      className={`min-h-screen transition-colors duration-500 pb-20 ${
        nightMode ? 'bg-[#080B11] text-zinc-100' : 'bg-zinc-900 text-white'
      }`}
      style={{
        boxShadow: currentAmbient.enabled
          ? `inset 0 0 100px ${currentAmbient.colorHex}15`
          : undefined,
      }}
    >
      {/* Dynamic Ambient Edge Glow Strip along top of in-car screen */}
      {currentAmbient.enabled && (
        <div
          className="h-1.5 w-full transition-all duration-300"
          style={{
            backgroundColor: currentAmbient.colorHex,
            boxShadow: `0 0 18px ${currentAmbient.colorHex}`,
          }}
        />
      )}

      {/* In-Car Cockpit Header Bar */}
      <header className="px-4 py-3 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Vehicle & Head Unit Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  Car Screen Cockpit
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    AAOS & Auto
                  </span>
                </h1>
                {isProActive ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    <Crown className="w-3 h-3" /> Pro Cockpit
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      onOpenPaywall({
                        trigger: 'car_screen_cockpit',
                        featureTitle: 'In-Car Display Pro License',
                        description: 'Unlock live CAN-bus diagnostics, DEF levels, TPMS, and ambient LED sync.',
                      })
                    }
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/40 transition"
                  >
                    <Lock className="w-3 h-3" /> 3-Day Free Trial
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-zinc-300">
                  {telemetry.carHeadUnitProtocol || 'Android Automotive OS'}
                </span>
                <span>•</span>
                <span>ECU: 500 kbaud CAN</span>
              </div>
            </div>
          </div>

          {/* Quick Cockpit Action Controls */}
          <div className="flex items-center gap-2">
            {/* Phone QR Code Link Button (For In-Car Subscription Activation) */}
            <button
              onClick={() => {
                haptics.lightTap();
                setShowPhoneQrModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition"
              title="Pair with phone or pay on mobile"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Phone Link</span>
            </button>

            {/* Voice Alerts Toggle */}
            <button
              onClick={() => {
                haptics.lightTap();
                setVoiceAlertsEnabled(!voiceAlertsEnabled);
              }}
              className={`p-2 rounded-lg border text-xs transition flex items-center gap-1 ${
                voiceAlertsEnabled
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
              }`}
              title={voiceAlertsEnabled ? 'Voice HUD Warnings Active' : 'Voice Warnings Muted'}
            >
              {voiceAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Night / High Contrast Day Mode Toggle */}
            <button
              onClick={() => {
                haptics.lightTap();
                setNightMode(!nightMode);
              }}
              className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition"
              title="Toggle Cockpit Contrast"
            >
              {nightMode ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Windshield HUD Reflection Mode */}
            <button
              onClick={() => {
                haptics.lightTap();
                setHudMirrorMode(!hudMirrorMode);
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${
                hudMirrorMode
                  ? 'bg-cyan-500 text-zinc-950 border-cyan-400 shadow-[0_0_15px_rgba(0,209,255,0.6)]'
                  : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-cyan-300'
              }`}
              title="Windshield HUD Mode (mirrors display to reflect on windshield glass at night)"
            >
              <Compass className={`w-3.5 h-3.5 ${hudMirrorMode ? 'animate-spin' : ''}`} />
              <span>{hudMirrorMode ? 'HUD Mirrored' : 'HUD Glass'}</span>
            </button>

            {/* Metric / Imperial Units */}
            <button
              onClick={() => {
                haptics.lightTap();
                setUseMetric(!useMetric);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 hover:text-white transition"
            >
              {useMetric ? '°C / KM' : '°F / MI'}
            </button>

            {/* Fullscreen Mode (Essential for Car Head Units & Android Auto) */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30 transition flex items-center gap-1"
              title="Full-Screen Car Cockpit"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Cockpit Sub-Tab Navigation Bar */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'overview' as CockpitSubTab, label: 'Gauges & Skins', icon: Gauge },
            { id: 'voice_mechanic' as CockpitSubTab, label: 'Voice AI Mechanic', icon: Mic },
            { id: 'performance' as CockpitSubTab, label: t('tab.perf'), icon: Timer },
            { id: 'dashcam' as CockpitSubTab, label: 'Dashcam & Black Box', icon: Camera },
            { id: 'battery' as CockpitSubTab, label: '12V Battery Health', icon: BatteryCharging },
            { id: 'fuel_coach' as CockpitSubTab, label: 'Fuel & Hypermiling', icon: Leaf },
            { id: 'maintenance' as CockpitSubTab, label: 'Predictive Fluid Life', icon: Wrench },
            { id: 'inspection' as CockpitSubTab, label: t('tab.inspect'), icon: ShieldAlert },
            { id: 'garage_fleet' as CockpitSubTab, label: 'Fleet / Garage', icon: Car },
            { id: 'thermal' as CockpitSubTab, label: t('tab.thermal'), icon: Thermometer },
            { id: 'urea_emissions' as CockpitSubTab, label: t('tab.def'), icon: Fuel },
            { id: 'tpms' as CockpitSubTab, label: t('tab.tpms'), icon: Disc },
            { id: 'ambient' as CockpitSubTab, label: t('tab.ambient'), icon: Palette },
            { id: 'air_purity' as CockpitSubTab, label: 'Cabin Air Purity', icon: Wind },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptics.lightTap();
                  setActiveSubTab(tab.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-zinc-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-cyan-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Real-time ConnectBar for live ELM327 BLE Adapter pairing or Demo Car */}
      <div className="max-w-7xl mx-auto px-4 pt-3">
        <ConnectBar />
      </div>

      {/* In-Car Paywall Notification Banner (Shown when not subscribed) */}
      {!isProActive && (
        <div className="max-w-7xl mx-auto px-4 mt-3">
          <div className="bg-gradient-to-r from-cyan-950/60 via-zinc-900 to-amber-950/40 border border-cyan-500/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  Car Screen Pro Subscription Required
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    3-Day Free Trial
                  </span>
                </p>
                <p className="text-xs text-zinc-400">
                  Full in-car CAN-bus diagnostics, live DEF levels, TPMS wheel radar, and dynamic RGB ambient lighting require active Pro access.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPhoneQrModal(true)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-zinc-700 flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>Scan with Phone</span>
              </button>
              <button
                onClick={() =>
                  onOpenPaywall({
                    trigger: 'car_screen_cockpit',
                    featureTitle: 'In-Car Display Pro Subscription',
                    description: 'Start 3-Day Free Trial on this car screen or upgrade to unlock all CAN-bus features.',
                  })
                }
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-bold text-xs shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unlock Car Display</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Cockpit Content Area */}
      <main className="max-w-7xl mx-auto px-4 mt-4">
        {/* ========================================================================= */}
        {/* 1. OVERVIEW COCKPIT TAB                                                   */}
        {/* ========================================================================= */}
        {activeSubTab === 'overview' && (
          <div className="space-y-4">
            {/* Aesthetic In-Car Cluster Theme Selector */}
            <ClusterThemeSelector
              telemetry={telemetry}
              user={user}
              useMetric={useMetric}
              selectedSkin={selectedClusterSkin}
              onSelectSkin={setSelectedClusterSkin}
              onOpenPaywall={onOpenPaywall}
              onOpenPhoneQrModal={() => setShowPhoneQrModal(true)}
            />

            {/* Primary Speed & RPM HUD Centerstage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left Dial: RPM & Shift Radar */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono tracking-wider">TACHOMETER</span>
                  <span className="text-cyan-400 font-bold font-mono">REDLINE: 6,800</span>
                </div>
                <div className="my-6 text-center">
                  <div className="text-6xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                    {telemetry.rpm.toLocaleString()}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-zinc-400 mt-1">ENGINE RPM</div>
                </div>
                {/* Dynamic Shift Light Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>1K</span>
                    <span>3K</span>
                    <span>5K</span>
                    <span className="text-red-400">7K</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-150 ${
                        telemetry.rpm > 5500
                          ? 'bg-red-500 shadow-[0_0_12px_#EF4444]'
                          : telemetry.rpm > 3800
                          ? 'bg-amber-400 shadow-[0_0_12px_#F59E0B]'
                          : 'bg-cyan-400 shadow-[0_0_12px_#06B6D4]'
                      }`}
                      style={{ width: `${Math.min(100, (telemetry.rpm / 7000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Center: Main Velocity Speedometer */}
              <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-cyan-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-radial-gradient from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
                  REAL-TIME GPS / CAN SPEED
                </div>
                <div className="text-8xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_35px_rgba(6,182,212,0.6)]">
                  {speed}
                </div>
                <div className="text-base font-bold text-zinc-400 tracking-widest mt-1">
                  {speedUnit}
                </div>

                <div className="mt-6 flex items-center gap-4 text-xs font-mono">
                  <div className="bg-zinc-800/80 px-3 py-1 rounded-lg border border-zinc-700/60">
                    <span className="text-zinc-400">GEAR: </span>
                    <span className="text-cyan-300 font-bold">D4</span>
                  </div>
                  <div className="bg-zinc-800/80 px-3 py-1 rounded-lg border border-zinc-700/60">
                    <span className="text-zinc-400">THROTTLE: </span>
                    <span className="text-emerald-400 font-bold">{telemetry.throttlePosPercent}%</span>
                  </div>
                  <div className="bg-zinc-800/80 px-3 py-1 rounded-lg border border-zinc-700/60">
                    <span className="text-zinc-400">BOOST: </span>
                    <span className="text-amber-400 font-bold">{telemetry.boostPressurePsi} PSI</span>
                  </div>
                </div>
              </div>

              {/* Right Dial: Vital Diagnostics & Thermal Quickview */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono tracking-wider">ENGINE THERMAL & VOLTS</span>
                  <span className="text-emerald-400 font-bold">NORMAL</span>
                </div>

                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 text-center">
                    <div className="text-[10px] text-zinc-400 uppercase">Coolant</div>
                    <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{coolantTemp}</div>
                    <div className="text-[9px] text-emerald-400 mt-0.5">Optimal 90°C</div>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 text-center">
                    <div className="text-[10px] text-zinc-400 uppercase">Engine Oil</div>
                    <div className="text-xl font-bold font-mono text-amber-300 mt-1">{oilTemp}</div>
                    <div className="text-[9px] text-emerald-400 mt-0.5">Flow Ready</div>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 text-center">
                    <div className="text-[10px] text-zinc-400 uppercase">12V Battery</div>
                    <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                      {telemetry.batteryVoltage} V
                    </div>
                    <div className="text-[9px] text-zinc-400 mt-0.5">Alternator OK</div>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 text-center">
                    <div className="text-[10px] text-zinc-400 uppercase">Urea / DEF</div>
                    <div className="text-xl font-bold font-mono text-blue-300 mt-1">
                      {telemetry.ureaLevelPercent ?? 78}%
                    </div>
                    <div className="text-[9px] text-zinc-400 mt-0.5">8,450 km left</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    haptics.lightTap();
                    setActiveSubTab('thermal');
                  }}
                  className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 flex items-center justify-center gap-1.5 transition"
                >
                  <span>Detailed Thermal Telemetry</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Cockpit Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase">Avg Tire Pressure</div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">34.4 PSI</div>
                  <div className="text-[10px] text-emerald-400">4 Wheels Balanced</div>
                </div>
                <Disc className="w-6 h-6 text-cyan-400" />
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase">Cabin Air Purity</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">AQI 12</div>
                  <div className="text-[10px] text-zinc-400">Clean / HEPA Active</div>
                </div>
                <Wind className="w-6 h-6 text-emerald-400" />
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase">Ambient Cabin RGB</div>
                  <div className="text-lg font-bold font-mono text-white mt-0.5 flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentAmbient.colorHex }}
                    />
                    <span>{currentAmbient.colorName}</span>
                  </div>
                  <div className="text-[10px] text-cyan-400">Dynamic RPM Sync</div>
                </div>
                <Palette className="w-6 h-6 text-cyan-400" />
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase">Active DTC Faults</div>
                  <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                    {telemetry.dtcCount} Codes
                  </div>
                  <div className="text-[10px] text-zinc-400">P0101, P0300</div>
                </div>
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. THERMAL HEALTH & ENGINE HEATING TAB                                    */}
        {/* ========================================================================= */}
        {activeSubTab === 'thermal' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-cyan-400" />
                    Engine Thermal Management & Cooling Telemetry
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Continuous CAN-bus monitoring of engine cooling, oil breakdown protection, and transmission heat dissipation.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    Thermal State: OPTIMAL
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Engine Coolant Temperature (ECT) */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Engine Coolant (ECT)</span>
                    <span className="font-mono text-cyan-400">PID 0105</span>
                  </div>
                  <div className="text-3xl font-black font-mono text-white mt-2">
                    {coolantTemp}
                  </div>
                  <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-cyan-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (telemetry.coolantTempC / 120) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>60°C (Cold)</span>
                    <span className="text-emerald-400">90°C</span>
                    <span className="text-red-400">110°C (Hot)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Thermostat open. Radiator cooling loop operating within factory tolerances.
                  </p>
                </div>

                {/* 2. Engine Oil Temperature (EOT) */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Engine Oil Temp (EOT)</span>
                    <span className="font-mono text-amber-400">PID 015C</span>
                  </div>
                  <div className="text-3xl font-black font-mono text-white mt-2">
                    {oilTemp}
                  </div>
                  <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (telemetry.oilTempC / 130) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>70°C (Viscous)</span>
                    <span className="text-emerald-400">95°C</span>
                    <span className="text-red-400">125°C (Degrade)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Oil viscosity at peak lubrication efficiency. Safe for high-RPM operation.
                  </p>
                </div>

                {/* 3. Transmission Fluid Temp (TFT) */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Transmission Fluid</span>
                    <span className="font-mono text-purple-400">TFT CAN</span>
                  </div>
                  <div className="text-3xl font-black font-mono text-white mt-2">
                    {transTemp}
                  </div>
                  <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, ((telemetry.transTempC || 82) / 120) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>50°C</span>
                    <span className="text-emerald-400">85°C</span>
                    <span className="text-red-400">115°C</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Gearbox torque converter lockup active. No clutch slip detected.
                  </p>
                </div>

                {/* 4. Cylinder Head Temp (CHT) */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Cylinder Head (CHT)</span>
                    <span className="font-mono text-emerald-400">CHT Sensor</span>
                  </div>
                  <div className="text-3xl font-black font-mono text-white mt-2">
                    {useMetric ? `${telemetry.cylinderHeadTempC || 96}°C` : `${Math.round(((telemetry.cylinderHeadTempC || 96) * 9) / 5 + 32)}°F`}
                  </div>
                  <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, ((telemetry.cylinderHeadTempC || 96) / 130) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>80°C</span>
                    <span className="text-emerald-400">98°C</span>
                    <span className="text-red-400">125°C</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2">
                    Combustion chamber wall temperature stable across all cylinders.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. UREA / DEF & EMISSIONS TAB                                             */}
        {/* ========================================================================= */}
        {activeSubTab === 'urea_emissions' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-blue-400" />
                    Urea / DEF (Diesel Exhaust Fluid) & Emissions Diagnostics
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Critical AdBlue reductant levels (PID 0185), DPF soot loading, and anti-start-lock countdown.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                    ISO 22241 Certified Quality
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* DEF / Urea Tank Level */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>AdBlue / DEF Tank Level</span>
                      <span className="font-mono text-cyan-400">PID 0185</span>
                    </div>
                    <div className="text-5xl font-black font-mono text-blue-400 mt-3">
                      {telemetry.ureaLevelPercent ?? 78}%
                    </div>
                    <div className="text-sm font-semibold text-zinc-300 mt-1">
                      {telemetry.ureaRangeKm ?? 8450} km Range Remaining
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all"
                        style={{ width: `${telemetry.ureaLevelPercent ?? 78}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span className="text-red-400">0% (ECU Lock)</span>
                      <span>50%</span>
                      <span className="text-emerald-400">100% Full</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mt-4 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                    💡 <strong>Pro Tip:</strong> Refill DEF before it drops below 15% to prevent the engine from triggering a no-start countdown.
                  </p>
                </div>

                {/* DPF Soot Loading & Regeneration */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>DPF Soot Accumulation</span>
                      <span className="font-mono text-amber-400">DPF CAN</span>
                    </div>
                    <div className="text-5xl font-black font-mono text-amber-400 mt-3">
                      {telemetry.dpfSootPercent ?? 32}%
                    </div>
                    <div className="text-sm font-semibold text-zinc-300 mt-1">
                      Passive Regeneration Active
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                      <div
                        className="bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 h-full rounded-full transition-all"
                        style={{ width: `${telemetry.dpfSootPercent ?? 32}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span className="text-emerald-400">Clean</span>
                      <span>50%</span>
                      <span className="text-red-400">Regen Required</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mt-4 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                    Exhaust gas temperatures (EGT) exceed 380°C on current drive, passively burning particulate soot.
                  </p>
                </div>

                {/* Catalyst & SCR Efficiency */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-zinc-400 uppercase">SCR Catalyst Efficiency</div>
                    <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
                      98.4% NOx Reduction
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      Upstream NOx: 420 ppm • Downstream: 6.7 ppm
                    </div>
                  </div>

                  <div className="my-4 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-zinc-800/80">
                      <span className="text-zinc-400">Urea Concentration:</span>
                      <span className="font-mono text-white">32.5% (Aqueous)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800/80">
                      <span className="text-zinc-400">DEF Dosing Pump:</span>
                      <span className="font-mono text-emerald-400">4.8 bar (Normal)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-400">DEF Tank Temp:</span>
                      <span className="font-mono text-white">18°C (Heater Off)</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Emissions system 100% compliant with Euro 6 / EPA tier</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. TIRE PRESSURE MONITORING (TPMS) TAB                                    */}
        {/* ========================================================================= */}
        {activeSubTab === 'tpms' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Disc className="w-5 h-5 text-cyan-400" />
                    4-Wheel Tire Pressure (TPMS) & Cavity Temperature Radar
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Real-time RF wheel sensor telemetry via CAN-bus to prevent blowouts and uneven tread wear.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    All 4 Tires Nominal
                  </span>
                </div>
              </div>

              {/* Honest Per-Car Data State check (FX05) */}
              {telemetry.isRealCarLive && (!telemetry.tpms || telemetry.tpms.fl === 0) ? (
                <div className="bg-[#12293B] border border-[#20384E] rounded-2xl p-6 text-center space-y-3 my-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <Disc className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Not available on this car yet</h3>
                  <p className="text-xs text-[#9FB6C8] max-w-md mx-auto">
                    Standard OBD-II does not broadcast RF tire pressure sensors on this vehicle's CAN bus. Requires an OEM-specific profile or add-on BLE tire valve sensors.
                  </p>
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => alert('Checking vehicle CAN bus compatibility... OEM TPMS PID pack available for select models.')}
                      className="px-4 py-2 rounded-lg bg-[#00D1FF] hover:bg-[#00b8e6] text-[#06151F] font-bold text-xs shadow-sm"
                    >
                      Check Compatibility
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Add-on 4-wheel BLE tire pressure caps can be paired in Settings.')}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#EAF6FF] font-semibold text-xs border border-white/10"
                    >
                      Add a Sensor
                    </button>
                  </div>
                </div>
              ) : (
                /* 4-Wheel Chassis Diagram */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Left: Front Wheels */}
                <div className="space-y-4">
                  {/* Front Left */}
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-zinc-400 uppercase">FRONT LEFT (FL)</div>
                      <div className="text-3xl font-black font-mono text-white mt-1">
                        {telemetry.tpms?.fl ?? 34.2} <span className="text-base text-zinc-400">PSI</span>
                      </div>
                      <div className="text-xs text-emerald-400 mt-0.5">Target: 34.0 PSI</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-400 uppercase">Cavity Temp</div>
                      <div className="text-lg font-bold font-mono text-amber-300">
                        {useMetric ? `${telemetry.tpms?.flTempC ?? 38}°C` : `${Math.round(((telemetry.tpms?.flTempC ?? 38) * 9) / 5 + 32)}°F`}
                      </div>
                      <div className="text-[10px] text-zinc-500">Sensor Batt: 98%</div>
                    </div>
                  </div>

                  {/* Rear Left */}
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-zinc-400 uppercase">REAR LEFT (RL)</div>
                      <div className="text-3xl font-black font-mono text-white mt-1">
                        {telemetry.tpms?.rl ?? 35.1} <span className="text-base text-zinc-400">PSI</span>
                      </div>
                      <div className="text-xs text-emerald-400 mt-0.5">Target: 35.0 PSI</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-400 uppercase">Cavity Temp</div>
                      <div className="text-lg font-bold font-mono text-amber-300">
                        {useMetric ? `${telemetry.tpms?.rlTempC ?? 40}°C` : `${Math.round(((telemetry.tpms?.rlTempC ?? 40) * 9) / 5 + 32)}°F`}
                      </div>
                      <div className="text-[10px] text-zinc-500">Sensor Batt: 97%</div>
                    </div>
                  </div>
                </div>

                {/* Right: Front & Rear Right */}
                <div className="space-y-4">
                  {/* Front Right */}
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-zinc-400 uppercase">FRONT RIGHT (FR)</div>
                      <div className="text-3xl font-black font-mono text-white mt-1">
                        {telemetry.tpms?.fr ?? 34.4} <span className="text-base text-zinc-400">PSI</span>
                      </div>
                      <div className="text-xs text-emerald-400 mt-0.5">Target: 34.0 PSI</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-400 uppercase">Cavity Temp</div>
                      <div className="text-lg font-bold font-mono text-amber-300">
                        {useMetric ? `${telemetry.tpms?.frTempC ?? 39}°C` : `${Math.round(((telemetry.tpms?.frTempC ?? 39) * 9) / 5 + 32)}°F`}
                      </div>
                      <div className="text-[10px] text-zinc-500">Sensor Batt: 96%</div>
                    </div>
                  </div>

                  {/* Rear Right */}
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-zinc-400 uppercase">REAR RIGHT (RR)</div>
                      <div className="text-3xl font-black font-mono text-white mt-1">
                        {telemetry.tpms?.rr ?? 35.0} <span className="text-base text-zinc-400">PSI</span>
                      </div>
                      <div className="text-xs text-emerald-400 mt-0.5">Target: 35.0 PSI</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-400 uppercase">Cavity Temp</div>
                      <div className="text-lg font-bold font-mono text-amber-300">
                        {useMetric ? `${telemetry.tpms?.rrTempC ?? 41}°C` : `${Math.round(((telemetry.tpms?.rrTempC ?? 41) * 9) / 5 + 32)}°F`}
                      </div>
                      <div className="text-[10px] text-zinc-500">Sensor Batt: 98%</div>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. IN-CAR AMBIENT LIGHTING CONTROLLER TAB                                 */}
        {/* ========================================================================= */}
        {activeSubTab === 'ambient' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-cyan-400" />
                    In-Car Ambient RGB Lighting Controller & Sync
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Connects directly to your car’s LIN/CAN ambient lighting module or aftermarket Bluetooth LED controllers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full animate-ping"
                    style={{ backgroundColor: currentAmbient.colorHex }}
                  />
                  <span className="text-xs font-mono font-bold text-white">
                    {currentAmbient.colorName} ({currentAmbient.colorHex})
                  </span>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { id: 'dynamic_rpm' as const, label: 'Dynamic RPM Shift', desc: 'Pulses red as redline approaches' },
                  { id: 'thermal_sync' as const, label: 'Thermal Sync', desc: 'Alerts with warm glow if coolant rises' },
                  { id: 'music_pulse' as const, label: 'Cabin Sound Sync', desc: 'Syncs to car infotainment audio' },
                  { id: 'static' as const, label: 'Static Elegance', desc: 'Fixed uniform ambient cabin hue' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleAmbientModeChange(m.id)}
                    className={`p-3.5 rounded-xl text-left border transition ${
                      currentAmbient.mode === m.id
                        ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{m.label}</span>
                      {currentAmbient.mode === m.id && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1">{m.desc}</div>
                  </button>
                ))}
              </div>

              {/* Color Presets Palette */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Select Cabin Ambient Color Palette
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AMBIENT_PRESETS.map((preset) => {
                    const isSelected = currentAmbient.colorHex.toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.hex}
                        onClick={() => handleAmbientColorChange(preset.hex, preset.name)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                          isSelected
                            ? 'bg-zinc-950 border-white shadow-md'
                            : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <span
                          className="w-8 h-8 rounded-lg shrink-0 shadow-inner border border-white/20"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <div>
                          <div className="text-xs font-bold text-white">{preset.name}</div>
                          <div className="text-[10px] text-zinc-400">{preset.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. CABIN AIR PURITY & HEPA TAB                                            */}
        {/* ========================================================================= */}
        {activeSubTab === 'air_purity' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Wind className="w-5 h-5 text-emerald-400" />
                    Cabin Air Purity, PM2.5 & HEPA Filtration Telemetry
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Real-time laser particulate sensor comparing in-cabin air quality against outside highway smog.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  Air Quality: EXCELLENT
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* In-Cabin Air Quality */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800">
                  <div className="text-xs text-zinc-400 uppercase">Inside Cabin PM2.5</div>
                  <div className="text-5xl font-black font-mono text-emerald-400 mt-3">
                    {telemetry.cabinAirQualityAqi ?? 12} <span className="text-lg">AQI</span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-2">Pure clean breathing air. Zero smog detected.</p>
                  <div className="mt-4 w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[12%]" />
                  </div>
                </div>

                {/* Outside Air Quality Comparison */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800">
                  <div className="text-xs text-zinc-400 uppercase">Outside Highway Air</div>
                  <div className="text-5xl font-black font-mono text-amber-400 mt-3">
                    {telemetry.exteriorAirQualityAqi ?? 58} <span className="text-lg">AQI</span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-2">Moderate exhaust fumes & pollen on roadway.</p>
                  <div className="mt-4 w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-[45%]" />
                  </div>
                </div>

                {/* Cabin Air Filter Health */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800">
                  <div className="text-xs text-zinc-400 uppercase">HEPA Cabin Filter Lifespan</div>
                  <div className="text-5xl font-black font-mono text-cyan-400 mt-3">
                    {telemetry.cabinFilterHealthPercent ?? 88}%
                  </div>
                  <p className="text-xs text-zinc-300 mt-2">Activated carbon filter in excellent condition.</p>
                  <div className="mt-4 text-xs text-zinc-400">
                    Est. replacement due: <strong>14,200 km</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. HANDS-FREE VOICE AI MECHANIC TAB ("HEY CARAI")                         */}
        {/* ========================================================================= */}
        {activeSubTab === 'voice_mechanic' && (
          <VoiceMechanicPanel
            telemetry={telemetry}
            user={user}
            useMetric={useMetric}
            onOpenPaywall={onOpenPaywall}
            onOpenPhoneQrModal={() => setShowPhoneQrModal(true)}
          />
        )}

        {/* ========================================================================= */}
        {/* 3. PERFORMANCE & 0-60 DRAG STRIP TIMER TAB                                */}
        {/* ========================================================================= */}
        {activeSubTab === 'performance' && (
          <PerformanceTimerPanel
            telemetry={telemetry}
            user={user}
            useMetric={useMetric}
            onOpenPaywall={onOpenPaywall}
            onOpenPhoneQrModal={() => setShowPhoneQrModal(true)}
          />
        )}

        {/* ========================================================================= */}
        {/* 4. TELEMETRY DASHCAM & CRASH BLACK BOX TAB                                */}
        {/* ========================================================================= */}
        {activeSubTab === 'dashcam' && (
          <TelemetryDashcamPanel
            telemetry={telemetry}
            user={user}
            useMetric={useMetric}
            onOpenPaywall={onOpenPaywall}
            onOpenPhoneQrModal={() => setShowPhoneQrModal(true)}
          />
        )}

        {/* ========================================================================= */}
        {/* 5. 12V BATTERY & ALTERNATOR CRANKING HEALTH TAB                           */}
        {/* ========================================================================= */}
        {activeSubTab === 'battery' && (
          <BatteryHealthPanel
            telemetry={telemetry}
            user={user}
            onOpenPaywall={onOpenPaywall}
            onOpenPhoneQrModal={() => setShowPhoneQrModal(true)}
          />
        )}

        {/* ========================================================================= */}
        {/* 6. TRIP FUEL ECONOMY & HYPER-MILING COACH TAB                             */}
        {/* ========================================================================= */}
        {activeSubTab === 'fuel_coach' && (
          <TripFuelCoachPanel
            telemetry={telemetry}
            user={user}
            useMetric={useMetric}
            onOpenPaywall={onOpenPaywall}
            onOpenPhoneQrModal={() => setShowPhoneQrModal(true)}
          />
        )}

        {/* ========================================================================= */}
        {/* 7. PREDICTIVE MAINTENANCE & FLUID COUNTDOWNS TAB                          */}
        {/* ========================================================================= */}
        {activeSubTab === 'maintenance' && (
          <PredictiveMaintenancePanel
            telemetry={telemetry}
            user={user}
            onOpenPaywall={onOpenPaywall}
            onOpenPhoneQrModal={() => setShowPhoneQrModal(true)}
          />
        )}

        {/* ========================================================================= */}
        {/* 8. PRE-PURCHASE INSPECTION (USED CAR BUYER MODE) TAB                      */}
        {/* ========================================================================= */}
        {activeSubTab === 'inspection' && (
          <PrePurchaseInspectionPanel
            telemetry={telemetry}
            user={user}
            onOpenPaywall={onOpenPaywall}
            onOpenPhoneQrModal={() => setShowPhoneQrModal(true)}
          />
        )}

        {/* ========================================================================= */}
        {/* 9. MULTI-VEHICLE FLEET & FAMILY GARAGE TAB                                */}
        {/* ========================================================================= */}
        {activeSubTab === 'garage_fleet' && (
          <MultiVehicleGaragePanel
            telemetry={telemetry}
            user={user}
            onOpenPaywall={onOpenPaywall}
            onOpenPhoneQrModal={() => setShowPhoneQrModal(true)}
          />
        )}
      </main>

      {/* Windshield HUD Reflection Overlay (Inverted upside-down and horizontally mirrored) */}
      {hudMirrorMode && (
        <WindshieldHUDModal
          telemetry={telemetry}
          user={user}
          useMetric={useMetric}
          onClose={() => setHudMirrorMode(false)}
          onOpenPaywall={onOpenPaywall}
          onOpenPhoneQrModal={() => setShowPhoneQrModal(true)}
        />
      )}

      {/* ========================================================================= */}
      {/* PHONE LINK & PAIRING MODAL (FOR IN-CAR SUBSCRIPTION ACTIVATION)          */}
      {/* ========================================================================= */}
      {showPhoneQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Activate Car Display via Phone</h3>
              </div>
              <button
                onClick={() => setShowPhoneQrModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="my-6 text-center space-y-3">
              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
                {/* High Contrast QR Code Representation for Car Screen to Phone */}
                <div className="w-full h-full border-4 border-zinc-900 rounded-lg p-2 flex flex-col items-center justify-center gap-1.5">
                  <QrCode className="w-24 h-24 text-zinc-950" />
                  <span className="text-[10px] font-mono font-bold text-zinc-900 uppercase">
                    SCAN TO ACTIVATE PRO
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-300">
                Point your smartphone camera at this screen to open the <strong>CarAI Mobile Subscription Checkout</strong>.
              </p>
              <p className="text-[11px] text-zinc-400">
                Once approved on your phone, this in-car display will automatically unlock all CAN-bus features within seconds!
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowPhoneQrModal(false);
                  onOpenPaywall({
                    trigger: 'car_screen_cockpit',
                    featureTitle: 'In-Car Display Pro Subscription',
                    description: 'Start your 3-day free trial directly on this head unit screen.',
                  });
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-bold text-xs shadow-lg transition"
              >
                Or Pay Directly on This Car Screen
              </button>

              <button
                onClick={() => setShowPhoneQrModal(false)}
                className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
