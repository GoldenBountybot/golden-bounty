import React from 'react';
import { isMult, multValue } from '@/lib/gatesEngine';

// High-value symbols (zeus, crown, hourglass, ring, goblet, scatter) are
// AI-generated art shot on a SOLID PURE BLACK background. We render the image
// with `mix-blend-mode: screen`, which turns pure-black pixels fully
// transparent (black + backdrop = backdrop) while keeping the bright art —
// so the purple board shows through with zero "box" backdrop.
//
// Low-value gems are drawn purely in CSS (faceted radial gradient) so they
// have no background at all either.

export const SYM_IMG = {
  zeus:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/14eab47f0_generated_image.png',
  crown:     'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/71111ae1e_generated_image.png',
  hourglass: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/bea6e7361_generated_image.png',
  ring:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/2bd22adda_generated_image.png',
  goblet:    'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d8d665ebe_generated_image.png',
  scatter:   'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/875c0a005_generated_image.png',
};

const GEMS = {
  red:    { c: '#ff4848', d: '#7a0a0a', g: '#8a0a0a' },
  blue:   { c: '#48a8ff', d: '#0a3a8a', g: '#0a2a6a' },
  green:  { c: '#48e070', d: '#0a6a2a', g: '#0a4a1a' },
  yellow: { c: '#ffd648', d: '#8a6a0a', g: '#6a4a0a' },
};

// Kept for any external import compatibility (info panel emoji fallback).
export const SYM_EMOJI = {
  zeus: '⚡', crown: '👑', hourglass: '⏳', ring: '💍', goblet: '🏆',
  red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', scatter: '🌟',
};

function Gem({ color }) {
  const g = GEMS[color] || GEMS.red;
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        style={{
          width: '64%',
          aspectRatio: '1/1',
          background: `radial-gradient(circle at 36% 28%, #ffffffcc 0%, ${g.c} 34%, ${g.d} 78%, ${g.g} 100%)`,
          border: '1.5px solid rgba(255,255,255,0.55)',
          boxShadow: 'inset 0 0 8px rgba(255,255,255,0.45), inset 0 0 14px rgba(0,0,0,0.4)',
          clipPath: 'polygon(50% 0%, 100% 35%, 82% 100%, 18% 100%, 0% 35%)',
        }}
      />
    </div>
  );
}

function ArtSym({ sym, highlight }) {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <img
        src={SYM_IMG[sym]}
        alt={sym}
        draggable={false}
        style={{
          width: '96%',
          height: '96%',
          objectFit: 'contain',
          mixBlendMode: 'screen',
          filter: highlight
            ? 'brightness(1.35) drop-shadow(0 0 8px rgba(255,210,80,0.95))'
            : 'brightness(1.05)',
          transition: 'filter 0.15s',
        }}
      />
    </div>
  );
}

export default function GatesSymbol({ sym, highlight }) {
  if (isMult(sym)) {
    const v = multValue(sym);
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: '74%',
            height: '74%',
            background: 'radial-gradient(circle at 35% 30%,#bdf06a,#3aa814 55%,#1c6a06)',
            border: '2px solid #eaffd0',
            boxShadow: '0 0 8px rgba(120,220,40,0.7), inset 0 0 6px rgba(255,255,200,0.4)',
          }}
        >
          <span style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: 12, color: '#fffbe0', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
            ×{v}
          </span>
        </div>
      </div>
    );
  }

  if (SYM_IMG[sym]) return <ArtSym sym={sym} highlight={highlight} />;
  if (GEMS[sym]) return <Gem color={sym} />;
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ fontSize: 28 }}>
      <span>{SYM_EMOJI[sym] || sym}</span>
    </div>
  );
}