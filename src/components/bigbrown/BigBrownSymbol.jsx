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
          ? 'linear-gradient(160deg,#2a1f0f,#120c06)'
          : 'linear-gradient(160deg,#1a130a,#0a0703)',
        border: highlight
          ? '2px solid rgba(255,234,0,0.95)'
          : '1px solid rgba(214,178,98,0.35)',
        boxShadow: highlight
          ? '0 0 16px rgba(255,234,0,0.9), inset 0 0 12px rgba(255,220,130,0.5)'
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
              ? 'brightness(1.25) drop-shadow(0 0 6px rgba(255,234,0,0.8))'
              : isWild
              ? 'brightness(1.1) drop-shadow(0 0 4px rgba(255,200,80,0.5))'
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
    </div>
  );
}