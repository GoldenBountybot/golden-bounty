import React from 'react';

// Royal Treasury stage banner shown before the free-spin round starts.
// Organic Glass Frost design: frosted-glass container over a soft mint/cream
// organic gradient, centered geometric sans-serif headline + instruction.
const FROST_BG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/4f6fbac54_generated_image.png';

export default function RoyalTreasuryBanner({ onContinue, winAmount }) {
  return (
    <div
      onClick={onContinue}
      className="fixed inset-0 z-[60] flex items-center justify-center cursor-pointer"
      style={{ background: 'rgba(20, 24, 20, 0.45)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="relative w-full max-w-lg mx-5 overflow-hidden"
        style={{
          borderRadius: '28px',
          background: `url(${FROST_BG}) center / cover no-repeat`,
          boxShadow: '0 18px 48px rgba(20,40,30,0.28)',
        }}
      >
        {/* Frosted glass overlay */}
        <div
          className="relative px-10 py-16 flex flex-col items-center justify-center text-center"
          style={{
            background: 'rgba(245, 250, 240, 0.28)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderRadius: '28px',
            border: '1px solid rgba(255,255,255,0.55)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          {/* Headline */}
          {winAmount != null ? (
            <span
              className="block leading-tight tracking-wide"
              style={{
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                fontWeight: 600,
                fontSize: 'clamp(16px, 4.8vw, 22px)',
                color: '#000000',
              }}
            >
              BONUS GAME WINNINGS
            </span>
          ) : (
            <span
              className="block leading-tight tracking-wide"
              style={{
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                fontWeight: 600,
                fontSize: 'clamp(18px, 5.4vw, 26px)',
                color: '#000000',
              }}
            >
              YOU WON THE ROYAL TREASURY BONUS GAME!
            </span>
          )}

          {/* Win amount */}
          {winAmount != null && (
            <span
              className="block tabular-nums"
              style={{
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(34px, 10vw, 52px)',
                color: '#1f7a3a',
                marginTop: '8px',
              }}
            >
              ${Number(winAmount).toFixed(2)}
            </span>
          )}

          {/* Noticeable gap */}
          <div style={{ height: '28px' }} />

          {/* Instruction */}
          <span
            className="inline-block tracking-wide"
            style={{
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(12px, 3.4vw, 15px)',
              color: '#000000',
              animation: 'ccPulse 1.6s ease-in-out infinite',
            }}
          >
            PRESS ANYWHERE TO CONTINUE
          </span>
        </div>
      </div>
    </div>
  );
}