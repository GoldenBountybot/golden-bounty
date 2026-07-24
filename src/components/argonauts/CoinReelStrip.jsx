import React, { useMemo } from 'react';
import { VALUE_COIN_IMG, VALUE_COIN_MULTS, ROWS } from './argonautsEngine';

// Column-level scrolling strip of value coins — mirrors ArgoSpinStrip structure
// (tall seamless column scrolling with `reelFall`), but slowed down so each
// falling coin's dollar label stays readable. Stuck coins lock on top.
export default function CoinReelStrip({ turbo, bet = 0 }) {
  const period = turbo ? 1.8 : 2.6;

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
              style={{ filter: 'blur(0.5px) brightness(0.9)', transform: 'scale(1.12)' }}
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
        ))}
      </div>
    </div>
  );
}