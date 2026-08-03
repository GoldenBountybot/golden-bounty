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

// Luxury reel-land sound — a single weighted "thunk" played once per reel
// when it stops. Layered: a soft low thud for weight, a short noise burst for
// the mechanical stop, and a bright metallic ping that decays fast for a
// premium jewel-machine feel. No sustained tone, so no buzz.
export function playReelLandSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;

  // 1) Low thud — weight of the reel settling.
  const thud = ac.createOscillator();
  const thudG = ac.createGain();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(180, t);
  thud.frequency.exponentialRampToValueAtTime(90, t + 0.12);
  thudG.gain.setValueAtTime(0.0001, t);
  thudG.gain.linearRampToValueAtTime(0.3, t + 0.008);
  thudG.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  thud.connect(thudG);
  thudG.connect(ac.destination);
  thud.start(t);
  thud.stop(t + 0.2);

  // 2) Mechanical stop — short filtered noise burst.
  const dur = 0.06;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  const n = ac.createBufferSource();
  n.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2600;
  bp.Q.value = 1.2;
  const nG = ac.createGain();
  nG.gain.value = 0.22;
  n.connect(bp);
  bp.connect(nG);
  nG.connect(ac.destination);
  n.start(t);

  // 3) Bright metallic ping — luxury shimmer, fast decay.
  const ping = ac.createOscillator();
  const pingG = ac.createGain();
  ping.type = 'triangle';
  ping.frequency.setValueAtTime(2400, t);
  ping.frequency.exponentialRampToValueAtTime(1800, t + 0.14);
  pingG.gain.setValueAtTime(0.0001, t);
  pingG.gain.linearRampToValueAtTime(0.12, t + 0.004);
  pingG.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  ping.connect(pingG);
  pingG.connect(ac.destination);
  ping.start(t);
  ping.stop(t + 0.18);
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