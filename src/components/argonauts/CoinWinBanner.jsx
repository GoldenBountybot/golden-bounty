import React, { useEffect, useRef, useState } from 'react';
import { VALUE_COIN_IMG } from './argonautsEngine';
import { playCoinCountSound, playCoinWinSound } from './argoSounds';

const MEGA_WIN_BANNER = 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/cf4003fa2_file_00000000233881faa2d49279db01c3b7.png';

// Shown when the coin hold-and-spin round ends: the "MEGA WIN" banner floats
// up, the winning coins shimmer behind it, and the total win amount counts
// up from zero below the banner with a premium casino coin-counter tick.
// When the count finishes, a luxury celebration fanfare plays. Auto-dismisses.
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
    let timer;
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
    timer = setTimeout(tick, stepDur);
    return () => clearTimeout(timer);
  }, [total, bet]);

  // Auto-dismiss after the count-up + celebration has finished.
  useEffect(() => {
    const t = setTimeout(() => onDismiss && onDismiss(), 4600);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(circle at center, rgba(75,0,130,0.55), rgba(10,2,20,0.88))' }}
    >
      {/* Winning coins scattered behind the banner */}
      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-3 p-10 opacity-70">
        {entries.map(([key, mult], i) => (
          <div
            key={key}
            className="relative rounded-full overflow-hidden"
            style={{
              width: 64,
              height: 64,
              animation: `ccSparkle 1.8s ${(i % 6) * 0.12}s ease-in-out infinite`,
              boxShadow: '0 0 14px rgba(255,200,60,0.6)',
            }}
          >
            <img src={VALUE_COIN_IMG} alt="" draggable={false} className="w-full h-full object-cover" />
            <span
              className="absolute inset-0 flex items-center justify-center font-black tabular-nums italic"
              style={{
                fontSize: '0.65rem',
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

      {/* MEGA WIN banner image */}
      <img
        src={MEGA_WIN_BANNER}
        alt="Mega Win"
        draggable={false}
        className="relative w-full max-w-md mx-4 select-none"
        style={{
          filter: 'drop-shadow(0 0 22px rgba(180,120,255,0.7)) drop-shadow(0 0 12px rgba(255,215,0,0.5))',
          animation: 'gatesBannerFloat 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
      />

      {/* Total win amount — counts up below the banner */}
      <div
        className="relative mt-2 px-6 py-2 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(75,0,130,0.85), rgba(40,10,70,0.9))',
          boxShadow: '0 0 0 2px rgba(255,215,0,0.7), 0 0 18px rgba(180,120,255,0.6), inset 0 0 10px rgba(255,215,0,0.15)',
        }}
      >
        <span
          className="font-black tabular-nums"
          style={{
            fontFamily: 'Rye, Georgia, serif',
            fontSize: '2rem',
            color: '#FFD24A',
            textShadow:
              '2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 0 0 14px rgba(255,200,40,1)',
            transform: popping ? 'scale(1.25)' : 'scale(1)',
            transition: 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'inline-block',
          }}
        >
          ${displayTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
}