// Mines — premium luxury casino lounge background music (Web Audio API).
// An opulent high-roller velvet-room groove: grand-piano arpeggios, warm
// string pads, a deep upright bass, and soft brushed drums — with a faint
// undercurrent of suspense suited to a mines/treasure game. Rich, mellow,
// and never rushed, like a private salon in a grand casino.
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

// ── Luxe progression — Ebmaj7 → Cm7 → Abmaj7 → Bb7sus (I–vi–IV–V) ───────
// Each chord lasts 2 bars (4s). Frequencies (Hz) per chord.
const CHORDS = [
  [155.56, 196, 233.08, 311.13, 392],   // Ebmaj7
  [130.81, 155.56, 196, 261.63, 311.13], // Cm7
  [103.83, 155.56, 207.65, 261.63, 311.13], // Abmaj7
  [116.54, 174.61, 233.08, 277.18, 349.23], // Bb7sus
];
// Grand-piano arpeggio pools (one octave up).
const ARPS = [
  [311.13, 392, 466.16, 622.25],
  [261.63, 311.13, 392, 523.25],
  [311.13, 415.30, 523.25, 622.25],
  [349.23, 466.16, 587.33, 698.46],
];
// Deep upright bass roots per chord (quarter notes: root, fifth, root, fifth).
const BASS = [
  [77.78, 116.54, 77.78, 116.54],
  [65.41, 98, 65.41, 98],
  [103.83, 155.56, 103.83, 155.56],
  [116.54, 174.61, 116.54, 174.61],
];
// Warm string pad voicings (mid register) per chord.
const STRINGS = [
  [392, 466.16, 587.33],
  [392, 466.16, 523.25],
  [415.30, 523.25, 622.25],
  [466.16, 587.33, 698.46],
];

export function startMinesMusic() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (bgNodes) return; // already playing

  const master = ac.createGain();
  master.gain.value = 0.38;
  master.connect(ac.destination);

  // Warm master low-pass for a velvety, rounded tone.
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3400;
  lp.Q.value = 0.3;
  lp.connect(master);

  // Subtle reverb send (short, lush room tail).
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.13;
  const fb = ac.createGain();
  fb.gain.value = 0.24;
  const revMix = ac.createGain();
  revMix.gain.value = 0.20;
  lp.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(revMix);
  revMix.connect(master);

  let chordIdx = 0;

  // ── Warm string pad — sustained, slowly swelling ──
  const stringGain = ac.createGain();
  stringGain.gain.value = 0.5;
  stringGain.connect(lp);

  function playStrings() {
    const now = ac.currentTime;
    const notes = STRINGS[chordIdx % STRINGS.length];
    const dur = 4.0;
    notes.forEach((f) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, now);
      // gentle vibrato for life
      const lfo = ac.createOscillator();
      const lfoG = ac.createGain();
      lfo.frequency.value = 0.28;
      lfoG.gain.value = 1.0;
      lfo.connect(lfoG);
      lfoG.connect(o.frequency);
      lfo.start(now);
      lfo.stop(now + dur + 0.1);
      // low-pass the strings so they're silky, not buzzy
      const sf = ac.createBiquadFilter();
      sf.type = 'lowpass';
      sf.frequency.value = 1600;
      sf.Q.value = 0.5;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.07, now + 0.6);
      g.gain.setValueAtTime(0.07, now + dur - 1.0);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(sf);
      sf.connect(g);
      g.connect(stringGain);
      o.start(now);
      o.stop(now + dur + 0.05);
    });
  }

  // ── Grand-piano arpeggios — flowing, expressive ──
  const pianoGain = ac.createGain();
  pianoGain.gain.value = 0.5;
  pianoGain.connect(lp);

  function playPiano() {
    const now = ac.currentTime;
    const pool = ARPS[chordIdx % ARPS.length];
    // 8 flowing eighth-notes per chord (4s), gentle syncopation.
    for (let i = 0; i < 8; i++) {
      const f = pool[i % pool.length];
      const swing = i % 2 === 1 ? 0.05 : 0;
      const t = now + i * 0.5 + swing;
      // Main note — triangle for a soft bell-like piano tone.
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(g);
      g.connect(pianoGain);
      o.start(t);
      o.stop(t + 0.5);
      // Octave-up sine harmonic for sparkle.
      const sp = ac.createOscillator();
      const spG = ac.createGain();
      sp.type = 'sine';
      sp.frequency.setValueAtTime(f * 2, t);
      spG.gain.setValueAtTime(0.0001, t);
      spG.gain.linearRampToValueAtTime(0.05, t + 0.02);
      spG.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      sp.connect(spG);
      spG.connect(pianoGain);
      sp.start(t);
      sp.stop(t + 0.4);
    }
  }

  // ── Deep upright bass — root, fifth, root, fifth ──
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
      g.gain.linearRampToValueAtTime(0.30, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
      o.connect(g);
      g.connect(bassGain);
      o.start(t);
      o.stop(t + 0.8);
    });
  }

  // ── Soft brushed drums — intimate, low-key ──
  const drumGain = ac.createGain();
  drumGain.gain.value = 0.28;
  drumGain.connect(lp);

  function playKick(t) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(95, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.14);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.32, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g);
    g.connect(drumGain);
    o.start(t);
    o.stop(t + 0.22);
  }

  function playSnare(t) {
    const len = Math.floor(ac.sampleRate * 0.05);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1600;
    f.Q.value = 0.7;
    const g = ac.createGain();
    g.gain.value = 0.10;
    src.connect(f);
    f.connect(g);
    g.connect(drumGain);
    src.start(t);
  }

  function playHat(t) {
    const len = Math.floor(ac.sampleRate * 0.03);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = ac.createGain();
    g.gain.value = 0.05;
    src.connect(f);
    f.connect(g);
    g.connect(drumGain);
    src.start(t);
  }

  function playDrums() {
    const now = ac.currentTime;
    // Soft 4/4: kick on 1 & 3, brushed snare on 2 & 4, hats on off-beats.
    playKick(now);
    playKick(now + 2.0);
    playSnare(now + 1.0);
    playSnare(now + 3.0);
    for (let i = 0; i < 8; i++) {
      const swing = i % 2 === 1 ? 0.05 : 0;
      playHat(now + i * 0.5 + swing);
    }
  }

  // ── Sequencer — every 4s advance the chord and fire all layers ──
  function step() {
    playStrings();
    playPiano();
    playBass();
    playDrums();
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

export function stopMinesMusic() {
  if (bgNodes) bgNodes.stop();
}

const minesSound = { startMinesMusic, stopMinesMusic };
export default minesSound;