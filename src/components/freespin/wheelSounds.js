// Premium luxury wheel-spinning sound for the Daily Free Spin wheel.
// Synthesised in real time via Web Audio API: a smooth mechanical gear
// texture that breathes as the wheel slows — the sound of a real luxury
// casino prize wheel in motion.
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
// duration — the gear texture breathes slower over that time so it feels like
// the wheel is physically slowing down.
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

  // Gear texture — band-passed white noise with an LFO breathing it
  // like real spinning gears. The LFO slows down over the spin.
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

  noise.start(); lfo.start();

  nodes = { master, noise, lfo };
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
  stop(n.noise); stop(n.lfo);
}