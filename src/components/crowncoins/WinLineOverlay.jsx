import React from 'react';

// Crown Coins — premium win-line animation overlay.
// Renders a soft golden line connecting winning symbols, a bright traveling
// light that pulses 3 times from the first to the last winning symbol, soft
// glow pulses on each winning cell, and subtle golden sparkles.
// Purely visual; pointer-events-none; fades out after 3 pulses.

// Grid index (0-8, row-major) → percentage center in a 100×100 space.
function cellCenter(idx) {
  const col = idx % 3;
  const row = Math.floor(idx / 3);
  return { x: (col + 0.5) * (100 / 3), y: (row + 0.5) * (100 / 3) };
}

const SPARKLE_PATH = 'M8 0 L9.2 6.8 L16 8 L9.2 9.2 L8 16 L6.8 9.2 L0 8 L6.8 6.8 Z';

export default function WinLineOverlay({ lines }) {
  if (!lines || lines.length === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 20, animation: 'ccWinOverlayFade 4.8s ease-out forwards' }}
    >
      {/* Win lines + traveling light */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {lines.map((ln, i) => {
          const pts = ln.idxs.map(cellCenter);
          const d = pts.map((p, j) => `${j === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          const delay = i * 0.12;
          return (
            <g key={i}>
              {/* Soft base line */}
              <path
                d={d}
                fill="none"
                stroke="rgba(255,210,80,0.28)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* Traveling golden light — 3 pulses */}
              <path
                d={d}
                fill="none"
                stroke="rgba(255,248,200,0.95)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                pathLength={100}
                style={{
                  strokeDasharray: '18 100',
                  animation: `ccWinLineTravel 1.4s ease-in-out ${delay}s 3 both`,
                  filter: 'drop-shadow(0 0 5px rgba(255,220,100,0.9))',
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Soft golden glow on each winning cell — 3 pulses */}
      {lines.flatMap((ln, i) =>
        ln.idxs.map((idx, j) => {
          const c = cellCenter(idx);
          const delay = i * 0.12 + j * 0.04;
          return (
            <div
              key={`glow-${i}-${j}`}
              className="absolute rounded-full"
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                width: '30%',
                height: '30%',
                background:
                  'radial-gradient(circle, rgba(255,220,100,0.4) 0%, rgba(255,200,60,0.15) 45%, transparent 70%)',
                animation: `ccWinGlowPulse 1.4s ease-in-out ${delay}s 3 both`,
              }}
            />
          );
        })
      )}

      {/* Golden sparkles on each winning cell — 3 pulses */}
      {lines.flatMap((ln, i) =>
        ln.idxs.map((idx, j) => {
          const c = cellCenter(idx);
          const delay = i * 0.12 + j * 0.08;
          return (
            <div
              key={`spk-${i}-${j}`}
              className="absolute"
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                animation: `ccWinSparkle 1.4s ease-in-out ${delay}s 3 both`,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                style={{ filter: 'drop-shadow(0 0 3px rgba(255,225,130,0.9))' }}
              >
                <path d={SPARKLE_PATH} fill="rgba(255,245,190,0.95)" />
              </svg>
            </div>
          );
        })
      )}
    </div>
  );
}