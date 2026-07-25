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
  zeus:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9a3355fd7_generated_image.png',
  crown:     'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d9d5e2a37_generated_image.png',
  hourglass: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/4b5bbb735_generated_image.png',
  ring:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/77051f4d5_generated_image.png',
  goblet:    'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a65f8531a_generated_image.png',
  scatter:   'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9212f063d_generated_image.png',
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
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Soft per-symbol dark backing — gives the screen-blend image a dark
          base so the symbol reads 100% clearly even over the bright Olympus
          background. Translucent so the scene still peeks through at edges. */}
      <div className="absolute inset-[3%] rounded-[16%]" style={{
        background: highlight
          ? 'radial-gradient(circle at 50% 45%, rgba(70,40,110,0.6), rgba(12,6,28,0.86) 70%)'
          : 'radial-gradient(circle at 50% 45%, rgba(34,18,62,0.52), rgba(8,4,20,0.8) 70%)',
        boxShadow: highlight
          ? 'inset 0 0 0 2px rgba(255,235,140,0.95), 0 0 10px rgba(255,205,80,0.85), inset 0 0 12px rgba(255,220,120,0.4)'
          : 'inset 0 0 0 1.5px rgba(200,150,60,0.45)',
        transition: 'box-shadow 0.2s, background 0.2s',
      }} />
      <img
        src={SYM_IMG[sym]}
        alt={sym}
        draggable={false}
        style={{
          position: 'relative',
          width: '94%',
          height: '94%',
          objectFit: 'contain',
          mixBlendMode: 'screen',
          filter: highlight
            ? 'brightness(1.5) drop-shadow(0 0 12px rgba(255,215,90,1))'
            : 'brightness(1.22) contrast(1.18) saturate(1.18)',
          transition: 'filter 0.2s',
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