// Centralized audio lifecycle — makes ALL game sounds stop instantly when
// the user leaves a game (in-app SPA navigation) or leaves the app (tab
// hidden / page unloaded).
//
// It wraps the global AudioContext constructor so every context created
// anywhere in the app is tracked. On navigation (pushState/replaceState/
// popstate) and on tab hide / page unload, every running context is
// suspended — which silences all Web Audio output immediately. When the
// tab becomes visible again, only the contexts that were suspended by the
// hide are resumed, so a backgrounded game keeps playing on return but a
// game the user already left stays silent (no audio leak).

const contexts = new Set();
const hideSuspended = new Set();

if (typeof window !== 'undefined') {
  const RealAC = window.AudioContext || window.webkitAudioContext;
  if (RealAC && !RealAC.__gbAudioTracked) {
    const Tracked = function (...args) {
      const ctx = Reflect.construct(RealAC, args);
      contexts.add(ctx);
      try {
        ctx.addEventListener('statechange', () => {
          if (ctx.state === 'closed') contexts.delete(ctx);
        });
      } catch { /* ignore */ }
      return ctx;
    };
    Tracked.prototype = RealAC.prototype;
    Object.setPrototypeOf(Tracked, RealAC);
    Tracked.__gbAudioTracked = true;
    window.AudioContext = Tracked;
    if (window.webkitAudioContext) window.webkitAudioContext = Tracked;
  }
}

export function suspendAllAudio() {
  contexts.forEach((ctx) => {
    if (ctx.state === 'running') {
      try { ctx.suspend().catch(() => {}); } catch { /* ignore */ }
    }
  });
}

if (typeof window !== 'undefined') {
  // Leaving the app (tab hidden or page unloaded) → silence instantly.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      contexts.forEach((ctx) => {
        if (ctx.state === 'running') {
          hideSuspended.add(ctx);
          try { ctx.suspend().catch(() => {}); } catch { /* ignore */ }
        }
      });
    } else {
      hideSuspended.forEach((ctx) => {
        try { ctx.resume().catch(() => {}); } catch { /* ignore */ }
      });
      hideSuspended.clear();
    }
  });
  window.addEventListener('pagehide', suspendAllAudio);

  // Leaving a game via in-app (SPA) navigation → silence instantly. The
  // destination game resumes its own context when it mounts.
  ['pushState', 'replaceState'].forEach((m) => {
    const orig = history[m];
    if (typeof orig === 'function') {
      history[m] = function (...args) {
        const ret = orig.apply(this, args);
        suspendAllAudio();
        return ret;
      };
    }
  });
  window.addEventListener('popstate', suspendAllAudio);
}