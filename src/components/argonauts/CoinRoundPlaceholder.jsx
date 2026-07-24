import React from 'react';

// Empty coin-round cell — deep maroon with a faint circular ornate
// (Greek-key style) placeholder. These cells are the canvas for new value
// coin drops during the Golden Fleece hold-and-spin round.
export default function CoinRoundPlaceholder({ pulsing = false }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center rounded-[7px] overflow-hidden"
      style={{ background: 'radial-gradient(circle, #5a0808 0%, #4D0505 70%)' }}
    >
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: '74%',
          height: '74%',
          border: '1px solid rgba(212,175,55,0.28)',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.7)',
        }}
      >
        {/* Faint ornate inner ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: '8%',
            border: '1px dashed rgba(212,175,55,0.22)',
            animation: pulsing ? 'ccPulse 0.9s ease-in-out infinite' : undefined,
          }}
        />
        {/* Center dot */}
        <div
          className="rounded-full"
          style={{ width: '10%', height: '10%', background: 'rgba(212,175,55,0.22)' }}
        />
      </div>
    </div>
  );
}