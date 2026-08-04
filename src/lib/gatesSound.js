// Gates of Olympus — complete magical sound suite (Web Audio API synthesis).
// All sounds respect the global mute flag. Each sound is carefully crafted
// to match the divine/magical Olympus theme per the design prompt.
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

// ── Shared reverb bus ──────────────────────────────────────────────────
// A short feedback delay used by most sounds for a tasteful celestial tail.
function makeReverbBus(ac, delayTime = 0.11, feedback = 0.22, mix = 0.3) {
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
  return { bus, delay, fb, delayMix };
}

// ── UI CLICK — short magical metallic click with celestial sparkle ──────
export function playUIClick() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.06, 0.12, 0.2);

  // Metallic click — two quick high partials.
  [2200, 3300].forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.06 - i * 0.02, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 0.1);
  });

  // Celestial sparkle — tiny high sine ping.
  const sp = ac.createOscillator();
  const spG = ac.createGain();
  sp.type = 'sine';
  sp.frequency.setValueAtTime(4186, t);
  spG.gain.setValueAtTime(0.0001, t);
  spG.gain.linearRampToValueAtTime(0.02, t + 0.005);
  spG.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  sp.connect(spG);
  spG.connect(bus);
  sp.start(t);
  sp.stop(t + 0.14);
}

// ── BUTTON HOVER — extremely subtle celestial shimmer ──────────────────
export function playButtonHover() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.08, 0.1, 0.15);

  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(2616, t);
  o.frequency.exponentialRampToValueAtTime(3136, t + 0.15);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.015, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g);
  g.connect(bus);
  o.start(t);
  o.stop(t + 0.22);
}

// ── BUTTON PRESS — short deep magical click ────────────────────────────
export function playButtonPress() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.05, 0.1, 0.15);

  // Deep click — low sine with quick decay.
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(120, t + 0.06);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.08, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  o.connect(g);
  g.connect(bus);
  o.start(t);
  o.stop(t + 0.12);

  // Metallic edge.
  const o2 = ac.createOscillator();
  const g2 = ac.createGain();
  o2.type = 'sine';
  o2.frequency.setValueAtTime(1600, t);
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.linearRampToValueAtTime(0.025, t + 0.002);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o2.connect(g2);
  g2.connect(bus);
  o2.start(t);
  o2.stop(t + 0.08);
}

// ── SPIN START — fast rising magical whoosh + deep thunder pulse ────────
export function playSpinSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.1, 0.2, 0.25);

  // Rising whoosh — filtered noise sweep up.
  const dur = 0.35;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const n = ac.createBufferSource();
  n.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(400, t);
  bp.frequency.exponentialRampToValueAtTime(4000, t + 0.3);
  bp.Q.value = 2;
  const nG = ac.createGain();
  nG.gain.setValueAtTime(0.0001, t);
  nG.gain.linearRampToValueAtTime(0.08, t + 0.1);
  nG.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  n.connect(bp);
  bp.connect(nG);
  nG.connect(bus);
  n.start(t);
  n.stop(t + dur);

  // Rising magical tone.
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(880, t + 0.3);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.04, t + 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  o.connect(g);
  g.connect(bus);
  o.start(t);
  o.stop(t + 0.4);

  // Deep thunder pulse — at the end of the whoosh.
  const thunder = ac.createOscillator();
  const thG = ac.createGain();
  thunder.type = 'sine';
  thunder.frequency.setValueAtTime(60, t + 0.3);
  thunder.frequency.exponentialRampToValueAtTime(40, t + 0.6);
  thG.gain.setValueAtTime(0.0001, t + 0.3);
  thG.gain.linearRampToValueAtTime(0.12, t + 0.33);
  thG.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  thunder.connect(thG);
  thG.connect(bus);
  thunder.start(t + 0.3);
  thunder.stop(t + 0.75);
}

// ── SYMBOL LAND — short crystal impact with tiny electric spark ─────────
// Plays per reel as symbols settle into place. Pitch climbs per reel.
export function playReelDropSound(reelIndex = 0) {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.07, 0.15, 0.22);

  const baseFreq = 880 * Math.pow(2, reelIndex / 12);

  // Crystal impact — bright sine with quick decay.
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(baseFreq, t);
  o.frequency.exponentialRampToValueAtTime(baseFreq * 0.98, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.1, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  o.connect(g);
  g.connect(bus);
  o.start(t);
  o.stop(t + 0.17);

  // Crystal partials — inharmonic high tones for the "crystal" character.
  [2.4, 3.8].forEach((ratio) => {
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(baseFreq * ratio, t);
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.linearRampToValueAtTime(0.03, t + 0.002);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o2.connect(g2);
    g2.connect(bus);
    o2.start(t);
    o2.stop(t + 0.12);
  });

  // Tiny electric spark — very short high noise transient.
  const sdur = 0.015;
  const sbuf = ac.createBuffer(1, Math.floor(ac.sampleRate * sdur), ac.sampleRate);
  const sdata = sbuf.getChannelData(0);
  for (let i = 0; i < sdata.length; i++) sdata[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sdata.length, 3);
  const sn = ac.createBufferSource();
  sn.buffer = sbuf;
  const sHP = ac.createBiquadFilter();
  sHP.type = 'highpass';
  sHP.frequency.value = 6000;
  const sG = ac.createGain();
  sG.gain.value = 0.03;
  sn.connect(sHP);
  sHP.connect(sG);
  sG.connect(bus);
  sn.start(t);
}

// ── MATCH/WIN — bright ascending magical chime, stronger with bigger wins
// Also used as the CASCADE/TUMBLE CHAIN sound — pass cascadeIndex to make
// each consecutive cascade slightly more energetic (higher + richer).
export function playWinSound(winAmount = 0, bet = 1, cascadeIndex = 0) {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.12, 0.25, 0.32);

  // Energy rises with cascade index (pitch shift up + extra note).
  const cascadeShift = cascadeIndex * 1.5; // semitones
  const energy = 1 + cascadeIndex * 0.15;

  const ratio = bet > 0 ? winAmount / bet : 0;
  const big = ratio >= 10;
  const huge = ratio >= 50;
  const baseNotes = huge
    ? [523.25, 659.25, 783.99, 1046.5, 1318.51]
    : big
      ? [523.25, 659.25, 783.99, 1046.5]
      : [523.25, 659.25, 783.99];
  // Add an extra top note per cascade for the "building" effect.
  const notes = cascadeIndex > 0
    ? [...baseNotes, 1568 * Math.pow(2, cascadeShift / 12)]
    : baseNotes.map((f) => f * Math.pow(2, cascadeShift / 12));

  notes.forEach((f, i) => {
    const start = t + i * 0.055;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, start);
    o.frequency.exponentialRampToValueAtTime(f * 1.003, start + 0.5);
    const peak = 0.1 * energy;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(Math.min(peak, 0.16), start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    o.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + 0.55);

    // Magical shimmer partial.
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(f * 2.76, start);
    g2.gain.setValueAtTime(0.0001, start);
    g2.gain.linearRampToValueAtTime(0.03 * energy, start + 0.006);
    g2.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    o2.connect(g2);
    g2.connect(bus);
    o2.start(start);
    o2.stop(start + 0.35);
  });

  // Celestial shimmer sweep for bigger wins or cascades.
  if (big || cascadeIndex > 0) {
    const shimmer = ac.createOscillator();
    const shimmerG = ac.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(1568, t);
    shimmer.frequency.exponentialRampToValueAtTime(huge ? 4186 : 3136, t + 0.5);
    shimmerG.gain.setValueAtTime(0.0001, t);
    shimmerG.gain.linearRampToValueAtTime(0.035 * energy, t + 0.06);
    shimmerG.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    shimmer.connect(shimmerG);
    shimmerG.connect(bus);
    shimmer.start(t);
    shimmer.stop(t + 0.65);
  }
}

// ── BIG WIN — powerful orchestral rise, golden chimes, thunder, sparkle ─
export function playBigWin() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.14, 0.3, 0.35);

  // Orchestral rise — ascending chord progression.
  const chords = [
    [261.63, 329.63, 392.0],   // C major
    [293.66, 369.99, 440.0],   // D minor
    [349.23, 440.0, 523.25],   // F major
    [392.0, 493.88, 587.33],   // G major
    [523.25, 659.25, 783.99],  // C major (octave up)
  ];
  chords.forEach((chord, ci) => {
    const start = t + ci * 0.12;
    chord.forEach((f) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.06, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
      o.connect(g);
      g.connect(bus);
      o.start(start);
      o.stop(start + 0.45);
    });
  });

  // Layered golden chimes — bright arpeggio on top.
  const chimes = [1046.5, 1318.51, 1568, 2093, 2637];
  chimes.forEach((f, i) => {
    const start = t + i * 0.08;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.08, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    o.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + 0.55);
  });

  // Deep thunder impact.
  const thunder = ac.createOscillator();
  const thG = ac.createGain();
  thunder.type = 'sine';
  thunder.frequency.setValueAtTime(55, t + 0.5);
  thunder.frequency.exponentialRampToValueAtTime(35, t + 1.2);
  thG.gain.setValueAtTime(0.0001, t + 0.5);
  thG.gain.linearRampToValueAtTime(0.15, t + 0.55);
  thG.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
  thunder.connect(thG);
  thG.connect(bus);
  thunder.start(t + 0.5);
  thunder.stop(t + 1.35);

  // Sparkling magical tail — high shimmer sweep.
  const shimmer = ac.createOscillator();
  const shimmerG = ac.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(2093, t + 0.4);
  shimmer.frequency.exponentialRampToValueAtTime(4186, t + 1.2);
  shimmerG.gain.setValueAtTime(0.0001, t + 0.4);
  shimmerG.gain.linearRampToValueAtTime(0.04, t + 0.5);
  shimmerG.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
  shimmer.connect(shimmerG);
  shimmerG.connect(bus);
  shimmer.start(t + 0.4);
  shimmer.stop(t + 1.35);
}

// ── HUGE WIN — long cinematic build, multiple thunder, celestial, resolution
export function playHugeWin() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.16, 0.35, 0.4);

  // Cinematic build-up — slow ascending chord progression over 2s.
  const chords = [
    { time: 0,    notes: [130.81, 164.81, 196.0] },    // C major
    { time: 0.4,  notes: [146.83, 174.61, 220.0] },    // D minor
    { time: 0.8,  notes: [174.61, 220.0, 261.63] },    // F major
    { time: 1.2,  notes: [196.0, 246.94, 293.66] },    // G major
    { time: 1.6,  notes: [261.63, 329.63, 392.0, 523.25] }, // C major
    { time: 2.0,  notes: [523.25, 659.25, 783.99, 1046.5] }, // C major octave
  ];
  chords.forEach(({ time: dt, notes }) => {
    const start = t + dt;
    notes.forEach((f) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.05, start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
      o.connect(g);
      g.connect(bus);
      o.start(start);
      o.stop(start + 0.65);
    });
  });

  // Multiple thunder impacts at key moments.
  [0, 0.8, 1.6, 2.4].forEach((dt) => {
    const start = t + dt;
    const thunder = ac.createOscillator();
    const thG = ac.createGain();
    thunder.type = 'sine';
    thunder.frequency.setValueAtTime(50, start);
    thunder.frequency.exponentialRampToValueAtTime(30, start + 0.5);
    thG.gain.setValueAtTime(0.0001, start);
    thG.gain.linearRampToValueAtTime(0.12, start + 0.03);
    thG.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
    thunder.connect(thG);
    thG.connect(bus);
    thunder.start(start);
    thunder.stop(start + 0.65);
  });

  // Sparkling celestial elements — continuous shimmer sweeps.
  [0.3, 1.0, 1.7, 2.3].forEach((dt) => {
    const start = t + dt;
    const shimmer = ac.createOscillator();
    const shimmerG = ac.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(1568, start);
    shimmer.frequency.exponentialRampToValueAtTime(4186, start + 0.4);
    shimmerG.gain.setValueAtTime(0.0001, start);
    shimmerG.gain.linearRampToValueAtTime(0.035, start + 0.05);
    shimmerG.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    shimmer.connect(shimmerG);
    shimmerG.connect(bus);
    shimmer.start(start);
    shimmer.stop(start + 0.55);
  });

  // Powerful final resolution — big chord + thunder.
  const finalT = t + 2.4;
  [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, finalT);
    g.gain.setValueAtTime(0.0001, finalT);
    g.gain.linearRampToValueAtTime(0.08, finalT + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, finalT + 1.0);
    o.connect(g);
    g.connect(bus);
    o.start(finalT);
    o.stop(finalT + 1.1);
  });
  const finalThunder = ac.createOscillator();
  const ftG = ac.createGain();
  finalThunder.type = 'sine';
  finalThunder.frequency.setValueAtTime(45, finalT);
  finalThunder.frequency.exponentialRampToValueAtTime(28, finalT + 0.8);
  ftG.gain.setValueAtTime(0.0001, finalT);
  ftG.gain.linearRampToValueAtTime(0.18, finalT + 0.05);
  ftG.gain.exponentialRampToValueAtTime(0.0001, finalT + 1.0);
  finalThunder.connect(ftG);
  ftG.connect(bus);
  finalThunder.start(finalT);
  finalThunder.stop(finalT + 1.1);
}

// ── SUPER WIN — premium luxury celebration: golden fanfare + chimes + thunder
// Triggered at x20+ win ratio. Rich, warm, triumphant — but not as massive as mega.
export function playSuperWin() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.16, 0.32, 0.38);

  // Warm brass fanfare — ascending major arpeggio.
  const fanfare = [
    { f: 392.0, time: 0, dur: 0.18 },
    { f: 523.25, time: 0.16, dur: 0.18 },
    { f: 659.25, time: 0.32, dur: 0.18 },
    { f: 783.99, time: 0.48, dur: 0.35 },
    { f: 1046.5, time: 0.78, dur: 0.6 },
  ];
  fanfare.forEach(({ f, time: dt, dur }) => {
    const start = t + dt;
    const o = ac.createOscillator();
    const g = ac.createGain();
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.07, start + 0.02);
    g.gain.linearRampToValueAtTime(0.045, start + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(lp); lp.connect(g); g.connect(bus);
    o.start(start); o.stop(start + dur + 0.05);
  });

  // Layered golden chimes — bright arpeggio on top.
  const chimes = [1046.5, 1318.51, 1568, 2093, 2637];
  chimes.forEach((f, i) => {
    const start = t + i * 0.1;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.09, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
    o.connect(g); g.connect(bus);
    o.start(start); o.stop(start + 0.65);
  });

  // Deep thunder impact.
  const thunder = ac.createOscillator();
  const thG = ac.createGain();
  thunder.type = 'sine';
  thunder.frequency.setValueAtTime(55, t + 0.5);
  thunder.frequency.exponentialRampToValueAtTime(35, t + 1.4);
  thG.gain.setValueAtTime(0.0001, t + 0.5);
  thG.gain.linearRampToValueAtTime(0.16, t + 0.55);
  thG.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
  thunder.connect(thG); thG.connect(bus);
  thunder.start(t + 0.5); thunder.stop(t + 1.55);

  // Sparkling magical tail.
  const shimmer = ac.createOscillator();
  const shimmerG = ac.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(2093, t + 0.4);
  shimmer.frequency.exponentialRampToValueAtTime(4186, t + 1.3);
  shimmerG.gain.setValueAtTime(0.0001, t + 0.4);
  shimmerG.gain.linearRampToValueAtTime(0.045, t + 0.5);
  shimmerG.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
  shimmer.connect(shimmerG); shimmerG.connect(bus);
  shimmer.start(t + 0.4); shimmer.stop(t + 1.45);
}

// ── MEGA WIN — epic cinematic luxury: full orchestra, choir, thunder, sparkle
// Triggered at x50+ win ratio. The grandest celebration — long, rich, majestic.
export function playMegaWin() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.2, 0.38, 0.42);

  // Cinematic orchestral build — slow ascending chord progression over 2.5s.
  const chords = [
    { time: 0,    notes: [130.81, 196.0, 261.63] },
    { time: 0.5,  notes: [146.83, 220.0, 293.66] },
    { time: 1.0,  notes: [174.61, 261.63, 349.23] },
    { time: 1.5,  notes: [196.0, 293.66, 392.0] },
    { time: 2.0,  notes: [261.63, 392.0, 523.25, 659.25] },
    { time: 2.5,  notes: [523.25, 659.25, 783.99, 1046.5] },
  ];
  chords.forEach(({ time: dt, notes }) => {
    const start = t + dt;
    notes.forEach((f) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 4000;
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.055, start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
      o.connect(lp); lp.connect(g); g.connect(bus);
      o.start(start); o.stop(start + 0.75);
    });
  });

  // Heavenly choir — stacked high sine partials (major chord).
  const choir = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  choir.forEach((f) => {
    const start = t + 0.3;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, start);
    o.frequency.exponentialRampToValueAtTime(f * 1.006, start + 2.0);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.035, start + 0.3);
    g.gain.linearRampToValueAtTime(0.03, start + 1.6);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 2.1);
    o.connect(g); g.connect(bus);
    o.start(start); o.stop(start + 2.15);
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(f * 1.006, start);
    g2.gain.setValueAtTime(0.0001, start);
    g2.gain.linearRampToValueAtTime(0.018, start + 0.3);
    g2.gain.exponentialRampToValueAtTime(0.0001, start + 2.1);
    o2.connect(g2); g2.connect(bus);
    o2.start(start); o2.stop(start + 2.15);
  });

  // Multiple thunder impacts at key moments.
  [0, 0.8, 1.6, 2.5, 3.2].forEach((dt) => {
    const start = t + dt;
    const thunder = ac.createOscillator();
    const thG = ac.createGain();
    thunder.type = 'sine';
    thunder.frequency.setValueAtTime(48, start);
    thunder.frequency.exponentialRampToValueAtTime(28, start + 0.6);
    thG.gain.setValueAtTime(0.0001, start);
    thG.gain.linearRampToValueAtTime(0.14, start + 0.04);
    thG.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
    thunder.connect(thG); thG.connect(bus);
    thunder.start(start); thunder.stop(start + 0.75);
  });

  // Continuous celestial shimmer sweeps.
  [0.3, 1.1, 1.9, 2.7].forEach((dt) => {
    const start = t + dt;
    const shimmer = ac.createOscillator();
    const shimmerG = ac.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(1568, start);
    shimmer.frequency.exponentialRampToValueAtTime(4186, start + 0.5);
    shimmerG.gain.setValueAtTime(0.0001, start);
    shimmerG.gain.linearRampToValueAtTime(0.04, start + 0.06);
    shimmerG.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
    shimmer.connect(shimmerG); shimmerG.connect(bus);
    shimmer.start(start); shimmer.stop(start + 0.65);
  });

  // Golden chime cascade — bright arpeggio throughout.
  const chimes = [1046.5, 1318.51, 1568, 2093, 2637, 3136];
  chimes.forEach((f, i) => {
    const start = t + i * 0.12;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.08, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
    o.connect(g); g.connect(bus);
    o.start(start); o.stop(start + 0.75);
  });

  // Powerful final resolution — big chord + thunder.
  const finalT = t + 3.2;
  [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, finalT);
    g.gain.setValueAtTime(0.0001, finalT);
    g.gain.linearRampToValueAtTime(0.09, finalT + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, finalT + 1.2);
    o.connect(g); g.connect(bus);
    o.start(finalT); o.stop(finalT + 1.3);
  });
  const finalThunder = ac.createOscillator();
  const ftG = ac.createGain();
  finalThunder.type = 'sine';
  finalThunder.frequency.setValueAtTime(42, finalT);
  finalThunder.frequency.exponentialRampToValueAtTime(25, finalT + 1.0);
  ftG.gain.setValueAtTime(0.0001, finalT);
  ftG.gain.linearRampToValueAtTime(0.2, finalT + 0.05);
  ftG.gain.exponentialRampToValueAtTime(0.0001, finalT + 1.1);
  finalThunder.connect(ftG); ftG.connect(bus);
  finalThunder.start(finalT); finalThunder.stop(finalT + 1.2);
}

// ── MULTIPLIER LAND — dramatic lightning strike + magical resonance ─────
export function playMultLand() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.1, 0.25, 0.3);

  // Lightning crack — sharp high noise burst with fast decay.
  const dur = 0.12;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  const n = ac.createBufferSource();
  n.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 2000;
  const nG = ac.createGain();
  nG.gain.value = 0.12;
  n.connect(hp);
  hp.connect(nG);
  nG.connect(bus);
  n.start(t);

  // Lightning zap — descending square wave.
  const zap = ac.createOscillator();
  const zapG = ac.createGain();
  zap.type = 'square';
  zap.frequency.setValueAtTime(3000, t);
  zap.frequency.exponentialRampToValueAtTime(200, t + 0.1);
  zapG.gain.setValueAtTime(0.0001, t);
  zapG.gain.linearRampToValueAtTime(0.06, t + 0.002);
  zapG.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  zap.connect(zapG);
  zapG.connect(bus);
  zap.start(t);
  zap.stop(t + 0.14);

  // Magical resonance — rich chord that rings after the strike.
  const chord = [523.25, 659.25, 783.99, 1046.5];
  chord.forEach((f) => {
    const start = t + 0.05;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, start);
    o.frequency.exponentialRampToValueAtTime(f * 1.004, start + 0.8);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.05, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
    o.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + 0.95);
  });
}

// ── MULTIPLIER COLLECT — electric pulses building to celestial impact ───
export function playMultCollect() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.12, 0.28, 0.33);

  // Building electric pulses — each higher and stronger.
  const pulses = [440, 554.37, 659.25, 783.99, 987.77];
  pulses.forEach((f, i) => {
    const start = t + i * 0.06;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, start);
    o.frequency.exponentialRampToValueAtTime(f * 1.01, start + 0.1);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.05 + i * 0.01, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    o.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + 0.14);

    // Electric edge — square wave partial.
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.type = 'square';
    o2.frequency.setValueAtTime(f * 2, start);
    g2.gain.setValueAtTime(0.0001, start);
    g2.gain.linearRampToValueAtTime(0.015, start + 0.003);
    g2.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);
    o2.connect(g2);
    g2.connect(bus);
    o2.start(start);
    o2.stop(start + 0.1);
  });

  // Powerful celestial impact — big chord at the end.
  const impactT = t + 0.35;
  [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, impactT);
    g.gain.setValueAtTime(0.0001, impactT);
    g.gain.linearRampToValueAtTime(0.07, impactT + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, impactT + 0.8);
    o.connect(g);
    g.connect(bus);
    o.start(impactT);
    o.stop(impactT + 0.85);
  });

  // Thunder under the impact.
  const thunder = ac.createOscillator();
  const thG = ac.createGain();
  thunder.type = 'sine';
  thunder.frequency.setValueAtTime(50, impactT);
  thunder.frequency.exponentialRampToValueAtTime(32, impactT + 0.6);
  thG.gain.setValueAtTime(0.0001, impactT);
  thG.gain.linearRampToValueAtTime(0.1, impactT + 0.03);
  thG.gain.exponentialRampToValueAtTime(0.0001, impactT + 0.7);
  thunder.connect(thG);
  thG.connect(bus);
  thunder.start(impactT);
  thunder.stop(impactT + 0.75);
}

// ── FREE SPINS TRIGGER — epic cinematic activation: thunder, choir, sweep ─
export function playFreeSpinsTrigger() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.18, 0.35, 0.4);

  // Thunder roll — deep rumble at the start.
  const thunder = ac.createOscillator();
  const thG = ac.createGain();
  thunder.type = 'sine';
  thunder.frequency.setValueAtTime(45, t);
  thunder.frequency.exponentialRampToValueAtTime(30, t + 1.5);
  thG.gain.setValueAtTime(0.0001, t);
  thG.gain.linearRampToValueAtTime(0.14, t + 0.1);
  thG.gain.linearRampToValueAtTime(0.08, t + 0.8);
  thG.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
  thunder.connect(thG);
  thG.connect(bus);
  thunder.start(t);
  thunder.stop(t + 1.65);

  // Heavenly choir texture — stacked sine partials (major chord, high).
  const choir = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  choir.forEach((f) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t + 0.2);
    o.frequency.exponentialRampToValueAtTime(f * 1.005, t + 1.5);
    g.gain.setValueAtTime(0.0001, t + 0.2);
    g.gain.linearRampToValueAtTime(0.04, t + 0.4);
    g.gain.linearRampToValueAtTime(0.04, t + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.connect(g);
    g.connect(bus);
    o.start(t + 0.2);
    o.stop(t + 1.65);

    // Slight detune for a choir "wobble".
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(f * 1.005, t + 0.2);
    g2.gain.setValueAtTime(0.0001, t + 0.2);
    g2.gain.linearRampToValueAtTime(0.02, t + 0.4);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o2.connect(g2);
    g2.connect(bus);
    o2.start(t + 0.2);
    o2.stop(t + 1.65);
  });

  // Magical energy sweep — rising filtered noise.
  const dur = 1.2;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const n = ac.createBufferSource();
  n.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(500, t);
  bp.frequency.exponentialRampToValueAtTime(5000, t + 1.0);
  bp.Q.value = 3;
  const nG = ac.createGain();
  nG.gain.setValueAtTime(0.0001, t);
  nG.gain.linearRampToValueAtTime(0.05, t + 0.3);
  nG.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
  n.connect(bp);
  bp.connect(nG);
  nG.connect(bus);
  n.start(t);
  n.stop(t + dur);

  // Strong final impact — big chord + thunder at the end.
  const impactT = t + 1.3;
  [523.25, 659.25, 783.99, 1046.5].forEach((f) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, impactT);
    g.gain.setValueAtTime(0.0001, impactT);
    g.gain.linearRampToValueAtTime(0.08, impactT + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, impactT + 0.8);
    o.connect(g);
    g.connect(bus);
    o.start(impactT);
    o.stop(impactT + 0.85);
  });
  const impactThunder = ac.createOscillator();
  const itG = ac.createGain();
  impactThunder.type = 'sine';
  impactThunder.frequency.setValueAtTime(40, impactT);
  impactThunder.frequency.exponentialRampToValueAtTime(25, impactT + 0.7);
  itG.gain.setValueAtTime(0.0001, impactT);
  itG.gain.linearRampToValueAtTime(0.16, impactT + 0.04);
  itG.gain.exponentialRampToValueAtTime(0.0001, impactT + 0.8);
  impactThunder.connect(itG);
  itG.connect(bus);
  impactThunder.start(impactT);
  impactThunder.stop(impactT + 0.85);
}

// ── FREE SPIN START — triumphant celestial fanfare + thunder + shimmer ──
export function playFreeSpinStart() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.15, 0.3, 0.35);

  // Triumphant fanfare — ascending brass-like tones.
  const fanfare = [
    { f: 392.0, time: 0, dur: 0.15 },    // G4
    { f: 523.25, time: 0.15, dur: 0.15 }, // C5
    { f: 659.25, time: 0.3, dur: 0.15 },  // E5
    { f: 783.99, time: 0.45, dur: 0.3 },  // G5
    { f: 1046.5, time: 0.75, dur: 0.5 }, // C6
  ];
  fanfare.forEach(({ f, time: dt, dur }) => {
    const start = t + dt;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, start);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3000;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.06, start + 0.02);
    g.gain.linearRampToValueAtTime(0.04, start + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(lp);
    lp.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + dur + 0.05);
  });

  // Subtle thunder underneath.
  const thunder = ac.createOscillator();
  const thG = ac.createGain();
  thunder.type = 'sine';
  thunder.frequency.setValueAtTime(55, t);
  thunder.frequency.exponentialRampToValueAtTime(35, t + 0.8);
  thG.gain.setValueAtTime(0.0001, t);
  thG.gain.linearRampToValueAtTime(0.06, t + 0.1);
  thG.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  thunder.connect(thG);
  thG.connect(bus);
  thunder.start(t);
  thunder.stop(t + 0.95);

  // Shimmering magical ambience — high sine pad.
  const pad = ac.createOscillator();
  const padG = ac.createGain();
  pad.type = 'sine';
  pad.frequency.setValueAtTime(2093, t);
  pad.frequency.linearRampToValueAtTime(2637, t + 1.0);
  padG.gain.setValueAtTime(0.0001, t);
  padG.gain.linearRampToValueAtTime(0.025, t + 0.2);
  padG.gain.linearRampToValueAtTime(0.02, t + 0.8);
  padG.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
  pad.connect(padG);
  padG.connect(bus);
  pad.start(t);
  pad.stop(t + 1.25);
}

// ── FEATURE END — majestic descending orchestral phrase + sparkle ──────
export function playFeatureEnd() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.16, 0.3, 0.35);

  // Majestic descending phrase — descending chord progression.
  const chords = [
    { time: 0,    notes: [523.25, 659.25, 783.99] },    // C major
    { time: 0.2,  notes: [493.88, 587.33, 739.99] },   // B dim-ish
    { time: 0.4,  notes: [440.0, 523.25, 659.25] },     // A minor
    { time: 0.6,  notes: [392.0, 493.88, 587.33] },    // G major
    { time: 0.8,  notes: [349.23, 440.0, 523.25] },    // F major
    { time: 1.0,  notes: [261.63, 329.63, 392.0] },    // C major (resolve)
  ];
  chords.forEach(({ time: dt, notes }) => {
    const start = t + dt;
    notes.forEach((f) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.05, start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
      o.connect(g);
      g.connect(bus);
      o.start(start);
      o.stop(start + 0.45);
    });
  });

  // Soft magical sparkle — descending high shimmer.
  const shimmer = ac.createOscillator();
  const shimmerG = ac.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(3136, t);
  shimmer.frequency.exponentialRampToValueAtTime(1568, t + 1.2);
  shimmerG.gain.setValueAtTime(0.0001, t);
  shimmerG.gain.linearRampToValueAtTime(0.03, t + 0.1);
  shimmerG.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
  shimmer.connect(shimmerG);
  shimmerG.connect(bus);
  shimmer.start(t);
  shimmer.stop(t + 1.35);
}

// ── ERROR/INVALID ACTION — soft low magical pulse, not harsh ───────────
export function playError() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.08, 0.12, 0.18);

  // Soft low pulse — descending low sine.
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(110, t + 0.2);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.06, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  o.connect(g);
  g.connect(bus);
  o.start(t);
  o.stop(t + 0.3);

  // Soft magical undertone — low warm sine.
  const o2 = ac.createOscillator();
  const g2 = ac.createGain();
  o2.type = 'sine';
  o2.frequency.setValueAtTime(130, t);
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.linearRampToValueAtTime(0.03, t + 0.03);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o2.connect(g2);
  g2.connect(bus);
  o2.start(t);
  o2.stop(t + 0.25);
}

// ── COUNT UP — rapid golden ticks while the win amount counts up ──────────
// Plays a stream of bright metallic chime ticks that climb in pitch as the
// count rises, creating a premium "counting money" feel. Duration matches
// the banner count-up (~2.6s).
export function playCountUp(duration = 2600) {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.06, 0.12, 0.18);

  // Number of ticks — roughly 2 per beat, accelerating slightly near the end.
  const tickCount = Math.max(8, Math.floor(duration / 90));
  for (let i = 0; i < tickCount; i++) {
    const p = i / tickCount;
    const start = t + p * duration;
    // Pitch climbs from ~880Hz to ~1760Hz across the count.
    const freq = 880 * Math.pow(2, (p * 12) / 12);
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.05, start + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.07);
    o.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + 0.08);

    // Metallic edge partial for a "coin" character.
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(freq * 2.76, start);
    g2.gain.setValueAtTime(0.0001, start);
    g2.gain.linearRampToValueAtTime(0.015, start + 0.002);
    g2.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
    o2.connect(g2);
    g2.connect(bus);
    o2.start(start);
    o2.stop(start + 0.06);
  }

  // Final resolution chime at the end of the count.
  const finalT = t + duration;
  [1046.5, 1318.51, 1568].forEach((f) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, finalT);
    g.gain.setValueAtTime(0.0001, finalT);
    g.gain.linearRampToValueAtTime(0.06, finalT + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, finalT + 0.5);
    o.connect(g);
    g.connect(bus);
    o.start(finalT);
    o.stop(finalT + 0.55);
  });
}

// ── Scatter landing — premium golden chime arpeggio (kept for scatter) ──
export function playScatterDropSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t0 = ac.currentTime;
  const { bus } = makeReverbBus(ac, 0.12, 0.25, 0.35);

  // Golden bell arpeggio — E5, A5, C#6, E6 (bright, divine, ascending).
  const notes = [659.25, 880.0, 1108.73, 1318.51];
  notes.forEach((f, i) => {
    const start = t0 + i * 0.07;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, start);
    o.frequency.exponentialRampToValueAtTime(f * 1.004, start + 0.6);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.14, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);
    o.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + 0.7);
  });

  // Divine shimmer — high sine sweep on top for a golden sparkle.
  const shimmer = ac.createOscillator();
  const shimmerG = ac.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(2093, t0);
  shimmer.frequency.exponentialRampToValueAtTime(3520, t0 + 0.5);
  shimmerG.gain.setValueAtTime(0.0001, t0);
  shimmerG.gain.linearRampToValueAtTime(0.05, t0 + 0.06);
  shimmerG.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
  shimmer.connect(shimmerG);
  shimmerG.connect(bus);
  shimmer.start(t0);
  shimmer.stop(t0 + 0.6);
}