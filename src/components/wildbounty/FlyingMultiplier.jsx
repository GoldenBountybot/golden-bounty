import React, { useEffect, useMemo } from 'react';

// A multiplier value (X2, X4, ...) that flies from the tracker bar at the top
// of the board all the way down into the win banner, pops big on arrival, and
// releases a short shower of gold coins into the banner — the win amount then
// counts up in the banner.
export default function FlyingMultiplier({ value, onComplete, slow = 1 }) {
  const TOTAL = 1500 * slow;
  const COIN_START = 760 * slow;
  const COIN_COUNT = 12;
  const COIN_STEP = 26;

  const coins = useMemo(() => {
    const list = [];
    const coinDur = TOTAL - COIN_START;
    for (let i = 0; i < COIN_COUNT; i++) {
      const dx = (i - (COIN_COUNT - 1) / 2) * 16 + (Math.random() - 0.5) * 18;
      const offset = (i * COIN_STEP + Math.random() * 24) * slow;
      list.push({
        dx,
        delay: COIN_START + offset,
        dur: Math.max(120, coinDur - offset),
        size: 14 + Math.random() * 9,
      });
    }
    return list;
  }, [slow, TOTAL, COIN_START]);

  useEffect(() => {
    const doneT = setTimeout(() => onComplete && onComplete(), TOTAL);
    return () => { clearTimeout(doneT); };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none z-[60]">
      {/* Phase 1 — multiplier flies from the top banner down to the win banner
          and pops big on landing */}
      <div
        className="absolute left-1/2 flex items-center justify-center"
        style={{ animation: `multFlyToWin ${(TOTAL / 1000).toFixed(2)}s cubic-bezier(0.22,0.61,0.36,1) forwards` }}
      >
        <span
          className="relative font-black italic leading-none select-none"
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

      {/* Phase 2 — a short shower of gold coins drops from the landing point
          into the win banner */}
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
              animation: `coinDropShort ${(c.dur / 1000).toFixed(2)}s cubic-bezier(0.4,0.0,0.7,1) forwards`,
              animationDelay: `${c.delay - COIN_START}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}