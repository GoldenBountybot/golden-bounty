// Fortune Gems — procedural Web Audio sound effects

let _ctx = null;

function ctx() {
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
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
  gain.gain.linearRampToValueAtTime(vol * 1.5, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + dur);
}

export function playSpinStart() {
  tone(180, 0.12, 'sawtooth', 0.08);
  tone(280, 0.08, 'sawtooth', 0.06, 0.04);
}

export function playReelLand() {
  tone(140, 0.06, 'square', 0.1);
  tone(100, 0.04, 'square', 0.06, 0.02);
}

export function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'sine', 0.12, i * 0.07));
}

export function playBigWin() {
  [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.15, 'triangle', 0.15, i * 0.08));
}

export function playLose() {
  tone(200, 0.12, 'sawtooth', 0.06);
  tone(150, 0.16, 'sawtooth', 0.05, 0.08);
}

export function playClick() {
  tone(800, 0.04, 'square', 0.06);
}

export function playMultiplier() {
  [400, 600, 800, 1200, 1600].forEach((f, i) => tone(f, 0.1, 'triangle', 0.13, i * 0.05));
}