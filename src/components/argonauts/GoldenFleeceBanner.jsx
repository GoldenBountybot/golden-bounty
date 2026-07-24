import React from 'react';

const COIN_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/5e1ba97ff_file_000000008624820bb05d279226f89912.png';

// "YOU WON THE GOLDEN FLEECE BONUS GAME!" trigger banner — a golden-framed
// modal with a central cluster of gold coins, a glowing purple "Nx = ULTRA"
// central label, and a "TAP ANYWHERE TO CONTINUE" prompt. Clicking anywhere
// starts the coin hold-and-spin free spins.
export default function GoldenFleeceBanner({ count = 6, onStart }) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      onClick={onStart}
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(5px)', cursor: 'pointer' }}
    >
      <div
        className="relative rounded-[14px] px-8 py-10 text-center select-none"
        style={{
          border: '3px solid #EBC05F',
          boxShadow: '0 0 40px rgba(235,192,95,0.75), inset 0 0 24px rgba(235,192,95,0.18)',
          background:
            'radial-gradient(circle at 50% 18%, rgba(235,192,95,0.18), rgba(8,6,4,0.96) 70%)',
        }}
      >
        {/* Heading */}
        <h2
          className="font-black uppercase tracking-wide leading-tight"
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '1.35rem',
            background: 'linear-gradient(to bottom, #FFE9A8 0%, #EBC05F 50%, #C59A4D 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            WebkitTextStroke: '1px #5a3c0a',
            filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.95))',
          }}
        >
          You Won The Golden Fleece Bonus Game!
        </h2>

        {/* Coin cluster with central label */}
        <div className="relative my-6 flex items-center justify-center" style={{ minHeight: 150 }}>
          {/* radial glow behind coins */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(235,192,95,0.4), transparent 65%)',
              filter: 'blur(8px)',
            }}
          />
          {/* cluster of coins arranged in a ring */}
          <div className="relative" style={{ width: 200, height: 150 }}>
            {[
              { x: 20, y: 22, s: 52, r: -8 },
              { x: 78, y: 8, s: 60, r: 6 },
              { x: 138, y: 26, s: 54, r: 10 },
              { x: 42, y: 82, s: 56, r: 12 },
              { x: 112, y: 86, s: 58, r: -10 },
            ].map((c, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: c.x, top: c.y, width: c.s, height: c.s,
                  transform: `rotate(${c.r}deg)`,
                  border: '2px solid #EBC05F',
                  boxShadow: '0 0 14px rgba(235,192,95,0.85), inset 0 0 8px rgba(255,235,150,0.6)',
                  background: 'radial-gradient(circle at 35% 30%, #FFF7C0, #EBC05F 60%, #C59A4D)',
                  overflow: 'hidden',
                }}
              >
                <img src={COIN_IMG} alt="" draggable={false} className="w-full h-full object-cover" style={{ mixBlendMode: 'multiply', opacity: 0.9 }} />
              </div>
            ))}
          </div>

          {/* central glowing label */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            <span
              className="font-black leading-none"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '2.6rem',
                color: '#E1D5F3',
                textShadow:
                  '0 0 10px rgba(138,100,183,0.95), 0 0 18px rgba(138,100,183,0.7), 0 2px 3px #000, 0 -1px 0 #8A64B7, 0 1px 0 #fff',
                WebkitTextStroke: '1px #8A64B7',
              }}
            >
              {count}X
            </span>
            <span
              className="font-black tracking-[0.2em] leading-none mt-1"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '1.15rem',
                color: '#E1D5F3',
                textShadow: '0 0 10px rgba(138,100,183,0.95), 0 2px 3px #000, 0 -1px 0 #8A64B7',
                WebkitTextStroke: '0.5px #8A64B7',
              }}
            >
              = ULTRA
            </span>
          </div>
        </div>

        {/* Tap anywhere to continue */}
        <p
          className="font-bold uppercase tracking-[0.25em] text-white"
          style={{ fontSize: '0.7rem', textShadow: '0 1px 2px #000' }}
        >
          Tap Anywhere To Continue
        </p>
      </div>
    </div>
  );
}