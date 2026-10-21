/**
 * Web Audio API Synthesizer for Quiz Game Sound Effects
 * Ultra-low latency, zero external asset dependencies, cross-platform compatible.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

const SOUND_STORAGE_KEY = "ccc_quiz_sound_enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(SOUND_STORAGE_KEY);
  return stored !== "false";
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "true" : "false");
}

/**
 * Duolingo-style crisp, uplifting harmonic chime for correct answers.
 * Uses harmonic multi-tone arpeggio (C5 -> E5 -> G5 -> C6).
 */
export function playCorrectSound(streak: number = 0): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const baseFreqs = streak >= 3 ? [587.33, 739.99, 880.0, 1174.66] : [523.25, 659.25, 783.99, 1046.5];
  const stepDuration = 0.07;

  baseFreqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * stepDuration);

    const startTime = now + idx * stepDuration;
    const endTime = startTime + 0.25;

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, endTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(endTime);
  });
}

/**
 * Subtle, soft "wobble/thud" for incorrect answers.
 * Non-jarring, gamified dual-tone drop (F3 -> D3).
 */
export function playWrongSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Primary tone (descending drop)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();

  osc1.type = "triangle";
  osc1.frequency.setValueAtTime(196, now); // G3
  osc1.frequency.exponentialRampToValueAtTime(110, now + 0.28); // A2

  gain1.gain.setValueAtTime(0.2, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + 0.32);

  // Sub-bass thump for tactile tactile weight
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();

  osc2.type = "sine";
  osc2.frequency.setValueAtTime(130.81, now); // C3
  osc2.frequency.exponentialRampToValueAtTime(75, now + 0.25);

  gain2.gain.setValueAtTime(0.25, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc2.start(now);
  osc2.stop(now + 0.28);
}

/**
 * Celebratory fanfare chord when passing a quiz.
 */
export function playFinishSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const chordNotes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C Major chord

  chordNotes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);

    const startTime = now + idx * 0.06;
    const duration = 0.5 + idx * 0.1;

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

/**
 * Subtle tactile woody click/tap sound for option selection and navigation.
 */
export function playTapSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(480, now);
  osc.frequency.exponentialRampToValueAtTime(720, now + 0.035);

  gain.gain.setValueAtTime(0.09, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.045);
}

