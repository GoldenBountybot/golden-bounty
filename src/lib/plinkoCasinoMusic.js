// Plinko Drop — classic casino lounge background music (Web Audio API).
// A smooth, warm Vegas-floor groove: Rhodes-style piano chords, walking
// upright bass, brushed swing drums, and soft brass stabs. Designed to feel
// like a classy, late-night casino lounge rather than an ambient soundscape.
import { isMuted } from '@/lib/soundMute';

let ctx = null;
function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { ctx = null; }
  }
  return ctx;
}

let bgNodes = null;

// ── Smooth jazz progression — ii–V–I in F (Gm7 → C7 → Fmaj7 → Dm7) ───────
// Each chord lasts 2 bars (4s). Frequencies (Hz) per chord.
const CHORDS = [
  [98,  117.47, 146.83, 196, 233.08], // Gm7  (G D F A Bb→A)
  [130.81, 164.81, 196, 246.94, 293.66], // C7-ish (C E G Bb D)
  [87.31, 130.81, 174.61, 220, 261.63], // Fmaj7 (F A C E)
  [110, 146.83, 174.61, 220, 261.63], // Dm7  (D F A C E)
];
// Piano arpeggio pools (one octave up) for the chord comping.
const ARPS = [
  [196, 233.08, 293.66, 392],
  [261.63, 329.63, 392, 493.88],
  [174.61, 220, 261.63, 349.23],
  [220, 261.63, 293.66, 349.23],
];
// Walking bass roots per chord (quarter notes: root, fifth, third, fifth).
const BASS = [
  [98, 146.83, 117.47, 146.83],
  [130.81, 196, 164.81, 196],
  [87.31, 130.81, 110, 130.81],
  [146.83, 220, 174.61, 220],
];
// Brass stab voicings (mid register) per chord.
const BRASS = [
  [392, 466.16, 587.33],
  [329.63, 392, 493.88],
  [349.23, 440, 523.25],
  [261.63, 349.23, 440],
];

export function startPlinkoMusic() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (bgNodes) return; // already playing

  const master = ac.createGain();
  master.gain.value = 0.40;
  master.connect(ac.destination);

  // Warm master low-pass to keep it smooth and rounded.
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3800;
  lp.Q.value = 0.3;
  lp.connect(master);

  // Subtle stereo-ish reverb send (short room tail).
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.11;
  const fb = ac.createGain();
  fb.gain.value = 0.22;
  const revMix = ac.createGain();
  revMix.gain.value = 0.18;
  lp.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(revMix);
  revMix.connect(master);

  let chordIdx = 0;

  // ── Rhodes-style piano comping ──
  const pianoGain = ac.createGain();
  pianoGain.gain.value = 0.5;
  pianoGain.connect(lp);

  function playPiano() {
    const now = ac.currentTime;
    const chord = CHORDS[chordIdx % CHORDS.length];
    const pool = ARPS[chordIdx % ARPS.length];
    const dur = 4.0;
    // Sustained chord pad (soft sine layer).
    chord.forEach((f) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, now);
      const lfo = ac.createOscillator();
      const lfoG = ac.createGain();
      lfo.frequency.value = 0.3;
      lfoG.gain.value = 1.2;
      lfo.connect(lfoG);
      lfoG.connect(o.frequency);
      lfo.start(now);
      lfo.stop(now + dur + 0.1);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.09, now + 0.4);
      g.gain.setValueAtTime(0.09, now + dur - 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g);
      g.connect(pianoGain);
      o.start(now);
      o.stop(now + dur + 0.05);
    });
    // Comping arpeggio — syncopated 8th notes with a swing feel.
    for (let i = 0; i < 8; i++) {
      const f = pool[i % pool.length];
      // Swing: offset odd 8ths slightly later.
      const swing = i % 2 === 1 ? 0.06 : 0;
      const t = now + i * 0.5 + swing;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.13, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g);
      g.connect(pianoGain);
      o.start(t);
      o.stop(t + 0.4);
      // Soft sine harmonic for warmth.
      const sp = ac.createOscillator();
      const spG = ac.createGain();
      sp.type = 'sine';
      sp.frequency.setValueAtTime(f * 2, t);
      spG.gain.setValueAtTime(0.0001, t);
      spG.gain.linearRampToValueAtTime(0.04, t + 0.02);
      spG.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      sp.connect(spG);
      spG.connect(pianoGain);
      sp.start(t);
      sp.stop(t + 0.35);
    }
  }

  // ── Walking upright bass ──
  const bassGain = ac.createGain();
  bassGain.gain.value = 0.55;
  bassGain.connect(lp);

  function playBass() {
    const now = ac.currentTime;
    const notes = BASS[chordIdx % BASS.length];
    notes.forEach((f, i) => {
      const t = now + i * 1.0;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.30, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g);
      g.connect(bassGain);
      o.start(t);
      o.stop(t + 0.75);
    });
  }

  // ── Brushed swing drums ──
  const drumGain = ac.createGain();
  drumGain.gain.value = 0.32;
  drumGain.connect(lp);

  function playKick(t) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.38, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g);
    g.connect(drumGain);
    o.start(t);
    o.stop(t + 0.2);
  }

  function playSnare(t) {
    const len = Math.floor(ac.sampleRate * 0.06);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1800;
    f.Q.value = 0.8;
    const g = ac.createGain();
    g.gain.value = 0.14;
    src.connect(f);
    f.connect(g);
    g.connect(drumGain);
    src.start(t);
  }

  function playHat(t, open = false) {
    const len = Math.floor(ac.sampleRate * (open ? 0.08 : 0.03));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7500;
    const g = ac.createGain();
    g.gain.value = open ? 0.08 : 0.06;
    src.connect(f);
    f.connect(g);
    g.connect(drumGain);
    src.start(t);
  }

  function playDrums() {
    const now = ac.currentTime;
    // Swing 4/4: kick on 1 & 3, snare on 2 & 4, hats on every 8th (swung).
    playKick(now);
    playKick(now + 2.0);
    playSnare(now + 1.0);
    playSnare(now + 3.0);
    for (let i = 0; i < 8; i++) {
      const swing = i % 2 === 1 ? 0.06 : 0;
      playHat(now + i * 0.5 + swing, i === 7);
    }
  }

  // ── Soft brass stabs — once per chord, off-beat ──
  const brassGain = ac.createGain();
  brassGain.gain.value = 0.22;
  brassGain.connect(lp);

  function playBrass() {
    const now = ac.currentTime;
    const notes = BRASS[chordIdx % BRASS.length];
    // Two short stabs: on the "and" of 2 and the "and" of 4.
    [1.5, 3.5].forEach((off) => {
      const t = now + off;
      notes.forEach((f) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        const filt = ac.createBiquadFilter();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(f, t);
        filt.type = 'lowpass';
        filt.frequency.setValueAtTime(2200, t);
        filt.Q.value = 0.7;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.10, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
        o.connect(filt);
        filt.connect(g);
        g.connect(brassGain);
        o.start(t);
        o.stop(t + 0.45);
      });
    });
  }

  // ── Sequencer — every 4s advance the chord and fire all layers ──
  function step() {
    playPiano();
    playBass();
    playDrums();
    playBrass();
    chordIdx++;
  }
  step();
  const stepTimer = setInterval(step, 4000);

  bgNodes = {
    stop: () => {
      clearInterval(stepTimer);
      try { master.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.3); } catch {}
      setTimeout(() => { try { master.disconnect(); } catch {} }, 400);
      bgNodes = null;
    },
  };
}

export function stopPlinkoMusic() {
  if (bgNodes) bgNodes.stop();
}

const plinkoCasinoMusic = { startPlinkoMusic, stopPlinkoMusic };
export default plinkoCasinoMusic;