import React, { useMemo } from 'react';
import { SYMBOLS } from './symbols';

// Stable bullet-hole positions for one tile instance (2-4 holes, mix of
// small and big).
function useBulletHoles() {
  return useMemo(() => {
    const count = 2 + Math.floor(Math.random() * 3);
    const holes = [];
    for (let i = 0; i < count; i++) {
      const big = Math.random() < 0.4;
      holes.push({
        x: 14 + Math.random() * 72,
        y: 14 + Math.random() * 72,
        rot: Math.random() * 360,
        size: big ? 11 + Math.random() * 7 : 5 + Math.random() * 4,
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
  bandit: 1.32, revolver: 1.28, whiskey: 1.24, hat: 1.3,
  scatter: 1.36, wild: 1.36,
  A: 1.4, K: 1.26, Q: 1.26, J: 1.16,
};

// Decorative western frame shown behind randomly selected symbols in rows 3-4.
const FRAME_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/779f97a01_file_000000008b6081fab70937ee49f1af71.png';

// Golden light-burst shown behind matching (winning) symbols. Sits on solid
// black, so it's screen-blended so the black vanishes and only the golden
// flare + sparkle particles glow through.
const WIN_LIGHT_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/bc304a051_file_0000000019b081faa7b2dd0cdc894459.png';

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
  const baseScale = SCALE[symbolId] || 1;
  const isWild = symbolId === 'wild';
  const holes = useBulletHoles();
  // Matching symbol pops bigger like a bomb burst (only before it shatters).
  // Wilds don't pop — they carry a soft persistent halo instead.
  const popAnim = highlighted && !shattering && !isWild ? `matchPop 0.5s ease-out forwards` : undefined;
  const showHalo = isWild && scatterBeam;
  // Bullet holes punch into the symbol the instant it matches/pops — a mix of
  // small and big impact craters.
  const showBulletHoles = highlighted && !shattering && !isWild;

  return (
    <div
      className={`relative ${highlighted || showHalo || goldFramed || decorFrame ? 'overflow-visible' : 'overflow-hidden'} transition-transform`}
      style={{ aspectRatio: '1 / 1', animation: shattering ? `shatterWin ${(0.6 * slow).toFixed(2)}s ease-out forwards` : undefined, zIndex: shattering ? 20 : undefined }}
    >
      {/* Golden light-burst behind matching symbols (not wilds) — slightly
          larger than the symbol so the flare bleeds around it */}
      {highlighted && !isWild && (
        <img
          src={WIN_LIGHT_URL}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ zIndex: 0, mixBlendMode: 'screen', transformOrigin: 'center center', animation: 'winLightBurst 0.5s ease-out forwards' }}
        />
      )}
      {/* Wild — soft golden halo that glows gently and persists until the next
          spin / round (driven by scatterGlow, not per-cascade highlights). */}
      {showHalo && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            background: 'radial-gradient(circle at center, rgba(255,243,180,0.62) 0%, rgba(255,212,95,0.32) 44%, transparent 72%)',
            filter: 'blur(5px)',
            transform: 'scale(1.18)',
            animation: 'wildHaloPulse 2.4s ease-in-out infinite',
          }}
        />
      )}
      {(decorFrame || goldFramed) && img && symbolId !== 'scatter' ? (
        <>
          <img
            src={FRAME_URL}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0, transform: 'scale(1.08)' }}
          />
          <img
            src={img}
            alt={symbolId}
            loading="lazy"
            className="w-full h-full object-cover"
            style={{ '--bs': baseScale, transform: `scale(${baseScale})`, zIndex: 5, animation: popAnim }}
          />
        </>
      ) : img ? (
        <img
          src={img}
          alt={symbolId}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ '--bs': baseScale, transform: `scale(${baseScale})`, animation: popAnim }}
        />
      ) : isCard ? (
        <div
          className={`w-full h-full flex items-center justify-center bg-gradient-to-b ${CARD_STYLE[symbolId].bg}`}
          style={{ '--bs': 1, animation: popAnim }}
        >
          <span className={`text-4xl font-black italic ${CARD_STYLE[symbolId].text} drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]`} style={{ fontFamily: 'Rye, Georgia, serif' }}>
            {symbolId}
          </span>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-stone-800">
          <span className="text-3xl">?</span>
        </div>
      )}

      {/* Scatter label is part of the symbol image now */}

      {/* Bullet-hole impact marks punched into matching symbols as they pop */}
      {showBulletHoles && holes.map((h, i) => (
        <span
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${h.x}%`,
            top: `${h.y}%`,
            width: h.size,
            height: h.size,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 36% 30%, #1c1004 0%, #070300 46%, #321a08 78%, rgba(40,24,8,0) 100%)',
            boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.95), inset 0 -1px 1px rgba(255,210,130,0.5), 0 0 0 1.5px rgba(255,225,150,0.55), 0 1px 2px rgba(0,0,0,0.7)',
            zIndex: 12,
            animation: `bulletHolePop 0.22s ease-out ${0.96 + i * 0.06}s both`,
          }}
        />
      ))}

    </div>
  );
}

export default React.memo(SymbolTile);