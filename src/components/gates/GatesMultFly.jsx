import React from 'react';

// A golden multiplier chip that flies from an origin offset into the tumble
// win banner, representing a value symbol's multiplier (or the accumulated
// banner multiplier) flying in to multiply the win amount.
// `value`  — the multiplier number (rendered as ×N)
// `ox/oy`  — origin offset from the banner centre (px); chip starts there
// `from`   — 'symbol' (flies up from the board) | 'banner' (flies from the
//            total-multiplier banner on the side)
export default function GatesMultFly({ value, ox = 0, oy = 100, lx = 55, from = 'symbol' }) {
  const color = from === 'banner' ? '#b0e0ff' : '#fff8c0';
  const stroke = from === 'banner' ? '#0a2a4a' : '#5a3a0c';
  const glow =
    from === 'banner'
      ? '0 0 16px rgba(120,200,255,1), 0 0 28px rgba(80,160,255,0.85), 0 2px 3px rgba(0,0,0,0.9)'
      : '0 0 16px rgba(255,200,0,1), 0 0 28px rgba(255,160,0,0.85), 0 2px 3px rgba(0,0,0,0.9)';
  return (
    <span
      className="pointer-events-none absolute"
      style={{
        left: '50%',
        top: '50%',
        fontFamily: 'Georgia,serif',
        fontWeight: 900,
        fontSize: 26,
        color,
        textShadow: glow,
        WebkitTextStroke: `0.5px ${stroke}`,
        zIndex: 60,
        whiteSpace: 'nowrap',
        animation: 'gatesMultFlyToBanner 0.95s cubic-bezier(0.16,0.84,0.44,1) both',
        '--ox': `${ox}px`,
        '--oy': `${oy}px`,
        '--lx': `${lx}px`,
      }}
    >
      ×{value}
    </span>
  );
}