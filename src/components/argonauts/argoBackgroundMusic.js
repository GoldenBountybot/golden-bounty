// Argonauts — procedural casino-style background music.
// Plays a seamless looping lounge groove (chords, bass, drums, arpeggio) and
// ducks its volume whenever a sound effect plays, then smoothly restores.
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

const NORMAL_VOL = 0.225; // 22.5% — matches the app's background music level
const DUCK_VOL = 0.06;

let musicGain = null;   // duck / restore volume
let muteGain = null;    // global mute (1 or 0), in series with musicGain
let reverbBus = null;
let schedulerTimer = null;
let nextStepTime = 0;
let stepIndex = 0;
let running = false;

// ---- Chord progression: Am – F – C – G (vi–IV–I–V in C), 1 bar each ----
// Each chord: root (Hz), triad tones for chords/arp, bass pattern.
const PROGRESSION = [
  { root: 220.00, triad: [220.00, 261.63, 329.63], bass: [110.00, 110.00, 146.83, 110.00] }, // Am
  { root: 174.61, triad: [174.61, 220.00, 261.63], bass: [87.31, 87.31, 130.81, 87.31] },   // F
  { root: 261.63, triad: [196.00, 261.63, 329.63], bass: [130.81, 130.81, 196.00, 130.81] }, // C
  { root: 196.00, triad: [196.00, 246.94, 293.66], bass: [98.00, 98.00, 146.83, 98.00] },   // G
];

const BPM = 108;
const SEC_PER_BEAT = 60 / BPM;
const STEP_DUR = SEC_PER_BEAT / 4; // 16th-note step
const STEPS_PER_BAR = 16;
const LOOKAHEAD = 0.12; // schedule notes ~120ms ahead
const TICK = 25; // scheduler interval (ms)

function buildReverb(ac) {
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.22;
  const fb = ac.createGain();
  fb.gain.value = 0.34;
  const mix = ac.createGain();
  mix.gain.value = 0.3;
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(mix);
  mix.connect(musicGain);
  return bus;
}
// ---- Voices ----
function playKick(ac, t) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.32, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(g);
  g.connect(musicGain);
  o.start(t);
  o.stop(t + 0.24);
}

function playSnare(ac, t) {
  const dur = 0.18;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  const n = ac.createBufferSource();
  n.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  bp.Q.value = 0.8;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.16, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(bp);
  bp.connect(ng);
  ng.connect(musicGain);
  // body tone
  const o = ac.createOscillator();
  const og = ac.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(180, t);
  og.gain.setValueAtTime(0.08, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  o.connect(og);
  og.connect(musicGain);
  n.start(t);
  o.start(t);
  o.stop(t + 0.12);
}

function playHat(ac, t, open) {
  const dur = open ? 0.09 : 0.04;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  const n = ac.createBufferSource();
  n.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;
  const g = ac.createGain();
  g.gain.setValueAtTime(open ? 0.05 : 0.035, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(hp);
  hp.connect(g);
  g.connect(musicGain);
  n.start(t);
}

function playBass(ac, t, freq, dur) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(freq, t);
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(700, t);
  lp.frequency.exponentialRampToValueAtTime(280, t + dur);
  lp.Q.value = 4;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.14, t + 0.01);
  g.gain.setValueAtTime(0.14, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp);
  lp.connect(g);
  g.connect(musicGain);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function playChordStab(ac, t, freqs) {
  freqs.forEach((f) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    const lp = ac.createBiquadFilter();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t);
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(lp);
    lp.connect(g);
    g.connect(musicGain);
    g.connect(reverbBus);
    o.start(t);
    o.stop(t + 0.34);
  });
}

function playArp(ac, t, freq) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.035, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g);
  g.connect(musicGain);
  g.connect(reverbBus);
  o.start(t);
  o.stop(t + 0.2);
}

// Schedule one 16th-note step.
function scheduleStep(ac, step, time) {
  const bar = Math.floor(step / STEPS_PER_BAR) % PROGRESSION.length;
  const s = step % STEPS_PER_BAR; // 0..15 within the bar
  const chord = PROGRESSION[bar];

  // Drums
  if (s === 0 || s === 8) playKick(ac, time);
  if (s === 4 || s === 12) playSnare(ac, time);
  if (s % 2 === 0) playHat(ac, time, s === 14);
  // Bass — root on 0 & 8, fifth/passing on 6 & 14
  if (s === 0) playBass(ac, time, chord.bass[0], STEP_DUR * 3.2);
  if (s === 6) playBass(ac, time, chord.bass[2], STEP_DUR * 1.8);
  if (s === 8) playBass(ac, time, chord.bass[0], STEP_DUR * 3.2);
  if (s === 14) playBass(ac, time, chord.bass[3], STEP_DUR * 1.8);
  // Chord stab on 0 and 10
  if (s === 0 || s === 10) playChordStab(ac, time, chord.triad);
  // Arp — 8th notes cycling through the triad (up/down)
  if (s % 2 === 0) {
    const arpIdx = Math.floor(s / 2) % chord.triad.length;
    playArp(ac, time, chord.triad[arpIdx] * 2);
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