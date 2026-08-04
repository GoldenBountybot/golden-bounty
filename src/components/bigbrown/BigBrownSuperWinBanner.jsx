import React, { useState, useEffect, useRef } from 'react';
import { playSuperWinSound } from '@/lib/bigBrownSuperWinSound';

// Big Brown — Super Win banner shown at the end of a free-spin sequence when
// the total winnings reach a decent amount. A coin-counting animation
// increments the win total from 0 → finalAmount while a premium casino
// fanfare plays (background music ducks automatically).

const GOLD_BG = 'linear-gradient(to bottom, #fff7d6 0%, #ffe9a8 18%, #f5c542 45%, #c8881e 75%, #8b5a2b 100%)';

const GOLD_TEXT = {
  fontFamily: 'Rye, Georgia, serif',
  background: GOLD_BG,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  filter: 'drop-shadow(0 2px 0 #3a2408) drop-shadow(0 3px 3px rgba(0,0,0,0.95)) drop-shadow(0 0 10px rgba(255,200,80,0.55))',
  WebkitTextStroke: '0.6px rgba(58,36,8,0.7)',
};

// Ornate gold frame with corner flourishes + 4 red gems (N/S/E/W).
const GoldFrame = () => (
  <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
    <defs>
      <linearGradient id="bbGoldFrame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff7d6" />
        <stop offset="18%" stopColor="#ffe9a8" />
        <stop offset="45%" stopColor="#f5c542" />
        <stop offset="75%" stopColor="#c8881e" />
        <stop offset="100%" stopColor="#8b5a2b" />
      </linearGradient>
      <radialGradient id="bbGemRed" cx="0.3" cy="0.3" r="0.7">
        <stop offset="0%" stopColor="#ff6b6b" />
        <stop offset="50%" stopColor="#d32f2f" />
        <stop offset="100%" stopColor="#8b0000" />
      </radialGradient>
    </defs>
    {/* Outer ornate border */}
    <rect x="6" y="6" width="388" height="288" rx="18" fill="none" stroke="url(#bbGoldFrame)" strokeWidth="6" />
    <rect x="14" y="14" width="372" height="272" rx="14" fill="none" stroke="url(#bbGoldFrame)" strokeWidth="2" opacity="0.7" />
    {/* Corner flourishes */}
    {[
      { x: 6, y: 6, r: 0 },
      { x: 394, y: 6, r: 90 },
      { x: 394, y: 294, r: 180 },
      { x: 6, y: 294, r: 270 },
    ].map((c, i) => (
      <g key={i} transform={`rotate(${c.r} ${c.x} ${c.y})`}>
        <path d={`M${c.x} ${c.y + 30} Q${c.x + 18} ${c.y + 18} ${c.x + 30} ${c.y} L${c.x + 22} ${c.y} Q${c.x + 12} ${c.y + 12} ${c.x} ${c.y + 22} Z`} fill="url(#bbGoldFrame)" />
        <circle cx={c.x + 8} cy={c.y + 8} r="3" fill="url(#bbGoldFrame)" />
      </g>
    ))}
    {/* Side center flourishes */}
    <circle cx="200" cy="6" r="5" fill="url(#bbGoldFrame)" />
    <circle cx="200" cy="294" r="5" fill="url(#bbGoldFrame)" />
    <circle cx="6" cy="150" r="5" fill="url(#bbGoldFrame)" />
    <circle cx="394" cy="150" r="5" fill="url(#bbGoldFrame)" />
    {/* 4 red gems — N, S, E, W */}
    {[
      { cx: 200, cy: 6 },
      { cx: 200, cy: 294 },
      { cx: 6, cy: 150 },
      { cx: 394, cy: 150 },
    ].map((g, i) => (
      <g key={`gem-${i}`}>
        <circle cx={g.cx} cy={g.cy} r="7" fill="url(#bbGemRed)" stroke="#8b5a2b" strokeWidth="1" />
        <circle cx={g.cx - 2} cy={g.cy - 2} r="2" fill="#ffb0b0" opacity="0.8" />
      </g>
    ))}
  </svg>
);

// Golden laurel branch (inline SVG).
const Laurel = ({ side }) => (
  <svg viewBox="0 0 60 100" className="absolute pointer-events-none" style={{ width: 48, height: 80, [side]: '8%', top: '50%', transform: `translateY(-50%) ${side === 'right' ? 'scaleX(-1)' : ''}` }}>
    <defs>
      <linearGradient id={`bbLaurel-${side}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe9a8" />
        <stop offset="50%" stopColor="#f5c542" />
        <stop offset="100%" stopColor="#c8881e" />
      </linearGradient>
    </defs>
    <path d="M30 95 Q28 70 30 50 Q32 30 30 5" stroke={`url(#bbLaurel-${side})`} strokeWidth="2.5" fill="none" />
    {[20, 35, 50, 65, 80].map((y, i) => (
      <g key={i}>
        <ellipse cx={18 + (i % 2) * 2} cy={y} rx="10" ry="4" fill={`url(#bbLaurel-${side})`} transform={`rotate(-30 18 ${y})`} />
        <ellipse cx={42 - (i % 2) * 2} cy={y + 6} rx="10" ry="4" fill={`url(#bbLaurel-${side})`} transform={`rotate(30 42 ${y + 6})`} />
      </g>
    ))}
  </svg>
);

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

      <div className="relative w-[88%] max-w-sm" style={{ animation: 'saWinPop 0.5s ease-out both' }}>
        <GoldFrame />
        <Laurel side="left" />
        <Laurel side="right" />

        <div className="relative flex flex-col items-center px-6 py-8" style={{ minHeight: 240 }}>
          {/* Top row — Golden Bounty */}
          <p
            className="text-sm font-black italic tracking-[0.1em] text-center"
            style={{
              fontFamily: 'Cinzel, Georgia, serif',
              color: '#ffffff',
              textShadow: '0 0 3px #ffd700, 0 2px 0 #b8860b, 0 3px 4px rgba(0,0,0,0.9)',
              WebkitTextStroke: '0.5px #8b5a2b',
            }}
          >
            Golden Bounty
          </p>

          {/* Middle row — SUPER WIN */}
          <h2
            className="mt-1 text-4xl font-black italic tracking-[0.04em] text-center leading-none"
            style={{
              ...GOLD_TEXT,
              fontSize: '2.6rem',
              textShadow: '0 3px 0 #8b5a2b, 0 5px 6px rgba(0,0,0,0.95), 0 0 18px rgba(255,200,80,0.7)',
              animation: 'ccPulse 1.6s ease-in-out infinite',
            }}
          >
            SUPER WIN
          </h2>

          {/* Bottom pill — Congratulations + counting amount */}
          <div
            className="relative mt-4 w-full rounded-full overflow-hidden"
            style={{
              padding: '10px 20px',
              background: 'radial-gradient(ellipse at 30% 30%, #ff4500 0%, #b71c1c 35%, #8b0000 70%, #4a0000 100%)',
              border: '2px solid rgba(255,215,0,0.85)',
              boxShadow: '0 0 16px rgba(255,80,0,0.6), inset 0 0 14px rgba(0,0,0,0.6), inset 0 0 8px rgba(255,150,50,0.3)',
            }}
          >
            {/* Sparkle dots */}
            {[...Array(8)].map((_, i) => (
              <span
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 2 + (i % 3),
                  height: 2 + (i % 3),
                  left: `${10 + i * 11}%`,
                  top: `${20 + (i * 37) % 60}%`,
                  background: 'rgba(255,220,150,0.9)',
                  boxShadow: '0 0 4px rgba(255,200,100,0.9)',
                  animation: `ccSparkle ${1.2 + (i % 4) * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
            <p
              className="relative text-center text-xs font-black italic tracking-[0.15em]"
              style={{
                fontFamily: 'Cinzel, Georgia, serif',
                color: '#ffe9a8',
                textShadow: '0 0 6px rgba(255,200,80,0.9), 0 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              Congratulations
            </p>
            <p
              className="relative text-center text-2xl font-black italic tabular-nums mt-0.5"
              style={{
                ...GOLD_TEXT,
                fontSize: '1.7rem',
                textShadow: '0 2px 0 #8b5a2b, 0 3px 4px rgba(0,0,0,0.9), 0 0 10px rgba(255,200,80,0.7)',
                animation: done ? 'winCountPop 0.4s ease-out' : undefined,
              }}
            >
              {fmt(display)}
            </p>
          </div>

          {/* Tap to close hint */}
          {done && (
            <p
              className="mt-3 text-[10px] italic font-black tracking-[0.22em] animate-pulse"
              style={GOLD_TEXT}
            >
              TAP TO CONTINUE
            </p>
          )}
        </div>
      </div>
    </div>
  );
}