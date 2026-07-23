import React from 'react';

const SPLASH_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/b1a2d7d3e_file_000000009ef4820baac5161c2e45158b.png';

// Full-screen splash shown while the app boots. Covers the whole screen with
// the branded image and centers a "loading" label on top.
export default function AppLoadingImage() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-950 overflow-hidden">
      <img
        src={SPLASH_IMG}
        alt=""
        className="absolute inset-0 w-full h-full object-cover select-none"
        draggable={false}
      />
      {/* subtle darkening so the text stays readable */}
      <div className="absolute inset-0 bg-black/25" />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <span
          className="text-2xl sm:text-3xl tracking-[0.35em] uppercase text-amber-100 italic"
          style={{ fontFamily: 'Rye, Georgia, serif', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
        >
          Loading
        </span>
        <span className="w-8 h-8 rounded-full border-2 border-amber-300/40 border-t-amber-200 animate-spin" />
      </div>
    </div>
  );
}