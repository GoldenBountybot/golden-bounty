import React from 'react';
import PlayingCardFace from './PlayingCardFace';
import WesternBadge from './WesternBadge';

export default function CardTile({ cell, idx, isWin, spinning, isNew, shatter }) {
  const { sym, golden, id } = cell;
  const isFace = ['A', 'K', 'Q', 'J'].includes(sym);
  const isSuit = ['S', 'H', 'D', 'C'].includes(sym);
  const isWild = sym === 'W';
  const isScatter = sym === 'SC';

  // Standard white playing-card face with subtle radial gradient (lighter center)
  const baseStyle = {
    background: 'radial-gradient(circle at 50% 45%, #ffffff 0%, #fbf8f0 55%, #ede9e0 100%)',
    border: '1px solid #c9c4ba',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.4)',
  };
  // Golden card — thick glowing gold border (signifies golden → wild)
  const goldStyle = {
    background: 'linear-gradient(135deg, #ffe98a 0%, #f5c542 35%, #d39a1e 70%, #b8860b 100%)',
    border: '3px solid #ffe98a',
    boxShadow: '0 0 16px rgba(245,197,66,1), 0 0 30px rgba(245,197,66,0.55), inset 0 0 0 1px rgba(120,80,10,0.55), inset 0 1px 6px rgba(255,255,255,0.6), 0 1px 4px rgba(0,0,0,0.4)',
  };
  const wildStyle = {
    background: 'radial-gradient(circle at 50% 45%, #3a2a10 0%, #2a1a06 70%, #160d03 100%)',
    border: '1.5px solid #f5c542',
    boxShadow: '0 0 12px rgba(245,197,66,0.85), inset 0 0 0 1px rgba(255,235,150,0.45)',
  };
  const scatterStyle = {
    background: '#ffffff',
    border: '1.5px solid #f5c542',
    boxShadow: '0 0 12px rgba(245,197,66,0.85), inset 0 0 0 1px rgba(255,235,150,0.45)',
  };

  let style = baseStyle;
  if (isWild) style = wildStyle;
  else if (isScatter) style = scatterStyle;
  else if (golden) style = goldStyle;

  if (isWin) {
    style = {
      ...style,
      boxShadow: '0 0 16px rgba(255,235,150,1), inset 0 0 0 2px rgba(255,245,180,1)',
    };
  }

  return (
    <div
      key={id}
      className="relative rounded-md overflow-hidden w-full h-full"
      style={{
        ...style,
        animation: spinning
          ? `saReelDrop ${0.45 + (idx % 5) * 0.05}s ease-out both`
          : shatter
            ? 'saShatter 0.36s ease-in forwards'
            : isNew
              ? 'saReelDrop 0.4s ease-out both'
              : isWin
                ? 'saGlowPulse 0.7s ease-in-out infinite'
                : 'none',
        transition: 'transform 0.15s',
      }}
    >
      {isWild && (
        <div className="absolute inset-0 p-0.5">
          <WesternBadge variant="wild" />
        </div>
      )}
      {isScatter && (
        <div className="absolute inset-0 p-0.5">
          <WesternBadge variant="scatter" />
        </div>
      )}
      {(isFace || isSuit) && <PlayingCardFace sym={sym} golden={golden} />}
      {golden && (isFace || isSuit) && (
        <span className="absolute top-[3px] right-[3px] z-20 text-[8px] font-black" style={{ color: '#b8860b', textShadow: '0 0 4px rgba(255,235,150,0.9)' }}>★</span>
      )}
      {shatter && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          {STAR_DIRS.map((d, i) => (
            <span
              key={i}
              className="absolute top-1/2 left-1/2 text-[10px]"
              style={{
                '--sx': `${d.x}px`,
                '--sy': `${d.y}px`,
                color: '#ffe98a',
                textShadow: '0 0 5px rgba(245,197,66,0.9)',
                animation: `saStarBurst ${0.3 + (i % 3) * 0.06}s ease-out forwards`,
              }}
            >
              ★
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const STAR_DIRS = [
  { x: -18, y: -16 }, { x: 16, y: -18 }, { x: -22, y: 6 }, { x: 20, y: 8 },
  { x: -6, y: -22 }, { x: 8, y: 20 }, { x: -20, y: 18 }, { x: 22, y: -6 },
];