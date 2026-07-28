import React, { useEffect, useMemo } from 'react';

// A multiplier value (X2, X4, ...) that flies from the tracker bar at the top,
// holds dead-centre over the reels as the matching symbols shatter, then
// continues down into the win banner and pops — the win amount then counts up.
//
// start / hold / win are ABSOLUTE pixel offsets from the top of the machine
// (measured live by the parent), so the hold lands exactly on the board centre
// and the pop lands exactly on the win banner regardless of layout / margins.
// Only `transform` is animated (GPU) — never `top` — so it stays smooth.
export default function FlyingMultiplier({ value, onComplete, slow = 1, startY = 0, holdY = 0, winY = 0 }) {
  const TOTAL = 1500 * slow;
  const holdDy = holdY - startY;
  const winDy = winY - startY;

  const COIN_COUNT = 10;
  const coins = useMemo(() => {
    const list = [];
    const baseDur = 560 * slow;
    for (let i = 0; i < COIN_COUNT; i++) {
      list.push({
        dx: (i - (COIN_COUNT - 1) / 2) * 15 + (Math.random() - 0.5) * 16,
        delay: (760 + i * 20 + Math.random() * 14) * slow,
        dur: baseDur,
        size: 14 + Math.random() * 9,
      });
    }
    return list;
  }, [slow]);

  useEffect(() => {
    const t = setTimeout(() => onComplete && onComplete(), TOTAL);
    return () => clearTimeout(t);
  }, [onComplete, TOTAL]);

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[60] overflow-hidden"
      style={{ '--hold-dy': `${holdDy}px`, '--win-dy': `${winDy}px` }}
    >
      {/* Phase 1 — multiplier flies from the top, holds dead-centre over the
          reels, then continues into the win banner (transform-only = smooth) */}
      <div
        className="absolute"
        style={{
          left: '50%',
          top: `${startY}px`,
          willChange: 'transform',
          animation: `multFlyToWin ${(TOTAL / 1000).toFixed(2)}s cubic-bezier(0.22,0.61,0.36,1) forwards`,
        }}
      >
        <span
          className="block font-black italic leading-none select-none"
          style={{
            fontSize: '4rem',
            fontFamily: 'Rye, Georgia, serif',
            backgroundImage: 'linear-gradient(180deg, #fff7c4 0%, #ffd966 22%, #d4af37 48%, #9b6a1f 74%, #5e3d12 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextStroke: '1px #5a3a0c',
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45)) drop-shadow(0 0 8px rgba(255,200,60,0.6))',
          }}
        >
          X{value}
        </span>
      </div>

      {/* Phase 2 — short gold-coin shower raining from just above the win
          banner down onto the banner centre (transform-only, never below) */}
      <div className="absolute" style={{ left: '50%', top: `${winY}px` }}>
        {coins.map((c, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: 0,
              top: 0,
              width: `${c.size}px`,
              height: `${c.size}px`,
              marginLeft: `-${c.size / 2}px`,
              marginTop: `-${c.size / 2}px`,
              '--dx': `${c.dx}px`,
              background:
                'radial-gradient(circle at 35% 30%, #fff5c0 0%, #ffd966 26%, #d4af37 52%, #9b6a1f 78%, #6e4a14 100%)',
              boxShadow: '0 0 6px rgba(255,200,60,0.85), inset 0 0 2px rgba(90,55,10,0.7)',
              border: '1.5px solid #7a4f17',
              willChange: 'transform',
              animation: `coinDropShort ${(c.dur / 1000).toFixed(2)}s cubic-bezier(0.4,0.0,0.7,1) forwards`,
              animationDelay: `${c.delay}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}