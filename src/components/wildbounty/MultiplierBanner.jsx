import React from 'react';

// Bull-skull + wooden banner image acts as the multiplier banner backdrop.
const BANNER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/471a90f2c_file_000000006e6481fa9ba283c788d4cc07.png';

export default function MultiplierBanner() {
  return (
    <div className="relative w-full mx-auto">
      {/* Luminance-key SVG filter: turns luminance into alpha so the black
          background becomes fully transparent while the colored art keeps
          its own RGB. The -0.08 bias clips near-black pixels to zero alpha. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <filter id="wbLumaKey" colorInterpolationFilters="sRGB">
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
        alt="Multiplier banner"
        className="w-full h-auto block select-none"
        draggable={false}
        style={{
          filter: 'url(#wbLumaKey) saturate(1.25) contrast(1.15)',
        }}
      />
    </div>
  );
}