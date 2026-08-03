import React, { useEffect, useRef, useState } from 'react';
import { VALUE_COIN_IMG } from './argonautsEngine';
import { playCoinCountSound, playCoinWinSound } from './argoSounds';

const BANNER = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f030b6e26_file_0000000052ac81fab76972aeff43998f.png';

// Shown when the coin hold-and-spin round ends: the laurel-wreath "BONUS GAME
// WINNINGS" banner carries the total win amount in its center, while the
// winning coins shimmer behind it. The total counts up from zero with a
// premium casino coin-counter tick, then a luxury celebration fanfare plays
// when the final total is revealed. The banner auto-dismisses.
export default function CoinWinBanner({ total, coins, bet, onDismiss }) {
  const entries = Object.entries(coins || {});
  const [displayTotal, setDisplayTotal] = useState(0);
  const [popping, setPopping] = useState(false);
  const celebratedRef = useRef(false);

  // Count-up animation: ramp from 0 → total over ~1.6s, ticking a coin clink
  // sound on each increment. When the count finishes, play the celebration.
  useEffect(() => {
    if (total <= 0) {
      setDisplayTotal(0);
      return;
    }
    const duration = 1600;
    const steps = Math.min(60, Math.max(20, Math.round(total / Math.max(bet, 0.01))));
    const stepDur = duration / steps;
    const increment = total / steps;
    let current = 0;
    let idx = 0;
    const tick = () => {
      idx++;
      current = Math.min(total, increment * idx);
      setDisplayTotal(current);
      playCoinCountSound();
      if (idx < steps) {
        timer = setTimeout(tick, stepDur);
      } else {
        setDisplayTotal(total);
        if (!celebratedRef.current) {
          celebratedRef.current = true;
          setPopping(true);
          playCoinWinSound();
          setTimeout(() => setPopping(false), 600);
        }
      }
    };
    let timer = setTimeout(tick, stepDur);
    return () => clearTimeout(timer);
  }, [total, bet]);

  // Auto-dismiss after the count-up + celebration has finished.
  useEffect(() => {
    const t = setTimeout(() => onDismiss && onDismiss(), 4200);
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

      {/* Banner image with the total win amount centered — full width with wooden frame */}
      <div
        className="relative w-full mx-3"
        style={{
          padding: '10px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #6b4a1e 0%, #8a5a2a 15%, #5b3a12 30%, #a06a30 45%, #6b4a1e 60%, #4a2e0e 75%, #8a5a2a 90%, #6b4a1e 100%)',
          boxShadow: '0 0 0 2px rgba(40,25,8,0.95), 0 0 0 4px rgba(255,215,0,0.4), 0 8px 30px rgba(0,0,0,0.7), 0 0 24px rgba(255,180,40,0.5), inset 0 0 0 1px rgba(255,235,150,0.3), inset 0 2px 6px rgba(255,235,150,0.2), inset 0 -2px 6px rgba(0,0,0,0.4)',
        }}
      >
        <div
          className="relative w-full"
          style={{
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(60,38,14,0.6), rgba(30,18,6,0.7))',
            boxShadow: 'inset 0 0 0 1px rgba(255,215,0,0.25)',
          }}
        >
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
                transform: popping ? 'scale(1.25)' : 'scale(1)',
                transition: 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                display: 'inline-block',
              }}
            >
              ${displayTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}