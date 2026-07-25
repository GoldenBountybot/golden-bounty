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

      {/* Wheel image — clipped to a circle so the white background is removed */}
      <div
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 4.6s cubic-bezier(0.14,0.94,0.18,1)',
          willChange: 'transform',
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 0 0 3px #5e3d12, 0 10px 30px rgba(0,0,0,0.65)',
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

      {/* Stand / pedestal */}
      <div className="flex flex-col items-center -mt-2" style={{ width: size }}>
        <div
          style={{
            width: 78, height: 26,
            background: 'linear-gradient(to bottom,#e0b34a,#7a4f17)',
            border: '1px solid #5e3d12',
            borderRadius: '4px 4px 0 0',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
          }}
        />
        <div
          style={{
            width: 168, height: 14,
            background: 'linear-gradient(to bottom,#f3d77a,#c8932e 55%,#7a4f17)',
            border: '1px solid #5e3d12',
            borderRadius: '4px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 6px rgba(0,0,0,0.6)',
          }}
        />
        <div
          style={{
            width: 56, height: 36,
            background: 'linear-gradient(to right,#3a2a1a,#1c140c 50%,#3a2a1a)',
            border: '1px solid #5e3d12',
            borderLeft: 'none', borderRight: 'none',
          }}
        />
        <div
          style={{
            width: 200, height: 18,
            background: 'linear-gradient(to bottom,#f3d77a,#c8932e 50%,#7a4f17)',
            border: '1px solid #5e3d12',
            borderRadius: '6px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 14px rgba(0,0,0,0.7)',
          }}
        />
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