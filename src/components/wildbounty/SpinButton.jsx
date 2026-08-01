import React, { useEffect, useState } from 'react';
import { sfx } from './sounds';

// Single composite image: polished circular wooden disc with metallic
// refresh-arrows on top — exactly matches the reference design.
const SPIN_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/8311a13c2_file_00000000436881fa98ae2df9cf884fed.png';

// One full revolution decelerating to a stop.
const COAST_ANIM = 'saSpinRotate 1.8s cubic-bezier(0.12, 0.55, 0.06, 1) forwards';

export default function SpinButton({ spinning, onClick, disabled }) {
  const [coasting, setCoasting] = useState(false);

  useEffect(() => {
    if (spinning) {
      setCoasting(false);
      return;
    }
    // When the spin ends, kick off a slow-motion coast to a stop.
    setCoasting(true);
    const t = setTimeout(() => setCoasting(false), 1850);
    return () => clearTimeout(t);
  }, [spinning]);

  const anim = spinning
    ? 'saSpinRotate 0.35s linear infinite'
    : coasting
    ? COAST_ANIM
    : undefined;

  return (
    <button
      onClick={(e) => { if (!disabled) sfx.spinClick(); onClick(e); }}
      disabled={disabled}
      className="wb-spin-btn relative flex items-center justify-center disabled:opacity-90 active:scale-95 transition-transform"
      style={{
        boxShadow: '0 0 0 0 rgba(255,215,0,0)',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      <style>{`
        .wb-spin-btn:active:not(:disabled) {
          box-shadow: 0 0 18px 4px rgba(255,215,0,0.85), 0 0 36px 10px rgba(255,200,80,0.55) !important;
        }
      `}</style>
      <img
        src={SPIN_IMG}
        alt="Spin"
        draggable={false}
        className="block w-[11.25rem] h-[11.25rem] select-none"
        style={{
          animation: anim,
          filter: spinning || coasting
            ? 'brightness(1.15) drop-shadow(0 0 14px rgba(255,220,120,0.5))'
            : 'brightness(1) drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
          transition: 'filter 0.3s ease',
        }}
      />
    </button>
  );
}