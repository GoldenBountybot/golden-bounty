// Simple Web Audio sound engine for Wild Bounty (no external files).
// All sounds synthesised; volume pushed to 150% per request.
let ctx = null;
const VOL = 1.5;

function getCtx() {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone({ freq, type = 'sine', dur = 0.2, gain = VOL, delay = 0, sweepTo }) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

export const sfx = {
  spin() {
    // rising whir as reels start
    tone({ freq: 200, sweepTo: 560, type: 'sawtooth', dur: 0.55, gain: VOL * 0.45 });
  },
  blast() {
    // shatter crack: noise burst + high metal clang
    const ac = getCtx();
    if (!ac) return;
    const t0 = ac.currentTime;
    const len = Math.floor(ac.sampleRate * 0.28);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    }
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const g = ac.createGain();
    g.gain.setValueAtTime(VOL, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
    const filter = ac.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 700;
    noise.connect(filter).connect(g).connect(ac.destination);
    noise.start(t0);
    noise.stop(t0 + 0.3);
    tone({ freq: 1100, type: 'square', dur: 0.2, gain: VOL * 0.3 });
    tone({ freq: 420, type: 'triangle', dur: 0.18, gain: VOL * 0.25, delay: 0.02 });
  },
  win() {
    // ascending gold chime
    [523, 659, 784, 1047].forEach((f, i) =>
      tone({ freq: f, type: 'triangle', dur: 0.32, gain: VOL * 0.5, delay: i * 0.085 })
    );
  },
  anticipation() {
    // suspense drone when 2 scatters land and remaining reels slow down
    tone({ freq: 150, sweepTo: 380, type: 'sawtooth', dur: 1.4, gain: VOL * 0.3 });
    tone({ freq: 80, type: 'sine', dur: 1.4, gain: VOL * 0.25 });
  },
  loss() {
    // descending dull buzz
    tone({ freq: 300, sweepTo: 110, type: 'sawtooth', dur: 0.55, gain: VOL * 0.4 });
  },
  coins() {
    // a pile of coins clinking together as the multiplier lands in the win banner
    for (let i = 0; i < 16; i++) {
      const f = 1400 + Math.random() * 1900;
      tone({ freq: f, type: 'triangle', dur: 0.12, gain: VOL * (0.16 + Math.random() * 0.14), delay: i * 0.04 });
      tone({ freq: f * 1.5, type: 'sine', dur: 0.1, gain: VOL * 0.09, delay: i * 0.04 + 0.012 });
    }
  },
};