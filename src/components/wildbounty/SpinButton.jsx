import React from 'react';

// Faithful replica of the reference spin button: a wooden medallion with two
// gold chasing arrows. Uses the provided asset clipped to a circle; when the
// spin is active the arrows rotate and glow gold.
const SPIN_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/25136629b_file_00000000277882069551e3444a9535e9.png';

export default function SpinButton({ spinning, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative flex items-center justify-center disabled:opacity-90"
    >
      <span
        className="relative w-[5.5rem] h-[5.5rem] rounded-full flex items-center justify-center overflow-hidden transition-transform active:scale-95"
        style={{
          boxShadow: spinning
            ? '0 0 22px 6px rgba(255,215,0,0.85), 0 0 40px 14px rgba(255,180,40,0.5), 0 4px 12px rgba(0,0,0,0.7)'
            : '0 0 14px rgba(255,180,40,0.3), 0 4px 12px rgba(0,0,0,0.7)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <img
          src={SPIN_IMG}
          alt="Spin"
          draggable={false}
          className="block w-full h-full object-cover select-none"
          style={{
            animation: spinning ? 'saSpinRotate 0.9s linear infinite' : undefined,
            filter: spinning
              ? 'brightness(1.25) saturate(1.45) drop-shadow(0 0 6px rgba(255,215,0,0.85))'
              : 'none',
            transition: 'filter 0.3s ease',
          }}
        />
      </span>
    </button>
  );
}