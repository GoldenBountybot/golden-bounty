import React, { useEffect, useRef, useState } from 'react';
import { playCoinCountSound, playCoinWinSound } from './argoSounds';

const BANNER = 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/6abe5be40_file_0000000057d881fbaa643e8f2dd979ce.png';

// Shown when the scatter free-spin session ends with a total win: the ornate
// "SUPER WIN" banner floats in, and the total win amount counts up from zero
// below it with a premium casino coin-counter tick on each increment. When
// the count finishes, a luxury celebration fanfare plays and the banner
// auto-dismisses.
export default function ArgoFreeSpinEndBanner({ total, onDismiss }) {
  const [displayTotal, setDisplayTotal] = useState(0);
  const [popping, setPopping] = useState(false);
  const celebratedRef = useRef(false);

  // Count-up animation: ramp from 0 → total over ~1.8s, ticking a coin clink
  // sound on each increment. When the count finishes, play the celebration.
  useEffect(() => {
    if (total <= 0) {
      setDisplayTotal(0);
      return;
    }
    const duration = 1800;
    const steps = Math.min(70, Math.max(25, Math.round(total / 0.05)));
    const stepDur = duration / steps;
    const increment = total / steps;
    let idx = 0;
    const tick = () => {
      idx++;
      const current = Math.min(total, increment * idx);
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
  }, [total]);

  // Auto-dismiss after the count-up + celebration has finished.
  useEffect(() => {
    const t = setTimeout(() => onDismiss && onDismiss(), 4800);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(circle at center, rgba(106,8,8,0.55), rgba(20,5,5,0.88))' }}
    >
      {/* SUPER WIN banner image */}
      <div
        className="relative w-full max-w-md mx-3 transition-transform"
        style={{
          animation: 'gatesBannerFloat 0.7s ease-out both',
        }}
      >
        <img
          src={BANNER}
          alt="Super Win"
          draggable={false}
          className="w-full select-none"
          style={{ filter: 'drop-shadow(0 0 22px rgba(255,180,40,0.7))', mixBlendMode: 'screen' }}
        />
      </div>

      {/* Total win amount — counts up below the banner */}
      <div className="relative mt-1 flex items-center justify-center">
        <span
          className="font-black tabular-nums"
          style={{
            fontFamily: 'Rye, Georgia, serif',
            fontSize: '2rem',
            color: '#FFD24A',
            textShadow:
              '2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 14px rgba(255,200,40,0.95), 0 0 26px rgba(255,180,40,0.7)',
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