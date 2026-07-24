import React, { useMemo } from 'react';
import { VALUE_COIN_IMG, VALUE_COIN_MULTS, valueCoinKey } from './argonautsEngine';

// Rapid vertical stream of falling coins shown inside an empty coin-round
// cell while a reel is dropping. Many coins — each with its own dollar
// value overlaid — appear to fall at speed; the final one lands and sticks
// (handled by the parent revealing the stuck tile).
// 3 identical coin blocks → seamless -33%→0 loop (one cell per cycle).
export default function CoinDropStream({ turbo, bet = 0 }) {
  // Random multipliers for the falling coins so each shows a live value.
  const mults = useMemo(
    () =>
      Array.from({ length: 9 }, () =>
        VALUE_COIN_MULTS[Math.floor(Math.random() * VALUE_COIN_MULTS.length)]
      ),
    []
  );

  const renderCoin = (m, k) => {
    const amount = m * bet;
    return (
      <div key={k} className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
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
    );
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[7px] pointer-events-none"
      style={{ background: 'radial-gradient(circle, #5a0808 0%, #4D0505 70%)' }}
    >
      <div
        className="flex flex-col w-full"
        style={{ animation: `coinStreamFall ${turbo ? 0.3 : 0.48}s linear infinite`, willChange: 'transform' }}
      >
        {[0, 1, 2].map((i) => (
          <React.Fragment key={i}>
            {mults.slice(i * 3, i * 3 + 3).map((m, j) => renderCoin(m, `${i}-${j}`))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}