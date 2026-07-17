import React, { useMemo } from 'react';
import { SYMBOLS } from './symbols';

// Stable bullet-hole positions for one tile instance (1-3 holes).
function useBulletHoles() {
  return useMemo(() => {
    const count = 1 + Math.floor(Math.random() * 3);
    const holes = [];
    for (let i = 0; i < count; i++) {
      holes.push({
        x: 18 + Math.random() * 64,
        y: 18 + Math.random() * 64,
        rot: Math.random() * 360,
        size: 6 + Math.random() * 4,
      });
    }
    return holes;
  }, []);
}

const IMG = {
  bandit:   'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/2a455767e_InShot_20260717_092730019.jpg',
  revolver: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/3917d133d_InShot_20260717_093241860.jpg',
  whiskey:  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/63b66e73a_InShot_20260717_093625593.jpg',
  hat:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/27c3d09f2_InShot_20260717_094048229.jpg',
  scatter:  'https://media.base44.com/images/public/6a564d2f376adbca6a03de48/f5447a4d1_generated_image.png',
  wild:     'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/abaafa9c8_24e9525e1_generated_image.png',
  A: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/71ae07f99_42eef6374_generated_image1.png',
  K: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9f6abc15f_InShot_20260717_092231198.jpg',
  Q: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/44d282e5e_InShot_20260717_091838072.jpg',
  J: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f0565805f_fef0aca4e_generated_image1.png',
};

// Card letters styled like worn wooden tiles
const CARD_STYLE = {
  A: { bg: 'from-yellow-600 to-amber-800', text: 'text-yellow-50' },
  K: { bg: 'from-red-600 to-red-900', text: 'text-red-50' },
  Q: { bg: 'from-green-600 to-green-900', text: 'text-green-50' },
  J: { bg: 'from-blue-600 to-blue-900', text: 'text-blue-50' },
};

export default function SymbolTile({ symbolId, highlighted, goldFramed, shattering, scatterBeam, bulletHit, slow = 1 }) {
  const isCard = ['A', 'K', 'Q', 'J'].includes(symbolId);
  const img = IMG[symbolId];
  const isSpecial = symbolId === 'scatter' || symbolId === 'wild';
  const holes = useBulletHoles();
  const showHoles = (highlighted || bulletHit) && !shattering && !isSpecial;

  return (
    <div
      className={`relative overflow-hidden transition-transform
        ${highlighted && !shattering ? 'z-10 scale-[1.18] ring-2 ring-yellow-300' : ''}`}
      style={{ aspectRatio: '1 / 1', animation: shattering ? `shatterWin ${(0.6 * slow).toFixed(2)}s ease-out forwards` : undefined, zIndex: shattering ? 20 : (highlighted && !shattering ? 10 : undefined), filter: highlighted && !shattering ? 'brightness(1.8) sepia(0.4) saturate(1.8) hue-rotate(-5deg) drop-shadow(0 0 12px rgba(255,200,0,1))' : undefined }}
    >
      {img ? (
        <img
          src={img}
          alt={symbolId}
          loading="lazy"
          className={`w-full h-full object-cover ${isSpecial ? 'scale-[1.5]' : ''}`}
        />
      ) : isCard ? (
        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-b ${CARD_STYLE[symbolId].bg}`}>
          <span className={`text-4xl font-black italic ${CARD_STYLE[symbolId].text} drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]`} style={{ fontFamily: 'Rye, Georgia, serif' }}>
            {symbolId}
          </span>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-stone-800">
          <span className="text-3xl">?</span>
        </div>
      )}

      {/* Subtle golden beam on landed wild & scatter */}
      {(symbolId === 'scatter' || symbolId === 'wild') && scatterBeam && (
        <span
          className="absolute inset-x-2 pointer-events-none z-30"
          style={{
            top: '-18%',
            bottom: '-18%',
            background:
              'linear-gradient(to bottom, rgba(255,215,0,0) 0%, rgba(255,215,0,0.4) 35%, rgba(255,240,180,0.55) 50%, rgba(255,215,0,0.4) 65%, rgba(255,215,0,0) 100%)',
            filter: 'blur(3px)',
            boxShadow: '0 0 14px rgba(255,200,80,0.7)',
          }}
        />
      )}

      {/* Special label (WILD text is part of the wild badge image) */}
      {symbolId === 'scatter' && (
        <span className="absolute bottom-0 inset-x-0 text-[7px] font-bold text-center text-amber-950 bg-amber-200/90 py-px tracking-wider">
          {SYMBOLS[symbolId].label}
        </span>
      )}

      {/* Golden glow tint before blast */}
      {highlighted && !shattering && (
        <span className="absolute inset-0 bg-gradient-to-br from-yellow-300/60 via-amber-400/30 to-yellow-300/60 mix-blend-overlay pointer-events-none" />
      )}

      {/* Bullet holes — looks like the symbol was shot before it shatters */}
      {showHoles && holes.map((h, i) => (
        <span
          key={i}
          className="absolute pointer-events-none z-30"
          style={{
            left: `${h.x}%`,
            top: `${h.y}%`,
            width: `${h.size}px`,
            height: `${h.size}px`,
            transform: `translate(-50%, -50%) rotate(${h.rot}deg)`,
          }}
        >
          {/* dark puncture with scorched rim + star cracks */}
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 50% 50%, #0a0a0a 0%, #1a1208 38%, rgba(40,28,10,0.85) 60%, transparent 72%)',
              boxShadow: '0 0 0 1px rgba(80,55,20,0.6), 0 0 3px rgba(0,0,0,0.8)',
            }}
          />
          <span
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(90deg, transparent 46%, rgba(30,20,8,0.7) 48%, rgba(30,20,8,0.7) 52%, transparent 54%), linear-gradient(0deg, transparent 46%, rgba(30,20,8,0.7) 48%, rgba(30,20,8,0.7) 52%, transparent 54%)',
              transform: 'scale(2.4)',
              filter: 'blur(0.4px)',
            }}
          />
        </span>
      ))}

      {/* Winning reticle highlight */}
      {highlighted && !shattering && (
        <span className="absolute inset-0 rounded-md ring-4 ring-yellow-300 animate-pulse shadow-[0_0_20px_rgba(255,200,0,1)] pointer-events-none" />
      )}
    </div>
  );
}