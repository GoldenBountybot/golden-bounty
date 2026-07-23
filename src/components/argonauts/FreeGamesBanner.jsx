import React from 'react';

// The "8 FREE GAMES!" feature-trigger banner — a 3D metallic gold-to-red "8",
// bold "FREE GAMES!" headline and the "+ THE HIGHEST PAYING SYMBOLS" subtitle,
// centered over a darkened, blurred backdrop (the reels remain faintly visible).
export default function FreeGamesBanner({ count = 8, onStart }) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,5,0.8)', backdropFilter: 'blur(3px)' }}
    >
      <div className="text-center px-6">
        {/* Large 3D metallic number */}
        <div
          className="font-black leading-none select-none"
          style={{
            fontSize: '7rem',
            fontFamily: 'Georgia, serif',
            background: 'linear-gradient(to bottom, #FFF7B0 0%, #FFD700 28%, #FF8C00 62%, #FF4500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            WebkitTextStroke: '2px #6b2d00',
            filter: 'drop-shadow(0 5px 7px rgba(0,0,0,0.85))',
          }}
        >
          {count}
        </div>

        {/* FREE GAMES! */}
        <h2
          className="font-black tracking-wider -mt-1"
          style={{
            fontSize: '2.4rem',
            fontFamily: 'Georgia, serif',
            background: 'linear-gradient(to bottom, #FFEC8B, #FFD700 50%, #FF8C00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            WebkitTextStroke: '1px #4a2400',
            filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.9))',
          }}
        >
          FREE GAMES!
        </h2>

        {/* subtitle */}
        <p
          className="mt-2 font-bold uppercase tracking-[0.18em]"
          style={{ fontSize: '0.78rem', color: '#FFE9A8', textShadow: '0 1px 3px #000' }}
        >
          + THE HIGHEST PAYING SYMBOLS
        </p>

        <button
          onClick={onStart}
          className="mt-7 px-9 py-3 rounded-[10px] font-black tracking-wider transition-all active:scale-95"
          style={{
            fontFamily: 'Georgia, serif',
            border: '2px solid rgba(245,215,122,0.9)',
            background: 'linear-gradient(to bottom,#f5c542,#c8881e)',
            color: '#2a1a06',
            boxShadow: '0 0 18px rgba(255,215,0,0.5)',
          }}
        >
          START
        </button>
      </div>
    </div>
  );
}