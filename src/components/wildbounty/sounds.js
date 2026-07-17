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
    // Premium mechanical reel spin: smooth wind-up → sustained rotation hum
    // with gear ticking → brake/deceleration → solid stop thunk.
    const ac = getCtx();
    if (!ac) return;
    const t0 = ac.currentTime;
    const total = 1.5; // total spin duration in seconds

    // 1) Low mechanical motor hum (sawtooth) with slow vibrato
    const hum = ac.createOscillator();
    const humg = ac.createGain();
    const lfo = ac.createOscillator();
    const lfog = ac.createGain();
    hum.type = 'sawtooth';
    hum.frequency.setValueAtTime(70, t0);
    hum.frequency.exponentialRampToValueAtTime(120, t0 + 0.35); // wind-up
    hum.frequency.setValueAtTime(120, t0 + 0.35);
    hum.frequency.exponentialRampToValueAtTime(95, t0 + total - 0.25); // slight decay
    hum.frequency.exponentialRampToValueAtTime(60, t0 + total - 0.02); // brake down
    lfo.frequency.value = 8;
    lfog.gain.value = 5;
    lfo.connect(lfog).connect(hum.frequency);
    humg.gain.setValueAtTime(0.0001, t0);
    humg.gain.exponentialRampToValueAtTime(VOL * 0.32, t0 + 0.08); // ramp in
    humg.gain.setValueAtTime(VOL * 0.32, t0 + total - 0.25); // hold
    humg.gain.exponentialRampToValueAtTime(VOL * 0.16, t0 + total - 0.08); // soften at brake
    humg.gain.exponentialRampToValueAtTime(0.0001, t0 + total);
    hum.connect(humg).connect(ac.destination);
    hum.start(t0); hum.stop(t0 + total + 0.05);
    lfo.start(t0); lfo.stop(t0 + total + 0.05);

    // 2) Mid whir (triangle) tracking the motor speed
    const whir = ac.createOscillator();
    const whirg = ac.createGain();
    whir.type = 'triangle';
    whir.frequency.setValueAtTime(220, t0);
    whir.frequency.exponentialRampToValueAtTime(520, t0 + 0.35); // wind-up
    whir.frequency.setValueAtTime(520, t0 + 0.35);
    whir.frequency.exponentialRampToValueAtTime(420, t0 + total - 0.25);
    whir.frequency.exponentialRampToValueAtTime(180, t0 + total - 0.02); // brake
    whirg.gain.setValueAtTime(0.0001, t0);
    whirg.gain.exponentialRampToValueAtTime(VOL * 0.2, t0 + 0.1);
    whirg.gain.setValueAtTime(VOL * 0.2, t0 + total - 0.25);
    whirg.gain.exponentialRampToValueAtTime(0.0001, t0 + total);
    whir.connect(whirg).connect(ac.destination);
    whir.start(t0); whir.stop(t0 + total + 0.05);

    // 3) Filtered air-friction hiss that follows the speed
    const len = Math.floor(ac.sampleRate * total);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1);
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const ng = ac.createGain();
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(900, t0);
    bp.frequency.exponentialRampToValueAtTime(2400, t0 + 0.35); // rises with speed
    bp.frequency.setValueAtTime(2400, t0 + total - 0.25);
    bp.frequency.exponentialRampToValueAtTime(1000, t0 + total - 0.02); // falls at brake
    bp.Q.value = 1.4;
    ng.gain.setValueAtTime(0.0001, t0);
    ng.gain.exponentialRampToValueAtTime(VOL * 0.16, t0 + 0.12);
    ng.gain.setValueAtTime(VOL * 0.16, t0 + total - 0.25);
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + total);
    noise.connect(bp).connect(ng).connect(ac.destination);
    noise.start(t0); noise.stop(t0 + total + 0.02);

    // 4) Gear ticking: clicks start slow during wind-up, get faster, then
    //    slow again during braking (doppler-like mechanical feel).
    const tickCount = 60;
    for (let i = 0; i < tickCount; i++) {
      // progress 0..1, with ease so ticks cluster mid-spin
      const p = i / (tickCount - 1);
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const d = ease * (total - 0.05);
      // tick pitch slightly rises mid-spin then falls
      const f = 2400 + 900 * Math.sin(p * Math.PI) + Math.random() * 200;
      tone({ freq: f, type: 'square', dur: 0.025, gain: VOL * 0.1, delay: d });
    }

    // 5) Final stop thunk: solid metallic brake + low body thud
    const thunk = ac.createOscillator();
    const thunkg = ac.createGain();
    thunk.type = 'square';
    thunk.frequency.setValueAtTime(320, t0 + total - 0.02);
    thunk.frequency.exponentialRampToValueAtTime(70, t0 + total + 0.12);
    thunkg.gain.setValueAtTime(0.0001, t0 + total - 0.02);
    thunkg.gain.exponentialRampToValueAtTime(VOL * 0.4, t0 + total - 0.01);
    thunkg.gain.exponentialRampToValueAtTime(0.0001, t0 + total + 0.14);
    thunk.connect(thunkg).connect(ac.destination);
    thunk.start(t0 + total - 0.02); thunk.stop(t0 + total + 0.18);

    tone({ freq: 160, type: 'sine', dur: 0.18, gain: VOL * 0.35, delay: total - 0.02 });
    tone({ freq: 2600, type: 'square', dur: 0.04, gain: VOL * 0.18, delay: total - 0.02 });
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