// Gates of Olympus — premium casino sounds using real recorded samples.
// Spin button: satisfying mechanical casino click (spinbuttonx.mp3).
// Symbol drop: real reel-land sample (spinrelldropx.mp3) with pitch variation
//   per reel for a cascading feel.
// Scatter: a premium synthesized golden chime arpeggio (divine Olympus theme).
// All sounds respect the global mute flag.
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

// ── Spin button — real casino mechanical click ─────────────────────────
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
    g.gain.value = 2.0;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
  } catch { /* ignore */ }
}

// ── Symbol drop — golden coin tinkle ───────────────────────────────────
// A premium metallic gold-coin drop: a bright metallic "ting" with rich
// inharmonic partials (like a real gold coin landing on marble), a soft
// body resonance, and a short reverb tail. Pitch climbs per reel for a
// cascading sequence. Luxurious and satisfying — no heavy thud.
export function playReelDropSound(reelIndex = 0) {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;

  // Shared reverb-ish bus: a short feedback delay for a tasteful tail.
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.09;
  const fb = ac.createGain();
  fb.gain.value = 0.18;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.28;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);

  // Pitch climbs from reel 0 → reel 5 (C5 → F5, +1 semitone per reel).
  const baseFreq = 523.25 * Math.pow(2, reelIndex / 12);

  // Metallic coin "ting" — inharmonic partials that mimic a real gold coin.
  // A gold coin's ring has partials at roughly 1×, 2.76×, 5.4×, 8.9× of the
  // fundamental — these inharmonic ratios give the bright metallic character.
  const partials = [
    { ratio: 1.0, peak: 0.14, dur: 0.30 },
    { ratio: 2.76, peak: 0.09, dur: 0.22 },
    { ratio: 5.4, peak: 0.05, dur: 0.16 },
    { ratio: 8.9, peak: 0.025, dur: 0.10 },
  ];
  partials.forEach((p) => {
    const f = baseFreq * p.ratio;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.995, t + p.dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(p.peak, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + p.dur);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + p.dur + 0.02);
  });

  // Soft body resonance — a warm low sine for the coin's "thud" body.
  const body = ac.createOscillator();
  const bodyG = ac.createGain();
  body.type = 'sine';
  body.frequency.setValueAtTime(baseFreq * 0.5, t);
  body.frequency.exponentialRampToValueAtTime(baseFreq * 0.48, t + 0.12);
  bodyG.gain.setValueAtTime(0.0001, t);
  bodyG.gain.linearRampToValueAtTime(0.06, t + 0.005);
  bodyG.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  body.connect(bodyG);
  bodyG.connect(bus);
  body.start(t);
  body.stop(t + 0.16);

  // Tiny metallic transient — very short high-passed noise for the initial
  // "clink" attack when the coin hits the surface.
  const dur = 0.02;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
  }
  const n = ac.createBufferSource();
  n.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 4000;
  const nG = ac.createGain();
  nG.gain.value = 0.05;
  n.connect(hp);
  hp.connect(nG);
  nG.connect(bus);
  n.start(t);
}

// ── Scatter landing — premium golden chime arpeggio ───────────────────
// A luxurious ascending arpeggio of crystal bells with a reverb tail,
// played the instant a reel containing a scatter stops. Distinct from the
// reel-drop sample so each scatter reads as a special, rewarding event.
export function playScatterDropSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t0 = ac.currentTime;

  // Shared reverb-ish bus: a short feedback delay for a tasteful tail.
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.12;
  const fb = ac.createGain();
  fb.gain.value = 0.25;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.35;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);

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