// Pleasant two-tone notification chime generated via the Web Audio API —
// no external file needed. Plays when a new notification arrives.
// Safe to call before any user gesture on most browsers once audio has been
// unlocked by a prior interaction; failures are swallowed silently.

let _ctx = null;
function ctx() {
  if (typeof window === 'undefined') return null;
  try {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
    return _ctx;
  } catch { return null; }
}

export function playNotificationSound() {
  const ac = ctx();
  if (!ac) return;
  try {
    const now = ac.currentTime;
    // Two ascending sine tones — a bright "ding-dong" feel.
    const tones = [
      { f: 880, t: 0,    d: 0.18 },
      { f: 1320, t: 0.12, d: 0.28 },
    ];
    tones.forEach(({ f, t, d }) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const start = now + t;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + d);
      osc.connect(gain).connect(ac.destination);
      osc.start(start);
      osc.stop(start + d + 0.05);
    });
  } catch { /* ignore audio errors */ }
}