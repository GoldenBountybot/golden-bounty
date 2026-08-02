// Simple Web Audio sound engine for Wild Bounty (no external files).
// All sounds synthesised; volume pushed to 150% per request.
import { isMuted as isGlobalMuted, toggleMute as toggleGlobalMute } from '@/lib/soundMute';
let ctx = null;
const VOL = 1.5;

// Uploaded mechanical spin sound (looped while reels are spinning).
const SPIN_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/42593c193_20260717094905_0_0.mp3';
// Uploaded win-sequence sound — plays through the whole matching/shatter/
// multiplier chain until the round ends.
const WINSEQ_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/3d0b01f51_20260717094905_2.mp3';
// Uploaded scatter-land sting — plays once per scatter that lands.
const SCATTER_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/8260a4cd3_scater_0.mp3';
// Uploaded spin-button click sound — plays once when the player taps Spin.
const SPIN_CLICK_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/d0ba94ac5_spinbuttonclicksound.mp3';
// Uploaded symbol-match sound — plays when spinning symbols match.
const SYM_MATCH_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/08650935f_SpinSymbleMachSound_0.mp3';
let spinBuffer = null;
let spinLoading = false;
let spinAudio = null;
let spinFilterChain = null;
let winSeqBuffer = null;
let winSeqLoading = false;
let winSeqAudio = null;
let winSeqPending = false;
let winSeqPendingRate = 1;
let scatterBuffer = null;
let scatterLoading = false;
let spinClickBuffer = null;
let spinClickLoading = false;
let symMatchBuffer = null;
let symMatchLoading = false;

async function loadSpinBuffer() {
  if (spinBuffer || spinLoading) return;
  spinLoading = true;
  try {
    const res = await fetch(SPIN_URL);
    const arr = await res.arrayBuffer();
    const ac = getCtx();
    if (ac) spinBuffer = await ac.decodeAudioData(arr);
  } catch {
    // ignore — fallback synth path handles it
  } finally {
    spinLoading = false;
  }
}

async function loadWinSeqBuffer() {
  if (winSeqBuffer || winSeqLoading) return;
  winSeqLoading = true;
  try {
    const res = await fetch(WINSEQ_URL);
    const arr = await res.arrayBuffer();
    const ac = getCtx();
    if (ac) winSeqBuffer = await ac.decodeAudioData(arr);
  } catch {
    // ignore
  } finally {
    winSeqLoading = false;
    // If a win arrived while the buffer was still loading, start it now.
    if (winSeqPending && winSeqBuffer) {
      winSeqPending = false;
      startWinSeq(winSeqPendingRate);
    }
  }
}

async function loadScatterBuffer() {
  if (scatterBuffer || scatterLoading) return;
  scatterLoading = true;
  try {
    const res = await fetch(SCATTER_URL);
    const arr = await res.arrayBuffer();
    const ac = getCtx();
    if (ac) scatterBuffer = await ac.decodeAudioData(arr);
  } catch { /* ignore */ } finally { scatterLoading = false; }
}

async function loadSpinClickBuffer() {
  if (spinClickBuffer || spinClickLoading) return;
  spinClickLoading = true;
  try {
    const res = await fetch(SPIN_CLICK_URL);
    const arr = await res.arrayBuffer();
    const ac = getCtx();
    if (ac) spinClickBuffer = await ac.decodeAudioData(arr);
  } catch { /* ignore */ } finally { spinClickLoading = false; }
}

function playScatter() {
  const ac = getCtx();
  if (!ac) return;
  if (!scatterBuffer) { loadScatterBuffer(); return; }
  if (bgMuted || isGlobalMuted()) return;
  const src = ac.createBufferSource();
  src.buffer = scatterBuffer;
  const g = ac.createGain();
  g.gain.setValueAtTime(VOL, ac.currentTime);
  src.connect(g).connect(ac.destination);
  src.start();
}

function playSpinClick() {
  const ac = getCtx();
  if (!ac) return;
  if (!spinClickBuffer) { loadSpinClickBuffer(); return; }
  if (bgMuted || isGlobalMuted()) return;
  const src = ac.createBufferSource();
  src.buffer = spinClickBuffer;
  const g = ac.createGain();
  g.gain.setValueAtTime(VOL, ac.currentTime);
  src.connect(g).connect(ac.destination);
  src.start();
}

async function loadSymMatchBuffer() {
  if (symMatchBuffer || symMatchLoading) return;
  symMatchLoading = true;
  try {
    const res = await fetch(SYM_MATCH_URL);
    const arr = await res.arrayBuffer();
    const ac = getCtx();
    if (ac) symMatchBuffer = await ac.decodeAudioData(arr);
  } catch { /* ignore */ } finally { symMatchLoading = false; }
}

function playSymMatch() {
  const ac = getCtx();
  if (!ac) return;
  if (!symMatchBuffer) { loadSymMatchBuffer(); return; }
  if (bgMuted || isGlobalMuted()) return;
  const src = ac.createBufferSource();
  src.buffer = symMatchBuffer;
  const g = ac.createGain();
  g.gain.setValueAtTime(VOL, ac.currentTime);
  src.connect(g).connect(ac.destination);
  src.start();
}

// Total-win sound — uploaded sting that plays while the Super/Mega Win
// banner counts up the win amount. The count-up lasts exactly as long as
// this sound plays.
const TOTAL_WIN_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/d58be1dc8_Totalwinsound.mp3';
let totalWinBuffer = null;
let totalWinLoading = false;

async function loadTotalWinBuffer() {
  if (totalWinBuffer || totalWinLoading) return;
  totalWinLoading = true;
  try {
    const res = await fetch(TOTAL_WIN_URL);
    const arr = await res.arrayBuffer();
    const ac = getCtx();
    if (ac) totalWinBuffer = await ac.decodeAudioData(arr);
  } catch { /* ignore */ } finally { totalWinLoading = false; }
}

// Plays the total-win sting and returns its duration in seconds, so the
// banner can match its count-up animation to the sound length.
function playTotalWin() {
  const dur = totalWinBuffer ? totalWinBuffer.duration : 2.2;
  const ac = getCtx();
  if (!ac) return dur;
  if (!totalWinBuffer) { loadTotalWinBuffer(); return dur; }
  if (bgMuted || isGlobalMuted()) return dur;
  const src = ac.createBufferSource();
  src.buffer = totalWinBuffer;
  const g = ac.createGain();
  g.gain.setValueAtTime(VOL, ac.currentTime);
  src.connect(g).connect(ac.destination);
  src.start();
  return dur;
}

function startWinSeq(rate = 1) {
  const ac = getCtx();
  if (!ac || !winSeqBuffer || winSeqAudio) return;
  const src = ac.createBufferSource();
  src.buffer = winSeqBuffer;
  src.loop = true;
  src.playbackRate.value = rate;

  const lowShelf = ac.createBiquadFilter();
  lowShelf.type = 'lowshelf';
  lowShelf.frequency.value = 100;
  lowShelf.gain.value = -5;
  const lowMid = ac.createBiquadFilter();
  lowMid.type = 'peaking';
  lowMid.frequency.value = 320;
  lowMid.Q.value = 1;
  lowMid.gain.value = -3.5;
  const presence = ac.createBiquadFilter();
  presence.type = 'peaking';
  presence.frequency.value = 3500;
  presence.Q.value = 0.9;
  presence.gain.value = 5;
  const highShelf = ac.createBiquadFilter();
  highShelf.type = 'highshelf';
  highShelf.frequency.value = 6500;
  highShelf.gain.value = 7;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(VOL, ac.currentTime + 0.08);

  src.connect(lowShelf);
  lowShelf.connect(lowMid);
  lowMid.connect(presence);
  presence.connect(highShelf);
  highShelf.connect(g);
  g.connect(ac.destination);
  src.start();
  src.onended = () => { if (winSeqAudio && winSeqAudio.source === src) winSeqAudio = null; };
  winSeqAudio = { source: src, gainNode: g };
}

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

// ── Background music ──────────────────────────────────────────────
// Loops the uploaded background song continuously via Web Audio API
// (gapless, unlike HTMLAudioElement). A filter chain cleans up the
// recording: high-pass removes low rumble, a compressor acts as a noise
// gate to suppress quiet background sounds, and EQ boosts the music.
// Volume ducks down whenever a spin / win / scatter event fires.
const BG_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/22fed69b4_backgroundsong.mp3';
const BG_VOL = 0.225;      // background music volume (50% of previous)
let bgBuffer = null;
let bgLoading = false;
let bgSource = null;
let bgGain = null;
let bgStarted = false;
let bgMuted = false;

async function loadBgBuffer() {
  if (bgBuffer || bgLoading) return;
  bgLoading = true;
  try {
    const res = await fetch(BG_URL);
    const arr = await res.arrayBuffer();
    const ac = getCtx();
    if (ac) bgBuffer = await ac.decodeAudioData(arr);
  } catch { /* ignore */ } finally { bgLoading = false; }
}

function playBgLoop() {
  const ac = getCtx();
  if (!ac || !bgBuffer || bgSource) return;
  bgSource = ac.createBufferSource();
  bgSource.buffer = bgBuffer;
  bgSource.loop = true;

  // High-pass filter — removes low-frequency rumble / hum from the recording.
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 120;
  hp.Q.value = 0.7;

  // Low-pass filter — removes high-frequency hiss / background noise.
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 7500;
  lp.Q.value = 0.7;

  // Presence boost for the main music frequencies.
  const presence = ac.createBiquadFilter();
  presence.type = 'peaking';
  presence.frequency.value = 2200;
  presence.Q.value = 1.2;
  presence.gain.value = 4;

  // Compressor / noise gate — squashes quiet background sounds (room noise,
  // breathing, handling) while letting the louder music through cleanly.
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -38;
  comp.knee.value = 12;
  comp.ratio.value = 6;
  comp.attack.value = 0.005;
  comp.release.value = 0.18;

  bgGain = ac.createGain();
  bgGain.gain.setValueAtTime(0.0001, ac.currentTime);
  bgGain.gain.exponentialRampToValueAtTime(BG_VOL, ac.currentTime + 1.2);

  bgSource.connect(hp);
  hp.connect(lp);
  lp.connect(presence);
  presence.connect(comp);
  comp.connect(bgGain);
  bgGain.connect(ac.destination);
  bgSource.start();
  // loop=true keeps the buffer playing forever — no restart needed.
}

export function startBackgroundMusic() {
  if (bgStarted || bgSource) return;
  bgStarted = true;
  const ac = getCtx();
  if (!ac) return;
  // Load the buffer, then start the loop once the context is running.
  loadBgBuffer().then(() => {
    if (bgBuffer && !bgSource && bgStarted) playBgLoop();
  });
  // If autoplay is blocked, resume the context on first interaction —
  // the already-started (but suspended) source begins playing.
  if (ac.state === 'suspended') {
    const resume = () => {
      const c = getCtx();
      if (c) c.resume().catch(() => {});
      document.removeEventListener('click', resume);
      document.removeEventListener('touchstart', resume);
      document.removeEventListener('keydown', resume);
    };
    document.addEventListener('click', resume, { once: true });
    document.addEventListener('touchstart', resume, { once: true });
    document.addEventListener('keydown', resume, { once: true });
  }
}

// ── Premium free-spin reel sound ───────────────────────────────────
// A luxury mechanical reel-spinning ambience synthesised in real time:
// a warm low mechanical hum, mid-range gear texture, subtle ticking,
// and a shimmering high "gold" overtone — the signature sound of a
// premium slot cabinet while the free-spin reels are in motion.
let freeReelNodes = null;

function startFreeSpinReel() {
  const ac = getCtx();
  if (!ac || freeReelNodes) return;
  if (bgMuted || isGlobalMuted()) return;

  // Master gain with a smooth fade-in
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, ac.currentTime);
  master.gain.exponentialRampToValueAtTime(0.9, ac.currentTime + 0.25);

  // 1) Warm low mechanical hum — two detuned sawtooth oscillators
  //    through a low-pass filter for a smooth, powerful motor tone.
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 320;
  lp.Q.value = 0.8;
  const hum1 = ac.createOscillator();
  hum1.type = 'sawtooth';
  hum1.frequency.value = 58;
  const hum2 = ac.createOscillator();
  hum2.type = 'sawtooth';
  hum2.frequency.value = 62; // slight detune for richness
  const humGain = ac.createGain();
  humGain.gain.value = 0.32;
  hum1.connect(humGain);
  hum2.connect(humGain);
  humGain.connect(lp);
  lp.connect(master);

  // 2) Mid-range gear texture — filtered white noise modulated by an LFO
  //    so it breathes like real spinning gears.
  const noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const ch = noiseBuf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  const noise = ac.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;
  const noiseBp = ac.createBiquadFilter();
  noiseBp.type = 'bandpass';
  noiseBp.frequency.value = 1400;
  noiseBp.Q.value = 1.2;
  const noiseGain = ac.createGain();
  noiseGain.gain.value = 0.12;
  // LFO to modulate the noise gain — gives a "shhh-shhh-shhh" gear breath
  const lfo = ac.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 7;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 0.06;
  lfo.connect(lfoGain);
  lfoGain.connect(noiseGain.gain);
  noise.connect(noiseBp);
  noiseBp.connect(noiseGain);
  noiseGain.connect(master);

  // 3) Subtle mechanical ticking — short periodic clicks from a fast
  //    LFO gating a high-passed noise burst.
  const tickBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
  const tch = tickBuf.getChannelData(0);
  for (let i = 0; i < tch.length; i++) tch[i] = Math.random() * 2 - 1;
  const tick = ac.createBufferSource();
  tick.buffer = tickBuf;
  tick.loop = true;
  const tickHp = ac.createBiquadFilter();
  tickHp.type = 'highpass';
  tickHp.frequency.value = 4000;
  const tickGain = ac.createGain();
  tickGain.gain.value = 0.0001; // normally silent
  const tickLfo = ac.createOscillator();
  tickLfo.type = 'square';
  tickLfo.frequency.value = 18; // ~18 clicks/sec
  const tickLfoGain = ac.createGain();
  tickLfoGain.gain.value = 0.05;
  tickLfo.connect(tickLfoGain);
  tickLfoGain.connect(tickGain.gain);
  tick.connect(tickHp);
  tickHp.connect(tickGain);
  tickGain.connect(master);

  // 4) Luxury shimmer — two high sine oscillators with a slow vibrato
  //    for a golden, premium "sparkle" sitting on top of the mechanics.
  const shim1 = ac.createOscillator();
  shim1.type = 'sine';
  shim1.frequency.value = 1760;
  const shim2 = ac.createOscillator();
  shim2.type = 'sine';
  shim2.frequency.value = 2640;
  const shimGain = ac.createGain();
  shimGain.gain.value = 0.05;
  const vib = ac.createOscillator();
  vib.type = 'sine';
  vib.frequency.value = 4.5;
  const vibGain = ac.createGain();
  vibGain.gain.value = 6;
  vib.connect(vibGain);
  vibGain.connect(shim1.frequency);
  vibGain.connect(shim2.frequency);
  shim1.connect(shimGain);
  shim2.connect(shimGain);
  shimGain.connect(master);

  master.connect(ac.destination);

  hum1.start(); hum2.start(); noise.start(); lfo.start();
  tick.start(); tickLfo.start(); shim1.start(); shim2.start(); vib.start();

  freeReelNodes = {
    master, hum1, hum2, noise, lfo, tick, tickLfo, shim1, shim2, vib,
  };
}

function stopFreeSpinReel() {
  if (!freeReelNodes) return;
  const ac = getCtx();
  const n = freeReelNodes;
  freeReelNodes = null;
  if (ac && n.master) {
    try {
      n.master.gain.cancelScheduledValues(ac.currentTime);
      n.master.gain.setValueAtTime(n.master.gain.value, ac.currentTime);
      n.master.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.3);
    } catch { /* ignore */ }
  }
  const stop = (o) => { try { o.stop(ac ? ac.currentTime + 0.35 : 0); } catch { /* ignore */ } };
  stop(n.hum1); stop(n.hum2); stop(n.noise); stop(n.lfo);
  stop(n.tick); stop(n.tickLfo); stop(n.shim1); stop(n.shim2); stop(n.vib);
}

export const sfx = {
  preload() { loadBgBuffer(); loadSpinClickBuffer(); loadSymMatchBuffer(); loadScatterBuffer(); loadTotalWinBuffer(); },
  spin() { startBackgroundMusic(); },
  stopSpin() {},
  win() {},
  winStop() {},
  anticipation() {},
  scatter() { playScatter(); },
  loss() {},
  spinClick() { playSpinClick(); },
  symbolMatch() { playSymMatch(); },
  showdown() { return playTotalWin(); },
  startFreeSpinReel,
  stopFreeSpinReel,
};

// Toggle background music mute. Returns the new muted state.
// Stop background music and reset state so it can cleanly restart later.
// Called when leaving the game so the track doesn't keep playing in other pages.
export function stopBackgroundMusic() {
  const ac = getCtx();
  if (ac && bgSource) {
    try { bgSource.stop(); } catch { /* already stopped */ }
    bgSource = null;
  }
  if (ac && bgGain) {
    try { bgGain.disconnect(); } catch { /* ignore */ }
    bgGain = null;
  }
  bgStarted = false;
}

export function toggleMute() {
  // Delegate to the shared global mute so every game's sound icon stays in
  // sync, then mirror the state onto the local bgMuted flag + bgGain ramp.
  bgMuted = toggleGlobalMute();
  const ac = getCtx();
  if (ac && bgGain) {
    bgGain.gain.cancelScheduledValues(ac.currentTime);
    bgGain.gain.setValueAtTime(bgGain.gain.value, ac.currentTime);
    // 0 = truly silent; exponential ramps can't reach 0, so use linear.
    bgGain.gain.linearRampToValueAtTime(bgMuted ? 0 : BG_VOL, ac.currentTime + 0.15);
  }
  return bgMuted;
}

export function isMuted() { return isGlobalMuted(); }