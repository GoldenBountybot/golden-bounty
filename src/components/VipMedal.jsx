import React from 'react';

// Tier-specific medal/gem logos rendered as inline SVG so they never break
// and stay crisp at any size. Bronze / Silver / Gold = ribboned medal with a
// star; Diamond = faceted blue gem.

function MedalStar({ color, edge, ribbon }) {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      {/* Ribbons */}
      <path d="M16 2 L20 18 L12 18 Z" fill={ribbon} opacity="0.92" />
      <path d="M32 2 L36 18 L28 18 Z" fill={ribbon} opacity="0.92" />
      {/* Medal body */}
      <circle cx="24" cy="30" r="14" fill={color} stroke={edge} strokeWidth="1.5" />
      <circle cx="24" cy="30" r="9.5" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
      {/* Star */}
      <path
        d="M24 23.5 L25.7 28.4 L30.9 28.4 L26.7 31.4 L28.3 36.3 L24 33.2 L19.7 36.3 L21.3 31.4 L17.1 28.4 L22.3 28.4 Z"
        fill="rgba(255,255,255,0.92)"
      />
    </svg>
  );
}

function DiamondGem({ color, edge }) {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <path d="M24 6 L40 6 L46 16 L24 44 L2 16 L8 6 Z" fill={color} stroke={edge} strokeWidth="1.4" />
      <path d="M8 6 L16 16 L24 44 L2 16 Z" fill="rgba(255,255,255,0.28)" />
      <path d="M40 6 L32 16 L24 44 L46 16 Z" fill="rgba(0,0,0,0.16)" />
      <path d="M8 6 L40 6 L32 16 L16 16 Z" fill="rgba(255,255,255,0.42)" />
      <path d="M16 16 L32 16 L24 44 Z" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
    </svg>
  );
}

const TIERS = {
  Bronze: { type: 'medal', color: '#cd7f32', edge: '#8a5320', ribbon: '#cd7f32' },
  Silver: { type: 'medal', color: '#c0c0c0', edge: '#8a8a8a', ribbon: '#b0b0b0' },
  Gold:   { type: 'medal', color: '#ffd24a', edge: '#b8860b', ribbon: '#e0a82e' },
  Diamond:{ type: 'gem',   color: '#5aa9e6', edge: '#2a6fb0' },
};

export default function VipMedal({ tier = 'Bronze', className = '' }) {
  const t = TIERS[tier] || TIERS.Bronze;
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {t.type === 'gem'
        ? <DiamondGem color={t.color} edge={t.edge} />
        : <MedalStar color={t.color} edge={t.edge} ribbon={t.ribbon} />}
    </div>
  );
}