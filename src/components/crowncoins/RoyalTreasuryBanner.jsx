import React from 'react';
import { Crown } from 'lucide-react';

// Royal Treasury stage banner — premium western design.
// Dark wood plank backdrop with gold trim, embossed gilt headline,
// and a studded leather frame. Shown both before the free-spin round
// (no amount) and after it ends (with the won amount).
const PLANK_BG = 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/f28be6c98_.jpg';

export default function RoyalTreasuryBanner({ onContinue, winAmount }) {
  const isWin = winAmount != null;
  return (
    <div
      onClick={onContinue}
      className="fixed inset-0 z-[60] flex items-center justify-center cursor-pointer"
      style={{ background: 'rgba(8,4,2,0.78)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-md mx-5 overflow-hidden"
        style={{
          borderRadius: '14px',
          border: '3px solid #d4af37',
          boxShadow:
            '0 0 0 2px #6b4a08, 0 18px 44px rgba(0,0,0,0.7), inset 0 0 0 6px rgba(0,0,0,0.45), inset 0 2px 10px rgba(255,220,120,0.22)',
          background: `linear-gradient(rgba(40,22,6,0.82), rgba(20,10,2,0.92)), url(${PLANK_BG}) center / cover`,
        }}
      >
        {/* Stud corner rivets */}
        {[
          { top: 8, left: 8 },
          { top: 8, right: 8 },
          { bottom: 8, left: 8 },
          { bottom: 8, right: 8 },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              ...p,
              background: 'radial-gradient(circle at 35% 30%, #ffe9a8, #b8860b 60%, #5a3a06)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.6), inset 0 0 0 1px #3a2400',
            }}
          />
        ))}

        {/* Inner gilt frame line */}
        <div
          className="absolute inset-2 pointer-events-none"
          style={{ border: '1px solid rgba(212,175,55,0.55)', borderRadius: '8px' }}
        />

        <div className="relative px-8 py-10 flex flex-col items-center justify-center text-center">
          {/* Crown crest */}
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full mb-3"
            style={{
              border: '2px solid #d4af37',
              background: 'radial-gradient(circle at 40% 30%, #2a0608, #140204)',
              boxShadow: '0 0 16px rgba(255,200,80,0.55), inset 0 0 8px rgba(255,200,80,0.35)',
            }}
          >
            <Crown className="w-7 h-7 text-amber-300" style={{ filter: 'drop-shadow(0 0 4px rgba(255,200,80,0.7))' }} />
          </div>

          {/* Headline */}
          {isWin ? (
            <span
              className="block leading-tight tracking-[0.18em]"
              style={{
                fontFamily: 'Rye, Georgia, serif',
                fontSize: 'clamp(15px, 4.4vw, 20px)',
                color: '#f5d590',
                textShadow: '0 1px 0 #6b4a08, 0 2px 3px rgba(0,0,0,0.85), 0 0 10px rgba(255,200,80,0.4)',
              }}
            >
              ROYAL TREASURY
            </span>
          ) : (
            <span
              className="block leading-tight tracking-[0.16em]"
              style={{
                fontFamily: 'Rye, Georgia, serif',
                fontSize: 'clamp(20px, 6vw, 30px)',
                color: '#f5d590',
                textShadow: '0 1px 0 #6b4a08, 0 2px 4px rgba(0,0,0,0.9), 0 0 14px rgba(255,200,80,0.45)',
              }}
            >
              ROYAL TREASURY
            </span>
          )}

          {/* Subline */}
          {isWin ? (
            <span
              className="block mt-1"
              style={{
                fontFamily: 'Smokum, Rye, Georgia, serif',
                fontSize: 'clamp(16px, 5vw, 22px)',
                color: '#ffe9a8',
                letterSpacing: '0.05em',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              Your Bounty
            </span>
          ) : (
            <span
              className="block mt-1 max-w-[18rem]"
              style={{
                fontFamily: 'Smokum, Rye, Georgia, serif',
                fontSize: 'clamp(13px, 3.6vw, 16px)',
                color: '#e8c873',
                letterSpacing: '0.04em',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              3 free spins await — land a coin to keep spinning
            </span>
          )}

          {/* Win amount plaque */}
          {isWin && (
            <div
              className="mt-4 px-8 py-3 rounded-md"
              style={{
                border: '2px solid #d4af37',
                background: 'linear-gradient(to bottom, #2a0608, #140204)',
                boxShadow: 'inset 0 2px 6px rgba(255,220,120,0.25), 0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <span
                className="block tabular-nums"
                style={{
                  fontFamily: 'Rye, Georgia, serif',
                  fontSize: 'clamp(34px, 11vw, 54px)',
                  color: '#ffd24a',
                  textShadow: '0 1px 0 #6b4a08, 0 2px 4px rgba(0,0,0,0.9), 0 0 16px rgba(255,200,80,0.6)',
                }}
              >
                ${Number(winAmount).toFixed(2)}
              </span>
            </div>
          )}

          {/* Decorative bullet divider */}
          <div className="flex items-center gap-2 my-5 w-full max-w-[16rem]">
            <span className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #d4af37, transparent)' }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#d4af37' }} />
            <span className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #d4af37, transparent)' }} />
          </div>

          {/* Instruction */}
          <span
            className="inline-block tracking-[0.2em]"
            style={{
              fontFamily: 'Smokum, Rye, Georgia, serif',
              fontSize: 'clamp(12px, 3.4vw, 15px)',
              color: '#f5d590',
              animation: 'ccPulse 1.6s ease-in-out infinite',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {isWin ? 'TAP TO COLLECT' : 'TAP TO BEGIN'}
          </span>
        </div>
      </div>
    </div>
  );
}