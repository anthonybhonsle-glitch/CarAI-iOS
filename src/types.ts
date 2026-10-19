export type SeverityLevel = 'critical' | 'warning' | 'info';
export type RepairDifficulty = 'Easy (DIY)' | 'Moderate (Jack + Hand Tools)' | 'Advanced (Specialty Tools)' | 'Professional Mechanic Recommended';

export interface DTCUpgradeOption {
  id: string;
  title: string;
  category: 'Air Intake' | 'Exhaust' | 'Ignition' | 'Cooling' | 'Sensors' | 'Fuel System' | 'Suspension';
  description: string;
  estimatedPrice: number;
  performanceGain: string;
  affiliateUrl: string;
  brand: string;
}

export interface DTCFaultCode {
  code: string;
  title: string;
  system: 'Powertrain (P)' | 'Network / CAN (U)' | 'Body (B)' | 'Chassis (C)';
  severity: SeverityLevel;
  symptoms: string[];
  plainEnglishSummary: string;
  whyItHappened: string[];
  safetyRisk: string;
  drivingRecommendation: string;
  diyDifficulty: RepairDifficulty;
  estimatedRepairCost: {
    min: number;
    max: number;
    averagePartsCost: number;
    laborHours: number;
    laborRatePerHour: number;
  };
  mechanicQuestions: string[];
  stepByStepFix: string[];
  partsNeeded: { name: string; estimatedPrice: number; partNumber?: string }[];
  upgradeOptions: DTCUpgradeOption[];
}

export type TirePosition = 'FL' | 'FR' | 'RL' | 'RR';

export interface TPMSWheelItem {
  position: TirePosition;
  pressurePsi: number;
  temperatureC: number;
  placardPsi: number;
  leakRatePsiPerMin: number;
  status: 'ok' | 'normal' | 'low_warning' | 'critical_leak';
}

export interface TPMSWheelData {
  fl: number;
  fr: number;
  rl: number;
  rr: number;
  flTempC: number;
  frTempC: number;
  rlTempC: number;
  rrTempC: number;
  unit: 'PSI' | 'BAR';
  status: 'normal' | 'low_warning' | 'critical_leak';
  position?: TirePosition;
  pressurePsi?: number;
  temperatureC?: number;
  placardPsi?: number;
  leakRatePsiPerMin?: number;
}

export interface AirPurityData {
  cabinPm25: number;
  exteriorAqi: number;
  co2Ppm: number;
  vocIndex: number;
  humidityPct: number;
  filterLifePct: number;
  recommendation: 'fresh_air' | 'recirculate';
}

export interface AmbientLightingConfig {
  enabled: boolean;
  colorHex: string;
  colorName: string;
  brightnessPercent: number;
  mode: 'static' | 'dynamic_rpm' | 'thermal_sync' | 'music_pulse';
}

export interface OBDTelemetry {
  rpm: number;
  speedKmh: number;
  speedMph: number;
  coolantTempC: number;
  coolantTempF: number;
  oilTempC: number;
  oilTempF?: number;
  transTempC?: number;
  transTempF?: number;
  cylinderHeadTempC?: number;
  intakeTempC: number;
  throttlePosPercent: number;
  engineLoadPercent: number;
  boostPressurePsi: number;
  mapPressureKpa: number;
  shortFuelTrimPercent: number;
  longFuelTrimPercent: number;
  batteryVoltage: number;
  batteryHealthPercent?: number;
  mafFlowGps: number;
  timingAdvanceDeg: number;
  fuelLevelPercent: number;
  milStatus: boolean;
  dtcCount: number;
  ambientTempC: number;
  fuelPressureKpa: number;
  protocolName: string;
  lastUpdated: string;
  // Advanced In-Car & Cockpit Diagnostics
  ureaLevelPercent?: number; // DEF / AdBlue level % (PID 0185)
  ureaRangeKm?: number;
  dpfSootPercent?: number;
  tpms?: TPMSWheelData | any;
  cabinAirQualityAqi?: number; // PM2.5 in-cabin
  cabinFilterHealthPercent?: number;
  exteriorAirQualityAqi?: number;
  ambientLighting?: AmbientLightingConfig;
  evBatterySocPercent?: number;
  carHeadUnitConnected?: boolean;
  carHeadUnitProtocol?: 'Android Automotive OS (AAOS)' | 'Android Auto' | 'Apple CarPlay' | 'Native In-Dash Browser' | 'Bluetooth CAN Bridge';

  // Live Bluetooth Adapter fields (from PDF obdConnection.ts)
  ts?: number;
  speedKph?: number;
  throttlePct?: number;
  engineLoadPct?: number;
  gear?: number;
  engineRunning?: boolean;
  cranking?: boolean;
  coolantC?: number;
  oilC?: number;
  cylinderHeadC?: number;
  exhaustGasC?: number;
  coolantWarn?: boolean;
  coolantCritical?: boolean;
  defLevelPct?: number;
  defRangeKm?: number;
  dpfSootPct?: number;
  dpfRegenActive?: boolean;
  mafGs?: number;
  fuelLevelPct?: number;
  shortFuelTrimPct?: number;
  longFuelTrimPct?: number;
  air?: AirPurityData;
  gLong?: number;
  gLat?: number;
  dtcCodes?: string[];
  odometerKm?: number;
  isRealCarLive?: boolean;
}

export interface FreezeFrameData {
  dtc: string;
  rpm: number;
  speedKmh: number;
  coolantTempC: number;
  engineLoadPercent: number;
  fuelSystemStatus: string;
  shortTrim: number;
  longTrim: number;
  calculatedLoad: number;
  barometricPressureKpa: number;
}

export interface ReadinessMonitor {
  id: string;
  name: string;
  category: string;
  status: 'READY' | 'NOT_READY' | 'UNSUPPORTED';
  description: string;
}

export interface CarProfile {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  vin: string;
  engine: string;
  horsepower: number;
  mileage: number;
  baseColor: string;
  imageUrl: string;
}

export interface CarModConfig {
  carModel: string;
  colorName: string;
  colorHex: string;
  finishType: 'Gloss' | 'Satin Matte' | 'Frozen Metallic' | 'Carbon Weave' | 'Color Shift / Chameleon';
  wheelDesign: string;
  wheelFinish: string;
  wheelSizeInches: number;
  suspensionStance: 'Stock Height' | 'Sport Lowering Springs (-1.5")' | 'Track Coilovers (-2.5")' | 'Air Ride Stance (Airdown)' | 'Rally / Off-Road Lift (+2.0")';
  aeroKit: {
    frontSplitter: boolean;
    sideSkirts: boolean;
    rearDiffuser: boolean;
    rearWingStyle: 'None' | 'Ducktail Spoiler' | 'GT3 Carbon Wing' | 'OEM+ Lip';
    widebodyFenders: boolean;
  };
  hoodStyle: 'OEM Stock' | 'Vented Carbon Fiber' | 'Clear Power Bulge Hood';
  windowTintPercent: number;
  headlightStyle: 'OEM Clean' | 'Smoked Tint + Yellow DRL' | 'Demon Eyes RGB' | 'Laser Blue DRL';
  exhaustStyle: 'OEM Stock' | 'Quad Burnt Titanium Tips' | 'Dual Oval Sport Exhaust' | 'Center Exit Race Pipes';
  environmentPreset: 'Neon Cyberpunk Garage' | 'Sunset Coastal Highway' | 'Alpine Mountain Pass' | 'Clean White Studio Stage' | 'Underground Drift Meet';
  customPromptNotes: string;
}

export interface ModSheetPart {
  name: string;
  brand: string;
  price: number;
  affiliateUrl: string;
  category: string;
  installationHours: number;
}

export interface CarModRenderResult {
  id: string;
  timestamp: string;
  carModel: string;
  promptSummary: string;
  imageUrl: string;
  beforeImageUrl: string;
  config: CarModConfig;
  modSheet: {
    partsList: ModSheetPart[];
    totalEstimatedCost: number;
    laborCostEstimate: number;
    aestheticScore: number;
    estimatedHorsepowerGain: string;
    curatorNotes: string;
  };
}

export interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  totalReferred: number;
  qualifiedCount: number;
  bonusRendersEarned: number;
  referrals: {
    referredUserId: string;
    status: 'pending_obd_connect' | 'qualified_credited';
    createdAt: string;
    creditedAt?: string;
  }[];
}

export interface MaintenanceLogEntry {
  id: string;
  userId: string;
  item: string;
  category: 'Oil & Filters' | 'Tires & Brakes' | 'Fluids' | 'Ignition & Belts' | 'Inspection' | 'Custom';
  mileage: number;
  date: string;
  note?: string;
  cost?: number;
  status: 'completed' | 'due_soon' | 'overdue';
}

export interface VehicleHealthData {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number; // 0 - 100
  trend: 'up' | 'down' | 'stable';
  trendDelta: number;
  faultCodeCount: number;
  criticalFaultCount: number;
  monitorsReadyPercent: number;
  liveVoltageOk: boolean;
  coolantTempStatus: 'normal' | 'warm' | 'overheating';
  lastEvaluated: string;
  summary: string;
}

export interface VinDecodeResult {
  vin: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  engine?: string;
  bodyType: 'Sedan' | 'Coupe' | 'Truck / Pickup' | 'SUV' | 'Wagon' | 'Hatchback';
  fuelType?: string;
}

export interface UserSubscriptionState {
  userId: string;
  isPro: boolean;
  planType?: 'free' | 'pro_monthly' | 'pro_biannual' | 'pro_annual';
  plan?: string | null;
  status?: 'active_trial' | 'active_subscription' | 'trial_expired' | 'free_tier' | 'blocked';
  freeRendersUsed: number;
  freeRendersLimit: number;
  scanCount?: number;
  billingCycleResetDate?: string;
  activeTrial?: boolean;
  hasUsedTrial?: boolean;
  trialDaysLeft?: number;
  trialHoursLeft?: number;
  trialStartedAt?: number | null;
  trialExpiresAt?: number | null;
  trialExpired?: boolean;
  subscriptionExpiresAt?: number | null;
  verifiedPaymentId?: string | null;
  stripeOrRcCustomerId?: string;
  currency?: string;
  expiresAt?: string | null;
}

export interface BankTransaction {
  id: string;
  transactionId: string;
  userId: string;
  planType: 'pro_annual' | 'pro_biannual' | 'pro_monthly';
  amount: number;
  currency: string;
  paymentMethod: 'credit_card' | 'bank_ach' | 'apple_pay' | 'google_pay';
  paymentDetailsMasked: string;
  cardholderName?: string;
  bankSettlementNetwork: string;
  merchantAccountId: string;
  status: 'SETTLED' | 'PROCESSING' | 'FAILED';
  receiptNumber: string;
  authCode: string;
  tlsCipher: string;
  timestamp: string;
}

export interface BankCheckoutRequest {
  userId: string;
  planType: 'pro_annual' | 'pro_biannual' | 'pro_monthly';
  paymentMethod: 'credit_card' | 'bank_ach' | 'apple_pay' | 'google_pay' | 'card';
  cardholderName?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  billingZip?: string;
  bankRoutingNumber?: string;
  bankAccountNumber?: string;
  digitalWalletToken?: string;
}

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  timestampMs: number;
  userId: string;
  action: 'DIAGNOSTICS_PRO_DTC_REQUEST' | 'AI_CUSTOMIZER_RENDER' | 'DYNO_TELEMETRY_EXPORT' | 'REVENUECAT_WEBHOOK' | 'UNAUTHORIZED_BYPASS_ATTEMPT' | 'PAYMENT_VERIFIED' | 'TRIAL_EXPIRATION_LOCK';
  status: 'GRANTED' | 'REDACTED_LOCKED' | 'TRIAL_EXPIRED_BLOCKED' | 'PAYMENT_VERIFIED' | 'REVOKED';
  reason?: string;
  ip?: string;
  details?: Record<string, any>;
}

export type PaywallTrigger =
  | 'post_diagnostic_scan'
  | 'post_first_ai_render'
  | 'usage_limit_reached'
  | 'custom_prompt_input'
  | 'performance_timer'
  | 'freeze_frame'
  | 'garage_multi_vehicle'
  | 'trial_expired'
  | 'direct_payment'
  | 'manual'
  | 'car_screen_cockpit'
  | 'ambient_lighting';

export interface PaywallContext {
  trigger?: PaywallTrigger;
  dtcCode?: string;
  dtcTitle?: string;
  modTitle?: string;
  featureTitle?: string;
  description?: string;
  trialExpired?: boolean;
  step?: 'select' | 'checkout';
}

export interface AffiliateProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  affiliateNetwork: string;
  buyUrl: string;
  fitmentDescription: string;
  performanceGain?: string;
  description: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  category: string;
  brand: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  affiliateCommissionPercent: number;
  affiliateUrl: string;
  compatibility: string;
  inStock: boolean;
  description: string;
}

export interface RevenueCatWebhookEvent {
  api_version?: string;
  id?: string;
  type?: 'INITIAL_PURCHASE' | 'RENEWAL' | 'CANCELLATION' | 'EXPIRATION' | 'PRODUCT_CHANGE';
  app_user_id?: string;
  product_id?: string;
  price?: number;
  currency?: string;
  purchased_at_ms?: number;
  expiration_at_ms?: number;
  store?: string;
  environment?: string;
  event?: any;
}
