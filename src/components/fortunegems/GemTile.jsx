import React from 'react';
import { SYMBOLS } from '@/lib/fortuneGemsEngine';

// Individual gem tile — mix-blend-mode: screen makes the black background
// of the AI image transparent, leaving only the glowing gem.
export default function GemTile({ cell, idx, isWin, isColSpinning, isNew, showMult, multiplier, isScatter }) {
  const sym = SYMBOLS[cell.sym];
  const isCenter = idx === 4;
  const isBonus = cell.sym === 'BONUS';

  return (
    <div
      className="relative aspect-square rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: 'linear-gradient(145deg, rgba(25,18,40,0.92), rgba(10,6,18,0.96))',
        border: isWin
          ? '2px solid rgba(255,215,0,0.95)'
          : isScatter
            ? '2px solid rgba(255,180,50,0.7)'
            : '1px solid rgba(180,140,60,0.35)',
        boxShadow: isWin
          ? '0 0 16px rgba(255,215,0,0.7), inset 0 0 12px rgba(255,215,0,0.3)'
          : isScatter
            ? '0 0 14px rgba(255,180,50,0.5)'
            : 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.4)',
      }}
    >
      <img
        src={sym.img}
        alt={sym.name}
        className="w-full h-full object-contain"
        style={{
          mixBlendMode: 'screen',
          filter: isColSpinning
            ? 'blur(3px) brightness(1.3)'
            : isWin
              ? 'brightness(1.4) drop-shadow(0 0 10px rgba(255,215,0,0.9))'
              : isScatter
                ? 'brightness(1.25) drop-shadow(0 0 8px rgba(255,180,50,0.7))'
                : 'brightness(1.05)',
          animation: isColSpinning
            ? 'fgReelSpin 0.12s linear infinite'
            : isNew
              ? 'fgDrop 0.4s ease-out'
              : isWin
                ? 'fgWinGlow 0.6s ease-in-out infinite'
                : isScatter
                  ? 'fgScatterGlow 1s ease-in-out infinite'
                  : undefined,
        }}
      />

      {/* Center multiplier badge overlay */}
      {isCenter && showMult && multiplier > 1 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span
            className="text-3xl font-black"
            style={{
              color: '#ffd700',
              textShadow: '0 0 10px rgba(255,215,0,1), 0 0 20px rgba(255,180,0,0.7), 0 2px 4px rgba(0,0,0,0.8)',
              fontFamily: 'Cinzel, Georgia, serif',
              animation: 'fgMultPop 0.4s ease-out',
            }}
          >
            {multiplier}×
          </span>
        </div>
      )}
    </div>
  );
}