import React from 'react';
import { SYMBOLS } from './argonautsEngine';

// A single symbol tile styled to match the screenshot: dark-blue cell, gold-rim,
// large emoji glyph. Wild gets a fire glow + WILD label.
export default function ArgoSymbolTile({ sym, spinning, win, dim = false, size = 'md' }) {
  const meta = SYMBOLS[sym] || SYMBOLS.bow;
  const isWild = meta.kind === 'wild';
  const isScatter = meta.kind === 'scatter';
  const isBonus = meta.kind === 'bonus';
  const special = isWild || isScatter || isBonus;

  const bg = special
    ? 'radial-gradient(circle at 50% 38%, rgba(255,215,0,0.22), rgba(26,13,74,0.88) 70%)'
    : 'radial-gradient(circle at 50% 38%, rgba(40,24,90,0.55), rgba(12,8,30,0.92) 72%)';

  return (
    <div
      className="relative flex items-center justify-center rounded-[7px] transition-all duration-300 overflow-hidden"
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        background: bg,
        border: win ? '1.5px solid #FFD700' : '1px solid rgba(255,215,0,0.22)',
        boxShadow: win
          ? '0 0 16px rgba(255,215,0,0.9), 0 0 6px rgba(255,255,160,0.8), inset 0 0 10px rgba(255,215,0,0.3)'
          : 'inset 0 0 10px rgba(0,0,0,0.55)',
        opacity: dim ? 0.32 : 1,
        filter: spinning ? 'blur(1.4px) brightness(0.82)' : win ? 'brightness(1.15) saturate(1.15)' : 'none',
        animation: spinning ? 'ccReelSpin 0.16s linear infinite' : undefined,
      }}
    >
      {isWild && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 70%, rgba(255,90,0,0.35), transparent 65%)' }}
        />
      )}
      {meta.image ? (
        <img
          src={meta.image}
          alt={meta.name}
          className="relative z-10 w-full h-full object-cover"
          draggable={false}
          style={{ filter: spinning ? 'none' : win ? 'brightness(1.08)' : 'none' }}
        />
      ) : (
        <span
          className="relative z-10"
          style={{
            fontSize: '2rem',
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))',
            transform: isWild ? 'scale(1.35)' : 'none',
          }}
        >
          {meta.emoji}
        </span>
      )}
      {isScatter && (
        <span
          className="absolute bottom-0.5 inset-x-0 text-center font-black tracking-wider"
          style={{ fontSize: '7px', color: '#FFD700', textShadow: '0 1px 2px #000', fontFamily: 'Georgia, serif' }}
        >
          SCATTER
        </span>
      )}
      {isBonus && (
        <span
          className="absolute bottom-0.5 inset-x-0 text-center font-black tracking-wider"
          style={{ fontSize: '7px', color: '#FFD700', textShadow: '0 1px 2px #000', fontFamily: 'Georgia, serif' }}
        >
          BONUS
        </span>
      )}
    </div>
  );
}