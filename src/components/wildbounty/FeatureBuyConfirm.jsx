import React from 'react';

// Confirmation modal shown when the player taps the Feature Buy banner.
// START awards 10 free spins; CANCEL returns to the board.
export default function FeatureBuyConfirm({ cost, onStart, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)' }}
    >
      <div className="relative w-full max-w-md">
        {/* Torn-edge parchment panel */}
        <div
          className="relative rounded-[14px] px-6 py-8 flex flex-col items-center gap-4"
          style={{
            background:
              'radial-gradient(ellipse at 50% 30%, #ecd7b0 0%, #dcc5a1 55%, #c4a87e 100%)',
            boxShadow:
              '0 0 0 3px #6e4413, 0 0 0 6px rgba(200,150,60,0.55), 0 22px 60px rgba(0,0,0,0.85), inset 0 0 40px rgba(110,68,19,0.18)',
            filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.6))',
          }}
        >
          {/* Corner studs */}
          <span className="absolute top-2 left-2 w-3 h-3 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(255,210,100,0.9)]" />
          <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(255,210,100,0.9)]" />
          <span className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(255,210,100,0.9)]" />
          <span className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-amber-200 shadow-[0_0_6px_rgba(255,210,100,0.9)]" />

          {/* Heading */}
          <h2
            className="text-3xl font-black italic tracking-[0.18em]"
            style={{
              fontFamily: 'Rye, Georgia, serif',
              color: '#dcc668',
              WebkitTextStroke: '1.4px #3a2410',
              textShadow:
                '0 1px 0 rgba(255,250,210,0.6), 0 2px 1px rgba(0,0,0,0.5), 0 3px 3px rgba(0,0,0,0.45)',
            }}
          >
            FEATURE BUY
          </h2>

          {/* Cost signpost */}
          <div
            className="w-full max-w-[260px] rounded-md px-5 py-3 flex flex-col items-center gap-1"
            style={{
              backgroundImage:
                'linear-gradient(rgba(40,26,14,0.35), rgba(30,20,10,0.5)), url(https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow:
                '0 0 0 2px #5a3a18, 0 0 0 4px rgba(200,150,60,0.5), 0 8px 18px rgba(0,0,0,0.6)',
            }}
          >
            <span
              className="text-xs font-bold italic tracking-[0.35em] text-amber-200/90"
              style={{ fontFamily: 'Rye, Georgia, serif' }}
            >
              COST
            </span>
            <span
              className="text-4xl font-black italic leading-none"
              style={{
                fontFamily: 'Rye, Georgia, serif',
                color: '#dcc668',
                WebkitTextStroke: '1.2px #2a1a08',
                textShadow:
                  '0 1px 0 rgba(255,250,210,0.6), 0 2px 1px rgba(0,0,0,0.55), 0 3px 3px rgba(0,0,0,0.5)',
              }}
            >
              {cost.toFixed(2)}
            </span>
          </div>

          {/* Instruction text */}
          <p
            className="text-center text-[11px] font-semibold tracking-[0.12em] text-[#4a2f1a] uppercase"
            style={{ fontFamily: 'Smokum, Rye, Georgia, serif' }}
          >
            Select “Start” to trigger the free spins feature at the current bet size &amp; bet level
          </p>

          {/* Buttons */}
          <div className="flex items-stretch justify-center gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 rounded-md py-3 text-lg font-black italic tracking-[0.2em] active:scale-95 transition-transform"
              style={{
                fontFamily: 'Rye, Georgia, serif',
                color: '#dcc668',
                WebkitTextStroke: '0.8px #2a1a08',
                textShadow: '0 1px 1px rgba(0,0,0,0.5)',
                background: 'linear-gradient(180deg, #6e4413 0%, #4a2c12 55%, #3a200d 100%)',
                border: '2px solid rgba(255,220,150,0.55)',
                boxShadow:
                  'inset 0 2px 4px rgba(255,210,120,0.25), inset 0 -3px 6px rgba(0,0,0,0.5), 0 5px 12px rgba(0,0,0,0.55)',
              }}
            >
              CANCEL
            </button>
            <button
              onClick={onStart}
              className="flex-1 rounded-md py-3 text-lg font-black italic tracking-[0.2em] active:scale-95 transition-transform"
              style={{
                fontFamily: 'Rye, Georgia, serif',
                color: '#2a1a08',
                background: 'linear-gradient(180deg, #f5d36a 0%, #e0a93a 45%, #b97718 100%)',
                border: '2px solid rgba(255,235,160,0.85)',
                boxShadow:
                  'inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -3px 6px rgba(80,50,15,0.6), 0 0 16px rgba(255,200,80,0.5), 0 5px 12px rgba(0,0,0,0.55)',
                textShadow: '0 1px 1px rgba(255,255,255,0.35)',
              }}
            >
              START
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}