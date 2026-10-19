import React, { useState } from 'react';
import {
  Wrench,
  Droplet,
  Disc,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  Calendar,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { OBDTelemetry, UserSubscriptionState, PaywallContext } from '../../types';
import { haptics } from '../../services/haptics';

interface PredictiveMaintenancePanelProps {
  telemetry: OBDTelemetry;
  user: UserSubscriptionState;
  onOpenPaywall: (context?: PaywallContext) => void;
  onOpenPhoneQrModal: () => void;
}

export const PredictiveMaintenancePanel: React.FC<PredictiveMaintenancePanelProps> = ({
  telemetry,
  user,
  onOpenPaywall,
  onOpenPhoneQrModal,
}) => {
  const [oilLifePercent, setOilLifePercent] = useState<number>(68);
  const [transFluidPercent, setTransFluidPercent] = useState<number>(82);
  const [brakePadPercent, setBrakePadPercent] = useState<number>(74);
  const [sparkPlugMilesRemaining, setSparkPlugMilesRemaining] = useState<number>(18400);
  const [coolantCorrosionIndex, setCoolantCorrosionIndex] = useState<number>(92);

  const isProActive = user.isPro || user.activeTrial;

  const handleResetItem = (name: string, setter: (val: number) => void) => {
    haptics.lightTap();
    if (!isProActive) {
      onOpenPaywall({
        trigger: 'predictive_maintenance',
        featureTitle: 'Predictive Fluid Life Management',
        description: 'Manage smart thermal wear algorithms and automated service resets with CarAI Pro.',
      });
      return;
    }
    setter(100);
    alert(`${name} reset to 100% (New OEM Fluid Logged).`);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-zinc-900 to-zinc-950 border border-blue-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Wrench className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Predictive Maintenance & Fluid Life Countdowns
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Thermal Cycle AI
                </span>
                {isProActive && (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Pro Active
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Calculates true molecular breakdown from cold starts, oil temperature spikes, and city vs. highway hours — not just dumb 5,000-mile mileage timers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Fluid & Wear Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Engine Oil Life (Smart Cycle Degradation) */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Engine Oil Degradation Index</h3>
            </div>
            <button
              onClick={() => handleResetItem('Engine Oil', setOilLifePercent)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset Oil
            </button>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-black font-mono text-white">
                {oilLifePercent}% <span className="text-xs text-zinc-400 font-normal">life remaining</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Estimated ~3,420 miles remaining until viscosity breakdown.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              GOOD
            </span>
          </div>

          <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all ${
                oilLifePercent > 40
                  ? 'bg-emerald-400 shadow-[0_0_10px_#10B981]'
                  : 'bg-amber-400 shadow-[0_0_10px_#F59E0B]'
              }`}
              style={{ width: `${oilLifePercent}%` }}
            />
          </div>

          <div className="text-[11px] text-zinc-500 font-mono flex justify-between pt-1">
            <span>Cold Starts Logged: 142</span>
            <span>Avg Oil Temp: 94°C</span>
          </div>
        </div>

        {/* 2. Transmission Fluid Health */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">Transmission Fluid Health</h3>
            </div>
            <button
              onClick={() => handleResetItem('Transmission Fluid', setTransFluidPercent)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset Fluid
            </button>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-black font-mono text-white">
                {transFluidPercent}% <span className="text-xs text-zinc-400 font-normal">life remaining</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Torque converter shear stress within normal thresholds.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
              OPTIMAL
            </span>
          </div>

          <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800 p-0.5">
            <div
              className="h-full rounded-full bg-cyan-400 shadow-[0_0_10px_#06B6D4]"
              style={{ width: `${transFluidPercent}%` }}
            />
          </div>

          <div className="text-[11px] text-zinc-500 font-mono flex justify-between pt-1">
            <span>Operating Hours: 840 hrs</span>
            <span>Max Temp Peak: 98°C</span>
          </div>
        </div>

        {/* 3. Brake Pad Estimated Wear */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Disc className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-white text-sm">Brake Pad Thickness & Wear</h3>
            </div>
            <button
              onClick={() => handleResetItem('Brake Pads', setBrakePadPercent)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset Pads
            </button>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-black font-mono text-white">
                {brakePadPercent}% <span className="text-xs text-zinc-400 font-normal">(8.2 mm)</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Minimum rotor service limit: 3.0 mm. Safe for highway driving.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              SAFE
            </span>
          </div>

          <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800 p-0.5">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${brakePadPercent}%` }}
            />
          </div>

          <div className="text-[11px] text-zinc-500 font-mono flex justify-between pt-1">
            <span>Hard Braking Events: 12</span>
            <span>Est. Remaining: 19,000 mi</span>
          </div>
        </div>

        {/* 4. Spark Plugs & Ignition Intervals */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm">Iridium Spark Plug Service</h3>
            </div>
            <button
              onClick={() => handleResetItem('Spark Plugs', (val) => setSparkPlugMilesRemaining(60000))}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset Plugs
            </button>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-black font-mono text-white">
                {sparkPlugMilesRemaining.toLocaleString()}{' '}
                <span className="text-xs text-zinc-400 font-normal">miles left</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Zero cylinder misfires detected on CAN-bus PID 0100.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
              HEALTHY
            </span>
          </div>

          <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800 p-0.5">
            <div
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${Math.min(100, (sparkPlugMilesRemaining / 60000) * 100)}%` }}
            />
          </div>

          <div className="text-[11px] text-zinc-500 font-mono flex justify-between pt-1">
            <span>Electrode Gap: 0.040 in</span>
            <span>Cylinder Balance: 100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
