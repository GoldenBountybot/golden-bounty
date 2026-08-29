import React, { useEffect, useRef } from 'react';
import { sfx } from './sounds';

const MEGA_WIN_BANNER = 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/abe2184b1_file_00000000233881faa2d49279db01c3b7.png';

// "MEGA WIN" banner for Wild Bounty — triggers at x32+ multiplier or a huge
// payout. The winning amount counts up below the banner as "Win [amount]".
//
// Uses a ref + direct DOM textContent update instead of state so the 60fps
// count-up never triggers React re-renders (avoids jank during the showdown).
export default function WbMegaWinBanner({ amount, multiplier, onDone, label }) {
  const numRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    // Play the total-win sting and count up the amount for exactly as long
    // as the sound plays.
    const duration = (sfx.showdown() || 2.2) * 1000;
    const to = amount;
    const step = (ts) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      if (numRef.current) numRef.current.textContent = (to * eased).toFixed(2);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        if (numRef.current) numRef.current.textContent = to.toFixed(2);
        if (onDone) setTimeout(onDone, 1200);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [amount]);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center px-4"
      style={{ background: 'radial-gradient(circle at 50% 45%, rgba(75,0,130,0.5), rgba(4,6,14,0.93))' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(128,0,128,0.4), transparent 55%)', animation: 'saBeamPulse 1.2s ease-in-out infinite' }}
      />

      <div
        className="relative w-full max-w-[340px] flex flex-col items-center"
        style={{ animation: 'saWinPop 0.5s ease-out both' }}
      >
        <img
          src={MEGA_WIN_BANNER}
          alt="Mega Win"
          className="w-full h-auto select-none"
          draggable={false}
          style={{ filter: 'drop-shadow(0 0 26px rgba(128,0,128,0.65)) drop-shadow(0 8px 20px rgba(0,0,0,0.75))' }}
        />
        {/* Win amount — below the banner, counting up */}
        <div className="mt-3 flex flex-col items-center justify-center">
          {label && (
            <span
              className="text-lg font-bold tracking-[0.18em] mb-1 whitespace-nowrap"
              style={{
                color: '#ffd86a',
                fontFamily: 'Rye, Georgia, serif',
                textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(255,200,80,0.8)',
                filter: 'brightness(1.2) saturate(1.2)',
              }}
            >
              {label}
            </span>
          )}
          <span
            className="text-4xl font-black tabular-nums tracking-wide whitespace-nowrap"
            style={{
              color: '#fff2a8',
              fontFamily: 'Rye, Georgia, serif',
              fontWeight: 900,
              textShadow: '0 2px 5px rgba(0,0,0,0.95), 0 0 14px rgba(255,215,0,0.95), 0 0 26px rgba(255,180,0,0.8), 0 0 40px rgba(255,140,0,0.6)',
              WebkitTextStroke: '1px #2E004F',
              filter: 'brightness(1.25) saturate(1.3)',
            }}
          >
            WIN <span ref={numRef} style={{ fontVariantNumeric: 'tabular-nums' }}>0.00</span>
          </span>
        </div>
      </div>
    </div>
  );
}