import React from 'react';
import { COLS, ROWS } from '@/lib/superaceEngine';

// Golden Wild image used for both the flying copies and the source tile.
export const GOLDEN_WILD_IMG = 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/6060a2364_wild-ace-01.png';

// Convert a flat grid index to a percentage center within the grid area.
function pos(idx) {
  const col = idx % COLS;
  const row = Math.floor(idx / COLS);
  return {
    left: `${((col + 0.5) / COLS) * 100}%`,
    top: `${((row + 0.5) / ROWS) * 100}%`,
  };
}

// Renders flying Golden Wild copies travelling from a source cell to target
// cells where a Wild would complete a winning line.
export default function FlyingWilds({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      {items.map((it, i) => {
        const s = pos(it.sourceIdx);
        const t = pos(it.targetIdx);
        return (
          <img
            key={i}
            src={GOLDEN_WILD_IMG}
            alt=""
            className="absolute w-[18%] aspect-[3/4] rounded-md"
            style={{
              left: s.left,
              top: s.top,
              '--sx': s.left,
              '--sy': s.top,
              '--tx': t.left,
              '--ty': t.top,
              transform: 'translate(-50%,-50%)',
              willChange: 'transform, left, top, opacity',
              animation: `saWildFly 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
              animationDelay: `${i * 0.08}s`,
              filter: 'drop-shadow(0 0 10px rgba(245,197,66,0.95))',
            }}
          />
        );
      })}
    </div>
  );
}