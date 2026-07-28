import React from 'react';

// Western-wood full-screen banner shown before a free-spins session begins.
// Big number → FREE SPINS → X8 multiplier description → START button flanked
// by crossed golden revolvers. A hidden, fully-transparent button sits
// directly beneath START and also starts the free spins (enlarged tap area).
// The Feature Buy flow keeps its own separate banner — this is only for the
// scatter-awarded free-spins start.
const REVOLVER =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/1d7f9ad2f_file_00000000936c81fa8c6b61333fddd167.png';

export default function FreeSpinStart({ count, onStart }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{
        background:
          'radial-gradient(ellipse at center, rgba(150,95,40,0.5) 0%, rgba(60,32,12,0.78) 55%, rgba(12,7,3,0.92) 100%)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div className="relative flex flex-col items-center w-full max-w-md select-none">
        {/* Big number — golden gradient, dark brown outline, glow */}
        <div
          style={{
            fontFamily: 'Rye, Georgia, serif',
            fontSize: 'clamp(5rem, 22vw, 9rem)',
            fontWeight: 900,
            lineHeight: 1,
            background:
              'linear-gradient(180deg, #FFF7C0 0%, #FFE57A 25%, #FFD24A 45%, #D4AF37 70%, #8C6A1E 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextStroke: '2px #4A3019',
            filter:
              'drop-shadow(0 4px 10px rgba(255,180,40,0.85)) drop-shadow(0 0 24px rgba(255,210,90,0.6))',
          }}
        >
          {count}
        </div>

        {/* FREE SPINS — wood-grain gradient slab-serif, dark outline */}
        <div
          style={{
            fontFamily: 'Rye, Georgia, serif',
            fontSize: 'clamp(2rem, 8vw, 3rem)',
            fontWeight: 900,
            letterSpacing: '0.08em',
            marginTop: '-0.5rem',
            background:
              'linear-gradient(180deg, #6B4A1E 0%, #8B5A2B 30%, #C18840 55%, #8B5A2B 80%, #5A3A18 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextStroke: '1.5px #2A1808',
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))',
          }}
        >
          FREE SPINS
        </div>

        {/* Description — white sans-serif, thin dark outline */}
        <div
          className="text-center mt-4 leading-snug"
          style={{
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSize: 'clamp(0.8rem, 2.6vw, 1rem)',
            fontWeight: 600,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.95), 0 0 1px rgba(0,0,0,0.9)',
          }}
        >
          <div>EVERY FREE SPIN STARTS</div>
          <div>WITH X8 MULTIPLIER!</div>
          <div>MULTIPLIER DOUBLES AFTER EVERY WIN!</div>
        </div>

        {/* START button — beveled wooden sign with crossed golden revolvers */}
        <div
          className="relative mt-7 flex items-center justify-center"
          style={{ width: '70%', maxWidth: 280 }}
        >
          {/* Crossed revolvers behind the button */}
          <img
            src={REVOLVER}
            alt=""
            draggable={false}
            className="absolute pointer-events-none"
            style={{
              left: '50%', top: '50%',
              width: '160%',
              transform: 'translate(-50%,-50%) rotate(-32deg)',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6)) brightness(1.15) saturate(1.2)',
              zIndex: 0,
            }}
          />
          <img
            src={REVOLVER}
            alt=""
            draggable={false}
            className="absolute pointer-events-none"
            style={{
              left: '50%', top: '50%',
              width: '160%',
              transform: 'translate(-50%,-50%) rotate(32deg) scaleX(-1)',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6)) brightness(1.15) saturate(1.2)',
              zIndex: 0,
            }}
          />

          {/* Gold beveled frame (outer) */}
          <div
            className="relative w-full transition-transform active:scale-95"
            style={{
              zIndex: 2,
              clipPath: 'polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%)',
              background: 'linear-gradient(180deg, #F5D36A 0%, #E0A93A 50%, #B97718 100%)',
              padding: 3,
              boxShadow: '0 6px 16px rgba(0,0,0,0.7), 0 0 18px rgba(255,200,80,0.4)',
            }}
          >
            {/* Wood sign (inner) */}
            <button
              onClick={onStart}
              className="w-full"
              style={{
                fontFamily: 'Rye, Georgia, serif',
                fontSize: 'clamp(1.5rem, 6vw, 2.1rem)',
                fontWeight: 900,
                letterSpacing: '0.2em',
                color: '#FFE9A0',
                background: 'linear-gradient(180deg, #9B5A22 0%, #7A4318 50%, #5C3015 100%)',
                padding: '0.5rem 2rem',
                clipPath: 'polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%)',
                textShadow: '0 2px 2px rgba(60,30,8,0.9), 0 0 10px rgba(255,210,90,0.6)',
              }}
            >
              START
            </button>
          </div>
        </div>

        {/* Hidden button directly beneath START — invisible, also starts
            the free spins (enlarged tap target / secret trigger). */}
        <button
          onClick={onStart}
          aria-label="start free spins"
          tabIndex={-1}
          style={{
            width: '70%',
            maxWidth: 280,
            marginTop: '0.4rem',
            height: 26,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            opacity: 0,
          }}
        />
      </div>
    </div>
  );
}