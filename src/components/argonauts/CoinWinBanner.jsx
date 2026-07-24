import React, { useEffect } from 'react';
import { VALUE_COIN_IMG } from './argonautsEngine';

const BANNER = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f030b6e26_file_0000000052ac81fab76972aeff43998f.png';

// Shown when the coin hold-and-spin round ends: the laurel-wreath "BONUS GAME
// WINNINGS" banner carries the total win amount in its center, while the
// winning coins shimmer behind it. The banner's black background is dropped
// via screen blend over a warm golden glow, and the panel auto-dismisses.
export default function CoinWinBanner({ total, coins, bet, onDismiss }) {
  const entries = Object.entries(coins || {});

  useEffect(() => {
    const t = setTimeout(() => onDismiss && onDismiss(), 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(circle at center, rgba(190,135,40,0.5), rgba(30,15,4,0.82))' }}
    >
      {/* Winning coins scattered behind the banner */}
      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-3 p-10">
        {entries.map(([key, mult], i) => (
          <div
            key={key}
            className="relative rounded-full overflow-hidden"
            style={{
              width: 70,
              height: 70,
              animation: `ccSparkle 1.8s ${(i % 6) * 0.12}s ease-in-out infinite`,
              boxShadow: '0 0 14px rgba(255,200,60,0.6)',
            }}
          >
            <img src={VALUE_COIN_IMG} alt="" draggable={false} className="w-full h-full object-cover" />
            <span
              className="absolute inset-0 flex items-center justify-center font-black tabular-nums italic"
              style={{
                fontSize: '0.7rem',
                fontFamily: 'Rye, Georgia, serif',
                color: '#FFD24A',
                textShadow: '1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000',
              }}
            >
              ${(mult * bet).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Banner image with the total win amount centered */}
      <div className="relative" style={{ width: 'min(86vw, 360px)' }}>
        <img
          src={BANNER}
          alt="Bonus Game Winnings"
          draggable={false}
          className="w-full select-none"
          style={{ filter: 'drop-shadow(0 0 18px rgba(255,180,40,0.7))', mixBlendMode: 'screen' }}
        />
        <div className="absolute inset-x-0 flex items-center justify-center" style={{ top: '45%' }}>
          <span
            className="font-black tabular-nums"
            style={{
              fontFamily: 'Rye, Georgia, serif',
              fontSize: '1.7rem',
              color: '#FFD24A',
              textShadow:
                '2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 10px rgba(255,200,40,0.95)',
            }}
          >
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}