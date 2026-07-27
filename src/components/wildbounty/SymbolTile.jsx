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
  bandit:   'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/47b80dfa7_file_00000000ed3081fa8b2b38b3213ec99a.png',
  revolver: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/1d7f9ad2f_file_00000000936c81fa8c6b61333fddd167.png',
  whiskey:  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d20ec7196_file_0000000029f08207838de49974589b4b.png',
  hat:      'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c71ef50cc_file_000000003d0c8211b8397d0e8ffb44b1.png',
  scatter:  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/00ba69c97_file_0000000019208211ab3b4e56cdb92344.png',
  wild:     'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c970620bf_file_0000000037f88207a4992e01551e3e21.png',
  A: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/0fd153331_file_0000000005e881faa113be069715c687.png',
  K: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/82aafe905_file_000000003f80820786167aa236a07df2.png',
  Q: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/fea6fbacb_file_0000000071cc81faa25eed7055b02650.png',
  J: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/8257788f9_file_0000000090808211a1f59f4ce81dde17.png',
};

// Per-symbol zoom so each image fills its cell with minimal black padding.
const SCALE = {
  bandit: 1.24, revolver: 1.2, whiskey: 1.16, hat: 1.22,
  scatter: 1.28, wild: 1.28,
  A: 1.32, K: 1.24, Q: 1.24, J: 1.08,
};

// Decorative western frame shown behind randomly selected symbols in rows 3-4.
const FRAME_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/779f97a01_file_000000008b6081fab70937ee49f1af71.png';

// Card letters styled like worn wooden tiles
const CARD_STYLE = {
  A: { bg: 'from-yellow-600 to-amber-800', text: 'text-yellow-50' },
  K: { bg: 'from-red-600 to-red-900', text: 'text-red-50' },
  Q: { bg: 'from-green-600 to-green-900', text: 'text-green-50' },
  J: { bg: 'from-blue-600 to-blue-900', text: 'text-blue-50' },
};

function SymbolTile({ symbolId, highlighted, goldFramed, shattering, scatterBeam, bulletHit, slow = 1, decorFrame = false }) {
  const isCard = ['A', 'K', 'Q', 'J'].includes(symbolId);
  const img = IMG[symbolId];
  const isSpecial = symbolId === 'scatter' || symbolId === 'wild';

  return (
    <div
      className={`relative overflow-hidden transition-transform`}
      style={{ aspectRatio: '1 / 1', animation: shattering ? `shatterWin ${(0.6 * slow).toFixed(2)}s ease-out forwards` : undefined, zIndex: shattering ? 20 : undefined }}
    >
      {decorFrame && img ? (
        <>
          <img
            src={FRAME_URL}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          />
          <img
            src={img}
            alt={symbolId}
            loading="lazy"
            className="w-full h-full object-cover"
            style={{ transform: `scale(${SCALE[symbolId] || 1})`, zIndex: 5 }}
          />
        </>
      ) : img ? (
        <img
          src={img}
          alt={symbolId}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ transform: `scale(${SCALE[symbolId] || 1})` }}
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

      {/* Scatter label is part of the symbol image now */}

    </div>
  );
}

export default React.memo(SymbolTile);