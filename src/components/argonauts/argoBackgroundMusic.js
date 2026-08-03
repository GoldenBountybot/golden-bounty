// Argonauts — procedural casino-style background music.
// A smooth, elegant lounge groove: warm Rhodes-style chord pads, gentle
// upright bass, soft brushed drums, and a shimmering bell arpeggio over a
// ii–V–I jazz progression. Ducks its volume whenever a SFX plays, then
// smoothly restores. Respects the global mute flag via a dedicated gain node.
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

const NORMAL_VOL = 0.30; // slightly raised for a fuller background level
const DUCK_VOL = 0.08;

let musicGain = null;   // duck / restore volume
let muteGain = null;    // global mute (1 or 0), in series with musicGain
let reverbBus = null;
let schedulerTimer = null;
let nextStepTime = 0;
let stepIndex = 0;
let running = false;

// ---- Smooth jazz lounge progression: Cmaj7 – Am7 – Dm7 – G7 (I–vi–ii–V) ----
// Each chord lasts one bar. Voicings use 7ths for warmth. Bass plays the root.
// triad = upper chord tones used for the pad + arpeggio; bass = root note.
const PROGRESSION = [
  { bass: 65.41,  pad: [261.63, 329.63, 392.00, 493.88], arp: [523.25, 659.25, 783.99, 987.77] }, // Cmaj7
  { bass: 55.00,  pad: [220.00, 261.63, 329.63, 392.00], arp: [440.00, 523.25, 659.25, 783.99] }, // Am7
  { bass: 73.42,  pad: [293.66, 349.23, 440.00, 523.25], arp: [587.33, 698.46, 880.00, 1046.50] }, // Dm7
  { bass: 49.00,  pad: [196.00, 246.94, 392.00, 440.00], arp: [392.00, 493.88, 587.33, 698.46] }, // G7
];

const BPM = 88;
const SEC_PER_BEAT = 60 / BPM;
const STEP_DUR = SEC_PER_BEAT / 4; // 16th-note step
const STEPS_PER_BAR = 16;
const LOOKAHEAD = 0.12; // schedule notes ~120ms ahead
const TICK = 25; // scheduler interval (ms)

function buildReverb(ac) {
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.28;
  const fb = ac.createGain();
  fb.gain.value = 0.38;
  const mix = ac.createGain();
  mix.gain.value = 0.32;
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(mix);
  mix.connect(musicGain);
  return bus;
}

// ---- Voices ----
// Soft, round kick — a sine with a gentle pitch drop and a smooth envelope.
function playKick(ac, t) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.22, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
  o.connect(g);
  g.connect(musicGain);
  o.start(t);
  o.stop(t + 0.28);
}

// Brushed snare — filtered noise with a soft, swishy character.
function playSnare(ac, t) {
  const dur = 0.16;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.8);
  const n = ac.createBufferSource();
  n.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1200;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.07, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(hp);
  hp.connect(ng);
  ng.connect(musicGain);
  n.start(t);
}

// Closed hat — very light, airy.
function playHat(ac, t, open) {
  const dur = open ? 0.08 : 0.035;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  const n = ac.createBufferSource();
  n.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 8000;
  const g = ac.createGain();
  g.gain.setValueAtTime(open ? 0.03 : 0.02, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(hp);
  hp.connect(g);
  g.connect(musicGain);
  n.start(t);
}

// Warm upright bass — a sawtooth through a lowpass with a smooth envelope,
// giving a soft, woody pluck that sits under the mix without harshness.
function playBass(ac, t, freq, dur) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(freq, t);
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(520, t);
  lp.frequency.exponentialRampToValueAtTime(180, t + dur);
  lp.Q.value = 2.5;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.10, t + 0.012);
  g.gain.setValueAtTime(0.10, t + dur * 0.55);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp);
  lp.connect(g);
  g.connect(musicGain);
  o.start(t);
  o.stop(t + dur + 0.02);
}

// Rhodes-style chord pad — a sustained, warm electric-piano chord. Each note
// is a sine + a soft triangle an octave up, with a slow attack and a long,
// gentle release. Sent to the reverb bus for a lush, ambient tail.
function playChordPad(ac, t, freqs, dur) {
  freqs.forEach((f) => {
    // Fundamental sine — the warm body.
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.08);
    g.gain.setValueAtTime(0.035, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(musicGain);
    g.connect(reverbBus);
    o.start(t);
    o.stop(t + dur + 0.05);

    // Soft octave-up triangle — the bell-like "tine" overtone of a Rhodes.
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(f * 2, t);
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.linearRampToValueAtTime(0.012, t + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.6);
    o2.connect(g2);
    g2.connect(musicGain);
    g2.connect(reverbBus);
    o2.start(t);
    o2.stop(t + dur * 0.6 + 0.05);
  });
}

// Shimmering bell arpeggio — a single sine with a fast attack and a long,
// natural decay, like a music-box or glockenspiel note. Sent to reverb for
// an airy, sparkling tail that floats over the pad.
function playArp(ac, t, freq) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.03, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  o.connect(g);
  g.connect(musicGain);
  g.connect(reverbBus);
  o.start(t);
  o.stop(t + 0.52);
}

// Schedule one 16th-note step.
function scheduleStep(ac, step, time) {
  const bar = Math.floor(step / STEPS_PER_BAR) % PROGRESSION.length;
  const s = step % STEPS_PER_BAR; // 0..15 within the bar
  const chord = PROGRESSION[bar];
  const barDur = STEP_DUR * STEPS_PER_BAR;

  // Sustained chord pad — one long pad per bar, starting at s === 0.
  if (s === 0) playChordPad(ac, time, chord.pad, barDur * 0.96);

  // Drums — gentle, laid-back lounge groove.
  if (s === 0 || s === 8) playKick(ac, time);
  if (s === 4 || s === 12) playSnare(ac, time);
  if (s % 2 === 0) playHat(ac, time, s === 14);

  // Bass — root on beat 1 & 3, a passing note on the "and" of 3.
  if (s === 0) playBass(ac, time, chord.bass, STEP_DUR * 6);
  if (s === 8) playBass(ac, time, chord.bass, STEP_DUR * 6);
  if (s === 14) playBass(ac, time, chord.bass * 1.5, STEP_DUR * 2); // fifth

  // Arpeggio — 8th notes cycling up through the chord tones, starting on beat 2
  // so the pad and bass introduce the chord first.
  if (s % 2 === 0 && s >= 4) {
    const arpIdx = Math.floor((s - 4) / 2) % chord.arp.length;
    playArp(ac, time, chord.arp[arpIdx]);
  }
}

function scheduler() {
  const ac = getCtx();
  if (!ac || !running) return;
  // Respect mute via the dedicated muteGain node — never touches musicGain
  // so duck ramps are preserved across mute toggles.
  const target = isMuted() ? 0 : 1;
  try { muteGain.gain.setTargetAtTime(target, ac.currentTime, 0.05); } catch { /* ignore */ }
  while (nextStepTime < ac.currentTime + LOOKAHEAD) {
    if (!isMuted()) scheduleStep(ac, stepIndex, nextStepTime);
    nextStepTime += STEP_DUR;
    stepIndex++;
  }
}

// Duck the background music — called by every SFX in argoSounds.js.
export function duckBg() {
  const ac = getCtx();
  if (!ac || !musicGain) return;
  try {
    musicGain.gain.cancelScheduledValues(ac.currentTime);
    musicGain.gain.setValueAtTime(Math.max(musicGain.gain.value, DUCK_VOL), ac.currentTime);
    musicGain.gain.linearRampToValueAtTime(DUCK_VOL, ac.currentTime + 0.06);
    musicGain.gain.linearRampToValueAtTime(NORMAL_VOL, ac.currentTime + 0.7);
  } catch { /* ignore */ }
}

export function startBgMusic() {
  const ac = getCtx();
  if (!ac) return;
  if (running) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  running = true;
  if (!musicGain) {
    musicGain = ac.createGain();
    musicGain.gain.value = NORMAL_VOL;
    muteGain = ac.createGain();
    muteGain.gain.value = isMuted() ? 0 : 1;
    musicGain.connect(muteGain);
    muteGain.connect(ac.destination);
    reverbBus = buildReverb(ac);
  }
  nextStepTime = ac.currentTime + 0.1;
  stepIndex = 0;
  if (schedulerTimer) clearInterval(schedulerTimer);
  schedulerTimer = setInterval(scheduler, TICK);
  // Browsers block audio until a user gesture — resume on first interaction.
  const resume = () => { try { ac.resume(); } catch { /* ignore */ } };
  window.addEventListener('pointerdown', resume, { once: true });
  window.addEventListener('keydown', resume, { once: true });
}

export function stopBgMusic() {
  running = false;
  if (schedulerTimer) { clearInterval(schedulerTimer); schedulerTimer = null; }
  const ac = getCtx();
  if (ac && musicGain) {
    try {
      musicGain.gain.cancelScheduledValues(ac.currentTime);
      musicGain.gain.setTargetAtTime(0, ac.currentTime, 0.1);
    } catch { /* ignore */ }
  }
}