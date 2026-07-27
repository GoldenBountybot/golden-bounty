import React from 'react';

// Decorative western "steer skull + wooden sign" banner mounted on top of the
// reel board. The source asset ships on a solid black background; we render
// it as an SVG <image> with a luminance-key feColorMatrix filter so the black
// background is converted to true alpha transparency while the gold/wood art
// keeps its own RGB. Applying the filter inside the SVG (instead of via CSS
// url() on an <img>) guarantees the key runs reliably.
const BANNER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/16d198493_file_00000000ce28820b9b425fc57f1c795e.png';

export default function BoardTopBanner({ className = '' }) {
  return (
    <div className={`relative w-full mx-auto pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 1024 300"
        preserveAspectRatio="xMidYMid meet"
        className="block w-full h-auto select-none"
        aria-hidden="true"
      >
        <defs>
          <filter id="wbBoardLumaKey" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0.3 0.59 0.11 0 -0.12"
            />
          </filter>
        </defs>
        <image
          href={BANNER_IMG}
          x="0"
          y="0"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          filter="url(#wbBoardLumaKey)"
        />
      </svg>
    </div>
  );
}