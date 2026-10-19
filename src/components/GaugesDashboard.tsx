import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Flame,
  Gauge,
  RotateCcw,
  Sliders,
  Thermometer,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { OBDTelemetry, VehicleHealthData, UserSubscriptionState, PaywallContext } from '../types';
import { obdManager, DrivingProfile } from '../services/obdSimulator';
import { fetchVehicleHealthScore } from '../services/apiClient';
import { haptics } from '../services/haptics';
import { Crown, Lock, Timer, Download } from 'lucide-react';

interface GaugesDashboardProps {
  telemetry: OBDTelemetry;
  useMetric: boolean;
  onNavigateToDiagnostics: () => void;
  user: UserSubscriptionState;
  onOpenPaywall: (context?: PaywallContext) => void;
}

export const GaugesDashboard: React.FC<GaugesDashboardProps> = ({
  telemetry,
  useMetric,
  onNavigateToDiagnostics,
  user,
  onOpenPaywall,
}) => {
  const [activeProfile, setActiveProfile] = useState<DrivingProfile>('highway_pull');
  const [peakRpm, setPeakRpm] = useState<number>(0);
  const [peakBoost, setPeakBoost] = useState<number>(0);
  const [peakSpeed, setPeakSpeed] = useState<number>(0);
  const [healthData, setHealthData] = useState<VehicleHealthData | null>(null);
  const [history, setHistory] = useState<{ rpm: number; speed: number; boost: number; throttle: number }[]>([]);

  // Pro Performance Telemetry State
  const [sprintState, setSprintState] = useState<'idle' | 'armed' | 'running' | 'completed'>('idle');
  const [sprintTime, setSprintTime] = useState<number | null>(3.48);
  const [sprintStartTime, setSprintStartTime] = useState<number | null>(null);
  const [sixtyFootSplit, setSixtyFootSplit] = useState<number | null>(1.68);
  const [peakGForce, setPeakGForce] = useState<number>(1.12);
  const [is20HzLogging, setIs20HzLogging] = useState<boolean>(false);
  const [snapshotCaptured, setSnapshotCaptured] = useState<boolean>(false);

  const handleTrigger060Timer = () => {
    haptics.lightTap();
    if (!user.isPro) {
      onOpenPaywall({
        trigger: 'performance_timer',
        featureTitle: '0-60 Performance Sprint & Dyno Recorder',
        description: 'Track launch acceleration, 60ft splits, and dyno horsepower logs with Pro.',
      });
      return;
    }

    if (sprintState === 'idle' || sprintState === 'completed') {
      setSprintState('armed');
    } else {
      setSprintState('idle');
    }
  };

  const handleTrigger20HzLogging = () => {
    haptics.lightTap();
    if (!user.isPro) {
      onOpenPaywall({
        trigger: 'freeze_frame',
        featureTitle: '20Hz High-Frequency ECU PID Stream',
        description: 'Stream live 20Hz ECU telemetry with full CAN-bus logging.',
      });
      return;
    }
    setIs20HzLogging(!is20HzLogging);
  };

  const handleCaptureFreezeFrame = () => {
    haptics.mediumSuccess();
    if (!user.isPro) {
      onOpenPaywall({
        trigger: 'freeze_frame',
        featureTitle: 'Freeze-Frame ECU Snapshot & Diagnostic Vault',
        description: 'Capture instant freeze-frame sensor snapshots when faults occur.',
      });
      return;
    }
    setSnapshotCaptured(true);
    setTimeout(() => setSnapshotCaptured(false), 2500);
  };

  // Calculate live health score directly from backend computation
  useEffect(() => {
    const isCritical = telemetry.dtcCount > 0 && telemetry.milStatus;
    fetchVehicleHealthScore({
      dtcCount: telemetry.dtcCount,
      criticalCount: isCritical ? 1 : 0,
      coolantTempC: telemetry.coolantTempC,
      batteryVoltage: telemetry.batteryVoltage,
      readyCount: 8,
      totalCount: 8,
    })
      .then((data) => setHealthData(data))
      .catch((err) => console.error('Failed to compute health score:', err));
  }, [telemetry.dtcCount, telemetry.milStatus, telemetry.coolantTempC, telemetry.batteryVoltage]);

  // Update peak stats and telemetry history
  useEffect(() => {
    const currentSpeed = useMetric ? telemetry.speedKmh : telemetry.speedMph;
    setPeakRpm((prev) => Math.max(prev, telemetry.rpm));
    setPeakBoost((prev) => Math.max(prev, telemetry.boostPressurePsi));
    setPeakSpeed((prev) => Math.max(prev, currentSpeed));

    setHistory((prev) => {
      const next = [
        ...prev,
        {
          rpm: telemetry.rpm,
          speed: currentSpeed,
          boost: telemetry.boostPressurePsi,
          throttle: telemetry.throttlePosPercent,
        },
      ];
      if (next.length > 30) next.shift();
      return next;
    });
  }, [telemetry, useMetric]);

  const handleProfileChange = (profile: DrivingProfile) => {
    haptics.lightTap();
    setActiveProfile(profile);
    obdManager.setDrivingProfile(profile);
  };

  const handleResetPeaks = () => {
    haptics.lightTap();
    setPeakRpm(telemetry.rpm);
    setPeakBoost(telemetry.boostPressurePsi);
    setPeakSpeed(useMetric ? telemetry.speedKmh : telemetry.speedMph);
  };

  // Speed and unit calculations
  const displaySpeed = useMetric ? telemetry.speedKmh : telemetry.speedMph;
  const speedUnit = useMetric ? 'KM/H' : 'MPH';
  const displayTemp = useMetric ? telemetry.coolantTempC : telemetry.coolantTempF;
  const tempUnit = useMetric ? '°C' : '°F';

  // Gear approximation
  const gear =
    displaySpeed === 0
      ? 'P'
      : telemetry.rpm / (displaySpeed || 1) < 25
      ? '6'
      : telemetry.rpm / (displaySpeed || 1) < 35
      ? '5'
      : telemetry.rpm / (displaySpeed || 1) < 50
      ? '4'
      : telemetry.rpm / (displaySpeed || 1) < 70
      ? '3'
      : telemetry.rpm / (displaySpeed || 1) < 95
      ? '2'
      : '1';

  // Tachometer angle calculation: 0 RPM = -125deg, 8000 RPM = +125deg (250deg sweep)
  const rpmPercent = Math.min(100, (telemetry.rpm / 8000) * 100);
  const rpmAngle = -125 + (rpmPercent / 100) * 250;

  // Boost angle calculation: -15 PSI = -105deg, +25 PSI = +105deg (210deg sweep)
  const boostSpan = 40;
  const normalizedBoost = Math.max(-15, Math.min(25, telemetry.boostPressurePsi));
  const boostPercent = ((normalizedBoost + 15) / boostSpan) * 100;
  const boostAngle = -105 + (boostPercent / 100) * 210;

  return (
    <div id="gauges-dashboard-view" className="space-y-6">
      {/* 1. Vehicle Health Score & Quick Diagnostics Hook Card (Free Feature) */}
      <div
        id="vehicle-health-score-card"
        onClick={() => {
          haptics.lightTap();
          onNavigateToDiagnostics();
        }}
        className="group relative cursor-pointer overflow-hidden rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 shadow-xl transition-all hover:border-cyan-500/50 hover:bg-[#1A202A]"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Skeuomorphic Health Grade Badge */}
            <div
              className={`flex h-18 w-18 shrink-0 flex-col items-center justify-center rounded-2xl border font-display text-3xl font-bold shadow-inner ${
                healthData?.grade === 'A'
                  ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                  : healthData?.grade === 'B'
                  ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300'
                  : healthData?.grade === 'C'
                  ? 'border-amber-500/50 bg-amber-950/40 text-amber-300'
                  : 'border-red-500/50 bg-red-950/40 text-red-300'
              }`}
            >
              <span>{healthData?.grade || 'A'}</span>
              <span className="font-mono-tech text-xs font-bold text-zinc-300">
                {healthData?.score || 100}/100
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-display text-lg font-bold tracking-wide text-white sm:text-xl">
                  VEHICLE HEALTH STATUS
                </h3>
                {healthData?.trend === 'down' ? (
                  <span className="flex items-center gap-1.5 rounded-md bg-red-500/25 px-2.5 py-1 font-mono-tech text-xs font-bold text-red-300 border border-red-500/40">
                    <TrendingDown className="h-4 w-4" /> -12% Trend
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/25 px-2.5 py-1 font-mono-tech text-xs font-bold text-emerald-300 border border-emerald-500/40">
                    <TrendingUp className="h-4 w-4" /> Optimal Systems
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm sm:text-base text-zinc-200 leading-relaxed font-normal">
                {healthData?.summary || 'Powertrain and emissions systems running cleanly within factory tolerances.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <span className="text-sm font-bold text-zinc-300 group-hover:text-cyan-300 transition-colors">
              Open Full Diagnostics
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#222933] text-zinc-200 group-hover:bg-cyan-500 group-hover:text-black transition-all">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Check Engine MIL Warning Banner (If Triggered) */}
      {telemetry.milStatus && (
        <div
          id="mil-warning-alert"
          className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-500/50 bg-gradient-to-r from-red-950/90 via-[#181214] to-[#181214] p-5 sm:flex-row sm:items-center shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/25 text-red-400 border border-red-500/40">
              <AlertTriangle className="h-7 w-7 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-display font-bold text-white text-lg tracking-wide">
                  CHECK ENGINE WARNING (MIL ACTIVE)
                </span>
                <span className="rounded-md bg-red-500/30 border border-red-500/50 px-2.5 py-0.5 text-xs font-bold text-red-200 font-mono-tech">
                  {telemetry.dtcCount} Faults Logged
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-200 leading-normal">
                ECU registered open fault codes. Plain-English diagnostic breakdown and fair labor estimates available.
              </p>
            </div>
          </div>
          <button
            id="view-dtc-explainer-btn"
            onClick={onNavigateToDiagnostics}
            className="flex shrink-0 items-center gap-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-600/30 transition-all active:scale-95 min-h-[48px]"
          >
            <Activity className="h-5 w-5" />
            <span>Diagnose Fault Codes</span>
          </button>
        </div>
      )}

      {/* Simulator Control Profile Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2C3440] bg-[#14181F] p-4">
        <div className="flex items-center gap-2.5">
          <Sliders className="h-5 w-5 text-cyan-400" />
          <span className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
            Vehicle Profile / State:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'idle_warmup', label: 'Idle / Warmup' },
              { id: 'city_cruise', label: 'City Traffic' },
              { id: 'highway_pull', label: 'Highway Cruise' },
              { id: 'dyno_sweep', label: 'WOT Dyno Sweep' },
              { id: 'fault_condition', label: 'Fault Injection' },
              { id: 'engine_overheat', label: 'Overheating' },
            ] as { id: DrivingProfile; label: string }[]
          ).map((p) => (
            <button
              key={p.id}
              id={`sim-profile-${p.id}`}
              onClick={() => handleProfileChange(p.id)}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all min-h-[40px] ${
                activeProfile === p.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-[#1C222B] text-zinc-200 hover:bg-[#252D3A] hover:text-white border border-[#2E3744]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          id="reset-peaks-btn"
          onClick={handleResetPeaks}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-300 hover:text-cyan-300 transition-colors py-2 px-3 rounded-lg hover:bg-[#1C222B]"
          title="Reset Peak Metrics"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset Peaks</span>
        </button>
      </div>

      {/* Primary Cockpit Gauge Cluster (Skeuomorphic Automotive Gauges) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Center Instrument Cluster: Tachometer & Digital Speed (7 Cols) */}
        <div className="relative flex flex-col items-center justify-center rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 sm:p-8 shadow-2xl overflow-hidden lg:col-span-7">
          {/* Shift Light Indicator Bar */}
          <div className="mb-5 flex w-full max-w-md items-center justify-center gap-1.5 z-10">
            {Array.from({ length: 10 }).map((_, idx) => {
              const isLit = idx < Math.floor((telemetry.rpm / 7500) * 10);
              const isRedline = idx >= 8;
              return (
                <div
                  key={idx}
                  className={`h-2.5 flex-1 rounded-sm transition-all duration-75 ${
                    isLit
                      ? isRedline
                        ? 'bg-red-500 shadow-md shadow-red-500/60'
                        : idx >= 5
                        ? 'bg-amber-500 shadow-md shadow-amber-500/50'
                        : 'bg-emerald-500 shadow-md shadow-emerald-500/50'
                      : 'bg-[#202630]'
                  }`}
                />
              );
            })}
          </div>

          {/* Skeuomorphic Tachometer Dial */}
          <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80 z-10">
            {/* Skeuomorphic Brushed Bezel */}
            <div className="absolute inset-0 rounded-full border-4 border-[#374151] bg-gradient-to-b from-[#1C222B] via-[#14181F] to-[#0D1014] shadow-2xl" />

            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 200">
              {/* Outer Tick Mark Ring */}
              <circle cx="100" cy="100" r="92" fill="none" stroke="#2C3440" strokeWidth="2.5" />

              {/* Major & Minor Ticks */}
              {Array.from({ length: 41 }).map((_, i) => {
                const angle = -125 + (i / 40) * 250;
                const isMajor = i % 5 === 0;
                const rad = ((angle - 90) * Math.PI) / 180;
                const innerR = isMajor ? 74 : 82;
                const outerR = 90;
                const x1 = 100 + innerR * Math.cos(rad);
                const y1 = 100 + innerR * Math.sin(rad);
                const x2 = 100 + outerR * Math.cos(rad);
                const y2 = 100 + outerR * Math.sin(rad);
                const isRedline = i >= 35;

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isRedline ? '#EF4444' : isMajor ? '#FFFFFF' : '#94A3B8'}
                    strokeWidth={isMajor ? 3 : 1.5}
                  />
                );
              })}

              {/* Dial Numeric Labels (0 to 8 x 1000 RPM) */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                const angle = -125 + (num / 8) * 250;
                const rad = ((angle - 90) * Math.PI) / 180;
                const x = 100 + 63 * Math.cos(rad);
                const y = 100 + 63 * Math.sin(rad);
                return (
                  <text
                    key={num}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`font-mono-tech text-[12px] font-bold ${
                      num >= 7 ? 'fill-red-400' : 'fill-white'
                    }`}
                  >
                    {num}
                  </text>
                );
              })}

              {/* Unit Subtext */}
              <text
                x="100"
                y="50"
                textAnchor="middle"
                className="font-mono-tech text-[9px] font-bold fill-zinc-300 uppercase tracking-wider"
              >
                RPM x1000
              </text>
            </svg>

            {/* Skeuomorphic Metallic Needle with Cyan/Amber Pin */}
            <div
              className="absolute h-full w-full pointer-events-none transition-transform duration-100 ease-out"
              style={{ transform: `rotate(${rpmAngle}deg)` }}
            >
              <div className="mx-auto h-32 w-1.5 rounded-t-full bg-gradient-to-t from-transparent via-cyan-400 to-cyan-300 shadow-md shadow-cyan-400/60" />
            </div>

            {/* Center Hub & Digital Speed Readout */}
            <div className="z-10 flex h-36 w-36 flex-col items-center justify-center rounded-full border-2 border-[#374151] bg-[#0B0E12] shadow-inner">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold tracking-tight text-white">
                  {displaySpeed}
                </span>
                <span className="font-mono-tech text-xs font-bold text-cyan-300">
                  {speedUnit}
                </span>
              </div>

              {/* Gear and RPM Status */}
              <div className="mt-1.5 flex items-center gap-2">
                <span className="rounded-md bg-[#1C222B] border border-[#374151] px-2 py-0.5 font-display text-xs font-bold text-amber-300">
                  GEAR {gear}
                </span>
                <span className="font-mono-tech text-xs font-bold text-zinc-200">
                  {telemetry.rpm} <span className="text-[10px] text-zinc-400 font-medium">RPM</span>
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Peak Stat Strip */}
          <div className="mt-6 flex w-full justify-around border-t border-[#2C3440] pt-4 text-center z-10">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-300 font-bold">Peak RPM</p>
              <p className="font-mono-tech text-lg font-bold text-white mt-0.5">{peakRpm}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-300 font-bold">Peak Speed</p>
              <p className="font-mono-tech text-lg font-bold text-white mt-0.5">
                {peakSpeed} {speedUnit}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-300 font-bold">Peak Boost</p>
              <p className="font-mono-tech text-lg font-bold text-cyan-300 mt-0.5">
                {peakBoost > 0 ? `+${peakBoost}` : peakBoost} PSI
              </p>
            </div>
          </div>
        </div>

        {/* Auxiliary Sensor Dial Gauges (5 Cols) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5">
          {/* Boost / Manifold Pressure Dial */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#2C3440] bg-[#14181F] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-400" />
                <span className="text-xs sm:text-sm font-bold text-zinc-100 uppercase tracking-wide">
                  BOOST / VACUUM
                </span>
              </div>
              <span className="font-mono-tech text-sm font-bold text-cyan-300">
                {telemetry.boostPressurePsi > 0 ? `+${telemetry.boostPressurePsi}` : telemetry.boostPressurePsi} PSI
              </span>
            </div>

            {/* Skeuomorphic Circular Dial */}
            <div className="my-3 flex items-center justify-center">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-[#374151] bg-[#0B0E12]">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#202630" strokeWidth="4" />
                  <path
                    d="M 22 78 A 38 38 0 1 1 78 78"
                    fill="none"
                    stroke="#22D3EE"
                    strokeWidth="5"
                    strokeDasharray="179"
                    strokeDashoffset={179 - (179 * Math.max(0, boostPercent)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div
                  className="absolute h-full w-full transition-transform duration-100"
                  style={{ transform: `rotate(${boostAngle}deg)` }}
                >
                  <div className="mx-auto h-14 w-1 rounded-t-full bg-cyan-400 shadow-sm" />
                </div>
                <div className="absolute text-center">
                  <span className="font-display text-2xl font-bold text-white">
                    {telemetry.boostPressurePsi}
                  </span>
                  <p className="text-xs text-zinc-300 font-mono-tech font-bold">PSI</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between text-xs text-zinc-300 font-mono-tech font-semibold">
              <span>-15 VAC</span>
              <span>0</span>
              <span>+25 PSI</span>
            </div>
          </div>

          {/* Coolant & Engine Temperature */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#2C3440] bg-[#14181F] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-amber-400" />
                <span className="text-xs sm:text-sm font-bold text-zinc-100 uppercase tracking-wide">
                  COOLANT TEMP
                </span>
              </div>
              <span
                className={`font-mono-tech text-sm font-bold ${
                  telemetry.coolantTempC > 105 ? 'text-red-400 animate-pulse' : 'text-amber-300'
                }`}
              >
                {displayTemp} {tempUnit}
              </span>
            </div>

            <div className="my-3 space-y-2.5">
              <div className="h-4 w-full overflow-hidden rounded-full bg-[#202630] border border-[#374151]">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    telemetry.coolantTempC > 105
                      ? 'bg-red-500'
                      : telemetry.coolantTempC < 75
                      ? 'bg-sky-400'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.min(100, (telemetry.coolantTempC / 125) * 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs font-mono-tech font-semibold text-zinc-300">
                <span>COLD (50°)</span>
                <span className="text-amber-300">OPT (90°)</span>
                <span className="text-red-300">HOT (120°)</span>
              </div>
            </div>

            <div className="flex justify-between border-t border-[#2C3440] pt-2.5 text-xs sm:text-sm text-zinc-200 font-mono-tech">
              <span>Intake Air: <strong className="text-white font-bold">{telemetry.intakeTempC}°C</strong></span>
              <span>Oil: <strong className="text-white font-bold">{telemetry.oilTempC}°C</strong></span>
            </div>
          </div>

          {/* Engine Load & Throttle Position */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#2C3440] bg-[#14181F] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                <span className="text-xs sm:text-sm font-bold text-zinc-100 uppercase tracking-wide">
                  THROTTLE & LOAD
                </span>
              </div>
              <span className="font-mono-tech text-sm font-bold text-emerald-300">
                {telemetry.throttlePosPercent}% TPS
              </span>
            </div>

            <div className="my-3 space-y-3">
              <div>
                <div className="flex justify-between text-xs sm:text-sm text-zinc-200 font-medium">
                  <span>Throttle (TPS)</span>
                  <span className="font-mono-tech font-bold text-white">{telemetry.throttlePosPercent}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-[#202630] mt-1.5">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-100 rounded-full"
                    style={{ width: `${telemetry.throttlePosPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs sm:text-sm text-zinc-200 font-medium">
                  <span>Calculated Load</span>
                  <span className="font-mono-tech font-bold text-amber-300">{telemetry.engineLoadPercent}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-[#202630] mt-1.5">
                  <div
                    className="h-full bg-amber-400 transition-all duration-100 rounded-full"
                    style={{ width: `${telemetry.engineLoadPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between border-t border-[#2C3440] pt-2.5 text-xs sm:text-sm text-zinc-200 font-mono-tech">
              <span>Timing: <strong className="text-white font-bold">{telemetry.timingAdvanceDeg}°</strong></span>
              <span>MAF: <strong className="text-white font-bold">{telemetry.mafFlowGps} g/s</strong></span>
            </div>
          </div>

          {/* Battery Voltage & Alternator */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#2C3440] bg-[#14181F] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                <span className="text-xs sm:text-sm font-bold text-zinc-100 uppercase tracking-wide">
                  ELECTRICAL BUS
                </span>
              </div>
              <span className="font-mono-tech text-sm font-bold text-amber-300">
                {telemetry.batteryVoltage} V
              </span>
            </div>

            <div className="my-3 flex items-center justify-center">
              <div className="text-center">
                <span className="font-display text-4xl font-bold text-white tracking-tight">
                  {telemetry.batteryVoltage}
                </span>
                <p className="text-xs sm:text-sm text-emerald-400 font-mono-tech font-bold mt-1">Alternator Charging OK</p>
              </div>
            </div>

            <div className="flex justify-between border-t border-[#2C3440] pt-2.5 text-xs sm:text-sm text-zinc-200 font-mono-tech">
              <span>Fuel Rail: <strong className="text-white font-bold">{telemetry.fuelPressureKpa} kPa</strong></span>
              <span>Fuel: <strong className="text-white font-bold">{telemetry.fuelLevelPercent}%</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Performance Sprint, Dyno & 20Hz ECU Telemetry Hub */}
      <div className="rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#2C3440] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Timer className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                  PERFORMANCE SPRINT & DYNO TELEMETRY
                </h3>
                {user.isPro ? (
                  <span className="rounded-md bg-cyan-500/25 border border-cyan-500/40 px-2.5 py-0.5 text-xs font-bold text-cyan-200 font-mono-tech">
                    PRO ACTIVE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-md bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 text-xs font-bold text-cyan-300 font-mono-tech">
                    <Lock className="h-3 w-3" /> PRO EXCLUSIVE
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 mt-0.5 font-normal">
                0-60 MPH launch timer, 60ft drag splits, live G-force acceleration, and 20Hz ECU telemetry export.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCaptureFreezeFrame}
              className="flex items-center gap-2 rounded-xl border border-[#363E4C] bg-[#1A202A] hover:border-cyan-500 hover:text-cyan-300 px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-200 transition-all min-h-[44px]"
            >
              <Download className="h-4 w-4" />
              <span>{snapshotCaptured ? 'Snapshot Saved!' : 'Freeze-Frame Snapshot'}</span>
            </button>
            <button
              onClick={handleTrigger20HzLogging}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                is20HzLogging
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                  : 'border-[#363E4C] bg-[#1A202A] text-zinc-200 hover:border-cyan-500 hover:text-cyan-300'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>{is20HzLogging ? '20Hz Stream (Active)' : '20Hz PID Stream'}</span>
            </button>
          </div>
        </div>

        {/* 0-60 Metrics Display Box - Non-overlapping layout with dedicated badge headers */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col justify-between rounded-2xl border border-[#2C3440] bg-[#1A202A] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-300 font-mono-tech font-bold uppercase truncate">0-60 SPRINT TIME</span>
              {!user.isPro && (
                <div className="flex shrink-0 items-center gap-1 rounded-lg bg-[#0E1116] border border-[#2C3440] px-2 py-0.5 text-[10px] font-bold text-cyan-300 font-mono-tech">
                  <Lock className="h-3 w-3" /> PRO
                </div>
              )}
            </div>
            <div className="my-3 text-center font-display text-3xl sm:text-4xl font-bold text-cyan-300">
              {sprintTime ? `${sprintTime.toFixed(2)}s` : '--'}
            </div>
            <p className="text-xs text-center text-zinc-400 font-mono-tech">Optimal Track Surface</p>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[#2C3440] bg-[#1A202A] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-300 font-mono-tech font-bold uppercase truncate">60-FOOT LAUNCH</span>
              {!user.isPro && (
                <div className="flex shrink-0 items-center gap-1 rounded-lg bg-[#0E1116] border border-[#2C3440] px-2 py-0.5 text-[10px] font-bold text-cyan-300 font-mono-tech">
                  <Lock className="h-3 w-3" /> PRO
                </div>
              )}
            </div>
            <div className="my-3 text-center font-display text-3xl sm:text-4xl font-bold text-white">
              {sixtyFootSplit ? `${sixtyFootSplit.toFixed(2)}s` : '--'}
            </div>
            <p className="text-xs text-center text-zinc-400 font-mono-tech">Sub-2.0s AWD Launch</p>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-[#2C3440] bg-[#1A202A] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-300 font-mono-tech font-bold uppercase truncate">PEAK G-FORCE</span>
              {!user.isPro && (
                <div className="flex shrink-0 items-center gap-1 rounded-lg bg-[#0E1116] border border-[#2C3440] px-2 py-0.5 text-[10px] font-bold text-cyan-300 font-mono-tech">
                  <Lock className="h-3 w-3" /> PRO
                </div>
              )}
            </div>
            <div className="my-3 text-center font-display text-3xl sm:text-4xl font-bold text-amber-300">
              +{peakGForce ? peakGForce.toFixed(2) : '0.00'} G
            </div>
            <p className="text-xs text-center text-zinc-400 font-mono-tech">Launch Control Traction</p>
          </div>
        </div>

        {/* Action button to arm sprint timer or buy subscription */}
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-zinc-300 font-normal">
            {user.isPro
              ? 'OBD-II vehicle speed sensor auto-detects zero-to-launch trigger.'
              : 'Upgrade to CarAI Pro ($79/yr or $9.99/mo) to unlock real-time acceleration timing & high-speed ECU logging.'}
          </p>
          <button
            onClick={handleTrigger060Timer}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95 min-h-[46px] ${
              user.isPro
                ? sprintState === 'armed'
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 animate-pulse'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-600/30'
            }`}
          >
            {user.isPro ? (
              <>
                <Timer className="h-4 w-4" />
                <span>{sprintState === 'armed' ? 'ARMED (Waiting for 0 MPH Launch)' : 'Arm 0-60 Launch Timer'}</span>
              </>
            ) : (
              <>
                <Crown className="h-4 w-4 fill-current" />
                <span>Unlock Pro Dyno Sprint ($79/yr)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
