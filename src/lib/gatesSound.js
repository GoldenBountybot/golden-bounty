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

// ── Symbol drop — real casino reel-land sample ──────────────────────────
const REEL_DROP_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/ac74277f6_spinrelldropx.mp3';
let dropBuffer = null;
let dropLoaded = false;

function loadDropSound() {
  if (dropLoaded) return;
  dropLoaded = true;
  const ac = getCtx();
  fetch(REEL_DROP_URL)
    .then(r => r.arrayBuffer())
    .then(ab => (ac ? ac.decodeAudioData(ab) : null))
    .then(buf => { if (buf) dropBuffer = buf; })
    .catch(() => {});
}
loadDropSound();

// Plays the real reel-drop sample with a slight pitch shift per reel so the
// 6-reel cascade reads as a descending→ascending sequence (low → high).
export function playReelDropSound(reelIndex = 0) {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (!dropBuffer) { loadDropSound(); return; }
  try {
    const src = ac.createBufferSource();
    src.buffer = dropBuffer;
    // Pitch climbs from reel 0 → reel 5 (semitone steps: 0 → +5 semitones).
    const semitones = reelIndex * 1;
    src.playbackRate.value = Math.pow(2, semitones / 12);
    const g = ac.createGain();
    // Slightly lower volume for higher-pitched reels to keep it balanced.
    g.gain.value = 1.4 - reelIndex * 0.08;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
  } catch { /* ignore */ }
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