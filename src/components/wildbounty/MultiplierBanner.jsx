import React from 'react';

// Bull-skull + wooden banner image acts as the multiplier banner backdrop.
const BANNER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/4ac18429a_file_000000006e6481fa9ba283c788d4cc07.png';

export default function MultiplierBanner() {
  return (
    <div className="relative w-full mx-auto">
      <img
        src={BANNER_IMG}
        alt="Multiplier banner"
        className="w-full h-auto block select-none"
        draggable={false}
        style={{
          mixBlendMode: 'screen',
          filter: 'brightness(1.25) contrast(1.45) saturate(1.5) drop-shadow(0 2px 6px rgba(0,0,0,0.65))',
        }}
      />
    </div>
  );
}