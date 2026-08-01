import React, { useEffect, useState } from 'react';
import { sfx } from './sounds';

// Metallic circular-arrow spin icon on a black background. The black
// background is keyed out with mix-blend-mode: screen so only the metallic
// arrows remain — no medallion / circle container behind it.
const SPIN_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c6ef02281_file_00000000a90081fa8732fd40e55cc3ef.png';

// Wooden bull-skull medallion placed behind the spin icon. Black background
// keyed out with mix-blend-mode: screen so only the carved wood shows.
const BG_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/12ac78246_file_00000000b0cc81faafcdac64067dd1a1.png';

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
      {/* Wooden bull-skull medallion behind the spin icon (static) */}
      <img
        src={BG_IMG}
        alt=""
        aria-hidden
        draggable={false}
        className="block absolute inset-0 m-auto w-[14rem] h-[5rem] select-none pointer-events-none"
        style={{
          mixBlendMode: 'screen',
          filter: 'brightness(1.05) drop-shadow(0 2px 6px rgba(0,0,0,0.6))',
        }}
      />
      <img
        src={SPIN_IMG}
        alt="Spin"
        draggable={false}
        className="block w-16 h-16 select-none relative z-10"
        style={{
          animation: anim,
          mixBlendMode: 'screen',
          filter: spinning || coasting
            ? 'brightness(1.35) contrast(1.15) drop-shadow(0 1px 1px rgba(0,0,0,0.8)) drop-shadow(0 -1px 1px rgba(255,255,255,0.3)) drop-shadow(0 0 14px rgba(255,220,120,0.55))'
            : 'brightness(1.15) contrast(1.1) drop-shadow(0 1px 1px rgba(0,0,0,0.8)) drop-shadow(0 -1px 1px rgba(255,255,255,0.3)) drop-shadow(0 0 6px rgba(255,190,80,0.3))',
          transition: 'filter 0.3s ease',
        }}
      />
    </button>
  );
}