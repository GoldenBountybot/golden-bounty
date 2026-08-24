import React, { useEffect, useState, useRef } from 'react';
import { preloadAssets } from '@/lib/assetPreloader';
import PremiumGameLoader from '@/components/PremiumGameLoader';

// Game loading screen that shows REAL preload progress (0% → 100%) while all
// the game's image assets are fetched in parallel and decoded. Only once
// every asset is ready does it call `onDone`, so the game UI appears
// fully-formed with no symbols or backgrounds popping in one-by-one.
//
// A minimum display time (`minDuration`) keeps the branded intro visible even
// when assets resolve instantly from the browser cache, so the transition
// never feels jarring on a fast connection.
export default function GameAssetLoader({
  title = 'Loading',
  assets = [],
  onDone,
  bgImage,
  minDuration = 700,
}) {
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);
  const assetsDoneRef = useRef(false);

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
      // If assets finished before the minimum display time, finish now.
      if (assetsDoneRef.current) finish();
    }, minDuration);

    // No safety timeout: the user explicitly wants to wait as long as needed
    // so that no symbol/image pops in after the game appears. The browser's
    // own network timeout handles truly dead requests.

    preloadAssets(assets, (p) => {
      if (cancelled) return;
      setProgress(p);
      if (p >= 100) {
        assetsDoneRef.current = true;
        const elapsed = performance.now() - start;
        if (elapsed >= minDuration) finish();
        // else: minTimer will fire finish() once minDuration is reached
      }
    }, false, true).then(() => {
      if (cancelled) return;
      assetsDoneRef.current = true;
      setProgress(100);
      const elapsed = performance.now() - start;
      if (elapsed >= minDuration) finish();
    });

    return () => {
      cancelled = true;
      clearTimeout(minTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <PremiumGameLoader progress={progress} title={title} bgImage={bgImage} />;
}