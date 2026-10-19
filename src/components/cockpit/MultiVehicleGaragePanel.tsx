import React, { useState } from 'react';
import {
  Car,
  Plus,
  CheckCircle2,
  Lock,
  Sparkles,
  QrCode,
  ShieldCheck,
  ChevronRight,
  Gauge,
  Wrench,
  Fuel,
} from 'lucide-react';
import { OBDTelemetry, UserSubscriptionState, PaywallContext } from '../../types';
import { haptics } from '../../services/haptics';

interface MultiVehicleGaragePanelProps {
  telemetry: OBDTelemetry;
  user: UserSubscriptionState;
  onOpenPaywall: (context?: PaywallContext) => void;
  onOpenPhoneQrModal: () => void;
}

interface GarageVehicle {
  id: string;
  name: string;
  trim: string;
  year: number;
  vin: string;
  odometer: number;
  oilLife: number;
  fuelMpg: number;
  status: 'active' | 'in_garage';
  theme: string;
}

export const MultiVehicleGaragePanel: React.FC<MultiVehicleGaragePanelProps> = ({
  telemetry,
  user,
  onOpenPaywall,
  onOpenPhoneQrModal,
}) => {
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([
    {
      id: 'car-1',
      name: 'Ford F-150',
      trim: '3.5L V6 EcoBoost SuperCrew',
      year: 2021,
      vin: '1FTFW1ED8MFC29481',
      odometer: 82410,
      oilLife: 68,
      fuelMpg: 21.4,
      status: 'active',
      theme: 'Amber Supercar Analog',
    },
    {
      id: 'car-2',
      name: 'Honda Civic',
      trim: '1.5T Touring Sedan',
      year: 2019,
      vin: '19XFC1F72KE019284',
      odometer: 54120,
      oilLife: 85,
      fuelMpg: 34.8,
      status: 'in_garage',
      theme: 'Cyberpunk Neon Track',
    },
    {
      id: 'car-3',
      name: 'BMW 330i xDrive',
      trim: '2.0L Turbo M-Sport',
      year: 2022,
      vin: 'WBA5R1C56NF829103',
      odometer: 31200,
      oilLife: 42,
      fuelMpg: 29.1,
      status: 'in_garage',
      theme: '90s JDM Orange Dial',
    },
  ]);

  const [activeCarId, setActiveCarId] = useState<string>('car-1');
  const isProActive = user.isPro || user.activeTrial;

  const handleSelectCar = (car: GarageVehicle) => {
    haptics.lightTap();
    if (car.id !== 'car-1' && !isProActive) {
      onOpenPaywall({
        trigger: 'multi_vehicle_garage',
        featureTitle: 'Multi-Vehicle Family & Fleet Garage',
        description: 'Auto-detect plugged in cars by VIN and store individual vehicle profiles with CarAI Pro.',
      });
      return;
    }
    setActiveCarId(car.id);
  };

  const handleAddNewCar = () => {
    haptics.lightTap();
    if (!isProActive) {
      onOpenPaywall({
        trigger: 'multi_vehicle_garage',
        featureTitle: 'Add Unlimited Vehicles',
        description: 'Free tier includes 1 car profile. Upgrade to Pro to manage all family cars under one screen.',
      });
      return;
    }
    alert('Scanned OBD-II CAN bus: Auto-detected VIN 5YJ3E1EB9PF192847. Added 2023 Tesla Model 3 to your garage!');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-zinc-900 to-zinc-950 border border-purple-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Car className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Multi-Vehicle Fleet & Family Garage Switcher
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Auto-VIN Plug & Play
                </span>
                {isProActive && (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Family Pro Active
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Automatically detects which vehicle is plugged in by VIN number and instantly loads that vehicle's customized dashboard, maintenance schedule, and DTC history.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddNewCar}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vehicle by VIN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vehicles.map((v) => {
          const isSelected = activeCarId === v.id;
          const isLocked = v.id !== 'car-1' && !isProActive;

          return (
            <div
              key={v.id}
              onClick={() => handleSelectCar(v)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-zinc-900 border-purple-500 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500'
                  : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white">{v.year} {v.name}</span>
                  </div>
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> CURRENT CAR
                    </span>
                  ) : isLocked ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      <Lock className="w-3 h-3" /> Pro Car
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-zinc-400 mt-1">{v.trim}</p>
                <div className="mt-3 text-[11px] font-mono text-zinc-500">
                  VIN: {v.vin}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div>
                  <div className="text-zinc-500 text-[10px]">ODOMETER</div>
                  <div className="text-white font-bold">{v.odometer.toLocaleString()} mi</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px]">OIL LIFE</div>
                  <div className="text-emerald-400 font-bold">{v.oilLife}%</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px]">AVG FUEL</div>
                  <div className="text-cyan-400 font-bold">{v.fuelMpg} MPG</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
