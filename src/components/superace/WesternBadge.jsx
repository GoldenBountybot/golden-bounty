import React from 'react';

// Premium golden Western badge for SuperAce WILD / SCATTER tiles.
// Metallic gold sheriff star with engraved lettering, Rye/Georgia serif.
// `variant`: 'wild' | 'scatter'

const GOLD_STOPS = [
  { o: '0%', c: '#fff6d6' },
  { o: '28%', c: '#f5d066' },
  { o: '55%', c: '#d39a1e' },
  { o: '78%', c: '#b07a0e' },
  { o: '100%', c: '#8a5d08' },
];

function StarPath({ cx = 50, cy = 50, r = 46, ri = 19 }) {
  // 5-point star
  let d = '';
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (Math.PI * i) / 5;
    const rad = i % 2 === 0 ? r : ri;
    const x = cx + rad * Math.cos(ang);
    const y = cy + rad * Math.sin(ang);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d + 'Z';
}

export default function WesternBadge({ variant = 'wild' }) {
  const isWild = variant === 'wild';
  const letter = isWild ? 'W' : '$';
  const label = isWild ? 'WILD' : 'SCATTER';
  const gid = isWild ? 'wg' : 'sg';
  const gid2 = isWild ? 'wg2' : 'sg2';

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id={gid} cx="50%" cy="42%" r="60%">
          {GOLD_STOPS.map((s) => <stop key={s.o} offset={s.o} stopColor={s.c} />)}
        </radialGradient>
        <linearGradient id={gid2} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8e0" />
          <stop offset="50%" stopColor="#e9b94a" />
          <stop offset="100%" stopColor="#9a6c0c" />
        </linearGradient>
      </defs>

      {/* outer ring */}
      <circle cx="50" cy="50" r="47" fill={`url(#${gid2})`} stroke="#7a5405" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="42" fill="#1c1306" stroke="#caa233" strokeWidth="0.8" />
      {/* rivets */}
      {[0, 72, 144, 216, 288].map((a) => {
        const r = 44;
        const x = 50 + r * Math.cos((a - 90) * Math.PI / 180);
        const y = 50 + r * Math.sin((a - 90) * Math.PI / 180);
        return <circle key={a} cx={x} cy={y} r="1.7" fill="#f5e0a0" stroke="#7a5405" strokeWidth="0.5" />;
      })}

      {/* sheriff star */}
      <path d={StarPath({ r: 37, ri: 15 })} fill={`url(#${gid})`} stroke="#7a5405" strokeWidth="1.6" strokeLinejoin="round" />
      {/* inner star bevel */}
      <path d={StarPath({ r: 30, ri: 12 })} fill="none" stroke="rgba(255,245,200,0.5)" strokeWidth="1" strokeLinejoin="round" />

      {/* center emblem */}
      <circle cx="50" cy="50" r="15" fill="#241605" stroke="#caa233" strokeWidth="1.2" />
      <text
        x="50"
        y="57"
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fill={`url(#${gid2})`}
        style={{ fontFamily: 'Rye, Georgia, serif' }}
        stroke="#7a5405"
        strokeWidth="0.3"
      >
        {letter}
      </text>

      {/* bottom ribbon label */}
      <g>
        <path d="M30 78 L70 78 L74 84 L66 88 L50 86 L34 88 L26 84 Z" fill="#2a1a05" stroke="#caa233" strokeWidth="0.9" />
        <text x="50" y="84.5" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#f5e0a0" style={{ fontFamily: 'Rye, Georgia, serif', letterSpacing: '0.5px' }}>
          {label}
        </text>
      </g>
    </svg>
  );
}