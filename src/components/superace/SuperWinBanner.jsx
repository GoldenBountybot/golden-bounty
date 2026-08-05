import React, { useState, useEffect, useRef } from 'react';
import { playWinCountUp } from '@/lib/superaceSounds';

const SUPER_WIN_BANNER = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/4241239e5_file_0000000057d881fbaa643e8f2dd979ce.png';

// Ornate "SUPER WIN" banner shown when the player hits a x5+ multiplier or a
// big payout. The winning amount counts up inside the red pill area at the
// bottom of the banner image.
export default function SuperWinBanner({ amount, multiplier, onDone }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const duration = 1800;
    playWinCountUp(duration);
    const from = 0;
    const to = amount;
    const step = (ts) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(to);
        if (onDone) setTimeout(onDone, 900);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [amount]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(circle at 50% 45%, rgba(60,30,10,0.55), rgba(4,6,14,0.92))' }}
    >
      {/* golden burst backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(245,197,66,0.35), transparent 55%)', animation: 'saBeamPulse 1.2s ease-in-out infinite' }}
      />

      <div
        className="relative w-full max-w-[300px] flex flex-col items-center"
        style={{ animation: 'saWinPop 0.5s ease-out both' }}
      >
        {/* Banner image with the red pill slot at the bottom */}
        <div className="relative w-full">
          <img
            src={SUPER_WIN_BANNER}
            alt="Super Win"
            className="w-full h-auto select-none"
            draggable={false}
            style={{ filter: 'drop-shadow(0 0 26px rgba(245,197,66,0.6)) drop-shadow(0 8px 20px rgba(0,0,0,0.75))' }}
          />
          {/* Amount overlay — at the bottom of the banner */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
            style={{
              bottom: '8%',
              width: '80%',
            }}
          >
            <span
              className="text-3xl font-black tabular-nums tracking-wide whitespace-nowrap"
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
    </div>
  );
}