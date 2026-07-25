import React from 'react';
import { isMult, multValue } from '@/lib/gatesEngine';

// Symbols rendered as emoji glyphs instead of raster images. AI-generated
// PNGs kept baking a checkerboard "transparency" backdrop (white/black boxes)
// that no CSS filter can remove. Emoji have no background at all, so the
// purple board always shows through cleanly — zero image credits, zero boxes.

export const SYM_EMOJI = {
  zeus:      '⚡',
  crown:     '👑',
  hourglass: '⏳',
  ring:      '💍',
  goblet:    '🏆',
  red:       '🔴',
  blue:      '🔵',
  green:     '🟢',
  yellow:    '🟡',
  scatter:   '🌟',
};

// Kept for any external import compatibility; paytable now uses SYM_EMOJI.
export const SYM_IMG = { ...SYM_EMOJI };

const SIZE = 30;

export default function GatesSymbol({ sym, highlight }) {
  if (isMult(sym)) {
    const v = multValue(sym);
    return (
      <div className="w-full h-full flex items-center justify-center relative">
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

  const glyph = SYM_EMOJI[sym] || sym;
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        fontSize: SIZE,
        lineHeight: 1,
        filter: highlight ? 'drop-shadow(0 0 6px rgba(255,210,80,0.95))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))',
        transition: 'filter 0.15s',
      }}
    >
      <span>{glyph}</span>
    </div>
  );
}