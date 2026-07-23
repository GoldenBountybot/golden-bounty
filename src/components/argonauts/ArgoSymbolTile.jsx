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
          border: '2px solid #FFD700',
          boxShadow: stuck
            ? '0 0 20px rgba(255,215,0,0.95), 0 0 8px rgba(255,255,200,0.9), inset 0 0 12px rgba(255,235,150,0.6)'
            : '0 0 10px rgba(255,215,0,0.6), inset 0 0 8px rgba(255,200,80,0.4)',
          animation: spinning ? undefined : stuck ? 'ccFireFlicker 1.1s ease-in-out infinite' : undefined,
        }}
      >
        <img src={VALUE_COIN_IMG} alt="value coin" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        <span
          className="relative z-10 font-black tabular-nums"
          style={{
            fontSize: '0.95rem',
            fontFamily: 'Georgia, serif',
            background: 'linear-gradient(to bottom, #fff7d6 0%, #ffe9a8 22%, #FFD700 52%, #f5c542 72%, #c8881e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 1px 1px rgba(120,80,30,0.9)) drop-shadow(0 0 4px rgba(255,235,150,0.95))',
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
  const special = isWild || isScatter || isBonus;

  const bg = special
    ? 'radial-gradient(circle at 50% 38%, rgba(255,215,0,0.22), rgba(26,13,74,0.88) 70%)'
    : 'radial-gradient(circle at 50% 38%, rgba(40,24,90,0.55), rgba(12,8,30,0.92) 72%)';

  return (
    <div
      className="relative flex items-center justify-center rounded-[7px] transition-all duration-300 overflow-hidden"
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        background: bg,
        border: win ? '1.5px solid #FFD700' : '1px solid rgba(255,215,0,0.22)',
        boxShadow: win
          ? '0 0 16px rgba(255,215,0,0.9), 0 0 6px rgba(255,255,160,0.8), inset 0 0 10px rgba(255,215,0,0.3)'
          : 'inset 0 0 10px rgba(0,0,0,0.55)',
        opacity: dim ? 0.32 : 1,
        filter: spinning ? 'blur(1.4px) brightness(0.82)' : win ? 'brightness(1.15) saturate(1.15)' : 'none',
        animation: spinning ? 'ccReelSpin 0.16s linear infinite' : undefined,
      }}
    >
      {isWild && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 70%, rgba(255,90,0,0.35), transparent 65%)' }}
        />
      )}
      {meta.image ? (
        <img
          src={meta.image}
          alt={meta.name}
          className="relative z-10 w-full h-full object-cover"
          draggable={false}
          style={{ filter: spinning ? 'none' : win ? 'brightness(1.08)' : 'none' }}
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
          className="absolute bottom-0.5 inset-x-0 text-center font-black tracking-wider"
          style={{ fontSize: '7px', color: '#FFD700', textShadow: '0 1px 2px #000', fontFamily: 'Georgia, serif' }}
        >
          SCATTER
        </span>
      )}
      {isBonus && (
        <span
          className="absolute bottom-0.5 inset-x-0 text-center font-black tracking-wider"
          style={{ fontSize: '7px', color: '#FFD700', textShadow: '0 1px 2px #000', fontFamily: 'Georgia, serif' }}
        >
          BONUS
        </span>
      )}
    </div>
  );
}