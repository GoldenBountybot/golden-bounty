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

// Preload immediately so the sound is ready before the first spin.
loadSpinSound();

// Value-coin landing sound — played when a value coin drops onto the reels.
const VALUE_COIN_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/b5a389fb5_valuecn.mp3';
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

// Preload immediately so the sound is ready before the first coin lands.
loadValueCoinSound();

export function playValueCoinSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (!valueCoinBuffer) { loadValueCoinSound(); return; }
  try {
    const t = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = valueCoinBuffer;

    // Cleanup chain: high-pass removes low rumble, peaking boosts clarity,
    // low-pass tames harshness, and a gentle gain envelope keeps it clean.
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 180;
    hp.Q.value = 0.7;

    const peak = ac.createBiquadFilter();
    peak.type = 'peaking';
    peak.frequency.value = 2600;
    peak.Q.value = 1.0;
    peak.gain.value = 3.0;

    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 9000;
    lp.Q.value = 0.7;

    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1.1, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + valueCoinBuffer.duration);

    src.connect(hp);
    hp.connect(peak);
    peak.connect(lp);
    lp.connect(g);
    g.connect(ac.destination);
    src.start();
  } catch { /* ignore */ }
}

// Dove (pigeon) symbol win sound — played when a Dove line wins.
const DOVE_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/2c0205154_mixkobutor.mp3';
let doveBuffer = null;
let doveLoaded = false;

function loadDoveSound() {
  if (doveLoaded) return;
  doveLoaded = true;
  const ac = getCtx();
  fetch(DOVE_URL)
    .then(r => r.arrayBuffer())
    .then(ab => (ac ? ac.decodeAudioData(ab) : null))
    .then(buf => { if (buf) doveBuffer = buf; })
    .catch(() => {});
}
loadDoveSound();

export function playDoveSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (!doveBuffer) { loadDoveSound(); return; }
  try {
    const src = ac.createBufferSource();
    src.buffer = doveBuffer;
    const g = ac.createGain();
    g.gain.value = 1.0;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
  } catch { /* ignore */ }
}

// Amphora (cup) symbol win sound — played when an Amphora line wins.
const AMPHORA_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/f95aef0f5_AmphoraSymbol.mp3';
let amphoraBuffer = null;
let amphoraLoaded = false;

function loadAmphoraSound() {
  if (amphoraLoaded) return;
  amphoraLoaded = true;
  const ac = getCtx();
  fetch(AMPHORA_URL)
    .then(r => r.arrayBuffer())
    .then(ab => (ac ? ac.decodeAudioData(ab) : null))
    .then(buf => { if (buf) amphoraBuffer = buf; })
    .catch(() => {});
}
loadAmphoraSound();

export function playAmphoraSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (!amphoraBuffer) { loadAmphoraSound(); return; }
  try {
    const src = ac.createBufferSource();
    src.buffer = amphoraBuffer;
    const g = ac.createGain();
    g.gain.value = 1.0;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
  } catch { /* ignore */ }
}

// Golden Lyre (harp) symbol win sound — played when a Lyre line wins.
const LYRE_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/a42c40c82_GoldenLyre.mp3';
let lyreBuffer = null;
let lyreLoaded = false;

function loadLyreSound() {
  if (lyreLoaded) return;
  lyreLoaded = true;
  const ac = getCtx();
  fetch(LYRE_URL)
    .then(r => r.arrayBuffer())
    .then(ab => (ac ? ac.decodeAudioData(ab) : null))
    .then(buf => { if (buf) lyreBuffer = buf; })
    .catch(() => {});
}
loadLyreSound();

export function playLyreSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (!lyreBuffer) { loadLyreSound(); return; }
  try {
    const src = ac.createBufferSource();
    src.buffer = lyreBuffer;
    const g = ac.createGain();
    g.gain.value = 1.0;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
  } catch { /* ignore */ }
}

// Bow (arrow) symbol win sound — played when a Bow line wins.
const BOW_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/e3ff9a2c4_CrossedSwords.mp3';
let bowBuffer = null;
let bowLoaded = false;

function loadBowSound() {
  if (bowLoaded) return;
  bowLoaded = true;
  const ac = getCtx();
  fetch(BOW_URL)
    .then(r => r.arrayBuffer())
    .then(ab => (ac ? ac.decodeAudioData(ab) : null))
    .then(buf => { if (buf) bowBuffer = buf; })
    .catch(() => {});
}
loadBowSound();

export function playBowSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (!bowBuffer) { loadBowSound(); return; }
  try {
    const src = ac.createBufferSource();
    src.buffer = bowBuffer;
    const g = ac.createGain();
    g.gain.value = 1.0;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
  } catch { /* ignore */ }
}

// Green Dragon (lizard/serpent) symbol win sound — played when a Serpent line wins.
const DRAGON_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/865659119_GreenDragon.mp3';
let dragonBuffer = null;
let dragonLoaded = false;

function loadDragonSound() {
  if (dragonLoaded) return;
  dragonLoaded = true;
  const ac = getCtx();
  fetch(DRAGON_URL)
    .then(r => r.arrayBuffer())
    .then(ab => (ac ? ac.decodeAudioData(ab) : null))
    .then(buf => { if (buf) dragonBuffer = buf; })
    .catch(() => {});
}
loadDragonSound();

export function playDragonSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (!dragonBuffer) { loadDragonSound(); return; }
  try {
    const src = ac.createBufferSource();
    src.buffer = dragonBuffer;
    const g = ac.createGain();
    g.gain.value = 1.0;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
  } catch { /* ignore */ }
}

// Scatter (Argo Ship) symbol landing sound — procedurally synthesized for a
// clean, complete magical shimmer with NO coin clink in the background.
// A rising cascade of bell-like partials + a sparkle tail, finished with a
// soft warm pad so the sound resolves fully instead of feeling cut off.
export function playScatterSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;

  // Shared reverb-ish bus for a tasteful tail.
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.18;
  const fb = ac.createGain();
  fb.gain.value = 0.3;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.35;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);

  // 1) Rising bell cascade — a sequence of shimmering partials that climb in
  //    pitch, giving the scatter a magical "appear" feel. Each partial is a
  //    triangle wave with a fast attack and a long, natural exponential decay.
  const cascadeFreqs = [880, 1108.73, 1318.51, 1760, 2217.46]; // A5, C#6, E6, A6, C#7
  cascadeFreqs.forEach((f, i) => {
    const start = t + i * 0.05;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, start);
    const peak = 0.16 - i * 0.015;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
    o.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + 0.72);
  });

  // 2) High sparkle shimmer — a very high-frequency sine sweep that adds
  //    fairy-dust sparkle on top of the bell cascade.
  const sparkle = ac.createOscillator();
  const sparkleG = ac.createGain();
  sparkle.type = 'sine';
  sparkle.frequency.setValueAtTime(2400, t);
  sparkle.frequency.exponentialRampToValueAtTime(4800, t + 0.3);
  sparkleG.gain.setValueAtTime(0.0001, t);
  sparkleG.gain.linearRampToValueAtTime(0.05, t + 0.05);
  sparkleG.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  sparkle.connect(sparkleG);
  sparkleG.connect(bus);
  sparkle.start(t);
  sparkle.stop(t + 0.52);

  // 3) Warm resolving pad — a soft sustained chord underneath that gives the
  //    sound a complete, finished ending instead of trailing off abruptly.
  const padFreqs = [440, 554.37, 659.25]; // A4, C#5, E5 — A major
  padFreqs.forEach((f) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.08);
    g.gain.setValueAtTime(0.05, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 0.87);
  });
}

// Long scatter anticipation sound — procedurally synthesized, loops during
// slow-motion reels after 2 scatters have landed, building tension for a
// potential 3rd scatter. Matches the scatter sound character (bell partials +
// sparkle + warm pad) but sustained and slowly rising in intensity.
let scatterLongNodes = null; // { oscs: [], gain: GainNode }

export function playScatterLongSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  stopScatterLongSound();
  try {
    const t = ac.currentTime;

    // Master gain with a gentle fade-in so the loop doesn't pop in.
    const master = ac.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.linearRampToValueAtTime(0.5, t + 0.3);
    master.connect(ac.destination);

    // Reverb-ish bus for a tasteful tail.
    const delay = ac.createDelay(1.0);
    delay.delayTime.value = 0.2;
    const fb = ac.createGain();
    fb.gain.value = 0.32;
    const delayMix = ac.createGain();
    delayMix.gain.value = 0.3;
    master.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(delayMix);
    delayMix.connect(ac.destination);

    const oscs = [];

    // 1) Sustained shimmering partials — the same bell frequencies as the
    //    scatter sound, but held as a continuous drone with a slow tremolo
    //    so it feels alive and building tension.
    const droneFreqs = [880, 1108.73, 1318.51, 1760]; // A5, C#6, E6, A6
    droneFreqs.forEach((f, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.06 - i * 0.008, t + 0.4);

      // Slow tremolo — LFO modulates the gain so the shimmer breathes.
      const lfo = ac.createOscillator();
      const lfoG = ac.createGain();
      lfo.frequency.setValueAtTime(0.6 + i * 0.15, t);
      lfoG.gain.setValueAtTime(0.025, t);
      lfo.connect(lfoG);
      lfoG.connect(g.gain);
      lfo.start(t);

      o.connect(g);
      g.connect(master);
      o.start(t);
      oscs.push(o, lfo);
    });

    // 2) High sparkle shimmer — a continuous high sine that slowly rises in
    //    volume, adding fairy-dust tension on top of the drone.
    const sparkle = ac.createOscillator();
    const sparkleG = ac.createGain();
    sparkle.type = 'sine';
    sparkle.frequency.setValueAtTime(2800, t);
    sparkle.frequency.linearRampToValueAtTime(3600, t + 4);
    sparkleG.gain.setValueAtTime(0.0001, t);
    sparkleG.gain.linearRampToValueAtTime(0.03, t + 0.5);
    sparkle.connect(sparkleG);
    sparkleG.connect(master);
    sparkle.start(t);
    oscs.push(sparkle);

    // 3) Warm pad underneath — a soft sustained A major chord that gives the
    //    loop body and matches the scatter sound's resolving pad.
    const padFreqs = [220, 277.18, 329.63]; // A3, C#4, E4
    padFreqs.forEach((f) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.04, t + 0.5);
      o.connect(g);
      g.connect(master);
      o.start(t);
      oscs.push(o);
    });

    scatterLongNodes = { oscs, gain: master };
  } catch { /* ignore */ }
}

export function stopScatterLongSound() {
  if (scatterLongNodes) {
    try {
      const ac = getCtx();
      // Quick fade-out to avoid a click, then stop everything.
      if (ac && scatterLongNodes.gain) {
        scatterLongNodes.gain.gain.cancelScheduledValues(ac.currentTime);
        scatterLongNodes.gain.gain.setValueAtTime(scatterLongNodes.gain.gain.value, ac.currentTime);
        scatterLongNodes.gain.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.15);
      }
      scatterLongNodes.oscs.forEach((o) => {
        try { o.stop(ac ? ac.currentTime + 0.2 : 0); } catch { /* ignore */ }
      });
    } catch { /* ignore */ }
    scatterLongNodes = null;
  }
}

// Potion symbol win sound — procedurally synthesized.
// Premium and luxurious: a crystalline glass-vial clink cascading into a
// magical bubbling brew with a warm mystical pad underneath. Evokes the
// feel of a precious elixir being poured — elegant, alchemical, and divine.
export function playPotionSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;

  // Shared reverb-ish bus for a lush, cavernous tail.
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.20;
  const fb = ac.createGain();
  fb.gain.value = 0.32;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.36;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);

  // 1) Crystalline glass-vial clinks — a rapid cascade of high bell-like
  //    partials that evoke the gentle clink of a precious glass vial. Each
  //    clink uses inharmonic partials for a true glass character.
  const clinkFreqs = [1318.51, 1567.98, 1760, 2093.00]; // E6, G6, A6, C7
  clinkFreqs.forEach((f, i) => {
    const start = t + i * 0.07;
    const partials = [1, 2.0, 2.76, 5.4];
    const amps = [0.10, 0.05, 0.03, 0.015];
    partials.forEach((p, pi) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f * p, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(amps[pi] * (1 - i * 0.12), start + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 1.2 - pi * 0.18);
      o.connect(g);
      g.connect(bus);
      o.start(start);
      o.stop(start + 1.22);
    });
  });

  // 2) Magical bubbling — a low filtered oscillator that slowly rises and
  //    falls in pitch, evoking the gentle bubbling of a brewing elixir.
  const bubble = ac.createOscillator();
  const bubbleG = ac.createGain();
  const bubbleFilter = ac.createBiquadFilter();
  bubble.type = 'sine';
  bubble.frequency.setValueAtTime(180, t);
  bubble.frequency.linearRampToValueAtTime(280, t + 0.3);
  bubble.frequency.linearRampToValueAtTime(220, t + 0.6);
  bubbleFilter.type = 'lowpass';
  bubbleFilter.frequency.value = 600;
  bubbleFilter.Q.value = 2.0;
  bubbleG.gain.setValueAtTime(0.0001, t);
  bubbleG.gain.linearRampToValueAtTime(0.08, t + 0.05);
  bubbleG.gain.setValueAtTime(0.08, t + 0.5);
  bubbleG.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  bubble.connect(bubbleFilter);
  bubbleFilter.connect(bubbleG);
  bubbleG.connect(bus);
  bubble.start(t);
  bubble.stop(t + 0.92);

  // 3) Sparkle shimmer — a high sine sweep that adds fairy-dust magic on top
  //    of the bubbling, giving the potion a radiant, enchanted quality.
  const sparkle = ac.createOscillator();
  const sparkleG = ac.createGain();
  sparkle.type = 'sine';
  sparkle.frequency.setValueAtTime(3200, t + 0.15);
  sparkle.frequency.exponentialRampToValueAtTime(5200, t + 0.5);
  sparkleG.gain.setValueAtTime(0.0001, t + 0.15);
  sparkleG.gain.linearRampToValueAtTime(0.04, t + 0.22);
  sparkleG.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  sparkle.connect(sparkleG);
  sparkleG.connect(bus);
  sparkle.start(t + 0.15);
  sparkle.stop(t + 0.72);

  // 4) Warm mystical pad — a soft sustained chord underneath that gives the
  //    sound a luxurious, enveloping body. A minor add9 chord for a mystical,
  //    alchemical feel. Slow swell in and gentle release.
  const padFreqs = [261.63, 311.13, 392.00, 466.16]; // C4, Eb4, G4, Bb4 — Cm add9
  padFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.04 - i * 0.005, t + 0.2);
    g.gain.setValueAtTime(0.04 - i * 0.005, t + 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 1.42);
  });
}

// Wild Bull symbol win sound — procedurally synthesized.
// Premium and luxurious: a deep, powerful bull roar with a formant filter
// sweep that gives it a majestic, commanding character. A subharmonic
// rumble underneath, a growl component, and a warm reverb tail for a
// cinematic, premium feel. Played when a Wild is part of a winning line.
export function playWildSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;

  // Shared reverb-ish bus for a cinematic tail.
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.24;
  const fb = ac.createGain();
  fb.gain.value = 0.30;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.28;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);

  // 1) Deep roar fundamental — a sawtooth at ~110 Hz that rises in pitch,
  //    giving the roar its building, surging intensity. The sawtooth's
  //    rich harmonics give the roar its beastly, powerful character.
  //    (110 Hz base — high enough for mobile speakers to reproduce.)
  const roar = ac.createOscillator();
  const roarG = ac.createGain();
  roar.type = 'sawtooth';
  roar.frequency.setValueAtTime(110, t);
  roar.frequency.linearRampToValueAtTime(140, t + 0.15);
  roar.frequency.linearRampToValueAtTime(120, t + 0.5);
  roarG.gain.setValueAtTime(0.0001, t);
  roarG.gain.linearRampToValueAtTime(0.32, t + 0.04);
  roarG.gain.setValueAtTime(0.32, t + 0.45);
  roarG.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);

  // 2) Formant filter sweep — a bandpass filter that sweeps through mid
  //    frequencies, shaping the roar into a vowel-like "RRROOAAR"
  //    character. This is what makes it sound like an actual animal vocal.
  const formant = ac.createBiquadFilter();
  formant.type = 'bandpass';
  formant.frequency.setValueAtTime(400, t);
  formant.frequency.linearRampToValueAtTime(800, t + 0.2);
  formant.frequency.linearRampToValueAtTime(560, t + 0.55);
  formant.Q.value = 3.0;

  // 3) Second formant — a higher bandpass that adds the "ahh" vowel overtone,
  //    giving the roar a richer, more expressive vocal character.
  const formant2 = ac.createBiquadFilter();
  formant2.type = 'bandpass';
  formant2.frequency.setValueAtTime(1200, t);
  formant2.frequency.linearRampToValueAtTime(1800, t + 0.2);
  formant2.frequency.linearRampToValueAtTime(1400, t + 0.55);
  formant2.Q.value = 3.5;

  // 4) Amplitude modulation — a slow LFO on the gain that creates the
  //    pulsing, surging quality of a real animal roar.
  const lfo = ac.createOscillator();
  const lfoG = ac.createGain();
  lfo.frequency.setValueAtTime(7, t);
  lfo.frequency.linearRampToValueAtTime(12, t + 0.3);
  lfoG.gain.setValueAtTime(0.08, t);
  lfo.connect(lfoG);
  lfoG.connect(roarG.gain);
  lfo.start(t);
  lfo.stop(t + 0.92);

  roar.connect(formant);
  formant.connect(formant2);
  formant2.connect(roarG);
  roarG.connect(bus);
  roar.start(t);
  roar.stop(t + 0.92);

  // 5) Subharmonic rumble — a low sine an octave below the fundamental
  //    that gives the roar a chest-rattling, earth-shaking depth.
  const sub = ac.createOscillator();
  const subG = ac.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(65, t);
  sub.frequency.linearRampToValueAtTime(72, t + 0.15);
  sub.frequency.linearRampToValueAtTime(62, t + 0.5);
  subG.gain.setValueAtTime(0.0001, t);
  subG.gain.linearRampToValueAtTime(0.18, t + 0.06);
  subG.gain.setValueAtTime(0.18, t + 0.4);
  subG.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
  sub.connect(subG);
  subG.connect(bus);
  sub.start(t);
  sub.stop(t + 0.87);

  // 6) Growl component — filtered noise with a resonant bandpass that adds
  //    the raspy, guttural texture of a beast's growl in the mid range.
  const dur = 0.7;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
  }
  const n = ac.createBufferSource();
  n.buffer = buf;
  const growlFilter = ac.createBiquadFilter();
  growlFilter.type = 'bandpass';
  growlFilter.frequency.setValueAtTime(500, t);
  growlFilter.frequency.linearRampToValueAtTime(900, t + 0.2);
  growlFilter.frequency.linearRampToValueAtTime(650, t + 0.55);
  growlFilter.Q.value = 4.0;
  const nG = ac.createGain();
  nG.gain.setValueAtTime(0.0001, t);
  nG.gain.linearRampToValueAtTime(0.12, t + 0.05);
  nG.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  n.connect(growlFilter);
  growlFilter.connect(nG);
  nG.connect(bus);
  n.start(t);
}

// Spartan Warrior (Jason) symbol win sound — played when a Jason line wins.
const SPARTAN_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/478cbdd23_SpartanWarrior.mp3';
let spartanBuffer = null;
let spartanLoaded = false;

function loadSpartanSound() {
  if (spartanLoaded) return;
  spartanLoaded = true;
  const ac = getCtx();
  fetch(SPARTAN_URL)
    .then(r => r.arrayBuffer())
    .then(ab => (ac ? ac.decodeAudioData(ab) : null))
    .then(buf => { if (buf) spartanBuffer = buf; })
    .catch(() => {});
}
loadSpartanSound();

export function playSpartanSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (!spartanBuffer) { loadSpartanSound(); return; }
  try {
    const src = ac.createBufferSource();
    src.buffer = spartanBuffer;
    const g = ac.createGain();
    g.gain.value = 1.0;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
  } catch { /* ignore */ }
}

// Goddess (Atlanta) symbol win sound — procedurally synthesized.
// Premium, luxurious, and divine: an ethereal harp glissando cascading
// into angelic bell chimes over a warm choir pad. Distinct from the
// Spartan Warrior's battle-cry character — this is graceful and heavenly.
export function playGoddessSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;

  // Shared reverb-ish bus for a lush, cavernous tail.
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.22;
  const fb = ac.createGain();
  fb.gain.value = 0.34;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.38;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);

  // 1) Heavenly harp glissando — a rapid cascade of plucked notes rising in
  //    pitch, like a divine hand sweeping across a golden harp. Each note is
  //    a triangle wave with a fast pluck attack and a long ringing decay.
  const glissFreqs = [523.25, 587.33, 659.25, 783.99, 880, 1046.50, 1318.51]; // C5→E6
  glissFreqs.forEach((f, i) => {
    const start = t + i * 0.06;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f * 0.99, start);
    o.frequency.exponentialRampToValueAtTime(f, start + 0.02);
    const peak = 0.12 - i * 0.01;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
    o.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + 0.92);
  });

  // 2) Angelic bell chimes — two shimmering high bell strikes that ring out
  //    after the glissando, giving the sound a divine, crystalline quality.
  const bellFreqs = [1567.98, 2093.00]; // G6, C7
  bellFreqs.forEach((f, i) => {
    const start = t + 0.35 + i * 0.15;
    // Fundamental + inharmonic partials for a true bell character.
    const partials = [1, 2.0, 2.76, 5.4];
    const amps = [0.10, 0.05, 0.03, 0.015];
    partials.forEach((p, pi) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f * p, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(amps[pi], start + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 1.4 - pi * 0.2);
      o.connect(g);
      g.connect(bus);
      o.start(start);
      o.stop(start + 1.42);
    });
  });

  // 3) Warm choir pad — a soft sustained chord underneath that gives the
  //    sound a luxurious, enveloping body. A major add9 chord for a divine,
  //    heavenly feel. Slow swell in and gentle release.
  const padFreqs = [261.63, 329.63, 392.00, 493.88]; // C4, E4, G4, B4 — Cmaj9
  padFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.045 - i * 0.005, t + 0.25);
    g.gain.setValueAtTime(0.045 - i * 0.005, t + 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 1.62);

    // Slight detune octave-up sine for a choir "ahh" overtone.
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(f * 2, t);
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.linearRampToValueAtTime(0.015, t + 0.3);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o2.connect(g2);
    g2.connect(bus);
    o2.start(t);
    o2.stop(t + 1.42);
  });
}

// Casino winning fanfare — played when 3+ scatters land and the free spins
// banner floats up. A triumphant, luxurious celebration: a rising brass-like
// fanfare cascade, shimmering coin cascades, and a sustained major chord with
// a long reverb tail. Evokes the feel of hitting a big casino bonus.
export function playScatterWinSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;

  // Shared reverb-ish bus for a lush, cavernous tail.
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.22;
  const fb = ac.createGain();
  fb.gain.value = 0.36;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.4;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);

  // 1) Rising brass fanfare — a cascade of sawtooth notes climbing in pitch,
  //    like a triumphant trumpet fanfare. Each note has a bright attack and a
  //    sustained body, building excitement for the free spins.
  const fanfareFreqs = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4→C6
  fanfareFreqs.forEach((f, i) => {
    const start = t + i * 0.09;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, start);
    // Slight pitch glide up on the attack for a brass-like feel.
    o.frequency.setValueAtTime(f * 0.985, start);
    o.frequency.exponentialRampToValueAtTime(f, start + 0.04);
    const peak = 0.14 - i * 0.012;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.02);
    g.gain.setValueAtTime(peak, start + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);

    // A lowpass filter softens the sawtooth so it sounds like a brass horn
    // rather than a harsh synth.
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    lp.Q.value = 0.8;

    o.connect(lp);
    lp.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + 0.52);
  });

  // 2) Shimmering coin cascade — a rapid sequence of high bell-like partials
  //    that evoke a shower of golden coins falling. Each partial is a triangle
  //    wave with a fast attack and a long ringing decay.
  const coinFreqs = [1318.51, 1567.98, 1760, 2093.00, 2637.02]; // E6→E7
  coinFreqs.forEach((f, i) => {
    const start = t + 0.15 + i * 0.06;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, start);
    const peak = 0.10 - i * 0.012;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.8);
    o.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + 0.82);
  });

  // 3) Triumphant sustained chord — a warm major chord underneath that gives
  //    the fanfare a luxurious, celebratory body. C major with an added 9th for
  //    a bright, victorious feel. Slow swell in and a long, proud release.
  const chordFreqs = [261.63, 329.63, 392.00, 493.88, 587.33]; // C4, E4, G4, B4, D5 — Cmaj9
  chordFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t + 0.1);
    g.gain.setValueAtTime(0.0001, t + 0.1);
    g.gain.linearRampToValueAtTime(0.05 - i * 0.006, t + 0.3);
    g.gain.setValueAtTime(0.05 - i * 0.006, t + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);
    o.connect(g);
    g.connect(bus);
    o.start(t + 0.1);
    o.stop(t + 2.02);

    // Octave-up sine for a choir "ahh" overtone that makes the chord shimmer.
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(f * 2, t + 0.1);
    g2.gain.setValueAtTime(0.0001, t + 0.1);
    g2.gain.linearRampToValueAtTime(0.018, t + 0.35);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    o2.connect(g2);
    g2.connect(bus);
    o2.start(t + 0.1);
    o2.stop(t + 1.82);
  });

  // 4) Sparkle shimmer — a very high sine sweep that adds fairy-dust magic on
  //    top of the whole fanfare, peaking as the banner floats up.
  const sparkle = ac.createOscillator();
  const sparkleG = ac.createGain();
  sparkle.type = 'sine';
  sparkle.frequency.setValueAtTime(3200, t + 0.2);
  sparkle.frequency.exponentialRampToValueAtTime(6400, t + 0.8);
  sparkleG.gain.setValueAtTime(0.0001, t + 0.2);
  sparkleG.gain.linearRampToValueAtTime(0.04, t + 0.35);
  sparkleG.gain.setValueAtTime(0.04, t + 0.9);
  sparkleG.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
  sparkle.connect(sparkleG);
  sparkleG.connect(bus);
  sparkle.start(t + 0.2);
  sparkle.stop(t + 1.42);
}

// Coin feature trigger sound — played when the Golden Fleece coin banner
// floats up to start the hold-and-spin round. Premium, luxurious, and
// celebratory: a deep golden gong strike, a rising brass fanfare, a
// shimmering coin cascade, and a warm triumphant chord with a long reverb
// tail. Evokes the feel of unlocking a royal treasury.
export function playCoinFeatureSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;

  // Shared reverb-ish bus for a lush, cavernous tail.
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.24;
  const fb = ac.createGain();
  fb.gain.value = 0.38;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.42;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);

  // 1) Deep golden gong strike — a rich, resonant strike with inharmonic
  //    partials that evoke a large ceremonial gong. Sets a grand, royal tone.
  const gongFreqs = [110, 165, 220, 330, 440]; // inharmonic stack
  gongFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    const peak = [0.22, 0.14, 0.10, 0.06, 0.04][i];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5 - i * 0.2);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 2.52);
  });

  // 2) Rising brass fanfare — a cascade of sawtooth notes climbing in pitch,
  //    like a triumphant royal trumpet fanfare announcing the treasure.
  const fanfareFreqs = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4→C6
  fanfareFreqs.forEach((f, i) => {
    const start = t + 0.15 + i * 0.10;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f * 0.985, start);
    o.frequency.exponentialRampToValueAtTime(f, start + 0.04);
    const peak = 0.15 - i * 0.012;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.02);
    g.gain.setValueAtTime(peak, start + 0.14);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);

    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3400;
    lp.Q.value = 0.8;

    o.connect(lp);
    lp.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + 0.57);
  });

  // 3) Shimmering coin cascade — a rapid sequence of high bell-like partials
  //    that evoke a shower of golden coins spilling from a treasure chest.
  const coinFreqs = [1318.51, 1567.98, 1760, 2093.00, 2637.02, 3135.96]; // E6→G7
  coinFreqs.forEach((f, i) => {
    const start = t + 0.3 + i * 0.055;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, start);
    const peak = 0.11 - i * 0.012;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
    o.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + 0.92);
  });

  // 4) Triumphant sustained chord — a warm major chord underneath that gives
  //    the fanfare a luxurious, regal body. C major with an added 9th for a
  //    bright, victorious feel. Slow swell in and a long, proud release.
  const chordFreqs = [261.63, 329.63, 392.00, 493.88, 587.33]; // C4, E4, G4, B4, D5 — Cmaj9
  chordFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t + 0.2);
    g.gain.setValueAtTime(0.0001, t + 0.2);
    g.gain.linearRampToValueAtTime(0.055 - i * 0.006, t + 0.4);
    g.gain.setValueAtTime(0.055 - i * 0.006, t + 1.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(g);
    g.connect(bus);
    o.start(t + 0.2);
    o.stop(t + 2.42);

    // Octave-up sine for a choir "ahh" overtone that makes the chord shimmer.
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(f * 2, t + 0.2);
    g2.gain.setValueAtTime(0.0001, t + 0.2);
    g2.gain.linearRampToValueAtTime(0.02, t + 0.45);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 2.1);
    o2.connect(g2);
    g2.connect(bus);
    o2.start(t + 0.2);
    o2.stop(t + 2.12);
  });

  // 5) Sparkle shimmer — a very high sine sweep that adds fairy-dust magic on
  //    top of the whole fanfare, peaking as the banner floats up.
  const sparkle = ac.createOscillator();
  const sparkleG = ac.createGain();
  sparkle.type = 'sine';
  sparkle.frequency.setValueAtTime(3200, t + 0.3);
  sparkle.frequency.exponentialRampToValueAtTime(6800, t + 1.0);
  sparkleG.gain.setValueAtTime(0.0001, t + 0.3);
  sparkleG.gain.linearRampToValueAtTime(0.045, t + 0.5);
  sparkleG.gain.setValueAtTime(0.045, t + 1.1);
  sparkleG.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
  sparkle.connect(sparkleG);
  sparkleG.connect(bus);
  sparkle.start(t + 0.3);
  sparkle.stop(t + 1.72);
}

// Coin win count-up sound — played while the total win amount counts up on
// the coin feature win banner. A premium casino coin-counter: rapid, bright
// metallic coin clinks/dings that tick along with each increment, with a
// warm wooden resonance underneath. Evokes the feel of a real casino coin
// counter tallying a big win.
export function playCoinCountSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;

  // Shared reverb-ish bus for a tasteful tail.
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.12;
  const fb = ac.createGain();
  fb.gain.value = 0.22;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.24;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);

  // A single bright metallic coin clink — inharmonic sine partials with a
  // fast attack and a medium decay, like a gold coin striking a marble
  // counter. Used as the per-tick sound during the count-up.
  const clinkFreqs = [1567.98, 2637.02, 3135.96, 4186.01]; // G6, E7, G7, C8
  clinkFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    const peak = [0.12, 0.07, 0.04, 0.02][i];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18 - i * 0.02);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 0.2);
  });

  // Warm wooden body — a low sine that gives each clink a grounded, crafted
  // character, like coins landing on a polished wooden surface.
  const body = ac.createOscillator();
  const bodyG = ac.createGain();
  body.type = 'sine';
  body.frequency.setValueAtTime(196.00, t); // G3
  bodyG.gain.setValueAtTime(0.0001, t);
  bodyG.gain.linearRampToValueAtTime(0.05, t + 0.005);
  bodyG.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  body.connect(bodyG);
  bodyG.connect(bus);
  body.start(t);
  body.stop(t + 0.14);
}

// Coin win celebration sound — played when the coin feature win banner
// finishes counting up and the final total is revealed. A premium, luxurious
// casino celebration: a triumphant brass fanfare, a shimmering coin shower,
// a deep golden gong, and a sustained major chord with a long reverb tail.
// Evokes the feel of hitting a royal jackpot in a real luxury casino.
export function playCoinWinSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;

  // Shared reverb-ish bus for a lush, cavernous tail.
  const bus = ac.createGain();
  bus.gain.value = 1;
  const delay = ac.createDelay(1.0);
  delay.delayTime.value = 0.26;
  const fb = ac.createGain();
  fb.gain.value = 0.4;
  const delayMix = ac.createGain();
  delayMix.gain.value = 0.44;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(ac.destination);

  // 1) Deep golden gong strike — a rich, resonant ceremonial gong that opens
  //    the celebration with grand, royal authority.
  const gongFreqs = [98, 147, 196, 294, 392]; // inharmonic stack
  gongFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    const peak = [0.24, 0.15, 0.11, 0.07, 0.045][i];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8 - i * 0.22);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 2.82);
  });

  // 2) Rising brass fanfare — a cascade of sawtooth notes climbing in pitch,
  //    like a triumphant royal trumpet fanfare announcing the jackpot.
  const fanfareFreqs = [392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51]; // G4→E6
  fanfareFreqs.forEach((f, i) => {
    const start = t + 0.12 + i * 0.09;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f * 0.985, start);
    o.frequency.exponentialRampToValueAtTime(f, start + 0.04);
    const peak = 0.16 - i * 0.013;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.02);
    g.gain.setValueAtTime(peak, start + 0.14);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);

    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3400;
    lp.Q.value = 0.8;

    o.connect(lp);
    lp.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + 0.62);
  });

  // 3) Shimmering coin shower — a rapid sequence of high bell-like partials
  //    that evoke a shower of golden coins spilling from a treasure chest.
  const coinFreqs = [1318.51, 1567.98, 1760, 2093.00, 2637.02, 3135.96, 4186.01]; // E6→C8
  coinFreqs.forEach((f, i) => {
    const start = t + 0.25 + i * 0.05;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, start);
    const peak = 0.12 - i * 0.012;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 1.0);
    o.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + 1.02);
  });

  // 4) Triumphant sustained chord — a warm major chord underneath that gives
  //    the celebration a luxurious, regal body. C major with an added 9th for
  //    a bright, victorious feel. Slow swell in and a long, proud release.
  const chordFreqs = [261.63, 329.63, 392.00, 493.88, 587.33]; // C4, E4, G4, B4, D5 — Cmaj9
  chordFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t + 0.15);
    g.gain.setValueAtTime(0.0001, t + 0.15);
    g.gain.linearRampToValueAtTime(0.06 - i * 0.007, t + 0.4);
    g.gain.setValueAtTime(0.06 - i * 0.007, t + 1.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
    o.connect(g);
    g.connect(bus);
    o.start(t + 0.15);
    o.stop(t + 2.82);

    // Octave-up sine for a choir "ahh" overtone that makes the chord shimmer.
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(f * 2, t + 0.15);
    g2.gain.setValueAtTime(0.0001, t + 0.15);
    g2.gain.linearRampToValueAtTime(0.022, t + 0.45);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o2.connect(g2);
    g2.connect(bus);
    o2.start(t + 0.15);
    o2.stop(t + 2.42);
  });

  // 5) Sparkle shimmer — a very high sine sweep that adds fairy-dust magic on
  //    top of the whole celebration, peaking as the final total is revealed.
  const sparkle = ac.createOscillator();
  const sparkleG = ac.createGain();
  sparkle.type = 'sine';
  sparkle.frequency.setValueAtTime(3400, t + 0.2);
  sparkle.frequency.exponentialRampToValueAtTime(7200, t + 1.2);
  sparkleG.gain.setValueAtTime(0.0001, t + 0.2);
  sparkleG.gain.linearRampToValueAtTime(0.05, t + 0.5);
  sparkleG.gain.setValueAtTime(0.05, t + 1.3);
  sparkleG.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);
  sparkle.connect(sparkleG);
  sparkleG.connect(bus);
  sparkle.start(t + 0.2);
  sparkle.stop(t + 2.02);
}

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