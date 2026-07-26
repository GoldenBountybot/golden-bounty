import React from 'react';

// Ornate gold frame (pure-black interior) generated to match the reel board.
// mix-blend-mode: screen drops the black interior so the reels show through,
// leaving the polished gold border + gems visible around the board.
const FRAME_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/2a36531b0_generated_image.png';

export default function GatesFrame({ inset = 14 }) {
  return (
    <img
      src={FRAME_URL}
      alt=""
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        top: `-${inset}%`,
        left: `-${inset}%`,
        width: `${100 + inset * 2}%`,
        height: `${100 + inset * 2}%`,
        objectFit: 'fill',
        mixBlendMode: 'screen',
        zIndex: 60,
      }}
    />
  );
}