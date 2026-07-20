import React from 'react';

// Royal Treasury stage banner shown before the free-spin round starts.
// Styled after the design reference: crown on top, red velvet curtains
// opening to a radiant golden stage, headline + "press anywhere" footer.
export default function RoyalTreasuryBanner({ onContinue }) {
  return (
    <div
      onClick={onContinue}
      className="fixed inset-0 z-[60] flex items-center justify-center cursor-pointer"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(3px)' }}
    >
      <div
        className="relative w-full max-w-md mx-3 overflow-hidden"
        style={{
          aspectRatio: '3 / 4',
          border: '3px solid #D4AF37',
          borderRadius: '14px',
          boxShadow: '0 0 30px rgba(255,200,0,0.55), inset 0 0 0 2px rgba(120,80,10,0.7)',
        }}
      >
        {/* Radiant golden stage background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, #FFFACD 0%, #FFE680 28%, #FFD700 52%, #FFB300 74%, #FF8C00 100%)',
          }}
        />
        {/* Golden light particles */}
        {Array.from({ length: 14 }).map((_, i) => {
          const left = (i * 37) % 100;
          const top = (i * 53) % 100;
          const size = 4 + ((i * 7) % 10);
          const delay = (i % 7) * 0.4;
          return (
            <span
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}px`,
                height: `${size}px`,
                background: 'radial-gradient(circle, rgba(255,255,230,0.95), rgba(255,215,0,0))',
                animation: `ccSparkle 1.6s ease-in-out ${delay}s infinite`,
              }}
            />
          );
        })}

        {/* Top curtain drape */}
        <div
          className="absolute top-0 inset-x-0 pointer-events-none"
          style={{
            height: '38%',
            background:
              'linear-gradient(to bottom, #8B0000 0%, #B21807 30%, #8B0000 100%)',
            boxShadow: 'inset 0 -6px 14px rgba(0,0,0,0.55)',
            clipPath: 'polygon(0 0, 100% 0, 100% 78%, 88% 100%, 72% 80%, 56% 100%, 44% 80%, 28% 100%, 12% 80%, 0 78%)',
          }}
        />
        {/* Gold trim + fur edge under top curtain */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '33%',
            left: 0,
            right: 0,
            height: '16px',
            background: 'linear-gradient(to bottom, #D4AF37, #FFD700, #B8860B)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: 'calc(33% + 14px)',
            left: 0,
            right: 0,
            height: '12px',
            backgroundImage:
              'radial-gradient(circle at 8px 0, #F5F5F5 6px, transparent 7px)',
            backgroundSize: '16px 12px',
            backgroundRepeat: 'repeat-x',
            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))',
          }}
        />

        {/* Side curtains (pulled back) */}
        <div
          className="absolute top-0 bottom-0 left-0 pointer-events-none"
          style={{
            width: '26%',
            background: 'linear-gradient(to right, #8B0000 0%, #B21807 45%, rgba(139,0,0,0) 100%)',
            clipPath: 'polygon(0 0, 100% 0, 70% 30%, 100% 62%, 64% 100%, 0 100%)',
            boxShadow: 'inset -6px 0 12px rgba(0,0,0,0.5)',
          }}
        />
        <div
          className="absolute top-0 bottom-0 right-0 pointer-events-none"
          style={{
            width: '26%',
            background: 'linear-gradient(to left, #8B0000 0%, #B21807 45%, rgba(139,0,0,0) 100%)',
            clipPath: 'polygon(100% 0, 0 0, 30% 30%, 0 62%, 36% 100%, 100% 100%)',
            boxShadow: 'inset 6px 0 12px rgba(0,0,0,0.5)',
          }}
        />

        {/* Crown at top center, perched on the curtains */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '6%' }}>
          <div
            className="relative flex items-center justify-center"
            style={{ width: '88px', height: '64px' }}
          >
            <svg viewBox="0 0 100 72" width="88" height="64" style={{ filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.5))' }}>
              <defs>
                <linearGradient id="ccCrownGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFF3B0" />
                  <stop offset="40%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#B8860B" />
                </linearGradient>
              </defs>
              <path
                d="M10 62 L16 26 L34 44 L50 14 L66 44 L84 26 L90 62 Z"
                fill="url(#ccCrownGold)"
                stroke="#7A5A10"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <rect x="10" y="58" width="80" height="10" rx="3" fill="url(#ccCrownGold)" stroke="#7A5A10" strokeWidth="2" />
              <circle cx="16" cy="26" r="4.5" fill="#1E6FD8" stroke="#0d3f86" strokeWidth="1.2" />
              <circle cx="50" cy="14" r="5.5" fill="#C01818" stroke="#6e0d0d" strokeWidth="1.4" />
              <circle cx="84" cy="26" r="4.5" fill="#1E6FD8" stroke="#0d3f86" strokeWidth="1.2" />
              <circle cx="34" cy="44" r="3.2" fill="#fff6c0" />
              <circle cx="66" cy="44" r="3.2" fill="#fff6c0" />
            </svg>
          </div>
        </div>

        {/* Headline */}
        <div className="absolute inset-x-0 flex flex-col items-center justify-center px-6 text-center" style={{ top: '40%' }}>
          <span
            className="block leading-tight"
            style={{
              fontFamily: 'Rye, Georgia, serif',
              fontSize: 'clamp(20px, 6vw, 30px)',
              color: '#FFD700',
              textShadow: '0 2px 0 #4A1A00, 0 3px 6px rgba(0,0,0,0.65), 0 0 14px rgba(255,200,0,0.5)',
              WebkitTextStroke: '1px #4A1A00',
            }}
          >
            YOU WON THE ROYAL TREASURY BONUS GAME!
          </span>
        </div>

        {/* Footer instruction */}
        <div className="absolute inset-x-0 text-center" style={{ bottom: '7%' }}>
          <span
            className="inline-block"
            style={{
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              fontSize: '12px',
              letterSpacing: '0.18em',
              color: '#FFE9A8',
              textShadow: '0 1px 2px rgba(0,0,0,0.6)',
              animation: 'ccPulse 1.4s ease-in-out infinite',
            }}
          >
            PRESS ANYWHERE TO CONTINUE
          </span>
        </div>
      </div>
    </div>
  );
}