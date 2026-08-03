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
    g.gain.value = 0.7;
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

export function playReelDropSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (!dropBuffer) { loadDropSound(); return; }
  try {
    const src = ac.createBufferSource();
    src.buffer = dropBuffer;
    src.loop = true;
    // Low-pass filter strips out the high-pitched flute-like background tone
    // while keeping the mechanical reel-drop clicks intact.
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    lp.Q.value = 0.7;
    // Notch filter to further suppress any lingering mid-range melodic tone.
    const notch = ac.createBiquadFilter();
    notch.type = 'notch';
    notch.frequency.value = 1400;
    notch.Q.value = 1.2;
    const g = ac.createGain();
    g.gain.value = 0.6;
    src.connect(lp);
    lp.connect(notch);
    notch.connect(g);
    g.connect(ac.destination);
    src.start();
    return () => { try { src.stop(); } catch {} };
  } catch { /* ignore */ }
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