import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crown,
  Sparkles,
  X,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Lock,
  CreditCard,
  Building2,
  Check,
  Shield,
  FileText,
  Copy,
} from 'lucide-react';
import { UserSubscriptionState, PaywallContext, PaywallTrigger, BankTransaction } from '../types';
import { processDirectBankCheckoutApi } from '../services/apiClient';
import { haptics } from '../services/haptics';
import { authService } from '../services/authService';
import { useI18n } from '../i18n/I18nProvider';

export type { PaywallTrigger };

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSubscriptionState;
  onUpdateUser: (user: UserSubscriptionState) => void;
  triggerContext?: PaywallContext & { trialExpired?: boolean; step?: 'select' | 'checkout' };
  onNavigateToPaymentPage?: (plan?: 'annual' | 'biannual' | 'monthly') => void;
}

const FEATURES = [
  'In-Car Display & Cockpit HUD: Native Android Auto & Android Automotive OS screen projection',
  'Complete Real-Time CAN Diagnostics: Engine Thermal radar, Urea (AdBlue) %, TPMS & Ambient LED sync',
  'Mechanic Rip-Off Defense: Exact parts cost & fair labor rates ($620+ avg. savings)',
  'Complete Plain-English DTC Explanations & Step-by-Step DIY Repair Guides',
  'Catalytic Converter & Blinking MIL Engine Damage Safety Risk Analyzer',
  'State I/M Smog Test Readiness & Continuous Sensor Monitor Verifier',
  'Unlimited Generative AI Car Stance, Aero & Wheel Modifications',
  'Itemized Parts Spec Sheets with Direct OEM & Performance Fitment Links',
];

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  triggerContext,
  onNavigateToPaymentPage,
}) => {
  const { t } = useI18n();
  // Annual plan is pre-selected default: $79/yr (or $39.99/6mo or $9.99/mo)
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'biannual' | 'monthly'>('annual');
  const [paymentStep, setPaymentStep] = useState<'select' | 'checkout' | 'receipt'>(
    triggerContext?.step === 'checkout' ? 'checkout' : 'select'
  );
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'bank_ach'>('card');
  const [cardNumber, setCardNumber] = useState('4000 1234 5678 4242');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('842');
  const [billingZip, setBillingZip] = useState('90210');
  const [cardholderName, setCardholderName] = useState('Alex Vance');
  const [bankRoutingNumber, setBankRoutingNumber] = useState('021000021');
  const [bankAccountNumber, setBankAccountNumber] = useState('9876543210');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingPhase, setLoadingPhase] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedTransaction, setConfirmedTransaction] = useState<BankTransaction | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);

  React.useEffect(() => {
    if (triggerContext?.step === 'checkout') {
      setPaymentStep('checkout');
    }
  }, [triggerContext?.step]);

  if (!isOpen) return null;

  const currentContext = triggerContext || {};
  const trigger = currentContext.trigger || 'manual';
  const isTrialExpired = Boolean(user.trialExpired || currentContext.trialExpired || user.status === 'trial_expired');

  const handleQuickFillCard = (type: 'visa' | 'mastercard') => {
    haptics.lightTap();
    if (type === 'visa') {
      setCardNumber('4000 1234 5678 4242');
      setCardExpiry('08/28');
      setCardCvc('842');
      setCardholderName('Alex Vance');
    } else {
      setCardNumber('5555 5555 5555 4444');
      setCardExpiry('11/29');
      setCardCvc('382');
      setCardholderName('Jordan Reed');
    }
  };

  const handleFast1ClickPay = async (overrideMethod?: 'card' | 'apple_pay') => {
    haptics.mediumSuccess();
    setLoading(true);
    setErrorMessage(null);
    setLoadingPhase('Securing 256-Bit Bank Gateway...');
    const chosenMethod = overrideMethod || paymentMethod;
    const planType =
      selectedPlan === 'annual'
        ? 'pro_annual'
        : selectedPlan === 'biannual'
        ? 'pro_biannual'
        : 'pro_monthly';

    try {
      setTimeout(() => setLoadingPhase('Authorizing Payment Settlement...'), 450);
      const checkoutData = {
        userId: user.userId,
        planType,
        paymentMethod: chosenMethod === 'card' ? 'credit_card' : 'apple_pay',
        cardholderName,
        cardNumber,
        cardExpiry,
        cardCvc,
        billingZip,
        bankRoutingNumber,
        bankAccountNumber,
      };

      const result = await processDirectBankCheckoutApi(checkoutData as any);
      authService.updateSubscription(true, planType);
      onUpdateUser(result.user);
      setConfirmedTransaction(result.transaction);
      setPaymentStep('receipt');
      haptics.heavySuccess();
    } catch (err: any) {
      console.error('Fast checkout failed:', err);
      let friendlyError =
        'Payment authorization could not be completed. Please verify your card or payment information and try again.';
      if (
        err?.message &&
        typeof err.message === 'string' &&
        !err.message.includes('<!doctype') &&
        !err.message.includes('Unexpected') &&
        !err.message.includes('JSON') &&
        !err.message.includes('token') &&
        !err.message.includes('<') &&
        !err.message.includes('500')
      ) {
        friendlyError = err.message;
      }
      setErrorMessage(friendlyError);
      haptics.warning();
    } finally {
      setLoading(false);
      setLoadingPhase('');
    }
  };

  const handleProceedToCheckout = () => {
    haptics.lightTap();
    setErrorMessage(null);
    setPaymentStep('checkout');
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    haptics.mediumSuccess();
    setLoading(true);
    setErrorMessage(null);
    try {
      const planType =
        selectedPlan === 'annual'
          ? 'pro_annual'
          : selectedPlan === 'biannual'
          ? 'pro_biannual'
          : 'pro_monthly';
      const checkoutData = {
        userId: user.userId,
        planType,
        paymentMethod: paymentMethod === 'card' ? 'credit_card' : paymentMethod === 'bank_ach' ? 'bank_ach' : 'apple_pay',
        cardholderName,
        cardNumber,
        cardExpiry,
        cardCvc,
        billingZip,
        bankRoutingNumber,
        bankAccountNumber,
      };

      const result = await processDirectBankCheckoutApi(checkoutData as any);
      authService.updateSubscription(true, planType);
      onUpdateUser(result.user);
      setConfirmedTransaction(result.transaction);
      setPaymentStep('receipt');
    } catch (err: any) {
      console.error('Direct secure checkout failed:', err);
      let friendlyError =
        'Payment authorization could not be completed. Please verify your card or payment information and try again.';
      if (
        err?.message &&
        typeof err.message === 'string' &&
        !err.message.includes('<!doctype') &&
        !err.message.includes('Unexpected') &&
        !err.message.includes('JSON') &&
        !err.message.includes('token') &&
        !err.message.includes('<') &&
        !err.message.includes('500')
      ) {
        friendlyError = err.message;
      }
      setErrorMessage(friendlyError);
      haptics.warning();
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReceipt = () => {
    if (!confirmedTransaction) return;
    const text = `CarAI Pro Subscription Receipt\nTransaction ID: ${confirmedTransaction.transactionId}\nReceipt #: ${confirmedTransaction.receiptNumber}\nAuth Code: ${confirmedTransaction.authCode}\nAmount: $${confirmedTransaction.amount.toFixed(2)} USD\nSettlement: ${confirmedTransaction.bankSettlementNetwork}\nStatus: ${confirmedTransaction.status}\nDate: ${confirmedTransaction.timestamp}`;
    navigator.clipboard?.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/90 p-3 sm:p-6 backdrop-blur-lg overflow-y-auto pt-10 sm:pt-8 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{
          type: 'spring',
          damping: 26,
          stiffness: 300,
          mass: 0.8,
        }}
        className="relative my-2 sm:my-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-[#2C3440] bg-[#14181F] p-4 sm:p-8 shadow-2xl"
      >
        {/* Subtle executive glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Top App Bar with Back Navigation & Close Button */}
        <div className="flex items-center justify-between border-b border-[#2C3440] pb-3 mb-4 relative z-20">
          <button
            type="button"
            onClick={() => {
              haptics.lightTap();
              if (paymentStep !== 'select') {
                setPaymentStep('select');
                setErrorMessage(null);
              } else {
                onClose();
              }
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#1A202A] border border-[#2C3440] px-3.5 py-2 text-xs sm:text-sm font-bold text-zinc-200 hover:text-white transition-colors min-h-[48px] min-w-[48px]"
            aria-label={paymentStep !== 'select' ? 'Back to plan selection' : 'Back to App Dashboard'}
          >
            <ArrowLeft className="h-4 w-4 text-cyan-400" />
            <span>{paymentStep !== 'select' ? 'Back' : 'Dashboard'}</span>
          </button>

          <span className="text-xs sm:text-sm font-display font-bold text-zinc-300 uppercase tracking-wider">
            {paymentStep === 'checkout' ? 'Direct Checkout' : paymentStep === 'receipt' ? 'Payment Receipt' : 'Membership Plans'}
          </span>

          <button
            type="button"
            onClick={() => {
              haptics.lightTap();
              setPaymentStep('select');
              setErrorMessage(null);
              onClose();
            }}
            className="flex items-center justify-center rounded-xl bg-[#1A202A] border border-[#2C3440] p-2.5 text-zinc-300 hover:text-white transition-colors min-h-[48px] min-w-[48px]"
            aria-label="Close membership modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {paymentStep === 'select' ? (
          <>
            {/* Dynamic Context Header Based on Trigger */}
            {isTrialExpired ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-2xl border border-amber-500/50 bg-amber-500/15 p-4 sm:p-5 relative z-10"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                  <span className="font-mono-tech text-sm sm:text-base font-bold text-amber-200">
                    3-DAY COMPLIMENTARY TRIAL CONCLUDED
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-200 leading-relaxed font-normal">
                  Your trial window has ended. To maintain uninterrupted access to real-time mechanic overcharge protection and unlimited AI car modifications, please select a subscription plan below.
                </p>
              </motion.div>
            ) : trigger === 'post_diagnostic_scan' ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-2xl border border-red-500/40 bg-red-500/15 p-4 sm:p-5 relative z-10"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                  <span className="font-mono-tech text-sm sm:text-base font-bold text-red-200">
                    DIAGNOSTIC SCAN ALERT: {currentContext.dtcCode || 'FAULT CODES DETECTED'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-200 leading-relaxed font-normal">
                  Unlock the verified mechanic defense script, estimated repair labor costs, and DIY step-by-step fix guide.
                </p>
              </motion.div>
            ) : trigger === 'post_first_ai_render' ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-2xl border border-cyan-500/40 bg-cyan-500/15 p-4 sm:p-5 relative z-10"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-5 w-5 text-cyan-400 shrink-0" />
                  <span className="font-mono-tech text-sm sm:text-base font-bold text-cyan-200">
                    FREE SAMPLE RENDER COMPLETE: {currentContext.modTitle || 'Vehicle Stance'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-200 leading-relaxed font-normal">
                  Upgrade to CarAI Pro for unlimited high-definition renders, stance modifications, and fitment parts spec sheets.
                </p>
              </motion.div>
            ) : trigger === 'usage_limit_reached' ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-2xl border border-cyan-500/40 bg-cyan-500/15 p-4 sm:p-5 relative z-10"
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="h-5 w-5 text-cyan-400 shrink-0" />
                  <span className="font-mono-tech text-sm sm:text-base font-bold text-cyan-200">
                    MONTHLY FREE QUOTA REACHED (1 / 1 RENDER)
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-200 leading-relaxed font-normal">
                  Standard free access provides 1 render/month. Unlock unlimited studio modifications and complete diagnostic telemetry with Pro.
                </p>
              </motion.div>
            ) : trigger === 'custom_prompt_input' ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-2xl border border-cyan-500/40 bg-cyan-500/15 p-4 sm:p-5 relative z-10"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-5 w-5 text-cyan-400 shrink-0" />
                  <span className="font-mono-tech text-sm sm:text-base font-bold text-cyan-200">
                    PRO FEATURE: CUSTOM PROMPT TUNING
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-200 leading-relaxed font-normal">
                  Direct Gemini LLM prompt control and custom styling prompts are exclusive to CarAI Pro members.
                </p>
              </motion.div>
            ) : trigger === 'performance_timer' ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-2xl border border-amber-500/40 bg-amber-500/15 p-4 sm:p-5 relative z-10"
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="h-5 w-5 text-amber-400 shrink-0" />
                  <span className="font-mono-tech text-sm sm:text-base font-bold text-amber-200">
                    PRO TELEMETRY: 0-60 PERFORMANCE SPRINT & DYNO RECORDER
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-200 leading-relaxed font-normal">
                  Real-time acceleration pulls, 60ft splits, and dyno horsepower logs are available on CarAI Pro.
                </p>
              </motion.div>
            ) : trigger === 'freeze_frame' ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-2xl border border-cyan-500/40 bg-cyan-500/15 p-4 sm:p-5 relative z-10"
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="h-5 w-5 text-cyan-400 shrink-0" />
                  <span className="font-mono-tech text-sm sm:text-base font-bold text-cyan-200">
                    PRO FEATURE: 20Hz ECU STREAM & FREEZE-FRAME SNAPSHOTS
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-200 leading-relaxed font-normal">
                  High-frequency PID streaming and automatic freeze-frame fault capture are exclusive to CarAI Pro.
                </p>
              </motion.div>
            ) : trigger === 'garage_multi_vehicle' ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-2xl border border-cyan-500/40 bg-cyan-500/15 p-4 sm:p-5 relative z-10"
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="h-5 w-5 text-cyan-400 shrink-0" />
                  <span className="font-mono-tech text-sm sm:text-base font-bold text-cyan-200">
                    PRO FEATURE: UNLIMITED MULTI-VEHICLE CLOUD GARAGE
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-200 leading-relaxed font-normal">
                  Free tier includes 1 active vehicle slot. Upgrade to Pro for unlimited vehicle profiles and cloud service records.
                </p>
              </motion.div>
            ) : null}

            {/* Main Title & Crown */}
            <div className="text-center relative z-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-xl shadow-cyan-600/30">
                <Crown className="h-8 w-8 fill-current" />
              </div>
              <h3 className="mt-4 font-display text-2xl sm:text-3xl font-bold tracking-wide text-white">
                CAR<span className="text-cyan-400">AI</span> PRO MEMBERSHIP
              </h3>
              <p className="mt-2 text-sm sm:text-base text-zinc-200 max-w-lg mx-auto leading-relaxed font-normal">
                Professional vehicle diagnostics, ASE-grade mechanic overcharge protection, and complete styling tools.
              </p>
            </div>

            {/* Features Checklist with High-Contrast Layout for Clear Reading */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 relative z-10">
              {FEATURES.map((feat, i) => (
                <motion.div
                  key={feat}
                  initial={{ opacity: 0, x: -10, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    delay: 0.1 + i * 0.05,
                    type: 'spring',
                    stiffness: 350,
                    damping: 22,
                  }}
                  className="flex items-start gap-3 rounded-2xl border border-[#2C3440] bg-[#1A202A] p-3.5 sm:p-4 text-xs sm:text-sm text-zinc-100 font-medium"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="leading-relaxed">{feat}</span>
                </motion.div>
              ))}
            </div>

            {/* Pricing Plan Selector ($9.99/mo & $79/yr) - Fully Responsive for all mobile screens */}
            <div className="mt-6 space-y-4 relative z-10">
              {/* Annual Plan (Pre-selected default with 3-Day Free Trial) */}
              <button
                type="button"
                onClick={() => {
                  haptics.lightTap();
                  setSelectedPlan('annual');
                }}
                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full rounded-2xl border p-4 sm:p-6 text-left transition-all min-h-[56px] pt-6 sm:pt-6 ${
                  selectedPlan === 'annual'
                    ? 'border-cyan-400 bg-cyan-500/15 shadow-xl ring-2 ring-cyan-400/50'
                    : 'border-[#2C3440] bg-[#1A202A] hover:border-[#3A4556]'
                }`}
              >
                <div className="absolute -top-3 left-4 sm:left-auto sm:right-4 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-0.5 text-[11px] sm:text-xs font-bold text-white shadow-md font-mono-tech whitespace-nowrap">
                  MOST POPULAR • 3-DAY TRIAL
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base sm:text-xl font-bold text-white">Annual Membership</span>
                    <span className="rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[11px] sm:text-xs font-bold text-cyan-300 font-mono-tech whitespace-nowrap">
                      SAVE 34%
                    </span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-zinc-200 font-normal leading-relaxed break-words">
                    Full 3 days free trial, then $79.00 billed annually ($6.58/mo). Cancel anytime.
                  </p>
                </div>

                <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center font-mono-tech shrink-0 pt-2 sm:pt-0 border-t border-[#2C3440]/60 sm:border-t-0">
                  <span className="text-2xl sm:text-3xl font-bold text-cyan-300">$79.00</span>
                  <span className="text-xs text-zinc-300"> / year</span>
                </div>
              </button>

              {/* 6 Months Plan ($39.99 / 6 mo) */}
              <button
                type="button"
                onClick={() => {
                  haptics.lightTap();
                  setSelectedPlan('biannual');
                }}
                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full rounded-2xl border p-4 sm:p-6 text-left transition-all min-h-[56px] ${
                  selectedPlan === 'biannual'
                    ? 'border-cyan-400 bg-cyan-500/15 shadow-xl ring-2 ring-cyan-400/50'
                    : 'border-[#2C3440] bg-[#1A202A] hover:border-[#3A4556]'
                }`}
              >
                <div className="absolute -top-3 left-4 sm:left-auto sm:right-4 rounded-full bg-cyan-600/80 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-cyan-100 border border-cyan-400/40 font-mono-tech whitespace-nowrap">
                  SEMI-ANNUAL • SAVE 33%
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base sm:text-xl font-bold text-white">6-Month Plan</span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-zinc-200 font-normal leading-relaxed break-words">
                    Billed every 6 months at $39.99 ($6.66/mo). High savings with zero long-term contract.
                  </p>
                </div>
                <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center font-mono-tech shrink-0 pt-2 sm:pt-0 border-t border-[#2C3440]/60 sm:border-t-0">
                  <span className="text-2xl sm:text-3xl font-bold text-cyan-200">$39.99</span>
                  <span className="text-xs text-zinc-300"> / 6 mo</span>
                </div>
              </button>

              {/* Monthly Plan ($9.99/mo) */}
              <button
                type="button"
                onClick={() => {
                  haptics.lightTap();
                  setSelectedPlan('monthly');
                }}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full rounded-2xl border p-4 sm:p-6 text-left transition-all min-h-[56px] ${
                  selectedPlan === 'monthly'
                    ? 'border-cyan-400 bg-cyan-500/15 shadow-xl ring-2 ring-cyan-400/50'
                    : 'border-[#2C3440] bg-[#1A202A] hover:border-[#3A4556]'
                }`}
              >
                <div className="flex-1 min-w-0 pr-1">
                  <span className="font-display text-base sm:text-xl font-bold text-white">Monthly Flex Plan</span>
                  <p className="mt-1 text-xs sm:text-sm text-zinc-200 font-normal leading-relaxed break-words">
                    Billed monthly at $9.99. No contracts, cancel whenever you like.
                  </p>
                </div>
                <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center font-mono-tech shrink-0 pt-2 sm:pt-0 border-t border-[#2C3440]/60 sm:border-t-0">
                  <span className="text-2xl sm:text-3xl font-bold text-zinc-100">$9.99</span>
                  <span className="text-xs text-zinc-300"> / month</span>
                </div>
              </button>
            </div>

            {/* Direct Payout Guarantee & Proceed Button */}
            <div className="mt-6 relative z-10 space-y-3">
              {/* Express 1-Click Pay for instant < 15s completion */}
              <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-[#101A26] to-[#0D141F] p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-mono-tech text-cyan-300">
                  <Zap className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span className="font-bold">⚡ EXPRESS 1-CLICK PAY (&lt; 15 SECONDS)</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleFast1ClickPay('apple_pay')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 px-3 py-2 text-xs font-bold text-white min-h-[44px]"
                  >
                    <Zap className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Apple / Google Pay</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleFast1ClickPay('card')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 border border-cyan-500/50 px-3 py-2 text-xs font-bold text-white min-h-[44px]"
                  >
                    <CreditCard className="h-3.5 w-3.5 text-cyan-200" />
                    <span>Instant Card Pay</span>
                  </button>
                </div>
              </div>

              <motion.button
                id="proceed-to-secure-checkout-btn"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleProceedToCheckout}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-cyan-700 hover:bg-cyan-600 py-4 text-base font-bold text-white shadow-xl shadow-cyan-900/30 transition-all min-h-[52px]"
                aria-label="Proceed to secure checkout"
              >
                <Lock className="h-5 w-5" />
                <span>
                  {selectedPlan === 'annual'
                    ? 'Continue with 3-Day Free Trial ($79/yr)'
                    : selectedPlan === 'biannual'
                    ? 'Continue with 6-Month Plan ($39.99/6mo)'
                    : 'Continue with Monthly Plan ($9.99/mo)'}
                </span>
                <ArrowRight className="h-5 w-5" />
              </motion.button>

              {onNavigateToPaymentPage && (
                <button
                  type="button"
                  onClick={() => {
                    haptics.lightTap();
                    onClose();
                    onNavigateToPaymentPage(selectedPlan);
                  }}
                  className="w-full text-center text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline min-h-[40px] flex items-center justify-center"
                >
                  Open Full Dedicated Payment &amp; Subscription Page &rarr;
                </button>
              )}

              {/* Direct Bank Settlement Guarantee Badge */}
              <div className="mt-2 rounded-2xl border border-[#2C3440] bg-[#0E1116] p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  <span>256-Bit Bank-Grade TLS Encryption • PCI-DSS Level 1 Compliant</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-300">
                  Transactions settle securely through verified direct merchant banking rails.
                </p>
              </div>
            </div>
          </>
        ) : paymentStep === 'checkout' ? (
          /* Step 2: High-Level Payment Security & Direct Bank Settlement Checkout */
          <form onSubmit={handleProcessPayment} className="relative z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2C3440] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display text-lg font-bold text-white">SECURE DIRECT CHECKOUT</h4>
                  <p className="text-xs text-zinc-300">PCI-DSS Level 1 Encrypted Banking Gateway</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentStep('select')}
                className="text-sm font-semibold text-cyan-400 hover:underline min-h-[44px] px-2 flex items-center"
              >
                Change Plan
              </button>
            </div>

            {/* Selected Plan Summary Banner */}
            <div className="flex items-center justify-between rounded-2xl border border-[#2C3440] bg-[#1A202A] p-4">
              <div>
                <span className="text-xs text-zinc-300 uppercase tracking-wider font-bold font-mono-tech">Selected Subscription</span>
                <p className="font-display text-base font-bold text-white mt-0.5">
                  {selectedPlan === 'annual'
                    ? 'CarAI Pro Annual (Includes 3-Day Free Trial)'
                    : selectedPlan === 'biannual'
                    ? 'CarAI Pro 6-Month Plan (Semi-Annual)'
                    : 'CarAI Pro Monthly Flex'}
                </p>
              </div>
              <span className="font-mono-tech text-xl font-bold text-cyan-300">
                {selectedPlan === 'annual'
                  ? '$79.00 / yr'
                  : selectedPlan === 'biannual'
                  ? '$39.99 / 6 mo'
                  : '$9.99 / mo'}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Payment Method</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-xs sm:text-sm font-bold transition-all min-h-[48px] ${
                    paymentMethod === 'card'
                      ? 'border-cyan-400 bg-cyan-500/20 text-white ring-1 ring-cyan-400'
                      : 'border-[#2C3440] bg-[#1A202A] text-zinc-300 hover:text-white'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Credit / Debit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-xs sm:text-sm font-bold transition-all min-h-[48px] ${
                    paymentMethod === 'apple_pay'
                      ? 'border-cyan-400 bg-cyan-500/20 text-white ring-1 ring-cyan-400'
                      : 'border-[#2C3440] bg-[#1A202A] text-zinc-300 hover:text-white'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  <span>Apple / Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_ach')}
                  className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-xs sm:text-sm font-bold transition-all min-h-[48px] ${
                    paymentMethod === 'bank_ach'
                      ? 'border-cyan-400 bg-cyan-500/20 text-white ring-1 ring-cyan-400'
                      : 'border-[#2C3440] bg-[#1A202A] text-zinc-300 hover:text-white'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Bank ACH</span>
                </button>
              </div>
            </div>

            {/* Cardholder / Billing Inputs */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-red-500/50 bg-red-500/15 p-4 text-xs sm:text-sm text-red-200 flex items-start gap-2.5"
              >
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-red-300">Payment Authorization Issue:</span>
                  <p className="mt-0.5 text-zinc-200">{errorMessage}</p>
                </div>
              </motion.div>
            )}

            {paymentMethod === 'card' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Cardholder Full Name</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickFillCard('visa')}
                      className="text-[11px] font-mono-tech text-cyan-400 hover:underline min-h-[36px] flex items-center"
                    >
                      [Fill Visa 4242]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFillCard('mastercard')}
                      className="text-[11px] font-mono-tech text-cyan-400 hover:underline min-h-[36px] flex items-center"
                    >
                      [Fill MC 5555]
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="e.g. Robert J. Sterling"
                  className="mt-1.5 w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] px-4 py-3 text-sm text-white placeholder:text-zinc-400 focus:border-cyan-400 focus:outline-none min-h-[48px]"
                  required
                />

                <div>
                  <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Card Number</label>
                  <div className="relative mt-1.5">
                    <CreditCard className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4000 1234 5678 9010"
                      className="w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] py-3 pl-12 pr-4 text-sm font-mono-tech text-white placeholder:text-zinc-400 focus:border-cyan-400 focus:outline-none min-h-[48px]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Expiration (MM/YY)</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="08/28"
                      className="mt-1.5 w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] px-4 py-3 text-sm font-mono-tech text-white placeholder:text-zinc-400 focus:border-cyan-400 focus:outline-none min-h-[48px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Security CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="•••"
                      className="mt-1.5 w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] px-4 py-3 text-sm font-mono-tech text-white placeholder:text-zinc-400 focus:border-cyan-400 focus:outline-none min-h-[48px]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Postal / ZIP Code</label>
                  <input
                    type="text"
                    value={billingZip}
                    onChange={(e) => setBillingZip(e.target.value)}
                    placeholder="90210"
                    className="mt-1.5 w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] px-4 py-3 text-sm font-mono-tech text-white placeholder:text-zinc-400 focus:border-cyan-400 focus:outline-none min-h-[48px]"
                    required
                  />
                </div>
              </div>
            ) : paymentMethod === 'bank_ach' ? (
              <div className="rounded-2xl border border-[#2C3440] bg-[#1A202A] p-5 space-y-3">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Building2 className="h-5 w-5" />
                  <span className="font-display text-base font-bold text-white">Direct Merchant ACH Settlement</span>
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed font-normal">
                  Automatic electronic bank authorization via FedACH network. Subscription revenues deposit directly to verified merchant account.
                </p>
                <div className="space-y-3 text-sm font-mono-tech">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">Bank Routing Transit Number</label>
                    <input
                      type="text"
                      maxLength={9}
                      value={bankRoutingNumber}
                      onChange={(e) => setBankRoutingNumber(e.target.value)}
                      placeholder="Bank Routing Number (9 Digits)"
                      className="w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] p-3 text-white focus:border-cyan-400 focus:outline-none min-h-[48px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">Checking Account Number</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="Checking Account Number"
                      className="w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] p-3 text-white focus:border-cyan-400 focus:outline-none min-h-[48px]"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#2C3440] bg-[#1A202A] p-5 text-center space-y-2">
                <Zap className="h-8 w-8 text-cyan-400 mx-auto" />
                <p className="text-base font-bold text-white">One-Touch Device Biometric Payment</p>
                <p className="text-sm text-zinc-200 font-normal">
                  Authorize instantly via Face ID, Touch ID, or Google Wallet with direct settlement.
                </p>
              </div>
            )}

            {/* Direct Payout Destination Confirmation */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-4 flex items-start gap-3">
              <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-emerald-300">Merchant Direct Payout Active:</span>
                <p className="text-zinc-200 mt-1 leading-relaxed font-normal">
                  100% of subscription proceeds clear directly to your linked verified merchant bank account on standard daily settlement schedule.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-700 hover:bg-cyan-600 py-4 text-base font-bold text-white shadow-xl shadow-cyan-900/30 transition-all disabled:opacity-50 min-h-[52px]"
                aria-label="Authorize direct transfer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Zap className="h-5 w-5 animate-spin text-cyan-200" />
                    <span>Authorizing 256-Bit Bank Transfer...</span>
                  </span>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    <span>
                      {selectedPlan === 'annual'
                        ? 'Authorize Annual Direct Transfer ($79.00/yr)'
                        : selectedPlan === 'biannual'
                        ? 'Authorize 6-Month Direct Transfer ($39.99/6mo)'
                        : 'Authorize Monthly Direct Transfer ($9.99/mo)'}
                    </span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        ) : (
          /* Step 3: Verified Direct-to-Bank Receipt & Instant Activation Screen */
          <div className="relative z-10 space-y-6 text-center py-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                PAYMENT VERIFIED & SETTLED
              </h3>
              <p className="mt-1 text-sm sm:text-base text-zinc-300 font-normal">
                CarAI Pro subscription successfully activated via direct bank channel.
              </p>
            </div>

            {/* Cryptographic Receipt Box */}
            {confirmedTransaction && (
              <div className="rounded-2xl border border-[#2C3440] bg-[#0E1116] p-5 text-left font-mono-tech text-xs sm:text-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#222934] pb-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <FileText className="h-4 w-4" />
                    <span>SETTLEMENT RECEIPT</span>
                  </div>
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300 font-bold">
                    {confirmedTransaction.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-zinc-300 text-xs">
                  <div>
                    <span className="text-zinc-400 block font-semibold">Transaction ID:</span>
                    <span className="text-white font-bold break-all">{confirmedTransaction.transactionId}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-semibold">Receipt Number:</span>
                    <span className="text-white font-bold">{confirmedTransaction.receiptNumber}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-semibold">Auth Code:</span>
                    <span className="text-cyan-300 font-bold">{confirmedTransaction.authCode}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-semibold">Amount Settled:</span>
                    <span className="text-white font-bold">${confirmedTransaction.amount.toFixed(2)} USD</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-400 block font-semibold">Bank Rails / Settlement Network:</span>
                    <span className="text-zinc-200">{confirmedTransaction.bankSettlementNetwork}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-400 block font-semibold">Encryption:</span>
                    <span className="text-zinc-300">{confirmedTransaction.tlsCipher}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#222934]">
                  <button
                    type="button"
                    role="button"
                    aria-label="Copy Transaction Receipt"
                    onClick={handleCopyReceipt}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 min-h-[48px] py-2 px-1"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="font-semibold">{copiedReceipt ? 'Receipt Copied!' : 'Copy Transaction Receipt'}</span>
                  </button>
                  <span className="text-zinc-400 text-xs font-mono-tech">{new Date(confirmedTransaction.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                haptics.lightTap();
                setPaymentStep('select');
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 hover:bg-cyan-500 py-4 text-base font-bold text-white shadow-xl shadow-cyan-600/30 transition-all min-h-[52px]"
            >
              <Crown className="h-5 w-5 fill-current" />
              <span>Access CarAI Pro Features</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
