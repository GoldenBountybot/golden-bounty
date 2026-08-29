import React from 'react';

const FREE_SPIN_BANNER = 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/eb8a29b62_file_00000000cf3081f895784c4d5383afd4.png';

// Free-spin interstitial using the ornate "10 Free Spin" banner image.
// Tapping the banner itself starts the free spins — no separate button.
export default function FreeSpinStart({ spins = 10, onStart }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(circle at 50% 40%, rgba(20,40,60,0.5), rgba(4,8,18,0.94))' }}
    >
      {/* soft golden burst behind the banner */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(245,197,66,0.4), transparent 55%)' }}
      />

      <button
        onClick={onStart}
        className="relative w-full max-w-xs flex flex-col items-center outline-none"
        aria-label="Start Free Spins"
      >
        {/* The ornate "10 Free Spin" banner image */}
        <img
          src={FREE_SPIN_BANNER}
          alt={`${spins} Free Spin`}
          className="w-full h-auto select-none cursor-pointer transition-transform active:scale-95"
          style={{
            filter: 'drop-shadow(0 0 22px rgba(245,197,66,0.55)) drop-shadow(0 6px 18px rgba(0,0,0,0.7))',
            animation: 'saWinPop 0.5s ease-out both',
          }}
          draggable={false}
        />
      </button>
    </div>
  );
}