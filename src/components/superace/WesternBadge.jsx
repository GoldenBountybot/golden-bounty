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

// ---------- WILD emblem (Jester/Joker) ----------
function WildEmblem() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <GoldGrad id="wg" />
        <linearGradient id="jestG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00e676" />
          <stop offset="100%" stopColor="#00a838" />
        </linearGradient>
        <linearGradient id="jestB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="cardG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f4c430" />
          <stop offset="100%" stopColor="#d4a017" />
        </linearGradient>
      </defs>
      {/* gold card with beveled border */}
      <rect x="4" y="4" width="92" height="92" rx="9" fill="#7a5405" />
      <rect x="7" y="7" width="86" height="86" rx="7" fill={`url(#${'cardG'})`} stroke="#b8901e" strokeWidth="1.2" />
      <rect x="11" y="11" width="78" height="78" rx="5" fill="none" stroke="#8a5d08" strokeWidth="0.7" />
      {/* corner gems */}
      {[[16,16],[84,16],[16,84],[84,84]].map(([x,y],i) => (
        <g key={i}>
          <polygon points={`${x},${y-3} ${x+3},${y} ${x},${y+3} ${x-3},${y}`} fill="#2962ff" stroke="#0d1b6b" strokeWidth="0.5" />
          <polygon points={`${x},${y-3} ${x-1.2},${y-0.5} ${x-3},${y}`} fill="#9fc0ff" />
        </g>
      ))}

      {/* jester hat */}
      <g transform="translate(50 48)">
        {/* three points: left (green), center (blue), right (green) */}
        <path d="M-22 14 Q-20 -6 -8 -10 Q-10 0 -6 14 Z" fill={`url(#${'jestG'})`} stroke="#0d3a14" strokeWidth="1" />
        <path d="M0 16 Q-4 -4 0 -14 Q4 -4 0 16 Z" fill={`url(#${'jestB'})`} stroke="#0d1b6b" strokeWidth="1" />
        <path d="M22 14 Q20 -6 8 -10 Q10 0 6 14 Z" fill={`url(#${'jestG'})`} stroke="#0d3a14" strokeWidth="1" />
        {/* brim */}
        <rect x="-26" y="12" width="52" height="6" rx="2" fill={`url(#${'wg'})`} stroke="#7a5405" strokeWidth="0.8" />
        {/* orbs on tips */}
        {[[-15,-9,1,'#fff'],[0,-14,1.2,'#fff'],[15,-9,1,'#fff']].map(([x,y,r,c],i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill={c} stroke="#b8901e" strokeWidth="0.4" />
            <circle cx={x - 0.4} cy={y - 0.4} r="0.45" fill="#eaf6ff" />
          </g>
        ))}
      </g>

      {/* big WILD */}
      <rect x="20" y="66" width="60" height="20" rx="4" fill="#0d1b6b" />
      <text
        x="50"
        y="82"
        textAnchor="middle"
        fontSize="17"
        fontWeight="800"
        fill="#f4c430"
        stroke="#0d1b6b"
        strokeWidth="1.6"
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: 'Arial Black, Impact, sans-serif', letterSpacing: '1px' }}
      >
        WILD
      </text>
    </svg>
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