// Big Brown — primitive jungle background music.
// A serene, ancient-forest ambient piece led by a breathy bamboo flute
// wandering through a minor-pentatonic melody, underpinned by deep tribal
// hand-drums (djembe bass + conga tone), a soft shaker, and a low forest
// drone pad with slow filter movement. Ducks its volume whenever a SFX
// plays, then smoothly restores. Respects the global mute flag via a
// dedicated gain node. Stops cleanly when the user leaves the game page.
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

const NORMAL_VOL = 0.30;
const DUCK_VOL = 0.08;

let musicGain = null;
let muteGain = null;
let reverbBus = null;
let schedulerTimer = null;
let nextStepTime = 0;
let stepIndex = 0;
let running = false;

// ---- A minor pentatonic (primitive, timeless feel) ----
// Flute ranges over two octaves; bass & drone anchor the root.
const PENTATONIC = [220.00, 261.63, 293.66, 329.63, 392.00]; // A C D E G
const FLUTE_HIGH = PENTATONIC.map(f => f * 2);              // one octave up
const ROOT = 110.00; // A2 drone / bass root

// Slow, meditative tempo.
const BPM = 72;
const SEC_PER_BEAT = 60 / BPM;
const STEP_DUR = SEC_PER_BEAT / 2; // 8th-note step
const STEPS_PER_BAR = 8;
const LOOKAHEAD = 0.12;
const TICK = 25;

function buildReverb(ac) {
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.34;
  const fb = ac.createGain();
  fb.gain.value = 0.42;
  const mix = ac.createGain();
  mix.gain.value = 0.38;
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(mix);
  mix.connect(musicGain);
  return bus;
}

// ---- Forest drone pad ----
// A low root + fifth sustained sine pad with a very slow attack and a
// gentle lowpass filter LFO that breathes like wind through trees.
let droneStarted = false;
function startDrone(ac) {
  if (droneStarted) return;
  droneStarted = true;
  const freqs = [ROOT, ROOT * 1.5];
  freqs.forEach((f) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    const lp = ac.createBiquadFilter();
    o.type = 'sine';
    o.frequency.value = f;
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    // Slow filter LFO — a gentle "wind" swell.
    const lfo = ac.createOscillator();
    const lfoG = ac.createGain();
    lfo.frequency.value = 0.06;
    lfoG.gain.value = 220;
    lfo.connect(lfoG);
    lfoG.connect(lp.frequency);
    lfo.start();
    g.gain.value = 0.05;
    o.connect(lp);
    lp.connect(g);
    g.connect(musicGain);
    g.connect(reverbBus);
    o.start();
  });
}

// ---- Bamboo flute note ----
// A breathy, expressive flute tone: triangle fundamental + sine overtone,
// slow vibrato, a breath-noise attack, and a long natural decay. Sent to
// reverb for an airy, distant forest tail.
function playFlute(ac, t, freq, dur) {
  // Breath attack noise — a short filtered noise burst at the note onset.
  const breathDur = 0.12;
  const bBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * breathDur), ac.sampleRate);
  const bd = bBuf.getChannelData(0);
  for (let i = 0; i < bd.length; i++) bd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bd.length, 2);
  const bn = ac.createBufferSource();
  bn.buffer = bBuf;
  const bHp = ac.createBiquadFilter();
  bHp.type = 'bandpass';
  bHp.frequency.value = freq * 2;
  bHp.Q.value = 0.8;
  const bG = ac.createGain();
  bG.gain.setValueAtTime(0.05, t);
  bG.gain.exponentialRampToValueAtTime(0.0001, t + breathDur);
  bn.connect(bHp);
  bHp.connect(bG);
  bG.connect(musicGain);
  bG.connect(reverbBus);
  bn.start(t);

  // Fundamental — triangle for a warm, woody flute body.
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq, t);
  // Slight pitch slide up into the note for an expressive "embouchure" settle.
  o.frequency.exponentialRampToValueAtTime(freq * 1.006, t + 0.08);
  // Vibrato — delayed onset, gentle.
  const lfo = ac.createOscillator();
  const lfoG = ac.createGain();
  lfo.frequency.value = 5.2;
  lfoG.gain.setValueAtTime(0, t);
  lfoG.gain.linearRampToValueAtTime(freq * 0.012, t + 0.25);
  lfo.connect(lfoG);
  lfoG.connect(o.frequency);
  lfo.start(t);
  lfo.stop(t + dur + 0.1);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.14, t + 0.10);
  g.gain.setValueAtTime(0.14, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(musicGain);
  g.connect(reverbBus);
  o.start(t);
  o.stop(t + dur + 0.05);

  // Soft octave-up sine — the airy "edge" overtone of a bamboo flute.
  const o2 = ac.createOscillator();
  const g2 = ac.createGain();
  o2.type = 'sine';
  o2.frequency.value = freq * 2;
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.linearRampToValueAtTime(0.035, t + 0.12);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.7);
  o2.connect(g2);
  g2.connect(musicGain);
  g2.connect(reverbBus);
  o2.start(t);
  o2.stop(t + dur * 0.7 + 0.05);
}

// ---- Tribal hand-drums ----
// Deep djembe bass — a low sine with a fast pitch drop and a soft thump.
function playDjembeBass(ac, t) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.20, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.30);
  o.connect(g);
  g.connect(musicGain);
  o.start(t);
  o.stop(t + 0.32);
}

// Conga tone — a mid-range woody hit: triangle + bandpass + quick decay.
function playConga(ac, t, freq) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  const bp = ac.createBiquadFilter();
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.92, t + 0.10);
  bp.type = 'bandpass';
  bp.frequency.value = freq * 1.5;
  bp.Q.value = 1.2;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.10, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(bp);
  bp.connect(g);
  g.connect(musicGain);
  o.start(t);
  o.stop(t + 0.24);
}

// Soft shaker — filtered noise, very light, like dry seeds in a gourd.
function playShaker(ac, t) {
  const dur = 0.08;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
  const n = ac.createBufferSource();
  n.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.018, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(hp);
  hp.connect(g);
  g.connect(musicGain);
  n.start(t);
}

// ---- Melody generation ----
// A slow, wandering pentatonic flute line. Each bar picks a phrase: a long
// sustained note, a two-note rise, or a three-note flourish. Notes are
// chosen from the pentatonic set with a gentle random walk so the melody
// feels organic and never repeats exactly.
let lastDegree = 2; // start mid-scale
function nextFluteNote() {
  const step = Math.floor(Math.random() * 5) - 2; // -2..+2
  lastDegree = Math.max(0, Math.min(PENTATONIC.length + FLUTE_HIGH.length - 1, lastDegree + step));
  const pool = [...PENTATONIC, ...FLUTE_HIGH];
  return pool[lastDegree];
}

// Schedule one 8th-note step.
function scheduleStep(ac, step, time) {
  const s = step % STEPS_PER_BAR;
  const bar = Math.floor(step / STEPS_PER_BAR);

  // Tribal drum groove — slow, hypnotic 4/4.
  // Bass drum on beat 1 & 3; conga accents on the off-beats; shaker on 8ths.
  if (s === 0) playDjembeBass(ac, time);
  if (s === 4) playDjembeBass(ac, time);
  if (s === 2) playConga(ac, time, 196.00); // G3
  if (s === 6) playConga(ac, time, 261.63); // C4
  if (s % 2 === 1) playShaker(ac, time);

  // Flute melody — one long note every two bars, plus occasional passing
  // notes, so the flute breathes slowly over the drums.
  if (s === 0 && bar % 2 === 0) {
    const freq = nextFluteNote();
    playFlute(ac, time, freq, STEP_DUR * 7.5);
  }
  // A shorter answering note in the alternate bar.
  if (s === 4 && bar % 2 === 1) {
    const freq = nextFluteNote();
    playFlute(ac, time, freq, STEP_DUR * 3.5);
  }
}

function scheduler() {
  const ac = getCtx();
  if (!ac || !running) return;
  const target = isMuted() ? 0 : 1;
  try { muteGain.gain.setTargetAtTime(target, ac.currentTime, 0.05); } catch { /* ignore */ }
  while (nextStepTime < ac.currentTime + LOOKAHEAD) {
    if (!isMuted()) scheduleStep(ac, stepIndex, nextStepTime);
    nextStepTime += STEP_DUR;
    stepIndex++;
  }
}

// Duck the background music — called by Big Brown SFX.
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
  startDrone(ac);
  nextStepTime = ac.currentTime + 0.1;
  stepIndex = 0;
  lastDegree = 2;
  if (schedulerTimer) clearInterval(schedulerTimer);
  schedulerTimer = setInterval(scheduler, TICK);
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