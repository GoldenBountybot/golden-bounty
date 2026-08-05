// Hi-Lo — premium luxury casino sound suite (Web Audio API synthesis).
// All sounds respect the global mute flag. Crafted to evoke a high-roller
// velvet-and-gold casino lounge: warm card-felt thuds, crystal chime wins,
// and a somber low loss tone.
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

// ── Shared reverb bus (short, tasteful room tail) ──────────────────────
function makeReverbBus(ac, delayTime = 0.09, feedback = 0.2, mix = 0.28) {
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = delayTime;
  const fb = ac.createGain();
  fb.gain.value = feedback;
  const delayMix = ac.createGain();
  delayMix.gain.value = mix;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);
  return { bus };
}

// ── DEAL — a premium card-slap: felt thud + crisp card snap + gold chime ─
export function playDeal() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.08, 0.18, 0.22);

  // Felt thud — low sine body with fast decay.
  const thud = ac.createOscillator();
  const thudG = ac.createGain();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(160, t);
  thud.frequency.exponentialRampToValueAtTime(70, t + 0.12);
  thudG.gain.setValueAtTime(0.0001, t);
  thudG.gain.linearRampToValueAtTime(0.32, t + 0.004);
  thudG.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  thud.connect(thudG);
  thudG.connect(bus);
  thud.start(t);
  thud.stop(t + 0.2);

  // Card snap — short noise burst (the card landing on the felt).
  const snap = ac.createBufferSource();
  const len = Math.floor(ac.sampleRate * 0.05);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  snap.buffer = buf;
  const snapF = ac.createBiquadFilter();
  snapF.type = 'bandpass';
  snapF.frequency.value = 2600;
  snapF.Q.value = 1.2;
  const snapG = ac.createGain();
  snapG.gain.setValueAtTime(0.18, t + 0.01);
  snapG.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  snap.connect(snapF);
  snapF.connect(snapG);
  snapG.connect(bus);
  snap.start(t + 0.01);

  // Gold chime — a single warm bell ping as the card settles.
  [1318.5, 2637].forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t + 0.04);
    g.gain.setValueAtTime(0.0001, t + 0.04);
    g.gain.linearRampToValueAtTime(0.08 - i * 0.03, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g);
    g.connect(bus);
    o.start(t + 0.04);
    o.stop(t + 0.45);
  });
}

// ── WIN — triumphant crystal fanfare: rising gold arpeggio + warm pad ───
export function playWin() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.12, 0.28, 0.32);

  // Rising major arpeggio (C-E-G-C) — bright crystal bells.
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t + i * 0.09);
    g.gain.setValueAtTime(0.0001, t + i * 0.09);
    g.gain.linearRampToValueAtTime(0.16, t + i * 0.09 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.5);
    o.connect(g);
    g.connect(bus);
    o.start(t + i * 0.09);
    o.stop(t + i * 0.09 + 0.55);

    // Sparkle harmonic an octave up.
    const sp = ac.createOscillator();
    const spG = ac.createGain();
    sp.type = 'sine';
    sp.frequency.setValueAtTime(f * 2, t + i * 0.09);
    spG.gain.setValueAtTime(0.0001, t + i * 0.09);
    spG.gain.linearRampToValueAtTime(0.05, t + i * 0.09 + 0.01);
    spG.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.4);
    sp.connect(spG);
    spG.connect(bus);
    sp.start(t + i * 0.09);
    sp.stop(t + i * 0.09 + 0.45);
  });

  // Warm pad — a soft sustained chord underneath the arpeggio.
  [261.63, 329.63, 392].forEach((f) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.08);
    g.gain.setValueAtTime(0.06, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 0.95);
  });

  // Final shimmer — a high gold ping to crown the win.
  const sh = ac.createOscillator();
  const shG = ac.createGain();
  sh.type = 'sine';
  sh.frequency.setValueAtTime(2093, t + 0.36);
  shG.gain.setValueAtTime(0.0001, t + 0.36);
  shG.gain.linearRampToValueAtTime(0.1, t + 0.38);
  shG.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  sh.connect(shG);
  shG.connect(bus);
  sh.start(t + 0.36);
  sh.stop(t + 0.85);
}

// ── LOSS — a somber low descent: muted brass fall + soft thud ───────────
export function playLoss() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.14, 0.22, 0.25);

  // Descending minor tones (A-F-D) — muted brass-like sawtooth.
  const notes = [440, 349.23, 293.66];
  notes.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    const filt = ac.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, t + i * 0.14);
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(900, t + i * 0.14);
    filt.Q.value = 0.8;
    g.gain.setValueAtTime(0.0001, t + i * 0.14);
    g.gain.linearRampToValueAtTime(0.12, t + i * 0.14 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.14 + 0.4);
    o.connect(filt);
    filt.connect(g);
    g.connect(bus);
    o.start(t + i * 0.14);
    o.stop(t + i * 0.14 + 0.45);
  });

  // Soft low thud — the pot being taken away.
  const thud = ac.createOscillator();
  const thudG = ac.createGain();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(120, t + 0.42);
  thud.frequency.exponentialRampToValueAtTime(55, t + 0.6);
  thudG.gain.setValueAtTime(0.0001, t + 0.42);
  thudG.gain.linearRampToValueAtTime(0.22, t + 0.43);
  thudG.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  thud.connect(thudG);
  thudG.connect(bus);
  thud.start(t + 0.42);
  thud.stop(t + 0.75);
}

// ── COLLECT — a bright cash-out chime (shorter, sweeter than win) ───────
export function playCollect() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.1, 0.24, 0.3);

  [783.99, 1046.5, 1567.98].forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t + i * 0.06);
    g.gain.setValueAtTime(0.0001, t + i * 0.06);
    g.gain.linearRampToValueAtTime(0.14, t + i * 0.06 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.35);
    o.connect(g);
    g.connect(bus);
    o.start(t + i * 0.06);
    o.stop(t + i * 0.06 + 0.4);
  });
}

// ── BACKGROUND MUSIC — uplifting melodic gaming lounge loop ──────────────
// A brighter, more musical groove: shimmering arpeggio bells over a warm
// Rhodes-style chord pad, a walking bass line, and a soft kick+hat groove.
// Designed to feel like a premium, feel-good casino lounge theme.
let bgNodes = null;

export function startBackgroundMusic() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (bgNodes) return; // already playing

  const master = ac.createGain();
  master.gain.value = 0.42; // louder, fuller mix
  master.connect(ac.destination);

  // Gentle low-pass to keep it warm yet present.
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 4200;
  lp.Q.value = 0.35;
  lp.connect(master);

  // ── Chord progression — Cmaj7 → Am7 → Fmaj7 → G7 (I–vi–IV–V) ──
  // Each chord lasts 2 bars (4s). Frequencies (Hz) per chord.
  const chords = [
    [130.81, 164.81, 196, 261.63, 329.63], // Cmaj7
    [110, 130.81, 164.81, 220, 261.63],    // Am7
    [87.31, 130.81, 174.61, 220, 261.63],  // Fmaj7
    [98, 123.47, 196, 246.94, 293.66],     // G7
  ];
  // Arpeggio note pools (one octave up) for the bell pattern.
  const arps = [
    [523.25, 659.25, 783.99, 1046.5],
    [440, 523.25, 659.25, 880],
    [349.23, 440, 523.25, 698.46],
    [392, 493.88, 587.33, 783.99],
  ];
  // Bass roots per chord.
  const bassRoots = [65.41, 55, 43.65, 49];
  let chordIdx = 0;

  // ── Warm Rhodes-style chord pad ──
  const padGain = ac.createGain();
  padGain.gain.value = 0.5;
  padGain.connect(lp);

  function playPad() {
    const now = ac.currentTime;
    const chord = chords[chordIdx % chords.length];
    const dur = 4.0;
    chord.forEach((f) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, now);
      // gentle vibrato for life
      const lfo = ac.createOscillator();
      const lfoG = ac.createGain();
      lfo.frequency.value = 0.35;
      lfoG.gain.value = 1.5;
      lfo.connect(lfoG);
      lfoG.connect(o.frequency);
      lfo.start(now);
      lfo.stop(now + dur + 0.1);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.1, now + 0.5);
      g.gain.setValueAtTime(0.1, now + dur - 0.8);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g);
      g.connect(padGain);
      o.start(now);
      o.stop(now + dur + 0.05);
    });
  }

  // ── Shimmering arpeggio bells (triangle + sine harmonic) ──
  const arpGain = ac.createGain();
  arpGain.gain.value = 0.5;
  arpGain.connect(lp);

  function playArp() {
    const now = ac.currentTime;
    const pool = arps[chordIdx % arps.length];
    // 8 eighth-notes per chord (2s), two cycles per chord (4s).
    for (let i = 0; i < 8; i++) {
      const f = pool[i % pool.length];
      const t = now + i * 0.25;
      // Main bell
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g);
      g.connect(arpGain);
      o.start(t);
      o.stop(t + 0.35);
      // Sparkle harmonic (octave up, softer)
      const sp = ac.createOscillator();
      const spG = ac.createGain();
      sp.type = 'sine';
      sp.frequency.setValueAtTime(f * 2, t);
      spG.gain.setValueAtTime(0.0001, t);
      spG.gain.linearRampToValueAtTime(0.05, t + 0.01);
      spG.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      sp.connect(spG);
      spG.connect(arpGain);
      sp.start(t);
      sp.stop(t + 0.3);
    }
  }

  // ── Walking bass — root, fifth, root, fifth per chord ──
  const bassGain = ac.createGain();
  bassGain.gain.value = 0.55;
  bassGain.connect(lp);

  function playBass() {
    const now = ac.currentTime;
    const root = bassRoots[chordIdx % bassRoots.length];
    const fifth = root * 1.5;
    const pattern = [root, root, fifth, root];
    pattern.forEach((f, i) => {
      const t = now + i * 1.0;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.28, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      o.connect(g);
      g.connect(bassGain);
      o.start(t);
      o.stop(t + 0.65);
    });
  }

  // ── Soft kick + hat groove ──
  const drumGain = ac.createGain();
  drumGain.gain.value = 0.35;
  drumGain.connect(lp);

  function playKick(t) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.4, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g);
    g.connect(drumGain);
    o.start(t);
    o.stop(t + 0.2);
  }

  function playHat(t) {
    const len = Math.floor(ac.sampleRate * 0.04);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = ac.createGain();
    g.gain.value = 0.12;
    src.connect(f);
    f.connect(g);
    g.connect(drumGain);
    src.start(t);
  }

  function playDrums() {
    const now = ac.currentTime;
    // Kick on beats 1 and 3 (of 4), hats on every eighth.
    playKick(now);
    playKick(now + 2.0);
    for (let i = 0; i < 8; i++) playHat(now + i * 0.5);
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

export function stopBackgroundMusic() {
  if (bgNodes) bgNodes.stop();
}

const hiloSound = { playDeal, playWin, playLoss, playCollect, startBackgroundMusic, stopBackgroundMusic };
export default hiloSound;