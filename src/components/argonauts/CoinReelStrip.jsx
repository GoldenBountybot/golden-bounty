import React, { useMemo } from 'react';
import { VALUE_COIN_IMG, VALUE_COIN_MULTS, ROWS } from './argonautsEngine';

// Strict sequential per-row coin drop: only ONE row's empty cells drop a coin
// at a time — row 0 first, then row 1, then row 2 — then the cascade repeats.
// Uses `coinFallSeq` (fall occupies the first 1/ROWS slice of the loop) with a
// per-row delay, so each row owns its own time slice in slow motion.
export default function CoinReelStrip({ turbo, bet = 0 }) {
  const seg = turbo ? 1.6 : 2.6;          // how long one coin takes to fall
  const loop = ROWS * seg;               // full cascade cycle
  const delay = (i) => i * seg;          // each row starts in its own slice

  const rows = useMemo(
    () =>
      Array.from({ length: ROWS }, () => ({
        mult: VALUE_COIN_MULTS[Math.floor(Math.random() * VALUE_COIN_MULTS.length)],
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none grid gap-1" style={{ gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
      {rows.map((c, i) => (
        <div key={i} className="relative rounded-[7px] overflow-hidden" style={{ aspectRatio: '1 / 1', background: '#3a0404' }}>
          <div
            className="absolute left-1/2 top-0"
            style={{
              width: '88%',
              height: '100%',
              animation: `coinFallSeq ${loop}s ${delay(i)}s linear infinite`,
              willChange: 'transform, opacity',
            }}
          >
            <div className="relative w-full h-full rounded-full overflow-hidden" style={{ boxShadow: '0 0 8px rgba(255,200,60,0.5)' }}>
              <img
                src={VALUE_COIN_IMG}
                alt=""
                draggable={false}
                className="w-full h-full object-cover"
                style={{ filter: 'brightness(0.95)' }}
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
        </div>
      ))}
    </div>
  );
}