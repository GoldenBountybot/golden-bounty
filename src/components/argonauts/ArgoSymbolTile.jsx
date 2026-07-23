import React from 'react';
import { SYMBOLS, isValueCoin, valueCoinMult, VALUE_COIN_IMG } from './argonautsEngine';

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
        <img src={VALUE_COIN_IMG} alt="value coin" className="absolute inset-0 w-full h-full object-cover" draggable={false} style={{ transform: 'scale(1.0)' }} />
        <span
          className="relative z-10 font-black tabular-nums italic"
          style={{
            fontSize: '0.78rem',
            fontFamily: 'Rye, Georgia, serif',
            color: '#FFD700',
            WebkitTextStroke: '2.2px #000',
            paintOrder: 'stroke fill',
            filter: 'drop-shadow(0 0 2px rgba(255,235,150,0.8))',
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
      {isScatter && (
        <span
          className="absolute bottom-0.5 inset-x-0 text-center font-black tracking-wider z-20"
          style={{ fontSize: '7px', color: '#FFD700', textShadow: '0 1px 2px #000', fontFamily: 'Georgia, serif' }}
        >
          SCATTER
        </span>
      )}
      {isBonus && (
        <span
          className="absolute bottom-0.5 inset-x-0 text-center font-black tracking-wider z-20"
          style={{ fontSize: '7px', color: '#FFD700', textShadow: '0 1px 2px #000', fontFamily: 'Georgia, serif' }}
        >
          BONUS
        </span>
      )}
    </div>
  );
}