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
  // descending whoosh
  const o = ac.createOscillator(); const g = ac.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(900, t);
  o.frequency.exponentialRampToValueAtTime(220, t + 0.5);
  o.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  o.start(t); o.stop(t + 0.52);
  [0, 1, 2, 3, 4].forEach((i) => tone(1400 - i * 120, t + i * 0.06, 0.1, 'triangle', 0.05));
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