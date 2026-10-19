// src/services/obdConnection.ts
// CarAI Pro — REAL live car data over Web Bluetooth (ELM327 / OBDLink class adapters).
//
// This is the piece that reads the actual car. The user plugs an OBD-II Bluetooth
// adapter into the port under the dash, taps "Connect", and this module talks to
// it: it sends OBD request codes and decodes the replies into OBDTelemetry — the
// same shape the simulator produces, so the whole UI works unchanged.
//
// Requires a Chromium-based browser / Android WebView with Web Bluetooth
// (chrome://flags or a secure https origin). iOS Safari has no Web Bluetooth —
// on iOS use the native Capacitor BLE plugin behind this same interface.
//
// STANDARD vs PER-CAR:
// - Standard OBD-II (works on any car): speed, rpm, coolant, throttle, load,
//   intake temp, MAF, fuel level, fuel trims, battery voltage, DTCs.
// - Per-car (needs the OEM profile) or add-on sensors: TPMS,
//   DEF/AdBlue, DPF, oil/CHT/EGT temps, cabin air. Those are left at
//   "no data" here until a profile fills them; the UI shows them as such.

import {
  OBDTelemetry,
  TPMSWheelData,
  TirePosition,
  AirPurityData,
} from '../types';

type Listener = (t: OBDTelemetry) => void;

const SERVICE_UUIDS: (string | number)[] = [
  0xfff0, // common ELM327 clones
  0xffe0, // HM-10 style
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART (some OBDLink)
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function emptyTpms(): TPMSWheelData[] {
  const pos: TirePosition[] = ['FL', 'FR', 'RL', 'RR'];
  // status 'normal' with placard but 0 pressure signals "no TPMS data on this car yet".
  return pos.map((position) => ({
    fl: 0,
    fr: 0,
    rl: 0,
    rr: 0,
    flTempC: 0,
    frTempC: 0,
    rlTempC: 0,
    rrTempC: 0,
    unit: 'PSI',
    position,
    pressurePsi: 0,
    temperatureC: 0,
    placardPsi: 33,
    leakRatePsiPerMin: 0,
    status: 'normal',
  }));
}

function emptyAir(): AirPurityData {
  return {
    cabinPm25: 0,
    exteriorAqi: 0,
    co2Ppm: 0,
    vocIndex: 0,
    humidityPct: 0,
    filterLifePct: 0,
    recommendation: 'fresh_air',
  };
}

export type ConnState = 'disconnected' | 'connecting' | 'initializing' | 'connected' | 'error';

export class ObdConnection {
  private device: BluetoothDevice | null = null;
  private writeChar: BluetoothRemoteGATTCharacteristic | null = null;
  private notifyChar: BluetoothRemoteGATTCharacteristic | null = null;
  private listeners = new Set<Listener>();
  private stateListeners = new Set<(s: ConnState, msg?: string) => void>();
  private poller: ReturnType<typeof setInterval> | null = null;

  private rxBuffer = '';
  private pending: ((resp: string) => void) | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  private state: ConnState = 'disconnected';

  // last-known values so each tick produces a complete OBDTelemetry
  private last: OBDTelemetry = this.blank();

  private blank(): OBDTelemetry {
    return {
      ts: Date.now(),
      rpm: 0,
      speedKmh: 0,
      speedMph: 0,
      speedKph: 0,
      throttlePosPercent: 0,
      throttlePct: 0,
      engineLoadPercent: 0,
      engineLoadPct: 0,
      gear: 0,
      engineRunning: false,
      cranking: false,
      coolantTempC: 0,
      coolantTempF: 32,
      coolantC: 0,
      oilTempC: 0,
      oilC: 0,
      cylinderHeadC: 0,
      exhaustGasC: 0,
      coolantWarn: false,
      coolantCritical: false,
      intakeTempC: 0,
      boostPressurePsi: 0,
      mapPressureKpa: 0,
      shortFuelTrimPercent: 0,
      longFuelTrimPercent: 0,
      batteryVoltage: 0,
      mafFlowGps: 0,
      timingAdvanceDeg: 0,
      fuelLevelPercent: 0,
      milStatus: false,
      dtcCount: 0,
      ambientTempC: 22,
      fuelPressureKpa: 350,
      protocolName: 'ISO 15765-4 (CAN 11/500)',
      lastUpdated: new Date().toLocaleTimeString(),
      defLevelPct: 0,
      defRangeKm: 0,
      dpfSootPct: 0,
      dpfRegenActive: false,
      tpms: emptyTpms(),
      mafGs: 0,
      fuelLevelPct: 0,
      shortFuelTrimPct: 0,
      longFuelTrimPct: 0,
      air: emptyAir(),
      gLong: 0,
      gLat: 0,
      dtcCodes: [],
      odometerKm: 0,
      isRealCarLive: true,
    };
  }

  // -------------------------------------------------------------------------
  // Subscriptions
  // -------------------------------------------------------------------------
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onState(fn: (s: ConnState, msg?: string) => void): () => void {
    this.stateListeners.add(fn);
    fn(this.state);
    return () => this.stateListeners.delete(fn);
  }

  getState() {
    return this.state;
  }

  private setState(s: ConnState, msg?: string) {
    this.state = s;
    this.stateListeners.forEach((f) => f(s, msg));
  }

  private emit() {
    this.last = { ...this.last, ts: Date.now(), lastUpdated: new Date().toLocaleTimeString() };
    this.listeners.forEach((f) => f(this.last));
  }

  // -------------------------------------------------------------------------
  // Connect
  // -------------------------------------------------------------------------
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect(): Promise<void> {
    if (!this.isSupported()) {
      this.setState('error', 'Web Bluetooth not available in this browser. Use Chrome/Android or the native app.');
      return;
    }
    try {
      this.setState('connecting');
      this.device = await navigator.bluetooth.requestDevice({
        // filter is broad because ELM327 clones advertise many names/services
        acceptAllDevices: true,
        optionalServices: SERVICE_UUIDS as BluetoothServiceUUID[],
      });

      this.device.addEventListener('gattserverdisconnected', () => {
        this.setState('disconnected');
        this.stopPolling();
      });

      const server = await this.device.gatt!.connect();

      // find a service that has both a writable and a notify characteristic
      const services = await server.getPrimaryServices();
      for (const svc of services) {
        const chars = await svc.getCharacteristics();
        for (const c of chars) {
          if ((c.properties.write || c.properties.writeWithoutResponse) && !this.writeChar) this.writeChar = c;
          if ((c.properties.notify || c.properties.indicate) && !this.notifyChar) this.notifyChar = c;
        }
        if (this.writeChar && this.notifyChar) break;
      }

      if (!this.writeChar || !this.notifyChar) {
        this.setState('error', 'Adapter characteristics not found. Is this an OBD-II BLE adapter?');
        return;
      }

      await this.notifyChar.startNotifications();
      this.notifyChar.addEventListener('characteristicvaluechanged', (e: Event) => this.onData(e));

      this.setState('initializing');
      await this.initElm();
      this.setState('connected');
      this.startPolling();
    } catch (err: any) {
      this.setState('error', err?.message ?? 'Connection failed or cancelled.');
    }
  }

  async connectToDevice(device: BluetoothDevice): Promise<void> {
    try {
      this.setState('connecting');
      this.device = device;
      this.device.addEventListener('gattserverdisconnected', () => {
        this.setState('disconnected');
        this.stopPolling();
      });

      const server = await this.device.gatt!.connect();
      const services = await server.getPrimaryServices();
      for (const svc of services) {
        const chars = await svc.getCharacteristics();
        for (const c of chars) {
          if ((c.properties.write || c.properties.writeWithoutResponse) && !this.writeChar) this.writeChar = c;
          if ((c.properties.notify || c.properties.indicate) && !this.notifyChar) this.notifyChar = c;
        }
        if (this.writeChar && this.notifyChar) break;
      }

      if (!this.writeChar || !this.notifyChar) {
        this.setState('error', 'Adapter characteristics not found. Is this an OBD-II BLE adapter?');
        return;
      }

      await this.notifyChar.startNotifications();
      this.notifyChar.addEventListener('characteristicvaluechanged', (e: Event) => this.onData(e));

      this.setState('initializing');
      await this.initElm();
      this.setState('connected');
      this.startPolling();
    } catch (err: any) {
      this.setState('error', err?.message ?? 'Reconnection failed or cancelled.');
    }
  }

  async autoReconnect(): Promise<boolean> {
    if (!this.isSupported() || !(navigator.bluetooth as any)?.getDevices) {
      return false;
    }
    try {
      const devices = await (navigator.bluetooth as any).getDevices();
      if (devices && devices.length > 0) {
        await this.connectToDevice(devices[0]);
        return this.state === 'connected';
      }
    } catch {
      // silent background check
    }
    return false;
  }

  async disconnect(): Promise<void> {
    this.stopPolling();
    try {
      await this.notifyChar?.stopNotifications();
    } catch {
      /* ignore */
    }
    try {
      this.device?.gatt?.disconnect();
    } catch {
      /* ignore */
    }
    this.device = null;
    this.writeChar = null;
    this.notifyChar = null;
    this.setState('disconnected');
  }

  // -------------------------------------------------------------------------
  // Low-level AT/OBD command I/O
  // -------------------------------------------------------------------------
  private onData(e: Event) {
    const value = (e.target as BluetoothRemoteGATTCharacteristic).value;
    if (!value) return;
    this.rxBuffer += this.decoder.decode(value);
    // ELM327 terminates a response with '>'
    if (this.rxBuffer.includes('>')) {
      const resp = this.rxBuffer.replace(/>/g, '').trim();
      this.rxBuffer = '';
      const cb = this.pending;
      this.pending = null;
      cb?.(resp);
    }
  }

  private send(cmd: string, timeoutMs = 1500): Promise<string> {
    return new Promise((resolve) => {
      if (!this.writeChar) {
        resolve('');
        return;
      }
      const timer = setTimeout(() => {
        if (this.pending) {
          this.pending = null;
          resolve('');
        }
      }, timeoutMs);
      this.pending = (resp) => {
        clearTimeout(timer);
        resolve(resp);
      };
      const data = this.encoder.encode(cmd + '\r');
      // writeWithoutResponse when available (faster), else write
      const p = this.writeChar.properties.writeWithoutResponse
        ? this.writeChar.writeValueWithoutResponse(data)
        : this.writeChar.writeValue(data);
      p.catch(() => {
        clearTimeout(timer);
        this.pending = null;
        resolve('');
      });
    });
  }

  private async initElm() {
    await this.send('ATZ', 2500); // reset
    await this.send('ATE0'); // echo off
    await this.send('ATL0'); // linefeeds off
    await this.send('ATS0'); // spaces off
    await this.send('ATH0'); // headers off
    await this.send('ATSP0'); // auto protocol
  }

  // -------------------------------------------------------------------------
  // Polling loop — request standard PIDs and decode
  // -------------------------------------------------------------------------
  private startPolling() {
    if (this.poller) return;
    this.poller = setInterval(() => this.pollOnce(), 250); // 4 Hz; adapters vary
  }

  private stopPolling() {
    if (this.poller) clearInterval(this.poller);
    this.poller = null;
  }

  // parse "41 0C XX XX" style responses into data bytes
  private bytes(resp: string, mode: string, pid: string): number[] | null {
    if (!resp) return null;
    const clean = resp.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
    const hdr = (parseInt(mode, 16) + 0x40).toString(16).toUpperCase().padStart(2, '0') + pid.toUpperCase();
    const idx = clean.replace(/ /g, '').indexOf(hdr);
    if (idx < 0) return null;
    const hex = clean.replace(/ /g, '').slice(idx + hdr.length);
    const out: number[] = [];
    for (let i = 0; i + 1 < hex.length; i += 2) out.push(parseInt(hex.slice(i, i + 2), 16));
    return out.some(Number.isNaN) ? null : out;
  }

  private async q(pid: string): Promise<number[] | null> {
    const resp = await this.send('01' + pid);
    return this.bytes(resp, '01', pid);
  }

  private async pollOnce() {
    if (this.state !== 'connected') return;
    try {
      // RPM (010C): ((A*256)+B)/4
      const rpm = await this.q('0C');
      if (rpm && rpm.length >= 2) {
        this.last.rpm = Math.round(((rpm[0] * 256) + rpm[1]) / 4);
      }

      // Speed (010D): A km/h
      const sp = await this.q('0D');
      if (sp && sp.length >= 1) {
        this.last.speedKph = sp[0];
        this.last.speedKmh = sp[0];
        this.last.speedMph = Math.round(sp[0] * 0.621371);
      }

      // Coolant temp (0105): A-40
      const ect = await this.q('05');
      if (ect && ect.length >= 1) {
        this.last.coolantC = ect[0] - 40;
        this.last.coolantTempC = this.last.coolantC;
        this.last.coolantTempF = Math.round((this.last.coolantC * 9 / 5) + 32);
        this.last.coolantWarn = this.last.coolantC >= 110;
        this.last.coolantCritical = this.last.coolantC >= 115;
      }

      // Throttle (0111): A*100/255
      const th = await this.q('11');
      if (th && th.length >= 1) {
        this.last.throttlePct = Math.round((th[0] * 100) / 255);
        this.last.throttlePosPercent = this.last.throttlePct;
      }

      // Engine load (0104): A*100/255
      const ld = await this.q('04');
      if (ld && ld.length >= 1) {
        this.last.engineLoadPct = Math.round((ld[0] * 100) / 255);
        this.last.engineLoadPercent = this.last.engineLoadPct;
      }

      // MAF (0110): ((A*256)+B)/100 g/s
      const maf = await this.q('10');
      if (maf && maf.length >= 2) {
        this.last.mafGs = +(((maf[0] * 256) + maf[1]) / 100).toFixed(1);
        this.last.mafFlowGps = this.last.mafGs;
      }

      // Fuel level (012F): A*100/255
      const fl = await this.q('2F');
      if (fl && fl.length >= 1) {
        this.last.fuelLevelPct = Math.round((fl[0] * 100) / 255);
        this.last.fuelLevelPercent = this.last.fuelLevelPct;
      }

      // Short/long fuel trim bank1 (0106/0107): (A-128)*100/128
      const stft = await this.q('06');
      if (stft && stft.length >= 1) {
        this.last.shortFuelTrimPct = +(((stft[0] - 128) * 100) / 128).toFixed(1);
        this.last.shortFuelTrimPercent = this.last.shortFuelTrimPct;
      }
      const ltft = await this.q('07');
      if (ltft && ltft.length >= 1) {
        this.last.longFuelTrimPct = +(((ltft[0] - 128) * 100) / 128).toFixed(1);
        this.last.longFuelTrimPercent = this.last.longFuelTrimPct;
      }

      // Battery voltage via ELM "ATRV"
      const rv = await this.send('ATRV', 800);
      const v = parseFloat((rv || '').replace(/[^0-9.]/g, ''));
      if (!Number.isNaN(v) && v > 0) {
        this.last.batteryVoltage = +v.toFixed(2);
      }

      // Engine running heuristic
      this.last.engineRunning = this.last.rpm > 300;
      this.last.gear = this.last.speedKmh < 1 ? 0 : clamp(Math.ceil(this.last.speedKmh / 30), 1, 6);

      // DTC count (03) — list of stored codes
      const dtcResp = await this.send('03', 2000);
      this.last.dtcCodes = this.decodeDtcs(dtcResp);
      this.last.dtcCount = this.last.dtcCodes.length;
      this.last.milStatus = this.last.dtcCodes.length > 0;

      this.emit();
    } catch {
      // transient read error — keep last values, try again next tick
    }
  }

  private decodeDtcs(resp: string): string[] {
    if (!resp) return [];
    const clean = resp.replace(/[\s\r\n>]/g, '').toUpperCase();
    const i = clean.indexOf('43');
    if (i < 0) return [];
    const hex = clean.slice(i + 2);
    const codes: string[] = [];
    for (let p = 0; p + 3 < hex.length; p += 4) {
      const a = parseInt(hex.slice(p, p + 2), 16);
      const b = parseInt(hex.slice(p + 2, p + 4), 16);
      if (Number.isNaN(a) || Number.isNaN(b) || (a === 0 && b === 0)) continue;
      const first = ['P', 'C', 'B', 'U'][(a & 0xc0) >> 6];
      const code = first + ((a & 0x30) >> 4).toString() + (a & 0x0f).toString(16) + b.toString(16).padStart(2, '0');
      codes.push(code.toUpperCase());
    }
    return codes;
  }
}

export const obdConnection = new ObdConnection();
