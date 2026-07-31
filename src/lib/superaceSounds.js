// Web Audio synth for SuperAce — no assets needed.
let _actx = null;
function actx() {
  if (typeof window === 'undefined') return null;
  if (!_actx) {
    try { _actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { _actx = null; }
  }
  return _actx;
}

function tone(freq, t0, dur, type = 'triangle', gain = 0.12) {
  const ac = actx(); if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

export function playSpinStart() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  // Mechanical reel spin — rapid ticking + descending whoosh + gear whir.
  const o = ac.createOscillator(); const g = ac.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(1200, t);
  o.frequency.exponentialRampToValueAtTime(180, t + 0.6);
  o.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(0.05, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  o.start(t); o.stop(t + 0.62);
  // Gear whir (mid-frequency buzz)
  const w = ac.createOscillator(); const wg = ac.createGain();
  w.type = 'square'; w.frequency.setValueAtTime(440, t);
  w.frequency.linearRampToValueAtTime(660, t + 0.3);
  w.frequency.linearRampToValueAtTime(300, t + 0.6);
  w.connect(wg); wg.connect(ac.destination);
  wg.gain.setValueAtTime(0.025, t);
  wg.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  w.start(t); w.stop(t + 0.62);
  // Rapid ticking (reel teeth)
  for (let i = 0; i < 14; i++) {
    tone(900 + (i % 3) * 80, t + i * 0.04, 0.03, 'square', 0.04);
  }
}

export function playReelLand() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  tone(180, t, 0.12, 'sine', 0.18);
  tone(120, t, 0.18, 'sine', 0.12);
}

export function playComboWin(combo) {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  const base = 523.25 * Math.pow(1.122, Math.min(combo, 6));
  const notes = [base, base * 1.25, base * 1.5, base * 2];
  notes.forEach((f, i) => {
    const s = t + i * 0.07;
    tone(f, s, 0.22, 'triangle', 0.13);
    tone(f * 2, s, 0.18, 'sine', 0.05);
  });
}

export function playCascade() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  for (let i = 0; i < 6; i++) tone(700 + i * 90, t + i * 0.03, 0.08, 'triangle', 0.05);
}

export function playScatter() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  const notes = [659.25, 783.99, 987.77, 1318.5, 1568, 2093];
  notes.forEach((f, i) => {
    const s = t + i * 0.1;
    tone(f, s, 0.32, 'sine', 0.12);
    tone(f * 2, s, 0.24, 'triangle', 0.04);
  });
}

export function playBigWin() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  chord.forEach((f, i) => {
    const s = t + i * 0.06;
    tone(f, s, 0.6, 'triangle', 0.13);
    tone(f * 2, s, 0.5, 'sine', 0.05);
  });
  // sparkle
  for (let i = 0; i < 10; i++) {
    const s = t + 0.3 + i * 0.05;
    tone(1800 + Math.random() * 1200, s, 0.1, 'sine', 0.04);
  }
}

export function playLose() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  [392, 329.63, 261.63].forEach((f, i) => tone(f, t + i * 0.1, 0.22, 'sine', 0.07));
}

export function playClick() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  tone(880, t, 0.05, 'square', 0.05);
}

// ── Voice announcements (browser speechSynthesis — free, offline) ──
const CARD_NAMES = {
  A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack',
  S: 'Spade', H: 'Heart', D: 'Diamond', C: 'Club',
  W: 'Wild', SC: 'Scatter',
};

const MULT_NAMES = {
  1: '', 2: 'double', 3: 'triple', 4: 'four times',
  5: 'five times', 6: 'six times', 10: 'ten times',
};

let _femaleVoice = null;
function pickFemaleVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  if (_femaleVoice) return _femaleVoice;
  const voices = window.speechSynthesis.getVoices();
  // Prefer common English female voices (Google US English, Samantha, Zira, etc.)
  const female = voices.find((v) =>
    /female|samantha|zira|google us english|karen|tessa|moira|fiona|veena|alice/i.test(v.name)
  ) || voices.find((v) => v.lang.startsWith('en') && /samantha|zira|karen|veena|google/i.test(v.name))
  || voices.find((v) => v.lang.startsWith('en'));
  _femaleVoice = female || null;
  return _femaleVoice;
}

// Warm up the voice list (loads asynchronously in some browsers).
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { _femaleVoice = null; pickFemaleVoice(); };
}

function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    const v = pickFemaleVoice();
    if (v) u.voice = v;
    // Excited female announcer — thin, shrill, high-pitched winning-call vibe.
    u.rate = 1.3; u.pitch = 1.9; u.volume = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

// Announce winning card name(s) + multiplier level (double/triple/five times…).
export function announceWin(symbols, mult) {
  if (!symbols || symbols.length === 0) return;
  const names = symbols.map((s) => CARD_NAMES[s] || s).join(', ');
  const multWord = MULT_NAMES[mult] || '';
  speak(multWord ? `${names}, ${multWord}` : names);
}

// Card drop — soft pluck when new cards land after a cascade.
export function playCardDrop() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  tone(320, t, 0.08, 'sine', 0.10);
  tone(160, t, 0.12, 'sine', 0.06);
}

// ── Background gaming ambient — continuous, no music, just atmosphere ──
let _ambient = null;
export function startAmbient() {
  const ac = actx(); if (!ac || _ambient) return;
  const t = ac.currentTime;
  // Low pulsing drone
  const bass = ac.createOscillator();
  const bassGain = ac.createGain();
  bass.type = 'sine'; bass.frequency.value = 55;
  bassGain.gain.value = 0.025;
  bass.connect(bassGain); bassGain.connect(ac.destination);
  bass.start();
  // LFO pulse on the bass
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  lfo.type = 'sine'; lfo.frequency.value = 0.4;
  lfoGain.gain.value = 0.015;
  lfo.connect(lfoGain); lfoGain.connect(bassGain.gain);
  lfo.start();
  // High shimmer pad
  const shimmer = ac.createOscillator();
  const shimmerGain = ac.createGain();
  shimmer.type = 'triangle'; shimmer.frequency.value = 660;
  shimmerGain.gain.value = 0.006;
  shimmer.connect(shimmerGain); shimmerGain.connect(ac.destination);
  shimmer.start();
  // Second shimmer layer (fifth above)
  const shimmer2 = ac.createOscillator();
  const shimmer2Gain = ac.createGain();
  shimmer2.type = 'sine'; shimmer2.frequency.value = 990;
  shimmer2Gain.gain.value = 0.004;
  shimmer2.connect(shimmer2Gain); shimmer2Gain.connect(ac.destination);
  shimmer2.start();
  _ambient = { bass, lfo, shimmer, shimmer2 };
}

export function stopAmbient() {
  if (!_ambient) return;
  try {
    _ambient.bass.stop(); _ambient.lfo.stop();
    _ambient.shimmer.stop(); _ambient.shimmer2.stop();
  } catch {}
  _ambient = null;
}