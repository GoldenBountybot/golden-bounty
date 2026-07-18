import React from 'react';
import PlayingCardFace from './PlayingCardFace';
import WesternBadge from './WesternBadge';

export default function CardTile({ cell, idx, isWin, spinning, isNew }) {
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
    background: 'radial-gradient(circle at 50% 45%, #fffdf2 0%, #fff3c4 55%, #f0d68a 100%)',
    border: '3px solid #f5c542',
    boxShadow: '0 0 10px rgba(245,197,66,0.85), inset 0 0 0 1px rgba(180,120,20,0.4), 0 1px 3px rgba(0,0,0,0.4)',
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
      transform: 'scale(1.05)',
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
    </div>
  );
}