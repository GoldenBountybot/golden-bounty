import React from 'react';
import PlayingCardFace from './PlayingCardFace';
import WesternBadge from './WesternBadge';
import { COLS, ROWS } from '@/lib/superaceEngine';

// Constant cell styles — defined once, not recreated per render (20 cells × many
// renders per spin). Hoisting them eliminates thousands of object allocations.
const baseStyle = {
  background: 'linear-gradient(to bottom, #ffffff 0%, #f5f5f5 100%)',
  border: '1px solid #d0d0d0',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.4)',
};
const goldStyle = {
  background: 'linear-gradient(135deg, #ffe98a 0%, #f5c542 35%, #d39a1e 70%, #b8860b 100%)',
  border: '3px solid #ffe98a',
  boxShadow: '0 0 16px rgba(245,197,66,1), 0 0 30px rgba(245,197,66,0.55), inset 0 0 0 1px rgba(120,80,10,0.55), inset 0 1px 6px rgba(255,255,255,0.6), 0 1px 4px rgba(0,0,0,0.4)',
};
const wildStyle = {
  background: 'radial-gradient(circle at 50% 45%, #3a2a10 0%, #2a1a06 70%, #160d03 100%)',
  border: '1.5px solid #f5c542',
  boxShadow: '0 0 12px rgba(245,197,66,0.85), inset 0 0 0 1px rgba(255,235,150,0.45)',
};
const scatterStyle = {
  background: '#ffffff',
  border: '1.5px solid #f5c542',
  boxShadow: '0 0 12px rgba(245,197,66,0.85), inset 0 0 0 1px rgba(255,235,150,0.45)',
};
const winOverride = {
  border: '3px solid #FFD700',
  boxShadow: '0 0 16px rgba(255,215,0,1), 0 0 28px rgba(255,200,80,0.7), inset 0 0 0 2px rgba(255,245,180,1)',
};

function CardTile({ cell, idx, isWin, spinning, isNew, shatter, flip, goldenWild, tease, teaseStart, scatterLand }) {
  const { sym, golden, id } = cell;
  const col = idx % COLS;
  const row = Math.floor(idx / COLS);
  const dropAnim = tease
    ? `saSlowDrop 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) ${0.15 + ((col - (teaseStart ?? col)) * ROWS + (ROWS - 1 - row)) * 0.28}s both`
    : `saReelDrop 0.35s ease-out ${((col * ROWS) + (ROWS - 1 - row)) * 0.03}s both`;
  // Cascade refill: same staggered drop as the initial spin, so new cards
  // glide in smoothly from the top after the blast — not a jarring pop.
  const cascadeDropAnim = `saReelDrop 0.35s ease-out ${col * 0.05}s both`;
  const isFace = ['A', 'K', 'Q', 'J'].includes(sym);
  const isSuit = ['S', 'H', 'D', 'C'].includes(sym);
  const isWild = sym === 'W';
  const isScatter = sym === 'SC';

  let style = baseStyle;
  if (isWild) style = wildStyle;
  else if (isScatter) style = scatterStyle;
  else if (golden) style = goldStyle;

  if (isWin) {
    style = { ...style, ...winOverride };
  }

  if (cell.pending && !flip) {
    return (
      <div
        key={id}
        className="relative rounded-md overflow-hidden w-full h-full"
        style={{
          backgroundImage: `url('${CARD_BACK}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid #c9c4ba',
          boxShadow: '0 0 10px rgba(245,197,66,0.5)',
          animation: spinning ? dropAnim : 'none',
        }}
      />
    );
  }

  if (flip) {
    return (
      <div className="relative rounded-md overflow-hidden w-full h-full" style={{ perspective: '700px' }}>
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d', animation: 'saFlip 0.62s ease-in-out forwards' }}>
          {/* front: ornate card back */}
          <div className="absolute inset-0 rounded-md" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', backgroundImage: `url('${CARD_BACK}')`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #c9c4ba' }} />
          {/* back: wild */}
          <div className="absolute inset-0 rounded-md" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'radial-gradient(circle at 50% 45%, #3a2a10 0%, #2a1a06 70%, #160d03 100%)', border: '1.5px solid #f5c542', boxShadow: '0 0 12px rgba(245,197,66,0.85), inset 0 0 0 1px rgba(255,235,150,0.45)' }}>
            {goldenWild ? (
              <div className="absolute inset-0 rounded-md" style={{ backgroundImage: `url('${GOLDEN_WILD_IMG}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            ) : (
              <div className="absolute inset-0 p-0.5"><WesternBadge variant="wild" /></div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={id}
      className="relative rounded-md w-full h-full"
      style={{
        ...style,
        overflow: (isWin && !shatter) ? 'visible' : 'hidden',
        willChange: (isWin || spinning || shatter) ? 'transform, opacity' : 'auto',
        animation: spinning
          ? dropAnim
          : shatter
            ? 'saShatter 0.36s ease-in forwards'
            : isNew
              ? cascadeDropAnim
              : isWin
                ? 'saWinPulse 0.7s ease-in-out infinite'
                : 'none',
        transition: spinning ? 'none' : 'transform 0.15s',
      }}
    >
      {/* Single GPU-friendly glow overlay — opacity-only pulse, no box-shadow
          repaint on the main thread. Replaces the old dual-overlay (box-shadow
          + radial-gradient) that caused lag when many cards won at once. */}
      {isWin && !shatter && (
        <div
          className="absolute inset-0 rounded-md pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(255,215,0,0.45), transparent 70%)',
            animation: 'saGlowOpacity 0.7s ease-in-out infinite',
          }}
        />
      )}
      {isWild && (
        <div className="absolute inset-0 p-0.5">
          {goldenWild ? (
            <div className="absolute inset-0 rounded-md" style={{ backgroundImage: `url('${GOLDEN_WILD_IMG}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          ) : (
            <WesternBadge variant="wild" />
          )}
        </div>
      )}
      {isScatter && (
        <div className="absolute inset-0 p-0.5" style={scatterLand ? { animation: 'saScatterGlow 0.7s ease-out forwards', zIndex: 15 } : {}}>
          <WesternBadge variant="scatter" />
        </div>
      )}
      {isScatter && scatterLand && (
        <>
          <div
            className="absolute top-1/2 left-1/2 z-30 pointer-events-none rounded-full"
            style={{
              width: '75%',
              height: '75%',
              border: '4px solid #FFD700',
              boxShadow: '0 0 20px rgba(255,215,0,0.9), inset 0 0 10px rgba(255,235,150,0.6)',
              animation: 'saScatterBurst 0.7s ease-out forwards',
            }}
          />
          <div
            className="absolute inset-0 z-20 pointer-events-none rounded-md"
            style={{
              background: 'radial-gradient(circle at center, rgba(255,235,150,0.9) 0%, rgba(255,200,80,0.4) 40%, transparent 70%)',
              animation: 'saScatterFlash 0.5s ease-out forwards',
            }}
          />
        </>
      )}
      {(isFace || isSuit) && <PlayingCardFace sym={sym} golden={golden} />}
      {golden && (isFace || isSuit) && (
        <span className="absolute top-[3px] right-[3px] z-20 text-[8px] font-black" style={{ color: '#b8860b', textShadow: '0 0 4px rgba(255,235,150,0.9)' }}>★</span>
      )}
      {shatter && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          {STAR_DIRS.map((d, i) => (
            <span
              key={i}
              className="absolute top-1/2 left-1/2 text-[10px]"
              style={{
                '--sx': `${d.x}px`,
                '--sy': `${d.y}px`,
                color: '#ffe98a',
                textShadow: '0 0 5px rgba(245,197,66,0.9)',
                animation: `saStarBurst ${0.3 + (i % 3) * 0.06}s ease-out forwards`,
              }}
            >
              ★
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Custom comparator: skip re-render when no visible prop changed. The parent
// recreates cell objects (via { ...c }) on every setGrid, so reference equality
// always fails — this value comparison is what actually prevents wasted work.
function arePropsEqual(prev, next) {
  return (
    prev.idx === next.idx &&
    prev.isWin === next.isWin &&
    prev.spinning === next.spinning &&
    prev.isNew === next.isNew &&
    prev.shatter === next.shatter &&
    prev.flip === next.flip &&
    prev.tease === next.tease &&
    prev.teaseStart === next.teaseStart &&
    prev.scatterLand === next.scatterLand &&
    prev.cell.id === next.cell.id &&
    prev.cell.sym === next.cell.sym &&
    prev.cell.golden === next.cell.golden &&
    prev.cell.goldenWild === next.cell.goldenWild &&
    prev.cell.pending === next.cell.pending
  );
}

export default React.memo(CardTile, arePropsEqual);

const STAR_DIRS = [
  { x: -18, y: -16 }, { x: 16, y: -18 }, { x: -22, y: 6 }, { x: 20, y: 8 },
  { x: -6, y: -22 }, { x: 8, y: 20 }, { x: -20, y: 18 }, { x: 22, y: -6 },
];

const CARD_BACK = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/fcd98f4f5_InShot_20260718_152559101.jpg';
const GOLDEN_WILD_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/6060a2364_wild-ace-01.png';