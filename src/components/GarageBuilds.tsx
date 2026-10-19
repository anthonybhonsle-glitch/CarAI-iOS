import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Car,
  Plus,
  Trash2,
  Calendar,
  Activity,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wrench,
  Search,
  ShieldCheck,
  DollarSign,
  Clock,
  FileText,
  X,
  PlusCircle,
  Tag,
  Share2,
  Users,
  Copy,
  Gift,
  ShieldAlert,
  Truck,
  PhoneCall,
  QrCode,
  Award,
  Check,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  fetchMaintenanceLogs,
  createMaintenanceLog,
  removeMaintenanceLog,
  decodeVinApi,
  getReferralDetails,
  registerReferralInviteApi,
  recordObdConnectionProof,
  runReferralAdversarialTest,
} from '../services/apiClient';
import { MaintenanceLogEntry, ReferralInfo, UserSubscriptionState, PaywallContext } from '../types';
import { haptics } from '../services/haptics';
import { Crown, Lock, Download } from 'lucide-react';

interface GarageVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  healthStatus: 'good' | 'warning' | 'critical';
  lastScanDate: string;
  activeDTCs: string[];
  imageUrl: string;
  modsCount: number;
  engine?: string;
  trim?: string;
}

interface GarageBuildsProps {
  onNavigateToDiagnostics: () => void;
  onNavigateToCustomizer: () => void;
  user: UserSubscriptionState;
  onOpenPaywall: (context?: PaywallContext) => void;
}

export const GarageBuilds: React.FC<GarageBuildsProps> = ({
  onNavigateToDiagnostics,
  onNavigateToCustomizer,
  user,
  onOpenPaywall,
}) => {
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([
    {
      id: 'veh_1',
      make: 'BMW',
      model: 'M3 Competition (G80)',
      year: 2024,
      vin: 'WBA33AY08PFS18294',
      mileage: 14250,
      healthStatus: 'warning',
      lastScanDate: 'Today, 10:45 AM',
      activeDTCs: ['P0101', 'P0300'],
      imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80',
      modsCount: 4,
      engine: '3.0L S58 Twin-Turbo Inline-6 (503 HP)',
      trim: 'xDrive Competition Sedan',
    },
    {
      id: 'veh_2',
      make: 'Porsche',
      model: '911 Carrera S (992)',
      year: 2023,
      vin: 'WP0AB2A92PS294810',
      mileage: 8900,
      healthStatus: 'good',
      lastScanDate: '3 days ago',
      activeDTCs: [],
      imageUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1000&q=80',
      modsCount: 6,
      engine: '3.0L Twin-Turbo Boxer-6 (443 HP)',
      trim: 'Sport Chrono Package',
    },
    {
      id: 'veh_3',
      make: 'Nissan',
      model: 'GT-R Premium (R35)',
      year: 2022,
      vin: 'JN1GAR35U0019283',
      mileage: 22100,
      healthStatus: 'good',
      lastScanDate: '1 week ago',
      activeDTCs: [],
      imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80',
      modsCount: 8,
      engine: '3.8L VR38DETT Twin-Turbo V6 (565 HP)',
      trim: 'Premium All-Wheel Drive',
    },
  ]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('veh_1');
  const [activeTab, setActiveTab] = useState<'vehicles' | 'smart_services' | 'maintenance' | 'vin_decoder' | 'referrals'>('smart_services');

  // Smart Garage Service & Digital Job Card state
  const [selectedServicePackageId, setSelectedServicePackageId] = useState<string>('periodic');
  const [includeDoorstepPickup, setIncludeDoorstepPickup] = useState<boolean>(true);
  const [preferredBookingSlot, setPreferredBookingSlot] = useState<string>('Tomorrow, 09:30 AM');
  const [showBookingSuccessModal, setShowBookingSuccessModal] = useState<boolean>(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [extraPartApproved, setExtraPartApproved] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const servicePackages = [
    {
      id: 'periodic',
      name: 'Comprehensive Periodic Service',
      priceUSD: 89,
      priceINR: 3499,
      duration: '3.5 Hours',
      recommendedEvery: '10,000 km / 12 Months',
      tag: 'Most Popular',
      description: 'Complete engine rejuvenation, synthetic fluid flush, and certified 40-point safety check.',
      includes: [
        '100% Genuine Synthetic Engine Oil (Castrol/Motul 0W-30)',
        'OEM Micro-Pleated Oil Filter & Drain Plug Washer',
        'Air & Cabin HEPA Filter Deep Cleaning & Ozone Mist',
        'Comprehensive 40-Point Electronic & Physical Inspection',
        'Coolant, Brake & Windshield Washer Fluid Top-Up',
        'Battery Health Load Test & Alternator CCA Diagnostic',
      ],
    },
    {
      id: 'brakes',
      name: 'Ceramic Brake Overhaul & Flush',
      priceUSD: 69,
      priceINR: 2699,
      duration: '2 Hours',
      recommendedEvery: '20,000 km',
      tag: 'Critical Safety',
      description: 'Precision stopping power, ceramic pad inspection, and hydraulic fluid power-bleed.',
      includes: [
        'Ceramic Brake Pads Inspection & Caliper Greasing',
        'High-Temp DOT 4 Synthetic Fluid Power Bleed',
        'Rotor Surface Runout & Thickness Micrometer Check',
        'Handbrake Cable & Electronic Parking Brake Reset',
        'ABS Hydraulic Modulator CAN-bus Diagnostic Test',
      ],
    },
    {
      id: 'ac_climate',
      name: 'AC Climate Pro & Evaporator Sanitization',
      priceUSD: 49,
      priceINR: 1899,
      duration: '1.5 Hours',
      recommendedEvery: 'Seasonal / 6 Months',
      tag: 'High Demand',
      description: 'Ice-cold cabin climate, eco-friendly refrigerant recharge, and antibacterial duct foam.',
      includes: [
        'Eco-Friendly R134a/R1234yf Refrigerant Vacuum & Recharge',
        'Compressor Oil Lubrication & Operating Pressure Test',
        'Ultrasonic Antibacterial Evaporator Foam Treatment',
        'Activated Carbon Cabin Filter Replacement',
        'Condenser High-Pressure Fin Debris Flush',
      ],
    },
    {
      id: 'ecu_diagnostic',
      name: 'OBD-II Deep Diagnostic & ECU Calibration',
      priceUSD: 39,
      priceINR: 1499,
      duration: '1 Hour',
      recommendedEvery: 'When MIL Lights or Post-Mod',
      tag: 'CarAI Exclusive',
      description: 'Live powertrain CAN-bus analysis, zero check-engine lights, and sensor calibration.',
      includes: [
        'Multi-ECU DTC Scan & Readiness Monitor Audit',
        'Electronic Throttle Body Adaptation & Idle Relearn',
        'Live Oxygen Sensor Waveform & Fuel Trim Calibration',
        'Real-time Boost & Intake Temp Telemetry Logging',
        'Comprehensive Digital Health Certificate Generated',
      ],
    },
    {
      id: 'detailing',
      name: 'Ceramic Shield & Deep Interior Spa',
      priceUSD: 79,
      priceINR: 2999,
      duration: '4 Hours',
      recommendedEvery: '6 Months',
      tag: 'Showroom Finish',
      description: 'Mirror glass paint finish with 6-month hydrophobic ceramic sealant and leather conditioning.',
      includes: [
        'Multi-Stage High-Pressure Snow Foam Pre-Wash',
        'Clay Bar Paint Decontamination & Iron Fallout Removal',
        '6-Month Hydrophobic Ceramic Sealant Application',
        'Interior Steam Sanitization & Leather Conditioner',
        'Engine Bay Dressing & UV Plastic Restoration',
      ],
    },
  ];

  // Active Live Digital Job Card for current selected vehicle
  const liveJobCard = {
    jobNumber: 'CARAI-SG-8842',
    date: 'Today, September 8',
    status: 'Phase 4/6: Precision Servicing',
    progressPercent: 65,
    assignedTech: {
      name: 'Rajesh Sharma',
      role: 'Master Diagnostic Technician',
      badge: 'Bosch & ASE Certified (14+ yrs exp)',
      rating: '4.9 ★ (840+ services completed)',
      phone: '+91 98201 44821',
    },
    workshopBay: 'CarAI Smart Bay #4 (Digital Dyno & Live OBD Stream)',
    pickupType: includeDoorstepPickup ? 'Doorstep Valet Pick-Up & Drop' : 'Drive-in Garage Bay',
    deliveryEta: 'Today by 04:30 PM (Est. 1h 20m remaining)',
    stages: [
      { id: 1, title: 'Vehicle Check-in & OBD Deep Scan', time: '09:30 AM', status: 'completed', desc: 'Pre-service ECU scan verified. Zero fatal powertrain faults.' },
      { id: 2, title: '40-Point Electronic & Visual Inspection', time: '10:15 AM', status: 'completed', desc: 'Chassis, suspension, brake rotors, and underbody verified.' },
      { id: 3, title: 'Genuine OEM Spares Unboxing & Allocation', time: '11:00 AM', status: 'completed', desc: 'Castrol EDGE 0W-30 Titanium + BMW OEM Oil Filter unboxed with serial verification.' },
      { id: 4, title: 'Precision Servicing & Fluid Flush', time: 'Active Now', status: 'active', desc: 'Engine oil flushed, new filter torqued to 25 Nm. Brake inspection in progress.' },
      { id: 5, title: 'Road Dyno Test & Sensor Recalibration', time: '03:15 PM', status: 'pending', desc: 'Live telemetric road test and throttle adaptation.' },
      { id: 6, title: 'Final Detailing & Digital Invoice Sign-off', time: '04:00 PM', status: 'pending', desc: 'Sanitization, digital job card archiving, and vehicle handover.' },
    ],
    inspectionChecklist: [
      { item: 'ECU OBD-II Pre-Scan & DTC Log', status: 'pass', note: 'No fatal engine fault codes. P0101 MAF calibrated.' },
      { item: 'Engine Oil & OEM Filter Refill', status: 'pass', note: 'Filled with 7.0L Castrol EDGE 0W-30 Titanium.' },
      { item: '40-Point Mechanical & Underbody Check', status: 'pass', note: 'Suspension bushings and ball joints tight.' },
      { item: 'Front & Rear Brake Wear Micrometer', status: extraPartApproved ? 'pass' : 'action_needed', note: extraPartApproved ? 'Replacement wear sensor & pads approved by owner' : 'Front pads at 3.2mm (wear sensor replacement recommended: ₹1,250)' },
      { item: 'Battery Voltage & Cranking Amps', status: 'pass', note: '12.6V resting, 850 CCA (100% Healthy).' },
      { item: 'Coolant Glycol Ratio & Freeze Point', status: 'pass', note: '50/50 Mix, freeze point -37°C.' },
      { item: 'HEPA Air Filter & Cabin Disinfection', status: 'pass', note: 'Ultrasonic ozone mist applied to cabin vents.' },
      { item: 'Post-Service Dyno & Road Test', status: 'pending', note: 'Scheduled once brake pads are torqued.' },
    ],
  };

  // Maintenance log state
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLogEntry[]>([]);
  const [isAddingLog, setIsAddingLog] = useState<boolean>(false);
  const [newLogItem, setNewLogItem] = useState<string>('');
  const [newLogCategory, setNewLogCategory] = useState<string>('Oil & Filters');
  const [newLogMileage, setNewLogMileage] = useState<number>(14500);
  const [newLogCost, setNewLogCost] = useState<number>(85);
  const [newLogDate, setNewLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newLogNote, setNewLogNote] = useState<string>('');

  // VIN Decoder state
  const [vinQuery, setVinQuery] = useState<string>('WBA33AY08PFS18294');
  const [decodedVinResult, setDecodedVinResult] = useState<any>(null);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);

  // Referral state
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [adversarialTestResult, setAdversarialTestResult] = useState<{ granted: boolean; reason: string } | null>(null);
  const [testUserEmail, setTestUserEmail] = useState<string>('friend_driver@example.com');
  const [inviteStatusMsg, setInviteStatusMsg] = useState<string>('');

  useEffect(() => {
    loadMaintenance();
    loadReferral();
  }, []);

  const loadMaintenance = async () => {
    try {
      const logs = await fetchMaintenanceLogs('demo_driver_01');
      setMaintenanceLogs(logs);
    } catch (err) {
      console.error('Error loading maintenance logs:', err);
    }
  };

  const loadReferral = async () => {
    try {
      const data = await getReferralDetails('demo_driver_01');
      setReferralInfo(data as any);
    } catch (err) {
      console.error('Error loading referral info:', err);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogItem) return;
    try {
      haptics.selectionChanged();
      const entry = await createMaintenanceLog('demo_driver_01', {
        item: newLogItem,
        category: newLogCategory,
        mileage: Number(newLogMileage),
        date: newLogDate,
        cost: Number(newLogCost),
        note: newLogNote,
        status: 'completed',
      });
      setMaintenanceLogs((prev) => [entry, ...prev]);
      setIsAddingLog(false);
      setNewLogItem('');
      setNewLogNote('');
    } catch (err) {
      console.error('Failed to add maintenance log:', err);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      haptics.lightTap();
      await removeMaintenanceLog('demo_driver_01', id);
      setMaintenanceLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Failed to remove log:', err);
    }
  };

  const handleDecodeVin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vinQuery) return;
    setIsDecoding(true);
    try {
      haptics.lightTap();
      const res = await decodeVinApi(vinQuery);
      setDecodedVinResult(res);
    } catch (err) {
      console.error('VIN decode failed:', err);
    } finally {
      setIsDecoding(false);
    }
  };

  const handleAddDecodedVehicleToFleet = () => {
    if (!decodedVinResult) return;
    haptics.selectionChanged();
    const newVeh: GarageVehicle = {
      id: `veh_${Date.now()}`,
      make: decodedVinResult.make,
      model: decodedVinResult.model,
      year: decodedVinResult.year,
      vin: decodedVinResult.vin,
      mileage: 12000,
      healthStatus: 'good',
      lastScanDate: 'Just Added',
      activeDTCs: [],
      imageUrl:
        'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1000&q=80',
      modsCount: 0,
      engine: decodedVinResult.engine,
      trim: decodedVinResult.trim,
    };
    setVehicles((prev) => [newVeh, ...prev]);
    setSelectedVehicleId(newVeh.id);
    setActiveTab('vehicles');
  };

  const handleCopyReferralLink = () => {
    if (!referralInfo?.referralLink) return;
    haptics.selectionChanged();
    navigator.clipboard.writeText(referralInfo.referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUserEmail) return;
    try {
      haptics.lightTap();
      const res = await registerReferralInviteApi('demo_driver_01', testUserEmail);
      setInviteStatusMsg(res.message);
      loadReferral();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateReferredObdConnect = async () => {
    try {
      haptics.selectionChanged();
      const res = await recordObdConnectionProof(testUserEmail);
      if (res.creditedReferrer) {
        setInviteStatusMsg('SUCCESS: Referred driver plugged into OBD port. +1 Free Bonus Render credited!');
      } else {
        setInviteStatusMsg('OBD proof verified.');
      }
      loadReferral();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunAdversarialTest = async () => {
    try {
      haptics.lightTap();
      const res = await runReferralAdversarialTest('unverified_rogue_client', 'demo_driver_01');
      setAdversarialTestResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  return (
    <div id="garage-view" className="space-y-6">
      {/* Top Banner Navigation Bar */}
      <div className="relative flex flex-col items-start justify-between gap-5 rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 sm:p-8 shadow-xl overflow-hidden sm:flex-row sm:items-center">
        <div className="z-10">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              SMART GARAGE & WORKSHOP SUITE
            </h2>
            <span className="rounded-md bg-[#1F2733] border border-[#3A4556] px-3 py-1 text-xs font-bold text-amber-300 font-mono-tech">
              {vehicles.length} Connected Vehicles
            </span>
          </div>
          <p className="mt-2 text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl font-normal">
            Digital job card tracker, transparent service cost estimator, maintenance ledger, and certified genuine spares.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <button
            id="tab-smart-services"
            onClick={() => {
              haptics.lightTap();
              setActiveTab('smart_services');
            }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm sm:text-base font-bold transition-all min-h-[46px] ${
              activeTab === 'smart_services'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg border border-amber-400/80 shadow-amber-600/30'
                : 'bg-[#1A202A] text-zinc-200 border border-[#2C3440] hover:bg-[#252D3B] hover:text-white'
            }`}
          >
            <Wrench className="h-4.5 w-4.5 text-amber-400" />
            <span>Smart Services & Job Cards</span>
          </button>

          <button
            id="tab-vehicles"
            onClick={() => {
              haptics.lightTap();
              setActiveTab('vehicles');
            }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm sm:text-base font-bold transition-all min-h-[46px] ${
              activeTab === 'vehicles'
                ? 'bg-amber-600 text-white shadow-lg border border-amber-400'
                : 'bg-[#1A202A] text-zinc-200 border border-[#2C3440] hover:bg-[#252D3B] hover:text-white'
            }`}
          >
            <Car className="h-4.5 w-4.5" />
            <span>Fleet</span>
          </button>

          <button
            id="tab-maintenance"
            onClick={() => {
              haptics.lightTap();
              setActiveTab('maintenance');
            }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm sm:text-base font-bold transition-all min-h-[46px] ${
              activeTab === 'maintenance'
                ? 'bg-amber-600 text-white shadow-lg border border-amber-400'
                : 'bg-[#1A202A] text-zinc-200 border border-[#2C3440] hover:bg-[#252D3B] hover:text-white'
            }`}
          >
            <FileText className="h-4.5 w-4.5" />
            <span>Service History</span>
          </button>

          <button
            id="tab-vin-decoder"
            onClick={() => {
              haptics.lightTap();
              setActiveTab('vin_decoder');
            }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm sm:text-base font-bold transition-all min-h-[46px] ${
              activeTab === 'vin_decoder'
                ? 'bg-amber-600 text-white shadow-lg border border-amber-400'
                : 'bg-[#1A202A] text-zinc-200 border border-[#2C3440] hover:bg-[#252D3B] hover:text-white'
            }`}
          >
            <Search className="h-4.5 w-4.5" />
            <span>VIN Decoder</span>
          </button>

          <button
            id="tab-referrals"
            onClick={() => {
              haptics.lightTap();
              setActiveTab('referrals');
            }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm sm:text-base font-bold transition-all min-h-[46px] ${
              activeTab === 'referrals'
                ? 'bg-amber-600 text-white shadow-lg border border-amber-400'
                : 'bg-[#1A202A] text-zinc-200 border border-[#2C3440] hover:bg-[#252D3B] hover:text-white'
            }`}
          >
            <Gift className="h-4.5 w-4.5" />
            <span>Referrals</span>
          </button>
        </div>
      </div>

      {/* ----------------- TAB 0: SMART SERVICES & LIVE JOB CARDS (PIKPART BENCHMARK) ----------------- */}
      {activeTab === 'smart_services' && (
        <div className="space-y-6">
          {/* Active Vehicle Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-[#2C3440] bg-[#14181F] p-5 sm:p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-20 rounded-2xl overflow-hidden bg-[#0A0D14] border border-[#2C3440] shrink-0">
                <img src={selectedVehicle.imageUrl} alt={selectedVehicle.model} className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono-tech text-amber-400 uppercase tracking-wide">
                    Active Vehicle
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                    selectedVehicle.healthStatus === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {selectedVehicle.healthStatus === 'warning' ? 'Service Recommended' : 'Healthy'}
                  </span>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </h3>
                <p className="font-mono-tech text-xs sm:text-sm text-zinc-300">
                  VIN: {selectedVehicle.vin} • Mileage: {selectedVehicle.mileage.toLocaleString()} mi
                </p>
              </div>
            </div>

            {/* Switch Vehicle Pills */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    haptics.lightTap();
                    setSelectedVehicleId(v.id);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all min-h-[40px] ${
                    selectedVehicleId === v.id
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-[#1A202A] text-zinc-300 hover:text-white border border-[#2C3440]'
                  }`}
                >
                  {v.make} {v.model.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* 1. ACTIVE LIVE DIGITAL JOB CARD */}
          <div className="rounded-3xl border border-amber-500/40 bg-[#14181F] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#2C3440] pb-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs sm:text-sm font-bold text-amber-300 font-mono-tech">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                    LIVE DIGITAL JOB CARD
                  </span>
                  <span className="font-mono-tech text-sm sm:text-base font-bold text-white">
                    #{liveJobCard.jobNumber}
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  Active Workshop Service Tracking
                </h3>
                <p className="text-sm sm:text-base text-zinc-300 mt-1 font-normal">
                  Real-time technician updates, digital inspection checklist, and genuine spare parts verification.
                </p>
              </div>

              {/* Status & ETA Badge */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="rounded-2xl bg-[#1A202A] border border-[#2C3440] p-4 text-left sm:text-right">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Estimated Handover</span>
                  <p className="font-mono-tech text-base sm:text-lg font-bold text-amber-300 mt-0.5">
                    {liveJobCard.deliveryEta}
                  </p>
                </div>
                <button
                  onClick={() => {
                    haptics.lightTap();
                    setShowInvoiceModal(true);
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-[#1A202A] border border-amber-500/40 hover:bg-amber-600/20 px-4 py-3.5 text-xs sm:text-sm font-bold text-amber-300 transition-all min-h-[46px]"
                >
                  <FileText className="h-4.5 w-4.5" />
                  <span>Digital GST Invoice</span>
                </button>
              </div>
            </div>

            {/* Progress Bar & Stage Stepper */}
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-400" />
                  Current Phase: {liveJobCard.status}
                </span>
                <span className="font-mono-tech text-amber-300 font-bold">{liveJobCard.progressPercent}% Completed</span>
              </div>
              <div className="h-3 w-full bg-[#0E1116] rounded-full overflow-hidden border border-[#2C3440]">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-orange-500 to-amber-400 rounded-full transition-all duration-700 shadow-sm shadow-amber-500/50"
                  style={{ width: `${liveJobCard.progressPercent}%` }}
                />
              </div>

              {/* Stage Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                {liveJobCard.stages.map((stage) => {
                  const isDone = stage.status === 'completed';
                  const isActive = stage.status === 'active';
                  return (
                    <div
                      key={stage.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isActive
                          ? 'border-amber-400/80 bg-[#1D222B] ring-1 ring-amber-400/50 shadow-lg'
                          : isDone
                          ? 'border-emerald-500/40 bg-[#161B22]'
                          : 'border-[#28303C] bg-[#10141A] opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono-tech font-bold text-zinc-400">Step 0{stage.id}</span>
                        {isDone && (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Done ({stage.time})
                          </span>
                        )}
                        {isActive && (
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-300 font-mono-tech animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-amber-400" /> In Progress
                          </span>
                        )}
                        {!isDone && !isActive && (
                          <span className="text-xs font-medium text-zinc-400">{stage.time}</span>
                        )}
                      </div>
                      <h4 className="font-display text-base font-bold text-white mt-1.5">{stage.title}</h4>
                      <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed font-normal">{stage.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Master Technician & Service Bay Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#2C3440]">
              <div className="flex items-center gap-3.5 rounded-2xl bg-[#1A202A] p-4 border border-[#2C3440]">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                  RS
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-tech font-bold text-amber-400 uppercase">Assigned Master Tech</span>
                    <span className="text-xs font-bold text-emerald-400">{liveJobCard.assignedTech.rating}</span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-0.5">{liveJobCard.assignedTech.name}</h4>
                  <p className="text-xs text-zinc-300 font-medium">{liveJobCard.assignedTech.badge}</p>
                </div>
                <button
                  onClick={() => {
                    haptics.lightTap();
                    setToastMessage(`Connecting to Workshop Advisor: ${liveJobCard.assignedTech.phone}`);
                    setTimeout(() => setToastMessage(''), 3500);
                  }}
                  className="rounded-xl bg-[#252D3B] hover:bg-[#323D4E] p-3 text-amber-400 border border-[#3A4556] transition-colors"
                  title="Contact Service Advisor"
                >
                  <PhoneCall className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[#1A202A] p-4 border border-[#2C3440]">
                <div>
                  <span className="text-xs font-mono-tech font-bold text-zinc-400 uppercase">Workshop Logistics</span>
                  <h4 className="text-base font-bold text-white mt-0.5">{liveJobCard.workshopBay}</h4>
                  <p className="text-xs sm:text-sm text-zinc-300 font-medium flex items-center gap-1.5 mt-0.5">
                    <Truck className="h-3.5 w-3.5 text-amber-400" />
                    {liveJobCard.pickupType} (Zero Hassle)
                  </p>
                </div>
                <button
                  onClick={() => {
                    haptics.mediumSuccess();
                    setToastMessage('Exporting certified digital job card & telemetry report...');
                    setTimeout(() => setToastMessage(''), 3500);
                  }}
                  className="rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-colors min-h-[42px] flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Job Card</span>
                </button>
              </div>
            </div>

            {/* 18-Point Digital Inspection Checklist */}
            <div className="mt-6 rounded-2xl bg-[#10141A] border border-[#28303C] p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2C3440] pb-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <h4 className="font-display text-base sm:text-lg font-bold text-white">
                    Digital 18-Point Vehicle Health Inspection Card
                  </h4>
                </div>
                <span className="text-xs font-mono-tech font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-md">
                  100% Genuine OEM Spares Guaranteed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {liveJobCard.inspectionChecklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-[#161B22] border border-[#262E3B]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{item.item}</span>
                        {item.status === 'pass' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 font-mono-tech">
                            PASSED
                          </span>
                        )}
                        {item.status === 'action_needed' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 font-mono-tech animate-pulse">
                            ATTENTION
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-700/50 text-zinc-300 font-mono-tech">
                            QUEUED
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-300 mt-1 font-normal leading-relaxed">{item.note}</p>
                    </div>

                    {item.status === 'action_needed' && !extraPartApproved && (
                      <button
                        onClick={() => {
                          haptics.selectionChanged();
                          setExtraPartApproved(true);
                          setToastMessage('Approved wear sensor & replacement brake pads added to Job Card!');
                          setTimeout(() => setToastMessage(''), 3500);
                        }}
                        className="shrink-0 rounded-xl bg-amber-600 hover:bg-amber-500 px-3 py-2 text-xs font-bold text-white shadow-sm min-h-[38px]"
                      >
                        Approve ₹1,250
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. INSTANT SMART SERVICE PACKAGE BOOKING & COST ESTIMATOR */}
          <div className="rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2C3440] pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                    SMART SERVICE BOOKING & COST ESTIMATOR
                  </h3>
                  <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold text-amber-300 font-mono-tech">
                    Transparent Quotes
                  </span>
                </div>
                <p className="text-sm sm:text-base text-zinc-300 mt-1 max-w-3xl leading-relaxed font-normal">
                  Select certified service packages with guaranteed OEM spares, transparent upfront pricing, and certified mechanic inspection.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 font-mono-tech">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>6 Months / 10,000 km Warranty Included</span>
              </div>
            </div>

            {/* Service Package Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicePackages.map((pkg) => {
                const isSelected = selectedServicePackageId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => {
                      haptics.lightTap();
                      setSelectedServicePackageId(pkg.id);
                    }}
                    className={`cursor-pointer rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-400 bg-[#1A202A] shadow-xl ring-1 ring-amber-400/60'
                        : 'border-[#2C3440] bg-[#10141A] hover:border-[#424D5E] hover:bg-[#151A22]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono-tech bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {pkg.tag}
                        </span>
                        <span className="text-xs font-mono-tech text-zinc-400 font-semibold">{pkg.duration}</span>
                      </div>
                      <h4 className="font-display text-lg font-bold text-white mt-2.5">{pkg.name}</h4>
                      <p className="text-xs sm:text-sm text-zinc-300 mt-1 font-normal leading-relaxed">{pkg.description}</p>

                      <div className="mt-4 pt-3 border-t border-[#262E3B] space-y-1.5">
                        <span className="text-xs font-bold text-zinc-400 uppercase font-mono-tech">Package Includes:</span>
                        {pkg.includes.slice(0, 3).map((inc, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-zinc-200">
                            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{inc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#262E3B] flex items-center justify-between">
                      <div>
                        <span className="text-xs text-zinc-400 font-mono-tech">All-inclusive Price</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono-tech text-xl sm:text-2xl font-extrabold text-white">
                            ₹{pkg.priceINR.toLocaleString()}
                          </span>
                          <span className="text-xs font-mono-tech text-zinc-400 font-medium">(${pkg.priceUSD})</span>
                        </div>
                      </div>
                      <div className={`h-6 w-6 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-amber-400 bg-amber-500 text-white' : 'border-[#3A4556]'
                      }`}>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Transparent Booking & Cost Breakdown Panel */}
            {(() => {
              const selectedPkg = servicePackages.find((p) => p.id === selectedServicePackageId) || servicePackages[0];
              const partsSubtotal = Math.round(selectedPkg.priceINR * 0.62);
              const laborCharge = Math.round(selectedPkg.priceINR * 0.38);
              const extraAddonCost = extraPartApproved ? 1250 : 0;
              const pickupFee = includeDoorstepPickup ? 0 : 0; // Complimentary
              const totalEstimate = selectedPkg.priceINR + extraAddonCost;

              return (
                <div className="rounded-2xl border border-amber-500/30 bg-[#0E1116] p-6 space-y-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#242B37] pb-5">
                    <div>
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono-tech">
                        UPFRONT COST ESTIMATION BREAKDOWN
                      </span>
                      <h4 className="font-display text-xl font-bold text-white mt-1">
                        Booking: {selectedPkg.name} ({selectedVehicle.make} {selectedVehicle.model})
                      </h4>
                    </div>

                    {/* Doorstep Valet Pickup Toggle */}
                    <div
                      onClick={() => {
                        haptics.lightTap();
                        setIncludeDoorstepPickup(!includeDoorstepPickup);
                      }}
                      className="cursor-pointer flex items-center gap-3 bg-[#161B23] border border-[#2C3440] hover:border-amber-500/50 p-3.5 rounded-2xl transition-all"
                    >
                      <Truck className={`h-5 w-5 ${includeDoorstepPickup ? 'text-amber-400' : 'text-zinc-400'}`} />
                      <div>
                        <div className="text-xs font-bold text-white">Doorstep Pick-Up & Drop</div>
                        <div className="text-[11px] text-emerald-400 font-semibold font-mono-tech">FREE FOR YOUR AREA</div>
                      </div>
                      <div className={`h-5 w-9 rounded-full transition-colors relative ml-2 ${
                        includeDoorstepPickup ? 'bg-amber-500' : 'bg-zinc-700'
                      }`}>
                        <div className={`h-4 w-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                          includeDoorstepPickup ? 'right-0.5' : 'left-0.5'
                        }`} />
                      </div>
                    </div>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-mono-tech">
                    <div className="rounded-xl bg-[#14181F] p-4 border border-[#262E3B]">
                      <span className="text-xs text-zinc-400 uppercase">OEM Genuine Parts</span>
                      <p className="text-lg font-bold text-white mt-1">₹{partsSubtotal.toLocaleString()}</p>
                      <span className="text-[11px] text-emerald-400 font-sans">100% Genuine Certified</span>
                    </div>

                    <div className="rounded-xl bg-[#14181F] p-4 border border-[#262E3B]">
                      <span className="text-xs text-zinc-400 uppercase">Certified Labor</span>
                      <p className="text-lg font-bold text-white mt-1">₹{laborCharge.toLocaleString()}</p>
                      <span className="text-[11px] text-zinc-400 font-sans">ASE / Bosch Master Tech</span>
                    </div>

                    <div className="rounded-xl bg-[#14181F] p-4 border border-[#262E3B]">
                      <span className="text-xs text-zinc-400 uppercase">Approved Spares</span>
                      <p className="text-lg font-bold text-amber-300 mt-1">
                        {extraPartApproved ? '₹1,250' : '₹0'}
                      </p>
                      <span className="text-[11px] text-zinc-400 font-sans">{extraPartApproved ? 'Sensor Approved' : 'No Add-ons'}</span>
                    </div>

                    <div className="rounded-xl bg-[#1D222B] p-4 border border-amber-500/50 shadow-md">
                      <span className="text-xs text-amber-300 uppercase font-bold">Total Estimated Cost</span>
                      <p className="text-2xl font-extrabold text-white mt-0.5">₹{totalEstimate.toLocaleString()}</p>
                      <span className="text-[11px] text-emerald-400 font-sans font-bold">All Taxes Included</span>
                    </div>
                  </div>

                  {/* Slot Selector & Book Action */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Calendar className="h-5 w-5 text-amber-400 shrink-0" />
                      <div className="w-full sm:w-auto">
                        <label className="text-xs font-bold text-zinc-300 uppercase">Service Slot:</label>
                        <select
                          value={preferredBookingSlot}
                          onChange={(e) => setPreferredBookingSlot(e.target.value)}
                          className="w-full sm:w-auto mt-1 rounded-xl border border-[#2C3440] bg-[#14181F] px-4 py-2.5 text-sm font-bold text-white focus:border-amber-400 focus:outline-none min-h-[44px]"
                        >
                          <option value="Tomorrow, 09:30 AM">Tomorrow, 09:30 AM (Available)</option>
                          <option value="Tomorrow, 02:00 PM">Tomorrow, 02:00 PM (Available)</option>
                          <option value="Friday, 10:00 AM">Friday, 10:00 AM (Available)</option>
                          <option value="Saturday, 11:30 AM">Saturday, 11:30 AM (Fast-Track Weekend)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        haptics.mediumSuccess();
                        setShowBookingSuccessModal(true);
                      }}
                      className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 px-8 py-3.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-amber-600/30 transition-all active:scale-95 min-h-[48px] flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Book Service Appointment (₹{totalEstimate.toLocaleString()})</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-amber-500 text-zinc-950 font-bold px-5 py-3.5 shadow-2xl border border-amber-300 font-mono-tech text-sm animate-bounce">
              {toastMessage}
            </div>
          )}

          {/* Booking Success Modal */}
          {showBookingSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-lg rounded-3xl border border-amber-500/60 bg-[#14181F] p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-[#2C3440] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-white">Appointment Confirmed!</h3>
                      <p className="text-xs font-mono-tech text-amber-300">Job Reference #CARAI-SG-8843</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBookingSuccessModal(false)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 text-sm text-zinc-200">
                  <div className="p-4 rounded-2xl bg-[#0E1116] border border-[#262E3B] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Vehicle:</span>
                      <span className="font-bold text-white">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Scheduled Time:</span>
                      <span className="font-bold text-amber-300 font-mono-tech">{preferredBookingSlot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Logistics:</span>
                      <span className="font-bold text-emerald-400">{includeDoorstepPickup ? 'Doorstep Valet Pickup' : 'Drive-in Bay'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Spares Guarantee:</span>
                      <span className="font-bold text-white">100% Genuine OEM Spares</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Our CarAI Certified Service Advisor will arrive at your address 15 minutes prior for the digital check-in scan. You will receive live photo and diagnostic updates via WhatsApp and push notification.
                  </p>
                </div>

                <button
                  onClick={() => setShowBookingSuccessModal(false)}
                  className="w-full rounded-2xl bg-amber-600 hover:bg-amber-500 py-3.5 text-sm font-bold text-white shadow-lg min-h-[46px]"
                >
                  Return to Garage Suite
                </button>
              </div>
            </div>
          )}

          {/* Official Itemized GST Invoice Modal */}
          {showInvoiceModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#3A4556] bg-[#0E1116] p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-[#282F3A] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-display font-bold text-white">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-white">CARAI SMART GARAGE</h3>
                      <p className="text-xs text-zinc-400 font-mono-tech">Tax Invoice & QC Certificate</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Invoice Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono-tech bg-[#14181F] p-4 rounded-2xl border border-[#262E3B]">
                  <div>
                    <span className="text-zinc-400">Invoice No:</span>
                    <p className="font-bold text-white mt-0.5">INV-2026-SG8842</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Date:</span>
                    <p className="font-bold text-white mt-0.5">08 Sept 2026</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">GSTIN:</span>
                    <p className="font-bold text-cyan-300 mt-0.5">07AAAAA0000A1Z5</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Vehicle:</span>
                    <p className="font-bold text-white mt-0.5">{selectedVehicle.model}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">VIN:</span>
                    <p className="font-bold text-zinc-300 mt-0.5">{selectedVehicle.vin.slice(0, 11)}***</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Warranty:</span>
                    <p className="font-bold text-emerald-400 mt-0.5">6 Months Valid</p>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="overflow-hidden rounded-2xl border border-[#262E3B]">
                  <table className="w-full text-left text-xs sm:text-sm text-zinc-200">
                    <thead className="bg-[#1A202A] text-zinc-400 font-bold uppercase font-mono-tech">
                      <tr>
                        <th className="p-3">Description & Part #</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262E3B] bg-[#14181F]">
                      <tr>
                        <td className="p-3">
                          <span className="font-bold text-white">Castrol EDGE 0W-30 Titanium FST (7L)</span>
                          <span className="block text-xs text-zinc-400 font-mono-tech">OEM Part #83212365950</span>
                        </td>
                        <td className="p-3 text-center font-mono-tech">1</td>
                        <td className="p-3 text-right font-mono-tech font-bold text-white">₹2,150</td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <span className="font-bold text-white">BMW OEM Micro-Pleated Oil Filter Cartridge</span>
                          <span className="block text-xs text-zinc-400 font-mono-tech">OEM Part #11427854445</span>
                        </td>
                        <td className="p-3 text-center font-mono-tech">1</td>
                        <td className="p-3 text-right font-mono-tech font-bold text-white">₹650</td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <span className="font-bold text-white">Certified Master Technician Precision Labor</span>
                          <span className="block text-xs text-zinc-400 font-mono-tech">Bay #4 Hydraulic Hoist & 40-Point Inspection</span>
                        </td>
                        <td className="p-3 text-center font-mono-tech">1</td>
                        <td className="p-3 text-right font-mono-tech font-bold text-white">₹699</td>
                      </tr>
                      {extraPartApproved && (
                        <tr>
                          <td className="p-3">
                            <span className="font-bold text-amber-300">Front Brake Pad Wear Sensor Replacement</span>
                            <span className="block text-xs text-zinc-400 font-mono-tech">Brembo OEM Spec #34356792571</span>
                          </td>
                          <td className="p-3 text-center font-mono-tech">1</td>
                          <td className="p-3 text-right font-mono-tech font-bold text-amber-300">₹1,250</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center bg-[#1A202A] p-4 rounded-2xl border border-[#2C3440] font-mono-tech">
                  <span className="font-bold text-white text-sm">TOTAL AMOUNT PAID (INCL. 18% GST):</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-amber-300">
                    ₹{(extraPartApproved ? 4749 : 3499).toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      haptics.mediumSuccess();
                      alert('GST Invoice PDF downloaded.');
                    }}
                    className="flex-1 rounded-2xl bg-amber-600 hover:bg-amber-500 py-3.5 text-sm font-bold text-white shadow-lg min-h-[46px] flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PDF Invoice</span>
                  </button>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="rounded-2xl bg-[#252D3B] hover:bg-[#323D4E] px-6 py-3.5 text-sm font-bold text-zinc-200 min-h-[46px]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB 1: FLEET VEHICLES ----------------- */}
      {activeTab === 'vehicles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {vehicles.map((veh) => {
              const isSelected = selectedVehicleId === veh.id;
              return (
                <div
                  key={veh.id}
                  id={`vehicle-card-${veh.id}`}
                  onClick={() => {
                    haptics.lightTap();
                    setSelectedVehicleId(veh.id);
                  }}
                  className={`cursor-pointer overflow-hidden rounded-3xl border transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-[#14181F] shadow-2xl ring-1 ring-amber-400/50'
                      : 'border-[#2C3440] bg-[#14181F] hover:border-[#434F61]'
                  }`}
                >
                  <div className="relative h-48 w-full bg-[#0E1116]">
                    <img
                      src={veh.imageUrl}
                      alt={veh.model}
                      className="h-full w-full object-cover"
                    />
                    <span
                      className={`absolute top-3.5 right-3.5 rounded-xl px-3 py-1 text-xs font-bold ${
                        veh.healthStatus === 'warning'
                          ? 'bg-red-500/90 text-white border border-red-400/40'
                          : 'bg-emerald-500/90 text-zinc-950'
                      }`}
                    >
                      {veh.healthStatus === 'warning' ? '2 DTCs Logged' : 'Healthy'}
                    </span>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono-tech">
                        {veh.year} {veh.make}
                      </span>
                      <h3 className="font-display text-lg font-bold text-white mt-0.5">{veh.model}</h3>
                      <p className="font-mono-tech text-xs text-zinc-300 mt-1">VIN: {veh.vin}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-y border-[#2C3440] py-3 text-xs">
                      <div>
                        <span className="text-xs text-zinc-300 uppercase font-mono-tech">Mileage</span>
                        <p className="font-mono-tech text-sm font-bold text-white mt-0.5">{veh.mileage.toLocaleString()} mi</p>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-300 uppercase font-mono-tech">AI Mod Builds</span>
                        <p className="font-mono-tech text-sm font-bold text-amber-300 mt-0.5">{veh.modsCount} Saved</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          haptics.lightTap();
                          onNavigateToDiagnostics();
                        }}
                        className="flex-1 rounded-xl bg-[#1A202A] border border-[#3A4556] py-3 text-xs sm:text-sm font-bold text-zinc-100 hover:bg-[#252D3B] hover:text-white transition-colors min-h-[44px]"
                      >
                        Run Scan
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          haptics.lightTap();
                          onNavigateToCustomizer();
                        }}
                        className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-500 py-3 text-xs sm:text-sm font-bold text-white transition-colors shadow-md min-h-[44px]"
                      >
                        AI Studio
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Vehicle to Garage Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-display text-base sm:text-lg font-bold text-white">
                  MULTI-VEHICLE CLOUD FLEET
                </h4>
                {!user.isPro && (
                  <span className="flex items-center gap-1 rounded-md bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-xs font-bold text-cyan-300 font-mono-tech">
                    <Lock className="h-3 w-3" /> PRO ONLY
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 mt-1 font-normal">
                {user.isPro
                  ? 'Store and synchronize unlimited vehicles, maintenance logs, and AI mod builds across devices.'
                  : 'Free accounts include 1 active vehicle slot. Upgrade to CarAI Pro ($79/yr) for unlimited garage slots and cloud backup.'}
              </p>
            </div>

            <button
              onClick={() => {
                haptics.lightTap();
                if (!user.isPro) {
                  onOpenPaywall({
                    trigger: 'garage_multi_vehicle',
                    featureTitle: 'Unlimited Multi-Vehicle Garage',
                    description: 'Upgrade to CarAI Pro to add unlimited vehicles to your digital fleet.',
                  });
                } else {
                  setActiveTab('vin_decoder');
                }
              }}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95 shrink-0 min-h-[46px] ${
                user.isPro
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-600/30'
              }`}
            >
              {user.isPro ? (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add Vehicle by VIN</span>
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 fill-current" />
                  <span>Unlock Unlimited Fleet ($79/yr)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: MAINTENANCE SERVICE LEDGER ----------------- */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 shadow-lg">
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                SERVICE & MAINTENANCE HISTORY: {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
              </h3>
              <p className="text-sm text-zinc-200 mt-1 font-normal">
                Log scheduled intervals, fluid flushes, tire rotations, and repair receipts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  haptics.lightTap();
                  if (!user.isPro) {
                    onOpenPaywall({
                      trigger: 'garage_multi_vehicle',
                      featureTitle: 'Export PDF Maintenance Ledger Vault',
                      description: 'Exporting formatted service books and resale proof reports is exclusive to CarAI Pro members.',
                    });
                  } else {
                    haptics.mediumSuccess();
                    alert('Service records exported to PDF ledger.');
                  }
                }}
                className="flex items-center gap-2 rounded-2xl border border-[#363E4C] bg-[#1A202A] hover:border-cyan-500 hover:text-cyan-300 px-4 py-3 text-xs sm:text-sm font-bold text-zinc-200 transition-all min-h-[48px]"
              >
                <Download className="h-4 w-4" />
                <span>Export Service Vault (PDF)</span>
              </button>
              <button
                id="add-maintenance-btn"
                onClick={() => {
                  haptics.lightTap();
                  setIsAddingLog(!isAddingLog);
                }}
                className="flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-amber-500 transition-all min-h-[48px]"
              >
                {isAddingLog ? <X className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
                <span>{isAddingLog ? 'Cancel' : 'Log Service Event'}</span>
              </button>
            </div>
          </div>

          {/* Add Service Modal/Drawer */}
          {isAddingLog && (
            <form
              onSubmit={handleAddLog}
              className="rounded-3xl border border-[#2C3440] bg-[#1A202A] p-6 sm:p-8 space-y-5 shadow-2xl"
            >
              <h4 className="font-display text-base font-bold text-white uppercase tracking-wider">
                Record Maintenance Entry
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-bold text-zinc-200">Service Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engine Oil & OEM Filter"
                    value={newLogItem}
                    onChange={(e) => setNewLogItem(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none min-h-[48px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-200">Category</label>
                  <select
                    value={newLogCategory}
                    onChange={(e) => setNewLogCategory(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none min-h-[48px]"
                  >
                    <option value="Oil & Filters">Oil & Filters</option>
                    <option value="Tires & Brakes">Tires & Brakes</option>
                    <option value="Fluids">Fluids & Cooling</option>
                    <option value="Engine & Transmission">Engine & Transmission</option>
                    <option value="Diagnostics & Sensors">Diagnostics & Sensors</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-200">Odometer Mileage</label>
                  <input
                    type="number"
                    value={newLogMileage}
                    onChange={(e) => setNewLogMileage(Number(e.target.value))}
                    className="mt-2 w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none font-mono-tech min-h-[48px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-zinc-200">Cost ($ USD)</label>
                  <input
                    type="number"
                    value={newLogCost}
                    onChange={(e) => setNewLogCost(Number(e.target.value))}
                    className="mt-2 w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none font-mono-tech min-h-[48px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-200">Date Completed</label>
                  <input
                    type="date"
                    value={newLogDate}
                    onChange={(e) => setNewLogDate(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none min-h-[48px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-zinc-200">Technician / Parts Notes</label>
                <input
                  type="text"
                  placeholder="e.g. 7.0L 0W-30 synthetic, verified drain plug torque 25 Nm"
                  value={newLogNote}
                  onChange={(e) => setNewLogNote(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#2C3440] bg-[#0E1116] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none min-h-[48px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingLog(false)}
                  className="rounded-xl bg-[#252D3B] px-5 py-2.5 text-sm font-bold text-zinc-200 hover:bg-[#323D4E] min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-amber-500 min-h-[44px]"
                >
                  Save to Vehicle Ledger
                </button>
              </div>
            </form>
          )}

          {/* Maintenance Table */}
          <div className="overflow-hidden rounded-3xl border border-[#2C3440] bg-[#14181F] shadow-xl">
            <table className="w-full text-left text-sm text-zinc-200">
              <thead className="border-b border-[#2C3440] bg-[#1A202A] font-bold uppercase tracking-wider text-zinc-300">
                <tr>
                  <th className="px-5 py-4">Service Item</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Mileage</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Cost</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C3440]">
                {maintenanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1A202A]/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-white">
                      <div>{log.item}</div>
                      {log.note && <div className="text-xs text-zinc-300 font-normal mt-0.5">{log.note}</div>}
                    </td>
                    <td className="px-5 py-4 text-zinc-200">{log.category}</td>
                    <td className="px-5 py-4 font-mono-tech text-zinc-100">{log.mileage.toLocaleString()} mi</td>
                    <td className="px-5 py-4 text-zinc-300">{log.date}</td>
                    <td className="px-5 py-4 font-mono-tech text-amber-300 font-bold">{log.cost ? `$${log.cost}` : '—'}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-xl px-3 py-1 text-xs font-bold ${
                          log.status === 'completed'
                            ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/40'
                            : 'bg-amber-500/25 text-amber-200 border border-amber-500/40'
                        }`}
                      >
                        {log.status === 'completed' ? 'Completed' : 'Due Soon'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-zinc-400 hover:text-red-400 transition-colors p-2 rounded-lg"
                        title="Delete Entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- TAB 3: VIN & LICENSE PLATE DECODER ----------------- */}
      {activeTab === 'vin_decoder' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 sm:p-8 shadow-xl">
            <h3 className="font-display text-xl font-bold text-white tracking-wide">
              NHTSA VIN & HARDWARE SPECIFICATION DECODER
            </h3>
            <p className="text-sm text-zinc-200 mt-1 max-w-3xl leading-relaxed font-normal">
              Decode full 17-digit VIN serials to extract OEM engine family, factory trim, horsepower rating, and drivetrain configuration.
            </p>

            <form onSubmit={handleDecodeVin} className="mt-5 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={vinQuery}
                onChange={(e) => setVinQuery(e.target.value)}
                placeholder="Enter 17-character VIN (e.g. WBA33AY08PFS18294)"
                className="flex-1 rounded-2xl border border-[#2C3440] bg-[#0E1116] px-5 py-3.5 text-sm font-mono-tech font-bold text-white uppercase placeholder-zinc-500 focus:border-amber-400 focus:outline-none min-h-[48px]"
              />
              <button
                type="submit"
                disabled={isDecoding}
                className="flex items-center justify-center gap-2.5 rounded-2xl bg-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-amber-500 transition-all active:scale-95 disabled:opacity-50 min-h-[48px]"
              >
                <Search className="h-5 w-5" />
                <span>{isDecoding ? 'Decoding Spec...' : 'Decode Specification'}</span>
              </button>
            </form>

            {decodedVinResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-2xl border border-[#2C3440] bg-[#1A202A] p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2C3440] pb-4">
                  <div>
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-widest font-mono-tech">
                      CONFIRMED VEHICLE MATCH
                    </span>
                    <h4 className="font-display text-xl font-bold text-white mt-1">
                      {decodedVinResult.year} {decodedVinResult.make} {decodedVinResult.model}
                    </h4>
                  </div>
                  <button
                    onClick={handleAddDecodedVehicleToFleet}
                    className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-amber-500 transition-all shadow-md min-h-[40px]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to My Garage</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="rounded-xl bg-[#14181F] border border-[#2C3440] p-4">
                    <span className="text-zinc-300 font-mono-tech text-xs uppercase">Engine Family</span>
                    <p className="font-bold text-white mt-1">{decodedVinResult.engine}</p>
                  </div>
                  <div className="rounded-xl bg-[#14181F] border border-[#2C3440] p-4">
                    <span className="text-zinc-300 font-mono-tech text-xs uppercase">Trim Package</span>
                    <p className="font-bold text-white mt-1">{decodedVinResult.trim}</p>
                  </div>
                  <div className="rounded-xl bg-[#14181F] border border-[#2C3440] p-4">
                    <span className="text-zinc-300 font-mono-tech text-xs uppercase">Body Architecture</span>
                    <p className="font-bold text-white mt-1">{decodedVinResult.bodyType}</p>
                  </div>
                  <div className="rounded-xl bg-[#14181F] border border-[#2C3440] p-4">
                    <span className="text-zinc-300 font-mono-tech text-xs uppercase">Fuel Requirement</span>
                    <p className="font-bold text-white mt-1">{decodedVinResult.fuelType}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 4: REFERRAL PROGRAM & GROWTH SYSTEM ----------------- */}
      {activeTab === 'referrals' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#2C3440] bg-[#14181F] p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <div className="flex items-center gap-2.5">
                <Gift className="h-6 w-6 text-amber-400" />
                <h3 className="font-display text-xl font-bold text-white tracking-wide">
                  DRIVER REFERRAL PROGRAM (VERIFIED OBD HANDSHAKE)
                </h3>
              </div>
              <p className="text-sm text-zinc-200 mt-2 max-w-3xl leading-relaxed font-normal">
                Give your automotive enthusiast friends access to CarAI. Whenever a referred driver plugs in their OBD-II adapter and establishes verified telemetry, you earn +1 Free Custom AI Render bonus credit.
              </p>
            </div>

            {/* Referral Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="rounded-2xl border border-[#2C3440] bg-[#1A202A] p-5 text-center">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Total Invited</span>
                <p className="font-mono-tech text-3xl font-bold text-white mt-2">
                  {referralInfo?.totalReferred || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-[#2C3440] bg-[#1A202A] p-5 text-center">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">OBD Connected (Qualified)</span>
                <p className="font-mono-tech text-3xl font-bold text-emerald-400 mt-2">
                  {referralInfo?.qualifiedCount || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-[#2C3440] bg-[#1A202A] p-5 text-center">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Bonus Renders Earned</span>
                <p className="font-mono-tech text-3xl font-bold text-amber-300 mt-2">
                  +{referralInfo?.bonusRendersEarned || 0}
                </p>
              </div>
            </div>

            {/* Shareable Link Strip */}
            <div className="rounded-2xl border border-[#2C3440] bg-[#0E1116] p-5 space-y-3">
              <label className="text-sm font-bold text-zinc-200 uppercase tracking-wide">
                Your Unique Invite Link:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={referralInfo?.referralLink || 'https://carai.app/invite?ref=CARAI-DEMO'}
                  className="flex-1 rounded-2xl border border-[#2C3440] bg-[#14181F] px-4 py-3.5 text-sm font-mono-tech text-amber-300 focus:outline-none min-h-[48px]"
                />
                <button
                  id="copy-referral-link-btn"
                  onClick={handleCopyReferralLink}
                  className="flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-3.5 text-sm font-bold text-white shadow-md hover:bg-amber-500 transition-all min-h-[48px]"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Simulation & Anti-Fraud Proof Controls */}
            <div className="rounded-2xl border border-[#2C3440] bg-[#1A202A] p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                  Live Referral Lifecycle & Anti-Fraud Security Simulator
                </h4>
              </div>

              <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={testUserEmail}
                  onChange={(e) => setTestUserEmail(e.target.value)}
                  placeholder="Enter referred driver identifier"
                  className="flex-1 rounded-2xl border border-[#2C3440] bg-[#14181F] px-4 py-3 text-sm text-white focus:outline-none min-h-[48px]"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-[#252D3B] border border-[#3A4556] px-5 py-3 text-sm font-bold text-white hover:bg-[#323D4E] min-h-[48px]"
                >
                  1. Register Invite
                </button>
                <button
                  type="button"
                  onClick={handleSimulateReferredObdConnect}
                  className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 shadow-md min-h-[48px]"
                >
                  2. Simulate Friend OBD Connect
                </button>
              </form>

              {inviteStatusMsg && (
                <p className="text-sm font-mono-tech text-amber-300 bg-[#14181F] p-3.5 rounded-2xl border border-[#2C3440]">
                  {inviteStatusMsg}
                </p>
              )}

              {/* Adversarial Test Button */}
              <div className="border-t border-[#2C3440] pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-bold text-red-300 flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5" /> Adversarial Self-Test: Fake Client-Claimed Referral
                    </h5>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Attempts to grant a referral reward directly from client state without verified server OBD connection proof.
                    </p>
                  </div>
                  <button
                    onClick={handleRunAdversarialTest}
                    className="rounded-xl bg-red-950/90 border border-red-700/80 px-4 py-2.5 text-xs sm:text-sm font-bold text-red-200 hover:bg-red-900 transition-colors min-h-[40px]"
                  >
                    Run Anti-Fraud Audit
                  </button>
                </div>

                {adversarialTestResult && (
                  <div className="mt-3 rounded-2xl bg-[#14181F] border border-red-900/50 p-4 text-xs sm:text-sm font-mono-tech">
                    <span className="font-bold text-red-300">
                      [SERVER ENFORCEMENT AUDIT RESULT]: {adversarialTestResult.granted ? 'FAIL' : 'BLOCKED & REJECTED'}
                    </span>
                    <p className="text-zinc-200 mt-1">{adversarialTestResult.reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
