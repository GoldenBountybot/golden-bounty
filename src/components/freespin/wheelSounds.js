// Premium luxury wheel-spinning sound for the Daily Free Spin wheel.
// Synthesised in real time via Web Audio API: a smooth mechanical hum that
// pitches down as the wheel slows, layered with gear texture, ticking
// pegs hitting the pointer, and a golden shimmer — the sound of a real
// luxury casino prize wheel in motion.
import { isMuted as isGlobalMuted } from '@/lib/soundMute';

let ctx = null;
function getCtx() {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

let nodes = null;

// Start the wheel spinning sound. `durationSec` is the wheel's CSS transition
// duration — the hum pitches down over that time so it feels like the wheel
// is physically slowing down.
export function startWheelSpin(durationSec = 10) {
  const ac = getCtx();
  if (!ac || nodes) return;
  if (isGlobalMuted()) return;

  const now = ac.currentTime;

  // Master gain — smooth fade-in
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.85, now + 0.3);
  master.connect(ac.destination);

  // 1) Mechanical hum — detuned sawtooth pair through a low-pass filter.
  //    Frequency ramps down over the spin duration to mimic the wheel
  //    slowing down.
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(400, now);
  lp.frequency.exponentialRampToValueAtTime(180, now + durationSec);
  lp.Q.value = 0.9;

  const hum1 = ac.createOscillator();
  hum1.type = 'sawtooth';
  hum1.frequency.setValueAtTime(90, now);
  hum1.frequency.exponentialRampToValueAtTime(38, now + durationSec);
  const hum2 = ac.createOscillator();
  hum2.type = 'sawtooth';
  hum2.frequency.setValueAtTime(96, now);
  hum2.frequency.exponentialRampToValueAtTime(41, now + durationSec);
  const humGain = ac.createGain();
  humGain.gain.value = 0.3;
  hum1.connect(humGain);
  hum2.connect(humGain);
  humGain.connect(lp);
  lp.connect(master);

  // 2) Gear texture — band-passed white noise with an LFO breathing it
  //    like real spinning gears. The LFO slows down over the spin.
  const noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const ch = noiseBuf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  const noise = ac.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;
  const noiseBp = ac.createBiquadFilter();
  noiseBp.type = 'bandpass';
  noiseBp.frequency.value = 1600;
  noiseBp.Q.value = 1.4;
  const noiseGain = ac.createGain();
  noiseGain.gain.value = 0.14;
  const lfo = ac.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(8, now);
  lfo.frequency.exponentialRampToValueAtTime(2.5, now + durationSec);
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 0.07;
  lfo.connect(lfoGain);
  lfoGain.connect(noiseGain.gain);
  noise.connect(noiseBp);
  noiseBp.connect(noiseGain);
  noiseGain.connect(master);

  // 3) Peg ticking — the iconic "tick-tick-tick" of the wheel pegs hitting
  //    the pointer. A square-wave LFO gates high-passed noise bursts. The
  //    tick rate slows down as the wheel loses momentum.
  const tickBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
  const tch = tickBuf.getChannelData(0);
  for (let i = 0; i < tch.length; i++) tch[i] = Math.random() * 2 - 1;
  const tick = ac.createBufferSource();
  tick.buffer = tickBuf;
  tick.loop = true;
  const tickHp = ac.createBiquadFilter();
  tickHp.type = 'highpass';
  tickHp.frequency.value = 4500;
  const tickGain = ac.createGain();
  tickGain.gain.value = 0.0001;
  const tickLfo = ac.createOscillator();
  tickLfo.type = 'square';
  tickLfo.frequency.setValueAtTime(22, now);
  tickLfo.frequency.exponentialRampToValueAtTime(3, now + durationSec);
  const tickLfoGain = ac.createGain();
  tickLfoGain.gain.setValueAtTime(0.06, now);
  tickLfoGain.gain.exponentialRampToValueAtTime(0.09, now + durationSec);
  tickLfo.connect(tickLfoGain);
  tickLfoGain.connect(tickGain.gain);
  tick.connect(tickHp);
  tickHp.connect(tickGain);
  tickGain.connect(master);

  // 4) Luxury shimmer — high sine pair with slow vibrato for a golden
  //    premium sparkle riding on top of the mechanics.
  const shim1 = ac.createOscillator();
  shim1.type = 'sine';
  shim1.frequency.value = 1760;
  const shim2 = ac.createOscillator();
  shim2.type = 'sine';
  shim2.frequency.value = 2640;
  const shimGain = ac.createGain();
  shimGain.gain.value = 0.045;
  const vib = ac.createOscillator();
  vib.type = 'sine';
  vib.frequency.value = 4.5;
  const vibGain = ac.createGain();
  vibGain.gain.value = 6;
  vib.connect(vibGain);
  vibGain.connect(shim1.frequency);
  vibGain.connect(shim2.frequency);
  shim1.connect(shimGain);
  shim2.connect(shimGain);
  shimGain.connect(master);

  hum1.start(); hum2.start(); noise.start(); lfo.start();
  tick.start(); tickLfo.start(); shim1.start(); shim2.start(); vib.start();

  nodes = { master, hum1, hum2, noise, lfo, tick, tickLfo, shim1, shim2, vib };
}

// Stop the wheel sound with a quick fade-out. Called when the wheel rests.
export function stopWheelSpin() {
  if (!nodes) return;
  const ac = getCtx();
  const n = nodes;
  nodes = null;
  if (ac && n.master) {
    try {
      n.master.gain.cancelScheduledValues(ac.currentTime);
      n.master.gain.setValueAtTime(n.master.gain.value, ac.currentTime);
      n.master.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.25);
    } catch { /* ignore */ }
  }
  const stop = (o) => { try { o.stop(ac ? ac.currentTime + 0.3 : 0); } catch { /* ignore */ } };
  stop(n.hum1); stop(n.hum2); stop(n.noise); stop(n.lfo);
  stop(n.tick); stop(n.tickLfo); stop(n.shim1); stop(n.shim2); stop(n.vib);
}