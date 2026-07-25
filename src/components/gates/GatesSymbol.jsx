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
  red:       'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f4ca4aa86_generated_image.png',
  blue:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/08bca9467_generated_image.png',
  green:     'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/788a2d51a_generated_image.png',
  yellow:    'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c46437541_generated_image.png',
};

// Kept for any external import compatibility (info panel emoji fallback).
export const SYM_EMOJI = {
  zeus: '⚡', crown: '👑', hourglass: '⏳', ring: '💍', goblet: '🏆',
  red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', scatter: '🌟',
};

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
            ? 'brightness(1.4) drop-shadow(0 0 10px rgba(255,210,80,1)) drop-shadow(0 1px 3px rgba(0,0,0,0.9))'
            : 'brightness(1.15) contrast(1.12) saturate(1.1) drop-shadow(0 2px 5px rgba(0,0,0,0.95)) drop-shadow(0 0 3px rgba(0,0,0,0.8)) drop-shadow(0 0 1px rgba(255,255,255,0.25))',
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
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ fontSize: 28 }}>
      <span>{SYM_EMOJI[sym] || sym}</span>
    </div>
  );
}