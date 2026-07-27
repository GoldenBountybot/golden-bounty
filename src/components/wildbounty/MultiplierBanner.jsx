import React from 'react';

// Bull-skull + wooden banner image acts as the multiplier banner backdrop.
const BANNER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/7be17c563_file_00000000b61481fabeec47bdbfaf5bfc.png';

export default function MultiplierBanner() {
  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: '86%' }}>
      <img
        src={BANNER_IMG}
        alt="Multiplier banner"
        className="w-full h-auto block select-none"
        draggable={false}
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  );
}