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

// Premium luxury reel-land sound — a warm, gilded chime played once per reel
// when it stops. A rich marimba/celesta note with a crystalline bell overtone,
// a soft felt-knock transient, and a tasteful reverb tail. Light, musical, and
// elegant — no heavy thud, no sustained drone.
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
  delay.delayTime.value = 0.13;
  const fb = ac.createGain();
  fb.gain.value = 0.24;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.32;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);

  // 1) Celesta/marimba note — warm fundamental with a soft fifth overtone.
  const noteFreqs = [784, 1175];
  noteFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.97, t + 0.24);
    const peak = [0.13, 0.055][i];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28 - i * 0.05);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 0.30);
  });

  // 2) Crystalline bell shimmer — a single high sine for sparkle.
  const bell = ac.createOscillator();
  const bellG = ac.createGain();
  bell.type = 'sine';
  bell.frequency.setValueAtTime(2349, t);
  bell.frequency.exponentialRampToValueAtTime(2217, t + 0.26);
  bellG.gain.setValueAtTime(0.0001, t);
  bellG.gain.linearRampToValueAtTime(0.055, t + 0.004);
  bellG.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
  bell.connect(bellG);
  bellG.connect(bus);
  bell.start(t);
  bell.stop(t + 0.28);

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
  lp.frequency.value = 1700;
  const nG = ac.createGain();
  nG.gain.value = 0.07;
  n.connect(lp);
  lp.connect(nG);
  nG.connect(bus);
  n.start(t);
}