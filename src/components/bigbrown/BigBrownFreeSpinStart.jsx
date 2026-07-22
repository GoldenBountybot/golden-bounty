import React from 'react';
import { SYMBOLS } from '@/lib/bigBrownEngine';

// Free Games trigger banner — fully golden themed. The entire banner is
// clickable to start the free spins.

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

const WildTile = ({ sym, label }) => {
  const def = SYMBOLS[sym];
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative w-20 h-20 rounded-[6px] overflow-hidden"
        style={{
          border: '2px solid rgba(255,225,120,0.95)',
          boxShadow: '0 0 12px rgba(255,200,80,0.6), inset 0 0 8px rgba(255,210,90,0.35)',
          background: GOLD_BG,
        }}
      >
        <img src={def.img} alt={label} className="w-full h-full object-cover" draggable={false} style={{ mixBlendMode: 'multiply', filter: 'brightness(1.05) sepia(0.5) saturate(1.8) hue-rotate(-10deg)' }} />
      </div>
      <div
        className="px-2 py-0.5 rounded-[3px]"
        style={{
          background: GOLD_BG,
          border: '1px solid rgba(255,225,120,0.6)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
        }}
      >
        <span
          className="text-[9px] font-black italic tracking-[0.18em] leading-none"
          style={{ color: '#3a2408', fontFamily: 'Rye, Georgia, serif' }}
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
      onClick={onStart}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onStart(); }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center cursor-pointer active:scale-[0.99] transition-transform"
      style={{ background: 'radial-gradient(ellipse at center, rgba(60,44,14,0.92), rgba(20,12,4,0.97))' }}
    >
      {/* Golden halo glow behind number */}
      <div
        className="absolute top-[14%] left-1/2 -translate-x-1/2 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,215,0,0.65) 0%, rgba(255,180,40,0.4) 45%, transparent 72%)',
          filter: 'blur(6px)',
          animation: 'ccPulse 2.4s ease-in-out infinite',
        }}
      />

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

      {/* FREE GAMES golden plank */}
      <div className="relative z-10 -mt-2">
        <div
          className="relative px-8 py-2 rounded-[8px]"
          style={{
            background: GOLD_BG,
            border: '2px solid rgba(255,234,160,0.9)',
            boxShadow: '0 0 18px rgba(255,200,80,0.55), 0 6px 16px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,245,180,0.5)',
          }}
        >
          <span
            className="relative text-2xl italic font-black tracking-[0.08em]"
            style={{ color: '#2a1a06', fontFamily: 'Rye, Georgia, serif' }}
          >
            FREE GAMES
          </span>
        </div>
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

      {/* TAP TO START hint */}
      <p
        className="relative z-10 mt-4 text-sm italic font-black tracking-[0.3em] animate-pulse"
        style={GOLD_TEXT}
      >
        TAP TO START
      </p>
    </div>
  );
}