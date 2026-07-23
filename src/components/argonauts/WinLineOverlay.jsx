import React from 'react';

// Glowing neon-yellow payline overlay drawn across the 5x3 grid.
// winningPositions: Set of "col-row" strings.
// Renders an absolutely-positioned SVG (viewBox 500x300) over the grid,
// connecting the centers of every winning symbol as a zigzag polyline.
export default function WinLineOverlay({ winningPositions }) {
  if (!winningPositions || winningPositions.size === 0) return null;

  const cells = [];
  winningPositions.forEach((key) => {
    const [col, row] = key.split('-').map(Number);
    if (!Number.isNaN(col) && !Number.isNaN(row)) cells.push({ col, row });
  });
  if (cells.length === 0) return null;

  cells.sort((a, b) => a.col - b.col || a.row - b.row);
  const points = cells.map((c) => `${c.col * 100 + 50},${c.row * 100 + 50}`).join(' ');

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
      viewBox="0 0 500 300"
      preserveAspectRatio="none"
    >
      {/* outer bloom */}
      <polyline points={points} fill="none" stroke="#FFFF00" strokeWidth="11" strokeOpacity="0.22" strokeLinejoin="round" strokeLinecap="round" style={{ vectorEffect: 'non-scaling-stroke' }} />
      {/* mid glow */}
      <polyline points={points} fill="none" stroke="#FDFD00" strokeWidth="6" strokeOpacity="0.55" strokeLinejoin="round" strokeLinecap="round" style={{ vectorEffect: 'non-scaling-stroke' }} />
      {/* bright core */}
      <polyline points={points} fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeOpacity="0.95" strokeLinejoin="round" strokeLinecap="round" style={{ vectorEffect: 'non-scaling-stroke' }} />
      {/* pulse nodes at each winning center */}
      {cells.map((c, i) => (
        <circle key={i} cx={c.col * 100 + 50} cy={c.row * 100 + 50} r="7" fill="#FFFF00" opacity="0.7" style={{ vectorEffect: 'non-scaling-stroke', animation: 'ccPulse 0.9s ease-in-out infinite' }} />
      ))}
    </svg>
  );
}