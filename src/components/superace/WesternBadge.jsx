import React from 'react';

// Premium golden Western emblems for SuperAce WILD / SCATTER tiles.
// Wild: distinct big "WILD" wordmark on a horseshoe + star plate.
// Scatter: sheriff star badge with "$".
// Metallic gold, Rye/Georgia serif.

const GOLD_STOPS = [
  { o: '0%', c: '#fff6d6' },
  { o: '28%', c: '#f5d066' },
  { o: '55%', c: '#d39a1e' },
  { o: '78%', c: '#b07a0e' },
  { o: '100%', c: '#8a5d08' },
];
const GOLD_LIN = ['#fff8e0', '#e9b94a', '#9a6c0c'];

function GoldGrad({ id }) {
  return (
    <>
      <radialGradient id={id} cx="50%" cy="40%" r="62%">
        {GOLD_STOPS.map((s) => <stop key={s.o} offset={s.o} stopColor={s.c} />)}
      </radialGradient>
      <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
        {GOLD_LIN.map((c, i) => <stop key={i} offset={`${i * 50}%`} stopColor={c} />)}
      </linearGradient>
    </>
  );
}

function StarPath({ cx = 50, cy = 50, r = 46, ri = 19 }) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (Math.PI * i) / 5;
    const rad = i % 2 === 0 ? r : ri;
    d += `${i === 0 ? 'M' : 'L'}${(cx + rad * Math.cos(ang)).toFixed(2)} ${(cy + rad * Math.sin(ang)).toFixed(2)} `;
  }
  return d + 'Z';
}

// ---------- WILD emblem (image) ----------
const WILD_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/93a12d6af_wild.png';

function WildEmblem() {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url('${WILD_IMG}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      aria-label="Wild"
    />
  );
}

// ---------- SCATTER emblem (image) ----------
const SCATTER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c725b5a50_wild-ace-02.png';

function ScatterEmblem() {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url('${SCATTER_IMG}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      aria-label="Scatter"
    />
  );
}

export default function WesternBadge({ variant = 'wild' }) {
  return variant === 'wild' ? <WildEmblem /> : <ScatterEmblem />;
}