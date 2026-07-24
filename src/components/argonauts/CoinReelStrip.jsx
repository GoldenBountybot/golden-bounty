import React, { useMemo } from 'react';
import { VALUE_COIN_IMG, VALUE_COIN_MULTS, ROWS } from './argonautsEngine';

// Column-level scrolling strip of value coins — mirrors the main reel strip
// (ArgoSpinStrip): a tall seamless column of coins that scrolls downward with
// the shared `reelFall` animation, so empty coin-round cells look exactly like
// the base-game reels while stuck coins stay locked on top.
export default function CoinReelStrip({ turbo, bet = 0 }) {
  const period = turbo ? 0.4 : 0.6;

  const strip = useMemo(() => {
    const block = () =>
      Array.from({ length: ROWS }, () => ({
        mult: VALUE_COIN_MULTS[Math.floor(Math.random() * VALUE_COIN_MULTS.length)],
        dx: (Math.random() - 0.5) * 8,
      }));
    const b = block();
    // Last block repeats the first for a seamless loop (same trick as ArgoSpinStrip).
    return [...b, ...block(), ...block(), ...b];
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: 7 }}>
      <div
        className="flex flex-col gap-1 w-full"
        style={{ animation: `reelFall ${period}s linear infinite`, willChange: 'transform', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
      >
        {strip.map((c, i) => (
          <div key={i} className="relative rounded-[7px] overflow-hidden" style={{ aspectRatio: '1 / 1', background: '#3a0404' }}>
            <div className="relative w-full h-full" style={{ transform: `translateX(${c.dx}px)` }}>
              <img
                src={VALUE_COIN_IMG}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ mixBlendMode: 'screen', transform: 'translateZ(0) scale(1.12)', filter: 'blur(1px) brightness(0.85)' }}
              />
              <span
                className="absolute inset-0 flex items-center justify-center tabular-nums italic pointer-events-none"
                style={{
                  fontSize: '0.66rem',
                  fontFamily: 'Rye, Georgia, serif',
                  color: '#FFD24A',
                  textShadow:
                    '1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                  letterSpacing: '0.01em',
                  zIndex: 10,
                }}
              >
                ${(c.mult * bet).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}