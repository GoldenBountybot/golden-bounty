// Argonauts — spin button click sound (Web Audio API).
// Reuses the same spin-button sound as Crown Coins for consistency.
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

const SPIN_SOUND_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/8c2379326_spinbuttonx.mp3';
let spinBuffer = null;
let spinLoaded = false;

function loadSpinSound() {
  if (spinLoaded) return;
  spinLoaded = true;
  const ac = getCtx();
  fetch(SPIN_SOUND_URL)
    .then(r => r.arrayBuffer())
    .then(ab => (ac ? ac.decodeAudioData(ab) : null))
    .then(buf => { if (buf) spinBuffer = buf; })
    .catch(() => {});
}

// Preload immediately so the sound is ready before the first spin.
loadSpinSound();

export function playSpinSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (!spinBuffer) { loadSpinSound(); return; }
  try {
    const src = ac.createBufferSource();
    src.buffer = spinBuffer;
    const g = ac.createGain();
    g.gain.value = 2.2;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
  } catch { /* ignore */ }
}

// Premium luxury reel-land sound — a soft golden harp string pluck with warm
// wooden resonance, a gentle overtone cascade, and a tasteful reverb tail.
// Distinct from a marimba chime: a plucked-string character that rings and
// decays naturally. Light, elegant, and relaxing — no heavy thud.
export function playReelLandSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;

  // Shared reverb-ish bus: a short feedback delay for a tasteful tail.
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.15;
  const fb = ac.createGain();
  fb.gain.value = 0.26;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.30;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);

  // 1) Golden harp pluck — a warm fundamental with two soft overtones that
  //    ring out like a plucked string. Slight pitch glide up on the attack
  //    gives it a living, organic feel.
  const pluckFreqs = [523.25, 659.25, 783.99]; // C5, E5, G5 — a warm major chord
  pluckFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f * 0.992, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.02);
    const peak = [0.14, 0.07, 0.045][i];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42 - i * 0.08);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 0.44);
  });

  // 2) Warm wooden body resonance — a low sine that breathes gently under
  //    the pluck, giving it a grounded, crafted character.
  const body = ac.createOscillator();
  const bodyG = ac.createGain();
  body.type = 'sine';
  body.frequency.setValueAtTime(130.81, t); // C3
  bodyG.gain.setValueAtTime(0.0001, t);
  bodyG.gain.linearRampToValueAtTime(0.06, t + 0.01);
  bodyG.gain.exponentialRampToValueAtTime(0.0001, t + 0.30);
  body.connect(bodyG);
  bodyG.connect(bus);
  body.start(t);
  body.stop(t + 0.32);

  // 3) Airy breath transient — a whisper of filtered noise at the pluck
  //    attack so the string feels like it was just touched.
  const dur = 0.05;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  }
  const n = ac.createBufferSource();
  n.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2400;
  bp.Q.value = 1.2;
  const nG = ac.createGain();
  nG.gain.value = 0.04;
  n.connect(bp);
  bp.connect(nG);
  nG.connect(bus);
  n.start(t);
}

// ---- Per-symbol win sounds ----
// Each line-paying symbol has its own distinct ~1s luxury SFX, synthesized
// via Web Audio. Played when a winning line lands.

function makeReverbBus(ac) {
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.14;
  const fb = ac.createGain();
  fb.gain.value = 0.22;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.28;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);
  return bus;
}

function noiseBuffer(ac, dur, decayPow = 2.5) {
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, decayPow);
  return buf;
}

// 1. Dove — soft feather flutter + tiny airy whoosh
function playDoveSound(ac, bus, t) {
  // Feather flutter — quick bandpass noise bursts
  for (let i = 0; i < 5; i++) {
    const n = ac.createBufferSource();
    n.buffer = noiseBuffer(ac, 0.06, 2);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3200 + i * 200;
    bp.Q.value = 1.5;
    const g = ac.createGain();
    g.gain.value = 0.05;
    n.connect(bp); bp.connect(g); g.connect(bus);
    n.start(t + i * 0.07);
  }
  // Airy whoosh — falling bandpass noise
  const w = ac.createBufferSource();
  w.buffer = noiseBuffer(ac, 0.4, 1.8);
  const wp = ac.createBiquadFilter();
  wp.type = 'bandpass';
  wp.frequency.setValueAtTime(2600, t + 0.35);
  wp.frequency.exponentialRampToValueAtTime(900, t + 0.75);
  wp.Q.value = 0.8;
  const wg = ac.createGain();
  wg.gain.setValueAtTime(0.0001, t + 0.35);
  wg.gain.linearRampToValueAtTime(0.06, t + 0.42);
  wg.gain.exponentialRampToValueAtTime(0.0001, t + 0.78);
  w.connect(wp); wp.connect(wg); wg.connect(bus);
  w.start(t + 0.35);
}

// 2. Amphora — ceramic resonance + warm metallic shimmer + deep echo
function playAmphoraSound(ac, bus, t) {
  // Ceramic resonance — a resonant tone that rings briefly
  [560, 840].forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.985, t + 0.3);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime([0.12, 0.06][i], t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4 - i * 0.08);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + 0.42);
  });
  // Warm metallic shimmer
  const m = ac.createOscillator();
  const mg = ac.createGain();
  m.type = 'sine';
  m.frequency.setValueAtTime(1680, t);
  mg.gain.setValueAtTime(0.0001, t);
  mg.gain.linearRampToValueAtTime(0.04, t + 0.01);
  mg.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  m.connect(mg); mg.connect(bus);
  m.start(t); m.stop(t + 0.36);
  // Deep echo
  const d = ac.createOscillator();
  const dg = ac.createGain();
  d.type = 'sine';
  d.frequency.setValueAtTime(180, t + 0.12);
  dg.gain.setValueAtTime(0.0001, t + 0.12);
  dg.gain.linearRampToValueAtTime(0.07, t + 0.14);
  dg.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  d.connect(dg); dg.connect(bus);
  d.start(t + 0.12); d.stop(t + 0.62);
}

// 3. Golden Lyre — 2-3 bright ascending harp strings + sparkling resonance
function playLyreSound(ac, bus, t) {
  const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 ascending
  freqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f * 0.99, t + i * 0.09);
    o.frequency.exponentialRampToValueAtTime(f, t + i * 0.09 + 0.015);
    g.gain.setValueAtTime(0.0001, t + i * 0.09);
    g.gain.linearRampToValueAtTime(0.13, t + i * 0.09 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.5);
    o.connect(g); g.connect(bus);
    o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.52);
  });
  // Sparkling resonance — high overtone
  const s = ac.createOscillator();
  const sg = ac.createGain();
  s.type = 'sine';
  s.frequency.setValueAtTime(2093, t + 0.18); // C7
  sg.gain.setValueAtTime(0.0001, t + 0.18);
  sg.gain.linearRampToValueAtTime(0.04, t + 0.2);
  sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  s.connect(sg); sg.connect(bus);
  s.start(t + 0.18); s.stop(t + 0.72);
}

// 4. Spartan Warrior (wild) — metal armor movement + heroic metallic impact + brass shimmer
function playSpartanSound(ac, bus, t) {
  // Metal armor movement — high-passed noise shimmer
  const a = ac.createBufferSource();
  a.buffer = noiseBuffer(ac, 0.18, 1.5);
  const ap = ac.createBiquadFilter();
  ap.type = 'highpass';
  ap.frequency.value = 4000;
  const ag = ac.createGain();
  ag.gain.setValueAtTime(0.0001, t);
  ag.gain.linearRampToValueAtTime(0.05, t + 0.02);
  ag.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  a.connect(ap); ap.connect(ag); ag.connect(bus);
  a.start(t);
  // Heroic metallic impact — two quick metallic clinks
  [1320, 1760].forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(f, t + 0.18 + i * 0.04);
    o.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.18 + i * 0.04 + 0.12);
    g.gain.setValueAtTime(0.0001, t + 0.18 + i * 0.04);
    g.gain.linearRampToValueAtTime(0.09, t + 0.18 + i * 0.04 + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18 + i * 0.04 + 0.14);
    o.connect(g); g.connect(bus);
    o.start(t + 0.18 + i * 0.04); o.stop(t + 0.18 + i * 0.04 + 0.16);
  });
  // Warm brass-like shimmer
  const b = ac.createOscillator();
  const bg = ac.createGain();
  b.type = 'sawtooth';
  b.frequency.setValueAtTime(440, t + 0.28);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1800;
  bg.gain.setValueAtTime(0.0001, t + 0.28);
  bg.gain.linearRampToValueAtTime(0.05, t + 0.3);
  bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  b.connect(lp); lp.connect(bg); bg.connect(bus);
  b.start(t + 0.28); b.stop(t + 0.72);
}

// 5. Green Dragon (lizard) — soft low growl + breath whoosh + deep resonance
function playDragonSound(ac, bus, t) {
  // Low growl — low sawtooth with vibrato, low-passed
  const o = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(90, t);
  o.frequency.linearRampToValueAtTime(70, t + 0.6);
  // vibrato
  const lfo = ac.createOscillator();
  const lfoG = ac.createGain();
  lfo.frequency.value = 18;
  lfoG.gain.value = 8;
  lfo.connect(lfoG); lfoG.connect(o.frequency);
  lp.type = 'lowpass';
  lp.frequency.value = 400;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.12, t + 0.08);
  g.gain.linearRampToValueAtTime(0.10, t + 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  o.connect(lp); lp.connect(g); g.connect(bus);
  o.start(t); o.stop(t + 0.92);
  lfo.start(t); lfo.stop(t + 0.92);
  // Breath whoosh — bandpass noise sweep
  const w = ac.createBufferSource();
  w.buffer = noiseBuffer(ac, 0.5, 1.5);
  const wp = ac.createBiquadFilter();
  wp.type = 'bandpass';
  wp.frequency.setValueAtTime(500, t + 0.2);
  wp.frequency.exponentialRampToValueAtTime(1400, t + 0.6);
  wp.Q.value = 1.0;
  const wg = ac.createGain();
  wg.gain.setValueAtTime(0.0001, t + 0.2);
  wg.gain.linearRampToValueAtTime(0.05, t + 0.3);
  wg.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  w.connect(wp); wp.connect(wg); wg.connect(bus);
  w.start(t + 0.2);
  // Deep resonance
  const d = ac.createOscillator();
  const dg = ac.createGain();
  d.type = 'sine';
  d.frequency.setValueAtTime(55, t);
  dg.gain.setValueAtTime(0.0001, t);
  dg.gain.linearRampToValueAtTime(0.08, t + 0.1);
  dg.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
  d.connect(dg); dg.connect(bus);
  d.start(t); d.stop(t + 0.9);
}

// 6. Greek Goddess (atlanta) — magical shimmer + delicate harp notes + sparkling tail
function playGoddessSound(ac, bus, t) {
  // Delicate harp-like notes — soft attack sines
  [880, 1108.73, 1318.51].forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t + i * 0.1);
    g.gain.setValueAtTime(0.0001, t + i * 0.1);
    g.gain.linearRampToValueAtTime(0.07, t + i * 0.1 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 0.5);
    o.connect(g); g.connect(bus);
    o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.52);
  });
  // Magical shimmer — two high sines with slow swell
  [2637, 3136].forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + 0.82);
  });
  // Sparkling tail — very high sine with long decay
  const s = ac.createOscillator();
  const sg = ac.createGain();
  s.type = 'sine';
  s.frequency.setValueAtTime(4186, t + 0.3); // C8
  sg.gain.setValueAtTime(0.0001, t + 0.3);
  sg.gain.linearRampToValueAtTime(0.025, t + 0.36);
  sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
  s.connect(sg); sg.connect(bus);
  s.start(t + 0.3); s.stop(t + 0.97);
}

// 7. Crossed Swords (jason) — two sword clashes + golden metallic shimmer
function playSwordsSound(ac, bus, t) {
  // Two metallic clashes — high triangle with very fast decay
  [0, 0.16].forEach((delay, i) => {
    [1760, 2349].forEach((f, j) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t + delay + j * 0.015);
      o.frequency.exponentialRampToValueAtTime(f * 0.6, t + delay + j * 0.015 + 0.1);
      g.gain.setValueAtTime(0.0001, t + delay + j * 0.015);
      g.gain.linearRampToValueAtTime(0.1, t + delay + j * 0.015 + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + j * 0.015 + 0.12);
      o.connect(g); g.connect(bus);
      o.start(t + delay + j * 0.015); o.stop(t + delay + j * 0.015 + 0.14);
    });
  });
  // Golden metallic shimmer — high sine with medium decay
  const s = ac.createOscillator();
  const sg = ac.createGain();
  s.type = 'sine';
  s.frequency.setValueAtTime(2637, t + 0.34);
  sg.gain.setValueAtTime(0.0001, t + 0.34);
  sg.gain.linearRampToValueAtTime(0.05, t + 0.36);
  sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
  s.connect(sg); sg.connect(bus);
  s.start(t + 0.34); s.stop(t + 0.87);
}

// 8. Potion — magical liquid glug + shimmer
function playPotionSound(ac, bus, t) {
  // Liquid glug — quick sine blips with pitch wobble
  for (let i = 0; i < 4; i++) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    const baseF = [300, 380, 280, 340][i];
    o.frequency.setValueAtTime(baseF, t + i * 0.1);
    o.frequency.exponentialRampToValueAtTime(baseF * 0.6, t + i * 0.1 + 0.08);
    g.gain.setValueAtTime(0.0001, t + i * 0.1);
    g.gain.linearRampToValueAtTime(0.08, t + i * 0.1 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 0.1);
    o.connect(g); g.connect(bus);
    o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.12);
  }
  // Magical shimmer
  const s = ac.createOscillator();
  const sg = ac.createGain();
  s.type = 'sine';
  s.frequency.setValueAtTime(1568, t + 0.1); // G6
  sg.gain.setValueAtTime(0.0001, t + 0.1);
  sg.gain.linearRampToValueAtTime(0.04, t + 0.16);
  sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  s.connect(sg); sg.connect(bus);
  s.start(t + 0.1); s.stop(t + 0.72);
}

// 9. Bow — bowstring twang + arrow whoosh
function playBowSound(ac, bus, t) {
  // Bowstring twang — quick descending triangle
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(880, t);
  o.frequency.exponentialRampToValueAtTime(220, t + 0.18);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.1, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(g); g.connect(bus);
  o.start(t); o.stop(t + 0.24);
  // Arrow whoosh — bandpass noise sweep
  const w = ac.createBufferSource();
  w.buffer = noiseBuffer(ac, 0.5, 1.5);
  const wp = ac.createBiquadFilter();
  wp.type = 'bandpass';
  wp.frequency.setValueAtTime(1200, t + 0.12);
  wp.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
  wp.Q.value = 1.2;
  const wg = ac.createGain();
  wg.gain.setValueAtTime(0.0001, t + 0.12);
  wg.gain.linearRampToValueAtTime(0.06, t + 0.2);
  wg.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
  w.connect(wp); wp.connect(wg); wg.connect(bus);
  w.start(t + 0.12);
}

const SYMBOL_SOUNDS = {
  dove: playDoveSound,
  cup: playAmphoraSound,
  harp: playLyreSound,
  wild: playSpartanSound,
  lizard: playDragonSound,
  atlanta: playGoddessSound,
  jason: playSwordsSound,
  potion: playPotionSound,
  bow: playBowSound,
};

// Plays the distinct win sound for a given line-paying symbol id.
export function playSymbolWinSound(symbol) {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const fn = SYMBOL_SOUNDS[symbol];
  if (!fn) return;
  const bus = makeReverbBus(ac);
  fn(ac, bus, ac.currentTime);
}