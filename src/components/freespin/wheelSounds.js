// Premium luxury wheel-spinning sound for the Daily Free Spin wheel.
// Synthesised in real time via Web Audio API:
//   • a smooth mechanical gear texture that breathes as the wheel slows
//   • a mechanical "tick" fired each time a prize segment passes the pointer,
//     scheduled from the wheel's real CSS cubic-bezier easing curve so the
//     ticks line up exactly with the visible segments — fast & blended at
//     the start, distinct & spaced out as the wheel comes to rest.
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
let tickTimeouts = [];

// CSS transition easing used by SpinWheel.jsx: cubic-bezier(0.16, 0.92, 0.02, 1)
const EASE = [0.16, 0.92, 0.02, 1];

// Parametric cubic-bezier point (P0=0,0  P3=1,1)
function bezX(u, x1, x2) { const o = 1 - u; return 3*o*o*u*x1 + 3*o*u*u*x2 + u*u*u; }
function bezY(u, y1, y2) { const o = 1 - u; return 3*o*o*u*y1 + 3*o*u*u*y2 + u*u*u; }

// Given an output progress p (0..1), return the time fraction τ at which the
// easing curve reaches that progress. Binary-search the parametric u for
// y(u)=p, then return x(u).
function timeForProgress(p, x1, y1, x2, y2) {
  let lo = 0, hi = 1, u = 0.5;
  for (let i = 0; i < 28; i++) {
    const y = bezY(u, y1, y2);
    if (Math.abs(y - p) < 1e-6) break;
    if (y < p) lo = u; else hi = u;
    u = (lo + hi) / 2;
  }
  return bezX(u, x1, x2);
}

// Build a short mechanical peg-click buffer (reused for every tick).
function makeTickBuffer(ac) {
  const len = Math.floor(ac.sampleRate * 0.05);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    // sharp noise transient with a fast exponential decay
    const env = Math.exp(-i / (ac.sampleRate * 0.009));
    ch[i] = (Math.random() * 2 - 1) * env;
  }
  return buf;
}

let tickBuffer = null;

function playTick(ac, dest, volume) {
  if (!tickBuffer) tickBuffer = makeTickBuffer(ac);
  const now = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = tickBuffer;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2400;
  bp.Q.value = 2.2;
  const g = ac.createGain();
  g.gain.value = volume;
  src.connect(bp); bp.connect(g); g.connect(dest);
  src.start(now);
}

// Start the wheel spinning sound. `durationSec` is the wheel's CSS transition
// duration, `totalRotationDeg` is the full degrees the board will travel, and
// `segCount` is the number of prize segments — ticks are scheduled so each
// segment boundary passing the pointer plays a click, synced to the easing.
export function startWheelSpin(durationSec = 18, totalRotationDeg = 2160, segCount = 19) {
  const ac = getCtx();
  if (!ac || nodes) return;
  if (isGlobalMuted()) return;

  const now = ac.currentTime;

  // Master gain — smooth fade-in
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.9, now + 0.3);
  master.connect(ac.destination);

  // Tick bus — a gentle compressor keeps the clicks punchy without clipping
  const tickBus = ac.createGain();
  tickBus.gain.value = 1;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  tickBus.connect(comp); comp.connect(master);

  nodes = { master, tickBus };

  // Schedule one tick per segment boundary crossed. Ticks get louder as the
  // wheel slows so the final clicks are crisp and distinct.
  const segAngle = 360 / segCount;
  const totalTicks = Math.floor(totalRotationDeg / segAngle);
  const durMs = durationSec * 1000;
  let prevMs = 0;
  for (let k = 1; k <= totalTicks; k++) {
    const progress = Math.min(1, (k * segAngle) / totalRotationDeg);
    const tau = timeForProgress(progress, EASE[0], EASE[1], EASE[2], EASE[3]);
    const ms = tau * durMs;
    if (ms < 60) continue; // too close to the start to be audible
    const gap = ms - prevMs;
    prevMs = ms;
    // Volume ramps with how slowed-down the wheel is at this tick: fast early
    // ticks are quiet (blend into the gear whir), late ticks are full & clear.
    const vol = Math.min(0.9, 0.18 + 0.7 * tau + Math.min(0.2, gap / 400));
    const t = setTimeout(() => {
      if (!nodes) return;
      playTick(ac, tickBus, vol);
    }, ms);
    tickTimeouts.push(t);
  }
}

// Stop the wheel sound with a quick fade-out. Called when the wheel rests.
export function stopWheelSpin() {
  tickTimeouts.forEach(clearTimeout);
  tickTimeouts = [];
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

}