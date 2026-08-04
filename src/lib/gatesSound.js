// Gates of Olympus — spin button + symbol-drop sounds (Web Audio API).
// Theme: Greek mythology — Zeus, divine thunder, crystalline Olympus gems.
// Purely cosmetic; respects the global mute flag.
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

// ── Spin button — "divine thunder" strike ──────────────────────────────
// A deep resonant gong + bright metallic attack evoking Zeus's power.
// Layered: low rumble (sine sweep), metallic ring (triangle harmonics),
// and a short noise transient for the initial "crack".
export function playSpinSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;

  // Deep divine rumble — low sine sweeping down like distant thunder.
  const rumble = ac.createOscillator();
  const rumbleG = ac.createGain();
  rumble.type = 'sine';
  rumble.frequency.setValueAtTime(110, t);
  rumble.frequency.exponentialRampToValueAtTime(55, t + 0.5);
  rumbleG.gain.setValueAtTime(0.0001, t);
  rumbleG.gain.linearRampToValueAtTime(0.22, t + 0.02);
  rumbleG.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  rumble.connect(rumbleG);
  rumbleG.connect(ac.destination);
  rumble.start(t);
  rumble.stop(t + 0.65);

  // Metallic ring — triangle harmonics for a bright "gong" character.
  const ringFreqs = [220, 330, 440, 660];
  ringFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.98, t + 0.4);
    const peak = [0.10, 0.07, 0.05, 0.03][i];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45 - i * 0.06);
    o.connect(g);
    g.connect(ac.destination);
    o.start(t);
    o.stop(t + 0.5);
  });

  // Bright attack transient — short filtered noise "crack".
  const dur = 0.04;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  }
  const n = ac.createBufferSource();
  n.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1800;
  const nG = ac.createGain();
  nG.gain.value = 0.08;
  n.connect(hp);
  hp.connect(nG);
  nG.connect(ac.destination);
  n.start(t);

  // Divine shimmer — high sine sweep trailing after the strike.
  const shimmer = ac.createOscillator();
  const shimmerG = ac.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(1568, t + 0.03);
  shimmer.frequency.exponentialRampToValueAtTime(2637, t + 0.4);
  shimmerG.gain.setValueAtTime(0.0001, t + 0.03);
  shimmerG.gain.linearRampToValueAtTime(0.04, t + 0.08);
  shimmerG.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  shimmer.connect(shimmerG);
  shimmerG.connect(ac.destination);
  shimmer.start(t + 0.03);
  shimmer.stop(t + 0.5);
}

// ── Symbol drop — crystalline Olympus chime ────────────────────────────
// A light, ethereal crystal note played once per reel when it lands.
// Pitch rises per consecutive reel (ascending cascade: low → high).
// Soft and short — never heavy or mechanical. Fits the gemstone theme.
export function playReelDropSound(reelIndex = 0) {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;

  // Pitch climbs from reel 0 → reel 5 (392Hz → 880Hz — G4 → A5).
  const baseFreq = 392 + reelIndex * 97.6;

  // Crystal chime — sine fundamental + perfect-fifth overtone for a pure,
  // bell-like tone.
  const noteFreqs = [baseFreq, baseFreq * 1.5];
  noteFreqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 1.003, t + 0.18);
    const peak = [0.09, 0.035][i];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2 - i * 0.04);
    o.connect(g);
    g.connect(ac.destination);
    o.start(t);
    o.stop(t + 0.22);
  });

  // Sparkle overtone — high sine for a glimmering, magical sheen.
  const sparkle = ac.createOscillator();
  const sparkleG = ac.createGain();
  sparkle.type = 'sine';
  sparkle.frequency.setValueAtTime(baseFreq * 3, t);
  sparkle.frequency.exponentialRampToValueAtTime(baseFreq * 2.9, t + 0.16);
  sparkleG.gain.setValueAtTime(0.0001, t);
  sparkleG.gain.linearRampToValueAtTime(0.025, t + 0.004);
  sparkleG.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  sparkle.connect(sparkleG);
  sparkleG.connect(ac.destination);
  sparkle.start(t);
  sparkle.stop(t + 0.18);

  // Soft crystal "tink" transient — very short high-passed noise.
  const dur = 0.025;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  }
  const n = ac.createBufferSource();
  n.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 3000;
  const nG = ac.createGain();
  nG.gain.value = 0.04;
  n.connect(hp);
  hp.connect(nG);
  nG.connect(ac.destination);
  n.start(t);
}

// ── Scatter landing — divine golden chime arpeggio ─────────────────────
// A bright, magical ascending arpeggio of crystal bells with a reverb tail,
// played the instant a reel containing a scatter stops. Distinct from the
// reel-drop chime so each scatter reads as a special, rewarding event.
export function playScatterDropSound() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t0 = ac.currentTime;

  // Golden bell arpeggio — E5, A5, C#6, E6 (bright, divine, ascending).
  const notes = [659.25, 880.0, 1108.73, 1318.51];
  notes.forEach((f, i) => {
    const start = t0 + i * 0.07;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, start);
    o.frequency.exponentialRampToValueAtTime(f * 1.004, start + 0.55);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.13, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
    o.connect(g);
    g.connect(ac.destination);
    o.start(start);
    o.stop(start + 0.65);
  });

  // Divine shimmer — high sine sweep on top for a golden sparkle.
  const shimmer = ac.createOscillator();
  const shimmerG = ac.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(2093, t0);
  shimmer.frequency.exponentialRampToValueAtTime(3520, t0 + 0.45);
  shimmerG.gain.setValueAtTime(0.0001, t0);
  shimmerG.gain.linearRampToValueAtTime(0.045, t0 + 0.06);
  shimmerG.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
  shimmer.connect(shimmerG);
  shimmerG.connect(ac.destination);
  shimmer.start(t0);
  shimmer.stop(t0 + 0.55);

  // Soft reverb tail — delayed faint echo of the first note.
  const echo = ac.createOscillator();
  const echoG = ac.createGain();
  echo.type = 'sine';
  echo.frequency.setValueAtTime(659.25, t0 + 0.2);
  echoG.gain.setValueAtTime(0.0001, t0 + 0.2);
  echoG.gain.linearRampToValueAtTime(0.045, t0 + 0.21);
  echoG.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.75);
  echo.connect(echoG);
  echoG.connect(ac.destination);
  echo.start(t0 + 0.2);
  echo.stop(t0 + 0.8);
}