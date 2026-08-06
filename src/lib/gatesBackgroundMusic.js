// Gates of Olympus — premium luxury casino background music.
// A majestic, divine Olympus-themed ambient piece: elegant grand-piano
// arpeggios over a warm string pad, soft harp flourishes, a refined bass
// pulse, and shimmering high celesta sparkles — the sound of a grand casino
// hall. Ducks its volume whenever a SFX plays, then smoothly restores.
// Respects the global mute flag via a dedicated gain node. Stops cleanly
// when the user leaves the game page.
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

const NORMAL_VOL = 0.34;
const DUCK_VOL = 0.10;

let musicGain = null;
let muteGain = null;
let reverbBus = null;
let schedulerTimer = null;
let nextStepTime = 0;
let stepIndex = 0;
let running = false;

// ---- C major / A minor — elegant, timeless, luxurious ----
// Piano arpeggios range over two octaves; strings anchor the harmony.
const ROOT = 130.81; // C3
const SCALE = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63]; // C D E F G A B C
const PIANO_HIGH = SCALE.map(f => f * 2);
const POOL = [...SCALE, ...PIANO_HIGH]; // 16 notes

// Slow, regal tempo.
const BPM = 84;
const SEC_PER_BEAT = 60 / BPM;
const STEP_DUR = SEC_PER_BEAT / 2; // 8th-note step
const STEPS_PER_BAR = 8;
const LOOKAHEAD = 0.12;
const TICK = 25;

function buildReverb(ac) {
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.30;
  const fb = ac.createGain();
  fb.gain.value = 0.40;
  const mix = ac.createGain();
  mix.gain.value = 0.34;
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(mix);
  mix.connect(musicGain);
  return bus;
}

// ---- Warm string pad ----
// A sustained root + third + fifth string chord with a slow attack and a
// gentle lowpass filter LFO that breathes like a bowing motion.
let padStarted = false;
function startPad(ac) {
  if (padStarted) return;
  padStarted = true;
  const freqs = [ROOT, ROOT * 1.26, ROOT * 1.5]; // root, third, fifth (C E G)
  freqs.forEach((f) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    const lp = ac.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.value = f;
    lp.type = 'lowpass';
    lp.frequency.value = 800;
    // Slow filter LFO — a gentle "bowing" swell.
    const lfo = ac.createOscillator();
    const lfoG = ac.createGain();
    lfo.frequency.value = 0.05;
    lfoG.gain.value = 300;
    lfo.connect(lfoG);
    lfoG.connect(lp.frequency);
    lfo.start();
    g.gain.value = 0.035;
    o.connect(lp);
    lp.connect(g);
    g.connect(musicGain);
    g.connect(reverbBus);
    o.start();
  });
}

// ---- Grand piano note ----
// A warm, expressive piano tone: triangle fundamental + sine overtone,
// soft attack, natural decay. Sent to reverb for an elegant hall tail.
function playPiano(ac, t, freq, dur) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 1.001, t + 0.05);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.12, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(musicGain);
  g.connect(reverbBus);
  o.start(t);
  o.stop(t + dur + 0.05);

  // Soft octave-up sine — the airy "hammer" overtone of a grand piano.
  const o2 = ac.createOscillator();
  const g2 = ac.createGain();
  o2.type = 'sine';
  o2.frequency.value = freq * 2;
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.linearRampToValueAtTime(0.03, t + 0.01);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.6);
  o2.connect(g2);
  g2.connect(musicGain);
  g2.connect(reverbBus);
  o2.start(t);
  o2.stop(t + dur * 0.6 + 0.05);
}

// ---- Harp flourish ----
// A delicate plucked string: triangle + fast decay + bright overtone.
function playHarp(ac, t, freq) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.06, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  o.connect(g);
  g.connect(musicGain);
  g.connect(reverbBus);
  o.start(t);
  o.stop(t + 0.55);

  // Bright pluck overtone.
  const o2 = ac.createOscillator();
  const g2 = ac.createGain();
  o2.type = 'sine';
  o2.frequency.value = freq * 3;
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.linearRampToValueAtTime(0.015, t + 0.002);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o2.connect(g2);
  g2.connect(musicGain);
  o2.start(t);
  o2.stop(t + 0.32);
}

// ---- Celesta sparkle ----
// A tiny high bell — bright, magical, premium.
function playCelesta(ac, t, freq) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.04, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  o.connect(g);
  g.connect(musicGain);
  g.connect(reverbBus);
  o.start(t);
  o.stop(t + 0.85);
}

// ---- Refined bass pulse ----
// A soft, warm bass note — deep sine with a gentle attack.
function playBass(ac, t, freq) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.09, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  o.connect(g);
  g.connect(musicGain);
  o.start(t);
  o.stop(t + 0.65);
}

// ---- Melody generation ----
// An elegant, singable piano arpeggio. Curated 4-bar phrases (rise → hold →
// fall → resolve) so the tune feels composed and luxurious, not random.
const PHRASES = [
  // Phrase A — rise: a gentle climbing arpeggio.
  [[0, 2], [2, 2], [4, 2], [7, 2]],
  // Phrase B — hold: a high sustained note.
  [[9, 4], [8, 2], [7, 2]],
  // Phrase C — fall: a cascading descent.
  [[6, 2], [5, 2], [4, 2], [2, 2]],
  // Phrase D — resolve: settle back home.
  [[4, 2], [2, 2], [0, 4]],
  // Phrase E — echo: a delicate high answer.
  [[12, 2], [11, 2], [9, 4]],
  // Phrase F — fall home: a final cascading descent.
  [[9, 2], [7, 2], [4, 2], [2, 2]],
];

let phraseQueue = [];
function refillPhrases() {
  [0, 1, 2, 3, 4, 5].forEach(i => phraseQueue.push(...PHRASES[i]));
}

// Schedule one 8th-note step.
let pianoRemaining = 0;
function scheduleStep(ac, step, time) {
  const s = step % STEPS_PER_BAR;
  const bar = Math.floor(step / STEPS_PER_BAR);

  // Refined bass pulse — slow, regal 4/4.
  if (s === 0) playBass(ac, time, ROOT);
  if (s === 4) playBass(ac, time, ROOT * 1.5); // fifth

  // Harp flourish — twice per bar, on off-beats, for a luxurious shimmer.
  if (s === 2) playHarp(ac, time, POOL[(step * 3) % POOL.length] * 2);
  if (s === 6) playHarp(ac, time, POOL[(step * 5) % POOL.length] * 2);

  // Celesta sparkle — once every other bar, a tiny magical bell.
  if (bar % 2 === 0 && s === 7) playCelesta(ac, time, POOL[(step * 7) % POOL.length] * 2);

  // Piano melody — pull the next note from the phrase queue.
  if (phraseQueue.length === 0) refillPhrases();
  if (pianoRemaining <= 0 && phraseQueue.length > 0) {
    const [degree, durSteps] = phraseQueue.shift();
    const freq = POOL[Math.max(0, Math.min(POOL.length - 1, degree))];
    const dur = STEP_DUR * durSteps;
    playPiano(ac, time, freq, dur);
    pianoRemaining = durSteps;
  }
  if (pianoRemaining > 0) pianoRemaining--;
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

// Duck the background music — called by Gates SFX.
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
  startPad(ac);
  nextStepTime = ac.currentTime + 0.1;
  stepIndex = 0;
  pianoRemaining = 0;
  phraseQueue = [];
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