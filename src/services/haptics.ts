/**
 * Tactile Haptic & Audio Confirmation Service
 * Implements subtle, native-feeling haptic pulses using Navigator Vibration API
 * and Web Audio synthesizer micro-ticks for instant tactile confirmation.
 */

class HapticsService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Light haptic tap for standard button clicks & toggles
   */
  public lightTap(): void {
    if (typeof window === 'undefined') return;

    // Navigator vibration if supported
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(10);
      } catch (_) {}
    }

    // Subtle audio micro-tick (12ms at 440Hz low gain)
    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.015);

        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.016);
      }
    } catch (_) {}
  }

  /**
   * Soft tick for wipe completion / slider snap
   */
  public softTick(): void {
    this.lightTap();
  }

  /**
   * Selection changed tactile tick
   */
  public selectionChanged(): void {
    this.lightTap();
  }

  /**
   * Medium haptic feedback for significant confirmations (e.g. OBD connect, unlock)
   */
  public mediumSuccess(): void {
    if (typeof window === 'undefined') return;

    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([15, 30, 20]);
      } catch (_) {}
    }

    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.095);
      }
    } catch (_) {}
  }

  /**
   * Heavy success feedback for confirmed bank settlement
   */
  public heavySuccess(): void {
    this.heroReveal();
  }

  /**
   * Reveal celebration tick for AI render completion
   */
  public heroReveal(): void {
    if (typeof window === 'undefined') return;

    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([20, 50, 40]);
      } catch (_) {}
    }

    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(now + 0.23);
      }
    } catch (_) {}
  }

  /**
   * Heavy impact feedback for crash simulation and launch trigger
   */
  public heavyImpact(): void {
    if (typeof window === 'undefined') return;

    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([60, 40, 60]);
      } catch (_) {}
    }

    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(now + 0.19);
      }
    } catch (_) {}
  }

  /**
   * Warning haptic pulse for validation or payment error
   */
  public warning(): void {
    if (typeof window === 'undefined') return;

    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch (_) {}
    }

    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(now + 0.15);
      }
    } catch (_) {}
  }
}

export const haptics = new HapticsService();
