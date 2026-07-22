import React from 'react';
import { SYMBOLS } from '@/lib/bigBrownEngine';

// Renders a single Big Brown symbol tile — realistic wildlife/portrait image
// on a dark forest-themed background with golden frame + glow for wins.
export default function BigBrownSymbol({ sym, highlight = false, expand = false }) {
  const def = SYMBOLS[sym];
  const img = def ? def.img : null;
  const type = def ? def.type : 'low';
  const isWild = type === 'wild' || type === 'spirit';
  const isScatter = type === 'scatter';

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{
        background: isWild
          ? 'linear-gradient(160deg,#3a2a12,#1a130a)'
          : isScatter
          ? 'linear-gradient(160deg,#5a441a,#3a2c0e)'
          : 'linear-gradient(160deg,#1a130a,#0a0703)',
        border: highlight
          ? '3px solid rgba(255,245,150,1)'
          : '1px solid rgba(214,178,98,0.35)',
        boxShadow: highlight
          ? '0 0 22px rgba(255,234,0,1), 0 0 40px rgba(255,200,80,0.85), inset 0 0 16px rgba(255,240,150,0.85)'
          : isWild
          ? '0 0 10px rgba(255,200,80,0.6), inset 0 0 6px rgba(255,200,80,0.25)'
          : 'inset 0 0 6px rgba(0,0,0,0.5)',
      }}
    >
      {img && (
        <img
          src={img}
          alt={def.label || sym}
          className="w-full h-full object-cover"
          style={{
            filter: highlight
              ? 'brightness(1.45) drop-shadow(0 0 10px rgba(255,234,0,1)) drop-shadow(0 0 18px rgba(255,200,80,0.85))'
              : isWild
              ? 'brightness(1.1) drop-shadow(0 0 4px rgba(255,200,80,0.5))'
              : isScatter
              ? 'brightness(1.7) saturate(1.6) sepia(0.18) drop-shadow(0 0 6px rgba(255,200,90,0.6))'
              : 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
          }}
          draggable={false}
        />
      )}
      {expand && (
        <span
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{ boxShadow: 'inset 0 0 14px rgba(255,210,90,0.6)' }}
        />
      )}
      {isWild && (
        <span
          className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-black tracking-widest"
          style={{
            fontFamily: 'Rye, Georgia, serif',
            color: '#ffe9a8',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          }}
        >
          {type === 'spirit' ? 'WILD x2' : 'WILD'}
        </span>
      )}
      {isScatter && (
        <span
          className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[16px] font-black italic leading-none tracking-[0.12em] select-none"
          style={{
            fontFamily: 'Rye, Georgia, serif',
            background: 'linear-gradient(to bottom, #fff7d1 0%, #ffe9a8 18%, #e8b945 38%, #d49d20 55%, #c8881e 72%, #8a5b15 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 1px 0 #6b4a1a) drop-shadow(0 2px 2px rgba(0,0,0,0.95)) drop-shadow(0 0 9px rgba(255,220,120,0.9))',
            WebkitTextStroke: '0.4px rgba(120,80,30,0.55)',
          }}
        >
          BONUS
        </span>
      )}
    </div>
  );
}