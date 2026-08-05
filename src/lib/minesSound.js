// Mines — upbeat gaming background music (Web Audio API).
// An energetic arcade-style groove: bright synth arpeggios, a driving
// electronic bassline, punchy drums, and shimmering lead stabs — lively and
// propulsive, like a modern video-game treasure hunt.
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

// ── Gaming progression — Am → F → C → G (vi–IV–I–V), 2 bars (4s) each ──
const CHORDS = [
  [220, 261.63, 329.63, 440],   // Am
  [174.61, 220, 261.63, 349.23], // F
  [261.63, 329.63, 392, 523.25], // C
  [196, 246.94, 293.66, 392],   // G
];
// Bright synth arpeggio pools (one octave up, fast 16ths).
const ARPS = [
  [440, 523.25, 659.25, 880, 659.25, 523.25],
  [349.23, 440, 523.25, 698.46, 523.25, 440],
  [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25],
  [392, 493.88, 587.33, 783.99, 587.33, 493.88],
];
// Driving electronic bass roots (8th notes: root, root, fifth, root, root, fifth, root, fifth).
const BASS = [
  [110, 110, 164.81, 110, 110, 164.81, 110, 164.81],
  [87.31, 87.31, 130.81, 87.31, 87.31, 130.81, 87.31, 130.81],
  [130.81, 130.81, 196, 130.81, 130.81, 196, 130.81, 196],
  [98, 98, 146.83, 98, 98, 146.83, 98, 146.83],
];
// Shimmering lead stab chords (high register) per chord.
const STABS = [
  [880, 1046.5, 1318.5],
  [698.46, 880, 1046.5],
  [1046.5, 1318.5, 1568],
  [783.99, 987.77, 1174.7],
];

export function startMinesMusic() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (bgNodes) return; // already playing

  const master = ac.createGain();
  master.gain.value = 0.44; // slightly louder
  master.connect(ac.destination);

  // Bright master low-pass for a crisp, clear tone.
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 5200;
  lp.Q.value = 0.4;
  lp.connect(master);

  // Short echo/reverb send for space.
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.18;
  const fb = ac.createGain();
  fb.gain.value = 0.28;
  const revMix = ac.createGain();
  revMix.gain.value = 0.22;
  lp.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(revMix);
  revMix.connect(master);

  let chordIdx = 0;

  // ── Warm pad — sustained synth bed ──
  const padGain = ac.createGain();
  padGain.gain.value = 0.42;
  padGain.connect(lp);

  function playPad() {
    const now = ac.currentTime;
    const notes = CHORDS[chordIdx % CHORDS.length];
    const dur = 4.0;
    notes.forEach((f) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, now);
      const lfo = ac.createOscillator();
      const lfoG = ac.createGain();
      lfo.frequency.value = 0.4;
      lfoG.gain.value = 1.5;
      lfo.connect(lfoG);
      lfoG.connect(o.frequency);
      lfo.start(now);
      lfo.stop(now + dur + 0.1);
      const sf = ac.createBiquadFilter();
      sf.type = 'lowpass';
      sf.frequency.value = 2200;
      sf.Q.value = 0.6;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.06, now + 0.5);
      g.gain.setValueAtTime(0.06, now + dur - 0.8);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(sf);
      sf.connect(g);
      g.connect(padGain);
      o.start(now);
      o.stop(now + dur + 0.05);
    });
  }

  // ── Bright synth arpeggios — fast 16ths, energetic ──
  const arpGain = ac.createGain();
  arpGain.gain.value = 0.5;
  arpGain.connect(lp);

  function playArp() {
    const now = ac.currentTime;
    const pool = ARPS[chordIdx % ARPS.length];
    // 16 fast 16th notes per chord (4s = 16 × 0.25s).
    for (let i = 0; i < 16; i++) {
      const f = pool[i % pool.length];
      const t = now + i * 0.25;
      // Main note — square for a bright, punchy synth tone.
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g);
      g.connect(arpGain);
      o.start(t);
      o.stop(t + 0.25);
      // Octave-up sine sparkle.
      const sp = ac.createOscillator();
      const spG = ac.createGain();
      sp.type = 'sine';
      sp.frequency.setValueAtTime(f * 2, t);
      spG.gain.setValueAtTime(0.0001, t);
      spG.gain.linearRampToValueAtTime(0.04, t + 0.01);
      spG.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      sp.connect(spG);
      spG.connect(arpGain);
      sp.start(t);
      sp.stop(t + 0.2);
    }
  }

  // ── Driving electronic bass — 8th-note pulse ──
  const bassGain = ac.createGain();
  bassGain.gain.value = 0.5;
  bassGain.connect(lp);

  function playBass() {
    const now = ac.currentTime;
    const notes = BASS[chordIdx % BASS.length];
    notes.forEach((f, i) => {
      const t = now + i * 0.5;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t);
      const bf = ac.createBiquadFilter();
      bf.type = 'lowpass';
      bf.frequency.setValueAtTime(180, t);
      bf.Q.value = 2;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.26, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      o.connect(bf);
      bf.connect(g);
      g.connect(bassGain);
      o.start(t);
      o.stop(t + 0.45);
    });
  }

  // ── Shimmering lead stabs — on beats 1 & 3 ──
  const stabGain = ac.createGain();
  stabGain.gain.value = 0.4;
  stabGain.connect(lp);

  function playStab(when) {
    const notes = STABS[chordIdx % STABS.length];
    notes.forEach((f) => {
      const t = when;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.10, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g);
      g.connect(stabGain);
      o.start(t);
      o.stop(t + 0.55);
    });
  }

  // ── Punchy drums — energetic 4/4 ──
  const drumGain = ac.createGain();
  drumGain.gain.value = 0.32;
  drumGain.connect(lp);

  function playKick(t) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.4, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g);
    g.connect(drumGain);
    o.start(t);
    o.stop(t + 0.2);
  }

  function playSnare(t) {
    const len = Math.floor(ac.sampleRate * 0.08);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1900;
    f.Q.value = 0.8;
    const g = ac.createGain();
    g.gain.value = 0.16;
    src.connect(f);
    f.connect(g);
    g.connect(drumGain);
    src.start(t);
    // body tone
    const o = ac.createOscillator();
    const og = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(220, t);
    og.gain.setValueAtTime(0.1, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(og);
    og.connect(drumGain);
    o.start(t);
    o.stop(t + 0.12);
  }

  function playHat(t, open = false) {
    const len = Math.floor(ac.sampleRate * (open ? 0.12 : 0.04));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 8000;
    const g = ac.createGain();
    g.gain.value = open ? 0.08 : 0.06;
    src.connect(f);
    f.connect(g);
    g.connect(drumGain);
    src.start(t);
  }

  function playDrums() {
    const now = ac.currentTime;
    // Energetic 4/4: kick on 1, 1.5, 3, 3.5; snare on 2 & 4; hats on 8ths.
    playKick(now);
    playKick(now + 0.5);
    playKick(now + 2.0);
    playKick(now + 2.5);
    playSnare(now + 1.0);
    playSnare(now + 3.0);
    for (let i = 0; i < 8; i++) {
      playHat(now + i * 0.5, i === 7);
    }
    // Lead stabs on beats 1 & 3.
    playStab(now);
    playStab(now + 2.0);
  }

  // ── Sequencer — every 4s advance the chord and fire all layers ──
  function step() {
    playPad();
    playArp();
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