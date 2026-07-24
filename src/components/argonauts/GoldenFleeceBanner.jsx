import React from 'react';

// Full-scene background (street at night, ornate gold frame, coin cluster,
// light burst) generated to match the reference 100%.
const BANNER_BG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/2921f28f1_generated_image.png';

// "YOU WON THE GOLDEN FLEECE BONUS GAME!" trigger banner — 100% match to the
// reference: the generated ornate gold-framed coin scene as background, with a
// metallic gold header, a metallic purple "15X= ULTRA" central label, and a
// dark maroon ribbon footer "TAP ANYWHERE TO CONTINUE". 15X ULTRA is shown
// always (hardcoded per request). Tapping anywhere starts the coin spins.
export default function GoldenFleeceBanner({ count = 6, onStart }) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      onClick={onStart}
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(3px)', cursor: 'pointer' }}
    >
      <div className="relative text-center select-none" style={{ width: 'min(96vw, 420px)' }}>
        {/* Full-scene background */}
        <img
          src={BANNER_BG}
          alt="Golden Fleece Bonus"
          draggable={false}
          className="w-full h-auto rounded-[14px]"
          style={{ filter: 'drop-shadow(0 8px 22px rgba(0,0,0,0.85))' }}
        />

        {/* Text overlays */}
        <div className="absolute inset-0 flex flex-col items-center justify-between py-[7%] px-[10%] pointer-events-none">
          {/* Header */}
          <h2
            className="font-black uppercase leading-tight tracking-wide w-full text-center"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(0.78rem, 4.4vw, 1.15rem)',
              background: 'linear-gradient(to bottom, #FFEFD5 0%, #FFD700 35%, #B8860B 75%, #5C4033 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              WebkitTextStroke: '1px #1A1110',
              filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.95))',
            }}
          >
            You Won The Golden Fleece Bonus Game!
          </h2>

          {/* Central 15X= ULTRA */}
          <div className="flex flex-col items-center justify-center">
            <span
              className="font-black leading-none"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(2.6rem, 15vw, 4.6rem)',
                background: 'linear-gradient(to bottom, #E1D5F3 0%, #9370DB 45%, #6A0DAD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                WebkitTextStroke: '1.6px #1A1110',
                filter:
                  'drop-shadow(0 0 12px rgba(147,112,219,0.9)) drop-shadow(0 6px 6px rgba(0,0,0,0.95))',
              }}
            >
              15X=
            </span>
            <span
              className="font-black tracking-[0.16em] leading-none -mt-1"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(1.4rem, 7.2vw, 2.3rem)',
                background: 'linear-gradient(to bottom, #E1D5F3 0%, #9370DB 45%, #6A0DAD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                WebkitTextStroke: '1.2px #1A1110',
                filter:
                  'drop-shadow(0 0 10px rgba(147,112,219,0.85)) drop-shadow(0 5px 5px rgba(0,0,0,0.95))',
              }}
            >
              ULTRA
            </span>
          </div>

          {/* Footer ribbon */}
          <div
            className="w-full rounded-[6px] py-1.5"
            style={{
              border: '2px solid #FFD700',
              boxShadow: 'inset 0 0 0 1px #B8860B, 0 2px 6px rgba(0,0,0,0.6)',
              background: 'linear-gradient(to bottom, #2a1410, #1A1110)',
            }}
          >
            <p
              className="font-bold uppercase tracking-[0.22em] text-center"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(0.6rem, 3vw, 0.82rem)',
                color: '#FFEFD5',
                textShadow: '0 0 8px rgba(255,215,0,0.6), 0 1px 2px #000',
              }}
            >
              Tap Anywhere To Continue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}