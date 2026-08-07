import React, { useEffect, useState } from 'react';
import PremiumGameLoader from '@/components/PremiumGameLoader';

// Reusable game loading screen — same Western aesthetic as Wild Bounty's,
// with a timed progress bar (~2.2s) so every game shows a brief loading intro.
export default function GameLoadingScreen({ title = 'Loading', onDone, duration = 2200, bgImage }) {
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

  return <PremiumGameLoader progress={progress} title={title} bgImage={bgImage} />;
}