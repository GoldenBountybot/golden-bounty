import React from 'react';

// Premium western-wood full-screen banner shown when free spins are awarded.
export default function FreeSpinStart({ count, onStart }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(40,26,12,0.82) 0%, rgba(8,5,2,0.94) 70%, rgba(0,0,0,0.97) 100%)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div className="relative w-full max-w-lg">
        {/* Outer gold-trim wooden frame */}
        <div
          className="relative rounded-2xl p-[6px]"
          style={{
            background: 'linear-gradient(145deg, #e6b94e, #6e4413 35%, #c8932e 65%, #4e320f)',
            boxShadow: '0 0 0 3px #2a1a08, 0 0 0 6px rgba(200,150,60,0.5), 0 22px 60px rgba(0,0,0,0.85)',
          }}
        >
          {/* Corner studs */}
          <span className="absolute top-2 left-2 w-3 h-3 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(255,210,100,0.9)]" />
          <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(255,210,100,0.9)]" />
          <span className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(255,210,100,0.9)]" />
          <span className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(255,210,100,0.9)]" />

          {/* Inner wood panel */}
          <div
            className="rounded-[13px] flex flex-col items-center gap-5 px-8 py-12 relative overflow-hidden"
            style={{
              backgroundImage:
                'linear-gradient(rgba(28,18,9,0.6), rgba(18,12,6,0.7)), url(https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=900&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Top flourish */}
            <span className="text-amber-300/80 text-2xl tracking-[0.4em]" style={{ fontFamily: 'Rye, Georgia, serif' }}>✦ ✦ ✦</span>

            <span
              className="text-2xl font-bold italic tracking-[0.35em] text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
              style={{ fontFamily: 'Rye, Georgia, serif' }}
            >
              FREE SPINS
            </span>

            {/* Count medallion */}
            <div className="relative my-1">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 150,
                  height: 150,
                  background: 'radial-gradient(circle at 35% 30%, #3a2a14, #120a04 75%)',
                  boxShadow: '0 0 0 3px rgba(200,150,60,0.8), 0 0 0 7px rgba(40,26,10,0.9), 0 0 24px rgba(255,200,80,0.45)',
                }}
              >
                <span
                  className="text-7xl font-black italic text-yellow-300 drop-shadow-[0_0_14px_rgba(255,200,0,0.85)]"
                  style={{ fontFamily: 'Rye, Georgia, serif' }}
                >
                  {count}
                </span>
              </div>
              <span className="absolute -bottom-2 inset-x-0 text-center text-[10px] font-bold italic tracking-[0.3em] text-amber-200/80" style={{ fontFamily: 'Rye, Georgia, serif' }}>
                SPINS AWARDED
              </span>
            </div>

            <p
              className="text-amber-100/90 text-center text-sm italic tracking-[0.15em]"
              style={{ fontFamily: 'Smokum, Rye, Georgia, serif' }}
            >
              Round up yer bounty — the showdown begins!
            </p>

            {/* Start button — engraved gold medallion */}
            <button
              onClick={onStart}
              className="mt-2 rounded-full px-14 py-3 text-2xl font-black italic tracking-[0.25em] active:scale-95 transition-transform"
              style={{
                fontFamily: 'Rye, Georgia, serif',
                color: '#2a1a08',
                background: 'linear-gradient(to bottom, #f5d36a 0%, #e0a93a 45%, #b97718 100%)',
                border: '2px solid rgba(255,235,160,0.85)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -3px 6px rgba(80,50,15,0.6), 0 0 18px rgba(255,200,80,0.55), 0 6px 14px rgba(0,0,0,0.6)',
                textShadow: '0 1px 1px rgba(255,255,255,0.35)',
              }}
            >
              START
            </button>

            <span className="text-amber-300/80 text-2xl tracking-[0.4em]" style={{ fontFamily: 'Rye, Georgia, serif' }}>✦ ✦ ✦</span>
          </div>
        </div>
      </div>
    </div>
  );
}