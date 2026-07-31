import React, { useState, useEffect, useRef } from 'react';

const MEGA_WIN_BANNER = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/06473392d_file_00000000a44082089561cf95e968c16a.png';

// Ornate "MEGA WIN" banner shown when the player hits a x8+ multiplier.
// The winning amount counts up inside the dark purple pill at the bottom.
export default function MegaWinBanner({ amount, multiplier, onDone }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const duration = 1800;
    const from = 0;
    const to = amount;
    const step = (ts) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
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
      style={{ background: 'radial-gradient(circle at 50% 45%, rgba(75,0,130,0.45), rgba(4,6,14,0.92))' }}
    >
      {/* purple burst backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(128,0,128,0.35), transparent 55%)', animation: 'saBeamPulse 1.2s ease-in-out infinite' }}
      />

      <div
        className="relative w-full max-w-[300px] flex flex-col items-center"
        style={{ animation: 'saWinPop 0.5s ease-out both' }}
      >
        <div className="relative w-full">
          <img
            src={MEGA_WIN_BANNER}
            alt="Mega Win"
            className="w-full h-auto select-none"
            draggable={false}
            style={{ filter: 'drop-shadow(0 0 26px rgba(128,0,128,0.6)) drop-shadow(0 8px 20px rgba(0,0,0,0.75))' }}
          />
          {/* Amount overlay — positioned inside the dark purple pill at the bottom */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
            style={{
              bottom: '5.5%',
              width: '68%',
              height: '11%',
            }}
          >
            <span
              className="text-xl font-black tabular-nums tracking-wide whitespace-nowrap"
              style={{
                color: '#FFD700',
                fontFamily: 'Georgia, serif',
                fontWeight: 900,
                textShadow: '0 2px 3px rgba(0,0,0,0.95), 0 0 8px rgba(255,215,0,0.6)',
                WebkitTextStroke: '0.5px #2E004F',
              }}
            >
              WIN {display.toFixed(2)}
            </span>
          </div>
        </div>

        {/* multiplier badge */}
        {multiplier >= 2 && (
          <div
            className="mt-3 px-5 py-1 rounded-full text-lg font-black italic"
            style={{
              background: 'linear-gradient(145deg, #fde68a, #f5c542 45%, #c8881e)',
              border: '2px solid #fde68a',
              color: '#5a1010',
              boxShadow: '0 0 14px rgba(245,197,66,0.85)',
              fontFamily: 'Rye, Georgia, serif',
            }}
          >
            {multiplier}× MULTIPLIER
          </div>
        )}
      </div>
    </div>
  );
}