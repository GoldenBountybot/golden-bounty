import React, { useEffect, useState, useRef } from 'react';
import { preloadAssets } from '@/lib/assetPreloader';

// Game loading screen that shows REAL preload progress (0% → 100%) while all
// the game's image assets are fetched in parallel and decoded. Only once
// every asset is ready does it call `onDone`, so the game UI appears
// fully-formed with no symbols or backgrounds popping in one-by-one.
//
// A minimum display time (`minDuration`) keeps the branded intro visible even
// when assets resolve instantly from the browser cache, so the transition
// never feels jarring on a fast connection.
const LOGO_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e0ebe2f88_InShot_20260722_150739877.jpg';

export default function GameAssetLoader({
  title = 'Loading',
  assets = [],
  onDone,
  bgImage,
  minDuration = 1200,
  timeout = 12000,
}) {
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const start = performance.now();

    const finish = () => {
      if (cancelled || doneRef.current) return;
      doneRef.current = true;
      onDone && onDone();
    };

    // Wait for BOTH: all assets loaded AND the minimum display time elapsed.
    const minTimer = setTimeout(() => {
      // if assets already done, finish now; otherwise the asset promise will finish
      if (progress >= 100) finish();
    }, minDuration);

    // Safety timeout: never trap the user on the loading screen if a request
    // hangs. After `timeout` ms we proceed regardless.
    const safety = setTimeout(finish, timeout);

    preloadAssets(assets, (p) => {
      if (cancelled) return;
      setProgress(p);
      if (p >= 100) {
        const elapsed = performance.now() - start;
        if (elapsed >= minDuration) {
          finish();
        }
        // else: minTimer will fire finish() once minDuration is reached
      }
    }).then(() => {
      if (cancelled) return;
      setProgress(100);
      const elapsed = performance.now() - start;
      if (elapsed >= minDuration) finish();
    });

    return () => {
      cancelled = true;
      clearTimeout(minTimer);
      clearTimeout(safety);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-stone-950 via-amber-950/50 to-stone-950"
      style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {bgImage && <div className="absolute inset-0 bg-black/55" />}
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
      <p className="mt-3 text-xs text-amber-200/70 tracking-widest uppercase tabular-nums">
        {progress}% Loading…
      </p>
    </div>
  );
}