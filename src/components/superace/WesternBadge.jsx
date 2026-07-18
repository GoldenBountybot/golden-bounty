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

// ---------- SCATTER emblem (star badge + $) ----------
function ScatterEmblem() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <GoldGrad id="sg" />
      </defs>
      <circle cx="50" cy="50" r="47" fill={`url(#${'sgl'})`} stroke="#7a5405" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="42" fill="#1c1306" stroke="#caa233" strokeWidth="0.8" />
      {[0, 72, 144, 216, 288].map((a) => {
        const r = 44;
        const x = 50 + r * Math.cos((a - 90) * Math.PI / 180);
        const y = 50 + r * Math.sin((a - 90) * Math.PI / 180);
        return <circle key={a} cx={x} cy={y} r="1.7" fill="#f5e0a0" stroke="#7a5405" strokeWidth="0.5" />;
      })}
      <path d={StarPath({ r: 37, ri: 15 })} fill={`url(#${'sg'})`} stroke="#7a5405" strokeWidth="1.6" strokeLinejoin="round" />
      <path d={StarPath({ r: 30, ri: 12 })} fill="none" stroke="rgba(255,245,200,0.5)" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="15" fill="#241605" stroke="#caa233" strokeWidth="1.2" />
      <text x="50" y="57" textAnchor="middle" fontSize="18" fontWeight="700" fill={`url(#${'sgl'})`} stroke="#7a5405" strokeWidth="0.3" style={{ fontFamily: 'Rye, Georgia, serif' }}>$</text>
      <path d="M30 78 L70 78 L74 84 L66 88 L50 86 L34 88 L26 84 Z" fill="#2a1a05" stroke="#caa233" strokeWidth="0.9" />
      <text x="50" y="84.5" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#f5e0a0" style={{ fontFamily: 'Rye, Georgia, serif', letterSpacing: '0.5px' }}>SCATTER</text>
    </svg>
  );
}

export default function WesternBadge({ variant = 'wild' }) {
  return variant === 'wild' ? <WildEmblem /> : <ScatterEmblem />;
}