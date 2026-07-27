import React from 'react';

// Metallic-gold multiplier strip overlaid on the BoardTopBanner wooden plaque.
// Layout matches the reference: X1024 (red, far-left), X512 (left), X1 (center,
// large), X2 (right), X4 (far-right). 3D gold slab-serif look via stacked text
// shadows; the special high tier (1024) is rendered in a dark-red metallic.
function GoldText({ value, size, red = false }) {
  const base = red ? '#c0584a' : '#e9c659';
  const hi = red ? '#f0a89a' : '#fff7d6';
  const sh = red ? '#7a2418' : '#8b5a2b';
  const deep = red ? '#4a1208' : '#5a3a1a';
  return (
    <span
      style={{
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
      }}
    >
      X{value}
    </span>
  );
}

export default function MultiplierStrip({ className = '' }) {
  return (
    <div
      className={`absolute inset-x-0 flex items-end justify-center gap-3 sm:gap-5 pointer-events-none ${className}`}
      style={{ top: '52%', transform: 'translateY(-50%)' }}
    >
      <GoldText value={1024} size="0.95rem" red />
      <GoldText value={512} size="1.05rem" />
      <GoldText value={1} size="1.9rem" />
      <GoldText value={2} size="1.05rem" />
      <GoldText value={4} size="0.95rem" />
    </div>
  );
}