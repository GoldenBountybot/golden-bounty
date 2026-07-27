import React from 'react';

// Decorative western "steer skull + wooden sign" banner mounted on top of
// the reel board. The source asset ships on a solid black background, and
// every blend/alpha approach left a visible dark halo around the art.
// Instead we render it OPAQUE inside a gold-framed dark plaque: the image's
// black background simply becomes the plaque's face, so there is no
// transparency, no blend, and no halo/shadow — only the gold + wood art
// shows through clearly.
const BANNER_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/4ac18429a_file_000000006e6481fa9ba283c788d4cc07.png';

export default function BoardTopBanner({ className = '' }) {
  return (
    <div
      className={`relative w-full mx-auto overflow-hidden ${className}`}
      style={{
        background: '#0a0805',
        border: '2px solid #b8902e',
        boxShadow:
          'inset 0 0 0 1px #6b4f1c, inset 0 0 18px rgba(0,0,0,0.9), 0 6px 20px rgba(0,0,0,0.7)',
        borderRadius: '8px',
      }}
    >
      <img
        src={BANNER_IMG}
        alt=""
        className="block w-full h-auto select-none"
        draggable={false}
        style={{ filter: 'contrast(1.3) saturate(1.45) brightness(1.08)' }}
      />
    </div>
  );
}