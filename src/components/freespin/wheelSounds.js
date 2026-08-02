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

  // 1) Peg ticking — the iconic "tick-tick-tick" of the wheel pegs hitting
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

  tick.start(); tickLfo.start();

  nodes = { master, tick, tickLfo };
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
  stop(n.tick); stop(n.tickLfo);
}