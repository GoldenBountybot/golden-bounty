import React from 'react';

// The user's uploaded prize-wheel image. It ships with a white background, but
// the wheel itself is circular — so we clip the <img> to a circle (border-radius
// 50% + overflow hidden) to drop the white corners, leaving a transparent wheel
// that floats on the page background.
//
// A downward gold "horn cone" pointer sits above; a gold pedestal stand below.
//
// Props:
//  rotation: number (deg) — wheel rotated to this angle
//  onRest: () => void — fired when the spin transition ends
//  size: px (default 320)

const WHEEL_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/580f5a5e8_file_00000000f1f081fb9825395d20f29cb7.png';

export default function SpinWheel({ rotation, onRest, size = 320 }) {
  return (
    <div className="flex flex-col items-center select-none" style={{ width: size }}>
      {/* Wheel image — clipped to a circle so the white background is removed */}
      <div
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 10s cubic-bezier(0.16,0.92,0.02,1)',
          willChange: 'transform',
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 0 0 3px #5e3d12',
        }}
        onTransitionEnd={(e) => {
          if (e.propertyName === 'transform' && onRest) onRest();
        }}
      >
        <img
          src={WHEEL_IMG}
          alt="Daily free spin wheel"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Stand — big bold Western ornate carved pedestal (premium iconic) */}
      <div className="flex flex-col items-center -mt-1" style={{ width: size }}>
        {/* Thick gold rim ring hugging the wheel bottom */}
        <div
          style={{
            width: size * 0.86, height: 26, borderRadius: '10px 10px 4px 4px',
            background: 'linear-gradient(to bottom,#fff4d0,#e0b34a 40%,#8a5a1e 78%,#4a2f10)',
            border: '2px solid #3a2410',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.7), inset 0 -4px 6px rgba(0,0,0,0.45), 0 4px 10px rgba(0,0,0,0.6)',
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* egg-and-dart carved molding band */}
          <svg width="100%" height="14" viewBox="0 0 200 14" preserveAspectRatio="none" style={{ opacity: 0.9 }} pointerEvents="none">
            {Array.from({ length: 14 }).map((_, i) => (
              <g key={i} transform={`translate(${i * 14.3},0)`}>
                <ellipse cx="4" cy="7" rx="3" ry="5" fill="#5e3d12" />
                <path d="M8 2 L11 7 L8 12" stroke="#ffe9a8" strokeWidth="1.1" fill="none" />
              </g>
            ))}
          </svg>
          {/* corner studs */}
          <span style={{ position: 'absolute', top: 4, left: 6, width: 6, height: 6, borderRadius: '50%', background: 'radial-gradient(circle,#fff4d0,#c8932e)', boxShadow: '0 0 4px rgba(255,210,120,0.9)' }} />
          <span style={{ position: 'absolute', top: 4, right: 6, width: 6, height: 6, borderRadius: '50%', background: 'radial-gradient(circle,#fff4d0,#c8932e)', boxShadow: '0 0 4px rgba(255,210,120,0.9)' }} />
        </div>

        {/* Capital — wide carved gold block with acanthus scroll corners */}
        <div
          style={{
            width: size * 0.7, height: 18, borderRadius: '4px',
            background: 'linear-gradient(to bottom,#ffe9a8,#c8932e 55%,#7a4f17)',
            border: '1.5px solid #4a2f10',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -3px 4px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.6)',
            position: 'relative',
          }}
        >
          <svg width="100%" height="18" viewBox="0 0 200 18" preserveAspectRatio="none" pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
            <path d="M0 9 C 8 2, 14 2, 16 9 C 14 16, 8 16, 0 9 Z M200 9 C 192 2, 186 2, 184 9 C 186 16, 192 16, 200 9 Z" fill="#5e3d12" opacity="0.6" />
          </svg>
        </div>

        {/* Chunky carved wooden column with deep fluting + big sheriff-star badge */}
        <div
          style={{
            width: size * 0.42, height: 64,
            background: 'linear-gradient(to right,#1a1108 0%,#3a2818 14%,#6b4a28 50%,#3a2818 86%,#1a1108 100%)',
            border: '2px solid #3a2410',
            borderLeft: 'none', borderRight: 'none',
            position: 'relative',
            boxShadow: 'inset 0 0 12px rgba(0,0,0,0.6)',
          }}
        >
          {/* deep vertical flutes */}
          {[16, 34, 54, 74, 94].map((x) => (
            <span key={x} style={{ position: 'absolute', top: 3, bottom: 3, left: x, width: 2, borderRadius: 3, background: 'linear-gradient(to bottom,rgba(255,210,120,0.18),rgba(0,0,0,0.55),rgba(255,210,120,0.12))' }} />
          ))}
          {/* big central sheriff-star medallion */}
          <div
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: 42, height: 42, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%,#fff4d0,#e0b34a 48%,#7a4f17 92%)',
              border: '2.5px solid #3a2410',
              boxShadow: '0 0 12px rgba(255,200,80,0.85), inset 0 2px 0 rgba(255,255,255,0.7), inset 0 -3px 5px rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" style={{ pointerEvents: 'none' }}>
              <path d="M12 1 L14.5 8.5 L22 8.5 L16 13 L18.5 21 L12 16.5 L5.5 21 L8 13 L2 8.5 L9.5 8.5 Z" fill="#5e3d12" stroke="#fff4d0" strokeWidth="0.6" strokeLinejoin="round" />
              <circle cx="12" cy="12.5" r="2" fill="#fff4d0" />
            </svg>
          </div>
        </div>

        {/* Thick ornate base plinth with beveled gold trim + claw-paw feet */}
        <div
          style={{
            width: size * 0.72, height: 30, borderRadius: '10px',
            background: 'linear-gradient(to bottom,#ffe9a8,#e0b34a 30%,#8a5a1e 70%,#4a2f10)',
            border: '2.5px solid #2a1a08',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.65), inset 0 -5px 8px rgba(0,0,0,0.5), 0 8px 22px rgba(0,0,0,0.75)',
            position: 'relative',
          }}
        >
          {/* carved rope molding line (top + bottom) */}
          <svg width="100%" height="6" viewBox="0 0 200 6" preserveAspectRatio="none" style={{ position: 'absolute', top: 4, left: 0, right: 0 }} pointerEvents="none">
            <path d="M0 3 Q 5 0 10 3 T 20 3 T 30 3 T 40 3 T 50 3 T 60 3 T 70 3 T 80 3 T 90 3 T 100 3 T 110 3 T 120 3 T 130 3 T 140 3 T 150 3 T 160 3 T 170 3 T 180 3 T 190 3 T 200 3" stroke="#7a4f17" strokeWidth="1.4" fill="none" opacity="0.8" />
          </svg>
          <svg width="100%" height="4" viewBox="0 0 200 4" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 6, left: 0, right: 0 }} pointerEvents="none">
            <path d="M0 2 Q 6 0 12 2 T 24 2 T 36 2 T 48 2 T 60 2 T 72 2 T 84 2 T 96 2 T 108 2 T 120 2 T 132 2 T 144 2 T 156 2 T 168 2 T 180 2 T 192 2" stroke="#ffe9a8" strokeWidth="1" fill="none" opacity="0.7" />
          </svg>

          {/* central carved rosette */}
          <svg width="46" height="22" viewBox="0 0 46 22" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} pointerEvents="none">
            <g fill="#7a4f17" opacity="0.85">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                <ellipse key={a} cx="23" cy="11" rx="3.5" ry="1.4" transform={`rotate(${a} 23 11)`} />
              ))}
            </g>
            <circle cx="23" cy="11" r="3" fill="#fff4d0" />
          </svg>

          {/* edge studs along top */}
          {[0.08, 0.25, 0.5, 0.75, 0.92].map((p) => (
            <span key={p} style={{ position: 'absolute', top: 2, left: `${p * 100}%`, width: 6, height: 6, borderRadius: '50%', background: 'radial-gradient(circle,#fff4d0,#c8932e)', boxShadow: '0 0 4px rgba(255,210,120,0.9)', transform: 'translateX(-50%)' }} />
          ))}
        </div>

        {/* Claw-paw feet at the four corners */}
        {[
          { left: 4 }, { right: 4 },
        ].map((pos, i) => (
          <svg key={i} width="34" height="26" style={{ position: 'relative', ...pos, marginTop: -6 }} viewBox="0 0 34 26" pointerEvents="none">
            <path d="M4 2 C 8 2, 12 8, 14 14 C 16 20, 22 24, 28 24 L 30 24 L 30 18 C 26 18, 22 14, 20 10 C 18 6, 12 2, 4 2 Z" fill="url(#pawg)" stroke="#2a1a08" strokeWidth="1" />
            <defs>
              <linearGradient id="pawg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffe9a8" />
                <stop offset="0.5" stopColor="#c8932e" />
                <stop offset="1" stopColor="#7a4f17" />
              </linearGradient>
            </defs>
            <circle cx="14" cy="20" r="1.8" fill="#3a2410" />
            <circle cx="20" cy="22" r="1.6" fill="#3a2410" />
            <circle cx="26" cy="21" r="1.4" fill="#3a2410" />
          </svg>
        ))}

        {/* Foot plinth */}
        <div
          style={{
            width: size * 0.82, height: 12, marginTop: -2, borderRadius: '6px',
            background: 'linear-gradient(to bottom,#3a2a1a,#150d06)',
            border: '1.5px solid #2a1a08',
            boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.25), 0 4px 10px rgba(0,0,0,0.7)',
          }}
        />

        {/* Ground shadow */}
        <div
          style={{
            width: size * 0.9, height: 12, marginTop: 4,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}