import React from 'react';
import { Spade, Heart, Diamond, Club, Crown, DollarSign } from 'lucide-react';

const SUIT_ICON = { S: Spade, H: Heart, D: Diamond, C: Club };
const SUIT_COLOR = { S: '#1a1a1a', H: '#c0392b', D: '#e0761c', C: '#2a5d9a' };
const FACE_COLOR = { A: '#1a1a1a', K: '#2a5d9a', Q: '#c0392b', J: '#1f7a4d' };

export default function CardTile({ cell, idx, isWin, spinning, isNew }) {
  const { sym, golden, id } = cell;
  const Icon = SUIT_ICON[sym];
  const isFace = ['A', 'K', 'Q', 'J'].includes(sym);
  const isSuit = !!Icon;
  const isWild = sym === 'W';
  const isScatter = sym === 'SC';

  const baseStyle = {
    background: 'linear-gradient(to bottom, #fdf8ec, #efe2c4)',
    border: '1px solid rgba(120,80,30,0.4)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 3px rgba(0,0,0,0.45)',
  };
  const goldStyle = {
    background: 'linear-gradient(to bottom, #fff7d6, #f0cf6a 55%, #c8901e)',
    border: '1.5px solid #f5c542',
    boxShadow: '0 0 8px rgba(245,197,66,0.7), inset 0 1px 0 rgba(255,255,240,0.8), inset 0 0 0 1px rgba(180,120,20,0.45)',
  };
  const wildStyle = {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #0f766e 50%, #b8860b 100%)',
    border: '1.5px solid #f5c542',
    boxShadow: '0 0 12px rgba(245,197,66,0.85), inset 0 0 0 1px rgba(255,235,150,0.5)',
  };
  const scatterStyle = {
    background: 'radial-gradient(circle at 50% 45%, #fff3c4, #f0c850 45%, #b8801e)',
    border: '1.5px solid #f5c542',
    boxShadow: '0 0 12px rgba(245,197,66,0.85), inset 0 1px 0 rgba(255,255,240,0.7)',
  };

  let style = baseStyle;
  if (isWild) style = wildStyle;
  else if (isScatter) style = scatterStyle;
  else if (golden) style = goldStyle;

  if (isWin) {
    style = {
      ...style,
      boxShadow: '0 0 14px rgba(255,235,150,0.95), inset 0 0 0 2px rgba(255,245,180,1)',
      transform: 'scale(1.04)',
    };
  }

  return (
    <div
      key={id}
      className="relative rounded-md flex flex-col items-center justify-center overflow-hidden"
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
        <>
          <Crown className="w-5 h-5 relative" style={{ color: '#fde68a', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
          <span className="text-[8px] font-black tracking-wider relative mt-0.5" style={{ color: '#7dd3fc', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>WILD</span>
        </>
      )}
      {isScatter && (
        <>
          <DollarSign className="w-6 h-6 relative" style={{ color: '#7a4a08', filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.6))' }} />
          <span className="text-[6.5px] font-black tracking-wider relative mt-0.5 px-1 rounded-sm" style={{ background: '#c0392b', color: '#fff', textShadow: '0 1px 1px rgba(0,0,0,0.6)' }}>SCATTER</span>
        </>
      )}
      {isFace && (
        <>
          <span className="absolute top-0.5 left-1 text-[9px] font-black leading-none" style={{ color: FACE_COLOR[sym], fontFamily: 'Georgia, serif' }}>{sym}</span>
          <span className="text-2xl font-black leading-none relative" style={{ color: FACE_COLOR[sym], fontFamily: 'Georgia, serif', textShadow: '0 1px 1px rgba(255,255,255,0.5)' }}>{sym}</span>
          {golden && <span className="absolute bottom-0.5 right-1 text-[7px] font-black" style={{ color: '#a06a10', fontFamily: 'Georgia, serif' }}>★</span>}
        </>
      )}
      {isSuit && (
        <>
          <Icon className="w-6 h-6 relative" style={{ color: SUIT_COLOR[sym], filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))' }} />
          <span className="absolute top-0.5 left-1 text-[8px] font-black leading-none" style={{ color: SUIT_COLOR[sym] }}>{sym === 'S' ? '♠' : sym === 'H' ? '♥' : sym === 'D' ? '♦' : '♣'}</span>
        </>
      )}
    </div>
  );
}