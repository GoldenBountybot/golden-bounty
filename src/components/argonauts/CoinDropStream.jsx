import React, { useMemo } from 'react';
import { VALUE_COIN_IMG, VALUE_COIN_MULTS } from './argonautsEngine';

// Coins fall ONE BY ONE through the cell: a single coin drops from the top
// to the bottom of the cell, then the next coin enters. GPU-driven
// transform (not `top`) for a perfectly smooth, jank-free fall.
export default function CoinDropStream({ turbo, bet = 0, rowIndex = 0, reelIndex = 0 }) {
  // One full cycle spans 9 slots (3 columns × 3 rows). Each empty cell is
  // assigned a unique slot in column-major order: column 0 cascades first
  // (row 0 → 1 → 2), then column 1, then column 2 — never all at once.
  // Coins fall one-by-one, column by column: column 0 starts, then column 1,
  // then column 2 — each coin visible the whole way down for a clear, smooth
  // cascade rather than a hard-to-see flicker.
  const period = turbo ? 0.42 : 0.6;
  const delay = reelIndex * 0.07 + rowIndex * 0.035;

  const coin = useMemo(() => {
    let mult;
    do { mult = VALUE_COIN_MULTS[Math.floor(Math.random() * VALUE_COIN_MULTS.length)]; }
    while (false);
    return { mult, dx: (Math.random() - 0.5) * 14 };
  }, []);

  const amount = coin.mult * bet;

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[7px] pointer-events-none"
      style={{ background: 'radial-gradient(circle, #5a0808 0%, #4D0505 70%)' }}
    >
      <div
        className="absolute left-1/2 top-0"
        style={{
          width: '78%',
          aspectRatio: '1 / 1',
          transform: 'translateX(-50%)',
          opacity: 0,
          animation: `coinFallY ${period}s linear ${delay}s infinite`,
          willChange: 'transform, opacity',
        }}
      >
        <div className="relative w-full h-full" style={{ transform: `translateX(${coin.dx}px)` }}>
          <img
            src={VALUE_COIN_IMG}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ mixBlendMode: 'screen', transform: 'scale(1.12)', filter: 'drop-shadow(0 0 6px rgba(255,210,80,0.6))' }}
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
            ${amount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}