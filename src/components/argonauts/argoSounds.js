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

// Value coin drop sound — plays when a value coin lands during the coin round.
const VALUE_COIN_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/7680e8d95_valuecoin_0.mp3';
let valueCoinBuffer = null;
let valueCoinLoaded = false;

function loadValueCoinSound() {
  if (valueCoinLoaded) return;
  valueCoinLoaded = true;
  const ac = getCtx();
  fetch(VALUE_COIN_URL)
    .then(r => r.arrayBuffer())
    .then(ab => (ac ? ac.decodeAudioData(ab) : null))
    .then(buf => { if (buf) valueCoinBuffer = buf; })
    .catch(() => {});
}

// Preload immediately so the sound is ready before the first coin drop.
loadValueCoinSound();

export function playValueCoinSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (!valueCoinBuffer) { loadValueCoinSound(); return; }
  try {
    const src = ac.createBufferSource();
    src.buffer = valueCoinBuffer;
    const g = ac.createGain();
    g.gain.value = 1.0;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
  } catch { /* ignore */ }
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

// Premium luxury reel-land sound — a soft golden harp string pluck with warm
// wooden resonance, a gentle overtone cascade, and a tasteful reverb tail.
// Distinct from a marimba chime: a plucked-string character that rings and
// decays naturally. Light, elegant, and relaxing — no heavy thud.
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
  delay.delayTime.value = 0.15;
  const fb = ac.createGain();
  fb.gain.value = 0.26;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.30;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);

  // 1) Golden harp pluck — a warm fundamental with two soft overtones that
  //    ring out like a plucked string. Slight pitch glide up on the attack
  //    gives it a living, organic feel.
  const pluckFreqs = [523.25, 659.25, 783.99]; // C5, E5, G5 — a warm major chord
  pluckFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f * 0.992, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.02);
    const peak = [0.14, 0.07, 0.045][i];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42 - i * 0.08);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 0.44);
  });

  // 2) Warm wooden body resonance — a low sine that breathes gently under
  //    the pluck, giving it a grounded, crafted character.
  const body = ac.createOscillator();
  const bodyG = ac.createGain();
  body.type = 'sine';
  body.frequency.setValueAtTime(130.81, t); // C3
  bodyG.gain.setValueAtTime(0.0001, t);
  bodyG.gain.linearRampToValueAtTime(0.06, t + 0.01);
  bodyG.gain.exponentialRampToValueAtTime(0.0001, t + 0.30);
  body.connect(bodyG);
  bodyG.connect(bus);
  body.start(t);
  body.stop(t + 0.32);

  // 3) Airy breath transient — a whisper of filtered noise at the pluck
  //    attack so the string feels like it was just touched.
  const dur = 0.05;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  }
  const n = ac.createBufferSource();
  n.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2400;
  bp.Q.value = 1.2;
  const nG = ac.createGain();
  nG.gain.value = 0.04;
  n.connect(bp);
  bp.connect(nG);
  nG.connect(bus);
  n.start(t);
}