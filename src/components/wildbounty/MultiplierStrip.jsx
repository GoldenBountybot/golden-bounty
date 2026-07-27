import React from 'react';

// Metallic-gold multiplier strip overlaid on the BoardTopBanner wooden plaque.
// The five multipliers follow the curve of the banner (center high, edges low,
// each rotated to match the arch) exactly like the reference art.
function GoldText({ value, size, red = false, rot = 0, left, top }) {
  const base = red ? '#c0584a' : '#e9c659';
  const hi = red ? '#f0a89a' : '#fff7d6';
  const sh = red ? '#7a2418' : '#8b5a2b';
  const deep = red ? '#4a1208' : '#5a3a1a';
  return (
    <span
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        fontFamily: 'Rye, Georgia, serif',
        fontSize: size,
        fontWeight: 900,
        lineHeight: 1,
        color: base,
        letterSpacing: '0.02em',
        fontStyle: 'italic',
        textShadow: `0 1px 0 ${hi}, 0 -1px 0 ${sh}, 1px 1px 0 ${sh}, 2px 2px 0 ${sh}, 3px 3px 0 ${deep}, 4px 4px 0 ${deep}, 0 0 3px ${hi}, 0 3px 5px rgba(0,0,0,0.85)`,
        filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.6))',
        whiteSpace: 'nowrap',
        transform: `translate(-50%, -50%) rotate(${rot}deg)`,
        transformOrigin: 'center center',
      }}
    >
      X{value}
    </span>
  );
}

// left%, top%, rotation for each multiplier along the drooping banner curve
// (center low, edges high — like a hanging plaque). Left items tilt clockwise,
// right items counter-clockwise, following the curve.
// Order left→right: X512, X1024 (red), X1, X2, X4 — along the banner's
// sagging U-arc (center low, ends high). Inner gaps are tighter, outer gaps
// wider, exactly as in the reference.
const ITEMS = [
  { v: 512,  left: 23, top: 46, size: '1.0rem',  red: false, rot: 16 },
  { v: 1024, left: 39, top: 54, size: '1.05rem', red: true,  rot: 8 },
  { v: 1,    left: 50, top: 64, size: '1.95rem', red: false, rot: 0 },
  { v: 2,    left: 61, top: 54, size: '1.05rem', red: false, rot: -8 },
  { v: 4,    left: 77, top: 46, size: '1.0rem',  red: false, rot: -16 },
];

export default function MultiplierStrip({ className = '' }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {ITEMS.map((it) => (
        <GoldText
          key={it.v}
          value={it.v}
          size={it.size}
          red={it.red}
          rot={it.rot}
          left={it.left}
          top={it.top}
        />
      ))}
    </div>
  );
}