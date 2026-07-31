// Fortune Gems — premium procedural Web Audio sound effects + ambient music

let _ctx = null;

function ctx() {
  if (typeof window === 'undefined') return null;
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { _ctx = null; }
  }
  if (_ctx && _ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.15, delay = 0) {
  const c = ctx();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol * 1.5, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// Noise burst for mechanical sounds
function noise(dur, vol = 0.1, delay = 0, filterFreq = 1000) {
  const c = ctx();
  if (!c) return;
  const t = c.currentTime + delay;
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol * 1.5, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start(t);
  src.stop(t + dur);
}

// ── Spin sounds ──

// Mechanical reel spin start — whirring + clicking
export function playSpinStart() {
  const c = ctx();
  if (!c) return;
  const t = c.currentTime;
  // Whirring sound (sawtooth sweep)
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(200, t);
  o.frequency.linearRampToValueAtTime(400, t + 0.3);
  o.frequency.linearRampToValueAtTime(180, t + 0.6);
  o.connect(g);
  g.connect(c.destination);
  g.gain.setValueAtTime(0.04, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  o.start(t);
  o.stop(t + 0.62);
  // Rapid clicking (reel teeth)
  for (let i = 0; i < 12; i++) {
    tone(800 + (i % 4) * 60, 0.02, 'square', 0.03, i * 0.04);
  }
}

// Single reel stop — solid mechanical clunk
export function playReelStop() {
  tone(120, 0.1, 'sine', 0.15);
  tone(80, 0.12, 'sine', 0.1, 0.01);
  noise(0.04, 0.06, 0, 3000);
  tone(600, 0.03, 'square', 0.04, 0.01);
}

// ── Win sounds ──

// Small win — ascending coin chimes
export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    tone(f, 0.15, 'sine', 0.12, i * 0.06);
    tone(f * 2, 0.1, 'triangle', 0.04, i * 0.06);
  });
  // Coin tinkle
  for (let i = 0; i < 4; i++) {
    tone(1200 + Math.random() * 800, 0.08, 'sine', 0.04, 0.2 + i * 0.05);
  }
}

// Big win — fanfare + coin shower
export function playBigWin() {
  const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  chord.forEach((f, i) => {
    tone(f, 0.5, 'triangle', 0.13, i * 0.05);
    tone(f * 2, 0.4, 'sine', 0.04, i * 0.05);
  });
  // Sparkle
  for (let i = 0; i < 12; i++) {
    tone(1500 + Math.random() * 1500, 0.1, 'sine', 0.04, 0.3 + i * 0.04);
  }
  // Coin shower
  for (let i = 0; i < 8; i++) {
    tone(900 + Math.random() * 400, 0.12, 'sine', 0.06, 0.4 + i * 0.06);
    tone(1800 + Math.random() * 600, 0.06, 'sine', 0.03, 0.4 + i * 0.06);
  }
}

// Multiplier reveal — magical ascending chime
export function playMultiplier() {
  const notes = [659.25, 783.99, 987.77, 1318.5, 1568, 2093];
  notes.forEach((f, i) => {
    tone(f, 0.2, 'sine', 0.12, i * 0.06);
    tone(f * 2, 0.15, 'triangle', 0.04, i * 0.06);
  });
  for (let i = 0; i < 6; i++) {
    tone(2000 + Math.random() * 1000, 0.08, 'sine', 0.03, 0.3 + i * 0.03);
  }
}

// Bonus/scatter trigger — special fanfare
export function playBonusTrigger() {
  const notes = [392, 523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((f, i) => {
    tone(f, 0.3, 'triangle', 0.14, i * 0.08);
    tone(f * 2, 0.25, 'sine', 0.05, i * 0.08);
  });
  for (let i = 0; i < 10; i++) {
    tone(1600 + Math.random() * 1200, 0.1, 'sine', 0.04, 0.5 + i * 0.04);
  }
}

// Free spin start — exciting announcement
export function playFreeSpinStart() {
  const chord = [523.25, 659.25, 783.99, 1046.5];
  chord.forEach((f) => {
    tone(f, 0.8, 'triangle', 0.12);
    tone(f * 2, 0.6, 'sine', 0.04);
  });
  const arp = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093];
  arp.forEach((f, i) => {
    tone(f, 0.15, 'sine', 0.1, 0.2 + i * 0.05);
  });
  for (let i = 0; i < 8; i++) {
    tone(1800 + Math.random() * 1000, 0.1, 'sine', 0.04, 0.6 + i * 0.04);
  }
}

// No win — soft descending tone
export function playLose() {
  tone(300, 0.1, 'sine', 0.05);
  tone(250, 0.12, 'sine', 0.04, 0.06);
}

// Button click — soft click
export function playClick() {
  tone(1000, 0.03, 'square', 0.05);
  tone(600, 0.02, 'sine', 0.03, 0.01);
}

// ── Ambient background music — luxury casino lounge loop ──
// Smooth jazz-style chord progression: Cmaj7 – Am7 – Dm7 – G7
const BGM_CHORDS = [
  { bass: 130.81, notes: [261.63, 329.63, 392.00, 493.88] }, // Cmaj7
  { bass: 110.00, notes: [220.00, 261.63, 329.63, 392.00] }, // Am7
  { bass: 146.83, notes: [293.66, 349.23, 440.00, 523.25] }, // Dm7
  { bass: 98.00,  notes: [196.00, 246.94, 293.66, 349.23] }, // G7
];
const BGM_CHORD_DUR = 2.5;

let _bgm = null;
let _bgmTimer = null;

function playChord(idx) {
  const c = ctx();
  if (!c || !_bgm || _bgm.stopped) return;
  const chord = BGM_CHORDS[idx % BGM_CHORDS.length];

  // Bass note
  tone(chord.bass, BGM_CHORD_DUR * 0.9, 'sine', 0.04);
  tone(chord.bass / 2, BGM_CHORD_DUR * 0.9, 'sine', 0.025);

  // Pad chord (sustained)
  chord.notes.forEach((f) => tone(f, BGM_CHORD_DUR * 0.85, 'triangle', 0.015));

  // Arpeggio melody
  chord.notes.forEach((f, i) => {
    tone(f * 2, 0.25, 'sine', 0.012, i * 0.18);
    tone(f * 2, 0.25, 'sine', 0.012, 0.9 + i * 0.18);
  });

  _bgmTimer = setTimeout(() => playChord(idx + 1), BGM_CHORD_DUR * 1000);
}

export function startAmbient() {
  const c = ctx();
  if (!c || _bgm) return;
  _bgm = { stopped: false };
  playChord(0);
}

export function stopAmbient() {
  if (!_bgm) return;
  _bgm.stopped = true;
  if (_bgmTimer) { clearTimeout(_bgmTimer); _bgmTimer = null; }
  _bgm = null;
}