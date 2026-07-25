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
      {/* Pointer — ornate Western gold horn with carved filigree + jewel tip */}
      <div className="relative z-10 -mb-3" style={{ width: size }}>
        <div className="flex flex-col items-center">
          {/* Mounting plate — carved gold escutcheon */}
          <div
            style={{
              width: 46, height: 20, borderRadius: '8px 8px 4px 4px',
              background: 'linear-gradient(to bottom,#ffe9a8,#e0b34a 45%,#8a5a1e 80%,#5e3d12)',
              border: '1.5px solid #4a2f10',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 3px rgba(0,0,0,0.45), 0 2px 5px rgba(0,0,0,0.6)',
              position: 'relative',
            }}
          >
            {/* filigree studs */}
            <span style={{ position: 'absolute', top: 3, left: 4, width: 4, height: 4, borderRadius: '50%', background: 'radial-gradient(circle,#fff4d0,#c8932e)', boxShadow: '0 0 3px rgba(255,210,120,0.9)' }} />
            <span style={{ position: 'absolute', top: 3, right: 4, width: 4, height: 4, borderRadius: '50%', background: 'radial-gradient(circle,#fff4d0,#c8932e)', boxShadow: '0 0 3px rgba(255,210,120,0.9)' }} />
            <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 6, height: 2, borderRadius: 2, background: '#7a4f17' }} />
          </div>

          {/* Carved horn cone with filigree overlay */}
          <div style={{ position: 'relative', width: 0, height: 0 }}>
            <div
              style={{
                width: 0, height: 0,
                borderLeft: '21px solid transparent',
                borderRight: '21px solid transparent',
                borderTop: '40px solid #e0b34a',
                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))',
              }}
            />
            {/* inner carved groove */}
            <div
              style={{
                position: 'absolute', top: 0, left: -14, width: 0, height: 0,
                borderLeft: '14px solid transparent',
                borderRight: '14px solid transparent',
                borderTop: '27px solid #b8860b',
              }}
            />
            {/* filigree scroll overlay */}
            <svg width="42" height="40" style={{ position: 'absolute', top: 0, left: -21, pointerEvents: 'none' }} viewBox="0 0 42 40">
              <path d="M21 3 C 16 14, 26 14, 21 25" stroke="#ffe9a8" strokeWidth="1.1" fill="none" opacity="0.85" />
              <path d="M14 8 C 17 16, 25 16, 28 8" stroke="#7a4f17" strokeWidth="0.9" fill="none" opacity="0.6" />
              <circle cx="21" cy="6" r="1.6" fill="#fff4d0" />
            </svg>
          </div>

          {/* Jewel tip — ruby star at the point */}
          <div style={{ marginTop: -8, position: 'relative', width: 14, height: 14 }}>
            <div
              style={{
                width: 12, height: 12, borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 30%, #ff9a8a, #c81e1e 55%, #7a1010)',
                border: '1.5px solid #5e3d12',
                boxShadow: '0 0 6px rgba(255,80,80,0.8), inset 0 1px 1px rgba(255,255,255,0.6)',
              }}
            />
          </div>
        </div>
      </div>

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

      {/* Stand — premium Western ornate carved pedestal */}
      <div className="flex flex-col items-center -mt-2" style={{ width: size }}>
        {/* Gold collar cap under the wheel */}
        <div
          style={{
            width: 96, height: 16, borderRadius: '6px 6px 2px 2px',
            background: 'linear-gradient(to bottom,#ffe9a8,#e0b34a 50%,#8a5a1e)',
            border: '1.5px solid #4a2f10',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 3px rgba(0,0,0,0.4)',
            position: 'relative',
          }}
        >
          <span style={{ position: 'absolute', top: 3, left: 8, width: 5, height: 5, borderRadius: '50%', background: 'radial-gradient(circle,#fff4d0,#c8932e)', boxShadow: '0 0 3px rgba(255,210,120,0.9)' }} />
          <span style={{ position: 'absolute', top: 3, right: 8, width: 5, height: 5, borderRadius: '50%', background: 'radial-gradient(circle,#fff4d0,#c8932e)', boxShadow: '0 0 3px rgba(255,210,120,0.9)' }} />
          <span style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 7, height: 3, borderRadius: 2, background: '#7a4f17' }} />
        </div>

        {/* Carved wooden drum column with fluting + central medallion */}
        <div
          style={{
            width: 74, height: 30,
            background: 'linear-gradient(to right,#2a1c10 0%,#4a3420 18%,#6b4a28 50%,#4a3420 82%,#2a1c10 100%)',
            border: '1.5px solid #4a2f10',
            borderLeft: 'none', borderRight: 'none',
            position: 'relative',
            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)',
          }}
        >
          {/* vertical flutes */}
          {[14, 30, 44, 60].map((x) => (
            <span key={x} style={{ position: 'absolute', top: 2, bottom: 2, left: x, width: 1.5, borderRadius: 2, background: 'linear-gradient(to bottom,rgba(255,210,120,0.25),rgba(0,0,0,0.35))' }} />
          ))}
          {/* center ornate medallion — gold star badge */}
          <div
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: 20, height: 20, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%,#ffe9a8,#e0b34a 50%,#8a5a1e)',
              border: '1.5px solid #4a2f10',
              boxShadow: '0 0 6px rgba(255,200,80,0.7), inset 0 1px 0 rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" style={{ pointerEvents: 'none' }}>
              <path d="M6 1 L7.2 4.6 L11 4.6 L7.9 6.8 L9.1 10.4 L6 8.2 L2.9 10.4 L4.1 6.8 L1 4.6 L4.8 4.6 Z" fill="#5e3d12" />
            </svg>
          </div>
        </div>

        {/* Wide ornate base plate with scrollwork corners + gold beveled trim */}
        <div
          style={{
            width: 210, height: 22, borderRadius: '8px',
            background: 'linear-gradient(to bottom,#ffe9a8,#e0b34a 35%,#8a5a1e 75%,#5e3d12)',
            border: '2px solid #3a2410',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -3px 5px rgba(0,0,0,0.45), 0 6px 16px rgba(0,0,0,0.7)',
            position: 'relative',
          }}
        >
          {/* carved filigree line */}
          <span style={{ position: 'absolute', top: 6, left: 14, right: 14, height: 1.5, borderRadius: 2, background: 'linear-gradient(to right,transparent,rgba(122,79,23,0.8),transparent)' }} />
          <span style={{ position: 'absolute', bottom: 5, left: 14, right: 14, height: 1, borderRadius: 2, background: 'linear-gradient(to right,transparent,rgba(255,233,168,0.7),transparent)' }} />

          {/* corner scrollwork */}
          {[
            { left: 4 }, { right: 4 },
          ].map((pos, i) => (
            <svg key={i} width="26" height="20" style={{ position: 'absolute', bottom: 1, ...pos }} viewBox="0 0 26 20" pointerEvents="none">
              <path d="M2 18 C 2 8, 10 4, 16 8 C 20 10, 20 14, 16 14" stroke="#7a4f17" strokeWidth="1.3" fill="none" opacity="0.75" />
              <circle cx="16" cy="14" r="1.8" fill="#ffe9a8" />
            </svg>
          ))}

          {/* edge studs */}
          {[18, 105, 192].map((x) => (
            <span key={x} style={{ position: 'absolute', top: 3, left: x, width: 5, height: 5, borderRadius: '50%', background: 'radial-gradient(circle,#fff4d0,#c8932e)', boxShadow: '0 0 3px rgba(255,210,120,0.9)', transform: 'translateX(-50%)' }} />
          ))}
        </div>

        {/* Foot rail */}
        <div
          style={{
            width: 230, height: 10, marginTop: 2, borderRadius: '5px',
            background: 'linear-gradient(to bottom,#3a2a1a,#1c140c)',
            border: '1px solid #4a2f10',
            boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.2), 0 3px 8px rgba(0,0,0,0.6)',
          }}
        />

        {/* Ground shadow */}
        <div
          style={{
            width: 240, height: 9, marginTop: 3,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.5), transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}