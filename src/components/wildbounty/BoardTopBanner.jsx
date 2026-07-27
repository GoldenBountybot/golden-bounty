import React from 'react';

// Decorative western "steer skull + wooden sign" banner mounted on top of the
// reel board. The source asset ships on a solid black background, so a
// luminance-key SVG filter converts luminance -> alpha: black pixels become
// fully transparent while the gold/wood art keeps its own RGB.
const BANNER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/16d198493_file_00000000ce28820b9b425fc57f1c795e.png';

export default function BoardTopBanner({ className = '' }) {
  return (
    <div className={`relative w-full mx-auto pointer-events-none ${className}`}>
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <filter id="wbBoardLumaKey" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0.3 0.59 0.11 0 -0.08"
            />
          </filter>
        </defs>
      </svg>
      <img
        src={BANNER_IMG}
        alt=""
        className="block w-full h-auto select-none"
        draggable={false}
        style={{ filter: 'url(#wbBoardLumaKey) saturate(1.2) contrast(1.12)' }}
      />
    </div>
  );
}