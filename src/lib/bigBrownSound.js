// Big Brown — spin button + reel-drop sounds (Web Audio API). Purely cosmetic.
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

// Spin button click sound — same sample as Crown Coins for consistency.
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

// Reel drop sound — a light, high-frequency wooden "tick" played once per reel
// when it lands. Pitch rises slightly per consecutive reel so the sequence of
// 6 drops reads as a single descending cascade: first reel lands lowest, last
// reel lands highest. Soft and short so it never sounds heavy or mechanical.
export function playReelDropSound(reelIndex = 0) {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;

  // Pitch climbs from reel 0 → reel 5 (220Hz → 660Hz).
  const baseFreq = 220 + reelIndex * 88;

  // Wooden marimba-style tick — triangle fundamental + soft fifth overtone.
  const noteFreqs = [baseFreq, baseFreq * 1.5];
  noteFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.97, t + 0.12);
    const peak = [0.10, 0.04][i];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14 - i * 0.03);
    o.connect(g);
    g.connect(ac.destination);
    o.start(t);
    o.stop(t + 0.16);
  });

  // Soft high bell shimmer for sparkle.
  const bell = ac.createOscillator();
  const bellG = ac.createGain();
  bell.type = 'sine';
  bell.frequency.setValueAtTime(baseFreq * 3, t);
  bell.frequency.exponentialRampToValueAtTime(baseFreq * 2.8, t + 0.12);
  bellG.gain.setValueAtTime(0.0001, t);
  bellG.gain.linearRampToValueAtTime(0.03, t + 0.003);
  bellG.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  bell.connect(bellG);
  bellG.connect(ac.destination);
  bell.start(t);
  bell.stop(t + 0.14);

  // Short felt-knock transient — low-passed noise for a soft "thip".
  const dur = 0.035;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.5);
  }
  const n = ac.createBufferSource();
  n.buffer = buf;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2200;
  const nG = ac.createGain();
  nG.gain.value = 0.06;
  n.connect(lp);
  lp.connect(nG);
  nG.connect(ac.destination);
  n.start(t);
}

// Low-value win sound — the user-supplied BigBrown.mp3 sample, played when a
// winning combination is made up of low-value card symbols (A, K, Q, J, 10, 9).
const LOW_WIN_SOUND_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/b0087b27a_BigBrown.mp3';
let lowWinBuffer = null;
let lowWinLoaded = false;

function loadLowWinSound() {
  if (lowWinLoaded) return;
  lowWinLoaded = true;
  const ac = getCtx();
  fetch(LOW_WIN_SOUND_URL)
    .then(r => r.arrayBuffer())
    .then(ab => (ac ? ac.decodeAudioData(ab) : null))
    .then(buf => { if (buf) lowWinBuffer = buf; })
    .catch(() => {});
}
loadLowWinSound();

export function playLowValueWinSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (!lowWinBuffer) { loadLowWinSound(); return; }
  try {
    const src = ac.createBufferSource();
    src.buffer = lowWinBuffer;
    const g = ac.createGain();
    g.gain.value = 1.6;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
  } catch { /* ignore */ }
}

// Scatter landing sound — a bright, magical chime that plays the instant a
// reel containing a scatter symbol stops. Distinct from the wooden reel-drop
// tick: a shimmering ascending arpeggio of crystal bells with a soft reverb
// tail so each scatter reads as a special, rewarding event.
export function playScatterDropSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t0 = ac.currentTime;

  // Crystal bell arpeggio — C6, E6, G6, C7 (bright, magical, ascending).
  const notes = [1046.5, 1318.5, 1568.0, 2093.0];
  notes.forEach((f, i) => {
    const start = t0 + i * 0.06;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, start);
    o.frequency.exponentialRampToValueAtTime(f * 1.005, start + 0.5);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.14, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
    o.connect(g);
    g.connect(ac.destination);
    o.start(start);
    o.stop(start + 0.6);
  });

  // Sparkle shimmer — high sine sweep on top for magic sparkle.
  const shimmer = ac.createOscillator();
  const shimmerG = ac.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(2637, t0);
  shimmer.frequency.exponentialRampToValueAtTime(4186, t0 + 0.4);
  shimmerG.gain.setValueAtTime(0.0001, t0);
  shimmerG.gain.linearRampToValueAtTime(0.05, t0 + 0.05);
  shimmerG.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
  shimmer.connect(shimmerG);
  shimmerG.connect(ac.destination);
  shimmer.start(t0);
  shimmer.stop(t0 + 0.5);

  // Soft reverb tail — delayed faint echo of the first note.
  const echo = ac.createOscillator();
  const echoG = ac.createGain();
  echo.type = 'sine';
  echo.frequency.setValueAtTime(1046.5, t0 + 0.18);
  echoG.gain.setValueAtTime(0.0001, t0 + 0.18);
  echoG.gain.linearRampToValueAtTime(0.05, t0 + 0.19);
  echoG.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
  echo.connect(echoG);
  echoG.connect(ac.destination);
  echo.start(t0 + 0.18);
  echo.stop(t0 + 0.75);
}