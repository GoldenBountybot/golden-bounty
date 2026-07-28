import React, { useEffect } from 'react';

// A multiplier value (X2, X4, ...) that flies from the tracker bar at the top,
// holds dead-centre over the reels as the matching symbols shatter, then moves
// in a straight line directly onto the win banner and pops — the win amount
// then counts up in the banner.
//
// start / hold / win are ABSOLUTE pixel offsets from the top of the machine
// (measured live by the parent), so the hold lands exactly on the board centre
// and the pop lands exactly on the win banner regardless of layout / margins.
// Only `transform` is animated (GPU) — never `top` — so it stays smooth, and it
// never descends below the win banner.
export default function FlyingMultiplier({ value, onComplete, slow = 1, startY = 0, holdY = 0, winY = 0 }) {
  const TOTAL = 1500 * slow;
  const holdDy = holdY - startY;
  const winDy = winY - startY;

  useEffect(() => {
    const t = setTimeout(() => onComplete && onComplete(), TOTAL);
    return () => clearTimeout(t);
  }, [onComplete, TOTAL]);

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[60] overflow-hidden"
      style={{ '--hold-dy': `${holdDy}px`, '--win-dy': `${winDy}px` }}
    >
      {/* Multiplier flies from the top, holds dead-centre over the reels, then
          moves directly onto the win banner and pops (transform-only = smooth,
          ends exactly at the banner — never below it) */}
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
    </div>
  );
}