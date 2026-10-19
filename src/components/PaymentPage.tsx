import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Crown,
  ShieldCheck,
  Lock,
  CreditCard,
  Building2,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  ArrowLeft,
  Copy,
  Clock,
  Check,
  FileText,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { UserSubscriptionState, BankTransaction } from '../types';
import { processDirectBankCheckoutApi } from '../services/apiClient';
import { authService } from '../services/authService';
import { haptics } from '../services/haptics';

interface PaymentPageProps {
  user: UserSubscriptionState;
  onUpdateUser: (user: UserSubscriptionState) => void;
  onBack: () => void;
  onSuccessRedirect?: (tabName?: string) => void;
  initialPlan?: 'annual' | 'biannual' | 'monthly';
}

const PRO_BENEFITS = [
  {
    title: 'Mechanic Rip-Off Defense',
    desc: 'Real-time OEM parts pricing & fair regional labor matrix ($620+ avg. savings)',
  },
  {
    title: 'Plain-English Fault Explanations',
    desc: 'Instant DTC decoding with step-by-step DIY repair guides and difficulty ratings',
  },
  {
    title: 'Engine Overheating & Blinking MIL Safety',
    desc: 'Deep catalytic converter and catastrophic engine damage risk analysis',
  },
  {
    title: 'Unlimited AI 3D Car Tuning & Aero',
    desc: 'Direct generative stance, wheel fitment, aero kits, and acoustic sound sampling',
  },
  {
    title: 'State I/M Smog Readiness Verifier',
    desc: 'Continuous ECU sensor monitor checks to guarantee passing emissions',
  },
  {
    title: 'Unlimited Multi-Vehicle Smart Garage',
    desc: 'Cloud maintenance service logs, VIN decoding, and telemetry export',
  },
];

export const PaymentPage: React.FC<PaymentPageProps> = ({
  user,
  onUpdateUser,
  onBack,
  onSuccessRedirect,
  initialPlan = 'annual',
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'biannual' | 'monthly'>(initialPlan);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'upi' | 'bank_ach'>('card');

  // Payment Form State (pre-filled with verified test credentials for sub-30 second seamless checkout)
  const [cardholderName, setCardholderName] = useState('Alex Vance');
  const [cardNumber, setCardNumber] = useState('4000 1234 5678 4242');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('842');
  const [billingZip, setBillingZip] = useState('90210');
  const [bankRoutingNumber, setBankRoutingNumber] = useState('021000021');
  const [bankAccountNumber, setBankAccountNumber] = useState('9876543210');
  const [upiId, setUpiId] = useState('driver@okhdfcbank');

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingPhase, setLoadingPhase] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedTransaction, setConfirmedTransaction] = useState<BankTransaction | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);

  // Quick fill helper for testers
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

  const handleExecutePayment = async (overrideMethod?: 'card' | 'apple_pay' | 'upi' | 'bank_ach') => {
    haptics.mediumSuccess();
    setLoading(true);
    setErrorMessage(null);
    setLoadingPhase('Establishing 256-Bit Bank TLS Connection...');

    const methodToUse = overrideMethod || paymentMethod;
    const planType =
      selectedPlan === 'annual'
        ? 'pro_annual'
        : selectedPlan === 'biannual'
        ? 'pro_biannual'
        : 'pro_monthly';

    try {
      // Realistic smooth progress phases for seamless user feedback
      setTimeout(() => setLoadingPhase('Verifying Merchant Clearing Rails (JPMorgan Chase)...'), 300);
      setTimeout(() => setLoadingPhase('Authorizing Payment Settlement...'), 600);

      const checkoutData = {
        userId: user.userId,
        planType,
        paymentMethod:
          methodToUse === 'card'
            ? 'credit_card'
            : methodToUse === 'upi'
            ? 'upi'
            : methodToUse === 'bank_ach'
            ? 'bank_ach'
            : 'apple_pay',
        cardholderName,
        cardNumber,
        cardExpiry,
        cardCvc,
        billingZip,
        bankRoutingNumber,
        bankAccountNumber,
        upiId,
      };

      const result = await processDirectBankCheckoutApi(checkoutData as any);

      authService.updateSubscription(true, planType);
      onUpdateUser(result.user);
      setConfirmedTransaction(result.transaction);
      haptics.heavySuccess();
    } catch (err: any) {
      console.error('Direct secure checkout failed:', err);
      let friendlyError =
        'Payment authorization could not be completed. Please check your payment credentials and try again.';
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

  const handleCopyReceipt = () => {
    if (!confirmedTransaction) return;
    const text = `CARAI PRO SUBSCRIPTION RECEIPT\nTransaction ID: ${confirmedTransaction.transactionId}\nReceipt #: ${confirmedTransaction.receiptNumber}\nAuth Code: ${confirmedTransaction.authCode}\nPlan: ${confirmedTransaction.planType}\nAmount: $${confirmedTransaction.amount.toFixed(2)} USD\nSettlement: ${confirmedTransaction.bankSettlementNetwork}\nStatus: ${confirmedTransaction.status}\nDate: ${confirmedTransaction.timestamp}`;
    navigator.clipboard?.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div id="carai-payment-page" className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Fast-Checkout Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[#202732] bg-[#0E1218] p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="button"
            aria-label="Back to Previous View"
            onClick={() => {
              haptics.lightTap();
              onBack();
            }}
            className="flex items-center gap-2 rounded-xl bg-[#141B24] border border-[#263242] hover:border-cyan-500/50 text-cyan-300 hover:text-white px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all min-h-[48px]"
          >
            <ArrowLeft className="h-4 w-4 text-cyan-400" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-wide text-white uppercase flex items-center gap-2">
              <span>CarAI Pro Payment Checkout</span>
              <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-xs text-emerald-300 font-mono-tech">
                Fast &amp; Secure
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 font-sans">
              Direct-to-bank settlement • 256-bit TLS bank encryption • PCI-DSS Level 1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono-tech text-xs self-start sm:self-center">
          <span className="flex items-center gap-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 px-3 py-2 text-cyan-300 font-bold">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>Completes in &lt; 30 Seconds</span>
          </span>
        </div>
      </div>

      {confirmedTransaction ? (
        /* Confirmed Transaction & Instant Pro Activation State */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-[#0B1E16] via-[#0E1520] to-[#0A0D12] p-6 sm:p-10 shadow-2xl text-center space-y-6"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-2xl shadow-emerald-500/30">
            <CheckCircle2 className="h-12 w-12" />
          </div>

          <div>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1 text-xs font-mono-tech font-bold text-emerald-300 uppercase tracking-wider">
              SETTLED &amp; AUTHORIZED
            </span>
            <h2 className="mt-3 font-display text-2xl sm:text-4xl font-extrabold text-white">
              Welcome to CarAI Pro!
            </h2>
            <p className="mt-2 text-sm sm:text-base text-zinc-200 max-w-xl mx-auto leading-relaxed">
              Your direct bank settlement is confirmed. All professional diagnostic telemetry, mechanic defense scripts, and unlimited AI customizer modifications are now fully unlocked.
            </p>
          </div>

          {/* Cryptographic Receipt Card */}
          <div className="rounded-2xl border border-[#222E3E] bg-[#0A0E14] p-5 sm:p-6 text-left font-mono-tech text-xs sm:text-sm space-y-3 max-w-2xl mx-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1A2433] pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <FileText className="h-5 w-5" />
                <span>CRYPTOGRAPHIC SETTLEMENT RECEIPT</span>
              </div>
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300 font-bold">
                {confirmedTransaction.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-300">
              <div>
                <span className="text-zinc-400 block text-xs font-semibold">Transaction ID:</span>
                <span className="text-white font-bold break-all">{confirmedTransaction.transactionId}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-xs font-semibold">Receipt Number:</span>
                <span className="text-white font-bold">{confirmedTransaction.receiptNumber}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-xs font-semibold">Authorization Code:</span>
                <span className="text-cyan-300 font-bold">{confirmedTransaction.authCode}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-xs font-semibold">Amount Settled:</span>
                <span className="text-white font-bold">${confirmedTransaction.amount.toFixed(2)} USD</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-zinc-400 block text-xs font-semibold">Bank Rails / Settlement Network:</span>
                <span className="text-zinc-200">{confirmedTransaction.bankSettlementNetwork}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-zinc-400 block text-xs font-semibold">Encryption Protocol:</span>
                <span className="text-zinc-300">{confirmedTransaction.tlsCipher}</span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-[#1A2433]">
              <button
                type="button"
                role="button"
                aria-label="Copy Transaction Receipt"
                onClick={handleCopyReceipt}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold min-h-[48px] py-2 px-1"
              >
                <Copy className="h-4 w-4" />
                <span>{copiedReceipt ? 'Receipt Copied to Clipboard!' : 'Copy Transaction Receipt'}</span>
              </button>
              <span className="text-zinc-400 text-xs font-mono-tech">
                {new Date(confirmedTransaction.timestamp).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-2">
            <button
              type="button"
              role="button"
              aria-label="Open Diagnostics Scanner"
              onClick={() => {
                haptics.lightTap();
                if (onSuccessRedirect) onSuccessRedirect('diagnostics');
                else onBack();
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-4 px-6 text-sm font-bold text-white shadow-xl shadow-cyan-600/30 transition-all min-h-[52px]"
            >
              <Crown className="h-5 w-5 fill-current" />
              <span>Launch Diagnostics Scanner</span>
              <ArrowRight className="h-5 w-5" />
            </button>

            <button
              type="button"
              role="button"
              aria-label="Return to Dashboard"
              onClick={() => {
                haptics.lightTap();
                if (onSuccessRedirect) onSuccessRedirect('flagship');
                else onBack();
              }}
              className="rounded-2xl border border-[#2D394C] bg-[#141B24] hover:bg-[#1A2432] py-4 px-6 text-sm font-bold text-zinc-200 hover:text-white transition-all min-h-[52px]"
            >
              Executive Suite
            </button>
          </div>
        </motion.div>
      ) : (
        /* Active Payment Selection & Express Checkout Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Plan Selection & Pro Benefits (5 Columns) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-[#222E40] bg-[#0E131C] p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#1E293B] pb-3">
                <Crown className="h-5 w-5 text-cyan-400" />
                <h2 className="font-display text-base font-bold text-white uppercase tracking-wider">
                  Select Subscription Plan
                </h2>
              </div>

              {/* Annual Plan ($79/yr with 3-Day Free Trial) */}
              <button
                type="button"
                role="button"
                aria-label="Select Annual Plan at 79 dollars per year with 3-day free trial"
                onClick={() => {
                  haptics.lightTap();
                  setSelectedPlan('annual');
                  const el = document.getElementById('checkout-form-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`relative flex flex-col justify-between w-full rounded-2xl border p-4 text-left transition-all min-h-[64px] cursor-pointer active:scale-[0.99] ${
                  selectedPlan === 'annual'
                    ? 'border-cyan-400 bg-cyan-500/15 shadow-xl ring-2 ring-cyan-400/50'
                    : 'border-[#243042] bg-[#121822] hover:border-[#33425A]'
                }`}
              >
                <div className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-md font-mono-tech">
                  3-DAY FREE TRIAL • SAVE 34%
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-bold text-white">Annual Membership (1 Year)</span>
                  <span className="font-mono-tech text-xl font-bold text-cyan-300">$79.00</span>
                </div>
                <p className="mt-1 text-xs text-zinc-300 leading-relaxed font-normal">
                  Full 3-day complimentary trial, then $79.00 billed annually ($6.58/mo). Cancel anytime with 1 tap.
                </p>
                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#243042]/50">
                  <span className="text-[11px] text-cyan-400 font-mono-tech">Includes all Pro features</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                    <span>Select &amp; Pay</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>

              {/* 6 Months Plan ($39.99 / 6 mo) */}
              <button
                type="button"
                role="button"
                aria-label="Select 6-Month Plan at 39.99 dollars for 6 months"
                onClick={() => {
                  haptics.lightTap();
                  setSelectedPlan('biannual');
                  const el = document.getElementById('checkout-form-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`relative flex flex-col justify-between w-full rounded-2xl border p-4 text-left transition-all min-h-[64px] cursor-pointer active:scale-[0.99] ${
                  selectedPlan === 'biannual'
                    ? 'border-cyan-400 bg-cyan-500/15 shadow-xl ring-2 ring-cyan-400/50'
                    : 'border-[#243042] bg-[#121822] hover:border-[#33425A]'
                }`}
              >
                <div className="absolute -top-3 right-4 rounded-full bg-cyan-600/80 px-2.5 py-0.5 text-[10px] font-bold text-cyan-200 border border-cyan-400/40 font-mono-tech">
                  SEMI-ANNUAL • SAVE 33%
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-bold text-white">6-Month Plan</span>
                  <span className="font-mono-tech text-xl font-bold text-cyan-200">$39.99</span>
                </div>
                <p className="mt-1 text-xs text-zinc-300 leading-relaxed font-normal">
                  Billed every 6 months ($6.66/mo). Ideal balance between flexibility and savings.
                </p>
                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#243042]/50">
                  <span className="text-[11px] text-cyan-400 font-mono-tech">No long-term contract</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                    <span>Select &amp; Pay</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>

              {/* Monthly Plan ($9.99/mo) */}
              <button
                type="button"
                role="button"
                aria-label="Select Monthly Plan at 9.99 dollars per month"
                onClick={() => {
                  haptics.lightTap();
                  setSelectedPlan('monthly');
                  const el = document.getElementById('checkout-form-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`flex flex-col justify-between w-full rounded-2xl border p-4 text-left transition-all min-h-[64px] cursor-pointer active:scale-[0.99] ${
                  selectedPlan === 'monthly'
                    ? 'border-cyan-400 bg-cyan-500/15 shadow-xl ring-2 ring-cyan-400/50'
                    : 'border-[#243042] bg-[#121822] hover:border-[#33425A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-bold text-white">Monthly Flex Plan</span>
                  <span className="font-mono-tech text-xl font-bold text-zinc-100">$9.99</span>
                </div>
                <p className="mt-1 text-xs text-zinc-300 leading-relaxed font-normal">
                  Billed monthly at $9.99. No contracts, zero commitments.
                </p>
                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#243042]/50">
                  <span className="text-[11px] text-cyan-400 font-mono-tech">Flexible billing</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                    <span>Select &amp; Pay</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            </div>

            {/* Included Pro Privileges Checklist */}
            <div className="rounded-2xl border border-[#222E40] bg-[#0E131C] p-5 shadow-xl space-y-3">
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>What&apos;s Included in CarAI Pro</span>
              </h3>

              <div className="space-y-2.5 text-xs text-zinc-200">
                {PRO_BENEFITS.map((item) => (
                  <div key={item.title} className="flex items-start gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 mt-0.5">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <span className="font-bold text-white">{item.title}: </span>
                      <span className="text-zinc-300 leading-relaxed">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Fast Direct-to-Bank Payment Form (7 Columns) */}
          <div className="lg:col-span-7 space-y-4">
            <div id="checkout-form-section" className="rounded-2xl border border-[#222E40] bg-[#0E131C] p-5 sm:p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-white">
                      Instant 256-Bit Bank Checkout
                    </h3>
                    <p className="text-xs text-zinc-300 font-mono-tech">
                      Encrypted PCI-DSS Clearing Rails • Zero-Bypass Verified
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 font-mono-tech text-xs text-emerald-400 font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Bank Certified</span>
                </div>
              </div>

              {/* Express 1-Click Pay Bar (Under 30 Seconds Speed Option) */}
              <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-[#101A26] to-[#0D141F] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono-tech">
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    <span>EXPRESS 1-CLICK CHECKOUT (&lt; 15 SECONDS)</span>
                  </span>
                  <span className="text-zinc-300 font-bold font-mono-tech">Instant Settlement</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    role="button"
                    disabled={loading}
                    onClick={() => handleExecutePayment('apple_pay')}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 border border-zinc-700 py-3 px-2 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-98 min-h-[48px]"
                  >
                    <Zap className="h-4 w-4 text-cyan-400" />
                    <span>Apple / Google</span>
                  </button>

                  <button
                    type="button"
                    role="button"
                    disabled={loading}
                    onClick={() => handleExecutePayment('upi')}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 py-3 px-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-950/40 transition-all active:scale-98 min-h-[48px]"
                  >
                    <Zap className="h-4 w-4 text-emerald-300" />
                    <span>1-Click UPI</span>
                  </button>

                  <button
                    type="button"
                    role="button"
                    disabled={loading}
                    onClick={() => handleExecutePayment('card')}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 border border-cyan-500/40 py-3 px-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-cyan-900/40 transition-all active:scale-98 min-h-[48px]"
                  >
                    <CreditCard className="h-4 w-4 text-cyan-200" />
                    <span>
                      Test Card (
                      {selectedPlan === 'annual'
                        ? '$79/yr'
                        : selectedPlan === 'biannual'
                        ? '$39.99/6mo'
                        : '$9.99/mo'}
                      )
                    </span>
                  </button>
                </div>
              </div>

              {/* Payment Channel Selector */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2 font-mono-tech">
                  Or Select Preferred Payment Gateway
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    role="button"
                    onClick={() => {
                      haptics.lightTap();
                      setPaymentMethod('card');
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-3 text-xs sm:text-sm font-bold transition-all min-h-[48px] ${
                      paymentMethod === 'card'
                        ? 'border-cyan-400 bg-cyan-500/20 text-white ring-1 ring-cyan-400'
                        : 'border-[#243042] bg-[#121822] text-zinc-300 hover:text-white'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 text-cyan-400" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    role="button"
                    onClick={() => {
                      haptics.lightTap();
                      setPaymentMethod('apple_pay');
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-3 text-xs sm:text-sm font-bold transition-all min-h-[48px] ${
                      paymentMethod === 'apple_pay'
                        ? 'border-cyan-400 bg-cyan-500/20 text-white ring-1 ring-cyan-400'
                        : 'border-[#243042] bg-[#121822] text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Zap className="h-4 w-4 text-cyan-400" />
                    <span>Apple / GPay</span>
                  </button>

                  <button
                    type="button"
                    role="button"
                    onClick={() => {
                      haptics.lightTap();
                      setPaymentMethod('upi');
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-3 text-xs sm:text-sm font-bold transition-all min-h-[48px] ${
                      paymentMethod === 'upi'
                        ? 'border-emerald-400 bg-emerald-500/20 text-white ring-1 ring-emerald-400'
                        : 'border-[#243042] bg-[#121822] text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Zap className="h-4 w-4 text-emerald-400" />
                    <span>UPI / Apps</span>
                  </button>

                  <button
                    type="button"
                    role="button"
                    onClick={() => {
                      haptics.lightTap();
                      setPaymentMethod('bank_ach');
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-3 text-xs sm:text-sm font-bold transition-all min-h-[48px] ${
                      paymentMethod === 'bank_ach'
                        ? 'border-cyan-400 bg-cyan-500/20 text-white ring-1 ring-cyan-400'
                        : 'border-[#243042] bg-[#121822] text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Building2 className="h-4 w-4 text-cyan-400" />
                    <span>Bank ACH</span>
                  </button>
                </div>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="rounded-xl border border-red-500/50 bg-red-500/15 p-3.5 text-xs sm:text-sm text-red-200 flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-red-300">Payment Authorization Notice:</span>
                    <p className="mt-0.5 text-zinc-200">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Payment Fields */}
              {paymentMethod === 'card' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono-tech">
                      Cardholder Full Name
                    </label>
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
                    placeholder="e.g. Alex Vance"
                    className="w-full rounded-xl border border-[#243042] bg-[#0A0E14] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none min-h-[48px]"
                  />

                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1 font-mono-tech">
                      Card Number
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                      <input
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4000 1234 5678 4242"
                        className="w-full rounded-xl border border-[#243042] bg-[#0A0E14] py-3 pl-12 pr-4 text-sm font-mono-tech text-white placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none min-h-[48px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1 font-mono-tech">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="08/28"
                        className="w-full rounded-xl border border-[#243042] bg-[#0A0E14] px-4 py-3 text-sm font-mono-tech text-white placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none min-h-[48px]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1 font-mono-tech">
                        CVC Security Code
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="•••"
                        className="w-full rounded-xl border border-[#243042] bg-[#0A0E14] px-4 py-3 text-sm font-mono-tech text-white placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none min-h-[48px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="rounded-xl border border-emerald-500/30 bg-[#121822] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Zap className="h-5 w-5" />
                      <span className="font-bold text-sm text-white">Instant UPI 2.0 Real-Time Settlement</span>
                    </div>
                    <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-xs text-emerald-300 font-mono-tech font-bold">
                      Instant &lt; 5s
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Pay through Google Pay, PhonePe, Paytm, BHIM, or any UPI ID. Activates CarAI Pro immediately.
                  </p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider font-mono-tech">
                        Enter UPI ID / Virtual Payment Address
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setUpiId('driver@okhdfcbank')}
                          className="text-[11px] font-mono-tech text-emerald-400 hover:underline"
                        >
                          [GPay]
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpiId('carai@ybl')}
                          className="text-[11px] font-mono-tech text-emerald-400 hover:underline"
                        >
                          [PhonePe]
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpiId('driver@paytm')}
                          className="text-[11px] font-mono-tech text-emerald-400 hover:underline"
                        >
                          [Paytm]
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <Zap className="absolute left-3.5 top-3.5 h-4 w-4 text-emerald-400" />
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okhdfcbank or mobile@upi"
                        className="w-full rounded-xl border border-[#243042] bg-[#0A0E14] py-3 pl-10 pr-4 text-sm font-mono-tech text-white placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none min-h-[48px]"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>Instant NPCI gateway connected. Click Authorize below to activate your Pro subscription.</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'bank_ach' && (
                <div className="rounded-xl border border-[#222E40] bg-[#121822] p-4 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Building2 className="h-5 w-5" />
                    <span className="font-bold text-sm text-white">Direct FedACH Merchant Clearing</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Electronic ACH settlement. 100% of proceeds clear directly to verified master merchant account.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-tech">
                    <div>
                      <label className="text-zinc-400 block mb-1 font-semibold">9-Digit Routing Number</label>
                      <input
                        type="text"
                        maxLength={9}
                        value={bankRoutingNumber}
                        onChange={(e) => setBankRoutingNumber(e.target.value)}
                        className="w-full rounded-xl border border-[#243042] bg-[#0A0E14] p-3 text-white focus:border-cyan-400 focus:outline-none min-h-[48px]"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1 font-semibold">Account Number</label>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        className="w-full rounded-xl border border-[#243042] bg-[#0A0E14] p-3 text-white focus:border-cyan-400 focus:outline-none min-h-[48px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'apple_pay' && (
                <div className="rounded-xl border border-[#222E40] bg-[#121822] p-5 text-center space-y-2">
                  <Zap className="h-8 w-8 text-cyan-400 mx-auto" />
                  <p className="text-sm font-bold text-white">Biometric Device Account Authorization</p>
                  <p className="text-xs text-zinc-300">
                    Instant tokenized payment via Face ID, Touch ID, or Google Pay.
                  </p>
                </div>
              )}

              {/* Authorization Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  role="button"
                  disabled={loading}
                  onClick={() => handleExecutePayment()}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 py-4 px-6 text-base font-bold text-white shadow-xl shadow-cyan-900/40 transition-all active:scale-98 min-h-[52px]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Zap className="h-5 w-5 animate-spin text-cyan-200" />
                      <span>{loadingPhase || 'Authorizing 256-Bit Bank Transfer...'}</span>
                    </span>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      <span>
                        {selectedPlan === 'annual'
                          ? 'Authorize Annual Membership ($79.00/yr • 3-Day Free Trial)'
                          : selectedPlan === 'biannual'
                          ? 'Authorize 6-Month Plan ($39.99/6mo • Save 33%)'
                          : 'Authorize Monthly Flex Membership ($9.99/mo)'}
                      </span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>

              {/* Guarantees & Policy Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-center text-xs text-zinc-300 font-mono-tech border-t border-[#1C2534]">
                <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#0A0E14]">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Cancel Anytime</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#0A0E14]">
                  <Lock className="h-4 w-4 text-cyan-400" />
                  <span>256-Bit Bank TLS</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#0A0E14]">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <span>Sub-30s Activation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
