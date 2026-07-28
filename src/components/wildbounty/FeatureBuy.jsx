import React from 'react';

// "FEATURE BUY" metal plaque — placed flush against the bottom-right inner
// edge of the reel board frame, scaled small. Pure CSS: dark wood plaque,
// steel wavy frame, raised gold text with bevel + drop shadow.
export default function FeatureBuy({ className = '' }) {
  return (
    <button
      type="button"
      className={`absolute z-30 pointer-events-auto ${className}`}
      style={{
        right: '1.5%',
        bottom: '1.5%',
        width: '18%',
        minWidth: 54,
        maxWidth: 96,
      }}
    >
      {/* Outer steel frame */}
      <div
        className="relative w-full rounded-[10px] p-[3px]"
        style={{
          background:
            'linear-gradient(180deg,#cfcfcf 0%,#9a9a9a 22%,#6e6e6e 52%,#505050 78%,#8a8a8a 100%)',
          boxShadow:
            '0 2px 4px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.5)',
        }}
      >
        {/* Inner wood plaque */}
        <div
          className="relative rounded-[7px] flex flex-col items-center justify-center leading-none"
          style={{
            padding: '6% 4%',
            background:
              'linear-gradient(180deg,#4b2c1f 0%,#3a2114 50%,#2a170c 100%)',
            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(120,80,40,0.3)',
          }}
        >
          {/* Side rivets */}
          <span
            className="absolute rounded-full"
            style={{
              left: '7%', top: '50%', width: 4, height: 4,
              transform: 'translateY(-50%)',
              background: 'radial-gradient(circle at 30% 30%,#e8e8e8,#7a7a7a 60%,#3a3a3a)',
              boxShadow: '0 1px 1px rgba(0,0,0,0.7)',
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              right: '7%', top: '50%', width: 4, height: 4,
              transform: 'translateY(-50%)',
              background: 'radial-gradient(circle at 30% 30%,#e8e8e8,#7a7a7a 60%,#3a3a3a)',
              boxShadow: '0 1px 1px rgba(0,0,0,0.7)',
            }}
          />

          {/* FEATURE */}
          <span
            style={{
              fontFamily: 'Rye, Georgia, serif',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: 'clamp(7px, 1.9vw, 11px)',
              lineHeight: 1,
              color: 'transparent',
              background: 'linear-gradient(180deg,#fff6c0 0%,#fad02e 30%,#d49a1f 62%,#8a6112 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              WebkitTextStroke: '0.5px rgba(80,52,16,0.9)',
              textShadow:
                '0 1px 0 rgba(255,246,160,0.95),' +
                '0 -1px 0 rgba(70,46,14,0.95),' +
                '0 2px 2px rgba(0,0,0,0.85)',
              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.7))',
              letterSpacing: '0.04em',
            }}
          >
            FEATURE
          </span>
          {/* BUY */}
          <span
            style={{
              fontFamily: 'Rye, Georgia, serif',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: 'clamp(9px, 2.4vw, 15px)',
              lineHeight: 1,
              marginTop: '2px',
              color: 'transparent',
              background: 'linear-gradient(180deg,#fff6c0 0%,#fad02e 30%,#d49a1f 62%,#8a6112 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              WebkitTextStroke: '0.5px rgba(80,52,16,0.9)',
              textShadow:
                '0 1px 0 rgba(255,246,160,0.95),' +
                '0 -1px 0 rgba(70,46,14,0.95),' +
                '0 2px 2px rgba(0,0,0,0.85)',
              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.7))',
              letterSpacing: '0.06em',
            }}
          >
            BUY
          </span>
        </div>
      </div>
    </button>
  );
}