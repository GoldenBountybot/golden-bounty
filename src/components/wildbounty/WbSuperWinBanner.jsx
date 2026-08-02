import React, { useState, useEffect, useRef } from 'react';
import { sfx } from './sounds';

const SUPER_WIN_BANNER = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/bc8844e96_file_0000000057d881fbaa643e8f2dd979ce.png';

// "SUPER WIN" banner for Wild Bounty — triggers at x8–x16 multiplier or a
// big payout. The winning amount counts up below the banner as "Win [amount]".
export default function WbSuperWinBanner({ amount, multiplier, onDone }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    // Play the total-win sting and count up the amount for exactly as long
    // as the sound plays.
    const duration = (sfx.showdown() || 1.8) * 1000;
    const to = amount;
    const step = (ts) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(to * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(to);
        if (onDone) setTimeout(onDone, 1000);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [amount]);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center px-4"
      style={{ background: 'radial-gradient(circle at 50% 45%, rgba(80,20,10,0.55), rgba(4,6,14,0.93))' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(245,197,66,0.35), transparent 55%)', animation: 'saBeamPulse 1.2s ease-in-out infinite' }}
      />

      <div
        className="relative w-full max-w-[340px] flex flex-col items-center"
        style={{ animation: 'saWinPop 0.5s ease-out both' }}
      >
        <img
          src={SUPER_WIN_BANNER}
          alt="Super Win"
          className="w-full h-auto select-none"
          draggable={false}
          style={{ filter: 'drop-shadow(0 0 26px rgba(245,197,66,0.6)) drop-shadow(0 8px 20px rgba(0,0,0,0.75))' }}
        />
        {/* Win amount — below the banner, counting up */}
        <div className="mt-3 flex items-center justify-center">
          <span
            className="text-4xl font-black tabular-nums tracking-wide whitespace-nowrap"
            style={{
              color: '#fff2a8',
              fontFamily: 'Rye, Georgia, serif',
              fontWeight: 900,
              textShadow: '0 2px 5px rgba(0,0,0,0.95), 0 0 14px rgba(255,215,0,0.95), 0 0 26px rgba(255,180,0,0.8), 0 0 40px rgba(255,140,0,0.6)',
              WebkitTextStroke: '1px #5a1010',
              filter: 'brightness(1.25) saturate(1.3)',
            }}
          >
            WIN {display.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}