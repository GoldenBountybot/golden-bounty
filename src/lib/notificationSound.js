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
    // Soft chat-style "pop-ding": a quick low blip followed by a light bell,
    // the same gentle messenger chime feel.
    const tones = [
      { f: 660,  t: 0,    d: 0.10, v: 0.16 },
      { f: 1046, t: 0.07, d: 0.22, v: 0.20 },
    ];
    tones.forEach(({ f, t, d, v }) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const start = now + t;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(v, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + d);
      osc.connect(gain).connect(ac.destination);
      osc.start(start);
      osc.stop(start + d + 0.05);
    });
  } catch { /* ignore audio errors */ }
}