import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  FileText,
  HelpCircle,
  Lock,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Wrench,
  Zap,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { DTCFaultCode, FreezeFrameData, ReadinessMonitor, UserSubscriptionState } from '../types';
import { explainDTCFaultCode } from '../services/apiClient';
import { obdManager } from '../services/obdSimulator';
import { haptics } from '../services/haptics';

interface DiagnosticsScannerProps {
  user: UserSubscriptionState;
  onUpdateUser?: (user: UserSubscriptionState) => void;
  onOpenPaywall: (triggerContext: any) => void;
  onNavigateToCustomizer: (carModel?: string) => void;
  onNavigateToMarketplace: (category?: string) => void;
}

export const DiagnosticsScanner: React.FC<DiagnosticsScannerProps> = ({
  user,
  onUpdateUser,
  onOpenPaywall,
  onNavigateToCustomizer,
  onNavigateToMarketplace,
}) => {
  const [activeDTCs, setActiveDTCs] = useState<string[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('P0101');
  const [explaining, setExplaining] = useState<boolean>(false);
  const [faultData, setFaultData] = useState<DTCFaultCode | null>(null);
  const [serverProUnlocked, setServerProUnlocked] = useState<boolean>(false);
  const [serverPaywallContext, setServerPaywallContext] = useState<any>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [customInputCode, setCustomInputCode] = useState<string>('');
  const [freezeFrame, setFreezeFrame] = useState<FreezeFrameData | null>(null);
  const [readinessMonitors, setReadinessMonitors] = useState<ReadinessMonitor[]>([]);
  const [activeTab, setActiveTab] = useState<'dtc' | 'freeze_frame' | 'readiness'>('dtc');
  const [clearSuccessMsg, setClearSuccessMsg] = useState<string>('');
  const [lockPulse, setLockPulse] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Load initial DTCs and scan data & re-evaluate when user subscription changes
  useEffect(() => {
    const codes = obdManager.getActiveDTCs();
    setActiveDTCs(codes);
    const codeToLoad = selectedCode || (codes.length > 0 ? codes[0] : 'P0101');
    if (codes.length > 0 && !selectedCode) {
      setSelectedCode(codes[0]);
    }
    handleExplainDTC(codeToLoad);
    setFreezeFrame(obdManager.getFreezeFrame());
    setReadinessMonitors(obdManager.getReadinessMonitors());
  }, [user.userId, user.isPro, user.status, user.trialExpired]);

  const handleExplainDTC = async (code: string, autoTriggerPaywallIfLocked: boolean = false) => {
    setSelectedCode(code);
    setExplaining(true);
    try {
      const res = await explainDTCFaultCode(
        code,
        {
          make: 'BMW',
          model: 'M3 Competition',
          year: 2024,
        },
        user.userId
      );

      setFaultData(res.data);
      // Strictly set pro unlocked state ONLY if verified by the server response
      const isUnlocked = Boolean(res.isPro && res.proFeaturesUnlocked);
      setServerProUnlocked(isUnlocked);
      setServerPaywallContext(res.paywallContext);

      if (res.user && onUpdateUser) {
        onUpdateUser(res.user);
      }

      if (!isUnlocked && autoTriggerPaywallIfLocked) {
        onOpenPaywall(
          res.paywallContext || {
            trigger: 'post_diagnostic_scan',
            dtcCode: code,
            dtcTitle: res.data.title || 'Fault Code Detected',
            trialExpired: res.trialExpired,
          }
        );
      }
    } catch (err) {
      console.error('Failed to load DTC explanation:', err);
    } finally {
      setExplaining(false);
    }
  };

  const handleRunFullScan = () => {
    haptics.lightTap();
    setScanning(true);
    setScanProgress(10);
    setClearSuccessMsg('');

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          haptics.mediumSuccess();
          const currentCodes = obdManager.getActiveDTCs();
          setActiveDTCs(currentCodes);
          if (currentCodes.length > 0) {
            handleExplainDTC(currentCodes[0], true);
          }
          return 100;
        }
        return prev + 15;
      });
    }, 140);
  };

  const handleClearCodes = () => {
    haptics.lightTap();
    const res = obdManager.clearDTCs();
    setActiveDTCs([]);
    setFaultData(null);
    setClearSuccessMsg(res.message);
    setReadinessMonitors(obdManager.getReadinessMonitors());
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputCode.trim()) return;
    haptics.lightTap();
    const clean = customInputCode.trim().toUpperCase();
    handleExplainDTC(clean);
  };

  const handleLockTap = () => {
    haptics.lightTap();
    setLockPulse(true);
    setTimeout(() => {
      setLockPulse(false);
      onOpenPaywall(
        serverPaywallContext || {
          trigger: 'post_diagnostic_scan',
          dtcCode: faultData?.code || 'P0101',
          dtcTitle: faultData?.title || 'Fault Diagnostic',
        }
      );
    }, 220);
  };

  return (
    <div id="diagnostics-scanner-view" className="space-y-6">
      {/* Top Diagnostic Action Header */}
      <div className="relative flex flex-col items-start justify-between gap-5 rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 sm:p-8 shadow-xl overflow-hidden sm:flex-row sm:items-center">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="z-10">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-bold tracking-wide text-white sm:text-2xl">
              OBD-II DIAGNOSTIC HEALTH SCANNER
            </h2>
            <span className="rounded-md bg-cyan-500/25 border border-cyan-500/40 px-2.5 py-1 text-xs font-bold text-cyan-200 font-mono-tech">
              ECU Live
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-200 leading-relaxed max-w-2xl font-normal">
            Communicating directly with Powertrain (ECM), Transmission (TCM), and ABS modules via ELM327 CAN protocol.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 z-10">
          <motion.button
            whileTap={{ scale: 0.96 }}
            id="run-full-scan-btn"
            onClick={handleRunFullScan}
            disabled={scanning}
            className="flex items-center gap-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50 min-h-[48px]"
          >
            <RefreshCw className={`h-5 w-5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? `Scanning (${scanProgress}%)...` : 'Run Deep OBD Scan'}</span>
          </motion.button>

          {activeDTCs.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              id="clear-dtc-btn"
              onClick={() => {
                haptics.lightTap();
                setShowClearConfirm(true);
              }}
              className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/15 px-5 py-3.5 text-sm font-bold text-red-200 transition-colors hover:bg-red-500/25 min-h-[48px]"
              title="Clear Check Engine Light & Reset Diagnostic Trouble Codes"
            >
              <Trash2 className="h-5 w-5" />
              <span>Clear DTCs & MIL</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Destructive Clear DTC Action */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-2xl border border-red-500/40 bg-[#14181F] p-6 shadow-2xl relative"
            >
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/40 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Clear Trouble Codes &amp; Reset MIL?
                  </h3>
                  <span className="text-xs text-red-300 font-mono-tech">ECU Command: Mode 04 Clear</span>
                </div>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed mb-6">
                This action will send a reset command to your vehicle's ECU. It permanently clears all stored and pending Diagnostic Trouble Codes (DTCs), turns off the Check Engine Light (MIL), and resets I/M Smog Readiness Monitors.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowClearConfirm(false);
                    handleClearCodes();
                  }}
                  className="w-full sm:flex-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold py-3 text-sm transition-colors min-h-[48px] shadow-lg shadow-red-600/30"
                >
                  Yes, Clear Codes
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="w-full sm:flex-1 rounded-xl bg-[#1A202A] border border-[#2C3440] text-zinc-200 hover:text-white font-bold py-3 text-sm transition-colors min-h-[48px]"
                >
                  Cancel / Keep
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pass / Fail Status Banner */}
      <div className="rounded-2xl border border-[#2C3440] bg-[#0E1116] p-5 shadow-md">
        {activeDTCs.length === 0 ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <span className="font-display text-base font-bold text-white tracking-wide">
                  SYSTEM STATUS: <span className="text-emerald-300">PASS (0 ACTIVE FAULTS)</span>
                </span>
                <p className="text-sm text-zinc-300 mt-0.5">
                  No active diagnostic trouble codes registered in powertrain or safety modules.
                </p>
              </div>
            </div>
            <span className="rounded-xl bg-emerald-500/25 border border-emerald-500/40 px-4 py-2 font-mono-tech text-xs sm:text-sm font-bold text-emerald-200">
              SMOG READY
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <span className="font-display text-base font-bold text-white tracking-wide">
                  SYSTEM STATUS: <span className="text-red-300">FAULTS DETECTED ({activeDTCs.length} DTCs)</span>
                </span>
                <p className="text-sm text-zinc-300 mt-0.5">
                  Diagnostic trouble codes active. Plain-English analysis and fair cost matrix available below.
                </p>
              </div>
            </div>
            <span className="rounded-xl bg-red-500/25 border border-red-500/40 px-4 py-2 font-mono-tech text-xs sm:text-sm font-bold text-red-200">
              ATTENTION REQUIRED
            </span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#2C3440] gap-2 overflow-x-auto">
        <button
          onClick={() => {
            haptics.lightTap();
            setActiveTab('dtc');
          }}
          className={`flex items-center gap-2.5 border-b-2 px-6 py-3.5 text-sm font-bold transition-all min-h-[48px] whitespace-nowrap ${
            activeTab === 'dtc'
              ? 'border-cyan-400 text-cyan-300 bg-[#161B23]/50'
              : 'border-transparent text-zinc-300 hover:text-white hover:bg-[#161B23]/30'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Active Faults ({activeDTCs.length})</span>
        </button>

        <button
          onClick={() => {
            haptics.lightTap();
            setActiveTab('freeze_frame');
          }}
          className={`flex items-center gap-2.5 border-b-2 px-6 py-3.5 text-sm font-bold transition-all min-h-[48px] whitespace-nowrap ${
            activeTab === 'freeze_frame'
              ? 'border-cyan-400 text-cyan-300 bg-[#161B23]/50'
              : 'border-transparent text-zinc-300 hover:text-white hover:bg-[#161B23]/30'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Freeze Frame Sensor Snapshot</span>
        </button>

        <button
          onClick={() => {
            haptics.lightTap();
            setActiveTab('readiness');
          }}
          className={`flex items-center gap-2.5 border-b-2 px-6 py-3.5 text-sm font-bold transition-all min-h-[48px] whitespace-nowrap ${
            activeTab === 'readiness'
              ? 'border-cyan-400 text-cyan-300 bg-[#161B23]/50'
              : 'border-transparent text-zinc-300 hover:text-white hover:bg-[#161B23]/30'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>I/M Smog Emissions Readiness</span>
        </button>
      </div>

      {/* Tab 1: DTC Faults & AI Explainer */}
      {activeTab === 'dtc' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Fault Code Selector List (4 Cols) with Staggered Entrance */}
          <div className="space-y-4 lg:col-span-4">
            {/* Custom Search Box */}
            <form onSubmit={handleCustomSearch} className="relative">
              <input
                type="text"
                placeholder="Search any DTC code (e.g. P0300)..."
                value={customInputCode}
                onChange={(e) => setCustomInputCode(e.target.value)}
                className="w-full rounded-2xl border border-[#2C3440] bg-[#14181F] py-3.5 pl-11 pr-24 text-sm text-white placeholder:text-zinc-400 focus:border-cyan-400 focus:outline-none font-mono-tech min-h-[48px]"
              />
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-400" />
              <button
                type="submit"
                className="absolute right-2 top-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white min-h-[44px] flex items-center justify-center transition-colors"
                aria-label="Search fault code"
              >
                Lookup
              </button>
            </form>

            {/* Active DTC List with Staggered Fade */}
            <div className="rounded-3xl border border-[#2C3440] bg-[#14181F] p-5 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  CURRENT DTC LIST
                </span>
                <span className="font-mono-tech text-sm text-cyan-300 font-bold">
                  {activeDTCs.length} Stored
                </span>
              </div>

              {activeDTCs.length === 0 ? (
                <div className="py-10 text-center text-zinc-400">
                  <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
                  <p className="text-sm font-bold text-zinc-200">Clean ECU Health</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    No diagnostic trouble codes detected in ECU memory.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeDTCs.map((code, index) => {
                    const isSelected = selectedCode === code;
                    return (
                      <motion.button
                        key={code}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: index * 0.04,
                          duration: 0.25,
                          ease: 'easeOut',
                        }}
                        id={`dtc-item-${code}`}
                        onClick={() => {
                          haptics.lightTap();
                          handleExplainDTC(code);
                        }}
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all min-h-[56px] ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500/15 text-white shadow-md'
                            : 'border-[#2C3440] bg-[#1A202A] text-zinc-200 hover:border-[#434F61] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl font-mono-tech font-bold text-sm ${
                              code === 'P0300'
                                ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                                : 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40'
                            }`}
                          >
                            {code.slice(0, 3)}
                          </div>
                          <div>
                            <span className="font-mono-tech text-base font-bold text-white">{code}</span>
                            <p className="line-clamp-1 text-xs text-zinc-300 font-medium">
                              {code === 'P0101'
                                ? 'Mass Air Flow Circuit Range'
                                : code === 'P0300'
                                ? 'Random Multiple Cylinder Misfire'
                                : code === 'P0420'
                                ? 'Catalyst Below Efficiency Threshold'
                                : 'Diagnostic Trouble Code'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold font-mono-tech ${
                            code === 'P0300'
                              ? 'bg-red-500/25 text-red-200 border border-red-500/40'
                              : 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40'
                          }`}
                        >
                          {code === 'P0300' ? 'CRITICAL' : 'WARNING'}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pre-set DTC Demonstrator Library */}
            <div className="rounded-3xl border border-[#2C3440] bg-[#14181F] p-4">
              <p className="mb-2.5 text-xs font-bold text-zinc-300">Inject Sample Fault Codes:</p>
              <div className="flex flex-wrap gap-2">
                {['P0101', 'P0300', 'P0420', 'P0171', 'P0442'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      haptics.lightTap();
                      obdManager.injectDTC(c);
                      setActiveDTCs(obdManager.getActiveDTCs());
                      handleExplainDTC(c);
                    }}
                    className="rounded-xl bg-[#1C222B] border border-[#2E3744] px-4 py-3 text-xs sm:text-sm font-mono-tech font-bold text-zinc-200 hover:bg-cyan-700 hover:text-white transition-colors min-h-[48px] min-w-[72px] flex items-center justify-center"
                    aria-label={`Inject sample code ${c}`}
                  >
                    +{c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Plain-English Explainer & Mechanic Defense (8 Cols) */}
          <div className="lg:col-span-8">
            {explaining ? (
              <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-[#2C3440] bg-[#14181F] p-8 text-center">
                <Sparkles className="mb-4 h-12 w-12 animate-spin text-cyan-400" />
                <h3 className="font-display text-xl font-bold text-white">
                  AI Analyzing DTC {selectedCode}...
                </h3>
                <p className="mt-2 max-w-md text-sm text-zinc-300 leading-relaxed">
                  Retrieving diagnostic test charts, mechanical root causes, fair repair estimate matrix, and upgrade options.
                </p>
              </div>
            ) : faultData ? (
              <div className="space-y-6">
                {/* Main Explainer Hero Card */}
                <div className="rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 sm:p-8 shadow-2xl">
                  {/* Header Badge & Code */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#2C3440] pb-5">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono-tech text-3xl font-bold text-cyan-300">
                          {faultData.code}
                        </span>
                        <span
                          className={`rounded-xl px-3 py-1 text-xs font-bold uppercase font-mono-tech ${
                            faultData.severity === 'critical'
                              ? 'bg-red-500/25 text-red-200 border border-red-500/40'
                              : 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40'
                          }`}
                        >
                          {faultData.severity}
                        </span>
                        <span className="rounded-xl bg-[#1C222B] border border-[#2E3744] px-3 py-1 text-xs text-zinc-200 font-mono-tech font-bold">
                          {faultData.system}
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg sm:text-xl font-bold text-white">
                        {faultData.title}
                      </h3>
                    </div>

                    {/* Pro Unlock Indicator */}
                    {!serverProUnlocked && (
                      <div className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-xs sm:text-sm font-bold text-cyan-200">
                        <Lock className="h-4 w-4" />
                        <span>Free Tier (Basic Code Read)</span>
                      </div>
                    )}
                  </div>

                  {/* Plain English Breakdown (The Core Differentiator) */}
                  <div className="mt-6 space-y-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/25 text-cyan-300">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-300">
                        PLAIN-ENGLISH EXPLANATION (WHAT ACTUALLY BROKE)
                      </h4>
                    </div>

                    {/* Locked State with Breathing Blur-Intensity Animation */}
                    {!serverProUnlocked ? (
                      <motion.div
                        onClick={handleLockTap}
                        animate={
                          lockPulse
                            ? { scale: [1, 1.02, 1], boxShadow: '0 0 25px rgba(6, 182, 212, 0.6)' }
                            : {}
                        }
                        className="relative cursor-pointer overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#0E1116] p-6 transition-all hover:border-cyan-400"
                      >
                        {/* Breathing Blur Text */}
                        <motion.p
                          animate={{ filter: ['blur(3px)', 'blur(5px)', 'blur(3px)'] }}
                          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                          className="line-clamp-3 text-sm text-zinc-400 select-none leading-relaxed"
                        >
                          {faultData.plainEnglishSummary ||
                            'Encrypted Pro Diagnostic: Sensor parameter deviation detected. CarAI Pro subscription required to reveal verified root causes, mechanic defense scripts, and fair labor rate benchmarks.'}
                        </motion.p>

                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0E1116]/95 p-6 text-center backdrop-blur-[2px]">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/25 border border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-500/20"
                          >
                            <Lock className="h-6 w-6" />
                          </motion.div>
                          <h4 className="font-display text-base sm:text-lg font-bold text-white tracking-wide">
                            PRO EXCLUSIVE: Plain-English Diagnostic & Fair Repair Costs
                          </h4>
                          <p className="mt-2 max-w-lg text-sm text-zinc-300 leading-relaxed font-normal">
                            Raw DTC codes are free. Unlock the complete mechanic defense script, DIY fix guide, and exact part numbers to avoid overpaying.
                          </p>
                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            id="unlock-dtc-pro-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLockTap();
                            }}
                            className="mt-4 flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-cyan-600/30 transition-all min-h-[48px]"
                          >
                            <Sparkles className="h-4 w-4 fill-current" />
                            <span>Unlock Repair Guide for {faultData.code}</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="rounded-2xl border border-[#2C3440] bg-[#0E1116] p-5 text-sm sm:text-base leading-relaxed text-zinc-100 font-normal">
                        {faultData.plainEnglishSummary}
                      </div>
                    )}
                  </div>

                  {/* Driving Recommendation & Safety Risk */}
                  {serverProUnlocked && (
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#2C3440] bg-[#1A202A] p-5">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          DRIVING RECOMMENDATION
                        </span>
                        <p className="mt-2 text-sm text-zinc-100 leading-relaxed font-normal">{faultData.drivingRecommendation}</p>
                      </div>

                      <div className="rounded-2xl border border-[#2C3440] bg-[#1A202A] p-5">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          SAFETY & MECHANICAL RISK
                        </span>
                        <p className="mt-2 text-sm text-zinc-100 leading-relaxed font-normal">{faultData.safetyRisk}</p>
                      </div>
                    </div>
                  )}

                  {/* Estimated Repair Cost & Difficulty Matrix (PRO) */}
                  {serverProUnlocked && faultData.estimatedRepairCost && (
                    <div className="mt-6 rounded-2xl border border-[#2C3440] bg-[#1A202A] p-5">
                      <div className="flex items-center justify-between border-b border-[#2C3440] pb-3.5">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-emerald-400" />
                          <span className="text-sm font-bold uppercase text-white tracking-wide">
                            ESTIMATED FAIR REPAIR COST ($ USD)
                          </span>
                        </div>
                        <span className="rounded-lg bg-[#0E1116] border border-[#2E3744] px-3 py-1 text-xs sm:text-sm text-cyan-300 font-mono-tech font-bold">
                          Difficulty: {faultData.diyDifficulty}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center font-mono-tech">
                        <div className="rounded-xl bg-[#0E1116] border border-[#2C3440] p-3.5">
                          <p className="text-xs text-zinc-400 font-bold">DIY Parts Cost</p>
                          <p className="text-base sm:text-lg font-bold text-white mt-1">
                            ${faultData.estimatedRepairCost.averagePartsCost}
                          </p>
                        </div>
                        <div className="rounded-xl bg-[#0E1116] border border-[#2C3440] p-3.5">
                          <p className="text-xs text-zinc-400 font-bold">Shop Labor (Est.)</p>
                          <p className="text-base sm:text-lg font-bold text-white mt-1">
                            {faultData.estimatedRepairCost.laborHours} hrs @ ${faultData.estimatedRepairCost.laborRatePerHour}/hr
                          </p>
                        </div>
                        <div className="rounded-xl bg-[#0E1116] border border-[#2C3440] p-3.5">
                          <p className="text-xs text-zinc-400 font-bold">Fair Shop Min</p>
                          <p className="text-base sm:text-lg font-bold text-emerald-400 mt-1">
                            ${faultData.estimatedRepairCost.min}
                          </p>
                        </div>
                        <div className="rounded-xl bg-[#0E1116] border border-[#2C3440] p-3.5">
                          <p className="text-xs text-zinc-400 font-bold">Fair Shop Max</p>
                          <p className="text-base sm:text-lg font-bold text-cyan-300 mt-1">
                            ${faultData.estimatedRepairCost.max}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mechanic Defense Script (What to ask your repair shop) */}
                  {serverProUnlocked && faultData.mechanicQuestions?.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-5">
                      <div className="flex items-center gap-2.5">
                        <Shield className="h-5 w-5 text-cyan-300" />
                        <h4 className="text-sm font-bold uppercase text-cyan-200 tracking-wide">
                          MECHANIC DEFENSE SCRIPT (ASK BEFORE APPROVING REPAIRS)
                        </h4>
                      </div>
                      <ul className="mt-3 space-y-2.5 text-sm text-zinc-100 font-medium">
                        {faultData.mechanicQuestions.map((q, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="text-cyan-400 font-mono-tech font-bold text-base">•</span>
                            <span className="leading-relaxed">"{q}"</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Step-by-Step DIY Fix */}
                  {serverProUnlocked && faultData.stepByStepFix?.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-[#2C3440] bg-[#1A202A] p-5">
                      <div className="flex items-center gap-2.5">
                        <Wrench className="h-5 w-5 text-amber-400" />
                        <h4 className="text-sm font-bold uppercase text-white tracking-wide">
                          STEP-BY-STEP DIY TROUBLESHOOTING GUIDE
                        </h4>
                      </div>
                      <ol className="mt-4 space-y-3 text-sm text-zinc-100 font-normal">
                        {faultData.stepByStepFix.map((step, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0E1116] border border-[#2E3744] font-mono-tech text-xs font-bold text-cyan-300">
                              {i + 1}
                            </span>
                            <span className="pt-0.5 leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Tab 2: Freeze Frame Sensor Snapshot */}
      {activeTab === 'freeze_frame' && freezeFrame && (
        <div className="rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#2C3440] pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                FREEZE FRAME SENSOR STATE AT FAULT LOG
              </h3>
              <p className="text-sm text-zinc-300 mt-1">
                Exact engine operating parameters captured when ECU flagged DTC {freezeFrame.dtc}
              </p>
            </div>
            <span className="rounded-xl bg-red-500/25 border border-red-500/40 px-3.5 py-1.5 font-mono-tech text-sm font-bold text-red-200">
              Trigger DTC: {freezeFrame.dtc}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 font-mono-tech text-sm">
            <div className="rounded-2xl bg-[#0E1116] border border-[#2C3440] p-4">
              <span className="text-xs text-zinc-400 font-bold">Engine Speed</span>
              <p className="text-lg font-bold text-white mt-1.5">{freezeFrame.rpm} RPM</p>
            </div>
            <div className="rounded-2xl bg-[#0E1116] border border-[#2C3440] p-4">
              <span className="text-xs text-zinc-400 font-bold">Vehicle Speed</span>
              <p className="text-lg font-bold text-cyan-300 mt-1.5">{freezeFrame.speedKmh} km/h</p>
            </div>
            <div className="rounded-2xl bg-[#0E1116] border border-[#2C3440] p-4">
              <span className="text-xs text-zinc-400 font-bold">Coolant Temp</span>
              <p className="text-lg font-bold text-amber-300 mt-1.5">{freezeFrame.coolantTempC}°C</p>
            </div>
            <div className="rounded-2xl bg-[#0E1116] border border-[#2C3440] p-4">
              <span className="text-xs text-zinc-400 font-bold">Calculated Load</span>
              <p className="text-lg font-bold text-emerald-300 mt-1.5">{freezeFrame.calculatedLoad}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: I/M Readiness Monitors */}
      {activeTab === 'readiness' && (
        <div className="rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 sm:p-8 shadow-xl space-y-5">
          <div className="border-b border-[#2C3440] pb-4">
            <h3 className="font-display text-lg font-bold text-white">
              STATE I/M EMISSIONS INSPECTION READINESS
            </h3>
            <p className="text-sm text-zinc-300 mt-1">
              ECU onboard continuous and non-continuous monitor status required for passing state smog tests
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {readinessMonitors.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-2xl border border-[#2C3440] bg-[#0E1116] p-4 sm:p-5"
              >
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">{m.name}</h4>
                  <p className="text-xs sm:text-sm text-zinc-300 mt-0.5">{m.description}</p>
                </div>
                <span
                  className={`rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-mono-tech font-bold ${
                    m.status === 'READY'
                      ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/40'
                      : 'bg-amber-500/25 text-amber-200 border border-amber-500/40'
                  }`}
                >
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
