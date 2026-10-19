// src/services/telemetrySource.ts
// One place the UI subscribes to telemetry. It forwards from whichever source
// is active: the real OBD adapter (live car data) or the simulator (demo / app
// review / no adapter). Swap the source at runtime without touching the UI.

import { OBDTelemetry } from '../types';
import { obdSimulator } from './obdSimulator';
import { obdConnection } from './obdConnection';

export type SourceKind = 'sim' | 'live';
type Listener = (t: OBDTelemetry) => void;

class TelemetrySource {
  private kind: SourceKind = 'sim';
  private listeners = new Set<Listener>();
  private unsub: (() => void) | null = null;
  private currentTelemetry: OBDTelemetry = obdSimulator.getTelemetry();

  getKind() {
    return this.kind;
  }

  getTelemetry(): OBDTelemetry {
    return this.currentTelemetry;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    // Immediately emit current state
    fn(this.currentTelemetry);
    return () => this.listeners.delete(fn);
  }

  private fanout = (t: OBDTelemetry) => {
    this.currentTelemetry = t;
    this.listeners.forEach((f) => f(t));
  };

  start() {
    this.use(this.kind);
  }

  use(kind: SourceKind) {
    this.kind = kind;
    this.unsub?.();
    if (kind === 'sim') {
      obdSimulator.start(10);
      this.unsub = obdSimulator.subscribe(this.fanout);
    } else {
      // live: the adapter pushes telemetry as it polls the car
      this.unsub = obdConnection.subscribe(this.fanout);
    }
  }

  stop() {
    this.unsub?.();
    this.unsub = null;
  }
}

export const telemetry = new TelemetrySource();
