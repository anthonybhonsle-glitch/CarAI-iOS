import React, { useState } from 'react';
import {
  Compass,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  VolumeX,
  Lock,
  Sparkles,
  Flame,
  Gauge,
  Sun,
  Palette,
  RotateCw,
} from 'lucide-react';
import { OBDTelemetry, UserSubscriptionState, PaywallContext } from '../../types';
import { haptics } from '../../services/haptics';

interface WindshieldHUDModalProps {
  telemetry: OBDTelemetry;
  user: UserSubscriptionState;
  useMetric: boolean;
  onClose: () => void;
  onOpenPaywall: (context?: PaywallContext) => void;
  onOpenPhoneQrModal: () => void;
}

type HUDTheme = 'aviator_green' | 'cyber_cyan' | 'amber_gt';

export const WindshieldHUDModal: React.FC<WindshieldHUDModalProps> = ({
  telemetry,
  user,
  useMetric,
  onClose,
  onOpenPaywall,
  onOpenPhoneQrModal,
}) => {
  // HUD Inversion & Mirror Controls
  // When mirrored for windshield: horizontally flipped (scaleX(-1)) and vertically flipped (scaleY(-1))
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [hudTheme, setHudTheme] = useState<HUDTheme>('aviator_green');
  const [showNavDirection, setShowNavDirection] = useState<boolean>(true);

  const isProActive = user.isPro || user.activeTrial;

  const speed = useMetric ? telemetry.speedKmh : telemetry.speedMph;
  const speedUnit = useMetric ? 'KM/H' : 'MPH';
  const coolantTemp = useMetric ? `${telemetry.coolantTempC}°C` : `${telemetry.coolantTempF}°F`;
  const isOverheating = telemetry.coolantTempC >= 105;

  // Color schemes for glass reflection
  const themeColors = {
    aviator_green: {
      primary: '#00FF66',
      glow: '0 0 35px rgba(0, 255, 102, 0.85)',
      dim: 'rgba(0, 255, 102, 0.25)',
      border: '#00FF66',
    },
    cyber_cyan: {
      primary: '#00F0FF',
      glow: '0 0 35px rgba(0, 240, 255, 0.85)',
      dim: 'rgba(0, 240, 255, 0.25)',
      border: '#00F0FF',
    },
    amber_gt: {
      primary: '#FFB800',
      glow: '0 0 35px rgba(255, 184, 0, 0.85)',
      dim: 'rgba(255, 184, 0, 0.25)',
      border: '#FFB800',
    },
  };

  const activeColor = themeColors[hudTheme];

  const handleSelectTheme = (theme: HUDTheme) => {
    haptics.lightTap();
    if (theme !== 'aviator_green' && !isProActive) {
      onOpenPaywall({
        trigger: 'windshield_hud',
        featureTitle: 'Custom HUD Color Reflectors',
        description: 'Unlock Cyber Cyan and Amber GT windshield reflection skins with CarAI Pro.',
      });
      return;
    }
    setHudTheme(theme);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Top HUD Floating Control Bar (Always visible right-side up for driver adjustment) */}
      <div className="bg-black/90 border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
              WINDSHIELD HUD REFLECTOR
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] text-zinc-400">
            Place phone flat on dashboard under glass
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme selector */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => handleSelectTheme('aviator_green')}
              className={`w-6 h-6 rounded-md transition ${
                hudTheme === 'aviator_green' ? 'ring-2 ring-emerald-400' : 'opacity-60'
              }`}
              style={{ backgroundColor: '#00FF66' }}
              title="Aviator Phosphor Green (Free)"
            />
            <button
              onClick={() => handleSelectTheme('cyber_cyan')}
              className={`w-6 h-6 rounded-md relative transition ${
                hudTheme === 'cyber_cyan' ? 'ring-2 ring-cyan-400' : 'opacity-60'
              }`}
              style={{ backgroundColor: '#00F0FF' }}
              title="Cyber Cyan (Pro)"
            >
              {!isProActive && <Lock className="w-3 h-3 text-black absolute inset-0 m-auto" />}
            </button>
            <button
              onClick={() => handleSelectTheme('amber_gt')}
              className={`w-6 h-6 rounded-md relative transition ${
                hudTheme === 'amber_gt' ? 'ring-2 ring-amber-400' : 'opacity-60'
              }`}
              style={{ backgroundColor: '#FFB800' }}
              title="Amber GT (Pro)"
            >
              {!isProActive && <Lock className="w-3 h-3 text-black absolute inset-0 m-auto" />}
            </button>
          </div>

          {/* Mirror flip button */}
          <button
            onClick={() => {
              haptics.lightTap();
              setIsMirrored(!isMirrored);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              isMirrored
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400'
            }`}
            title="Mirror for Windshield Glass Reflection"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isMirrored ? 'MIRRORED (GLASS)' : 'DIRECT VIEW'}</span>
          </button>

          {/* Close HUD */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
            title="Exit HUD Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mirrored Reflective HUD Projection Area */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-transform duration-300"
        style={{
          transform: isMirrored ? 'scale(-1, -1)' : 'none',
          backgroundColor: '#000000',
        }}
      >
        {/* Subtle Pitch Black Ambient Border Glow for Maximum Glass Contrast */}
        <div className="w-full max-w-4xl flex flex-col items-center justify-between h-full py-8">
          {/* Top Bar: RPM Arc Sweep & Gear */}
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-sm font-mono tracking-widest px-2" style={{ color: activeColor.primary }}>
              <span className="font-bold flex items-center gap-2">
                <Compass className="w-4 h-4 animate-spin" />
                <span>315° NW • HIGHWAY 101 N</span>
              </span>
              <span className="font-black text-lg">
                GEAR {telemetry.gear || (telemetry.speedMph > 45 ? 'D5' : 'D3')}
              </span>
            </div>

            {/* High Contrast Segmented RPM Bar */}
            <div className="w-full h-5 rounded-full p-0.5 border-2 overflow-hidden flex gap-1" style={{ borderColor: activeColor.border }}>
              {Array.from({ length: 24 }).map((_, i) => {
                const step = (i + 1) / 24;
                const isLit = telemetry.rpm / 7000 >= step;
                const isRedline = i >= 20;
                return (
                  <div
                    key={i}
                    className="flex-1 h-full rounded-sm transition-all duration-100"
                    style={{
                      backgroundColor: isLit
                        ? isRedline
                          ? '#FF3333'
                          : activeColor.primary
                        : 'transparent',
                      boxShadow: isLit
                        ? isRedline
                          ? '0 0 10px #FF3333'
                          : activeColor.glow
                        : 'none',
                    }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] font-mono px-2 text-zinc-500">
              <span>0 RPM</span>
              <span style={{ color: activeColor.primary }}>{telemetry.rpm.toLocaleString()} RPM</span>
              <span className="text-red-500">7,000 REDLINE</span>
            </div>
          </div>

          {/* Center Stage: Giant High-Contrast Speed Digit */}
          <div className="text-center my-auto">
            <div
              className="text-[140px] md:text-[200px] font-black font-mono leading-none tracking-tighter"
              style={{
                color: activeColor.primary,
                textShadow: activeColor.glow,
              }}
            >
              {speed}
            </div>
            <div
              className="text-2xl md:text-3xl font-black font-mono tracking-[0.3em] uppercase -mt-2"
              style={{ color: activeColor.primary }}
            >
              {speedUnit}
            </div>
          </div>

          {/* Bottom Diagnostics Strip */}
          <div className="w-full flex items-center justify-between text-lg font-mono font-bold px-4 pt-4 border-t-2" style={{ borderColor: activeColor.dim }}>
            {/* Coolant / Thermal Status */}
            <div className="flex items-center gap-2">
              <Flame
                className={`w-6 h-6 ${isOverheating ? 'animate-bounce text-red-500' : ''}`}
                style={{ color: isOverheating ? '#FF3333' : activeColor.primary }}
              />
              <span style={{ color: isOverheating ? '#FF3333' : activeColor.primary }}>
                COOLANT: {coolantTemp}
              </span>
            </div>

            {/* Fuel Range or Boost */}
            <div className="flex items-center gap-2" style={{ color: activeColor.primary }}>
              <Gauge className="w-6 h-6" />
              <span>BOOST: {telemetry.boostPressurePsi || 0} PSI</span>
            </div>

            {/* 12V Voltage */}
            <div style={{ color: activeColor.primary }}>
              BATT: {telemetry.batteryVoltage ? telemetry.batteryVoltage.toFixed(1) : '14.2'}V
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Hint Strip */}
      <div className="bg-black/95 px-4 py-2 border-t border-zinc-900 text-center text-xs text-zinc-500 font-mono">
        💡 TIP: Lay phone flat on anti-slip mat atop dashboard at night. The windshield glass reflects this image right-side up without buying hardware!
      </div>
    </div>
  );
};
