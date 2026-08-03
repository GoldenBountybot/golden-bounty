import React from 'react';

// A golden blast burst at the banner center: a bright flash core, an
// expanding shockwave ring, and a spray of stars scattering outward in all
// directions. Purely cosmetic — no balance effect.
const STAR_COUNT = 14;

export default function BannerBlast() {
  const stars = Array.from({ length: STAR_COUNT }, (_, i) => {
    const angle = (i / STAR_COUNT) * Math.PI * 2 + (i % 2 ? 0.18 : -0.12);
    const dist = 60 + (i % 3) * 26;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const size = 6 + (i % 3) * 3;
    const delay = (i % 4) * 0.02;
    return { dx, dy, size, delay, rot: angle };
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
      {/* Bright flash core */}
      <div
        className="absolute rounded-full"
        style={{
          width: 70,
          height: 70,
          background: 'radial-gradient(circle, rgba(255,255,240,1) 0%, rgba(255,225,140,0.95) 35%, rgba(255,180,60,0.5) 65%, transparent 80%)',
          animation: 'blastCore 0.6s ease-out forwards',
        }}
      />
      {/* Expanding shockwave ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(255,235,150,0.95)',
          boxShadow: '0 0 14px rgba(255,210,80,0.9)',
          animation: 'blastRing 0.7s ease-out forwards',
        }}
      />
      {/* Stars scattering outward in all directions */}
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            '--ex': s.dx + 'px',
            '--ey': s.dy + 'px',
            animation: `blastEmber 0.75s ease-out ${s.delay}s forwards`,
          }}
        >
          <svg
            width={s.size}
            height={s.size}
            viewBox="0 0 24 24"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(255,220,120,0.95))',
              transform: `rotate(${s.rot}rad)`,
            }}
          >
            <path
              d="M12 0 L14.4 9.6 L24 12 L14.4 14.4 L12 24 L9.6 14.4 L0 12 L9.6 9.6 Z"
              fill="url(#blastStarGrad)"
            />
            <defs>
              <linearGradient id="blastStarGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff7d6" />
                <stop offset="50%" stopColor="#ffd24a" />
                <stop offset="100%" stopColor="#e8a93a" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ))}
    </div>
  );
}