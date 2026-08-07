import React from 'react';

const SPLASH_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/b1a2d7d3e_file_000000009ef4820baac5161c2e45158b.png';
const LOGO_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c39869f00_file_000000003b6c821193c37e7c968d77f2.png';

// Full-screen premium splash shown while the app boots. A luxury golden
// emblem with a rotating ring, shimmering brand wordmark, and elegant
// progress dots — iconic and on-brand for Golden Bounty.
export default function AppLoadingImage() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden" style={{ background: '#0a0806' }}>
      {/* Branded background — faded, fixed */}
      <img
        src={SPLASH_IMG}
        alt=""
        className="absolute inset-0 w-full h-full object-cover select-none opacity-25"
        draggable={false}
        fetchPriority="high"
        decoding="async"
        style={{ animation: 'splashFadeIn 600ms ease both' }}
      />
      {/* Darkening + golden radial glow */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(60% 50% at 50% 45%, rgba(212,175,55,0.16), transparent 65%), linear-gradient(180deg, rgba(8,6,4,0.72) 0%, rgba(8,6,4,0.88) 100%)' }} />

      {/* Center emblem */}
      <div className="relative z-10 flex flex-col items-center gap-7" style={{ animation: 'splashEmblemRise 700ms cubic-bezier(0.22,1,0.36,1) both' }}>
        {/* Rotating golden ring + logo */}
        <div className="relative flex items-center justify-center" style={{ width: 168, height: 168 }}>
          {/* Outer rotating dashed ring */}
          <svg
            viewBox="0 0 168 168"
            className="absolute inset-0"
            style={{ animation: 'splashRingSpin 3.2s linear infinite' }}
          >
            <circle
              cx="84" cy="84" r="80"
              fill="none"
              stroke="url(#splashGold)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="10 14"
              opacity="0.85"
            />
            <defs>
              <linearGradient id="splashGold" x1="0" y1="0" x2="168" y2="168" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#FFE9A0" />
                <stop offset="0.5" stopColor="#D4AF37" />
                <stop offset="1" stopColor="#8C6A1F" />
              </linearGradient>
            </defs>
          </svg>

          {/* Inner counter-rotating arc */}
          <svg
            viewBox="0 0 168 168"
            className="absolute inset-0"
            style={{ animation: 'splashRingSpinRev 2.4s linear infinite' }}
          >
            <circle
              cx="84" cy="84" r="70"
              fill="none"
              stroke="rgba(212,175,55,0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="2 10"
            />
          </svg>

          {/* Pulsing glow behind logo */}
          <div
            className="absolute rounded-full"
            style={{
              width: 132, height: 132,
              background: 'radial-gradient(circle, rgba(255,215,120,0.45) 0%, rgba(212,175,55,0.12) 55%, transparent 72%)',
              animation: 'splashGlowPulse 2.6s ease-in-out infinite',
            }}
          />

          {/* Logo disc */}
          <div
            className="relative flex items-center justify-center rounded-full overflow-hidden"
            style={{
              width: 116, height: 116,
              background: 'radial-gradient(circle at 50% 35%, #1a1409 0%, #0a0806 100%)',
              border: '2px solid rgba(212,175,55,0.7)',
              boxShadow: '0 0 22px rgba(212,175,55,0.45), inset 0 0 18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,235,160,0.35)',
            }}
          >
            <img
              src={LOGO_IMG}
              alt="Golden Bounty"
              className="w-[88px] h-[88px] object-contain select-none"
              draggable={false}
              decoding="async"
              style={{ animation: 'splashLogoBreath 3s ease-in-out infinite' }}
            />
          </div>
        </div>

        {/* Brand wordmark with shimmer */}
        <div className="flex flex-col items-center gap-1.5">
          <h1
            className="text-2xl sm:text-3xl tracking-[0.28em] uppercase"
            style={{
              fontFamily: 'Rye, Georgia, serif',
              color: '#ffe9a0',
              textShadow: '0 2px 14px rgba(0,0,0,0.85), 0 0 18px rgba(212,175,55,0.35)',
              background: 'linear-gradient(90deg, #8C6A1F 0%, #FFE9A0 25%, #D4AF37 50%, #FFE9A0 75%, #8C6A1F 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '200% auto',
              animation: 'splashShimmer 2.8s linear infinite',
            }}
          >
            Golden Bounty
          </h1>
          <span
            className="text-[10px] sm:text-[11px] tracking-[0.5em] uppercase font-semibold"
            style={{ color: 'rgba(212,175,55,0.7)' }}
          >
            Premium Casino
          </span>
        </div>

        {/* Elegant progress dots */}
        <div className="flex items-center gap-2.5" style={{ animation: 'splashFadeIn 800ms 300ms ease both' }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: 7, height: 7,
                background: '#D4AF37',
                boxShadow: '0 0 8px rgba(212,175,55,0.85)',
                animation: `splashDot 1.2s ${i * 0.18}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom hairline + tagline */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 z-10" style={{ animation: 'splashFadeIn 900ms 500ms ease both' }}>
        <div className="h-px w-40" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)' }} />
        <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,235,170,0.5)' }}>
          24/7 Support · 18+ Only
        </span>
      </div>
    </div>
  );
}