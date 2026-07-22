import React from 'react';
import { SYMBOLS } from '@/lib/bigBrownEngine';

// Big Brown — Free Games trigger banner (Western forest theme).
// Large embossed golden number · wooden "FREE GAMES" plaque with pine foliage ·
// two bear wild tiles with wooden WILD labels · "ON EVERY SPIN" tagline.
// The number reflects the awarded free spins (8, 12, 16 or 24).

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

// Horizontal-grained wood plaque — embossed gold carving feel.
const WOOD_PLANK = {
  background:
    "repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.08) 4px, rgba(0,0,0,0) 7px, rgba(0,0,0,0.14) 10px, rgba(0,0,0,0) 14px), linear-gradient(to bottom, #a0522d 0%, #8b4513 30%, #6b3a14 60%, #4a280a 100%)",
  border: '2px solid rgba(58,36,8,0.9)',
  boxShadow: 'inset 0 2px 4px rgba(255,200,140,0.25), inset 0 -3px 6px rgba(0,0,0,0.6), 0 6px 16px rgba(0,0,0,0.7)',
};

// Small rustic wooden WILD label under each bear.
const WOOD_LABEL = {
  background: 'linear-gradient(to bottom, #8b4513 0%, #6b3a14 60%, #4a280a 100%)',
  border: '1.5px solid rgba(255,234,160,0.7)',
  boxShadow: 'inset 0 1px 2px rgba(255,200,140,0.3), inset 0 -1px 2px rgba(0,0,0,0.5), 0 2px 5px rgba(0,0,0,0.6)',
};

const WildTile = ({ sym, label }) => {
  const def = SYMBOLS[sym];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative w-20 h-20 rounded-[6px] overflow-hidden"
        style={{
          border: '2px solid rgba(255,225,120,0.95)',
          boxShadow: '0 0 12px rgba(255,200,80,0.6), inset 0 0 8px rgba(255,210,90,0.35)',
          background: 'linear-gradient(160deg,#2a1c0c,#0a0603)',
        }}
      >
        <img src={def.img} alt={label} className="w-full h-full object-cover" draggable={false} style={{ filter: 'brightness(1.1) saturate(1.05) drop-shadow(0 0 4px rgba(255,200,80,0.5))' }} />
      </div>
      <div className="px-2.5 py-0.5 rounded-[3px]" style={WOOD_LABEL}>
        <span className="text-[9px] font-black italic tracking-[0.18em] leading-none" style={{ color: '#ffe9a8', fontFamily: 'Rye, Georgia, serif' }}>
          {label}
        </span>
      </div>
    </div>
  );
};

// Pine tree silhouette (inline SVG) so no external image is needed.
const PineTree = ({ style }) => (
  <svg viewBox="0 0 60 100" style={style} className="absolute pointer-events-none">
    <polygon points="30,2 8,40 22,40 4,72 20,72 0,98 60,98 40,72 56,72 38,40 52,40" fill="#1a3a12" />
    <polygon points="30,2 12,36 48,36" fill="#2a5a1f" />
    <rect x="26" y="92" width="8" height="12" fill="#4a280a" />
  </svg>
);

export default function BigBrownFreeSpinStart({ count, onStart }) {
  return (
    <div
      onClick={onStart}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onStart(); }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center cursor-pointer active:scale-[0.99] transition-transform overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, rgba(40,30,10,0.94), rgba(8,6,2,0.98))' }}
    >
      {/* Pine foliage behind the plaque */}
      <PineTree style={{ width: 120, height: 200, top: '30%', left: '8%' }} />
      <PineTree style={{ width: 100, height: 170, top: '34%', right: '6%' }} />
      <PineTree style={{ width: 80, height: 140, top: '40%', left: '2%' }} />
      <PineTree style={{ width: 70, height: 120, top: '42%', right: '1%' }} />

      {/* Golden halo glow behind the number */}
      <div
        className="absolute top-[10%] left-1/2 -translate-x-1/2 w-60 h-60 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,180,40,0.35) 45%, transparent 72%)', filter: 'blur(6px)', animation: 'ccPulse 2.4s ease-in-out infinite' }}
      />

      {/* Dynamic number — big embossed golden 3D */}
      <div className="relative z-10 mt-4">
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

      {/* FREE GAMES — wooden plank, carved gold text */}
      <div className="relative z-10 -mt-1">
        <div className="relative px-8 py-2.5 rounded-[8px]" style={WOOD_PLANK}>
          {/* Rustic nail rivets */}
          <span className="absolute top-1.5 left-2 w-1.5 h-1.5 rounded-full" style={{ background: '#3a2408', boxShadow: 'inset 0 1px 1px rgba(255,200,140,0.4)' }} />
          <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full" style={{ background: '#3a2408', boxShadow: 'inset 0 1px 1px rgba(255,200,140,0.4)' }} />
          <span className="absolute bottom-1.5 left-2 w-1.5 h-1.5 rounded-full" style={{ background: '#3a2408', boxShadow: 'inset 0 1px 1px rgba(255,200,140,0.4)' }} />
          <span className="absolute bottom-1.5 right-2 w-1.5 h-1.5 rounded-full" style={{ background: '#3a2408', boxShadow: 'inset 0 1px 1px rgba(255,200,140,0.4)' }} />
          <span
            className="relative text-2xl italic font-black tracking-[0.08em]"
            style={{
              fontFamily: 'Rye, Georgia, serif',
              background: GOLD_BG,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 1px 0 #2a1a06) drop-shadow(0 2px 1px rgba(0,0,0,0.7))',
            }}
          >
            FREE GAMES
          </span>
        </div>
      </div>

      {/* Two wilds with OR */}
      <div className="relative z-10 flex items-center gap-5 mt-8">
        <WildTile sym="brown" label="WILD" />
        <span className="text-3xl italic font-black" style={GOLD_TEXT}>OR</span>
        <WildTile sym="spirit" label="WILD" />
      </div>

      {/* ON EVERY SPIN */}
      <p className="relative z-10 mt-5 text-lg italic font-black tracking-[0.18em]" style={GOLD_TEXT}>
        ON EVERY SPIN
      </p>

      {/* TAP TO START hint */}
      <p className="relative z-10 mt-4 text-sm italic font-black tracking-[0.3em] animate-pulse" style={GOLD_TEXT}>
        TAP TO START
      </p>
    </div>
  );
}