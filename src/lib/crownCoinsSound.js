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

// Procedurally synthesized reel-drop clicks — no recorded file, so there is
// no sustained background tone (the "mosquito buzz") to fight with. A short
// noise burst through a band-pass filter gives a clean mechanical tick that
// repeats on a loose interval for as long as the reels are spinning.
function playDropTick(ac, when) {
  const dur = 0.05;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.5);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2200;
  bp.Q.value = 1.4;
  const g = ac.createGain();
  g.gain.value = 0.35;
  src.connect(bp);
  bp.connect(g);
  g.connect(ac.destination);
  src.start(when);
}

export function playReelDropSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  let stopped = false;
  let timer = null;
  const tick = () => {
    if (stopped || !ac) return;
    playDropTick(ac, ac.currentTime);
    // Slightly randomized interval so it feels like physical reels, not a metronome.
    timer = setTimeout(tick, 90 + Math.random() * 60);
  };
  tick();
  return () => { stopped = true; if (timer) clearTimeout(timer); };
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