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
                0.36 0.708 0.132 0 -0.1"
            />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.08 0.9 1" />
            </feComponentTransfer>
            <feGaussianBlur stdDeviation="0.3" />
          </filter>
        </defs>
      </svg>
      <img
        src={BANNER_IMG}
        alt=""
        className="block w-full h-auto select-none"
        draggable={false}
        style={{ filter: 'url(#wbBoardLumaKey) saturate(1.45) contrast(1.4) brightness(1.05)' }}
      />
    </div>
  );
}