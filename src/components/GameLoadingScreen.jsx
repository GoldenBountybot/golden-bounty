import React, { useEffect, useState } from 'react';

// Reusable game loading screen — same Western aesthetic as Wild Bounty's,
// with a timed progress bar (~2.2s) so every game shows a brief loading intro.
export default function GameLoadingScreen({ title = 'Loading', emoji = '⭐', onDone, duration = 2200 }) {
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
          <span className="text-4xl">{emoji}</span>
        </div>
      </div>

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