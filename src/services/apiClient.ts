import {
  CarModConfig,
  CarModRenderResult,
  DTCFaultCode,
  AffiliateProduct,
  MarketplaceItem,
  RevenueCatWebhookEvent,
  UserSubscriptionState,
  BankTransaction,
  BankCheckoutRequest,
} from '../types';

const API_BASE = '';

export async function getUserSubscription(userId: string = 'demo_driver_01'): Promise<UserSubscriptionState> {
  try {
    const res = await fetch(`${API_BASE}/api/user/profile?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch user profile');
    const data = await res.json();
    return data.user;
  } catch (err) {
    // Fallback default state
    return {
      userId,
      isPro: false,
      freeRendersUsed: 0,
      freeRendersLimit: 1,
      plan: null,
      activeTrial: false,
      trialDaysLeft: 0,
      expiresAt: null,
    };
  }
}

export async function fetchUserProfile(userId: string = 'demo_driver_01'): Promise<UserSubscriptionState> {
  return getUserSubscription(userId);
}

export async function resetUserRenderLimit(userId: string = 'demo_driver_01'): Promise<{ success: boolean; user: UserSubscriptionState }> {
  const res = await fetch(`${API_BASE}/api/user/reset-limits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to reset limits');
  const data = await res.json();
  return { success: true, user: data.user };
}

export async function resetUsageLimits(userId: string = 'demo_driver_01'): Promise<UserSubscriptionState> {
  const res = await resetUserRenderLimit(userId);
  return res.user;
}

export async function startFreeTrial(userId: string = 'demo_driver_01'): Promise<{ success: boolean; user: UserSubscriptionState; message: string }> {
  const res = await fetch(`${API_BASE}/api/user/start-trial`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Trial cannot be initialized. An active subscription is required.');
  }
  return res.json();
}

export async function simulateTrialExpiration(userId: string = 'demo_driver_01'): Promise<{ success: boolean; user: UserSubscriptionState; message: string }> {
  const res = await fetch(`${API_BASE}/api/user/simulate-trial-expire`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to simulate trial expiration');
  return res.json();
}

export async function processDirectBankCheckoutApi(checkoutData: BankCheckoutRequest): Promise<{
  success: boolean;
  transaction: BankTransaction;
  user: UserSubscriptionState;
  message: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/payments/process-bank-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutData),
    });

    const responseText = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        message: 'Payment gateway could not verify the transaction at this time. Please check your card or bank details and try again.',
      };
    }

    if (!res.ok) {
      const userFriendlyMessage =
        data.message ||
        data.error ||
        'Payment authorization could not be completed. Please check your payment details or try an alternate payment method.';
      throw new Error(userFriendlyMessage);
    }

    return data;
  } catch (err: any) {
    let msg = err.message || 'Payment authorization failed.';
    // Filter out technical token/JSON/doctype syntax errors
    if (msg.includes('<!doctype') || msg.includes('Unexpected token') || msg.includes('is not valid JSON')) {
      msg = 'Payment authorization could not be completed. Please verify your payment details and try again.';
    }
    throw new Error(msg);
  }
}

export async function fetchUserBankTransactions(userId: string = 'demo_driver_01'): Promise<{
  success: boolean;
  transactions: BankTransaction[];
}> {
  const res = await fetch(`${API_BASE}/api/payments/transactions?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function fetchMerchantPayoutSummary(): Promise<{
  success: boolean;
  merchantAccountHolder: string;
  settlementBank: string;
  routingNumber: string;
  accountNumberMasked: string;
  settlementStatus: string;
  grossSettledVolume: number;
  totalTransactions: number;
  recentTransactions: BankTransaction[];
}> {
  const res = await fetch(`${API_BASE}/api/payments/merchant-summary`);
  if (!res.ok) throw new Error('Failed to fetch merchant payout summary');
  return res.json();
}

export async function activatePaidSubscriptionApi(
  userId: string = 'demo_driver_01',
  planType: 'pro_monthly' | 'pro_annual' = 'pro_annual',
  paymentId?: string
): Promise<{ success: boolean; user: UserSubscriptionState; message: string }> {
  const res = await fetch(`${API_BASE}/api/user/activate-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, planType, paymentId }),
  });
  if (!res.ok) throw new Error('Failed to activate subscription');
  return res.json();
}

export async function fetchSecurityAuditMonitoring(userId: string = 'demo_driver_01'): Promise<{
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
  logs: any[];
}> {
  const res = await fetch(`${API_BASE}/api/security/audit-monitoring?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch security audit telemetry');
  return res.json();
}

export async function upgradeUserToPro(
  planType: 'annual' | 'monthly' | 'lifetime' = 'annual',
  userId: string = 'demo_driver_01'
): Promise<{ success: boolean; user: UserSubscriptionState }> {
  const isAnnual = planType === 'annual';
  return activatePaidSubscriptionApi(userId, isAnnual ? 'pro_annual' : 'pro_monthly');
}

export async function explainDTCFaultCode(
  code: string,
  vehicleInfo?: { make?: string; model?: string; year?: number; engine?: string },
  userId: string = 'demo_driver_01'
): Promise<{
  success: boolean;
  data: DTCFaultCode;
  isPro: boolean;
  proFeaturesUnlocked: boolean;
  trialExpired?: boolean;
  trialHoursLeft?: number;
  userStatus?: string;
  user?: UserSubscriptionState;
  paywallContext?: any;
}> {
  const res = await fetch(`${API_BASE}/api/diagnostics/explain-dtc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, vehicleInfo, userId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to explain DTC code');
  }
  return res.json();
}

export async function renderCarModAI(
  config: CarModConfig,
  customImageBase64?: string,
  userId: string = 'demo_driver_01'
): Promise<{
  success: boolean;
  data: CarModRenderResult;
  user: UserSubscriptionState;
  paywallContext?: any;
}> {
  const res = await fetch(`${API_BASE}/api/customizer/render-mod`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, customImageBase64, userId }),
  });

  const body = await res.json();
  if (res.status === 402) {
    const error: any = new Error(body.message || 'Free quota exceeded');
    error.status = 402;
    error.paywallContext = body.paywallContext;
    error.user = body.user;
    throw error;
  }
  if (!res.ok) {
    throw new Error(body.error || 'Failed to render car modification');
  }
  return body;
}

export async function getMarketplaceProducts(category?: string, query?: string): Promise<AffiliateProduct[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all' && category !== 'All') params.set('category', category);
  if (query) params.set('q', query);

  const res = await fetch(`${API_BASE}/api/marketplace/parts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch marketplace items');
  const data = await res.json();
  return data.parts || [];
}

export async function fetchMarketplaceParts(category?: string, query?: string): Promise<MarketplaceItem[]> {
  return getMarketplaceProducts(category, query) as any;
}

export async function sendRevenueCatWebhook(event: Partial<RevenueCatWebhookEvent>): Promise<{ received: boolean; status: string; user?: UserSubscriptionState }> {
  const res = await fetch(`${API_BASE}/api/webhooks/revenuecat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error('Failed to send webhook');
  const data = await res.json();
  // Fetch updated user
  const appUserId = event.event?.app_user_id || 'demo_driver_01';
  const updatedUser = await getUserSubscription(appUserId);
  return { ...data, user: updatedUser };
}

export async function fetchWebhookLogs(): Promise<RevenueCatWebhookEvent[]> {
  const res = await fetch(`${API_BASE}/api/webhooks/revenuecat/logs`);
  if (!res.ok) throw new Error('Failed to fetch webhook logs');
  const data = await res.json();
  return data.logs;
}

// ----------------------------------------------------
// GROWTH & RETENTION CLIENT API FUNCTIONS
// ----------------------------------------------------
export async function getReferralDetails(userId: string = 'demo_driver_01'): Promise<{
  success: boolean;
  referralCode: string;
  referralLink: string;
  totalReferred: number;
  qualifiedCount: number;
  bonusRendersEarned: number;
  referrals: any[];
}> {
  const res = await fetch(`${API_BASE}/api/referrals/info?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch referral details');
  return res.json();
}

export async function registerReferralInviteApi(referrerUserId: string, referredUserId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/referrals/register-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referrerUserId, referredUserId }),
  });
  if (!res.ok) throw new Error('Failed to register referral invite');
  return res.json();
}

export async function recordObdConnectionProof(userId: string = 'demo_driver_01'): Promise<{
  success: boolean;
  proofRegistered: boolean;
  creditedReferrer: boolean;
  referrerUserId?: string;
}> {
  const res = await fetch(`${API_BASE}/api/obd/record-connection-proof`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to record OBD connection proof');
  return res.json();
}

export async function runReferralAdversarialTest(userId: string = 'unverified_intruder', targetReferrerId: string = 'demo_driver_01'): Promise<{
  granted: boolean;
  reason: string;
}> {
  const res = await fetch(`${API_BASE}/api/referrals/adversarial-claim-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, targetReferrerId }),
  });
  if (!res.ok) throw new Error('Failed to run adversarial referral test');
  return res.json();
}

export async function logSharedRender(userId: string, renderId: string): Promise<{ success: boolean; totalShared: number }> {
  const res = await fetch(`${API_BASE}/api/renders/shared`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, renderId }),
  });
  if (!res.ok) throw new Error('Failed to log shared render');
  return res.json();
}

export async function fetchMaintenanceLogs(userId: string = 'demo_driver_01'): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/maintenance/logs?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch maintenance logs');
  const data = await res.json();
  return data.logs || [];
}

export async function createMaintenanceLog(
  userId: string,
  entry: { item: string; category?: string; mileage?: number; date?: string; note?: string; cost?: number; status?: string }
): Promise<any> {
  const res = await fetch(`${API_BASE}/api/maintenance/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...entry }),
  });
  if (!res.ok) throw new Error('Failed to create maintenance log');
  const data = await res.json();
  return data.entry;
}

export async function removeMaintenanceLog(userId: string, logId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/maintenance/logs/${logId}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.success;
}

// Safe helper to calculate vehicle health score on the client if server is starting or offline
export function computeClientVehicleHealthScore(params: {
  dtcCount: number;
  criticalCount: number;
  coolantTempC: number;
  batteryVoltage: number;
  readyCount?: number;
  totalCount?: number;
}) {
  const dtcCount = Number(params.dtcCount) || 0;
  const criticalFaultCount = Number(params.criticalCount) || 0;
  const coolantTempC = Number(params.coolantTempC) || 90;
  const batteryVoltage = Number(params.batteryVoltage) || 14.1;
  const readinessReadyCount = params.readyCount ?? 8;
  const readinessTotalCount = params.totalCount ?? 8;

  let score = 100;
  score -= criticalFaultCount * 30;
  score -= (dtcCount - criticalFaultCount) * 12;

  const liveVoltageOk = batteryVoltage >= 11.8 && batteryVoltage <= 15.0;
  if (!liveVoltageOk) score -= 15;

  let coolantTempStatus: 'normal' | 'warm' | 'overheating' = 'normal';
  if (coolantTempC > 115) {
    coolantTempStatus = 'overheating';
    score -= 35;
  } else if (coolantTempC > 105) {
    coolantTempStatus = 'warm';
    score -= 10;
  }

  const readinessPercent = Math.round((readinessReadyCount / Math.max(1, readinessTotalCount)) * 100);
  if (readinessPercent < 80) {
    score -= Math.round((100 - readinessPercent) * 0.15);
  }

  score = Math.max(10, Math.min(100, score));

  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  let summary = 'Powertrain, electrical, and emissions monitors operating within factory specifications.';
  if (criticalFaultCount > 0) {
    summary = `Critical DTC faults detected (${criticalFaultCount}). Immediate mechanical inspection required to prevent engine damage.`;
  } else if (dtcCount > 0) {
    summary = `${dtcCount} minor DTC sensor fault(s) detected. Diagnostics scan recommended.`;
  } else if (coolantTempStatus === 'overheating') {
    summary = 'Engine coolant temperature elevated above normal operating range.';
  }

  return {
    grade,
    score,
    trend: dtcCount > 0 ? 'down' : 'stable',
    trendDelta: dtcCount > 0 ? -12 : 0,
    faultCodeCount: dtcCount,
    criticalFaultCount,
    monitorsReadyPercent: readinessPercent,
    liveVoltageOk,
    coolantTempStatus,
    lastEvaluated: new Date().toISOString(),
    summary,
  };
}

export async function fetchVehicleHealthScore(params: {
  dtcCount: number;
  criticalCount: number;
  coolantTempC: number;
  batteryVoltage: number;
  readyCount?: number;
  totalCount?: number;
}): Promise<any> {
  try {
    const query = new URLSearchParams({
      dtcCount: String(params.dtcCount ?? 0),
      criticalCount: String(params.criticalCount ?? 0),
      coolantTempC: String(params.coolantTempC ?? 90),
      batteryVoltage: String(params.batteryVoltage ?? 14.1),
      readyCount: String(params.readyCount || 8),
      totalCount: String(params.totalCount || 8),
    });
    const res = await fetch(`${API_BASE}/api/diagnostics/health-score?${query.toString()}`);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && data.health) return data.health;
    }
  } catch (_err) {
    // Network or parse issue: fall back gracefully to client calculation
  }
  return computeClientVehicleHealthScore(params);
}

export async function decodeVinApi(vinOrPlate: string, state?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/vehicle/decode-vin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vinOrPlate, state }),
  });
  if (!res.ok) throw new Error('Failed to decode VIN or license plate');
  const data = await res.json();
  return data.vehicle;
}

// ----------------------------------------------------
// PASSWORDLESS MOBILE AUTH & CLOUD PROFILE API
// ----------------------------------------------------
export async function sendMobileVerificationOtp(
  mobileNumber: string,
  countryCode: string = '+1'
): Promise<{ success: boolean; message: string; debugOtp?: string; expiresAt: number }> {
  const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber, countryCode }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to send SMS verification code.');
  }
  return res.json();
}

export async function verifyMobileOtpAndLoginApi(params: {
  mobileNumber: string;
  countryCode: string;
  otpCode: string;
  fullName?: string;
  email?: string;
  preferredVehicle?: string;
}): Promise<{ success: boolean; user: any; isNewUser: boolean; token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/verify-mobile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Mobile phone verification failed.');
  }
  return res.json();
}

export async function fetchCloudDriverProfile(tokenOrUserId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/auth/profile?userId=${encodeURIComponent(tokenOrUserId)}`, {
    headers: {
      Authorization: `Bearer ${tokenOrUserId}`,
    },
  });
  if (!res.ok) {
    throw new Error('Failed to retrieve cloud driver profile');
  }
  const data = await res.json();
  return data.user;
}

export async function syncCloudDriverProfile(userId: string, updates: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/api/auth/sync-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...updates }),
  });
  if (!res.ok) {
    throw new Error('Failed to synchronize cloud profile');
  }
  const data = await res.json();
  return data.user;
}


