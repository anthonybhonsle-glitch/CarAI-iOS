import { FreezeFrameData, OBDTelemetry, ReadinessMonitor } from '../types';

export type DrivingProfile =
  | 'idle_warmup'
  | 'city_cruise'
  | 'highway_pull'
  | 'fault_condition'
  | 'engine_overheat'
  | 'dyno_sweep'
  | 'track_wot';

export interface TerminalLogEntry {
  id: string;
  timestamp: string;
  type: 'tx' | 'rx' | 'system';
  content: string;
}

export class OBDConnectionManager {
  private isConnected: boolean = false;
  private isBluetoothHardware: boolean = false;
  private bluetoothDevice: any = null;
  private activeProfile: DrivingProfile = 'highway_pull';
  private tickCount: number = 0;
  private milActive: boolean = true;
  private activeDTCs: string[] = ['P0101', 'P0300'];
  private subscribers: ((data: OBDTelemetry) => void)[] = [];
  private terminalSubscribers: ((log: TerminalLogEntry) => void)[] = [];
  private timer: any = null;

  // Initial realistic telemetry state
  private ambientConfig: { enabled: boolean; colorHex: string; colorName: string; brightnessPercent: number; mode: 'static' | 'dynamic_rpm' | 'thermal_sync' | 'music_pulse' } = {
    enabled: true,
    colorHex: '#00F0FF',
    colorName: 'Cyber Cyan',
    brightnessPercent: 85,
    mode: 'dynamic_rpm',
  };

  private telemetry: OBDTelemetry = {
    rpm: 2150,
    speedKmh: 74,
    speedMph: 46,
    coolantTempC: 89,
    coolantTempF: 192,
    oilTempC: 94,
    oilTempF: 201,
    transTempC: 82,
    transTempF: 180,
    cylinderHeadTempC: 96,
    intakeTempC: 28,
    throttlePosPercent: 24,
    engineLoadPercent: 38,
    boostPressurePsi: 4.2,
    mapPressureKpa: 130,
    shortFuelTrimPercent: 1.6,
    longFuelTrimPercent: -2.3,
    batteryVoltage: 14.1,
    batteryHealthPercent: 96,
    mafFlowGps: 18.4,
    timingAdvanceDeg: 14.5,
    fuelLevelPercent: 68,
    milStatus: true,
    dtcCount: 2,
    ambientTempC: 22,
    fuelPressureKpa: 350,
    protocolName: 'ISO 15765-4 CAN (11 bit, 500 kbaud)',
    lastUpdated: new Date().toISOString(),
    // In-car advanced metrics
    ureaLevelPercent: 78,
    ureaRangeKm: 8450,
    dpfSootPercent: 32,
    tpms: {
      fl: 34.2,
      fr: 34.4,
      rl: 35.1,
      rr: 35.0,
      flTempC: 38,
      frTempC: 39,
      rlTempC: 41,
      rrTempC: 41,
      unit: 'PSI',
      status: 'normal',
    },
    cabinAirQualityAqi: 12,
    cabinFilterHealthPercent: 88,
    exteriorAirQualityAqi: 58,
    evBatterySocPercent: 91,
    carHeadUnitConnected: true,
    carHeadUnitProtocol: 'Android Automotive OS (AAOS)',
    ambientLighting: {
      enabled: true,
      colorHex: '#00F0FF',
      colorName: 'Cyber Cyan',
      brightnessPercent: 85,
      mode: 'dynamic_rpm',
    },
  };

  constructor() {
    this.startSimulationLoop();
  }

  public subscribe(cb: (data: OBDTelemetry) => void): () => void {
    this.subscribers.push(cb);
    cb(this.telemetry);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  public subscribeTerminal(cb: (log: TerminalLogEntry) => void): () => void {
    this.terminalSubscribers.push(cb);
    return () => {
      this.terminalSubscribers = this.terminalSubscribers.filter((s) => s !== cb);
    };
  }

  public getTelemetry(): OBDTelemetry {
    return { ...this.telemetry };
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public getIsHardware(): boolean {
    return this.isBluetoothHardware;
  }

  public getActiveProfile(): DrivingProfile {
    return this.activeProfile;
  }

  public setDrivingProfile(profile: DrivingProfile) {
    this.activeProfile = profile;
    this.logTerminal('system', `Switched OBD-II simulator profile to: ${profile}`);
  }

  public getActiveDTCs(): string[] {
    return [...this.activeDTCs];
  }

  public clearDTCs(): { success: boolean; message: string } {
    this.activeDTCs = [];
    this.milActive = false;
    this.telemetry.milStatus = false;
    this.telemetry.dtcCount = 0;
    this.logTerminal('tx', '04');
    this.logTerminal('rx', '44 OK (DTCs and Freeze Frame cleared)');
    this.notifySubscribers();
    return { success: true, message: 'Check Engine Light (MIL) reset and ECU diagnostic trouble codes cleared.' };
  }

  public injectDTC(code: string) {
    if (!this.activeDTCs.includes(code)) {
      this.activeDTCs.push(code);
      this.milActive = true;
      this.telemetry.milStatus = true;
      this.telemetry.dtcCount = this.activeDTCs.length;
      this.logTerminal('system', `MIL Trigger: Injected trouble code ${code}`);
      this.notifySubscribers();
    }
  }

  public async connectVirtualDongle(dongleName: string = 'CarAI Virtual ELM327 BLE (v2.1)'): Promise<boolean> {
    this.isConnected = true;
    this.isBluetoothHardware = false;
    this.logTerminal('system', `Connecting to ${dongleName}...`);
    this.logTerminal('tx', 'ATZ');
    this.logTerminal('rx', 'ELM327 v2.1 OBDII to RS232 Interpreter');
    this.logTerminal('tx', 'ATE0');
    this.logTerminal('rx', 'OK');
    this.logTerminal('tx', 'ATSP0');
    this.logTerminal('rx', 'SEARCHING... OK (ISO 15765-4 CAN 11/500)');
    this.logTerminal('tx', '0100');
    this.logTerminal('rx', '41 00 BE 3E B8 11');
    this.notifySubscribers();
    return true;
  }

  public async connectWebBluetooth(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
      return {
        success: false,
        error: 'Web Bluetooth is not supported in this browser environment. Using high-fidelity virtual simulator.',
      };
    }

    try {
      this.logTerminal('system', 'Requesting Web Bluetooth device...');
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '0000fff0-0000-1000-8000-00805f9b34fb',
          '000018f0-0000-1000-8000-00805f9b34fb',
          '0000ffe0-0000-1000-8000-00805f9b34fb',
        ],
      });

      this.bluetoothDevice = device;
      this.isConnected = true;
      this.isBluetoothHardware = true;
      this.logTerminal('system', `Connected to hardware device: ${device.name || 'Generic ELM327'}`);
      return { success: true, deviceName: device.name || 'Generic ELM327 Adapter' };
    } catch (err: any) {
      this.logTerminal('system', `Bluetooth pairing skipped or failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  public disconnect() {
    this.isConnected = false;
    this.isBluetoothHardware = false;
    this.bluetoothDevice = null;
    this.logTerminal('system', 'OBD-II Bluetooth adapter disconnected.');
    this.notifySubscribers();
  }

  public executeCustomATCommand(cmd: string): string {
    const clean = cmd.trim().toUpperCase();
    this.logTerminal('tx', clean);

    let response = 'NO DATA';

    if (clean === 'ATZ') {
      response = 'ELM327 v2.1';
    } else if (clean.startsWith('AT')) {
      response = 'OK';
    } else if (clean === '0100') {
      response = '41 00 BE 3E B8 11';
    } else if (clean === '010C') {
      // RPM
      const rpmHex = Math.round(this.telemetry.rpm * 4).toString(16).padStart(4, '0');
      response = `41 0C ${rpmHex.slice(0, 2)} ${rpmHex.slice(2, 4)}`;
    } else if (clean === '010D') {
      // Speed kmh
      const speedHex = Math.round(this.telemetry.speedKmh).toString(16).padStart(2, '0');
      response = `41 0D ${speedHex}`;
    } else if (clean === '0105') {
      // Coolant temp (value = temp + 40)
      const coolantHex = Math.round(this.telemetry.coolantTempC + 40).toString(16).padStart(2, '0');
      response = `41 05 ${coolantHex}`;
    } else if (clean === '0111') {
      // Throttle % (value = percent * 255 / 100)
      const throttleHex = Math.round((this.telemetry.throttlePosPercent * 255) / 100).toString(16).padStart(2, '0');
      response = `41 11 ${throttleHex}`;
    } else if (clean === '03') {
      // Read DTCs
      if (this.activeDTCs.length === 0) {
        response = '43 00 00 00 00 00 00 (NO CODES STORED)';
      } else {
        response = `43 0${this.activeDTCs.length} ` + this.activeDTCs.map((c) => c.replace('P', '0')).join(' ');
      }
    } else if (clean === '04') {
      this.clearDTCs();
      response = '44 OK';
    } else if (clean === '07') {
      response = '47 00 (NO PENDING CODES)';
    }

    this.logTerminal('rx', response);
    return response;
  }

  public getFreezeFrame(): FreezeFrameData {
    return {
      dtc: this.activeDTCs[0] || 'P0101',
      rpm: 2480,
      speedKmh: 68,
      coolantTempC: 91,
      engineLoadPercent: 54,
      fuelSystemStatus: 'Closed Loop (Using O2 feedback)',
      shortTrim: 3.1,
      longTrim: 18.8,
      calculatedLoad: 58.4,
      barometricPressureKpa: 101.3,
    };
  }

  public getReadinessMonitors(): ReadinessMonitor[] {
    const hasCodes = this.activeDTCs.length > 0;
    return [
      { id: 'misfire', name: 'Misfire Monitor', category: 'Continuous', status: 'READY', description: 'Monitors crankshaft acceleration irregularities' },
      { id: 'fuel_sys', name: 'Fuel System Monitor', category: 'Continuous', status: 'READY', description: 'Monitors fuel trim feedback loop' },
      { id: 'comp_comp', name: 'Comprehensive Components', category: 'Continuous', status: 'READY', description: 'Monitors all major sensors and circuit voltages' },
      { id: 'catalyst', name: 'Catalyst Monitor (Bank 1/2)', category: 'Non-Continuous', status: hasCodes ? 'NOT_READY' : 'READY', description: 'Pre vs post-cat O2 switching efficiency' },
      { id: 'evap', name: 'EVAP System Monitor', category: 'Non-Continuous', status: hasCodes ? 'NOT_READY' : 'READY', description: 'Fuel tank vapor containment and purge rate' },
      { id: 'o2_sensor', name: 'Oxygen Sensor Monitor', category: 'Non-Continuous', status: 'READY', description: 'O2 sensor response time and heating circuit' },
      { id: 'o2_heater', name: 'Oxygen Sensor Heater', category: 'Non-Continuous', status: 'READY', description: 'Heater element internal resistance' },
      { id: 'egr_vvt', name: 'EGR / VVT Variable Valve', category: 'Non-Continuous', status: 'READY', description: 'Camshaft phase angle and exhaust gas recirculation' },
    ];
  }

  private startSimulationLoop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.tickCount++;
      const t = this.tickCount * 0.1;

      let targetRpm = 2000;
      let targetSpeed = 65;
      let targetThrottle = 25;
      let targetBoost = 2.0;
      let targetCoolant = 90;
      let targetLoad = 35;

      switch (this.activeProfile) {
        case 'idle_warmup':
          targetRpm = 750 + Math.sin(t * 1.5) * 25;
          targetSpeed = 0;
          targetThrottle = 12;
          targetBoost = -9.5; // Engine vacuum in inHg/psi
          targetCoolant = Math.min(88, 55 + (this.tickCount % 60) * 0.6);
          targetLoad = 18;
          break;

        case 'city_cruise':
          targetRpm = 1800 + Math.sin(t * 0.8) * 450;
          targetSpeed = Math.max(0, 45 + Math.sin(t * 0.8) * 18);
          targetThrottle = 22 + Math.sin(t * 0.8) * 12;
          targetBoost = -2.0 + Math.max(0, Math.sin(t * 0.8) * 4.5);
          targetCoolant = 91;
          targetLoad = 38 + Math.sin(t * 0.8) * 15;
          break;

        case 'highway_pull':
          targetRpm = 2300 + Math.sin(t * 0.5) * 600;
          targetSpeed = 105 + Math.sin(t * 0.5) * 15;
          targetThrottle = 35 + Math.sin(t * 0.5) * 10;
          targetBoost = 4.5 + Math.sin(t * 0.5) * 3.0;
          targetCoolant = 89;
          targetLoad = 45 + Math.sin(t * 0.5) * 12;
          break;

        case 'track_wot':
        case 'dyno_sweep':
          const dynoCycle = (this.tickCount % 50) / 50;
          targetRpm = 2500 + dynoCycle * 4500; // 2500 -> 7000 RPM
          targetSpeed = 40 + dynoCycle * 140; // 40 -> 180 km/h
          targetThrottle = 95 + Math.random() * 5;
          targetBoost = 16.5 + Math.sin(t * 2) * 1.5;
          targetCoolant = 96;
          targetLoad = 92;
          break;

        case 'fault_condition':
          targetRpm = 1600 + (this.tickCount % 2 === 0 ? 120 : -90);
          targetSpeed = 50 + Math.sin(t * 0.4) * 10;
          targetThrottle = 28;
          targetBoost = 0.5;
          targetCoolant = 93;
          targetLoad = 62;
          this.milActive = true;
          break;

        case 'engine_overheat':
          targetRpm = 1900;
          targetSpeed = 40;
          targetThrottle = 18;
          targetBoost = -3.0;
          targetCoolant = Math.min(124, 102 + (this.tickCount % 30) * 0.8);
          targetLoad = 50;
          break;
      }

      // Smooth telemetry updates
      const speedMph = Math.round(targetSpeed * 0.621371);
      const coolantTempF = Math.round((targetCoolant * 9) / 5 + 32);

      // Dynamic ambient lighting color when in dynamic_rpm mode
      let activeAmbientHex = this.ambientConfig.colorHex;
      if (this.ambientConfig.mode === 'dynamic_rpm') {
        if (targetRpm > 5500) activeAmbientHex = '#EF4444'; // Redline glow
        else if (targetRpm > 3800) activeAmbientHex = '#F59E0B'; // Amber power band
        else activeAmbientHex = '#00F0FF'; // Cyber cyan
      } else if (this.ambientConfig.mode === 'thermal_sync') {
        if (targetCoolant > 105) activeAmbientHex = '#EF4444';
        else if (targetCoolant > 95) activeAmbientHex = '#F97316';
        else activeAmbientHex = '#10B981';
      }

      const oilTempC = Math.round(targetCoolant + 6);
      const oilTempF = Math.round((oilTempC * 9) / 5 + 32);
      const transTempC = Math.round(targetCoolant - 8 + (targetLoad / 10));
      const transTempF = Math.round((transTempC * 9) / 5 + 32);
      const cylinderHeadTempC = Math.round(targetCoolant + 8);

      this.telemetry = {
        rpm: Math.round(targetRpm),
        speedKmh: Math.round(targetSpeed),
        speedMph,
        coolantTempC: Math.round(targetCoolant),
        coolantTempF,
        oilTempC,
        oilTempF,
        transTempC,
        transTempF,
        cylinderHeadTempC,
        intakeTempC: Math.round(24 + Math.sin(t * 0.2) * 4),
        throttlePosPercent: Math.round(targetThrottle),
        engineLoadPercent: Math.round(targetLoad),
        boostPressurePsi: parseFloat(targetBoost.toFixed(1)),
        mapPressureKpa: Math.round(101.3 + targetBoost * 6.89),
        shortFuelTrimPercent: parseFloat((Math.sin(t * 2) * 3.5).toFixed(1)),
        longFuelTrimPercent: this.activeDTCs.includes('P0101') ? 14.8 : -1.5,
        batteryVoltage: parseFloat((14.1 + Math.sin(t * 0.3) * 0.2).toFixed(1)),
        batteryHealthPercent: 96,
        mafFlowGps: parseFloat((targetRpm * 0.008 * (targetThrottle / 40)).toFixed(1)),
        timingAdvanceDeg: parseFloat((28 - targetLoad * 0.25).toFixed(1)),
        fuelLevelPercent: 64,
        milStatus: this.milActive,
        dtcCount: this.activeDTCs.length,
        ambientTempC: 21,
        fuelPressureKpa: Math.round(380 + Math.sin(t) * 20),
        protocolName: 'ISO 15765-4 CAN (11 bit, 500 kbaud)',
        lastUpdated: new Date().toISOString(),
        // Real-time In-Car Diagnostics
        ureaLevelPercent: 78,
        ureaRangeKm: 8450,
        dpfSootPercent: 32,
        tpms: {
          fl: parseFloat((34.2 + Math.sin(t * 0.1) * 0.2).toFixed(1)),
          fr: parseFloat((34.4 + Math.cos(t * 0.1) * 0.2).toFixed(1)),
          rl: parseFloat((35.1 + Math.sin(t * 0.1) * 0.2).toFixed(1)),
          rr: parseFloat((35.0 + Math.cos(t * 0.1) * 0.2).toFixed(1)),
          flTempC: Math.round(38 + (targetSpeed / 30)),
          frTempC: Math.round(39 + (targetSpeed / 30)),
          rlTempC: Math.round(40 + (targetSpeed / 30)),
          rrTempC: Math.round(41 + (targetSpeed / 30)),
          unit: 'PSI',
          status: 'normal',
        },
        cabinAirQualityAqi: Math.max(8, Math.round(12 + Math.sin(t * 0.05) * 3)),
        cabinFilterHealthPercent: 88,
        exteriorAirQualityAqi: Math.round(58 + Math.sin(t * 0.05) * 6),
        evBatterySocPercent: 91,
        carHeadUnitConnected: true,
        carHeadUnitProtocol: 'Android Automotive OS (AAOS)',
        ambientLighting: {
          ...this.ambientConfig,
          colorHex: activeAmbientHex,
        },
      };

      this.notifySubscribers();
    }, 200); // 5Hz smooth gauge update loop
  }

  public setAmbientLighting(config: Partial<{ enabled: boolean; colorHex: string; colorName: string; brightnessPercent: number; mode: 'static' | 'dynamic_rpm' | 'thermal_sync' | 'music_pulse' }>) {
    this.ambientConfig = {
      ...this.ambientConfig,
      ...config,
    };
    this.telemetry.ambientLighting = {
      ...this.telemetry.ambientLighting!,
      ...this.ambientConfig,
    };
    this.logTerminal('tx', `CAN-BUS 0x62F: Ambient lighting set to ${this.ambientConfig.colorName} (${this.ambientConfig.colorHex}) Mode: ${this.ambientConfig.mode}`);
    this.notifySubscribers();
  }

  public setHeadUnitProtocol(protocol: 'Android Automotive OS (AAOS)' | 'Android Auto' | 'Apple CarPlay' | 'Native In-Dash Browser' | 'Bluetooth CAN Bridge') {
    this.telemetry.carHeadUnitProtocol = protocol;
    this.logTerminal('system', `Head Unit connection switched to: ${protocol}`);
    this.notifySubscribers();
  }

  private logTerminal(type: 'tx' | 'rx' | 'system', content: string) {
    const entry: TerminalLogEntry = {
      id: `term_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      content,
    };
    this.terminalSubscribers.forEach((cb) => cb(entry));
  }

  public start(rateHz = 10) {
    this.connectVirtualDongle();
  }

  public stop() {
    this.disconnect();
  }

  private notifySubscribers() {
    this.subscribers.forEach((cb) => cb(this.telemetry));
  }
}

export const obdManager = new OBDConnectionManager();
export const obdSimulator = obdManager;
