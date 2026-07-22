import React from 'react';
import { SYMBOLS } from '@/lib/bigBrownEngine';

// Free Games trigger banner — dynamic award number (8/12/16/24) based on
// scatter count. Matches the reference: big golden 3D numeral, wooden
// "FREE GAMES" plank, two wild symbols with "OR", "ON EVERY SPIN" text,
// sun glow, pine silhouettes and autumn leaves.

const WOOD_PLANK_BG = `
  linear-gradient(to bottom,
    #6b4a2a 0%, #5a3a1e 12%, #8b5a2b 30%, #7a4a22 50%, #5a3a1e 75%, #4a2c14 100%)
`;

const GOLD_TEXT = {
  fontFamily: 'Rye, Georgia, serif',
  background: 'linear-gradient(to bottom, #fff7d6 0%, #ffe9a8 18%, #f5c542 45%, #c8881e 75%, #8b5a2b 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  filter: 'drop-shadow(0 2px 0 #3a2408) drop-shadow(0 3px 3px rgba(0,0,0,0.95)) drop-shadow(0 0 10px rgba(255,200,80,0.55))',
  WebkitTextStroke: '0.6px rgba(58,36,8,0.7)',
};

// Pine tree silhouette (SVG).
const Pine = ({ className, style }) => (
  <svg viewBox="0 0 100 160" className={className} style={style} preserveAspectRatio="xMidYMax meet">
    <g fill="#06120a">
      <rect x="44" y="130" width="12" height="30" />
      <path d="M50 4 L18 70 L34 70 L8 116 L30 116 L2 160 L98 160 L70 116 L92 116 L66 70 L82 70 Z" />
    </g>
  </svg>
);

// Maple leaf (SVG) — autumn.
const Leaf = ({ className, style, hue }) => (
  <svg viewBox="0 0 64 64" className={className} style={style}>
    <g fill={hue}>
      <path d="M32 6 L36 18 L48 14 L42 26 L56 28 L44 36 L52 48 L38 44 L40 58 L32 50 L24 58 L26 44 L12 48 L20 36 L8 28 L22 26 L16 14 L28 18 Z" />
      <rect x="30" y="48" width="4" height="14" fill="#3e2723" />
    </g>
  </svg>
);

const WildTile = ({ sym, label }) => {
  const def = SYMBOLS[sym];
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative w-20 h-20 rounded-[6px] overflow-hidden"
        style={{
          border: '2px solid rgba(255,225,120,0.95)',
          boxShadow: '0 0 12px rgba(255,200,80,0.6), inset 0 0 8px rgba(255,210,90,0.35)',
          background: 'linear-gradient(160deg,#3a2a12,#1a130a)',
        }}
      >
        <img src={def.img} alt={label} className="w-full h-full object-cover" draggable={false} />
      </div>
      <div
        className="px-2 py-0.5 rounded-[3px]"
        style={{
          background: WOOD_PLANK_BG,
          border: '1px solid rgba(255,225,120,0.6)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
        }}
      >
        <span
          className="text-[9px] font-black italic tracking-[0.18em] leading-none"
          style={GOLD_TEXT}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

export default function BigBrownFreeSpinStart({ count, onStart }) {
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, rgba(20,14,6,0.92), rgba(2,3,8,0.97))' }}
    >
      {/* Sun / halo glow behind number */}
      <div
        className="absolute top-[14%] left-1/2 -translate-x-1/2 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,215,0,0.55) 0%, rgba(255,165,0,0.32) 45%, transparent 72%)',
          filter: 'blur(6px)',
          animation: 'ccPulse 2.4s ease-in-out infinite',
        }}
      />

      {/* Pine tree silhouettes */}
      <Pine className="absolute left-0 bottom-[24%] w-24 opacity-80" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.7))' }} />
      <Pine className="absolute right-0 bottom-[26%] w-28 opacity-70" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.7))' }} />

      {/* Dynamic number — big golden 3D */}
      <div className="relative z-10 mt-6">
        <span
          className="block leading-none italic font-black"
          style={{
            ...GOLD_TEXT,
            fontSize: '8.5rem',
            textShadow: '0 4px 0 #3a2408, 0 7px 10px rgba(0,0,0,0.95)',
            animation: 'ccPulse 1.8s ease-in-out infinite',
          }}
        >
          {count}
        </span>
      </div>

      {/* FREE GAMES wooden plank */}
      <div className="relative z-10 -mt-2">
        <div
          className="relative px-8 py-2 rounded-[8px]"
          style={{
            background: WOOD_PLANK_BG,
            border: '2px solid rgba(90,58,26,0.85)',
            boxShadow: 'inset 0 0 0 2px rgba(20,12,5,0.7), 0 6px 16px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,210,120,0.18)',
          }}
        >
          {/* wood grain streaks */}
          <div className="absolute inset-0 rounded-[8px] pointer-events-none opacity-40" style={{ background: 'repeating-linear-gradient(90deg, transparent 0, transparent 4px, rgba(40,24,10,0.5) 5px, rgba(40,24,10,0.5) 6px)' }} />
          <span
            className="relative text-2xl italic font-black tracking-[0.08em]"
            style={GOLD_TEXT}
          >
            FREE GAMES
          </span>
        </div>
        {/* Autumn leaves at plank corners */}
        <Leaf className="absolute -left-3 -bottom-2 w-8" hue="#d84315" style={{ transform: 'rotate(-22deg)' }} />
        <Leaf className="absolute -right-3 -bottom-2 w-8" hue="#e65100" style={{ transform: 'rotate(20deg)' }} />
      </div>

      {/* Two wilds with OR */}
      <div className="relative z-10 flex items-center gap-4 mt-7">
        <WildTile sym="brown" label="WILD" />
        <span className="text-3xl italic font-black" style={GOLD_TEXT}>OR</span>
        <WildTile sym="spirit" label="WILD" />
      </div>

      {/* ON EVERY SPIN */}
      <p
        className="relative z-10 mt-5 text-lg italic font-black tracking-[0.18em]"
        style={GOLD_TEXT}
      >
        ON EVERY SPIN
      </p>

      {/* START button */}
      <button
        onClick={onStart}
        className="relative z-10 mt-6 px-8 py-2.5 rounded-[8px] italic font-black active:scale-95 transition-transform"
        style={{
          background: 'linear-gradient(to bottom,#f5c542,#c8881e)',
          color: '#2a1a06',
          fontFamily: 'Rye, Georgia, serif',
          border: '2px solid rgba(255,234,160,0.9)',
          boxShadow: '0 0 14px rgba(255,200,80,0.5), inset 0 -3px 6px rgba(120,80,20,0.6), 0 4px 10px rgba(0,0,0,0.6)',
        }}
      >
        START
      </button>
    </div>
  );
}