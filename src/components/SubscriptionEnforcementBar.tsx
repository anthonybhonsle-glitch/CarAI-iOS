import React from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  Crown,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { UserSubscriptionState, PaywallContext } from '../types';
import { haptics } from '../services/haptics';

interface SubscriptionEnforcementBarProps {
  user: UserSubscriptionState;
  onOpenPaywall: (context?: PaywallContext) => void;
}

export const SubscriptionEnforcementBar: React.FC<SubscriptionEnforcementBarProps> = ({
  user,
  onOpenPaywall,
}) => {
  const isTrialExpired = Boolean(user.trialExpired || user.status === 'trial_expired');
  const isActiveTrial = Boolean(user.activeTrial && !isTrialExpired);
  const isFreeTier = Boolean(!user.isPro && !isActiveTrial && !isTrialExpired);
  const isPaidPro = Boolean(user.isPro && !user.activeTrial && user.status === 'active_subscription');

  if (isPaidPro) {
    return (
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-emerald-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>CarAI Pro Subscription Active • 256-Bit Bank Settlement Confirmed</span>
        </div>
        <span className="font-mono-tech text-xs font-bold text-emerald-400">
          {user.planType === 'pro_monthly'
            ? '$9.99 / Month'
            : user.planType === 'pro_biannual'
            ? '$39.99 / 6 Months'
            : '$79.00 / Year'}
        </span>
      </div>
    );
  }

  if (isTrialExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-3xl border border-amber-500/50 bg-gradient-to-r from-amber-950/80 via-[#1A1612] to-[#14181F] p-5 sm:p-6 shadow-2xl"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-display font-bold text-base sm:text-lg text-amber-200 tracking-wide">
                  3-DAY PRO TRIAL CONCLUDED — SUBSCRIPTION REQUIRED
                </span>
                <span className="rounded-md bg-amber-500/30 border border-amber-500/50 px-2 py-0.5 text-xs font-bold text-amber-200 font-mono-tech">
                  LOCKED
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-zinc-200 leading-relaxed max-w-2xl font-normal">
                Your trial period has ended. Mechanic rip-off defense scripts, estimated repair costs, step-by-step DIY guides, and unlimited AI customizer renders require an active subscription.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
            <button
              onClick={() => {
                haptics.lightTap();
                onOpenPaywall({ trigger: 'direct_payment', step: 'checkout', trialExpired: true });
              }}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 sm:px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-600/30 transition-all active:scale-95 min-h-[44px]"
            >
              <Crown className="h-4 w-4 fill-current" />
              <span>Unlock Annual Pro ($79/yr)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                haptics.lightTap();
                onOpenPaywall({ trigger: 'direct_payment', step: 'checkout', trialExpired: true });
              }}
              className="rounded-xl border border-[#363E4C] bg-[#161A22] hover:bg-[#202631] px-3.5 py-3 text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white transition-all min-h-[44px]"
            >
              Monthly ($9.99/mo)
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isActiveTrial) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-3xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/60 via-[#121A24] to-[#14181F] p-4 sm:p-5 shadow-xl"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm sm:text-base font-bold text-white">
                  3-DAY PRO TRIAL ACTIVE
                </span>
                <span className="rounded-md bg-cyan-500/25 border border-cyan-500/40 px-2.5 py-0.5 text-xs font-bold text-cyan-200 font-mono-tech">
                  {user.trialHoursLeft || 72}h ({user.trialDaysLeft || 3}d) LEFT
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Full Pro access is unlocked. Lock in the 34% annual discount ($79.00/yr) before your window ends.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              haptics.lightTap();
              onOpenPaywall({ trigger: 'direct_payment', step: 'checkout' });
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition-all self-start sm:self-center min-h-[42px]"
          >
            <Crown className="h-4 w-4 fill-current" />
            <span>Lock In Annual Plan ($79/yr)</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Free Tier
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-3xl border border-[#2C3440] bg-gradient-to-r from-[#161B23] via-[#12161E] to-[#161B23] p-4 sm:p-5 shadow-lg"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222933] text-zinc-300 border border-[#343D4D]">
            <Lock className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm sm:text-base font-bold text-white">
                FREE DRIVER ACCOUNT
              </span>
              <span className="rounded-md bg-[#252C37] border border-[#363E4C] px-2 py-0.5 text-xs font-bold text-zinc-300 font-mono-tech">
                {user.freeRendersLimit - user.freeRendersUsed} Free Render Left
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-200 mt-0.5 leading-normal">
              Upgrade to CarAI Pro for unlimited AI customizer builds, mechanic rip-off defense scripts, and high-frequency ECU telemetry.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            haptics.lightTap();
            onOpenPaywall({ trigger: 'direct_payment', step: 'checkout' });
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-cyan-600/30 transition-all self-start sm:self-center shrink-0 min-h-[44px]"
        >
          <Crown className="h-4 w-4 fill-current" />
          <span>Upgrade to Pro ($79/yr)</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};
