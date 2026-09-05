/**
 * Scribe Studio Cinema Audio Synthesizer
 * 100% native Web Audio API synthesis.
 * Zero external audio assets, zero latency, zero network overhead.
 */

class CinemaAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("scribe_audio_muted");
      this.isMuted = savedMute === "true";
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("scribe_audio_muted", String(this.isMuted));
    }
    if (this.isMuted && this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Crisp mechanical camera shutter actuation (ARRI / RED style)
   */
  public playCameraShutter(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Shutter Blade Click (White Noise Burst)
    const bufferSize = Math.floor(ctx.sampleRate * 0.04);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(3.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);

    // 2. Mechanical Mirror Flip (Low Metallic Thud)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.05);

    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);

    // 3. Second Actuator Release Click
    setTimeout(() => {
      if (this.isMuted) return;
      const c = this.getContext();
      if (!c) return;
      const t = c.currentTime;
      const releaseOsc = c.createOscillator();
      const releaseGain = c.createGain();
      releaseOsc.type = "sine";
      releaseOsc.frequency.setValueAtTime(900, t);
      releaseOsc.frequency.exponentialRampToValueAtTime(200, t + 0.025);
      releaseGain.gain.setValueAtTime(0.18, t);
      releaseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      releaseOsc.connect(releaseGain);
      releaseGain.connect(c.destination);
      releaseOsc.start(t);
      releaseOsc.stop(t + 0.03);
    }, 45);
  }

  /**
   * Warm cinematic director harmonic chime for passport approval / sync
   */
  public playDirectorChime(success: boolean = true): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = success ? [220, 277.18, 329.63, 554.37] : [220, 207.65, 174.61];
    const duration = success ? 0.6 : 0.4;

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.001, now + idx * 0.03);
      gain.gain.linearRampToValueAtTime(0.15 / (idx + 1), now + idx * 0.03 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.03 + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + duration + 0.05);
    });
  }

  /**
   * Subtle mechanical keyclick for Fountain screenplay typing
   */
  public playTypewriterClick(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    const pitch = 700 + Math.random() * 200;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.015);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.02);
  }

  /**
   * Atmospheric 35mm projection booth / studio ambient room tone
   */
  public startAmbientRoomTone(): void {
    if (this.isMuted || this.ambientSource) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(55, now);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(110.5, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 1.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);

    this.ambientSource = gain;
    this.ambientGain = gain;
  }

  public stopAmbientRoomTone(): void {
    if (!this.ambientGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.ambientGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);
    setTimeout(() => {
      this.ambientSource = null;
      this.ambientGain = null;
    }, 600);
  }
}

export const cinemaAudio = new CinemaAudioEngine();
