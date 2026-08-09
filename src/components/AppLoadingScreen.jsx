import React from 'react';

// Branded premium loading screen shown AFTER the static splash image, while
// the app preloads assets and auth in the background. Same luxe visual language
// as the game loading screens: pulsing radial gold glow, double spinning gold
// rings around the brand logo medallion, "Made By Golden Bounty" wordmark with
// diamond flourishes, and a shimmering progress bar driven by real preload
// progress. Pure loading indicator — no buttons, no navigation.

const LOGO_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e0ebe2f88_InShot_20260722_150739877.jpg';

export default function AppLoadingScreen({ progress = 0 }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #0a0805 0%, #1a1208 50%, #0a0805 100%)' }}
    >
      {/* App background image */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.35,
        }}
      />

      {/* Pulsing center radial gold glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,200,80,0.10) 0%, rgba(255,180,60,0.04) 40%, transparent 70%)',
          animation: 'loaderGlow 3s ease-in-out infinite',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%)' }} />

      {/* Logo with double spinning gold rings */}
      <div className="relative mb-8" style={{ width: '120px', height: '120px' }}>
        {/* Outer ring — slow gold arc spin */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            animationDuration: '3.5s',
            border: '2px solid transparent',
            borderTopColor: 'rgba(255,215,0,0.95)',
            borderRightColor: 'rgba(255,215,0,0.45)',
            boxShadow: '0 0 28px rgba(255,200,80,0.5), inset 0 0 14px rgba(255,200,80,0.12)',
          }}
        />
        {/* Inner ring — fast dashed counter-spin */}
        <div
          className="absolute inset-[10px] rounded-full animate-spin"
          style={{
            animationDuration: '2s',
            animationDirection: 'reverse',
            border: '1.5px dashed rgba(255,235,150,0.55)',
          }}
        />
        {/* Gold-framed logo medallion */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: '64px',
              height: '64px',
              border: '2px solid rgba(214,178,98,0.9)',
              boxShadow: '0 0 22px rgba(255,200,80,0.8), inset 0 0 10px rgba(255,210,120,0.3)',
              background: 'radial-gradient(circle, rgba(26,18,9,0.95), rgba(10,8,5,0.98))',
              animation: 'saGlowPulse 1.6s ease-in-out infinite',
            }}
          >
            <img
              src={LOGO_URL}
              alt="Golden Bounty"
              className="rounded-full object-cover"
              style={{ width: '48px', height: '48px', boxShadow: '0 0 8px rgba(255,200,80,0.5)' }}
            />
          </div>
        </div>
      </div>

      {/* Made By Golden Bounty — bold gold-gradient wordmark with diamond flourishes */}
      <div className="flex items-center gap-2.5 mb-6" style={{ animation: 'splashFadeIn 600ms ease both' }}>
        <div className="flex items-center gap-1.5">
          <div style={{ width: '28px', height: '1.5px', background: 'linear-gradient(to right, transparent, rgba(190,140,55,0.85))' }} />
          <div style={{ width: '6px', height: '6px', transform: 'rotate(45deg)', background: 'linear-gradient(135deg, #ffd75a, #b8860b)', boxShadow: '0 0 5px rgba(255,200,80,0.6)' }} />
        </div>
        <p
          className="text-sm font-black tracking-[0.32em] uppercase whitespace-nowrap"
          style={{
            fontFamily: 'Rye, Georgia, serif',
            background: 'linear-gradient(to bottom, #fff8d4 0%, #ffd75a 35%, #d4a843 65%, #8b6914 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.95)) drop-shadow(0 0 7px rgba(255,200,80,0.5))',
          }}
        >
          Made By Golden Bounty
        </p>
        <div className="flex items-center gap-1.5">
          <div style={{ width: '6px', height: '6px', transform: 'rotate(45deg)', background: 'linear-gradient(135deg, #ffd75a, #b8860b)', boxShadow: '0 0 5px rgba(255,200,80,0.6)' }} />
          <div style={{ width: '28px', height: '1.5px', background: 'linear-gradient(to left, transparent, rgba(190,140,55,0.85))' }} />
        </div>
      </div>

      {/* Premium progress bar with shimmer */}
      <div
        className="relative w-72 h-2.5 rounded-full overflow-hidden"
        style={{
          background: 'rgba(20,14,7,0.95)',
          border: '1px solid rgba(190,140,55,0.65)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6), 0 0 10px rgba(255,200,80,0.18)',
        }}
      >
        <div
          className="h-full rounded-full relative overflow-hidden transition-[width] duration-200"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(to right, #b8860b 0%, #ffd75a 50%, #fff3c4 100%)',
            boxShadow: '0 0 12px rgba(255,210,100,0.65)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
              animation: 'loaderShimmer 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <p
        className="mt-3 text-xs tracking-[0.3em] uppercase tabular-nums"
        style={{ color: 'rgba(255,220,150,0.65)', fontFamily: 'Rye, Georgia, serif' }}
      >
        {pct}% Loading
      </p>
    </div>
  );
}