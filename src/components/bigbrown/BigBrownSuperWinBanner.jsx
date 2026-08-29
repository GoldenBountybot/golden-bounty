import React, { useState, useEffect, useRef } from 'react';
import { playSuperWinSound } from '@/lib/bigBrownSuperWinSound';

// Big Brown — Super Win banner shown at the end of a free-spin sequence when
// the total winnings reach a decent amount. Uses the user-supplied ornate
// "SUPER WIN" asset as the banner visual; a coin-counting animation overlays
// the win total on the Congratulations pill while a premium casino fanfare
// plays (background music ducks automatically).

const SUPER_WIN_IMG =
  'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/4b986ee28_file_0000000057d881fbaa643e8f2dd979ce.png';

const GOLD_TEXT = {
  fontFamily: 'Rye, Georgia, serif',
  color: '#ffe066',
  WebkitTextFillColor: '#ffe066',
  WebkitTextStroke: '0.5px #5a3a0c',
  textShadow:
    '1px 1px 0 #d8a32a, 0 2px 3px rgba(0,0,0,0.95), 0 0 10px rgba(255,200,80,0.7)',
  filter: 'drop-shadow(0 0 2px rgba(255,210,110,0.7)) brightness(1.15) saturate(1.25)',
};

export default function BigBrownSuperWinBanner({ amount, onClose }) {
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);
  const startedRef = useRef(false);

  // Duration of the coin-count animation scales with the amount (capped).
  const durationMs = Math.min(4000, Math.max(2000, 800 + amount * 8));

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    playSuperWinSound(durationMs);

    const steps = 60;
    const interval = durationMs / steps;
    let current = 0;
    const inc = amount / steps;
    const id = setInterval(() => {
      current += inc;
      if (current >= amount) {
        current = amount;
        clearInterval(id);
        setDone(true);
      }
      setDisplay(current);
    }, interval);
    return () => clearInterval(id);
  }, [amount, durationMs]);

  const fmt = (v) => `$${v.toFixed(2)}`;

  return (
    <div
      onClick={done ? onClose : undefined}
      role="button"
      tabIndex={done ? 0 : -1}
      className="absolute inset-0 z-50 flex items-center justify-center cursor-pointer overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, rgba(40,10,5,0.92), rgba(0,0,0,0.98))' }}
    >
      {/* Golden halo glow behind the banner */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.5) 0%, rgba(255,80,0,0.25) 45%, transparent 72%)', filter: 'blur(8px)', animation: 'ccPulse 2s ease-in-out infinite' }}
      />

      <div className="relative w-[92%] max-w-md" style={{ animation: 'saWinPop 0.5s ease-out both' }}>
        {/* The ornate SUPER WIN asset — contains the frame, laurels, gems,
            "Golden Bounty" headline, "SUPER WIN" title, and the Congratulations
            pill. We overlay the counting amount on top of the pill area. */}
        <img
          src={SUPER_WIN_IMG}
          alt="SUPER WIN"
          draggable={false}
          className="relative w-full h-auto object-contain select-none"
          style={{ filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.7))' }}
        />

        {/* Counting amount — overlaid on the Congratulations pill near the
            bottom of the asset. Positioned relative to the banner image. */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-[62%] text-center"
          style={{ bottom: '11%' }}
        >
          <p
            className="text-2xl font-black italic tabular-nums leading-none"
            style={{
              ...GOLD_TEXT,
              fontSize: '1.7rem',
              animation: done ? 'winCountPop 0.4s ease-out' : undefined,
            }}
          >
            {fmt(display)}
          </p>
        </div>

        {/* Tap to close hint */}
        {done && (
          <p
            className="absolute left-1/2 -translate-x-1/2 -bottom-6 text-[10px] italic font-black tracking-[0.22em] animate-pulse whitespace-nowrap"
            style={GOLD_TEXT}
          >
            TAP TO CONTINUE
          </p>
        )}
      </div>
    </div>
  );
}