import React, { useMemo } from 'react';
import { VALUE_COIN_IMG, VALUE_COIN_MULTS } from './argonautsEngine';

// Coins fall ONE BY ONE through the cell: each coin drops independently from
// the top to the bottom of the cell, staggered so a fresh coin appears as
// the previous one exits. The final one lands and sticks (handled by parent).
export default function CoinDropStream({ turbo, bet = 0 }) {
  const period = turbo ? 0.36 : 0.56; // seconds per single coin fall
  const COUNT = 4; // staggered coins in flight

  // Random values for each falling coin.
  const coins = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        mult: VALUE_COIN_MULTS[Math.floor(Math.random() * VALUE_COIN_MULTS.length)],
        dx: (Math.random() - 0.5) * 18, // slight horizontal drift
      })),
    []
  );

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[7px] pointer-events-none"
      style={{ background: 'radial-gradient(circle, #5a0808 0%, #4D0505 70%)' }}
    >
      {coins.map((c, i) => {
        const amount = c.mult * bet;
        return (
          <div
            key={i}
            className="absolute left-1/2"
            style={{
              width: '78%',
              aspectRatio: '1 / 1',
              transform: 'translateX(-50%)',
              top: '-100%',
              animation: `singleCoinFall ${period * COUNT}s linear infinite`,
              animationDelay: `${-(period * i)}s`,
              willChange: 'transform, top',
            }}
          >
            <div className="relative w-full h-full" style={{ transform: `translateX(${c.dx}px)` }}>
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
        );
      })}
    </div>
  );
}