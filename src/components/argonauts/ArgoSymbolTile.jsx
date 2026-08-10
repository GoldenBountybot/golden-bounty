import React from 'react';
import { SYMBOLS, isValueCoin, valueCoinMult, VALUE_COIN_IMG } from './argonautsEngine';

// A single symbol tile. Value coins render as a gold coin with the dollar
// amount (mult × bet) overlaid; stuck coins get a brighter glow.
function ArgoSymbolTile({ sym, spinning, win, dim = false, bet = 0, stuck = false }) {
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

  // GPU-friendly glow: box-shadow on the container instead of expensive
  // drop-shadow / conic-gradient + mask filters. These were the #2 lag source
  // (15 tiles × animated drop-shadow + conic-gradient mask = main-thread thrash).
  const glowBox = win
    ? '0 0 8px rgba(255,215,0,0.9), inset 0 0 6px rgba(255,235,150,0.5)'
    : isScatter
      ? '0 0 8px rgba(255,215,0,0.85), inset 0 0 6px rgba(255,235,150,0.4)'
      : isBonus
        ? '0 0 8px rgba(255,180,40,0.85), inset 0 0 6px rgba(255,200,80,0.4)'
        : 'none';

  return (
    <div
      className="relative flex items-center justify-center transition-opacity duration-200"
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        opacity: dim ? 0.32 : 1,
        filter: spinning ? 'brightness(0.82)' : 'none',
        animation: spinning ? 'ccReelSpin 0.16s linear infinite' : undefined,
        boxShadow: spinning ? 'none' : glowBox,
        borderRadius: '7px',
      }}
    >
      {meta.image ? (
        <img
          src={meta.image}
          alt={meta.name}
          className="relative z-10 w-full h-full object-cover"
          draggable={false}
          style={{
            transform: 'scale(1.2)',
            animation: (isScatter && !spinning) ? 'argoScatterGlow 1.4s ease-in-out infinite'
              : (isBonus && !spinning) ? 'argoBonusGlow 1.8s ease-in-out infinite'
              : (isWild && win && !spinning) ? 'argoWildGlow 1.6s ease-in-out infinite'
              : (win && !spinning) ? 'argoWinGlow 1.2s ease-in-out infinite'
              : undefined,
          }}
        />
      ) : (
        <span
          className="relative z-10"
          style={{
            fontSize: '2rem',
            transform: isWild ? 'scale(1.35)' : 'none',
          }}
        >
          {meta.emoji}
        </span>
      )}
      {(isScatter || isBonus) && !spinning && (
        <span
          className="absolute inset-0 rounded-[7px] pointer-events-none z-20"
          style={{
            border: '2px solid',
            borderColor: isScatter ? '#FFD700' : '#FFC107',
            animation: 'argoGoldPulse 1.3s ease-in-out infinite',
          }}
        />
      )}
      {win && !spinning && (
        <span
          className="absolute inset-0 rounded-[7px] pointer-events-none z-30"
          style={{
            border: '2px solid #FFD700',
            animation: 'argoWinSpin 1.1s linear infinite',
          }}
        />
      )}
    </div>
  );
}

export default React.memo(ArgoSymbolTile);