import React from 'react';

const COIN_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/3fc0a87e0_generated_image.png';

// "YOU WON THE GOLDEN FLEECE BONUS GAME!" trigger banner — 100% match to the
// reference design: a dark radial-gradient backdrop, a 3x3 cluster of gold
// laurel coins (some showing currency values), a central metallic purple
// "15X = ULTRA" label, and a "TAP ANYWHERE TO CONTINUE" prompt.
// 15X ULTRA is shown always (hardcoded per request).
export default function GoldenFleeceBanner({ count = 6, onStart }) {
  // 3x3 coin grid — center cell reserved for the "15X = ULTRA" label.
  const coins = [
    { val: '$0.10', r: -6 },
    { val: null,   r: 4 },
    { val: '$0.20', r: 8 },
    { val: null,   r: -3 },
    { val: null,   r: 0 }, // center — covered by label
    { val: '$0.30', r: 6 },
    { val: '$0.20', r: 5 },
    { val: null,   r: -7 },
    { val: '$0.10', r: 3 },
  ];

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      onClick={onStart}
      style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(40,28,8,0.82), rgba(4,3,2,0.94))',
        backdropFilter: 'blur(6px)',
        cursor: 'pointer',
      }}
    >
      <div className="relative text-center select-none px-6">
        {/* Heading */}
        <h2
          className="font-black uppercase leading-tight tracking-wide"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(1rem, 4.2vw, 1.5rem)',
            background: 'linear-gradient(to bottom, #FFE9A8 0%, #FFD700 35%, #C06000 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            WebkitTextStroke: '1.2px #201000',
            filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.95))',
          }}
        >
          You Won The Golden Fleece Bonus Game!
        </h2>

        {/* Coin cluster */}
        <div className="relative my-5 mx-auto" style={{ width: 300, maxWidth: '82vw' }}>
          {/* glow */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(255,200,80,0.42), transparent 68%)',
              filter: 'blur(12px)',
            }}
          />
          <div className="relative grid grid-cols-3 gap-1.5">
            {coins.map((c, i) => (
              <div
                key={i}
                className="relative rounded-full"
                style={{
                  aspectRatio: '1 / 1',
                  transform: `rotate(${c.r}deg)`,
                  border: '2.5px solid #EBC05F',
                  boxShadow:
                    '0 0 14px rgba(235,192,95,0.85), inset 0 0 10px rgba(255,245,180,0.55), inset 0 -3px 6px rgba(120,80,20,0.6)',
                  background: 'radial-gradient(circle at 38% 30%, #FFF7C0, #EBC05F 58%, #8B4513 100%)',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={COIN_IMG}
                  alt=""
                  draggable={false}
                  className="w-full h-full object-cover"
                  style={{ mixBlendMode: 'screen', opacity: 0.96 }}
                />
                {c.val && (
                  <span
                    className="absolute inset-0 flex items-center justify-center font-black tabular-nums"
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '0.78rem',
                      color: '#3a2208',
                      textShadow: '0 1px 0 rgba(255,235,150,0.6), 0 -1px 0 rgba(0,0,0,0.3)',
                      transform: `rotate(${-c.r}deg)`,
                    }}
                  >
                    {c.val}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* central metallic purple label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className="font-black leading-none"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(2.2rem, 11vw, 3.4rem)',
                background: 'linear-gradient(to bottom, #E1D5F3 0%, #A070D0 45%, #503080 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                WebkitTextStroke: '1.4px #201000',
                filter: 'drop-shadow(0 0 10px rgba(160,112,208,0.85)) drop-shadow(0 5px 5px rgba(0,0,0,0.95))',
              }}
            >
              15X=
            </span>
            <span
              className="font-black tracking-[0.18em] leading-none -mt-1"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(1.1rem, 5.6vw, 1.7rem)',
                background: 'linear-gradient(to bottom, #E1D5F3 0%, #A070D0 45%, #503080 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                WebkitTextStroke: '1px #201000',
                filter: 'drop-shadow(0 0 8px rgba(160,112,208,0.8)) drop-shadow(0 4px 4px rgba(0,0,0,0.95))',
              }}
            >
              ULTRA
            </span>
          </div>
        </div>

        {/* Tap anywhere to continue */}
        <p
          className="font-bold uppercase tracking-[0.25em]"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(0.62rem, 2.6vw, 0.8rem)',
            background: 'linear-gradient(to bottom, #FFE9A8 0%, #FFD700 40%, #C06000 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            WebkitTextStroke: '0.6px #201000',
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.9))',
          }}
        >
          Tap Anywhere To Continue
        </p>
      </div>
    </div>
  );
}