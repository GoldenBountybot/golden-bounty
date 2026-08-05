// Plinko — cosmic ambient background music (Web Audio API synthesis).
// A dreamy, mystical loop: shimmering arpeggio bells, warm evolving pad,
// deep sub-bass pulse, and soft cosmic chimes. Fits the purple/cosmic vibe.
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

let bgNodes = null;

export function startPlinkoMusic() {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (bgNodes) return;

  const master = ac.createGain();
  master.gain.value = 0.4;
  master.connect(ac.destination);

  // Warm low-pass for a soft, dreamy tone.
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3800;
  lp.Q.value = 0.4;
  lp.connect(master);

  // Gentle stereo-style shimmer via a slow LFO on a gain.
  // ── Chord progression — Am9 → Fmaj7 → Cmaj7 → G6 (vi-IV-I-V) ──
  // Each chord lasts 4s. Frequencies (Hz).
  const chords = [
    [110, 146.83, 196, 220, 261.63],   // Am9
    [87.31, 130.81, 174.61, 220, 261.63], // Fmaj7
    [130.81, 164.81, 196, 261.63, 329.63], // Cmaj7
    [98, 123.47, 196, 246.94, 293.66],  // G6
  ];
  // Arpeggio note pools (one octave up).
  const arps = [
    [440, 587.33, 659.25, 880],
    [349.23, 440, 523.25, 698.46],
    [523.25, 659.25, 783.99, 1046.5],
    [392, 493.88, 587.33, 783.99],
  ];
  // Bass roots per chord.
  const bassRoots = [55, 43.65, 65.41, 49];
  let chordIdx = 0;

  // ── Warm evolving pad ──
  const padGain = ac.createGain();
  padGain.gain.value = 0.5;
  padGain.connect(lp);

  function playPad() {
    const now = ac.currentTime;
    const chord = chords[chordIdx % chords.length];
    const dur = 4.0;
    chord.forEach((f) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, now);
      // slow vibrato for life
      const lfo = ac.createOscillator();
      const lfoG = ac.createGain();
      lfo.frequency.value = 0.28;
      lfoG.gain.value = 1.4;
      lfo.connect(lfoG);
      lfoG.connect(o.frequency);
      lfo.start(now);
      lfo.stop(now + dur + 0.1);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.09, now + 0.6);
      g.gain.setValueAtTime(0.09, now + dur - 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g);
      g.connect(padGain);
      o.start(now);
      o.stop(now + dur + 0.05);
    });
  }

  // ── Shimmering arpeggio bells ──
  const arpGain = ac.createGain();
  arpGain.gain.value = 0.5;
  arpGain.connect(lp);

  function playArp() {
    const now = ac.currentTime;
    const pool = arps[chordIdx % arps.length];
    for (let i = 0; i < 8; i++) {
      const f = pool[i % pool.length];
      const t = now + i * 0.25;
      // Main bell
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.11, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g);
      g.connect(arpGain);
      o.start(t);
      o.stop(t + 0.4);
      // Sparkle harmonic
      const sp = ac.createOscillator();
      const spG = ac.createGain();
      sp.type = 'sine';
      sp.frequency.setValueAtTime(f * 2, t);
      spG.gain.setValueAtTime(0.0001, t);
      spG.gain.linearRampToValueAtTime(0.045, t + 0.01);
      spG.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      sp.connect(spG);
      spG.connect(arpGain);
      sp.start(t);
      sp.stop(t + 0.35);
    }
  }

  // ── Deep sub-bass pulse — root on beats 1 and 3 ──
  const bassGain = ac.createGain();
  bassGain.gain.value = 0.5;
  bassGain.connect(lp);

  function playBass() {
    const now = ac.currentTime;
    const root = bassRoots[chordIdx % bassRoots.length];
    [0, 2].forEach((beat) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(root, now + beat);
      g.gain.setValueAtTime(0.0001, now + beat);
      g.gain.linearRampToValueAtTime(0.3, now + beat + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, now + beat + 0.7);
      o.connect(g);
      g.connect(bassGain);
      o.start(now + beat);
      o.stop(now + beat + 0.75);
    });
  }

  // ── Soft cosmic chime — a high bell on chord change ──
  const chimeGain = ac.createGain();
  chimeGain.gain.value = 0.5;
  chimeGain.connect(lp);

  function playChime() {
    const now = ac.currentTime;
    const f = arps[chordIdx % arps.length][0] * 2;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.07, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    o.connect(g);
    g.connect(chimeGain);
    o.start(now);
    o.stop(now + 1.25);
  }

  // ── Sequencer — every 4s advance the chord ──
  function step() {
    playPad();
    playArp();
    playBass();
    playChime();
    chordIdx++;
  }
  step();
  const stepTimer = setInterval(step, 4000);

  bgNodes = {
    stop: () => {
      clearInterval(stepTimer);
      try { master.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.3); } catch {}
      setTimeout(() => { try { master.disconnect(); } catch {} }, 400);
      bgNodes = null;
    },
  };
}

export function stopPlinkoMusic() {
  if (bgNodes) bgNodes.stop();
}

const plinkoSound = { startPlinkoMusic, stopPlinkoMusic };
export default plinkoSound;