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

  return (
    <div
      className="relative flex items-center justify-center transition-opacity duration-200"
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
          style={{
            transform: 'scale(1.2)',
            animation: (isScatter && !spinning) ? 'argoScatterGlow 1.4s ease-in-out infinite'
              : (isBonus && !spinning) ? 'argoBonusGlow 1.8s ease-in-out infinite'
              : undefined,
          }}
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
        <>
          <span
            className="absolute inset-0 rounded-[7px] pointer-events-none z-20"
            style={{
              padding: '2.5px',
              background: 'linear-gradient(135deg, #FFE9A8 0%, #FFD700 25%, #FFFBE0 50%, #FFB300 75%, #FFE9A8 100%)',
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.95))',
            }}
          />
          <span
            className="absolute inset-0 rounded-[7px] pointer-events-none z-10"
            style={{ animation: 'argoGoldPulse 1.3s ease-in-out infinite' }}
          />
        </>
      )}
      {isBonus && (
        <>
          <span
            className="absolute inset-0 rounded-[7px] pointer-events-none z-20"
            style={{
              padding: '2.5px',
              background: 'linear-gradient(135deg, #FFE9A8 0%, #FFC107 25%, #FFF6C0 50%, #FF8C00 75%, #FFE9A8 100%)',
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              filter: 'drop-shadow(0 0 4px rgba(255,180,40,0.95))',
            }}
          />
          <span
            className="absolute inset-0 rounded-[7px] pointer-events-none z-10"
            style={{ animation: 'argoGoldPulse 1.3s ease-in-out infinite' }}
          />
        </>
      )}
      {win && (
        <span
          className="absolute inset-0 rounded-[7px] pointer-events-none z-30"
          style={{
            padding: '2px',
            background: 'conic-gradient(from 0deg, rgba(255,215,0,0) 0%, #FFD700 25%, rgba(255,255,224,0.9) 40%, #FFD700 55%, rgba(255,215,0,0) 75%, #FFD700 90%, rgba(255,215,0,0) 100%)',
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            animation: 'argoWinSpin 1.1s linear infinite',
            filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.9))',
          }}
        />
      )}
    </div>
  );
}

export default React.memo(ArgoSymbolTile);