import React from 'react';
import { SYMBOLS } from './symbols';

const IMG = {
  bandit:   'https://media.base44.com/images/public/6a564d2f376adbca6a03de48/0d5c8615e_generated_image.png',
  revolver: 'https://media.base44.com/images/public/6a564d2f376adbca6a03de48/8aeeafd7a_generated_image.png',
  whiskey:  'https://media.base44.com/images/public/6a564d2f376adbca6a03de48/525e250d8_generated_image.png',
  hat:      'https://media.base44.com/images/public/6a564d2f376adbca6a03de48/703eaba87_generated_image.png',
  scatter:  'https://media.base44.com/images/public/6a564d2f376adbca6a03de48/f5447a4d1_generated_image.png',
  wild:     'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/abaafa9c8_24e9525e1_generated_image.png',
  A: 'https://media.base44.com/images/public/6a564d2f376adbca6a03de48/42eef6374_generated_image.png',
  K: 'https://media.base44.com/images/public/6a564d2f376adbca6a03de48/a02ce2873_generated_image.png',
  Q: 'https://media.base44.com/images/public/6a564d2f376adbca6a03de48/1c191cf13_generated_image.png',
  J: 'https://media.base44.com/images/public/6a564d2f376adbca6a03de48/fef0aca4e_generated_image.png',
};

// Card letters styled like worn wooden tiles
const CARD_STYLE = {
  A: { bg: 'from-yellow-600 to-amber-800', text: 'text-yellow-50' },
  K: { bg: 'from-red-600 to-red-900', text: 'text-red-50' },
  Q: { bg: 'from-green-600 to-green-900', text: 'text-green-50' },
  J: { bg: 'from-blue-600 to-blue-900', text: 'text-blue-50' },
};

export default function SymbolTile({ symbolId, highlighted, goldFramed, shattering, scatterBeam }) {
  const isCard = ['A', 'K', 'Q', 'J'].includes(symbolId);
  const img = IMG[symbolId];

  return (
    <div
      className={`relative overflow-hidden transition-transform
        ${goldFramed ? 'ring-2 ring-yellow-300 shadow-[0_0_10px_rgba(255,215,0,0.7)]' : ''}
        ${highlighted && !shattering ? 'z-10 scale-[1.04] ring-2 ring-yellow-300' : ''}`}
      style={{ aspectRatio: '1 / 1', animation: shattering ? 'shatterWin 0.6s ease-out forwards' : undefined, zIndex: shattering ? 20 : (highlighted && !shattering ? 10 : undefined), filter: highlighted && !shattering ? 'brightness(1.6) saturate(1.3) drop-shadow(0 0 8px rgba(255,200,0,0.9))' : undefined }}
    >
      {img ? (
        <img src={img} alt={symbolId} loading="lazy" className="w-full h-full object-cover" />
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

      {/* Anticipation golden beam on landed wild & scatter */}
      {(symbolId === 'scatter' || symbolId === 'wild') && scatterBeam && (
        <span
          className="absolute inset-x-0 pointer-events-none z-30"
          style={{
            top: '-30%',
            bottom: '-30%',
            background:
              'linear-gradient(to bottom, rgba(255,250,205,0) 0%, rgba(255,215,0,0.85) 22%, rgba(255,255,255,0.95) 50%, rgba(255,215,0,0.85) 78%, rgba(255,250,205,0) 100%)',
            filter: 'blur(2px)',
            boxShadow: '0 0 22px rgba(255,215,0,0.9), 0 0 40px rgba(255,215,0,0.6)',
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
        <span className="absolute inset-0 bg-gradient-to-br from-yellow-300/50 via-amber-400/25 to-yellow-300/50 mix-blend-overlay pointer-events-none" />
      )}

      {/* Winning reticle highlight */}
      {highlighted && !shattering && (
        <span className="absolute inset-0 rounded-md ring-4 ring-yellow-300 animate-pulse shadow-[0_0_16px_rgba(255,200,0,0.95)] pointer-events-none" />
      )}
    </div>
  );
}