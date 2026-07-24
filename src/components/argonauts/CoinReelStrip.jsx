import React, { useMemo } from 'react';
import { VALUE_COIN_IMG, VALUE_COIN_MULTS, ROWS } from './argonautsEngine';

// Column-level scrolling strip of value coins — mirrors ArgoSpinStrip exactly:
// a tall seamless column of blurred coin images scrolling downward with the
// shared `reelFall` animation. No per-item text/shadow (spinning symbols on the
// main board are plain blurred images too), so it stays GPU-smooth. Dollar
// labels live only on the locked stuck coins, like the main game.
export default function CoinReelStrip({ turbo }) {
  const period = turbo ? 0.4 : 0.6;

  const strip = useMemo(() => {
    const block = () =>
      Array.from({ length: ROWS }, () => ({
        mult: VALUE_COIN_MULTS[Math.floor(Math.random() * VALUE_COIN_MULTS.length)],
      }));
    const b = block();
    // Last block repeats the first for a seamless loop (same trick as ArgoSpinStrip).
    return [...b, ...block(), ...block(), ...b];
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: 7 }}>
      <div
        className="flex flex-col gap-1 w-full"
        style={{ animation: `reelFall ${period}s linear infinite`, willChange: 'transform' }}
      >
        {strip.map((c, i) => (
          <div key={i} className="relative rounded-[7px] overflow-hidden" style={{ aspectRatio: '1 / 1', background: '#3a0404' }}>
            <img
              src={VALUE_COIN_IMG}
              alt=""
              draggable={false}
              className="w-full h-full object-cover"
              style={{ filter: 'blur(1.4px) brightness(0.82)', transform: 'scale(1.2)' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}