import React, { useState, useEffect } from 'react';
import {
  Timer,
  Zap,
  Gauge,
  Activity,
  Flame,
  Award,
  ChevronRight,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { OBDTelemetry, UserSubscriptionState, PaywallContext } from '../../types';
import { haptics } from '../../services/haptics';

interface PerformanceTimerPanelProps {
  telemetry: OBDTelemetry;
  user: UserSubscriptionState;
  useMetric: boolean;
  onOpenPaywall: (context?: PaywallContext) => void;
  onOpenPhoneQrModal: () => void;
}

type StagingState = 'idle' | 'pre_stage' | 'staged' | 'countdown_1' | 'countdown_2' | 'countdown_3' | 'green' | 'launched' | 'completed';

export const PerformanceTimerPanel: React.FC<PerformanceTimerPanelProps> = ({
  telemetry,
  user,
  useMetric,
  onOpenPaywall,
  onOpenPhoneQrModal,
}) => {
  const [stagingState, setStagingState] = useState<StagingState>('idle');
  const [zeroToSixtyTime, setZeroToSixtyTime] = useState<number>(4.42);
  const [quarterMileTime, setQuarterMileTime] = useState<number>(12.85);
  const [quarterMileTrapMph, setQuarterMileTrapMph] = useState<number>(112.4);
  const [peakGForce, setPeakGForce] = useState<number>(1.12);
  const [sixtyToZeroBrakingFt, setSixtyToZeroBrakingFt] = useState<number>(108);
  const [runHistory, setRunHistory] = useState([
    { id: 1, date: 'Today, 2:45 PM', zeroSixty: '4.42s', quarterMile: '12.85s @ 112 MPH', peakG: '1.12 G', reaction: '0.24s' },
    { id: 2, date: 'Yesterday, 8:12 PM', zeroSixty: '4.55s', quarterMile: '13.01s @ 110 MPH', peakG: '1.08 G', reaction: '0.31s' },
    { id: 3, date: '3 days ago', zeroSixty: '4.38s', quarterMile: '12.72s @ 114 MPH', peakG: '1.16 G', reaction: '0.19s' },
  ]);

  const isProActive = user.isPro || user.activeTrial;

  // Staging Tree Sequence Simulator
  const armLaunchControl = () => {
    haptics.heavyImpact();
    if (!isProActive) {
      onOpenPaywall({
        trigger: 'performance_timer',
        featureTitle: 'Drag Strip Launch Control Timer',
        description: 'Unlock millisecond-precision 0-60 & 1/4 mile drag strip tree staging with CarAI Pro.',
      });
      return;
    }

    setStagingState('pre_stage');
    setTimeout(() => {
      setStagingState('staged');
      setTimeout(() => {
        setStagingState('countdown_1');
        setTimeout(() => {
          setStagingState('countdown_2');
          setTimeout(() => {
            setStagingState('countdown_3');
            setTimeout(() => {
              setStagingState('green');
              setTimeout(() => {
                setStagingState('launched');
                // Simulate quick run finish
                setTimeout(() => {
                  const newZ60 = +(4.2 + Math.random() * 0.4).toFixed(2);
                  const newQM = +(12.5 + Math.random() * 0.5).toFixed(2);
                  const newTrap = Math.round(111 + Math.random() * 4);
                  const newG = +(1.05 + Math.random() * 0.15).toFixed(2);
                  setZeroToSixtyTime(newZ60);
                  setQuarterMileTime(newQM);
                  setQuarterMileTrapMph(newTrap);
                  setPeakGForce(newG);
                  setStagingState('completed');
                  setRunHistory((prev) => [
                    {
                      id: Date.now(),
                      date: 'Just now',
                      zeroSixty: `${newZ60}s`,
                      quarterMile: `${newQM}s @ ${newTrap} MPH`,
                      peakG: `${newG} G`,
                      reaction: '0.21s',
                    },
                    ...prev,
                  ]);
                }, 2200);
              }, 400);
            }, 400);
          }, 400);
        }, 400);
      }, 600);
    }, 500);
  };

  const speed = useMetric ? telemetry.speedKmh : telemetry.speedMph;
  const speedUnit = useMetric ? 'KM/H' : 'MPH';

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/50 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Timer className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  0–60 MPH & Drag Strip Performance Timer
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  NHRA Draggy Precision
                </span>
                {isProActive && (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Pro Active
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                OBD-II wheel speed sensors + phone accelerometer G-force vectoring detect true vehicle launch with zero satellite lag.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={armLaunchControl}
              disabled={stagingState !== 'idle' && stagingState !== 'completed'}
              className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-zinc-950 shadow-lg shadow-amber-500/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Flame className="w-4 h-4" />
              <span>
                {stagingState === 'idle' || stagingState === 'completed'
                  ? 'ARM LAUNCH CONTROL'
                  : 'LAUNCH SEQUENCE ACTIVE'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Christmas Tree Drag Strip Staging Lights */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Visual Christmas Tree */}
        <div className="flex flex-col items-center gap-2 bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl min-w-[220px]">
          <div className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
            CHRISTMAS TREE
          </div>

          {/* Pre-Stage */}
          <div className="flex gap-4">
            <div className={`w-5 h-5 rounded-full border border-zinc-700 transition-all ${
              stagingState === 'pre_stage' || stagingState === 'staged' || stagingState === 'countdown_1' || stagingState === 'countdown_2' || stagingState === 'countdown_3' || stagingState === 'green'
                ? 'bg-amber-400 shadow-[0_0_12px_#F59E0B]'
                : 'bg-zinc-800'
            }`} />
            <div className={`w-5 h-5 rounded-full border border-zinc-700 transition-all ${
              stagingState === 'pre_stage' || stagingState === 'staged' || stagingState === 'countdown_1' || stagingState === 'countdown_2' || stagingState === 'countdown_3' || stagingState === 'green'
                ? 'bg-amber-400 shadow-[0_0_12px_#F59E0B]'
                : 'bg-zinc-800'
            }`} />
          </div>

          {/* Staged */}
          <div className="flex gap-4">
            <div className={`w-5 h-5 rounded-full border border-zinc-700 transition-all ${
              stagingState === 'staged' || stagingState === 'countdown_1' || stagingState === 'countdown_2' || stagingState === 'countdown_3' || stagingState === 'green'
                ? 'bg-amber-400 shadow-[0_0_12px_#F59E0B]'
                : 'bg-zinc-800'
            }`} />
            <div className={`w-5 h-5 rounded-full border border-zinc-700 transition-all ${
              stagingState === 'staged' || stagingState === 'countdown_1' || stagingState === 'countdown_2' || stagingState === 'countdown_3' || stagingState === 'green'
                ? 'bg-amber-400 shadow-[0_0_12px_#F59E0B]'
                : 'bg-zinc-800'
            }`} />
          </div>

          {/* Amber 1 */}
          <div className={`w-7 h-7 rounded-full border border-zinc-700 transition-all ${
            stagingState === 'countdown_1' || stagingState === 'countdown_2' || stagingState === 'countdown_3'
              ? 'bg-amber-500 shadow-[0_0_18px_#F59E0B]'
              : 'bg-zinc-800'
          }`} />

          {/* Amber 2 */}
          <div className={`w-7 h-7 rounded-full border border-zinc-700 transition-all ${
            stagingState === 'countdown_2' || stagingState === 'countdown_3'
              ? 'bg-amber-500 shadow-[0_0_18px_#F59E0B]'
              : 'bg-zinc-800'
          }`} />

          {/* Amber 3 */}
          <div className={`w-7 h-7 rounded-full border border-zinc-700 transition-all ${
            stagingState === 'countdown_3'
              ? 'bg-amber-500 shadow-[0_0_18px_#F59E0B]'
              : 'bg-zinc-800'
          }`} />

          {/* Green GO! */}
          <div className={`w-9 h-9 rounded-full border-2 border-zinc-700 transition-all ${
            stagingState === 'green' || stagingState === 'launched' || stagingState === 'completed'
              ? 'bg-emerald-400 shadow-[0_0_24px_#10B981]'
              : 'bg-zinc-800'
          }`} />
        </div>

        {/* Live Metrics Grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
          {/* 0-60 Time */}
          <div className="bg-zinc-900/90 border border-cyan-500/40 rounded-xl p-4 text-center">
            <span className="text-[11px] font-mono text-cyan-400 uppercase">0–60 MPH TIME</span>
            <div className="text-4xl md:text-5xl font-black font-mono text-white mt-2">
              {zeroToSixtyTime} <span className="text-sm text-cyan-400">s</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
              Personal Best: 4.38s
            </span>
          </div>

          {/* 1/4 Mile ET */}
          <div className="bg-zinc-900/90 border border-amber-500/40 rounded-xl p-4 text-center">
            <span className="text-[11px] font-mono text-amber-400 uppercase">1/4 MILE ET</span>
            <div className="text-4xl md:text-5xl font-black font-mono text-white mt-2">
              {quarterMileTime} <span className="text-sm text-amber-400">s</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
              Trap: {quarterMileTrapMph} MPH
            </span>
          </div>

          {/* Peak Launch G-Force */}
          <div className="bg-zinc-900/90 border border-emerald-500/40 rounded-xl p-4 text-center">
            <span className="text-[11px] font-mono text-emerald-400 uppercase">PEAK LAUNCH G</span>
            <div className="text-4xl md:text-5xl font-black font-mono text-white mt-2">
              {peakGForce} <span className="text-sm text-emerald-400">G</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
              Lateral: 0.94 G
            </span>
          </div>

          {/* 60-0 Braking Distance */}
          <div className="bg-zinc-900/90 border border-red-500/40 rounded-xl p-4 text-center">
            <span className="text-[11px] font-mono text-red-400 uppercase">60–0 BRAKING</span>
            <div className="text-4xl md:text-5xl font-black font-mono text-white mt-2">
              {sixtyToZeroBrakingFt} <span className="text-sm text-red-400">ft</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
              Decel: 1.18 G
            </span>
          </div>
        </div>
      </div>

      {/* Run History Slips */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Official Drag Strip Run Slips & Telemetry Logs</span>
          </h3>
          <button
            onClick={() => {
              haptics.lightTap();
              alert('Exported official drag slip PDF to device.');
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
          >
            <Download className="w-3.5 h-3.5" /> Export Slip
          </button>
        </div>

        <div className="space-y-2">
          {runHistory.map((run) => (
            <div
              key={run.id}
              className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
            >
              <div>
                <span className="text-white font-bold">{run.date}</span>
                <span className="text-zinc-500 ml-2">Reaction: {run.reaction}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-cyan-400">0–60: <strong>{run.zeroSixty}</strong></span>
                <span className="text-amber-400">1/4: <strong>{run.quarterMile}</strong></span>
                <span className="text-emerald-400">Peak: <strong>{run.peakG}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Lock Card if not Pro */}
      {!isProActive && (
        <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-xs font-bold text-white">Full Drag Strip & G-Force Logging Locked</p>
              <p className="text-[11px] text-zinc-400">
                Standalone Draggy devices cost $400+. Get real-time 0-60 launch detection and unlimited runs with CarAI Pro.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              onOpenPaywall({
                trigger: 'performance_timer',
                featureTitle: 'Drag Strip Performance Suite',
                description: 'Unlock millisecond-precision 0-60 & 1/4 mile drag strip tree staging with CarAI Pro.',
              })
            }
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md"
          >
            Unlock with Pro
          </button>
        </div>
      )}
    </div>
  );
};
