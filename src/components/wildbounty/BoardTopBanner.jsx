import React from 'react';

// Decorative western "steer skull + wooden sign" banner mounted on top of the
// reel board. The source asset ships on a solid black background. Using
// mix-blend-mode: screen makes pure black fully transparent (black adds no
// light under screen math) with zero alpha fringe / halo, while boosting
// contrast + saturation keeps the gold/wood colors vivid and clear.
const BANNER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/16d198493_file_00000000ce28820b9b425fc57f1c795e.png';

export default function BoardTopBanner({ className = '' }) {
  return (
    <div className={`relative w-full mx-auto ${className}`}>
      <img
        src={BANNER_IMG}
        alt=""
        className="block w-full h-auto select-none"
        draggable={false}
        style={{
          mixBlendMode: 'screen',
          filter: 'brightness(1.15) contrast(1.55) saturate(1.6)',
        }}
      />
    </div>
  );
}