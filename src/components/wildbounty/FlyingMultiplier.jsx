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
      className="absolute inset-0 pointer-events-none z-[60]"
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
          animation: `multFlyToWin ${(TOTAL / 1000).toFixed(2)}s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        }}
      >
        <span
          className="block font-black italic leading-none select-none"
          style={{
            fontSize: '2.25rem',
            fontFamily: 'Rye, Georgia, serif',
            backgroundImage: 'linear-gradient(180deg, #fffbe6 0%, #ffe57a 18%, #ffd24a 38%, #e7b53a 58%, #b8861f 80%, #7c5818 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.55)) drop-shadow(0 0 10px rgba(255,210,90,0.9)) drop-shadow(0 0 20px rgba(255,180,50,0.5))',
            backfaceVisibility: 'hidden',
          }}
        >
          X{value}
        </span>
      </div>
    </div>
  );
}