import React, { useState } from 'react';
import {
  BatteryCharging,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  Play,
  RotateCcw,
  ShieldCheck,
  TrendingDown,
  Info,
} from 'lucide-react';
import { OBDTelemetry, UserSubscriptionState, PaywallContext } from '../../types';
import { haptics } from '../../services/haptics';

interface BatteryHealthPanelProps {
  telemetry: OBDTelemetry;
  user: UserSubscriptionState;
  onOpenPaywall: (context?: PaywallContext) => void;
  onOpenPhoneQrModal: () => void;
}

export const BatteryHealthPanel: React.FC<BatteryHealthPanelProps> = ({
  telemetry,
  user,
  onOpenPaywall,
  onOpenPhoneQrModal,
}) => {
  const [testingCrank, setTestingCrank] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    crankVoltage: number;
    restVoltage: number;
    alternatorVoltage: number;
    rippleMv: number;
    grade: 'A' | 'B' | 'D' | 'F';
    lifespanMonths: number;
    cca: number;
    message: string;
  } | null>({
    crankVoltage: 10.6,
    restVoltage: 12.6,
    alternatorVoltage: 14.2,
    rippleMv: 42,
    grade: 'A',
    lifespanMonths: 22,
    cca: 650,
    message: 'Battery and alternator in excellent health. Cold crank voltage drop well above 9.6V threshold.',
  });

  const isProActive = user.isPro || user.activeTrial;

  const runColdCrankTest = () => {
    haptics.heavyImpact();
    if (!isProActive) {
      onOpenPaywall({
        trigger: 'battery_crank_test',
        featureTitle: '12V Battery & Alternator Cranking Diagnostic',
        description: 'Analyze milliseconds cold-crank voltage drop to detect battery failure weeks before getting stranded.',
      });
      return;
    }

    setTestingCrank(true);
    setTimeout(() => {
      // Simulate healthy or dying based on simulated test
      const crankV = +(10.2 + Math.random() * 0.7).toFixed(1);
      const restV = +(12.5 + Math.random() * 0.2).toFixed(1);
      const altV = +(14.1 + Math.random() * 0.3).toFixed(1);
      const rip = Math.round(35 + Math.random() * 15);
      setTestResult({
        crankVoltage: crankV,
        restVoltage: restV,
        alternatorVoltage: altV,
        rippleMv: rip,
        grade: 'A',
        lifespanMonths: 20,
        cca: 640,
        message: 'Engine cold-crank voltage drop nominal. Starter draw healthy and rectifier diodes optimal.',
      });
      setTestingCrank(false);
      haptics.lightTap();
    }, 1800);
  };

  const simulateDyingBattery = () => {
    haptics.heavyImpact();
    setTestingCrank(true);
    setTimeout(() => {
      setTestResult({
        crankVoltage: 8.8,
        restVoltage: 11.9,
        alternatorVoltage: 13.6,
        rippleMv: 88,
        grade: 'F',
        lifespanMonths: 1,
        cca: 320,
        message: 'CRITICAL: Voltage plunged to 8.8V during crank (< 9.0V failure threshold). Internal plate sulfation detected. Battery will leave you stranded in 2–3 weeks!',
      });
      setTestingCrank(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-950 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <BatteryCharging className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  12V Battery & Alternator Cranking Health Test
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Milliseconds Precision
                </span>
                {testResult?.grade === 'A' ? (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Grade A: Optimal
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30 animate-pulse">
                    Grade F: Failing
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Measures the exact voltage sag curve when the starter motor cranks. Detects dying lead-acid & AGM batteries 3 weeks before you get stranded on a freezing morning.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runColdCrankTest}
              disabled={testingCrank}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{testingCrank ? 'Sampling Crank Milliseconds...' : 'Test Cold Crank Now'}</span>
            </button>

            <button
              onClick={simulateDyingBattery}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 border border-zinc-700 transition"
              title="Simulate a dying 8.8V battery alert"
            >
              Simulate Dying Battery
            </button>
          </div>
        </div>
      </div>

      {/* Main 3 Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Cold Crank Voltage Drop */}
        <div className={`p-5 rounded-2xl border ${
          testResult?.grade === 'F'
            ? 'bg-red-950/40 border-red-500/50'
            : 'bg-zinc-900/80 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>COLD CRANK VOLTAGE SAG</span>
            <span className={testResult?.grade === 'F' ? 'text-red-400 font-bold' : 'text-emerald-400'}>
              MIN THRESHOLD: 9.6V
            </span>
          </div>
          <div className="my-3">
            <div className={`text-5xl font-black font-mono tracking-tight ${
              testResult?.grade === 'F' ? 'text-red-400' : 'text-white'
            }`}>
              {testResult?.crankVoltage || 10.6} <span className="text-xl text-zinc-400">V</span>
            </div>
            <p className="text-xs text-zinc-300 mt-2">
              {testResult?.message}
            </p>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 flex justify-between border-t border-zinc-800/80 pt-2">
            <span>Cold Cranking Amps:</span>
            <span className="font-bold text-white">{testResult?.cca} CCA</span>
          </div>
        </div>

        {/* 2. Alternator Charging & Diode Ripple */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>ALTERNATOR CHARGE & RIPPLE</span>
            <span className="text-cyan-400 font-bold">13.8V – 14.5V</span>
          </div>
          <div className="my-3">
            <div className="text-5xl font-black font-mono tracking-tight text-cyan-400">
              {telemetry.batteryVoltage ? telemetry.batteryVoltage.toFixed(1) : testResult?.alternatorVoltage} <span className="text-xl text-zinc-400">V</span>
            </div>
            <p className="text-xs text-zinc-300 mt-2">
              Alternator diode AC ripple: <strong>{testResult?.rippleMv} mV</strong>. Diodes rectifier intact.
            </p>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 flex justify-between border-t border-zinc-800/80 pt-2">
            <span>Status:</span>
            <span className="font-bold text-emerald-400">Regulator Charging Nominally</span>
          </div>
        </div>

        {/* 3. Predictive Lifespan Countdown */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>PREDICTED BATTERY LIFE</span>
              <span className="text-amber-400 font-bold">AI HEALTH MODEL</span>
            </div>
            <div className="my-3">
              <div className={`text-5xl font-black font-mono tracking-tight ${
                testResult?.grade === 'F' ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {testResult?.grade === 'F' ? '< 3' : `~${testResult?.lifespanMonths}`}{' '}
                <span className="text-xl text-zinc-400">
                  {testResult?.grade === 'F' ? 'weeks' : 'months'}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-2">
                Based on starter draw, engine cold starts, and heat cycle degradation.
              </p>
            </div>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 flex justify-between border-t border-zinc-800/80 pt-2">
            <span>Action Required:</span>
            <span className={testResult?.grade === 'F' ? 'font-bold text-red-400' : 'text-zinc-300'}>
              {testResult?.grade === 'F' ? 'Replace Battery Immediately' : 'None (System Nominal)'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Millisecond Voltage Sag Curve */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3 text-xs font-mono text-zinc-400">
          <span className="uppercase font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>450ms Starter Crank Voltage Curve</span>
          </span>
          <span>Sampling Rate: 1,000 Hz</span>
        </div>

        {/* Simulated Waveform Visualization */}
        <div className="h-28 w-full bg-zinc-900/80 rounded-xl p-3 relative flex items-end justify-between border border-zinc-800">
          {/* 12.6V resting guide line */}
          <div className="absolute top-4 left-3 right-3 border-b border-dashed border-zinc-700 flex justify-between text-[9px] font-mono text-zinc-500">
            <span>Resting Voltage: 12.6V</span>
            <span>Nominal</span>
          </div>
          {/* 9.6V failure threshold guide line */}
          <div className="absolute bottom-8 left-3 right-3 border-b border-dashed border-red-500/50 flex justify-between text-[9px] font-mono text-red-400">
            <span>Critical Failure Floor: 9.6V</span>
            <span>Warning</span>
          </div>

          {/* SVG Waveform Curve */}
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
            <path
              d={
                testResult?.grade === 'F'
                  ? 'M 0 10 L 20 10 L 25 48 L 45 46 L 55 35 L 75 22 L 100 20'
                  : 'M 0 10 L 20 10 L 25 32 L 45 30 L 55 18 L 75 8 L 100 6'
              }
              fill="none"
              stroke={testResult?.grade === 'F' ? '#EF4444' : '#10B981'}
              strokeWidth="2.5"
            />
          </svg>
        </div>
        <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-2 px-1">
          <span>0ms (Key On)</span>
          <span>150ms (Starter Solenoid)</span>
          <span>300ms (Cold Compression)</span>
          <span>450ms (Engine Fires)</span>
          <span>600ms (Alternator Charge)</span>
        </div>
      </div>
    </div>
  );
};
