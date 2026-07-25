import React from 'react';

// Two AI-generated premium western wooden frames. The frame image is painted
// on its own absolutely-positioned layer and run through an SVG luminance
// filter that drops BOTH pure-black and pure-white backgrounds to transparent
// (mid-tone wood + gold stay fully opaque), so the frame floats cleanly over
// the casino background. Text/content sit on a separate relative layer above,
// so they are never touched by the filter.

export const FRAME_MSG_URL =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/314303958_generated_image.png';
export const FRAME_BTN_URL =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/0591f9662_generated_image.png';

// Luminance → alpha table: frames are generated on a solid WHITE background,
// so we drop only near-white (lum → 1) to transparent and keep the dark wood,
// gold trim, and dark interior fully opaque.
const FILTER_SVG = (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
    <filter id="wfDropBg" colorInterpolationFilters="sRGB">
      {/* alpha = 3 - R - G - B  → pure/near-white → ~0, gold & wood → high */}
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 -1 -1 0 3" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0 0 1 1" />
      </feComponentTransfer>
    </filter>
  </svg>
);

export default function WoodFrame({ variant = 'msg', className = '', style, children }) {
  const img = variant === 'btn' ? FRAME_BTN_URL : FRAME_MSG_URL;
  const pad = variant === 'btn' ? '24px 28px' : '12px 28px';
  return (
    <div className={`relative ${className}`} style={style}>
      {FILTER_SVG}
      {/* Frame layer — stretched to fill, background dropped via luminance filter */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${img})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          filter: 'url(#wfDropBg)',
          borderRadius: 6,
        }}
      />
      {/* Content layer — sits above the frame, unfiltered */}
      <div className="relative" style={{ padding: pad }}>
        {children}
      </div>
    </div>
  );
}