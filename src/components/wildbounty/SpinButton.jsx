import React, { useEffect, useState } from 'react';
import { sfx } from './sounds';

// Metallic circular-arrow spin icon on a black background. The black
// background is keyed out with mix-blend-mode: screen so only the metallic
// arrows remain — no medallion / circle container behind it.
const SPIN_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c6ef02281_file_00000000a90081fa8732fd40e55cc3ef.png';

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
      className="relative flex items-center justify-center disabled:opacity-90 active:scale-95 transition-transform"
    >
      <img
        src={SPIN_IMG}
        alt="Spin"
        draggable={false}
        className="block w-12 h-12 select-none"
        style={{
          animation: anim,
          mixBlendMode: 'screen',
          filter: spinning || coasting
            ? 'brightness(1.3) drop-shadow(0 0 12px rgba(255,220,120,0.5))'
            : 'brightness(1.1) drop-shadow(0 0 6px rgba(255,190,80,0.3))',
          transition: 'filter 0.3s ease',
        }}
      />
    </button>
  );
}