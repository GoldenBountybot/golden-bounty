import React from 'react';

// The premium western backdrop image shared across Dashboard, Withdraw,
// PayMethod (deposit) and Profile pages — sourced from the Plinko Drop game.
const BG_IMAGE = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/0dafcc686_.jpg';

export default function WesternBackdrop({ opacity = 0.16 }) {
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