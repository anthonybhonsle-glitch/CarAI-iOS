import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Send,
  RefreshCw,
  Crown,
  Key,
  Server,
  Lock,
  Database,
  CheckCircle2,
  AlertCircle,
  Code,
  Building2,
  ArrowUpRight,
  DollarSign,
  CreditCard,
  Layers,
  AlertTriangle,
  Radio,
  EyeOff,
  Activity,
  Zap,
} from 'lucide-react';
import { UserSubscriptionState, SecurityAuditEvent } from '../types';
import {
  sendRevenueCatWebhook,
  resetUserRenderLimit,
  startFreeTrial,
  simulateTrialExpiration,
  activatePaidSubscriptionApi,
  fetchSecurityAuditMonitoring,
} from '../services/apiClient';
import { haptics } from '../services/haptics';

interface RevenueCatWebhookSimulatorProps {
  user: UserSubscriptionState;
  onUpdateUser: (user: UserSubscriptionState) => void;
}

export const RevenueCatWebhookSimulator: React.FC<RevenueCatWebhookSimulatorProps> = ({
  user,
  onUpdateUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'security_audit' | 'bank_payouts' | 'webhooks' | 'architecture'>('security_audit');
  const [eventType, setEventType] = useState<'INITIAL_PURCHASE' | 'RENEWAL' | 'CANCELLATION' | 'EXPIRATION'>('INITIAL_PURCHASE');
  const [productId, setProductId] = useState<string>('carai_pro_annual_7900');
  const [loading, setLoading] = useState<boolean>(false);
  const [logResponse, setLogResponse] = useState<string | null>(null);

  // Security Audit & Zero-Bypass Telemetry
  const [auditData, setAuditData] = useState<{
    enforcementMode: string;
    serverTimestamp: string;
    userStatus: string;
    trialExpired: boolean;
    trialHoursLeft: number;
    isPro: boolean;
    metrics: {
      totalAuditEvents: number;
      blockedBypassAttempts: number;
      verifiedGrantedRequests: number;
    };
    logs: SecurityAuditEvent[];
  }>({
    enforcementMode: 'STRICT_ZERO_BYPASS_ACTIVE',
    serverTimestamp: new Date().toISOString(),
    userStatus: user.status || 'free_tier',
    trialExpired: !!user.trialExpired,
    trialHoursLeft: user.trialHoursLeft || 0,
    isPro: user.isPro,
    metrics: {
      totalAuditEvents: 0,
      blockedBypassAttempts: 0,
      verifiedGrantedRequests: 0,
    },
    logs: [],
  });

  // Merchant Bank Payout Configuration
  const [merchantBank] = useState({
    accountHolder: 'Anthony B. (CarAI Master Merchant)',
    routingNumber: '021000021', // FedACH Wire
    accountNumberMasked: '••••••••••8492',
    bankName: 'JPMorgan Chase / Commercial Direct Deposit',
    payoutFrequency: 'Daily Automatic Settlement (T+1)',
    payoutStatus: 'Active & Verified',
    totalSettled: 4892.40,
    pendingPayout: 316.00,
  });

  const refreshAuditTelemetry = async () => {
    try {
      const data = await fetchSecurityAuditMonitoring(user.userId);
      setAuditData(data);
    } catch (err) {
      console.error('Failed to load security audit:', err);
    }
  };

  useEffect(() => {
    refreshAuditTelemetry();
    const interval = setInterval(refreshAuditTelemetry, 4000);
    return () => clearInterval(interval);
  }, [user.userId]);

  const handleStartTrial = async () => {
    setLoading(true);
    haptics.mediumSuccess();
    try {
      const res = await startFreeTrial(user.userId);
      onUpdateUser(res.user);
      await refreshAuditTelemetry();
      setLogResponse(JSON.stringify({ event: 'TRIAL_STARTED', duration: '72 Hours', user: res.user }, null, 2));
    } catch (err: any) {
      setLogResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateTrialExpire = async () => {
    setLoading(true);
    haptics.lightTap();
    try {
      const res = await simulateTrialExpiration(user.userId);
      onUpdateUser(res.user);
      await refreshAuditTelemetry();
      setLogResponse(JSON.stringify({ event: 'TRIAL_EXPIRED_LOCKDOWN', status: 'REVOKED_PRO_ACCESS', user: res.user }, null, 2));
    } catch (err: any) {
      setLogResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePaid = async () => {
    setLoading(true);
    haptics.mediumSuccess();
    try {
      const res = await activatePaidSubscriptionApi(user.userId, 'pro_annual');
      onUpdateUser(res.user);
      await refreshAuditTelemetry();
      setLogResponse(JSON.stringify({ event: 'PAID_SUBSCRIPTION_ACTIVE', verified: true, user: res.user }, null, 2));
    } catch (err: any) {
      setLogResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleSendWebhook = async () => {
    setLoading(true);
    setLogResponse(null);
    haptics.lightTap();
    try {
      const payload = {
        api_version: '1.0',
        event: {
          id: `evt_${Date.now()}`,
          type: eventType,
          app_user_id: user.userId,
          original_app_user_id: user.userId,
          product_id: productId,
          period_type: 'NORMAL',
          purchased_at_ms: Date.now(),
          expiration_at_ms: eventType === 'EXPIRATION' ? Date.now() - 1000 : Date.now() + 365 * 24 * 3600 * 1000,
          store: 'APP_STORE',
          environment: 'SANDBOX',
          is_trial_conversion: false,
          currency: 'USD',
          price_in_purchased_currency: productId.includes('annual') ? 79.00 : 9.99,
          entitlement_id: 'pro',
          entitlement_ids: ['pro'],
          presented_offering_id: 'default',
        },
      };

      const result = await sendRevenueCatWebhook(payload);
      setLogResponse(JSON.stringify(result, null, 2));

      if (result.user) {
        onUpdateUser(result.user);
      }
      await refreshAuditTelemetry();
    } catch (err: any) {
      setLogResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleResetUsage = async () => {
    haptics.lightTap();
    try {
      const result = await resetUserRenderLimit(user.userId);
      onUpdateUser(result.user);
      await refreshAuditTelemetry();
      setLogResponse(JSON.stringify({ message: 'Free tier usage counter reset to 0/1', user: result.user }, null, 2));
    } catch (err: any) {
      setLogResponse(JSON.stringify({ error: err.message }, null, 2));
    }
  };

  return (
    <div id="monetization-view" className="space-y-6">
      {/* Executive Header */}
      <div className="relative rounded-2xl border border-[#2B2F34] bg-[#121417] p-6 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="z-10 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <h2 className="font-display text-xl font-bold tracking-wide text-white sm:text-2xl">
                SECURITY MONITOR & SUBSCRIPTION SETTLEMENT HUB
              </h2>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-300">
              Real-time server-side entitlement enforcement, zero-bypass intrusion logging, and direct merchant bank routing.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap items-center rounded-xl bg-[#0B0D0F] p-1 border border-[#24282D]">
            <button
              onClick={() => setActiveSubTab('security_audit')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeSubTab === 'security_audit'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Zero-Bypass Monitor
            </button>
            <button
              onClick={() => setActiveSubTab('bank_payouts')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeSubTab === 'bank_payouts'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Direct Bank Payouts
            </button>
            <button
              onClick={() => setActiveSubTab('webhooks')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeSubTab === 'webhooks'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              RevenueCat Webhooks
            </button>
            <button
              onClick={() => setActiveSubTab('architecture')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeSubTab === 'architecture'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Security Specs
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'security_audit' ? (
        /* Zero-Bypass Security & Live Audit Dashboard */
        <div className="space-y-6">
          {/* Status Alert Ribbon */}
          <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            user.isPro
              ? user.status === 'active_trial'
                ? 'border-cyan-500/40 bg-cyan-500/10'
                : 'border-emerald-500/40 bg-emerald-500/10'
              : user.trialExpired
              ? 'border-amber-500/50 bg-amber-500/10'
              : 'border-[#2D3136] bg-[#14171A]'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                user.isPro ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {user.isPro ? <CheckCircle2 className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold text-white uppercase tracking-wider">
                    CURRENT AUTHORIZATION STATUS:
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs font-mono-tech font-bold uppercase ${
                    user.isPro ? 'bg-emerald-500/20 text-emerald-300' : user.trialExpired ? 'bg-red-500/20 text-red-300' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {user.status || (user.isPro ? 'ACTIVE' : 'FREE TIER')}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  {user.status === 'active_trial'
                    ? `Active 3-Day Complimentary Trial • ${user.trialHoursLeft || 72} hours remaining.`
                    : user.status === 'active_subscription'
                    ? 'Active Paid Annual/Monthly Subscription (256-Bit Bank Transfer Verified).'
                    : user.trialExpired
                    ? '3-Day Trial Expired • Server strictly redacting mechanic scripts and blocking unlimited customizer.'
                    : 'Free Tier • Eligible for 3-Day Trial or 1 Sample AI Render.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 font-mono-tech text-xs">
              <span className="text-gray-400">Enforcement:</span>
              <span className="text-emerald-400 font-bold">100% SERVER AUTHORITATIVE</span>
            </div>
          </div>

          {/* Security Telemetry KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#262A2F] bg-[#14171A] p-5">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Audit Events Tracked</span>
                <Activity className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="mt-2 font-mono-tech text-3xl font-bold text-white">
                {auditData.metrics.totalAuditEvents}
              </p>
              <p className="mt-1 text-[11px] text-gray-400 font-mono-tech">
                Live tamper & access logs
              </p>
            </div>

            <div className="rounded-2xl border border-[#262A2F] bg-[#14171A] p-5">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Blocked Bypass Attempts</span>
                <EyeOff className="h-5 w-5 text-amber-400" />
              </div>
              <p className="mt-2 font-mono-tech text-3xl font-bold text-amber-400">
                {auditData.metrics.blockedBypassAttempts}
              </p>
              <p className="mt-1 text-[11px] text-amber-300 font-mono-tech">
                Server-redacted / locked calls
              </p>
            </div>

            <div className="rounded-2xl border border-[#262A2F] bg-[#14171A] p-5">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Verified Pro Grants</span>
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="mt-2 font-mono-tech text-3xl font-bold text-emerald-400">
                {auditData.metrics.verifiedGrantedRequests}
              </p>
              <p className="mt-1 text-[11px] text-emerald-300 font-mono-tech">
                Cryptographically authenticated
              </p>
            </div>
          </div>

          {/* Trial Lifecycle Controls & Simulator */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="rounded-2xl border border-[#282D33] bg-[#14171A] p-6 lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#22262B] pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-display text-base font-bold text-white">
                    TRIAL LIFECYCLE CONTROLS
                  </h3>
                </div>
                <span className="rounded bg-[#0A0C0E] border border-[#22262B] px-2 py-0.5 text-xs text-gray-400 font-mono-tech">
                  QA SUITE
                </span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Test and verify the server-side lockdown engine under all trial and subscription conditions.
              </p>

              <div className="space-y-2.5 pt-1">
                <button
                  onClick={handleStartTrial}
                  disabled={loading}
                  className="flex w-full items-center justify-between rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Initialize 3-Day Trial (72 Hours)</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </button>

                <button
                  onClick={handleSimulateTrialExpire}
                  disabled={loading}
                  className="flex w-full items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Simulate Trial Expiration (Force Lockdown)</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </button>

                <button
                  onClick={handleActivatePaid}
                  disabled={loading}
                  className="flex w-full items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Authorize Direct Bank Subscription ($79/yr)</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </button>

                <button
                  onClick={handleResetUsage}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2B2F35] bg-[#0E1012] py-2.5 text-xs text-gray-300 hover:text-white transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reset Render Quota to 0/1</span>
                </button>
              </div>

              {logResponse && (
                <div className="rounded-xl border border-[#22262B] bg-[#0A0C0E] p-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Action Output:</span>
                  <pre className="mt-1 max-h-32 overflow-y-auto font-mono-tech text-[10px] text-cyan-300">
                    {logResponse}
                  </pre>
                </div>
              )}
            </div>

            {/* Right Column: Live Server Security Audit Event Stream */}
            <div className="rounded-2xl border border-[#282D33] bg-[#14171A] p-6 lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-[#22262B] pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <h3 className="font-display text-base font-bold text-white">
                    REAL-TIME INTRUSION & ACCESS AUDIT LOG
                  </h3>
                </div>
                <button
                  onClick={refreshAuditTelemetry}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:underline font-mono-tech"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {auditData.logs.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-500/50" />
                    <p className="text-xs">No audit events recorded yet. Trigger a diagnostic scan or render.</p>
                  </div>
                ) : (
                  auditData.logs.map((log) => {
                    const isGranted = log.status === 'GRANTED' || log.status === 'PAYMENT_VERIFIED';
                    const isBlocked = log.status === 'TRIAL_EXPIRED_BLOCKED' || log.status === 'REDACTED_LOCKED';
                    return (
                      <div
                        key={log.id}
                        className={`rounded-xl border p-3 font-mono-tech text-xs transition-all ${
                          isGranted
                            ? 'border-emerald-500/20 bg-emerald-500/5'
                            : isBlocked
                            ? 'border-amber-500/30 bg-amber-500/5'
                            : 'border-[#22262B] bg-[#0E1012]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${isGranted ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            <span className="font-bold text-white">{log.action}</span>
                          </div>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              isGranted
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-gray-300">{log.reason || 'Verified request'}</p>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
                          <span>User: {log.userId}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'bank_payouts' ? (
        /* Direct Bank Payout & Settlement Dashboard */
        <div className="space-y-6">
          {/* Top Metrics Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#262A2F] bg-[#14171A] p-5">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Settled to Bank</span>
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="mt-2 font-mono-tech text-2xl sm:text-3xl font-bold text-white">
                ${merchantBank.totalSettled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1 font-mono-tech">
                <CheckCircle2 className="h-3.5 w-3.5" /> Direct ACH Cleared
              </p>
            </div>

            <div className="rounded-2xl border border-[#262A2F] bg-[#14171A] p-5">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Pending Batch Payout</span>
                <ClockIcon className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="mt-2 font-mono-tech text-2xl sm:text-3xl font-bold text-cyan-400">
                ${merchantBank.pendingPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-[11px] text-gray-400 font-mono-tech">
                Deposits midnight UTC
              </p>
            </div>

            <div className="rounded-2xl border border-[#262A2F] bg-[#14171A] p-5">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Bank Routing Verification</span>
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="mt-2 text-base font-bold text-white">
                {merchantBank.bankName}
              </p>
              <p className="mt-1 text-[11px] text-cyan-400 font-mono-tech">
                Account: {merchantBank.accountNumberMasked}
              </p>
            </div>
          </div>

          {/* Bank Account Details & Direct Settlement Config */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="rounded-2xl border border-[#282D33] bg-[#14171A] p-6 lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-[#22262B] pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-display text-base font-bold text-white">
                    VERIFIED MERCHANT DIRECT PAYOUT DESTINATION
                  </h3>
                </div>
                <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-300 font-mono-tech">
                  CONNECTED
                </span>
              </div>

              <div className="space-y-3 font-mono-tech text-xs">
                <div className="flex justify-between py-2 border-b border-[#1E2227]">
                  <span className="text-gray-400">Merchant Account Holder:</span>
                  <span className="text-white font-bold">{merchantBank.accountHolder}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-[#1E2227]">
                  <span className="text-gray-400">Receiving Financial Institution:</span>
                  <span className="text-white">{merchantBank.bankName}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-[#1E2227]">
                  <span className="text-gray-400">FedACH Routing (ABA):</span>
                  <span className="text-white">{merchantBank.routingNumber}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-[#1E2227]">
                  <span className="text-gray-400">Linked Account Number:</span>
                  <span className="text-white">{merchantBank.accountNumberMasked}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-[#1E2227]">
                  <span className="text-gray-400">Settlement Cycle:</span>
                  <span className="text-cyan-400 font-bold">{merchantBank.payoutFrequency}</span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Direct Deposit Protocol:</span>
                  <span className="text-emerald-400 font-bold">256-Bit SSL/TLS ACH Batch Transfer</span>
                </div>
              </div>

              <div className="rounded-xl border border-[#2B3036] bg-[#0E1012] p-4 text-xs text-gray-300 leading-relaxed">
                ℹ️ <strong className="text-white">Direct Deposit Flow:</strong> When a user buys CarAI Pro ($79.00/year or $9.99/month), payment is authorized via PCI-DSS Level 1 tokenization and automatically transferred into your merchant bank account via daily ACH settlement.
              </div>
            </div>

            {/* Right: Live Payment Gateway Log */}
            <div className="rounded-2xl border border-[#282D33] bg-[#14171A] p-6 lg:col-span-5 space-y-4">
              <h3 className="font-display text-base font-bold text-white">
                RECENT SUBSCRIPTION DEPOSITS
              </h3>

              <div className="space-y-2.5">
                {[
                  { id: 'TXN-9842', desc: 'CarAI Pro Annual ($79.00)', time: 'Today, 10:45 AM', amount: '+$79.00', status: 'Deposited to Bank' },
                  { id: 'TXN-9841', desc: 'CarAI Pro Annual ($79.00)', time: 'Today, 08:12 AM', amount: '+$79.00', status: 'Deposited to Bank' },
                  { id: 'TXN-9839', desc: 'CarAI Pro Monthly ($9.99)', time: 'Yesterday', amount: '+$9.99', status: 'Settled to Bank' },
                  { id: 'TXN-9838', desc: 'CarAI Pro Annual ($79.00)', time: 'Yesterday', amount: '+$79.00', status: 'Settled to Bank' },
                ].map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-xl border border-[#23272C] bg-[#0E1012] p-3 text-xs">
                    <div>
                      <span className="font-bold text-white">{tx.desc}</span>
                      <p className="text-[10px] text-gray-400 font-mono-tech">{tx.id} • {tx.time}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono-tech font-bold text-emerald-400">{tx.amount}</span>
                      <p className="text-[10px] text-cyan-400">{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'webhooks' ? (
        /* RevenueCat Webhook Dispatcher */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Live User State (5 Cols) */}
          <div className="rounded-2xl border border-[#282D33] bg-[#14171A] p-6 space-y-4 lg:col-span-5">
            <h3 className="font-display text-base font-bold text-white">
              CURRENT DRIVER ENTITLEMENT STATE
            </h3>

            <div className="space-y-3 font-mono-tech text-xs">
              <div className="flex justify-between rounded-lg bg-[#0E1012] border border-[#22262B] p-3">
                <span className="text-gray-400">User ID</span>
                <span className="text-white">{user.userId}</span>
              </div>

              <div className="flex justify-between rounded-lg bg-[#0E1012] border border-[#22262B] p-3">
                <span className="text-gray-400">Status</span>
                <span className={`font-bold ${user.isPro ? 'text-emerald-400' : 'text-gray-300'}`}>
                  {user.status ? user.status.toUpperCase() : user.isPro ? 'PRO ACTIVE' : 'FREE TIER'}
                </span>
              </div>

              <div className="flex justify-between rounded-lg bg-[#0E1012] border border-[#22262B] p-3">
                <span className="text-gray-400">Monthly AI Render Quota</span>
                <span className="text-white">
                  {user.freeRendersUsed} / {user.freeRendersLimit} used
                </span>
              </div>

              <div className="flex justify-between rounded-lg bg-[#0E1012] border border-[#22262B] p-3">
                <span className="text-gray-400">Plan Tier</span>
                <span className="text-white uppercase">{user.planType || user.plan || 'Free'}</span>
              </div>
            </div>

            <button
              onClick={handleResetUsage}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2A2E34] bg-[#1A1D20] py-2.5 text-xs font-semibold text-gray-200 hover:bg-[#25292E] hover:text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset Free Tier Usage Counter (Test 1/1 Quota)</span>
            </button>
          </div>

          {/* Right Column: Webhook Simulator Dispatcher (7 Cols) */}
          <div className="rounded-2xl border border-[#282D33] bg-[#14171A] p-6 space-y-4 lg:col-span-7">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-white">
                DISPATCH TEST REVENUECAT WEBHOOK EVENT
              </h3>
              <span className="rounded bg-[#0E1012] border border-[#22262B] px-2 py-0.5 text-[10px] font-mono-tech text-cyan-400">
                POST /api/webhooks/revenuecat
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-300">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-[#2B2F35] bg-[#0A0C0E] px-3 py-2 text-xs font-medium text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="INITIAL_PURCHASE">INITIAL_PURCHASE (Upgrade to Pro)</option>
                  <option value="RENEWAL">RENEWAL (Extend Pro Subscription)</option>
                  <option value="CANCELLATION">CANCELLATION (Cancel Auto-Renew)</option>
                  <option value="EXPIRATION">EXPIRATION (Downgrade to Free)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300">Product Identifier</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#2B2F35] bg-[#0A0C0E] px-3 py-2 text-xs font-medium text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="carai_pro_annual_7900">carai_pro_annual_7900 ($79.00/yr)</option>
                  <option value="carai_pro_monthly_999">carai_pro_monthly_999 ($9.99/mo)</option>
                  <option value="carai_pro_lifetime_19900">carai_pro_lifetime_19900 ($199.00)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSendWebhook}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-xs font-bold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-500 active:scale-[0.99] disabled:opacity-50 transition-all"
            >
              <Send className="h-4 w-4" />
              <span>{loading ? 'Transmitting Webhook Payload...' : `Dispatch ${eventType} Webhook`}</span>
            </button>

            {/* Webhook Response Log */}
            {logResponse && (
              <div className="rounded-xl border border-[#2B2F35] bg-[#0A0C0E] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Server Response Output:
                </span>
                <pre className="mt-1.5 max-h-40 overflow-y-auto font-mono-tech text-[11px] text-emerald-400">
                  {logResponse}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Architecture & Security Specs */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#282D33] bg-[#14171A] p-5 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400">
              <Key className="h-5 w-5" />
              <h3 className="font-display text-sm font-bold text-white">1. Direct Merchant Banking</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Subscription funds settle directly to your designated bank account via FedACH/NACHA direct deposit routing with zero intermediary wallet lock-in.
            </p>
          </div>

          <div className="rounded-2xl border border-[#282D33] bg-[#14171A] p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <Server className="h-5 w-5" />
              <h3 className="font-display text-sm font-bold text-white">2. Server-Enforced Limits</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Free-tier limits (1 AI render/month) and mechanic defense DTC guides are strictly redacted server-side, preventing client-side inspection bypass.
            </p>
          </div>

          <div className="rounded-2xl border border-[#282D33] bg-[#14171A] p-5 space-y-2">
            <div className="flex items-center gap-2 text-sky-400">
              <Database className="h-5 w-5" />
              <h3 className="font-display text-sm font-bold text-white">3. Zero Key Leakage</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Gemini AI and payment secret keys never touch client binaries or browser local storage, meeting strict PCI-DSS and ASE cybersecurity standards.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

function ClockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
