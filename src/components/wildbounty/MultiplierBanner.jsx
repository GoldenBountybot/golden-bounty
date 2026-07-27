import React from 'react';

// Bull-skull + wooden banner image acts as the multiplier banner backdrop.
const BANNER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/4ac18429a_file_000000006e6481fa9ba283c788d4cc07.png';

export default function MultiplierBanner() {
  return (
    <div
      className="relative w-full mx-auto"
      style={{ isolation: 'isolate' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 70% at 50% 45%, rgba(10,6,3,0.92) 0%, rgba(10,6,3,0.55) 55%, rgba(10,6,3,0) 100%)',
        }}
      />
      <img
        src={BANNER_IMG}
        alt="Multiplier banner"
        className="relative w-full h-auto block select-none"
        draggable={false}
        style={{
          mixBlendMode: 'screen',
          filter: 'brightness(1.2) contrast(1.5) saturate(1.6)',
        }}
      />
    </div>
  );
}