// Crown Coins — coin-drop sound (Web Audio API). Purely cosmetic; no balance effect.
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
    g.gain.value = 1.4;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
  } catch { /* ignore */ }
}

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

// Luxury reel-land sound — a soft "golden chime" played once per reel when
// it stops. A warm marimba-like wooden note with a gentle bell overtone and a
// soft felt-knock transient, finished with a short reverb tail. Light,
// musical, and pleasant — no heavy thud, no sustained drone.
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
  delay.delayTime.value = 0.11;
  const fb = ac.createGain();
  fb.gain.value = 0.22;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.3;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);

  // 1) Marimba note — warm wooden fundamental with a soft fifth overtone.
  const noteFreqs = [880, 1320];
  noteFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.97, t + 0.22);
    const peak = [0.12, 0.05][i];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26 - i * 0.05);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 0.28);
  });

  // 2) Gentle bell shimmer — a single high sine for sparkle.
  const bell = ac.createOscillator();
  const bellG = ac.createGain();
  bell.type = 'sine';
  bell.frequency.setValueAtTime(2640, t);
  bell.frequency.exponentialRampToValueAtTime(2480, t + 0.24);
  bellG.gain.setValueAtTime(0.0001, t);
  bellG.gain.linearRampToValueAtTime(0.05, t + 0.004);
  bellG.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
  bell.connect(bellG);
  bellG.connect(bus);
  bell.start(t);
  bell.stop(t + 0.26);

  // 3) Soft felt-knock — short low-passed noise transient.
  const dur = 0.045;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.5);
  }
  const n = ac.createBufferSource();
  n.buffer = buf;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1800;
  const nG = ac.createGain();
  nG.gain.value = 0.08;
  n.connect(lp);
  lp.connect(nG);
  nG.connect(bus);
  n.start(t);
}

export function playCoinSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  [
    { f: 1320, d: 0.09, g: 0.18 },
    { f: 1760, d: 0.13, g: 0.14 },
  ].forEach((n, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.value = n.f;
    g.gain.setValueAtTime(0, t + i * 0.06);
    g.gain.linearRampToValueAtTime(n.g, t + i * 0.06 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + n.d);
    o.connect(g);
    g.connect(ac.destination);
    o.start(t + i * 0.06);
    o.stop(t + i * 0.06 + n.d + 0.02);
  });
}