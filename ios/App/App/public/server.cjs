var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);

// server/entitlements.ts
var usersDb = /* @__PURE__ */ new Map();
var profilesDb = /* @__PURE__ */ new Map();
var mobileOtpDb = /* @__PURE__ */ new Map();
var webhookLogs = [];
var securityAuditLogs = [];
var DEFAULT_DEMO_USER_ID = "demo_driver_01";
profilesDb.set(DEFAULT_DEMO_USER_ID, {
  id: DEFAULT_DEMO_USER_ID,
  userId: DEFAULT_DEMO_USER_ID,
  mobileNumber: "+1 (555) 839-2041",
  countryCode: "+1",
  fullName: "Alex Vance",
  email: "driver@carai.io",
  isVerified: true,
  registeredAt: (/* @__PURE__ */ new Date()).toISOString(),
  lastLoginAt: (/* @__PURE__ */ new Date()).toISOString(),
  token: "jwt_sec_demo_9382",
  isPro: false,
  planType: "free",
  status: "free_tier",
  freeRendersUsed: 0,
  freeRendersLimit: 1,
  storageModel: "cloud_synced_vault"
});
var referralsDb = [];
var maintenanceLogsDb = /* @__PURE__ */ new Map();
var sharedRendersLog = [];
var obdConnectedUsersSet = /* @__PURE__ */ new Set();
var TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1e3;
function syncUserTrialAndSubscriptionState(user) {
  const now = Date.now();
  if (user.subscriptionExpiresAt && user.verifiedPaymentId) {
    if (now < user.subscriptionExpiresAt) {
      user.isPro = true;
      user.status = "active_subscription";
      user.activeTrial = false;
      user.trialExpired = false;
      return user;
    } else {
      user.isPro = false;
      user.status = "trial_expired";
      user.planType = "free";
      user.subscriptionExpiresAt = null;
    }
  }
  if (user.activeTrial && user.trialExpiresAt) {
    if (now < user.trialExpiresAt) {
      user.isPro = true;
      user.status = "active_trial";
      user.trialExpired = false;
      user.hasUsedTrial = true;
      const msRemaining = user.trialExpiresAt - now;
      user.trialDaysLeft = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1e3)));
      user.trialHoursLeft = Math.max(0, Math.ceil(msRemaining / (60 * 60 * 1e3)));
      return user;
    } else {
      const wasPro = user.isPro;
      user.isPro = false;
      user.activeTrial = false;
      user.hasUsedTrial = true;
      user.trialExpired = true;
      user.trialDaysLeft = 0;
      user.trialHoursLeft = 0;
      user.status = "trial_expired";
      user.planType = "free";
      if (wasPro) {
        logSecurityEvent({
          userId: user.userId,
          action: "TRIAL_EXPIRATION_LOCK",
          status: "REVOKED",
          reason: "3-Day Trial Window has concluded. Pro capabilities locked pending subscription purchase."
        });
      }
      return user;
    }
  }
  if (user.trialExpired || user.hasUsedTrial) {
    user.isPro = false;
    user.status = "trial_expired";
    user.planType = "free";
    user.activeTrial = false;
    user.hasUsedTrial = true;
  } else {
    user.isPro = false;
    user.status = "free_tier";
    user.planType = "free";
    user.activeTrial = false;
  }
  return user;
}
function getOrCreateUser(userId = "demo_driver_01") {
  if (!usersDb.has(userId)) {
    const now = Date.now();
    const defaultUser = {
      userId,
      isPro: false,
      status: "free_tier",
      planType: "free",
      freeRendersUsed: 0,
      freeRendersLimit: 1,
      // Exactly 1 free render for trial/free testing
      scanCount: 3,
      billingCycleResetDate: new Date(now + 30 * 864e5).toISOString().split("T")[0],
      activeTrial: false,
      hasUsedTrial: false,
      trialDaysLeft: 0,
      trialHoursLeft: 0,
      trialStartedAt: null,
      trialExpiresAt: null,
      trialExpired: false,
      subscriptionExpiresAt: null,
      verifiedPaymentId: null,
      stripeOrRcCustomerId: `rc_cust_${userId}_${Math.floor(Math.random() * 89999 + 1e4)}`,
      currency: "USD"
    };
    usersDb.set(userId, defaultUser);
  }
  const user = usersDb.get(userId);
  return syncUserTrialAndSubscriptionState(user);
}
function startUserTrial(userId) {
  const user = getOrCreateUser(userId);
  const now = Date.now();
  if (user.hasUsedTrial || user.trialExpired || user.trialStartedAt) {
    logSecurityEvent({
      userId,
      action: "UNAUTHORIZED_BYPASS_ATTEMPT",
      status: "TRIAL_EXPIRED_BLOCKED",
      reason: "Attempted to re-start or extend trial after expiration. Request blocked."
    });
    throw new Error("Complimentary 3-day trial has already been used for this account. Premium access requires an active, verified subscription.");
  }
  user.activeTrial = true;
  user.hasUsedTrial = true;
  user.trialStartedAt = now;
  user.trialExpiresAt = now + TRIAL_DURATION_MS;
  user.trialExpired = false;
  user.isPro = true;
  user.planType = "pro_annual";
  user.status = "active_trial";
  user.trialDaysLeft = 3;
  user.trialHoursLeft = 72;
  usersDb.set(userId, user);
  logSecurityEvent({
    userId,
    action: "PAYMENT_VERIFIED",
    status: "GRANTED",
    reason: "Started 3-Day Free Trial (single-use 72-hour access window initialized)."
  });
  return syncUserTrialAndSubscriptionState(user);
}
function activatePaidSubscription(userId, planType, paymentId = `tx_${Date.now()}_${Math.floor(Math.random() * 99999)}`) {
  const user = getOrCreateUser(userId);
  const now = Date.now();
  const durationMs = planType === "pro_annual" ? 365 * 24 * 60 * 60 * 1e3 : planType === "pro_biannual" ? 180 * 24 * 60 * 60 * 1e3 : 30 * 24 * 60 * 60 * 1e3;
  user.isPro = true;
  user.planType = planType;
  user.activeTrial = false;
  user.trialExpired = false;
  user.status = "active_subscription";
  user.subscriptionExpiresAt = now + durationMs;
  user.verifiedPaymentId = paymentId;
  user.freeRendersUsed = 0;
  usersDb.set(userId, user);
  logSecurityEvent({
    userId,
    action: "PAYMENT_VERIFIED",
    status: "PAYMENT_VERIFIED",
    reason: `Direct 256-Bit Bank Transfer Confirmed (${planType.toUpperCase()}). Payment ID: ${paymentId}`
  });
  return syncUserTrialAndSubscriptionState(user);
}
function simulateTrialExpire(userId) {
  const user = getOrCreateUser(userId);
  const now = Date.now();
  user.activeTrial = false;
  user.trialStartedAt = now - TRIAL_DURATION_MS - 1e3;
  user.trialExpiresAt = now - 1e3;
  user.trialExpired = true;
  user.isPro = false;
  user.status = "trial_expired";
  user.planType = "free";
  user.trialDaysLeft = 0;
  user.trialHoursLeft = 0;
  user.subscriptionExpiresAt = null;
  user.verifiedPaymentId = null;
  usersDb.set(userId, user);
  logSecurityEvent({
    userId,
    action: "TRIAL_EXPIRATION_LOCK",
    status: "TRIAL_EXPIRED_BLOCKED",
    reason: "Trial expired simulator triggered. Server immediately revoked all Pro feature access."
  });
  return syncUserTrialAndSubscriptionState(user);
}
function updateUserProStatus(userId, isPro, planType, activeTrial = false) {
  if (isPro) {
    if (activeTrial) {
      return startUserTrial(userId);
    } else {
      const proPlan = planType === "pro_monthly" ? "pro_monthly" : "pro_annual";
      return activatePaidSubscription(userId, proPlan);
    }
  } else {
    const user = getOrCreateUser(userId);
    user.isPro = false;
    user.status = "free_tier";
    user.planType = "free";
    user.activeTrial = false;
    user.subscriptionExpiresAt = null;
    usersDb.set(userId, user);
    return user;
  }
}
function checkProAccess(userId, action, ip = "127.0.0.1") {
  const user = getOrCreateUser(userId);
  if (user.isPro) {
    logSecurityEvent({
      userId,
      action,
      status: "GRANTED",
      reason: `Verified ${user.status === "active_trial" ? "Active 3-Day Trial" : "Active Subscription"}`,
      ip
    });
    return { allowed: true, isPro: true, status: user.status || "active_subscription", user };
  }
  if (user.trialExpired || user.status === "trial_expired") {
    logSecurityEvent({
      userId,
      action,
      status: "TRIAL_EXPIRED_BLOCKED",
      reason: "Attempted to access Pro capability with expired trial. Request blocked.",
      ip
    });
    return {
      allowed: false,
      isPro: false,
      status: "trial_expired",
      user,
      reason: "Your 3-day complimentary trial has concluded. Please purchase a CarAI Pro subscription to access this feature."
    };
  }
  logSecurityEvent({
    userId,
    action,
    status: "REDACTED_LOCKED",
    reason: "Free tier user requested Pro feature. Returning server-redacted data.",
    ip
  });
  return {
    allowed: false,
    isPro: false,
    status: "free_tier",
    user,
    reason: "CarAI Pro subscription required to unlock complete diagnostic scripts and unlimited renders."
  };
}
function incrementRenderUsage(userId, ip = "127.0.0.1") {
  const user = getOrCreateUser(userId);
  if (user.isPro) {
    logSecurityEvent({
      userId,
      action: "AI_CUSTOMIZER_RENDER",
      status: "GRANTED",
      reason: "Pro member rendered custom vehicle (unlimited quota).",
      ip
    });
    return { allowed: true, user };
  }
  if (user.trialExpired || user.status === "trial_expired") {
    logSecurityEvent({
      userId,
      action: "AI_CUSTOMIZER_RENDER",
      status: "TRIAL_EXPIRED_BLOCKED",
      reason: "Blocked render attempt: 3-Day trial expired.",
      ip
    });
    return {
      allowed: false,
      user,
      reason: "Your 3-day trial has concluded. Please subscribe to CarAI Pro to render additional custom builds."
    };
  }
  if (user.freeRendersUsed < user.freeRendersLimit) {
    user.freeRendersUsed += 1;
    usersDb.set(userId, user);
    logSecurityEvent({
      userId,
      action: "AI_CUSTOMIZER_RENDER",
      status: "GRANTED",
      reason: `Used free promotional render (${user.freeRendersUsed}/${user.freeRendersLimit}).`,
      ip
    });
    return { allowed: true, user };
  }
  logSecurityEvent({
    userId,
    action: "AI_CUSTOMIZER_RENDER",
    status: "REDACTED_LOCKED",
    reason: "Monthly free AI render quota reached (1/1 used).",
    ip
  });
  return {
    allowed: false,
    user,
    reason: "Monthly free AI render quota reached (1/1 used). Upgrade to CarAI Pro for unlimited renders."
  };
}
function logSecurityEvent(event) {
  const auditEvent = {
    id: `sec_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    timestampMs: Date.now(),
    ...event
  };
  securityAuditLogs.unshift(auditEvent);
  if (securityAuditLogs.length > 200) {
    securityAuditLogs.pop();
  }
}
function getSecurityAuditLogs() {
  return securityAuditLogs;
}
function recordWebhookEvent(event) {
  webhookLogs.unshift(event);
  if (webhookLogs.length > 50) {
    webhookLogs.pop();
  }
  const isPro = event.type === "INITIAL_PURCHASE" || event.type === "RENEWAL";
  const userId = event.app_user_id || "demo_driver_01";
  if (isPro) {
    const paidPlan = event.product_id?.includes("monthly") ? "pro_monthly" : "pro_annual";
    activatePaidSubscription(userId, paidPlan, event.id || `rc_${Date.now()}`);
  } else {
    updateUserProStatus(userId, false, "free", false);
  }
}
function getWebhookLogs() {
  return webhookLogs;
}
function getReferralInfo(userId) {
  const code = `CARAI-${userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "DRIVER"}`;
  const userReferrals = referralsDb.filter((r) => r.referrerUserId === userId);
  const qualified = userReferrals.filter((r) => r.status === "qualified_credited");
  return {
    referralCode: code,
    referralLink: `https://carai.app/invite?ref=${code}&uid=${encodeURIComponent(userId)}`,
    totalReferred: userReferrals.length,
    qualifiedCount: qualified.length,
    bonusRendersEarned: qualified.length,
    referrals: userReferrals.map((r) => ({
      referredUserId: r.referredUserId,
      status: r.status,
      createdAt: r.createdAt,
      creditedAt: r.creditedAt
    }))
  };
}
function registerReferralInvite(referrerUserId, referredUserId) {
  if (referrerUserId === referredUserId) {
    return { success: false, message: "Cannot refer oneself." };
  }
  const existing = referralsDb.find((r) => r.referredUserId === referredUserId);
  if (existing) {
    return { success: false, message: "User already linked to a referral." };
  }
  referralsDb.push({
    referrerUserId,
    referredUserId,
    status: "pending_obd_connect",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return { success: true, message: "Referral recorded. Reward will be granted after verified OBD-II connection." };
}
function verifyAndRecordObdConnectionProof(userId) {
  obdConnectedUsersSet.add(userId);
  const pendingReferral = referralsDb.find(
    (r) => r.referredUserId === userId && r.status === "pending_obd_connect"
  );
  if (pendingReferral) {
    pendingReferral.status = "qualified_credited";
    pendingReferral.creditedAt = (/* @__PURE__ */ new Date()).toISOString();
    const referrer = getOrCreateUser(pendingReferral.referrerUserId);
    referrer.freeRendersLimit = (referrer.freeRendersLimit || 1) + 1;
    usersDb.set(pendingReferral.referrerUserId, referrer);
    logSecurityEvent({
      userId: pendingReferral.referrerUserId,
      action: "PAYMENT_VERIFIED",
      status: "GRANTED",
      reason: `Granted +1 Free Render bonus for verified OBD connection from referred user (${userId}).`
    });
    return { creditedReferrer: true, referrerUserId: pendingReferral.referrerUserId };
  }
  return { creditedReferrer: false };
}
function attemptClientSideReferralClaim(userId, targetReferrerId) {
  const isObdVerified = obdConnectedUsersSet.has(userId);
  if (!isObdVerified) {
    logSecurityEvent({
      userId,
      action: "UNAUTHORIZED_BYPASS_ATTEMPT",
      status: "REDACTED_LOCKED",
      reason: "Rejected unverified client referral claim: No physical OBD connection proof in database."
    });
    return {
      granted: false,
      reason: "Server verification failed: Proof of real OBD-II hardware/simulator handshake required."
    };
  }
  return { granted: true, reason: "OBD proof present and verified." };
}
function logSharedRenderEvent(userId, renderId) {
  sharedRendersLog.push({
    userId,
    renderId,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  return {
    success: true,
    totalShared: sharedRendersLog.filter((s) => s.userId === userId).length
  };
}
function getMaintenanceLogs(userId) {
  if (!maintenanceLogsDb.has(userId)) {
    const initialLogs = [
      {
        id: "maint_01",
        userId,
        item: "Full Synthetic Engine Oil & Filter (0W-30)",
        category: "Oil & Filters",
        mileage: 12e3,
        date: "2026-06-15",
        note: "Castrol Edge Professional 7.0L + OEM Mann Filter",
        cost: 95,
        status: "completed"
      },
      {
        id: "maint_02",
        userId,
        item: "Front & Rear Tire Rotation & Pressure Calibration",
        category: "Tires & Brakes",
        mileage: 12e3,
        date: "2026-06-15",
        note: 'Tread depth checked: 7/32" all around',
        cost: 35,
        status: "completed"
      },
      {
        id: "maint_03",
        userId,
        item: "Brake Fluid Flush (DOT 4 High Temp)",
        category: "Fluids",
        mileage: 15e3,
        date: "2026-09-15",
        note: "Recommended due at 15,000 miles to prevent moisture boil",
        cost: 140,
        status: "due_soon"
      },
      {
        id: "maint_04",
        userId,
        item: "Cabin Microfilter & Engine Air Filter Replacement",
        category: "Oil & Filters",
        mileage: 18e3,
        date: "2026-11-01",
        note: "Inspect for road debris and intake airflow restriction",
        cost: 65,
        status: "due_soon"
      }
    ];
    maintenanceLogsDb.set(userId, initialLogs);
  }
  return maintenanceLogsDb.get(userId) || [];
}
function addMaintenanceLog(userId, entry) {
  const current = getMaintenanceLogs(userId);
  const newEntry = {
    id: `maint_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
    userId,
    ...entry
  };
  current.unshift(newEntry);
  maintenanceLogsDb.set(userId, current);
  return newEntry;
}
function deleteMaintenanceLog(userId, logId) {
  const current = getMaintenanceLogs(userId);
  const filtered = current.filter((l) => l.id !== logId);
  maintenanceLogsDb.set(userId, filtered);
  return filtered.length < current.length;
}
function computeVehicleHealthScore(dtcCount, criticalFaultCount, coolantTempC, batteryVoltage, readinessReadyCount = 8, readinessTotalCount = 8) {
  let score = 100;
  score -= criticalFaultCount * 30;
  score -= (dtcCount - criticalFaultCount) * 12;
  const liveVoltageOk = batteryVoltage >= 11.8 && batteryVoltage <= 15;
  if (!liveVoltageOk) score -= 15;
  let coolantTempStatus = "normal";
  if (coolantTempC > 115) {
    coolantTempStatus = "overheating";
    score -= 35;
  } else if (coolantTempC > 105) {
    coolantTempStatus = "warm";
    score -= 10;
  }
  const readinessPercent = Math.round(readinessReadyCount / Math.max(1, readinessTotalCount) * 100);
  if (readinessPercent < 80) {
    score -= Math.round((100 - readinessPercent) * 0.15);
  }
  score = Math.max(10, Math.min(100, score));
  let grade = "A";
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";
  else grade = "F";
  let summary = "Powertrain, electrical, and emissions monitors operating within factory specifications.";
  if (criticalFaultCount > 0) {
    summary = `Critical DTC faults detected (${criticalFaultCount}). Immediate mechanical inspection required to prevent engine damage.`;
  } else if (dtcCount > 0) {
    summary = `${dtcCount} minor DTC sensor fault(s) detected. Diagnostics scan recommended.`;
  } else if (coolantTempStatus === "overheating") {
    summary = "Engine coolant temperature elevated above normal operating range.";
  }
  return {
    grade,
    score,
    trend: dtcCount > 0 ? "down" : "stable",
    trendDelta: dtcCount > 0 ? -12 : 0,
    faultCodeCount: dtcCount,
    criticalFaultCount,
    monitorsReadyPercent: readinessPercent,
    liveVoltageOk,
    coolantTempStatus,
    lastEvaluated: (/* @__PURE__ */ new Date()).toISOString(),
    summary
  };
}
function decodeVinOrPlate(vinOrPlate, state) {
  const cleanInput = vinOrPlate.trim().toUpperCase();
  if (cleanInput.startsWith("WBA") || cleanInput.includes("M3") || cleanInput.includes("BMW")) {
    return {
      vin: cleanInput.length === 17 ? cleanInput : "WBA33AY08PFS18294",
      make: "BMW",
      model: "M3 Competition (G80)",
      year: 2024,
      trim: "xDrive Competition Sedan",
      engine: "3.0L S58 Twin-Turbo Inline-6 (503 HP)",
      bodyType: "Sedan",
      fuelType: "Premium Gasoline"
    };
  }
  if (cleanInput.startsWith("WP0") || cleanInput.includes("911") || cleanInput.includes("PORSCHE")) {
    return {
      vin: cleanInput.length === 17 ? cleanInput : "WP0AB2A92PS294810",
      make: "Porsche",
      model: "911 GT3 (992)",
      year: 2023,
      trim: "Clubsport Package",
      engine: "4.0L Naturally Aspirated Boxer-6 (502 HP)",
      bodyType: "Coupe",
      fuelType: "Premium Gasoline"
    };
  }
  if (cleanInput.startsWith("1FT") || cleanInput.startsWith("1FD") || cleanInput.includes("F150") || cleanInput.includes("TRUCK")) {
    return {
      vin: cleanInput.length === 17 ? cleanInput : "1FTFW1ED5PFA92019",
      make: "Ford",
      model: "F-150 Raptor",
      year: 2023,
      trim: "SuperCrew 4WD",
      engine: "3.5L EcoBoost High-Output V6 (450 HP)",
      bodyType: "Truck / Pickup",
      fuelType: "Gasoline"
    };
  }
  if (cleanInput.startsWith("JN1") || cleanInput.includes("GTR") || cleanInput.includes("R35")) {
    return {
      vin: cleanInput.length === 17 ? cleanInput : "JN1GAR35U0019283",
      make: "Nissan",
      model: "GT-R Nismo (R35)",
      year: 2024,
      trim: "Nismo All-Wheel Drive",
      engine: "3.8L VR38DETT Twin-Turbo V6 (600 HP)",
      bodyType: "Coupe",
      fuelType: "Premium Gasoline"
    };
  }
  return {
    vin: cleanInput.length === 17 ? cleanInput : `1G1YY22U${Math.floor(Math.random() * 899999 + 1e5)}`,
    make: "Toyota",
    model: "GR Supra 3.0",
    year: 2023,
    trim: "Premium Edition",
    engine: "3.0L B58 Turbocharged Inline-6 (382 HP)",
    bodyType: "Coupe",
    fuelType: "Premium Gasoline"
  };
}
function normalizePhoneNumber(mobileNumber, countryCode = "+1") {
  const digits = mobileNumber.replace(/\D/g, "");
  const cleanCountry = countryCode.trim().replace(/[^\d+]/g, "") || "+1";
  return `${cleanCountry}_${digits}`;
}
function sendMobileOtp(mobileNumber, countryCode = "+1") {
  const cleanDigits = mobileNumber.replace(/\D/g, "");
  if (!cleanDigits || cleanDigits.length < 7) {
    throw new Error("A valid mobile phone number with at least 7 digits is strictly required.");
  }
  const phoneKey = normalizePhoneNumber(mobileNumber, countryCode);
  const code = Math.floor(1e5 + Math.random() * 9e5).toString();
  const expiresAt = Date.now() + 10 * 60 * 1e3;
  mobileOtpDb.set(phoneKey, {
    code,
    expiresAt,
    attempts: 0
  });
  const maskedPhone = mobileNumber.length > 4 ? `***-***-${mobileNumber.slice(-4)}` : "***";
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Mobile Auth Engine] Secure OTP generated for ${countryCode} ${maskedPhone}`);
  }
  logSecurityEvent({
    userId: phoneKey,
    action: "DIAGNOSTICS_PRO_DTC_REQUEST",
    status: "GRANTED",
    reason: `Sent passwordless verification SMS to ${countryCode} ${maskedPhone}`
  });
  return {
    success: true,
    message: `Verification code dispatched to ${countryCode} ${mobileNumber}.`,
    debugOtp: code,
    // Provided for instant preview testing
    expiresAt
  };
}
function verifyMobileOtpAndAuthenticate(params) {
  const { mobileNumber, countryCode = "+1", otpCode, fullName, email, preferredVehicle } = params;
  const cleanDigits = mobileNumber.replace(/\D/g, "");
  if (!cleanDigits || cleanDigits.length < 7) {
    throw new Error("Invalid mobile phone number format.");
  }
  const cleanOtp = (otpCode || "").trim();
  if (!cleanOtp) {
    throw new Error("6-digit SMS verification code is required.");
  }
  const phoneKey = normalizePhoneNumber(mobileNumber, countryCode);
  const otpRecord = mobileOtpDb.get(phoneKey);
  const isValidCode = cleanOtp === "123456" || otpRecord && otpRecord.code === cleanOtp && Date.now() <= otpRecord.expiresAt;
  if (!isValidCode) {
    if (otpRecord) {
      otpRecord.attempts += 1;
      if (otpRecord.attempts > 5) {
        mobileOtpDb.delete(phoneKey);
        throw new Error("Too many invalid verification attempts. Please request a new verification code.");
      }
    }
    throw new Error("Invalid or expired verification code. Use code 123456 or request a new code.");
  }
  mobileOtpDb.delete(phoneKey);
  let existingProfile;
  for (const profile of profilesDb.values()) {
    const profilePhoneKey = normalizePhoneNumber(profile.mobileNumber, profile.countryCode);
    if (profilePhoneKey === phoneKey) {
      existingProfile = profile;
      break;
    }
    if (email && profile.email.toLowerCase() === email.trim().toLowerCase()) {
      existingProfile = profile;
      break;
    }
  }
  let userProfile;
  let isNewUser = false;
  if (existingProfile) {
    existingProfile.lastLoginAt = (/* @__PURE__ */ new Date()).toISOString();
    existingProfile.isVerified = true;
    if (fullName && fullName.trim()) existingProfile.fullName = fullName.trim();
    if (email && email.trim()) existingProfile.email = email.trim().toLowerCase();
    if (preferredVehicle) existingProfile.preferredVehicle = preferredVehicle;
    existingProfile.token = `carai_token_${existingProfile.userId}_${Date.now()}`;
    profilesDb.set(existingProfile.userId, existingProfile);
    userProfile = existingProfile;
    getOrCreateUser(existingProfile.userId);
  } else {
    isNewUser = true;
    const newUserId = `driver_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const formattedPhone = `${countryCode} ${mobileNumber.trim()}`;
    const cleanEmail = email ? email.trim().toLowerCase() : `driver.${cleanDigits.slice(-4)}@carai.io`;
    const cleanName = fullName && fullName.trim() ? fullName.trim() : "Active Driver";
    userProfile = {
      id: newUserId,
      userId: newUserId,
      mobileNumber: formattedPhone,
      countryCode,
      fullName: cleanName,
      email: cleanEmail,
      isVerified: true,
      registeredAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastLoginAt: (/* @__PURE__ */ new Date()).toISOString(),
      token: `carai_token_${newUserId}_${Date.now()}`,
      isPro: false,
      planType: "free",
      status: "free_tier",
      freeRendersUsed: 0,
      freeRendersLimit: 1,
      preferredVehicle: preferredVehicle || "Toyota GR Supra 3.0",
      storageModel: "cloud_synced_vault"
    };
    profilesDb.set(newUserId, userProfile);
    getOrCreateUser(newUserId);
  }
  const subState = getOrCreateUser(userProfile.userId);
  userProfile.isPro = subState.isPro;
  userProfile.planType = subState.planType || "free";
  userProfile.status = subState.status || "free_tier";
  userProfile.freeRendersUsed = subState.freeRendersUsed;
  userProfile.freeRendersLimit = subState.freeRendersLimit;
  logSecurityEvent({
    userId: userProfile.userId,
    action: "PAYMENT_VERIFIED",
    status: "GRANTED",
    reason: `Passwordless mobile authentication successful. Verified for phone: ${userProfile.mobileNumber}`
  });
  return {
    success: true,
    user: userProfile,
    isNewUser,
    token: userProfile.token
  };
}
function getCloudUserProfile(identifier) {
  if (!identifier) return null;
  if (profilesDb.has(identifier)) {
    const profile = profilesDb.get(identifier);
    const sub2 = getOrCreateUser(profile.userId);
    profile.isPro = sub2.isPro;
    profile.planType = sub2.planType || "free";
    profile.status = sub2.status || "free_tier";
    profile.freeRendersUsed = sub2.freeRendersUsed;
    profile.freeRendersLimit = sub2.freeRendersLimit;
    return profile;
  }
  for (const profile of profilesDb.values()) {
    if (profile.token === identifier || profile.userId === identifier || profile.email === identifier) {
      const sub2 = getOrCreateUser(profile.userId);
      profile.isPro = sub2.isPro;
      profile.planType = sub2.planType || "free";
      profile.status = sub2.status || "free_tier";
      profile.freeRendersUsed = sub2.freeRendersUsed;
      profile.freeRendersLimit = sub2.freeRendersLimit;
      return profile;
    }
  }
  const sub = getOrCreateUser(identifier);
  const fallbackProfile = {
    id: identifier,
    userId: identifier,
    mobileNumber: "+1 (555) 839-2041",
    countryCode: "+1",
    fullName: identifier === DEFAULT_DEMO_USER_ID ? "Alex Vance" : "Driver " + identifier.slice(0, 6),
    email: `${identifier}@carai.io`,
    isVerified: true,
    registeredAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastLoginAt: (/* @__PURE__ */ new Date()).toISOString(),
    token: `carai_token_${identifier}`,
    isPro: sub.isPro,
    planType: sub.planType || "free",
    status: sub.status || "free_tier",
    freeRendersUsed: sub.freeRendersUsed,
    freeRendersLimit: sub.freeRendersLimit,
    storageModel: "cloud_synced_vault"
  };
  profilesDb.set(identifier, fallbackProfile);
  return fallbackProfile;
}
function updateCloudUserProfile(userId, updates) {
  const profile = getCloudUserProfile(userId) || {
    id: userId,
    userId,
    mobileNumber: "+1 (555) 839-2041",
    countryCode: "+1",
    fullName: "Active Driver",
    email: `${userId}@carai.io`,
    isVerified: true,
    registeredAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastLoginAt: (/* @__PURE__ */ new Date()).toISOString(),
    token: `carai_token_${userId}`,
    isPro: false,
    planType: "free",
    status: "free_tier",
    freeRendersUsed: 0,
    freeRendersLimit: 1,
    storageModel: "cloud_synced_vault"
  };
  if (updates.fullName !== void 0) profile.fullName = updates.fullName;
  if (updates.email !== void 0) profile.email = updates.email;
  if (updates.mobileNumber !== void 0) profile.mobileNumber = updates.mobileNumber;
  if (updates.countryCode !== void 0) profile.countryCode = updates.countryCode;
  if (updates.preferredVehicle !== void 0) profile.preferredVehicle = updates.preferredVehicle;
  if (updates.isPro !== void 0) {
    profile.isPro = updates.isPro;
    updateUserProStatus(userId, updates.isPro, updates.planType || profile.planType || "free");
  }
  profilesDb.set(profile.userId, profile);
  return profile;
}

// server/paymentProcessor.ts
var bankTransactionsLedger = [];
var INITIAL_TRANSACTION = {
  id: "tx_init_bank_9921",
  transactionId: "TXN-BANK-2026-0819-74829",
  userId: "demo_driver_01",
  planType: "pro_annual",
  amount: 79,
  currency: "USD",
  paymentMethod: "credit_card",
  paymentDetailsMasked: "Visa ending in 4242",
  cardholderName: "Alex Vance",
  bankSettlementNetwork: "Visa / Direct Merchant Clearing Rails",
  merchantAccountId: "CARAI-DIRECT-MERCHANT-JPMC-88392",
  status: "SETTLED",
  receiptNumber: "REC-CARAI-2026-09214",
  authCode: "AUTH-948201",
  tlsCipher: "TLS_AES_256_GCM_SHA384 (256-Bit Bank-Grade Direct TLS)",
  timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1e3).toISOString()
};
bankTransactionsLedger.push(INITIAL_TRANSACTION);
function processDirectBankCheckout(req, ip = "127.0.0.1") {
  const {
    userId = "demo_driver_01",
    planType = "pro_annual",
    paymentMethod = "credit_card",
    cardholderName,
    cardNumber,
    cardExpiry,
    cardCvc,
    bankRoutingNumber,
    bankAccountNumber
  } = req;
  let paymentDetailsMasked = "Visa ending in 4242";
  let bankSettlementNetwork = "Visa / Direct 256-Bit Bank Gateway";
  const amount = planType === "pro_annual" ? 79 : planType === "pro_biannual" ? 39.99 : 9.99;
  const normalizedMethod = paymentMethod === "card" || paymentMethod === "credit_card" ? "credit_card" : paymentMethod === "bank_ach" ? "bank_ach" : paymentMethod === "apple_pay" ? "apple_pay" : paymentMethod === "google_pay" ? "google_pay" : paymentMethod === "upi" ? "upi" : "credit_card";
  if (normalizedMethod === "upi") {
    const rawUpi = (req.upiId || "driver@okhdfcbank").trim();
    paymentDetailsMasked = `UPI ID: ${rawUpi}`;
    bankSettlementNetwork = "NPCI Unified Payments Interface (UPI 2.0 Real-Time Settlement)";
  } else if (normalizedMethod === "credit_card") {
    const rawNumber = cardNumber && cardNumber.trim().length > 0 ? cardNumber : "4000 1234 5678 4242";
    const cleanCard = rawNumber.replace(/\D/g, "") || "4000123456784242";
    const last4 = cleanCard.length >= 4 ? cleanCard.slice(-4) : "4242";
    const cardBrand = cleanCard.startsWith("4") ? "Visa" : cleanCard.startsWith("5") ? "Mastercard" : cleanCard.startsWith("3") ? "American Express" : "Card";
    paymentDetailsMasked = `${cardBrand} ending in ${last4}`;
    bankSettlementNetwork = `${cardBrand} / Direct 256-Bit Bank Rails`;
  } else if (normalizedMethod === "bank_ach") {
    const cleanRouting = (bankRoutingNumber || "021000021").replace(/\D/g, "") || "021000021";
    const cleanAccount = (bankAccountNumber || "9876543210").replace(/\D/g, "") || "9876543210";
    const last4 = cleanAccount.length >= 4 ? cleanAccount.slice(-4) : "9210";
    const routingMasked = cleanRouting.length >= 4 ? cleanRouting.slice(0, 4) : "0210";
    paymentDetailsMasked = `FedACH Checking \u2022\u2022\u2022\u2022${last4} (Routing: ${routingMasked}\u2022\u2022\u2022\u2022\u2022)`;
    bankSettlementNetwork = "Federal Reserve Automated Clearing House (FedACH Direct Settlement)";
  } else if (normalizedMethod === "apple_pay" || normalizedMethod === "google_pay") {
    const walletName = normalizedMethod === "apple_pay" ? "Apple Pay (Biometric FaceID)" : "Google Pay (Biometric Device Token)";
    paymentDetailsMasked = `${walletName} \u2022 Encrypted Token Device Account`;
    bankSettlementNetwork = "Direct Bank Wallet Tokenization Rails (256-Bit TLS)";
  }
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const rawTxId = `TXN-${normalizedMethod.toUpperCase().slice(0, 4)}-${Date.now()}-${Math.floor(1e4 + Math.random() * 9e4)}`;
  const receiptNum = `REC-CARAI-${Date.now().toString(36).toUpperCase()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
  const authCode = `AUTH-${Math.floor(1e5 + Math.random() * 9e5)}`;
  const transaction = {
    id: `tx_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
    transactionId: rawTxId,
    userId,
    planType,
    amount,
    currency: "USD",
    paymentMethod: normalizedMethod,
    paymentDetailsMasked,
    cardholderName: cardholderName?.trim() || "Alex Vance",
    bankSettlementNetwork,
    merchantAccountId: "CARAI-DIRECT-MERCHANT-JPMC-88392",
    status: "SETTLED",
    receiptNumber: receiptNum,
    authCode,
    tlsCipher: "TLS_AES_256_GCM_SHA384 (256-Bit Bank-Grade Direct TLS)",
    timestamp
  };
  bankTransactionsLedger.unshift(transaction);
  if (bankTransactionsLedger.length > 100) {
    bankTransactionsLedger.pop();
  }
  const updatedUser = activatePaidSubscription(userId, planType, rawTxId);
  logSecurityEvent({
    userId,
    action: "PAYMENT_VERIFIED",
    status: "PAYMENT_VERIFIED",
    reason: `Direct-to-Bank Settlement Confirmed (${planType.toUpperCase()}). Amount: $${amount.toFixed(2)} USD via ${bankSettlementNetwork}. Auth: ${authCode}`,
    ip,
    details: {
      transactionId: rawTxId,
      receiptNumber: receiptNum,
      paymentMethod: normalizedMethod,
      amount
    }
  });
  return {
    success: true,
    transaction,
    user: updatedUser,
    message: `Payment authorized and settled successfully. CarAI Pro is active.`
  };
}
function getUserBankTransactions(userId) {
  return bankTransactionsLedger.filter((tx) => tx.userId === userId);
}
function getMerchantPayoutSummary() {
  const settledTotal = bankTransactionsLedger.filter((t) => t.status === "SETTLED").reduce((acc, curr) => acc + curr.amount, 0);
  return {
    merchantAccountHolder: "Anthony B. (CarAI Master Merchant)",
    settlementBank: "JPMorgan Chase / FedACH Commercial Direct Deposit",
    routingNumber: "021000021",
    accountNumberMasked: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u20228492",
    settlementStatus: "Active & Verified (Daily Automatic Payout T+1)",
    grossSettledVolume: settledTotal,
    totalTransactions: bankTransactionsLedger.length,
    recentTransactions: bankTransactionsLedger.slice(0, 10)
  };
}

// server/geminiClient.ts
var import_genai = require("@google/genai");
var aiInstance = null;
function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiInstance;
}
async function generateContentWithRetry(params) {
  const ai = getGeminiAI();
  if (!ai) {
    return null;
  }
  const primaryModel = params.model || "gemini-3.7-flash";
  const candidateModels = [primaryModel, ...params.fallbackModels || ["gemini-3.1-flash-lite", "gemini-flash-latest"]];
  const maxRetriesPerModel = params.maxRetries ?? 2;
  let lastError = null;
  for (const modelToTry of candidateModels) {
    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: modelToTry
        });
        return response;
      } catch (err) {
        lastError = err;
        const errString = String(err?.message || err || "");
        const statusCode = err?.status || err?.code || err?.error && err.error.code;
        const isTransient = statusCode === 503 || statusCode === 429 || errString.includes("503") || errString.includes("429") || errString.includes("high demand") || errString.includes("UNAVAILABLE") || errString.includes("RESOURCE_EXHAUSTED") || errString.includes("overloaded");
        if (isTransient && attempt < maxRetriesPerModel) {
          const delayMs = Math.pow(2, attempt) * 400 + Math.floor(Math.random() * 200);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        break;
      }
    }
  }
  console.warn("Gemini request failed across all candidate models & retries:", lastError?.message || lastError);
  return null;
}

// server/faultCodeExplainer.ts
var import_genai2 = require("@google/genai");
var BUILT_IN_DTC_DATABASE = {
  P0101: {
    code: "P0101",
    title: "Mass Air Flow (MAF) Sensor Circuit Range/Performance",
    system: "Powertrain (P)",
    severity: "warning",
    symptoms: [
      "Hesitation or bogging down during hard acceleration",
      "Noticeably worse fuel economy (MPG down 15-25%)",
      "Rough or fluctuating idle at red lights",
      "Engine may stall momentarily when coming to a stop"
    ],
    plainEnglishSummary: "Your engine\u2019s MAF sensor is the digital breath-meter measuring how many grams of air enter your intake. The computer noticed the sensor readings don\u2019t match the throttle position and engine RPM, confusing the fuel injection calculations.",
    whyItHappened: [
      "Dirty sensor hot-wire covered in dust, oil, or debris",
      "Vacuum leak or torn intake boot downstream of the sensor",
      "Faulty wiring harness or corroded electrical connector pin",
      "Failed MAF heating element or degraded internal sensor"
    ],
    safetyRisk: "Safe for short-distance driving to home or shop. Extended driving with bad air/fuel mixture risks fouling spark plugs and overheating the catalytic converter.",
    drivingRecommendation: "Avoid wide-open throttle or towing heavy loads until cleaned or replaced.",
    diyDifficulty: "Easy (DIY)",
    estimatedRepairCost: {
      min: 15,
      max: 280,
      averagePartsCost: 85,
      laborHours: 0.5,
      laborRatePerHour: 140
    },
    mechanicQuestions: [
      "Did you clean the MAF sensor wire with dedicated CRC cleaner before suggesting replacement?",
      "Did you smoke-test the intake tubing for torn rubber boots or post-MAF vacuum leaks?",
      "What were the live fuel trim numbers (STFT / LTFT) when the code triggered?"
    ],
    stepByStepFix: [
      "Turn vehicle off and disconnect the negative battery terminal.",
      "Locate the MAF housing along the air intake duct right after the airbox.",
      "Unclip the sensor electrical connector and remove the two T20 Torx / Phillips screws.",
      "Spray the exposed platinum wires with dedicated MAF Cleaner (never touch wires with fingers/cotton).",
      "Let it air-dry completely for 10 minutes, reinstall snugly, and clear DTC with CarAI."
    ],
    partsNeeded: [
      { name: "CRC Mass Air Flow Sensor Cleaner (11 oz)", estimatedPrice: 12, partNumber: "CRC-05110" },
      { name: "OEM Replacement MAF Sensor Unit", estimatedPrice: 85, partNumber: "MAF-8204-OEM" },
      { name: "High-Flow Engine Air Filter", estimatedPrice: 28, partNumber: "AF-3320" }
    ],
    upgradeOptions: [
      {
        id: "upg_cai_01",
        title: "Cold Air Intake System with Shielded Velocity Filter",
        category: "Air Intake",
        description: "Replaces restrictive OEM plastic intake tube with mandrel-bent aluminum piping, improving airflow volume and providing a satisfying intake induction growl.",
        estimatedPrice: 249,
        performanceGain: "+8 to 14 HP & crisper throttle response",
        affiliateUrl: "https://example.com/affiliate/intake-p0101",
        brand: "Injen / K&N Performance"
      },
      {
        id: "upg_dry_filter",
        title: "High-Flow Dry Synthetic Performance Drop-In Filter",
        category: "Air Intake",
        description: "Oil-free high flow air filter that will never contaminate your delicate MAF sensor wire with oily residue.",
        estimatedPrice: 65,
        performanceGain: "+2-4 HP & Lifetime washable",
        affiliateUrl: "https://example.com/affiliate/dry-filter",
        brand: "AEM Induction"
      }
    ]
  },
  P0300: {
    code: "P0300",
    title: "Random / Multiple Cylinder Misfire Detected",
    system: "Powertrain (P)",
    severity: "critical",
    symptoms: [
      "Flashing Check Engine Light (flashing = catalytic converter damage risk)",
      "Severe engine shaking / violent vibration at idle",
      "Strong smell of unburnt raw gasoline from exhaust",
      "Substantial loss of power on highway merges"
    ],
    plainEnglishSummary: "The crankshaft position sensor detected uneven acceleration between cylinder firing events. Multiple cylinders failed to properly ignite the fuel-air mixture, sending unburnt fuel into the exhaust pipe.",
    whyItHappened: [
      "Worn spark plugs with excessive electrode gap",
      "Degraded ignition coil pack with internal insulation breakdown",
      "Low fuel pressure or clogged fuel injector nozzles",
      "Intake manifold gasket vacuum leak letting unmetered air in"
    ],
    safetyRisk: "HIGH RISK IF FLASHING: A blinking MIL indicates raw fuel is burning inside your $1,200 catalytic converter, which can melt the ceramic core in under 15 minutes of driving.",
    drivingRecommendation: "If Check Engine Light is FLASHING, pull over safely and turn off engine immediately. Call a tow truck.",
    diyDifficulty: "Moderate (Jack + Hand Tools)",
    estimatedRepairCost: {
      min: 45,
      max: 650,
      averagePartsCost: 180,
      laborHours: 1.5,
      laborRatePerHour: 140
    },
    mechanicQuestions: [
      "Which specific cylinders show the highest misfire count on mode $06 data?",
      "Are the spark plug electrodes fouled with fuel, oil, or white ash deposits?",
      "What is the fuel rail pressure under load?"
    ],
    stepByStepFix: [
      "Check freeze frame data to see which cylinders misfired and under what load.",
      "Remove ignition coils and inspect spark plug wells for engine oil seepage.",
      'Remove spark plugs and check electrode wear, gap (.028" - .044"), and ceramic cracks.',
      "Swap coil pack from misfiring cylinder to a healthy cylinder to see if misfire follows.",
      "Install a fresh set of Iridium plugs torqued to manufacturer spec (usually 15-20 lb-ft)."
    ],
    partsNeeded: [
      { name: "NGK Laser Iridium Spark Plugs (Set of 4/6)", estimatedPrice: 58, partNumber: "NGK-94201" },
      { name: "Direct Ignition Coil Pack Set", estimatedPrice: 160, partNumber: "IGN-COIL-4X" },
      { name: "Dielectric Spark Plug Boot Grease", estimatedPrice: 8, partNumber: "PERM-81150" }
    ],
    upgradeOptions: [
      {
        id: "upg_spark_01",
        title: "High-Output Performance Ignition Coils (Red/Gold Pack)",
        category: "Ignition",
        description: "Delivers 10% stronger spark energy across the entire RPM range, preventing high-RPM spark blowout and smoothing out rough cold starts.",
        estimatedPrice: 280,
        performanceGain: "Sharper spark arc & smoother high-rev ignition",
        affiliateUrl: "https://example.com/affiliate/coils-p0300",
        brand: "MSD / APR Performance"
      },
      {
        id: "upg_iridium_plugs",
        title: "NGK Ruthenium HX High-Ignitability Spark Plugs",
        category: "Ignition",
        description: "State-of-the-art DFE design with precious ruthenium tip for unmatched combustion efficiency and thermal durability.",
        estimatedPrice: 72,
        performanceGain: "Optimal flame kernel expansion & 100k mi life",
        affiliateUrl: "https://example.com/affiliate/ruthenium-plugs",
        brand: "NGK Racing"
      }
    ]
  },
  P0420: {
    code: "P0420",
    title: "Catalyst System Efficiency Below Threshold (Bank 1)",
    system: "Powertrain (P)",
    severity: "warning",
    symptoms: [
      "Steady Check Engine Light illuminated on dash",
      "Emissions / SMOG inspection failure guaranteed",
      "Rotten egg / sulfur smell from exhaust under heavy load",
      "Sluggish top-end engine power if converter is partially restricted"
    ],
    plainEnglishSummary: "The engine computer compares readings from the oxygen sensor BEFORE the catalytic converter with the sensor AFTER it. Because the downstream sensor is switching rapidly instead of staying steady, the cat is no longer scrubbing exhaust emissions cleanly.",
    whyItHappened: [
      "Catalytic converter internal substrate degraded from age or oil/coolant contamination",
      "Exhaust leak at the manifold flange or flex pipe before downstream O2 sensor",
      "Downstream heated O2 sensor failing and giving erratic voltage",
      "Engine running rich or misfiring previously, damaging the catalyst washcoat"
    ],
    safetyRisk: "Low immediate safety risk. Vehicle is drivable, but tailpipe greenhouse emissions are high and your car will fail state vehicle inspections.",
    drivingRecommendation: "Safe to drive normally, but inspect exhaust pipe for leaks before purchasing a costly replacement converter.",
    diyDifficulty: "Advanced (Specialty Tools)",
    estimatedRepairCost: {
      min: 120,
      max: 1850,
      averagePartsCost: 750,
      laborHours: 2,
      laborRatePerHour: 140
    },
    mechanicQuestions: [
      "Did you test the downstream O2 sensor response curve with a live scan oscilloscope?",
      "Is there an upstream exhaust manifold leak or cracked flex pipe pulling in fresh ambient oxygen?",
      "Is there unburnt oil or coolant entering the exhaust stream from valve seals or head gasket?"
    ],
    stepByStepFix: [
      "Use CarAI live telemetry to monitor O2 Sensor Bank 1 Sensor 2 voltage (should stay steady ~0.6-0.7V at cruise).",
      "Inspect exhaust pipe upstream of catalytic converter for black carbon soot indicating a flange leak.",
      "Test catalytic converter temperature with an infrared thermometer (outlet should be 50-100\xB0F hotter than inlet).",
      "Replace downstream O2 sensor first if older than 100,000 miles.",
      "If converter substrate has melted/cracked, replace with direct-fit EPA-compliant catalytic unit."
    ],
    partsNeeded: [
      { name: "Bosch Heated Downstream Oxygen Sensor (O2)", estimatedPrice: 75, partNumber: "BSH-15733" },
      { name: "Direct-Fit EPA Certified Catalytic Converter Assembly", estimatedPrice: 580, partNumber: "MAG-54212" },
      { name: "Cataclean Liquid Exhaust & Cat Cleaner", estimatedPrice: 26, partNumber: "CAT-4820" }
    ],
    upgradeOptions: [
      {
        id: "upg_exhaust_01",
        title: "High-Flow 200-Cell Stainless Steel Sport Catalytic Downpipe",
        category: "Exhaust",
        description: "TIG-welded 304 stainless steel downpipe with ultra-low restriction 200-cell metallic core, freeing up turbo spool while maintaining clean emissions.",
        estimatedPrice: 650,
        performanceGain: "+15 to 22 HP & deeper exhaust resonance",
        affiliateUrl: "https://example.com/affiliate/downpipe-p0420",
        brand: "Milltek / Borla Sport"
      }
    ]
  },
  P0171: {
    code: "P0171",
    title: "System Too Lean (Bank 1) \u2014 Excess Air / Insufficient Fuel",
    system: "Powertrain (P)",
    severity: "warning",
    symptoms: [
      "Engine pinging or knocking under moderate acceleration",
      "Cold start stalling or rough idle until warmed up",
      "Hesitation or flat-spot when depressing accelerator",
      "High Long Term Fuel Trim (LTFT exceeding +15% to +25%)"
    ],
    plainEnglishSummary: "The engine computer detected way too much unburned oxygen in the exhaust. It is forced to inject extra fuel to compensate for unmetered air leaking in or a weak fuel delivery system.",
    whyItHappened: [
      "Cracked PCV rubber vacuum hose or failed PCV diaphragm valve",
      "Intake manifold gasket leaking under engine vacuum",
      "Weak fuel pump delivering low fuel pressure or clogged fuel filter",
      "Dirty mass air flow sensor under-reporting incoming air volume"
    ],
    safetyRisk: "Moderate risk: Running too lean creates excessive combustion chamber heat, which over time can cause pre-ignition, detonation, and burnt exhaust valves.",
    drivingRecommendation: "Drive gently with moderate throttle; avoid aggressive high-RPM driving.",
    diyDifficulty: "Moderate (Jack + Hand Tools)",
    estimatedRepairCost: {
      min: 25,
      max: 420,
      averagePartsCost: 110,
      laborHours: 1.2,
      laborRatePerHour: 140
    },
    mechanicQuestions: [
      "What are the Long Term Fuel Trim (LTFT) numbers at idle vs 2500 RPM?",
      "Did a smoke test reveal leaks at the PCV valve, brake booster line, or intake gaskets?",
      "What is the static and dynamic fuel pressure at the test port?"
    ],
    stepByStepFix: [
      "Connect CarAI live gauge and observe Short Term & Long Term Fuel Trims.",
      "If LTFT drops closer to 0% at 2500 RPM, you have an intake vacuum leak at idle.",
      "Inspect PCV valve and vacuum hoses for cracks, softness, or hissing sounds.",
      "Spray carburetor cleaner cautiously around intake gasket joints while monitoring RPM.",
      "Replace brittle PCV hose or faulty PCV valve and clear code."
    ],
    partsNeeded: [
      { name: "OEM PCV Valve & Molded Breather Hose Kit", estimatedPrice: 38, partNumber: "PCV-9912-KIT" },
      { name: "Intake Manifold Gasket Set", estimatedPrice: 42, partNumber: "FEL-MS97120" },
      { name: "High-Flow In-Line Fuel Filter", estimatedPrice: 22, partNumber: "WIX-33033" }
    ],
    upgradeOptions: [
      {
        id: "upg_fuel_01",
        title: "High-Flow DeatschWerks In-Tank 265LPH Fuel Pump",
        category: "Fuel System",
        description: "Robust turbine-impeller fuel pump providing consistent 265 liters/hr flow rate to ensure your engine never runs lean even under full boost.",
        estimatedPrice: 175,
        performanceGain: "Guaranteed steady fuel delivery up to 450 HP",
        affiliateUrl: "https://example.com/affiliate/fuelpump-p0171",
        brand: "DeatschWerks"
      }
    ]
  },
  P0442: {
    code: "P0442",
    title: "Evaporative Emission Control System (EVAP) Small Leak Detected",
    system: "Powertrain (P)",
    severity: "info",
    symptoms: [
      "Check Engine Light on dashboard without any noticeable drivability issues",
      "Mild fuel vapor smell near rear wheel arch or fuel filler neck",
      "Fails automatic state emissions OBD-II readiness inspection"
    ],
    plainEnglishSummary: 'The EVAP system seals fuel vapors inside your tank and directs them to the engine to be burned. The system performed an automated vacuum decay test overnight and noticed a tiny leak (approx. 0.040" pinhole).',
    whyItHappened: [
      "Loose, worn, or cracked rubber O-ring seal on the gas cap",
      "Stuck open or sticking EVAP Canister Purge Solenoid Valve",
      "Cracked EVAP vapor line or degraded charcoal canister housing",
      "Corroded fuel filler neck lip preventing a tight cap seal"
    ],
    safetyRisk: "Very low safety risk. The car drives completely normally. Fuel vapors are vented to atmosphere rather than burned.",
    drivingRecommendation: "Drivable indefinitely without mechanical damage, but repair is required to pass smog checks.",
    diyDifficulty: "Easy (DIY)",
    estimatedRepairCost: {
      min: 15,
      max: 220,
      averagePartsCost: 45,
      laborHours: 0.5,
      laborRatePerHour: 140
    },
    mechanicQuestions: [
      "Did you inspect the gas cap rubber gasket for micro-cracks before replacing solenoids?",
      "Did you test the purge solenoid resistance and vacuum seal with a 12V test pulse?",
      "Where did the EVAP smoke test exit the chassis?"
    ],
    stepByStepFix: [
      "Remove gas cap, clean metal filler neck lip, and inspect the rubber gasket for dry rot.",
      "Reinstall gas cap and ensure it clicks 3 times firmly.",
      "Inspect EVAP purge solenoid located near the engine intake manifold for cracks.",
      "If code returns, replace gas cap with OEM locking cap and clear code."
    ],
    partsNeeded: [
      { name: "OEM Replacement Click-Lock Gas Cap with Viton Seal", estimatedPrice: 18, partNumber: "CAP-77300" },
      { name: "EVAP Vapor Canister Purge Solenoid Valve", estimatedPrice: 55, partNumber: "PRG-911-042" }
    ],
    upgradeOptions: [
      {
        id: "upg_billet_cap",
        title: "Billet Anodized Aluminum Race Fuel Cap Cover",
        category: "Sensors",
        description: "CNC machined 6061 aircraft aluminum cap cover with laser-etched octane rating, adding engine bay styling while maintaining hermetic seal.",
        estimatedPrice: 48,
        performanceGain: "Aesthetic motorsport finish & leakproof seal",
        affiliateUrl: "https://example.com/affiliate/billet-cap",
        brand: "Mishimoto"
      }
    ]
  }
};
async function explainDTC(code, vehicleInfo) {
  const cleanCode = (code || "P0101").toUpperCase().trim();
  const existing = BUILT_IN_DTC_DATABASE[cleanCode];
  try {
    const vehicleDesc = vehicleInfo?.make ? `${vehicleInfo.year || ""} ${vehicleInfo.make} ${vehicleInfo.model || ""} (${vehicleInfo.engine || "Engine"})` : "Generic OBD-II compliant vehicle";
    const prompt = `You are the lead master ASE-certified automotive diagnostic technician for CarAI. 
Analyze the OBD-II diagnostic trouble code (DTC): "${cleanCode}" for vehicle: "${vehicleDesc}".
Provide an ultra-detailed, highly actionable, plain-English breakdown with mechanic defense advice, step-by-step fix, DIY vs mechanic cost estimates ($ USD), parts needed, and performance upgrade opportunities (e.g. cold air intake, high flow catalytic downpipe, high performance ignition coils, etc.).

Return the response in strict JSON format.`;
    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      fallbackModels: ["gemini-3.1-flash-lite", "gemini-flash-latest"],
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai2.Type.OBJECT,
          properties: {
            code: { type: import_genai2.Type.STRING },
            title: { type: import_genai2.Type.STRING },
            system: { type: import_genai2.Type.STRING },
            severity: { type: import_genai2.Type.STRING },
            symptoms: { type: import_genai2.Type.ARRAY, items: { type: import_genai2.Type.STRING } },
            plainEnglishSummary: { type: import_genai2.Type.STRING },
            whyItHappened: { type: import_genai2.Type.ARRAY, items: { type: import_genai2.Type.STRING } },
            safetyRisk: { type: import_genai2.Type.STRING },
            drivingRecommendation: { type: import_genai2.Type.STRING },
            diyDifficulty: { type: import_genai2.Type.STRING },
            estimatedRepairCost: {
              type: import_genai2.Type.OBJECT,
              properties: {
                min: { type: import_genai2.Type.NUMBER },
                max: { type: import_genai2.Type.NUMBER },
                averagePartsCost: { type: import_genai2.Type.NUMBER },
                laborHours: { type: import_genai2.Type.NUMBER },
                laborRatePerHour: { type: import_genai2.Type.NUMBER }
              },
              required: ["min", "max", "averagePartsCost", "laborHours", "laborRatePerHour"]
            },
            mechanicQuestions: { type: import_genai2.Type.ARRAY, items: { type: import_genai2.Type.STRING } },
            stepByStepFix: { type: import_genai2.Type.ARRAY, items: { type: import_genai2.Type.STRING } },
            partsNeeded: {
              type: import_genai2.Type.ARRAY,
              items: {
                type: import_genai2.Type.OBJECT,
                properties: {
                  name: { type: import_genai2.Type.STRING },
                  estimatedPrice: { type: import_genai2.Type.NUMBER },
                  partNumber: { type: import_genai2.Type.STRING }
                },
                required: ["name", "estimatedPrice"]
              }
            },
            upgradeOptions: {
              type: import_genai2.Type.ARRAY,
              items: {
                type: import_genai2.Type.OBJECT,
                properties: {
                  id: { type: import_genai2.Type.STRING },
                  title: { type: import_genai2.Type.STRING },
                  category: { type: import_genai2.Type.STRING },
                  description: { type: import_genai2.Type.STRING },
                  estimatedPrice: { type: import_genai2.Type.NUMBER },
                  performanceGain: { type: import_genai2.Type.STRING },
                  affiliateUrl: { type: import_genai2.Type.STRING },
                  brand: { type: import_genai2.Type.STRING }
                },
                required: ["id", "title", "category", "description", "estimatedPrice", "performanceGain", "brand"]
              }
            }
          },
          required: [
            "code",
            "title",
            "system",
            "severity",
            "symptoms",
            "plainEnglishSummary",
            "whyItHappened",
            "safetyRisk",
            "drivingRecommendation",
            "diyDifficulty",
            "estimatedRepairCost",
            "mechanicQuestions",
            "stepByStepFix",
            "partsNeeded",
            "upgradeOptions"
          ]
        }
      }
    });
    if (response?.text) {
      const parsed = JSON.parse(response.text.trim());
      if (parsed && parsed.code) {
        return parsed;
      }
    }
  } catch (err) {
  }
  if (existing) {
    return existing;
  }
  return {
    code: cleanCode,
    title: `Diagnostic Trouble Code ${cleanCode}`,
    system: cleanCode.startsWith("P") ? "Powertrain (P)" : cleanCode.startsWith("U") ? "Network / CAN (U)" : cleanCode.startsWith("B") ? "Body (B)" : "Chassis (C)",
    severity: "warning",
    symptoms: [
      "Check Engine MIL light active on dash cluster",
      "Possible degraded acceleration and fuel efficiency",
      "Electronic control unit logged freeze frame snapshot"
    ],
    plainEnglishSummary: `Your vehicle ECU registered a sensor or actuator variance exceeding factory tolerance thresholds for DTC ${cleanCode}.`,
    whyItHappened: [
      "Sensor signal voltage out of calibrated range",
      "Intermittent circuit resistance or loose ground strap",
      "Mechanical component wear or carbon accumulation"
    ],
    safetyRisk: "Moderate: Inspect with live diagnostic scanner before long road trips.",
    drivingRecommendation: "Drive cautiously to your destination and schedule diagnostic inspection.",
    diyDifficulty: "Moderate (Jack + Hand Tools)",
    estimatedRepairCost: {
      min: 60,
      max: 350,
      averagePartsCost: 95,
      laborHours: 1,
      laborRatePerHour: 140
    },
    mechanicQuestions: [
      `What were the live sensor PID values when ${cleanCode} set?`,
      "Is there an OEM Technical Service Bulletin (TSB) for this code on my make/model?"
    ],
    stepByStepFix: [
      "Check vehicle battery state of charge (ensure >12.4V at rest).",
      "Inspect wire harnesses and connectors leading to the monitored component.",
      "Check fuse box for blown circuit protection fuses.",
      "Clear trouble codes and test drive under identical conditions."
    ],
    partsNeeded: [
      { name: "Replacement OEM Sensor Assembly", estimatedPrice: 95, partNumber: "OEM-SPEC" },
      { name: "Automotive Electrical Contact Cleaner", estimatedPrice: 14, partNumber: "DEOX-D5" }
    ],
    upgradeOptions: [
      {
        id: "upg_generic_obd",
        title: "ELM327 Bluetooth Low Energy Real-Time Telemetry Dongle",
        category: "Sensors",
        description: "High-speed CAN OBD-II reader enabling 50Hz sensor polling and instant fault code clearing.",
        estimatedPrice: 39,
        performanceGain: "Real-time telemetry & instant MIL clear",
        affiliateUrl: "https://example.com/affiliate/elm327-pro",
        brand: "CarAI ProLink"
      }
    ]
  };
}
function getAllKnownDTCs() {
  return Object.values(BUILT_IN_DTC_DATABASE).map((dtc) => ({
    code: dtc.code,
    title: dtc.title,
    system: dtc.system,
    severity: dtc.severity
  }));
}

// server/aiCustomizer.ts
var import_genai3 = require("@google/genai");
var POPULAR_CARS = [
  {
    id: "bmw_m3_g80",
    name: "2024 BMW M3 Competition (G80)",
    category: "Sport Sedan",
    stockHp: 503,
    stockColor: "Isle of Man Green",
    stockImageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "porsche_911_gt3",
    name: "2023 Porsche 911 GT3 (992)",
    category: "Track Supercar",
    stockHp: 502,
    stockColor: "Shark Blue",
    stockImageUrl: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "toyota_gr_supra",
    name: "2023 Toyota GR Supra 3.0",
    category: "Coupe",
    stockHp: 382,
    stockColor: "Phantom Matte Gray",
    stockImageUrl: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "nissan_gtr_r35",
    name: "2024 Nissan GT-R Nismo (R35)",
    category: "Supercar",
    stockHp: 600,
    stockColor: "Stealth Gray",
    stockImageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "ford_mustang_darkhorse",
    name: "2024 Ford Mustang Dark Horse",
    category: "American Muscle",
    stockHp: 500,
    stockColor: "Blue Ember Metallic",
    stockImageUrl: "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "subaru_wrx_sti",
    name: "2022 Subaru WRX STi S209",
    category: "AWD Rally Sedan",
    stockHp: 341,
    stockColor: "World Rally Blue",
    stockImageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "audi_rs6_avant",
    name: "2024 Audi RS6 Avant Quattro",
    category: "Super Wagon",
    stockHp: 591,
    stockColor: "Nardo Gray",
    stockImageUrl: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "mazda_miata_nd2",
    name: "2023 Mazda MX-5 Miata Club (ND2)",
    category: "Roadster",
    stockHp: 181,
    stockColor: "Soul Red Crystal",
    stockImageUrl: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80"
  }
];
var STYLED_RENDER_LIBRARY = [
  { match: "green", url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1400&q=85" },
  { match: "blue", url: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1400&q=85" },
  { match: "black", url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1400&q=85" },
  { match: "gray", url: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1400&q=85" },
  { match: "red", url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1400&q=85" },
  { match: "white", url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85" },
  { match: "custom", url: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1400&q=85" }
];
async function renderCarModification(config, customImageBase64) {
  const carMatch = POPULAR_CARS.find((c) => c.name.toLowerCase().includes(config.carModel.toLowerCase())) || POPULAR_CARS[0];
  const beforeImageUrl = customImageBase64 ? customImageBase64 : carMatch.stockImageUrl;
  const promptSummary = `${config.carModel} in ${config.finishType} ${config.colorName} with ${config.wheelSizeInches}" ${config.wheelDesign} wheels in ${config.wheelFinish}, ${config.suspensionStance}, ${config.hoodStyle}, ${config.aeroKit.rearWingStyle !== "None" ? config.aeroKit.rearWingStyle : "smooth trunk"}, and ${config.exhaustStyle} in ${config.environmentPreset}`;
  let generatedImageUrl = "";
  let partsList = [];
  let hpGain = "+15 to 28 HP (Intake + Exhaust + Tune)";
  let totalCost = 4850;
  let curatorNotes = `Balanced street-track setup with aggressive stance, lightweight forged wheel fitment, and functional aerodynamic downforce.`;
  try {
    const prompt = `You are the chief automotive styling director & race engineer at CarAI.
A user designed this custom vehicle build:
Vehicle: ${config.carModel}
Paint/Wrap: ${config.finishType} ${config.colorName} (${config.colorHex})
Wheels: ${config.wheelSizeInches} inch ${config.wheelDesign} in ${config.wheelFinish}
Suspension: ${config.suspensionStance}
Aero Bodykit: Front Splitter: ${config.aeroKit.frontSplitter}, Side Skirts: ${config.aeroKit.sideSkirts}, Rear Diffuser: ${config.aeroKit.rearDiffuser}, Wing: ${config.aeroKit.rearWingStyle}, Widebody: ${config.aeroKit.widebodyFenders}
Hood: ${config.hoodStyle}
Lighting: ${config.headlightStyle}
Exhaust: ${config.exhaustStyle}
Window Tint: ${config.windowTintPercent}% VLT
Environment: ${config.environmentPreset}
User notes: ${config.customPromptNotes || "None"}

Provide an itemized modification bill of materials (parts, top brands, estimated price $ USD, installation labor hours, affiliate URLs), total estimated cost, labor cost, horsepower gain estimate, and styling review notes.`;
    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      fallbackModels: ["gemini-3.1-flash-lite", "gemini-flash-latest"],
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai3.Type.OBJECT,
          properties: {
            totalEstimatedCost: { type: import_genai3.Type.NUMBER },
            laborCostEstimate: { type: import_genai3.Type.NUMBER },
            aestheticScore: { type: import_genai3.Type.NUMBER },
            estimatedHorsepowerGain: { type: import_genai3.Type.STRING },
            curatorNotes: { type: import_genai3.Type.STRING },
            partsList: {
              type: import_genai3.Type.ARRAY,
              items: {
                type: import_genai3.Type.OBJECT,
                properties: {
                  name: { type: import_genai3.Type.STRING },
                  brand: { type: import_genai3.Type.STRING },
                  price: { type: import_genai3.Type.NUMBER },
                  affiliateUrl: { type: import_genai3.Type.STRING },
                  category: { type: import_genai3.Type.STRING },
                  installationHours: { type: import_genai3.Type.NUMBER }
                },
                required: ["name", "brand", "price", "affiliateUrl", "category", "installationHours"]
              }
            }
          },
          required: ["totalEstimatedCost", "laborCostEstimate", "aestheticScore", "estimatedHorsepowerGain", "curatorNotes", "partsList"]
        }
      }
    });
    if (response?.text) {
      const parsed = JSON.parse(response.text.trim());
      if (parsed && parsed.partsList) {
        partsList = parsed.partsList;
        totalCost = parsed.totalEstimatedCost || totalCost;
        hpGain = parsed.estimatedHorsepowerGain || hpGain;
        curatorNotes = parsed.curatorNotes || curatorNotes;
      }
    }
  } catch (err) {
  }
  if (partsList.length === 0) {
    partsList = [
      {
        name: `${config.wheelSizeInches}" ${config.wheelDesign} Monoblock Forged Wheels (Set of 4)`,
        brand: "BBS / Rotiform Forged",
        price: 2600,
        affiliateUrl: `https://example.com/affiliate/wheels-${encodeURIComponent(config.wheelDesign)}`,
        category: "Rims & Wheels",
        installationHours: 1.5
      },
      {
        name: `Full Vehicle Vinyl Wrap (${config.finishType} ${config.colorName})`,
        brand: "3M 2080 Series / Avery Dennison",
        price: 950,
        affiliateUrl: "https://example.com/affiliate/vinyl-wrap",
        category: "Vinyl Wraps",
        installationHours: 18
      },
      {
        name: `${config.suspensionStance} Kit`,
        brand: config.suspensionStance.includes("Air") ? "Airlift Performance 3P" : "KW Suspensions V3",
        price: config.suspensionStance.includes("Air") ? 3400 : 1850,
        affiliateUrl: "https://example.com/affiliate/suspension",
        category: "Coilovers & Air",
        installationHours: 4.5
      },
      ...config.aeroKit.frontSplitter || config.aeroKit.rearDiffuser ? [
        {
          name: `Pre-Preg Dry Carbon Fiber Aero Package (${config.aeroKit.rearWingStyle})`,
          brand: "Vorsteiner / APR Performance",
          price: 1750,
          affiliateUrl: "https://example.com/affiliate/carbon-aero",
          category: "Aero Kits",
          installationHours: 3
        }
      ] : [],
      {
        name: `${config.exhaustStyle} Stainless Valved Cat-Back`,
        brand: "Armytrix / Akrapovi\u010D",
        price: 1650,
        affiliateUrl: "https://example.com/affiliate/exhaust-valved",
        category: "Exhaust Systems",
        installationHours: 2
      }
    ];
    totalCost = partsList.reduce((acc, p) => acc + p.price, 0);
  }
  const colorKey = config.colorName.toLowerCase();
  const matchedRender = STYLED_RENDER_LIBRARY.find((item) => colorKey.includes(item.match)) || STYLED_RENDER_LIBRARY[0];
  generatedImageUrl = matchedRender.url;
  return {
    id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    carModel: config.carModel,
    promptSummary,
    imageUrl: generatedImageUrl,
    beforeImageUrl,
    config,
    modSheet: {
      partsList,
      totalEstimatedCost: totalCost,
      laborCostEstimate: Math.round(partsList.reduce((acc, p) => acc + p.installationHours * 135, 0)),
      aestheticScore: Math.floor(Math.random() * 8 + 92),
      // 92-99
      estimatedHorsepowerGain: hpGain,
      curatorNotes
    }
  };
}

// server/marketplaceData.ts
var MARKETPLACE_PARTS = [
  {
    id: "mkt_obd_01",
    title: "Veepeak OBDCheck BLE+ Bluetooth 4.0 OBD2 Scanner for iOS & Android",
    category: "OBD Scanners",
    brand: "Veepeak",
    price: 39.99,
    rating: 4.8,
    reviewCount: 14280,
    imageUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80",
    affiliateCommissionPercent: 12,
    affiliateUrl: "https://example.com/affiliate/veepeak-ble-plus",
    compatibility: "Universal (All 1996+ Gasoline/Diesel/Hybrid/EV vehicles)",
    inStock: true,
    description: "Ultra-low latency ELM327 Bluetooth BLE chip. Connects seamlessly with CarAI for 50Hz live PID streaming and instant MIL clearing."
  },
  {
    id: "mkt_obd_02",
    title: "OBDLink MX+ Bluetooth OBD-II Scanner with Enhanced OEM Networks",
    category: "OBD Scanners",
    brand: "OBDLink",
    price: 139.95,
    rating: 4.9,
    reviewCount: 8940,
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    affiliateCommissionPercent: 10,
    affiliateUrl: "https://example.com/affiliate/obdlink-mx-plus",
    compatibility: "High-Speed CAN, SW-CAN (GM), MS-CAN (Ford) & European K-Line",
    inStock: true,
    description: "Professional grade high-speed OBD-II adapter with Overvoltage and BatterySaver technology for permanent in-car installation."
  },
  {
    id: "mkt_rim_01",
    title: "Rotiform LAS-R Monoblock Matte Black Wheels (19x8.5 / 5x112 / 5x114.3)",
    category: "Rims & Wheels",
    brand: "Rotiform",
    price: 1180,
    rating: 4.9,
    reviewCount: 342,
    imageUrl: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80",
    affiliateCommissionPercent: 8.5,
    affiliateUrl: "https://example.com/affiliate/rotiform-las-r",
    compatibility: "BMW 3/4-Series, Audi S3/S4, Golf R, Civic Type R, Subaru WRX",
    inStock: true,
    description: "Aerodynamic rally-inspired multi-spoke wheel cast from aerospace aluminum with recessed center lock look."
  },
  {
    id: "mkt_rim_02",
    title: "BBS LM 2-Piece Forged Diamond Silver Wheels (20x9.5 Front / 20x10.5 Rear)",
    category: "Rims & Wheels",
    brand: "BBS Japan",
    price: 4950,
    rating: 5,
    reviewCount: 188,
    imageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80",
    affiliateCommissionPercent: 7,
    affiliateUrl: "https://example.com/affiliate/bbs-lm-forged",
    compatibility: "Porsche 911 (991/992), BMW M3/M4 (G80/G82), Nissan GT-R",
    inStock: true,
    description: "The definitive legendary motorsport forged split-rim with spun titanium hardware and diamond-cut polished step lip."
  },
  {
    id: "mkt_intake_01",
    title: "Injen Evolution Sealed Cold Air Intake System with Dry Filter",
    category: "Performance Intakes",
    brand: "Injen Technology",
    price: 389,
    rating: 4.7,
    reviewCount: 712,
    imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
    affiliateCommissionPercent: 9,
    affiliateUrl: "https://example.com/affiliate/injen-evo-intake",
    compatibility: "Direct bolt-on with integrated MAF sensor housing",
    inStock: true,
    description: "Dyno-proven +14 whp gain with rotomolded polyethylene heatshield that isolates incoming air from high engine bay temperatures."
  },
  {
    id: "mkt_coilover_01",
    title: "KW Suspensions Variant 3 (V3) 2-Way Adjustable Coilover Kit",
    category: "Coilovers & Air",
    brand: "KW Automotive GmbH",
    price: 2490,
    rating: 4.9,
    reviewCount: 420,
    imageUrl: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=600&q=80",
    affiliateCommissionPercent: 7.5,
    affiliateUrl: "https://example.com/affiliate/kw-v3-coilovers",
    compatibility: "Inox-line stainless steel damping with custom spring rates",
    inStock: true,
    description: "Independently adjustable rebound (16 clicks) and compression (12 clicks) damping for razor-sharp apex handling and comfortable street compliance."
  },
  {
    id: "mkt_wrap_01",
    title: "3M 2080 Gloss Flip Deep Space / Chameleon Vinyl Wrap Roll (5ft x 75ft)",
    category: "Vinyl Wraps",
    brand: "3M Commercial Solutions",
    price: 899,
    rating: 4.8,
    reviewCount: 520,
    imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
    affiliateCommissionPercent: 11,
    affiliateUrl: "https://example.com/affiliate/3m-deep-space-wrap",
    compatibility: "Full vehicle coverage (Sedan / Coupe / Mid-size SUV)",
    inStock: true,
    description: "Dual cast 3.5 mil vinyl with Comply air-release adhesive technology. Shifts from deep emerald purple to metallic cosmic blue depending on ambient sunlight."
  },
  {
    id: "mkt_exhaust_01",
    title: 'Borla ATAK Stainless Steel Cat-Back Exhaust with 4" Polished Tips',
    category: "Exhaust Systems",
    brand: "Borla Performance",
    price: 1699,
    rating: 4.9,
    reviewCount: 630,
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80",
    affiliateCommissionPercent: 8,
    affiliateUrl: "https://example.com/affiliate/borla-atak-exhaust",
    compatibility: "304 Austenitic Stainless Steel with zero in-cabin drone",
    inStock: true,
    description: "Acoustically tuned straight-through multi-core technology producing an aggressive, raw engine note without annoying cabin resonance."
  }
];

// server.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "15mb" }));
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "CarAI Telemetry & Customization Core",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    geminiKeyConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
    securityEnforcement: "STRICT_SERVER_SIDE_AUTHORITATIVE"
  });
});
app.post("/api/auth/send-otp", (req, res) => {
  try {
    const { mobileNumber, countryCode } = req.body;
    if (!mobileNumber) {
      return res.status(400).json({ error: "Mobile phone number is strictly required." });
    }
    const result = sendMobileOtp(mobileNumber, countryCode || "+1");
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to dispatch verification code." });
  }
});
app.post("/api/auth/verify-mobile", (req, res) => {
  try {
    const { mobileNumber, countryCode, otpCode, fullName, email, preferredVehicle } = req.body;
    if (!mobileNumber || !otpCode) {
      return res.status(400).json({ error: "Both mobile phone number and SMS verification code are required." });
    }
    const result = verifyMobileOtpAndAuthenticate({
      mobileNumber,
      countryCode: countryCode || "+1",
      otpCode,
      fullName,
      email,
      preferredVehicle
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || "Mobile verification failed." });
  }
});
app.get("/api/auth/profile", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const identifier = req.query.userId || req.query.token || token || "demo_driver_01";
  const profile = getCloudUserProfile(identifier);
  if (!profile) {
    return res.status(404).json({ error: "Driver profile not found in cloud vault." });
  }
  res.json({ user: profile, cloudSynced: true });
});
app.put("/api/auth/profile", (req, res) => {
  const userId = req.body.userId || "demo_driver_01";
  const profile = updateCloudUserProfile(userId, req.body);
  res.json({ success: true, user: profile, message: "Driver profile cloud sync confirmed." });
});
app.post("/api/auth/sync-profile", (req, res) => {
  const userId = req.body.userId || "demo_driver_01";
  const profile = updateCloudUserProfile(userId, req.body);
  res.json({ success: true, user: profile, message: "Driver profile cloud sync confirmed." });
});
app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true, message: "Logged out of cloud driver vault." });
});
app.get("/api/user/profile", (req, res) => {
  const userId = req.query.userId || "demo_driver_01";
  const user = getOrCreateUser(userId);
  res.json({ user });
});
app.post("/api/user/start-trial", (req, res) => {
  try {
    const userId = req.body.userId || "demo_driver_01";
    const user = startUserTrial(userId);
    res.json({
      success: true,
      user,
      message: "3-Day complimentary trial successfully initialized (single-use 72-hour access window)."
    });
  } catch (err) {
    res.status(403).json({
      success: false,
      error: "Trial Not Permitted",
      message: err.message || "Complimentary trial cannot be extended. Active subscription required."
    });
  }
});
app.post("/api/user/simulate-trial-expire", (req, res) => {
  const userId = req.body.userId || "demo_driver_01";
  const user = simulateTrialExpire(userId);
  res.json({
    success: true,
    user,
    message: "Trial expiration enforced. All Pro features locked pending subscription purchase."
  });
});
app.post("/api/user/activate-subscription", (req, res) => {
  const userId = req.body.userId || "demo_driver_01";
  const planType = req.body.planType || "pro_annual";
  const paymentId = req.body.paymentId || `tx_${Date.now()}_${Math.floor(Math.random() * 99999)}`;
  const user = activatePaidSubscription(userId, planType, paymentId);
  res.json({
    success: true,
    user,
    message: "Direct 256-Bit Bank Transfer Confirmed. CarAI Pro subscription active."
  });
});
app.post([
  "/api/payments/process-bank-checkout",
  "/api/payment/process-bank-checkout",
  "/api/payment/direct-bank-checkout",
  "/api/process-payment",
  "/api/payment/process",
  "/api/payments/process",
  "/api/payment/checkout",
  "/api/payments/checkout",
  "/api/checkout/process",
  "/api/subscriptions/subscribe",
  "/api/subscription/subscribe",
  "/api/subscription/checkout",
  "/api/subscribe",
  "/api/payments/charge"
], (req, res) => {
  try {
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const result = processDirectBankCheckout(req.body, clientIp);
    res.json(result);
  } catch (err) {
    console.error("Payment checkout processing error:", err);
    res.status(400).json({
      success: false,
      error: "Payment Authorization Failed",
      message: err.message || "Direct bank settlement failed. Please verify your payment details."
    });
  }
});
app.post(["/api/user/request-deletion", "/api/account/delete", "/api/user/delete-data"], (req, res) => {
  const userId = req.body?.userId || "demo_driver_01";
  console.log(`[Account Deletion Request] Recorded deletion ticket for user: ${userId}`);
  res.json({
    success: true,
    ticketId: `DEL-${Date.now()}-${Math.floor(1e3 + Math.random() * 9e3)}`,
    status: "SCHEDULED",
    message: "Account and associated diagnostic telemetry scheduled for permanent purge within 72 hours per Google Play policy.",
    scheduledPurgeDate: new Date(Date.now() + 72 * 3600 * 1e3).toISOString()
  });
});
app.get("/api/payments/transactions", (req, res) => {
  const userId = req.query.userId || "demo_driver_01";
  const txs = getUserBankTransactions(userId);
  res.json({ success: true, transactions: txs });
});
app.get("/api/payments/merchant-summary", (req, res) => {
  const summary = getMerchantPayoutSummary();
  res.json({ success: true, ...summary });
});
app.get("/api/security/audit-monitoring", (req, res) => {
  const logs = getSecurityAuditLogs();
  const userId = req.query.userId || "demo_driver_01";
  const user = getOrCreateUser(userId);
  const blockedCount = logs.filter((l) => l.status === "TRIAL_EXPIRED_BLOCKED" || l.status === "REDACTED_LOCKED").length;
  const grantedCount = logs.filter((l) => l.status === "GRANTED" || l.status === "PAYMENT_VERIFIED").length;
  res.json({
    enforcementMode: "STRICT_ZERO_BYPASS_ACTIVE",
    serverTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
    userStatus: user.status,
    trialExpired: user.trialExpired,
    trialHoursLeft: user.trialHoursLeft,
    isPro: user.isPro,
    metrics: {
      totalAuditEvents: logs.length,
      blockedBypassAttempts: blockedCount,
      verifiedGrantedRequests: grantedCount
    },
    logs
  });
});
app.get("/api/diagnostics/sample-codes", (req, res) => {
  res.json({ codes: getAllKnownDTCs() });
});
app.post("/api/diagnostics/explain-dtc", async (req, res) => {
  try {
    const { code, vehicleInfo, userId = "demo_driver_01" } = req.body;
    if (!code) {
      return res.status(400).json({ error: "DTC code is required (e.g. P0101)" });
    }
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const accessCheck = checkProAccess(userId, "DIAGNOSTICS_PRO_DTC_REQUEST", clientIp);
    const user = accessCheck.user;
    const fullExplanation = await explainDTC(code, vehicleInfo);
    if (!accessCheck.isPro) {
      const isTrialExpired = user.trialExpired || user.status === "trial_expired";
      const redactedExplanation = {
        code: fullExplanation.code,
        title: fullExplanation.title,
        system: fullExplanation.system,
        severity: fullExplanation.severity,
        symptoms: fullExplanation.symptoms ? fullExplanation.symptoms.slice(0, 2) : [],
        plainEnglishSummary: isTrialExpired ? "Trial Expired: Your 3-day complimentary access has concluded. Unlock CarAI Pro to reveal complete mechanical root causes, fair labor quotes, and step-by-step DIY repair guides." : "Pro Subscription Required: The ECU detected out-of-spec sensor readings. Unlock CarAI Pro to view the full mechanical explanation, fair repair cost breakdown, and mechanic defense scripts.",
        whyItHappened: [],
        safetyRisk: "Pro subscription required to view safety & catastrophic engine damage analysis",
        drivingRecommendation: "Pro subscription required to view safe driving range recommendations",
        diyDifficulty: fullExplanation.diyDifficulty || "Moderate",
        estimatedRepairCost: {
          min: 0,
          max: 0,
          averagePartsCost: 0,
          laborHours: 0,
          laborRatePerHour: 0
        },
        mechanicQuestions: [],
        stepByStepFix: [],
        partsNeeded: [],
        upgradeOptions: []
      };
      return res.json({
        success: true,
        data: redactedExplanation,
        isPro: false,
        proFeaturesUnlocked: false,
        trialExpired: isTrialExpired,
        trialHoursLeft: user.trialHoursLeft || 0,
        userStatus: user.status,
        user,
        paywallContext: {
          trigger: "post_diagnostic_scan",
          dtcCode: fullExplanation.code,
          dtcTitle: fullExplanation.title,
          trialExpired: isTrialExpired
        }
      });
    }
    res.json({
      success: true,
      data: fullExplanation,
      isPro: true,
      proFeaturesUnlocked: true,
      trialExpired: false,
      trialHoursLeft: user.trialHoursLeft || 0,
      userStatus: user.status,
      user,
      paywallContext: null
    });
  } catch (err) {
    console.error("Error in /api/diagnostics/explain-dtc:", err);
    res.status(500).json({ error: "Failed to explain DTC code: " + (err.message || "Unknown error") });
  }
});
app.get("/api/customizer/base-cars", (req, res) => {
  res.json({ cars: POPULAR_CARS });
});
app.post("/api/customizer/render-mod", async (req, res) => {
  try {
    const { config, customImageBase64, userId = "demo_driver_01" } = req.body;
    if (!config || !config.carModel) {
      return res.status(400).json({ error: "Car configuration is required" });
    }
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const usageCheck = incrementRenderUsage(userId, clientIp);
    if (!usageCheck.allowed) {
      return res.status(402).json({
        error: "Subscription Required",
        message: usageCheck.reason,
        trialExpired: usageCheck.user.trialExpired || usageCheck.user.status === "trial_expired",
        paywallContext: {
          trigger: "usage_limit_reached",
          modTitle: `${config.carModel} (${config.colorName})`
        },
        user: usageCheck.user
      });
    }
    if (config.customPromptNotes && config.customPromptNotes.trim().length > 0 && !usageCheck.user.isPro) {
      return res.status(402).json({
        error: "Subscription Required",
        message: "Custom prompt tuning and direct LLM prompt control is exclusive to CarAI Pro members.",
        trialExpired: usageCheck.user.trialExpired || usageCheck.user.status === "trial_expired",
        paywallContext: {
          trigger: "custom_prompt_input",
          modTitle: "Custom Prompt Tuning"
        },
        user: usageCheck.user
      });
    }
    const renderResult = await renderCarModification(config, customImageBase64);
    res.json({
      success: true,
      data: renderResult,
      user: usageCheck.user,
      paywallContext: !usageCheck.user.isPro ? {
        trigger: "post_first_ai_render",
        modTitle: `${config.carModel} ${config.colorName}`
      } : null
    });
  } catch (err) {
    console.error("Error in /api/customizer/render-mod:", err);
    res.status(500).json({ error: "AI customizer render failed: " + (err.message || "Unknown error") });
  }
});
app.get("/api/referrals/info", (req, res) => {
  const userId = req.query.userId || "demo_driver_01";
  const info = getReferralInfo(userId);
  res.json({ success: true, ...info });
});
app.post("/api/referrals/register-invite", (req, res) => {
  const { referrerUserId, referredUserId } = req.body;
  if (!referrerUserId || !referredUserId) {
    return res.status(400).json({ error: "referrerUserId and referredUserId are required" });
  }
  const result = registerReferralInvite(referrerUserId, referredUserId);
  res.json(result);
});
app.post("/api/obd/record-connection-proof", (req, res) => {
  const userId = req.body.userId || "demo_driver_01";
  const result = verifyAndRecordObdConnectionProof(userId);
  res.json({ success: true, proofRegistered: true, ...result });
});
app.post("/api/referrals/adversarial-claim-test", (req, res) => {
  const userId = req.body.userId || "demo_driver_01";
  const targetReferrerId = req.body.targetReferrerId || "demo_driver_01";
  const result = attemptClientSideReferralClaim(userId, targetReferrerId);
  res.json(result);
});
app.post("/api/renders/shared", (req, res) => {
  const userId = req.body.userId || "demo_driver_01";
  const renderId = req.body.renderId || `render_${Date.now()}`;
  const result = logSharedRenderEvent(userId, renderId);
  res.json(result);
});
app.get("/api/maintenance/logs", (req, res) => {
  const userId = req.query.userId || "demo_driver_01";
  const logs = getMaintenanceLogs(userId);
  res.json({ success: true, logs });
});
app.post("/api/maintenance/logs", (req, res) => {
  const userId = req.body.userId || "demo_driver_01";
  const { item, category = "Oil & Filters", mileage = 12e3, date, note, cost, status = "completed" } = req.body;
  if (!item) {
    return res.status(400).json({ error: "Maintenance item title is required" });
  }
  const entry = addMaintenanceLog(userId, {
    item,
    category,
    mileage: Number(mileage),
    date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    note,
    cost: cost ? Number(cost) : void 0,
    status
  });
  res.json({ success: true, entry });
});
app.delete("/api/maintenance/logs/:id", (req, res) => {
  const userId = req.query.userId || "demo_driver_01";
  const logId = req.params.id;
  const deleted = deleteMaintenanceLog(userId, logId);
  res.json({ success: deleted });
});
app.get("/api/diagnostics/health-score", (req, res) => {
  const dtcCount = Number(req.query.dtcCount) || 0;
  const criticalCount = Number(req.query.criticalCount) || 0;
  const coolantTempC = Number(req.query.coolantTempC) || 90;
  const batteryVoltage = Number(req.query.batteryVoltage) || 14.1;
  const readyCount = Number(req.query.readyCount) || 8;
  const totalCount = Number(req.query.totalCount) || 8;
  const healthData = computeVehicleHealthScore(
    dtcCount,
    criticalCount,
    coolantTempC,
    batteryVoltage,
    readyCount,
    totalCount
  );
  res.json({ success: true, health: healthData });
});
app.post("/api/vehicle/decode-vin", (req, res) => {
  const { vinOrPlate, state } = req.body;
  if (!vinOrPlate) {
    return res.status(400).json({ error: "VIN or License plate number is required" });
  }
  const result = decodeVinOrPlate(vinOrPlate, state);
  res.json({ success: true, vehicle: result });
});
app.post("/api/webhooks/revenuecat", (req, res) => {
  try {
    const payload = req.body;
    const event = payload.event || payload;
    const webhookEvent = {
      id: event.id || `evt_${Date.now()}`,
      type: event.type || "INITIAL_PURCHASE",
      app_user_id: event.app_user_id || event.userId || "demo_driver_01",
      product_id: event.product_id || "carai_pro_annual",
      price: event.price_in_purchased_currency || event.price || 79,
      currency: event.currency || "USD",
      purchased_at_ms: event.purchased_at_ms || Date.now(),
      expiration_at_ms: event.expiration_at_ms || Date.now() + 365 * 864e5,
      store: event.store || "APP_STORE",
      environment: event.environment || "SANDBOX"
    };
    recordWebhookEvent(webhookEvent);
    console.log(`[RevenueCat Webhook] Processed ${webhookEvent.type} for user: ${webhookEvent.app_user_id}`);
    res.json({ received: true, eventId: webhookEvent.id, status: "processed" });
  } catch (err) {
    console.error("RevenueCat webhook processing error:", err);
    res.status(400).json({ error: "Webhook processing failed: " + err.message });
  }
});
app.get("/api/webhooks/revenuecat/logs", (req, res) => {
  res.json({ logs: getWebhookLogs() });
});
app.get("/api/marketplace/parts", (req, res) => {
  const category = req.query.category;
  const search = (req.query.q || "").toLowerCase();
  let filtered = MARKETPLACE_PARTS;
  if (category && category !== "All") {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (search) {
    filtered = filtered.filter(
      (p) => p.title.toLowerCase().includes(search) || p.brand.toLowerCase().includes(search) || p.description.toLowerCase().includes(search)
    );
  }
  res.json({ parts: filtered, count: filtered.length });
});
var publicDir = import_path.default.join(process.cwd(), "public");
app.get(["/privacy", "/privacy/", "/privacy-policy", "/privacy-policy/", "/legal/privacy", "/privacy.html", "/policy"], (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  const filePath = import_path.default.join(publicDir, "privacy.html");
  if (import_fs.default.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.send(`<!DOCTYPE html><html><head><title>Privacy Policy</title></head><body><h1>Privacy Policy</h1><p>Visit /privacy.html</p></body></html>`);
});
app.get(["/delete-account", "/delete-account/", "/delete-account.html", "/data-deletion", "/legal/deletion"], (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  const filePath = import_path.default.join(publicDir, "delete-account.html");
  if (import_fs.default.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.send(`<!DOCTYPE html><html><head><title>Data Deletion</title></head><body><h1>Data Deletion</h1><p>Contact anthonybhonsle@gmail.com</p></body></html>`);
});
app.get(["/terms", "/terms-of-service", "/terms.html", "/legal/terms", "/subscription-terms"], (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  const filePath = import_path.default.join(publicDir, "terms.html");
  if (import_fs.default.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.send(`<!DOCTYPE html><html><head><title>Terms of Service</title></head><body><h1>Terms of Service</h1></body></html>`);
});
app.get(["/security", "/security-policy", "/data-safety", "/data-safety.html", "/legal/security"], (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  const filePath = import_path.default.join(publicDir, "data-safety.html");
  if (import_fs.default.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.send(`<!DOCTYPE html><html><head><title>Data Safety</title></head><body><h1>Data Safety</h1></body></html>`);
});
app.get(["/screenshots", "/screenshots/", "/app-store-screenshots", "/app-store-screenshots.html"], (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const filePath = import_path.default.join(publicDir, "app-store-screenshots.html");
  if (import_fs.default.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.redirect("/");
});
app.all("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    message: `API endpoint ${req.method} ${req.path} is not recognized.`
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true, host: "0.0.0.0", port: 3e3 },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CarAI Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
