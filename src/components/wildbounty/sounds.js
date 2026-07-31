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

// ── Background music ──────────────────────────────────────────────
// Loops the uploaded background song continuously. Volume ducks down
// whenever a spin / win / scatter sound event fires, then restores.
const BG_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/22fed69b4_backgroundsong.mp3';
const BG_VOL = 0.45;       // normal background volume
const BG_DUCK_VOL = 0.12;  // ducked volume while SFX play
const BG_DUCK_FADE = 0.25; // seconds to fade back up
let bgAudio = null;
let bgStarted = false;
let bgDuckTimer = null;

function startBackgroundMusic() {
  if (bgStarted) return;
  bgStarted = true;
  bgAudio = new Audio(BG_URL);
  bgAudio.loop = true;
  bgAudio.volume = 0;
  const fadeIn = () => {
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => { if (bgAudio) bgAudio.volume = BG_VOL * (i / steps); }, i * 40);
    }
  };
  const tryPlay = () => {
    bgAudio.play().then(fadeIn).catch(() => {
      // Autoplay blocked — retry on first interaction (element reused, no dupes)
      const resume = () => { bgAudio.play().then(fadeIn).catch(() => {}); };
      document.addEventListener('click', resume, { once: true });
      document.addEventListener('touchstart', resume, { once: true });
      document.addEventListener('keydown', resume, { once: true });
    });
  };
  tryPlay();
}

function duckBackground(durationMs = 1200) {
  if (!bgAudio) return;
  if (bgDuckTimer) clearTimeout(bgDuckTimer);
  bgAudio.volume = BG_DUCK_VOL;
  bgDuckTimer = setTimeout(() => {
    if (!bgAudio) return;
    // smooth fade back up
    const ac = getCtx();
    if (ac) {
      const steps = 15;
      for (let i = 1; i <= steps; i++) {
        setTimeout(() => { if (bgAudio) bgAudio.volume = BG_DUCK_VOL + (BG_VOL - BG_DUCK_VOL) * (i / steps); }, i * 30);
      }
    } else {
      bgAudio.volume = BG_VOL;
    }
  }, durationMs);
}

export const sfx = {
  preload() { startBackgroundMusic(); },
  spin() { startBackgroundMusic(); duckBackground(2500); },
  stopSpin() { duckBackground(400); },
  win() { duckBackground(1500); },
  winStop() { duckBackground(400); },
  anticipation() { duckBackground(2000); },
  scatter() { duckBackground(900); },
  loss() { duckBackground(500); },
};