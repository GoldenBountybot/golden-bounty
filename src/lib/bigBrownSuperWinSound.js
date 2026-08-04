// Big Brown — premium casino "Super Win" coin-counting sound.
// A luxurious cascade of golden coins + triumphant rising chord + sparkle
// chimes, played while the Super Win banner counts up the total free-spin
// winnings. Background music is ducked for the duration of the sound.
import { isMuted } from '@/lib/soundMute';
import { duckBg } from '@/lib/bigBrownBackgroundMusic';

let ctx = null;
function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { ctx = null; }
  }
  return ctx;
}

// A single golden coin "clink" — bright metallic ping with a quick decay.
function coinClink(ac, t, freq, gain) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.96, t + 0.18);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(g);
  g.connect(ac.destination);
  o.start(t);
  o.stop(t + 0.26);

  // Metallic shimmer overtone for a "gold" character.
  const o2 = ac.createOscillator();
  const g2 = ac.createGain();
  o2.type = 'sine';
  o2.frequency.setValueAtTime(freq * 2.76, t);
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.linearRampToValueAtTime(gain * 0.35, t + 0.004);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  o2.connect(g2);
  g2.connect(ac.destination);
  o2.start(t);
  o2.stop(t + 0.18);
}

// A triumphant rising chord — rich brass-like pad.
function chordPad(ac, t, freqs, dur, gain) {
  freqs.forEach((f) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    const lp = ac.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, t);
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2400, t);
    lp.frequency.exponentialRampToValueAtTime(1600, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.12);
    g.gain.setValueAtTime(gain, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp);
    lp.connect(g);
    g.connect(ac.destination);
    o.start(t);
    o.stop(t + dur + 0.1);
  });
}

// Sparkle chime — high crystal bell arpeggio.
function sparkleChime(ac, t, freqs, gain) {
  freqs.forEach((f, i) => {
    const start = t + i * 0.05;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    o.connect(g);
    g.connect(ac.destination);
    o.start(start);
    o.stop(start + 0.55);
  });
}

// Play the full Super Win fanfare. `durationMs` should match the coin-count
// animation duration so the coin clinks stay in sync with the counting.
export function playSuperWinSound(durationMs = 3000) {
  if (isMuted()) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  duckBg();

  const t0 = ac.currentTime;
  const durSec = Math.max(1.5, durationMs / 1000);

  // 1) Opening triumphant chord — C major (C4, E4, G4, C5).
  chordPad(ac, t0, [261.6, 329.6, 392.0, 523.2], 0.9, 0.10);

  // 2) Coin cascade — a stream of golden coin clinks across the whole
  //    duration. Pitch gently rises over time for a building excitement feel.
  const coinCount = Math.max(12, Math.floor(durSec * 7));
  for (let i = 0; i < coinCount; i++) {
    const progress = i / coinCount;
    const start = t0 + 0.15 + progress * (durSec - 0.3);
    // Pitch rises from ~880Hz to ~1760Hz across the cascade.
    const freq = 880 + progress * 880 + (Math.random() - 0.5) * 120;
    const gain = 0.06 + Math.random() * 0.04;
    coinClink(ac, start, freq, gain);
  }

  // 3) Sparkle chimes sprinkled throughout.
  const sparkleSets = [
    [2093, 2637, 3136],
    [2349, 2793, 3520],
    [2637, 3136, 4186],
  ];
  const sparkleCount = Math.max(3, Math.floor(durSec * 1.5));
  for (let i = 0; i < sparkleCount; i++) {
    const start = t0 + 0.3 + (i / sparkleCount) * (durSec - 0.5);
    const set = sparkleSets[i % sparkleSets.length];
    sparkleChime(ac, start, set, 0.04);
  }

  // 4) Final triumphant chord — C major an octave up, sustained + a bright
  //    coin flourish on the last beat for a satisfying resolution.
  const tEnd = t0 + durSec;
  chordPad(ac, tEnd - 0.8, [523.2, 659.2, 784.0, 1046.5], 1.2, 0.12);
  // Final coin flourish — a quick descending run of 5 clinks.
  for (let i = 0; i < 5; i++) {
    coinClink(ac, tEnd - 0.5 + i * 0.08, 1760 - i * 140, 0.09);
  }
  // Big final crash — low boom + bright cymbal-ish noise sweep.
  const boom = ac.createOscillator();
  const boomG = ac.createGain();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(130, tEnd - 0.1);
  boom.frequency.exponentialRampToValueAtTime(60, tEnd + 0.4);
  boomG.gain.setValueAtTime(0.0001, tEnd - 0.1);
  boomG.gain.linearRampToValueAtTime(0.18, tEnd - 0.05);
  boomG.gain.exponentialRampToValueAtTime(0.0001, tEnd + 0.5);
  boom.connect(boomG);
  boomG.connect(ac.destination);
  boom.start(tEnd - 0.1);
  boom.stop(tEnd + 0.55);
}