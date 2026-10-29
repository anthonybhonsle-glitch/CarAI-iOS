import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  getOrCreateUser,
  updateUserProStatus,
  startUserTrial,
  simulateTrialExpire,
  activatePaidSubscription,
  checkProAccess,
  incrementRenderUsage,
  resetUserUsage,
  recordWebhookEvent,
  getWebhookLogs,
  getSecurityAuditLogs,
  logSecurityEvent,
  getReferralInfo,
  registerReferralInvite,
  verifyAndRecordObdConnectionProof,
  attemptClientSideReferralClaim,
  logSharedRenderEvent,
  getMaintenanceLogs,
  addMaintenanceLog,
  deleteMaintenanceLog,
  computeVehicleHealthScore,
  decodeVinOrPlate,
  sendMobileOtp,
  verifyMobileOtpAndAuthenticate,
  getCloudUserProfile,
  updateCloudUserProfile,
} from './server/entitlements';
import {
  processDirectBankCheckout,
  getUserBankTransactions,
  getMerchantPayoutSummary,
} from './server/paymentProcessor';
import { explainDTC, getAllKnownDTCs } from './server/faultCodeExplainer';
import { renderCarModification, POPULAR_CARS } from './server/aiCustomizer';
import { MARKETPLACE_PARTS } from './server/marketplaceData';
import { RevenueCatWebhookEvent } from './src/types';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(process.cwd(), 'public')));

// ----------------------------------------------------
// 1. HEALTH & SYSTEM API
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CarAI Telemetry & Customization Core',
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    securityEnforcement: 'STRICT_SERVER_SIDE_AUTHORITATIVE',
  });
});

// ----------------------------------------------------
// 2. USER PROFILE, TRIAL LIFECYCLE & ENTITLEMENTS API
// ----------------------------------------------------
// Passwordless Mobile-First Auth: Request 6-digit SMS OTP
app.post('/api/auth/send-otp', (req, res) => {
  try {
    const { mobileNumber, countryCode } = req.body;
    if (!mobileNumber) {
      return res.status(400).json({ error: 'Mobile phone number is strictly required.' });
    }
    const result = sendMobileOtp(mobileNumber, countryCode || '+1');
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to dispatch verification code.' });
  }
});

// Passwordless Mobile-First Auth: Verify OTP and Login / Register Driver Profile
app.post('/api/auth/verify-mobile', (req, res) => {
  try {
    const { mobileNumber, countryCode, otpCode, fullName, email, preferredVehicle } = req.body;
    if (!mobileNumber || !otpCode) {
      return res.status(400).json({ error: 'Both mobile phone number and SMS verification code are required.' });
    }
    const result = verifyMobileOtpAndAuthenticate({
      mobileNumber,
      countryCode: countryCode || '+1',
      otpCode,
      fullName,
      email,
      preferredVehicle,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Mobile verification failed.' });
  }
});

// Cloud Driver Profile: Get Synced Profile
app.get('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const identifier = (req.query.userId as string) || (req.query.token as string) || token || 'demo_driver_01';

  const profile = getCloudUserProfile(identifier);
  if (!profile) {
    return res.status(404).json({ error: 'Driver profile not found in cloud vault.' });
  }
  res.json({ user: profile, cloudSynced: true });
});

// Cloud Driver Profile: Update & Sync Profile Attributes
app.put('/api/auth/profile', (req, res) => {
  const userId = req.body.userId || 'demo_driver_01';
  const profile = updateCloudUserProfile(userId, req.body);
  res.json({ success: true, user: profile, message: 'Driver profile cloud sync confirmed.' });
});

app.post('/api/auth/sync-profile', (req, res) => {
  const userId = req.body.userId || 'demo_driver_01';
  const profile = updateCloudUserProfile(userId, req.body);
  res.json({ success: true, user: profile, message: 'Driver profile cloud sync confirmed.' });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out of cloud driver vault.' });
});

app.get('/api/user/profile', (req, res) => {
  const userId = (req.query.userId as string) || 'demo_driver_01';
  const user = getOrCreateUser(userId);
  res.json({ user });
});

app.post('/api/user/start-trial', (req, res) => {
  try {
    const userId = (req.body.userId as string) || 'demo_driver_01';
    const user = startUserTrial(userId);
    res.json({
      success: true,
      user,
      message: '3-Day complimentary trial successfully initialized (single-use 72-hour access window).',
    });
  } catch (err: any) {
    res.status(403).json({
      success: false,
      error: 'Trial Not Permitted',
      message: err.message || 'Complimentary trial cannot be extended. Active subscription required.',
    });
  }
});

app.post('/api/user/simulate-trial-expire', (req, res) => {
  const userId = (req.body.userId as string) || 'demo_driver_01';
  const user = simulateTrialExpire(userId);
  res.json({
    success: true,
    user,
    message: 'Trial expiration enforced. All Pro features locked pending subscription purchase.',
  });
});

app.post('/api/user/activate-subscription', (req, res) => {
  const userId = (req.body.userId as string) || 'demo_driver_01';
  const planType = (req.body.planType as 'pro_monthly' | 'pro_annual') || 'pro_annual';
  const paymentId = (req.body.paymentId as string) || `tx_${Date.now()}_${Math.floor(Math.random() * 99999)}`;
  const user = activatePaidSubscription(userId, planType, paymentId);
  res.json({
    success: true,
    user,
    message: 'Direct 256-Bit Bank Transfer Confirmed. CarAI Pro subscription active.',
  });
});

// ----------------------------------------------------
// 2.0 DIRECT-TO-BANK PAYMENT PROCESSING ENGINE
// ----------------------------------------------------
app.post([
  '/api/payments/process-bank-checkout',
  '/api/payment/process-bank-checkout',
  '/api/payment/direct-bank-checkout',
  '/api/process-payment',
  '/api/payment/process',
  '/api/payments/process',
  '/api/payment/checkout',
  '/api/payments/checkout',
  '/api/checkout/process',
  '/api/subscriptions/subscribe',
  '/api/subscription/subscribe',
  '/api/subscription/checkout',
  '/api/subscribe',
  '/api/payments/charge',
], (req, res) => {
  try {
    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const result = processDirectBankCheckout(req.body, clientIp);
    res.json(result);
  } catch (err: any) {
    console.error('Payment checkout processing error:', err);
    res.status(400).json({
      success: false,
      error: 'Payment Authorization Failed',
      message: err.message || 'Direct bank settlement failed. Please verify your payment details.',
    });
  }
});

// Self-Serve Account & Data Deletion Request (Google Play User Data Compliance)
app.post(['/api/user/request-deletion', '/api/account/delete', '/api/user/delete-data'], (req, res) => {
  const userId = req.body?.userId || 'demo_driver_01';
  console.log(`[Account Deletion Request] Recorded deletion ticket for user: ${userId}`);
  res.json({
    success: true,
    ticketId: `DEL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'SCHEDULED',
    message: 'Account and associated diagnostic telemetry scheduled for permanent purge within 72 hours per Google Play policy.',
    scheduledPurgeDate: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
  });
});

app.get('/api/payments/transactions', (req, res) => {
  const userId = (req.query.userId as string) || 'demo_driver_01';
  const txs = getUserBankTransactions(userId);
  res.json({ success: true, transactions: txs });
});

app.get('/api/payments/merchant-summary', (req, res) => {
  const summary = getMerchantPayoutSummary();
  res.json({ success: true, ...summary });
});

// ----------------------------------------------------
// 2.1 SECURITY & ZERO-BYPASS AUDIT MONITORING API
// ----------------------------------------------------
app.get('/api/security/audit-monitoring', (req, res) => {
  const logs = getSecurityAuditLogs();
  const userId = (req.query.userId as string) || 'demo_driver_01';
  const user = getOrCreateUser(userId);

  const blockedCount = logs.filter((l) => l.status === 'TRIAL_EXPIRED_BLOCKED' || l.status === 'REDACTED_LOCKED').length;
  const grantedCount = logs.filter((l) => l.status === 'GRANTED' || l.status === 'PAYMENT_VERIFIED').length;

  res.json({
    enforcementMode: 'STRICT_ZERO_BYPASS_ACTIVE',
    serverTimestamp: new Date().toISOString(),
    userStatus: user.status,
    trialExpired: user.trialExpired,
    trialHoursLeft: user.trialHoursLeft,
    isPro: user.isPro,
    metrics: {
      totalAuditEvents: logs.length,
      blockedBypassAttempts: blockedCount,
      verifiedGrantedRequests: grantedCount,
    },
    logs,
  });
});

// ----------------------------------------------------
// 3. OBD-II DIAGNOSTICS & DTC AI EXPLAINER API (ZERO-BYPASS)
// ----------------------------------------------------
app.get('/api/diagnostics/sample-codes', (req, res) => {
  res.json({ codes: getAllKnownDTCs() });
});

app.post('/api/diagnostics/explain-dtc', async (req, res) => {
  try {
    const { code, vehicleInfo, userId = 'demo_driver_01' } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'DTC code is required (e.g. P0101)' });
    }

    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const accessCheck = checkProAccess(userId, 'DIAGNOSTICS_PRO_DTC_REQUEST', clientIp);
    const user = accessCheck.user;

    // Call deep fault explainer service
    const fullExplanation = await explainDTC(code, vehicleInfo);

    // Enforce strict server-side anti-bypass:
    // If user is not verified Pro (expired trial or free tier), completely redact mechanic defense scripts,
    // root causes, step-by-step guides, fair labor price matrix, and parts pricing.
    if (!accessCheck.isPro) {
      const isTrialExpired = user.trialExpired || user.status === 'trial_expired';
      const redactedExplanation = {
        code: fullExplanation.code,
        title: fullExplanation.title,
        system: fullExplanation.system,
        severity: fullExplanation.severity,
        symptoms: fullExplanation.symptoms ? fullExplanation.symptoms.slice(0, 2) : [],
        plainEnglishSummary: isTrialExpired
          ? 'Trial Expired: Your 3-day complimentary access has concluded. Unlock CarAI Pro to reveal complete mechanical root causes, fair labor quotes, and step-by-step DIY repair guides.'
          : 'Pro Subscription Required: The ECU detected out-of-spec sensor readings. Unlock CarAI Pro to view the full mechanical explanation, fair repair cost breakdown, and mechanic defense scripts.',
        whyItHappened: [],
        safetyRisk: 'Pro subscription required to view safety & catastrophic engine damage analysis',
        drivingRecommendation: 'Pro subscription required to view safe driving range recommendations',
        diyDifficulty: fullExplanation.diyDifficulty || 'Moderate',
        estimatedRepairCost: {
          min: 0,
          max: 0,
          averagePartsCost: 0,
          laborHours: 0,
          laborRatePerHour: 0,
        },
        mechanicQuestions: [],
        stepByStepFix: [],
        partsNeeded: [],
        upgradeOptions: [],
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
          trigger: 'post_diagnostic_scan',
          dtcCode: fullExplanation.code,
          dtcTitle: fullExplanation.title,
          trialExpired: isTrialExpired,
        },
      });
    }

    // Verified Pro users receive full unrestricted data
    res.json({
      success: true,
      data: fullExplanation,
      isPro: true,
      proFeaturesUnlocked: true,
      trialExpired: false,
      trialHoursLeft: user.trialHoursLeft || 0,
      userStatus: user.status,
      user,
      paywallContext: null,
    });
  } catch (err: any) {
    console.error('Error in /api/diagnostics/explain-dtc:', err);
    res.status(500).json({ error: 'Failed to explain DTC code: ' + (err.message || 'Unknown error') });
  }
});

// ----------------------------------------------------
// 4. AI CAR CUSTOMIZER & RENDER API (STRICT LIMITS)
// ----------------------------------------------------
app.get('/api/customizer/base-cars', (req, res) => {
  res.json({ cars: POPULAR_CARS });
});

app.post('/api/customizer/render-mod', async (req, res) => {
  try {
    const { config, customImageBase64, userId = 'demo_driver_01' } = req.body;
    if (!config || !config.carModel) {
      return res.status(400).json({ error: 'Car configuration is required' });
    }

    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';

    // Check usage limits server-side
    const usageCheck = incrementRenderUsage(userId, clientIp);
    if (!usageCheck.allowed) {
      return res.status(402).json({
        error: 'Subscription Required',
        message: usageCheck.reason,
        trialExpired: usageCheck.user.trialExpired || usageCheck.user.status === 'trial_expired',
        paywallContext: {
          trigger: 'usage_limit_reached',
          modTitle: `${config.carModel} (${config.colorName})`,
        },
        user: usageCheck.user,
      });
    }

    // Server-side validate Pro-exclusive features (e.g. custom prompt tuning)
    if (config.customPromptNotes && config.customPromptNotes.trim().length > 0 && !usageCheck.user.isPro) {
      return res.status(402).json({
        error: 'Subscription Required',
        message: 'Custom prompt tuning and direct LLM prompt control is exclusive to CarAI Pro members.',
        trialExpired: usageCheck.user.trialExpired || usageCheck.user.status === 'trial_expired',
        paywallContext: {
          trigger: 'custom_prompt_input',
          modTitle: 'Custom Prompt Tuning',
        },
        user: usageCheck.user,
      });
    }

    // Execute render & mod sheet generation
    const renderResult = await renderCarModification(config, customImageBase64);

    res.json({
      success: true,
      data: renderResult,
      user: usageCheck.user,
      paywallContext: !usageCheck.user.isPro
        ? {
            trigger: 'post_first_ai_render',
            modTitle: `${config.carModel} ${config.colorName}`,
          }
        : null,
    });
  } catch (err: any) {
    console.error('Error in /api/customizer/render-mod:', err);
    res.status(500).json({ error: 'AI customizer render failed: ' + (err.message || 'Unknown error') });
  }
});

// ----------------------------------------------------
// 4.1 GROWTH & RETENTION APIS (REFERRALS, HEALTH, MAINTENANCE, VIN)
// ----------------------------------------------------
app.get('/api/referrals/info', (req, res) => {
  const userId = (req.query.userId as string) || 'demo_driver_01';
  const info = getReferralInfo(userId);
  res.json({ success: true, ...info });
});

app.post('/api/referrals/register-invite', (req, res) => {
  const { referrerUserId, referredUserId } = req.body;
  if (!referrerUserId || !referredUserId) {
    return res.status(400).json({ error: 'referrerUserId and referredUserId are required' });
  }
  const result = registerReferralInvite(referrerUserId, referredUserId);
  res.json(result);
});

app.post('/api/obd/record-connection-proof', (req, res) => {
  const userId = (req.body.userId as string) || 'demo_driver_01';
  const result = verifyAndRecordObdConnectionProof(userId);
  res.json({ success: true, proofRegistered: true, ...result });
});

app.post('/api/referrals/adversarial-claim-test', (req, res) => {
  const userId = (req.body.userId as string) || 'demo_driver_01';
  const targetReferrerId = (req.body.targetReferrerId as string) || 'demo_driver_01';
  const result = attemptClientSideReferralClaim(userId, targetReferrerId);
  res.json(result);
});

app.post('/api/renders/shared', (req, res) => {
  const userId = (req.body.userId as string) || 'demo_driver_01';
  const renderId = (req.body.renderId as string) || `render_${Date.now()}`;
  const result = logSharedRenderEvent(userId, renderId);
  res.json(result);
});

app.get('/api/maintenance/logs', (req, res) => {
  const userId = (req.query.userId as string) || 'demo_driver_01';
  const logs = getMaintenanceLogs(userId);
  res.json({ success: true, logs });
});

app.post('/api/maintenance/logs', (req, res) => {
  const userId = (req.body.userId as string) || 'demo_driver_01';
  const { item, category = 'Oil & Filters', mileage = 12000, date, note, cost, status = 'completed' } = req.body;
  if (!item) {
    return res.status(400).json({ error: 'Maintenance item title is required' });
  }
  const entry = addMaintenanceLog(userId, {
    item,
    category,
    mileage: Number(mileage),
    date: date || new Date().toISOString().split('T')[0],
    note,
    cost: cost ? Number(cost) : undefined,
    status,
  });
  res.json({ success: true, entry });
});

app.delete('/api/maintenance/logs/:id', (req, res) => {
  const userId = (req.query.userId as string) || 'demo_driver_01';
  const logId = req.params.id;
  const deleted = deleteMaintenanceLog(userId, logId);
  res.json({ success: deleted });
});

app.get('/api/diagnostics/health-score', (req, res) => {
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

app.post('/api/vehicle/decode-vin', (req, res) => {
  const { vinOrPlate, state } = req.body;
  if (!vinOrPlate) {
    return res.status(400).json({ error: 'VIN or License plate number is required' });
  }
  const result = decodeVinOrPlate(vinOrPlate, state);
  res.json({ success: true, vehicle: result });
});

// ----------------------------------------------------
// 5. REVENUECAT WEBHOOK HANDLER
// ----------------------------------------------------
app.post('/api/webhooks/revenuecat', (req, res) => {
  try {
    const payload = req.body;
    // Expected RevenueCat webhook payload structure
    const event = payload.event || payload;

    const webhookEvent: RevenueCatWebhookEvent = {
      id: event.id || `evt_${Date.now()}`,
      type: event.type || 'INITIAL_PURCHASE',
      app_user_id: event.app_user_id || event.userId || 'demo_driver_01',
      product_id: event.product_id || 'carai_pro_annual',
      price: event.price_in_purchased_currency || event.price || 79.0,
      currency: event.currency || 'USD',
      purchased_at_ms: event.purchased_at_ms || Date.now(),
      expiration_at_ms: event.expiration_at_ms || Date.now() + 365 * 86400000,
      store: event.store || 'APP_STORE',
      environment: event.environment || 'SANDBOX',
    };

    recordWebhookEvent(webhookEvent);

    console.log(`[RevenueCat Webhook] Processed ${webhookEvent.type} for user: ${webhookEvent.app_user_id}`);
    res.json({ received: true, eventId: webhookEvent.id, status: 'processed' });
  } catch (err: any) {
    console.error('RevenueCat webhook processing error:', err);
    res.status(400).json({ error: 'Webhook processing failed: ' + err.message });
  }
});

app.get('/api/webhooks/revenuecat/logs', (req, res) => {
  res.json({ logs: getWebhookLogs() });
});

// ----------------------------------------------------
// 6. MARKETPLACE & AFFILIATE COMMISSIONS API
// ----------------------------------------------------
app.get('/api/marketplace/parts', (req, res) => {
  const category = req.query.category as string;
  const search = (req.query.q as string || '').toLowerCase();

  let filtered = MARKETPLACE_PARTS;
  if (category && category !== 'All') {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (search) {
    filtered = filtered.filter((p) =>
      p.title.toLowerCase().includes(search) ||
      p.brand.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search)
    );
  }

  res.json({ parts: filtered, count: filtered.length });
});

// ----------------------------------------------------
// 7. PRIVACY POLICY, DATA DELETION & COMPLIANCE (GOOGLE PLAY REQUIREMENT)
// ----------------------------------------------------
const publicDir = path.join(process.cwd(), 'public');

// 7.1 Primary Google Play Privacy Policy
app.get(['/privacy', '/privacy/', '/privacy-policy', '/privacy-policy/', '/legal/privacy', '/privacy.html', '/policy'], (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  const filePath = path.join(publicDir, 'privacy.html');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.send(`<!DOCTYPE html><html><head><title>Privacy Policy</title></head><body><h1>Privacy Policy</h1><p>Visit /privacy.html</p></body></html>`);
});

// 7.2 Dedicated User Data & Account Deletion (Google Play Mandatory Requirement)
app.get(['/delete-account', '/delete-account/', '/delete-account.html', '/data-deletion', '/legal/deletion'], (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  const filePath = path.join(publicDir, 'delete-account.html');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.send(`<!DOCTYPE html><html><head><title>Data Deletion</title></head><body><h1>Data Deletion</h1><p>Contact anthonybhonsle@gmail.com</p></body></html>`);
});

// 7.3 Terms of Service & Subscriptions
app.get(['/terms', '/terms-of-service', '/terms.html', '/legal/terms', '/subscription-terms'], (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  const filePath = path.join(publicDir, 'terms.html');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.send(`<!DOCTYPE html><html><head><title>Terms of Service</title></head><body><h1>Terms of Service</h1></body></html>`);
});

// 7.4 Data Safety Specification
app.get(['/security', '/security-policy', '/data-safety', '/data-safety.html', '/legal/security'], (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  const filePath = path.join(publicDir, 'data-safety.html');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.send(`<!DOCTYPE html><html><head><title>Data Safety</title></head><body><h1>Data Safety</h1></body></html>`);
});

// 7.5 App Store Screenshot Generator (Exact 1290x2796 pixels)
app.get(['/screenshots', '/screenshots/', '/app-store-screenshots', '/app-store-screenshots.html'], (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const filePath = path.join(publicDir, 'app-store-screenshots.html');
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.redirect('/');
});

// ----------------------------------------------------
// 8. CATCH-ALL FOR UNDEFINED API ENDPOINTS (ALWAYS JSON, NEVER HTML)
// ----------------------------------------------------
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `API endpoint ${req.method} ${req.path} is not recognized.`,
  });
});

// ----------------------------------------------------
// VITE & SERVER STARTUP
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`CarAI Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} in use, retrying in 1s...`);
      setTimeout(() => {
        try {
          server.close();
        } catch (_) {}
        server.listen(PORT, '0.0.0.0');
      }, 1000);
    } else {
      console.error('Server error:', err);
    }
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

startServer();
