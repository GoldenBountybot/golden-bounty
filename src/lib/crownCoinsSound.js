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

const SPIN_SOUND_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/7bee91e9e_spinbutton.mp3';
let spinBuffer = null;
let spinLoaded = false;

// Preload + decode once so every click after the first plays instantly.
function loadSpinSound() {
  if (spinLoaded) return;
  spinLoaded = true;
  fetch(SPIN_SOUND_URL)
    .then(r => r.arrayBuffer())
    .then(ab => {
      const ac = getCtx();
      return ac ? ac.decodeAudioData(ab) : null;
    })
    .then(buf => { if (buf) spinBuffer = buf; })
    .catch(() => {});
}
if (typeof window !== 'undefined') loadSpinSound();

export function playSpinSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  // Buffer ready → instant Web Audio playback.
  if (spinBuffer) {
    try {
      const src = ac.createBufferSource();
      src.buffer = spinBuffer;
      const g = ac.createGain();
      g.gain.value = 0.7;
      src.connect(g);
      g.connect(ac.destination);
      src.start();
      return;
    } catch { /* fall through */ }
  }
  // Buffer not decoded yet (first click) → stream via HTML Audio so the
  // sound still plays immediately on click.
  try {
    const a = new Audio(SPIN_SOUND_URL);
    a.volume = 0.7;
    a.play().catch(() => {});
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