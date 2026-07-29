import React, { useEffect, useState } from 'react';

// Reusable wooden medallion button — identical look to the Wild Bounty spin
// button (same asset, same glow, same arrow-rotation animation). Pass an
// optional `active` prop to spin the arrows, and any children as the label.
const WOOD_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/25136629b_file_00000000277882069551e3444a9535e9.png';

const COAST_ANIM = 'saSpinRotate 1.8s cubic-bezier(0.12, 0.55, 0.06, 1) forwards';

export default function WoodButton({ onClick, disabled, active, size = '5.5rem', children, className = '' }) {
  const [coasting, setCoasting] = useState(false);

  useEffect(() => {
    if (active) {
      setCoasting(false);
      return;
    }
    setCoasting(true);
    const t = setTimeout(() => setCoasting(false), 1850);
    return () => clearTimeout(t);
  }, [active]);

  const anim = active
    ? 'saSpinRotate 0.35s linear infinite'
    : coasting
    ? COAST_ANIM
    : undefined;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col items-center gap-1 disabled:opacity-90 ${className}`}
    >
      <span
        className="relative rounded-full flex items-center justify-center overflow-hidden transition-transform active:scale-95"
        style={{
          width: size,
          height: size,
          boxShadow: '0 4px 12px rgba(0,0,0,0.7)',
        }}
      >
        <img
          src={WOOD_IMG}
          alt=""
          draggable={false}
          className="block w-full h-full object-cover select-none"
          style={{
            animation: anim,
            filter: active || coasting
              ? 'brightness(1.25) saturate(1.4) blur(0.4px) drop-shadow(0 0 18px rgba(255,220,120,0.55)) drop-shadow(0 0 40px rgba(255,200,70,0.45)) drop-shadow(0 0 70px rgba(255,190,60,0.3))'
              : 'brightness(1.08) drop-shadow(0 0 10px rgba(255,190,80,0.35))',
            transition: 'filter 0.3s ease',
          }}
        />
      </span>
      {children != null && (
        <span className="text-[8px] font-bold tracking-wide" style={{ color: '#ffd700' }}>
          {children}
        </span>
      )}
    </button>
  );
}