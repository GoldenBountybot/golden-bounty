import React from 'react';

// Wooden ways plaque — the board image is cropped via CSS background zoom so
// only the board itself shows, with the "Win up to 3600 Ways" label overlaid.
export default function WaysPlaque({ className = '' }) {
  return (
    <div
      className={`relative rounded-md flex items-center justify-center ${className}`}
      style={{
        backgroundImage:
          'url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/29dd63df7_InShot_20260715_212836820.jpg)',
        backgroundSize: '240%',
        backgroundPosition: 'center 42%',
        backgroundRepeat: 'no-repeat',
        aspectRatio: '5 / 1',
        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
      }}
    >
      <span
        className="relative z-10 text-center px-3 text-[10px] sm:text-xs font-black italic tracking-[0.12em] uppercase whitespace-nowrap text-amber-200"
        style={{
          fontFamily: 'Georgia, serif',
          textShadow: '0 1px 2px rgba(0,0,0,0.85), 0 0 6px rgba(255,200,80,0.35)',
        }}
      >
        Win up to 3600 Ways
      </span>
    </div>
  );
}