// Simple Web Audio sound engine for Wild Bounty (no external files).
// All sounds synthesised; volume pushed to 150% per request.
let ctx = null;
const VOL = 1.5;

// Uploaded mechanical spin sound (looped while reels are spinning).
const SPIN_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/42593c193_20260717094905_0_0.mp3';
// Uploaded win-sequence sound — plays through the whole matching/shatter/
// multiplier chain until the round ends.
const WINSEQ_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/3d0b01f51_20260717094905_2.mp3';
// Uploaded scatter-land sting — plays once per scatter that lands.
const SCATTER_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/eb6fefbfe_20260717094905_3_0.mp3';
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

export const sfx = {
  preload() {
    const ac = getCtx();
    if (!ac) return;
    loadSpinBuffer();
    loadWinSeqBuffer();
    loadScatterBuffer();
  },
  spin() {
    // Play the uploaded spin sound looped through a clarity EQ chain while
    // the reels run; stopSpin() fades it out when they land.
    const ac = getCtx();
    if (!ac) return;

    // Stop any spin sound already playing
    if (spinAudio) {
      try {
        const g = spinAudio.gainNode;
        const src = spinAudio.source;
        g.gain.cancelScheduledValues(ac.currentTime);
        g.gain.setValueAtTime(g.gain.value, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.12);
        src.stop(ac.currentTime + 0.14);
      } catch { /* noop */ }
      spinAudio = null;
    }

    if (spinBuffer) {
      const src = ac.createBufferSource();
      src.buffer = spinBuffer;
      src.loop = false;

      // Clarity EQ: trim muddy lows, lift presence + airy treble
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
      g.gain.exponentialRampToValueAtTime(VOL, ac.currentTime + 0.06);

      src.connect(lowShelf);
      lowShelf.connect(lowMid);
      lowMid.connect(presence);
      presence.connect(highShelf);
      highShelf.connect(g);
      g.connect(ac.destination);
      src.start();
      src.onended = () => { if (spinAudio && spinAudio.source === src) spinAudio = null; };
      spinAudio = { source: src, gainNode: g };
      return;
    }

    // Fallback while the uploaded file is still loading
    loadSpinBuffer();
    tone({ freq: 180, sweepTo: 480, type: 'triangle', dur: 0.5, gain: VOL * 0.25 });
  },
  stopSpin() {
    // No-op: the spin button only plays a one-shot click sound now.
  },
  win(step = 0) {
    // Sound keeps its normal-to-slightly-faster speed; it never slows down.
    const rate = Math.min(1 + Math.min(step, 1) * 0.22, 2.4);
    const ac = getCtx();
    if (!ac) return;
    if (winSeqAudio) {
      try { winSeqAudio.source.playbackRate.setValueAtTime(rate, ac.currentTime); } catch { /* noop */ }
      return;
    }
    loadWinSeqBuffer();
    if (!winSeqBuffer) { winSeqPending = true; winSeqPendingRate = rate; return; }
    startWinSeq(rate);
  },
  winStop() {
    // Fade out and stop the win-sequence sound when the round ends.
    const ac = getCtx();
    if (!ac || !winSeqAudio) return;
    try {
      const g = winSeqAudio.gainNode;
      const src = winSeqAudio.source;
      g.gain.cancelScheduledValues(ac.currentTime);
      g.gain.setValueAtTime(g.gain.value, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.18);
      src.stop(ac.currentTime + 0.2);
    } catch { /* noop */ }
    winSeqAudio = null;
  },
  anticipation() {
    // suspense drone when 2 scatters land and remaining reels slow down
    tone({ freq: 150, sweepTo: 380, type: 'sawtooth', dur: 1.4, gain: VOL * 0.3 });
    tone({ freq: 80, type: 'sine', dur: 1.4, gain: VOL * 0.25 });
  },
  scatter() {
    // Bright one-shot sting when a scatter symbol lands (clarity EQ chain).
    const ac = getCtx();
    if (!ac) return;
    if (scatterBuffer) {
      const src = ac.createBufferSource();
      src.buffer = scatterBuffer;
      src.loop = false;
      const lowShelf = ac.createBiquadFilter();
      lowShelf.type = 'lowshelf'; lowShelf.frequency.value = 100; lowShelf.gain.value = -5;
      const lowMid = ac.createBiquadFilter();
      lowMid.type = 'peaking'; lowMid.frequency.value = 320; lowMid.Q.value = 1; lowMid.gain.value = -3.5;
      const presence = ac.createBiquadFilter();
      presence.type = 'peaking'; presence.frequency.value = 3500; presence.Q.value = 0.9; presence.gain.value = 5;
      const highShelf = ac.createBiquadFilter();
      highShelf.type = 'highshelf'; highShelf.frequency.value = 6500; highShelf.gain.value = 7;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(VOL, ac.currentTime + 0.04);
      src.connect(lowShelf); lowShelf.connect(lowMid); lowMid.connect(presence);
      presence.connect(highShelf); highShelf.connect(g); g.connect(ac.destination);
      src.start();
      return;
    }
    loadScatterBuffer();
    tone({ freq: 880, sweepTo: 1320, type: 'triangle', dur: 0.3, gain: VOL * 0.35 });
  },
  loss() {
    // Loss sound disabled per request.
  },
};