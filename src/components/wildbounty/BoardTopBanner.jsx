import React from 'react';

// Hanging "bull-skull + gold-frame wooden sign" banner mounted on top of the
// reel board. The source asset ships on a solid #000000 background. We key
// that out with a value-based mask (alpha derived from the average channel
// value, then thresholded): pure black + faint anti-aliased fringe → fully
// transparent, while the dark wood (#4A2D1B), gold frame, skull and chains
// keep their own RGB and opacity. Unlike a luminance key, the dark-brown
// wood stays opaque because its average channel value (≈0.19) sits well
// above the black/fringe floor (≈0.05).

const BANNER_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/34377a521_file_00000000ce28820b9b425fc57f1c795e.png';

export default function BoardTopBanner({ className = '' }) {
  return (
    <div className={`relative w-full mx-auto ${className}`}>
      {/* Value-key SVG filter: alpha = average(R,G,B), thresholded so that
          pure black and faint fringe drop to 0 while all colored art stays
          opaque. RGB passes through untouched, preserving native colors. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <filter id="wbBoardKey" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0.333 0.333 0.333 0 0"
            />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0 0.9 1 1 1 1 1 1 1" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <img
        src={BANNER_IMG}
        alt=""
        className="block w-full h-auto select-none"
        draggable={false}
        style={{ filter: 'url(#wbBoardKey) saturate(1.25) contrast(1.12)' }}
      />
    </div>
  );
}