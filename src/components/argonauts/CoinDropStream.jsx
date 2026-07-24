import React, { useMemo } from 'react';
import { VALUE_COIN_IMG } from './argonautsEngine';

// A rapid vertical cascade of many small coins pouring down a reel column
// during the coin hold-and-spin round. Used as the "spinning" state — lots of
// coins fall at speed, then the round resolves and one coin sticks (rendered
// separately by the machine). Purely decorative / pointer-events-none.
export default function CoinDropStream({ turbo }) {
  // ~14 coins per column, randomized horizontal jitter + delay + duration.
  const coins = useMemo(() => {
    const n = 14;
    return Array.from({ length: n }, (_, i) => ({
      id: i,
      left: 18 + Math.random() * 64,          // % across the column width
      delay: Math.random() * (turbo ? 0.18 : 0.30),
      dur: (turbo ? 0.34 : 0.52) + Math.random() * (turbo ? 0.12 : 0.18),
      scale: 0.55 + Math.random() * 0.4,
      rot: Math.random() * 360,
    }));
  }, [turbo]);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[7px] pointer-events-none z-10">
      {coins.map((c) => (
        <img
          key={c.id}
          src={VALUE_COIN_IMG}
          alt=""
          draggable={false}
          className="absolute"
          style={{
            left: `${c.left}%`,
            top: '-12%',
            width: '38%',
            aspectRatio: '1 / 1',
            objectFit: 'contain',
            mixBlendMode: 'screen',
            filter: 'drop-shadow(0 0 4px rgba(255,210,80,0.7)) brightness(1.15)',
            transform: `rotate(${c.rot}deg) scale(${c.scale})`,
            animation: `coinFallStream ${c.dur}s linear ${c.delay}s infinite`,
            willChange: 'transform, top',
          }}
        />
      ))}
    </div>
  );
}