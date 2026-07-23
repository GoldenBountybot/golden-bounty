import React from 'react';
import { PAYLINES } from './argonautsEngine';

// Glowing neon-yellow payline overlays drawn across the 5x3 grid.
// winningLines: array of { line, symbol, count, pay } — each draws the full
// payline path (all 5 reels) as a separate glowing yellow polyline, like the
// classic slot payline diagram. Uses an absolutely-positioned SVG (viewBox
// 500x300) over the grid.
export default function WinLineOverlay({ winningLines }) {
  if (!winningLines || winningLines.length === 0) return null;

  const lines = winningLines
    .map((w) => w && typeof w.line === 'number' ? PAYLINES[w.line] : null)
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
      viewBox="0 0 500 300"
      preserveAspectRatio="none"
    >
      {lines.map((line, i) => {
        const points = line.map((row, r) => `${r * 100 + 50},${row * 100 + 50}`).join(' ');
        return (
          <g key={i} style={{ animation: 'argoWinLine 1.4s ease-out forwards' }}>
            {/* soft outer glow */}
            <polyline points={points} fill="none" stroke="#FEFF00" strokeWidth="6" strokeOpacity="0.35" strokeLinejoin="round" strokeLinecap="round" style={{ vectorEffect: 'non-scaling-stroke' }} />
            {/* mid glow */}
            <polyline points={points} fill="none" stroke="#FEFF00" strokeWidth="3" strokeOpacity="0.7" strokeLinejoin="round" strokeLinecap="round" style={{ vectorEffect: 'non-scaling-stroke' }} />
            {/* bright core */}
            <polyline points={points} fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeOpacity="0.95" strokeLinejoin="round" strokeLinecap="round" style={{ vectorEffect: 'non-scaling-stroke' }} />
          </g>
        );
      })}
    </svg>
  );
}