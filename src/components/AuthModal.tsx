import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Smartphone,
  Mail,
  X,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Zap,
  LogOut,
  User,
  Check,
  ArrowRight,
  RefreshCw,
  Car,
  Cloud,
  Edit3,
} from 'lucide-react';
import { authService, AuthUser } from '../services/authService';
import { haptics } from '../services/haptics';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  initialMode?: 'login' | 'register';
}

const COUNTRY_CODES = [
  { code: '+1', country: 'US / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const currentSession = authService.getCurrentSession();
  const [mode, setMode] = useState<'login' | 'register' | 'profile'>(
    currentSession ? 'profile' : initialMode
  );

  // Form states (Passwordless Mobile-First)
  const [mobileNumber, setMobileNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [preferredVehicle, setPreferredVehicle] = useState('Toyota GR Supra 3.0');

  // OTP Verification state
  const [step, setStep] = useState<'phone_input' | 'otp_verify'>('phone_input');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtpHint, setGeneratedOtpHint] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editVehicle, setEditVehicle] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const active = authService.getCurrentSession();
      if (active) {
        setMode('profile');
        setEditName(active.fullName || '');
        setEditEmail(active.email || '');
        setEditVehicle(active.preferredVehicle || 'Toyota GR Supra 3.0');
      } else {
        setMode(initialMode);
      }
      setStep('phone_input');
      setOtpCode('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  if (!isOpen) return null;

  // Step 1: Request SMS OTP for Mobile Number
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    haptics.lightTap();

    const cleanDigits = mobileNumber.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 7) {
      setErrorMsg('A valid compulsory mobile phone number is strictly required.');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      setErrorMsg('Please enter the driver full name.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.requestOtp({ mobileNumber, countryCode });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to dispatch SMS verification code.');
        setLoading(false);
        return;
      }

      setGeneratedOtpHint(res.debugOtp || '123456');
      setStep('otp_verify');
      setResendCountdown(30);
      setSuccessMsg(`Verification code sent to ${countryCode} ${mobileNumber}`);
      haptics.mediumSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error requesting verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Authenticate / Register in Cloud
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    haptics.lightTap();

    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.verifyMobileAndAuthenticate({
        mobileNumber,
        countryCode,
        otpCode: otpCode.trim(),
        fullName: mode === 'register' ? fullName.trim() : undefined,
        email: mode === 'register' && email.trim() ? email.trim() : undefined,
        preferredVehicle: mode === 'register' ? preferredVehicle : undefined,
      });

      if (!result.success || !result.user) {
        setErrorMsg(result.error || 'Mobile verification code invalid or expired.');
        setLoading(false);
        return;
      }

      haptics.mediumSuccess();
      setSuccessMsg(
        result.isNewUser
          ? 'Mobile registration verified! Cloud driver profile active.'
          : 'Signed in successfully! Cloud instrument telemetry unlocked.'
      );
      setLoading(false);
      onSuccess(result.user);

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification error. Please retry.');
      setLoading(false);
    }
  };

  // Profile Save with Cloud Sync
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsCloudSyncing(true);
    haptics.lightTap();

    try {
      const updated = await authService.updateProfile({
        fullName: editName.trim(),
        email: editEmail.trim(),
        preferredVehicle: editVehicle.trim(),
      });

      if (updated) {
        haptics.mediumSuccess();
        setSuccessMsg('Profile changes saved and synchronized to Cloud Vault.');
        setIsEditingProfile(false);
        onSuccess(updated);
      }
    } catch (err: any) {
      setErrorMsg('Failed to synchronize profile updates to cloud.');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleLogout = () => {
    haptics.lightTap();
    authService.logout();
    setMode('login');
    setStep('phone_input');
    setSuccessMsg('Signed out of cloud driver vault.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 sm:p-8 shadow-2xl"
      >
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Header Bar with flex layout to prevent any overlap on mobile */}
        <div className="flex items-start justify-between gap-3 border-b border-[#2C3440] pb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
              <Shield className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
                {mode === 'profile'
                  ? 'CLOUD DRIVER VAULT'
                  : mode === 'login'
                  ? 'PASSWORDLESS SIGN-IN'
                  : 'REGISTER DRIVER'}
              </h3>
              <p className="text-xs text-zinc-300 flex items-center gap-1.5 mt-0.5 truncate">
                <Cloud className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                Mobile-first driver profile persistence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 rounded-full bg-[#1A202A] border border-[#2C3440] p-2.5 text-zinc-300 hover:text-white transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
            aria-label="Close Driver Vault"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs (Only in login/register mode and step 1) */}
        {mode !== 'profile' && step === 'phone_input' && (
          <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-2xl bg-[#0E1116] p-1.5 border border-[#2C3440]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`rounded-xl py-3 text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                mode === 'login'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Mobile Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`rounded-xl py-3 text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                mode === 'register'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Register New Driver
            </button>
          </div>
        )}

        {/* Status Alerts */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-500/40 bg-red-500/15 p-4 text-xs sm:text-sm text-red-200"
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{errorMsg}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex items-start gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-xs sm:text-sm text-emerald-200"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-400" />
              <span className="leading-relaxed">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PROFILE VIEW */}
        {mode === 'profile' && currentSession ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-[#2C3440] bg-[#0E1116] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#2C3440] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 font-bold text-lg border border-cyan-500/30">
                    {currentSession.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{currentSession.fullName}</h4>
                    <span className="text-xs font-mono-tech text-emerald-300 flex items-center gap-1 mt-0.5">
                      <Check className="h-3.5 w-3.5" /> Cloud-Synced Driver Profile
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded-xl px-3 py-1 text-xs font-bold font-mono-tech ${
                    currentSession.isPro
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-[#1A202A] text-zinc-300 border border-[#2C3440]'
                  }`}
                >
                  {currentSession.isPro ? 'PRO UNLOCKED' : 'FREE TIER'}
                </span>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
                  <div>
                    <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Driver Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-[#2C3440] bg-[#14181F] px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none min-h-[48px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-[#2C3440] bg-[#14181F] px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none min-h-[48px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Preferred Vehicle</label>
                    <input
                      type="text"
                      value={editVehicle}
                      onChange={(e) => setEditVehicle(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-[#2C3440] bg-[#14181F] px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none min-h-[48px]"
                    />
                  </div>
                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="submit"
                      disabled={isCloudSyncing}
                      className="flex-1 rounded-2xl bg-cyan-600 hover:bg-cyan-500 py-3.5 text-sm font-bold text-white transition-colors disabled:opacity-50 min-h-[48px]"
                    >
                      {isCloudSyncing ? 'Syncing with Cloud...' : 'Save to Cloud Vault'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="rounded-2xl border border-[#2C3440] bg-[#1A202A] px-5 py-3.5 text-sm font-medium text-zinc-300 hover:text-white min-h-[48px]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 text-zinc-300 border-b border-[#2C3440]">
                    <span className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-cyan-400" /> Verified Mobile:
                    </span>
                    <span className="font-mono-tech text-white font-medium">
                      {currentSession.mobileNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-zinc-300 border-b border-[#2C3440]">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-zinc-400" /> Account Email:
                    </span>
                    <span className="font-mono-tech text-white font-medium">
                      {currentSession.email || 'None'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-zinc-300 border-b border-[#2C3440]">
                    <span className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-zinc-400" /> Preferred Car:
                    </span>
                    <span className="font-mono-tech text-zinc-200">
                      {currentSession.preferredVehicle || 'Toyota GR Supra 3.0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-zinc-300">
                    <span className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-cyan-400" /> Cloud Sync:
                    </span>
                    <span className="text-cyan-300 font-mono-tech text-xs flex items-center gap-1 font-bold">
                      <CheckCircle2 className="h-4 w-4" /> Real-Time Cloud Authoritative
                    </span>
                  </div>
                </div>
              )}
            </div>

            {showLogoutConfirm ? (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 mt-3 space-y-3">
                <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Sign Out of Driver Vault?</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Are you sure you want to sign out? Your cloud sync and active vehicle telemetry will pause until you log back in.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogoutConfirm(false);
                      handleLogout();
                    }}
                    className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 text-xs transition-colors min-h-[44px]"
                  >
                    Confirm Sign Out
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 rounded-xl bg-[#1A202A] border border-[#2C3440] text-zinc-300 hover:text-white font-bold py-2.5 text-xs transition-colors min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              !isEditingProfile && (
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#2C3440] bg-[#1A202A] py-3 text-xs sm:text-sm font-semibold text-zinc-200 hover:border-cyan-400/50 hover:text-white transition-colors min-h-[48px]"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setStep('phone_input');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#2C3440] bg-[#1A202A] py-3 text-xs sm:text-sm font-semibold text-zinc-200 hover:border-cyan-400/50 hover:text-white transition-colors min-h-[48px]"
                  >
                    <User className="h-4 w-4" />
                    <span>Switch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-xs sm:text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-colors min-h-[48px]"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )
            )}
          </div>
        ) : step === 'phone_input' ? (
          /* STEP 1: STRICT MOBILE-FIRST INPUT FORM */
          <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
            {mode === 'register' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center justify-between">
                    <span>Driver Full Name</span>
                    <span className="text-xs text-cyan-400 font-mono-tech">Required</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Vance"
                    className="mt-1.5 w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] px-4 py-3 text-sm text-white placeholder:text-zinc-400 focus:border-cyan-400 focus:outline-none min-h-[48px]"
                    required
                  />
                </div>
              </>
            )}

            {/* Compulsory Mobile Number Input */}
            <div>
              <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center justify-between">
                <span>Mobile Phone Number</span>
                <span className="text-xs text-amber-300 font-mono-tech font-bold">
                  Compulsory *
                </span>
              </label>
              <div className="mt-1.5 flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="rounded-2xl border border-[#2C3440] bg-[#0E1116] px-3 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none font-mono-tech min-h-[48px]"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Smartphone className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-400" />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="(555) 839-2041"
                    className="w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-400 focus:border-cyan-400 focus:outline-none font-mono-tech min-h-[48px]"
                    required
                  />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">
                Passwordless authentication: We will send a secure 6-digit verification code to this phone.
              </p>
            </div>

            {mode === 'register' && (
              <>
                {/* Optional Email Address */}
                <div>
                  <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center justify-between">
                    <span>Email Address (Optional)</span>
                    <span className="text-xs text-zinc-300 font-mono-tech">For Receipts</span>
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@example.com"
                      className="w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-400 focus:border-cyan-400 focus:outline-none min-h-[48px]"
                    />
                  </div>
                </div>

                {/* Primary Garage Vehicle */}
                <div>
                  <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Primary Vehicle
                  </label>
                  <div className="relative mt-1.5">
                    <Car className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-400" />
                    <input
                      type="text"
                      value={preferredVehicle}
                      onChange={(e) => setPreferredVehicle(e.target.value)}
                      placeholder="e.g. BMW M3 Competition / Toyota Supra"
                      className="w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-400 focus:border-cyan-400 focus:outline-none min-h-[48px]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 hover:bg-cyan-500 py-3.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-cyan-600/30 transition-all disabled:opacity-50 min-h-[52px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Zap className="h-5 w-5 animate-spin text-cyan-200" />
                  <span>Dispatching Secure Verification SMS...</span>
                </span>
              ) : (
                <>
                  <span>Send 6-Digit Verification Code</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>
        ) : (
          /* STEP 2: PASSWORDLESS 6-DIGIT OTP VERIFICATION */
          <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
            <div className="rounded-2xl border border-[#2C3440] bg-[#0E1116] p-5 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <KeyRound className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white">Enter 6-Digit SMS Code</h4>
              <p className="text-xs sm:text-sm text-zinc-300 font-mono-tech">
                Sent to: <span className="text-cyan-300 font-bold">{countryCode} {mobileNumber}</span>
              </p>

              {/* Dev Helper Chip */}
              {generatedOtpHint && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      haptics.lightTap();
                      setOtpCode(generatedOtpHint);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-950/80 border border-cyan-600/60 px-4 py-2 text-xs font-mono-tech text-cyan-300 hover:bg-cyan-900/80 transition-colors min-h-[44px]"
                  >
                    <span>⚡ Quick Test Code:</span>
                    <span className="font-bold underline text-sm">{generatedOtpHint}</span>
                    <span className="text-xs text-cyan-400">(Click to auto-fill)</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider text-center block">
                Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                className="mt-2 w-full rounded-2xl border-2 border-cyan-400 bg-[#0E1116] py-3.5 text-center text-2xl font-mono-tech tracking-[0.4em] font-bold text-cyan-300 placeholder:text-zinc-700 focus:border-cyan-300 focus:outline-none min-h-[52px]"
              />
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-300 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('phone_input');
                  setErrorMsg(null);
                }}
                className="hover:text-cyan-300 transition-colors min-h-[44px] flex items-center"
              >
                ← Change Phone Number
              </button>

              <button
                type="button"
                disabled={resendCountdown > 0}
                onClick={handleRequestOtp}
                className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                <RefreshCw className="h-4 w-4" />
                <span>{resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend SMS Code'}</span>
              </button>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading || otpCode.length < 4}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 hover:bg-cyan-500 py-4 text-base font-bold text-white shadow-xl shadow-cyan-600/30 transition-all disabled:opacity-50 min-h-[52px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Zap className="h-5 w-5 animate-spin text-cyan-200" />
                  <span>Verifying Mobile Handshake & Cloud Profile...</span>
                </span>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Verify Code & Unlock Cloud Instrument</span>
                </>
              )}
            </motion.button>
          </form>
        )}

        {/* Cloud Persistence Guarantee */}
        <div className="mt-5 border-t border-[#2C3440] pt-4 text-center">
          <p className="text-xs text-zinc-400 flex items-center justify-center gap-1.5">
            <Cloud className="h-4 w-4 text-cyan-400" />
            <span>Cloud-Synced Driver Profile Store • Strict Mobile ID Verification • Zero Password Vulnerability</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
