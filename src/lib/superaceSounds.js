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

  // Luxury premium spin — smooth silky sweep + soft chime + elegant whoosh.
  // 1. Opening crystal chime (luxury sparkle)
  tone(1318.5, t, 0.15, 'sine', 0.06);
  tone(1975.5, t + 0.04, 0.12, 'sine', 0.04);
  tone(2637, t + 0.08, 0.10, 'sine', 0.03);

  // 2. Smooth silky frequency sweep (premium reel whoosh)
  const o = ac.createOscillator(); const g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(220, t + 0.1);
  o.frequency.exponentialRampToValueAtTime(880, t + 0.35);
  o.frequency.exponentialRampToValueAtTime(160, t + 0.9);
  o.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(0.0001, t + 0.1);
  g.gain.exponentialRampToValueAtTime(0.07, t + 0.2);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
  o.start(t + 0.1); o.stop(t + 0.98);

  // 3. Soft warm pad underneath (luxury body)
  const p = ac.createOscillator(); const pg = ac.createGain();
  p.type = 'triangle'; p.frequency.setValueAtTime(110, t + 0.1);
  p.frequency.linearRampToValueAtTime(165, t + 0.5);
  p.frequency.linearRampToValueAtTime(110, t + 0.9);
  p.connect(pg); pg.connect(ac.destination);
  pg.gain.setValueAtTime(0.0001, t + 0.1);
  pg.gain.exponentialRampToValueAtTime(0.035, t + 0.25);
  pg.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
  p.start(t + 0.1); p.stop(t + 0.98);

  // 4. Elegant soft ticking (refined, not mechanical)
  for (let i = 0; i < 8; i++) {
    tone(1200 + i * 40, t + 0.15 + i * 0.08, 0.04, 'sine', 0.025);
  }

  // 5. Closing luxury shimmer
  tone(2093, t + 0.7, 0.2, 'sine', 0.03);
  tone(2637, t + 0.75, 0.15, 'sine', 0.02);
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

// Big coin drop — metallic "tang" when a scatter symbol lands on the reels.
export function playScatterLand() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  // 1. Sharp metallic attack (the "tang")
  tone(2200, t, 0.08, 'triangle', 0.18);
  tone(3300, t, 0.06, 'sine', 0.12);
  // 2. Bell-like metallic ring (sustain)
  tone(1568, t, 0.5, 'sine', 0.14);
  tone(2093, t, 0.45, 'sine', 0.08);
  tone(2637, t, 0.4, 'triangle', 0.05);
  // 3. Low body (coin weight)
  tone(220, t, 0.3, 'sine', 0.15);
  tone(110, t, 0.4, 'sine', 0.10);
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

// Multiplier-value-based announcement words: x1 = name only, x2 = double, x3 = triple, etc.
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
    window.speechSynthesis.cancel();
    const doSpeak = () => {
      const u = new SpeechSynthesisUtterance(text);
      const v = pickFemaleVoice();
      if (v) u.voice = v;
      // Ultra-thin, beautiful, excited female casino announcer — max pitch + faster rate.
      u.rate = 1.5; u.pitch = 2.0; u.volume = 1.0;
      window.speechSynthesis.speak(u);
    };
    // Small delay after cancel — some browsers drop the utterance if speak is immediate.
    setTimeout(doSpeak, 60);
  } catch {}
}

// Announce winning card name(s) + the lit multiplier value (double/triple/five times…).
export function announceWin(symbols, mult) {
  if (!symbols || symbols.length === 0) return;
  const names = symbols.map((s) => CARD_NAMES[s] || s).join(', ');
  const multWord = MULT_NAMES[mult] != null ? MULT_NAMES[mult] : (mult > 1 ? `${mult} times` : '');
  speak(multWord ? `${names}, ${multWord}` : names);
}

// Card drop — soft pluck when new cards land after a cascade.
export function playCardDrop() {
  const ac = actx(); if (!ac) return;
  const t = ac.currentTime;
  tone(320, t, 0.08, 'sine', 0.10);
  tone(160, t, 0.12, 'sine', 0.06);
}

// ── Background music — continuous looping chord progression (casino vibe) ──
// Am – F – C – G  (vi – IV – I – V in C major): uplifting, endless loop.
const BGM_CHORDS = [
  { bass: 110.00, notes: [220.00, 261.63, 329.63] },   // Am
  { bass: 87.31,  notes: [174.61, 220.00, 261.63] },   // F
  { bass: 130.81, notes: [261.63, 329.63, 392.00] },   // C
  { bass: 98.00,  notes: [196.00, 246.94, 293.66] },   // G
];
const BGM_CHORD_DUR = 2.0; // seconds per chord

let _bgm = null;
let _bgmTimer = null;

function playChord(idx) {
  const ac = actx();
  if (!ac || !_bgm || _bgm.stopped) return;
  const t = ac.currentTime;
  const chord = BGM_CHORDS[idx % BGM_CHORDS.length];

  // Bass note (deep, soft) — 150% volume
  tone(chord.bass, t, BGM_CHORD_DUR * 0.95, 'sine', 0.075);
  tone(chord.bass / 2, t, BGM_CHORD_DUR * 0.95, 'sine', 0.045);

  // Pad chord (sustained, warm) — 150% volume
  chord.notes.forEach((f) => tone(f, t, BGM_CHORD_DUR * 0.9, 'triangle', 0.027));

  // Arpeggio melody on top — 150% volume
  chord.notes.forEach((f, i) => {
    tone(f * 2, t + i * 0.22, 0.28, 'sine', 0.018);
    tone(f * 2, t + 0.9 + i * 0.22, 0.28, 'sine', 0.018);
  });

  // Sparkle accent — 150% volume
  tone(chord.notes[2] * 4, t + 0.5, 0.15, 'sine', 0.012);

  _bgmTimer = setTimeout(() => playChord(idx + 1), BGM_CHORD_DUR * 1000);
}

export function startAmbient() {
  const ac = actx(); if (!ac || _bgm) return;
  _bgm = { stopped: false };
  playChord(0);
}

export function stopAmbient() {
  if (!_bgm) return;
  _bgm.stopped = true;
  if (_bgmTimer) { clearTimeout(_bgmTimer); _bgmTimer = null; }
  _bgm = null;
}