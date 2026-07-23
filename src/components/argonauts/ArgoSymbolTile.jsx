import React from 'react';
import { SYMBOLS, isValueCoin, valueCoinMult, VALUE_COIN_IMG } from './argonautsEngine';

// Beveled gold plaque label (black field, gold frame + gilt text) for
// SCATTER / BONUS markers — casino-style engraving.
const OCTAGON = 'polygon(18% 0, 82% 0, 100% 50%, 82% 100%, 18% 100%, 0 50%)';
function PlaqueLabel({ children }) {
  return (
    <div
      className="absolute left-1/2 z-20"
      style={{ bottom: 2, transform: 'translateX(-50%)', clipPath: OCTAGON, background: 'linear-gradient(180deg, #FFF6D5 0%, #D4AF37 45%, #8B4513 100%)' }}
    >
      <div
        style={{
          margin: '1px',
          padding: '1px 4px',
          clipPath: OCTAGON,
          background: '#0A0A0A',
          boxShadow: 'inset 0 1px 1px rgba(255,235,150,0.35)',
        }}
      >
        <span
          style={{
            fontSize: '7px',
            fontFamily: 'Georgia, serif',
            fontWeight: 800,
            letterSpacing: '0.06em',
            background: 'linear-gradient(180deg, #FFF6D5 0%, #D4AF37 45%, #8B4513 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextStroke: '0.4px #2D1A0D',
            paintOrder: 'stroke fill',
            whiteSpace: 'nowrap',
          }}
        >
          {children}
        </span>
      </div>
    </div>
  );
}

// A single symbol tile. Value coins render as a gold coin with the dollar
// amount (mult × bet) overlaid; stuck coins get a brighter glow.
export default function ArgoSymbolTile({ sym, spinning, win, dim = false, bet = 0, stuck = false }) {
  if (isValueCoin(sym)) {
    const amount = valueCoinMult(sym) * bet;
    return (
      <div
        className="relative flex items-center justify-center rounded-[7px] overflow-hidden"
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          boxShadow: stuck
            ? '0 0 22px rgba(253,184,19,0.95), 0 0 12px rgba(233,78,27,0.85), inset 0 0 12px rgba(255,235,150,0.6)'
            : '0 0 16px rgba(253,184,19,0.8), 0 0 8px rgba(233,78,27,0.6)',
          animation: spinning ? undefined : stuck ? 'ccFireFlicker 1.1s ease-in-out infinite' : undefined,
        }}
      >
        <img src={VALUE_COIN_IMG} alt="value coin" className="absolute inset-0 w-full h-full object-cover" draggable={false} style={{ transform: 'scale(1.12)', mixBlendMode: 'screen' }} />
        <span
          className="relative z-10 tabular-nums italic"
          style={{
            fontSize: '0.66rem',
            fontFamily: 'Rye, Georgia, serif',
            color: '#FFD24A',
            textShadow:
              '1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
            letterSpacing: '0.01em',
          }}
        >
          ${amount.toFixed(2)}
        </span>
      </div>
    );
  }

  const meta = SYMBOLS[sym] || SYMBOLS.bow;
  const isWild = meta.kind === 'wild';
  const isScatter = meta.kind === 'scatter';
  const isBonus = meta.kind === 'bonus';

  return (
    <div
      className="relative flex items-center justify-center transition-all duration-300"
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        opacity: dim ? 0.32 : 1,
        filter: spinning
          ? 'blur(1.4px) brightness(0.82)'
          : win
            ? 'brightness(1.18) drop-shadow(0 0 6px rgba(255,215,0,0.85))'
            : 'none',
        animation: spinning ? 'ccReelSpin 0.16s linear infinite' : undefined,
      }}
    >
      {meta.image ? (
        <img
          src={meta.image}
          alt={meta.name}
          className="relative z-10 w-full h-full object-cover"
          draggable={false}
          style={{ transform: 'scale(1.2)' }}
        />
      ) : (
        <span
          className="relative z-10"
          style={{
            fontSize: '2rem',
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))',
            transform: isWild ? 'scale(1.35)' : 'none',
          }}
        >
          {meta.emoji}
        </span>
      )}
      {isScatter && <PlaqueLabel>SCATTER</PlaqueLabel>}
      {isBonus && <PlaqueLabel>BONUS</PlaqueLabel>}
    </div>
  );
}