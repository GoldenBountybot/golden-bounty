// Rocket Crash sound effects synthesized with the Web Audio API — no asset
// files needed. Takeoff = rising filtered-noise whoosh; flying = subtle
// looping jet rumble; blast = low-pass noise burst + sine boom.

let ctx = null;
let flyingNodes = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noiseBuffer(c, dur) {
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export function playTakeoff() {
  const c = ac();
  if (!c) return;
  const now = c.currentTime;
  const dur = 1.2;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, dur);
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.1;
  filter.frequency.setValueAtTime(220, now);
  filter.frequency.exponentialRampToValueAtTime(2400, now + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.32, now + 0.18);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(now);
  src.stop(now + dur);
}

export function startFlying() {
  const c = ac();
  if (!c) return;
  stopFlying();
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 2);
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 380;
  const gain = c.createGain();
  gain.gain.value = 0.05;
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 78;
  const oscGain = c.createGain();
  oscGain.gain.value = 0.018;
  src.connect(filter).connect(gain).connect(c.destination);
  osc.connect(oscGain).connect(c.destination);
  src.start();
  osc.start();
  flyingNodes = { src, osc };
}

export function stopFlying() {
  if (flyingNodes) {
    try { flyingNodes.src.stop(); } catch (_e) {}
    try { flyingNodes.osc.stop(); } catch (_e) {}
    flyingNodes = null;
  }
}

export function playBlast() {
  const c = ac();
  if (!c) return;
  stopFlying();
  const now = c.currentTime;
  const dur = 1.0;

  // noise burst with fast decay through a dropping lowpass = explosion body
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / c.sampleRate;
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / dur, 2);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, now);
  filter.frequency.exponentialRampToValueAtTime(110, now + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  // low sine boom thump
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.45);
  const oscGain = c.createGain();
  oscGain.gain.setValueAtTime(0.5, now);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

  src.connect(filter).connect(gain).connect(c.destination);
  osc.connect(oscGain).connect(c.destination);
  src.start(now);
  osc.start(now);
  src.stop(now + dur);
  osc.stop(now + 0.5);
}