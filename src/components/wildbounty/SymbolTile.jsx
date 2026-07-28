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

// Stable blast-ember directions for one tile instance (6-9 embers flying
// outward in random directions when the symbol explodes like a bomb).
function useBlastEmbers() {
  return useMemo(() => {
    const count = 6 + Math.floor(Math.random() * 4);
    const embers = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 28 + Math.random() * 48;
      const big = Math.random() < 0.35;
      embers.push({
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        size: big ? 7 + Math.random() * 5 : 3 + Math.random() * 3,
        color: Math.random() < 0.5
          ? 'radial-gradient(circle, #fff3c0 0%, #ff9a2a 70%, transparent 100%)'
          : 'radial-gradient(circle, #ffd86a 0%, #e0530a 70%, transparent 100%)',
        delay: Math.random() * 0.05,
      });
    }
    return embers;
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
  scatter: 1.36, wild: 1.58,
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
  const isScatter = symbolId === 'scatter';
  const holes = useBulletHoles();
  const embers = useBlastEmbers();
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
          className="absolute pointer-events-none"
          style={{
            zIndex: 0,
            top: '-100%', bottom: '-100%', left: '8%', right: '8%',
            background: 'radial-gradient(ellipse 68% 52% at center, rgba(255,251,225,0.95) 0%, rgba(255,228,130,0.62) 34%, rgba(255,195,75,0.24) 58%, transparent 82%)',
            filter: 'blur(5px)',
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
        <>
          {/* Scatter — soft golden glow only on the top & bottom edges */}
          {isScatter && scatterBeam && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255,248,185,0.98) 0%, rgba(255,248,185,0) 26%, rgba(255,248,185,0) 74%, rgba(255,248,185,0.98) 100%)',
                filter: 'blur(5px)',
                transform: 'scaleY(1.35) scaleX(0.48)',
                mixBlendMode: 'screen',
                zIndex: 0,
              }}
            />
          )}
          <img
            src={img}
            alt={symbolId}
            loading="lazy"
            className="w-full h-full object-cover"
            style={{ '--bs': baseScale, transform: `scale(${baseScale})`, animation: popAnim, filter: isScatter ? 'brightness(1.4) drop-shadow(0 0 6px rgba(255,235,150,0.75))' : undefined }}
          />
        </>
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
            background: 'radial-gradient(circle, #0a0a05 38%, #2a1607 68%, rgba(40,24,8,0) 100%)',
            boxShadow: '0 0 0 1.5px rgba(255,225,150,0.45), 0 0 4px 1px rgba(0,0,0,0.7)',
            zIndex: 12,
            animation: `bulletHolePop 0.2s ease-out ${0.46 + i * 0.05}s both`,
          }}
        />
      ))}

      {/* Bomb-blast explosion when the matching symbol shatters: shockwave
          ring, fireball flash core, and flying embers. */}
      {shattering && (
        <>
          {/* Shockwave ring */}
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: '50%',
              border: '2px solid rgba(255,225,150,0.9)',
              transformOrigin: 'center center',
              animation: `blastRing ${(0.5 * slow).toFixed(2)}s ease-out forwards`,
              zIndex: 25,
            }}
          />
          {/* Fireball flash core */}
          <span
            className="absolute pointer-events-none"
            style={{
              left: '15%', top: '15%', width: '70%', height: '70%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #fff7d6 0%, #ffcf5a 28%, #ff7a1a 58%, #b22a00 82%, transparent 100%)',
              filter: 'blur(1px)',
              transformOrigin: 'center center',
              animation: `blastCore ${(0.5 * slow).toFixed(2)}s ease-out forwards`,
              zIndex: 24,
            }}
          />
          {/* Flying embers */}
          {embers.map((e, i) => (
            <span
              key={`ember-${i}`}
              className="absolute pointer-events-none"
              style={{
                left: '50%', top: '50%',
                width: e.size, height: e.size,
                marginLeft: -e.size / 2, marginTop: -e.size / 2,
                borderRadius: '50%',
                background: e.color,
                boxShadow: '0 0 6px rgba(255,170,40,0.9)',
                '--ex': `${e.dx}px`, '--ey': `${e.dy}px`,
                animation: `blastEmber ${(0.6 * slow).toFixed(2)}s ease-out ${e.delay}s forwards`,
                zIndex: 23,
              }}
            />
          ))}
        </>
      )}

    </div>
  );
}

export default React.memo(SymbolTile);