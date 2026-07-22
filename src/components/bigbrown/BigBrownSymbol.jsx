import React from 'react';

// Renders a single Big Brown symbol tile — emoji on a forest-themed gradient,
// with a golden frame + glow for wild/spirit/scatter symbols.
const TILE_STYLE = {
  wild: { bg: 'linear-gradient(160deg,#3a2a12,#1a130a)', glow: 'rgba(255,200,80,0.85)' },
  spirit: { bg: 'linear-gradient(160deg,#1b3a4a,#0a1620)', glow: 'rgba(150,220,255,0.95)' },
  scatter: { bg: 'linear-gradient(160deg,#2a1f0f,#120c06)', glow: 'rgba(255,170,40,0.8)' },
  high: { bg: 'linear-gradient(160deg,#241a10,#100b06)', glow: null },
  mid: { bg: 'linear-gradient(160deg,#1f170d,#0e0904)', glow: null },
  low: { bg: 'linear-gradient(160deg,#181208,#0a0703)', glow: null },
};

export default function BigBrownSymbol({ sym, size = 'md', highlight = false, expand = false }) {
  const def = SYMBOL_DEF(sym);
  const style = TILE_STYLE[def.type] || TILE_STYLE.low;
  const isCard = ['A', 'K', 'Q', 'J'].includes(sym);
  const dim = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-3xl';

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${dim} transition-transform`}
      style={{
        background: style.bg,
        border: highlight
          ? '2px solid rgba(255,220,120,0.95)'
          : style.glow
          ? `1px solid rgba(214,178,98,0.6)`
          : '1px solid rgba(120,90,40,0.25)',
        boxShadow: highlight
          ? '0 0 14px rgba(255,210,90,0.95), inset 0 0 10px rgba(255,220,130,0.5)'
          : style.glow
          ? `0 0 9px ${style.glow}, inset 0 0 6px rgba(255,200,80,0.25)`
          : 'inset 0 0 6px rgba(0,0,0,0.5)',
      }}
    >
      {isCard ? (
        <span
          className="font-black italic"
          style={{ fontFamily: 'Georgia, serif', color: '#e8c878', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
        >
          {sym}
        </span>
      ) : (
        <span style={{ filter: expand ? 'drop-shadow(0 0 6px rgba(255,210,90,0.9)) brightness(1.15)' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }}>
          {def.emoji}
        </span>
      )}
      {expand && (
        <span
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{ boxShadow: 'inset 0 0 12px rgba(255,210,90,0.5)' }}
        />
      )}
    </div>
  );
}

function SYMBOL_DEF(id) {
  // local copy to avoid importing the engine into a presentational component
  const map = {
    scatter: { type: 'scatter', emoji: '🐾' },
    spirit: { type: 'spirit', emoji: '🐻‍❄️' },
    brown: { type: 'wild', emoji: '🐻' },
    buffalo: { type: 'high', emoji: '🐃' },
    eagle: { type: 'high', emoji: '🦅' },
    wolf: { type: 'high', emoji: '🐺' },
    deer: { type: 'mid', emoji: '🦌' },
  };
  return map[id] || { type: 'low', emoji: id };
}