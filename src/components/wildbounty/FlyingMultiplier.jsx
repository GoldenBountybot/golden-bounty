import React, { useEffect, useMemo } from 'react';
import { sfx } from './sounds';

// A multiplier value (X2, X4, ...) that flies from the tracker bar at the top,
// swells big at the centre of the reels, then turns into a shower of gold coins
// that stream down and pile into the win banner — with coin-clink sounds.
export default function FlyingMultiplier({ value, onComplete }) {
  const TOTAL = 1950;
  const COIN_START = 980;
  const HOLD_END = 1560;

  // Pre-build coin particles with spread offsets + staggered delays.
  const coins = useMemo(() => {
    const list = [];
    for (let i = 0; i < 14; i++) {
      const dx = (i - 6.5) * 14 + (Math.random() - 0.5) * 22;
      list.push({
        dx,
        delay: COIN_START + (i * 38) + Math.random() * 40,
        rot: (Math.random() * 2 - 1) * 220,
        size: 16 + Math.random() * 10,
      });
    }
    return list;
  }, []);

  useEffect(() => {
    // first coin clink right as the X reaches the centre
    const coinT = setTimeout(() => sfx.coins(), COIN_START - 40);
    const doneT = setTimeout(() => onComplete && onComplete(), TOTAL);
    return () => { clearTimeout(coinT); clearTimeout(doneT); };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Phase 1 — the multiplier flies down + swells at the reel centre */}
      <div
        className="absolute left-1/2 flex items-center justify-center"
        style={{ animation: `multCenterFly ${(HOLD_END / 1000).toFixed(2)}s cubic-bezier(0.22,0.61,0.36,1) forwards` }}
      >
        {/* golden radial burst at the centre */}
        <span
          className="absolute rounded-full"
          style={{
            width: '240px',
            height: '240px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            background:
              'radial-gradient(circle, rgba(255,225,120,0.95) 0%, rgba(255,200,60,0.55) 28%, rgba(255,180,40,0.18) 55%, rgba(255,180,40,0) 72%)',
            filter: 'blur(2px)',
            animation: `multBurst ${(HOLD_END / 1000).toFixed(2)}s ease-out forwards`,
          }}
        />
        <span
          className="relative font-black italic leading-none select-none"
          style={{
            fontSize: '6rem',
            fontFamily: 'Rye, Georgia, serif',
            backgroundImage: 'linear-gradient(180deg, #fff7c4 0%, #ffd966 22%, #d4af37 48%, #9b6a1f 74%, #5e3d12 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextStroke: '2px #3a2407',
            filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.7)) drop-shadow(0 0 10px rgba(255,200,60,0.6))',
          }}
        >
          X{value}
        </span>
      </div>

      {/* Phase 2 — a stream of gold coins pours from the centre into the win banner */}
      <div className="absolute left-1/2">
        {coins.map((c, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${c.size}px`,
              height: `${c.size}px`,
              left: 0,
              marginLeft: `-${c.size / 2}px`,
              ['--dx']: `${c.dx}px`,
              background:
                'radial-gradient(circle at 35% 30%, #fff5c0 0%, #ffd966 26%, #d4af37 52%, #9b6a1f 78%, #6e4a14 100%)',
              boxShadow: '0 0 6px rgba(255,200,60,0.85), inset 0 0 2px rgba(90,55,10,0.7)',
              border: '1.5px solid #7a4f17',
              animation: `coinStream ${((TOTAL - COIN_START) / 1000).toFixed(2)}s cubic-bezier(0.4,0.0,0.7,1) forwards`,
              animationDelay: `${c.delay - COIN_START}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}