import React from 'react';

// Branded loading screen shown AFTER the static splash image, while the app
// preloads assets and auth in the background. Pure loading indicator — no
// buttons, no navigation.
export default function AppLoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center gap-8 overflow-hidden" style={{ background: '#0a0806' }}>
      {/* Golden radial glow */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(60% 50% at 50% 45%, rgba(212,175,55,0.12), transparent 65%)' }}
      />

      {/* Rotating golden ring loader */}
      <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
        <svg
          viewBox="0 0 96 96"
          className="absolute inset-0"
          style={{ animation: 'splashRingSpin 1.4s linear infinite' }}
        >
          <circle
            cx="48" cy="48" r="44"
            fill="none"
            stroke="url(#loadGold)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="14 20"
          />
          <defs>
            <linearGradient id="loadGold" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFE9A0" />
              <stop offset="0.5" stopColor="#D4AF37" />
              <stop offset="1" stopColor="#8C6A1F" />
            </linearGradient>
          </defs>
        </svg>
        <div
          className="absolute rounded-full"
          style={{
            width: 72, height: 72,
            background: 'radial-gradient(circle, rgba(255,215,120,0.3) 0%, transparent 70%)',
            animation: 'splashGlowPulse 2s ease-in-out infinite',
          }}
        />
      </div>

      {/* Brand wordmark */}
      <div className="relative flex flex-col items-center gap-2" style={{ animation: 'splashFadeIn 600ms ease both' }}>
        <h1
          className="text-xl tracking-[0.28em] uppercase"
          style={{
            fontFamily: 'Rye, Georgia, serif',
            color: '#ffe9a0',
            textShadow: '0 2px 14px rgba(0,0,0,0.85), 0 0 18px rgba(212,175,55,0.35)',
          }}
        >
          Golden Bounty
        </h1>
        <span
          className="text-[10px] tracking-[0.4em] uppercase font-semibold"
          style={{ color: 'rgba(212,175,55,0.6)' }}
        >
          Loading…
        </span>
      </div>
    </div>
  );
}