import React from 'react';

// Pure-visual golden prize wheel: pie segments + rim lights + gold hub,
// a downward "horn cone" pointer above, and a pedestal stand below.
// Surrounding background is transparent — the wheel floats on whatever
// page background sits behind it.
//
// Props:
//  segments: [{ label, value, color, gold?, jackpot? }]  (clockwise from top)
//  rotation: number (deg) — wheel is rotated to this angle
//  onRest: () => void — fired when the spin transition ends
//  size: px (default 320)

const PI = Math.PI;

export default function SpinWheel({ segments, rotation, onRest, size = 320 }) {
  const VB = 400;
  const cx = 200, cy = 200, r = 184;
  const seg = 360 / segments.length;

  const pt = (a) => [cx + r * Math.sin(a * PI / 180), cy - r * Math.cos(a * PI / 180)];

  const slices = segments.map((s, i) => {
    const ca = i * seg;                 // segment center angle (clockwise from top)
    const a0 = ca - seg / 2;
    const a1 = ca + seg / 2;
    const [x0, y0] = pt(a0);
    const [x1, y1] = pt(a1);
    const largeArc = seg > 180 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} Z`;
    const R = r * 0.72;
    const tx = cx + R * Math.sin(ca * PI / 180);
    const ty = cy - R * Math.cos(ca * PI / 180);
    return { ...s, path, tx, ty, rot: ca };
  });

  const lights = Array.from({ length: 24 }, (_, i) => i * (360 / 24));

  return (
    <div className="flex flex-col items-center select-none" style={{ width: size }}>
      {/* Pointer — downward gold "horn cone" sitting above the wheel */}
      <div className="relative z-10 -mb-3" style={{ width: size }}>
        <div className="flex flex-col items-center">
          <div
            style={{
              width: 30, height: 14, borderRadius: '6px 6px 2px 2px',
              background: 'linear-gradient(to bottom,#ffe9a8,#c8932e 55%,#7a4f17)',
              border: '1px solid #5e3d12',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 3px rgba(0,0,0,0.6)',
            }}
          />
          <div
            style={{
              width: 0, height: 0,
              borderLeft: '19px solid transparent',
              borderRight: '19px solid transparent',
              borderTop: '34px solid #e0b34a',
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))',
            }}
          />
          {/* inner darker tip for depth */}
          <div
            style={{
              width: 0, height: 0, marginTop: -34,
              borderLeft: '11px solid transparent',
              borderRight: '11px solid transparent',
              borderTop: '22px solid #b8860b',
            }}
          />
        </div>
      </div>

      {/* Wheel */}
      <div
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 4.6s cubic-bezier(0.14,0.94,0.18,1)',
          willChange: 'transform',
          width: size,
          height: size,
        }}
        onTransitionEnd={(e) => {
          if (e.propertyName === 'transform' && onRest) onRest();
        }}
      >
        <svg viewBox={`0 0 ${VB} ${VB}`} width={size} height={size}>
          <defs>
            <radialGradient id="hubG" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ffe9a8" />
              <stop offset="55%" stopColor="#e0b34a" />
              <stop offset="100%" stopColor="#7a4f17" />
            </radialGradient>
            <linearGradient id="goldSeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe9a8" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#9a7320" />
            </linearGradient>
          </defs>

          {/* outer dark ring */}
          <circle cx={cx} cy={cy} r={r + 9} fill="#1a1206" />
          {/* gold rim */}
          <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="url(#goldSeg)" strokeWidth="8" />

          {/* slices */}
          {slices.map((s, i) => (
            <path
              key={i}
              d={s.path}
              fill={s.gold ? 'url(#goldSeg)' : s.color}
              stroke="#1a1206"
              strokeWidth="1.4"
            />
          ))}

          {/* segment labels */}
          {slices.map((s, i) => (
            <text
              key={'t' + i}
              x={s.tx}
              y={s.ty}
              fill={s.gold ? '#3a2a10' : '#ffe9a8'}
              stroke={s.gold ? '#f7e3a8' : '#1a1206'}
              strokeWidth="0.4"
              paintOrder="stroke"
              fontSize={s.jackpot ? 19 : 16}
              fontWeight="900"
              fontFamily="Georgia, serif"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${s.rot} ${s.tx} ${s.ty})`}
              style={{ letterSpacing: '0.5px' }}
            >
              {s.label}
            </text>
          ))}

          {/* rim lights */}
          {lights.map((a, i) => {
            const lr = r - 9;
            const lx = cx + lr * Math.sin(a * PI / 180);
            const ly = cy - lr * Math.cos(a * PI / 180);
            return (
              <circle
                key={'l' + i}
                cx={lx}
                cy={ly}
                r="3.1"
                fill="#fff8e6"
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(255,248,230,0.95))',
                  animation: `lwLedPulse 1.1s ease-in-out ${((i % 4) * 0.18).toFixed(2)}s infinite`,
                }}
              />
            );
          })}

          {/* inner ring */}
          <circle cx={cx} cy={cy} r={r - 18} fill="none" stroke="rgba(255,233,168,0.25)" strokeWidth="1.2" />

          {/* hub */}
          <circle cx={cx} cy={cy} r="36" fill="url(#hubG)" stroke="#5e3d12" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="26" fill="none" stroke="#fff4d0" strokeWidth="1" opacity="0.6" />
          <text
            x={cx} y={cy} fill="#3a2a10" fontSize="30" fontWeight="900"
            textAnchor="middle" dominantBaseline="central"
            fontFamily="Georgia, serif"
          >
            ★
          </text>
        </svg>
      </div>

      {/* Stand / pedestal */}
      <div className="flex flex-col items-center -mt-2" style={{ width: size }}>
        {/* neck */}
        <div
          style={{
            width: 78, height: 26,
            background: 'linear-gradient(to bottom,#e0b34a,#7a4f17)',
            border: '1px solid #5e3d12',
            borderRadius: '4px 4px 0 0',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
          }}
        />
        {/* top plate */}
        <div
          style={{
            width: 168, height: 14,
            background: 'linear-gradient(to bottom,#f3d77a,#c8932e 55%,#7a4f17)',
            border: '1px solid #5e3d12',
            borderRadius: '4px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 6px rgba(0,0,0,0.6)',
          }}
        />
        {/* column */}
        <div
          style={{
            width: 56, height: 36,
            background: 'linear-gradient(to right,#3a2a1a,#1c140c 50%,#3a2a1a)',
            border: '1px solid #5e3d12',
            borderLeft: 'none', borderRight: 'none',
          }}
        />
        {/* base plate */}
        <div
          style={{
            width: 200, height: 18,
            background: 'linear-gradient(to bottom,#f3d77a,#c8932e 50%,#7a4f17)',
            border: '1px solid #5e3d12',
            borderRadius: '6px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 14px rgba(0,0,0,0.7)',
          }}
        />
        {/* feet shadow */}
        <div
          style={{
            width: 220, height: 7, marginTop: 2,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}