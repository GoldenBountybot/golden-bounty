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

const SPIN_SOUND_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/bd25f7dae_soinbatoom.mp3';
let spinAudio = null;

export function playSpinSound() {
  if (isMuted()) return;
  try {
    if (!spinAudio) {
      spinAudio = new Audio(SPIN_SOUND_URL);
      spinAudio.volume = 0.7;
    }
    spinAudio.currentTime = 0;
    spinAudio.play().catch(() => {});
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