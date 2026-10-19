import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Lock,
  CheckCircle2,
  Gauge,
  Sliders,
  Sun,
  Moon,
  Layers,
} from 'lucide-react';
import { OBDTelemetry, UserSubscriptionState, PaywallContext } from '../../types';
import { haptics } from '../../services/haptics';

export type ClusterSkinId = 'cyberpunk_2077' | 'jdm_90s' | 'tesla_minimal' | 'supercar_analog';

interface ClusterThemeSelectorProps {
  telemetry: OBDTelemetry;
  user: UserSubscriptionState;
  useMetric: boolean;
  selectedSkin: ClusterSkinId;
  onSelectSkin: (skin: ClusterSkinId) => void;
  onOpenPaywall: (context?: PaywallContext) => void;
  onOpenPhoneQrModal: () => void;
}

export const ClusterThemeSelector: React.FC<ClusterThemeSelectorProps> = ({
  telemetry,
  user,
  useMetric,
  selectedSkin,
  onSelectSkin,
  onOpenPaywall,
  onOpenPhoneQrModal,
}) => {
  const isProActive = user.isPro || user.activeTrial;

  const skins: {
    id: ClusterSkinId;
    name: string;
    description: string;
    accent: string;
    isPremium: boolean;
    previewBg: string;
  }[] = [
    {
      id: 'cyberpunk_2077',
      name: 'Cyberpunk 2077 / Neon Track',
      description: 'Futuristic digital bar meters with glowing cyan & hot magenta laser accents.',
      accent: '#00F0FF',
      isPremium: false, // Free Default Hook
      previewBg: 'from-cyan-950 to-pink-950',
    },
    {
      id: 'jdm_90s',
      name: 'Classic 90s JDM Track',
      description: 'Backlit carbon-fiber dials with high-vis orange needle sweep (Skyline GT-R & Supra style).',
      accent: '#FF6600',
      isPremium: true,
      previewBg: 'from-amber-950 to-zinc-950',
    },
    {
      id: 'tesla_minimal',
      name: 'Minimalist EV / Tesla Dark',
      description: 'Clean Swiss typography, minimalist energy recovery power meters, and ultra-dark glass.',
      accent: '#E2E8F0',
      isPremium: true,
      previewBg: 'from-zinc-900 to-black',
    },
    {
      id: 'supercar_analog',
      name: 'Supercar Analog Bezel',
      description: 'Precision brushed aluminum bezel with aggressive 8,500 RPM center-stage tachometer.',
      accent: '#EF4444',
      isPremium: true,
      previewBg: 'from-red-950 to-zinc-950',
    },
  ];

  const handlePickSkin = (skin: typeof skins[0]) => {
    haptics.lightTap();
    if (skin.isPremium && !isProActive) {
      onOpenPaywall({
        trigger: 'cluster_theme',
        featureTitle: `${skin.name} Cluster Theme`,
        description: `Transform your in-car dashboard with the official ${skin.name} gauge cluster skin.`,
      });
      return;
    }
    onSelectSkin(skin.id);
  };

  const speed = useMetric ? telemetry.speedKmh : telemetry.speedMph;
  const speedUnit = useMetric ? 'KM/H' : 'MPH';

  return (
    <div className="space-y-4">
      {/* Skin Selection Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono uppercase font-bold text-white tracking-wider">
              AESTHETIC IN-CAR CLUSTER SKINS
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Tap skin to switch in-car screen aesthetics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {skins.map((s) => {
            const isSelected = selectedSkin === s.id;
            const isLocked = s.isPremium && !isProActive;

            return (
              <button
                key={s.id}
                onClick={() => handlePickSkin(s)}
                className={`p-3.5 rounded-xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-zinc-800/90 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg'
                    : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{s.name}</span>
                    {isLocked ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        <Lock className="w-2.5 h-2.5" /> PRO
                      </span>
                    ) : isSelected ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{s.description}</p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.accent }} />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">{s.id.replace('_', ' ')}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Skin Showcase */}
      <div className="rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl relative">
        {/* ================================================================= */}
        {/* SKIN 1: CYBERPUNK 2077 / NEON TRACK                                */}
        {/* ================================================================= */}
        {selectedSkin === 'cyberpunk_2077' && (
          <div className="bg-gradient-to-br from-[#050B14] via-[#0C1222] to-[#12081C] p-6 relative min-h-[380px] flex flex-col justify-between">
            {/* Cyberpunk Grid scanlines */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="flex items-center justify-between text-xs font-mono z-10">
              <span className="text-cyan-400 font-bold tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                NEON TRACK // SYS.OVERDRIVE
              </span>
              <span className="text-pink-500 font-bold tracking-widest">
                GEAR {telemetry.gear || '04'} • CAN 500K
              </span>
            </div>

            <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center z-10">
              {/* Tachometer Arc */}
              <div className="bg-black/50 border border-cyan-500/30 p-5 rounded-2xl text-center backdrop-blur-md">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest">
                  TACHOMETER RPM
                </span>
                <div className="text-5xl font-black font-mono text-cyan-300 mt-2 drop-shadow-[0_0_20px_#00F0FF]">
                  {telemetry.rpm.toLocaleString()}
                </div>
                <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden mt-3 border border-cyan-500/40 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 rounded-full"
                    style={{ width: `${Math.min(100, (telemetry.rpm / 7000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Center Digital Speedometer */}
              <div className="text-center">
                <div className="text-8xl md:text-9xl font-black font-mono text-white tracking-tighter drop-shadow-[0_0_35px_#00F0FF]">
                  {speed}
                </div>
                <div className="text-xl font-black font-mono text-pink-400 tracking-[0.4em] uppercase -mt-2">
                  {speedUnit}
                </div>
              </div>

              {/* Boost / Thermal Matrix */}
              <div className="bg-black/50 border border-pink-500/30 p-5 rounded-2xl text-center backdrop-blur-md">
                <span className="text-[11px] font-mono text-pink-400 uppercase tracking-widest">
                  TURBO BOOST MATRIX
                </span>
                <div className="text-5xl font-black font-mono text-pink-400 mt-2 drop-shadow-[0_0_20px_#EC4899]">
                  +{telemetry.boostPressurePsi || 14.8} <span className="text-sm">PSI</span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400 mt-3 flex justify-between">
                  <span>COOLANT: {telemetry.coolantTempC}°C</span>
                  <span>OIL: {telemetry.oilTempC}°C</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-cyan-400/80 flex justify-between z-10 border-t border-cyan-500/20 pt-2">
              <span>CYBERPUNK HUD ACTIVE</span>
              <span>CAN BUS SYNC: 100 Hz</span>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SKIN 2: CLASSIC 90s JDM (SKYLINE / SUPRA STYLE)                    */}
        {/* ================================================================= */}
        {selectedSkin === 'jdm_90s' && (
          <div className="bg-[#0B0C0E] p-6 relative min-h-[380px] flex flex-col justify-between border-4 border-zinc-800">
            {/* Carbon Fiber Texture Pattern */}
            <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#ffffff_0.5px,transparent_0.5px)] [background-size:6px_6px]" />

            <div className="flex items-center justify-between text-xs font-mono z-10">
              <span className="text-amber-500 font-bold tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                SKYLINE GT-R JDM CLUSTER
              </span>
              <span className="text-zinc-400 font-bold">CALIBRATED TO 180 KM/H LIMITER</span>
            </div>

            <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center z-10">
              {/* JDM Tachometer */}
              <div className="bg-zinc-950 p-6 rounded-full border-4 border-zinc-800 aspect-square flex flex-col items-center justify-center text-center shadow-inner max-w-[240px] mx-auto">
                <span className="text-[10px] font-mono text-zinc-400 tracking-wider">x1000 r/min</span>
                <div className="text-5xl font-black font-mono text-amber-500 drop-shadow-[0_0_15px_#F59E0B]">
                  {(telemetry.rpm / 1000).toFixed(1)}
                </div>
                <span className="text-[9px] font-mono text-red-500 font-bold mt-1">REDLINE 8,000</span>
              </div>

              {/* JDM Speedometer */}
              <div className="bg-zinc-950 p-6 rounded-full border-4 border-amber-500/60 aspect-square flex flex-col items-center justify-center text-center shadow-2xl max-w-[260px] mx-auto">
                <span className="text-[10px] font-mono text-amber-400 tracking-widest">VEHICLE SPEED</span>
                <div className="text-7xl font-black font-mono text-white drop-shadow-[0_0_20px_#F59E0B]">
                  {speed}
                </div>
                <span className="text-sm font-bold font-mono text-amber-400">{speedUnit}</span>
              </div>

              {/* JDM Boost & Oil Temp Gauges */}
              <div className="space-y-3">
                <div className="bg-zinc-950 p-4 rounded-xl border-2 border-zinc-800 flex justify-between items-center font-mono">
                  <span className="text-xs text-zinc-400">BOOST (bar)</span>
                  <span className="text-2xl font-bold text-amber-400">+0.95 bar</span>
                </div>
                <div className="bg-zinc-950 p-4 rounded-xl border-2 border-zinc-800 flex justify-between items-center font-mono">
                  <span className="text-xs text-zinc-400">OIL TEMP (°C)</span>
                  <span className="text-2xl font-bold text-white">{telemetry.oilTempC}°C</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-amber-500/80 flex justify-between z-10 border-t border-zinc-800 pt-2">
              <span>90s JDM HERITAGE THEME</span>
              <span>ATTESA-ETS AWD: ACTIVE</span>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SKIN 3: MINIMALIST EV / TESLA DARK                                */}
        {/* ================================================================= */}
        {selectedSkin === 'tesla_minimal' && (
          <div className="bg-[#050505] p-6 relative min-h-[380px] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-sans tracking-wide text-zinc-400 z-10">
              <span className="font-semibold text-white">Drive • Autopilot Available</span>
              <span>72°F Cabin • Ambient Air Clean</span>
            </div>

            <div className="my-8 text-center z-10">
              <div className="text-9xl font-light tracking-tighter text-white font-sans">
                {speed}
              </div>
              <div className="text-sm font-semibold tracking-widest text-zinc-400 uppercase -mt-2">
                {speedUnit}
              </div>

              {/* Power Delivery / Regen Bar */}
              <div className="max-w-md mx-auto mt-6">
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                  {/* Left: Green Regen, Right: White Power */}
                  <div className="w-1/2 bg-emerald-500/80 rounded-l-full" />
                  <div className="w-1/2 bg-white rounded-r-full" />
                </div>
                <div className="flex justify-between text-[10px] font-sans text-zinc-500 mt-1">
                  <span>Regen Braking</span>
                  <span>Power Delivery</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-around border-t border-zinc-900 pt-3 text-xs text-zinc-300 z-10">
              <div>Trip: <strong>4.8 mi</strong></div>
              <div>Energy: <strong>214 Wh/mi</strong></div>
              <div>Tire Pressure: <strong>33 PSI</strong></div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SKIN 4: SUPERCAR ANALOG BEZEL                                     */}
        {/* ================================================================= */}
        {selectedSkin === 'supercar_analog' && (
          <div className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-black p-6 relative min-h-[380px] flex flex-col justify-between border-4 border-zinc-700 rounded-2xl">
            <div className="flex items-center justify-between text-xs font-mono z-10">
              <span className="text-red-500 font-black tracking-widest">CORSA MODE ACTIVE</span>
              <span className="text-zinc-300 font-bold">TRACTION: SPORT 1</span>
            </div>

            <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center z-10">
              <div className="text-center">
                <span className="text-xs font-mono text-zinc-400 uppercase">OIL PRESSURE</span>
                <div className="text-4xl font-black font-mono text-white mt-1">54 PSI</div>
              </div>

              {/* Giant Red Center Tachometer */}
              <div className="bg-zinc-950 border-4 border-red-600 rounded-full p-6 aspect-square flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(239,68,68,0.4)] max-w-[260px] mx-auto">
                <span className="text-xs font-mono text-red-500 font-bold">RPM x 1000</span>
                <div className="text-6xl font-black font-mono text-white">
                  {(telemetry.rpm / 1000).toFixed(1)}
                </div>
                <div className="text-2xl font-black font-mono text-red-500 mt-1">
                  {speed} <span className="text-xs text-zinc-400">{speedUnit}</span>
                </div>
              </div>

              <div className="text-center">
                <span className="text-xs font-mono text-zinc-400 uppercase">GEAR</span>
                <div className="text-5xl font-black font-mono text-white mt-1">
                  {telemetry.gear || '4'}
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-zinc-500 flex justify-between z-10 border-t border-zinc-800 pt-2">
              <span>SUPERCAR ANALOG V8</span>
              <span>EXHAUST VALVES: 100% OPEN</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
