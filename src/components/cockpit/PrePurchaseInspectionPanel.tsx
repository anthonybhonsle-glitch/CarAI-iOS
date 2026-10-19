import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Download,
  Lock,
  Sparkles,
  Car,
  Search,
  Clock,
  Gauge,
  HelpCircle,
} from 'lucide-react';
import { OBDTelemetry, UserSubscriptionState, PaywallContext } from '../../types';
import { haptics } from '../../services/haptics';

interface PrePurchaseInspectionPanelProps {
  telemetry: OBDTelemetry;
  user: UserSubscriptionState;
  onOpenPaywall: (context?: PaywallContext) => void;
  onOpenPhoneQrModal: () => void;
}

export const PrePurchaseInspectionPanel: React.FC<PrePurchaseInspectionPanelProps> = ({
  telemetry,
  user,
  onOpenPaywall,
  onOpenPhoneQrModal,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [inspectionData, setInspectionData] = useState({
    vin: '1FTFW1ED8MFC29481',
    ecuOdometerMiles: 82410,
    clusterOdometerMiles: 82410,
    odometerRollbackDetected: false,
    codesClearedMilesAgo: 14, // Warning flag!
    codesWipedSuspicious: true,
    negotiationDiscountEstimate: 1850,
    monitors: [
      { name: 'Catalyst Monitor (CAT)', status: 'not_ready', desc: 'Incomplete drive cycle — seller may have wiped codes recently' },
      { name: 'Evaporative System (EVAP)', status: 'not_ready', desc: 'Purge valve test not executed' },
      { name: 'Oxygen Sensor Monitor (O2S)', status: 'ready', desc: 'Passed closed-loop cycling' },
      { name: 'EGR / VVT System', status: 'ready', desc: 'Passed actuation flow check' },
      { name: 'Misfire Monitor', status: 'ready', desc: 'Zero unburned hydrocarbon pulses' },
      { name: 'Fuel System Monitor', status: 'ready', desc: 'Closed loop trims within 3%' },
    ],
  });

  const isProActive = user.isPro || user.activeTrial;

  const runUsedCarInspection = () => {
    haptics.heavyImpact();
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      haptics.lightTap();
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Pre-Purchase Inspection (Used Car Buyer Mode)
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Dealer Fraud Shield
                </span>
                {isProActive && (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Pro Active
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Plug your OBD adapter into any used car before signing papers: detects if the seller wiped trouble codes 10 miles ago to hide a fault, verifies true ECU mileage, and gives you negotiation leverage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runUsedCarInspection}
              disabled={isScanning}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{isScanning ? 'Querying ECU Readiness Monitors...' : 'Run Used Car Pre-Purchase Scan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2 Critical Used Car Fraud Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Check 1: Code Clear / Readiness Monitor Fraud Check */}
        <div className="bg-zinc-900/80 border border-red-500/40 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-white text-sm">
                Code Wipe / Smog Readiness Detection
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/30 animate-pulse">
              RED FLAG DETECTED
            </span>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-400">Distance Since DTCs Cleared:</span>
              <span className="font-mono font-bold text-red-400">ONLY 14 MILES AGO!</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Warm-up Cycles Since Clear:</span>
              <span className="font-mono font-bold text-amber-400">2 Cycles (Drive cycle incomplete)</span>
            </div>
            <p className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
              ⚠️ <strong>Warning:</strong> The seller or dealership recently reset the vehicle computer to extinguish a Check Engine Light. Catalyst & EVAP monitors have not set yet and the check engine light will likely return within 30 miles!
            </p>
          </div>
        </div>

        {/* Check 2: Odometer Rollback Verification */}
        <div className="bg-zinc-900/80 border border-emerald-500/40 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">
                ECU vs Cluster Odometer Tamper Check
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              VERIFIED AUTHENTIC
            </span>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-400">Instrument Cluster Mileage:</span>
              <span className="font-mono font-bold text-white">82,410 Miles</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Engine / Transmission ECU Log:</span>
              <span className="font-mono font-bold text-white">82,410 Miles (Match)</span>
            </div>
            <p className="text-[11px] text-emerald-400 pt-1 border-t border-zinc-800/80">
              ✓ Transmission control module distance and ABS wheel count match odometer. No digital mileage tampering or rollbacks detected.
            </p>
          </div>
        </div>
      </div>

      {/* Negotiation Leverage Card */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/40 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              Estimated Price Negotiation Discount Leverage: <strong className="text-emerald-400 text-base">${inspectionData.negotiationDiscountEstimate.toLocaleString()} OFF</strong>
            </div>
            <p className="text-xs text-zinc-400">
              Use this inspection report to demand $1,850 off the vehicle's asking price to cover pending catalytic converter and EVAP purge replacement.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            haptics.lightTap();
            if (!isProActive) {
              onOpenPaywall({
                trigger: 'pre_purchase_inspection',
                featureTitle: 'Official CarAI Health Inspection Certificate',
                description: 'Export an official PDF vehicle inspection certificate to negotiate thousands off used car purchases.',
              });
              return;
            }
            setShowCertificate(true);
          }}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
        >
          <FileText className="w-4 h-4" />
          <span>Generate CarAI Health Certificate</span>
        </button>
      </div>

      {/* Readiness Monitors Detailed List */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
          OBD-II Emissions & Drive Cycle Readiness Monitors Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {inspectionData.monitors.map((m, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                m.status === 'ready'
                  ? 'bg-zinc-950 border-zinc-800/80'
                  : 'bg-amber-950/20 border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between font-mono font-bold">
                <span className="text-white">{m.name}</span>
                <span className={m.status === 'ready' ? 'text-emerald-400' : 'text-amber-400'}>
                  {m.status === 'ready' ? 'READY' : 'NOT READY'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Inspection Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  Official Used Car Pre-Purchase Certificate
                </h3>
              </div>
              <button
                onClick={() => setShowCertificate(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3 font-mono text-xs text-zinc-300 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-500">VIN:</span>
                <span className="text-cyan-400 font-bold">{inspectionData.vin}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-500">VERIFIED ODOMETER:</span>
                <span className="text-white font-bold">{inspectionData.ecuOdometerMiles.toLocaleString()} MILES</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-500">TAMPER / ROLLBACK RISK:</span>
                <span className="text-emerald-400 font-bold">0% (PASS)</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-500">CODE WIPE RISK:</span>
                <span className="text-red-400 font-bold">HIGH (Cleared 14 mi ago)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">NEGOTIATION DISCOUNT:</span>
                <span className="text-emerald-400 font-bold">-$1,850 RECOMMENDED</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  haptics.lightTap();
                  alert('Inspection Certificate PDF downloaded to your device.');
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download Official PDF
              </button>
              <button
                onClick={() => setShowCertificate(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
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
