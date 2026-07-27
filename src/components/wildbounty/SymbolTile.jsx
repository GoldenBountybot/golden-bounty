import React from 'react';

// Symbol art images (western-themed). Symbols render directly on the
// chocolate board — no cell background or border. Gold-framed symbols get a
// gold metallic frame; winning symbols glow gold.
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

function SymbolTile({ symbolId, highlighted, goldFramed, shattering, scatterBeam, slow = 1 }) {
  const img = IMG[symbolId];
  const isSpecial = symbolId === 'scatter' || symbolId === 'wild';

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        aspectRatio: '1 / 1',
        animation: shattering ? `shatterWin ${(0.6 * slow).toFixed(2)}s ease-out forwards` : undefined,
        zIndex: shattering ? 20 : highlighted ? 10 : undefined,
        transform: highlighted && !shattering ? 'scale(1.12)' : 'none',
        transition: 'transform 0.2s ease',
        filter: highlighted && !shattering ? 'drop-shadow(0 0 10px rgba(230,208,128,0.95))' : 'none',
      }}
    >
      {img ? (
        <img
          src={img}
          alt={symbolId}
          loading="lazy"
          className="w-full h-full object-contain p-[6%]"
          style={{ mixBlendMode: 'normal' }}
        />
      ) : (
        <span className="text-2xl text-amber-300">{symbolId}</span>
      )}

      {/* Gold metallic frame (gold-framed symbol) */}
      {goldFramed && !shattering && (
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px solid #C5A059',
            boxShadow: 'inset 0 0 0 1px #E6D080, inset 0 0 8px rgba(230,208,128,0.4), 0 0 6px rgba(197,160,89,0.7)',
            borderRadius: 4,
          }}
        />
      )}

      {/* Subtle golden beam on landed wild & scatter */}
      {isSpecial && scatterBeam && (
        <span
          className="absolute inset-x-1 pointer-events-none z-30"
          style={{
            top: '-12%',
            bottom: '-12%',
            background: 'linear-gradient(to bottom, rgba(255,215,0,0) 0%, rgba(255,215,0,0.35) 40%, rgba(255,240,180,0.5) 50%, rgba(255,215,0,0.35) 60%, rgba(255,215,0,0) 100%)',
            filter: 'blur(2px)',
          }}
        />
      )}

      {/* Winning glow ring */}
      {highlighted && !shattering && (
        <span className="absolute inset-0 pointer-events-none rounded-md" style={{ boxShadow: 'inset 0 0 0 2px rgba(230,208,128,0.9), 0 0 12px rgba(230,208,128,0.8)' }} />
      )}
    </div>
  );
}

export default React.memo(SymbolTile);