import React, { useEffect, useState } from 'react';

// Reusable game loading screen — same Western aesthetic as Wild Bounty's,
// with a timed progress bar (~2.2s) so every game shows a brief loading intro.
const LOGO_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e0ebe2f88_InShot_20260722_150739877.jpg';

export default function GameLoadingScreen({ title = 'Loading', onDone, duration = 2200 }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(100, ((now - start) / duration) * 100);
      setProgress(p);
      if (p < 100) raf = requestAnimationFrame(tick);
      else setTimeout(() => onDone && onDone(), 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone, duration]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-stone-950 via-amber-950/50 to-stone-950">
      <div className="relative mb-8">
        <div
          className="w-24 h-24 rounded-full border-4 border-amber-600/30 border-t-amber-400 animate-spin"
          style={{ boxShadow: '0 0 28px rgba(255,200,80,0.55)' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={LOGO_URL}
            alt="Golden Bounty"
            className="w-16 h-16 rounded-full object-cover animate-[saGlowPulse_1.6s_ease-in-out_infinite]"
            style={{ border: '1px solid rgba(214,178,98,0.7)', boxShadow: '0 0 16px rgba(255,200,80,0.7)' }}
          />
        </div>
      </div>

      <p
        className="text-[13px] text-amber-300/80 italic tracking-[0.25em] uppercase mb-1"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        Made By Golden Bounty
      </p>

      <h2
        className="text-2xl text-amber-300 font-serif italic mb-6 tracking-wide"
        style={{ fontFamily: 'Rye, Georgia, serif' }}
      >
        {title}
      </h2>

      <div className="w-64 h-2 rounded-full bg-stone-800 overflow-hidden border border-amber-700/40">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-amber-200/70 tracking-widest uppercase">Loading…</p>
    </div>
  );
}