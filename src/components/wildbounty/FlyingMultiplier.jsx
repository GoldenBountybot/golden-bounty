import React, { useEffect } from 'react';
import { sfx } from './sounds';

// A multiplier value (X2, X4, ...) that flies from the tracker bar at the top,
// swells to the center of the reels, then flies down into the win banner —
// accompanied by a coin-collect sound.
export default function FlyingMultiplier({ value, onComplete }) {
  useEffect(() => {
    const coinT = setTimeout(() => sfx.coins(), 820);
    const doneT = setTimeout(() => onComplete && onComplete(), 1650);
    return () => { clearTimeout(coinT); clearTimeout(doneT); };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <div
        className="absolute left-1/2 flex items-center justify-center"
        style={{ animation: 'multFly 1.65s cubic-bezier(0.22,0.61,0.36,1) forwards' }}
      >
        {/* golden radial burst */}
        <span
          className="absolute rounded-full"
          style={{
            width: '220px',
            height: '220px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            background:
              'radial-gradient(circle, rgba(255,225,120,0.95) 0%, rgba(255,200,60,0.55) 28%, rgba(255,180,40,0.18) 55%, rgba(255,180,40,0) 72%)',
            filter: 'blur(2px)',
            animation: 'multBurst 1.65s ease-out forwards',
          }}
        />
        <span
          className="relative font-black italic leading-none select-none"
          style={{
            fontSize: '5.5rem',
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
    </div>
  );
}