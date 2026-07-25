import React from 'react';
import { SYMBOLS, isMult, multValue } from '@/lib/gatesEngine';

const TILE = {
  zeus: { bg: 'radial-gradient(circle at 35% 30%, #fff3c0, #f5c542 45%, #8b5a2b 100%)', color: '#3a2408' },
  crown: { bg: 'radial-gradient(circle at 35% 30%, #ffeec0, #d9a02e 50%, #6b3f12 100%)', color: '#3a2408' },
  hourglass: { bg: 'radial-gradient(circle at 35% 30%, #e8f4ff, #5a8fcf 50%, #1a3a6a 100%)', color: '#0a1a3a' },
  ring: { bg: 'radial-gradient(circle at 35% 30%, #ffe0ee, #c45a8e 50%, #6a1a3a 100%)', color: '#3a0a2a' },
  goblet: { bg: 'radial-gradient(circle at 35% 30%, #e6ffe6, #3aa05a 50%, #0a3a1a 100%)', color: '#0a3a1a' },
  red: { bg: 'radial-gradient(circle at 35% 30%, #ffd0d0, #d43030 50%, #6a0a0a 100%)', color: '#3a0a0a' },
  blue: { bg: 'radial-gradient(circle at 35% 30%, #d0e4ff, #3070d4 50%, #0a2a6a 100%)', color: '#0a1a3a' },
  green: { bg: 'radial-gradient(circle at 35% 30%, #d0ffd0, #30a030 50%, #0a4a0a 100%)', color: '#0a3a0a' },
  yellow: { bg: 'radial-gradient(circle at 35% 30%, #fff3c0, #d4a030 50%, #6a4a0a 100%)', color: '#3a2a0a' },
  scatter: { bg: 'radial-gradient(circle at 35% 30%, #d8f0ff, #2a8fcf 50%, #0a2a5a 100%)', color: '#021a3a' },
};

export default function GatesSymbol({ sym, highlight, dropping }) {
  if (isMult(sym)) {
    const v = multValue(sym);
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div
          className="relative w-[82%] h-[82%] rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #fff7d6, #f5c542 38%, #8b5a2b 100%)',
            border: '2px solid #fff0c0',
            boxShadow: '0 0 10px rgba(255,200,80,0.95), inset 0 0 6px rgba(255,255,255,0.65)',
          }}
        >
          <span
            className="font-black italic text-[13px] leading-none"
            style={{ fontFamily: 'Georgia, serif', color: '#3a2408', textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}
          >
            ×{v}
          </span>
        </div>
      </div>
    );
  }
  const def = SYMBOLS[sym] || { emoji: '' };
  const t = TILE[sym] || { bg: '#222', color: '#fff' };
  return (
    <div
      className={`w-full h-full rounded-[6px] flex items-center justify-center relative overflow-hidden ${dropping ? 'animate-[saReelDrop_0.34s_ease-out_both]' : ''}`}
      style={{
        background: t.bg,
        border: highlight ? '2px solid #fff7d6' : '1px solid rgba(255,255,255,0.2)',
        boxShadow: highlight ? '0 0 14px rgba(255,234,120,0.95), inset 0 0 8px rgba(255,234,120,0.5)' : 'none',
      }}
    >
      <span style={{ fontSize: '28px', lineHeight: 1, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.45))' }}>
        {def.emoji}
      </span>
      {sym === 'scatter' && (
        <span
          className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[7px] font-black italic tracking-wide"
          style={{ color: '#bff0ff', fontFamily: 'Georgia, serif' }}
        >
          SCATTER
        </span>
      )}
    </div>
  );
}