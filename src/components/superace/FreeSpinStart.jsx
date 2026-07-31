import React from 'react';

const FREE_SPIN_BANNER = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/eb8a29b62_file_00000000cf3081f895784c4d5383afd4.png';

// Free-spin interstitial using the ornate "10 Free Spin" banner image.
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

      <div className="relative w-full max-w-xs flex flex-col items-center">
        {/* The ornate "10 Free Spin" banner image */}
        <img
          src={FREE_SPIN_BANNER}
          alt={`${spins} Free Spin`}
          className="w-full h-auto select-none"
          style={{
            filter: 'drop-shadow(0 0 22px rgba(245,197,66,0.55)) drop-shadow(0 6px 18px rgba(0,0,0,0.7))',
            animation: 'saWinPop 0.5s ease-out both',
          }}
          draggable={false}
        />

        <button
          onClick={onStart}
          className="mt-5 px-10 py-3 rounded-xl text-base font-black italic tracking-wider"
          style={{
            background: 'radial-gradient(circle at 50% 40%, #fff3c4, #f5c542 45%, #c8881e 88%)',
            border: '2px solid #fde68a',
            color: '#5a1010',
            boxShadow: '0 0 16px rgba(245,197,66,0.9), inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -3px 6px rgba(120,70,10,0.5)',
            fontFamily: 'Rye, Georgia, serif',
          }}
        >
          START
        </button>
      </div>
    </div>
  );
}