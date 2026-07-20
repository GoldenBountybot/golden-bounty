// Crown Coins — coin-drop sound (Web Audio API). Purely cosmetic; no balance effect.
let ctx = null;
function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { ctx = null; }
  }
  return ctx;
}

// Coin shower — many coins tumbling into the Crown Coin banner.
export function playCoinShowerSound() {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t0 = ac.currentTime;
  const count = 10;
  for (let i = 0; i < count; i++) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    const p = ac.createStereoPanner ? ac.createStereoPanner() : null;
    o.type = 'triangle';
    const base = 1180 + Math.random() * 900;
    const start = t0 + i * (0.04 + Math.random() * 0.05);
    const dur = 0.12 + Math.random() * 0.1;
    const vol = 0.10 + Math.random() * 0.08;
    o.frequency.setValueAtTime(base, start);
    o.frequency.exponentialRampToValueAtTime(base * 0.7, start + dur);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    if (p) { p.pan.value = Math.random() * 1.4 - 0.7; o.connect(g); g.connect(p); p.connect(ac.destination); }
    else { o.connect(g); g.connect(ac.destination); }
    o.start(start);
    o.stop(start + dur + 0.02);
  }
}

export function playCoinSound() {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  [
    { f: 1320, d: 0.09, g: 0.18 },
    { f: 1760, d: 0.13, g: 0.14 },
  ].forEach((n, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'triangle';
    o.frequency.value = n.f;
    g.gain.setValueAtTime(0, t + i * 0.06);
    g.gain.linearRampToValueAtTime(n.g, t + i * 0.06 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + n.d);
    o.connect(g);
    g.connect(ac.destination);
    o.start(t + i * 0.06);
    o.stop(t + i * 0.06 + n.d + 0.02);
  });
}