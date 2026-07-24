import React from 'react';

const BANNER = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/2aad0232d_file_00000000092c81faa3ee3d2dae21cb97.png';

// The "8 FREE GAMES!" feature-trigger banner. Shown when 3+ scatter ships
// land during the base game. The whole banner is clickable to start the free
// spins. During an existing free-spin session the banner is skipped and the
// awarded spins are simply added (handled in useArgonauts).
// Uses screen blend mode so the image's dark background drops out and the
// game backdrop remains visible behind it.
export default function FreeGamesBanner({ count = 8, onStart }) {
  return (
    <div
      onClick={onStart}
      className="absolute inset-0 z-40 flex items-center justify-center cursor-pointer"
    >
      <div
        className="relative w-full h-full transition-transform active:scale-95"
        style={{ mixBlendMode: 'screen' }}
      >
        <img
          src={BANNER}
          alt={`${count} Free Games`}
          draggable={false}
          className="w-full h-full object-contain select-none"
          style={{ filter: 'drop-shadow(0 0 22px rgba(255,180,40,0.55))' }}
        />
      </div>
    </div>
  );
}