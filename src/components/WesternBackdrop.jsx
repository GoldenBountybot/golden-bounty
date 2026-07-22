import React from 'react';

// Subtle ambient backdrop for minimal premium pages.
const BG_IMAGE = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/0dafcc686_.jpg';

export default function WesternBackdrop({ opacity = 0.08 }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `url('${BG_IMAGE}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity,
        mixBlendMode: 'screen',
      }}
    />
  );
}