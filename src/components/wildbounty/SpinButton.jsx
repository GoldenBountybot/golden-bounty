import React, { useEffect, useState } from 'react';

// Faithful replica of the reference spin button: a wooden medallion with two
// gold chasing arrows. Uses the provided asset clipped to a circle; while the
// spin is active the arrows rotate fast, and when the spin ends they coast to
// a stop in slow motion.
const SPIN_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/25136629b_file_00000000277882069551e3444a9535e9.png';

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
      onClick={onClick}
      disabled={disabled}
      className="relative flex items-center justify-center disabled:opacity-90"
    >
      <span
        className="relative w-[5.5rem] h-[5.5rem] rounded-full flex items-center justify-center overflow-hidden transition-transform active:scale-95"
        style={{
          boxShadow: '0 4px 12px rgba(0,0,0,0.7)',
        }}
      >
        <img
          src={SPIN_IMG}
          alt="Spin"
          draggable={false}
          className="block w-full h-full object-cover select-none"
          style={{
            animation: anim,
            filter: spinning || coasting
              ? 'brightness(1.55) saturate(1.6) drop-shadow(0 0 14px rgba(255,225,120,0.95)) drop-shadow(0 0 28px rgba(255,200,60,0.75))'
              : 'brightness(1.05) drop-shadow(0 0 4px rgba(255,190,70,0.4))',
            transition: 'filter 0.3s ease',
          }}
        />
      </span>
    </button>
  );
}